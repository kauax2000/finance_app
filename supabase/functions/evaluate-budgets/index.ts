import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.99.3'
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
  workspace_id: string
  category_id: string
  period_start: string
  period_end: string
  amount: number
  threshold_80_sent_at: string | null
  threshold_100_sent_at: string | null
  threshold_over_sent_at: string | null
}

type ThresholdKey = 'threshold_80_sent_at' | 'threshold_100_sent_at' | 'threshold_over_sent_at'

function pct(spend: number, amount: number): number {
  if (!amount) return 0
  return (spend / amount) * 100
}

function fail(context: string, error: unknown): Response {
  console.error(`evaluate-budgets: ${context}`, error)
  return json(500, { error: 'Erro ao avaliar orçamento.' })
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
    return json(401, { error: 'Invalid or expired token' })
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

  const categoryId = body.category_id
  if (!categoryId) {
    return json(200, { ok: true, skipped: true, reason: 'no_category' })
  }

  const userId = authResult.user.id
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

  // O orçamento é da carteira da categoria, e não de quem lançou: numa carteira
  // compartilhada o orçamento criado por um membro vale para o lançamento de outro.
  const { data: category, error: catErr } = await supabaseAdmin
    .from('categories')
    .select('workspace_id,name')
    .eq('id', categoryId)
    .maybeSingle()
  if (catErr) return fail('categoria', catErr)
  const workspaceId = (category as { workspace_id?: string | null } | null)?.workspace_id ?? null
  if (!workspaceId) return json(200, { ok: true, skipped: true, reason: 'no_category' })
  const categoryName = (category as { name?: string }).name ?? 'esta categoria'

  const { data: membership, error: memErr } = await supabaseAdmin
    .from('workspace_members')
    .select('user_id')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .maybeSingle()
  if (memErr) return fail('membro', memErr)
  if (!membership) return json(403, { error: 'Not a member of this workspace' })

  // Datas de lançamento ficam ao meio-dia UTC: o prefixo ISO é o dia do lançamento.
  const day = occurredAt.toISOString().slice(0, 10)
  const { data: budget, error: bErr } = await supabaseAdmin
    .from('budgets')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('category_id', categoryId)
    .lte('period_start', day)
    .gte('period_end', day)
    .order('period_start', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (bErr) return fail('orçamento', bErr)
  if (!budget) return json(200, { ok: true, skipped: true, reason: 'no_budget' })

  const b = budget as BudgetRow

  const { data: sumRows, error: sumErr } = await supabaseAdmin
    .from('transactions')
    .select('amount')
    .eq('workspace_id', workspaceId)
    .eq('category_id', categoryId)
    .eq('type', 'expense')
    .gte('date', `${b.period_start}T00:00:00.000Z`)
    .lte('date', `${b.period_end}T23:59:59.999Z`)
  if (sumErr) return fail('soma', sumErr)

  const budgetAmount = Number(b.amount)
  // Em centavos: somar reais em ponto flutuante erra na segunda casa.
  const spend =
    (sumRows ?? []).reduce(
      (acc: number, r: { amount: number }) => acc + Math.round(Number(r.amount || 0) * 100),
      0,
    ) / 100
  const percent = pct(spend, budgetAmount)
  const hitOver = spend > budgetAmount
  const hit100 = spend >= budgetAmount && !hitOver
  const hit80 = spend >= budgetAmount * 0.8 && spend < budgetAmount

  const thresholds: Array<{ key: ThresholdKey; hit: boolean; title: string; body: string }> = [
    {
      key: 'threshold_80_sent_at',
      hit: hit80,
      title: 'Orçamento chegando ao limite (80%)',
      body: `Já foram usados ${percent.toFixed(0)}% do orçamento de ${categoryName}.`,
    },
    {
      key: 'threshold_100_sent_at',
      hit: hit100,
      title: 'Orçamento atingiu 100%',
      body: `O orçamento de ${categoryName} chegou a 100%.`,
    },
    {
      key: 'threshold_over_sent_at',
      hit: hitOver,
      title: 'Orçamento excedido',
      body: `O orçamento de ${categoryName} foi excedido (${percent.toFixed(0)}%).`,
    },
  ]

  // O limiar mais severo atingido e ainda não enviado.
  let chosen: (typeof thresholds)[number] | null = null
  for (const t of thresholds.slice().reverse()) {
    if (t.hit && !b[t.key]) {
      chosen = t
      break
    }
  }
  if (!chosen) {
    return json(200, { ok: true, skipped: true, reason: 'no_new_threshold', percent })
  }

  // Reivindicação condicional: duas avaliações em paralelo não enviam o mesmo limiar.
  const nowIso = new Date().toISOString()
  const { data: claimed, error: upErr } = await supabaseAdmin
    .from('budgets')
    .update({ [chosen.key]: nowIso })
    .eq('id', b.id)
    .is(chosen.key, null)
    .select('id')
    .maybeSingle()
  if (upErr) return fail('reivindicação', upErr)
  if (!claimed) {
    return json(200, { ok: true, skipped: true, reason: 'threshold_already_sent', percent })
  }

  const releaseClaim = () =>
    supabaseAdmin.from('budgets').update({ [chosen!.key]: null }).eq('id', b.id).eq(chosen!.key, nowIso)

  // Todos os membros recebem; cada um com as próprias preferências, que
  // deliverNotification confere (notify_budget).
  const { data: memberRows, error: membersErr } = await supabaseAdmin
    .from('workspace_members')
    .select('user_id')
    .eq('workspace_id', workspaceId)
  if (membersErr) {
    await releaseClaim()
    return fail('membros', membersErr)
  }
  const memberIds = (memberRows ?? []).map((m: { user_id: string }) => m.user_id)

  const emails = new Map<string, string | null>()
  if (memberIds.length > 0) {
    const { data: profileRows } = await supabaseAdmin
      .from('profiles')
      .select('id,email')
      .in('id', memberIds)
    for (const p of profileRows ?? []) {
      emails.set(p.id as string, (p.email as string | null) ?? null)
    }
  }

  const metadata = {
    kind: 'budget_threshold',
    percent,
    budget_id: b.id,
    category_id: categoryId,
    threshold: chosen.key,
    href: `/categories/${categoryId}`,
  }

  let anyDelivered = false
  const results: Array<Record<string, unknown>> = []
  for (const memberId of memberIds) {
    try {
      const r = await deliverNotification({
        supabaseAdmin,
        userId: memberId,
        userEmail: emails.get(memberId) ?? null,
        workspaceId,
        type: 'budget',
        title: chosen.title,
        body: chosen.body,
        metadata,
      })
      if (r.ok) {
        anyDelivered = true
        results.push({ user_id: memberId, in_app: r.in_app, email: r.email, push: r.push })
      } else {
        console.error('evaluate-budgets: entrega', memberId, r.error)
        results.push({ user_id: memberId, error: 'delivery_failed' })
      }
    } catch (e) {
      console.error('evaluate-budgets: entrega', memberId, e)
      results.push({ user_id: memberId, error: 'delivery_failed' })
    }
  }

  // Ninguém recebeu: libera o limiar para uma próxima avaliação tentar de novo.
  if (!anyDelivered) {
    await releaseClaim()
    return json(500, { error: 'Erro ao entregar o alerta de orçamento.', percent })
  }

  return json(200, { ok: true, percent, results })
})
