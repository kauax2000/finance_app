import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.99.3'
import { bearerJwt, getAuthUserFromJwt } from '../_shared/auth-user.ts'
import { isServiceAuthorized } from '../_shared/service-auth.ts'
import type { SupabaseAdminClient } from '../_shared/supabase-admin.ts'
import { deliverNotification } from '../_shared/deliver-notification.ts'
import { adultosDaCarteira } from '../_shared/destinatarios.ts'
import {
  decidirAvisosDoLimite,
  destinoDoAvisoDoLimite,
  gastoDaPessoaNoMes,
  type LancamentoDaPessoa,
  nivelNovo,
} from '../_shared/limite-pessoa.ts'
import { textoDoInsight } from '../_shared/insights/textos.ts'
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
  // Bloco 7A: o lançamento que disparou (a carteira e o autor saem da linha),
  // ou, para quem não tem um id só (o plano parcelado, a conta paga), a
  // carteira — o autor é quem chama. O corpo sem os dois é o de hoje.
  transaction_id?: string | null
  workspace_id?: string | null
}

type TxDoAviso = {
  workspace_id: string
  user_id: string
  type: string
  category_id: string | null
  date: string
  payment_method: string | null
  payment_credit_card_id: string | null
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

/** O cliente de serviço com as RPCs (o `SupabaseAdminClient` as deixa opcionais). */
type Admin = SupabaseAdminClient & Required<Pick<SupabaseAdminClient, 'rpc'>>
type Membro = { user_id: string; role: string }

/**
 * O limite mensal do autor (Bloco 7A, spec §12): o gasto dele no mês contra o
 * limite, e o aviso de 80% ou de 100% à pessoa e a cada dono, uma vez cada. Só
 * o nível mais alto atingido avisa, e a reivindicação grava os de baixo junto
 * (`decidirAvisosDoLimite`). Roda com ou sem categoria e orçamento; uma falha
 * vira log e não muda a resposta do orçamento.
 */
async function avaliarLimite(
  admin: Admin,
  workspaceId: string,
  autorId: string,
  meses: string[],
  closingDayByCard: Record<string, number>
): Promise<void> {
  const { data: lim, error: limErr } = await admin
    .from('workspace_member_limits')
    .select('amount')
    .eq('workspace_id', workspaceId)
    .eq('user_id', autorId)
    .maybeSingle()
  if (limErr) return console.error('evaluate-budgets: limite', limErr)
  if (!lim) return
  const limiteCentavos = Math.round(Number((lim as { amount: number }).amount) * 100)

  const { data: memberRows, error: memErr } = await admin
    .from('workspace_members')
    .select('user_id, role')
    .eq('workspace_id', workspaceId)
  if (memErr) return console.error('evaluate-budgets: limite membros', memErr)
  const membros = (memberRows ?? []) as Membro[]
  const papelDe = new Map(membros.map((m) => [m.user_id, m.role]))

  const ordenados = [...meses].sort()
  const { data: txRows, error: txErr } = await admin
    .from('transactions')
    .select('user_id,type,amount,date,payment_method,payment_credit_card_id')
    .eq('workspace_id', workspaceId)
    .eq('user_id', autorId)
    .eq('type', 'expense')
    .gte('date', `${margemDoMes(ordenados[0]).start}T00:00:00.000Z`)
    .lte('date', `${margemDoMes(ordenados[ordenados.length - 1]).end}T23:59:59.999Z`)
  if (txErr) return console.error('evaluate-budgets: limite soma', txErr)
  type TxLimite = Omit<LancamentoDaPessoa, 'card'> & { payment_credit_card_id: string | null }
  const lancs: LancamentoDaPessoa[] = ((txRows ?? []) as TxLimite[]).map((t) => {
    const cd = t.payment_credit_card_id ? closingDayByCard[t.payment_credit_card_id] : undefined
    return { ...t, amount: Number(t.amount), card: cd == null ? null : { closing_day: cd } }
  })

  let perfis: Map<string, { email: string | null; full_name: string | null }> | null = null

  for (const ym of new Set(ordenados)) {
    const gasto = gastoDaPessoaNoMes(lancs, autorId, ym)
    const { nivel, reivindicar, destinatarios } = decidirAvisosDoLimite(autorId, membros, gasto, limiteCentavos)
    if (nivel === 0) continue

    // Reivindica antes de avisar: `on conflict do nothing` só devolve o que é
    // novo, e duas avaliações em paralelo não avisam o mesmo nível.
    const { data: novos, error: claimErr } = await admin
      .from('limites_avisados')
      .upsert(
        reivindicar.map((n) => ({ workspace_id: workspaceId, user_id: autorId, ym, nivel: n })),
        { onConflict: 'workspace_id,user_id,ym,nivel', ignoreDuplicates: true }
      )
      .select('nivel')
    if (claimErr) {
      console.error('evaluate-budgets: limite reivindicação', claimErr)
      continue
    }
    const reivindicados = ((novos ?? []) as { nivel: number }[]).map((r) => r.nivel)
    if (!nivelNovo(nivel, reivindicados)) continue
    // Sem a liberação, o nível fica reivindicado e não avisa mais no mês: o erro se loga.
    const liberar = async () => {
      const { error } = await admin
        .from('limites_avisados')
        .delete()
        .eq('workspace_id', workspaceId)
        .eq('user_id', autorId)
        .eq('ym', ym)
        .in('nivel', reivindicados)
      if (error) console.error('evaluate-budgets: limite liberar', error)
    }

    if (!perfis) {
      const { data: profileRows, error: profErr } = await admin
        .from('profiles')
        .select('id,email,full_name')
        .in('id', destinatarios)
      if (profErr) console.error('evaluate-budgets: limite perfis', profErr)
      perfis = new Map(
        ((profileRows ?? []) as { id: string; email: string | null; full_name: string | null }[]).map((p) => [p.id, p])
      )
    }
    const autor = perfis.get(autorId)
    const nome = autor?.full_name?.trim() || autor?.email?.split('@')[0] || 'Alguém'

    // O destino do insight sai do papel de quem lê na hora da leitura (Tarefa
    // 4); por isso o payload não guarda papel.
    const payloadDe = (quem: string) => ({
      para: quem === autorId ? 'pessoa' : 'dono',
      nome,
      nivel,
      gasto: gasto / 100,
      limite: limiteCentavos / 100,
      ym,
      pessoaId: autorId,
    })

    // O insight é de cada destinatário (`user_id` preenchido), sem push
    // próprio: o push é o aviso logo abaixo. Se ele falha, a reivindicação é
    // liberada e nada é avisado: a próxima avaliação tenta os dois de novo (o
    // dedupe do insight não deixa repetir).
    const { error: insErr } = await admin.rpc('inserir_insights', {
      p_linhas: destinatarios.map((quem) => ({
        workspace_id: workspaceId,
        user_id: quem,
        kind: 'limite_pessoa',
        dedupe_key: `lim:${autorId}:${ym}:${nivel}`,
        payload: payloadDe(quem),
      })),
    })
    if (insErr) {
      console.error('evaluate-budgets: limite insight', insErr)
      await liberar()
      continue
    }

    let anyDelivered = false
    for (const quem of destinatarios) {
      const texto = textoDoInsight('limite_pessoa', payloadDe(quem))
      try {
        const r = await deliverNotification({
          supabaseAdmin: admin,
          userId: quem,
          userEmail: perfis.get(quem)?.email ?? null,
          workspaceId,
          type: 'budget',
          title: texto.titulo,
          body: texto.corpo,
          metadata: {
            kind: 'member_limit',
            nivel,
            ym,
            user_id: autorId,
            href: destinoDoAvisoDoLimite(papelDe.get(quem) ?? 'member'),
          },
        })
        if (r.ok) anyDelivered = true
        else console.error('evaluate-budgets: limite entrega', quem, r.error)
      } catch (e) {
        console.error('evaluate-budgets: limite entrega', quem, e)
      }
    }
    // Ninguém recebeu: libera o nível para uma próxima avaliação tentar de novo
    // (o insight já gravado não se repete, pelo dedupe dele).
    if (!anyDelivered) await liberar()
  }
}

// O convidado não vê orçamento (Bloco 7A): a avaliação roda e avisa os adultos
// como sempre, e a resposta a ele não diz nada além de `ok`.
Deno.serve(async (req: Request) => {
  const ctx = { convidado: false }
  const res = await avaliar(req, ctx)
  return ctx.convidado ? json(200, { ok: true }) : res
})

async function avaliar(req: Request, ctx: { convidado: boolean }): Promise<Response> {
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

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

  // Com `transaction_id`, a linha manda: carteira, autor, data, pagamento e
  // categoria saem dela, lida pela service role, e nunca do corpo. Sem ele vale
  // o corpo de hoje (o front antigo de `main`), com o autor = quem chama.
  let lanc: TxDoAviso | null = null
  if (typeof body.transaction_id === 'string' && body.transaction_id) {
    const { data, error } = await supabaseAdmin
      .from('transactions')
      .select('workspace_id,user_id,type,category_id,date,payment_method,payment_credit_card_id')
      .eq('id', body.transaction_id)
      .maybeSingle()
    if (error) return fail('lançamento', error)
    // Com quem chama, a linha que não existe responde o mesmo 403 da linha de
    // outra carteira: um UUID não se sonda. Sem quem chama (a service role), pula.
    if (!data) {
      if (userId) return json(403, { error: 'Not a member of this workspace' })
      return json(200, { ok: true, skipped: true, reason: 'no_transaction' })
    }
    lanc = data as TxDoAviso
  }

  const occurredAt = new Date(lanc ? lanc.date : body.occurred_at)
  if (Number.isNaN(occurredAt.getTime())) {
    return json(400, { error: 'Invalid occurred_at' })
  }

  const categoryId = lanc ? lanc.category_id : body.category_id
  const workspaceDoCorpo = typeof body.workspace_id === 'string' && body.workspace_id ? body.workspace_id : null
  if (!lanc && !categoryId && !workspaceDoCorpo) {
    return json(200, { ok: true, skipped: true, reason: 'no_category' })
  }

  // O orçamento é da carteira da categoria, e não de quem lançou: numa carteira
  // compartilhada o orçamento criado por um membro vale para o lançamento de outro.
  let workspaceId: string | null = lanc?.workspace_id ?? null
  let categoryName = 'esta categoria'
  if (categoryId) {
    const { data: category, error: catErr } = await supabaseAdmin
      .from('categories')
      .select('workspace_id,name')
      .eq('id', categoryId)
      .maybeSingle()
    if (catErr) return fail('categoria', catErr)
    const cat = category as { workspace_id?: string | null; name?: string } | null
    workspaceId ??= cat?.workspace_id ?? null
    categoryName = cat?.name ?? categoryName
  }
  workspaceId ??= workspaceDoCorpo
  if (!workspaceId) return json(200, { ok: true, skipped: true, reason: 'no_category' })

  if (userId) {
    const { data: membership, error: memErr } = await supabaseAdmin
      .from('workspace_members')
      .select('user_id, role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', userId)
      .maybeSingle()
    if (memErr) return fail('membro', memErr)
    if (!membership) return json(403, { error: 'Not a member of this workspace' })
    ctx.convidado = membership.role === 'guest'
    // O convidado só avalia o que é dele (a RLS nem lhe mostra o resto).
    if (ctx.convidado && lanc && lanc.user_id !== userId) {
      return json(403, { error: 'Not a member of this workspace' })
    }
  }
  if (lanc && lanc.type !== 'expense') return json(200, { ok: true, skipped: true, reason: 'not_expense' })

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
  // Com o pagamento no corpo (ou na linha) há um dia candidato só (ver `diasCandidatos`).
  const pagamento = lanc
    ? { payment_method: lanc.payment_method, payment_credit_card_id: lanc.payment_credit_card_id }
    : 'payment_method' in body
      ? { payment_method: body.payment_method ?? null, payment_credit_card_id: body.payment_credit_card_id ?? null }
      : undefined
  const candidateDays = diasCandidatos(day, closingDayByCard, pagamento)

  // O limite do autor vale com ou sem categoria e com ou sem orçamento, no mês
  // em que a compra conta (o fechamento, no crédito). O autor é o da linha; sem
  // ela, quem chama pelo JWT (o caminho de serviço sem linha não tem autor).
  const autorId = lanc ? lanc.user_id : userId
  if (autorId) {
    try {
      await avaliarLimite(supabaseAdmin, workspaceId, autorId, candidateDays.map((d) => d.slice(0, 7)), closingDayByCard)
    } catch (e) {
      console.error('evaluate-budgets: limite', e)
    }
  }

  // O orçamento continua precisando da categoria.
  if (!categoryId) return json(200, { ok: true, skipped: true, reason: 'no_category' })

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

    // Os adultos recebem (o convidado não vê orçamento); cada um com as
    // próprias preferências, que deliverNotification confere (notify_budget).
    const { data: memberRows, error: membersErr } = await supabaseAdmin
      .from('workspace_members')
      .select('user_id, role')
      .eq('workspace_id', workspaceId)
    if (membersErr) {
      await releaseClaim()
      return failResult('membros', membersErr)
    }
    const memberIds = adultosDaCarteira(memberRows ?? [])

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
}
