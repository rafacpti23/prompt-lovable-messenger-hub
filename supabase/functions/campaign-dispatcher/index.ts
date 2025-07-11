import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function processCampaign(campaignId: string, supabaseClient: any) {
  // Buscar dados da campanha com instância
  const { data: campaign, error: campaignError } = await supabaseClient
    .from('campaigns')
    .select(`
      *,
      instance:instances(instance_name, user_id)
    `)
    .eq('id', campaignId)
    .single()

  if (campaignError || !campaign) {
    throw new Error(`Campanha ${campaignId} não encontrada`)
  }

  // Verificar se usuário tem créditos suficientes
  const { data: subscription, error: subError } = await supabaseClient
    .from('user_subscriptions')
    .select('credits_remaining, status, expires_at')
    .eq('user_id', campaign.user_id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (subError) console.error('Error fetching subscription:', subError)
  if (!subscription) throw new Error('Nenhuma assinatura ativa encontrada para o usuário')
  if (subscription.credits_remaining <= 0) throw new Error('Créditos insuficientes para envio')
  if (subscription.expires_at && new Date(subscription.expires_at) < new Date()) throw new Error('Assinatura expirada')

  // Buscar contatos da campanha
  const { data: contacts, error: contactsError } = await supabaseClient
    .from('contacts')
    .select('*')
    .in('id', campaign.contact_ids)

  if (contactsError) throw new Error('Erro ao buscar contatos')
  if (!contacts || contacts.length === 0) throw new Error('Nenhum contato encontrado para esta campanha')
  if (subscription.credits_remaining < contacts.length) throw new Error(`Créditos insuficientes. Você tem ${subscription.credits_remaining} créditos, mas precisa de ${contacts.length}.`)

  // Atualizar status da campanha para "sending"
  await supabaseClient.from('campaigns').update({ status: 'sending' }).eq('id', campaignId)

  const evolutionApiUrl = Deno.env.get('EVOLUTION_API_URL')
  const evolutionApiKey = Deno.env.get('EVOLUTION_API_KEY')
  if (!evolutionApiUrl || !evolutionApiKey) throw new Error('Configuração da Evolution API não encontrada')

  let successCount = 0
  let errorCount = 0

  // Enviar mensagens para cada contato
  for (const contact of contacts) {
    try {
      const { data: currentSubscription } = await supabaseClient
        .from('user_subscriptions')
        .select('credits_remaining')
        .eq('user_id', campaign.user_id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!currentSubscription || currentSubscription.credits_remaining <= 0) {
        console.log('Créditos esgotados durante o envio')
        break
      }

      const { data: instance } = await supabaseClient
        .from('instances')
        .select('instance_name')
        .eq('id', campaign.instance_id)
        .single()

      if (!instance) throw new Error('Instância não encontrada')

      // ** Substituir variáveis na mensagem **
      const personalizedMessage = campaign.message
        .replace(/{{nome}}/g, contact.name || '')
        .replace(/{{telefone}}/g, contact.phone || '');

      const url = `${evolutionApiUrl}/message/sendText/${instance.instance_name}`
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': evolutionApiKey },
        body: JSON.stringify({ number: contact.phone, text: personalizedMessage })
      })
      const responseData = await response.json()

      if (response.ok) {
        await supabaseClient.rpc('decrement_user_credits', { user_id_param: campaign.user_id })
        await supabaseClient.from('messages_log').insert({
          campaign_id: campaignId,
          contact_id: contact.id,
          phone: contact.phone,
          message: personalizedMessage, // Salvar mensagem personalizada
          status: 'sent',
          response: responseData,
          sent_at: new Date().toISOString()
        })
        successCount++
      } else {
        throw new Error(responseData.message || 'Erro na API')
      }
    } catch (error) {
      console.error(`Erro ao enviar para ${contact.phone}:`, error)
      await supabaseClient.from('messages_log').insert({
        campaign_id: campaignId,
        contact_id: contact.id,
        phone: contact.phone,
        message: campaign.message, // Salvar mensagem original em caso de erro
        status: 'failed',
        response: { error: error.message },
        sent_at: new Date().toISOString()
      })
      errorCount++
    }

    if (campaign.pause_between_messages > 0) {
      await new Promise(resolve => setTimeout(resolve, campaign.pause_between_messages * 1000))
    }
  }

  // Atualizar status final da campanha
  const finalStatus = errorCount === 0 ? 'sent' : (successCount === 0 ? 'failed' : 'sent')
  await supabaseClient.from('campaigns').update({ status: finalStatus }).eq('id', campaignId)

  return { success: true, successCount, errorCount, message: `Campanha ${campaignId} processada.` }
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

    let body;
    try {
      body = await req.json();
    } catch {
      body = {};
    }
    
    const { campaignId } = body;

    if (campaignId) {
      // Cenário 1: Processar uma campanha específica (chamada manual/imediata)
      const result = await processCampaign(campaignId, supabaseClient);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } else {
      // Cenário 2: Buscar e processar campanhas agendadas (chamada do cron)
      const { data: scheduledCampaigns, error } = await supabaseClient
        .from('campaigns')
        .select('id')
        .eq('status', 'scheduled')
        .lte('scheduled_for', new Date().toISOString());

      if (error) throw new Error('Erro ao buscar campanhas agendadas');
      if (!scheduledCampaigns || scheduledCampaigns.length === 0) {
        return new Response(JSON.stringify({ message: 'Nenhuma campanha agendada para agora.' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const results = [];
      for (const campaign of scheduledCampaigns) {
        try {
          const result = await processCampaign(campaign.id, supabaseClient);
          results.push(result);
        } catch (e) {
          results.push({ success: false, campaignId: campaign.id, error: e.message });
          // Atualizar campanha para 'failed' se houver erro antes do envio
          await supabaseClient.from('campaigns').update({ status: 'failed' }).eq('id', campaign.id);
        }
      }

      return new Response(JSON.stringify({ message: 'Processamento de agendamentos concluído.', results }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    console.error('Erro no campaign-dispatcher:', error)
    return new Response(JSON.stringify({ error: error.message, success: false }), { 
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
})