import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Auth check: Ensure only authenticated users can call this function
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Usuário não autenticado')
    const token = authHeader.replace('Bearer ', '')
    const { data: { user } } = await supabaseClient.auth.getUser(token)
    if (!user) throw new Error('Usuário não autenticado')

    const EVOLUTION_API_URL = Deno.env.get('EVOLUTION_API_URL') || 'https://api.ramelseg.com.br';
    const EVOLUTION_API_KEY = Deno.env.get('EVOLUTION_API_KEY') || 'd86920ba398e31464c46401214779885';

    if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) {
      throw new Error('As credenciais da Evolution API (EVOLUTION_API_URL ou EVOLUTION_API_KEY) não estão configuradas nas variáveis de ambiente do Supabase.');
    }

    const response = await fetch(`${EVOLUTION_API_URL}/instance/fetchInstances`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(`Erro na API Evolution ao buscar instâncias: ${errorData.message || response.statusText}`);
    }

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error('Erro na função fetch-evolution-instances:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
})