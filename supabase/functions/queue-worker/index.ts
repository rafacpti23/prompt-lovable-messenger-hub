import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { Pool } from "https://deno.land/x/postgres@v0.17.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// A função principal agora é um listener de longa duração
async function listenToQueue() {
  console.log("Starting queue worker...");

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  const EVOLUTION_API_URL = Deno.env.get('EVOLUTION_API_URL') || 'https://api.ramelseg.com.br';
  const EVOLUTION_API_KEY = Deno.env.get('EVOLUTION_API_KEY') || 'd86920ba398e31464c46401214779885';

  // Usar pg_mq diretamente com o pool de conexão para listening
  const databaseUrl = Deno.env.get('SUPABASE_DB_URL')!;
  const pool = new Pool(databaseUrl, 3, true);

  while (true) {
    try {
      const connection = await pool.connect();
      
      // Escuta por notificações de novas mensagens na fila
      await connection.queryObject`LISTEN message_queue_new_message`;

      for await (const _ of connection.notifications) {
        // Quando uma notificação chega, processa as mensagens disponíveis
        while (true) {
          const messageResult = await connection.queryObject`SELECT * FROM mq.read('message_queue', 10, 1) LIMIT 1`;
          const message = messageResult.rows[0] as any;

          if (!message) {
            break; // Sai do loop de processamento se não houver mais mensagens
          }

          // Processa a mensagem
          await processMessage(message.payload, supabaseClient, EVOLUTION_API_URL, EVOLUTION_API_KEY);

          // Confirma o recebimento da mensagem
          await connection.queryObject`SELECT mq.ack(${message.message_id}::BIGINT)`;
        }
      }
      
      await connection.release();

    } catch (err) {
      console.error("Error in queue listener:", err);
      // Espera um pouco antes de tentar reconectar
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
}

async function processMessage(payload: any, supabase: any, apiUrl: string, apiKey: string) {
    const { campaign_id, contact_id, user_id, instance_id } = payload;
    console.log(`Processing message for campaign ${campaign_id}, contact ${contact_id}`);

    let finalStatus = 'failed';
    let responseData: any = { error: 'Unknown error' };

    try {
        // 1. Buscar detalhes da campanha e do contato
        const { data: campaignData, error: campaignError } = await supabase
            .from('campaigns')
            .select('message, media_url, interval_config')
            .eq('id', campaign_id)
            .single();
        if (campaignError) throw new Error(`Campaign not found: ${campaignError.message}`);

        const { data: contactData, error: contactError } = await supabase
            .from('contacts')
            .select('name, phone')
            .eq('id', contact_id)
            .single();
        if (contactError) throw new Error(`Contact not found: ${contactError.message}`);
        
        const { data: instanceData, error: instanceError } = await supabase
            .from('instances')
            .select('instance_name')
            .eq('id', instance_id)
            .single();
        if (instanceError) throw new Error(`Instance not found: ${instanceError.message}`);

        // 2. Calcular e aplicar o atraso aleatório
        const intervals = campaignData.interval_config || [{ min: 3, max: 8 }];
        const randomInterval = intervals[Math.floor(Math.random() * intervals.length)];
        const delay = Math.random() * (randomInterval.max - randomInterval.min) + randomInterval.min;
        console.log(`Waiting for ${delay.toFixed(2)} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delay * 1000));

        // 3. Verificar créditos e decrementar
        const { data: canSend, error: rpcError } = await supabase.rpc('decrement_user_credits', { user_id_param: user_id });
        if (rpcError || !canSend) throw new Error('Créditos insuficientes ou erro ao decrementar.');

        // 4. Personalizar e enviar a mensagem
        const personalizedMessage = campaignData.message
            .replace(/{{nome}}/g, contactData.name || '')
            .replace(/{{telefone}}/g, contactData.phone || '');

        const headers = { 'Content-Type': 'application/json', 'apikey': apiKey };
        let response;
        if (campaignData.media_url) {
            const url = `${apiUrl}/message/sendMedia/${instanceData.instance_name}`;
            const body = { number: contactData.phone, mediaMessage: { mediaType: campaignData.media_url.match(/\.(mp4|mov|avi)$/i) ? 'video' : 'image', url: campaignData.media_url, caption: personalizedMessage } };
            response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
        } else {
            const url = `${apiUrl}/message/sendText/${instanceData.instance_name}`;
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
        campaign_id,
        contact_id,
        user_id,
        phone: payload.phone,
        message: payload.message,
        status: finalStatus,
        response: responseData,
        sent_at: new Date().toISOString()
    });
}


// Inicia o listener quando a função é implantada
listenToQueue();

// A função serve também responde a requisições HTTP para manter o worker "vivo"
serve(async (_req) => {
  return new Response(
    JSON.stringify({ message: "Queue worker is active and listening." }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  )
})