import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { bearerJwt, getAuthUserFromJwt } from '../_shared/auth-user.ts'
import { deliverNotification } from '../_shared/deliver-notification.ts'

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

type Body = {
  category_id: string | null
  occurred_at: string
}

type BudgetRow = {
  id: string
  user_id: string
  workspace_id: string | null
  category_id: string
  period_start: string
  period_end: string
  amount: number
  threshold_80_sent_at: string | null
  threshold_100_sent_at: string | null
  threshold_over_sent_at: string | null
}

async function sendEmailResend(args: {
  to: string
  subject: string
  html: string
}): Promise<void> {
  const apiKey = Deno.env.get('RESEND_API_KEY')?.trim()
  if (!apiKey) throw new Error('Missing RESEND_API_KEY')

  const from = Deno.env.get('RESEND_FROM')?.trim() || 'Finance App <no-reply@finance.app>'

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: args.to,
      subject: args.subject,
      html: args.html,
    }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Resend error: ${res.status} ${text.slice(0, 300)}`)
  }
}

function renderEmailHtml(args: {
  title: string
  body: string
  settingsUrl: string
}): string {
  const safeTitle = args.title.replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  const safeBody = args.body.replaceAll('<', '&lt;').replaceAll('>', '&gt;')

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${safeTitle}</title>
  </head>
  <body style="margin:0;padding:0;background:#0b0b0d;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;">
    <div style="max-width:560px;margin:0 auto;padding:24px;">
      <div style="background:#141418;border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:20px;color:#fff;">
        <h1 style="margin:0 0 10px;font-size:18px;line-height:1.3;">${safeTitle}</h1>
        <p style="margin:0;color:rgba(255,255,255,.75);font-size:14px;line-height:1.5;">${safeBody}</p>
        <div style="margin-top:16px;">
          <a href="${args.settingsUrl}" style="display:inline-block;padding:10px 12px;border-radius:10px;background:rgba(255,255,255,.10);color:#fff;text-decoration:none;font-size:13px;">Gerenciar preferências</a>
        </div>
      </div>
      <p style="margin:14px 4px 0;color:rgba(255,255,255,.55);font-size:12px;line-height:1.4;">
        Você recebeu este email porque habilitou notificações por email no Finance App.
      </p>
    </div>
  </body>
</html>`
}

function pct(spend: number, amount: number): number {
  if (!amount) return 0
  return (spend / amount) * 100
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' })

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!

  const jwt = bearerJwt(req.headers.get('Authorization'))
  if (!jwt) return json(401, { error: 'Missing authorization header' })

  const authResult = await getAuthUserFromJwt(supabaseUrl, anonKey, jwt)
  if (authResult.error || !authResult.user) {
    return json(401, { error: 'Invalid or expired token', details: authResult.error ?? 'unknown' })
  }

  let body: Body
  try {
    body = await req.json()
  } catch {
    return json(400, { error: 'Invalid JSON body' })
  }

  const occurredAt = new Date(body.occurred_at)
  if (Number.isNaN(occurredAt.getTime())) {
    return json(400, { error: 'Invalid occurred_at' })
  }

  const user = authResult.user
  const userId = user.id

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

  // Only evaluate when we have a category_id (budget is per category)
  const categoryId = body.category_id
  if (!categoryId) {
    return json(200, { ok: true, skipped: true, reason: 'no_category' })
  }

  // Find active budget for that category & day
  const day = occurredAt.toISOString().slice(0, 10) // YYYY-MM-DD
  const { data: budget, error: bErr } = await supabaseAdmin
    .from('budgets')
    .select('*')
    .eq('user_id', userId)
    .eq('category_id', categoryId)
    .lte('period_start', day)
    .gte('period_end', day)
    .order('period_start', { ascending: false })
    .maybeSingle()

  if (bErr) return json(500, { error: bErr.message })
  if (!budget) return json(200, { ok: true, skipped: true, reason: 'no_budget' })

  const b = budget as BudgetRow

  let workspaceId = b.workspace_id
  if (!workspaceId) {
    const { data: ws, error: wsErr } = await supabaseAdmin
      .from('workspaces')
      .select('id')
      .eq('created_by', userId)
      .eq('type', 'personal')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()
    if (wsErr) return json(500, { error: wsErr.message })
    workspaceId = ws?.id ?? null
  }
  if (!workspaceId) {
    return json(500, { error: 'Budget has no workspace; run workspace migrations' })
  }

  const { data: prefs, error: prefsErr } = await supabaseAdmin
    .from('workspace_member_notification_prefs')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .maybeSingle()
  if (prefsErr) return json(500, { error: prefsErr.message })

  const s = prefs ?? {
    notify_email: true,
    notify_in_app: true,
    notify_budget: true,
  }

  if (!s.notify_budget) {
    return json(200, { ok: true, skipped: true, reason: 'budget_disabled' })
  }

  const { data: catRow, error: catErr } = await supabaseAdmin
    .from('categories')
    .select('workspace_id')
    .eq('id', categoryId)
    .maybeSingle()
  if (catErr) return json(500, { error: catErr.message })

  const spendWorkspaceId =
    (catRow as { workspace_id?: string | null } | null)?.workspace_id ?? b.workspace_id ?? workspaceId

  // Sum expenses for the period: workspace-wide when we know workspace (shared carteira),
  // else fall back to the acting user's transactions only (legacy rows).
  let sumQuery = supabaseAdmin
    .from('transactions')
    .select('amount,type,category_id,date')
    .eq('category_id', categoryId)
    .eq('type', 'expense')
    .gte('date', `${b.period_start}T00:00:00.000Z`)
    .lte('date', `${b.period_end}T23:59:59.999Z`)

  if (spendWorkspaceId) {
    sumQuery = sumQuery.eq('workspace_id', spendWorkspaceId)
  } else {
    sumQuery = sumQuery.eq('user_id', userId)
  }

  const { data: sumRows, error: sumErr } = await sumQuery

  if (sumErr) return json(500, { error: sumErr.message })

  const budgetAmount = Number(b.amount)
  const spend = (sumRows ?? []).reduce((acc: number, r: { amount: number }) => acc + Number(r.amount || 0), 0)
  const percent = pct(spend, budgetAmount)
  const hitOver = spend > budgetAmount
  const hit100 = spend >= budgetAmount && !hitOver
  const hit80 = spend >= budgetAmount * 0.8 && spend < budgetAmount

  const thresholds: Array<{ key: 'threshold_80_sent_at' | 'threshold_100_sent_at' | 'threshold_over_sent_at'; hit: boolean; title: string; body: string }> = [
    {
      key: 'threshold_80_sent_at',
      hit: hit80,
      title: 'Orçamento chegando ao limite (80%)',
      body: `Você já usou ${percent.toFixed(0)}% do seu orçamento nesta categoria.`,
    },
    {
      key: 'threshold_100_sent_at',
      hit: hit100,
      title: 'Orçamento atingiu 100%',
      body: `Você atingiu 100% do seu orçamento nesta categoria.`,
    },
    {
      key: 'threshold_over_sent_at',
      hit: hitOver,
      title: 'Orçamento excedido',
      body: `Você excedeu seu orçamento (${percent.toFixed(0)}%).`,
    },
  ]

  // Pick the most severe threshold that is hit and not yet sent
  const nowIso = new Date().toISOString()
  let chosen: typeof thresholds[number] | null = null
  for (const t of thresholds.slice().reverse()) {
    if (t.hit && !b[t.key]) {
      chosen = t
      break
    }
  }

  if (!chosen) {
    return json(200, { ok: true, skipped: true, reason: 'no_new_threshold', percent })
  }

  // Mark threshold as sent (dedupe).
  // Use a conditional update so parallel invocations cannot both claim the same threshold.
  const updatePayload: Record<string, string> = { [chosen.key]: nowIso }
  const { data: claimed, error: upErr } = await supabaseAdmin
    .from('budgets')
    .update(updatePayload)
    .eq('id', b.id)
    .is(chosen.key, null)
    .select('id')
    .maybeSingle()
  if (upErr) return json(500, { error: upErr.message })
  if (!claimed) {
    return json(200, {
      ok: true,
      skipped: true,
      reason: 'threshold_already_sent',
      threshold: chosen.key,
      percent,
    })
  }

  const metadata = {
    kind: 'budget_threshold',
    percent,
    budget_id: b.id,
    category_id: categoryId,
    threshold: chosen.key,
    href: `/categories/${categoryId}`,
  }

  const delivered = await deliverNotification({
    supabaseAdmin,
    userId,
    userEmail: user.email,
    workspaceId,
    type: 'budget',
    title: chosen.title,
    body: chosen.body,
    metadata,
  })

  if (!delivered.ok) {
    return json(500, { error: delivered.error })
  }

  return json(200, {
    ok: true,
    delivered: {
      in_app: delivered.in_app,
      email: delivered.email,
      push: delivered.push,
    },
    percent,
  })
})

