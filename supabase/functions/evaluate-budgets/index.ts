import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.99.3'
import { bearerJwt, getAuthUserFromJwt } from '../_shared/auth-user.ts'
import { isServiceAuthorized } from '../_shared/service-auth.ts'
import { deliverNotification } from '../_shared/deliver-notification.ts'
import { budgetCopy, monthNamePt } from '../_shared/notification-copy.ts'
import {
  addCalendarDays,
  type CardTxRow,
  daysInMonth,
  formatYmd,
} from '../_shared/credit-card-cycle.ts'
import { diasCandidatos, gastoDaCategoriaNoMes } from '../_shared/orcamento-mes.ts'

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
  // O front 2.0 e o `capture` mandam o pagamento; o front antigo de `main`, não.
  payment_method?: string | null
  payment_credit_card_id?: string | null
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

type Result = { status: number; payload: Record<string, unknown> }

function failResult(context: string, error: unknown): Result {
  console.error(`evaluate-budgets: ${context}`, error)
  return { status: 500, payload: { error: 'Erro ao avaliar orçamento.' } }
}

function fail(context: string, error: unknown): Response {
  const r = failResult(context, error)
  return json(r.status, r.payload)
}

/** Do primeiro dia do mês anterior ao último do seguinte: a folga da compra no cartão. */
function margemDoMes(ym: string): { start: string; end: string } {
  const [y, m] = ym.split('-').map(Number)
  const start = { ...addCalendarDays({ y, m, d: 1 }, -1), d: 1 }
  const ny = m === 12 ? y + 1 : y
  const nm = m === 12 ? 1 : m + 1
  return { start: formatYmd(start), end: formatYmd({ y: ny, m: nm, d: daysInMonth(ny, nm) }) }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' })

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!

  // Caminho de serviço (Edge `capture`): quem chama já conferiu o membro, e o
  // corpo vale como veio. O JWT da pessoa continua valendo para o front.
  let userId: string | null = null
  if (!isServiceAuthorized(req)) {
    const jwt = bearerJwt(req.headers.get('Authorization'))
    if (!jwt) return json(401, { error: 'Missing authorization header' })

    const authResult = await getAuthUserFromJwt(supabaseUrl, anonKey, jwt)
    if (authResult.error || !authResult.user) {
      return json(401, { error: 'Invalid or expired token' })
    }
    userId = authResult.user.id
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

  if (userId) {
    const { data: membership, error: memErr } = await supabaseAdmin
      .from('workspace_members')
      .select('user_id')
      .eq('workspace_id', workspaceId)
      .eq('user_id', userId)
      .maybeSingle()
    if (memErr) return fail('membro', memErr)
    if (!membership) return json(403, { error: 'Not a member of this workspace' })
  }

  // Datas de lançamento ficam ao meio-dia UTC: o prefixo ISO é o dia do lançamento.
  const day = occurredAt.toISOString().slice(0, 10)

  const { data: cardRows, error: cardsErr } = await supabaseAdmin
    .from('credit_cards')
    .select('id,closing_day')
    .eq('workspace_id', workspaceId)
  if (cardsErr) return fail('cartões', cardsErr)
  const closingDayByCard: Record<string, number> = {}
  for (const c of (cardRows ?? []) as { id: string; closing_day: number }[]) {
    closingDayByCard[c.id] = c.closing_day
  }

  // O orçamento é competência: a compra no cartão conta no mês do fechamento.
  // Com o pagamento no corpo há um dia candidato só (ver `diasCandidatos`).
  const pagamento =
    'payment_method' in body
      ? { payment_method: body.payment_method ?? null, payment_credit_card_id: body.payment_credit_card_id ?? null }
      : undefined
  const candidateDays = diasCandidatos(day, closingDayByCard, pagamento)

  const { data: budgetRows, error: bErr } = await supabaseAdmin
    .from('budgets')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('category_id', categoryId)
    .lte('period_start', candidateDays[candidateDays.length - 1])
    .gte('period_end', candidateDays[0])
    .order('period_start', { ascending: false })
  if (bErr) return fail('orçamento', bErr)
  // Por dia, o orçamento mais recente que o contém (o `limit(1)` de antes).
  const budgets = new Map<string, BudgetRow>()
  for (const d of candidateDays) {
    const hit = ((budgetRows ?? []) as BudgetRow[]).find((r) => r.period_start <= d && r.period_end >= d)
    if (hit) budgets.set(hit.id, hit)
  }
  if (budgets.size === 0) return json(200, { ok: true, skipped: true, reason: 'no_budget' })

  const months = [...budgets.values()].map((b) => b.period_start.slice(0, 7)).sort()
  const win = { start: margemDoMes(months[0]).start, end: margemDoMes(months[months.length - 1]).end }
  // Só despesa, como a tela de Categorias, que lê `type = 'expense'`.
  const { data: txRows, error: sumErr } = await supabaseAdmin
    .from('transactions')
    .select('amount,type,date,payment_method,payment_credit_card_id,category_id')
    .eq('workspace_id', workspaceId)
    .eq('category_id', categoryId)
    .eq('type', 'expense')
    .gte('date', `${win.start}T00:00:00.000Z`)
    .lte('date', `${win.end}T23:59:59.999Z`)
  if (sumErr) return fail('soma', sumErr)

  const evaluateBudget = async (b: BudgetRow, spend: number): Promise<Result> => {
    const budgetAmount = Number(b.amount)
    const percent = pct(spend, budgetAmount)
    const hitOver = spend > budgetAmount
    const hit100 = spend >= budgetAmount && !hitOver
    const hit80 = spend >= budgetAmount * 0.8 && spend < budgetAmount

    // O mês do orçamento, e não o de hoje: um lançamento retroativo fala do mês dele.
    const yearMonth = b.period_start.slice(0, 7)
    const mes = monthNamePt(Number(yearMonth.slice(5, 7)))
    const copy = (nivel: '80' | '100' | 'over') =>
      budgetCopy({ categoria: categoryName, mes, gasto: spend, limite: budgetAmount, nivel })

    const thresholds: Array<{ key: ThresholdKey; hit: boolean; title: string; body: string }> = [
      { key: 'threshold_80_sent_at', hit: hit80, ...copy('80') },
      { key: 'threshold_100_sent_at', hit: hit100, ...copy('100') },
      { key: 'threshold_over_sent_at', hit: hitOver, ...copy('over') },
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
      return { status: 200, payload: { ok: true, skipped: true, reason: 'no_new_threshold', percent } }
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
    if (upErr) return failResult('reivindicação', upErr)
    if (!claimed) {
      return { status: 200, payload: { ok: true, skipped: true, reason: 'threshold_already_sent', percent } }
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
      return failResult('membros', membersErr)
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
      // A tela da categoria lê `month` (parseYearMonthParam) e abre no mês do orçamento.
      href: `/categories/${categoryId}?month=${yearMonth}`,
    }

    let anyDelivered = false
    const deliveries: Array<Record<string, unknown>> = []
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
          deliveries.push({ user_id: memberId, in_app: r.in_app, email: r.email, push: r.push })
        } else {
          console.error('evaluate-budgets: entrega', memberId, r.error)
          deliveries.push({ user_id: memberId, error: 'delivery_failed' })
        }
      } catch (e) {
        console.error('evaluate-budgets: entrega', memberId, e)
        deliveries.push({ user_id: memberId, error: 'delivery_failed' })
      }
    }

    // Ninguém recebeu: libera o limiar para uma próxima avaliação tentar de novo.
    if (!anyDelivered) {
      await releaseClaim()
      return { status: 500, payload: { error: 'Erro ao entregar o alerta de orçamento.', percent } }
    }

    return { status: 200, payload: { ok: true, percent, results: deliveries } }
  }

  const results: Result[] = []
  for (const b of budgets.values()) {
    const spend = gastoDaCategoriaNoMes(
      (txRows ?? []) as CardTxRow[],
      categoryId,
      b.period_start.slice(0, 7),
      closingDayByCard
    )
    results.push(await evaluateBudget(b, spend))
  }
  if (results.length === 1) return json(results[0].status, results[0].payload)
  const failed = results.some((r) => r.status !== 200)
  return json(failed ? 500 : 200, { ok: !failed, budgets: results.map((r) => r.payload) })
})
