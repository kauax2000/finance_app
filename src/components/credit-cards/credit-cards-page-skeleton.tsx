import { CreditCardTileSkeleton } from "@/components/credit-cards/credit-card-tile"
import { Skeleton, SkeletonGroup } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

const DEFAULT_CARD_COUNT = 4

export function CreditCardsHistoryChartSkeleton() {
    return (
        <div
            className="flex aspect-video min-h-60 w-full items-center justify-center rounded-xl border border-border/80 bg-card"
            aria-hidden
        >
            <Skeleton className="h-40 w-full max-w-md rounded-lg" />
        </div>
    )
}

export function CreditCardsPageSkeleton({
    cardCount = DEFAULT_CARD_COUNT,
    view = "cards",
}: {
    cardCount?: number
    view?: "cards" | "history"
}) {
    const tiles = []
    for (let i = 0; i < cardCount; i++) {
        tiles.push(<CreditCardTileSkeleton key={`cc-tile-${i}`} />)
    }

    return (
        <SkeletonGroup className="space-y-4" label="Carregando cartões de crédito…" delay>
            <div className="flex flex-col gap-2 md:flex-row md:flex-wrap md:items-center md:justify-between md:gap-3">
                <div
                    className={cn(
                        "inline-flex h-8 w-full items-stretch gap-0.5 rounded-lg bg-muted p-0.5 pointer-coarse:h-10 md:w-auto",
                        "max-w-full shrink-0",
                    )}
                    aria-hidden
                >
                    <div className="flex h-full min-h-0 w-full items-stretch gap-0.5 md:w-auto">
                        <Skeleton className="h-8 flex-1 rounded-md md:h-7 md:min-w-17 md:flex-none" />
                        <Skeleton className="h-8 flex-1 rounded-md md:h-7 md:min-w-17 md:flex-none" />
                    </div>
                </div>
                <Skeleton className="hidden h-8 min-w-30 rounded-md md:inline-flex md:w-auto" />
            </div>

            {view === "history" ? (
                <CreditCardsHistoryChartSkeleton />
            ) : (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">{tiles}</div>
            )}
        </SkeletonGroup>
    )
}
