import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const EVOLUTION_API_URL = 'https://api.ramelseg.com.br';
const EVOLUTION_API_KEY = 'd86920ba398e31464c46401214779885';
const MESSAGES_PER_RUN = 5; // Processar 5 mensagens por vez

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

    // 1. Travar mensagens e obter seus IDs de forma atômica
    const { data: lockedMessages, error: lockError } = await supabaseClient.rpc(
      'lock_and_get_pending_message_ids',
      { limit_count: MESSAGES_PER_RUN }
    );

    if (lockError) {
      console.error("Error locking messages:", lockError);
      throw new Error(`Error locking messages: ${lockError.message}`);
    }

    if (!lockedMessages || lockedMessages.length === 0) {
      console.log("No pending messages to process.");
      return new Response(JSON.stringify({ message: 'Nenhuma mensagem na fila para processar.' }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const messageIds = lockedMessages.map((m: { id: string }) => m.id);
    console.log(`Locked ${messageIds.length} messages for processing:`, messageIds);

    // 2. Buscar detalhes completos das mensagens já travadas
    const { data: messages, error: fetchError } = await supabaseClient
      .from('scheduled_messages')
      .select(`
        id, phone, message, media_url, campaign_id, contact_id,
        contact:contacts(name),
        campaign:campaigns(
          user_id, instance_id, status, pause_between_messages,
          instance:instances(instance_name)
        )
      `)
      .in('id', messageIds);

    if (fetchError) {
      console.error("Error fetching message details:", fetchError);
      throw new Error(`Error fetching details for locked messages: ${fetchError.message}`);
    }

    let sentCount = 0;
    let failedCount = 0;
    
    for (const msg of messages) {
      console.log(`Processing message ID: ${msg.id}, Phone: ${msg.phone}`);
      
      const { campaign } = msg;
      let finalStatus = 'failed';
      let responseData: any = { error: 'Unknown error' };

      try {
        if (!campaign || !campaign.instance) {
          throw new Error('Dados da campanha ou instância ausentes.');
        }

        const { data: canSend, error: rpcError } = await supabaseClient.rpc(
          'decrement_user_credits', 
          { user_id_param: campaign.user_id }
        );

        if (rpcError) throw new Error(`Erro ao decrementar créditos: ${rpcError.message}`);
        if (!canSend) throw new Error('Créditos insuficientes.');

        const personalizedMessage = msg.message.replace(/{{nome}}/g, msg.contact?.name || '').replace(/{{telefone}}/g, msg.phone || '');
        const headers = { 'Content-Type': 'application/json', 'apikey': EVOLUTION_API_KEY };
        
        let response;
        if (msg.media_url) {
          const url = `${EVOLUTION_API_URL}/message/sendMedia/${campaign.instance.instance_name}`;
          const body = { number: msg.phone, mediaMessage: { mediaType: msg.media_url.match(/\.(mp4|mov|avi)$/i) ? 'video' : 'image', url: msg.media_url, caption: personalizedMessage } };
          response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
        } else {
          const url = `${EVOLUTION_API_URL}/message/sendText/${campaign.instance.instance_name}`;
          const body = { number: msg.phone, text: personalizedMessage };
          response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
        }

        responseData = await response.json();
        if (!response.ok) throw new Error(responseData.message || `HTTP error! status: ${response.status}`);

        finalStatus = 'sent';
        sentCount++;

      } catch (e) {
        console.error(`Error sending message ${msg.id}:`, e);
        responseData = { error: e.message };
        failedCount++;
      }

      // 3. Atualizar o status final da mensagem (de 'sending' para 'sent' ou 'failed')
      await supabaseClient
        .from('scheduled_messages')
        .update({ status: finalStatus, sent_at: finalStatus === 'sent' ? new Date().toISOString() : null })
        .eq('id', msg.id);

      // 4. Registrar no log
      await supabaseClient.from('messages_log').insert({
          campaign_id: msg.campaign_id, contact_id: msg.contact_id, phone: msg.phone,
          message: msg.message, status: finalStatus, response: responseData,
          scheduled_for: msg.scheduled_for, user_id: campaign.user_id
      });

      const pauseDuration = campaign.pause_between_messages || 5;
      if (pauseDuration > 0 && (sentCount + failedCount) < messages.length) {
        await new Promise(resolve => setTimeout(resolve, pauseDuration * 1000));
      }
    }

    console.log(`Completed processing. Sent: ${sentCount}, Failed: ${failedCount}.`);
    return new Response(JSON.stringify({ message: `${sentCount} enviadas, ${failedCount} falharam.` }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error) {
    console.error('Erro fatal no message-sender:', error);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
})