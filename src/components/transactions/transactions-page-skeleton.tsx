import { Skeleton, SkeletonGroup } from "@/components/ui/skeleton"
import { TableSkeleton, type TableSkeletonColumn } from "@/components/ui/table"
import { TablePanel } from "@/components/ui/table-panel"

/** Compact skeleton to avoid page-level scroll on shorter viewports (toolbar + header + footer eat height). */
const DEFAULT_ROW_COUNT = 8

export type TransactionsPageSkeletonProps = {
    rowCount?: number
}

function ToolbarSkeleton() {
    return (
        <div className="flex min-w-0 max-w-full flex-col gap-2 md:flex-row md:flex-wrap md:items-center md:justify-between md:gap-3">
            <div className="flex min-w-0 max-w-full items-center gap-2 md:contents">
                <div
                    className="inline-flex h-8 min-w-0 max-w-full flex-1 shrink items-stretch gap-0.5 rounded-lg bg-muted p-0.5 pointer-coarse:h-10 md:max-w-fit md:shrink-0"
                    aria-hidden
                >
                    <div className="flex h-full w-full min-h-0 items-center gap-0.5 px-0.5 md:w-auto">
                        <Skeleton className="h-[calc(100%-2px)] min-w-0 flex-1 rounded-md md:min-w-17 md:flex-none" />
                        <Skeleton className="h-[calc(100%-2px)] min-w-0 flex-1 rounded-md md:min-w-17 md:flex-none" />
                        <Skeleton className="h-[calc(100%-2px)] min-w-0 flex-1 rounded-md md:min-w-17 md:flex-none" />
                    </div>
                </div>
                <Skeleton
                    className="size-10 shrink-0 rounded-md md:hidden"
                    aria-hidden
                />
            </div>

            <div className="hidden min-w-0 max-w-full flex-1 md:flex md:flex-wrap md:items-center md:justify-end md:gap-2">
                <div className="flex min-w-0 max-w-full flex-1 flex-wrap items-center justify-end gap-2 md:flex-nowrap">
                    <div className="min-w-0 max-w-full flex-1 overflow-hidden">
                        <div className="flex min-w-0 flex-nowrap items-center justify-end gap-2">
                            <Skeleton className="h-7 w-19 shrink-0 rounded-full" />
                            <Skeleton className="h-7 w-25 shrink-0 rounded-full" />
                            <Skeleton className="h-7 w-20 shrink-0 rounded-full" />
                        </div>
                    </div>
                    <Skeleton className="h-8 w-23 shrink-0 rounded-md" />
                </div>
            </div>
        </div>
    )
}

/**
 * As colunas da tabela real (`transactions-table.tsx`), na mesma ordem. No
 * telefone a tabela vira a lista do gêmeo, e aqui somem as colunas que ele
 * não mostra.
 */
const TRANSACTION_SKELETON_COLUMNS: TableSkeletonColumn[] = [
    { selection: true },
    { label: "Data" },
    { label: "Descrição" },
    { label: "Valor", numeric: true },
    { label: "Forma de pagamento", className: "hidden md:table-cell" },
    { label: "Categoria", className: "hidden md:table-cell" },
    { label: "Tipo", className: "hidden md:table-cell" },
    { actions: true, className: "hidden md:table-cell" },
]

export function TransactionsPageSkeleton({
    rowCount = DEFAULT_ROW_COUNT,
}: TransactionsPageSkeletonProps) {
    return (
        <SkeletonGroup className="min-w-0 max-w-full space-y-3" label="Carregando transações…" delay>
            <ToolbarSkeleton />
            <TablePanel>
                {/* A página inteira já espera num `SkeletonGroup`. */}
                <TableSkeleton
                    columns={TRANSACTION_SKELETON_COLUMNS}
                    rows={rowCount}
                    group={false}
                />
            </TablePanel>
        </SkeletonGroup>
    )
}
