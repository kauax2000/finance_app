"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowTopRightOnSquareIcon } from "@heroicons/react/16/solid"
import { EmptyState, EmptyStateActions, EmptyStateGhost, EmptyStateTitle } from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"
import { FilterBar } from "@/components/ui/filter-bar"
import { useWorkspace } from "@/components/workspace-provider"
import type { useTransactionsListController } from "@/components/transactions/use-transactions-list-controller"
import { TransacoesTabela } from "@/components/transactions/transacoes-tabela"
import { TransactionFormDialog } from "@/components/transactions/transaction-form-dialog"
import { ExcluirLancamentosDialog } from "@/components/transactions/excluir-lancamentos-dialog"
import { TransactionDetailSheet } from "@/components/transactions/transaction-detail-sheet"
import { ROUTES } from "@/config/navigation"
import { useMemberDirectoryQuery } from "@/lib/queries/use-member-directory"
import type { Transaction } from "@/lib/supabase"
import type { useLancamentosDaCategoria } from "./use-lancamentos-da-categoria"
import { hrefDeTransacoes } from "./lancamentos-da-categoria-regras"
import { nomeDoMes } from "./regua-do-mes-contas"

/** O alvo do "Ver <grupo>" da leitura do mês, que filtra a lista e rola até ela. */
export const LANCAMENTOS_DO_MES_ID = "lancamentos-do-mes"

export function CategoryEmbeddedTransactions({
    categoryId,
    categoryName,
    categoryType,
    yearMonth,
    linhas,
    carregando,
    controller,
    lancamentos,
}: {
    categoryId: string
    categoryName: string
    categoryType: "income" | "expense"
    yearMonth: string
    /** As linhas do mês da categoria (receita: as lançadas; despesa: lançadas e previstas). */
    linhas: Transaction[]
    carregando: boolean
    /** Dono dos diálogos (detalhe, formulário, excluir). */
    controller: ReturnType<typeof useTransactionsListController>
    /** A fonte em memória; roda no `page-client`, que também a filtra pela leitura do mês. */
    lancamentos: ReturnType<typeof useLancamentosDaCategoria>
}) {
    const c = controller
    const { fonte, campos } = lancamentos
    const { currentWorkspaceId, currentWorkspace } = useWorkspace()
    const membros = useMemberDirectoryQuery(currentWorkspaceId).data ?? []
    const raizDosFiltros = React.useRef<HTMLDivElement>(null)
    const { pendingDelete } = c

    return (
        <section
            id={LANCAMENTOS_DO_MES_ID}
            className="min-w-0 max-w-full scroll-mt-(--top-bar-bottom)"
            aria-label="Lançamentos do mês"
        >
            <TransacoesTabela
                tela={fonte}
                id="lancamentos-da-categoria"
                ariaLabel={`Lançamentos de ${categoryName}`}
                semCategoria
                filtroNaBarra
                onEditarFiltros={() =>
                    // shortcut: clica no "+ Filtro" pelo data-slot (o mesmo do transacoes-toolbar); trocar por uma prop open quando o FilterBar ganhar uma
                    raizDosFiltros.current?.querySelector<HTMLButtonElement>("[data-slot=filter-bar-add]")?.click()
                }
                membros={membros}
                divide={currentWorkspace?.split_mode === "split"}
                onEditar={(t) => c.openTransactionDetail(t, { edit: true })}
                onExcluir={(ids) => {
                    const uma = ids.length === 1 ? linhas.find((t) => t.id === ids[0]) : undefined
                    c.setPendingDelete(uma ? { mode: "single", transaction: uma } : { mode: "bulk", ids })
                }}
                barra={
                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                        <p className="text-2xs font-medium uppercase tracking-wide text-muted-foreground">
                            Lançamentos do mês
                        </p>
                        <div className="flex min-w-0 items-center gap-2">
                            <div ref={raizDosFiltros} className="min-w-0 flex-1">
                                <FilterBar
                                    fields={campos}
                                    value={fonte.estado.filtros}
                                    onValueChange={(filtros) => fonte.setEstado({ filtros })}
                                    count={carregando ? undefined : fonte.pagina.totalCount}
                                    noun={["lançamento", "lançamentos"]}
                                    overflow="menu"
                                    disabled={carregando}
                                />
                            </div>
                            <Button asChild variant="secondary" className="shrink-0">
                                <Link
                                    href={hrefDeTransacoes({
                                        categoryId,
                                        yearMonth,
                                        tipo: categoryType,
                                        filtros: fonte.estado.filtros,
                                    })}
                                >
                                    <ArrowTopRightOnSquareIcon aria-hidden />
                                    Ver em Transações
                                </Link>
                            </Button>
                        </div>
                    </div>
                }
                vazio={
                    <EmptyState variant="plain" size="lg">
                        <EmptyStateGhost leading="tile" trailing="amount" />
                        <EmptyStateTitle>Nenhum lançamento em {nomeDoMes(yearMonth)}</EmptyStateTitle>
                        <EmptyStateActions>
                            <Button type="button" variant="secondary" onClick={() => c.openDialog(undefined, categoryType)}>
                                Nova transação
                            </Button>
                        </EmptyStateActions>
                    </EmptyState>
                }
            />

            <TransactionFormDialog
                open={c.dialogOpen && c.editingTransaction !== null}
                onOpenChange={c.handleDialogOpenChange}
                editingTransaction={c.editingTransaction}
                defaultLaunchKind="expense"
                categories={c.categories}
                creditCards={c.creditCards}
                categoriesHref={ROUTES.DASHBOARD_CATEGORIES}
                creditCardsHref={ROUTES.CREDIT_CARDS}
                saving={c.saving}
                onSave={c.handleSave}
                onSaveInstallmentPlan={c.handleSaveInstallmentPlan}
                onUpdateInstallmentPlan={c.handleUpdateInstallmentPlan}
            />

            {c.detailTransaction ? (
                <TransactionDetailSheet
                    transaction={c.detailTransaction}
                    open={c.detailOpen}
                    onOpenChange={(next) => {
                        c.setDetailOpen(next)
                        if (!next) {
                            c.setDetailTransaction(null)
                            c.setDetailLaunchEdit(false)
                        }
                    }}
                    creditCards={c.creditCards}
                    categories={c.categories}
                    categoriesHref={ROUTES.DASHBOARD_CATEGORIES}
                    creditCardsHref={ROUTES.CREDIT_CARDS}
                    subscriptionsHref={ROUTES.SUBSCRIPTIONS}
                    saving={c.saving}
                    onSave={c.handleSave}
                    onUpdateInstallmentPlan={c.handleUpdateInstallmentPlan}
                    launchInEditMode={c.detailLaunchEdit}
                    onLaunchEditConsumed={c.handleDetailLaunchEditConsumed}
                    onDelete={(tx) => {
                        c.setDetailOpen(false)
                        c.setDetailTransaction(null)
                        c.setPendingDelete({ mode: "single", transaction: tx })
                    }}
                />
            ) : null}

            <ExcluirLancamentosDialog
                linhas={
                    pendingDelete?.mode === "single"
                        ? [pendingDelete.transaction]
                        : pendingDelete?.mode === "bulk"
                          ? pendingDelete.ids.flatMap((id) => linhas.find((t) => t.id === id) ?? [])
                          : []
                }
                pending={c.deleting}
                open={pendingDelete !== null}
                onOpenChange={(open) => {
                    if (!open && !c.deleting) c.setPendingDelete(null)
                }}
                onConfirm={() => void c.confirmDelete()}
            />
        </section>
    )
}
