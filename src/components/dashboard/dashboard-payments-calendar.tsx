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

import { Card, CardContent, CardToolbar } from "@/components/ui/card"
import {
    Popover,
    PopoverAnchor,
    PopoverArrow,
    PopoverContent,
    PopoverHeader,
    PopoverTitle,
} from "@/components/ui/popover"
import { Calendar, CalendarEvent, CalendarEvents } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { labelYearMonthPt, parseYearMonth } from "@/lib/budget-month"
import { formatYmdPtBr, parseYmdLocal, localYmdFromDate } from "@/lib/transaction-date"
import { MoneyDisplay } from "@/components/ui/money-display"
import { transactionRowChipShell } from "@/components/ui/badge"
import {
    paymentEventMetaBadge,
    paymentEventTone,
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
}: {
    title: string
    kind: PaymentEventKind
    installmentPlanId?: string | null
    amount: number | null
    amountWhenNull?: "hide" | "dash"
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
                    tone={paymentEventAmountTone(kind)}
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
    const byYmd = React.useMemo(() => groupByYmd(events), [events])
    const calendarMonth = React.useMemo(() => {
        const { y, m } = parseYearMonth(calendarYm)
        return new Date(y, m - 1, 1)
    }, [calendarYm])

    // O que um evento abre: o lançamento, ou a prévia do que ainda não foi
    // lançado. Na lista da agenda estreita cada evento é o próprio botão.
    const openEvent = React.useCallback(
        (e: PaymentEvent) => {
            const postedId = postedTransactionIdFromEvent(e)
            if (postedId) onTransactionPostedClick(postedId)
            else onPaymentEventPreview(e)
        },
        [onTransactionPostedClick, onPaymentEventPreview],
    )

    // O conteúdo do dia na agenda (rodada 242): as peças do Calendar — até
    // duas fichas na grade, com o "+N mais", e todas na lista do telefone,
    // com o selo do tipo depois do título, como a lista antiga.
    const renderAgendaDay = React.useCallback(
        (date: Date) => {
            const list = byYmd.get(localYmdFromDate(date)) ?? []
            if (list.length === 0) return null
            return (
                <CalendarEvents max={2}>
                    {list.map((e) => {
                        const meta = paymentEventMetaBadge(e.kind, e.installmentPlanId)
                        return (
                            <CalendarEvent
                                key={e.id}
                                tone={paymentEventTone(e.kind, e.installmentPlanId)}
                                amount={e.amount}
                                meta={
                                    meta ? (
                                        <span className={cn(transactionRowChipShell, "whitespace-nowrap", meta.chipClass)}>
                                            {meta.label}
                                        </span>
                                    ) : undefined
                                }
                                onSelect={() => openEvent(e)}
                            >
                                {e.title}
                            </CalendarEvent>
                        )
                    })}
                </CalendarEvents>
            )
        },
        [byYmd, openEvent],
    )

    // Na lista do telefone, só os últimos 5 dias passados com evento e todos
    // os que vêm — o teto que a lista sempre teve. A grade mostra o mês todo.
    const diasDaLista = React.useMemo(() => {
        const dias = [...byYmd.keys()].sort().map((ymd) => ({ ymd }))
        return new Set(limitMobileCalendarDayGroups(dias, todayYmd, 5).map((d) => d.ymd))
    }, [byYmd, todayYmd])
    const listDays = React.useCallback(
        (date: Date) => diasDaLista.has(localYmdFromDate(date)),
        [diasDaLista],
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
                {/* A agenda do `Calendar` (rodadas 203 e 242): a grade de
                    fios com as fichas do dia, e abaixo de 40rem da própria
                    largura a lista do mês, onde cada evento é o botão. O dia
                    clicado na grade abre o popover e fica marcado. A grade de
                    pontos do telefone e a lista escrita à mão saíram. */}
                <div ref={mobileCalendarShellRef} className="min-w-0">
                    <Calendar
                        variant="agenda"
                        month={calendarMonth}
                        weekStartsOn={1}
                        hideNavigation
                        disableNavigation
                        showOutsideDays
                        mode="single"
                        selected={mobileDayPopoverYmd ? (parseYmdLocal(mobileDayPopoverYmd) ?? undefined) : undefined}
                        onSelect={() => {}}
                        renderDay={renderAgendaDay}
                        listEmpty="Nenhum evento neste mês"
                        listDays={listDays}
                        modifiers={{ vazio: (d) => !byYmd.has(localYmdFromDate(d)) }}
                        modifiersClassNames={{ vazio: "[&>button]:cursor-default" }}
                        classNames={{ month_caption: "sr-only" }}
                        onDayClick={(date, _mods, e) => {
                            const ymd = localYmdFromDate(date)
                            if (!byYmd.has(ymd)) return
                            mobileCalendarDayAnchorRef.current = e.currentTarget as HTMLElement
                            setMobileDayPopoverYmd(ymd)
                        }}
                    />
                </div>
                {mobileDayPopoverYmd ? (
                    // No telefone o dia abre numa gaveta (`mobile="sheet"`): a
                    // âncora é ignorada ali, e no desktop ela segue o dia clicado.
                    <Popover
                        mobile="sheet"
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
                            align="start"
                            sideOffset={6}
                            size="md"
                        >
                            <PopoverArrow />
                            <PopoverHeader>
                                <PopoverTitle>
                                    Lançamentos de{" "}
                                    {formatYmdPtBr(mobileDayPopoverYmd)}
                                </PopoverTitle>
                            </PopoverHeader>
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
                    </div>
                    </div>
                </CardContent>
            </Card>
            </div>
        </PageSection>
    )
}
