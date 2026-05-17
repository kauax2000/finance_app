"use client"

import { useMemo } from "react"
import Link from "next/link"
import { CreditCardIcon as CreditCardGlyph, ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MoneyDisplay } from "@/components/ui/money-display"
import { CreditCardFaceTilt } from "@/components/credit-cards/credit-card-face-tilt"
import { RegisteredCreditCardFace } from "@/components/credit-cards/registered-credit-card-face"
import {
    formatDatePtBr,
    type CardMonthlyInvoiceSnapshot,
} from "@/lib/credit-card-billing"
import type { CreditCard } from "@/lib/supabase"
import { creditCardDetailPath, ROUTES } from "@/config/navigation"
import { creditCardIdentitySubtitle } from "@/lib/credit-card-display"
import { labelYearMonthPt } from "@/lib/budget-month"
const currencyFmt = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
})

function openInvoicesSummary(
    active: CreditCard[],
    snapshots: Map<string, CardMonthlyInvoiceSnapshot>
): {
    totalCommitted: number
    activeCount: number
    earliestDue: Date | null
} {
    let totalCommitted = 0
    let earliestDue: Date | null = null
    for (const c of active) {
        const snap = snapshots.get(c.id)
        if (!snap) continue
        totalCommitted += Number(snap.committedTotal)
        const due = snap.dueEstimate
        if (!earliestDue || due.getTime() < earliestDue.getTime()) {
            earliestDue = due
        }
    }
    return {
        totalCommitted,
        activeCount: active.length,
        earliestDue,
    }
}

function InvoiceRow({
    card,
    snap,
}: {
    card: CreditCard
    snap: CardMonthlyInvoiceSnapshot | undefined
}) {
    const committedTotal = snap?.committedTotal ?? snap?.postedTotal ?? 0
    const postedTotal = snap?.postedTotal ?? 0
    const projectedParcelas = snap?.projectedInstallmentsTotal ?? 0
    const href = creditCardDetailPath(card.id)
    const subtitle = creditCardIdentitySubtitle(card)
    const statusLabel =
        snap?.status === "closed"
            ? "Fechada"
            : snap?.status === "open"
              ? "Aberta"
              : snap?.status === "not_open"
                ? "Ainda não aberta"
                : "—"
    const ariaLabel = `Abrir cartão ${card.name}, final ${card.last_four}. ${statusLabel}. Total ${currencyFmt.format(committedTotal)}.`
    const statusVariant =
        snap?.status === "open"
            ? "success"
            : snap?.status === "not_open"
              ? "warning"
              : "secondary"

    return (
        <li className="list-none">
            <Link
                href={href}
                aria-label={ariaLabel}
                className={[
                    "block border-b border-border last:border-b-0",
                    "px-4 py-4 outline-none transition-colors",
                    "hover:bg-muted/30 focus-visible:bg-muted/30",
                    "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                ].join(" ")}
            >
                <div className="flex min-w-0 flex-col gap-4">
                    <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:gap-4">
                        <div className="w-full min-w-0 shrink-0 sm:w-[10.75rem] sm:max-w-[10.75rem]">
                            <CreditCardFaceTilt className="w-full">
                                <RegisteredCreditCardFace
                                    card={card}
                                    size="sm"
                                    showInactiveBadge={false}
                                />
                            </CreditCardFaceTilt>
                        </div>

                        <div className="min-w-0 flex-1">
                            <div className="min-w-0 space-y-1">
                                <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 max-sm:flex-nowrap max-sm:justify-between">
                                    <p className="min-w-0 max-w-full truncate text-lg font-semibold leading-snug text-foreground max-sm:flex-1 max-sm:min-w-0">
                                        {card.name}
                                    </p>
                                    <Badge
                                        variant={statusVariant}
                                        className="shrink-0 px-2 py-0.5 text-[11px] font-medium whitespace-nowrap"
                                    >
                                        {statusLabel}
                                    </Badge>
                                </div>
                                <p className="min-w-0 truncate text-sm text-muted-foreground">
                                    {subtitle}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="min-w-0 w-full">
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:items-stretch">
                            <div className="min-w-0 rounded-lg border border-border/70 bg-muted/10 p-3 dark:bg-muted/5">
                                <div className="flex flex-col gap-2 min-[480px]:flex-row min-[480px]:items-baseline min-[480px]:justify-between">
                                    <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                                        Total do cartão
                                    </p>
                                    <p className="text-xl font-semibold tabular-nums tracking-tight text-foreground min-[480px]:text-right">
                                        {currencyFmt.format(committedTotal)}
                                    </p>
                                </div>
                                {postedTotal > 0 || projectedParcelas > 0 ? (
                                    <div className="mt-3 space-y-1 border-t border-border/50 pt-3 text-[11px] leading-relaxed text-muted-foreground">
                                        {postedTotal > 0 ? (
                                            <p className="tabular-nums">
                                                <span className="font-medium text-foreground/80">
                                                    Registrado:{" "}
                                                </span>
                                                {currencyFmt.format(postedTotal)}
                                            </p>
                                        ) : null}
                                        {projectedParcelas > 0 ? (
                                            <p className="tabular-nums">
                                                <span className="font-medium text-foreground/80">
                                                    Previsto:{" "}
                                                </span>
                                                {currencyFmt.format(projectedParcelas)}
                                            </p>
                                        ) : null}
                                    </div>
                                ) : null}
                            </div>

                            <div className="grid min-w-0 grid-cols-2 gap-2 sm:flex sm:flex-col sm:gap-2">
                                <div className="min-w-0 rounded-md border border-border/60 bg-muted/15 px-2.5 py-2 dark:bg-muted/10">
                                    <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                                        Fechamento
                                    </p>
                                    <p className="mt-0.5 truncate text-sm font-medium tabular-nums text-foreground">
                                        {snap ? formatDatePtBr(snap.close) : "—"}
                                    </p>
                                </div>
                                <div className="min-w-0 rounded-md border border-border/60 bg-muted/15 px-2.5 py-2 dark:bg-muted/10">
                                    <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                                        Vencimento
                                    </p>
                                    <p className="mt-0.5 truncate text-sm font-medium tabular-nums text-foreground">
                                        {snap ? formatDatePtBr(snap.dueEstimate) : "—"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Link>
        </li>
    )
}

export function DashboardOpenInvoices({
    cards,
    snapshots,
    calendarYm,
}: {
    cards: CreditCard[]
    snapshots: Map<string, CardMonthlyInvoiceSnapshot>
    calendarYm: string
}) {
    const active = cards.filter((c) => c.is_active)
    const summary = openInvoicesSummary(active, snapshots)
    const monthTitle = useMemo(() => labelYearMonthPt(calendarYm), [calendarYm])

    return (
        <div className="min-w-0 space-y-2">
            <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 space-y-0.5">
                    <div className="flex h-8 min-w-0 items-end">
                        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                            Faturas do mês
                        </p>
                    </div>
                </div>
                <Button
                    asChild
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-10 w-full gap-2 px-2 text-xs md:h-8 md:w-auto"
                >
                    <Link href={ROUTES.CREDIT_CARDS}>
                        <ArrowTopRightOnSquareIcon className="size-3.5 shrink-0 md:size-4" />
                        <span className="truncate">Ver cartões</span>
                    </Link>
                </Button>
            </div>

            <Card className="gap-0 overflow-hidden border border-border py-0 shadow-none ring-0">
                <CardContent className="p-0">
                    <div
                        className="flex min-h-10 shrink-0 items-center border-b border-border bg-muted/30 px-4 py-2.5"
                        aria-live="polite"
                    >
                        <p className="text-sm font-semibold capitalize leading-snug text-foreground">
                            {monthTitle}
                        </p>
                    </div>
                    {active.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-4 px-4 py-10 text-center">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/60">
                                <CreditCardGlyph className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-foreground">
                                    Nenhum cartão ativo
                                </p>
                                <p className="max-w-sm text-sm text-muted-foreground">
                                    Cadastre ou ative um cartão para acompanhar faturas
                                    abertas no dashboard.
                                </p>
                            </div>
                            <Button
                                asChild
                                type="button"
                                variant="default"
                                size="sm"
                                className="w-full max-w-xs sm:w-auto"
                            >
                                <Link href={ROUTES.CREDIT_CARDS}>
                                    Ir para cartões
                                </Link>
                            </Button>
                        </div>
                    ) : (
                        <>
                            <div className="shrink-0 border-b border-border bg-muted/10 px-3 py-2.5 dark:bg-muted/20">
                                <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-1.5">
                                    <div
                                        className="min-w-0 space-y-2 rounded-lg border border-border/60 bg-background/60 p-3 max-sm:shadow-xs sm:space-y-1.5 sm:rounded-none sm:border-transparent sm:bg-transparent sm:p-0 sm:shadow-none"
                                    >
                                        <div className="flex min-w-0 flex-col gap-1">
                                            <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                                                Total comprometido
                                            </dt>
                                            <dd className="min-w-0">
                                                <MoneyDisplay
                                                    value={summary.totalCommitted}
                                                    size="xl"
                                                />
                                            </dd>
                                        </div>
                                    </div>
                                    <div
                                        className="min-w-0 space-y-2 rounded-lg border border-border/60 bg-background/60 p-3 max-sm:shadow-xs sm:space-y-1.5 sm:rounded-none sm:border-transparent sm:bg-transparent sm:p-0 sm:shadow-none"
                                    >
                                        <div className="flex min-w-0 flex-col gap-1">
                                            <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                                                Vencimento
                                            </dt>
                                            <dd className="min-w-0 text-lg font-semibold tabular-nums leading-snug tracking-tight text-foreground sm:text-base">
                                                {summary.earliestDue
                                                    ? formatDatePtBr(summary.earliestDue)
                                                    : "—"}
                                            </dd>
                                        </div>
                                        <p className="text-xs leading-snug text-muted-foreground">
                                            {summary.activeCount}{" "}
                                            {summary.activeCount === 1
                                                ? "cartão ativo"
                                                : "cartões ativos"}
                                        </p>
                                    </div>
                                </dl>
                            </div>

                            <ul className="m-0 p-0">
                                {active.map((card) => (
                                    <InvoiceRow
                                        key={card.id}
                                        card={card}
                                        snap={snapshots.get(card.id)}
                                    />
                                ))}
                            </ul>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
