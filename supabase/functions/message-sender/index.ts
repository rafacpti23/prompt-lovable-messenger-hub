import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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

    // Obter credenciais da Evolution API das variáveis de ambiente
    const EVOLUTION_API_URL = Deno.env.get('EVOLUTION_API_URL') || 'https://api.ramelseg.com.br';
    const EVOLUTION_API_KEY = Deno.env.get('EVOLUTION_API_KEY') || 'd86920ba398e31464c46401214779885';

    console.log("Using Evolution API URL:", EVOLUTION_API_URL);
    console.log("API Key configured:", EVOLUTION_API_KEY ? "Yes" : "No");

    const MESSAGES_PER_RUN = 5; // Processar 5 mensagens por vez

    // 1. Buscar mensagens pendentes usando a nova função simplificada
    console.log("Fetching pending messages...");
    const { data: pendingMessages, error: fetchError } = await supabaseClient.rpc(
      'get_pending_messages',
      { limit_count: MESSAGES_PER_RUN }
    );

    if (fetchError) {
      console.error("Error fetching pending messages:", fetchError);
      throw new Error(`Error fetching pending messages: ${fetchError.message}`);
    }

    if (!pendingMessages || pendingMessages.length === 0) {
      console.log("No pending messages to process.");
      return new Response(JSON.stringify({ message: 'Nenhuma mensagem na fila para processar.' }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    console.log(`Found ${pendingMessages.length} pending messages to process.`);

    let sentCount = 0;
    let failedCount = 0;
    
    for (const msg of pendingMessages) {
      console.log(`Processing message ID: ${msg.message_id}, Phone: ${msg.phone}`);
      
      // Marcar a mensagem como "sending" para evitar processamento duplicado
      await supabaseClient
        .from('scheduled_messages')
        .update({ status: 'sending' })
        .eq('id', msg.message_id);
      
      let finalStatus = 'failed';
      let responseData: any = { error: 'Unknown error' };

      try {
        // Verificar créditos do usuário
        console.log(`Decrementing credits for user: ${msg.user_id}`);
        const { data: canSend, error: rpcError } = await supabaseClient.rpc(
          'decrement_user_credits', 
          { user_id_param: msg.user_id }
        );

        if (rpcError) throw new Error(`Erro ao decrementar créditos: ${rpcError.message}`);
        if (!canSend) throw new Error('Créditos insuficientes.');
        console.log("Credits decremented successfully.");

        // Personalizar a mensagem
        const { data: contactData } = await supabaseClient
          .from('contacts')
          .select('name')
          .eq('id', msg.contact_id)
          .single();
        
        const contactName = contactData?.name || '';
        const personalizedMessage = msg.message
          .replace(/{{nome}}/g, contactName)
          .replace(/{{telefone}}/g, msg.phone || '');

        // Preparar a requisição para a Evolution API
        const headers = { 'Content-Type': 'application/json', 'apikey': EVOLUTION_API_KEY };
        
        let response;
        let url;
        let body;

        if (msg.media_url) {
          url = `${EVOLUTION_API_URL}/message/sendMedia/${msg.instance_name}`;
          body = { 
            number: msg.phone, 
            mediaMessage: { 
              mediaType: msg.media_url.match(/\.(mp4|mov|avi)$/i) ? 'video' : 'image', 
              url: msg.media_url, 
              caption: personalizedMessage 
            } 
          };
          console.log(`Sending media message to ${url}`);
          response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
        } else {
          url = `${EVOLUTION_API_URL}/message/sendText/${msg.instance_name}`;
          body = { number: msg.phone, text: personalizedMessage };
          console.log(`Sending text message to ${url}`);
          response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
        }

        responseData = await response.json();
        console.log("Evolution API response:", responseData);
        
        if (!response.ok) throw new Error(responseData.message || `HTTP error! status: ${response.status}`);

        finalStatus = 'sent';
        sentCount++;

      } catch (e: any) {
        console.error(`Error processing message ${msg.message_id}:`, e.message);
        responseData = { error: e.message };
        failedCount++;
      }

      // Atualizar o status final da mensagem
      console.log(`Updating message ${msg.message_id} to status: ${finalStatus}`);
      await supabaseClient
        .from('scheduled_messages')
        .update({ 
          status: finalStatus, 
          sent_at: finalStatus === 'sent' ? new Date().toISOString() : null 
        })
        .eq('id', msg.message_id);

      // Registrar no log
      console.log(`Logging message ${msg.message_id} with status: ${finalStatus}`);
      await supabaseClient.from('messages_log').insert({
          campaign_id: msg.campaign_id, 
          contact_id: msg.contact_id, 
          phone: msg.phone,
          message: msg.message, 
          status: finalStatus, 
          response: responseData,
          scheduled_for: msg.scheduled_for, 
          user_id: msg.user_id
      });

      // Pausa entre mensagens
      const pauseDuration = 5; // Padrão de 5 segundos
      if (pauseDuration > 0 && (sentCount + failedCount) < pendingMessages.length) {
        console.log(`Pausing for ${pauseDuration} seconds before next message.`);
        await new Promise(resolve => setTimeout(resolve, pauseDuration * 1000));
      }
    }

    console.log(`Completed processing. Sent: ${sentCount}, Failed: ${failedCount}.`);
    return new Response(JSON.stringify({ 
      message: `${sentCount} mensagens enviadas, ${failedCount} falharam.` 
    }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error: any) {
    console.error('Erro fatal no message-sender:', error.message);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
})