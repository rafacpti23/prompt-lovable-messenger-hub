import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const EVOLUTION_API_URL = Deno.env.get('EVOLUTION_API_URL')
const EVOLUTION_API_KEY = Deno.env.get('EVOLUTION_API_KEY')
const MESSAGES_PER_RUN = 5 // Quantas mensagens enviar por execução para não estourar o tempo

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
      throw new Error('Configuração da Evolution API não encontrada')
    }

    // 1. Buscar um lote de mensagens pendentes da fila
    const { data: messages, error: fetchError } = await supabaseClient
      .from('scheduled_messages')
      .select(`
        *,
        contact:contacts(name),
        campaign:campaigns(
          user_id,
          instance_id,
          pause_between_messages,
          instance:instances(instance_name)
        )
      `)
      .eq('status', 'pending')
      .limit(MESSAGES_PER_RUN)

    if (fetchError) throw new Error(`Erro ao buscar mensagens: ${fetchError.message}`)
    if (!messages || messages.length === 0) {
      return new Response(JSON.stringify({ message: 'Nenhuma mensagem pendente para enviar.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    let sentCount = 0
    // 2. Enviar cada mensagem do lote
    for (const msg of messages) {
      const { campaign } = msg
      if (!campaign || !campaign.instance) {
        await supabaseClient.from('scheduled_messages').update({ status: 'failed', response: { error: 'Campanha ou instância associada não encontrada.' } }).eq('id', msg.id)
        continue
      }

      try {
        // Verificar créditos do usuário antes de cada envio
        const { data: canSend, error: rpcError } = await supabaseClient.rpc('decrement_user_credits', { user_id_param: campaign.user_id })
        if (rpcError || !canSend) {
          await supabaseClient.from('scheduled_messages').update({ status: 'failed', response: { error: 'Créditos insuficientes ou erro ao decrementar.' } }).eq('id', msg.id)
          continue // Pula para a próxima mensagem
        }

        // Substituir variáveis
        const personalizedMessage = msg.message
          .replace(/{{nome}}/g, msg.contact?.name || '')
          .replace(/{{telefone}}/g, msg.phone || '')

        let responseData;
        
        // Enviar mídia ou texto
        if (msg.media_url) {
            const mediaType = msg.media_url.match(/\.(mp4|mov|avi)$/i) ? 'video' : 'image';
            const url = `${EVOLUTION_API_URL}/message/sendMedia/${campaign.instance.instance_name}`;
            const body = {
                number: msg.phone,
                mediaMessage: {
                    mediaType: mediaType,
                    url: msg.media_url,
                    caption: personalizedMessage
                }
            };
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'apikey': EVOLUTION_API_KEY },
                body: JSON.stringify(body)
            });
            responseData = await response.json();
            if (!response.ok) throw new Error(responseData.message || 'Erro na API Evolution ao enviar mídia');
        } else {
            const url = `${EVOLUTION_API_URL}/message/sendText/${campaign.instance.instance_name}`;
            const body = {
                number: msg.phone,
                textMessage: { text: personalizedMessage }
            };
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'apikey': EVOLUTION_API_KEY },
                body: JSON.stringify(body)
            });
            responseData = await response.json();
            if (!response.ok) throw new Error(responseData.message || 'Erro na API Evolution ao enviar texto');
        }

        // Atualizar status da mensagem para 'sent'
        await supabaseClient.from('scheduled_messages').update({ status: 'sent', sent_at: new Date().toISOString(), response: responseData }).eq('id', msg.id)
        sentCount++

      } catch (e) {
        // Se falhar, atualiza o status para 'failed'
        await supabaseClient.from('scheduled_messages').update({ status: 'failed', response: { error: e.message } }).eq('id', msg.id)
      }

      // Pausa entre mensagens, se configurado
      if (campaign.pause_between_messages > 0) {
        await new Promise(resolve => setTimeout(resolve, campaign.pause_between_messages * 1000))
      }
    }

    return new Response(JSON.stringify({ message: `${sentCount} de ${messages.length} mensagens processadas.` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Erro no message-sender:', error)
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})