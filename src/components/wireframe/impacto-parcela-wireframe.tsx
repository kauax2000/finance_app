"use client"

import { useMemo } from "react"

import { WireframeBox } from "@/components/wireframe/wireframe-box"
import { useWorkspace } from "@/components/workspace-provider"
import { currencyBRL } from "@/lib/formatters"
import {
    impactoDaParcela,
    impactoDoPlano,
    mesCurto,
    type Impacto,
    type PlanoProposto,
} from "@/lib/previsao/impacto-parcela"
import { usePrevisao } from "@/lib/previsao/use-previsao"
import { formatDatePtBr } from "@/lib/transaction-date"

const TITULO = "Impacto da parcela"

/** As seis linhas da spec §10 (P12). Sem cartão, nem faturas nem limite. */
export function ImpactoParcelaWireframe({ impacto }: { impacto: Impacto }) {
    const { pico, proximasFaturas, percentualDaRenda, primeiroMesNegativo, limite } = impacto
    return (
        <WireframeBox bloco={5} titulo={TITULO}>
            <ul className="space-y-1">
                <li>
                    Parcela: <strong className="text-foreground">{impacto.parcelaEFim}</strong>
                </li>
                <li>
                    Pico de parcelas num mês: {currencyBRL(pico.semEsta)} sem esta → {currencyBRL(pico.comEsta)} com
                    esta ({mesCurto(pico.mes)}, pelo mês da cobrança)
                </li>
                {proximasFaturas ? (
                    <li>
                        Próximas faturas (prevista, antes → depois):
                        <ul className="pl-3">
                            {proximasFaturas.map((f) => (
                                <li key={f.closeYmd}>
                                    Fecha {formatDatePtBr(f.closeYmd)}: {currencyBRL(f.antes)} → {currencyBRL(f.depois)}
                                </li>
                            ))}
                        </ul>
                    </li>
                ) : null}
                <li>
                    Da renda recorrente com parcelas:{" "}
                    {percentualDaRenda != null ? `${percentualDaRenda}% no pico` : "sem receita recorrente cadastrada"}
                </li>
                <li>
                    Primeiro mês com o seguro para gastar negativo (caixa, 6 meses):{" "}
                    {primeiroMesNegativo.antes ? mesCurto(primeiroMesNegativo.antes) : "nenhum"} →{" "}
                    {primeiroMesNegativo.depois ? mesCurto(primeiroMesNegativo.depois) : "nenhum"}
                </li>
                {limite.motivo === "sem_limite" ? <li>Limite do cartão: Sem limite cadastrado</li> : null}
                {limite.disponivel != null ? (
                    <li>Limite disponível (já descontadas as parcelas futuras): {currencyBRL(limite.disponivel)}</li>
                ) : null}
            </ul>
            {limite.cabe === false ? (
                <p role="alert" className="font-bold text-foreground">
                    Não cabe no limite do cartão
                </p>
            ) : null}
        </WireframeBox>
    )
}

/**
 * Carrega a previsão da carteira e mostra o quadro: `proposto` é a compra ainda não salva
 * (formulário, frase); `planoId`, o plano ativo de um lançamento parcelado (detalhe).
 */
export function ImpactoDaParcela(
    props: { proposto: PlanoProposto; planoId?: never } | { planoId: string; proposto?: never },
) {
    const { currentWorkspaceId } = useWorkspace()
    const { dados, carregando, erro } = usePrevisao(currentWorkspaceId)
    const { proposto, planoId } = props
    const impacto = useMemo(() => {
        if (!dados) return null
        if (proposto) return impactoDaParcela(proposto, dados)
        const salvo = dados.planos.find((p) => p.id === planoId && p.is_active)
        return salvo ? impactoDoPlano(salvo, dados) : undefined
    }, [dados, proposto, planoId])

    // Plano encerrado (ou de outra carteira): não há o que prever.
    if (impacto === undefined) return null
    if (impacto) return <ImpactoParcelaWireframe impacto={impacto} />
    return (
        <WireframeBox bloco={5} titulo={TITULO}>
            <p role="status">{erro ?? (carregando ? "Calculando o impacto…" : "Sem dados da previsão.")}</p>
        </WireframeBox>
    )
}
