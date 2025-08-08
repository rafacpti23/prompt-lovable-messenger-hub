import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MESSAGES_PER_RUN = 5; // Processar até 5 mensagens por invocação

serve(async (_req) => {
  if (_req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log("Starting queue-worker function...");

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const EVOLUTION_API_URL = Deno.env.get('EVOLUTION_API_URL') || 'https://api.ramelseg.com.br';
    const EVOLUTION_API_KEY = Deno.env.get('EVOLUTION_API_KEY') || 'd86920ba398e31464c46401214779885';

    // Ler um lote de mensagens da fila usando a função RPC
    const { data: messages, error: readError } = await supabaseClient.rpc('read_from_message_queue', { 
        p_count: MESSAGES_PER_RUN 
    });

    if (readError) {
      throw new Error(`Failed to read from message queue: ${readError.message}`);
    }

    if (!messages || messages.length === 0) {
      return new Response(JSON.stringify({ message: "No messages in queue to process." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Processing ${messages.length} messages from queue...`);

    for (const msg of messages) {
      await processMessage(msg.payload, msg.msg_id, supabaseClient, EVOLUTION_API_URL, EVOLUTION_API_KEY);
    }

    return new Response(JSON.stringify({ message: `Processed ${messages.length} messages.` }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in queue-worker function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
})

async function processMessage(payload: any, msg_id: bigint, supabase: any, apiUrl: string, apiKey: string) {
    const { campaign_id, contact_id, user_id, instance_id } = payload;
    console.log(`Processing message for campaign ${campaign_id}, contact ${contact_id}`);

    let finalStatus = 'failed';
    let responseData: any = { error: 'Unknown error' };
    let campaignData: any, contactData: any;

    try {
        // 1. Buscar detalhes
        const { data: cData, error: cError } = await supabase.from('campaigns').select('message, media_url, interval_config').eq('id', campaign_id).single();
        if (cError) throw new Error(`Campaign not found: ${cError.message}`);
        campaignData = cData;

        const { data: ctData, error: ctError } = await supabase.from('contacts').select('name, phone').eq('id', contact_id).single();
        if (ctError) throw new Error(`Contact not found: ${ctError.message}`);
        contactData = ctData;
        
        const { data: iData, error: iError } = await supabase.from('instances').select('instance_name').eq('id', instance_id).single();
        if (iError) throw new Error(`Instance not found: ${iError.message}`);

        // 2. Calcular e aplicar atraso
        const intervals = campaignData.interval_config || [{ min: 3, max: 8 }];
        const randomInterval = intervals[Math.floor(Math.random() * intervals.length)];
        const delay = Math.random() * (randomInterval.max - randomInterval.min) + randomInterval.min;
        console.log(`Waiting for ${delay.toFixed(2)} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delay * 1000));

        // 3. Decrementar créditos
        const { data: canSend, error: rpcError } = await supabase.rpc('decrement_user_credits', { user_id_param: user_id });
        if (rpcError || !canSend) throw new Error('Créditos insuficientes ou erro ao decrementar.');

        // 4. Enviar mensagem
        const personalizedMessage = campaignData.message.replace(/{{nome}}/g, contactData.name || '').replace(/{{telefone}}/g, contactData.phone || '');
        const headers = { 'Content-Type': 'application/json', 'apikey': apiKey };
        let response;
        if (campaignData.media_url) {
            const url = `${apiUrl}/message/sendMedia/${iData.instance_name}`;
            const body = { number: contactData.phone, mediaMessage: { mediaType: campaignData.media_url.match(/\.(mp4|mov|avi)$/i) ? 'video' : 'image', url: campaignData.media_url, caption: personalizedMessage } };
            response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
        } else {
            const url = `${apiUrl}/message/sendText/${iData.instance_name}`;
            const body = { number: contactData.phone, text: personalizedMessage };
            response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
        }

        responseData = await response.json();
        if (!response.ok) throw new Error(responseData.message || `HTTP error! status: ${response.status}`);
        finalStatus = 'sent';

    } catch (e: any) {
        console.error(`Error processing message for contact ${contact_id}:`, e.message);
        responseData = { error: e.message };
    }

    // 5. Registrar no log
    await supabase.from('messages_log').insert({
        campaign_id, contact_id, user_id,
        phone: contactData?.phone,
        message: campaignData?.message,
        status: finalStatus,
        response: responseData,
        sent_at: new Date().toISOString()
    });

    // 6. Confirmar processamento da mensagem na fila
    const { error: ackError } = await supabase.rpc('ack_message', { p_msg_id: msg_id });
    if (ackError) {
      console.error(`Failed to acknowledge message ${msg_id}:`, ackError.message);
    }
}