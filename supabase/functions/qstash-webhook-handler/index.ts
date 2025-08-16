
import { serve } from "https://deno.land/std@0.190.0/http_server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, upstash-signature'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("🎯 QStash Webhook Handler - Processando mensagem...");
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verificar assinatura do QStash (opcional, mas recomendado)
    const signature = req.headers.get('upstash-signature');
    console.log("🔐 QStash Signature:", signature ? "Presente" : "Ausente");

    // Obter payload da mensagem
    const messagePayload = await req.json();
    console.log("📦 Payload recebido:", JSON.stringify(messagePayload, null, 2));

    const {
      campaign_id,
      contact_id,
      user_id,
      instance_name,
      phone,
      message,
      media_url,
      evolution_api_url,
      evolution_api_key,
      scheduled_for
    } = messagePayload;

    let finalStatus = 'failed';
    let responseData: any = { error: 'Unknown error' };

    try {
      // 1. Decrementar créditos do usuário
      console.log(`💳 Decrementando créditos para usuário: ${user_id}`);
      const { data: canSend, error: rpcError } = await supabaseClient.rpc(
        'decrement_user_credits',
        { user_id_param: user_id }
      );

      if (rpcError) throw new Error(`Erro ao decrementar créditos: ${rpcError.message}`);
      if (!canSend) throw new Error('Créditos insuficientes.');
      console.log("✅ Créditos decrementados com sucesso");

      // 2. Obter nome do contato para personalização
      const { data: contactData } = await supabaseClient
        .from('contacts')
        .select('name')
        .eq('id', contact_id)
        .single();

      const contactName = contactData?.name || '';
      const personalizedMessage = message
        .replace(/{{nome}}/g, contactName)
        .replace(/{{telefone}}/g, phone || '');

      // 3. Preparar requisição para Evolution API
      const headers = {
        'Content-Type': 'application/json',
        'apikey': evolution_api_key
      };

      let response;
      let url;
      let body;

      if (media_url) {
        // Enviar mídia
        url = `${evolution_api_url}/message/sendMedia/${instance_name}`;
        body = {
          number: phone,
          mediaMessage: {
            mediaType: media_url.match(/\.(mp4|mov|avi)$/i) ? 'video' : 'image',
            url: media_url,
            caption: personalizedMessage
          }
        };
        console.log(`📸 Enviando mídia para ${phone} via ${url}`);
        response = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(body)
        });
      } else {
        // Enviar texto
        url = `${evolution_api_url}/message/sendText/${instance_name}`;
        body = {
          number: phone,
          text: personalizedMessage
        };
        console.log(`💬 Enviando texto para ${phone} via ${url}`);
        response = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(body)
        });
      }

      responseData = await response.json();
      console.log("📱 Resposta da Evolution API:", responseData);

      if (!response.ok) {
        throw new Error(responseData.message || `HTTP error! status: ${response.status}`);
      }

      finalStatus = 'sent';
      console.log(`✅ Mensagem enviada com sucesso para ${phone}`);

    } catch (e: any) {
      console.error(`❌ Erro ao processar mensagem para ${phone}:`, e.message);
      responseData = { error: e.message };
    }

    // 4. Atualizar log de mensagens
    console.log(`📝 Atualizando log de mensagem - Status: ${finalStatus}`);
    await supabaseClient
      .from('messages_log')
      .update({
        status: finalStatus,
        response: responseData,
        sent_at: finalStatus === 'sent' ? new Date().toISOString() : null
      })
      .eq('campaign_id', campaign_id)
      .eq('contact_id', contact_id)
      .eq('scheduled_for', scheduled_for);

    console.log(`🎉 Processamento concluído - Status: ${finalStatus}`);

    // Resposta para o QStash
    return new Response(JSON.stringify({
      success: finalStatus === 'sent',
      status: finalStatus,
      phone: phone,
      message: finalStatus === 'sent' ? 'Mensagem enviada com sucesso' : 'Falha no envio'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('❌ Erro fatal no QStash webhook handler:', error.message);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
