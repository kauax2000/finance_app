"use client"

import type { ReactNode } from "react"
import {
    DescriptionDetails,
    DescriptionList,
    DescriptionListItem,
    DescriptionTerm,
} from "@/components/ui/description-list"
import { MoneyDisplay } from "@/components/ui/money-display"
import { PageSection } from "@/components/ui/page-section"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Caption, Muted } from "@/components/ui/typography"
import type { Comparacao, TipoDaCategoria } from "@/lib/categoria-detalhe"
import { currencyBRL, percentBR } from "@/lib/formatters"
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
    // Sem limite, a régua leva a legenda nas pontas (o veredito à esquerda, a média à direita),
    // como uma régua; com limite, a frase do limite segue embaixo.
    const vereditoDaMediaTexto = vereditoDaMedia(lancado, media)
    const [vereditoForte, vereditoResto] = partirVeredito(vereditoDaMediaTexto)
    const despesaAcima = despesa ? "text-warning" : "text-success"
    const despesaAbaixo = despesa ? "text-success" : "text-warning"
    const tomDoVeredito = vereditoDaMediaTexto?.includes("acima") ? despesaAcima : vereditoDaMediaTexto?.includes("abaixo") ? despesaAbaixo : undefined
    const veredito = [...(limiteFrases ? [limiteFrases.principal, limiteFrases.aviso] : []), sufixo]
        .filter(Boolean)
        .join(" · ")

    const valor = (
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
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
            {/* Na tela larga (2xl, 1536px) os fatos saem da linha do valor e vão para a linha da
                barra, à direita, centrados nela: a barra para antes deles e não atravessa a tela
                inteira. A cópia escondida é `display: none`, então o leitor de tela lê os fatos uma vez só. */}
            <div className="grid min-w-0 gap-4">
                <div className="grid gap-3">
                    <Caption>{`${despesa ? "Gasto" : "Recebido"} em ${mes}`}</Caption>
                    {fatosNaLinha ? (
                        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
                            {valor}
                            <div className="2xl:hidden">{fatosNaLinha}</div>
                        </div>
                    ) : (
                        valor
                    )}
                </div>
                <div>
                    <div className={cn("2xl:flex 2xl:items-center 2xl:gap-12", "mb-3")}>
                        {marcador != null ? (
                            <div className="relative min-w-0 2xl:flex-1">
                                <div className="mb-2 flex items-baseline justify-between gap-4">
                                    {vereditoDaMediaTexto ? (
                                        <Caption>
                                            <span className={tomDoVeredito}>{vereditoForte}</span>
                                            {vereditoResto}
                                        </Caption>
                                    ) : (
                                        <span />
                                    )}
                                    <Caption>{`média de 6 meses ${reaisInteiros(media ?? 0)}`}</Caption>
                                </div>
                                <div className="relative">
                                <Progress
                                    value={Math.max(0, lancado)}
                                    max={escala.max}
                                    aria-label={`${currencyBRL(lancado)} em ${mes}, contra a média de ${currencyBRL(media ?? 0)}`}
                                />
                                {/* O traço da média passa da barra e leva um anel da cor do fundo: o `marker` do
                                    `Progress` mora dentro do trilho e some sobre a parte cheia. */}
                                <span
                                    aria-hidden="true"
                                    className="absolute -top-1.5 h-5 w-0.5 -translate-x-1/2 rounded-full bg-muted-foreground ring-2 ring-background"
                                    style={{ insetInlineStart: `${marcador}%` }}
                                />
                                </div>
                            </div>
                        ) : (
                            <BarraDoMes {...props} className="min-w-0 2xl:flex-1" />
                        )}
                        {fatosNaLinha ? (
                            <div className="hidden shrink-0 items-center gap-12 2xl:flex">
                                <Separator orientation="vertical" className="h-12" />
                                {fatosNaLinha}
                            </div>
                        ) : null}
                    </div>
                    {veredito ? <Muted>{veredito}</Muted> : null}
                </div>
                {children}
            </div>
        </PageSection>
    )
}

/** Os fatos do mês, em linha: lançamentos, a média por lançamento, o maior e o peso na carteira. */
export function FatosDoMes({ tipo, lancado, pesoNoTotal, quantidade, maior }: FaixaDoMesProps) {
    const despesa = tipo === "expense"
    const fatos: { termo: string; valor: ReactNode }[] = [
        { termo: "Lançamentos", valor: quantidade },
        ...(quantidade > 0 ? [{ termo: "Por lançamento", valor: <MoneyDisplay value={lancado / quantidade} size="lg" /> }] : []),
        ...(maior
            ? [{ termo: despesa ? "Maior gasto" : "Maior entrada", valor: <MoneyDisplay value={Number(maior.amount)} size="lg" /> }]
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

    return (
        <DescriptionList className="flex-row gap-9">
            {fatos.map((f) => (
                <DescriptionListItem key={f.termo}>
                    <DescriptionTerm>{f.termo}</DescriptionTerm>
                    <DescriptionDetails size="lg" className="font-mono font-semibold">
                        {f.valor}
                    </DescriptionDetails>
                </DescriptionListItem>
            ))}
        </DescriptionList>
    )
}

/** "5% acima da sua média" → ["5% acima", " da sua média"]: a parte forte leva o tom. */
function partirVeredito(texto: string | null): [string, string] {
    if (!texto) return ["", ""]
    const i = texto.indexOf(" da sua média")
    return i > 0 ? [texto.slice(0, i), texto.slice(i)] : [texto, ""]
}
