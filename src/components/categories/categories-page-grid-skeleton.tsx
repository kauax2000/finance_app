"use client"

import type { ReactNode } from "react"
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton, SkeletonGroup } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

const GRID_PLACEHOLDER_COUNT = 6
const TITLE_WIDTHS = [
    "w-28",
    "w-36",
    "w-32",
    "w-44",
    "w-24",
    "w-40",
] as const
const VALUE_WIDTHS = [
    "w-32",
    "w-40",
    "w-36",
    "w-28",
    "w-44",
    "w-32",
] as const
const META_WIDTHS = [
    "w-44",
    "w-36",
    "w-48",
    "w-40",
    "w-32",
    "w-52",
] as const

export type CategoriesPageSkeletonVariant = "expense" | "income"

type Props = {
    /** Accessible name for the pending state (session vs workspace vs data). */
    screenReaderLabel?: string
    /** Matches expense vs revenue toolbar and card layout. */
    variant?: CategoriesPageSkeletonVariant
}

function seededClassName(seed: number, values: readonly string[]) {
    return values[seed % values.length]
}

function CategoryIconSkeleton() {
    return (
        <Skeleton shape="tile" size="lg" />
    )
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

/** O casco dos cartões de categoria: o mesmo `padding="sm"` do de verdade. */
function CategoryCardShellSkeleton({ children }: { children: ReactNode }) {
    return (
        <Card padding="sm" className="h-full" aria-hidden>
            {children}
        </Card>
    )
}

function ExpenseCategoryCardSkeleton({ seed }: { seed: number }) {
    const titleWidth = seededClassName(seed, TITLE_WIDTHS)
    const valueWidth = seededClassName(seed, VALUE_WIDTHS)
    const metaWidth = seededClassName(seed, META_WIDTHS)

    return (
        <CategoryCardShellSkeleton>
            <CardHeader media={<CategoryIconSkeleton />}>
                <CardTitle className="flex min-w-0 flex-col gap-1.5 self-center">
                    <Skeleton className={cn("h-4 max-w-full", titleWidth)} />
                    <Skeleton className="h-3 w-full max-w-34 @min-[360px]/card-header:hidden" />
                </CardTitle>
                <CardAction className="flex items-center gap-1.5">
                    <Skeleton className="h-5 w-16 shrink-0 rounded-full" />
                    <Skeleton shape="tile" />
                </CardAction>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                    <Skeleton className={cn("h-8 max-w-full", valueWidth)} />
                    <Skeleton className="mt-0.5 h-3 w-20 shrink-0 rounded-md" />
                </div>

                <Skeleton className="-mt-2 h-3 w-full max-w-54" />

                <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                        <Skeleton className={cn("h-3 min-w-0 max-w-full", metaWidth)} />
                        <Skeleton className="h-3 w-9 shrink-0" />
                    </div>
                    <Skeleton className="h-2 w-full rounded-full" />
                    <Skeleton className="h-3 w-full max-w-40" />
                </div>
            </CardContent>
        </CategoryCardShellSkeleton>
    )
}

function IncomeCategoryCardSkeleton({ seed }: { seed: number }) {
    const titleWidth = seededClassName(seed, TITLE_WIDTHS)

    return (
        <CategoryCardShellSkeleton>
            <CardHeader media={<CategoryIconSkeleton />}>
                <CardTitle className="flex min-w-0 items-center self-center">
                    <Skeleton className={cn("h-5 max-w-full", titleWidth)} />
                </CardTitle>
                <CardAction>
                    <Skeleton shape="tile" />
                </CardAction>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-3">
                <div className="mt-auto flex justify-center">
                    <Skeleton className="h-3 w-24 rounded-md" />
                </div>
            </CardContent>
        </CategoryCardShellSkeleton>
    )
}

function CategoryGridSkeleton({ variant }: { variant: CategoriesPageSkeletonVariant }) {
    return (
        <div className="grid grid-cols-1 items-stretch gap-3 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: GRID_PLACEHOLDER_COUNT }, (_, i) =>
                variant === "income" ? (
                    <IncomeCategoryCardSkeleton
                        key={i}
                        seed={i}
                    />
                ) : (
                    <ExpenseCategoryCardSkeleton
                        key={i}
                        seed={i}
                    />
                ),
            )}
        </div>
    )
}

/** Skeleton for the main Categorias page (toolbar + grid of category cards). */
export function CategoriesPageGridSkeleton({
    screenReaderLabel = "Carregando categorias",
    variant = "expense",
}: Props) {
    return (
        <SkeletonGroup className="min-w-0 max-w-full space-y-3" label={screenReaderLabel} delay>
            <CategoriesToolbarSkeleton variant={variant} />

            <CategoryGridSkeleton variant={variant} />
        </SkeletonGroup>
    )
}
