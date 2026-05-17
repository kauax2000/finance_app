"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

function ToolbarSkeleton() {
    return (
        <div
            className="flex flex-row flex-wrap items-center gap-2 md:gap-3"
            aria-hidden
        >
            <div
                className={cn(
                    "inline-flex h-10 w-fit max-w-full shrink-0 items-stretch rounded-lg bg-muted/60 p-0.5 ring-1 ring-border/60 md:h-9",
                    "dark:bg-muted/40"
                )}
            >
                <div className="flex h-full w-fit min-h-0 items-center gap-0.5 px-0.5">
                    <Skeleton className="h-[calc(100%-2px)] w-[4.75rem] shrink-0 rounded-md" />
                    <Skeleton className="h-[calc(100%-2px)] w-[5.5rem] shrink-0 rounded-md" />
                </div>
            </div>
            <div className="ml-auto flex min-w-0 shrink-0 flex-wrap items-center justify-end gap-2">
                <div className="flex flex-row items-stretch gap-2 md:hidden">
                    <Skeleton className="h-10 min-w-0 flex-1 rounded-[min(var(--radius-md),12px)]" />
                    <Skeleton className="size-10 shrink-0 rounded-[min(var(--radius-md),12px)]" />
                </div>
                <div className="hidden shrink-0 md:flex md:flex-wrap md:items-center md:gap-2">
                    <Skeleton className="h-8 w-[7.5rem] rounded-md" />
                    <Skeleton className="h-8 w-[6.5rem] rounded-md" />
                    <Skeleton className="h-8 w-[7.5rem] rounded-md" />
                </div>
            </div>
        </div>
    )
}

function CardSkeleton({ seed }: { seed: number }) {
    const titleW =
        seed % 3 === 0
            ? "w-[min(100%,11rem)]"
            : seed % 3 === 1
              ? "w-[min(100%,8rem)]"
              : "w-[min(100%,6rem)]"
    return (
        <Card className="gap-0 overflow-hidden py-0 shadow-none ring-1 ring-border/60">
            <div className="flex items-start justify-between gap-3 border-b border-border/50 px-4 pb-3 pt-4">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                    <Skeleton className="size-10 shrink-0 rounded-xl" />
                    <div className="min-w-0 flex-1 space-y-1.5">
                        <Skeleton className={cn("h-4 max-w-full", titleW)} />
                        <Skeleton className="h-3 w-[min(100%,10rem)] max-w-full" />
                    </div>
                </div>
                <Skeleton className="h-6 w-16 shrink-0 rounded-full" />
            </div>
            <CardContent className="space-y-3 px-4 pb-4 pt-3">
                <div className="rounded-lg border border-border/60 bg-muted/15 px-3 py-2.5">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="mt-2 h-7 w-28 tabular-nums" />
                    <Skeleton className="mt-2 h-3 w-[min(100%,14rem)] max-w-full" />
                </div>
            </CardContent>
            <div className="flex items-center justify-end gap-2 border-t border-border/50 px-4 py-3">
                <Skeleton className="h-8 w-[5.5rem] rounded-md" />
                <Skeleton className="size-8 shrink-0 rounded-md" />
            </div>
        </Card>
    )
}

const DEFAULT_CARD_COUNT = 6

export function BillsPageSkeleton({
    cardCount = DEFAULT_CARD_COUNT,
}: {
    cardCount?: number
}) {
    const cards = []
    for (let i = 0; i < cardCount; i++) {
        cards.push(<CardSkeleton key={`card-${i}`} seed={i} />)
    }
    return (
        <div
            className="flex flex-col gap-3"
            role="status"
            aria-busy="true"
            aria-label="Carregando contas a pagar"
        >
            <ToolbarSkeleton />
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                {cards}
            </div>
        </div>
    )
}
