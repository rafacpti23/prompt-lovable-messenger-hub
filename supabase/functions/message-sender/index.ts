import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const EVOLUTION_API_URL = 'https://api.ramelseg.com.br';
const EVOLUTION_API_KEY = 'd86920ba398e31464c46401214779885';
const MESSAGES_PER_RUN = 10;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
    if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) {
      throw new Error('Configuração da Evolution API não encontrada.');
    }

    let evolutionApiUrl = EVOLUTION_API_URL.endsWith('/') ? EVOLUTION_API_URL.slice(0, -1) : EVOLUTION_API_URL;

    const { data: messages, error: fetchError } = await supabaseClient
      .from('scheduled_messages')
      .select(`
        *,
        contact:contacts(name),
        campaign:campaigns!inner(
          user_id,
          instance_id,
          status,
          pause_between_messages,
          instance:instances(instance_name)
        )
      `)
      .eq('status', 'pending')
      .eq('campaign.status', 'sending')
      .lte('scheduled_for', new Date().toISOString())
      .limit(MESSAGES_PER_RUN);

    if (fetchError) throw new Error(`Erro ao buscar mensagens: ${fetchError.message}`);

    if (!messages || messages.length === 0) {
      await supabaseClient.rpc('update_completed_campaigns');
      return new Response(JSON.stringify({ message: 'Nenhuma mensagem pendente para enviar.' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    let sentCount = 0;
    for (const msg of messages) {
      const { campaign } = msg;
      if (!campaign || !campaign.instance) {
        await supabaseClient.from('scheduled_messages').update({ status: 'failed' }).eq('id', msg.id);
        continue;
      }

      try {
        const { data: canSend, error: rpcError } = await supabaseClient.rpc('decrement_user_credits', { user_id_param: campaign.user_id });
        if (rpcError || !canSend) {
          throw new Error('Créditos insuficientes ou erro ao decrementar.');
        }

        const personalizedMessage = msg.message.replace(/{{nome}}/g, msg.contact?.name || '').replace(/{{telefone}}/g, msg.phone || '');
        const headers = { 'Content-Type': 'application/json', 'apikey': EVOLUTION_API_KEY };
        let response;

        if (msg.media_url) {
          const url = `${evolutionApiUrl}/message/sendMedia/${campaign.instance.instance_name}`;
          const mediaType = msg.media_url.match(/\.(mp4|mov|avi)$/i) ? 'video' : 'image';
          const body = { number: msg.phone, mediaMessage: { mediaType, url: msg.media_url, caption: personalizedMessage } };
          response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
        } else {
          const url = `${evolutionApiUrl}/message/sendText/${campaign.instance.instance_name}`;
          const body = { number: msg.phone, text: personalizedMessage };
          response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
        }

        if (!response.ok) {
          const errorText = await response.text();
          const errorJson = JSON.parse(errorText || '{ "message": "Erro desconhecido" }');
          throw new Error(errorJson.message || `HTTP error! status: ${response.status}`);
        }

        const responseData = await response.json();
        
        // ATUALIZAÇÃO SIMPLES PARA GARANTIR QUE NÃO FALHE
        await supabaseClient.from('scheduled_messages').update({ status: 'sent', sent_at: new Date().toISOString() }).eq('id', msg.id);
        
        // CRIA O LOG SEPARADAMENTE
        await supabaseClient.from('messages_log').insert({
            campaign_id: msg.campaign_id,
            contact_id: msg.contact_id,
            phone: msg.phone,
            message: personalizedMessage,
            status: 'sent',
            response: responseData,
            scheduled_for: msg.scheduled_for
        });

        sentCount++;

      } catch (e) {
        // ATUALIZAÇÃO SIMPLES PARA GARANTIR QUE NÃO FALHE
        await supabaseClient.from('scheduled_messages').update({ status: 'failed' }).eq('id', msg.id);

        // CRIA O LOG DE ERRO SEPARADAMENTE
        await supabaseClient.from('messages_log').insert({
            campaign_id: msg.campaign_id,
            contact_id: msg.contact_id,
            phone: msg.phone,
            message: msg.message,
            status: 'failed',
            response: { error: e.message },
            scheduled_for: msg.scheduled_for
        });
      }

      if (campaign.pause_between_messages > 0) {
        await new Promise(resolve => setTimeout(resolve, campaign.pause_between_messages * 1000));
      }
    }

    await supabaseClient.rpc('update_completed_campaigns');
    return new Response(JSON.stringify({ message: `${sentCount} de ${messages.length} mensagens processadas.` }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Erro no message-sender:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
})