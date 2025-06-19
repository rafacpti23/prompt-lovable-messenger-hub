
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    const { campaignId } = await req.json()

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
      throw new Error('Campanha não encontrada')
    }

    // Verificar se usuário tem créditos suficientes
    const { data: subscription } = await supabaseClient
      .from('user_subscriptions')
      .select('credits_remaining, status, expires_at')
      .eq('user_id', campaign.instance.user_id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!subscription) {
      throw new Error('Nenhuma assinatura ativa encontrada para o usuário')
    }

    if (subscription.credits_remaining <= 0) {
      throw new Error('Créditos insuficientes para envio')
    }

    if (subscription.expires_at && new Date(subscription.expires_at) < new Date()) {
      throw new Error('Assinatura expirada')
    }

    // Buscar contatos da campanha
    const { data: contacts, error: contactsError } = await supabaseClient
      .from('contacts')
      .select('*')
      .in('id', campaign.contact_ids)

    if (contactsError) {
      throw new Error('Erro ao buscar contatos')
    }

    if (!contacts || contacts.length === 0) {
      throw new Error('Nenhum contato encontrado para esta campanha')
    }

    // Verificar se há créditos suficientes para todos os contatos
    if (subscription.credits_remaining < contacts.length) {
      throw new Error(`Créditos insuficientes. Você tem ${subscription.credits_remaining} créditos, mas precisa de ${contacts.length} para esta campanha.`)
    }

    // Atualizar status da campanha para "sending"
    await supabaseClient
      .from('campaigns')
      .update({ status: 'sending' })
      .eq('id', campaignId)

    const evolutionApiUrl = Deno.env.get('EVOLUTION_API_URL')
    const evolutionApiKey = Deno.env.get('EVOLUTION_API_KEY')

    if (!evolutionApiUrl || !evolutionApiKey) {
      throw new Error('Configuração da Evolution API não encontrada')
    }

    let successCount = 0
    let errorCount = 0

    // Enviar mensagens para cada contato
    for (const contact of contacts) {
      try {
        // Verificar se ainda há créditos antes de cada envio
        const { data: currentSubscription } = await supabaseClient
          .from('user_subscriptions')
          .select('credits_remaining')
          .eq('user_id', campaign.instance.user_id)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (!currentSubscription || currentSubscription.credits_remaining <= 0) {
          console.log('Créditos esgotados durante o envio')
          break
        }

        // Usar o nome da instância na URL
        const url = `${evolutionApiUrl}/message/sendText/${campaign.instance.instance_name}`
        
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': evolutionApiKey
          },
          body: JSON.stringify({
            number: contact.phone,
            text: campaign.message
          })
        })

        const responseData = await response.json()

        if (response.ok) {
          // Decrementar crédito do usuário
          const { error: creditError } = await supabaseClient
            .rpc('decrement_user_credits', { user_id_param: campaign.instance.user_id })

          if (creditError) {
            console.error('Erro ao decrementar créditos:', creditError)
          }

          // Log de sucesso
          await supabaseClient
            .from('messages_log')
            .insert({
              campaign_id: campaignId,
              contact_id: contact.id,
              phone: contact.phone,
              message: campaign.message,
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
        
        // Log de erro
        await supabaseClient
          .from('messages_log')
          .insert({
            campaign_id: campaignId,
            contact_id: contact.id,
            phone: contact.phone,
            message: campaign.message,
            status: 'failed',
            response: { error: error.message },
            sent_at: new Date().toISOString()
          })

        errorCount++
      }

      // Pausar entre mensagens se configurado
      if (campaign.pause_between_messages > 0) {
        await new Promise(resolve => setTimeout(resolve, campaign.pause_between_messages * 1000))
      }
    }

    // Atualizar status final da campanha
    const finalStatus = errorCount === 0 ? 'sent' : (successCount === 0 ? 'failed' : 'sent')
    await supabaseClient
      .from('campaigns')
      .update({ status: finalStatus })
      .eq('id', campaignId)

    return new Response(
      JSON.stringify({
        success: true,
        successCount,
        errorCount,
        message: `Campanha processada. ${successCount} mensagens enviadas, ${errorCount} erros.`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Erro no campaign-dispatcher:', error)
    
    return new Response(
      JSON.stringify({
        error: error.message,
        success: false
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
