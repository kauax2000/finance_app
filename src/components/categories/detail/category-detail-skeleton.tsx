import type { ReactNode } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton, SkeletonGroup } from "@/components/ui/skeleton"
import { TableSkeleton, type TableSkeletonColumn } from "@/components/ui/table"
import { TablePanel, TablePanelFooter } from "@/components/ui/data-table"

type CategoryDetailSkeletonProps = {
    categoryType?: "income" | "expense" | null
}

function HeroSkeleton() {
    return (
        <div className="w-full min-w-0 max-w-full space-y-2">
            <div className="flex w-full min-w-0 items-center justify-between gap-2 md:hidden">
                <div className="flex min-w-0 items-center gap-2">
                    <Skeleton shape="tile" />
                    <Skeleton className="h-5 w-40 max-w-full" />
                </div>
                <div className="flex shrink-0 items-center gap-1">
                    <Skeleton className="h-5 w-20 shrink-0 rounded-full" />
                    <Skeleton shape="tile" size="lg" />
                </div>
            </div>

            <div className="hidden md:grid md:min-h-10 md:w-full md:min-w-0 md:max-w-full md:grid-cols-[minmax(0,1fr)_minmax(0,min(100%,24rem))_auto] md:grid-rows-1 md:items-center md:gap-x-3">
                <div className="min-w-0">
                    <div className="flex min-h-10 min-w-0 items-center gap-2.5">
                        <div className="flex min-w-0 max-w-full flex-1 items-center gap-2 overflow-hidden">
                            <Skeleton shape="tile" />
                            <div className="flex min-w-0 items-center gap-2">
                                <Skeleton className="h-6 w-56 max-w-full" />
                                <Skeleton className="h-5 w-20 shrink-0 rounded-full" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex min-h-10 min-w-0 max-w-[min(100%,24rem)] items-center justify-end">
                    <div className="flex w-full min-w-0 items-center justify-between gap-2">
                        <Skeleton className="h-8 w-16 shrink-0 rounded-md" />
                        <Skeleton shape="tile" />
                        <Skeleton className="h-8 flex-1 rounded-md" />
                        <Skeleton shape="tile" />
                    </div>
                </div>

                <div className="flex min-h-10 shrink-0 items-center justify-end">
                    <Skeleton shape="tile" size="lg" />
                </div>
            </div>
        </div>
    )
}

const metricCardHeaderClassName =
    "flex shrink-0 min-h-14 flex-col justify-center gap-1 border-b border-border bg-muted/40 px-4 py-2.5 md:min-h-11 md:flex-row md:items-center md:justify-between md:gap-2 md:px-5"

function MetricCardSkeleton({ headerRight }: { headerRight?: ReactNode }) {
    return (
        <Card padding="none" className="h-full min-w-0">
            <div className={metricCardHeaderClassName}>
                <div className="flex min-w-0 flex-1 items-center justify-between gap-2 md:min-w-0 md:flex-1">
                    <Skeleton className="h-3 w-28 max-w-full" />
                    {headerRight ? (
                        <div className="hidden shrink-0 justify-end md:flex">{headerRight}</div>
                    ) : null}
                </div>
                {headerRight ? <div className="md:hidden">{headerRight}</div> : null}
            </div>
            <CardContent className="bg-muted/10 pt-4 pb-4 md:pt-5 md:pb-5">
                <Skeleton className="h-6 w-32 max-w-full" />
            </CardContent>
        </Card>
    )
}

function SummaryIncomeSkeleton() {
    return (
        <section className="space-y-3" aria-label="Resumo do mês (skeleton)">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
                <MetricCardSkeleton headerRight={<Skeleton className="h-5 w-14 rounded-full" />} />
                <MetricCardSkeleton />
                <MetricCardSkeleton />
                <MetricCardSkeleton />
            </div>
        </section>
    )
}

function BudgetMoMMobileCardSkeleton() {
    return (
        <div
            className="w-full min-w-0 rounded-lg border border-border/80 bg-muted/20 p-3 md:hidden"
            aria-hidden
        >
            <div className="flex min-w-0 items-start gap-2.5">
                <Skeleton className="mt-0.5 size-4 shrink-0 rounded-sm" />
                <div className="min-w-0 flex-1 space-y-1">
                    <Skeleton className="h-3 w-32 max-w-full" />
                    <Skeleton className="h-4 w-24 max-w-full" />
                </div>
            </div>
        </div>
    )
}

function SummaryExpenseSkeleton() {
    return (
        <section className="space-y-3" aria-label="Resumo do mês (skeleton)">
            <div className="min-w-0 space-y-4 md:col-span-6">
                <div className="flex min-w-0 flex-col items-start gap-2 md:flex-row md:items-start md:justify-between">
                    <Skeleton className="h-4 w-32" />
                    <div className="flex w-full min-w-0 flex-col items-start gap-2 md:ml-auto md:w-auto md:min-w-0 md:flex-row md:items-center md:justify-end">
                        <BudgetMoMMobileCardSkeleton />
                        <div className="hidden md:block">
                            <Skeleton className="h-5 w-24 rounded-full" />
                        </div>
                    </div>
                </div>

                <Card padding="none" className="min-w-0">
                    <CardContent className="space-y-4 p-3 md:p-4">
                        <div className="flex w-full items-center justify-between gap-2 md:hidden">
                            <Skeleton className="h-3 w-12" />
                            <Skeleton className="h-3 w-28" />
                        </div>
                        <div className="grid grid-cols-2 items-end gap-3 md:flex md:flex-wrap md:justify-between md:gap-x-6 md:gap-y-4">
                            <div className="min-w-0 space-y-1">
                                <Skeleton className="h-3 w-12" />
                                <Skeleton className="h-7 w-40 max-w-full" />
                            </div>

                            <div className="min-w-0 justify-self-end space-y-1 text-right">
                                <Skeleton className="ml-auto h-3 w-20" />
                                <Skeleton className="ml-auto h-7 w-40 max-w-full" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between gap-2">
                                <Skeleton className="h-3 w-24" />
                                <Skeleton className="h-3 w-10" />
                            </div>
                            <Skeleton className="h-1.5 w-full rounded-full" />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </section>
    )
}

function TrendsSkeleton() {
    return (
        <section className="min-w-0 space-y-4" aria-label="Tendência (skeleton)">
            <div className="flex min-w-0 items-center justify-between gap-4">
                <div className="flex h-6 min-w-0 items-center">
                    <Skeleton className="h-4 w-24" />
                </div>
                <div className="inline-flex h-8 w-40 shrink-0 items-stretch gap-0.5 rounded-lg bg-muted p-0.5 pointer-coarse:h-10">
                    <div className="flex h-full w-full min-h-0 items-center gap-0.5 px-0.5">
                        <Skeleton className="h-[calc(100%-2px)] flex-1 rounded-md" />
                        <Skeleton className="h-[calc(100%-2px)] flex-1 rounded-md" />
                    </div>
                </div>
            </div>

            <Card padding="none">
                <CardContent className="p-3">
                    <Skeleton className="mb-2 h-3 w-48 max-w-full" />
                    <Skeleton className="h-50 w-full rounded-md" />
                </CardContent>
            </Card>
        </section>
    )
}

/**
 * As colunas da `TransactionsTable` com seleção e ações — a forma que
 * `category-embedded-transactions.tsx` monta —, com os rótulos de verdade à
 * vista enquanto as linhas não chegam.
 */
const EMBEDDED_TRANSACTIONS_COLUMNS: TableSkeletonColumn[] = [
    { selection: true },
    { label: "Data" },
    { label: "Descrição" },
    { label: "Valor", numeric: true },
    { label: "Forma de pagamento", className: "hidden md:table-cell" },
    { label: "Categoria", className: "hidden md:table-cell" },
    { label: "Tipo" },
    { label: "Ações", actions: true },
]

function EmbeddedTransactionsSkeleton({ rowCount = 8 }: { rowCount?: number }) {
    return (
        <section className="min-w-0 max-w-full space-y-3" aria-label="Lançamentos do mês (skeleton)">
            <div className="flex min-w-0 max-w-full flex-col gap-2 md:flex-row md:flex-wrap md:items-center md:justify-between md:gap-3">
                <div className="flex h-8 min-w-0 items-end">
                    <Skeleton className="h-3 w-36" />
                </div>
                <div className="flex w-full min-w-0 flex-col gap-2 md:w-auto md:flex-row md:items-center md:justify-end md:gap-2">
                    <Skeleton className="h-8 w-full rounded-md pointer-coarse:h-10 md:w-56" />
                    <Skeleton className="h-8 w-full rounded-md pointer-coarse:h-10 md:w-32" />
                </div>
            </div>

            {/* O painel da `TransactionsTable`: a moldura, a densidade `md` e o rodapé de
                paginação vêm das peças. O atraso já é do grupo da página. */}
            <TablePanel
                footer={
                    <TablePanelFooter>
                        <Skeleton className="h-4 w-full max-w-48" />
                        <Skeleton className="h-8 w-40 self-end rounded-md sm:self-auto" />
                    </TablePanelFooter>
                }
            >
                <TableSkeleton
                    columns={EMBEDDED_TRANSACTIONS_COLUMNS}
                    rows={rowCount}
                    group={false}
                    className="min-w-160 md:min-w-175"
                />
            </TablePanel>
        </section>
    )
}

function SummarySkeleton({ categoryType }: { categoryType: CategoryDetailSkeletonProps["categoryType"] }) {
    if (categoryType === "income") return <SummaryIncomeSkeleton />
    if (categoryType === "expense") return <SummaryExpenseSkeleton />
    // Unknown: default to expense (most representative/complex) to reduce layout jump.
    return <SummaryExpenseSkeleton />
}

export function CategoryDetailSkeleton({ categoryType = null }: CategoryDetailSkeletonProps) {
    return (
        <SkeletonGroup className="min-w-0 max-w-full space-y-5" label="Carregando a categoria…" delay>
            <HeroSkeleton />
            <div className="space-y-5">
                <SummarySkeleton categoryType={categoryType} />
                <TrendsSkeleton />
                <EmbeddedTransactionsSkeleton />
            </div>
        </SkeletonGroup>
    )
}
