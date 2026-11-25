"use client"

import Link from "next/link"
import { ArrowTopRightOnSquareIcon } from "@heroicons/react/16/solid"
import { EmptyState, EmptyStateActions, EmptyStateGhost, EmptyStateTitle } from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"
import { PageSection, PageSectionTitle } from "@/components/ui/page-section"
import { useWorkspace } from "@/components/workspace-provider"
import type { useTransactionsListController } from "@/components/transactions/use-transactions-list-controller"
import { TransacoesTabela } from "@/components/transactions/transacoes-tabela"
import { TransactionFormDialog } from "@/components/transactions/transaction-form-dialog"
import { ExcluirLancamentosDialog } from "@/components/transactions/excluir-lancamentos-dialog"
import { TransactionDetailSheet } from "@/components/transactions/transaction-detail-sheet"
import { ROUTES } from "@/config/navigation"
import { numberBR } from "@/lib/formatters"
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
    const { fonte } = lancamentos
    const { currentWorkspaceId, currentWorkspace } = useWorkspace()
    const membros = useMemberDirectoryQuery(currentWorkspaceId).data ?? []
    const { pendingDelete } = c
    const total = fonte.pagina.totalCount
    const porNome = fonte.estado.filtros.find((f) => f.field === "descricao")?.values[0]

    return (
        // A seção é nomeada pelo título ("Lançamentos"), como os outros blocos da página.
        <PageSection id={LANCAMENTOS_DO_MES_ID} className="min-w-0 max-w-full scroll-mt-(--top-bar-bottom)">
            <TransacoesTabela
                tela={fonte}
                id="lancamentos-da-categoria"
                ariaLabel={`Lançamentos de ${categoryName}`}
                semCategoria
                filtroNaBarra
                // A contagem já está no título "Lançamentos".
                contagemNoRodape={false}
                membros={membros}
                divide={currentWorkspace?.split_mode === "split"}
                onEditar={(t) => c.openTransactionDetail(t, { edit: true })}
                onExcluir={(ids) => {
                    const uma = ids.length === 1 ? linhas.find((t) => t.id === ids[0]) : undefined
                    c.setPendingDelete(uma ? { mode: "single", transaction: uma } : { mode: "bulk", ids, rows: linhas })
                }}
                barra={
                    // Uma linha, como "Últimos 6 meses" e "Quem gastou": o título com a contagem, e a ação na ponta.
                    // Sem barra de filtro: a página já fixa categoria e mês. O filtro por nome só chega pelo
                    // "Ver <grupo>" da leitura, e o "Ver todos" o desfaz.
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                        <PageSectionTitle
                            className="min-w-0 flex-1 truncate"
                            count={
                                carregando ? null : (
                                    // O número em cinza, a forma padrão do título de seção (o selo cheio pesava como botão).
                                    <span role="status" aria-label={`${numberBR(total)} ${total === 1 ? "lançamento" : "lançamentos"}`}>
                                        {numberBR(total)}
                                    </span>
                                )
                            }
                        >
                            Lançamentos
                            {porNome ? <span className="font-normal text-muted-foreground"> de &quot;{porNome}&quot;</span> : null}
                        </PageSectionTitle>
                        {fonte.estado.filtros.length > 0 ? (
                            <Button type="button" variant="tertiary" className="shrink-0" onClick={() => fonte.setEstado({ filtros: [] })}>
                                Ver todos
                            </Button>
                        ) : null}
                        <Button asChild variant="tertiary" className="shrink-0">
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
        </PageSection>
    )
}
