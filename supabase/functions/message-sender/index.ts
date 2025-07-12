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

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
    if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) {
      throw new Error('Configuração da Evolution API não encontrada.');
    }

    const evolutionApiUrl = EVOLUTION_API_URL.endsWith('/') ? EVOLUTION_API_URL.slice(0, -1) : EVOLUTION_API_URL;

    const { data: lockedMessages, error: lockError } = await supabaseClient
      .rpc('lock_and_get_pending_message_ids', { limit_count: MESSAGES_PER_RUN });

    if (lockError) throw new Error(`Error locking messages: ${lockError.message}`);

    if (!lockedMessages || lockedMessages.length === 0) {
      return new Response(JSON.stringify({ message: 'Nenhuma mensagem pendente para enviar.' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const messageIds = lockedMessages.map(m => m.id);

    const { data: messages, error: fetchError } = await supabaseClient
      .from('scheduled_messages')
      .select(`
        id, phone, message, media_url, campaign_id, contact_id, scheduled_for,
        contact:contacts(name),
        campaign:campaigns!inner(
          user_id, instance_id, status, pause_between_messages,
          instance:instances!inner(instance_name)
        )
      `)
      .in('id', messageIds);

    if (fetchError) throw new Error(`Error fetching locked message details: ${fetchError.message}`);
    if (!messages || messages.length === 0) {
        return new Response(JSON.stringify({ message: 'Mensagens reservadas não encontradas para processamento.' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    let sentCount = 0;
    for (const msg of messages) {
      const { campaign } = msg;
      let finalStatus = 'failed';
      let responseData: any = { error: 'Unknown error' };

      try {
        if (!campaign || !campaign.instance) {
          throw new Error('Dados da campanha ou instância ausentes.');
        }

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

        responseData = await response.json();
        if (!response.ok) {
          throw new Error(responseData.message || `HTTP error! status: ${response.status}`);
        }

        finalStatus = 'sent';
        sentCount++;

      } catch (e) {
        responseData = { error: e.message };
      }

      await supabaseClient
        .from('scheduled_messages')
        .update({ status: finalStatus, sent_at: finalStatus === 'sent' ? new Date().toISOString() : null })
        .eq('id', msg.id);

      await supabaseClient.from('messages_log').insert({
          campaign_id: msg.campaign_id,
          contact_id: msg.contact_id,
          phone: msg.phone,
          message: msg.message,
          status: finalStatus,
          response: responseData,
          scheduled_for: msg.scheduled_for,
          user_id: campaign.user_id
      });

      const pauseDuration = campaign.pause_between_messages || 5;
      if (pauseDuration > 0) {
        await new Promise(resolve => setTimeout(resolve, pauseDuration * 1000));
      }
    }

    return new Response(JSON.stringify({ message: `${sentCount} de ${messages.length} mensagens processadas.` }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Erro no message-sender:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
})