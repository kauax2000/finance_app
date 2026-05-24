"use client"

import * as React from "react"
import { CalendarDaysIcon } from "@heroicons/react/24/outline"
import { useIsMobile } from "@/hooks/use-mobile"
import { Card, CardContent } from "@/components/ui/card"
import {
    Popover,
    PopoverAnchor,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { currencyBRL } from "@/lib/formatters"
import { labelYearMonthPt, parseYearMonth } from "@/lib/budget-month"
import { parseYmdLocal, localYmdFromDate } from "@/lib/transaction-date"
import { MoneyDisplay } from "@/components/ui/money-display"
import {
    tagChipInfo,
    tagChipNeutral,
    tagChipSuccess,
    tagChipDanger,
    tagChipWarning,
    transactionRowChipShell,
} from "@/lib/tag-chip-classes"
import { paymentEventHasMetaBadge } from "@/components/dashboard/payment-events"
import type {
    PaymentEvent,
    PaymentEventKind,
    UpcomingPaymentRow,
} from "@/components/dashboard/payment-events"

const WEEKDAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"]

const MOBILE_DAY_MODIFIER_DOT = {
    hasSub: "relative after:absolute after:bottom-0.5 after:left-1/2 after:h-1 after:w-1 after:-translate-x-1/2 after:rounded-full after:bg-blue-500",
    hasInst:
        "relative after:absolute after:bottom-0.5 after:left-1/2 after:h-1 after:w-1 after:-translate-x-1/2 after:rounded-full after:bg-amber-500",
    hasBills:
        "relative after:absolute after:bottom-0.5 after:left-1/2 after:h-1 after:w-1 after:-translate-x-1/2 after:rounded-full after:bg-primary",
    hasCard:
        "relative after:absolute after:bottom-0.5 after:left-1/2 after:h-1 after:w-1 after:-translate-x-1/2 after:rounded-full after:bg-neutral-500",
    hasPosted:
        "relative after:absolute after:bottom-0.5 after:left-1/2 after:h-1 after:w-1 after:-translate-x-1/2 after:rounded-full after:bg-emerald-600",
} as const

type PaymentModifierDateSets = {
    sub: Date[]
    inst: Date[]
    bills: Date[]
    card: Date[]
    posted: Date[]
}

function ymdInModifierDates(ymd: string, dates: Date[]): boolean {
    return dates.some((d) => localYmdFromDate(d) === ymd)
}

function mobileDayModifierClasses(
    ymd: string,
    sets: PaymentModifierDateSets,
): string {
    return cn(
        ymdInModifierDates(ymd, sets.sub) && MOBILE_DAY_MODIFIER_DOT.hasSub,
        ymdInModifierDates(ymd, sets.inst) && MOBILE_DAY_MODIFIER_DOT.hasInst,
        ymdInModifierDates(ymd, sets.bills) && MOBILE_DAY_MODIFIER_DOT.hasBills,
        ymdInModifierDates(ymd, sets.card) && MOBILE_DAY_MODIFIER_DOT.hasCard,
        ymdInModifierDates(ymd, sets.posted) &&
            MOBILE_DAY_MODIFIER_DOT.hasPosted,
    )
}

function MobilePaymentsCalendarGrid({
    cells,
    todayYmd,
    modifierDates,
    byYmd,
    onDayWithEventsClick,
}: {
    cells: { ymd: string; inMonth: boolean; label: number }[]
    todayYmd: string
    modifierDates: PaymentModifierDateSets
    byYmd: Map<string, PaymentEvent[]>
    onDayWithEventsClick: (ymd: string, anchor: HTMLElement) => void
}) {
    return (
        <div className="min-w-0 w-full shrink-0 rounded-lg border border-border/60 p-1">
            <div className="mb-2 grid grid-cols-7 gap-1">
                {WEEKDAYS.map((d) => (
                    <div
                        key={d}
                        className="px-1 py-1 text-center text-[11px] font-medium uppercase tracking-wide text-muted-foreground"
                    >
                        {d}
                    </div>
                ))}
            </div>
            <div className="grid grid-cols-7 gap-1 [grid-auto-rows:minmax(2.5rem,1fr)]">
                {cells.map((cell) => {
                    const list = byYmd.get(cell.ymd) ?? []
                    const hasEvents = list.length > 0
                    const isToday = cell.ymd === todayYmd
                    return (
                        <button
                            key={cell.ymd}
                            type="button"
                            data-payment-ymd={cell.ymd}
                            disabled={!hasEvents}
                            onClick={(e) => {
                                if (!hasEvents) return
                                onDayWithEventsClick(
                                    cell.ymd,
                                    e.currentTarget,
                                )
                            }}
                            className={cn(
                                "flex min-h-10 w-full flex-col items-center justify-center rounded-md text-xs font-semibold tabular-nums transition-colors",
                                !cell.inMonth && "opacity-40",
                                isToday &&
                                    "ring-2 ring-primary ring-offset-2 ring-offset-background",
                                hasEvents
                                    ? "hover:bg-muted/40"
                                    : "cursor-default hover:bg-transparent",
                                mobileDayModifierClasses(
                                    cell.ymd,
                                    modifierDates,
                                ),
                                cell.inMonth
                                    ? "text-foreground"
                                    : "text-muted-foreground",
                            )}
                        >
                            {cell.label}
                        </button>
                    )
                })}
            </div>
        </div>
    )
}

function paymentEventAmountTone(kind: PaymentEventKind) {
    if (kind === "posted_income") return "income" as const
    if (kind === "posted_expense") return "expense" as const
    return "default" as const
}

function kindShortLabel(k: PaymentEventKind): string {
    switch (k) {
        case "subscription":
            return "Assinatura"
        case "installment":
            return "Parcelada"
        case "card_close":
            return "Fechamento"
        case "card_due":
            return "Vencimento"
        case "bill_due":
            return "Conta"
        case "posted_income":
            return "Receita"
        case "posted_expense":
            return "Despesa"
        default:
            return k
    }
}

function chipClass(kind: PaymentEventKind): string {
    switch (kind) {
        case "subscription":
            return tagChipInfo
        case "installment":
            return tagChipWarning
        case "card_close":
        case "card_due":
            return tagChipNeutral
        case "bill_due":
            return tagChipInfo
        case "posted_income":
            return tagChipSuccess
        case "posted_expense":
            return tagChipDanger
        default:
            return tagChipNeutral
    }
}

/** Meta chip: “Parcelada” + warning for posted rows tied to an installment plan. */
function metaBadgeLabelAndClass(
    kind: PaymentEventKind,
    installmentPlanId?: string | null,
): { label: string; chipClass: string } | null {
    if (!paymentEventHasMetaBadge({ kind, installmentPlanId })) return null
    const plan = installmentPlanId?.trim()
    if (
        (kind === "posted_expense" || kind === "posted_income") &&
        plan
    ) {
        return { label: "Parcelada", chipClass: tagChipWarning }
    }
    return { label: kindShortLabel(kind), chipClass: chipClass(kind) }
}

function buildCells(ym: string): { ymd: string; inMonth: boolean; label: number }[] {
    const { y, m } = parseYearMonth(ym)
    const first = new Date(y, m - 1, 1)
    const mondayPad = (first.getDay() + 6) % 7
    const cur = new Date(first)
    cur.setDate(first.getDate() - mondayPad)
    const out: { ymd: string; inMonth: boolean; label: number }[] = []
    for (let i = 0; i < 42; i++) {
        const ymd = localYmdFromDate(cur)
        out.push({
            ymd,
            inMonth: cur.getMonth() === m - 1,
            label: cur.getDate(),
        })
        cur.setDate(cur.getDate() + 1)
    }
    return out
}

function groupEventsByYmd(events: PaymentEvent[]): Map<string, PaymentEvent[]> {
    const m = new Map<string, PaymentEvent[]>()
    for (const e of events) {
        const list = m.get(e.dateYmd) ?? []
        list.push(e)
        m.set(e.dateYmd, list)
    }
    for (const [, list] of m) {
        list.sort((a, b) => a.id.localeCompare(b.id))
    }
    return m
}

function groupUpcomingRowsByYmd(
    rows: UpcomingPaymentRow[],
): { ymd: string; list: UpcomingPaymentRow[] }[] {
    const m = new Map<string, UpcomingPaymentRow[]>()
    for (const r of rows) {
        const list = m.get(r.dateYmd) ?? []
        list.push(r)
        m.set(r.dateYmd, list)
    }
    for (const [, list] of m) {
        list.sort((a, b) => a.id.localeCompare(b.id))
    }
    const keys = [...m.keys()].sort()
    return keys.map((ymd) => ({ ymd, list: m.get(ymd) ?? [] }))
}

/** Mobile list: at most `maxPastDays` distinct days with events on or before `todayYmd`, then all days after `todayYmd`. */
export function limitMobileCalendarDayGroups<T extends { ymd: string }>(
    grouped: T[],
    todayYmd: string,
    maxPastDays = 5,
): T[] {
    const past: T[] = []
    const future: T[] = []
    for (const g of grouped) {
        if (g.ymd.localeCompare(todayYmd) <= 0) past.push(g)
        else future.push(g)
    }
    return [...past.slice(-maxPastDays), ...future]
}

function ChargeRowCompactInner({
    title,
    kind,
    installmentPlanId,
    amount,
    amountWhenNull = "hide",
    neutralAmount = false,
}: {
    title: string
    kind: PaymentEventKind
    installmentPlanId?: string | null
    amount: number | null
    amountWhenNull?: "hide" | "dash"
    /** When true, amount uses foreground color (no income/expense red-green). */
    neutralAmount?: boolean
}) {
    const meta = metaBadgeLabelAndClass(kind, installmentPlanId)
    return (
        <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
            <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden">
                <span className="min-w-0 truncate">{title}</span>
                {meta ? (
                    <span
                        className={cn(
                            transactionRowChipShell,
                            "whitespace-nowrap",
                            meta.chipClass,
                        )}
                    >
                        {meta.label}
                    </span>
                ) : null}
            </div>
            {amount != null ? (
                <MoneyDisplay
                    value={amount}
                    tone={
                        neutralAmount ? "default" : paymentEventAmountTone(kind)
                    }
                    size="sm"
                    className="shrink-0 font-medium text-xs"
                />
            ) : amountWhenNull === "dash" ? (
                <span className="shrink-0 tabular-nums text-xs font-medium text-muted-foreground">
                    —
                </span>
            ) : null}
        </div>
    )
}

function paymentDayDateLabel(ymd: string): string {
    return ymd.split("-").reverse().join("/")
}

function postedTransactionIdFromEvent(e: PaymentEvent): string | null {
    if (e.kind !== "posted_income" && e.kind !== "posted_expense") return null
    if (e.transactionId) return e.transactionId
    if (e.id.startsWith("tx-")) return e.id.slice(3)
    return null
}

function PaymentDayEventsListContent({
    events,
    onTransactionPostedClick,
    onPaymentEventPreview,
}: {
    events: PaymentEvent[]
    onTransactionPostedClick: (transactionId: string) => void
    onPaymentEventPreview: (event: PaymentEvent) => void
}) {
    if (events.length === 0) {
        return (
            <p className="text-sm text-muted-foreground">Sem eventos</p>
        )
    }
    return (
        <ul className="max-h-[min(24rem,70vh)] space-y-2 overflow-y-auto">
            {events.map((e) => {
                const postedId = postedTransactionIdFromEvent(e)
                const meta = metaBadgeLabelAndClass(e.kind, e.installmentPlanId)
                return (
                    <li key={e.id}>
                        <button
                            type="button"
                            className="flex w-full items-center justify-between gap-3 rounded-md px-2 py-2 text-left text-sm hover:bg-muted/50"
                            onClick={() => {
                                if (postedId) {
                                    onTransactionPostedClick(postedId)
                                    return
                                }
                                onPaymentEventPreview(e)
                            }}
                        >
                            <div className="flex min-w-0 flex-1 items-center gap-2">
                                <span className="min-w-0 truncate font-medium leading-snug text-foreground">
                                    {e.title}
                                </span>
                                {meta ? (
                                    <span
                                        className={cn(
                                            transactionRowChipShell,
                                            "whitespace-nowrap",
                                            meta.chipClass,
                                        )}
                                    >
                                        {meta.label}
                                    </span>
                                ) : null}
                            </div>
                            {e.amount != null ? (
                                <MoneyDisplay
                                    value={e.amount}
                                    tone="default"
                                    size="sm"
                                    className="shrink-0 text-xs font-semibold"
                                />
                            ) : (
                                <span
                                    className="shrink-0 text-xs font-semibold tabular-nums text-muted-foreground"
                                    aria-hidden
                                >
                                    —
                                </span>
                            )}
                        </button>
                    </li>
                )
            })}
        </ul>
    )
}

function EventChips({
    events,
    max = 2,
}: {
    events: PaymentEvent[]
    max?: number
}) {
    const shown = events.slice(0, max)
    const rest = events.length - shown.length
    return (
        <div className="flex flex-col gap-0.5">
            {shown.map((e) => {
                const postedParcela =
                    (e.kind === "posted_income" ||
                        e.kind === "posted_expense") &&
                    Boolean(e.installmentPlanId?.trim())
                return (
                <div
                    key={e.id}
                    className={cn(
                        "truncate rounded px-1 py-0.5 text-[10px] font-medium leading-tight",
                        postedParcela
                            ? tagChipWarning
                            : e.kind === "posted_income" ||
                                e.kind === "posted_expense"
                              ? "bg-muted/50 text-muted-foreground"
                              : chipClass(e.kind),
                    )}
                    title={e.title}
                >
                    {e.kind === "posted_income" || e.kind === "posted_expense"
                        ? e.amount != null
                            ? (
                                  <span className="tabular-nums">
                                      {currencyBRL(e.amount)}
                                  </span>
                              )
                            : e.title.slice(0, 12)
                        : e.title.slice(0, 14)}
                </div>
                )
            })}
            {rest > 0 ? (
                <span className="text-[10px] font-medium text-muted-foreground">
                    +{rest}
                </span>
            ) : null}
        </div>
    )
}

export function DashboardPaymentsCalendar({
    calendarYm,
    events,
    todayYmd,
    summary,
    upcomingRows,
    measureRef,
    onTransactionPostedClick,
    onPaymentEventPreview,
    onUpcomingPaymentClick,
}: {
    calendarYm: string
    onCalendarYmChange: (ym: string) => void
    events: PaymentEvent[]
    todayYmd: string
    summary: { projected: number; paid: number; closings: number }
    upcomingRows: UpcomingPaymentRow[]
    /** Wraps the calendar card only; used to sync sidebar card height on lg. */
    measureRef?: React.Ref<HTMLDivElement>
    onTransactionPostedClick: (transactionId: string) => void
    onPaymentEventPreview: (event: PaymentEvent) => void
    onUpcomingPaymentClick: (row: UpcomingPaymentRow) => void
}) {
    const isMobile = useIsMobile()
    const byYmd = React.useMemo(() => groupEventsByYmd(events), [events])
    const cells = React.useMemo(() => buildCells(calendarYm), [calendarYm])

    const modifierDates = React.useMemo(() => {
        const sub: Date[] = []
        const inst: Date[] = []
        const bills: Date[] = []
        const card: Date[] = []
        const posted: Date[] = []
        for (const e of events) {
            const d = parseYmdLocal(e.dateYmd)
            if (!d) continue
            if (e.kind === "subscription") sub.push(d)
            else if (e.kind === "installment") inst.push(d)
            else if (e.kind === "bill_due") bills.push(d)
            else if (e.kind === "card_close" || e.kind === "card_due") card.push(d)
            else posted.push(d)
        }
        return { sub, inst, bills, card, posted }
    }, [events])

    const mobileGrouped = React.useMemo(() => {
        const keys = [...byYmd.keys()].sort()
        return keys.map((k) => ({
            ymd: k,
            list: byYmd.get(k) ?? [],
        }))
    }, [byYmd])

    const mobileGroupedForList = React.useMemo(
        () => limitMobileCalendarDayGroups(mobileGrouped, todayYmd, 5),
        [mobileGrouped, todayYmd],
    )

    const upcomingGrouped = React.useMemo(
        () => groupUpcomingRowsByYmd(upcomingRows),
        [upcomingRows],
    )

    /** Radix Popper `virtualRef`: real day cell button for correct positioning. */
    const mobileCalendarDayAnchorRef = React.useRef<HTMLElement | null>(null)
    const mobileCalendarShellRef = React.useRef<HTMLDivElement | null>(null)
    const [mobileDayPopoverYmd, setMobileDayPopoverYmd] = React.useState<
        string | null
    >(null)

    React.useEffect(() => {
        setMobileDayPopoverYmd(null)
        mobileCalendarDayAnchorRef.current = null
    }, [calendarYm])

    const closeMobileDayPopover = React.useCallback(() => {
        setMobileDayPopoverYmd(null)
        mobileCalendarDayAnchorRef.current = null
    }, [])

    React.useLayoutEffect(() => {
        if (!mobileDayPopoverYmd) return
        const shell = mobileCalendarShellRef.current
        const live =
            shell?.querySelector<HTMLElement>(
                `[data-payment-ymd="${mobileDayPopoverYmd}"]`,
            ) ?? null
        if (live) {
            mobileCalendarDayAnchorRef.current = live
        }
    }, [mobileDayPopoverYmd])

    const monthTitle = labelYearMonthPt(calendarYm)

    return (
        <div className="min-w-0 max-w-full space-y-2">
            <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex h-8 min-w-0 items-end">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                        Calendário de pagamentos
                    </p>
                </div>
            </div>
            <div ref={measureRef} className="min-h-0">
            <Card className="gap-0 overflow-hidden border border-border py-0 shadow-none ring-0">
                <CardContent className="relative flex flex-col gap-0 p-0">
                    <div
                        className="flex min-h-10 shrink-0 items-center border-b border-border bg-muted/30 px-4 py-2.5"
                        aria-live="polite"
                    >
                        <p className="text-sm font-semibold capitalize leading-snug text-foreground">
                            {monthTitle}
                        </p>
                    </div>
                    <div className="shrink-0 border-b border-border bg-muted/10 px-3 py-2.5 dark:bg-muted/20">
                        <dl className="grid grid-cols-1 gap-x-6 gap-y-1.5 sm:grid-cols-3">
                            <div className="flex items-baseline justify-between gap-2 text-xs sm:flex-col sm:items-start">
                                <dt
                                    className="min-w-0 shrink text-muted-foreground"
                                    title="Assinaturas + parcelas no mês"
                                >
                                    Previsto
                                </dt>
                                <dd className="shrink-0 font-semibold tabular-nums text-foreground sm:shrink sm:text-sm">
                                    <MoneyDisplay
                                        value={summary.projected}
                                        className="text-xs font-semibold sm:text-sm"
                                    />
                                </dd>
                            </div>
                            <div className="flex items-baseline justify-between gap-2 text-xs sm:flex-col sm:items-start">
                                <dt className="min-w-0 shrink text-muted-foreground">
                                    Despesas lançadas
                                </dt>
                                <dd className="shrink-0 font-semibold tabular-nums text-foreground sm:shrink sm:text-sm">
                                    <MoneyDisplay
                                        value={summary.paid}
                                        className="text-xs font-semibold sm:text-sm"
                                    />
                                </dd>
                            </div>
                            <div className="flex items-baseline justify-between gap-2 text-xs sm:flex-col sm:items-start">
                                <dt className="min-w-0 shrink text-muted-foreground">
                                    Fechamentos
                                </dt>
                                <dd className="shrink-0 font-semibold text-foreground sm:text-sm">
                                    {summary.closings}
                                </dd>
                            </div>
                        </dl>
                    </div>
                    <div className="flex min-w-0 flex-col border-b border-border lg:flex-row lg:items-stretch">
                    <div className="hidden min-w-0 shrink-0 border-b border-border px-4 py-3 lg:block lg:w-80 lg:border-b-0 lg:border-e lg:border-border lg:px-3 xl:px-4">
                        <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                            Próximos lançamentos
                        </p>
                        {upcomingRows.length === 0 ? (
                            <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/60">
                                    <CalendarDaysIcon className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <p className="text-xs text-muted-foreground sm:text-sm">
                                    Nenhum pagamento futuro neste mês (a partir de
                                    hoje).
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {upcomingGrouped.map(({ ymd, list }) => (
                                    <div key={ymd} className="space-y-1.5">
                                        <div className="bg-card px-2 py-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                                            {ymd.split("-").reverse().join("/")}
                                        </div>
                                        <div className="space-y-1.5 pl-1">
                                            {list.map((r) => (
                                                <button
                                                    key={r.id}
                                                    type="button"
                                                    className="flex w-full items-center justify-between gap-2 rounded-lg border border-border/60 px-2 py-2 text-left text-sm hover:bg-muted/40"
                                                    onClick={() =>
                                                        onUpcomingPaymentClick(r)
                                                    }
                                                >
                                                    <ChargeRowCompactInner
                                                        title={r.title}
                                                        kind={r.kind}
                                                        installmentPlanId={
                                                            r.installmentPlanId
                                                        }
                                                        amount={r.amount}
                                                        amountWhenNull="dash"
                                                    />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="relative flex min-h-0 min-w-0 flex-1 flex-col gap-4 p-3 md:p-4">
                {isMobile ? (
                    <>
                        <div
                            ref={mobileCalendarShellRef}
                            className="min-w-0 w-full shrink-0"
                        >
                            <MobilePaymentsCalendarGrid
                                cells={cells}
                                todayYmd={todayYmd}
                                modifierDates={modifierDates}
                                byYmd={byYmd}
                                onDayWithEventsClick={(ymd, anchor) => {
                                    mobileCalendarDayAnchorRef.current = anchor
                                    setMobileDayPopoverYmd(ymd)
                                }}
                            />
                        </div>
                        {mobileDayPopoverYmd ? (
                            <Popover
                                modal
                                open
                                onOpenChange={(open) => {
                                    if (!open) {
                                        setMobileDayPopoverYmd(null)
                                        mobileCalendarDayAnchorRef.current =
                                            null
                                    }
                                }}
                            >
                                <PopoverAnchor
                                    virtualRef={
                                        mobileCalendarDayAnchorRef as React.RefObject<{
                                            getBoundingClientRect: () => DOMRect
                                        }>
                                    }
                                />
                                <PopoverContent
                                    side="bottom"
                                    align="center"
                                    sideOffset={6}
                                    collisionPadding={12}
                                    className="w-[min(calc(100vw-2rem),18rem)] max-w-[min(calc(100vw-2rem),18rem)] p-2"
                                    aria-describedby={undefined}
                                >
                                    <p className="sr-only">
                                        Lançamentos do dia{" "}
                                        {paymentDayDateLabel(
                                            mobileDayPopoverYmd,
                                        )}
                                    </p>
                                    <p className="mb-2 text-xs font-medium text-muted-foreground">
                                        {paymentDayDateLabel(
                                            mobileDayPopoverYmd,
                                        )}
                                    </p>
                                    <PaymentDayEventsListContent
                                        events={
                                            byYmd.get(mobileDayPopoverYmd) ??
                                            []
                                        }
                                        onTransactionPostedClick={(id) => {
                                            closeMobileDayPopover()
                                            onTransactionPostedClick(id)
                                        }}
                                        onPaymentEventPreview={(e) => {
                                            closeMobileDayPopover()
                                            onPaymentEventPreview(e)
                                        }}
                                    />
                                </PopoverContent>
                            </Popover>
                        ) : null}
                        <div className="relative z-0 space-y-3">
                            {mobileGroupedForList.length === 0 ? (
                                <p className="py-6 text-center text-sm text-muted-foreground">
                                    Nenhum evento neste mês
                                </p>
                            ) : (
                                mobileGroupedForList.map(({ ymd, list }) => (
                                    <div key={ymd} className="space-y-1.5">
                                        <div className="bg-card px-2 py-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                                            {ymd.split("-").reverse().join("/")}
                                        </div>
                                        <div className="space-y-1.5 pl-1">
                                            {list.map((e) => (
                                                <button
                                                    key={e.id}
                                                    type="button"
                                                    className="flex w-full items-center justify-between gap-2 rounded-lg border border-border/60 px-2 py-2 text-left text-sm hover:bg-muted/40"
                                                    onClick={() => {
                                                        const postedId =
                                                            postedTransactionIdFromEvent(
                                                                e,
                                                            )
                                                        if (postedId) {
                                                            onTransactionPostedClick(
                                                                postedId,
                                                            )
                                                        } else {
                                                            onPaymentEventPreview(
                                                                e,
                                                            )
                                                        }
                                                    }}
                                                >
                                                    <ChargeRowCompactInner
                                                        title={e.title}
                                                        kind={e.kind}
                                                        installmentPlanId={
                                                            e.installmentPlanId
                                                        }
                                                        amount={e.amount}
                                                        neutralAmount
                                                    />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </>
                ) : (
                    <div className="overflow-x-auto">
                        <div className="min-w-[720px]">
                            <div className="grid grid-cols-7 gap-1">
                                {WEEKDAYS.map((d) => (
                                    <div
                                        key={d}
                                        className="px-1 py-1 text-center text-[11px] font-medium uppercase tracking-wide text-muted-foreground"
                                    >
                                        {d}
                                    </div>
                                ))}
                                {cells.map((cell) => {
                                    const list = byYmd.get(cell.ymd) ?? []
                                    const isToday = cell.ymd === todayYmd
                                    return (
                                        <Popover key={cell.ymd}>
                                            <PopoverTrigger asChild>
                                                <button
                                                    type="button"
                                                    disabled={list.length === 0}
                                                    className={cn(
                                                        "flex min-h-24 flex-col rounded-lg border border-border/60 bg-card p-1.5 text-left transition-colors hover:bg-muted/20",
                                                        !cell.inMonth &&
                                                            "opacity-40",
                                                        isToday &&
                                                            "ring-2 ring-primary ring-offset-2 ring-offset-background",
                                                        list.length === 0 &&
                                                            "cursor-default hover:bg-card"
                                                    )}
                                                >
                                                    <span
                                                        className={cn(
                                                            "text-xs font-semibold tabular-nums",
                                                            cell.inMonth
                                                                ? "text-foreground"
                                                                : "text-muted-foreground"
                                                        )}
                                                    >
                                                        {cell.label}
                                                    </span>
                                                    <div className="mt-1 flex-1">
                                                        {list.length > 0 ? (
                                                            <EventChips
                                                                events={list}
                                                                max={2}
                                                            />
                                                        ) : null}
                                                    </div>
                                                </button>
                                            </PopoverTrigger>
                                            <PopoverContent
                                                className="w-72 p-2"
                                                align="start"
                                            >
                                                <p className="mb-2 text-xs font-medium text-muted-foreground">
                                                    {paymentDayDateLabel(
                                                        cell.ymd,
                                                    )}
                                                </p>
                                                <PaymentDayEventsListContent
                                                    events={list}
                                                    onTransactionPostedClick={
                                                        onTransactionPostedClick
                                                    }
                                                    onPaymentEventPreview={
                                                        onPaymentEventPreview
                                                    }
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                )}
                    </div>
                    </div>
                </CardContent>
            </Card>
            </div>
        </div>
    )
}
