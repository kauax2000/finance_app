import { CreditCardTileSkeleton } from "@/components/credit-cards/credit-card-tile"
import { transactionSegmentContainerClassName } from "@/components/transactions/transaction-type-segment"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

const DEFAULT_CARD_COUNT = 4

export function CreditCardsHistoryChartSkeleton() {
    return (
        <div
            className="flex aspect-video min-h-[240px] w-full items-center justify-center rounded-xl border border-border/80 bg-card"
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
        <div
            className="space-y-4"
            role="status"
            aria-busy="true"
            aria-label="Carregando cartões de crédito"
        >
            <span className="sr-only">Carregando cartões de crédito…</span>

            <div className="flex flex-col gap-2 md:flex-row md:flex-wrap md:items-center md:justify-between md:gap-3">
                <div
                    className={cn(
                        transactionSegmentContainerClassName,
                        "max-w-full shrink-0",
                    )}
                    aria-hidden
                >
                    <div className="flex h-full min-h-0 w-full items-stretch gap-0.5 md:w-auto">
                        <Skeleton className="h-8 flex-1 rounded-md md:h-7 md:min-w-[4.25rem] md:flex-none" />
                        <Skeleton className="h-8 flex-1 rounded-md md:h-7 md:min-w-[4.25rem] md:flex-none" />
                    </div>
                </div>
                <Skeleton className="hidden h-8 min-w-[7.5rem] rounded-md md:inline-flex md:w-auto" />
            </div>

            {view === "history" ? (
                <CreditCardsHistoryChartSkeleton />
            ) : (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">{tiles}</div>
            )}
        </div>
    )
}
