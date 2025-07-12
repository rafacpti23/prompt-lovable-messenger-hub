import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const EVOLUTION_API_URL = 'https://api.ramelseg.com.br';
const EVOLUTION_API_KEY = 'd86920ba398e31464c46401214779885';
const MESSAGES_PER_RUN = 4;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log("Starting message-sender function");
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) {
      throw new Error('Configuração da Evolution API não encontrada.');
    }

    const evolutionApiUrl = EVOLUTION_API_URL.endsWith('/') ? EVOLUTION_API_URL.slice(0, -1) : EVOLUTION_API_URL;
    console.log("Evolution API URL:", evolutionApiUrl);

    // Buscar mensagens pendentes
    const { data: pendingMessages, error: pendingError } = await supabaseClient
      .from('scheduled_messages')
      .select('id, campaign_id')
      .eq('status', 'pending')
      .limit(MESSAGES_PER_RUN);

    if (pendingError) {
      console.error("Error fetching pending messages:", pendingError);
      throw new Error(`Error fetching pending messages: ${pendingError.message}`);
    }

    if (!pendingMessages || pendingMessages.length === 0) {
      console.log("No pending messages found");
      return new Response(JSON.stringify({ message: 'Nenhuma mensagem pendente para enviar.' }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    console.log(`Found ${pendingMessages.length} pending messages`);
    const messageIds = pendingMessages.map(m => m.id);
    const campaignIds = [...new Set(pendingMessages.map(m => m.campaign_id))];

    // Buscar detalhes completos das mensagens
    const { data: messages, error: fetchError } = await supabaseClient
      .from('scheduled_messages')
      .select(`
        id, phone, message, media_url, campaign_id, contact_id, scheduled_for, status,
        contact:contacts(name),
        campaign:campaigns(
          user_id, instance_id, status, pause_between_messages,
          instance:instances(instance_name)
        )
      `)
      .in('id', messageIds);

    if (fetchError) {
      console.error("Error fetching message details:", fetchError);
      throw new Error(`Error fetching message details: ${fetchError.message}`);
    }

    if (!messages || messages.length === 0) {
      console.log("No message details found for the pending messages");
      return new Response(JSON.stringify({ message: 'Detalhes das mensagens não encontrados.' }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    console.log(`Processing ${messages.length} messages`);
    let sentCount = 0;
    let failedCount = 0;
    
    for (const msg of messages) {
      console.log(`Processing message ID: ${msg.id}, Phone: ${msg.phone}`);
      
      const { campaign } = msg;
      let finalStatus = 'failed';
      let responseData: any = { error: 'Unknown error' };

      try {
        if (!campaign || !campaign.instance) {
          console.error("Campaign or instance data missing for message:", msg.id);
          throw new Error('Dados da campanha ou instância ausentes.');
        }

        // Verificar se a campanha ainda está em um estado válido para envio
        if (!['draft', 'scheduled', 'sending'].includes(campaign.status)) {
          console.log(`Campaign ${campaign.id} is not in a valid status for sending: ${campaign.status}`);
          continue;
        }

        console.log(`Decrementing credits for user: ${campaign.user_id}`);
        const { data: canSend, error: rpcError } = await supabaseClient.rpc(
          'decrement_user_credits', 
          { user_id_param: campaign.user_id }
        );

        if (rpcError) {
          console.error("RPC error when decrementing credits:", rpcError);
          throw new Error(`Erro ao decrementar créditos: ${rpcError.message}`);
        }

        if (!canSend) {
          console.error("Not enough credits for user:", campaign.user_id);
          throw new Error('Créditos insuficientes.');
        }

        const personalizedMessage = msg.message
          .replace(/{{nome}}/g, msg.contact?.name || '')
          .replace(/{{telefone}}/g, msg.phone || '');
        
        const headers = { 
          'Content-Type': 'application/json', 
          'apikey': EVOLUTION_API_KEY 
        };
        
        let response;
        console.log(`Sending message to ${msg.phone} via instance ${campaign.instance.instance_name}`);

        if (msg.media_url) {
          const url = `${evolutionApiUrl}/message/sendMedia/${campaign.instance.instance_name}`;
          const mediaType = msg.media_url.match(/\.(mp4|mov|avi)$/i) ? 'video' : 'image';
          const body = { 
            number: msg.phone, 
            mediaMessage: { 
              mediaType, 
              url: msg.media_url, 
              caption: personalizedMessage 
            } 
          };
          
          console.log(`Sending media message to URL: ${url}`);
          response = await fetch(url, { 
            method: 'POST', 
            headers, 
            body: JSON.stringify(body) 
          });
        } else {
          const url = `${evolutionApiUrl}/message/sendText/${campaign.instance.instance_name}`;
          const body = { 
            number: msg.phone, 
            text: personalizedMessage 
          };
          
          console.log(`Sending text message to URL: ${url}`);
          response = await fetch(url, { 
            method: 'POST', 
            headers, 
            body: JSON.stringify(body) 
          });
        }

        console.log(`Response status: ${response.status}`);
        responseData = await response.json();
        
        if (!response.ok) {
          console.error("Error response from Evolution API:", responseData);
          throw new Error(responseData.message || `HTTP error! status: ${response.status}`);
        }

        console.log("Message sent successfully");
        finalStatus = 'sent';
        sentCount++;

      } catch (e) {
        console.error(`Error sending message ${msg.id}:`, e);
        responseData = { error: e.message };
        finalStatus = 'failed';
        failedCount++;
      }

      // Atualizar status da mensagem
      console.log(`Updating message ${msg.id} status to: ${finalStatus}`);
      const updateData: any = { 
        status: finalStatus,
        sent_at: finalStatus === 'sent' ? new Date().toISOString() : null
      };

      const { error: updateError } = await supabaseClient
        .from('scheduled_messages')
        .update(updateData)
        .eq('id', msg.id);

      if (updateError) {
        console.error(`Error updating message ${msg.id}:`, updateError);
      }

      // Registrar no log de mensagens
      console.log(`Adding message to log`);
      const { error: logError } = await supabaseClient.from('messages_log').insert({
          campaign_id: msg.campaign_id,
          contact_id: msg.contact_id,
          phone: msg.phone,
          message: msg.message,
          status: finalStatus,
          response: responseData,
          scheduled_for: msg.scheduled_for,
          user_id: campaign.user_id
      });

      if (logError) {
        console.error(`Error logging message ${msg.id}:`, logError);
      }

      // Pausa entre mensagens
      const pauseDuration = campaign.pause_between_messages || 5;
      if (pauseDuration > 0 && sentCount + failedCount < messages.length) {
        console.log(`Pausing for ${pauseDuration} seconds before next message`);
        await new Promise(resolve => setTimeout(resolve, pauseDuration * 1000));
      }
    }

    // Verificar se a campanha deve ser marcada como concluída
    for (const campaignId of campaignIds) {
      const { count: pendingCount, error: countError } = await supabaseClient
        .from('scheduled_messages')
        .select('id', { count: 'exact', head: true })
        .eq('campaign_id', campaignId)
        .in('status', ['pending', 'sending']);

      if (countError) {
        console.error(`Error counting pending messages for campaign ${campaignId}:`, countError);
        continue;
      }

      if (pendingCount === 0) {
        console.log(`Marking campaign ${campaignId} as completed`);
        await supabaseClient
          .from('campaigns')
          .update({ status: 'completed' })
          .eq('id', campaignId);
      }
    }

    console.log(`Completed processing. Sent ${sentCount}, Failed ${failedCount} of ${messages.length} messages.`);
    return new Response(
      JSON.stringify({ 
        message: `${sentCount} enviadas, ${failedCount} falharam de ${messages.length} mensagens.`,
        success: true
      }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Erro no message-sender:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false
      }), 
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
})