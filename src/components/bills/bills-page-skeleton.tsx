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
            <Skeleton shape="control" className="w-44" />
            <div className="ml-auto hidden shrink-0 items-center gap-2 md:flex">
                <Skeleton shape="control" size="sm" className="w-44" />
                <Skeleton shape="control" className="w-32" />
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
                <Skeleton shape="control" size="md" className="w-22 pointer-coarse:h-8" />
                <Skeleton shape="control" size="md" className="aspect-square" />
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
