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
import { cn } from "@/lib/utils"

/** Total columns: checkbox + date + description + amount + payment + category + type + actions */
const TRANSACTION_TABLE_COL_SPAN = 8

/** Month divider rows in the skeleton body (not every band index, for readability). */
const SKELETON_MONTH_BAND_MAX = 1
/** Insert a month band every N slot indices while under SKELETON_MONTH_BAND_MAX. */
const SKELETON_MONTH_BAND_INTERVAL = 8

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
                    className="inline-flex h-10 min-w-0 max-w-full flex-1 shrink items-stretch rounded-lg bg-muted/60 p-0.5 ring-1 ring-border/60 md:h-8 md:max-w-fit md:shrink-0 dark:bg-muted/40"
                    aria-hidden
                >
                    <div className="flex h-full w-full min-h-0 items-center gap-0.5 px-0.5 md:w-auto">
                        <Skeleton className="h-[calc(100%-2px)] min-w-0 flex-1 rounded-md md:min-w-[4.25rem] md:flex-none" />
                        <Skeleton className="h-[calc(100%-2px)] min-w-0 flex-1 rounded-md md:min-w-[4.25rem] md:flex-none" />
                        <Skeleton className="h-[calc(100%-2px)] min-w-0 flex-1 rounded-md md:min-w-[4.25rem] md:flex-none" />
                    </div>
                </div>
                <Skeleton
                    className="size-10 shrink-0 rounded-[min(var(--radius-md),12px)] md:hidden"
                    aria-hidden
                />
            </div>

            <div className="hidden min-w-0 max-w-full flex-1 md:flex md:flex-wrap md:items-center md:justify-end md:gap-2">
                <div className="flex min-w-0 max-w-full flex-1 flex-wrap items-center justify-end gap-2 md:flex-nowrap">
                    <div className="min-w-0 max-w-full flex-1 overflow-hidden">
                        <div className="flex min-w-0 flex-nowrap items-center justify-end gap-2">
                            <Skeleton className="h-7 w-[4.75rem] shrink-0 rounded-full" />
                            <Skeleton className="h-7 w-[6.25rem] shrink-0 rounded-full" />
                            <Skeleton className="h-7 w-20 shrink-0 rounded-full" />
                        </div>
                    </div>
                    <Skeleton className="h-8 w-[5.75rem] shrink-0 rounded-md" />
                </div>
            </div>
        </div>
    )
}

function MonthBandSkeletonRow() {
    return (
        <TableRow className="border-border/80 bg-muted/30 hover:bg-muted/30">
            <TableCell className="w-10 px-2 py-2 align-middle md:w-11 md:px-3">
                <Skeleton className="size-4 shrink-0 rounded-sm" />
            </TableCell>
            <TableCell
                className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                colSpan={TRANSACTION_TABLE_COL_SPAN - 1}
            >
                <Skeleton className="h-3 w-28 max-w-[min(100%,12rem)]" />
            </TableCell>
        </TableRow>
    )
}

function DataRowSkeleton({ seed }: { seed: number }) {
    const descW =
        seed % 3 === 0
            ? "w-[min(100%,14rem)]"
            : seed % 3 === 1
              ? "w-[min(100%,11rem)]"
              : "w-[min(100%,9rem)]"

    return (
        <TableRow className="border-border/80">
            <TableCell className="w-10 px-2 py-3 md:w-11 md:px-3">
                <Skeleton className="size-4 shrink-0 rounded-sm" />
            </TableCell>
            <TableCell className="whitespace-nowrap px-4 py-3">
                <Skeleton className="h-4 w-14 tabular-nums" />
            </TableCell>
            <TableCell className="max-w-[160px] px-4 py-3 text-left sm:max-w-[200px] lg:max-w-[280px]">
                <Skeleton className={cn("h-4 max-w-full", descW)} />
            </TableCell>
            <TableCell className="px-4 py-3">
                <Skeleton className="h-4 w-20 tabular-nums" />
            </TableCell>
            <TableCell className="hidden max-w-[11rem] truncate px-4 py-3 md:table-cell">
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
            <TableCell className="px-3 py-3 pr-4 text-left">
                <div className="flex items-center justify-start gap-1">
                    <Skeleton className="size-7 shrink-0 rounded-md" />
                    <Skeleton className="size-7 shrink-0 rounded-md" />
                </div>
            </TableCell>
        </TableRow>
    )
}

function TableSkeleton({ rowCount }: { rowCount: number }) {
    const bodyRows: ReactNode[] = []
    let monthBandsShown = 0
    for (let i = 0; i < rowCount; i++) {
        const showMonthBand =
            i % SKELETON_MONTH_BAND_INTERVAL === 0 &&
            monthBandsShown < SKELETON_MONTH_BAND_MAX
        if (showMonthBand) {
            monthBandsShown += 1
            bodyRows.push(<MonthBandSkeletonRow key={`month-${i}`} />)
        } else {
            bodyRows.push(<DataRowSkeleton key={`row-${i}`} seed={i} />)
        }
    }

    return (
        <Card className="gap-0 overflow-hidden border border-border py-0 shadow-none ring-0">
            <CardContent className="relative flex flex-col p-0">
                <div className="min-w-0 overflow-hidden rounded-t-xl">
                    <div className="border-b border-border/60 bg-muted/30 px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground sm:hidden">
                        Arraste para ver mais →
                    </div>
                    <Table className="min-w-[640px] text-sm md:min-w-[700px]">
                        <TableHeader className="sticky top-0 z-10 bg-muted/50 [&_tr]:border-b-0">
                            <TableRow className="border-0 hover:bg-transparent [&>th]:border-b [&>th]:border-border">
                                <TableHead className="w-10 px-2 py-0 md:w-11 md:px-3">
                                    <Skeleton className="mx-auto size-4 rounded-sm" />
                                </TableHead>
                                <TableHead className="h-11 w-[4.75rem] px-4 py-0 align-middle md:w-[5.5rem]">
                                    <Skeleton className="h-3.5 w-8" />
                                </TableHead>
                                <TableHead className="h-11 px-4 py-0">
                                    <Skeleton className="h-3.5 w-20" />
                                </TableHead>
                                <TableHead className="h-11 px-4 py-0">
                                    <Skeleton className="h-3.5 w-10" />
                                </TableHead>
                                <TableHead className="hidden h-11 max-w-[11rem] px-4 py-0 md:table-cell">
                                    <Skeleton className="h-3.5 w-24" />
                                </TableHead>
                                <TableHead className="hidden h-11 px-4 py-0 md:table-cell">
                                    <Skeleton className="h-3.5 w-16" />
                                </TableHead>
                                <TableHead className="h-11 min-w-[5.5rem] px-4 py-0">
                                    <Skeleton className="h-3.5 w-8" />
                                </TableHead>
                                <TableHead className="h-11 w-[4.5rem] px-3 py-0 pr-4 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground md:w-[5.25rem]">
                                    <Skeleton className="h-3 w-10" />
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="[&_tr:last-child]:border-b-0">
                            {bodyRows}
                        </TableBody>
                    </Table>
                </div>
                <div className="flex shrink-0 flex-col gap-2.5 rounded-b-xl border-t border-border bg-muted/40 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-4">
                    <Skeleton className="h-4 w-[min(100%,14rem)] max-w-full" />
                    <div className="flex items-center justify-between gap-3 sm:justify-end">
                        <Skeleton className="h-4 w-28 shrink-0 sm:mr-1" />
                        <div className="flex items-center rounded-lg border border-border/80 bg-background/80 p-0.5 shadow-sm">
                            <Skeleton className="size-8 shrink-0 rounded-md" />
                            <Skeleton className="size-8 shrink-0 rounded-md" />
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

export function TransactionsPageSkeleton({
    rowCount = DEFAULT_ROW_COUNT,
}: TransactionsPageSkeletonProps) {
    return (
        <div
            className="min-w-0 max-w-full space-y-3"
            role="status"
            aria-busy="true"
            aria-label="Carregando transações"
        >
            <ToolbarSkeleton />
            <TableSkeleton rowCount={rowCount} />
        </div>
    )
}
