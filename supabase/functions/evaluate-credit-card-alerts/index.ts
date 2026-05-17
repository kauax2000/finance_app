import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { bearerJwt, getAuthUserFromJwt } from '../_shared/auth-user.ts'
import { deliverNotification } from '../_shared/deliver-notification.ts'
import {
  filterRangeEndIso,
  filterRangeStartIso,
  formatYmd,
  isoPrefixYmd,
  openInvoiceWindow,
  type Ymd,
} from '../_shared/credit-card-cycle.ts'

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
  workspace_id: string
  payment_credit_card_id: string | null
  category_id: string | null
  occurred_at: string
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

function brl(n: number): string {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function pct(spend: number, limit: number): number {
  if (!limit) return 0
  return (spend / limit) * 100
}

type TxRow = {
  amount: string | number
  type: string
  date: string
  payment_method: string | null
  payment_credit_card_id: string | null
  category_id: string | null
}

function sumInOpenWindow(
  rows: TxRow[],
  cardId: string,
  win: { start: Ymd; end: Ymd },
  categoryId: string | null | undefined
): number {
  const startK = formatYmd(win.start)
  const endK = formatYmd(win.end)
  let sum = 0
  for (const t of rows) {
    if (t.type !== 'expense') continue
    if (t.payment_method !== 'credit_card') continue
    if (t.payment_credit_card_id !== cardId) continue
    const ymd = isoPrefixYmd(t.date)
    if (!ymd) continue
    const k = formatYmd(ymd)
    if (k < startK || k > endK) continue
    if (categoryId !== undefined) {
      const tid = t.category_id ?? null
      const want = categoryId ?? null
      if (tid !== want) continue
    }
    sum += Number(t.amount || 0)
  }
  return sum
}

async function tryClaimDedupe(
  admin: ReturnType<typeof createClient>,
  workspaceId: string,
  cardId: string,
  dedupeKey: string
): Promise<boolean> {
  const { error } = await admin.from('credit_card_notification_dedupe').insert({
    workspace_id: workspaceId,
    credit_card_id: cardId,
    dedupe_key: dedupeKey,
  })
  if (error?.code === '23505') return false
  if (error) throw new Error(error.message)
  return true
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
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

  const workspaceId = typeof body.workspace_id === 'string' ? body.workspace_id.trim() : ''
  const cardId =
    typeof body.payment_credit_card_id === 'string' ? body.payment_credit_card_id.trim() : ''
  if (!workspaceId || !cardId) {
    return json(200, { ok: true, skipped: true, reason: 'missing_workspace_or_card' })
  }

  const userId = authResult.user.id
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

  const { data: membership, error: memErr } = await supabaseAdmin
    .from('workspace_members')
    .select('user_id')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .maybeSingle()

  if (memErr) return json(500, { error: memErr.message })
  if (!membership) return json(403, { error: 'Not a member of this workspace' })

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
    notify_credit_cards: true,
  }

  if (s.notify_credit_cards === false) {
    return json(200, { ok: true, skipped: true, reason: 'credit_cards_disabled' })
  }

  const { data: card, error: cErr } = await supabaseAdmin
    .from('credit_cards')
    .select('id, workspace_id, name, last_four, closing_day, due_day, credit_limit, is_active')
    .eq('id', cardId)
    .maybeSingle()

  if (cErr) return json(500, { error: cErr.message })
  if (!card || card.workspace_id !== workspaceId || !card.is_active) {
    return json(200, { ok: true, skipped: true, reason: 'no_card' })
  }

  const refYmd = isoPrefixYmd(body.occurred_at)
  if (!refYmd) return json(400, { error: 'Invalid occurred_at' })

  const closingDay = Number(card.closing_day)
  if (!closingDay || closingDay < 1 || closingDay > 31) {
    return json(200, { ok: true, skipped: true, reason: 'bad_closing_day' })
  }

  const openWin = openInvoiceWindow(refYmd, closingDay)
  const periodKey = formatYmd(openWin.end)

  const { data: txRows, error: txErr } = await supabaseAdmin
    .from('transactions')
    .select('amount,type,date,payment_method,payment_credit_card_id,category_id')
    .eq('workspace_id', workspaceId)
    .eq('payment_credit_card_id', cardId)
    .eq('type', 'expense')
    .eq('payment_method', 'credit_card')
    .gte('date', filterRangeStartIso(openWin.start))
    .lte('date', filterRangeEndIso(openWin.end))

  if (txErr) return json(500, { error: txErr.message })

  const rows = (txRows ?? []) as TxRow[]
  const cardLabel = `${card.name} · ${card.last_four}`
  const href = `/credit-cards/${encodeURIComponent(cardId)}`

  const results: Record<string, unknown> = {}

  const notifyUser = async (title: string, msg: string, metadata: Record<string, unknown>) => {
    const result = await deliverNotification({
      supabaseAdmin,
      userId,
      userEmail: authResult.user.email,
      workspaceId,
      type: 'credit_card',
      title,
      body: msg,
      metadata: { ...metadata, href },
    })
    if (!result.ok) {
      throw new Error(result.error)
    }
    return {
      in_app: result.in_app,
      email: result.email,
      push: result.push,
    }
  }

  // —— Overall limit ——
  const limitNum = card.credit_limit != null ? Number(card.credit_limit) : 0
  if (limitNum > 0) {
    const spendTotal = sumInOpenWindow(rows, cardId, openWin, undefined)
    const p = pct(spendTotal, limitNum)
    const hitOver = spendTotal > limitNum
    const hit100 = spendTotal >= limitNum && !hitOver
    const hit80 = spendTotal >= limitNum * 0.8 && spendTotal < limitNum

    const tiers: Array<{
      key: '80' | '100' | 'over'
      hit: boolean
      kind: string
      title: string
      body: string
    }> = [
      {
        key: '80',
        hit: hit80,
        kind: 'cc_limit_warning',
        title: 'Cartão: perto do limite',
        body: `O cartão ${cardLabel} está com cerca de ${p.toFixed(0)}% do limite usado nesta fatura aberta (${brl(spendTotal)} de ${brl(limitNum)}).`,
      },
      {
        key: '100',
        hit: hit100,
        kind: 'cc_limit_reached',
        title: 'Cartão: limite atingido',
        body: `O cartão ${cardLabel} atingiu o limite nesta fatura aberta (${brl(spendTotal)} de ${brl(limitNum)}).`,
      },
      {
        key: 'over',
        hit: hitOver,
        kind: 'cc_limit_exceeded',
        title: 'Cartão: limite ultrapassado',
        body: `O cartão ${cardLabel} ultrapassou o limite nesta fatura aberta (${brl(spendTotal)} de ${brl(limitNum)}).`,
      },
    ]

    let chosen = null as (typeof tiers)[number] | null
    for (const t of tiers.slice().reverse()) {
      if (t.hit) {
        chosen = t
        break
      }
    }

    if (chosen) {
      const dedupeKey = `limit:${chosen.key}:${periodKey}`
      const claimed = await tryClaimDedupe(supabaseAdmin, workspaceId, cardId, dedupeKey)
      if (claimed) {
        results.limit = await notifyUser(chosen.title, chosen.body, {
          kind: chosen.kind,
          credit_card_id: cardId,
          percent: p,
          spend: spendTotal,
          limit: limitNum,
          period_end: periodKey,
        })
      } else {
        results.limit = { skipped: true, reason: 'deduped' }
      }
    }
  }

  // —— Category spend alerts ——
  const { data: alertRows, error: aErr } = await supabaseAdmin
    .from('credit_card_category_spend_alerts')
    .select('id, category_id, threshold_brl')
    .eq('credit_card_id', cardId)

  if (aErr) return json(500, { error: aErr.message })

  const categoryNames = new Map<string, string>()
  const catIds = new Set<string>()
  for (const a of alertRows ?? []) {
    if (a.category_id) catIds.add(a.category_id)
  }
  if (catIds.size > 0) {
    const { data: cats, error: catErr } = await supabaseAdmin
      .from('categories')
      .select('id,name')
      .in('id', [...catIds])
    if (catErr) return json(500, { error: catErr.message })
    for (const c of cats ?? []) {
      categoryNames.set(c.id, c.name)
    }
  }

  results.categories = []
  for (const alert of alertRows ?? []) {
    const threshold = Number(alert.threshold_brl)
    if (!threshold || threshold <= 0) continue

    const catKey = alert.category_id ?? null
    const spendCat = sumInOpenWindow(rows, cardId, openWin, catKey)
    if (spendCat < threshold) continue

    const dedupeKey = `cat:${alert.id}:${periodKey}`
    const claimed = await tryClaimDedupe(supabaseAdmin, workspaceId, cardId, dedupeKey)
    if (!claimed) {
      ;(results.categories as unknown[]).push({ alert_id: alert.id, skipped: true })
      continue
    }

    const catName = catKey ? (categoryNames.get(catKey) ?? 'Categoria') : 'Sem categoria'
    const title = 'Cartão: alerta por categoria'
    const body = `No cartão ${cardLabel}, a categoria "${catName}" passou do valor definido (${brl(spendCat)} ≥ ${brl(threshold)}) na fatura aberta.`

    const delivered = await notifyUser(title, body, {
      kind: 'cc_category_limit_crossed',
      credit_card_id: cardId,
      category_id: catKey,
      alert_id: alert.id,
      spend: spendCat,
      threshold,
      period_end: periodKey,
    })
    ;(results.categories as unknown[]).push({ alert_id: alert.id, delivered })
  }

  return json(200, { ok: true, results, periodKey })
})
