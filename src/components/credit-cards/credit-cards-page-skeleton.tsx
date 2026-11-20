import { CreditCardTileSkeleton } from "@/components/credit-cards/credit-card-tile"
import { Card } from "@/components/ui/card"
import { Skeleton, SkeletonGroup } from "@/components/ui/skeleton"

const DEFAULT_CARD_COUNT = 4

export function CreditCardsHistoryChartSkeleton() {
    return (
        <Card
            padding="none"
            className="aspect-video min-h-60 w-full items-center justify-center"
            aria-hidden
        >
            <Skeleton className="h-40 w-full max-w-md rounded-surface" />
        </Card>
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
            <div className="flex items-center gap-2 md:justify-between md:gap-3" aria-hidden>
                <Skeleton shape="control" className="min-w-0 flex-1 md:w-44 md:flex-none" />
                <Skeleton shape="control" className="aspect-square md:aspect-auto md:min-w-30" />
            </div>

            {view === "history" ? (
                <CreditCardsHistoryChartSkeleton />
            ) : (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">{tiles}</div>
            )}
        </SkeletonGroup>
    )
}
