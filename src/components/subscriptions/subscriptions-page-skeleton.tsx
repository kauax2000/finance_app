import { Skeleton, SkeletonGroup } from "@/components/ui/skeleton"
import { TableSkeleton, type TableSkeletonColumn } from "@/components/ui/table"
import { TablePanel } from "@/components/ui/data-table"

function ToolbarSkeleton() {
    return (
        <div className="flex flex-col gap-2 md:flex-row md:flex-wrap md:items-center md:justify-between md:gap-3">
            <div className="flex min-w-0 flex-row items-center gap-2 md:contents">
                <Skeleton shape="control" className="min-w-0 flex-1 md:w-60 md:flex-none" aria-hidden />
                <Skeleton shape="control" className="aspect-square md:hidden" />
            </div>
            <div className="hidden min-w-0 shrink-0 md:flex md:flex-wrap md:items-center md:justify-end md:gap-2">
                <Skeleton shape="control" className="w-28" />
                <Skeleton shape="control" className="w-40" />
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
