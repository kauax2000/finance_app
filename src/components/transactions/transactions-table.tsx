"use client"

import * as React from "react"
import Link from "next/link"
import { PencilIcon, TrashIcon, ChevronLeftIcon, ChevronRightIcon, ArrowPathRoundedSquareIcon } from "@heroicons/react/24/outline"
import type { Transaction } from "@/lib/supabase"
import {
    formatTransactionDayPtBr,
    formatTransactionMonthYearPtBr,
    monthYearKeyFromTransactionDate,
    parseYmdLocal,
} from "@/lib/transaction-date"
import { cn } from "@/lib/utils"
import { ROUTES } from "@/config/navigation"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { MoneyDisplay } from "@/components/ui/money-display"
import {
    tagChipDanger,
    tagChipInfo,
    tagChipSuccess,
    tagChipWarning,
    transactionExpenseTypeRowChip,
    transactionIncomeTypeRowChip,
    transactionParceladaRowChip,
    transactionRowChipShell,
} from "@/lib/tag-chip-classes"
import { paymentMethodLabel } from "@/lib/payment-methods"
import {
    classifyTransactionInvoiceSlot,
    isEstimatedDuePastForClose,
    statementCloseYmdForPurchaseDate,
    type CreditCardInvoiceSlot,
} from "@/lib/credit-card-billing"
import type { SortDir, TransactionsListSortKey } from "@/components/transactions/transactions-list-types"
import { isProjectedTransactionRow } from "@/lib/category-expense-month-rows"

export type TransactionsTableSortKey = TransactionsListSortKey

const EMPTY_INVOICE_PAID_KEYS: ReadonlySet<string> = new Set()

function SortIndicator({ active, dir }: { active: boolean; dir: SortDir }) {
    if (!active) return null
    return (
        <span className="ml-1 inline-flex text-[10px] leading-none text-muted-foreground">
            {dir === "asc" ? "▲" : "▼"}
        </span>
    )
}

function formatPaymentCell(t: Transaction): string {
    if (t.type !== "expense" || !t.payment_method) return "—"
    let s = paymentMethodLabel(t.payment_method)
    if (t.payment_method === "credit_card" && t.payment_card) {
        s += ` · ${t.payment_card.name}`
    }
    return s
}

function creditCardInvoiceBadgeForRow(
    t: Transaction,
    invoicePaidByCardClose: ReadonlySet<string>
): {
    slot: CreditCardInvoiceSlot
    label: string
    chipClass: string
    title: string
} | null {
    if (
        t.type !== "expense" ||
        t.payment_method !== "credit_card" ||
        !t.payment_card
    ) {
        return null
    }
    const card = t.payment_card
    const slot = classifyTransactionInvoiceSlot(t.date, card.closing_day)
    if (!slot) return null

    const cardId = t.payment_credit_card_id ?? card.id
    const closeYmd = statementCloseYmdForPurchaseDate(t.date, card.closing_day)
    const payKey = closeYmd != null ? `${cardId}:${closeYmd}` : null
    const invoicePaid = payKey != null && invoicePaidByCardClose.has(payKey)

    if (slot === "open") {
        return {
            slot,
            label: "Aberta",
            chipClass: tagChipSuccess,
            title: "Fatura aberta",
        }
    }

    if (slot === "last_closed") {
        if (invoicePaid) {
            return {
                slot,
                label: "Paga",
                chipClass: tagChipSuccess,
                title: "Fatura fechada — marcada como paga",
            }
        }
        let title = "Fatura fechada — ainda não marcada como paga"
        if (
            closeYmd != null &&
            card.due_day >= 1 &&
            card.due_day <= 31
        ) {
            const closeDate = parseYmdLocal(closeYmd)
            if (
                closeDate &&
                isEstimatedDuePastForClose(closeDate, card.due_day)
            ) {
                title += " — vencimento estimado já passou"
            }
        }
        return {
            slot,
            label: "Fechada",
            chipClass: tagChipWarning,
            title,
        }
    }

    if (invoicePaid) {
        return {
            slot,
            label: "Paga",
            chipClass: tagChipSuccess,
            title: "Fatura anterior — marcada como paga",
        }
    }
    return {
        slot,
        label: "Anterior",
        chipClass: tagChipDanger,
        title: "Fatura anterior — ainda não marcada como paga",
    }
}

export type TransactionsTableProps = {
    transactions: Transaction[]
    /** Required when `enableSelection` is not `false`. */
    selectedIds?: Set<string>
    setSelectedIds?: React.Dispatch<React.SetStateAction<Set<string>>>

    sortKey: TransactionsTableSortKey
    sortDir: SortDir
    /** Required when `enableSort` is not `false`. */
    onToggleSort?: (key: TransactionsTableSortKey) => void

    openTransactionDetail: (t: Transaction, options?: { edit?: boolean }) => void

    /** Required when `enableActions` is not `false`. */
    onDeleteSingle?: (t: Transaction) => void
    /** Required when `enableSelection` is not `false`. */
    onDeleteBulk?: (ids: string[]) => void

    /** Required when `showPaginationFooter` is not `false`. */
    page?: number
    setPage?: React.Dispatch<React.SetStateAction<number>>
    pageSize?: number
    totalCount?: number | null

    /** Keys `${credit_card_id}:${statement_close_date}` for paid invoices (workspace). */
    invoicePaidByCardClose?: ReadonlySet<string>

    /** @default true */
    enableSelection?: boolean
    /** @default true */
    enableSort?: boolean
    /** @default true */
    enableActions?: boolean
    /** @default true */
    showPaginationFooter?: boolean
    /** @default true */
    showMobileScrollHint?: boolean
}

const EMPTY_SELECTED_IDS = new Set<string>()

const noopSetSelectedIds: React.Dispatch<
    React.SetStateAction<Set<string>>
> = () => {}

const noopSetPage: React.Dispatch<React.SetStateAction<number>> = () => {}

export function TransactionsTable({
    transactions,
    selectedIds: selectedIdsProp,
    setSelectedIds: setSelectedIdsProp,
    sortKey,
    sortDir,
    onToggleSort,
    openTransactionDetail,
    onDeleteSingle,
    onDeleteBulk,
    page: pageProp,
    setPage: setPageProp,
    pageSize: pageSizeProp,
    totalCount: totalCountProp,
    invoicePaidByCardClose = EMPTY_INVOICE_PAID_KEYS,
    enableSelection = true,
    enableSort = true,
    enableActions = true,
    showPaginationFooter = true,
    showMobileScrollHint = true,
}: TransactionsTableProps) {
    const selectedIds = selectedIdsProp ?? EMPTY_SELECTED_IDS
    const setSelectedIds = setSelectedIdsProp ?? noopSetSelectedIds
    const page = pageProp ?? 0
    const setPage = setPageProp ?? noopSetPage
    const pageSize = pageSizeProp ?? Math.max(transactions.length, 1)
    const totalCount = totalCountProp ?? null

    const tableColCount =
        6 + (enableSelection ? 1 : 0) + (enableActions ? 1 : 0)
    const monthHeaderDataColSpan = tableColCount - (enableSelection ? 1 : 0)

    const pageTransactionIds = React.useMemo(
        () => transactions.map((t) => t.id),
        [transactions]
    )

    const allPageSelected =
        enableSelection &&
        pageTransactionIds.length > 0 &&
        pageTransactionIds.every((id) => selectedIds.has(id))
    const somePageSelected =
        enableSelection &&
        pageTransactionIds.some((id) => selectedIds.has(id)) &&
        !allPageSelected

    const transactionIdsByMonthKey = React.useMemo(() => {
        const map = new Map<string, string[]>()
        for (const t of transactions) {
            const k = monthYearKeyFromTransactionDate(t.date)
            if (!k) continue
            const list = map.get(k)
            if (list) list.push(t.id)
            else map.set(k, [t.id])
        }
        return map
    }, [transactions])

    const total = totalCount ?? transactions.length
    const totalPages = Math.max(1, Math.ceil(total / pageSize))
    const showFrom = total === 0 ? 0 : page * pageSize + 1
    const showTo = Math.min(total, (page + 1) * pageSize)

    return (
        <>
            {enableSelection && selectedIds.size > 0 ? (
                <div className="border-b border-border bg-muted/40">
                    <div
                        className="flex flex-col gap-3 px-3 py-3 sm:hidden"
                        role="toolbar"
                        aria-label="Ações da seleção"
                    >
                        <div className="flex items-start justify-between gap-3">
                            <p className="min-w-0 pt-0.5 text-sm font-medium leading-snug text-foreground">
                                {selectedIds.size === 1
                                    ? "1 selecionada"
                                    : `${selectedIds.size.toLocaleString("pt-BR")} selecionadas`}
                            </p>
                            <Button
                                type="button"
                                variant="ghost"
                                size="lg"
                                className="shrink-0 px-3 text-xs text-muted-foreground hover:text-foreground"
                                onClick={() => setSelectedIds(new Set())}
                                aria-label="Limpar seleção"
                            >
                                Limpar
                            </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-11 w-full gap-2 text-xs font-medium"
                                disabled={selectedIds.size !== 1}
                                onClick={() => {
                                    const id = [...selectedIds][0]
                                    const t = transactions.find((x) => x.id === id)
                                    if (t) openTransactionDetail(t, { edit: true })
                                }}
                            >
                                <PencilIcon className="size-3.5 shrink-0" />
                                Editar
                            </Button>
                            <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                className="h-11 w-full gap-2 text-xs font-medium"
                                onClick={() => onDeleteBulk?.([...selectedIds])}
                            >
                                <TrashIcon className="size-3.5 shrink-0" />
                                Excluir
                            </Button>
                        </div>
                        {selectedIds.size !== 1 ? (
                            <p className="-mt-1 text-center text-[11px] leading-tight text-muted-foreground">
                                Editar uma transação por vez
                            </p>
                        ) : null}
                    </div>

                    <div
                        className="hidden px-4 py-2 sm:flex sm:flex-row sm:flex-wrap sm:items-center sm:justify-end sm:gap-2"
                        role="toolbar"
                        aria-label="Ações da seleção"
                    >
                        <span className="mr-auto text-xs tabular-nums text-muted-foreground">
                            {selectedIds.size === 1
                                ? "1 selecionada"
                                : `${selectedIds.size.toLocaleString("pt-BR")} selecionadas`}
                        </span>
                        <div className="flex flex-wrap items-center justify-end gap-2">
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8 text-xs"
                                onClick={() => setSelectedIds(new Set())}
                            >
                                Limpar seleção
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-8 gap-1.5 text-xs"
                                disabled={selectedIds.size !== 1}
                                onClick={() => {
                                    const id = [...selectedIds][0]
                                    const t = transactions.find((x) => x.id === id)
                                    if (t) openTransactionDetail(t, { edit: true })
                                }}
                            >
                                <PencilIcon className="size-3.5 shrink-0" />
                                Editar
                            </Button>
                            <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                className="h-8 gap-1.5 text-xs"
                                onClick={() => onDeleteBulk?.([...selectedIds])}
                            >
                                <TrashIcon className="size-3.5 shrink-0" />
                                Excluir
                            </Button>
                        </div>
                    </div>
                </div>
            ) : null}

            <div
                className={cn(
                    "min-w-0",
                    (!enableSelection || selectedIds.size === 0) &&
                        "rounded-t-xl",
                    !showPaginationFooter && "rounded-b-xl"
                )}
            >
                {showMobileScrollHint ? (
                    <div className="border-b border-border/60 bg-muted/30 px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground sm:hidden">
                        Arraste para ver mais →
                    </div>
                ) : null}
                <Table className="min-w-[640px] text-sm md:min-w-[700px]">
                    <TableHeader className="sticky top-0 z-10 bg-muted/50 [&_tr]:border-b-0">
                        <TableRow className="border-0 hover:bg-transparent [&>th]:border-b [&>th]:border-border">
                            {enableSelection ? (
                                <TableHead className="w-10 px-2 py-0 md:w-11 md:px-3">
                                    <Checkbox
                                        aria-label="Selecionar todas nesta página"
                                        checked={
                                            allPageSelected
                                                ? true
                                                : somePageSelected
                                                  ? "indeterminate"
                                                  : false
                                        }
                                        onCheckedChange={(v) => {
                                            if (v === true) {
                                                setSelectedIds(
                                                    new Set(pageTransactionIds)
                                                )
                                            } else {
                                                setSelectedIds(new Set())
                                            }
                                        }}
                                    />
                                </TableHead>
                            ) : null}
                            <TableHead
                                className="h-11 w-[4.75rem] px-4 py-0 align-middle md:w-[5.5rem]"
                                aria-sort={
                                    sortKey === "date"
                                        ? sortDir === "asc"
                                            ? "ascending"
                                            : "descending"
                                        : "none"
                                }
                            >
                                {enableSort ? (
                                    <button
                                        type="button"
                                        className={cn(
                                            "-mx-1 inline-flex items-center rounded-md px-1 py-1 text-xs font-semibold tracking-wide outline-none transition-colors hover:bg-muted/80 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                                            sortKey === "date"
                                                ? "text-foreground"
                                                : "text-muted-foreground hover:text-foreground"
                                        )}
                                        onClick={() => onToggleSort?.("date")}
                                    >
                                        Data
                                        <SortIndicator
                                            active={sortKey === "date"}
                                            dir={sortDir}
                                        />
                                    </button>
                                ) : (
                                    <span
                                        className={cn(
                                            "inline-flex items-center text-xs font-semibold tracking-wide",
                                            sortKey === "date"
                                                ? "text-foreground"
                                                : "text-muted-foreground"
                                        )}
                                    >
                                        Data
                                        <SortIndicator
                                            active={sortKey === "date"}
                                            dir={sortDir}
                                        />
                                    </span>
                                )}
                            </TableHead>
                            <TableHead className="h-11 px-4 py-0 text-xs font-semibold tracking-wide text-muted-foreground">
                                Descrição
                            </TableHead>
                            <TableHead
                                className="h-11 px-4 py-0 align-middle"
                                aria-sort={
                                    sortKey === "amount"
                                        ? sortDir === "asc"
                                            ? "ascending"
                                            : "descending"
                                        : "none"
                                }
                            >
                                {enableSort ? (
                                    <button
                                        type="button"
                                        className={cn(
                                            "-mx-1 inline-flex items-center rounded-md px-1 py-1 text-xs font-semibold tracking-wide outline-none transition-colors hover:bg-muted/80 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                                            sortKey === "amount"
                                                ? "text-foreground"
                                                : "text-muted-foreground hover:text-foreground"
                                        )}
                                        onClick={() => onToggleSort?.("amount")}
                                    >
                                        Valor
                                        <SortIndicator
                                            active={sortKey === "amount"}
                                            dir={sortDir}
                                        />
                                    </button>
                                ) : (
                                    <span
                                        className={cn(
                                            "inline-flex items-center text-xs font-semibold tracking-wide",
                                            sortKey === "amount"
                                                ? "text-foreground"
                                                : "text-muted-foreground"
                                        )}
                                    >
                                        Valor
                                        <SortIndicator
                                            active={sortKey === "amount"}
                                            dir={sortDir}
                                        />
                                    </span>
                                )}
                            </TableHead>
                            <TableHead className="hidden h-11 max-w-[10rem] px-4 py-0 text-xs font-semibold tracking-wide text-muted-foreground md:table-cell">
                                Forma de pagamento
                            </TableHead>
                            <TableHead className="hidden h-11 px-4 py-0 text-xs font-semibold tracking-wide text-muted-foreground md:table-cell">
                                Categoria
                            </TableHead>
                            <TableHead className="h-11 min-w-[5.5rem] px-4 py-0 text-xs font-semibold tracking-wide text-muted-foreground">
                                Tipo
                            </TableHead>
                            {enableActions ? (
                                <TableHead className="h-11 w-[4.5rem] px-3 py-0 pr-4 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground md:w-[5.25rem]">
                                    Ações
                                </TableHead>
                            ) : null}
                        </TableRow>
                    </TableHeader>
                    <TableBody className="[&_tr:last-child]:border-b-0">
                        {transactions.map((transaction, index) => {
                            const isProjected = isProjectedTransactionRow(transaction)
                            const paymentLabel = formatPaymentCell(transaction)
                            const invoiceBadge = creditCardInvoiceBadgeForRow(
                                transaction,
                                invoicePaidByCardClose
                            )
                            const descText =
                                transaction.description ||
                                transaction.category?.name ||
                                "Sem descrição"
                            const titleText = `${descText}${
                                transaction.is_recurring ? " (recorrente)" : ""
                            }`

                            const prevMonthKey =
                                index > 0
                                    ? monthYearKeyFromTransactionDate(
                                          transactions[index - 1].date
                                      )
                                    : null
                            const thisMonthKey =
                                monthYearKeyFromTransactionDate(transaction.date)

                            const showMonthHeader =
                                sortKey === "date" &&
                                thisMonthKey !== "" &&
                                prevMonthKey !== thisMonthKey

                            const monthRowIds =
                                transactionIdsByMonthKey.get(thisMonthKey) ?? []
                            const selectedInMonthCount = enableSelection
                                ? monthRowIds.filter((id) =>
                                      selectedIds.has(id)
                                  ).length
                                : 0
                            const allMonthSelected =
                                enableSelection &&
                                monthRowIds.length > 0 &&
                                selectedInMonthCount === monthRowIds.length
                            const someMonthSelected =
                                enableSelection &&
                                selectedInMonthCount > 0 &&
                                selectedInMonthCount < monthRowIds.length

                            const monthLabel = formatTransactionMonthYearPtBr(
                                transaction.date
                            )

                            return (
                                <React.Fragment key={transaction.id}>
                                    {showMonthHeader ? (
                                        <TableRow className="border-border/80 bg-muted/30 hover:bg-muted/30">
                                            {enableSelection ? (
                                                <TableCell className="w-10 px-2 py-2 align-middle md:w-11 md:px-3">
                                                    <Checkbox
                                                        aria-label={`Selecionar todas de ${monthLabel}`}
                                                        checked={
                                                            allMonthSelected
                                                                ? true
                                                                : someMonthSelected
                                                                  ? "indeterminate"
                                                                  : false
                                                        }
                                                        onCheckedChange={(v) => {
                                                            setSelectedIds((prev) => {
                                                                const next = new Set(
                                                                    prev
                                                                )
                                                                if (v === true) {
                                                                    for (const id of monthRowIds) {
                                                                        next.add(id)
                                                                    }
                                                                } else {
                                                                    for (const id of monthRowIds) {
                                                                        next.delete(id)
                                                                    }
                                                                }
                                                                return next
                                                            })
                                                        }}
                                                        onClick={(e) =>
                                                            e.stopPropagation()
                                                        }
                                                    />
                                                </TableCell>
                                            ) : null}
                                            <TableCell
                                                className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                                                colSpan={monthHeaderDataColSpan}
                                            >
                                                {monthLabel}
                                            </TableCell>
                                        </TableRow>
                                    ) : null}

                                    <TableRow
                                        className={cn(
                                            "border-border/80 transition-colors",
                                            isProjected
                                                ? "bg-muted/20"
                                                : "cursor-pointer hover:bg-muted/30",
                                        )}
                                        onClick={() => {
                                            if (isProjected) return
                                            openTransactionDetail(transaction)
                                        }}
                                    >
                                        {enableSelection ? (
                                            <TableCell className="w-10 px-2 py-3 md:w-11 md:px-3">
                                                {isProjected ? null : (
                                                <Checkbox
                                                    aria-label={`Selecionar ${formatTransactionDayPtBr(
                                                        transaction.date
                                                    )} — ${descText}`}
                                                    checked={selectedIds.has(
                                                        transaction.id
                                                    )}
                                                    onCheckedChange={(v) => {
                                                        setSelectedIds((prev) => {
                                                            const next = new Set(
                                                                prev
                                                            )
                                                            if (v === true) {
                                                                next.add(
                                                                    transaction.id
                                                                )
                                                            } else {
                                                                next.delete(
                                                                    transaction.id
                                                                )
                                                            }
                                                            return next
                                                        })
                                                    }}
                                                    onClick={(e) =>
                                                        e.stopPropagation()
                                                    }
                                                />
                                                )}
                                            </TableCell>
                                        ) : null}
                                        <TableCell className="whitespace-nowrap px-4 py-3 tabular-nums text-muted-foreground">
                                            {formatTransactionDayPtBr(
                                                transaction.date
                                            )}
                                        </TableCell>
                                        <TableCell className="max-w-[160px] px-4 py-3 text-left sm:max-w-[200px] lg:max-w-[280px]">
                                            <span className="inline-flex w-full min-w-0 max-w-full flex-wrap content-start items-center justify-start gap-x-1 gap-y-0.5 text-left">
                                                <span
                                                    className="min-w-0 max-w-full break-words font-medium [overflow-wrap:anywhere]"
                                                    title={titleText}
                                                >
                                                    {descText}
                                                    {transaction.is_recurring ? (
                                                        <span className="ml-1 text-muted-foreground">
                                                            · rec.
                                                        </span>
                                                    ) : null}
                                                </span>
                                                {isProjected ? (
                                                    <span
                                                        className={cn(
                                                            transactionRowChipShell,
                                                            tagChipWarning,
                                                        )}
                                                        title="Cobrança prevista"
                                                    >
                                                        Previsto
                                                    </span>
                                                ) : null}
                                                {transaction.installment_plan_id ? (
                                                    <span
                                                        className={
                                                            transactionParceladaRowChip
                                                        }
                                                        title="Compra parcelada"
                                                    >
                                                        Parcelada
                                                    </span>
                                                ) : null}
                                                {transaction.subscription_id ? (
                                                    <Link
                                                        href={ROUTES.SUBSCRIPTIONS}
                                                        className={cn(
                                                            transactionRowChipShell,
                                                            tagChipInfo
                                                        )}
                                                        title={
                                                            transaction
                                                                .subscription
                                                                ?.name
                                                                ? `Assinatura: ${transaction.subscription.name}`
                                                                : "Ver assinaturas"
                                                        }
                                                        aria-label={
                                                            transaction
                                                                .subscription
                                                                ?.name
                                                                ? `Assinatura: ${transaction.subscription.name}`
                                                                : "Ver assinaturas"
                                                        }
                                                        onClick={(e) =>
                                                            e.stopPropagation()
                                                        }
                                                    >
                                                        <ArrowPathRoundedSquareIcon
                                                            className="size-3 shrink-0 opacity-80"
                                                            aria-hidden
                                                        />
                                                    </Link>
                                                ) : null}
                                            </span>
                                        </TableCell>
                                        <TableCell className="px-4 py-3 text-sm font-normal text-foreground">
                                            <MoneyDisplay
                                                value={
                                                    transaction.type ===
                                                    "income"
                                                        ? Number(
                                                              transaction.amount
                                                          )
                                                        : -Number(
                                                              transaction.amount
                                                          )
                                                }
                                                signed
                                                tone={
                                                    transaction.type ===
                                                    "income"
                                                        ? "income"
                                                        : "expense"
                                                }
                                                size="default"
                                            />
                                        </TableCell>
                                        <TableCell
                                            className="hidden max-w-[11rem] px-4 py-3 text-muted-foreground md:table-cell"
                                            title={paymentLabel}
                                        >
                                            <div className="flex min-w-0 flex-nowrap items-center gap-1.5">
                                                <span className="min-w-0 truncate">
                                                    {paymentLabel}
                                                </span>
                                                {invoiceBadge ? (
                                                    <span
                                                        className={cn(
                                                            transactionRowChipShell,
                                                            invoiceBadge.chipClass
                                                        )}
                                                        title={invoiceBadge.title}
                                                    >
                                                        {invoiceBadge.label}
                                                    </span>
                                                ) : null}
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden max-w-[8rem] truncate px-4 py-3 text-muted-foreground md:table-cell">
                                            {transaction.category ? (
                                                <span className="inline-flex max-w-full items-center gap-1.5">
                                                    <span
                                                        className="size-2 shrink-0 rounded-full"
                                                        style={{
                                                            backgroundColor:
                                                                transaction
                                                                    .category
                                                                    .color ||
                                                                "var(--muted-foreground)",
                                                        }}
                                                        aria-hidden
                                                    />
                                                    <span className="truncate">
                                                        {transaction.category.name}
                                                    </span>
                                                </span>
                                            ) : (
                                                "—"
                                            )}
                                        </TableCell>
                                        <TableCell className="px-4 py-3">
                                            <span
                                                className={
                                                    transaction.type === "income"
                                                        ? transactionIncomeTypeRowChip
                                                        : transactionExpenseTypeRowChip
                                                }
                                            >
                                                {transaction.type === "income"
                                                    ? "Receita"
                                                    : "Despesa"}
                                            </span>
                                        </TableCell>
                                        {enableActions ? (
                                            <TableCell className="px-3 py-3 pr-4 text-left">
                                                {isProjected ? (
                                                    <span className="text-xs text-muted-foreground">—</span>
                                                ) : (
                                                <div className="flex items-center justify-start gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon-sm"
                                                        type="button"
                                                        className="size-7"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            openTransactionDetail(
                                                                transaction,
                                                                { edit: true }
                                                            )
                                                        }}
                                                    >
                                                        <PencilIcon className="size-3.5" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon-sm"
                                                        type="button"
                                                        className="size-7 text-destructive hover:text-destructive"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            onDeleteSingle?.(
                                                                transaction
                                                            )
                                                        }}
                                                    >
                                                        <TrashIcon className="size-3.5" />
                                                    </Button>
                                                </div>
                                                )}
                                            </TableCell>
                                        ) : null}
                                    </TableRow>
                                </React.Fragment>
                            )
                        })}
                    </TableBody>
                </Table>
            </div>

            {showPaginationFooter ? (
                <div className="flex shrink-0 flex-col gap-2.5 rounded-b-xl border-t border-border bg-muted/40 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-4">
                <p className="text-xs leading-relaxed text-muted-foreground">
                    {total === 0 ? (
                        "Nenhuma transação nesta página."
                    ) : (
                        <>
                            <span className="text-foreground/90">
                                {showFrom}–{showTo}
                            </span>
                            <span className="mx-1 text-border">·</span>
                            <span>
                                {total.toLocaleString("pt-BR")}{" "}
                                {total === 1 ? "transação" : "transações"}
                            </span>
                        </>
                    )}
                </p>
                <div className="flex items-center justify-between gap-3 sm:justify-end">
                    <span className="text-xs tabular-nums text-muted-foreground sm:mr-1">
                        {total === 0 ? (
                            "—"
                        ) : (
                            <>
                                Página{" "}
                                <span className="font-medium text-foreground">
                                    {page + 1}
                                </span>
                                <span className="text-border"> / </span>
                                <span className="font-medium text-foreground">
                                    {totalPages}
                                </span>
                            </>
                        )}
                    </span>
                    <div className="flex items-center rounded-lg border border-border/80 bg-background/80 p-0.5 shadow-sm">
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-8 rounded-md text-muted-foreground hover:text-foreground disabled:opacity-40"
                            disabled={page <= 0 || total === 0}
                            aria-label="Página anterior"
                            onClick={() => setPage((p) => Math.max(0, p - 1))}
                        >
                            <ChevronLeftIcon className="size-4" />
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-8 rounded-md text-muted-foreground hover:text-foreground disabled:opacity-40"
                            disabled={page >= totalPages - 1 || total === 0}
                            aria-label="Próxima página"
                            onClick={() =>
                                setPage((p) => Math.min(totalPages - 1, p + 1))
                            }
                        >
                            <ChevronRightIcon className="size-4" />
                        </Button>
                    </div>
                </div>
            </div>
            ) : null}
        </>
    )
}

