"use client"

import Link from "next/link"
import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { MoneyDisplay } from "@/components/ui/money-display"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    EmptyState,
    EmptyStateActions,
    EmptyStateDescription,
    EmptyStateTitle,
} from "@/components/ui/empty-state"
import { P, Muted } from "@/components/ui/typography"
import type { InstallmentEndingSoon } from "@/lib/credit-card-invoice-analytics"
import {
    formatTransactionCompactPtBr,
    formatTransactionDmyPtBr,
} from "@/lib/transaction-date"
import { ROUTES } from "@/config/navigation"
import type { CreditCard } from "@/lib/supabase"
import { cn } from "@/lib/utils"
import { useMemo } from "react"

function installmentPlanAriaLabel(p: InstallmentEndingSoon, cardName: string | null): string {
    const paidCount = Math.max(0, p.totalInstallments - p.remainingCount)
    const nextLabel = formatTransactionDmyPtBr(p.nextBilling)
    const cardPart = cardName ? `, cartão ${cardName}` : ""
    return `${p.label}. ${p.remainingCount} ${
        p.remainingCount === 1 ? "parcela restante" : "parcelas restantes"
    }. ${paidCount} de ${p.totalInstallments} pagas. Próxima cobrança ${nextLabel}${cardPart}.`
}

function InstallmentPlanCompactRow({
    plan,
    cardName,
    onSelect,
}: {
    plan: InstallmentEndingSoon
    cardName: string | null
    onSelect?: (plan: InstallmentEndingSoon) => void
}) {
    const nextLabelCompact = formatTransactionCompactPtBr(plan.nextBilling)
    const paidCount = Math.max(0, plan.totalInstallments - plan.remainingCount)
    const pctDone =
        plan.totalInstallments > 0
            ? Math.min(
                  100,
                  Math.max(0, (paidCount / plan.totalInstallments) * 100),
              )
            : 0
    const aria = installmentPlanAriaLabel(plan, cardName)

    const content = (
        <>
            <div className="flex min-w-0 items-center gap-2">
                <div
                    className={cn(
                        "min-w-0 flex-1 overflow-hidden pr-1",
                        "[mask-image:linear-gradient(to_right,black_calc(100%-0.75rem),transparent)]",
                        "[-webkit-mask-image:linear-gradient(to_right,black_calc(100%-0.75rem),transparent)]",
                    )}
                >
                    <div className="flex min-w-0 items-baseline gap-2 whitespace-nowrap">
                        <P className="shrink-0 text-base font-semibold leading-snug tracking-tight">
                            {plan.label}
                        </P>
                        <Muted className="shrink-0 text-xs leading-snug">
                            <span className="font-medium text-muted-foreground">
                                Próxima:
                            </span>{" "}
                            <span className="tabular-nums">
                                {nextLabelCompact}
                            </span>
                            {cardName ? (
                                <>
                                    <span className="text-muted-foreground/60">
                                        {" "}
                                        ·{" "}
                                    </span>
                                    {cardName}
                                </>
                            ) : null}
                        </Muted>
                    </div>
                </div>
                <div className="flex shrink-0 items-baseline gap-0.5 tabular-nums">
                    <MoneyDisplay
                        value={plan.monthlyAmount}
                        size="sm"
                        className="text-sm font-semibold sm:text-base"
                    />
                    <Muted className="text-xs">/mês</Muted>
                </div>
            </div>
            <div className="mt-2 flex min-w-0 items-center gap-2">
                <Badge variant="secondary" size="xs" className="tabular-nums">
                    {paidCount}/{plan.totalInstallments}
                </Badge>
                <Progress
                    value={pctDone}
                    tone="success"
                    className="h-1.5 min-w-[4rem] flex-1 basis-24"
                    aria-label={`${paidCount} de ${plan.totalInstallments} parcelas pagas`}
                />
            </div>
        </>
    )

    const rowClass = cn(
        "block w-full px-4 py-3 text-left outline-none transition-colors",
        onSelect &&
            "cursor-pointer hover:bg-muted/30 focus-visible:bg-muted/30 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    )

    if (onSelect) {
        return (
            <li className="list-none">
                <button
                    type="button"
                    className={rowClass}
                    aria-label={aria}
                    onClick={() => onSelect(plan)}
                >
                    {content}
                </button>
            </li>
        )
    }

    return (
        <li className="list-none">
            <div className={rowClass} aria-label={aria}>
                {content}
            </div>
        </li>
    )
}

export function DashboardInstallmentsEndingSoon({
    endingSoon,
    creditCards,
    onPlanClick,
}: {
    endingSoon: InstallmentEndingSoon[]
    creditCards: CreditCard[]
    onPlanClick?: (plan: InstallmentEndingSoon) => void
}) {
    const cardNameById = useMemo(() => {
        const m = new Map<string, string>()
        for (const c of creditCards) {
            m.set(c.id, c.name)
        }
        return m
    }, [creditCards])

    const transactionsHref = `${ROUTES.TRANSACTIONS}?type=expense&inst=1`

    return (
        <div className="min-w-0 space-y-2">
            <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 space-y-0.5">
                    <div className="flex h-8 min-w-0 items-end">
                        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                            Compras parceladas
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
                    <Link href={transactionsHref}>
                        <ArrowTopRightOnSquareIcon className="size-3.5 shrink-0 md:size-4" />
                        <span className="truncate">Ver em transações</span>
                    </Link>
                </Button>
            </div>

            <Card className="gap-0 overflow-hidden border border-border py-0 shadow-none ring-0">
                    <CardContent className="p-0">
                        {endingSoon.length === 0 ? (
                            <EmptyState className="mx-4 my-6 border-0 bg-transparent py-8">
                                <EmptyStateTitle>
                                    Nenhuma parcela terminando em breve
                                </EmptyStateTitle>
                                <EmptyStateDescription className="mb-4">
                                    Quando um plano estiver com poucas parcelas
                                    ou cobrança próxima, ele aparece aqui.
                                </EmptyStateDescription>
                                <EmptyStateActions>
                                    <Button
                                        asChild
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                    >
                                        <Link href={transactionsHref}>
                                            Ver compras parceladas
                                        </Link>
                                    </Button>
                                </EmptyStateActions>
                            </EmptyState>
                        ) : (
                            <ul
                                className="divide-y divide-border"
                                role="list"
                            >
                                {endingSoon.map((p) => (
                                    <InstallmentPlanCompactRow
                                        key={p.planId}
                                        plan={p}
                                        cardName={
                                            p.paymentCreditCardId
                                                ? (cardNameById.get(
                                                      p.paymentCreditCardId,
                                                  ) ?? null)
                                                : null
                                        }
                                        onSelect={onPlanClick}
                                    />
                                ))}
                            </ul>
                        )}
                    </CardContent>
                </Card>
        </div>
    )
}
