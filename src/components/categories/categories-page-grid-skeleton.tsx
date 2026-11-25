"use client"

import { CategoryCardSkeleton } from "@/components/categories/expense-category-card"
import { PageHeaderSkeleton } from "@/components/ui/page-header"
import { Skeleton, SkeletonGroup } from "@/components/ui/skeleton"

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

    // A barra real: as abas Despesas | Receitas à esquerda. À direita, no telefone, a cápsula
    // de dois ícones (ordenar e nova categoria, 88); no desktop, o ícone de ordenar e a pílula
    // do mês (só na despesa). O "Nova categoria" do desktop mora no cabeçalho.
    return (
        <div className="flex min-w-0 max-w-full items-center justify-between gap-2 md:gap-3">
            <Skeleton shape="control" className="min-w-0 flex-1 md:w-45 md:flex-none" />

            <div className="flex shrink-0 items-center gap-2">
                <Skeleton shape="control" className="w-22 md:hidden" />
                <Skeleton shape="control" className="aspect-square max-md:hidden" />
                {showMonth ? <Skeleton shape="control" className="w-54 max-md:hidden" /> : null}
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
            <PageHeaderSkeleton description={false} actions={["md"]} className="max-md:hidden" />
            <CategoriesToolbarSkeleton variant={variant} />

            <CategoryGridSkeleton />
        </SkeletonGroup>
    )
}
