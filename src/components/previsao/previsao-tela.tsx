"use client"

import { PlusIcon } from "@heroicons/react/16/solid"
import { useQueryClient } from "@tanstack/react-query"
import { useMemo, useState } from "react"

import { useQuickCreateTransaction } from "@/components/layout/quick-actions"
import { DeOndeVem } from "@/components/previsao/de-onde-vem"
import { FaturasAcimaDoNormal } from "@/components/previsao/faturas-acima-do-normal"
import { HeroiDoSeguro } from "@/components/previsao/heroi-do-seguro"
import { PrevisaoSkeleton } from "@/components/previsao/previsao-skeleton"
import { ProximosMeses } from "@/components/previsao/proximos-meses"
import { ReservaDialog } from "@/components/previsao/reserva-dialog"
import { SimuladorDeParcela } from "@/components/previsao/simulador-de-parcela"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardMessage } from "@/components/ui/card"
import {
    EmptyState,
    EmptyStateActions,
    EmptyStateDescription,
    EmptyStateGhost,
    EmptyStateTitle,
} from "@/components/ui/empty-state"
import { PageHeader, PageHeaderTitle } from "@/components/ui/page-header"
import { useWorkspace } from "@/components/workspace-provider"
import { useIsMobile } from "@/hooks/use-mobile"
import { faturasAcimaDoNormal } from "@/lib/previsao/fatura-alta"
import { projecaoMensal, seguroParaGastar } from "@/lib/previsao/fluxo"
import { gastoAcumuladoDoMes } from "@/lib/previsao/gasto-acumulado"
import type { DadosDaPrevisao } from "@/lib/previsao/tipos"
import { usePrevisao } from "@/lib/previsao/use-previsao"

/** Carteira nova: nenhuma transação, assinatura, plano, conta ou cartão. */
const semNada = (d: DadosDaPrevisao) =>
    d.transacoes.length + d.assinaturas.length + d.planos.length + d.contas.length + d.cartoes.length === 0

/** A tela `/previsao`: o seguro do mês, de onde ele vem, os próximos 6 meses e o simulador de parcela. */
export function PrevisaoTela() {
    const isMobile = useIsMobile()
    return (
        <div className="min-w-0 space-y-8">
            {/* No telefone o título é o da casca (`TituloDaTela`). */}
            {isMobile ? null : (
                <PageHeader collapse>
                    <PageHeaderTitle asChild>
                        {/* O `<h1>` da página é o da barra do topo. */}
                        <p aria-hidden="true">Previsão</p>
                    </PageHeaderTitle>
                </PageHeader>
            )}
            <Conteudo />
        </div>
    )
}

function Conteudo() {
    const { currentWorkspaceId, loading: carregandoCarteira } = useWorkspace()
    const { dados, carregando, erro } = usePrevisao(currentWorkspaceId)
    const queryClient = useQueryClient()
    const abrirLancamento = useQuickCreateTransaction()
    const [reservaAberta, setReservaAberta] = useState(false)

    const contas = useMemo(() => {
        if (!dados) return null
        const seguro = seguroParaGastar(dados)
        return {
            seguro,
            gasto: gastoAcumuladoDoMes(dados, seguro.ym),
            projecao: projecaoMensal(dados),
            faturasAltas: faturasAcimaDoNormal(dados),
            temReceitaRecorrente: dados.assinaturas.some((s) => s.kind === "income" && s.is_active),
        }
    }, [dados])

    if (erro) {
        return (
            <Card padding="none">
                <CardContent role="alert">
                    <EmptyState variant="plain">
                        <EmptyStateTitle>Não deu para carregar a previsão</EmptyStateTitle>
                        <EmptyStateDescription>{erro}</EmptyStateDescription>
                        <EmptyStateActions>
                            {/* Só as consultas que falharam voltam a buscar. */}
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() =>
                                    void queryClient.refetchQueries({ predicate: (q) => q.state.status === "error" })
                                }
                            >
                                Tentar de novo
                            </Button>
                        </EmptyStateActions>
                    </EmptyState>
                </CardContent>
            </Card>
        )
    }

    if (carregandoCarteira || carregando) return <PrevisaoSkeleton />
    // O vazio das telas sem carteira (o mesmo de Categorias).
    if (!currentWorkspaceId) {
        return (
            <Card>
                <CardMessage>
                    Nenhuma carteira selecionada. Escolha uma carteira no menu lateral para continuar.
                </CardMessage>
            </Card>
        )
    }
    if (!dados || !contas) return <PrevisaoSkeleton />

    if (semNada(dados)) {
        return (
            <Card padding="none">
                <CardContent role="status">
                    <EmptyState variant="plain" size="lg">
                        <EmptyStateGhost leading="tile" trailing="amount" />
                        <EmptyStateTitle>Ainda não há o que prever</EmptyStateTitle>
                        <EmptyStateDescription>
                            Lance o que entra e o que sai, e a previsão mostra quanto dá para gastar até o fim do mês.
                        </EmptyStateDescription>
                        <EmptyStateActions>
                            <Button type="button" variant="primary" onClick={() => abrirLancamento("expense")}>
                                <PlusIcon aria-hidden />
                                Adicionar lançamento
                            </Button>
                        </EmptyStateActions>
                    </EmptyState>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="grid min-w-0 gap-5">
            <HeroiDoSeguro
                seguro={contas.seguro}
                gasto={contas.gasto}
                temReceitaRecorrente={contas.temReceitaRecorrente}
            />
            <FaturasAcimaDoNormal faturas={contas.faturasAltas} />
            <div className="grid min-w-0 items-start gap-5 lg:grid-cols-2">
                <DeOndeVem seguro={contas.seguro} onEditarReserva={() => setReservaAberta(true)} />
                <ProximosMeses projecao={contas.projecao} />
            </div>
            <SimuladorDeParcela cartoes={dados.cartoes} hojeYmd={dados.hojeYmd} />
            <ReservaDialog open={reservaAberta} onOpenChange={setReservaAberta} />
        </div>
    )
}
