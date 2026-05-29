"use client"

import { useCallback, useEffect, useMemo, useRef, useState, startTransition } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/components/providers"
import { useWorkspace } from "@/components/workspace-provider"
import {
    type Category,
    type Transaction,
    type WorkspaceSubscription,
} from "@/lib/supabase"
import type { CcTxRow } from "@/lib/credit-cards-workspace-transactions"
import { toastError } from "@/lib/toast"
import {
    filterRangeEndIso,
    filterRangeStartIso,
    transactionCalendarParts,
} from "@/lib/transaction-date"
import { buildCardMonthlyInvoiceSnapshot } from "@/lib/credit-card-billing"
import {
    aggregateIncomeExpenseForMonth,
    buildCreditCardClosingLookup,
    transactionCountsInExpenseMonth,
} from "@/lib/expense-month-attribution"
import { findInstallmentPlansEndingSoon } from "@/lib/credit-card-invoice-analytics"
import {
    periodBoundsFromYearMonth,
    formatYearMonth,
    shiftYearMonth,
} from "@/lib/budget-month"
import {
    getDashboardPresetRange,
    toIsoLocalYmd,
    type DashboardDatePresetKey,
    isDashboardPresetKey,
} from "@/components/dashboard/dashboard-date-presets"
import {
    buildPaymentEventsForMonth,
    buildUpcomingPaymentsForVisibleMonth,
} from "@/components/dashboard/payment-events"
import { formatSupabasePostgrestError } from "@/lib/supabase-errors"
import { invalidateWorkspaceData } from "@/lib/queries/invalidate-workspace-data"
import { fetchPendingBillInstancesForDashboard } from "@/lib/queries/fetch-bills-dashboard"
import { useCategoriesQuery } from "@/lib/queries/use-categories"
import { useCreditCardExpenseRowsQuery } from "@/lib/queries/use-credit-card-expense-rows"
import { useCreditCardsQuery } from "@/lib/queries/use-credit-cards"
import { useInstallmentPlansQuery } from "@/lib/queries/use-installment-plans"
import { useMemberDirectoryQuery } from "@/lib/queries/use-member-directory"
import { useSubscriptionsQuery } from "@/lib/queries/use-subscriptions"
import {
    useTransactionsRangeQuery,
} from "@/lib/queries/use-transactions-range"
import { useTransactionsWorkspaceAuxQuery } from "@/lib/queries/use-transactions-workspace-aux-query"
import { useRecurringBillingCatchup } from "@/lib/queries/use-recurring-billing-catchup"
import type { TransactionsRangeKey } from "@/lib/queries/keys"
import { attachPaymentCards } from "@/lib/transactions-detail-sheet-query"

/** Max rows in dashboard recent transactions (mobile list + desktop table). */
const DASHBOARD_RECENT_TRANSACTIONS_LIMIT = 15

function ymFromFullCalendarMonth(from: string, to: string): string | null {
    const ym = from.slice(0, 7)
    if (!/^\d{4}-\d{2}$/.test(ym)) return null
    try {
        const bounds = periodBoundsFromYearMonth(ym)
        if (from === bounds.period_start && to === bounds.period_end) return ym
    } catch {
        return null
    }
    return null
}

/** Dashboard URL: `month=` wins; else full-month `from`/`to`; else legacy `preset`. */
function readInitialYm(sp: URLSearchParams): string {
    const monthParam = sp.get("month")
    if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
        const [ys, ms] = monthParam.split("-")
        const y = Number(ys)
        const m = Number(ms)
        if (Number.isFinite(y) && m >= 1 && m <= 12) {
            return `${y}-${String(m).padStart(2, "0")}`
        }
    }
    const from = sp.get("from")
    const to = sp.get("to")
    if (
        from &&
        to &&
        /^\d{4}-\d{2}-\d{2}$/.test(from) &&
        /^\d{4}-\d{2}-\d{2}$/.test(to)
    ) {
        const ym = ymFromFullCalendarMonth(from, to)
        if (ym) return ym
    }
    const presetRaw = sp.get("preset")
    if (isDashboardPresetKey(presetRaw)) {
        if (presetRaw === "thisMonth") return formatYearMonth(new Date())
        if (presetRaw === "prevMonth") {
            return shiftYearMonth(formatYearMonth(new Date()), -1)
        }
        const r = getDashboardPresetRange(presetRaw)
        const ymGuess = ymFromFullCalendarMonth(r.from, r.to)
        if (ymGuess) return ymGuess
    }
    return formatYearMonth(new Date())
}

function paddedCalendarIsoRange(calendarYm: string): TransactionsRangeKey {
    const { period_start, period_end } = periodBoundsFromYearMonth(calendarYm)
    const prevCalYm = shiftYearMonth(calendarYm, -1)
    const nextCalYm = shiftYearMonth(calendarYm, 1)
    const calPadStart = periodBoundsFromYearMonth(prevCalYm).period_start
    const calPadEnd = periodBoundsFromYearMonth(nextCalYm).period_end
    const txFrom = minYmd(period_start, calPadStart)
    const txTo = maxYmd(period_end, calPadEnd)
    return {
        from: filterRangeStartIso(txFrom),
        to: filterRangeEndIso(txTo),
    }
}

function attachCategoriesToSubscriptions(
    subs: WorkspaceSubscription[],
    categories: Category[],
): WorkspaceSubscription[] {
    const byId = new Map(categories.map((c) => [c.id, c]))
    return subs.map((s) => ({
        ...s,
        category: s.category_id ? byId.get(s.category_id) ?? null : null,
    })) as WorkspaceSubscription[]
}

function minYmd(a: string, b: string) {
    return a.localeCompare(b) <= 0 ? a : b
}

function maxYmd(a: string, b: string) {
    return a.localeCompare(b) >= 0 ? a : b
}

function transactionYmd(t: Transaction): string | null {
    const p = transactionCalendarParts(t.date)
    if (!p) return null
    return `${p.y}-${String(p.mo).padStart(2, "0")}-${String(p.d).padStart(2, "0")}`
}

function subscriptionPostedKey(t: Transaction): string | null {
    if (t.type !== "expense") return null
    const sid = t.subscription_id
    if (!sid) return null
    const ymd = transactionYmd(t)
    if (!ymd) return null
    return `${sid}:${ymd}`
}

/** Resolved row from `workspace_member_directory` for dashboard attribution. */
export type WorkspaceMemberDirectoryEntry = {
    full_name: string | null
    email: string
    avatar_url: string | null
    avatar_color: string | null
}

function fallbackDirectoryEntryForUser(user: {
    id: string
    email?: string | null
    user_metadata?: Record<string, unknown> | null
}): WorkspaceMemberDirectoryEntry {
    const metaName = user.user_metadata?.full_name
    const fullName =
        typeof metaName === "string" && metaName.trim() !== ""
            ? metaName.trim()
            : null
    return {
        full_name: fullName,
        email: user.email ?? "",
        avatar_url: null,
        avatar_color: null,
    }
}

export function useDashboardData() {
    const queryClient = useQueryClient()
    const { user, loading: authLoading } = useAuth()
    const {
        currentWorkspaceId,
        loading: workspaceLoading,
        error: workspaceError,
    } = useWorkspace()
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const [calendarYm, setCalendarYmState] = useState(() =>
        formatYearMonth(new Date()),
    )

    useEffect(() => {
        const ym = readInitialYm(searchParams)
        // eslint-disable-next-line react-hooks/set-state-in-effect -- sync month from URL search params
        setCalendarYmState((prev) => (prev === ym ? prev : ym))
    }, [searchParams])

    const replaceUrlForMonth = useCallback(
        (ym: string) => {
            const { period_start, period_end } = periodBoundsFromYearMonth(ym)
            const nowYm = formatYearMonth(new Date())
            const preset: DashboardDatePresetKey =
                ym === nowYm ? "thisMonth" : "custom"
            const p = new URLSearchParams()
            p.set("month", ym)
            p.set("from", period_start)
            p.set("to", period_end)
            p.set("preset", preset)
            router.replace(`${pathname}?${p.toString()}`, { scroll: false })
        },
        [pathname, router],
    )

    const setCalendarYm = useCallback(
        (ym: string) => {
            setCalendarYmState(ym)
            replaceUrlForMonth(ym)
        },
        [replaceUrlForMonth],
    )

    const range = useMemo(() => {
        const { period_start, period_end } =
            periodBoundsFromYearMonth(calendarYm)
        const nowYm = formatYearMonth(new Date())
        const preset: DashboardDatePresetKey =
            calendarYm === nowYm ? "thisMonth" : "custom"
        return { from: period_start, to: period_end, preset }
    }, [calendarYm])

    const todayYmd = useMemo(() => toIsoLocalYmd(new Date()), [])

    const paddedTxIsoRange = useMemo(
        (): TransactionsRangeKey => paddedCalendarIsoRange(calendarYm),
        [calendarYm],
    )

    const prevCalendarYm = useMemo(
        () => shiftYearMonth(calendarYm, -1),
        [calendarYm],
    )

    const prevPaddedTxIsoRange = useMemo(
        (): TransactionsRangeKey => paddedCalendarIsoRange(prevCalendarYm),
        [prevCalendarYm],
    )

    const queriesEnabled =
        Boolean(user?.id && currentWorkspaceId) &&
        !authLoading &&
        !workspaceLoading

    const txQuery = useTransactionsRangeQuery(
        currentWorkspaceId,
        paddedTxIsoRange,
        { enabled: queriesEnabled },
    )

    const prevTxQuery = useTransactionsRangeQuery(
        currentWorkspaceId,
        prevPaddedTxIsoRange,
        { enabled: queriesEnabled },
    )

    const categoriesQuery = useCategoriesQuery(
        queriesEnabled ? currentWorkspaceId : null,
    )
    const creditCardsQuery = useCreditCardsQuery(
        queriesEnabled ? currentWorkspaceId : null,
    )
    const subscriptionsRawQuery = useSubscriptionsQuery(
        queriesEnabled ? currentWorkspaceId : null,
    )
    const installmentPlansQuery = useInstallmentPlansQuery(
        queriesEnabled ? currentWorkspaceId : null,
    )
    const ccRowsQuery = useCreditCardExpenseRowsQuery(
        queriesEnabled ? currentWorkspaceId : null,
    )
    const memberDirQuery = useMemberDirectoryQuery(
        queriesEnabled ? currentWorkspaceId : null,
    )
    const workspaceAuxQuery = useTransactionsWorkspaceAuxQuery(
        queriesEnabled ? currentWorkspaceId : null,
        queriesEnabled,
    )

    useRecurringBillingCatchup(currentWorkspaceId, queriesEnabled)

    const pendingBillsDashboardQuery = useQuery({
        queryKey: ["dashboardPendingBills", currentWorkspaceId],
        queryFn: async () => {
            const { rows } = await fetchPendingBillInstancesForDashboard(
                currentWorkspaceId!,
            )
            return rows
        },
        enabled: queriesEnabled && Boolean(currentWorkspaceId),
        staleTime: 45_000,
    })

    const categories = categoriesQuery.data ?? []
    const txRowsRaw = txQuery.data ?? []
    const transactionsWide = useMemo(() => {
        const byId = new Map(categories.map((c) => [c.id, c]))
        return txRowsRaw.map((t) => ({
            ...t,
            category: t.category_id ? byId.get(t.category_id) : undefined,
        })) as Transaction[]
    }, [txRowsRaw, categories])
    const prevTransactions = useMemo(() => prevTxQuery.data ?? [], [prevTxQuery.data])
    const creditCards = creditCardsQuery.data ?? []
    const creditCardClosingLookup = useMemo(
        () => buildCreditCardClosingLookup(creditCards),
        [creditCards],
    )
    const subscriptions = useMemo(
        () =>
            attachCategoriesToSubscriptions(
                subscriptionsRawQuery.data ?? [],
                categories,
            ),
        [subscriptionsRawQuery.data, categories],
    )
    const installmentPlans = installmentPlansQuery.data ?? []
    const ccRows: CcTxRow[] = ccRowsQuery.data ?? []

    const invoicePaymentsFromQuery =
        workspaceAuxQuery.data?.invoicePayments ?? []
    const invoicePaidByCardClose = useMemo(() => {
        const next = new Set<string>()
        for (const p of invoicePaymentsFromQuery) {
            if (p.status === "paid") {
                next.add(`${p.credit_card_id}:${p.statement_close_date}`)
            }
        }
        return next
    }, [invoicePaymentsFromQuery])

    const memberDirectoryByUserId = useMemo(() => {
        if (!user?.id) return {}
        if (memberDirQuery.isPending && !memberDirQuery.data) {
            return { [user.id]: fallbackDirectoryEntryForUser(user) }
        }
        const rows = memberDirQuery.data
        if (!rows || memberDirQuery.isError) {
            return { [user.id]: fallbackDirectoryEntryForUser(user) }
        }
        const nextDir: Record<string, WorkspaceMemberDirectoryEntry> = {}
        for (const row of rows) {
            nextDir[row.user_id] = {
                full_name: row.full_name,
                email: row.email ?? "",
                avatar_url: row.avatar_url ?? null,
                avatar_color: row.avatar_color ?? null,
            }
        }
        if (!nextDir[user.id]) {
            nextDir[user.id] = fallbackDirectoryEntryForUser(user)
        }
        return nextDir
    }, [memberDirQuery.data, memberDirQuery.isError, user])

    const coreQueriesPending =
        queriesEnabled &&
        (txQuery.isPending ||
            categoriesQuery.isPending ||
            creditCardsQuery.isPending ||
            prevTxQuery.isPending)

    const [loadingTimedOut, setLoadingTimedOut] = useState(false)
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    useEffect(() => {
        if (!queriesEnabled || !coreQueriesPending) {
            if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null }
            return
        }
        if (timerRef.current) return
        timerRef.current = setTimeout(() => {
            startTransition(() => setLoadingTimedOut(true))
        }, 8_000)
        return () => {
            if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null }
        }
    }, [queriesEnabled, coreQueriesPending])

    const loading =
        authLoading ||
        workspaceLoading ||
        (coreQueriesPending && !loadingTimedOut)

    const hadTxDataRef = useRef(false)
    useEffect(() => {
        if (transactionsWide.length > 0) hadTxDataRef.current = true
    }, [transactionsWide])

    useEffect(() => {
        if (!queriesEnabled) return
        if (!txQuery.isError) return
        if (!hadTxDataRef.current) return
        toastError(
            txQuery.error instanceof Error
                ? txQuery.error.message
                : formatSupabasePostgrestError(txQuery.error) ??
                      "Não foi possível atualizar o painel. Mostrando a última versão carregada.",
        )
    }, [queriesEnabled, txQuery.isError, txQuery.error])

    const refetchDashboard = useCallback(async () => {
        if (!currentWorkspaceId) return
        await invalidateWorkspaceData(queryClient, currentWorkspaceId, {
            domains: ["all"],
        })
    }, [currentWorkspaceId, queryClient])

    const transactionsInRange = useMemo(() => {
        return transactionsWide.filter((t) =>
            transactionCountsInExpenseMonth(t, calendarYm, creditCardClosingLookup),
        )
    }, [transactionsWide, calendarYm, creditCardClosingLookup])

    const snapshots = useMemo(() => {
        const today = new Date()
        const map = new Map<
            string,
            ReturnType<typeof buildCardMonthlyInvoiceSnapshot>
        >()
        for (const c of creditCards) {
            map.set(
                c.id,
                buildCardMonthlyInvoiceSnapshot(c, ccRows, calendarYm, today, {
                    installmentPlans,
                }),
            )
        }
        return map
    }, [creditCards, ccRows, installmentPlans, calendarYm])

    const totalOpenInvoices = useMemo(() => {
        let t = 0
        for (const c of creditCards) {
            if (!c.is_active) continue
            const snap = snapshots.get(c.id)
            if (snap) t += Number(snap.committedTotal)
        }
        return t
    }, [creditCards, snapshots])

    const kpiCurrent = useMemo(
        () =>
            aggregateIncomeExpenseForMonth(
                transactionsWide,
                calendarYm,
                creditCardClosingLookup,
            ),
        [transactionsWide, calendarYm, creditCardClosingLookup],
    )
    const kpiPrev = useMemo(
        () =>
            aggregateIncomeExpenseForMonth(
                prevTransactions,
                prevCalendarYm,
                creditCardClosingLookup,
            ),
        [prevTransactions, prevCalendarYm, creditCardClosingLookup],
    )

    const expenseByCategory = useMemo(() => {
        const spendById = new Map<string, number>()
        for (const t of transactionsInRange) {
            if (t.type !== "expense") continue
            const id = t.category_id ?? "__none__"
            spendById.set(id, (spendById.get(id) ?? 0) + Number(t.amount))
        }

        const fallbackColor = "#8884d8"
        const expenseCats = categories.filter((c) => c.type === "expense")

        const rows: { id: string; name: string; value: number; color: string }[] =
            expenseCats.map((c) => ({
                id: c.id,
                name: c.name,
                value: spendById.get(c.id) ?? 0,
                color: c.color ?? fallbackColor,
            }))

        rows.push({
            id: "__none__",
            name: "Sem categoria",
            value: spendById.get("__none__") ?? 0,
            color: fallbackColor,
        })

        rows.sort((a, b) => {
            if (b.value !== a.value) return b.value - a.value
            return a.name.localeCompare(b.name, "pt-BR")
        })

        return rows
    }, [transactionsInRange, categories])

    const pendingBillRows = pendingBillsDashboardQuery.data ?? []

    const paymentArgs = useMemo(
        () => ({
            todayYmd,
            subscriptions,
            installmentPlans,
            creditCards,
            transactions: transactionsWide,
            pendingBillInstances: pendingBillRows,
        }),
        [
            todayYmd,
            subscriptions,
            installmentPlans,
            creditCards,
            transactionsWide,
            pendingBillRows,
        ],
    )

    const calendarEvents = useMemo(
        () => buildPaymentEventsForMonth(calendarYm, paymentArgs),
        [calendarYm, paymentArgs],
    )

    const plannedExpenseDelta = useMemo(() => {
        const postedBySubscriptionDay = new Set<string>()
        for (const t of transactionsWide) {
            const key = subscriptionPostedKey(t)
            if (key) postedBySubscriptionDay.add(key)
        }

        let delta = 0
        for (const e of calendarEvents) {
            if (e.amount == null) continue
            if (e.kind === "installment") {
                delta += Number(e.amount)
                continue
            }
            if (e.kind === "bill_due") {
                delta += Number(e.amount)
                continue
            }
            if (e.kind === "subscription") {
                const sid = e.metaId
                if (sid && postedBySubscriptionDay.has(`${sid}:${e.dateYmd}`)) {
                    continue
                }
                delta += Number(e.amount)
            }
        }
        return delta
    }, [calendarEvents, transactionsWide])

    const kpiPlanned = useMemo(() => {
        const expense = kpiCurrent.expense + plannedExpenseDelta
        return {
            ...kpiCurrent,
            expense,
            net: kpiCurrent.income - expense,
        }
    }, [kpiCurrent, plannedExpenseDelta])

    const upcomingPayments = useMemo(
        () => buildUpcomingPaymentsForVisibleMonth(calendarEvents, todayYmd),
        [calendarEvents, todayYmd],
    )

    const calendarSummary = useMemo(() => {
        let projected = 0
        let closings = 0
        for (const e of calendarEvents) {
            if (
                e.kind === "subscription" ||
                e.kind === "installment" ||
                e.kind === "bill_due"
            ) {
                projected += e.amount ?? 0
            }
            if (e.kind === "card_close") closings += 1
        }
        let paid = 0
        for (const e of calendarEvents) {
            if (e.kind === "posted_expense") paid += e.amount ?? 0
        }
        return { projected, paid, closings }
    }, [calendarEvents])

    const installmentsEndingSoon = useMemo(
        () => findInstallmentPlansEndingSoon(installmentPlans),
        [installmentPlans],
    )

    const recentTransactions = useMemo(() => {
        const sorted = [...transactionsInRange].sort((a, b) =>
            b.date.localeCompare(a.date),
        )
        const sliced = sorted.slice(0, DASHBOARD_RECENT_TRANSACTIONS_LIMIT)
        return attachPaymentCards(sliced, creditCards)
    }, [transactionsInRange, creditCards])

    return {
        todayYmd,
        user,
        authLoading,
        currentWorkspaceId,
        workspaceLoading,
        workspaceError,
        loading,
        range,
        calendarYm,
        setCalendarYm,
        transactionsInRange,
        subscriptions,
        installmentPlans,
        creditCards,
        categories,
        snapshots,
        totalOpenInvoices,
        kpiCurrent,
        kpiPrev,
        kpiPlanned,
        expenseByCategory,
        calendarEvents,
        calendarSummary,
        upcomingPayments,
        installmentsEndingSoon,
        recentTransactions,
        memberDirectoryByUserId,
        invoicePaidByCardClose,
        refetch: refetchDashboard,
    }
}
