import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.99.3'
import { internalError } from '../_shared/http.ts'
import { FAN_OUT_CONCURRENCY, forEachLimit } from '../_shared/for-each-limit.ts'
import { secretMatches } from '../_shared/timing-safe-equal.ts'
import {
  deliverNotification,
  loadWorkspacePrefsMap,
} from '../_shared/deliver-notification.ts'
import type { SupabaseAdminClient } from '../_shared/supabase-admin.ts'
import {
  addCalendarDays,
  compareYmd,
  diffCalendarDays,
  formatYmd,
  isoPrefixYmd,
  appTodayYmd,
} from '../_shared/credit-card-cycle.ts'
import { billCopy, ddmm } from '../_shared/notification-copy.ts'
import { offsetDaJanela, overdueDedupeBucket, shouldSendOverdue } from '../_shared/notification-schedule.ts'
import { type Frequencia, vencimentosQueFaltam } from '../_shared/recorrencia-conta.ts'

// Server-to-server only (cron/scheduler): no CORS — browsers have no business
// probing this endpoint with the shared secret.
const corsHeaders = {} as Record<string, string>

const INSTANCE_PAGE_SIZE = 500
const BILL_PAGE_SIZE = 500

function json(status: number, payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

type BillRowMini = {
  id: string
  name: string
  amount_estimated: number | string | null
  reminder_days_before: number[] | null
  is_active: boolean
  end_date: string | null
}

type ContaRecorrente = {
  id: string
  user_id: string
  workspace_id: string
  frequency: Frequencia
  due_day_of_month: number
  end_date: string | null
  is_active: boolean
  bill_instances: Array<{ due_date: string }> | null
}

type NovaInstancia = {
  workspace_id: string
  user_id: string
  bill_id: string
  due_date: string
  status: 'pending'
  amount: null
}

type InstanceRow = {
  id: string
  workspace_id: string
  bill_id: string
  due_date: string
  amount: number | string | null
  bills: BillRowMini | BillRowMini[] | null
}

type DedupeRow = {
  workspace_id: string
  bill_instance_id: string
  reminder_offset_days: number
  user_id: string
  /** Fixo no vencimento (a vencer e atrasada), para a chave valer pela janela e não pelo dia. */
  sent_on: string
}

async function claimDedupe(admin: SupabaseAdminClient, row: DedupeRow): Promise<boolean> {
  const { error } = await admin.from('bill_notification_dedupe').insert(row)
  if (error?.code === '23505') return false
  if (error) throw new Error(error.message)
  return true
}

/** Compensation when delivery failed after the dedupe row was claimed. */
async function releaseDedupe(admin: SupabaseAdminClient, row: DedupeRow): Promise<void> {
  try {
    await admin
      .from('bill_notification_dedupe')
      .delete()
      .eq('workspace_id', row.workspace_id)
      .eq('bill_instance_id', row.bill_instance_id)
      .eq('reminder_offset_days', row.reminder_offset_days)
      .eq('user_id', row.user_id)
      .eq('sent_on', row.sent_on)
  } catch (e) {
    console.error('evaluate-bills-reminders: releaseDedupe failed:', e)
  }
}

type ReminderEvent = {
  instanceId: string
  billId: string
  billName: string
  dueStr: string
  offset: number
  /** Só na atrasada: os dias de atraso reais (o `offset` é o balde da dedupe). */
  daysOverdue?: number
  title: string
  body: string
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' })

  if (!secretMatches(Deno.env.get('CRON_SECRET'), req.headers.get('x-cron-secret'))) {
    return json(401, { error: 'Unauthorized' })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const admin = createClient(supabaseUrl, serviceKey)

  const today = appTodayYmd()
  const todayKey = formatYmd(today)
  /** Pending instances far in the future cannot trigger reminders yet; skip full-table scan. */
  const reminderHorizon = formatYmd(addCalendarDays(today, 120))

  const errors: Array<Record<string, unknown>> = []

  // 0. A conta que não é paga não para: cada conta ativa e recorrente ganha a
  //    pendência de cada vencimento que já chegou, a partir da última instância.
  //    O limite de 60 dias abaixo é do aviso, não da geração.
  let geradas = 0
  for (let page = 0; ; page++) {
    const from = page * BILL_PAGE_SIZE
    const { data: contas, error: bErr } = await admin
      .from('bills')
      .select('id, user_id, workspace_id, frequency, due_day_of_month, end_date, is_active, bill_instances(due_date)')
      .eq('is_active', true)
      .neq('frequency', 'one_time')
      .order('id', { ascending: true })
      .order('due_date', { referencedTable: 'bill_instances', ascending: false })
      .limit(1, { referencedTable: 'bill_instances' })
      .range(from, from + BILL_PAGE_SIZE - 1)
    if (bErr) {
      console.error('evaluate-bills-reminders: passo 0:', bErr.message)
      errors.push({ step: 'gerar', error: bErr.message })
      break
    }

    const lote = (contas ?? []) as ContaRecorrente[]
    const porConta = new Map<string, NovaInstancia[]>()
    for (const conta of lote) {
      const ultima = conta.bill_instances?.[0]?.due_date
      if (!ultima) continue
      try {
        const linhas = vencimentosQueFaltam(conta, ultima.slice(0, 10), todayKey).map((due_date): NovaInstancia => ({
          workspace_id: conta.workspace_id,
          user_id: conta.user_id,
          bill_id: conta.id,
          due_date,
          status: 'pending',
          amount: null,
        }))
        if (linhas.length > 0) porConta.set(conta.id, linhas)
      } catch (e) {
        errors.push({ step: 'gerar', bill_id: conta.id, error: e instanceof Error ? e.message : 'gerar_failed' })
      }
    }

    const inserir = async (linhas: NovaInstancia[]) => {
      const { data, error } = await admin
        .from('bill_instances')
        .upsert(linhas, { onConflict: 'bill_id,due_date', ignoreDuplicates: true })
        .select('id')
      if (error) throw new Error(error.message)
      geradas += data?.length ?? 0
    }
    if (porConta.size > 0) {
      try {
        await inserir([...porConta.values()].flat())
      } catch {
        // O lote caiu: uma conta por vez, para a falha de uma não levar as outras.
        for (const [billId, linhas] of porConta) {
          try {
            await inserir(linhas)
          } catch (e) {
            console.error('evaluate-bills-reminders: passo 0, conta', billId, e)
            errors.push({ step: 'gerar', bill_id: billId, error: e instanceof Error ? e.message : 'insert_failed' })
          }
        }
      }
    }

    if (lote.length < BILL_PAGE_SIZE) break
  }

  // 1. Paginated scan of pending instances; compute reminder events per workspace.
  const eventsByWorkspace = new Map<string, ReminderEvent[]>()
  let instancesScanned = 0

  for (let page = 0; ; page++) {
    const from = page * INSTANCE_PAGE_SIZE
    const { data: instances, error: iErr } = await admin
      .from('bill_instances')
      .select(`
        id,
        workspace_id,
        bill_id,
        due_date,
        amount,
        status,
        bills(id, name, amount_estimated, reminder_days_before, is_active, end_date)
      `)
      .eq('status', 'pending')
      .lte('due_date', reminderHorizon)
      .order('id', { ascending: true })
      .range(from, from + INSTANCE_PAGE_SIZE - 1)

    if (iErr) return json(500, { error: internalError('evaluate-bills-reminders', iErr) })

    const batch = (instances ?? []) as InstanceRow[]
    instancesScanned += batch.length

    for (const raw of batch) {
      const dueStr = typeof raw.due_date === 'string' ? raw.due_date.slice(0, 10) : ''
      const dueY = isoPrefixYmd(`${dueStr}T12:00:00.000Z`)
      if (!dueY) continue

      const daysUntil = diffCalendarDays(today, dueY)
      const isPast = compareYmd(dueY, today) < 0
      // Conta esquecida há mais de 60 dias deixa de gerar aviso.
      if (isPast && daysUntil < -60) continue
      const bEmbed = raw.bills
      const billMini = Array.isArray(bEmbed) ? (bEmbed[0] ?? null) : bEmbed
      if (!billMini || !billMini.is_active) continue
      // O fim encerra: a instância depois do `end_date` não avisa.
      if (billMini.end_date && dueStr > billMini.end_date.slice(0, 10)) continue

      const configured = Array.isArray(billMini.reminder_days_before)
        ? billMini.reminder_days_before
        : [3, 0]

      // A atrasada avisa no 1º dia e a cada 7 dias (tolerando um dia perdido);
      // cada janela de 7 dias é um `reminder_offset_days` próprio (-1, -2, …).
      // A vencer avisa o menor offset da janela (`0 <= dias <= o`), então um dia
      // sem cron não perde o aviso. Nos dois, o `sent_on` fica no vencimento: a
      // chave da dedupe vale entre os dias, e cada offset sai uma vez só.
      const overdueDays = -daysUntil
      const offset = isPast
        ? shouldSendOverdue(overdueDays)
          ? -1 - overdueDedupeBucket(overdueDays)
          : null
        : offsetDaJanela(configured, daysUntil)
      if (offset == null) continue

      const rawAmount = raw.amount ?? billMini.amount_estimated
      const valor = rawAmount != null && rawAmount !== '' ? Number(rawAmount) : null
      const { title, body } = billCopy({ conta: billMini.name, valor, data: ddmm(dueStr), dias: daysUntil })
      const list = eventsByWorkspace.get(raw.workspace_id) ?? []
      list.push({
        instanceId: raw.id,
        billId: billMini.id,
        billName: billMini.name,
        dueStr,
        offset,
        daysOverdue: isPast ? overdueDays : undefined,
        title,
        body,
      })
      eventsByWorkspace.set(raw.workspace_id, list)
    }

    if (batch.length < INSTANCE_PAGE_SIZE) break
  }

  // 2. Per workspace: members + prefs + emails loaded ONCE; per-item failures
  //    accumulate instead of aborting the daily run.
  let notified = 0

  await forEachLimit(eventsByWorkspace, FAN_OUT_CONCURRENCY, async ([workspaceId, events]) => {
    try {
      const { data: memberRows, error: mErr } = await admin
        .from('workspace_members')
        .select('user_id')
        .eq('workspace_id', workspaceId)
      if (mErr) throw new Error(mErr.message)

      const memberIds = (memberRows ?? []).map((m: { user_id: string }) => m.user_id)
      if (memberIds.length === 0) return

      const prefsMap = await loadWorkspacePrefsMap(admin, workspaceId, memberIds)

      const emails = new Map<string, string | null>()
      const { data: profRows, error: pErr } = await admin
        .from('profiles')
        .select('id,email')
        .in('id', memberIds)
      if (pErr) throw new Error(pErr.message)
      for (const p of profRows ?? []) {
        emails.set(p.id as string, ((p.email as string | null) ?? '').trim() || null)
      }

      for (const ev of events) {
        for (const userId of memberIds) {
          const prefs = prefsMap.get(userId)
          if (!prefs || prefs.notify_bills === false) continue
          if (!prefs.notify_in_app && !prefs.notify_email && !prefs.notify_push) continue

          const dedupeRow: DedupeRow = {
            workspace_id: workspaceId,
            bill_instance_id: ev.instanceId,
            reminder_offset_days: ev.offset,
            user_id: userId,
            sent_on: ev.dueStr,
          }

          try {
            const claimed = await claimDedupe(admin, dedupeRow)
            if (!claimed) continue

            const delivered = await deliverNotification({
              supabaseAdmin: admin,
              userId,
              userEmail: emails.get(userId) ?? null,
              workspaceId,
              type: 'bill',
              title: ev.title,
              body: ev.body,
              metadata: {
                kind: 'bill_reminder',
                bill_id: ev.billId,
                bill_instance_id: ev.instanceId,
                due_date: ev.dueStr,
                // `offset_days` é o balde da dedupe (`-1 - balde` na atrasada): o app só lê o
                // sinal (`< 0`, o tom). Os dias de atraso de verdade são `days_overdue`.
                offset_days: ev.offset,
                ...(ev.daysOverdue != null ? { days_overdue: ev.daysOverdue } : {}),
                href: '/bills',
              },
              prefs,
            })

            if (!delivered.ok) {
              await releaseDedupe(admin, dedupeRow)
              errors.push({ workspace_id: workspaceId, user_id: userId, error: delivered.error })
              continue
            }
            notified += 1
          } catch (e) {
            await releaseDedupe(admin, dedupeRow)
            const msg = e instanceof Error ? e.message : 'delivery_failed'
            console.error('evaluate-bills-reminders:', msg)
            errors.push({ workspace_id: workspaceId, user_id: userId, error: msg })
          }
        }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'workspace_failed'
      console.error('evaluate-bills-reminders: workspace', workspaceId, msg)
      errors.push({ workspace_id: workspaceId, error: msg })
    }
  })

  return json(200, {
    ok: true,
    notified,
    geradas,
    instances_scanned: instancesScanned,
    workspaces: eventsByWorkspace.size,
    errors: errors.length > 0 ? errors : undefined,
    today: todayKey,
  })
})
