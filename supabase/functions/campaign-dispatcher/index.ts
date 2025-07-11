import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Função para preparar uma campanha e enfileirar suas mensagens
async function queueCampaignMessages(campaignId: string, supabaseClient: any) {
  // 1. Buscar dados da campanha
  const { data: campaign, error: campaignError } = await supabaseClient
    .from('campaigns')
    .select('*')
    .eq('id', campaignId)
    .single()

  if (campaignError || !campaign) {
    throw new Error(`Campanha ${campaignId} não encontrada.`)
  }

  // 2. Buscar contatos da campanha
  const { data: contacts, error: contactsError } = await supabaseClient
    .from('contacts')
    .select('id, phone')
    .in('id', campaign.contact_ids)

  if (contactsError) throw new Error('Erro ao buscar contatos da campanha.')
  if (!contacts || contacts.length === 0) {
    // Se não há contatos, marca como concluída e sai
    await supabaseClient.from('campaigns').update({ status: 'completed', updated_at: new Date().toISOString() }).eq('id', campaignId)
    return { success: true, message: 'Campanha sem contatos, marcada como concluída.' }
  }

  // 3. Preparar as mensagens para inserção na fila
  const messagesToQueue = contacts.map(contact => ({
    campaign_id: campaign.id,
    contact_id: contact.id,
    phone: contact.phone,
    message: campaign.message,
    scheduled_for: campaign.scheduled_for || new Date().toISOString(),
    status: 'pending'
  }))

  // 4. Inserir todas as mensagens na tabela scheduled_messages
  const { error: insertError } = await supabaseClient
    .from('scheduled_messages')
    .insert(messagesToQueue)

  if (insertError) {
    throw new Error(`Erro ao enfileirar mensagens: ${insertError.message}`)
  }

  // 5. Atualizar o status da campanha para 'active' (ou 'sending')
  await supabaseClient
    .from('campaigns')
    .update({ status: 'active', updated_at: new Date().toISOString() })
    .eq('id', campaignId)

  return { success: true, message: `${contacts.length} mensagens enfileiradas para a campanha ${campaignId}.` }
}


serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Esta função agora só busca campanhas agendadas e as enfileira.
    const { data: scheduledCampaigns, error } = await supabaseClient
      .from('campaigns')
      .select('id')
      .eq('status', 'scheduled')
      .lte('scheduled_for', new Date().toISOString())

    if (error) throw new Error('Erro ao buscar campanhas agendadas')
    if (!scheduledCampaigns || scheduledCampaigns.length === 0) {
      return new Response(JSON.stringify({ message: 'Nenhuma campanha para preparar agora.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const results = []
    for (const campaign of scheduledCampaigns) {
      try {
        const result = await queueCampaignMessages(campaign.id, supabaseClient)
        results.push(result)
      } catch (e) {
        console.error(`Erro ao processar campanha ${campaign.id}:`, e.message)
        // Marca a campanha como falha se não conseguir nem enfileirar
        await supabaseClient.from('campaigns').update({ status: 'failed' }).eq('id', campaign.id)
        results.push({ success: false, campaignId: campaign.id, error: e.message })
      }
    }

    return new Response(JSON.stringify({ message: 'Preparação de campanhas concluída.', results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Erro no campaign-dispatcher:', error)
    return new Response(JSON.stringify({ error: error.message, success: false }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})