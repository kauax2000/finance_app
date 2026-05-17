import type { ReactNode } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

type CategoryDetailSkeletonProps = {
    categoryType?: "income" | "expense" | null
}

function HeroSkeleton() {
    return (
        <div className="w-full min-w-0 max-w-full space-y-2">
            <div className="flex w-full min-w-0 items-center justify-between gap-2 md:hidden">
                <div className="flex min-w-0 items-center gap-2">
                    <Skeleton className="size-8 shrink-0 rounded-md" />
                    <Skeleton className="h-5 w-40 max-w-full" />
                </div>
                <div className="flex shrink-0 items-center gap-1">
                    <Skeleton className="h-5 w-20 shrink-0 rounded-full" />
                    <Skeleton className="size-9 shrink-0 rounded-md" />
                </div>
            </div>

            <div className="hidden md:grid md:min-h-10 md:w-full md:min-w-0 md:max-w-full md:grid-cols-[minmax(0,1fr)_minmax(0,min(100%,24rem))_auto] md:grid-rows-1 md:items-center md:gap-x-3">
                <div className="min-w-0">
                    <div className="flex min-h-10 min-w-0 items-center gap-2.5">
                        <div className="flex min-w-0 max-w-full flex-1 items-center gap-2 overflow-hidden">
                            <Skeleton className="size-8 shrink-0 rounded-md" />
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
                        <Skeleton className="size-8 shrink-0 rounded-md" />
                        <Skeleton className="h-8 w-[min(100%,14rem)] flex-1 rounded-md" />
                        <Skeleton className="size-8 shrink-0 rounded-md" />
                    </div>
                </div>

                <div className="flex min-h-10 shrink-0 items-center justify-end">
                    <Skeleton className="size-9 shrink-0 rounded-md" />
                </div>
            </div>
        </div>
    )
}

const metricCardHeaderClassName =
    "flex shrink-0 min-h-14 flex-col justify-center gap-1 border-b border-border bg-muted/40 px-4 py-2.5 md:min-h-11 md:flex-row md:items-center md:justify-between md:gap-2 md:px-5"

function MetricCardSkeleton({ headerRight }: { headerRight?: ReactNode }) {
    return (
        <Card className="h-full min-w-0 gap-0 overflow-hidden py-0 shadow-none">
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
            className="w-full min-w-0 rounded-lg border border-border/80 bg-muted/20 p-3 ring-1 ring-foreground/10 md:hidden"
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
            <div className="min-w-0 space-y-2 md:col-span-6">
                <div className="flex min-w-0 flex-col items-start gap-2 md:flex-row md:items-start md:justify-between">
                    <Skeleton className="h-3 w-32" />
                    <div className="flex w-full min-w-0 flex-col items-start gap-2 md:ml-auto md:w-auto md:min-w-0 md:flex-row md:items-center md:justify-end">
                        <BudgetMoMMobileCardSkeleton />
                        <div className="hidden md:block">
                            <Skeleton className="h-5 w-24 rounded-full" />
                        </div>
                    </div>
                </div>

                <Card size="sm" className="min-w-0">
                    <CardContent className="space-y-4 p-3 md:p-4">
                        <div className="flex w-full items-center justify-between gap-2 rounded-md border border-border/60 bg-muted/20 px-3 py-2 md:hidden">
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
        <section className="min-w-0 space-y-3" aria-label="Tendência (skeleton)">
            <div className="flex min-w-0 max-w-full flex-col gap-2 md:flex-row md:flex-wrap md:items-center md:justify-between md:gap-3">
                <div className="flex h-8 min-w-0 items-end gap-2">
                    <Skeleton className="h-3 w-24" />
                </div>
                <div className="inline-flex h-9 w-full max-w-full shrink-0 items-stretch rounded-lg bg-muted/60 p-0.5 ring-1 ring-border/60 md:h-8 md:w-[12.5rem] dark:bg-muted/40">
                    <div className="flex h-full w-full min-h-0 items-center gap-0.5 px-0.5">
                        <Skeleton className="h-[calc(100%-2px)] flex-1 rounded-md" />
                        <Skeleton className="h-[calc(100%-2px)] flex-1 rounded-md" />
                    </div>
                </div>
            </div>

            <Card size="sm">
                <CardContent className="p-3">
                    <Skeleton className="mb-2 h-3 w-48 max-w-full" />
                    <Skeleton className="h-[200px] w-full rounded-md" />
                </CardContent>
            </Card>
        </section>
    )
}

function EmbeddedTransactionsSkeleton({ rowCount = 8 }: { rowCount?: number }) {
    const rows = Array.from({ length: rowCount })
    return (
        <section className="min-w-0 max-w-full space-y-3" aria-label="Lançamentos do mês (skeleton)">
            <div className="flex min-w-0 max-w-full flex-col gap-2 md:flex-row md:flex-wrap md:items-center md:justify-between md:gap-3">
                <div className="flex h-8 min-w-0 items-end">
                    <Skeleton className="h-3 w-36" />
                </div>
                <div className="flex w-full min-w-0 flex-col gap-2 md:w-auto md:flex-row md:items-center md:justify-end md:gap-2">
                    <Skeleton className="h-10 w-full rounded-md md:h-8 md:w-56" />
                    <Skeleton className="h-10 w-full rounded-md md:h-8 md:w-32" />
                </div>
            </div>

            <Card className="gap-0 overflow-hidden border border-border py-0 shadow-none ring-0">
                <CardContent className="relative flex flex-col p-0">
                    <div className="min-w-0 overflow-hidden rounded-t-xl">
                        <Table className="min-w-[700px] text-sm">
                            <TableHeader className="sticky top-0 z-10 bg-muted/50 [&_tr]:border-b-0">
                                <TableRow className="border-0 hover:bg-transparent [&>th]:border-b [&>th]:border-border">
                                    <TableHead className="w-10 px-2 py-0 md:w-11 md:px-3">
                                        <Skeleton className="mx-auto size-4 rounded-sm" />
                                    </TableHead>
                                    <TableHead className="h-11 w-[5.5rem] px-4 py-0">
                                        <Skeleton className="h-3.5 w-8" />
                                    </TableHead>
                                    <TableHead className="h-11 px-4 py-0">
                                        <Skeleton className="h-3.5 w-20" />
                                    </TableHead>
                                    <TableHead className="h-11 px-4 py-0">
                                        <Skeleton className="h-3.5 w-10" />
                                    </TableHead>
                                    <TableHead className="hidden h-11 max-w-[10rem] px-4 py-0 md:table-cell">
                                        <Skeleton className="h-3.5 w-24" />
                                    </TableHead>
                                    <TableHead className="hidden h-11 px-4 py-0 md:table-cell">
                                        <Skeleton className="h-3.5 w-16" />
                                    </TableHead>
                                    <TableHead className="h-11 min-w-[5.5rem] px-4 py-0">
                                        <Skeleton className="h-3.5 w-8" />
                                    </TableHead>
                                    <TableHead className="h-11 w-[5.25rem] px-3 py-0 pr-4 text-left">
                                        <Skeleton className="h-3 w-10" />
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="[&_tr:last-child]:border-b-0">
                                {rows.map((_, i) => (
                                    <TableRow key={i} className="border-border/80">
                                        <TableCell className="w-10 px-2 py-3 md:w-11 md:px-3">
                                            <Skeleton className="size-4 shrink-0 rounded-sm" />
                                        </TableCell>
                                        <TableCell className="whitespace-nowrap px-4 py-3">
                                            <Skeleton className="h-4 w-14 tabular-nums" />
                                        </TableCell>
                                        <TableCell className="max-w-[200px] px-4 py-3 text-left lg:max-w-[280px]">
                                            <Skeleton className="h-4 w-[min(100%,14rem)] max-w-full" />
                                        </TableCell>
                                        <TableCell className="px-4 py-3">
                                            <Skeleton className="h-4 w-20 tabular-nums" />
                                        </TableCell>
                                        <TableCell className="hidden max-w-[10rem] truncate px-4 py-3 md:table-cell">
                                            <Skeleton className="h-4 w-[min(100%,7rem)] max-w-full" />
                                        </TableCell>
                                        <TableCell className="hidden max-w-[8rem] truncate px-4 py-3 md:table-cell">
                                            <span className="inline-flex max-w-full items-center gap-1.5">
                                                <Skeleton className="size-2 shrink-0 rounded-full" />
                                                <Skeleton className="h-4 w-16 max-w-full" />
                                            </span>
                                        </TableCell>
                                        <TableCell className="min-w-[5.5rem] px-4 py-3">
                                            <Skeleton className="h-6 w-[4.5rem] rounded-full" />
                                        </TableCell>
                                        <TableCell className="w-[5.25rem] px-3 py-3 pr-4">
                                            <div className="flex items-center justify-start gap-1">
                                                <Skeleton className="size-7 shrink-0 rounded-md" />
                                                <Skeleton className="size-7 shrink-0 rounded-md" />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                    <div className="flex shrink-0 flex-col gap-2.5 rounded-b-xl border-t border-border bg-muted/40 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-4">
                        <Skeleton className="h-4 w-[min(100%,14rem)] max-w-full" />
                        <div className="flex items-center justify-between gap-3 sm:justify-end">
                            <Skeleton className="h-4 w-28 shrink-0 sm:mr-1" />
                            <Skeleton className="h-9 w-[4.75rem] shrink-0 rounded-lg" />
                        </div>
                    </div>
                </CardContent>
            </Card>
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
        <div className="min-w-0 max-w-full space-y-5">
            <HeroSkeleton />
            <div className="space-y-5">
                <SummarySkeleton categoryType={categoryType} />
                <TrendsSkeleton />
                <EmbeddedTransactionsSkeleton />
            </div>
        </div>
    )
}
