"use client"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { percentPointsBR } from "@/lib/formatters"
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleRow,
} from "@/components/ui/collapsible"
import {
    Item,
} from "@/components/ui/item"
import {
    Button,
} from "@/components/ui/button"
import {
    DescriptionDetails,
    DescriptionHint,
    DescriptionList,
    DescriptionListItem,
    DescriptionTerm,
} from "@/components/ui/description-list"
import {
    PageSection,
    PageSectionHeader,
    PageSectionTitle,
} from "@/components/ui/page-section"
import { currencyBRL } from "@/lib/formatters"
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
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardToolbar } from "@/components/ui/card"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoneyDisplay } from "@/components/ui/money-display"
import { Progress, ProgressHeader, ProgressLabel, ProgressValue } from "@/components/ui/progress"
import { CARD_LIMIT_BANDS } from "@/lib/budget-bands"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { ArrowTrendingDownIcon, ArrowTrendingUpIcon, CalendarDaysIcon, ChartBarIcon, ChevronUpDownIcon, LightBulbIcon, MinusIcon } from "@heroicons/react/16/solid"
import { ChartSplit, type ChartConfig } from "@/components/ui/chart"
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
import { deltaTone } from "@/lib/delta-tone"

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
    const [confirmUnmarkOpen, setConfirmUnmarkOpen] = useState(false)

    if (status === "future") {
        return (
            <Badge
                size="sm"
                variant="outline" tone="neutral"
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
                tone="success"
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
            tone={unpaidPastDue ? "destructive" : "warning"}
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
            tone="success"
            className="shrink-0 tabular-nums"
            title="Você marcou esta fatura como paga"
            aria-label="Status da fatura: paga"
        >
            Paga
        </Badge>
    )

    // A pílula que abre o menu da fatura: um `Button outline xs` redondo, com o
    // selo de status dentro. Era um `<button>` cru com as mesmas intenções.
    //
    // O `xs` mede 24px, e a pílula crua media ~30: a troca encolheu o alvo e
    // ninguém registrou. No toque, um `::after` estende a área clicável 12px
    // para cima e para baixo sem mudar o desenho — o mesmo recurso do
    // `Breadcrumb` —, e o `relative` é o que o ancora na pílula.
    const invoiceMenuTriggerButtonClass = cn(
        "relative shrink-0 rounded-full px-2 data-[state=open]:bg-muted/60",
        "pointer-coarse:after:absolute pointer-coarse:after:-inset-x-1 pointer-coarse:after:-inset-y-3 pointer-coarse:after:content-['']"
    )

    if (status === "paid") {
        if (!showPaymentMenu) return paidBadge
        return (
            <>
            {/* No telefone as ações da fatura são a folha de ações. */}
            <DropdownMenu mobile="sheet">
                <DropdownMenuTrigger asChild>
                    <Button
                        type="button"
                        variant="outline"
                        size="xs"
                        disabled={paymentSaving}
                        className={invoiceMenuTriggerButtonClass}
                        title="Abrir ações da fatura. Fatura marcada como paga."
                        aria-label="Abrir ações da fatura. Status da fatura: paga."
                    >
                        <Badge
                            size="sm"
                            tone="success"
                            className="shrink-0 tabular-nums"
                            aria-hidden
                        >
                            Paga
                        </Badge>
                        <ChevronUpDownIcon className="size-3 shrink-0 text-muted-foreground" aria-hidden />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem
                        disabled={paymentSaving}
                        onSelect={() => setConfirmUnmarkOpen(true)}
                    >
                        {paymentSaving ? "Salvando…" : "Desmarcar pagamento"}
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            <AlertDialog open={confirmUnmarkOpen} onOpenChange={setConfirmUnmarkOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Desmarcar pagamento da fatura?</AlertDialogTitle>
                        <AlertDialogDescription>
                            A fatura volta a constar como não paga e reaparece em Contas a pagar.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => void onUnmarkPaid()}>
                            Desmarcar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            </>
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
        <DropdownMenu mobile="sheet">
            <DropdownMenuTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    disabled={paymentSaving}
                    className={invoiceMenuTriggerButtonClass}
                    title={`Abrir ações da fatura. ${unpaidTitle}`}
                    aria-label={`Abrir ações da fatura. ${unpaidAriaStatus}`}
                >
                    <Badge
                        size="sm"
                        tone={unpaidPastDue ? "destructive" : "warning"}
                        className="shrink-0 tabular-nums"
                        aria-hidden
                    >
                        Não paga
                    </Badge>
                    <ChevronUpDownIcon className="size-3 shrink-0 text-muted-foreground" aria-hidden />
                </Button>
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

/** As duas partes só se identificam — nenhuma é "boa" ou "ruim" —, então a
 *  cor vem da rampa neutra do gráfico, e não de um `oklch` escolhido aqui. */
const SLICE_CHART_CONFIG = {
    installments_recurring: {
        label: SLICE_LABEL.installments_recurring,
        color: "var(--chart-3)",
    },
    one_off: { label: SLICE_LABEL.one_off, color: "var(--chart-2)" },
} satisfies ChartConfig

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
    const pctDisplay = `${sign}${percentPointsBR(pct)}%`
    const label = `${pctDisplay} vs. fatura anterior`
    return {
        direction: pct > 0 ? "up" : "down",
        pctDisplay,
        label,
        ariaLabel: `Total planejado da fatura aberta, ${label.replace(" vs.", " versus")}`,
    }
}

type InsightNoticeVariant = "info" | "success" | "warning" | "neutral"

function closingInsightVariant(diagnosis: ClosingDiagnosis): InsightNoticeVariant {
    switch (diagnosis) {
        case "lighter_near_close":
            return "success"
        case "heavier_near_close":
            return "warning"
        default:
            return "neutral"
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

/**
 * O aviso de leitura da fatura. É o `Alert` (`sm`), e não um bloco tingido
 * próprio (rodada 204): ele mora **dentro** de um cartão, e um cartão com tom
 * ali seria cartão dentro de cartão. O mapa local de quatro tons, que já
 * copiava a forma do `Alert`, saiu.
 */
function InsightNoticePanel({
    variant,
    icon,
    children,
}: {
    variant: InsightNoticeVariant
    icon: ReactNode
    children: ReactNode
}) {
    return (
        <Alert size="sm" tone={variant === "neutral" ? "default" : variant} icon={icon}>
            <AlertDescription className="font-medium">{children}</AlertDescription>
        </Alert>
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
                value={row.paid}
                max={row.total}
                segments={row.total}
                tone="success"
                size="sm"
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

    const sliceData = useMemo(
        () => SLICE_KEYS.map((k) => ({ key: k, value: open[k] })),
        [open]
    )

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
                `${percentPointsBR((minC / openTot) * 100)}% da fatura planejada`
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
            <PageSection className="max-w-full">
                <PageSectionHeader
                    actions={
                        <InvoiceCycleSwitcher
                            snapshot={snapshot}
                            cycleOffset={cycleOffset}
                            bounds={cycleOffsetBounds}
                            onChange={onCycleOffsetChange}
                        />
                    }
                >
                    <PageSectionTitle>Fatura</PageSectionTitle>
                </PageSectionHeader>
                <Card variant="elevated" padding="none">
                    <CardToolbar
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
                    </CardToolbar>
                    <CardContent className="space-y-5 pt-4 pb-5">
                        <div className="space-y-2">
                            <div className="min-w-0">
                                    <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1.5">
                                        <div className="min-w-0 flex-1 space-y-1">
                                            <p className="text-2xs font-semibold uppercase tracking-wide text-muted-foreground">
                                                Valor
                                            </p>
                                            <p className="text-3xl font-bold tabular-nums tracking-tight text-foreground">
                                                {currencyBRL(
                                                    snapshot.committedOpenTotal
                                                )}
                                            </p>
                                        </div>
                                        {committedVsPriorDelta ? (
                                            <Badge
                                                size="sm"
                                                tone={deltaTone(committedVsPriorDelta.direction, "expense")}
                                                className="shrink-0 tabular-nums"
                                                title={committedVsPriorDelta.label}
                                                aria-label={committedVsPriorDelta.ariaLabel}
                                            >
                                                {committedVsPriorDelta.direction === "up" ? (
                                                    <ArrowTrendingUpIcon aria-hidden />
                                                ) : committedVsPriorDelta.direction === "down" ? (
                                                    <ArrowTrendingDownIcon aria-hidden />
                                                ) : (
                                                    <MinusIcon aria-hidden />
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
                                        <span className="text-2xs font-semibold uppercase tracking-wide">
                                            Aberto
                                        </span>
                                        <span className="tabular-nums font-medium text-foreground">
                                            {formatDatePtBr(snapshot.openWindow.start)}
                                        </span>
                                    </span>
                                    <span className="inline-flex items-baseline gap-1">
                                        <span className="text-2xs font-semibold uppercase tracking-wide">
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
                            <Progress
                                value={openLimitPct}
                                bands={CARD_LIMIT_BANDS}
                                aria-label="Uso estimado do limite do cartão na fatura planejada"
                                header={
                                    <ProgressHeader>
                                        <ProgressLabel>Uso do limite estimado</ProgressLabel>
                                        <ProgressValue>{percentPointsBR(openLimitPct)}%</ProgressValue>
                                    </ProgressHeader>
                                }
                            />
                        ) : null}
                    </CardContent>

                    <Separator />

                    <CardContent className="space-y-5 pb-4 pt-5">
                        <CreditCardInvoiceCategorySpendSection
                            rows={comparison}
                            invoiceYearMonth={invoiceYearMonth}
                        />

                        <InsightNoticePanel variant="success" icon={<LightBulbIcon />}>
                            {analytics.summaryText}{" "}
                            <span className="font-normal text-muted-foreground">
                                Priorize revisar essa categoria neste período.
                            </span>
                        </InsightNoticePanel>
                    </CardContent>
                </Card>
            </PageSection>

            <Collapsible variant="card">
                <CollapsibleRow size="xl">Mais sobre este período</CollapsibleRow>
                <CollapsibleContent findable className="pt-2">
                    <section className="space-y-3 pb-6 text-sm">
                        <div className="flex w-full min-w-0 flex-wrap items-end justify-between gap-x-3 gap-y-1">
                            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Composição
                            </h3>
                            <p className="shrink-0 text-xs font-medium tabular-nums text-muted-foreground">
                                {invoicePeriodLabel}
                            </p>
                        </div>
                        {analytics.openTotal === 0 ? (
                                <p className="text-xs text-muted-foreground">
                                    Sem despesas nesta fatura ainda.
                                </p>
                            ) : (
                                <>
                                    <ChartSplit
                                        config={SLICE_CHART_CONFIG}
                                        data={sliceData}
                                        nameKey="key"
                                        dataKey="value"
                                        label="Composição da fatura"
                                    />
                                    <ul className="space-y-2">
                                        {SLICE_KEYS.map((k) => {
                                            const v = open[k]
                                            const prev = closed[k]
                                            return (
                                                <li key={k}>
                                                    <Item
                                                        size="sm"
                                                        className="justify-between gap-3 rounded-md px-2 py-1.5"
                                                    >
                                                        <span className="inline-flex min-w-0 items-center gap-2 text-sm font-medium text-foreground">
                                                            <span
                                                                className="size-2 shrink-0 rounded-full"
                                                                style={{
                                                                    backgroundColor:
                                                                        SLICE_CHART_CONFIG[k].color,
                                                                }}
                                                                aria-hidden
                                                            />
                                                            <span className="min-w-0 truncate">
                                                                {SLICE_LABEL[k]}
                                                            </span>
                                                        </span>
                                                        <span className="flex shrink-0 flex-row items-center gap-2 tabular-nums text-sm text-foreground">
                                                            <InvoiceDeltaVsPriorChip
                                                                current={v}
                                                                prior={prev}
                                                                ariaContext="fatia"
                                                            />
                                                            <span>
                                                                {currencyBRL(v)}
                                                            </span>
                                                        </span>
                                                    </Item>
                                                </li>
                                            )
                                        })}
                                    </ul>
                                </>
                            )}
                    </section>
                    <Separator tone="soft" />
                    <section className="space-y-3 py-6 text-sm">
                        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Hábitos de consumo
                        </h3>
                        <DescriptionList layout="grid" term="eyebrow" className="gap-2">
                            <DescriptionListItem>
                                <DescriptionTerm>
                                    Dias úteis
                                </DescriptionTerm>
                                {/* A fatia fica na linha do valor, dentro da definição. */}
                                <DescriptionDetails size="lg" className="flex items-baseline justify-between gap-2">
                                    <span>
                                        {currencyBRL(
                                            analytics.weekdayWeekend.weekdayTotal
                                        )}
                                    </span>
                                    <span className="shrink-0 text-xs text-muted-foreground">
                                        {percentPointsBR(analytics.weekdayWeekend.weekdayPct)}%
                                    </span>
                                </DescriptionDetails>
                            </DescriptionListItem>
                            <DescriptionListItem>
                                <DescriptionTerm>
                                    Fim de semana
                                </DescriptionTerm>
                                {/* A fatia fica na linha do valor, dentro da definição. */}
                                <DescriptionDetails size="lg" className="flex items-baseline justify-between gap-2">
                                    <span>
                                        {currencyBRL(
                                            analytics.weekdayWeekend.weekendTotal
                                        )}
                                    </span>
                                    <span className="shrink-0 text-xs text-muted-foreground">
                                        {percentPointsBR(analytics.weekdayWeekend.weekendPct)}%
                                    </span>
                                </DescriptionDetails>
                            </DescriptionListItem>
                        </DescriptionList>
                        <div className="space-y-2">
                            <InsightNoticePanel
                                variant="info"
                                icon={<ChartBarIcon />}
                            >
                                {strongestWeek != null && strongestWeekTotal > 0 ? (
                                    <>
                                        A maior concentração de gastos aconteceu na semana{" "}
                                        {strongestWeek} deste período, totalizando{" "}
                                        {currencyBRL(strongestWeekTotal)}.
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
                                icon={<CalendarDaysIcon />}
                            >
                                {analytics.closingCopy}
                            </InsightNoticePanel>
                        </div>
                    </section>
                    <Separator tone="soft" />
                    <section className="space-y-3 pt-6 text-sm">
                        <div className="flex w-full min-w-0 flex-wrap items-center justify-between gap-x-3 gap-y-2">
                            <h3 className="self-end text-xs font-semibold uppercase tracking-wide leading-none text-muted-foreground">
                                Perfil de gastos
                            </h3>
                            <Badge
                                tone="neutral"
                                className="shrink-0 text-2xs font-semibold uppercase tracking-wide"
                            >
                                {spendingProfileShortLabel(
                                    analytics.spendingProfile
                                )}
                            </Badge>
                        </div>

                        <DescriptionList layout="grid" term="eyebrow" className="gap-2">
                            <DescriptionListItem>
                                <DescriptionTerm>
                                    Ticket médio
                                </DescriptionTerm>
                                <DescriptionDetails size="lg">
                                    {analytics.meanTicket != null
                                        ? currencyBRL(analytics.meanTicket)
                                        : "—"}
                                    <DescriptionHint>
                                        Valor médio por despesa na fatura aberta.
                                    </DescriptionHint>
                                </DescriptionDetails>
                            </DescriptionListItem>
                            <DescriptionListItem>
                                <DescriptionTerm>
                                    Ticket mediano
                                </DescriptionTerm>
                                <DescriptionDetails size="lg">
                                    {analytics.medianTicket != null
                                        ? currencyBRL(analytics.medianTicket)
                                        : "—"}
                                    <DescriptionHint>
                                        Metade das despesas ficou abaixo deste valor.
                                    </DescriptionHint>
                                </DescriptionDetails>
                            </DescriptionListItem>
                        </DescriptionList>
                    </section>

                </CollapsibleContent>
            </Collapsible>

            <PageSection className="max-w-full">
                <PageSectionHeader>
                    <PageSectionTitle>Parcelas e compromissos</PageSectionTitle>
                </PageSectionHeader>
                <Card variant="elevated" padding="none">
                    {committedDetailLine ? (
                        <CardToolbar
                            aria-live="polite"
                        >
                            <p className="min-w-0 text-2xs leading-snug text-muted-foreground">
                                {committedDetailLine}
                            </p>
                        </CardToolbar>
                    ) : null}
                    <CardContent className="space-y-3 py-4">
                    <div className="space-y-2">
                        <div className="space-y-1">
                            <p className="text-2xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Total mínimo comprometido
                            </p>
                            <p className="text-2xl font-bold tabular-nums tracking-tight text-foreground md:text-3xl">
                                {currencyBRL(analytics.minimumCommittedOpen)}
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
                                                    size="md"
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
                                            <Item
                                                asChild
                                                interactive
                                                className="block rounded-[inherit] border-0 px-3 py-2.5"
                                            >
                                            <button
                                                type="button"
                                                aria-label={`Abrir detalhes da compra parcelada: ${row.plan.description?.trim() || "sem título"}`}
                                                onClick={() =>
                                                    onInstallmentPlanPress(row.plan.id)
                                                }
                                            >
                                                {body}
                                            </button>
                                            </Item>
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
            </PageSection>

        </div>
    )
}
