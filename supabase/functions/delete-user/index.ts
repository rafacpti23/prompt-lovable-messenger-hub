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

    // 1. Get the calling user from the auth header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Usuário não autenticado')
    const token = authHeader.replace('Bearer ', '')
    const { data: { user: callingUser } } = await supabaseClient.auth.getUser(token)
    if (!callingUser) throw new Error('Usuário chamador inválido')

    // 2. Check if the calling user is an admin
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', callingUser.id)
      .single()

    if (profileError || !profile || profile.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Acesso negado. Somente administradores podem excluir usuários.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 3. Get the user ID to delete from the request body
    const { userIdToDelete } = await req.json()
    if (!userIdToDelete) {
      throw new Error('O ID do usuário a ser excluído é obrigatório.')
    }
    
    if (userIdToDelete === callingUser.id) {
        throw new Error('Um administrador não pode excluir a si mesmo.')
    }

    // 4. Create an admin client to perform the deletion
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // 5. Delete the user from auth schema, which will cascade to profiles
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userIdToDelete)

    if (deleteError) {
      throw new Error(`Erro ao excluir usuário: ${deleteError.message}`)
    }

    return new Response(JSON.stringify({ message: 'Usuário excluído com sucesso.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Erro na função delete-user:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})