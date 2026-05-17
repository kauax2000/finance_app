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
import { transactionSegmentContainerClassName } from "@/components/transactions/transaction-type-segment"
import { cn } from "@/lib/utils"

function ToolbarSkeleton() {
    return (
        <div className="flex flex-col gap-2 md:flex-row md:flex-wrap md:items-center md:justify-between md:gap-3">
            <div className="flex min-w-0 flex-row items-center gap-2 md:contents">
                <div
                    className={cn(
                        transactionSegmentContainerClassName,
                        "min-w-0 flex-1 md:flex-initial md:shrink-0"
                    )}
                    aria-hidden
                >
                    <div className="flex h-full w-full min-h-0 items-center gap-0.5 px-0.5 md:w-auto">
                        <Skeleton className="h-[calc(100%-2px)] min-w-0 flex-1 rounded-md md:min-w-[4.25rem] md:flex-none" />
                        <Skeleton className="h-[calc(100%-2px)] min-w-0 flex-1 rounded-md md:min-w-[4.25rem] md:flex-none" />
                        <Skeleton className="h-[calc(100%-2px)] min-w-0 flex-1 rounded-md md:min-w-[4.25rem] md:flex-none" />
                    </div>
                </div>
                <Skeleton className="size-10 shrink-0 rounded-md md:hidden" />
            </div>
            <div className="hidden min-w-0 shrink-0 md:flex md:flex-wrap md:items-center md:justify-end md:gap-2">
                <Skeleton className="size-8 shrink-0 rounded-md" />
                <Skeleton className="h-8 w-[9rem] rounded-md" />
                <Skeleton className="h-8 w-[8.5rem] rounded-md" />
            </div>
        </div>
    )
}

function DataRowSkeleton({ seed }: { seed: number }) {
    const nameW =
        seed % 3 === 0
            ? "w-[min(100%,12rem)]"
            : seed % 3 === 1
              ? "w-[min(100%,9rem)]"
              : "w-[min(100%,7rem)]"
    return (
        <TableRow className="border-border/80">
            <TableCell className="w-10 px-2 py-3 md:w-11 md:px-3">
                <Skeleton className="size-4 shrink-0 rounded-sm" />
            </TableCell>
            <TableCell className="max-w-[200px] px-4 py-3 lg:max-w-[280px]">
                <Skeleton className={cn("h-4 max-w-full", nameW)} />
                <Skeleton className="mt-1.5 h-3 w-[min(100%,10rem)] max-w-full" />
            </TableCell>
            <TableCell className="whitespace-nowrap px-4 py-3">
                <Skeleton className="h-4 w-20 tabular-nums" />
            </TableCell>
            <TableCell className="hidden px-4 py-3 sm:table-cell">
                <Skeleton className="h-4 w-16" />
            </TableCell>
            <TableCell className="whitespace-nowrap px-4 py-3">
                <Skeleton className="h-4 w-[4.5rem] tabular-nums" />
            </TableCell>
            <TableCell className="hidden max-w-[8rem] px-4 py-3 md:table-cell">
                <span className="inline-flex max-w-full items-center gap-1.5">
                    <Skeleton className="size-2 shrink-0 rounded-full" />
                    <Skeleton className="h-4 w-16 max-w-full" />
                </span>
            </TableCell>
            <TableCell className="min-w-[4.5rem] px-4 py-3">
                <Skeleton className="h-6 w-[3.25rem] rounded-full" />
            </TableCell>
            <TableCell className="w-[5.25rem] px-3 py-3 pr-4">
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
    for (let i = 0; i < rowCount; i++) {
        bodyRows.push(<DataRowSkeleton key={`row-${i}`} seed={i} />)
    }
    return (
        <Card className="gap-0 overflow-hidden border border-border py-0 shadow-none ring-0">
            <CardContent className="relative flex flex-col p-0">
                <div className="min-w-0 overflow-hidden rounded-t-xl">
                    <Table className="min-w-[720px] text-sm">
                        <TableHeader className="bg-muted/50 [&_tr]:border-b-0">
                            <TableRow className="border-0 hover:bg-transparent [&>th]:border-b [&>th]:border-border">
                                <TableHead className="w-10 px-2 py-0 md:w-11 md:px-3">
                                    <Skeleton className="mx-auto size-4 rounded-sm" />
                                </TableHead>
                                <TableHead className="h-11 px-4 py-0">
                                    <Skeleton className="h-3.5 w-20" />
                                </TableHead>
                                <TableHead className="h-11 w-[5.5rem] px-4 py-0">
                                    <Skeleton className="h-3.5 w-10" />
                                </TableHead>
                                <TableHead className="hidden h-11 px-4 py-0 sm:table-cell">
                                    <Skeleton className="h-3.5 w-20" />
                                </TableHead>
                                <TableHead className="h-11 px-4 py-0">
                                    <Skeleton className="h-3.5 w-14" />
                                </TableHead>
                                <TableHead className="hidden h-11 px-4 py-0 md:table-cell">
                                    <Skeleton className="h-3.5 w-16" />
                                </TableHead>
                                <TableHead className="h-11 min-w-[4.5rem] px-4 py-0">
                                    <Skeleton className="h-3.5 w-12" />
                                </TableHead>
                                <TableHead className="h-11 w-[5.25rem] px-3 py-0 pr-4 text-left">
                                    <Skeleton className="h-3 w-10" />
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="[&_tr:last-child]:border-b-0">
                            {bodyRows}
                        </TableBody>
                    </Table>
                </div>
                <div className="flex shrink-0 flex-col gap-2 rounded-b-xl border-t border-border bg-muted/40 px-3 py-2.5 sm:px-4">
                    <Skeleton className="h-4 w-[min(100%,14rem)] max-w-full" />
                </div>
            </CardContent>
        </Card>
    )
}

const DEFAULT_ROW_COUNT = 6

export function SubscriptionsPageSkeleton({
    rowCount = DEFAULT_ROW_COUNT,
}: {
    rowCount?: number
}) {
    return (
        <div
            className="flex flex-col gap-3"
            role="status"
            aria-busy="true"
            aria-label="Carregando assinaturas"
        >
            <ToolbarSkeleton />
            <TableSkeleton rowCount={rowCount} />
        </div>
    )
}
