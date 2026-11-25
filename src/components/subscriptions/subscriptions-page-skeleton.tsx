import { Skeleton, SkeletonGroup } from "@/components/ui/skeleton"
import { TableSkeleton, type TableSkeletonColumn } from "@/components/ui/table"
import { TablePanel, TablePanelToolbar } from "@/components/ui/data-table"

function ToolbarSkeleton() {
    return (
        <div className="flex flex-col gap-2 md:flex-row md:flex-wrap md:items-center md:justify-between md:gap-3">
            <div className="flex min-w-0 flex-row items-center gap-2 md:contents">
                <Skeleton shape="control" className="min-w-0 flex-1 md:w-55 md:flex-none" />
                <Skeleton shape="control" className="aspect-square md:hidden" />
            </div>
            <div className="hidden min-w-0 shrink-0 md:flex md:flex-wrap md:items-center md:justify-end md:gap-2">
                <Skeleton shape="control" className="w-32" />
                <Skeleton shape="control" className="w-41" />
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
    { label: "Assinatura", caption: true },
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
        <SkeletonGroup className="flex flex-col gap-4" label="Carregando assinaturas…" delay>
            <ToolbarSkeleton />
            {/* A barra da tabela: a busca (`sm`) e, à direita, Exportar e Exibir (terciários: só o texto). */}
            <TablePanel
                toolbar={
                    <TablePanelToolbar className="max-md:hidden">
                        <Skeleton shape="control" size="sm" className="w-56" />
                        <div className="ms-auto flex items-center gap-6 pe-3">
                            <Skeleton shape="text" className="w-16" />
                            <Skeleton shape="text" className="w-12" />
                        </div>
                    </TablePanelToolbar>
                }
            >
                <TableSkeleton columns={COLUNAS} rows={rowCount} group={false} />
            </TablePanel>
        </SkeletonGroup>
    )
}
