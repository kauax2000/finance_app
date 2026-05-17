import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-cron-secret',
}

function json(status: number, payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' })

  const secret = Deno.env.get('CRON_SECRET')?.trim()
  const hdr = req.headers.get('x-cron-secret')?.trim()
  if (!secret || hdr !== secret) {
    return json(401, { error: 'Unauthorized' })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const admin = createClient(supabaseUrl, supabaseServiceKey)

  const { data: subN, error: subErr } = await admin.rpc('run_subscription_billing')
  if (subErr) {
    return json(500, { error: subErr.message })
  }

  const { data: instN, error: instErr } = await admin.rpc('run_installment_billing')
  if (instErr) {
    return json(500, { error: instErr.message })
  }

  return json(200, {
    subscription_billed: subN ?? 0,
    installment_billed: instN ?? 0,
  })
})
