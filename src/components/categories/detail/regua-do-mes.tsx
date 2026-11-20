"use client"

import type { ReactNode } from "react"
import {
    DescriptionDetails,
    DescriptionHint,
    DescriptionList,
    DescriptionListItem,
    DescriptionTerm,
} from "@/components/ui/description-list"
import { MoneyDisplay } from "@/components/ui/money-display"
import { PageSection } from "@/components/ui/page-section"
import { Progress } from "@/components/ui/progress"
import { Caption, Muted } from "@/components/ui/typography"
import type { Comparacao, TipoDaCategoria } from "@/lib/categoria-detalhe"
import { currencyBRL, percentBR } from "@/lib/formatters"
import { paymentMethodLabel } from "@/lib/payment-methods"
import type { Transaction } from "@/lib/supabase"
import { cn } from "@/lib/utils"
import { escalaDaRegua, fraseDaComparacao, nomeDoMes, reaisInteiros, vereditoDaMedia } from "./regua-do-mes-contas"
import { BarraDoMes, frasesDoLimite } from "./resumo-do-mes"

export type FaixaDoMesProps = {
    tipo: TipoDaCategoria
    yearMonth: string
    aberto: boolean
    hojeYmd: string
    lancado: number
    previsto: number
    limite: number | null
    /** Fração (0–1) do gasto ou da receita da carteira no mês. */
    pesoNoTotal: number | null
    comparacao: Comparacao
    media: number | null
    quantidade: number
    /** O maior lançamento do mês, com `payment_card` anexado. */
    maior: Transaction | null
}

/** O valor, a comparação com o mês anterior, a régua (limite ou média) e o veredito. */
export function ReguaDoMes({
    fatosNaLinha,
    sufixo,
    children,
    ...props
}: FaixaDoMesProps & {
    /** Os fatos à direita da linha do valor (1C). */
    fatosNaLinha?: ReactNode
    /** O fim do veredito, depois de " · " (1C: a média por lançamento). */
    sufixo?: string | null
    /** O que vem depois do veredito (1A: os fatos em colunas). */
    children?: ReactNode
}) {
    const { tipo, yearMonth, lancado, previsto, limite, comparacao, media } = props
    const despesa = tipo === "expense"
    const mes = nomeDoMes(yearMonth)
    const frase = fraseDaComparacao({ tipo, comparacao })
    const comLimite = despesa && limite != null && limite > 0
    const escala = escalaDaRegua({ lancado, media, anterior: comparacao.anterior })
    const marcador = !comLimite && media != null ? escala.marcador : null

    const limiteFrases = comLimite ? frasesDoLimite(lancado, previsto, limite) : null
    const veredito = [
        ...(limiteFrases ? [limiteFrases.principal, limiteFrases.aviso] : [vereditoDaMedia(lancado, media)]),
        sufixo,
    ]
        .filter(Boolean)
        .join(" · ")

    const valor = (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <MoneyDisplay value={lancado} size="3xl" />
            {frase ? (
                <Muted>
                    <span className={frase.bom ? "text-success" : "text-destructive"}>
                        {`${frase.seta} ${frase.percentual}`}
                    </span>{" "}
                    {frase.resto}
                </Muted>
            ) : null}
        </div>
    )

    return (
        <PageSection aria-label={`Resumo de ${mes}`}>
            <div className="grid gap-5">
                <div className="grid gap-3">
                    <Caption>{`${despesa ? "Gasto" : "Recebido"} em ${mes}`}</Caption>
                    {fatosNaLinha ? (
                        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
                            {valor}
                            {fatosNaLinha}
                        </div>
                    ) : (
                        valor
                    )}
                </div>
                <div className="mt-5">
                    {marcador != null ? (
                        <div className="relative mb-8">
                            <Progress
                                value={Math.max(0, lancado)}
                                max={escala.max}
                                marker={marcador}
                                aria-label={`${currencyBRL(lancado)} em ${mes}, contra a média de ${currencyBRL(media ?? 0)}`}
                            />
                            <Caption
                                aria-hidden="true"
                                className={cn(
                                    "absolute top-full mt-2 whitespace-nowrap",
                                    // Perto das bordas o rótulo encosta no traço por dentro, para não vazar.
                                    marcador < 8 ? "" : marcador > 92 ? "-translate-x-full" : "-translate-x-1/2",
                                )}
                                style={{ insetInlineStart: `${marcador}%` }}
                            >
                                {`média de 6 meses ${reaisInteiros(media ?? 0)}`}
                            </Caption>
                        </div>
                    ) : (
                        <BarraDoMes {...props} className="mb-3" />
                    )}
                    {veredito ? <Muted>{veredito}</Muted> : null}
                </div>
                {children}
            </div>
        </PageSection>
    )
}

/** Os fatos do mês: em quatro colunas com fio (1A) ou em linha, sem a média por lançamento (1C). */
export function FatosDoMes({
    tipo,
    lancado,
    pesoNoTotal,
    quantidade,
    maior,
    layout,
}: FaixaDoMesProps & { layout: "colunas" | "linha" }) {
    const despesa = tipo === "expense"
    const forma = maior ? (maior.payment_card?.name ?? paymentMethodLabel(maior.payment_method)) : ""
    const fatos: { termo: string; valor: ReactNode; dica?: string }[] = [
        { termo: "Lançamentos", valor: quantidade },
        ...(maior
            ? [{ termo: despesa ? "Maior gasto" : "Maior entrada", valor: <MoneyDisplay value={Number(maior.amount)} size="lg" />, dica: forma }]
            : []),
        ...(layout === "colunas" && quantidade > 0
            ? [{ termo: "Média por lançamento", valor: <MoneyDisplay value={lancado / quantidade} size="lg" /> }]
            : []),
        ...(pesoNoTotal != null && lancado !== 0
            ? [
                  {
                      termo: despesa ? "Do gasto da carteira" : "Da receita da carteira",
                      valor: percentBR(pesoNoTotal, { maximumFractionDigits: 0 }),
                  },
              ]
            : []),
    ]
    const colunas = layout === "colunas"

    return (
        <DescriptionList className={colunas ? "flex-row gap-0" : "flex-row gap-9"}>
            {fatos.map((f, i) => (
                <DescriptionListItem
                    key={f.termo}
                    className={colunas ? cn("flex-1", i > 0 && "border-s border-border ps-6") : undefined}
                >
                    <DescriptionTerm>{f.termo}</DescriptionTerm>
                    <DescriptionDetails size="lg" className="font-mono font-semibold">
                        {f.valor}
                        {colunas && f.dica ? <DescriptionHint className="font-sans">{f.dica}</DescriptionHint> : null}
                    </DescriptionDetails>
                </DescriptionListItem>
            ))}
            {/* 1A guarda as quatro colunas mesmo quando um fato some. */}
            {colunas ? Array.from({ length: Math.max(0, 4 - fatos.length) }, (_, i) => <div key={i} className="flex-1" />) : null}
        </DescriptionList>
    )
}
