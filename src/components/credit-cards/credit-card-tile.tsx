"use client"

import Link from "next/link"
import type { CreditCard } from "@/lib/supabase"
import type { CardCycleSnapshot } from "@/lib/credit-card-billing"
import { formatDatePtBr } from "@/lib/credit-card-billing"
import { creditCardDetailPath } from "@/config/navigation"
import { CreditCardFaceTilt } from "@/components/credit-cards/credit-card-face-tilt"
import { RegisteredCreditCardFace } from "@/components/credit-cards/registered-credit-card-face"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ChevronRightIcon } from "@heroicons/react/24/outline"
import { cn } from "@/lib/utils"

const currencyFmt = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
})

export type CreditCardTileProps = {
    card: CreditCard
    snapshot: CardCycleSnapshot | null | undefined
}

/**
 * List tile: one link (Option A in plan) — entire surface opens detail.
 * Identity row matches [CreditCardDetailView] ficha card header (title, badge).
 */
export function CreditCardTile({ card, snapshot }: CreditCardTileProps) {
    const detailHref = creditCardDetailPath(card.id)
    const limit = card.credit_limit != null ? Number(card.credit_limit) : null
    const committedTotal = snapshot?.committedOpenTotal ?? snapshot?.openTotal ?? 0
    const usagePct =
        limit != null && limit > 0
            ? Math.min(100, Math.max(0, (committedTotal / limit) * 100))
            : null
    const delta =
        snapshot != null
            ? Number(snapshot.openTotal) - Number(snapshot.lastClosedTotal)
            : 0

    const cycleProgress = (() => {
        if (!snapshot) return null
        const start = snapshot.openWindow.start.getTime()
        const end = snapshot.openWindow.end.getTime()
        /* Billing-window progress uses wall clock; updates when the tile re-renders. */
        // eslint-disable-next-line react-hooks/purity -- Date.now for live cycle bar vs snapshot window
        const now = Date.now()
        if (!(end > start)) return null
        const pct = ((now - start) / (end - start)) * 100
        return Math.min(100, Math.max(0, pct))
    })()

    return (
        <Card
            className={cn(
                "gap-0 overflow-hidden py-0 transition-shadow",
                !card.is_active && "opacity-[0.82]"
            )}
        >
            {/* Single interactive target: avoids duplicate links/buttons (plan a11y). */}
            <Link
                href={detailHref}
                className={cn(
                    "group block w-full min-w-0 rounded-xl text-left text-inherit no-underline outline-none",
                    "transition-shadow hover:shadow-md active:shadow-md",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                )}
                aria-label={`Abrir cartão ${card.name}, final ${card.last_four}. Ver detalhes.`}
            >
                <div className="flex items-start justify-between gap-3 border-b border-border/50 px-4 pb-3 pt-4">
                    <div className="min-w-0 flex-1 pr-2">
                        <CardTitle className="text-base truncate leading-snug">
                            {card.name}
                        </CardTitle>
                    </div>
                    <Badge
                        size="sm"
                        variant={card.is_active ? "success" : "outline"}
                        className="shrink-0 self-start"
                    >
                        {card.is_active ? "Ativo" : "Inativo"}
                    </Badge>
                </div>

                <div className="flex flex-col gap-3 px-4 pb-4 pt-3 md:flex-row md:items-stretch md:gap-4">
                    <div className="flex shrink-0 flex-col items-center gap-2">
                        <CreditCardFaceTilt className="mx-auto w-full max-w-[16rem] shrink-0 md:mx-0 md:w-56">
                            <RegisteredCreditCardFace
                                card={card}
                                size="sm"
                                showInactiveBadge={false}
                            />
                        </CreditCardFaceTilt>
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors group-hover:text-foreground">
                            Ver detalhes
                            <ChevronRightIcon className="size-3.5 shrink-0 opacity-85 transition-transform group-hover:translate-x-0.5" aria-hidden />
                        </span>
                    </div>

                    <CardContent className="min-w-0 flex-1 space-y-3 border-0 p-0">
                    {snapshot ? (
                        <>
                            <div className="flex flex-col gap-2">
                                <div className="rounded-lg border border-border/60 bg-muted/15 px-2.5 py-2 dark:bg-muted/10">
                                    <p className="text-[11px] font-medium text-muted-foreground">
                                        Fatura aberta (planejada)
                                    </p>
                                    <p className="mt-0.5 text-base font-semibold tabular-nums text-foreground">
                                        {currencyFmt.format(
                                            snapshot.committedOpenTotal
                                        )}
                                    </p>
                                    {(snapshot.projectedOpenInstallmentsTotal ?? 0) >
                                    0 ? (
                                        <p className="mt-1 text-[10px] leading-snug text-muted-foreground">
                                            Total registrado{" "}
                                            {currencyFmt.format(snapshot.openTotal)}
                                            {" · "}
                                            Parcelas previstas{" "}
                                            {currencyFmt.format(
                                                snapshot.projectedOpenInstallmentsTotal
                                            )}
                                        </p>
                                    ) : null}
                                </div>
                            </div>

                            <div className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-background/80 px-2.5 py-2 text-[11px] dark:bg-background/50">
                                <span className="text-muted-foreground">Comparação</span>
                                <span
                                    className={cn(
                                        "tabular-nums font-semibold",
                                        delta > 0 && "text-rose-600 dark:text-rose-500",
                                        delta < 0 && "text-emerald-600 dark:text-emerald-500",
                                        delta === 0 && "text-foreground"
                                    )}
                                >
                                    {delta === 0 ? "—" : currencyFmt.format(delta)}
                                </span>
                            </div>

                            <div className="space-y-1 text-[11px] leading-snug text-muted-foreground">
                                <p className="flex items-center justify-between gap-2">
                                    <span>
                                        <span className="font-medium text-foreground/80">
                                            Próximo fechamento
                                        </span>{" "}
                                        {formatDatePtBr(snapshot.nextClose)}
                                    </span>
                                    <span className="tabular-nums text-foreground/85">
                                        {cycleProgress != null
                                            ? `${cycleProgress.toFixed(0)}%`
                                            : null}
                                    </span>
                                </p>
                                <p>
                                    <span className="font-medium text-foreground/80">
                                        Vencimento estimado
                                    </span>{" "}
                                    {formatDatePtBr(snapshot.estimatedDueLastClose)}
                                </p>
                            </div>

                            {usagePct != null ? (
                                <div className="space-y-1">
                                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                                        <span>Uso da fatura aberta no limite</span>
                                        <span className="tabular-nums font-medium text-foreground">
                                            {usagePct.toFixed(0)}%
                                        </span>
                                    </div>
                                    <div
                                        className="h-1.5 overflow-hidden rounded-full bg-muted"
                                        role="presentation"
                                    >
                                        <div
                                            className="h-full rounded-full bg-primary/80 transition-[width]"
                                            style={{ width: `${usagePct}%` }}
                                        />
                                    </div>
                                </div>
                            ) : null}
                        </>
                    ) : null}
                    </CardContent>
                </div>
            </Link>
        </Card>
    )
}

export function CreditCardTileSkeleton() {
    return (
        <Card className="gap-0 overflow-hidden py-0">
            <div className="flex items-start justify-between gap-3 border-b border-border/50 px-4 pb-3 pt-4">
                <div className="min-w-0 flex-1 pr-2">
                    <Skeleton className="h-4 w-[min(100%,14rem)]" />
                </div>
                <Skeleton className="h-5 w-14 shrink-0 rounded-full" />
            </div>
            <div className="flex flex-col gap-3 px-4 pb-4 pt-3 md:flex-row md:items-stretch md:gap-4">
                <div className="flex shrink-0 flex-col items-center gap-2">
                    <Skeleton className="mx-auto aspect-[1.586] w-full max-w-[16rem] rounded-2xl md:mx-0 md:w-56" />
                    <Skeleton className="h-3.5 w-28" />
                </div>
                <CardContent className="min-w-0 flex-1 space-y-3 border-0 p-0">
                    <div className="flex flex-col gap-2">
                        <div className="rounded-lg border border-border/60 bg-muted/15 px-2.5 py-2 dark:bg-muted/10">
                            <Skeleton className="h-2.5 w-[min(100%,11rem)] max-w-full" />
                            <Skeleton className="mt-0.5 h-6 w-36 max-w-[min(100%,55%)] tabular-nums" />
                        </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-background/80 px-2.5 py-2 dark:bg-background/50">
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-3 w-16 shrink-0 tabular-nums" />
                    </div>

                    <div className="space-y-1">
                        <div className="flex items-center justify-between gap-2">
                            <Skeleton className="h-3 min-w-0 flex-1 max-w-[min(100%,14rem)]" />
                            <Skeleton className="h-3 w-8 shrink-0 tabular-nums" />
                        </div>
                        <Skeleton className="h-3 w-[min(100%,16rem)] max-w-full" />
                    </div>

                    <div className="space-y-1">
                        <div className="flex items-center justify-between gap-2">
                            <Skeleton className="h-3 w-[min(100%,12rem)] max-w-[70%]" />
                            <Skeleton className="h-3 w-7 shrink-0 tabular-nums" />
                        </div>
                        <Skeleton className="h-1.5 w-full rounded-full" />
                    </div>
                </CardContent>
            </div>
        </Card>
    )
}
