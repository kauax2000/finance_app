"use client"

import { creditCardIdentitySubtitle, creditInvoiceSlotCompactLabel, creditInvoiceSlotStatusChipClass } from "@/lib/credit-card-display"
import {
    TablePanel,
    TablePanelFooter,
    TablePanelToolbar,
} from "@/components/ui/table-panel"
import * as React from "react"
import Link from "next/link"
import { ArrowPathRoundedSquareIcon, ArrowRightIcon, CheckIcon, PencilIcon, TrashIcon, XMarkIcon } from "@heroicons/react/16/solid"
import type { CreditCard, Transaction } from "@/lib/supabase"
import {
    formatTransactionDayPtBr,
    formatTransactionMonthYearPtBr,
    formatYmdPtBr,
    localYmdFromDate,
    monthYearKeyFromTransactionDate,
    parseYmdLocal,
    transactionCalendarParts,
} from "@/lib/transaction-date"
import { cn } from "@/lib/utils"
import { ROUTES, creditCardDetailPath } from "@/config/navigation"
import { Button } from "@/components/ui/button"
import { Pagination, PaginationStatus } from "@/components/ui/pagination"
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
import { Badge, tagChipInfo, tagChipSuccess, tagChipWarning, transactionExpenseTypeRowChip, transactionIncomeTypeRowChip, transactionParceladaRowChip, transactionRowChipShell } from "@/components/ui/badge"
import { paymentMethodLabel } from "@/lib/payment-methods"
import {
    classifyTransactionInvoiceSlot,
    estimatedDueDateForClose,
    isEstimatedDuePastForClose,
    statementCloseYmdForPurchaseDate,
    type CreditCardInvoiceSlot,
} from "@/lib/credit-card-billing"
import type { SortDir, TransactionsListSortKey } from "@/components/transactions/transactions-list-types"
import { isProjectedTransactionRow } from "@/lib/category-expense-month-rows"
import { numberBR, signedCurrencyBRL } from "@/lib/formatters"
import { resolveInstallmentKn, totalPurchaseFromPlan } from "@/lib/transaction-installment"
import {
    DescriptionDetails,
    DescriptionList,
    DescriptionListItem,
    DescriptionTerm,
} from "@/components/ui/description-list"
import {
    HoverCard,
    HoverCardArrow,
    HoverCardBody,
    HoverCardContent,
    HoverCardDescription,
    HoverCardFooter,
    HoverCardGroup,
    HoverCardHeader,
    HoverCardLink,
    HoverCardTitle,
    HoverCardTrigger,
} from "@/components/ui/hover-card"
import { Caption } from "@/components/ui/typography"
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuHeader,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuTrigger,
    contextMenuTargets,
} from "@/components/ui/context-menu"

export type TransactionsTableSortKey = TransactionsListSortKey

const EMPTY_INVOICE_PAID_KEYS: ReadonlySet<string> = new Set()

function formatPaymentCell(t: Transaction): string {
    if (t.type !== "expense" || !t.payment_method) return "—"
    let s = paymentMethodLabel(t.payment_method)
    if (t.payment_method === "credit_card" && t.payment_card) {
        s += ` · ${t.payment_card.name}`
    }
    return s
}

type InvoiceBadge = {
    slot: CreditCardInvoiceSlot
    label: string
    chipClass: string
    /** O mesmo estado no `Badge` da prévia — a cor do chip, pelo nome do tom. */
    tone: "success" | "warning" | "destructive"
    /** O que o chip não diz (paga ou não, vencimento passado); a prévia mostra. */
    note: string | null
    card: CreditCard
    cardId: string
    closeYmd: string | null
    /** Estimado: o mês seguinte ao fechamento, no `due_day` do cartão. */
    dueYmd: string | null
}

function creditCardInvoiceBadgeForRow(
    t: Transaction,
    invoicePaidByCardClose: ReadonlySet<string>
): InvoiceBadge | null {
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
    const closeDate = closeYmd != null ? parseYmdLocal(closeYmd) : undefined
    const dueValid = card.due_day >= 1 && card.due_day <= 31
    const dueYmd =
        closeDate && dueValid
            ? localYmdFromDate(estimatedDueDateForClose(closeDate, card.due_day))
            : null
    const base = { slot, card, cardId, closeYmd, dueYmd }
    const bySlot = {
        label: creditInvoiceSlotCompactLabel(slot),
        chipClass: creditInvoiceSlotStatusChipClass(slot),
        tone:
            slot === "open"
                ? ("success" as const)
                : slot === "last_closed"
                  ? ("warning" as const)
                  : ("destructive" as const),
    }
    const paid = { label: "Paga", chipClass: tagChipSuccess, tone: "success" as const }

    if (slot === "open") {
        return { ...base, ...bySlot, note: null }
    }

    if (slot === "last_closed") {
        if (invoicePaid) {
            return { ...base, ...paid, note: "Fatura fechada — marcada como paga" }
        }
        let note = "Fatura fechada — ainda não marcada como paga"
        if (closeDate && dueValid && isEstimatedDuePastForClose(closeDate, card.due_day)) {
            note += " — vencimento estimado já passou"
        }
        return { ...base, ...bySlot, note }
    }

    if (invoicePaid) {
        return { ...base, ...paid, note: "Fatura anterior — marcada como paga" }
    }
    return { ...base, ...bySlot, note: "Fatura anterior — ainda não marcada como paga" }
}

/**
 * O chip fica dentro de uma linha que abre o detalhe no clique, e a prévia é
 * portalizada — mas evento de portal do React sobe pela árvore do React, então
 * o clique no "Ver cartão" também abriria a linha. Os dois param aqui.
 */
const stopRowEvent = (e: React.SyntheticEvent) => e.stopPropagation()

/**
 * O chip vira `<button>` para a prévia abrir no foco; o desenho é o mesmo. O
 * clique nele **segue para a linha** e abre o detalhe, como antes: a prévia
 * é redundante, e um chip que engolisse o clique seria um buraco na linha. O
 * toque longo abre a prévia e o `HoverCardTrigger` engole o clique do soltar.
 */
const rowChipTriggerClassName =
    "cursor-default outline-none focus-visible:ring-3 focus-visible:ring-ring/45"

/** O chip de fatura e a prévia dela: cartão, estado, fechamento e vencimento. */
function CreditInvoiceChip({ badge }: { badge: InvoiceBadge }) {
    return (
        <HoverCard>
            <HoverCardTrigger asChild>
                <button
                    type="button"
                    className={cn(
                        transactionRowChipShell,
                        badge.chipClass,
                        rowChipTriggerClassName
                    )}
                >
                    {badge.label}
                </button>
            </HoverCardTrigger>
            <HoverCardContent
                size="md"
                padding="none"
                onClick={stopRowEvent}
                onContextMenu={stopRowEvent}
            >
                <HoverCardHeader
                    endAdornment={
                        <Badge tone={badge.tone} size="xs">
                            {badge.label}
                        </Badge>
                    }
                >
                    <HoverCardTitle>{badge.card.name}</HoverCardTitle>
                    <HoverCardDescription>
                        {creditCardIdentitySubtitle(badge.card)}
                    </HoverCardDescription>
                </HoverCardHeader>
                <HoverCardBody>
                    {badge.note ? <Caption>{badge.note}</Caption> : null}
                    {badge.closeYmd || badge.dueYmd ? (
                        <DescriptionList layout="inline" className="gap-1">
                            {badge.closeYmd ? (
                                <DescriptionListItem>
                                    <DescriptionTerm>Fecha</DescriptionTerm>
                                    <DescriptionDetails className="nums">
                                        {formatYmdPtBr(badge.closeYmd)}
                                    </DescriptionDetails>
                                </DescriptionListItem>
                            ) : null}
                            {badge.dueYmd ? (
                                <DescriptionListItem>
                                    <DescriptionTerm>Vence</DescriptionTerm>
                                    <DescriptionDetails className="nums">
                                        {formatYmdPtBr(badge.dueYmd)}
                                    </DescriptionDetails>
                                </DescriptionListItem>
                            ) : null}
                        </DescriptionList>
                    ) : null}
                </HoverCardBody>
                {/* A página do cartão abre no ciclo atual — não há parâmetro
                    que leve a uma fatura específica —, por isso o link diz
                    "cartão" e não "fatura". */}
                <HoverCardFooter>
                    <HoverCardLink asChild>
                        <Link href={creditCardDetailPath(badge.cardId)}>
                            Ver cartão
                        </Link>
                    </HoverCardLink>
                </HoverCardFooter>
                <HoverCardArrow />
            </HoverCardContent>
        </HoverCard>
    )
}

/**
 * O mês da última parcela, contando a partir desta: as parcelas são mensais
 * (`run_installment_billing`), então são `restantes` meses depois da data da
 * linha. Só o mês — o dia exato depende do dia-âncora, que a lista não traz.
 */
function installmentLastMonthLabel(dateIso: string, restantes: number): string | null {
    const p = transactionCalendarParts(dateIso)
    if (!p) return null
    const idx = p.y * 12 + (p.mo - 1) + restantes
    const ym = `${Math.floor(idx / 12)}-${String((idx % 12) + 1).padStart(2, "0")}`
    return formatTransactionMonthYearPtBr(`${ym}-01`)
}

/** O chip "Parcelada" e a prévia do plano: qual parcela, valores e quando acaba. */
function InstallmentChip({ transaction }: { transaction: Transaction }) {
    const plan = transaction.installment_plan ?? null
    const kn = resolveInstallmentKn(
        transaction.installment_sequence,
        transaction.description,
        plan
    )
    const sinal = transaction.type === "income" ? 1 : -1
    const tone = transaction.type === "income" ? "income" : "expense"
    const total = plan ? totalPurchaseFromPlan(plan) : null
    const ultima = kn != null && kn.k >= kn.n
    const termina =
        kn != null && !ultima
            ? installmentLastMonthLabel(transaction.date, kn.n - kn.k)
            : null

    return (
        <HoverCard>
            <HoverCardTrigger asChild>
                <button
                    type="button"
                    className={cn(transactionParceladaRowChip, rowChipTriggerClassName)}
                >
                    Parcelada
                </button>
            </HoverCardTrigger>
            <HoverCardContent
                size="md"
                padding="none"
                onClick={stopRowEvent}
                onContextMenu={stopRowEvent}
            >
                <HoverCardHeader>
                    <HoverCardTitle>
                        {kn ? `Parcela ${kn.k} de ${kn.n}` : "Compra parcelada"}
                    </HoverCardTitle>
                    {kn ? (
                        <HoverCardDescription>
                            {ultima ? "Última parcela" : "Compra parcelada"}
                        </HoverCardDescription>
                    ) : null}
                </HoverCardHeader>
                <HoverCardBody>
                    <DescriptionList layout="inline" className="gap-1">
                        <DescriptionListItem>
                            <DescriptionTerm>Parcela</DescriptionTerm>
                            <DescriptionDetails>
                                <MoneyDisplay
                                    value={sinal * Number(transaction.amount)}
                                    signed
                                    tone={tone}
                                    size="sm"
                                />
                            </DescriptionDetails>
                        </DescriptionListItem>
                        {total != null && Number.isFinite(total) ? (
                            <DescriptionListItem>
                                <DescriptionTerm>Total da compra</DescriptionTerm>
                                <DescriptionDetails>
                                    <MoneyDisplay
                                        value={sinal * total}
                                        signed
                                        tone={tone}
                                        size="sm"
                                    />
                                </DescriptionDetails>
                            </DescriptionListItem>
                        ) : null}
                        {termina ? (
                            <DescriptionListItem>
                                <DescriptionTerm>Última parcela</DescriptionTerm>
                                <DescriptionDetails>{termina}</DescriptionDetails>
                            </DescriptionListItem>
                        ) : null}
                    </DescriptionList>
                </HoverCardBody>
                <HoverCardArrow />
            </HoverCardContent>
        </HoverCard>
    )
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
}

const EMPTY_SELECTED_IDS = new Set<string>()

/**
 * O menu do botão direito de uma linha. `alvos` é a regra do
 * `contextMenuTargets`: a seleção inteira se a linha faz parte dela, e então
 * o menu só oferece o que vale para várias.
 */
function TransactionRowContextMenu({
    transaction,
    title,
    alvos,
    selected,
    enableSelection,
    enableActions,
    openTransactionDetail,
    setSelectedIds,
    onDeleteSingle,
    onDeleteBulk,
}: {
    transaction: Transaction
    title: string
    alvos: string[]
    selected: boolean
    enableSelection: boolean
    enableActions: boolean
    openTransactionDetail: TransactionsTableProps["openTransactionDetail"]
    setSelectedIds: React.Dispatch<React.SetStateAction<Set<string>>>
    onDeleteSingle?: (t: Transaction) => void
    onDeleteBulk?: (ids: string[]) => void
}) {
    if (alvos.length > 1) {
        return (
            <ContextMenuContent
                size="xl"
                header={
                    <ContextMenuHeader
                        title={`${alvos.length} lançamentos`}
                        description="Selecionados"
                    />
                }
            >
                <ContextMenuItem onSelect={() => setSelectedIds(new Set())}>
                    <XMarkIcon aria-hidden />
                    Limpar seleção
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem
                    variant="destructive"
                    onSelect={() => onDeleteBulk?.(alvos)}
                >
                    <TrashIcon aria-hidden />
                    Excluir {alvos.length} lançamentos
                </ContextMenuItem>
            </ContextMenuContent>
        )
    }

    const valor =
        transaction.type === "income"
            ? Number(transaction.amount)
            : -Number(transaction.amount)

    return (
        <ContextMenuContent
            size="xl"
            header={
                <ContextMenuHeader
                    title={title}
                    description={`${formatTransactionDayPtBr(transaction.date)} · ${signedCurrencyBRL(valor)}`}
                />
            }
        >
            <ContextMenuItem onSelect={() => openTransactionDetail(transaction)}>
                <ArrowRightIcon aria-hidden />
                Abrir
            </ContextMenuItem>
            <ContextMenuItem
                onSelect={() => openTransactionDetail(transaction, { edit: true })}
            >
                <PencilIcon aria-hidden />
                Editar
            </ContextMenuItem>
            {enableSelection ? (
                <ContextMenuItem
                    onSelect={() =>
                        setSelectedIds((prev) => {
                            const next = new Set(prev)
                            if (selected) next.delete(transaction.id)
                            else next.add(transaction.id)
                            return next
                        })
                    }
                >
                    <CheckIcon aria-hidden />
                    {selected ? "Desmarcar" : "Selecionar"}
                </ContextMenuItem>
            ) : null}
            {enableActions && onDeleteSingle ? (
                <>
                    <ContextMenuSeparator />
                    <ContextMenuItem
                        variant="destructive"
                        onSelect={() => onDeleteSingle(transaction)}
                    >
                        <TrashIcon aria-hidden />
                        Excluir
                    </ContextMenuItem>
                </>
            ) : null}
        </ContextMenuContent>
    )
}

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
}: TransactionsTableProps) {
    const setSelectedIds = setSelectedIdsProp ?? noopSetSelectedIds
    const page = pageProp ?? 0
    const setPage = setPageProp ?? noopSetPage
    const pageSize = pageSizeProp ?? Math.max(transactions.length, 1)
    const totalCount = totalCountProp ?? null

    const tableColCount =
        6 + (enableSelection ? 1 : 0) + (enableActions ? 1 : 0)
    const monthHeaderDataColSpan = tableColCount - (enableSelection ? 1 : 0)

    // Projetadas não são linhas do banco: "selecionar todas" as incluía, e a
    // exclusão em massa tentava apagar o que não existe.
    const pageTransactionIds = React.useMemo(
        () => transactions.filter((t) => !isProjectedTransactionRow(t)).map((t) => t.id),
        [transactions]
    )

    // Só conta e só apaga o que está na tela: uma seleção feita antes de trocar o
    // filtro seguia valendo e a exclusão em massa levava linhas invisíveis.
    const selectedIds = React.useMemo(() => {
        const raw = selectedIdsProp ?? EMPTY_SELECTED_IDS
        const visible = new Set(pageTransactionIds)
        return new Set([...raw].filter((id) => visible.has(id)))
    }, [selectedIdsProp, pageTransactionIds])

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

    // A barra de seleção mora acima da moldura, na prop `toolbar` do `TablePanel`,
    // e não dentro do cartão: o recuo é das linhas de dentro, então a barra zera o seu.
    const selectionToolbar =
        enableSelection && selectedIds.size > 0 ? (
            <TablePanelToolbar className="px-0">
                <div
                    className="flex flex-col gap-3 px-3 py-3 sm:hidden"
                    aria-label="Ações da seleção"
                >
                    <div className="flex items-start justify-between gap-3">
                        <p className="min-w-0 pt-0.5 text-sm font-medium leading-snug text-foreground">
                            {selectedIds.size === 1
                                ? "1 selecionada"
                                : `${numberBR(selectedIds.size)} selecionadas`}
                        </p>
                        <Button
                            type="button"
                            variant="tertiary"
                            size="xl"
                            className="shrink-0 px-3 text-xs text-muted-foreground hover:text-foreground active:text-foreground"
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
                        <p className="-mt-1 text-center text-2xs leading-tight text-muted-foreground">
                            Editar uma transação por vez
                        </p>
                    ) : null}
                </div>

                <div
                    className="hidden px-4 py-2 sm:flex sm:flex-row sm:flex-wrap sm:items-center sm:justify-end sm:gap-2"
                    aria-label="Ações da seleção"
                >
                    <span className="mr-auto text-xs tabular-nums text-muted-foreground">
                        {selectedIds.size === 1
                            ? "1 selecionada"
                            : `${numberBR(selectedIds.size)} selecionadas`}
                    </span>
                    <div className="flex flex-wrap items-center justify-end gap-2">
                        <Button
                            type="button"
                            variant="tertiary"
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
            </TablePanelToolbar>
        ) : null

    return (
        <TablePanel toolbar={selectionToolbar}>

            <div className="min-w-0">
                <Table className="min-w-[640px] text-sm md:min-w-[700px]">
                    <TableHeader variant="muted" sticky className="[&_tr]:border-b-0">
                        <TableRow className="border-0 [&>th]:border-b [&>th]:border-border">
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
                                className="h-11 w-[4.75rem] px-4 py-0 align-middle text-xs font-semibold tracking-wide md:w-[5.5rem]"
                                sort={sortKey === "date" ? sortDir : "none"}
                                onSort={enableSort ? () => onToggleSort?.("date") : undefined}
                            >
                                Data
                            </TableHead>
                            <TableHead className="h-11 px-4 py-0 text-xs font-semibold tracking-wide text-muted-foreground">
                                Descrição
                            </TableHead>
                            <TableHead
                                className="h-11 px-4 py-0 align-middle text-xs font-semibold tracking-wide"
                                sort={sortKey === "amount" ? sortDir : "none"}
                                onSort={enableSort ? () => onToggleSort?.("amount") : undefined}
                            >
                                Valor
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
                                <TableHead className="h-11 w-[4.5rem] px-3 py-0 pr-4 text-left text-2xs font-semibold uppercase tracking-wider text-muted-foreground md:w-[5.25rem]">
                                    Ações
                                </TableHead>
                            ) : null}
                        </TableRow>
                    </TableHeader>
                    <TableBody className="[&_tr:last-child]:border-b-0">
                        {/* Uma prévia aberta aquece as outras: descer pelos chips
                            das linhas abre a próxima sem esperar de novo. */}
                        <HoverCardGroup>
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
                                        <TableRow className="border-border/80 bg-muted/30 hover:bg-muted/30 active:bg-muted/30">
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

                                    {/* O botão direito e o toque longo repetem as ações da
                                        linha; sobre uma linha selecionada, agem na seleção
                                        inteira. Os botões da coluna Ações continuam. */}
                                    <ContextMenu>
                                    <ContextMenuTrigger asChild disabled={isProjected}>
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
                                                    <InstallmentChip transaction={transaction} />
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
                                                size="md"
                                            />
                                        </TableCell>
                                        <TableCell
                                            className="hidden max-w-[11rem] px-4 py-3 text-muted-foreground md:table-cell"
                                        >
                                            <div className="flex min-w-0 flex-nowrap items-center gap-1.5">
                                                {/* O `title` mora no rótulo, e não na célula: na
                                                    célula ele vazava para o chip de fatura, por
                                                    cima da prévia. */}
                                                <span className="min-w-0 truncate" title={paymentLabel}>
                                                    {paymentLabel}
                                                </span>
                                                {invoiceBadge ? (
                                                    <CreditInvoiceChip badge={invoiceBadge} />
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
                                                        variant="tertiary"
                                                        size="icon-sm"
                                                        type="button"
                                                        className="size-7"
                                                        aria-label={`Editar ${transaction.description || "lançamento"}`}
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
                                                        variant="destructive"
                                                        size="icon-sm"
                                                        type="button"
                                                        className="size-7"
                                                        aria-label={`Excluir ${transaction.description || "lançamento"}`}
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
                                    </ContextMenuTrigger>
                                    {isProjected ? null : (
                                        <TransactionRowContextMenu
                                            transaction={transaction}
                                            title={descText}
                                            alvos={
                                                enableSelection
                                                    ? contextMenuTargets(transaction.id, selectedIds)
                                                    : [transaction.id]
                                            }
                                            selected={selectedIds.has(transaction.id)}
                                            enableSelection={enableSelection}
                                            enableActions={enableActions}
                                            openTransactionDetail={openTransactionDetail}
                                            setSelectedIds={setSelectedIds}
                                            onDeleteSingle={onDeleteSingle}
                                            onDeleteBulk={onDeleteBulk}
                                        />
                                    )}
                                    </ContextMenu>
                                </React.Fragment>
                            )
                        })}
                        </HoverCardGroup>
                    </TableBody>
                </Table>
            </div>

            {showPaginationFooter ? (
                <TablePanelFooter className="px-3 sm:gap-4 sm:px-4">
                <PaginationStatus>
                    {total === 0 ? (
                        "Nenhuma transação nesta página."
                    ) : (
                        <>
                            <span className="text-foreground/90">
                                {showFrom}–{showTo}
                            </span>
                            <span className="mx-1 text-border">·</span>
                            <span>
                                {numberBR(total)}{" "}
                                {total === 1 ? "transação" : "transações"}
                            </span>
                        </>
                    )}
                </PaginationStatus>
                {/* Por estado, sem URL (rodada 196): a fileira é gerada, com os
                    números no desktop e `‹ 2 de 5 ›` no telefone. Foi um
                    `ButtonGroup` na rodada 188, e antes uma bandeja à mão. */}
                <Pagination
                    align="end"
                    size="md"
                    page={page + 1}
                    total={totalPages}
                    onPageChange={(p) => setPage(p - 1)}
                    className="w-auto self-end sm:self-auto"
                />
            </TablePanelFooter>
            ) : null}
        </TablePanel>
    )
}

