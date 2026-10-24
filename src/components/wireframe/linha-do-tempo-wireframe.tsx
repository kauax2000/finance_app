"use client"

import { useMemo } from "react"

import { SeguroParaGastarWireframe } from "@/components/wireframe/seguro-para-gastar-wireframe"
import { WireframeBox } from "@/components/wireframe/wireframe-box"
import { useWorkspace } from "@/components/workspace-provider"
import { labelYearMonthPt } from "@/lib/budget-month"
import { currencyBRL } from "@/lib/formatters"
import { projecaoMensal, seguroParaGastar } from "@/lib/previsao/fluxo"
import type { Projecao } from "@/lib/previsao/tipos"
import { usePrevisao } from "@/lib/previsao/use-previsao"

const celula = "border border-muted-foreground/40 px-2 py-1 text-left align-top"

/** Os próximos 6 meses no caixa (Bloco 5): o que entra, sai e sobra em cada um. */
export function LinhaDoTempoWireframe({ projecao }: { projecao: Projecao }) {
    return (
        <WireframeBox bloco={5} titulo="Linha do tempo">
            <p>Caixa: a fatura conta no mês em que vence. Não há saldo de partida: cada mês começa do zero.</p>
            <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                        <tr>
                            <th className={celula}>Mês</th>
                            <th className={celula}>Entra</th>
                            <th className={celula}>Sai</th>
                            <th className={celula}>Sobra</th>
                            <th className={celula}>Fim de</th>
                        </tr>
                    </thead>
                    <tbody>
                        {projecao.meses.map((m) => (
                            <tr key={m.ym}>
                                <td className={celula}>
                                    {labelYearMonthPt(m.ym)}
                                    {m.ym === projecao.primeiroMesNegativo ? (
                                        <strong className="block text-foreground">Primeiro mês no vermelho</strong>
                                    ) : null}
                                </td>
                                <td className={celula}>{currencyBRL(m.entra)}</td>
                                <td className={celula}>{currencyBRL(m.sai)}</td>
                                <td className={celula}>{currencyBRL(m.sobra)}</td>
                                <td className={celula}>
                                    {m.fimDeParcelamentos.length > 0
                                        ? `fim de: ${m.fimDeParcelamentos.map((f) => f.descricao).join(", ")}`
                                        : "—"}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </WireframeBox>
    )
}

/** A tela `/previsao`: o detalhe do seguro e a linha do tempo, da carteira aberta. */
export function PrevisaoWireframe() {
    const { currentWorkspaceId } = useWorkspace()
    const { dados, carregando, erro } = usePrevisao(currentWorkspaceId)
    const seguro = useMemo(() => (dados ? seguroParaGastar(dados) : null), [dados])
    const projecao = useMemo(() => (dados ? projecaoMensal(dados) : null), [dados])

    if (!seguro || !projecao) {
        return (
            <WireframeBox bloco={5} titulo="Previsão">
                {erro ? <p role="alert">{erro}</p> : <p>{carregando ? "Carregando…" : "Escolha uma carteira."}</p>}
            </WireframeBox>
        )
    }
    return (
        <div className="space-y-5">
            <SeguroParaGastarWireframe seguro={seguro} />
            <LinhaDoTempoWireframe projecao={projecao} />
        </div>
    )
}
