"use client"

import { CalendarDaysIcon } from "@heroicons/react/16/solid"
import {
    Item,
} from "@/components/ui/item"
import {
    PageSection,
    PageSectionHeader,
    PageSectionTitle,
} from "@/components/ui/page-section"
import * as React from "react"

import { useIsMobile } from "@/hooks/use-mobile"
import { Card, CardContent, CardToolbar } from "@/components/ui/card"
import {
    Popover,
    PopoverAnchor,
    PopoverContent,
    PopoverTitle,
} from "@/components/ui/popover"
import { Calendar, type CalendarMarker } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { currencyBRL } from "@/lib/formatters"
import { labelYearMonthPt, parseYearMonth } from "@/lib/budget-month"
import { formatYmdPtBr, parseYmdLocal, localYmdFromDate } from "@/lib/transaction-date"
import { MoneyDisplay } from "@/components/ui/money-display"
import { tagChipWarning, transactionRowChipShell } from "@/components/ui/badge"
import {
    paymentEventChipClass,
    paymentEventMetaBadge,
} from "@/components/dashboard/payment-event-badge"
import type {
    PaymentEvent,
    PaymentEventKind,
    UpcomingPaymentRow,
} from "@/components/dashboard/payment-events"

function paymentEventAmountTone(kind: PaymentEventKind) {
    if (kind === "posted_income") return "income" as const
    if (kind === "posted_expense") return "expense" as const
    return "default" as const
}

/** Linhas por dia, cada dia em ordem estável de `id`. */
function groupByYmd<T extends { dateYmd: string; id: string }>(rows: T[]): Map<string, T[]> {
    const m = new Map<string, T[]>()
    for (const r of rows) {
        const list = m.get(r.dateYmd) ?? []
        list.push(r)
        m.set(r.dateYmd, list)
    }
    for (const [, list] of m) {
        list.sort((a, b) => a.id.localeCompare(b.id))
    }
    return m
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
    const meta = paymentEventMetaBadge(kind, installmentPlanId)
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
                const meta = paymentEventMetaBadge(e.kind, e.installmentPlanId)
                return (
                    <li key={e.id}>
                        <Item
                            asChild
                            interactive
                            size="sm"
                            className="justify-between gap-3 rounded-md border-0 px-2 py-2"
                        >
                        <button
                            type="button"
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
                        </Item>
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
                        "truncate rounded px-1 py-0.5 text-2xs font-medium leading-tight",
                        postedParcela
                            ? tagChipWarning
                            : e.kind === "posted_income" ||
                                e.kind === "posted_expense"
                              ? "bg-muted/50 text-muted-foreground"
                              : paymentEventChipClass(e.kind),
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
                <span className="text-2xs font-medium text-muted-foreground">
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
    const byYmd = React.useMemo(() => groupByYmd(events), [events])
    const calendarMonth = React.useMemo(() => {
        const { y, m } = parseYearMonth(calendarYm)
        return new Date(y, m - 1, 1)
    }, [calendarYm])

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

    // Os pontos da grade do telefone, um tom por tipo — os tokens semânticos
    // no lugar das cinco cores cruas que a grade escrita à mão usava.
    const paymentMarkers = React.useMemo<CalendarMarker[]>(
        () => [
            { dates: modifierDates.sub, tone: "info", label: "Assinatura" },
            { dates: modifierDates.inst, tone: "warning", label: "Parcela" },
            { dates: modifierDates.bills, tone: "primary", label: "Conta a pagar" },
            { dates: modifierDates.card, tone: "default", label: "Fatura do cartão" },
            { dates: modifierDates.posted, tone: "success", label: "Lançado" },
        ],
        [modifierDates],
    )

    // O conteúdo da célula da agenda: as fichas do dia, até duas.
    const renderAgendaDay = React.useCallback(
        (date: Date) => {
            const list = byYmd.get(localYmdFromDate(date)) ?? []
            return list.length > 0 ? <EventChips events={list} max={2} /> : null
        },
        [byYmd],
    )

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
        () => [...groupByYmd(upcomingRows)]
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([ymd, list]) => ({ ymd, list })),
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
                `button[data-day="${mobileDayPopoverYmd}"]`,
            ) ?? null
        if (live) {
            mobileCalendarDayAnchorRef.current = live
        }
    }, [mobileDayPopoverYmd])

    const monthTitle = labelYearMonthPt(calendarYm)

    return (
        <PageSection className="max-w-full">
            <PageSectionHeader>
                <PageSectionTitle>Calendário de pagamentos</PageSectionTitle>
            </PageSectionHeader>
            <div ref={measureRef} className="min-h-0">
            <Card padding="none">
                <CardContent className="relative flex flex-col gap-0">
                    <CardToolbar
                        aria-live="polite"
                    >
                        <p className="text-sm font-semibold leading-snug text-foreground">
                            {monthTitle}
                        </p>
                    </CardToolbar>
                    <CardToolbar>
                        <dl className="grid grid-cols-1 gap-x-6 gap-y-1.5 sm:grid-cols-3">
                            <div className="flex items-baseline justify-between gap-2 text-xs sm:flex-col sm:items-start">
                                <dt
                                    className="min-w-0 shrink text-muted-foreground"
                                    title="Complemento planejado no mês de despesa (assinaturas, parcelas e contas ainda não lançadas)"
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
                    </CardToolbar>
                    <div className="flex min-w-0 flex-col border-b border-border lg:flex-row lg:items-stretch">
                    <div className="hidden min-w-0 shrink-0 border-b border-border px-4 py-3 lg:block lg:w-80 lg:border-b-0 lg:border-e lg:border-border lg:px-3 xl:px-4">
                        <p className="mb-2 text-2xs font-medium uppercase tracking-wide text-muted-foreground">
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
                                        <div className="bg-card px-2 py-1 text-2xs font-medium uppercase tracking-wide text-muted-foreground">
                                            {formatYmdPtBr(ymd)}
                                        </div>
                                        <div className="space-y-1.5 pl-1">
                                            {list.map((r) => (
                                                <Item
                                                    key={r.id}
                                                    asChild
                                                    interactive
                                                    variant="outline"
                                                    size="sm"
                                                    className="justify-between gap-2 border-border/60 px-2 py-2"
                                                >
                                                <button
                                                    type="button"
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
                                                </Item>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="relative flex min-h-0 min-w-0 flex-1 flex-col gap-4 p-3 md:p-4">
                {/* As duas grades são o `Calendar` (rodada 203): a do
                    telefone com os pontos por tipo de evento, a do desktop na
                    agenda, com as fichas do dia. Eram escritas à mão — botões
                    crus, os pontos em cinco cores cruas, e um popover por
                    célula no desktop. Agora um popover só, ancorado no dia
                    clicado, serve as duas. */}
                <div ref={mobileCalendarShellRef} className={isMobile ? "min-w-0 w-full shrink-0" : "overflow-x-auto"}>
                    <div className={isMobile ? undefined : "min-w-180"}>
                        <Calendar
                            variant={isMobile ? "default" : "agenda"}
                            stretch
                            month={calendarMonth}
                            weekStartsOn={1}
                            hideNavigation
                            disableNavigation
                            showOutsideDays
                            markers={isMobile ? paymentMarkers : undefined}
                            renderDay={renderAgendaDay}
                            modifiers={{ vazio: (d) => !byYmd.has(localYmdFromDate(d)) }}
                            modifiersClassNames={{ vazio: "[&>button]:cursor-default" }}
                            classNames={{ month_caption: "sr-only" }}
                            className={isMobile ? "rounded-lg border border-border/60 p-1" : undefined}
                            onDayClick={(date, _mods, e) => {
                                const ymd = localYmdFromDate(date)
                                if (!byYmd.has(ymd)) return
                                mobileCalendarDayAnchorRef.current = e.currentTarget as HTMLElement
                                setMobileDayPopoverYmd(ymd)
                            }}
                        />
                    </div>
                </div>
                {mobileDayPopoverYmd ? (
                    <Popover
                        modal={isMobile}
                        open
                        onOpenChange={(open) => {
                            if (!open) {
                                setMobileDayPopoverYmd(null)
                                mobileCalendarDayAnchorRef.current = null
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
                            align={isMobile ? "center" : "start"}
                            sideOffset={6}
                            className="w-[min(calc(100vw-2rem),18rem)] max-w-[min(calc(100vw-2rem),18rem)] p-2"
                            aria-describedby={undefined}
                        >
                            <PopoverTitle className="sr-only">
                                Lançamentos do dia{" "}
                                {formatYmdPtBr(mobileDayPopoverYmd)}
                            </PopoverTitle>
                            <p className="mb-2 text-xs font-medium text-muted-foreground">
                                {formatYmdPtBr(mobileDayPopoverYmd)}
                            </p>
                            <PaymentDayEventsListContent
                                events={byYmd.get(mobileDayPopoverYmd) ?? []}
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
                {isMobile ? (
                        <div className="relative z-0 space-y-3">
                            {mobileGroupedForList.length === 0 ? (
                                <p className="py-6 text-center text-sm text-muted-foreground">
                                    Nenhum evento neste mês
                                </p>
                            ) : (
                                mobileGroupedForList.map(({ ymd, list }) => (
                                    <div key={ymd} className="space-y-1.5">
                                        <div className="bg-card px-2 py-1 text-2xs font-medium uppercase tracking-wide text-muted-foreground">
                                            {formatYmdPtBr(ymd)}
                                        </div>
                                        <div className="space-y-1.5 pl-1">
                                            {list.map((e) => (
                                                <Item
                                                    key={e.id}
                                                    asChild
                                                    interactive
                                                    variant="outline"
                                                    size="sm"
                                                    className="justify-between gap-2 border-border/60 px-2 py-2"
                                                >
                                                <button
                                                    type="button"
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
                                                </Item>
                                            ))}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                ) : null}
                    </div>
                    </div>
                </CardContent>
            </Card>
            </div>
        </PageSection>
    )
}
