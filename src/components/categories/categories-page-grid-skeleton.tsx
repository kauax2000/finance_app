"use client"

import { CategoryCardSkeleton } from "@/components/categories/expense-category-card"
import { PageHeaderSkeleton } from "@/components/ui/page-header"
import { Skeleton, SkeletonGroup } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

const GRID_PLACEHOLDER_COUNT = 6

export type CategoriesPageSkeletonVariant = "expense" | "income"

type Props = {
    /** Accessible name for the pending state (session vs workspace vs data). */
    screenReaderLabel?: string
    /** Matches expense vs revenue toolbar and card layout. */
    variant?: CategoriesPageSkeletonVariant
}

function CategoriesToolbarSkeleton({ variant }: { variant: CategoriesPageSkeletonVariant }) {
    const showMonth = variant === "expense"

    return (
        <div
            className={cn(
                "flex min-w-0 max-w-full flex-col gap-2 md:flex-row md:flex-wrap md:items-center md:justify-between md:gap-3",
            )}
        >
            <div
                className={cn("inline-flex h-8 w-full items-stretch gap-0.5 rounded-full bg-muted p-0.5 pointer-coarse:h-11 md:w-auto", "max-w-full shrink-0")}
                aria-hidden
            >
                <div className="flex h-full min-h-0 w-full gap-0.5 md:w-auto">
                    <Skeleton className="h-[calc(100%-2px)] min-w-0 flex-1 rounded-full md:min-w-17 md:flex-none" />
                    <Skeleton className="h-[calc(100%-2px)] min-w-0 flex-1 rounded-full md:min-w-17 md:flex-none" />
                </div>
            </div>

            <div className="hidden shrink-0 md:flex md:flex-wrap md:items-center md:justify-end md:gap-2">
                {showMonth ? (
                    <div className="flex w-full min-w-0 items-center justify-between gap-2 md:w-auto md:justify-end md:gap-1.5">
                        <Skeleton className="h-8 w-16 shrink-0 rounded-full" />
                        <Skeleton shape="tile" />
                        <Skeleton className="h-8 max-w-[min(100%,16rem)] min-w-0 flex-1 rounded-full md:w-44 md:flex-none" />
                        <Skeleton shape="tile" />
                    </div>
                ) : null}
                <Skeleton className="h-8 w-39 shrink-0 rounded-full" />
            </div>
        </div>
    )
}

function CategoryGridSkeleton() {
    return (
        <div className="grid grid-cols-1 items-stretch gap-3 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: GRID_PLACEHOLDER_COUNT }, (_, i) => (
                <CategoryCardSkeleton key={i} />
            ))}
        </div>
    )
}

/** Skeleton for the main Categorias page (toolbar + grid of category cards). */
export function CategoriesPageGridSkeleton({
    screenReaderLabel = "Carregando categorias",
    variant = "expense",
}: Props) {
    return (
        <SkeletonGroup className="flex min-w-0 max-w-full flex-col gap-4" label={screenReaderLabel} delay>
            <PageHeaderSkeleton description={false} actions={1} className="max-md:hidden" />
            <CategoriesToolbarSkeleton variant={variant} />

            <CategoryGridSkeleton />
        </SkeletonGroup>
    )
}
