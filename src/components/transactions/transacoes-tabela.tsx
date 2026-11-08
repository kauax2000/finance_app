"use client"

import * as React from "react"
import Link from "next/link"
import {
    ArrowRightIcon,
    CheckIcon,
    DocumentDuplicateIcon,
    PencilIcon,
    TagIcon,
    TrashIcon,
    XMarkIcon,
} from "@heroicons/react/16/solid"
import { FunnelIcon, InboxStackIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline"
import { CategoryIconPreview, normalizeCategoryIcon } from "@/components/categories/category-appearance-fields"
import { useWorkspace } from "@/components/workspace-provider"
import { useIsMobile } from "@/hooks/use-mobile"
import { useGlobalShellDialogsOptional } from "@/components/layout/global-shell-dialogs-provider"
import { CategorizarEmLoteDialog } from "@/components/transactions/categorizar-em-lote-dialog"
import {
    diaLocalDe,
    ordemDepoisDoClique,
    tipoDoLote,
    totalDoDia,
    valorComSinal,
} from "@/components/transactions/transacoes-tabela-regras"
import {
    CreditInvoiceChip,
    InstallmentChip,
    creditCardInvoiceBadgeForRow,
    stopRowEvent,
} from "@/components/transactions/transactions-table"
import type { TelaDeTransacoes } from "@/components/transactions/use-transacoes-da-tela"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge, badgeVariants } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ColorTile } from "@/components/ui/color-tile"
import {
    ContextMenuContent,
    ContextMenuHeader,
    ContextMenuItem,
    ContextMenuSeparator,
} from "@/components/ui/context-menu"
import {
    DataTable,
    dataTableColumns,
    type DataTableAction,
    type DataTableBulkAction,
    type DataTableColumnDef,
} from "@/components/ui/data-table"
import {
    EmptyState,
    EmptyStateActions,
    EmptyStateDescription,
    EmptyStateGhost,
    EmptyStateIcon,
    EmptyStateTitle,
} from "@/components/ui/empty-state"
import { HoverCardGroup } from "@/components/ui/hover-card"
import { MoneyDisplay } from "@/components/ui/money-display"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { ROUTES } from "@/config/navigation"
import { identityToneFor } from "@/lib/avatar"
import { isProjectedTransactionRow } from "@/lib/category-expense-month-rows"
import { chavesDeFaturasPagas } from "@/lib/fatura/total-com-banco"
import { numberBR, signedCurrencyBRL } from "@/lib/formatters"
import { paymentMethodLabel } from "@/lib/payment-methods"
import { PAGE_SIZE } from "@/lib/queries/fetch-transactions-list-page"
import type { MemberDirectoryRow } from "@/lib/queries/use-member-directory"
import type { Transaction } from "@/lib/supabase"
import { toastError, toastSuccess } from "@/lib/toast"
import { formatDayHeadingPtBr, formatTransactionDayPtBr, groupByLocalDay } from "@/lib/transaction-date"
import { marcarConferidos } from "@/lib/transactions/mutations"
import { cn, getInitials } from "@/lib/utils"

export type TransacoesTabelaProps = {
    tela: TelaDeTransacoes
    membros: MemberDirectoryRow[]
    /** Carteira `split`: o avatar é de quem pagou. */
    divide?: boolean
    onEditar: (t: Transaction) => void
    onDuplicar: (t: Transaction) => void
    onExcluir: (ids: string[]) => void
}

const col = dataTableColumns<Transaction>()

const descricaoDe = (t: Transaction) => t.description || t.category?.name || "Sem descrição"
/** O nome da linha nos rótulos ("Editar Mercado, 12/03"): a data desempata as homônimas. */
const rotuloDe = (t: Transaction) => `${descricaoDe(t)}, ${formatTransactionDayPtBr(t.date)}`
const lancamentos = (n: number) => `${numberBR(n)} ${n === 1 ? "lançamento" : "lançamentos"}`
const MISTURADO = "Selecione só despesas ou só receitas"

function LadrilhoDaCategoria({ t }: { t: Transaction }) {
    return (
        <ColorTile size="xs" color={t.category?.color}>
            <CategoryIconPreview name={normalizeCategoryIcon(t.category?.icon)} />
        </ColorTile>
    )
}

/** A forma, ou o nome curto do cartão no crédito. */
function pagamentoDe(t: Transaction): string {
    if (t.payment_method === "credit_card" && t.payment_card) return t.payment_card.name
    return t.payment_method ? paymentMethodLabel(t.payment_method) : "—"
}

function QuemLancou({ t, membros, divide }: { t: Transaction; membros: MemberDirectoryRow[]; divide: boolean }) {
    const id = divide ? (t.paid_by ?? t.user_id) : t.user_id
    const m = membros.find((x) => x.user_id === id)
    if (!m) return null
    const nome = m.full_name || m.email
    const tom = identityToneFor(m.avatar_color, m.email || nome)
    const dica = divide ? `Pagou: ${nome}` : nome
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Avatar size="xs" role="img" aria-label={dica}>
                    {m.avatar_url ? <AvatarImage src={m.avatar_url} alt="" /> : null}
                    <AvatarFallback className={cn("font-semibold", tom.surface, tom.ink)}>
                        {getInitials(nome)}
                    </AvatarFallback>
                </Avatar>
            </TooltipTrigger>
            <TooltipContent>{dica}</TooltipContent>
        </Tooltip>
    )
}

function colunas(membros: MemberDirectoryRow[], divide: boolean, faturasPagas: ReadonlySet<string>) {
    const lista: DataTableColumnDef<Transaction>[] = [
        {
            id: "description",
            header: "Descrição",
            enableSorting: false,
            cell: ({ row }) => {
                const t = row.original
                return (
                    <span className="flex min-w-0 items-center gap-2">
                        <LadrilhoDaCategoria t={t} />
                        <span className="min-w-0 truncate" title={descricaoDe(t)}>
                            {descricaoDe(t)}
                        </span>
                        <span className="flex shrink-0 items-center gap-1">
                            {t.needs_review ? (
                                <Badge tone="info" size="xs">
                                    A conferir
                                </Badge>
                            ) : null}
                            {isProjectedTransactionRow(t) ? (
                                <Badge tone="warning" size="xs">
                                    Previsto
                                </Badge>
                            ) : null}
                            {t.installment_plan_id ? <InstallmentChip transaction={t} comParcela /> : null}
                            {t.subscription_id ? (
                                <Link
                                    href={ROUTES.SUBSCRIPTIONS}
                                    onClick={stopRowEvent}
                                    className={badgeVariants({ tone: "neutral", size: "xs" })}
                                >
                                    Assinatura
                                </Link>
                            ) : null}
                            {t.is_recurring ? (
                                <Badge tone="neutral" size="xs">
                                    Recorrente
                                </Badge>
                            ) : null}
                        </span>
                    </span>
                )
            },
            meta: {
                label: "Descrição",
                primary: true,
                mobile: "title",
                cellClassName: "max-w-80",
                // No telefone o ladrilho vai para a mídia e o "A conferir" fica no título.
                identity: {
                    title: (t: Transaction) => (
                        <>
                            {descricaoDe(t)}
                            {t.needs_review ? (
                                <Badge tone="info" size="xs" className="ms-1">
                                    A conferir
                                </Badge>
                            ) : null}
                        </>
                    ),
                    media: (t: Transaction) => <LadrilhoDaCategoria t={t} />,
                },
            },
        },
        {
            id: "category",
            header: "Categoria",
            enableSorting: false,
            cell: ({ row }) => {
                const c = row.original.category
                if (!c) return <span className="text-muted-foreground">Sem categoria</span>
                // Só o nome, em linha: a cor mora no ladrilho da Descrição, e o gêmeo do telefone junta as colunas na mesma linha.
                return c.name
            },
            meta: { label: "Categoria", mobile: "description", cellClassName: "max-w-40 truncate" },
        },
        {
            id: "payment",
            header: "Pagamento",
            enableSorting: false,
            cell: ({ row }) => {
                const fatura = creditCardInvoiceBadgeForRow(row.original, faturasPagas)
                return (
                    // No telefone a célula entra na legenda do gêmeo: fica em linha, senão o `flex` quebra a linha e a legenda vira "Mercado · …".
                    <span className="flex min-w-0 items-center gap-1.5 text-muted-foreground max-md:inline">
                        <span className="min-w-0 truncate max-md:whitespace-normal">{pagamentoDe(row.original)}</span>
                        {/* O chip é do desktop: no telefone a legenda diz só "Nubank" ou "Pix". */}
                        {fatura ? (
                            <span className="max-md:hidden">
                                <CreditInvoiceChip badge={fatura} />
                            </span>
                        ) : null}
                    </span>
                )
            },
            meta: { label: "Pagamento", mobile: "description", cellClassName: "max-w-48" },
        },
    ]
    if (membros.length >= 2) {
        lista.push({
            id: "who",
            header: "Quem",
            enableSorting: false,
            cell: ({ row }) => <QuemLancou t={row.original} membros={membros} divide={divide} />,
            meta: { label: "Quem" },
        })
    }
    // A coluna Data fica sempre: o `DataTable` não aceita `columnVisibility`
    // controlado, e a spec §6.2 não deixa mexer em `ui/` para isso.
    lista.push(
        {
            id: "date",
            accessorFn: (t) => t.date,
            header: "Data",
            cell: ({ row }) => (
                <span className="nums whitespace-nowrap text-muted-foreground">
                    {formatTransactionDayPtBr(row.original.date)}
                </span>
            ),
            meta: { label: "Data" },
        },
        col.money({ id: "amount", header: "Valor", accessor: valorComSinal }),
    )
    return lista
}

/** O menu do botão direito: sobre uma linha da seleção, age na seleção inteira. */
function MenuDaLinha({
    t,
    alvos,
    selecionada,
    onAbrir,
    onEditar,
    onDuplicar,
    onConfirmar,
    onAlternar,
    onLimpar,
    onCategorizar,
    onConferirLote,
    onExcluir,
}: {
    t: Transaction
    alvos: Transaction[]
    selecionada: boolean
    onAbrir: () => void
    onEditar: () => void
    onDuplicar: () => void
    onConfirmar: () => void
    onAlternar: () => void
    onLimpar: () => void
    onCategorizar: (linhas: Transaction[]) => void
    onConferirLote: (linhas: Transaction[]) => void
    onExcluir: (ids: string[]) => void
}) {
    if (alvos.length > 1) {
        const misturado = tipoDoLote(alvos) == null
        return (
            <ContextMenuContent
                size="xl"
                header={<ContextMenuHeader title={lancamentos(alvos.length)} description="Selecionados" />}
            >
                <ContextMenuItem disabled={misturado} onSelect={() => onCategorizar(alvos)}>
                    <TagIcon aria-hidden />
                    {misturado ? MISTURADO : "Categorizar"}
                </ContextMenuItem>
                {alvos.some((x) => x.needs_review) ? (
                    <ContextMenuItem onSelect={() => onConferirLote(alvos)}>
                        <CheckIcon aria-hidden />
                        Marcar conferidos
                    </ContextMenuItem>
                ) : null}
                <ContextMenuItem onSelect={onLimpar}>
                    <XMarkIcon aria-hidden />
                    Limpar seleção
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem variant="destructive" onSelect={() => onExcluir(alvos.map((x) => x.id))}>
                    <TrashIcon aria-hidden />
                    Excluir {alvos.length}
                </ContextMenuItem>
            </ContextMenuContent>
        )
    }
    return (
        <ContextMenuContent
            size="xl"
            header={
                <ContextMenuHeader
                    title={descricaoDe(t)}
                    description={`${formatTransactionDayPtBr(t.date)} · ${signedCurrencyBRL(valorComSinal(t))}`}
                />
            }
        >
            <ContextMenuItem onSelect={onAbrir}>
                <ArrowRightIcon aria-hidden />
                Abrir
            </ContextMenuItem>
            <ContextMenuItem onSelect={onEditar}>
                <PencilIcon aria-hidden />
                Editar
            </ContextMenuItem>
            <ContextMenuItem onSelect={onDuplicar}>
                <DocumentDuplicateIcon aria-hidden />
                Duplicar
            </ContextMenuItem>
            {t.needs_review ? (
                <ContextMenuItem onSelect={onConfirmar}>
                    <CheckIcon aria-hidden />
                    Confirmar
                </ContextMenuItem>
            ) : null}
            <ContextMenuItem onSelect={onAlternar}>
                <CheckIcon aria-hidden />
                {selecionada ? "Desmarcar" : "Selecionar"}
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem variant="destructive" onSelect={() => onExcluir([t.id])}>
                <TrashIcon aria-hidden />
                Excluir
            </ContextMenuItem>
        </ContextMenuContent>
    )
}

/** A tabela da página de Transações (spec §6): por dia, com as ações da linha e do lote. */
export function TransacoesTabela({ tela, membros, divide = false, onEditar, onDuplicar, onExcluir }: TransacoesTabelaProps) {
    const shell = useGlobalShellDialogsOptional()
    const { papel, currentWorkspaceId } = useWorkspace()
    // No telefone a tabela vira a lista: "Exibir" (as colunas) não tem o que mostrar.
    const isMobile = useIsMobile()
    const convidado = papel === "guest"
    const { estado, setEstado, pagina } = tela
    const transacoes = pagina.transactions
    const [marcadas, setMarcadas] = React.useState<Set<string>>(() => new Set())
    const [categorizar, setCategorizar] = React.useState<{ ids: string[]; tipo: "expense" | "income" } | null>(null)

    const faturasPagas = React.useMemo(
        () => chavesDeFaturasPagas(tela.workspaceAux?.invoicePayments ?? []),
        [tela.workspaceAux?.invoicePayments],
    )
    const columns = React.useMemo(() => colunas(membros, divide, faturasPagas), [membros, divide, faturasPagas])

    // Só conta o que está na tela: uma seleção de antes do filtro não leva linhas
    // invisíveis ao lote. As projetadas não são do banco e nunca entram.
    const rowSelection = React.useMemo(() => {
        const sel: Record<string, true> = {}
        for (const t of transacoes) if (marcadas.has(t.id) && !isProjectedTransactionRow(t)) sel[t.id] = true
        return sel
    }, [marcadas, transacoes])
    const linhasMarcadas = React.useMemo(() => transacoes.filter((t) => rowSelection[t.id]), [transacoes, rowSelection])

    // O dia de cada linha, na ordem da página (que já vem por data).
    const diaDaLinha = React.useMemo(() => {
        const mapa = new Map<string, { key: string; label: string }>()
        for (const g of groupByLocalDay(transacoes, diaLocalDe)) {
            const grupo = { key: g.chave, label: formatDayHeadingPtBr(g.data) }
            for (const t of g.itens) mapa.set(t.id, grupo)
        }
        return mapa
    }, [transacoes])

    async function conferir(ids: string[], aviso: string) {
        if (!currentWorkspaceId) return false
        try {
            await marcarConferidos(ids, currentWorkspaceId)
        } catch (e) {
            toastError(e instanceof Error ? e.message : "Não foi possível confirmar os lançamentos.")
            return false
        }
        toastSuccess(aviso)
        await tela.invalidar()
        return true
    }
    const conferirLote = (linhas: Transaction[]) => {
        const ids = linhas.filter((t) => t.needs_review).map((t) => t.id)
        return conferir(ids, ids.length === 1 ? "Conferido" : `${lancamentos(ids.length)} conferidos`)
    }
    const abrirCategorizar = (linhas: Transaction[]) => {
        const tipo = tipoDoLote(linhas)
        if (tipo) setCategorizar({ ids: linhas.map((t) => t.id), tipo })
    }
    const alternar = (id: string) =>
        setMarcadas((prev) => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })

    const misturado = linhasMarcadas.length > 0 && tipoDoLote(linhasMarcadas) == null
    const bulkActions: DataTableBulkAction<Transaction>[] = [
        {
            // O lote não tem dica: com tipos misturados, o rótulo é ela.
            label: misturado ? MISTURADO : "Categorizar",
            icon: <TagIcon aria-hidden />,
            disabled: (rows) => tipoDoLote(rows) == null,
            onSelect: (rows) => {
                abrirCategorizar(rows)
                // A seleção fica até o diálogo gravar.
                return false
            },
        },
        {
            label: "Marcar conferidos",
            icon: <CheckIcon aria-hidden />,
            disabled: (rows) => !rows.some((t) => t.needs_review),
            onSelect: (rows) => conferirLote(rows),
        },
        {
            label: "Editar",
            icon: <PencilIcon aria-hidden />,
            disabled: (rows) => rows.length !== 1,
            onSelect: ([t]) => {
                if (t) onEditar(t)
            },
        },
        {
            label: "Excluir",
            icon: <TrashIcon aria-hidden />,
            variant: "destructive",
            // Só abre a confirmação: cancelar não perde a seleção.
            onSelect: (_rows, ids) => {
                onExcluir(ids)
                return false
            },
        },
    ]

    const projetada = isProjectedTransactionRow
    const rowActions: DataTableAction<Transaction>[] = [
        {
            label: "Confirmar",
            icon: <CheckIcon aria-hidden />,
            primary: true,
            hidden: (t) => projetada(t) || !t.needs_review,
            onSelect: (t) => conferir([t.id], "Conferido"),
        },
        { label: "Editar", icon: <PencilIcon aria-hidden />, hidden: projetada, onSelect: onEditar },
        { label: "Duplicar", icon: <DocumentDuplicateIcon aria-hidden />, hidden: projetada, onSelect: onDuplicar },
        {
            label: "Excluir",
            icon: <TrashIcon aria-hidden />,
            variant: "destructive",
            hidden: projetada,
            onSelect: (t) => onExcluir([t.id]),
        },
    ]

    const comConferir = estado.filtros.some((f) => f.field === "conferir")
    const vazio =
        tela.workspaceAux?.workspaceHasTransactions === false ? (
            <EmptyState variant="plain" size="lg">
                <EmptyStateGhost />
                <EmptyStateTitle>Seu primeiro lançamento</EmptyStateTitle>
                <EmptyStateDescription>Registre um gasto ou traga o extrato do banco.</EmptyStateDescription>
                <EmptyStateActions>
                    <Button type="button" variant="primary" onClick={() => shell?.openTransactionCreate("expense")}>
                        Nova transação
                    </Button>
                    {/* O convidado não importa (spec §12). */}
                    {convidado ? null : (
                        <Button type="button" variant="tertiary" onClick={() => tela.pedidosDeAbertura.setImportar(true)}>
                            Importar extrato
                        </Button>
                    )}
                </EmptyStateActions>
            </EmptyState>
        ) : comConferir ? (
            <EmptyState variant="plain">
                <EmptyStateIcon variant="done" />
                <EmptyStateTitle>Tudo conferido</EmptyStateTitle>
                <EmptyStateActions>
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setEstado({ filtros: estado.filtros.filter((f) => f.field !== "conferir") })}
                    >
                        Ver todos
                    </Button>
                </EmptyStateActions>
            </EmptyState>
        ) : (
            <EmptyState variant="plain">
                <EmptyStateIcon variant="stack">
                    <MagnifyingGlassIcon aria-hidden />
                    <InboxStackIcon aria-hidden />
                    <FunnelIcon aria-hidden />
                </EmptyStateIcon>
                <EmptyStateTitle>Nenhum lançamento com esses filtros</EmptyStateTitle>
                <EmptyStateActions>
                    <Button type="button" variant="secondary" onClick={() => setEstado({ filtros: [], q: "" })}>
                        Limpar filtros
                    </Button>
                </EmptyStateActions>
            </EmptyState>
        )

    return (
        // Uma prévia aberta aquece as outras: descer pelos chips abre a próxima sem esperar.
        <HoverCardGroup>
            <DataTable
                id="transactions"
                aria-label="Transações"
                columns={columns}
                data={transacoes}
                getRowId={(t) => t.id}
                getRowLabel={rotuloDe}
                toolbar={{ view: !isMobile }}
                manual={{ rowCount: pagina.totalCount, sorting: true, pagination: true }}
                sorting={[{ id: estado.sort.key, desc: estado.sort.dir === "desc" }]}
                onSortingChange={(next) => {
                    // A TanStack devolve a ordem seguinte; daqui só sai qual coluna foi tocada.
                    const tocada = next.find((s) => s.id !== estado.sort.key)?.id ?? estado.sort.key
                    if (tocada === "date" || tocada === "amount") setEstado({ sort: ordemDepoisDoClique(estado.sort, tocada) })
                }}
                pageSize={PAGE_SIZE}
                pagination={{ pageIndex: estado.page - 1, pageSize: PAGE_SIZE }}
                onPaginationChange={(p) => setEstado({ page: p.pageIndex + 1 })}
                pending={pagina.isFetching && !pagina.isLoading}
                error={
                    pagina.error
                        ? { message: "Não foi possível carregar os lançamentos.", onRetry: () => pagina.refetch() }
                        : null
                }
                countLabel={(n) => lancamentos(n)}
                stickyHeader
                empty={vazio}
                enableSelection={(t) => !projetada(t)}
                rowSelection={rowSelection}
                onRowSelectionChange={(next) => setMarcadas(new Set(Object.keys(next).filter((id) => next[id])))}
                bulkActions={bulkActions}
                selectionSummary={(rows) => <MoneyDisplay value={totalDoDia(rows)} signed />}
                mobileRow="compact"
                rowActions={rowActions}
                // As projetadas são cobranças previstas: não abrem, não têm menu e aparecem apagadas.
                onRowClick={(t) => tela.detalhe.abrir(t)}
                rowClickable={(t) => !projetada(t)}
                rowState={(t) => (projetada(t) ? "pending" : undefined)}
                groupBy={(t, { sorting }) => (sorting[0]?.id === "date" ? (diaDaLinha.get(t.id) ?? null) : null)}
                groupTotal={(rows) => <MoneyDisplay value={totalDoDia(rows)} signed />}
                rowContextMenu={(t, { targets, selected }) =>
                    projetada(t) ? null : (
                        <MenuDaLinha
                            t={t}
                            alvos={targets}
                            selecionada={selected}
                            onAbrir={() => tela.detalhe.abrir(t)}
                            onEditar={() => onEditar(t)}
                            onDuplicar={() => onDuplicar(t)}
                            onConfirmar={() => void conferir([t.id], "Conferido")}
                            onAlternar={() => alternar(t.id)}
                            onLimpar={() => setMarcadas(new Set())}
                            onCategorizar={abrirCategorizar}
                            onConferirLote={(linhas) => void conferirLote(linhas)}
                            onExcluir={onExcluir}
                        />
                    )
                }
            />
            <CategorizarEmLoteDialog
                ids={categorizar?.ids ?? null}
                workspaceId={currentWorkspaceId}
                tipo={categorizar?.tipo ?? "expense"}
                categorias={tela.categories}
                onDone={(gravou) => {
                    setCategorizar(null)
                    if (gravou) {
                        setMarcadas(new Set())
                        void tela.invalidar()
                    }
                }}
            />
        </HoverCardGroup>
    )
}
