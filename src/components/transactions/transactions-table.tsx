"use client"

import { creditCardIdentitySubtitle, creditInvoiceSlotCompactLabel, creditInvoiceSlotStatusChipClass } from "@/lib/credit-card-display"
import * as React from "react"
import Link from "next/link"
import { ArrowPathRoundedSquareIcon, ArrowRightIcon, CheckIcon, PencilIcon, TrashIcon, XMarkIcon } from "@heroicons/react/16/solid"
import type { CreditCard, Transaction } from "@/lib/supabase"
import {
    formatMonthLongPtBr,
    formatRelativeDayPtBr,
    formatTransactionDayPtBr,
    formatTransactionMonthYearPtBr,
    formatYmdPtBr,
    localYmdFromDate,
    monthYearKeyFromTransactionDate,
    parseYmdLocal,
    transactionCalendarParts,
} from "@/lib/transaction-date"
import { cn } from "@/lib/utils"
import { ROUTES, creditCardDetailPath, creditCardInvoicePath } from "@/config/navigation"
import { estadoDaFatura, tomDoVencimento, verboDoVencimento } from "@/lib/credit-card-invoice-preview"
import {
    DataTable,
    dataTableColumns,
    type DataTableAction,
    type DataTableBulkAction,
    type DataTableColumnDef,
} from "@/components/ui/data-table"
import { MoneyDisplay } from "@/components/ui/money-display"
import { BadgeDot, tagChipInfo, tagChipSuccess, tagChipWarning, transactionExpenseTypeRowChip, transactionIncomeTypeRowChip, transactionParceladaRowChip, transactionRowChipShell } from "@/components/ui/badge"
import { paymentMethodLabel } from "@/lib/payment-methods"
import {
    classifyTransactionInvoiceSlot,
    estimatedDueDateForClose,
    statementCloseYmdForPurchaseDate,
    type CreditCardInvoiceSlot,
} from "@/lib/credit-card-billing"
import type { SortDir, TransactionsListSortKey } from "@/components/transactions/transactions-list-types"
import { isProjectedTransactionRow } from "@/lib/category-expense-month-rows"
import { numberBR, signedCurrencyBRL } from "@/lib/formatters"
import { faltaDepoisDaParcela, resolveInstallmentKn, totalPurchaseFromPlan } from "@/lib/transaction-installment"
import { Progress } from "@/components/ui/progress"
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
import {
    ContextMenuContent,
    ContextMenuHeader,
    ContextMenuItem,
    ContextMenuSeparator,
} from "@/components/ui/context-menu"
import { P } from "@/components/ui/typography"

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

export type InvoiceBadge = {
    slot: CreditCardInvoiceSlot
    label: string
    chipClass: string
    /** O tom do chip, que também colore o ponto de estado da prévia. */
    tone: "success" | "warning" | "destructive"
    /** Fatura marcada como paga; a prévia diz o estado a partir disso. */
    paid: boolean
    card: CreditCard
    cardId: string
    closeYmd: string | null
    /** Estimado: o primeiro `due_day` do cartão depois do fechamento (no mesmo mês ou no seguinte). */
    dueYmd: string | null
}

export function creditCardInvoiceBadgeForRow(
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
    const paidChip = { label: "Paga", chipClass: tagChipSuccess, tone: "success" as const }

    if (slot === "open") {
        return { ...base, ...bySlot, paid: false }
    }

    return invoicePaid
        ? { ...base, ...paidChip, paid: true }
        : { ...base, ...bySlot, paid: false }
}

/**
 * O chip fica dentro de uma linha que abre o detalhe no clique, e a prévia é
 * portalizada — mas evento de portal do React sobe pela árvore do React, então
 * o clique no "Ver cartão" também abriria a linha. Os dois param aqui.
 */
export const stopRowEvent = (e: React.SyntheticEvent) => e.stopPropagation()

/**
 * O chip vira `<button>` para a prévia abrir no foco; o desenho é o mesmo. O
 * clique nele **segue para a linha** e abre o detalhe, como antes: a prévia
 * é redundante, e um chip que engolisse o clique seria um buraco na linha. O
 * toque longo abre a prévia e o `HoverCardTrigger` engole o clique do soltar.
 */
const rowChipTriggerClassName =
    "cursor-default outline-none focus-visible:ring-3 focus-visible:ring-ring/45"

const invoiceDotClassName = {
    success: "[--badge-dot:var(--success)]",
    warning: "[--badge-dot:var(--warning)]",
    destructive: "[--badge-dot:var(--destructive)]",
} as const

const invoiceDueToneClassName = {
    neutral: "",
    warning: "text-warning",
    destructive: "text-destructive",
} as const

/** O chip de fatura e a prévia dela: cartão, estado, fechamento e vencimento. */
export function CreditInvoiceChip({ badge }: { badge: InvoiceBadge }) {
    const today = new Date()
    const { closeYmd, dueYmd } = badge
    const fechada = badge.slot !== "open"
    const estado = fechada
        ? estadoDaFatura({ slot: badge.slot as "last_closed" | "earlier", paid: badge.paid, dueYmd, today })
        : null
    const closeDate = closeYmd ? parseYmdLocal(closeYmd) : undefined
    const mes = closeDate ? formatMonthLongPtBr(closeDate).toLowerCase() : null
    const dueTone = dueYmd
        ? tomDoVencimento({ paid: badge.paid, dueYmd, today })
        : "neutral"
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
                <HoverCardHeader>
                    <HoverCardTitle>{badge.card.name}</HoverCardTitle>
                    <HoverCardDescription>
                        {mes ? `Fatura de ${mes}` : creditCardIdentitySubtitle(badge.card)}
                    </HoverCardDescription>
                </HoverCardHeader>
                <HoverCardBody>
                    {estado ? (
                        <P className="flex items-center gap-2 font-medium">
                            <BadgeDot className={invoiceDotClassName[badge.tone]} />
                            {estado}
                        </P>
                    ) : null}
                    {closeYmd || dueYmd ? (
                        <DescriptionList layout="inline" className="gap-1">
                            {closeYmd ? (
                                <DescriptionListItem>
                                    <DescriptionTerm>{fechada ? "Fechou" : "Fecha"}</DescriptionTerm>
                                    <DescriptionDetails className="nums">
                                        {formatYmdPtBr(closeYmd)}
                                        {fechada ? ` · ${formatRelativeDayPtBr(closeYmd)}` : null}
                                    </DescriptionDetails>
                                </DescriptionListItem>
                            ) : null}
                            {dueYmd ? (
                                <DescriptionListItem>
                                    <DescriptionTerm>
                                        {fechada ? verboDoVencimento(dueYmd, today) : "Vence"}
                                    </DescriptionTerm>
                                    <DescriptionDetails className="nums">
                                        {formatYmdPtBr(dueYmd)}
                                        {fechada ? (
                                            <>
                                                {" · "}
                                                <span className={invoiceDueToneClassName[dueTone]}>
                                                    {formatRelativeDayPtBr(dueYmd)}
                                                </span>
                                            </>
                                        ) : null}
                                    </DescriptionDetails>
                                </DescriptionListItem>
                            ) : null}
                        </DescriptionList>
                    ) : null}
                </HoverCardBody>
                <HoverCardFooter>
                    <HoverCardLink asChild>
                        {closeYmd && mes ? (
                            <Link href={creditCardInvoicePath(badge.cardId, closeYmd)}>
                                {`Ver fatura de ${mes}`}
                            </Link>
                        ) : (
                            <Link href={creditCardDetailPath(badge.cardId)}>Ver cartão</Link>
                        )}
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
export function InstallmentChip({
    transaction,
    comParcela = false,
}: {
    transaction: Transaction
    /** "Parcelada 1/2" no chip (a tabela da página); sem ele, só "Parcelada". */
    comParcela?: boolean
}) {
    const plan = transaction.installment_plan ?? null
    const kn = resolveInstallmentKn(
        transaction.installment_sequence,
        transaction.description,
        plan
    )
    // O título é a compra, sem o "(k/n)" que o chip já mostra.
    const nomeDaCompra =
        plan?.description?.trim() ||
        (transaction.description ?? "").replace(/\s*\(\d+\/\d+\)\s*$/, "").trim() ||
        "Compra parcelada"
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
                    {comParcela && kn ? `Parcelada ${kn.k}/${kn.n}` : "Parcelada"}
                </button>
            </HoverCardTrigger>
            <HoverCardContent
                size="md"
                padding="none"
                onClick={stopRowEvent}
                onContextMenu={stopRowEvent}
            >
                <HoverCardHeader>
                    <HoverCardTitle>{nomeDaCompra}</HoverCardTitle>
                    {ultima ? (
                        <HoverCardDescription>Termina com esta parcela</HoverCardDescription>
                    ) : termina ? (
                        <HoverCardDescription>Termina em {termina}</HoverCardDescription>
                    ) : null}
                </HoverCardHeader>
                <HoverCardBody className="grid gap-3">
                    {kn && kn.n > 1 ? (
                        <Progress
                            className="[--progress-highlight:var(--color-warning)]"
                            value={kn.k}
                            max={kn.n}
                            segments={kn.n}
                            highlight={{ from: kn.k - 1, to: kn.k }}
                            aria-label={`Parcela ${kn.k} de ${kn.n}`}
                        />
                    ) : null}
                    <DescriptionList layout="inline" className="gap-1">
                        <DescriptionListItem>
                            <DescriptionTerm>Esta parcela{kn ? ` (${kn.k} de ${kn.n})` : ""}</DescriptionTerm>
                            <DescriptionDetails>
                                <MoneyDisplay value={Number(transaction.amount)} size="sm" />
                            </DescriptionDetails>
                        </DescriptionListItem>
                        {total != null && Number.isFinite(total) ? (
                            <DescriptionListItem>
                                <DescriptionTerm>Total da compra</DescriptionTerm>
                                <DescriptionDetails>
                                    <MoneyDisplay value={total} size="sm" />
                                </DescriptionDetails>
                            </DescriptionListItem>
                        ) : null}
                        {plan && kn ? (
                            <DescriptionListItem>
                                <DescriptionTerm>Falta pagar</DescriptionTerm>
                                <DescriptionDetails>
                                    <MoneyDisplay value={faltaDepoisDaParcela(plan, kn.k)} size="sm" />
                                </DescriptionDetails>
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
    /** A página seguinte chegando: as linhas de antes esmaecem até ela entrar. */
    pending?: boolean

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
    /**
     * O gêmeo do telefone do `DataTable`. `false` quando quem chama já desenha
     * a lista do telefone (o painel, com o avatar de quem lançou).
     * @default true
     */
    mobile?: boolean
}

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

const col = dataTableColumns<Transaction>()

const descriptionOf = (t: Transaction) =>
    t.description || t.category?.name || "Sem descrição"

const signedAmountOf = (t: Transaction) =>
    t.type === "income" ? Number(t.amount) : -Number(t.amount)

/** O nome da linha nos rótulos ("Editar Mercado, 12/03"): a data desempata as homônimas. */
const rowLabelOf = (t: Transaction) =>
    `${descriptionOf(t)}, ${formatTransactionDayPtBr(t.date)}`

/** A coluna que agrupa por mês — e a única ordenação em que o mês faz sentido. */
const DATE_COLUMN: TransactionsTableSortKey = "date"

function transactionColumns(
    enableSort: boolean,
    invoicePaidByCardClose: ReadonlySet<string>
): DataTableColumnDef<Transaction>[] {
    return [
        {
            id: DATE_COLUMN,
            accessorFn: (t) => t.date,
            header: "Data",
            enableSorting: enableSort,
            cell: ({ row }) => (
                <span className="nums whitespace-nowrap text-muted-foreground">
                    {formatTransactionDayPtBr(row.original.date)}
                </span>
            ),
            meta: { label: "Data", mobile: "description" },
        },
        {
            id: "description",
            header: "Descrição",
            enableSorting: false,
            cell: ({ row }) => {
                const t = row.original
                const descText = descriptionOf(t)
                return (
                    <span className="inline-flex flex-wrap items-center gap-x-1 gap-y-0.5">
                        <span
                            className="min-w-0 wrap-anywhere"
                            title={`${descText}${t.is_recurring ? " (recorrente)" : ""}`}
                        >
                            {descText}
                            {t.is_recurring ? (
                                <span className="ml-1 text-muted-foreground">· rec.</span>
                            ) : null}
                        </span>
                        {isProjectedTransactionRow(t) ? (
                            <span
                                className={cn(transactionRowChipShell, tagChipWarning)}
                                title="Cobrança prevista"
                            >
                                Previsto
                            </span>
                        ) : null}
                        {t.installment_plan_id ? <InstallmentChip transaction={t} /> : null}
                        {t.subscription_id ? (
                            <Link
                                href={ROUTES.SUBSCRIPTIONS}
                                className={cn(transactionRowChipShell, tagChipInfo)}
                                title={
                                    t.subscription?.name
                                        ? `Assinatura: ${t.subscription.name}`
                                        : "Ver assinaturas"
                                }
                                aria-label={
                                    t.subscription?.name
                                        ? `Assinatura: ${t.subscription.name}`
                                        : "Ver assinaturas"
                                }
                                onClick={stopRowEvent}
                            >
                                <ArrowPathRoundedSquareIcon
                                    className="size-3 shrink-0 opacity-80"
                                    aria-hidden
                                />
                            </Link>
                        ) : null}
                    </span>
                )
            },
            meta: {
                label: "Descrição",
                primary: true,
                mobile: "title",
                cellClassName: "max-w-50 lg:max-w-70",
            },
        },
        {
            ...col.money({ id: "amount", header: "Valor", accessor: signedAmountOf }),
            enableSorting: enableSort,
        },
        {
            id: "payment",
            header: "Forma de pagamento",
            enableSorting: false,
            cell: ({ row }) => {
                const paymentLabel = formatPaymentCell(row.original)
                const invoiceBadge = creditCardInvoiceBadgeForRow(
                    row.original,
                    invoicePaidByCardClose
                )
                return (
                    <span className="flex min-w-0 items-center gap-1.5 text-muted-foreground">
                        {/* O `title` mora no rótulo, e não na célula: na célula ele
                            vazava para o chip de fatura, por cima da prévia. */}
                        <span className="min-w-0 truncate" title={paymentLabel}>
                            {paymentLabel}
                        </span>
                        {invoiceBadge ? <CreditInvoiceChip badge={invoiceBadge} /> : null}
                    </span>
                )
            },
            meta: { label: "Forma de pagamento", cellClassName: "max-w-44" },
        },
        {
            id: "category",
            header: "Categoria",
            enableSorting: false,
            cell: ({ row }) => {
                const category = row.original.category
                if (!category) return <span className="text-muted-foreground">—</span>
                return (
                    <span className="inline-flex max-w-full items-center gap-1.5 text-muted-foreground">
                        <span
                            className="size-2 shrink-0 rounded-full"
                            style={{
                                backgroundColor:
                                    category.color || "var(--muted-foreground)",
                            }}
                            aria-hidden
                        />
                        <span className="truncate">{category.name}</span>
                    </span>
                )
            },
            meta: { label: "Categoria", mobile: "description", cellClassName: "max-w-32" },
        },
        {
            id: "type",
            header: "Tipo",
            enableSorting: false,
            cell: ({ row }) =>
                row.original.type === "income" ? (
                    <span className={transactionIncomeTypeRowChip}>Receita</span>
                ) : (
                    <span className={transactionExpenseTypeRowChip}>Despesa</span>
                ),
            meta: { label: "Tipo" },
        },
    ]
}

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
    page = 0,
    setPage,
    pageSize: pageSizeProp,
    totalCount,
    pending = false,
    invoicePaidByCardClose = EMPTY_INVOICE_PAID_KEYS,
    enableSelection = true,
    enableSort = true,
    enableActions = true,
    showPaginationFooter = true,
    mobile = true,
}: TransactionsTableProps) {
    const setSelectedIds = setSelectedIdsProp ?? noopSetSelectedIds
    const pageSize = pageSizeProp ?? Math.max(transactions.length, 1)

    const columns = React.useMemo(
        () => transactionColumns(enableSort, invoicePaidByCardClose),
        [enableSort, invoicePaidByCardClose]
    )

    // Só conta e só apaga o que está na tela: uma seleção feita antes de trocar o
    // filtro seguia valendo e a exclusão em massa levava linhas invisíveis. As
    // projetadas não são linhas do banco e nunca entram.
    const rowSelection = React.useMemo(() => {
        const sel: Record<string, true> = {}
        for (const t of transactions) {
            if (selectedIdsProp?.has(t.id) && !isProjectedTransactionRow(t)) sel[t.id] = true
        }
        return sel
    }, [selectedIdsProp, transactions])

    const sorting = React.useMemo(
        () => [{ id: sortKey, desc: sortDir === "desc" }],
        [sortKey, sortDir]
    )

    const bulkActions: DataTableBulkAction<Transaction>[] = [
        // Editar abre uma folha por vez: com mais de uma marcada, desabilita.
        {
            label: "Editar",
            icon: <PencilIcon aria-hidden />,
            disabled: (rows) => rows.length !== 1,
            onSelect: ([t]) => {
                if (t) openTransactionDetail(t, { edit: true })
            },
        },
        {
            label: "Excluir",
            icon: <TrashIcon aria-hidden />,
            variant: "destructive",
            // Só abre a confirmação: `false` mantém a seleção se ela for
            // cancelada. Quem limpa é a exclusão que deu certo.
            onSelect: (_rows, ids) => {
                onDeleteBulk?.(ids)
                return false
            },
        },
    ]

    const rowActions: DataTableAction<Transaction>[] = [
        {
            label: "Editar",
            icon: <PencilIcon aria-hidden />,
            primary: true,
            hidden: isProjectedTransactionRow,
            onSelect: (t) => openTransactionDetail(t, { edit: true }),
        },
        {
            label: "Excluir",
            icon: <TrashIcon aria-hidden />,
            primary: true,
            variant: "destructive",
            hidden: isProjectedTransactionRow,
            onSelect: (t) => onDeleteSingle?.(t),
        },
    ]

    return (
        // Uma prévia aberta aquece as outras: descer pelos chips das linhas abre
        // a próxima sem esperar de novo.
        <HoverCardGroup>
            <DataTable
                aria-label="Transações"
                columns={columns}
                data={transactions}
                getRowId={(t) => t.id}
                getRowLabel={rowLabelOf}
                manual={{
                    rowCount: totalCount ?? transactions.length,
                    sorting: true,
                    pagination: true,
                }}
                sorting={sorting}
                onSortingChange={(next) => {
                    // A TanStack devolve a ordenação seguinte; quem decide o
                    // sentido é o controlador. Daqui só sai qual coluna foi tocada.
                    const tocada = next.find((s) => s.id !== sortKey)?.id ?? sortKey
                    onToggleSort?.(tocada as TransactionsTableSortKey)
                }}
                pageSize={showPaginationFooter ? pageSize : false}
                pagination={showPaginationFooter ? { pageIndex: page, pageSize } : undefined}
                onPaginationChange={(p) => setPage?.(p.pageIndex)}
                pending={pending}
                mobile={mobile}
                countLabel={
                    showPaginationFooter
                        ? (n) => `${numberBR(n)} ${n === 1 ? "transação" : "transações"}`
                        : undefined
                }
                stickyHeader
                empty="Nenhuma transação nesta página."
                enableSelection={
                    enableSelection ? (t) => !isProjectedTransactionRow(t) : false
                }
                rowSelection={enableSelection ? rowSelection : undefined}
                onRowSelectionChange={(next) =>
                    setSelectedIds(new Set(Object.keys(next).filter((id) => next[id])))
                }
                bulkActions={enableSelection ? bulkActions : undefined}
                rowActions={enableActions ? rowActions : undefined}
                // As projetadas são cobranças previstas: não abrem, não têm menu
                // e aparecem apagadas.
                onRowClick={(t) => openTransactionDetail(t)}
                rowClickable={(t) => !isProjectedTransactionRow(t)}
                rowState={(t) => (isProjectedTransactionRow(t) ? "pending" : undefined)}
                groupBy={(t, { sorting: ordem }) => {
                    if (ordem[0]?.id !== DATE_COLUMN) return null
                    const key = monthYearKeyFromTransactionDate(t.date)
                    return key ? { key, label: formatTransactionMonthYearPtBr(t.date) } : null
                }}
                // O botão direito e o toque longo repetem as ações da linha; sobre
                // uma linha selecionada, agem na seleção inteira.
                rowContextMenu={(t, { targets, selected }) =>
                    isProjectedTransactionRow(t) ? null : (
                        <TransactionRowContextMenu
                            transaction={t}
                            title={descriptionOf(t)}
                            alvos={targets.map((x) => x.id)}
                            selected={selected}
                            enableSelection={enableSelection}
                            enableActions={enableActions}
                            openTransactionDetail={openTransactionDetail}
                            setSelectedIds={setSelectedIds}
                            onDeleteSingle={onDeleteSingle}
                            onDeleteBulk={onDeleteBulk}
                        />
                    )
                }
            />
        </HoverCardGroup>
    )
}
