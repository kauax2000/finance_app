"use client"

import { useCallback, useEffect, useState } from "react"
import { AvisoAConferir } from "@/components/transactions/aviso-a-conferir"
import { CompartilhadoAviso } from "@/components/transactions/compartilhado-aviso"
import { ImportarExtratoDialog } from "@/components/transactions/importar/importar-extrato-dialog"
import { ExcluirLancamentosDialog } from "@/components/transactions/excluir-lancamentos-dialog"
import { TransacoesTabela } from "@/components/transactions/transacoes-tabela"
import { TransacoesToolbar } from "@/components/transactions/transacoes-toolbar"
import { TransactionDetailSheet } from "@/components/transactions/transaction-detail-sheet"
import { TransactionsPageSkeleton } from "@/components/transactions/transactions-page-skeleton"
import { useTransacoesDaTela } from "@/components/transactions/use-transacoes-da-tela"
import { useWorkspace } from "@/components/workspace-provider"
import { Card, CardMessage } from "@/components/ui/card"
import { ArrowDownTrayIcon, ArrowUpTrayIcon } from "@heroicons/react/16/solid"
import { Button } from "@/components/ui/button"
import { PageHeader, PageHeaderActions, PageHeaderTitle, PageHeaderTitleRow } from "@/components/ui/page-header"
import { ROUTES } from "@/config/navigation"
import { useIsMobile } from "@/hooks/use-mobile"
import { downloadCsv } from "@/lib/data-table/csv"
import { fetchTransacoesParaExportar } from "@/lib/queries/transacoes-filtradas"
import { useMemberDirectoryQuery } from "@/lib/queries/use-member-directory"
import { isProjectedTransactionRow } from "@/lib/category-expense-month-rows"
import { toastError, toastWarning } from "@/lib/toast"
import { transacoesParaCsv } from "@/lib/transactions/csv"
import { SEM_CATEGORIA } from "@/lib/transactions/filtros"
import { mensagemDaExportacao, nomeDoCsv } from "@/lib/transactions/exportar-csv"

export default function TransactionsPageClient() {
    const tela = useTransacoesDaTela()
    const { estado, setEstado, pedidosDeAbertura: pedidos, exclusao } = tela
    const { campos } = tela
    const { currentWorkspaceId, currentWorkspace, papel, loading: workspaceLoading, error: workspaceError } = useWorkspace()
    const convidado = papel === "guest"
    const membros = useMemberDirectoryQuery(currentWorkspaceId).data ?? []
    const isMobile = useIsMobile()
    const [exportando, setExportando] = useState(false)
    const [marcadas, setMarcadas] = useState<Set<string>>(() => new Set())

    // A casca já abriu a criação do `?new=` e do `?frase=`: o pedido só se limpa.
    const { criar, frase, consumirPedido } = pedidos
    useEffect(() => {
        if (criar || frase) consumirPedido()
    }, [criar, frase, consumirPedido])

    // `semCategoria`: o fim da importação leva aos que entraram sem categoria (o clique do aviso não o passa).
    const revisar = useCallback(
        (o?: { semCategoria?: boolean }) =>
            setEstado({
                filtros: [
                    { field: "conferir", operator: "is", values: [] },
                    ...(o?.semCategoria === true ? [{ field: "categoria", operator: "is" as const, values: [SEM_CATEGORIA] }] : []),
                ],
                sort: { key: "date", dir: "desc" },
            }),
        [setEstado],
    )
    const conferindo = estado.filtros.some((f) => f.field === "conferir")

    const exportar = async () => {
        if (!currentWorkspaceId || exportando) return
        setExportando(true)
        try {
            // Com linhas marcadas, exporta só elas (as da tela, como o lote); sem, tudo o que o filtro acha.
            const selecionadas = tela.pagina.transactions.filter((t) => marcadas.has(t.id) && !isProjectedTransactionRow(t))
            const { transactions, truncado } =
                selecionadas.length > 0
                    ? { transactions: selecionadas, truncado: false }
                    : await fetchTransacoesParaExportar({
                          workspaceId: currentWorkspaceId,
                          estado,
                          cartoes: tela.creditCards,
                      })
            const nome = new Map(membros.map((m) => [m.user_id, m.full_name || m.email]))
            // Download direto: o "Salvar como" abria uma segunda janela no navegador que recusa gravar.
            downloadCsv(nomeDoCsv(new Date()), transacoesParaCsv(transactions, { nomeDoMembro: (id) => nome.get(id) ?? "" }))
            // Sem toast de sucesso: o navegador não diz quando o download termina, e o aviso
            // saía antes de a pessoa salvar. O download é a confirmação; só o corte avisa.
            if (truncado) toastWarning(mensagemDaExportacao(transactions.length, truncado))
        } catch (e) {
            console.error("Falha ao exportar os lançamentos.", e)
            toastError("Não foi possível exportar os lançamentos.")
        } finally {
            setExportando(false)
        }
    }

    if (workspaceError) {
        return (
            <Card>
                <CardMessage tone="destructive">{workspaceError}</CardMessage>
            </Card>
        )
    }
    if (!workspaceLoading && !currentWorkspaceId) {
        return (
            <Card>
                <CardMessage>
                    Nenhum espaço de trabalho selecionado. Escolha um espaço no menu lateral para continuar.
                </CardMessage>
            </Card>
        )
    }
    if (tela.carregando) return <TransactionsPageSkeleton />

    const pendente = exclusao.pendente

    return (
        <div className="flex min-w-0 max-w-full flex-col gap-4">
            {/* No telefone a tela de aba não tem título, e Importar e Exportar moram no ⋯ da barra. */}
            {isMobile ? null : (
                <PageHeader collapse>
                    <PageHeaderTitleRow>
                        <PageHeaderTitle asChild>
                            {/* O `<h1>` da página é o da barra do topo. */}
                            <p aria-hidden="true">Transações</p>
                        </PageHeaderTitle>
                    </PageHeaderTitleRow>
                    {/* Criar mora no "+ Adicionar" da barra lateral; o cabeçalho só importa e exporta, em dois
                        terciários (de vez em quando, sem fundo para não pesar). Estreito, o `overflow` os leva ao ⋯. */}
                    {convidado ? null : (
                        <PageHeaderActions overflow="menu">
                            <Button type="button" variant="tertiary" onClick={() => pedidos.setImportar(true)}>
                                <ArrowUpTrayIcon aria-hidden />
                                Importar
                            </Button>
                            <Button type="button" variant="tertiary" onClick={() => void exportar()} disabled={exportando}>
                                <ArrowDownTrayIcon aria-hidden />
                                Exportar
                            </Button>
                        </PageHeaderActions>
                    )}
                </PageHeader>
            )}

            <CompartilhadoAviso pedido={pedidos.compartilhado} onDismiss={pedidos.dispensarCompartilhado} />

            <AvisoAConferir
                total={tela.contagemAConferir}
                ativo={conferindo}
                onRevisar={revisar}
                onConfirmarTodos={tela.confirmarTodosAConferir}
                podeConfirmarTodos={!convidado}
            />

            <TransacoesTabela
                barra={
                    <TransacoesToolbar
                        tela={tela}
                        campos={campos}
                        onImportar={convidado ? undefined : () => pedidos.setImportar(true)}
                        onExportar={convidado ? undefined : () => void exportar()}
                        exportando={exportando}
                    />
                }
                tela={tela}
                membros={membros}
                divide={currentWorkspace?.split_mode === "split"}
                onEditar={(t) => tela.detalhe.abrir(t, { editar: true })}
                onExcluir={tela.excluir}
                marcadas={marcadas}
                onMarcadasChange={setMarcadas}
            />

            <TransactionDetailSheet
                transaction={tela.detalhe.transacao}
                open={tela.detalhe.aberto != null}
                onOpenChange={(aberto) => {
                    if (!aberto) tela.detalhe.fechar()
                }}
                creditCards={tela.creditCards}
                categories={tela.categories}
                categoriesHref={ROUTES.DASHBOARD_CATEGORIES}
                creditCardsHref={ROUTES.CREDIT_CARDS}
                subscriptionsHref={ROUTES.SUBSCRIPTIONS}
                saving={tela.salvando}
                onSave={tela.salvar}
                onUpdateInstallmentPlan={tela.atualizarParcelada}
                launchInEditMode={tela.detalhe.editarAoAbrir}
                onLaunchEditConsumed={tela.detalhe.consumirEditar}
                onDelete={(t) => tela.excluir([t.id])}
                anterior={tela.detalhe.vizinhos.anterior}
                seguinte={tela.detalhe.vizinhos.seguinte}
                onNavegar={(t) => tela.detalhe.abrir(t)}
            />

            <ImportarExtratoDialog open={pedidos.importar} onOpenChange={pedidos.setImportar} onRevisar={revisar} />

            <ExcluirLancamentosDialog
                linhas={pendente?.linhas ?? []}
                pending={exclusao.excluindo}
                open={pendente != null}
                onOpenChange={(aberto) => {
                    if (!aberto) exclusao.cancelar()
                }}
                onConfirm={() => void exclusao.confirmar()}
            />
        </div>
    )
}
