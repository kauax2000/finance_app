import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { deliverNotification } from '../_shared/deliver-notification.ts'
import {
  addCalendarDays,
  compareYmd,
  diffCalendarDays,
  formatYmd,
  isoPrefixYmd,
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
  billsUrl: string
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
        <div style="margin-top:16px;display:flex;gap:8px;flex-wrap:wrap;">
          <a href="${args.billsUrl}" style="display:inline-block;padding:10px 12px;border-radius:10px;background:rgba(255,255,255,.14);color:#fff;text-decoration:none;font-size:13px;">Ver contas</a>
          <a href="${args.settingsUrl}" style="display:inline-block;padding:10px 12px;border-radius:10px;background:rgba(255,255,255,.10);color:#fff;text-decoration:none;font-size:13px;">Preferências</a>
        </div>
      </div>
    </div>
  </body>
</html>`
}

type BillRowMini = {
  id: string
  name: string
  reminder_days_before: number[] | null
  is_active: boolean
}

type InstanceRow = {
  id: string
  workspace_id: string
  bill_id: string
  due_date: string
  bills: BillRowMini | BillRowMini[] | null
}

async function claimDedupe(
  admin: ReturnType<typeof createClient>,
  row: {
    workspace_id: string
    bill_instance_id: string
    reminder_offset_days: number
    user_id: string
  }
): Promise<boolean> {
  const { error } = await admin.from('bill_notification_dedupe').insert(row)
  if (error?.code === '23505') return false
  if (error) throw new Error(error.message)
  return true
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' })

  const secret = Deno.env.get('CRON_SECRET')?.trim()
  const hdr = req.headers.get('x-cron-secret')?.trim()
  if (!secret || hdr !== secret) return json(401, { error: 'Unauthorized' })

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const admin = createClient(supabaseUrl, serviceKey)

  const today = utcTodayYmd()
  const todayKey = formatYmd(today)
  /** Pending instances far in the future cannot trigger reminders yet; skip full-table scan. */
  const reminderHorizon = formatYmd(addCalendarDays(today, 120))

  const appBase = Deno.env.get('APP_BASE_URL')?.trim() || ''
  const billsUrlRoot = appBase ? `${appBase.replace(/\/$/, '')}/bills` : '/bills'

  const { data: instances, error: iErr } = await admin.from('bill_instances').select(`
      id,
      workspace_id,
      bill_id,
      due_date,
      status,
      bills(id, name, reminder_days_before, is_active)
    `)
    .eq('status', 'pending')
    .lte('due_date', reminderHorizon)

  if (iErr) return json(500, { error: iErr.message })

  let notified = 0

  for (const raw of (instances ?? []) as InstanceRow[]) {
    const dueStr = typeof raw.due_date === 'string' ? raw.due_date.slice(0, 10) : ''
    const dueY = isoPrefixYmd(`${dueStr}T12:00:00.000Z`)
    if (!dueY) continue

    const daysUntil = diffCalendarDays(today, dueY)
    const isPast = compareYmd(dueY, today) < 0
    let billMini: BillRowMini | null = null
    const bEmbed = raw.bills
    if (Array.isArray(bEmbed)) billMini = bEmbed[0] ?? null
    else billMini = bEmbed

    if (!billMini || !billMini.is_active) continue

    const configured = Array.isArray(billMini.reminder_days_before)
      ? billMini.reminder_days_before
      : [3, 0]

    /** Pre-due/day-of offsets; overdue uses fixed -1 dedupe/day */
    let hitOffsets: number[] = []
    if (isPast) {
      hitOffsets = [-1]
    } else {
      hitOffsets = [...new Set(configured)].filter((o) => o === daysUntil)
    }
    if (hitOffsets.length === 0) continue

    const { data: members, error: mErr } = await admin
      .from('workspace_members')
      .select('user_id')
      .eq('workspace_id', raw.workspace_id)
    if (mErr) return json(500, { error: mErr.message })

    for (const offset of hitOffsets) {
      const prettyDue = dueStr.split('-').reverse().join('/')
      let title: string
      let msg: string
      if (offset === -1) {
        title = `Conta atrasada · ${billMini.name}`
        msg = `“${billMini.name}” estava prevista para ${prettyDue}. Registre o pagamento com o valor real.`
      } else if (offset === 0) {
        title = `Conta vence hoje · ${billMini.name}`
        msg = `“${billMini.name}” vence hoje (${prettyDue}).`
      } else {
        title = `Conta a pagar · ${billMini.name}`
        msg = `“${billMini.name}” vence em ${prettyDue}. Faltam ${offset} dia(s).`
      }

      for (const mem of members ?? []) {
        const userId = mem.user_id as string

        const { data: prefs } = await admin
          .from('workspace_member_notification_prefs')
          .select('*')
          .eq('workspace_id', raw.workspace_id)
          .eq('user_id', userId)
          .maybeSingle()

        const s = prefs ?? {
          notify_email: true,
          notify_in_app: true,
          notify_bills: true,
        }

        if ((s as { notify_bills?: boolean }).notify_bills === false) continue
        if (!s.notify_in_app && !s.notify_email && !(s as { notify_push?: boolean }).notify_push) {
          continue
        }

        const claimed = await claimDedupe(admin, {
          workspace_id: raw.workspace_id,
          bill_instance_id: raw.id,
          reminder_offset_days: offset,
          user_id: userId,
        })

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
          workspaceId: raw.workspace_id,
          type: 'bill',
          title,
          body: msg,
          metadata: {
            kind: 'bill_reminder',
            bill_id: billMini.id,
            bill_instance_id: raw.id,
            due_date: dueStr,
            offset_days: offset,
            href: '/bills',
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

  return json(200, { ok: true, notified, today: todayKey })
})
