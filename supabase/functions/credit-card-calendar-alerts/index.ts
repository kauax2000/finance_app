import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { deliverNotification } from '../_shared/deliver-notification.ts'
import {
  compareYmd,
  diffCalendarDays,
  formatYmd,
  nextCloseAfter,
  nextPaymentDueOnOrAfter,
  statementCloseOnOrBefore,
  utcTodayYmd,
} from '../_shared/credit-card-cycle.ts'

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

type CardRow = {
  id: string
  workspace_id: string
  name: string
  last_four: string
  closing_day: number
  due_day: number
  is_active: boolean
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

  const today = utcTodayYmd()

  const { data: cards, error: cErr } = await admin
    .from('credit_cards')
    .select('id, workspace_id, name, last_four, closing_day, due_day, is_active')
    .eq('is_active', true)

  if (cErr) return json(500, { error: cErr.message })

  let notified = 0

  for (const raw of cards ?? []) {
    const card = raw as CardRow
    const closingDay = Number(card.closing_day)
    const dueDay = Number(card.due_day)
    if (!closingDay || closingDay < 1 || closingDay > 31 || !dueDay || dueDay < 1 || dueDay > 31) {
      continue
    }

    const lastClose = statementCloseOnOrBefore(today, closingDay)
    const nextClose = nextCloseAfter(lastClose, closingDay)
    const cardLabel = `${card.name} · ${card.last_four}`
    const href = `/credit-cards/${encodeURIComponent(card.id)}`

    type CalEvent = {
      dedupeKey: string
      kind: string
      title: string
      body: string
    }

    const events: CalEvent[] = []

    if (compareYmd(today, lastClose) === 0) {
      events.push({
        dedupeKey: `cal:closed:${formatYmd(today)}:c:${card.id}`,
        kind: 'cc_invoice_closed',
        title: 'Fatura fechou',
        body: `A fatura do cartão ${cardLabel} fecha hoje (${formatYmd(today).split('-').reverse().join('/')}).`,
      })
    }

    const daysToClose = diffCalendarDays(today, nextClose)
    if (daysToClose === 3) {
      events.push({
        dedupeKey: `cal:closing_soon:${formatYmd(nextClose)}:c:${card.id}`,
        kind: 'cc_invoice_closing_soon',
        title: 'Fatura fecha em breve',
        body: `Faltam 3 dias para o fechamento da fatura do cartão ${cardLabel} (fechamento em ${formatYmd(nextClose).split('-').reverse().join('/')}).`,
      })
    }

    let dueNext: ReturnType<typeof nextPaymentDueOnOrAfter>
    try {
      dueNext = nextPaymentDueOnOrAfter(today, closingDay, dueDay)
    } catch {
      continue
    }

    if (diffCalendarDays(today, dueNext) === 3) {
      events.push({
        dedupeKey: `cal:due_soon:${formatYmd(dueNext)}:c:${card.id}`,
        kind: 'cc_payment_due_soon',
        title: 'Vencimento da fatura se aproxima',
        body: `Faltam 3 dias para o vencimento estimado da fatura do cartão ${cardLabel} (${formatYmd(dueNext).split('-').reverse().join('/')}).`,
      })
    }

    if (compareYmd(today, dueNext) === 0) {
      events.push({
        dedupeKey: `cal:due_today:${formatYmd(dueNext)}:c:${card.id}`,
        kind: 'cc_payment_due_today',
        title: 'Vencimento da fatura hoje',
        body: `Hoje é o vencimento estimado da fatura do cartão ${cardLabel}.`,
      })
    }

    if (events.length === 0) continue

    const { data: members, error: mErr } = await admin
      .from('workspace_members')
      .select('user_id')
      .eq('workspace_id', card.workspace_id)

    if (mErr) return json(500, { error: mErr.message })

    for (const ev of events) {
      for (const m of members ?? []) {
        const userId = m.user_id as string

        const { data: prefs } = await admin
          .from('workspace_member_notification_prefs')
          .select('*')
          .eq('workspace_id', card.workspace_id)
          .eq('user_id', userId)
          .maybeSingle()

        const s = prefs ?? {
          notify_email: true,
          notify_in_app: true,
          notify_credit_card_calendar: true,
        }

        if (s.notify_credit_card_calendar === false) continue
        if (!s.notify_in_app && !s.notify_email && !(s as { notify_push?: boolean }).notify_push) {
          continue
        }

        const userDedupe = `${ev.dedupeKey}:u:${userId}`
        const claimed = await tryClaimDedupe(admin, card.workspace_id, card.id, userDedupe)
        if (!claimed) continue

        const { data: prof } = await admin
          .from('profiles')
          .select('email')
          .eq('id', userId)
          .maybeSingle()
        const email = (prof?.email as string | undefined)?.trim() || null

        const delivered = await deliverNotification({
          supabaseAdmin: admin,
          userId,
          userEmail: email,
          workspaceId: card.workspace_id,
          type: 'credit_card',
          title: ev.title,
          body: ev.body,
          metadata: {
            kind: ev.kind,
            credit_card_id: card.id,
            href,
          },
        })

        if (!delivered.ok) {
          console.error(delivered.error)
          continue
        }

        notified += 1
      }
    }
  }

  return json(200, { ok: true, notified, today: formatYmd(today) })
})
