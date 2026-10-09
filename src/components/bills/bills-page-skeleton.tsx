"use client"

import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Skeleton, SkeletonGroup } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

function ToolbarSkeleton() {
    return (
        <div
            className="flex flex-row flex-wrap items-center gap-2 md:gap-3"
            aria-hidden
        >
            <div
                className={cn(
                    "inline-flex h-8 w-fit max-w-full shrink-0 items-stretch gap-0.5 rounded-full bg-muted p-0.5 pointer-coarse:h-10"
                )}
            >
                <div className="flex h-full w-fit min-h-0 items-center gap-0.5 px-0.5">
                    <Skeleton className="h-[calc(100%-2px)] w-19 shrink-0 rounded-full" />
                    <Skeleton className="h-[calc(100%-2px)] w-22 shrink-0 rounded-full" />
                </div>
            </div>
            <div className="ml-auto flex min-w-0 shrink-0 flex-wrap items-center justify-end gap-2">
                <div className="flex flex-row items-stretch gap-2 md:hidden">
                    <Skeleton className="h-10 min-w-0 flex-1 rounded-full" />
                    <Skeleton className="size-10 shrink-0 rounded-full" />
                </div>
                <div className="hidden shrink-0 md:flex md:flex-wrap md:items-center md:gap-2">
                    <Skeleton className="h-8 w-30 rounded-full" />
                    <Skeleton className="h-8 w-26 rounded-full" />
                    <Skeleton className="h-8 w-30 rounded-full" />
                </div>
            </div>
        </div>
    )
}

/** O gêmeo dos cartões de conta: o casco, o cabeçalho com ladrilho e o rodapé do sistema. */
function BillCardSkeleton({ seed }: { seed: number }) {
    const titleW =
        seed % 3 === 0
            ? "w-full max-w-44"
            : seed % 3 === 1
              ? "w-full max-w-32"
              : "w-full max-w-24"
    return (
        <Card padding="sm" aria-hidden>
            <CardHeader media={<Skeleton shape="tile" size="2xl" />}>
                <CardTitle>
                    <Skeleton className={cn("h-4 max-w-full", titleW)} />
                </CardTitle>
                <CardDescription>
                    <Skeleton className="h-3 w-full max-w-40" />
                </CardDescription>
                <CardAction>
                    <Skeleton shape="pill" />
                </CardAction>
            </CardHeader>
            <CardContent>
                <Skeleton className="h-3 w-24" />
                <Skeleton className="mt-2 h-7 w-28 tabular-nums" />
                <Skeleton className="mt-2 h-3 w-full max-w-56" />
            </CardContent>
            <CardFooter className="justify-end">
                <Skeleton className="h-8 w-22 rounded-full" />
                <Skeleton shape="tile" />
            </CardFooter>
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
        cards.push(<BillCardSkeleton key={`card-${i}`} seed={i} />)
    }
    return (
        <SkeletonGroup className="flex flex-col gap-3" label="Carregando contas a pagar…" delay>
            <ToolbarSkeleton />
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                {cards}
            </div>
        </SkeletonGroup>
    )
}
