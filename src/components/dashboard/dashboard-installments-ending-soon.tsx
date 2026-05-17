"use client"

import Link from "next/link"
import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { MoneyDisplay } from "@/components/ui/money-display"
import { Button } from "@/components/ui/button"
import type { InstallmentEndingSoon } from "@/lib/credit-card-invoice-analytics"
import { formatTransactionDmyPtBr } from "@/lib/transaction-date"
import { ROUTES } from "@/config/navigation"
import { labelYearMonthPt } from "@/lib/budget-month"
import { useMemo } from "react"

export function DashboardInstallmentsEndingSoon({
    endingSoon,
    calendarYm,
}: {
    endingSoon: InstallmentEndingSoon[]
    calendarYm: string
}) {
    const monthTitle = useMemo(() => labelYearMonthPt(calendarYm), [calendarYm])
    return (
        <div className="min-w-0 space-y-2">
            <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex h-8 min-w-0 items-end">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                        Compras parceladas
                    </p>
                </div>
                <Button
                    asChild
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-10 w-full gap-2 px-2 text-xs md:h-8 md:w-auto"
                >
                    <Link href={`${ROUTES.TRANSACTIONS}?type=expense&inst=1`}>
                        <ArrowTopRightOnSquareIcon className="size-3.5 shrink-0 md:size-4" />
                        <span className="truncate">Ver em transações</span>
                    </Link>
                </Button>
            </div>

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
                    <div className="px-4 py-4 md:px-5 md:py-5">
                    {endingSoon.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            Nenhuma compra parcelada encontrada.
                        </p>
                    ) : (
                        <ul className="space-y-2" role="list">
                            {endingSoon.map((p) => {
                                const nextLabel = formatTransactionDmyPtBr(
                                    p.nextBilling,
                                )
                                const paidCount = Math.max(
                                    0,
                                    p.totalInstallments - p.remainingCount
                                )
                                const pctDone =
                                    p.totalInstallments > 0
                                        ? Math.min(
                                              100,
                                              Math.max(
                                                  0,
                                                  (paidCount / p.totalInstallments) *
                                                      100
                                              )
                                          )
                                        : 0
                                return (
                                    <li
                                        key={p.planId}
                                        className="overflow-hidden rounded-lg border border-border/60 bg-muted/10 dark:bg-muted/5"
                                    >
                                        <div className="border-b border-border/50 bg-muted/25 px-3 py-2.5 dark:bg-muted/15">
                                            <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
                                                <div className="min-w-0 flex-1 space-y-0.5">
                                                    <p className="truncate text-lg font-semibold leading-snug tracking-tight text-foreground sm:text-xl">
                                                        {p.label}
                                                    </p>
                                                    <p className="min-w-0 truncate text-xs leading-snug text-muted-foreground">
                                                        <span>Próxima cobrança</span>
                                                        <span className="text-muted-foreground/80">
                                                            {": "}
                                                        </span>
                                                        <span className="tabular-nums font-medium text-foreground">
                                                            {nextLabel}
                                                        </span>
                                                    </p>
                                                </div>
                                                <div className="min-w-0 shrink-0 text-right">
                                                    <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                                                        Impacto mensal
                                                    </p>
                                                    <MoneyDisplay
                                                        value={p.monthlyAmount}
                                                        size="xl"
                                                        className="mt-0.5 block text-right"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-2 px-3 py-3">
                                            <p className="text-sm font-medium text-foreground">
                                                <span className="tabular-nums">
                                                    {p.remainingCount}
                                                </span>{" "}
                                                {p.remainingCount === 1
                                                    ? "parcela restante"
                                                    : "parcelas restantes"}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                <span className="tabular-nums font-medium text-foreground/90">
                                                    {paidCount}
                                                </span>{" "}
                                                de{" "}
                                                <span className="tabular-nums font-medium text-foreground/90">
                                                    {p.totalInstallments}
                                                </span>{" "}
                                                parcelas pagas
                                            </p>
                                            <Progress
                                                value={pctDone}
                                                tone="success"
                                                className="h-2 w-full"
                                                aria-label={`${paidCount} de ${p.totalInstallments} parcelas pagas, ${p.remainingCount} ${p.remainingCount === 1 ? "restante" : "restantes"}`}
                                            />
                                        </div>
                                    </li>
                                )
                            })}
                        </ul>
                    )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
