import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting queue-worker function...");
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Configurações da Evolution API
    const EVOLUTION_API_URL = Deno.env.get('EVOLUTION_API_URL') || 'https://api.ramelseg.com.br';
    const EVOLUTION_API_KEY = Deno.env.get('EVOLUTION_API_KEY') || 'd86920ba398e31464c46401214779885';

    if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) {
      throw new Error('As credenciais da Evolution API não estão configuradas');
    }

    // Configurações do worker
    const MAX_MESSAGES_PER_RUN = 50; // Limite máximo por execução
    const MAX_PROCESSING_TIME = 180000; // 3 minutos de tempo máximo
    const startTime = Date.now();
    let totalProcessed = 0;

    console.log(`Iniciando processamento com limite de ${MAX_MESSAGES_PER_RUN} mensagens ou ${MAX_PROCESSING_TIME/1000} segundos...`);

    // Loop contínuo enquanto houver mensagens e tempo
    while (totalProcessed < MAX_MESSAGES_PER_RUN && (Date.now() - startTime) < MAX_PROCESSING_TIME) {
      // 1. Ler mensagens pendentes usando get_pending_messages
      console.log("Lendo mensagens pendentes com get_pending_messages...");
      const { data: messages, error: readError } = await supabaseClient.rpc('get_pending_messages', {
        limit_count: 10 // Pega 10 mensagens de cada vez
      });

      if (readError) {
        console.error("Erro ao ler mensagens pendentes:", readError);
        throw new Error(`Failed to read pending messages: ${readError.message}`);
      }

      if (!messages || messages.length === 0) {
        console.log("Nenhuma mensagem pendente para processar. Encerrando.");
        break; // Sai do loop se não houver mais mensagens
      }

      console.log(`Processando ${messages.length} mensagens pendentes...`);

      // 2. Processar cada mensagem
      for (const msg of messages) {
        // Verificar limite de tempo
        if (Date.now() - startTime > MAX_PROCESSING_TIME) {
          console.log("Tempo máximo de processamento atingido. Encerrando.");
          break;
        }

        // Verificar limite de mensagens
        if (totalProcessed >= MAX_MESSAGES_PER_RUN) {
          console.log(`Limite de ${MAX_MESSAGES_PER_RUN} mensagens atingido. Encerrando.`);
          break;
        }

        console.log(`Processando mensagem ID: ${msg.message_id}, Telefone: ${msg.phone}`);
        
        await processMessage(msg, supabaseClient, EVOLUTION_API_URL, EVOLUTION_API_KEY);
        totalProcessed++;
      }
    }

    console.log(`Processamento concluído. Total de mensagens processadas: ${totalProcessed}`);
    return new Response(JSON.stringify({ message: `Processed ${totalProcessed} messages.` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Erro no queue-worker:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function processMessage(msg: any, supabase: any, apiUrl: string, apiKey: string) {
  const { message_id, campaign_id, contact_id, user_id, phone, message, media_url, instance_name } = msg;
  console.log(`Processando mensagem para campanha ${campaign_id}, contato ${contact_id}`);

  let finalStatus = 'failed';
  let responseData: any = { error: 'Unknown error' };
  let contactName: string | null = null;

  try {
    // 1. Obter nome do contato para personalização
    const { data: contactData, error: contactError } = await supabase
      .from('contacts')
      .select('name')
      .eq('id', contact_id)
      .single();
    
    if (contactError) console.warn(`Could not fetch contact name for ${contact_id}: ${contactError.message}`);
    contactName = contactData?.name || null;

    // 2. Decrementar créditos
    const { data: canSend, error: rpcError } = await supabase.rpc('decrement_user_credits', {
      user_id_param: user_id
    });
    
    if (rpcError || !canSend) throw new Error('Créditos insuficientes ou erro ao decrementar.');

    // 3. Personalizar e enviar mensagem
    const personalizedMessage = message
      .replace(/{{nome}}/g, contactName || '')
      .replace(/{{telefone}}/g, phone || '');
    
    const headers = {
      'Content-Type': 'application/json',
      'apikey': apiKey
    };
    
    let response;
    if (media_url) {
      const url = `${apiUrl}/message/sendMedia/${instance_name}`;
      const body = {
        number: phone,
        mediaMessage: {
          mediaType: media_url.match(/\.(mp4|mov|avi)$/i) ? 'video' : 'image',
          url: media_url,
          caption: personalizedMessage
        }
      };
      response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      });
    } else {
      const url = `${apiUrl}/message/sendText/${instance_name}`;
      const body = {
        number: phone,
        text: personalizedMessage
      };
      response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      });
    }

    responseData = await response.json();
    if (!response.ok) throw new Error(responseData.message || `HTTP error! status: ${response.status}`);
    finalStatus = 'sent';

  } catch (e: any) {
    console.error(`Erro ao processar mensagem ${message_id} para contato ${contact_id}:`, e.message);
    responseData = { error: e.message };
  }

  // 4. Atualizar o status final da mensagem agendada
  await supabase
    .from('scheduled_messages')
    .update({ 
      status: finalStatus, 
      sent_at: new Date().toISOString() 
    })
    .eq('id', message_id);

  // 5. Registrar no log de mensagens
  await supabase.from('messages_log').insert({
    campaign_id,
    contact_id,
    user_id,
    phone: phone,
    message: message,
    status: finalStatus,
    response: responseData,
    scheduled_for: msg.scheduled_for, 
    sent_at: new Date().toISOString()
  });
}