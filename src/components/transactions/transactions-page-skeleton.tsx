import { Fragment } from "react"
import { TablePanel } from "@/components/ui/data-table"
import { FilterBarSkeleton } from "@/components/ui/filter-bar"
import { PageHeaderSkeleton } from "@/components/ui/page-header"
import { Skeleton, SkeletonGroup } from "@/components/ui/skeleton"
import {
    Table,
    TableBody,
    TableCell,
    TableGroupRow,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

/** As linhas de cada dia: três, uma e quatro, como uma semana comum. Oito no total, para a página não rolar. */
const DIAS = [3, 1, 4]

/** Larguras que variam por linha, para a coluna não ler como uma régua. */
const LARGURAS = ["w-32", "w-24", "w-40", "w-28"]

/**
 * As colunas da tabela real (`transacoes-tabela.tsx`) entre a caixa e o Valor: a
 * Categoria mora na legenda da Descrição, e o Quem é o avatar de quem lançou.
 */
const CABECALHOS = ["Descrição", "Pagamento", "Quem", "Data"]

export type TransactionsPageSkeletonProps = {
    /** As linhas de cada dia, no desktop e no telefone. */
    dias?: number[]
}

/**
 * A página que espera, na forma da tela: o cabeçalho com Importar e Exportar (só no
 * desktop; no telefone o título é da casca), as abas, o "+ Filtro" e a contagem na linha
 * da `TransacoesToolbar` (no telefone, as abas esticam e o ⋯ fica ao lado). No desktop, a
 * tabela agrupada por dia, com a faixa do dia e o total na coluna do Valor. No telefone,
 * a lista agrupada do iOS (`mobileGroups="inset"`): um cartão por dia, com o dia e o total
 * por fora, e a linha rasa (`mobileRow="compact"`: ladrilho, nome, legenda e valor; o fio
 * parte do texto e corre até a borda).
 */
export function TransactionsPageSkeleton({ dias = DIAS }: TransactionsPageSkeletonProps) {
    // Onde cada dia começa na contagem das linhas: `[3, 1, 4]` vira `[0, 3, 4]`.
    const comeco = dias.map((_, d) => dias.slice(0, d).reduce((a, b) => a + b, 0))
    return (
        <SkeletonGroup className="flex min-w-0 max-w-full flex-col gap-4" label="Carregando transações…" delay>
            <PageHeaderSkeleton description={false} actions={2} className="max-md:hidden" />

            {/* A mesma quebra da barra real: abaixo de 48rem da linha, as abas esticam em cima e os filtros descem. */}
            <div className="@container/transacoes min-w-0">
                <div className="flex items-center gap-2 @max-3xl/transacoes:flex-wrap">
                    <Skeleton shape="control" className="w-60 @max-3xl/transacoes:min-w-0 @max-3xl/transacoes:flex-1" />
                    <Skeleton shape="control" className="hidden aspect-square max-md:block" />
                    <div className="min-w-0 flex-1 @max-3xl/transacoes:basis-full max-md:hidden">
                        <FilterBarSkeleton tokens={0} group={false} />
                    </div>
                </div>
            </div>

            <div className="max-md:hidden">
                <TablePanel>
                    <Table data-slot="table-skeleton">
                        <TableHeader variant="muted">
                            <TableRow>
                                <TableHead selection>
                                    <Skeleton className="size-4 rounded-sm" />
                                </TableHead>
                                {CABECALHOS.map((c) => (
                                    <TableHead key={c}>{c}</TableHead>
                                ))}
                                <TableHead numeric>Valor</TableHead>
                                <TableHead actions />
                            </TableRow>
                        </TableHeader>
                        <TableBody aria-hidden>
                            {dias.map((linhas, dia) => (
                                <Fragment key={dia}>
                                    <TableGroupRow
                                        colSpan={7}
                                        trailing={1}
                                        label={<Skeleton shape="text" className="h-2.5 w-14" />}
                                        total={<Skeleton shape="text" className="ms-auto h-3 w-20" />}
                                    />
                                    {Array.from({ length: linhas }, (_, i) => (
                                        <TableRow key={i}>
                                            <TableCell selection>
                                                <Skeleton className="size-4 rounded-sm" />
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Skeleton shape="tile" size="xs" className="shrink-0" />
                                                    <Skeleton shape="text" className={LARGURAS[(comeco[dia] + i) % LARGURAS.length]} />
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Skeleton shape="text" className="w-36" />
                                            </TableCell>
                                            <TableCell>
                                                <Skeleton shape="circle" size="xs" />
                                            </TableCell>
                                            <TableCell>
                                                <Skeleton shape="text" className="w-10" />
                                            </TableCell>
                                            <TableCell numeric>
                                                <Skeleton shape="text" className="ms-auto w-18" />
                                            </TableCell>
                                            <TableCell actions>
                                                <Skeleton shape="control" size="md" className="ms-auto aspect-square" />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </Fragment>
                            ))}
                        </TableBody>
                    </Table>
                </TablePanel>
            </div>

            <div aria-hidden className="flex flex-col px-px md:hidden">
                {dias.map((linhas, dia) => (
                    <div key={dia}>
                        {/* O dia real: 28 de altura (o texto de 11 com 4 em cima e 8 embaixo), a 20 da barra e a 24 do cartão de cima. */}
                        <div className={dia === 0 ? "mt-1 flex h-7 items-start justify-between px-4 pt-2" : "mt-5 flex h-7 items-start justify-between px-4 pt-2"}>
                            <Skeleton shape="text" className="h-2.5 w-14" />
                            <Skeleton shape="text" className="h-2.5 w-16" />
                        </div>
                        <div className="overflow-hidden rounded-surface bg-card">
                            {Array.from({ length: linhas }, (_, i) => (
                                <div key={i} className="flex min-h-16 items-center gap-3 ps-4">
                                    <Skeleton shape="tile" size="xs" className="shrink-0" />
                                    <div
                                        className={
                                            i < linhas - 1
                                                ? "flex min-h-16 flex-1 items-center gap-3 border-b border-border pe-4"
                                                : "flex min-h-16 flex-1 items-center gap-3 pe-4"
                                        }
                                    >
                                        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                                            <Skeleton shape="text" className={LARGURAS[(comeco[dia] + i) % LARGURAS.length]} />
                                            <Skeleton shape="text" className="h-3 w-36" />
                                        </div>
                                        <Skeleton shape="text" className="w-16 shrink-0" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </SkeletonGroup>
    )
}
