import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

const CATEGORY_ROW_KEYS = ["cat-1", "cat-2", "cat-3"] as const
const INSTALLMENT_KEYS = ["plan-1", "plan-2", "plan-3"] as const
const RECENT_TX_KEYS = ["tx-1", "tx-2", "tx-3", "tx-4"] as const
const RECENT_TX_TABLE_ROW_KEYS = [
    "trow-1",
    "trow-2",
    "trow-3",
    "trow-4",
    "trow-5",
    "trow-6",
    "trow-7",
] as const

function CardSectionShell({ children }: { children: React.ReactNode }) {
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
            <Skeleton className="h-5 w-36 max-w-[min(100%,12rem)] rounded-md" />
        </div>
    )
}

function SectionTitleRow({
    titleClassName = "h-3 w-44 max-w-full",
    cta = "none",
}: {
    titleClassName?: string
    cta?: "none" | "responsive" | "cycle"
}) {
    if (cta === "responsive") {
        return (
            <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex h-8 min-w-0 items-end">
                    <Skeleton className={titleClassName} />
                </div>
                <Skeleton className="h-10 w-full rounded-md sm:h-8 sm:w-40" />
            </div>
        )
    }
    if (cta === "cycle") {
        return (
            <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex h-8 min-w-0 items-end">
                    <Skeleton className={titleClassName} />
                </div>
                <div className="flex shrink-0 items-center justify-center gap-1 sm:justify-end">
                    <Skeleton className="size-8 shrink-0 rounded-md" />
                    <Skeleton className="h-8 w-[min(100%,9rem)] rounded-md" />
                    <Skeleton className="size-8 shrink-0 rounded-md" />
                </div>
            </div>
        )
    }
    return (
        <div className="flex h-8 min-w-0 items-end">
            <Skeleton className={titleClassName} />
        </div>
    )
}

function CategorySpendSectionSkeleton() {
    return (
        <section className="space-y-3 text-sm" aria-hidden>
            <Skeleton className="h-3 w-40 max-w-full rounded-sm" />
            <div className="relative mx-auto flex h-[200px] w-full max-w-[260px] min-w-0 items-center justify-center sm:h-[220px] sm:max-w-[300px] md:h-[240px]">
                <Skeleton className="size-[min(72vw,11rem)] shrink-0 rounded-full md:size-[13rem]" />
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="size-[min(42vw,6.5rem)] rounded-full bg-background md:size-[6.5rem]" />
                </div>
            </div>
            <ul className="space-y-2">
                {CATEGORY_ROW_KEYS.map((key) => (
                    <li
                        key={key}
                        className="rounded-lg border border-border/50 bg-muted/15 px-3 py-2.5 dark:bg-muted/10"
                    >
                        <div className="flex min-w-0 items-center gap-2">
                            <Skeleton className="size-8 shrink-0 rounded-md sm:size-9" />
                            <div className="min-w-0 flex-1 space-y-1">
                                <Skeleton className="h-4 w-[min(100%,10rem)] max-w-full" />
                                <Skeleton className="h-3 w-24 max-w-full" />
                            </div>
                            <div className="flex shrink-0 items-center gap-1.5">
                                <Skeleton className="h-3.5 w-8 rounded-sm" />
                                <Skeleton className="h-4 w-16 tabular-nums" />
                                <Skeleton className="size-4 shrink-0 rounded-sm" />
                            </div>
                        </div>
                    </li>
                ))}
            </ul>
        </section>
    )
}

function InvoicePanelSkeleton() {
    return (
        <div className="min-w-0 max-w-full space-y-2">
            <SectionTitleRow titleClassName="h-3 w-14 rounded-sm" cta="cycle" />

            <Card className="gap-0 overflow-hidden border-border/80 py-0 shadow-sm">
                <div className="flex min-h-10 shrink-0 items-center border-b border-border bg-muted/30 px-4 py-2.5">
                    <Skeleton className="h-5 w-36 max-w-[min(100%,12rem)]" />
                </div>
                <CardContent className="space-y-5 pt-4 pb-5">
                    <div className="space-y-2">
                        <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1.5">
                            <div className="min-w-0 flex-1 space-y-1">
                                <Skeleton className="h-3 w-12" />
                                <Skeleton className="h-9 w-[min(100%,11rem)] max-w-full tabular-nums md:h-10 md:w-44" />
                            </div>
                            <Skeleton className="h-6 w-[4.5rem] shrink-0 rounded-full" />
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                            <Skeleton className="h-3 w-28 max-w-full" />
                            <Skeleton className="h-3 w-24 max-w-full" />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                            <Skeleton className="h-3 w-40 max-w-full" />
                            <Skeleton className="h-4 w-10 tabular-nums" />
                        </div>
                        <Skeleton className="h-2 w-full rounded-full" />
                    </div>
                </CardContent>

                <div
                    role="separator"
                    aria-orientation="horizontal"
                    className="shrink-0 border-t border-border"
                    aria-hidden
                />

                <CardContent className="space-y-5 pb-4 pt-5">
                    <CategorySpendSectionSkeleton />

                    <div className="rounded-md border border-border/50 bg-muted/20 px-2.5 py-2 dark:bg-muted/10">
                        <div className="flex items-start gap-2">
                            <Skeleton className="size-7 shrink-0 rounded-full" />
                            <div className="min-w-0 flex-1 space-y-2 pt-0.5">
                                <Skeleton className="h-3 w-full max-w-lg" />
                                <Skeleton className="h-3 w-full max-w-md" />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

function MorePeriodSummarySkeleton() {
    return (
        <div
            className="rounded-xl border border-border/70 bg-card text-card-foreground shadow-sm"
            aria-hidden
        >
            <div className="flex items-center justify-between gap-2 px-4 py-3">
                <Skeleton className="h-4 w-[min(100%,14rem)] max-w-full" />
                <Skeleton className="size-4 shrink-0 rounded-sm" />
            </div>
        </div>
    )
}

function InstallmentsBlockSkeleton() {
    return (
        <div className="min-w-0 max-w-full space-y-2">
            <SectionTitleRow titleClassName="h-3 w-44 rounded-sm" />
            <CardSectionShell>
                <CardSectionHeader />
                <div className="space-y-3 px-4 py-4 md:px-5 md:py-5">
                    <div className="space-y-1">
                        <Skeleton className="h-3 w-48" />
                        <Skeleton className="h-8 w-40 tabular-nums md:h-9" />
                    </div>
                    <ul className="space-y-3">
                        {INSTALLMENT_KEYS.map((key) => (
                            <li
                                key={key}
                                className="overflow-hidden rounded-lg border border-border/60 bg-muted/15 dark:bg-muted/10"
                            >
                                <div className="border-b border-border/50 bg-muted/25 px-3 py-2.5 dark:bg-muted/15">
                                    <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
                                        <div className="min-w-0 flex-1 space-y-1">
                                            <Skeleton className="h-4 w-[min(100%,14rem)] max-w-full" />
                                            <Skeleton className="h-3 w-32 max-w-full" />
                                        </div>
                                        <Skeleton className="h-4 w-[4.75rem] shrink-0 tabular-nums" />
                                    </div>
                                </div>
                                <div className="space-y-2 px-3 py-3">
                                    <Skeleton className="h-1.5 w-full rounded-full" />
                                    <div className="flex items-center justify-between gap-3">
                                        <Skeleton className="h-3 w-32 max-w-[55%]" />
                                        <Skeleton className="h-3 w-28 shrink-0" />
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </CardSectionShell>
        </div>
    )
}

function RecentTransactionsSkeleton() {
    return (
        <div className="min-w-0 max-w-full space-y-2">
            <SectionTitleRow titleClassName="h-3 w-36 rounded-sm" cta="responsive" />
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

export function CreditCardDetailSkeleton() {
    return (
        <div
            className="w-full min-w-0 space-y-6"
            role="status"
            aria-busy="true"
            aria-live="polite"
            aria-label="Carregando detalhes do cartão"
        >
            <span className="sr-only">Carregando detalhes do cartão…</span>

            <div className="flex flex-col items-center gap-3">
                <div className="mx-auto w-full max-w-sm">
                    <Skeleton className="aspect-[1.586] w-full rounded-2xl" />
                </div>
                <Skeleton className="h-8 w-[min(100%,16rem)] rounded-md" />
            </div>

            <Card className="gap-0 overflow-hidden py-0">
                <CardHeader className="pb-3 pt-4">
                    <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                            <Skeleton className="h-4 w-[min(100%,12rem)] max-w-full" />
                        </div>
                        <div className="flex shrink-0 items-center gap-1.5 pl-1">
                            <Skeleton className="h-5 w-14 shrink-0 rounded-full" />
                            <Skeleton className="size-8 shrink-0 rounded-md" />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="border-t border-border/50 px-4 py-3">
                    <Skeleton className="h-8 w-full rounded-md" />
                </CardContent>
            </Card>

            <div className="space-y-6">
                <InvoicePanelSkeleton />
                <MorePeriodSummarySkeleton />
                <InstallmentsBlockSkeleton />
                <RecentTransactionsSkeleton />
            </div>
        </div>
    )
}
