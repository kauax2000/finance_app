import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.99.3'
import { isServiceAuthorized } from '../_shared/service-auth.ts'
import { processTransactionNotification } from '../_shared/process-transaction-notification.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-app-session-id',
}

function json(status: number, payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

type WebhookBody = {
  transaction_id?: string
  record?: Record<string, unknown>
}

function resolveTransactionId(body: WebhookBody): string | null {
  const direct =
    typeof body.transaction_id === 'string' ? body.transaction_id.trim() : ''
  if (direct) return direct
  const recordId = body.record?.id
  if (typeof recordId === 'string' && recordId.trim()) return recordId.trim()
  return null
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return json(405, { error: 'Method not allowed' })
  }

  if (!isServiceAuthorized(req)) {
    return json(401, { error: 'Unauthorized' })
  }

  let body: WebhookBody
  try {
    body = await req.json()
  } catch {
    return json(400, { error: 'Invalid JSON body' })
  }

  const transactionId = resolveTransactionId(body)
  if (!transactionId) {
    return json(400, { error: 'transaction_id is required' })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

  const result = await processTransactionNotification(supabaseAdmin, transactionId)
  if (!result.ok) {
    return json(result.status ?? 500, { error: result.error })
  }

  return json(200, result)
})
