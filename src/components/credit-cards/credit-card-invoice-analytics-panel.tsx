"use client"

import { useCallback, useMemo, useState, type ReactNode } from "react"
import { useQueryClient } from "@tanstack/react-query"
import {
    formatDatePtBr,
    isEstimatedDuePastForClose,
    type CardCycleSnapshot,
} from "@/lib/credit-card-billing"
import {
    buildCategoryComparisonRows,
    type ClosingDiagnosis,
    type CreditCardInvoiceAnalytics,
    type InstallmentPlanRowAnalytics,
    type InvoiceSliceKey,
    type SpendingProfileLabel,
} from "@/lib/credit-card-invoice-analytics"
import { MonthNav } from "@/components/categories/categories-toolbar"
import {
    formatYearMonth,
    labelYearMonthPt,
    parseYearMonth,
    shiftYearMonth,
} from "@/lib/budget-month"
import { localYmdFromDate } from "@/lib/transaction-date"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoneyDisplay } from "@/components/ui/money-display"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import {
    ChartBarIcon,
    CalendarDaysIcon,
    ChevronDownIcon,
    ChevronUpDownIcon,
    LightBulbIcon,
    MinusIcon,
    ArrowTrendingDownIcon,
    ArrowTrendingUpIcon,
} from "@heroicons/react/24/outline"
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts"
import type { CreditCardInvoicePayment } from "@/lib/supabase"
import { supabase } from "@/lib/supabase"
import {
    formatSupabasePostgrestError,
    isPostgrestRelationMissingError,
} from "@/lib/supabase-errors"
import { toastError, toastSuccess } from "@/lib/toast"
import { transactionsWorkspaceAuxKeys } from "@/lib/queries/keys"
import { CreditCardInvoiceCategorySpendSection } from "@/components/credit-cards/credit-card-invoice-category-spend-section"
import { InvoiceDeltaVsPriorChip } from "@/components/credit-cards/invoice-delta-vs-prior-chip"
const currencyFmt = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
})

const pctFmt = new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 1,
    minimumFractionDigits: 0,
})

const SLICE_LABEL: Record<InvoiceSliceKey, string> = {
    installments_recurring: "Parcelas e recorrências",
    one_off: "Compras do período",
}

const SLICE_KEYS: InvoiceSliceKey[] = ["installments_recurring", "one_off"]

type InvoiceHeroStatus = "open" | "future" | "paid" | "unpaid"

function findPaymentForClose(
    payments: CreditCardInvoicePayment[],
    closeYmd: string
): CreditCardInvoicePayment | undefined {
    return payments.find((p) => p.statement_close_date === closeYmd)
}

function deriveInvoiceHeroStatus(
    cycleOffset: number,
    closeYmd: string,
    payments: CreditCardInvoicePayment[]
): { status: InvoiceHeroStatus; payment: CreditCardInvoicePayment | undefined } {
    if (cycleOffset > 0) return { status: "future", payment: undefined }
    if (cycleOffset === 0) return { status: "open", payment: undefined }
    const payment = findPaymentForClose(payments, closeYmd)
    return { status: payment ? "paid" : "unpaid", payment }
}

function InvoiceFaturaHeaderStatus({
    status,
    unpaidPastDue,
    showPaymentMenu,
    paymentSaving,
    onMarkPaid,
    onUnmarkPaid,
}: {
    status: InvoiceHeroStatus
    unpaidPastDue: boolean
    showPaymentMenu: boolean
    paymentSaving: boolean
    onMarkPaid: () => void | Promise<void>
    onUnmarkPaid: () => void | Promise<void>
}) {
    if (status === "future") {
        return (
            <Badge
                size="sm"
                variant="outline"
                className="shrink-0 tabular-nums"
                title="Fatura futura em relação à atual"
                aria-label="Status da fatura: futura"
            >
                Futura
            </Badge>
        )
    }
    if (status === "open") {
        return (
            <Badge
                size="sm"
                variant="success"
                className="shrink-0 tabular-nums"
                title="Fatura atual ainda em aberto"
                aria-label="Status da fatura: aberta"
            >
                Aberta
            </Badge>
        )
    }

    const unpaidBadge = (
        <Badge
            size="sm"
            variant={unpaidPastDue ? "destructive" : "warning"}
            className="shrink-0 tabular-nums"
            title={
                unpaidPastDue
                    ? "Fatura fechada sem registro de pagamento; vencimento estimado já passou"
                    : "Fatura fechada sem registro de pagamento até o vencimento estimado"
            }
            aria-label={
                unpaidPastDue
                    ? "Status da fatura: não paga, após vencimento estimado"
                    : "Status da fatura: não paga"
            }
        >
            Não paga
        </Badge>
    )

    const paidBadge = (
        <Badge
            size="sm"
            variant="success"
            className="shrink-0 tabular-nums"
            title="Você marcou esta fatura como paga"
            aria-label="Status da fatura: paga"
        >
            Paga
        </Badge>
    )

    const invoiceMenuTriggerButtonClass = cn(
        "group inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border px-2 py-1",
        "text-left outline-none transition-colors",
        "hover:bg-muted/80 active:bg-muted/70",
        "focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:pointer-events-none disabled:opacity-50",
        "data-[state=open]:bg-muted/60"
    )

    if (status === "paid") {
        if (!showPaymentMenu) return paidBadge
        return (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button
                        type="button"
                        disabled={paymentSaving}
                        className={invoiceMenuTriggerButtonClass}
                        title="Abrir ações da fatura. Fatura marcada como paga."
                        aria-label="Abrir ações da fatura. Status da fatura: paga."
                    >
                        <Badge
                            size="sm"
                            variant="success"
                            className="shrink-0 tabular-nums"
                            aria-hidden
                        >
                            Paga
                        </Badge>
                        <ChevronUpDownIcon className="size-3 shrink-0 text-muted-foreground" aria-hidden />
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem
                        disabled={paymentSaving}
                        onSelect={() => {
                            void onUnmarkPaid()
                        }}
                    >
                        {paymentSaving ? "Salvando…" : "Desmarcar pagamento"}
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        )
    }

    if (!showPaymentMenu) return unpaidBadge
    const unpaidTitle = unpaidPastDue
        ? "Fatura fechada sem registro de pagamento; vencimento estimado já passou"
        : "Fatura fechada sem registro de pagamento até o vencimento estimado"
    const unpaidAriaStatus = unpaidPastDue
        ? "Status da fatura: não paga, após vencimento estimado."
        : "Status da fatura: não paga."
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    type="button"
                    disabled={paymentSaving}
                    className={invoiceMenuTriggerButtonClass}
                    title={`Abrir ações da fatura. ${unpaidTitle}`}
                    aria-label={`Abrir ações da fatura. ${unpaidAriaStatus}`}
                >
                    <Badge
                        size="sm"
                        variant={unpaidPastDue ? "destructive" : "warning"}
                        className="shrink-0 tabular-nums"
                        aria-hidden
                    >
                        Não paga
                    </Badge>
                    <ChevronUpDownIcon className="size-3 shrink-0 text-muted-foreground" aria-hidden />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem
                    disabled={paymentSaving}
                    onSelect={() => {
                        void onMarkPaid()
                    }}
                >
                    {paymentSaving ? "Salvando…" : "Marcar como paga"}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

type SlicePieRow = {
    key: InvoiceSliceKey
    label: string
    value: number
}

function sliceFillColor(key: InvoiceSliceKey): string {
    return key === "installments_recurring"
        ? "oklch(0.62 0.19 295)"
        : "oklch(0.62 0.18 240)"
}

function deltaPctLabel(a: number, b: number): string {
    if (b === 0 && a === 0) return "—"
    if (b === 0) return "—"
    const d = ((a - b) / b) * 100
    const sign = d > 0 ? "+" : ""
    return `${sign}${pctFmt.format(d)}%`
}

export function InvoiceCycleSwitcher({
    snapshot,
    cycleOffset,
    bounds,
    onChange,
    iconOnly,
    mobileTriggerFullWidth,
}: {
    snapshot: CardCycleSnapshot
    cycleOffset: number
    bounds: { min: number; max: number }
    onChange?: (next: number) => void
    iconOnly?: boolean
    mobileTriggerFullWidth?: boolean
}) {
    const active = Boolean(onChange) && !(bounds.min === 0 && bounds.max === 0)

    const selectedYm = formatYearMonth(snapshot.nextClose)
    const anchorYm = shiftYearMonth(selectedYm, -cycleOffset)

    const handleChange = useCallback(
        (nextYm: string) => {
            if (!onChange) return
            const a = parseYearMonth(anchorYm)
            const n = parseYearMonth(nextYm)
            const delta = (n.y - a.y) * 12 + (n.m - a.m)
            const clamped = Math.min(bounds.max, Math.max(bounds.min, delta))
            onChange(clamped)
        },
        [anchorYm, bounds, onChange],
    )

    const handleJump = useCallback(() => onChange?.(0), [onChange])

    if (!active) return null

    return (
        <MonthNav
            budgetMonthYm={selectedYm}
            onBudgetMonthYmChange={handleChange}
            onJumpToCurrentMonth={handleJump}
            dense
            iconOnly={iconOnly}
            mobileTriggerFullWidth={mobileTriggerFullWidth}
        />
    )
}

function committedVsPriorDeltaPct(snapshot: CardCycleSnapshot): {
    direction: "up" | "down" | "flat"
    /** Badge: apenas percentual (ícone é renderizado à parte). */
    pctDisplay: string
    label: string
    ariaLabel: string
} | null {
    const curr = Number(snapshot.committedOpenTotal)
    const prior = Number(
        snapshot.committedLastClosedTotal ?? snapshot.lastClosedTotal
    )
    if (prior === 0) return null
    const pct = ((curr - prior) / prior) * 100
    if (Math.abs(pct) < 0.05) {
        const label = "≈ 0% vs. fatura anterior"
        return {
            direction: "flat",
            pctDisplay: "≈ 0%",
            label,
            ariaLabel:
                "Variação aproximadamente zero em relação ao total planejado da fatura anterior",
        }
    }
    const sign = pct > 0 ? "+" : ""
    const pctDisplay = `${sign}${pctFmt.format(pct)}%`
    const label = `${pctDisplay} vs. fatura anterior`
    return {
        direction: pct > 0 ? "up" : "down",
        pctDisplay,
        label,
        ariaLabel: `Total planejado da fatura aberta, ${label.replace(" vs.", " versus")}`,
    }
}

function limitGaugeFillClass(pct: number): string {
    if (pct < 30)
        return "bg-emerald-500/80 dark:bg-emerald-400/80"
    if (pct < 70) return "bg-amber-500/80 dark:bg-amber-400/80"
    return "bg-rose-500/80 dark:bg-rose-400/80"
}

type InsightNoticeVariant = "sky" | "teal" | "amber" | "violet" | "emerald"

function insightNoticeStyles(variant: InsightNoticeVariant): {
    shell: string
    iconWrap: string
    eyebrow: string
} {
    switch (variant) {
        case "sky":
            return {
                shell: "rounded-md border border-sky-200/60 bg-sky-50/70 px-2.5 py-2 dark:border-sky-800/45 dark:bg-sky-950/30",
                iconWrap:
                    "inline-flex shrink-0 items-center justify-center text-sky-800 dark:text-sky-300",
                eyebrow:
                    "text-[10px] font-semibold uppercase tracking-wide text-sky-900/90 dark:text-sky-200/95",
            }
        case "teal":
            return {
                shell: "rounded-md border border-teal-200/60 bg-teal-50/70 px-2.5 py-2 dark:border-teal-800/45 dark:bg-teal-950/30",
                iconWrap:
                    "inline-flex shrink-0 items-center justify-center text-teal-800 dark:text-teal-300",
                eyebrow:
                    "text-[10px] font-semibold uppercase tracking-wide text-teal-900/90 dark:text-teal-200/95",
            }
        case "amber":
            return {
                shell: "rounded-md border border-amber-200/60 bg-amber-50/70 px-2.5 py-2 dark:border-amber-800/45 dark:bg-amber-950/30",
                iconWrap:
                    "inline-flex shrink-0 items-center justify-center text-amber-900 dark:text-amber-300",
                eyebrow:
                    "text-[10px] font-semibold uppercase tracking-wide text-amber-950/90 dark:text-amber-200/95",
            }
        case "emerald":
            return {
                shell: "rounded-md border border-emerald-200/60 bg-emerald-50/70 px-2.5 py-2 dark:border-emerald-800/45 dark:bg-emerald-950/30",
                iconWrap:
                    "inline-flex shrink-0 items-center justify-center text-emerald-800 dark:text-emerald-300",
                eyebrow:
                    "text-[10px] font-semibold uppercase tracking-wide text-emerald-900/90 dark:text-emerald-200/95",
            }
        default:
            return {
                shell: "rounded-md border border-violet-200/60 bg-violet-50/70 px-2.5 py-2 dark:border-violet-800/45 dark:bg-violet-950/30",
                iconWrap:
                    "inline-flex shrink-0 items-center justify-center text-violet-800 dark:text-violet-300",
                eyebrow:
                    "text-[10px] font-semibold uppercase tracking-wide text-violet-900/90 dark:text-violet-200/95",
            }
    }
}

function closingInsightVariant(diagnosis: ClosingDiagnosis): InsightNoticeVariant {
    switch (diagnosis) {
        case "lighter_near_close":
            return "teal"
        case "heavier_near_close":
            return "amber"
        default:
            return "violet"
    }
}

function spendingProfileShortLabel(profile: SpendingProfileLabel): string {
    switch (profile) {
        case "empty":
            return "Sem gastos no período"
        case "many_small":
            return "Muitos gastos pequenos"
        case "few_large":
            return "Poucos gastos altos"
        case "balanced":
        default:
            return "Perfil equilibrado"
    }
}

function InsightNoticePanel({
    variant,
    eyebrow,
    icon,
    children,
}: {
    variant: InsightNoticeVariant
    eyebrow?: string
    icon: ReactNode
    children: ReactNode
}) {
    const s = insightNoticeStyles(variant)
    return (
        <div className={s.shell}>
            <div className="flex items-start gap-2">
                <span className={s.iconWrap} aria-hidden>
                    {icon}
                </span>
                <div
                    className={cn(
                        "min-w-0",
                        eyebrow != null && eyebrow !== "" && "space-y-0.5"
                    )}
                >
                    {eyebrow != null && eyebrow !== "" ? (
                        <p className={s.eyebrow}>{eyebrow}</p>
                    ) : null}
                    <p className="text-xs font-medium leading-snug text-foreground">
                        {children}
                    </p>
                </div>
            </div>
        </div>
    )
}

function InstallmentPlanRowProgressBlock({
    row,
}: {
    row: InstallmentPlanRowAnalytics
}) {
    const remainingLabel =
        row.remaining === 1
            ? "1 parcela restante"
            : `${row.remaining} parcelas restantes`

    const paidTotalLabel = (
        <>
            <span className="font-medium text-foreground">{row.paid}</span>
            {" de "}
            {row.total}
        </>
    )

    return (
        <div className="mt-2 space-y-1">
            <Progress
                value={row.pctDone}
                tone="success"
                className="h-1.5"
                aria-label={`${row.paid} de ${row.total} parcelas pagas, ${row.remaining} ${row.remaining === 1 ? "restante" : "restantes"}`}
            />
            <div className="space-y-0.5 md:hidden" aria-label="Detalhes do parcelamento">
                <div className="flex items-center justify-between gap-x-3 text-xs text-muted-foreground">
                    <p className="min-w-0 tabular-nums">{paidTotalLabel}</p>
                    {row.remaining > 0 ? (
                        <p className="shrink-0 text-right tabular-nums">{remainingLabel}</p>
                    ) : null}
                </div>
                {row.endDate ? (
                    <p className="w-full text-right text-xs text-muted-foreground">
                        Termina em{" "}
                        <span className="font-medium text-foreground">
                            {labelYearMonthPt(formatYearMonth(row.endDate))}
                        </span>
                    </p>
                ) : null}
            </div>
            <div
                className="hidden flex-wrap items-center justify-between gap-x-3 gap-y-0.5 text-xs text-muted-foreground md:flex"
                aria-label="Detalhes do parcelamento"
            >
                <p className="min-w-0 tabular-nums">
                    {paidTotalLabel}
                    {row.remaining > 0 ? (
                        <>
                            <span aria-hidden className="text-muted-foreground/60">
                                {" "}
                                ·{" "}
                            </span>
                            {remainingLabel}
                        </>
                    ) : null}
                </p>
                {row.endDate ? (
                    <p className="shrink-0">
                        Termina em{" "}
                        <span className="font-medium text-foreground">
                            {labelYearMonthPt(formatYearMonth(row.endDate))}
                        </span>
                    </p>
                ) : null}
            </div>
        </div>
    )
}

export type CreditCardInvoiceAnalyticsPanelProps = {
    analytics: CreditCardInvoiceAnalytics
    snapshot: CardCycleSnapshot
    /** From detail view: usage of credit limit on open invoice (0–100). */
    openLimitPct?: number | null
    workspaceId?: string
    cardId?: string
    userId?: string
    invoicePayments?: CreditCardInvoicePayment[]
    onInvoicePaymentChanged?: () => void | Promise<void>
    /** Card due day (1–31) for styling “Não paga” after estimated due. */
    invoiceDueDay?: number
    /** Selected billing cycle vs today (0 = current). */
    cycleOffset?: number
    cycleOffsetBounds?: { min: number; max: number }
    onCycleOffsetChange?: (next: number) => void
    /** Opens transaction detail for this installment plan (e.g. credit card detail screen). */
    onInstallmentPlanPress?: (planId: string) => void
}

export function CreditCardInvoiceAnalyticsPanel({
    analytics,
    snapshot,
    openLimitPct,
    workspaceId,
    cardId,
    userId,
    invoicePayments = [],
    onInvoicePaymentChanged,
    invoiceDueDay,
    cycleOffset = 0,
    cycleOffsetBounds = { min: 0, max: 0 },
    onCycleOffsetChange,
    onInstallmentPlanPress,
}: CreditCardInvoiceAnalyticsPanelProps) {
    const queryClient = useQueryClient()
    const [paymentSaving, setPaymentSaving] = useState(false)

    const closeYmd = useMemo(
        () => localYmdFromDate(snapshot.nextClose),
        [snapshot]
    )

    const hero = useMemo(
        () => deriveInvoiceHeroStatus(cycleOffset, closeYmd, invoicePayments),
        [cycleOffset, closeYmd, invoicePayments]
    )

    const unpaidPastDue =
        hero.status === "unpaid" &&
        invoiceDueDay != null &&
        invoiceDueDay >= 1 &&
        invoiceDueDay <= 31 &&
        isEstimatedDuePastForClose(snapshot.nextClose, invoiceDueDay)

    const showInvoicePaymentMenu =
        cycleOffset < 0 && Boolean(workspaceId && cardId && userId)

    const handleMarkInvoicePaid = useCallback(async () => {
        if (!workspaceId || !cardId || !userId) return
        setPaymentSaving(true)
        const paidAt = new Date().toISOString()
        const { error } = await supabase.from("credit_card_invoice_payments").upsert(
            {
                workspace_id: workspaceId,
                credit_card_id: cardId,
                statement_close_date: closeYmd,
                status: "paid",
                created_by: userId,
                paid_at: paidAt,
            },
            {
                onConflict: "workspace_id,credit_card_id,statement_close_date",
            }
        )
        setPaymentSaving(false)
        if (error) {
            if (isPostgrestRelationMissingError(error)) {
                toastError(
                    "Tabela de pagamentos indisponível. Aplique a migração do banco de dados."
                )
            } else {
                toastError(
                    formatSupabasePostgrestError(error) ??
                        "Não foi possível marcar a fatura como paga."
                )
            }
            return
        }
        toastSuccess("Fatura marcada como paga.")
        if (workspaceId) {
            void queryClient.invalidateQueries({
                queryKey: transactionsWorkspaceAuxKeys.detail(workspaceId),
            })
        }
        await onInvoicePaymentChanged?.()
    }, [
        workspaceId,
        cardId,
        userId,
        closeYmd,
        onInvoicePaymentChanged,
        queryClient,
    ])

    const handleUnmarkInvoicePaid = useCallback(async () => {
        if (!workspaceId || !cardId) return
        setPaymentSaving(true)
        const { error } = await supabase
            .from("credit_card_invoice_payments")
            .delete()
            .eq("workspace_id", workspaceId)
            .eq("credit_card_id", cardId)
            .eq("statement_close_date", closeYmd)
        setPaymentSaving(false)
        if (error) {
            if (isPostgrestRelationMissingError(error)) {
                toastError(
                    "Tabela de pagamentos indisponível. Aplique a migração do banco de dados."
                )
            } else {
                toastError(
                    formatSupabasePostgrestError(error) ??
                        "Não foi possível desmarcar o pagamento."
                )
            }
            return
        }
        toastSuccess("Pagamento desmarcado.")
        if (workspaceId) {
            void queryClient.invalidateQueries({
                queryKey: transactionsWorkspaceAuxKeys.detail(workspaceId),
            })
        }
        await onInvoicePaymentChanged?.()
    }, [workspaceId, cardId, closeYmd, onInvoicePaymentChanged, queryClient])

    const comparison = useMemo(
        () =>
            buildCategoryComparisonRows(
                analytics.categoryOpen,
                analytics.categoryLastClosed,
                analytics.openTotal,
                analytics.lastClosedTotal
            ),
        [analytics]
    )

    const open = analytics.sliceOpen
    const closed = analytics.sliceLastClosed

    const [activeSlice, setActiveSlice] = useState<InvoiceSliceKey | null>(null)

    const slicePieData = useMemo(
        (): SlicePieRow[] =>
            SLICE_KEYS.map((k) => ({
                key: k,
                label: SLICE_LABEL[k],
                value: open[k],
            })),
        [open]
    )

    const compositionAriaLabel = useMemo(() => {
        const parts = SLICE_KEYS.map((k) => {
            const v = open[k]
            const share =
                analytics.openTotal > 0 ? (v / analytics.openTotal) * 100 : 0
            return `${SLICE_LABEL[k]} ${pctFmt.format(share)}%`
        })
        return `Composição da fatura: ${parts.join(", ")}`
    }, [open, analytics.openTotal])

    const strongestWeek = analytics.weeklyPattern.strongestWeek
    const strongestWeekTotal =
        strongestWeek != null
            ? (analytics.weeklyPattern.totalsByWeek.get(strongestWeek) ?? 0)
            : 0

    const committedDetailLine = useMemo(() => {
        const segs: string[] = []
        const minC = analytics.minimumCommittedOpen
        const openTot = analytics.openTotal
        const nPlans = analytics.installmentRows.length
        if (openTot > 0) {
            segs.push(
                `${pctFmt.format((minC / openTot) * 100)}% da fatura planejada`
            )
        }
        if (nPlans > 0) {
            segs.push(
                nPlans === 1
                    ? "1 parcelamento ativo"
                    : `${nPlans} parcelamentos ativos`
            )
        } else if (minC > 0) {
            segs.push("Inclui recorrências e parcelas já lançadas")
        }
        return segs.length ? segs.join(" · ") : null
    }, [
        analytics.minimumCommittedOpen,
        analytics.openTotal,
        analytics.installmentRows.length,
    ])

    const invoiceYearMonth = useMemo(
        () => formatYearMonth(snapshot.nextClose),
        [snapshot.nextClose]
    )

    const invoicePeriodLabel = useMemo(
        () => labelYearMonthPt(invoiceYearMonth),
        [invoiceYearMonth]
    )

    const committedVsPriorDelta = useMemo(
        () => committedVsPriorDeltaPct(snapshot),
        [snapshot]
    )

    return (
        <div className="space-y-6">
            <div className="min-w-0 max-w-full space-y-2">
                <div className="flex min-w-0 flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div className="flex h-8 min-w-0 items-end">
                        <h2 className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                            Fatura
                        </h2>
                    </div>
                    <div className="w-full min-w-0 md:flex md:w-auto md:justify-end">
                        <InvoiceCycleSwitcher
                            snapshot={snapshot}
                            cycleOffset={cycleOffset}
                            bounds={cycleOffsetBounds}
                            onChange={onCycleOffsetChange}
                            mobileTriggerFullWidth
                        />
                    </div>
                </div>
                <Card className="gap-0 overflow-hidden border-border/80 py-0 shadow-sm">
                    <div
                        className="flex min-h-10 shrink-0 items-center justify-between gap-3 border-b border-border bg-muted/30 px-4 py-2.5"
                        aria-live="polite"
                    >
                        <p className="min-w-0 flex-1 truncate text-sm font-semibold leading-snug text-foreground">
                            {invoicePeriodLabel}
                        </p>
                        <InvoiceFaturaHeaderStatus
                            status={hero.status}
                            unpaidPastDue={unpaidPastDue}
                            showPaymentMenu={showInvoicePaymentMenu}
                            paymentSaving={paymentSaving}
                            onMarkPaid={handleMarkInvoicePaid}
                            onUnmarkPaid={handleUnmarkInvoicePaid}
                        />
                    </div>
                    <CardContent className="space-y-5 pt-4 pb-5">
                        <div className="space-y-2">
                            <div className="min-w-0">
                                    <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1.5">
                                        <div className="min-w-0 flex-1 space-y-1">
                                            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                                Valor
                                            </p>
                                            <p className="text-3xl font-bold tabular-nums tracking-tight text-foreground">
                                                {currencyFmt.format(
                                                    snapshot.committedOpenTotal
                                                )}
                                            </p>
                                        </div>
                                        {committedVsPriorDelta ? (
                                            <Badge
                                                size="sm"
                                                variant={
                                                    committedVsPriorDelta.direction === "down"
                                                        ? "success"
                                                        : committedVsPriorDelta.direction === "up"
                                                          ? "expense"
                                                          : "secondary"
                                                }
                                                className="gap-1 shrink-0 tabular-nums"
                                                title={committedVsPriorDelta.label}
                                                aria-label={committedVsPriorDelta.ariaLabel}
                                            >
                                                {committedVsPriorDelta.direction === "up" ? (
                                                    <ArrowTrendingUpIcon
                                                        className="size-3.5 shrink-0"
                                                        aria-hidden
                                                    />
                                                ) : committedVsPriorDelta.direction === "down" ? (
                                                    <ArrowTrendingDownIcon
                                                        className="size-3.5 shrink-0"
                                                        aria-hidden
                                                    />
                                                ) : (
                                                    <MinusIcon
                                                        className="size-3.5 shrink-0"
                                                        aria-hidden
                                                    />
                                                )}
                                                {committedVsPriorDelta.pctDisplay}
                                            </Badge>
                                        ) : null}
                                    </div>
                            </div>
                            {cycleOffset === 0 ? (
                                <p
                                    className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-xs text-muted-foreground"
                                    aria-label={`Período da fatura: aberto desde ${formatDatePtBr(snapshot.openWindow.start)}, fecha em ${formatDatePtBr(snapshot.nextClose)}`}
                                >
                                    <span className="inline-flex items-baseline gap-1">
                                        <span className="text-[11px] font-semibold uppercase tracking-wide">
                                            Aberto
                                        </span>
                                        <span className="tabular-nums font-medium text-foreground">
                                            {formatDatePtBr(snapshot.openWindow.start)}
                                        </span>
                                    </span>
                                    <span className="inline-flex items-baseline gap-1">
                                        <span className="text-[11px] font-semibold uppercase tracking-wide">
                                            Fecha
                                        </span>
                                        <span className="tabular-nums font-medium text-foreground">
                                            {formatDatePtBr(snapshot.nextClose)}
                                        </span>
                                    </span>
                                </p>
                            ) : null}
                        </div>

                        {openLimitPct != null ? (
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between gap-2 text-xs">
                                    <span className="font-medium text-muted-foreground">
                                        Uso do limite estimado
                                    </span>
                                    <span className="tabular-nums text-sm font-semibold text-foreground">
                                        {pctFmt.format(openLimitPct)}%
                                    </span>
                                </div>
                                <div
                                    className="h-2 overflow-hidden rounded-full bg-muted"
                                    role="progressbar"
                                    aria-valuenow={Math.round(openLimitPct)}
                                    aria-valuemin={0}
                                    aria-valuemax={100}
                                    aria-label="Uso estimado do limite do cartão na fatura planejada"
                                >
                                    <div
                                        className={cn(
                                            "h-full rounded-full transition-[width]",
                                            limitGaugeFillClass(openLimitPct)
                                        )}
                                        style={{ width: `${Math.min(100, Math.max(0, openLimitPct))}%` }}
                                    />
                                </div>
                            </div>
                        ) : null}
                    </CardContent>

                    <div
                        role="separator"
                        aria-orientation="horizontal"
                        className="shrink-0 border-t border-border"
                    />

                    <CardContent className="space-y-5 pb-4 pt-5">
                        <CreditCardInvoiceCategorySpendSection
                            rows={comparison}
                            invoiceYearMonth={invoiceYearMonth}
                        />

                        <InsightNoticePanel variant="emerald" icon={<LightBulbIcon className="size-3.5" />}>
                            {analytics.summaryText}{" "}
                            <span className="font-normal text-muted-foreground">
                                Priorize revisar essa categoria neste período.
                            </span>
                        </InsightNoticePanel>
                    </CardContent>
                </Card>
            </div>

            <details className="group rounded-xl border border-border/70 bg-card text-card-foreground shadow-sm open:pb-1">
                <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium marker:content-none [&::-webkit-details-marker]:hidden">
                    <span className="flex items-center justify-between gap-2">
                        Mais sobre este período
                        <ChevronDownIcon className="size-4 shrink-0 transition-transform group-open:rotate-180" />
                    </span>
                </summary>
                <div className="border-t border-border/60 px-4 pb-4 pt-4">
                    <section className="space-y-3 pb-6 text-sm">
                        <div className="flex w-full min-w-0 flex-wrap items-end justify-between gap-x-3 gap-y-1">
                            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Composição
                            </h3>
                            <p className="shrink-0 text-xs font-medium capitalize tabular-nums text-muted-foreground">
                                {invoicePeriodLabel}
                            </p>
                        </div>
                        {analytics.openTotal === 0 ? (
                                <p className="text-xs text-muted-foreground">
                                    Sem despesas nesta fatura ainda.
                                </p>
                            ) : (
                                <>
                                    <div
                                        className="relative mx-auto flex h-[200px] w-full max-w-[260px] items-center justify-center md:h-[240px] md:max-w-[300px]"
                                        role="img"
                                        aria-label={compositionAriaLabel}
                                    >
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={slicePieData}
                                                    dataKey="value"
                                                    nameKey="label"
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius="60%"
                                                    outerRadius="78%"
                                                    paddingAngle={1}
                                                    startAngle={90}
                                                    endAngle={-270}
                                                    stroke="var(--card)"
                                                    strokeWidth={2}
                                                    isAnimationActive={false}
                                                    onMouseEnter={(_, i) => {
                                                        const row = slicePieData[i]
                                                        setActiveSlice(row?.key ?? null)
                                                    }}
                                                    onMouseLeave={() =>
                                                        setActiveSlice(null)
                                                    }
                                                >
                                                    {slicePieData.map((entry) => (
                                                        <Cell
                                                            key={entry.key}
                                                            fill={sliceFillColor(entry.key)}
                                                            style={{
                                                                fillOpacity:
                                                                    activeSlice === null ||
                                                                    activeSlice === entry.key
                                                                        ? 1
                                                                        : 0.35,
                                                            }}
                                                        />
                                                    ))}
                                                </Pie>
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <div
                                            className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-4 text-center"
                                            aria-hidden
                                        >
                                            {activeSlice === null ? (
                                                <>
                                                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                                                        Distribuição
                                                    </p>
                                                    <p className="mt-1 max-w-[min(11rem,82%)] text-lg font-semibold tabular-nums text-foreground md:text-xl">
                                                        {currencyFmt.format(
                                                            analytics.openTotal
                                                        )}
                                                    </p>
                                                </>
                                            ) : (
                                                <>
                                                    <p className="max-w-[min(11rem,82%)] text-xs font-semibold leading-snug text-foreground">
                                                        {SLICE_LABEL[activeSlice]}
                                                    </p>
                                                    <p className="mt-1 text-lg font-semibold tabular-nums text-foreground md:text-xl">
                                                        {currencyFmt.format(
                                                            open[activeSlice]
                                                        )}
                                                    </p>
                                                    <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">
                                                        {pctFmt.format(
                                                            analytics.openTotal > 0
                                                                ? (open[activeSlice] /
                                                                      analytics.openTotal) *
                                                                      100
                                                                : 0
                                                        )}
                                                        %
                                                    </p>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <ul className="space-y-2">
                                        {SLICE_KEYS.map((k) => {
                                            const v = open[k]
                                            const prev = closed[k]
                                            const share =
                                                analytics.openTotal > 0
                                                    ? (v / analytics.openTotal) * 100
                                                    : 0
                                            return (
                                                <li key={k}>
                                                    <button
                                                        type="button"
                                                        className="flex w-full items-center justify-between gap-3 rounded-md border border-transparent px-2 py-1.5 text-left transition-colors hover:border-border/60 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                                        onMouseEnter={() =>
                                                            setActiveSlice(k)
                                                        }
                                                        onMouseLeave={() =>
                                                            setActiveSlice(null)
                                                        }
                                                        onFocus={() => setActiveSlice(k)}
                                                        onBlur={() =>
                                                            setActiveSlice(null)
                                                        }
                                                    >
                                                        <span className="inline-flex min-w-0 items-center gap-2 text-sm font-medium text-foreground">
                                                            <span
                                                                className="size-2 shrink-0 rounded-full"
                                                                style={{
                                                                    backgroundColor:
                                                                        sliceFillColor(k),
                                                                }}
                                                                aria-hidden
                                                            />
                                                            <span className="min-w-0 truncate">
                                                                {SLICE_LABEL[k]}
                                                                <span className="font-normal text-muted-foreground">
                                                                    {" "}
                                                                    ·{" "}
                                                                    {pctFmt.format(share)}%
                                                                </span>
                                                            </span>
                                                        </span>
                                                        <span className="flex shrink-0 flex-row items-center gap-2 tabular-nums text-sm text-foreground">
                                                            <InvoiceDeltaVsPriorChip
                                                                current={v}
                                                                prior={prev}
                                                                ariaContext="fatia"
                                                            />
                                                            <span>
                                                                {currencyFmt.format(v)}
                                                            </span>
                                                        </span>
                                                    </button>
                                                </li>
                                            )
                                        })}
                                    </ul>
                                </>
                            )}
                    </section>
                    <Separator className="bg-border/60" />
                    <section className="space-y-3 py-6 text-sm">
                        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Hábitos de consumo
                        </h3>
                        <div className="grid gap-2 text-xs sm:grid-cols-2">
                            <div className="rounded-md border border-border/50 bg-muted/20 px-3 py-2 dark:bg-muted/10">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0 flex-1 space-y-1">
                                        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                            Dias úteis
                                        </p>
                                        <p className="text-base font-semibold tabular-nums leading-snug text-foreground">
                                            {currencyFmt.format(
                                                analytics.weekdayWeekend.weekdayTotal
                                            )}
                                        </p>
                                    </div>
                                    <p className="shrink-0 text-xs tabular-nums text-muted-foreground">
                                        {pctFmt.format(analytics.weekdayWeekend.weekdayPct)}%
                                    </p>
                                </div>
                            </div>
                            <div className="rounded-md border border-border/50 bg-muted/20 px-3 py-2 dark:bg-muted/10">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0 flex-1 space-y-1">
                                        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                            Fim de semana
                                        </p>
                                        <p className="text-base font-semibold tabular-nums leading-snug text-foreground">
                                            {currencyFmt.format(
                                                analytics.weekdayWeekend.weekendTotal
                                            )}
                                        </p>
                                    </div>
                                    <p className="shrink-0 text-xs tabular-nums text-muted-foreground">
                                        {pctFmt.format(analytics.weekdayWeekend.weekendPct)}%
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <InsightNoticePanel
                                variant="sky"
                                icon={<ChartBarIcon className="size-3.5" />}
                            >
                                {strongestWeek != null && strongestWeekTotal > 0 ? (
                                    <>
                                        A maior concentração de gastos aconteceu na semana{" "}
                                        {strongestWeek} deste período, totalizando{" "}
                                        {currencyFmt.format(strongestWeekTotal)}.
                                    </>
                                ) : (
                                    <>
                                        Os gastos ficaram distribuídos de forma mais equilibrada
                                        ao longo desta fatura.
                                    </>
                                )}
                            </InsightNoticePanel>
                            <InsightNoticePanel
                                variant={closingInsightVariant(
                                    analytics.closingDiagnosis
                                )}
                                icon={<CalendarDaysIcon className="size-3.5" />}
                            >
                                {analytics.closingCopy}
                            </InsightNoticePanel>
                        </div>
                    </section>
                    <Separator className="bg-border/60" />
                    <section className="space-y-3 pt-6 text-sm">
                        <div className="flex w-full min-w-0 flex-wrap items-center justify-between gap-x-3 gap-y-2">
                            <h3 className="self-end text-xs font-semibold uppercase tracking-wide leading-none text-muted-foreground">
                                Perfil de gastos
                            </h3>
                            <Badge
                                variant="secondary"
                                className="shrink-0 text-[10px] font-semibold uppercase tracking-wide"
                            >
                                {spendingProfileShortLabel(
                                    analytics.spendingProfile
                                )}
                            </Badge>
                        </div>

                        <div className="grid gap-2 text-xs sm:grid-cols-2">
                            <div className="rounded-md border border-border/50 bg-muted/20 px-3 py-2 dark:bg-muted/10">
                                <div className="space-y-1">
                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                        Ticket médio
                                    </p>
                                    <p className="text-base font-semibold tabular-nums leading-snug text-foreground">
                                        {analytics.meanTicket != null
                                            ? currencyFmt.format(analytics.meanTicket)
                                            : "—"}
                                    </p>
                                    <p className="text-[11px] leading-snug text-muted-foreground">
                                        Valor médio por despesa na fatura aberta.
                                    </p>
                                </div>
                            </div>
                            <div className="rounded-md border border-border/50 bg-muted/20 px-3 py-2 dark:bg-muted/10">
                                <div className="space-y-1">
                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                        Ticket mediano
                                    </p>
                                    <p className="text-base font-semibold tabular-nums leading-snug text-foreground">
                                        {analytics.medianTicket != null
                                            ? currencyFmt.format(analytics.medianTicket)
                                            : "—"}
                                    </p>
                                    <p className="text-[11px] leading-snug text-muted-foreground">
                                        Metade das despesas ficou abaixo deste valor.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                </div>
            </details>

            <div className="min-w-0 max-w-full space-y-2">
                <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex h-8 min-w-0 items-end">
                        <h2 className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                            Parcelas e compromissos
                        </h2>
                    </div>
                </div>
                <Card className="gap-0 overflow-hidden border-border/80 py-0 shadow-sm">
                    {committedDetailLine ? (
                        <div
                            className="flex min-h-10 shrink-0 flex-wrap items-center border-b border-border bg-muted/30 px-4 py-2.5"
                            aria-live="polite"
                        >
                            <p className="min-w-0 text-[11px] leading-snug text-muted-foreground">
                                {committedDetailLine}
                            </p>
                        </div>
                    ) : null}
                    <CardContent className="space-y-3 py-4">
                    <div className="space-y-2">
                        <div className="space-y-1">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                Total mínimo comprometido
                            </p>
                            <p className="text-2xl font-bold tabular-nums tracking-tight text-foreground md:text-3xl">
                                {currencyFmt.format(analytics.minimumCommittedOpen)}
                            </p>
                        </div>
                    </div>
                    {analytics.installmentRows.length > 0 ? (
                        <ul className="space-y-3">
                            {analytics.installmentRows.map((row) => {
                                const body = (
                                    <>
                                        <div className="flex flex-wrap items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <p className="font-medium leading-snug text-foreground">
                                                    {row.plan.description?.trim() ||
                                                        "Compra parcelada"}
                                                </p>
                                            </div>
                                            <span className="flex shrink-0 items-baseline gap-0.5 tabular-nums">
                                                <MoneyDisplay
                                                    value={row.monthlyCharge}
                                                    size="default"
                                                    className="font-semibold"
                                                />
                                                <span className="text-xs font-medium text-muted-foreground">
                                                    /mês
                                                </span>
                                            </span>
                                        </div>
                                        <InstallmentPlanRowProgressBlock row={row} />
                                    </>
                                )
                                return (
                                    <li
                                        key={row.plan.id}
                                        className={cn(
                                            "rounded-lg border border-border/60 bg-muted/15 dark:bg-muted/10",
                                            onInstallmentPlanPress ? "p-0" : "px-3 py-2.5"
                                        )}
                                    >
                                        {onInstallmentPlanPress ? (
                                            <button
                                                type="button"
                                                className={cn(
                                                    "w-full rounded-[inherit] px-3 py-2.5 text-left outline-none transition-colors",
                                                    "hover:bg-muted/25",
                                                    "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                                                )}
                                                aria-label={`Abrir detalhes da compra parcelada: ${row.plan.description?.trim() || "sem título"}`}
                                                onClick={() =>
                                                    onInstallmentPlanPress(row.plan.id)
                                                }
                                            >
                                                {body}
                                            </button>
                                        ) : (
                                            body
                                        )}
                                    </li>
                                )
                            })}
                        </ul>
                    ) : analytics.minimumCommittedOpen > 0 ? (
                        <p className="text-sm text-muted-foreground">
                            Nenhum plano de parcelamento ativo neste cartão. O total
                            acima inclui recorrências e parcelas já lançadas nesta
                            fatura.
                        </p>
                    ) : (
                        <p className="text-sm text-muted-foreground">
                            Nenhum parcelamento ativo vinculado a este cartão.
                        </p>
                    )}
                    </CardContent>
                </Card>
            </div>

        </div>
    )
}
