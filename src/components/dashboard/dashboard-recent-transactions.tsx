"use client"

import { useMemo } from "react"
import Link from "next/link"
import { ChevronRightIcon, ArrowTopRightOnSquareIcon, ReceiptPercentIcon } from "@heroicons/react/24/outline"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { Transaction } from "@/lib/supabase"
import type { WorkspaceMemberDirectoryEntry } from "@/components/dashboard/use-dashboard-data"
import { transactionParceladaRowChip } from "@/lib/tag-chip-classes"
import { formatTransactionDayPtBr } from "@/lib/transaction-date"
import { cn, getInitials } from "@/lib/utils"
import { getAvatarColor } from "@/lib/avatar"
import { ROUTES } from "@/config/navigation"
import { labelYearMonthPt } from "@/lib/budget-month"
import { signedCurrencyBRL } from "@/lib/formatters"
import { MoneyDisplay } from "@/components/ui/money-display"
import { TransactionsTable } from "@/components/transactions/transactions-table"

const EMPTY_INVOICE_PAID_KEYS: ReadonlySet<string> = new Set()

export type RecentTransactionsTruncationFooter = {
    displayedCount: number
    totalCount: number
    message: string
    href: string
    linkLabel: string
}

function transactionAuthorLabel(
    txUserId: string,
    currentUserId: string | null | undefined,
    dir: Record<string, WorkspaceMemberDirectoryEntry>,
): string {
    if (currentUserId && txUserId === currentUserId) return "Você"
    const e = dir[txUserId]
    const fn = e?.full_name?.trim()
    if (fn) return fn
    const email = e?.email?.trim()
    if (email) {
        const local = email.split("@")[0]
        if (local) return local
    }
    return "Membro"
}

function initialsSource(
    txUserId: string,
    currentUserId: string | null | undefined,
    dir: Record<string, WorkspaceMemberDirectoryEntry>,
): string {
    const e = dir[txUserId]
    const fn = e?.full_name?.trim()
    if (fn) return fn
    const email = e?.email?.trim()
    if (email) return email
    if (currentUserId === txUserId) return "Eu"
    return "?"
}

export function DashboardRecentTransactions({
    transactions,
    memberDirectoryByUserId,
    currentUserId,
    calendarYm,
    onTransactionClick,
    invoicePaidByCardClose = EMPTY_INVOICE_PAID_KEYS,
    sectionTitle = "Transações recentes",
    viewAllHref = ROUTES.TRANSACTIONS,
    viewAllLabel = "Ver em transações",
    emptyMessage = "Nenhuma transação no período",
    truncationFooter,
}: {
    transactions: Transaction[]
    memberDirectoryByUserId: Record<string, WorkspaceMemberDirectoryEntry>
    currentUserId?: string | null
    calendarYm: string
    onTransactionClick?: (transaction: Transaction) => void
    invoicePaidByCardClose?: ReadonlySet<string>
    sectionTitle?: string
    viewAllHref?: string
    viewAllLabel?: string
    emptyMessage?: string
    truncationFooter?: RecentTransactionsTruncationFooter
}) {
    const monthTitle = useMemo(() => labelYearMonthPt(calendarYm), [calendarYm])
    return (
        <div className="min-w-0 max-w-full space-y-2">
            <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex h-8 min-w-0 items-end">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                        {sectionTitle}
                    </p>
                </div>
                <Button
                    asChild
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-10 w-full gap-2 px-2 text-xs md:h-8 md:w-auto"
                >
                    <Link href={viewAllHref}>
                        <ArrowTopRightOnSquareIcon className="size-3.5 shrink-0 md:size-4" />
                        <span className="truncate">{viewAllLabel}</span>
                    </Link>
                </Button>
            </div>

            {transactions.length === 0 ? (
                <Card className="gap-0 overflow-hidden border border-border py-0 shadow-none ring-0">
                    <CardContent className="flex flex-col gap-0 p-0">
                        <div
                            className="flex min-h-10 shrink-0 items-center border-b border-border bg-muted/30 px-4 py-2.5"
                            aria-live="polite"
                        >
                            <p className="text-sm font-semibold capitalize leading-snug text-foreground">
                                {monthTitle}
                            </p>
                        </div>
                        <div className="flex flex-col items-center justify-center gap-2 px-4 py-10 text-center">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/60">
                                <ReceiptPercentIcon className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <p className="text-sm text-muted-foreground">
                                {emptyMessage}
                            </p>
                        </div>
                        <div
                            className="shrink-0 border-t border-border bg-muted/15 px-4 py-4 dark:bg-muted/25"
                            aria-hidden
                        />
                    </CardContent>
                </Card>
            ) : (
                <>
                    <div className="md:hidden">
                        <Card className="gap-0 overflow-hidden border border-border py-0 shadow-none ring-0">
                            <CardContent className="flex flex-col gap-0 p-0">
                                <div
                                    className="flex min-h-10 shrink-0 items-center border-b border-border bg-muted/30 px-4 py-2.5"
                                    aria-live="polite"
                                >
                                    <p className="text-sm font-semibold capitalize leading-snug text-foreground">
                                        {monthTitle}
                                    </p>
                                </div>
                                <ul className="divide-y divide-border" role="list">
                                    {transactions.map((transaction) => {
                                const primary =
                                    transaction.description ||
                                    transaction.category?.name ||
                                    "Sem descrição"
                                const catName = transaction.category?.name
                                const day = formatTransactionDayPtBr(transaction.date)
                                const author = transactionAuthorLabel(
                                    transaction.user_id,
                                    currentUserId,
                                    memberDirectoryByUserId,
                                )
                                const metaParts = [
                                    ...(catName ? [catName] : []),
                                    day,
                                ]
                                const entry =
                                    memberDirectoryByUserId[transaction.user_id]
                                const avatarUrl = entry?.avatar_url?.trim() || null
                                const avatarColor =
                                    entry?.avatar_color?.trim() ||
                                    getAvatarColor(
                                        initialsSource(
                                            transaction.user_id,
                                            currentUserId,
                                            memberDirectoryByUserId,
                                        ),
                                    )
                                const initials = getInitials(
                                    initialsSource(
                                        transaction.user_id,
                                        currentUserId,
                                        memberDirectoryByUserId,
                                    ),
                                )
                                const amountAbs = Number(transaction.amount)
                                const signedAmount =
                                    transaction.type === "income"
                                        ? amountAbs
                                        : -amountAbs
                                const rowAriaLabel = [
                                    `Transação: ${primary}`,
                                    transaction.installment_plan_id
                                        ? "Parcelada"
                                        : null,
                                    metaParts.join(" · "),
                                    `Valor: ${signedCurrencyBRL(signedAmount)}`,
                                ]
                                    .filter(Boolean)
                                    .join(". ")

                                return (
                                    <li key={transaction.id}>
                                        <button
                                            type="button"
                                            aria-label={rowAriaLabel}
                                            className={cn(
                                                "flex w-full min-h-[44px] items-center gap-3 px-4 py-3 text-left transition-colors",
                                                "hover:bg-muted/30 active:bg-muted/45",
                                                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                                                "md:min-h-0",
                                            )}
                                            onClick={() =>
                                                onTransactionClick?.(transaction)
                                            }
                                        >
                                            <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
                                                <div className="flex min-w-0 items-center overflow-hidden">
                                                    <span className="inline-flex max-w-full min-w-0 items-center gap-1.5">
                                                        <span className="min-w-0 truncate text-sm font-medium leading-snug">
                                                            {primary}
                                                        </span>
                                                        {transaction.installment_plan_id ? (
                                                            <span
                                                                className={cn(
                                                                    transactionParceladaRowChip,
                                                                    "shrink-0",
                                                                )}
                                                                title="Compra parcelada"
                                                            >
                                                                Parcelada
                                                            </span>
                                                        ) : null}
                                                    </span>
                                                </div>
                                                <div
                                                    className="flex h-4 min-h-4 min-w-0 items-center gap-1.5"
                                                    aria-label={metaParts.join(
                                                        " · ",
                                                    )}
                                                >
                                                    <div
                                                        className={cn(
                                                            "relative size-4 shrink-0 overflow-hidden rounded-full bg-muted",
                                                            "ring-1 ring-border/40 ring-offset-0 ring-offset-background",
                                                        )}
                                                    >
                                                        {avatarUrl ? (
                                                            <img
                                                                src={avatarUrl}
                                                                alt={author}
                                                                className="size-full object-cover"
                                                            />
                                                        ) : (
                                                            <div
                                                                className={cn(
                                                                    "flex size-full items-center justify-center text-[8px] font-semibold text-white",
                                                                    avatarColor,
                                                                )}
                                                            >
                                                                {initials}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <p className="min-w-0 flex-1 truncate leading-none text-[11px] text-muted-foreground">
                                                        {catName ? (
                                                            <>
                                                                <span>
                                                                    {catName}
                                                                </span>
                                                                <span
                                                                    className="px-0.5 text-muted-foreground/40"
                                                                    aria-hidden
                                                                >
                                                                    {" · "}
                                                                </span>
                                                            </>
                                                        ) : null}
                                                        <span className="tabular-nums text-muted-foreground/90">
                                                            {day}
                                                        </span>
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex shrink-0 items-center gap-1">
                                                <MoneyDisplay
                                                    value={signedAmount}
                                                    signed
                                                    tone={
                                                        transaction.type ===
                                                        "income"
                                                            ? "income"
                                                            : "expense"
                                                    }
                                                    size="lg"
                                                    className="shrink-0 font-semibold"
                                                />
                                                <ChevronRightIcon
                                                    className="size-4 shrink-0 text-muted-foreground/70"
                                                    aria-hidden
                                                />
                                            </div>
                                        </button>
                                    </li>
                                )
                            })}
                        </ul>
                                <div
                                    className="shrink-0 border-t border-border bg-muted/15 px-4 py-4 dark:bg-muted/25"
                                    aria-hidden
                                />
                            </CardContent>
                        </Card>
                    </div>

                    <div className="hidden md:block">
                        <Card className="gap-0 overflow-hidden border border-border py-0 shadow-none ring-0">
                            <CardContent className="relative flex flex-col p-0">
                                <TransactionsTable
                                    transactions={transactions}
                                    sortKey="date"
                                    sortDir="desc"
                                    openTransactionDetail={(tx) =>
                                        onTransactionClick?.(tx)
                                    }
                                    enableSelection={false}
                                    enableSort={false}
                                    enableActions={false}
                                    showPaginationFooter={false}
                                    showMobileScrollHint={false}
                                    invoicePaidByCardClose={
                                        invoicePaidByCardClose
                                    }
                                />
                            </CardContent>
                        </Card>
                    </div>
                </>
            )}

            {truncationFooter ? (
                <div className="space-y-2 rounded-lg border border-border/60 bg-card px-4 py-3 shadow-sm">
                    <p className="text-xs text-muted-foreground">
                        {truncationFooter.message}
                    </p>
                    <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0 text-xs font-medium"
                        asChild
                    >
                        <Link href={truncationFooter.href}>
                            {truncationFooter.linkLabel}
                        </Link>
                    </Button>
                </div>
            ) : null}
        </div>
    )
}
