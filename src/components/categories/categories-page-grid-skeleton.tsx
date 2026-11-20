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
            <Skeleton shape="control" className="w-full md:w-40" />

            <div className="hidden shrink-0 md:flex md:flex-wrap md:items-center md:justify-end md:gap-2">
                {showMonth ? (
                    <Skeleton shape="control" className="w-56 pointer-coarse:h-12" />
                ) : null}
                <Skeleton shape="control" className="w-39" />
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

/** Só a grade, para a espera dos números do mês com a barra já na tela: sem ela,
    o vazio "Nenhum gasto" aparecia antes das categorias. */
export function CategoriesGridLoading() {
    return (
        <SkeletonGroup label="Carregando os números do mês" delay>
            <CategoryGridSkeleton />
        </SkeletonGroup>
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
