import { ResumoDasTransacoes } from "@/components/transactions/resumo-das-transacoes"
import { TablePanel } from "@/components/ui/data-table"
import { FilterBarSkeleton } from "@/components/ui/filter-bar"
import { SkeletonGroup } from "@/components/ui/skeleton"
import { TableSkeleton, type TableSkeletonColumn } from "@/components/ui/table"

/** Compacto, para a página não rolar em telas mais baixas. */
const DEFAULT_ROW_COUNT = 8

export type TransactionsPageSkeletonProps = {
    rowCount?: number
}

/**
 * As colunas da tabela real (`transacoes-tabela.tsx`), na mesma ordem. No
 * telefone a tabela vira a lista do gêmeo, e aqui somem as colunas que ele
 * não mostra.
 */
const COLUNAS: TableSkeletonColumn[] = [
    { selection: true },
    { label: "Descrição" },
    { label: "Categoria", className: "hidden md:table-cell" },
    { label: "Pagamento", className: "hidden md:table-cell" },
    { label: "Quem", className: "hidden md:table-cell" },
    { label: "Data", className: "hidden md:table-cell" },
    { label: "Valor", numeric: true },
    { actions: true, className: "hidden md:table-cell" },
]

/** O resumo (2 cartões no telefone, 4 no desktop), os filtros e a tabela, num grupo só. */
export function TransactionsPageSkeleton({ rowCount = DEFAULT_ROW_COUNT }: TransactionsPageSkeletonProps) {
    return (
        <SkeletonGroup className="flex min-w-0 max-w-full flex-col gap-4" label="Carregando transações…" delay>
            <ResumoDasTransacoes resumo={undefined} pendente={false} />
            <FilterBarSkeleton group={false} />
            <TablePanel>
                <TableSkeleton columns={COLUNAS} rows={rowCount} group={false} />
            </TablePanel>
        </SkeletonGroup>
    )
}
