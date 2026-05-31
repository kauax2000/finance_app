"use client"

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

const KPI_KEYS = ["resultado", "receitas", "despesas", "faturas"] as const
const CATEGORY_LIST_KEYS = [
    "cat-1",
    "cat-2",
    "cat-3",
    "cat-4",
    "cat-5",
] as const
const INVOICE_KEYS = ["card-1", "card-2", "card-3"] as const
const INSTALLMENT_KEYS = ["plan-1", "plan-2"] as const
const RECENT_TX_KEYS = ["tx-1", "tx-2", "tx-3", "tx-4", "tx-5"] as const
const RECENT_TX_TABLE_ROW_KEYS = [
    "trow-1",
    "trow-2",
    "trow-3",
    "trow-4",
    "trow-5",
    "trow-6",
    "trow-7",
] as const
const UPCOMING_GROUP_KEYS = ["g-1", "g-2", "g-3"] as const
const UPCOMING_ITEM_KEYS = ["item-1", "item-2"] as const
const SUMMARY_KEYS = ["projected", "paid", "closings"] as const
const WEEKDAY_KEYS = ["seg", "ter", "qua", "qui", "sex", "sab", "dom"] as const
const MOBILE_WEEK_KEYS = ["w1", "w2", "w3", "w4", "w5", "w6"] as const
const DESKTOP_CELL_KEYS = Array.from({ length: 35 }, (_, i) => `cell-${i + 1}`)

function CardSectionShell({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <Card className="gap-0 overflow-hidden border border-border py-0 shadow-none ring-0">
            <CardContent className="relative flex flex-col gap-0 p-0">
                {children}
            </CardContent>
        </Card>
    )
}

function CardSectionHeader() {
    return (
        <div className="flex min-h-10 shrink-0 items-center border-b border-border bg-muted/30 px-4 py-2.5">
            <Skeleton className="h-5 w-40 max-w-full rounded-md" />
        </div>
    )
}

function SectionTitleRow({
    titleClassName = "h-3 w-44 max-w-full",
    cta,
}: {
    titleClassName?: string
    cta?: "none" | "responsive"
}) {
    if (cta === "responsive") {
        return (
            <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex h-8 min-w-0 items-end">
                    <Skeleton className={titleClassName} />
                </div>
                <Skeleton className="h-10 w-full rounded-md md:h-8 md:w-32" />
            </div>
        )
    }
    return (
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex h-8 min-w-0 items-end">
                <Skeleton className={titleClassName} />
            </div>
        </div>
    )
}

function DashboardToolbarSkeleton() {
    return (
        <div className="hidden min-w-0 max-w-full md:flex md:flex-row md:flex-wrap md:items-center md:justify-end md:gap-3">
            <div className="flex w-full min-w-0 items-center justify-between gap-2 md:w-auto md:justify-end md:gap-1.5">
                <Skeleton className="h-8 w-20 shrink-0 rounded-md" />
                <Skeleton className="size-8 shrink-0 rounded-md" />
                <div className="flex min-w-0 flex-1 items-center justify-center gap-1.5 md:max-w-[16rem]">
                    <Skeleton className="h-8 w-44 rounded-md" />
                </div>
                <Skeleton className="size-8 shrink-0 rounded-md" />
            </div>
        </div>
    )
}

function DashboardKpiSkeleton() {
    return (
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
            {KPI_KEYS.map((key, index) => (
                <Card
                    key={key}
                    className="gap-0 overflow-hidden py-0 shadow-none"
                >
                    <div className="flex min-h-11 items-center justify-between gap-2 border-b border-border bg-muted/40 px-4 py-2.5">
                        <div className="flex min-w-0 flex-1 items-center gap-2">
                            <Skeleton className="hidden size-3.5 shrink-0 rounded-sm md:block" />
                            <Skeleton className="h-3 w-20 max-w-full" />
                        </div>
                        {index !== 3 ? (
                            <Skeleton className="h-5 w-12 shrink-0 rounded-full" />
                        ) : null}
                    </div>
                    <div className="px-4 pt-4 pb-4 md:pt-5 md:pb-5">
                        <Skeleton className="h-7 w-28 max-w-full" />
                        {index === 2 ? (
                            <Skeleton className="mt-2 h-2.5 w-40 max-w-full" />
                        ) : index === 3 ? (
                            <Skeleton className="mt-2 h-2.5 w-44 max-w-full" />
                        ) : null}
                    </div>
                </Card>
            ))}
        </div>
    )
}

function CalendarSummarySkeleton({
    cols,
}: {
    cols: 1 | 3
}) {
    return (
        <div className="shrink-0 border-b border-border bg-muted/10 px-3 py-2.5 dark:bg-muted/20">
            <div
                className={
                    cols === 3
                        ? "grid grid-cols-1 gap-x-6 gap-y-1.5 sm:grid-cols-3"
                        : "grid grid-cols-1 gap-x-6 gap-y-1.5"
                }
            >
                {SUMMARY_KEYS.map((key) => (
                    <div
                        key={key}
                        className={
                            cols === 3
                                ? "flex items-baseline justify-between gap-2 text-xs sm:flex-col sm:items-start"
                                : "flex items-baseline justify-between gap-2 text-xs"
                        }
                    >
                        <Skeleton className="h-3 w-24 max-w-full rounded-md" />
                        <Skeleton className="h-4 w-24 max-w-full rounded-md" />
                    </div>
                ))}
            </div>
        </div>
    )
}

function CalendarMobileSkeleton() {
    return (
        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 p-3 md:hidden">
            <div className="min-w-0 rounded-lg border border-border/60 p-3">
                <div className="mb-2 grid grid-cols-7 gap-1">
                    {WEEKDAY_KEYS.map((key) => (
                        <Skeleton key={key} className="mx-auto h-3 w-6 rounded-md" />
                    ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                    {MOBILE_WEEK_KEYS.flatMap((wk) =>
                        WEEKDAY_KEYS.map((d) => (
                            <Skeleton
                                key={`${wk}-${d}`}
                                className="aspect-square w-full rounded-md"
                            />
                        )),
                    )}
                </div>
            </div>
            <div className="space-y-3">
                {UPCOMING_GROUP_KEYS.slice(0, 2).map((g) => (
                    <div key={g} className="space-y-1.5">
                        <Skeleton className="h-3 w-20 rounded-md" />
                        <div className="space-y-1.5 pl-1">
                            {UPCOMING_ITEM_KEYS.map((i) => (
                                <div
                                    key={`${g}-${i}`}
                                    className="flex items-center justify-between gap-2 rounded-lg border border-border/60 px-2 py-2"
                                >
                                    <div className="flex min-w-0 flex-1 items-center gap-2">
                                        <Skeleton className="h-4 max-w-[10rem] flex-1 rounded-md" />
                                        <Skeleton className="h-5 w-14 shrink-0 rounded-full" />
                                    </div>
                                    <Skeleton className="h-4 w-16 shrink-0 rounded-md" />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

function CalendarDesktopSkeleton() {
    return (
        <div className="hidden min-w-0 md:flex md:min-w-0 md:flex-col md:border-b md:border-border lg:flex-row lg:items-stretch">
            <div className="hidden min-w-0 shrink-0 px-4 py-3 lg:block lg:w-80 lg:border-e lg:border-border lg:px-3 xl:px-4">
                <Skeleton className="mb-2 h-3 w-36 rounded-md" />
                <div className="space-y-3">
                    {UPCOMING_GROUP_KEYS.map((g) => (
                        <div key={g} className="space-y-1.5">
                            <Skeleton className="h-3 w-24 rounded-md" />
                            <div className="space-y-1.5 pl-1">
                                {UPCOMING_ITEM_KEYS.map((i) => (
                                    <div
                                        key={`${g}-${i}`}
                                        className="flex items-center justify-between gap-2 rounded-lg border border-border/60 px-2 py-2"
                                    >
                                        <div className="flex min-w-0 flex-1 items-center gap-2">
                                            <Skeleton className="h-4 max-w-[10rem] flex-1 rounded-md" />
                                            <Skeleton className="h-5 w-14 shrink-0 rounded-full" />
                                        </div>
                                        <Skeleton className="h-4 w-[4.25rem] shrink-0 rounded-md" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <div className="min-h-0 min-w-0 flex-1 p-4">
                <div className="overflow-x-auto">
                    <div className="min-w-[720px]">
                        <div className="mb-1 grid grid-cols-7 gap-1">
                            {WEEKDAY_KEYS.map((key) => (
                                <div
                                    key={key}
                                    className="flex justify-center px-1 py-1"
                                >
                                    <Skeleton className="h-3 w-10 rounded-md" />
                                </div>
                            ))}
                        </div>
                        <div className="grid grid-cols-7 gap-1">
                            {DESKTOP_CELL_KEYS.map((key) => (
                                <Skeleton
                                    key={key}
                                    className="min-h-24 w-full rounded-lg"
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function DashboardCalendarSkeleton() {
    return (
        <div className="min-h-0 min-w-0 max-w-full space-y-2">
            <SectionTitleRow titleClassName="h-3 w-52 max-w-full" />
            <div className="min-h-0">
                <CardSectionShell>
                    <CardSectionHeader />
                    <div className="md:hidden">
                        <CalendarSummarySkeleton cols={1} />
                    </div>
                    <div className="hidden md:block">
                        <CalendarSummarySkeleton cols={3} />
                    </div>
                    <CalendarMobileSkeleton />
                    <CalendarDesktopSkeleton />
                </CardSectionShell>
            </div>
        </div>
    )
}

function DashboardCategoriesSkeleton() {
    return (
        <div className="min-w-0 max-w-full space-y-2">
            <SectionTitleRow titleClassName="h-3 w-48" cta="responsive" />
            <CardSectionShell>
                <CardSectionHeader />
                <div className="space-y-4 p-4">
                    <div className="relative mx-auto flex h-[240px] w-full max-w-[280px] items-center justify-center md:h-[320px] md:max-w-[360px]">
                        <Skeleton className="aspect-square w-[min(100%,260px)] rounded-full md:w-[min(100%,320px)]" />
                    </div>
                    <Skeleton className="h-3 w-40 max-w-full rounded-md" />
                    <ul className="m-0 list-none space-y-2 p-0" role="list">
                        {CATEGORY_LIST_KEYS.map((key) => (
                            <li key={key}>
                                <div className="rounded-lg border border-transparent px-2 py-2">
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex min-w-0 items-center gap-2">
                                            <Skeleton className="size-2 shrink-0 rounded-full" />
                                            <Skeleton className="h-3 w-[min(100%,10rem)] rounded-md" />
                                        </div>
                                        <div className="flex shrink-0 flex-col items-end gap-1">
                                            <Skeleton className="h-3 w-16 rounded-md" />
                                            <Skeleton className="h-2.5 w-12 rounded-md" />
                                        </div>
                                    </div>
                                    <Skeleton className="mt-1.5 h-1.5 w-full rounded-full" />
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </CardSectionShell>
        </div>
    )
}

function DashboardInvoicesSkeleton() {
    return (
        <div className="min-w-0 max-w-full space-y-2">
            <SectionTitleRow titleClassName="h-3 w-32" cta="responsive" />
            <CardSectionShell>
                <CardSectionHeader />
                <div className="shrink-0 border-b border-border bg-muted/10 px-3 py-2.5 dark:bg-muted/20">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-1.5">
                        <div className="flex min-w-0 flex-col gap-2 rounded-lg border border-border/60 bg-background/60 p-3 max-sm:shadow-xs sm:gap-1.5 sm:rounded-none sm:border-transparent sm:bg-transparent sm:p-0 sm:shadow-none">
                            <Skeleton className="h-3 w-32 rounded-md" />
                            <Skeleton className="h-8 w-44 max-w-full rounded-md" />
                        </div>
                        <div className="flex min-w-0 flex-col gap-2 rounded-lg border border-border/60 bg-background/60 p-3 max-sm:shadow-xs sm:gap-1.5 sm:rounded-none sm:border-transparent sm:bg-transparent sm:p-0 sm:shadow-none">
                            <Skeleton className="h-3 w-24 rounded-md" />
                            <Skeleton className="h-8 w-36 max-w-full rounded-md" />
                            <Skeleton className="h-3 w-32 rounded-md" />
                        </div>
                    </div>
                </div>
                <ul className="m-0 list-none p-0">
                    {INVOICE_KEYS.map((key) => (
                        <li
                            key={key}
                            className="border-b border-border last:border-b-0"
                        >
                            <div className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-start sm:gap-4">
                                <Skeleton className="aspect-[1.586] w-full min-w-0 shrink-0 rounded-2xl sm:w-[10.75rem] sm:max-w-[10.75rem]" />
                                <div className="min-w-0 flex-1 space-y-3">
                                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                        <Skeleton className="h-4 w-[min(100%,12rem)] rounded-md" />
                                        <Skeleton className="h-5 w-14 shrink-0 rounded-full" />
                                    </div>
                                    <Skeleton className="h-3 w-40 max-w-full rounded-md" />
                                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:items-stretch">
                                        <div className="space-y-2 rounded-lg border border-border/70 bg-muted/10 p-3 dark:bg-muted/5">
                                            <div className="flex flex-col gap-2 min-[480px]:flex-row min-[480px]:items-baseline min-[480px]:justify-between">
                                                <Skeleton className="h-3 w-24 rounded-md" />
                                                <Skeleton className="h-7 w-28 rounded-md min-[480px]:ml-auto" />
                                            </div>
                                            <div className="space-y-1 border-t border-border/50 pt-3">
                                                <Skeleton className="h-3 w-full max-w-[14rem] rounded-md" />
                                                <Skeleton className="h-3 w-full max-w-[12rem] rounded-md" />
                                            </div>
                                        </div>
                                        <div className="grid min-w-0 grid-cols-2 gap-2 sm:flex sm:flex-col sm:gap-2">
                                            <Skeleton className="h-[3.25rem] min-w-0 rounded-md" />
                                            <Skeleton className="h-[3.25rem] min-w-0 rounded-md" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            </CardSectionShell>
        </div>
    )
}

function DashboardInstallmentsSkeleton() {
    return (
        <div className="min-w-0 max-w-full space-y-2">
            <SectionTitleRow titleClassName="h-3 w-44" cta="responsive" />
            <CardSectionShell>
                <div className="divide-y divide-border">
                    {INSTALLMENT_KEYS.map((key) => (
                        <div key={key} className="space-y-2 px-4 py-3">
                            <div className="flex min-w-0 items-center gap-2">
                                <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
                                    <Skeleton className="h-5 w-24 shrink-0 rounded-md" />
                                    <Skeleton className="h-3 min-w-0 flex-1 rounded-md" />
                                </div>
                                <Skeleton className="h-4 w-28 shrink-0 rounded-md" />
                            </div>
                            <div className="flex min-w-0 items-center gap-2">
                                <Skeleton className="h-5 w-10 shrink-0 rounded-full" />
                                <Skeleton className="h-1.5 min-w-0 flex-1 rounded-full" />
                            </div>
                        </div>
                    ))}
                </div>
            </CardSectionShell>
        </div>
    )
}

function DashboardRecentTransactionsSkeleton() {
    return (
        <div className="min-w-0 max-w-full space-y-2">
            <SectionTitleRow titleClassName="h-3 w-40" cta="responsive" />
            <div className="md:hidden">
                <CardSectionShell>
                    <CardSectionHeader />
                    <div className="divide-y divide-border">
                        {RECENT_TX_KEYS.map((key) => (
                            <div
                                key={key}
                                className="flex min-h-[44px] items-center gap-3 px-4 py-3"
                            >
                                <div className="min-w-0 flex-1 space-y-1.5">
                                    <Skeleton className="h-4 w-[min(100%,14rem)] rounded-md" />
                                    <div className="flex items-center gap-1.5">
                                        <Skeleton className="h-4 w-4 shrink-0 rounded-full" />
                                        <Skeleton className="h-3 w-[min(100%,18rem)] rounded-md" />
                                    </div>
                                </div>
                                <div className="flex shrink-0 items-center gap-1">
                                    <Skeleton className="h-4 w-20 rounded-md" />
                                    <Skeleton className="size-4 shrink-0 rounded-sm" />
                                </div>
                            </div>
                        ))}
                    </div>
                    <div
                        className="shrink-0 border-t border-border bg-muted/15 px-4 py-4 dark:bg-muted/25"
                        aria-hidden
                    />
                </CardSectionShell>
            </div>
            <div className="hidden md:block">
                <CardSectionShell>
                    <div className="overflow-x-auto">
                        <Table className="min-w-[640px] text-sm md:min-w-[700px]">
                            <TableHeader className="bg-muted/50">
                                <TableRow className="border-0 hover:bg-transparent">
                                    <TableHead className="h-11 px-4 py-0">
                                        <Skeleton className="h-3 w-10 rounded-md" />
                                    </TableHead>
                                    <TableHead className="h-11 px-4 py-0">
                                        <Skeleton className="h-3 w-20 rounded-md" />
                                    </TableHead>
                                    <TableHead className="h-11 px-4 py-0">
                                        <Skeleton className="h-3 w-12 rounded-md" />
                                    </TableHead>
                                    <TableHead className="hidden h-11 px-4 py-0 md:table-cell">
                                        <Skeleton className="h-3 w-28 rounded-md" />
                                    </TableHead>
                                    <TableHead className="hidden h-11 px-4 py-0 md:table-cell">
                                        <Skeleton className="h-3 w-16 rounded-md" />
                                    </TableHead>
                                    <TableHead className="h-11 px-4 py-0">
                                        <Skeleton className="h-3 w-10 rounded-md" />
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {RECENT_TX_TABLE_ROW_KEYS.map((key) => (
                                    <TableRow key={key} className="border-border/80">
                                        <TableCell className="px-4 py-3">
                                            <Skeleton className="h-4 w-14 rounded-md" />
                                        </TableCell>
                                        <TableCell className="px-4 py-3">
                                            <Skeleton className="h-4 w-[min(100%,10rem)] max-w-full rounded-md" />
                                        </TableCell>
                                        <TableCell className="px-4 py-3">
                                            <Skeleton className="h-4 w-20 rounded-md" />
                                        </TableCell>
                                        <TableCell className="hidden px-4 py-3 md:table-cell">
                                            <Skeleton className="h-4 w-24 max-w-full rounded-md" />
                                        </TableCell>
                                        <TableCell className="hidden px-4 py-3 md:table-cell">
                                            <Skeleton className="h-4 w-20 max-w-full rounded-md" />
                                        </TableCell>
                                        <TableCell className="px-4 py-3">
                                            <Skeleton className="h-5 w-16 rounded-full" />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardSectionShell>
            </div>
        </div>
    )
}

export function DashboardPageSkeleton() {
    return (
        <div
            className="min-w-0 max-w-full space-y-5"
            role="status"
            aria-busy="true"
            aria-live="polite"
        >
            <span className="sr-only">Carregando o dashboard…</span>

            <DashboardToolbarSkeleton />
            <DashboardKpiSkeleton />
            <DashboardCalendarSkeleton />

            <div className="min-w-0">
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:items-start lg:gap-x-4 xl:gap-x-6">
                    <DashboardCategoriesSkeleton />
                    <div className="min-w-0 space-y-5">
                        <DashboardInvoicesSkeleton />
                        <DashboardInstallmentsSkeleton />
                    </div>
                </div>
            </div>

            <DashboardRecentTransactionsSkeleton />
        </div>
    )
}
