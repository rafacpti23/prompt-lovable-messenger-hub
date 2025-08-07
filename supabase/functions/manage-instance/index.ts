import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Credenciais padrão da Evolution API
const EVOLUTION_API_URL = 'https://api.ramelseg.com.br';
const EVOLUTION_API_KEY = 'd86920ba398e31464c46401214779885';

// Helper to make requests to Evolution API
async function fetchEvolutionAPI(path: string, method: string, body?: object) {
  if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) {
    throw new Error('As credenciais da Evolution API não estão configuradas.')
  }

  const response = await fetch(`${EVOLUTION_API_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'apikey': EVOLUTION_API_KEY,
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: response.statusText }))
    throw new Error(`Erro na API Evolution: ${errorData.message || response.statusText}`)
  }

  return response.json()
}


serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Auth check
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Usuário não autenticado')
    const token = authHeader.replace('Bearer ', '')
    const { data: { user } } = await supabaseClient.auth.getUser(token)
    if (!user) throw new Error('Usuário não autenticado')

    const { action, payload } = await req.json()
    const { instanceName } = payload

    if (!instanceName) {
      throw new Error('O nome da instância é obrigatório.')
    }

    let data;

    switch (action) {
      case 'create':
        data = await fetchEvolutionAPI('/instance/create', 'POST', {
          instanceName,
          integration: 'WHATSAPP-BAILEYS'
        })
        break;
      
      case 'connect':
        data = await fetchEvolutionAPI(`/instance/connect/${instanceName}`, 'GET')
        break;

      case 'qrcode':
        data = await fetchEvolutionAPI(`/instance/connect/${instanceName}`, 'GET')
        break;

      case 'delete':
        data = await fetchEvolutionAPI(`/instance/delete/${instanceName}`, 'DELETE')
        break;

      default:
        throw new Error(`Ação inválida: ${action}`)
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Erro na função manage-instance:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})