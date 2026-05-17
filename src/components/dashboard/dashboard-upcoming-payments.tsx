"use client"

import * as React from "react"
import { CalendarDaysIcon } from "@heroicons/react/24/outline"
import { Card, CardContent } from "@/components/ui/card"
import { MoneyDisplay } from "@/components/ui/money-display"
import { cn } from "@/lib/utils"
import {
    paymentEventHasMetaBadge,
    type PaymentEventKind,
    type UpcomingPaymentRow,
} from "@/components/dashboard/payment-events"
import {
    tagChipInfo,
    tagChipNeutral,
    tagChipWarning,
} from "@/lib/tag-chip-classes"
import { labelYearMonthPt } from "@/lib/budget-month"

function chipFor(kind: PaymentEventKind) {
    switch (kind) {
        case "subscription":
            return tagChipInfo
        case "installment":
            return tagChipWarning
        case "bill_due":
            return tagChipInfo
        case "card_close":
        case "card_due":
            return tagChipNeutral
        default:
            return tagChipNeutral
    }
}

function kindLabel(kind: PaymentEventKind): string {
    switch (kind) {
        case "subscription":
            return "Assinatura"
        case "installment":
            return "Parcelada"
        case "bill_due":
            return "Conta"
        case "card_close":
            return "Fechamento"
        case "card_due":
            return "Vencimento"
        default:
            return kind
    }
}

function upcomingMetaBadge(
    kind: PaymentEventKind,
    installmentPlanId?: string | null,
): { label: string; className: string } | null {
    if (!paymentEventHasMetaBadge({ kind, installmentPlanId })) return null
    const plan = installmentPlanId?.trim()
    if (
        (kind === "posted_expense" || kind === "posted_income") &&
        plan
    ) {
        return { label: "Parcelada", className: tagChipWarning }
    }
    return { label: kindLabel(kind), className: chipFor(kind) }
}

function daysLabel(d: number): string {
    if (d === 0) return "Hoje"
    if (d === 1) return "Amanhã"
    return `Em ${d} dias`
}

export function DashboardUpcomingPayments({
    rows,
    calendarYm,
    summary,
}: {
    rows: UpcomingPaymentRow[]
    calendarYm: string
    summary: { projected: number; paid: number; closings: number }
}) {
    const monthTitle = labelYearMonthPt(calendarYm)

    return (
        <div className="min-w-0 max-w-full space-y-2">
            <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Próximos pagamentos
                </p>
            </div>

            <Card
                className={cn(
                    "flex flex-col gap-0 overflow-hidden border border-border py-0 shadow-none ring-0",
                )}
            >
                <CardContent className="flex flex-col p-0">
                    <div className="flex min-h-10 shrink-0 items-center border-b border-border bg-muted/30 px-4 py-2.5">
                        <p className="min-w-0 text-sm font-semibold leading-snug text-foreground">
                            <span className="font-medium text-muted-foreground">
                                Resumo de{" "}
                            </span>
                            <span className="capitalize">{monthTitle}</span>
                        </p>
                    </div>

                    <div className="shrink-0 border-b border-border bg-muted/10 px-3 py-2.5 dark:bg-muted/20">
                        <dl className="space-y-1.5">
                            <div className="flex items-baseline justify-between gap-2 text-xs">
                                <dt
                                    className="min-w-0 shrink text-muted-foreground"
                                    title="Assinaturas + parcelas no mês"
                                >
                                    Previsto
                                </dt>
                                <dd className="shrink-0 font-semibold tabular-nums text-foreground">
                                    <MoneyDisplay
                                        value={summary.projected}
                                        className="text-xs font-semibold"
                                    />
                                </dd>
                            </div>
                            <div className="flex items-baseline justify-between gap-2 text-xs">
                                <dt className="min-w-0 shrink text-muted-foreground">
                                    Despesas lançadas
                                </dt>
                                <dd className="shrink-0 font-semibold tabular-nums text-foreground">
                                    <MoneyDisplay
                                        value={summary.paid}
                                        className="text-xs font-semibold"
                                    />
                                </dd>
                            </div>
                            <div className="flex items-baseline justify-between gap-2 text-xs">
                                <dt className="min-w-0 shrink text-muted-foreground">
                                    Fechamentos
                                </dt>
                                <dd className="shrink-0 font-semibold text-foreground">
                                    {summary.closings}
                                </dd>
                            </div>
                        </dl>
                    </div>

                    {rows.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-2 px-4 py-10 text-center">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/60">
                                <CalendarDaysIcon className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Nenhum pagamento futuro neste mês (a partir de hoje).
                            </p>
                        </div>
                    ) : (
                        <div>
                            <ul className="divide-y divide-border">
                                {rows.map((r) => {
                                    const meta = upcomingMetaBadge(
                                        r.kind,
                                        r.installmentPlanId,
                                    )
                                    return (
                                    <li key={r.id}>
                                        <div className="flex min-h-[44px] items-start justify-between gap-2 px-3 py-3 text-sm sm:px-3.5">
                                            <div className="min-w-0 flex-1 space-y-1">
                                                <p className="truncate font-semibold leading-snug text-foreground">
                                                    {r.title}
                                                </p>
                                                <span className="block tabular-nums text-xs leading-snug text-muted-foreground">
                                                    {r.dateYmd
                                                        .split("-")
                                                        .reverse()
                                                        .join("/")}
                                                </span>
                                            </div>
                                            <div className="flex shrink-0 flex-col items-end gap-1 text-right">
                                                <div className="flex max-w-[min(100%,11rem)] flex-row flex-wrap items-center justify-end gap-x-2 gap-y-1">
                                                    <span className="text-xs leading-snug text-muted-foreground">
                                                        {daysLabel(r.daysUntil)}
                                                    </span>
                                                    {meta ? (
                                                        <span
                                                            className={cn(
                                                                "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold leading-none",
                                                                meta.className,
                                                            )}
                                                        >
                                                            {meta.label}
                                                        </span>
                                                    ) : null}
                                                </div>
                                                {r.amount != null ? (
                                                    <MoneyDisplay
                                                        value={r.amount}
                                                        className="text-sm font-semibold"
                                                    />
                                                ) : (
                                                    <span
                                                        className="tabular-nums text-sm font-medium text-muted-foreground"
                                                        aria-label="Sem valor no calendário"
                                                    >
                                                        —
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </li>
                                    )
                                })}
                            </ul>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
