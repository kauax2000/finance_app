"use client"

import { useCallback, useEffect, useState } from "react"
import { AvisoAConferir } from "@/components/transactions/aviso-a-conferir"
import { CompartilhadoAviso } from "@/components/transactions/compartilhado-aviso"
import { useDuplicarComoNova } from "@/components/transactions/global-transaction-create-provider"
import { ImportarExtratoDialog } from "@/components/transactions/importar/importar-extrato-dialog"
import { TransacoesTabela } from "@/components/transactions/transacoes-tabela"
import { MenuMaisAcoes, TransacoesToolbar } from "@/components/transactions/transacoes-toolbar"
import { TransactionDetailSheet } from "@/components/transactions/transaction-detail-sheet"
import { TransactionsPageSkeleton } from "@/components/transactions/transactions-page-skeleton"
import { useTransacoesDaTela } from "@/components/transactions/use-transacoes-da-tela"
import { useWorkspace } from "@/components/workspace-provider"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogList,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Card, CardMessage } from "@/components/ui/card"
import { MoneyDisplay } from "@/components/ui/money-display"
import { PageHeader, PageHeaderActions, PageHeaderTitle, PageHeaderTitleRow } from "@/components/ui/page-header"
import { ROUTES } from "@/config/navigation"
import { useIsMobile } from "@/hooks/use-mobile"
import { pedirDestinoDoCsv, salvarCsv } from "@/lib/data-table/csv"
import { numberBR } from "@/lib/formatters"
import { fetchTransacoesParaExportar } from "@/lib/queries/transacoes-filtradas"
import { useMemberDirectoryQuery } from "@/lib/queries/use-member-directory"
import { toastError, toastSuccess } from "@/lib/toast"
import { formatTransactionDayPtBr } from "@/lib/transaction-date"
import { transacoesParaCsv } from "@/lib/transactions/csv"
import { hasInstallmentDeleteImpact, INSTALLMENT_DELETE_WARNING } from "@/lib/transactions/delete-transactions"
import { mensagemDaExportacao, nomeDoCsv } from "@/lib/transactions/exportar-csv"

export default function TransactionsPageClient() {
    const tela = useTransacoesDaTela()
    const { estado, setEstado, pedidosDeAbertura: pedidos, exclusao } = tela
    const { campos } = tela
    const { currentWorkspaceId, currentWorkspace, papel, loading: workspaceLoading, error: workspaceError } = useWorkspace()
    const convidado = papel === "guest"
    const membros = useMemberDirectoryQuery(currentWorkspaceId).data ?? []
    const duplicar = useDuplicarComoNova()
    const isMobile = useIsMobile()
    const [exportando, setExportando] = useState(false)

    // A casca já abriu a criação do `?new=` e do `?frase=`: o pedido só se limpa.
    const { criar, frase, consumirPedido } = pedidos
    useEffect(() => {
        if (criar || frase) consumirPedido()
    }, [criar, frase, consumirPedido])

    const revisar = useCallback(
        () => setEstado({ filtros: [{ field: "conferir", operator: "is", values: [] }], sort: { key: "date", dir: "desc" } }),
        [setEstado],
    )
    const conferindo = estado.filtros.some((f) => f.field === "conferir")

    const exportar = async () => {
        if (!currentWorkspaceId || exportando) return
        const arquivo = nomeDoCsv(new Date())
        // O destino vem antes dos dados: o "Salvar como" exige o gesto do clique, e cancelar não busca nada.
        const destino = await pedirDestinoDoCsv(arquivo)
        if (!destino) return
        setExportando(true)
        try {
            const { transactions, truncado } = await fetchTransacoesParaExportar({
                workspaceId: currentWorkspaceId,
                estado,
                cartoes: tela.creditCards,
            })
            const nome = new Map(membros.map((m) => [m.user_id, m.full_name || m.email]))
            await salvarCsv(destino, arquivo, transacoesParaCsv(transactions, { nomeDoMembro: (id) => nome.get(id) ?? "" }))
            // Só depois de gravado (no "Salvar como") ou do download começar.
            toastSuccess(mensagemDaExportacao(transactions.length, truncado))
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
    const umaSo = pendente?.ids.length === 1 ? pendente.linhas[0] : undefined

    return (
        <div className="flex min-w-0 max-w-full flex-col gap-4">
            {/* No telefone o título é o da casca (`TituloDaTela`), e Importar e Exportar moram no ⋯ da barra. */}
            {isMobile ? null : (
                <PageHeader collapse>
                    <PageHeaderTitleRow>
                        <PageHeaderTitle asChild>
                            {/* O `<h1>` da página é o da barra do topo. */}
                            <p aria-hidden="true">Transações</p>
                        </PageHeaderTitle>
                    </PageHeaderTitleRow>
                    {/* Criar mora no "+ Adicionar" da barra lateral: o cabeçalho só importa e exporta. */}
                    {convidado ? null : (
                        <PageHeaderActions>
                            {/* Importar e Exportar são de vez em quando: moram no ⋯, o mesmo menu do telefone. */}
                            <MenuMaisAcoes
                                onImportar={() => pedidos.setImportar(true)}
                                onExportar={() => void exportar()}
                                exportando={exportando}
                            />
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
                onDuplicar={duplicar}
                onExcluir={tela.excluir}
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
                onDuplicar={duplicar}
            />

            <ImportarExtratoDialog open={pedidos.importar} onOpenChange={pedidos.setImportar} onRevisar={revisar} />

            <AlertDialog
                pending={exclusao.excluindo}
                open={pendente != null}
                onOpenChange={(aberto) => {
                    if (!aberto) exclusao.cancelar()
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {pendente && pendente.ids.length > 1
                                ? `Excluir ${numberBR(pendente.ids.length)} transações?`
                                : "Excluir transação?"}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            <p>Esta ação não pode ser desfeita.</p>
                            {pendente && hasInstallmentDeleteImpact(pendente.linhas) ? (
                                <p className="text-foreground">{INSTALLMENT_DELETE_WARNING}</p>
                            ) : null}
                            {umaSo ? (
                                <>
                                    <p className="text-foreground">Esta transação será removida do extrato.</p>
                                    <AlertDialogList>
                                        <li>
                                            {formatTransactionDayPtBr(umaSo.date)} —{" "}
                                            {umaSo.description || umaSo.category?.name || "Sem descrição"}
                                        </li>
                                        <li className="flex flex-wrap items-center gap-1 font-medium">
                                            {umaSo.type === "income" ? "Receita" : "Despesa"} de{" "}
                                            <MoneyDisplay value={Number(umaSo.amount)} size="sm" className="inline font-medium" />
                                        </li>
                                    </AlertDialogList>
                                </>
                            ) : pendente && pendente.ids.length > 1 ? (
                                <>
                                    <p className="text-foreground">
                                        As {numberBR(pendente.ids.length)} transações selecionadas serão removidas do
                                        extrato.
                                    </p>
                                    <AlertDialogList className="max-h-40 overflow-y-auto">
                                        {pendente.linhas.slice(0, 8).map((t) => (
                                            <li key={t.id}>
                                                {formatTransactionDayPtBr(t.date)} —{" "}
                                                {t.description || t.category?.name || "Sem descrição"}
                                            </li>
                                        ))}
                                        {pendente.ids.length > 8 ? (
                                            <li className="text-muted-foreground">
                                                e mais {numberBR(pendente.ids.length - 8)} …
                                            </li>
                                        ) : null}
                                    </AlertDialogList>
                                </>
                            ) : null}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel type="button">Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            pendingLabel="Excluindo…"
                            type="button"
                            onClick={(e) => {
                                e.preventDefault()
                                void exclusao.confirmar()
                            }}
                        >
                            Excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
