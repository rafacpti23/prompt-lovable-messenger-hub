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
    console.log("Starting queue-worker function...");
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Configurações da Evolution API
    const EVOLUTION_API_URL = Deno.env.get('EVOLUTION_API_URL') || 'https://api.ramelseg.com.br'
    const EVOLUTION_API_KEY = Deno.env.get('EVOLUTION_API_KEY') || 'd86920ba398e31464c46401214779885'

    if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) {
      throw new Error('As credenciais da Evolution API não estão configuradas')
    }

    // Configurações do worker
    const MAX_MESSAGES_PER_RUN = 50 // Limite máximo por execução para evitar timeouts
    const MAX_PROCESSING_TIME = 180000 // 3 minutos de tempo máximo de processamento
    const startTime = Date.now()
    let totalProcessed = 0

    console.log(`Iniciando processamento com limite de ${MAX_MESSAGES_PER_RUN} mensagens ou ${MAX_PROCESSING_TIME/1000} segundos...`)

    // Loop contínuo enquanto houver mensagens e tempo
    while (totalProcessed < MAX_MESSAGES_PER_RUN && (Date.now() - startTime) < MAX_PROCESSING_TIME) {
      // 1. Ler mensagens da fila pgmq
      console.log("Lendo mensagens da fila...")
      const { data: messages, error: readError } = await supabaseClient.rpc('read_from_message_queue', {
        p_count: 10 // Pega 10 mensagens de cada vez
      })

      if (readError) {
        console.error("Erro ao ler da fila:", readError)
        throw new Error(`Failed to read from message queue: ${readError.message}`)
      }

      if (!messages || messages.length === 0) {
        console.log("Nenhuma mensagem na fila para processar. Encerrando.")
        break // Sai do loop se não houver mais mensagens
      }

      console.log(`Processando ${messages.length} mensagens da fila...`)

      // 2. Processar cada mensagem
      for (const msg of messages) {
        // Verificar limite de tempo
        if (Date.now() - startTime > MAX_PROCESSING_TIME) {
          console.log("Tempo máximo de processamento atingido. Encerrando.")
          break
        }

        // Verificar limite de mensagens
        if (totalProcessed >= MAX_MESSAGES_PER_RUN) {
          console.log(`Limite de ${MAX_MESSAGES_PER_RUN} mensagens atingido. Encerrando.`)
          break
        }

        console.log(`Processando mensagem ID: ${msg.msg_id}, Payload:`, msg.payload)
        
        // Verificar se a mensagem está agendada para o futuro
        const scheduledFor = new Date(msg.payload.scheduled_for)
        const now = new Date()
        
        if (now < scheduledFor) {
          console.log(`Mensagem agendada para ${scheduledFor} pulada (ainda não é hora)`)
          continue // Pula esta mensagem, será processada mais tarde
        }

        await processMessage(msg.payload, msg.msg_id, supabaseClient, EVOLUTION_API_URL, EVOLUTION_API_KEY)
        totalProcessed++
      }
    }

    console.log(`Processamento concluído. Total de mensagens processadas: ${totalProcessed}`)
    return new Response(JSON.stringify({ message: `Processed ${totalProcessed} messages.` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error: any) {
    console.error('Erro no queue-worker:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

async function processMessage(payload: any, msg_id: bigint, supabase: any, apiUrl: string, apiKey: string) {
  const { campaign_id, contact_id, user_id, instance_id } = payload
  console.log(`Processando mensagem para campanha ${campaign_id}, contato ${contact_id}`)

  let finalStatus = 'failed'
  let responseData: any = { error: 'Unknown error' }
  let campaignData: any, contactData: any

  try {
    // 1. Obter detalhes
    const { data: cData, error: cError } = await supabase
      .from('campaigns')
      .select('message, media_url, interval_config, sending_method')
      .eq('id', campaign_id)
      .single()
    
    if (cError) throw new Error(`Campaign not found: ${cError.message}`)
    campaignData = cData

    const { data: ctData, error: ctError } = await supabase
      .from('contacts')
      .select('name, phone')
      .eq('id', contact_id)
      .single()
    
    if (ctError) throw new Error(`Contact not found: ${ctError.message}`)
    contactData = ctData
    
    const { data: iData, error: iError } = await supabase
      .from('instances')
      .select('instance_name')
      .eq('id', instance_id)
      .single()
    
    if (iError) throw new Error(`Instance not found: ${iError.message}`)

    // 2. Calcular e aplicar atraso (se for método avançado)
    let delaySeconds = 5 // Padrão
    if (campaignData.sending_method === 'queue' && campaignData.interval_config) {
      const intervals = campaignData.interval_config
      const randomInterval = intervals[Math.floor(Math.random() * intervals.length)]
      delaySeconds = Math.random() * (randomInterval.max - randomInterval.min) + randomInterval.min
      console.log(`Atraso aleatório: ${delaySeconds.toFixed(2)} segundos`)
    }
    
    console.log(`Aguardando ${delaySeconds.toFixed(2)} segundos...`)
    await new Promise(resolve => setTimeout(resolve, delaySeconds * 1000))

    // 3. Decrementar créditos
    const { data: canSend, error: rpcError } = await supabase.rpc('decrement_user_credits', {
      user_id_param: user_id
    })
    
    if (rpcError || !canSend) throw new Error('Créditos insuficientes ou erro ao decrementar.')

    // 4. Enviar mensagem
    const personalizedMessage = campaignData.message
      .replace(/{{nome}}/g, contactData.name || '')
      .replace(/{{telefone}}/g, contactData.phone || '')
    
    const headers = {
      'Content-Type': 'application/json',
      'apikey': apiKey
    }
    
    let response
    if (campaignData.media_url) {
      const url = `${apiUrl}/message/sendMedia/${iData.instance_name}`
      const body = {
        number: contactData.phone,
        mediaMessage: {
          mediaType: campaignData.media_url.match(/\.(mp4|mov|avi)$/i) ? 'video' : 'image',
          url: campaignData.media_url,
          caption: personalizedMessage
        }
      }
      response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      })
    } else {
      const url = `${apiUrl}/message/sendText/${iData.instance_name}`
      const body = {
        number: contactData.phone,
        text: personalizedMessage
      }
      response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      })
    }

    responseData = await response.json()
    if (!response.ok) throw new Error(responseData.message || `HTTP error! status: ${response.status}`)
    finalStatus = 'sent'

  } catch (e: any) {
    console.error(`Erro ao processar mensagem para contato ${contact_id}:`, e.message)
    responseData = { error: e.message }
  }

  // 5. Registrar no log de mensagens
  await supabase.from('messages_log').insert({
    campaign_id,
    contact_id,
    user_id,
    phone: contactData?.phone,
    message: campaignData?.message,
    status: finalStatus,
    response: responseData,
    sent_at: new Date().toISOString()
  })

  // 6. Confirmar processamento da mensagem na fila
  const { error: ackError } = await supabase.rpc('ack_message', {
    p_msg_id: msg_id
  })
  
  if (ackError) {
    console.error(`Falha ao confirmar mensagem ${msg_id}:`, ackError.message)
  }
}