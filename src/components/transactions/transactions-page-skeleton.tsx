import { TablePanel } from "@/components/ui/data-table"
import { FilterBarSkeleton } from "@/components/ui/filter-bar"
import { PageHeaderSkeleton } from "@/components/ui/page-header"
import { Skeleton, SkeletonGroup } from "@/components/ui/skeleton"
import { TableSkeleton, type TableSkeletonColumn } from "@/components/ui/table"

/** Compacto, para a página não rolar em telas mais baixas. */
const DEFAULT_ROW_COUNT = 8

export type TransactionsPageSkeletonProps = {
    rowCount?: number
}

/**
 * As colunas que a tabela real (`transacoes-tabela.tsx`) abre: a Categoria mora
 * na legenda da Descrição, e Quem só aparece com dois membros ou mais.
 */
const COLUNAS: TableSkeletonColumn[] = [
    { selection: true },
    { label: "Descrição" },
    { label: "Pagamento" },
    { label: "Data" },
    { label: "Valor", numeric: true },
    { actions: true },
]

/** Os dias do gêmeo do telefone: a faixa do dia e as linhas dele. */
const DIAS_DO_TELEFONE = [5, 3]

/**
 * A página que espera, na forma da tela: o cabeçalho (só no desktop; no
 * telefone o título é da casca), as abas e o "+ Filtro" na linha da
 * `TransacoesToolbar` (no telefone o "+ Filtro" some, e o osso dele também), e a tabela no desktop ou a lista agrupada por dia no
 * telefone (`mobileRow="compact"`: sem caixa nem ⋯).
 */
export function TransactionsPageSkeleton({ rowCount = DEFAULT_ROW_COUNT }: TransactionsPageSkeletonProps) {
    return (
        <SkeletonGroup className="flex min-w-0 max-w-full flex-col gap-4" label="Carregando transações…" delay>
            <PageHeaderSkeleton description={false} actions={0} className="max-md:hidden" />

            {/* A mesma quebra da barra real: abaixo de 48rem da linha, as abas esticam em cima e os filtros descem. */}
            <div className="@container/transacoes min-w-0">
                <div className="flex items-center gap-2 @max-3xl/transacoes:flex-wrap">
                    <Skeleton className="h-9 w-60 shrink-0 rounded-full pointer-coarse:h-11 @max-3xl/transacoes:min-w-0 @max-3xl/transacoes:flex-1" />
                    <Skeleton className="hidden size-8 shrink-0 rounded-full max-md:block pointer-coarse:size-11" />
                    <div className="min-w-0 flex-1 @max-3xl/transacoes:basis-full max-md:hidden">
                        <FilterBarSkeleton tokens={0} group={false} />
                    </div>
                </div>
            </div>

            <div className="max-md:hidden">
                <TablePanel>
                    <TableSkeleton columns={COLUNAS} rows={rowCount} group={false} />
                </TablePanel>
            </div>

            <TablePanel className="md:hidden">
                <div aria-hidden>
                    {DIAS_DO_TELEFONE.map((linhas, dia) => (
                        <div key={dia}>
                            <div className="bg-muted/30 px-4 py-2">
                                <Skeleton shape="text" className="h-2.5 w-24" />
                            </div>
                            <div className="divide-y divide-border">
                                {Array.from({ length: linhas }, (_, i) => (
                                    <div key={i} className="flex min-h-16 items-center gap-3 px-4 py-3">
                                        <Skeleton shape="tile" size="xs" className="shrink-0" />
                                        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                                            <Skeleton shape="text" className={i % 2 ? "w-24" : "w-32"} />
                                            <Skeleton shape="text" className="h-3 w-16" />
                                        </div>
                                        <Skeleton shape="text" className="w-20 shrink-0" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </TablePanel>
        </SkeletonGroup>
    )
}
