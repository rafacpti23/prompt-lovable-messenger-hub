import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const GROQ_API_KEY = Deno.env.get('groq_api_key')

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    if (!GROQ_API_KEY) {
      throw new Error('A chave da API Groq não está configurada nas variáveis de ambiente do Supabase.')
    }

    const { prompt } = await req.json()
    if (!prompt) {
      throw new Error('O prompt é obrigatório.')
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: 'Você é um especialista em marketing para WhatsApp. Crie mensagens curtas (máximo 3 parágrafos), amigáveis e com emojis, focadas em conversão. A mensagem deve ser persuasiva e clara. Não use hashtags.'
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        model: 'llama3-8b-8192',
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`Erro da API Groq: ${errorData.error.message}`)
    }

    const data = await response.json()
    const message = data.choices[0]?.message?.content || ''

    return new Response(JSON.stringify({ message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Erro na função generate-message:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})