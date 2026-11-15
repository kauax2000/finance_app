"use client"

import Link from "next/link"
import { useMemo } from "react"

import { WireframeBox } from "@/components/wireframe/wireframe-box"
import { ROUTES } from "@/config/navigation"
import { currencyBRL } from "@/lib/formatters"
import { seguroParaGastar } from "@/lib/previsao/fluxo"
import type { Seguro } from "@/lib/previsao/tipos"
import { usePrevisao } from "@/lib/previsao/use-previsao"
import { localYmdFromDate } from "@/lib/transaction-date"

const link = "text-foreground underline"
const REGIME = "Caixa: o dinheiro que sai neste mês. A fatura conta no mês em que vence."

/** O "seguro para gastar" do mês corrente (Bloco 5), compacto: o cartão do Painel. */
export function SeguroParaGastarWireframe({ seguro }: { seguro: Seguro }) {
    return (
        <WireframeBox bloco={5} titulo="Seguro para gastar">
            <p className="text-base text-foreground">
                Seguro para gastar: <strong>{currencyBRL(seguro.seguro)}</strong>
            </p>
            <p>
                {currencyBRL(seguro.porDia)} por dia ({seguro.diasRestantes} dias, contando hoje)
            </p>
            <p>{REGIME}</p>
            <Link href={ROUTES.PREVISAO} className={link}>
                Ver a previsão
            </Link>
        </WireframeBox>
    )
}

/** O cartão compacto do Painel: só no mês de hoje, porque a previsão é do mês corrente. */
export function SeguroDoPainelWireframe({ workspaceId, calendarYm }: { workspaceId: string | null; calendarYm: string }) {
    const mesCorrente = calendarYm === localYmdFromDate(new Date()).slice(0, 7)
    const { dados, carregando, erro } = usePrevisao(mesCorrente ? workspaceId : null)
    const seguro = useMemo(() => (dados ? seguroParaGastar(dados) : null), [dados])

    if (mesCorrente && seguro) return <SeguroParaGastarWireframe seguro={seguro} />
    return (
        <WireframeBox bloco={5} titulo="Seguro para gastar">
            {!mesCorrente ? <p>A previsão é do mês corrente.</p> : null}
            {mesCorrente && erro ? <p role="alert">{erro}</p> : null}
            {mesCorrente && !erro && carregando ? <p>Carregando…</p> : null}
            <Link href={ROUTES.PREVISAO} className={link}>
                Ver a previsão
            </Link>
        </WireframeBox>
    )
}
