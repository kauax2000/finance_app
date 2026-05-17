import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { bearerJwt, getAuthUserFromJwt } from '../_shared/auth-user.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    const authHeader = req.headers.get('Authorization')
    const jwt = bearerJwt(authHeader)
    if (!jwt) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const authResult = await getAuthUserFromJwt(supabaseUrl, anonKey, jwt)
    if (authResult.error || !authResult.user) {
      return new Response(
        JSON.stringify({
          error: 'Invalid or expired token',
          details: authResult.error ?? 'unknown',
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }
    const user = authResult.user

    const email = user.email
    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Conta sem email não pode ser excluída desta forma.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    let body: { password?: string }
    try {
      body = await req.json()
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const password = body.password
    if (!password || typeof password !== 'string') {
      return new Response(JSON.stringify({ error: 'Senha é obrigatória' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const verifyClient = createClient(supabaseUrl, anonKey)
    const { error: signInError } = await verifyClient.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      return new Response(JSON.stringify({ error: 'Senha incorreta' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
    const userId = user.id

    const fail = (message: string) =>
      new Response(JSON.stringify({ error: message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })

    const { data: transactions, error: txSelectError } = await supabaseAdmin
      .from('transactions')
      .select('id')
      .eq('user_id', userId)

    if (txSelectError) {
      console.error('delete-user: transactions select', txSelectError)
      return fail('Erro ao excluir dados da conta.')
    }

    if (transactions && transactions.length > 0) {
      const ids = transactions.map((t: { id: string }) => t.id)
      const { error: splitError } = await supabaseAdmin
        .from('transaction_splits')
        .delete()
        .in('transaction_id', ids)
      if (splitError) {
        console.error('delete-user: transaction_splits', splitError)
        return fail('Erro ao excluir dados da conta.')
      }
    }

    const { error: txDelError } = await supabaseAdmin.from('transactions').delete().eq('user_id', userId)
    if (txDelError) {
      console.error('delete-user: transactions', txDelError)
      return fail('Erro ao excluir dados da conta.')
    }

    const { error: catError } = await supabaseAdmin.from('categories').delete().eq('user_id', userId)
    if (catError) {
      console.error('delete-user: categories', catError)
      return fail('Erro ao excluir dados da conta.')
    }

    const { error: actError } = await supabaseAdmin.from('user_activity_logs').delete().eq('user_id', userId)
    if (actError) {
      console.error('delete-user: user_activity_logs', actError)
      return fail('Erro ao excluir dados da conta.')
    }

    const { error: sessError } = await supabaseAdmin.from('user_sessions').delete().eq('user_id', userId)
    if (sessError) {
      console.error('delete-user: user_sessions', sessError)
      return fail('Erro ao excluir dados da conta.')
    }

    const { error: profError } = await supabaseAdmin.from('profiles').delete().eq('id', userId)
    if (profError) {
      console.error('delete-user: profiles', profError)
      return fail('Erro ao excluir dados da conta.')
    }

    const { data: avatarFiles, error: listError } = await supabaseAdmin.storage.from('avatars').list(userId)
    if (listError) {
      console.error('delete-user: storage list', listError)
      // Non-fatal: continue with auth user deletion
    } else if (avatarFiles && avatarFiles.length > 0) {
      const paths = avatarFiles.map((f: { name: string }) => `${userId}/${f.name}`)
      const { error: removeError } = await supabaseAdmin.storage.from('avatars').remove(paths)
      if (removeError) {
        console.error('delete-user: storage remove', removeError)
      }
    }

    const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(userId)
    if (deleteUserError) {
      console.error('delete-user: auth.admin.deleteUser', deleteUserError)
      return new Response(JSON.stringify({ error: 'Erro ao excluir conta. Tente novamente.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
