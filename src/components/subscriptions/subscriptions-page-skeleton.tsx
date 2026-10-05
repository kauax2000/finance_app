import { Skeleton, SkeletonGroup } from "@/components/ui/skeleton"
import { TableSkeleton, type TableSkeletonColumn } from "@/components/ui/table"
import { TablePanel } from "@/components/ui/data-table"
import { cn } from "@/lib/utils"

function ToolbarSkeleton() {
    return (
        <div className="flex flex-col gap-2 md:flex-row md:flex-wrap md:items-center md:justify-between md:gap-3">
            <div className="flex min-w-0 flex-row items-center gap-2 md:contents">
                <div
                    className={cn(
                        "inline-flex h-8 w-full items-stretch gap-0.5 rounded-lg bg-muted p-0.5 pointer-coarse:h-10 md:w-auto",
                        "min-w-0 flex-1 md:flex-initial md:shrink-0"
                    )}
                    aria-hidden
                >
                    <div className="flex h-full w-full min-h-0 items-center gap-0.5 px-0.5 md:w-auto">
                        <Skeleton className="h-[calc(100%-2px)] min-w-0 flex-1 rounded-md md:min-w-17 md:flex-none" />
                        <Skeleton className="h-[calc(100%-2px)] min-w-0 flex-1 rounded-md md:min-w-17 md:flex-none" />
                        <Skeleton className="h-[calc(100%-2px)] min-w-0 flex-1 rounded-md md:min-w-17 md:flex-none" />
                    </div>
                </div>
                <Skeleton className="size-10 shrink-0 rounded-md md:hidden" />
            </div>
            <div className="hidden min-w-0 shrink-0 md:flex md:flex-wrap md:items-center md:justify-end md:gap-2">
                <Skeleton shape="tile" />
                <Skeleton className="h-8 w-36 rounded-md" />
                <Skeleton className="h-8 w-34 rounded-md" />
            </div>
        </div>
    )
}

/**
 * As colunas reais do `DataTable` de assinaturas, na mesma ordem: a caixa, o
 * nome, o valor, a periodicidade, a próxima cobrança, a categoria, o status e
 * as ações. A altura da linha vem do degrau que o `TablePanel` publica.
 */
const COLUNAS: TableSkeletonColumn[] = [
    { selection: true },
    { label: "Assinatura" },
    { label: "Valor", numeric: true },
    { label: "Periodicidade" },
    { label: "Próxima" },
    { label: "Categoria" },
    { label: "Status" },
    { label: "Ações", actions: true },
]

const DEFAULT_ROW_COUNT = 6

export function SubscriptionsPageSkeleton({
    rowCount = DEFAULT_ROW_COUNT,
}: {
    rowCount?: number
}) {
    return (
        <SkeletonGroup className="flex flex-col gap-3" label="Carregando assinaturas…" delay>
            <ToolbarSkeleton />
            <TablePanel>
                <TableSkeleton columns={COLUNAS} rows={rowCount} group={false} />
            </TablePanel>
        </SkeletonGroup>
    )
}
