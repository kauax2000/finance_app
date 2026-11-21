"use client"

import { createElement, useMemo } from "react"
import { CreditCardBrandChip } from "@/components/credit-cards/credit-card-brand-chip"
import { ItemContent, ItemMedia } from "@/components/ui/item"
import { ChartDonut, ChartSplit, ChartSwatch, splitPercents, type ChartConfig } from "@/components/ui/chart"
import { Caption } from "@/components/ui/typography"
import { reaisInteiros } from "@/components/categories/detail/regua-do-mes-contas"
import { shiftYearMonth } from "@/lib/budget-month"
import { diferencaPorForma, type FatiaDePagamento } from "@/lib/categoria-detalhe"
import { currencyBRL } from "@/lib/formatters"
import { paymentMethodColor } from "@/lib/payment-methods"
import { paymentMethodIcon } from "@/lib/payment-method-icon"
import type { CreditCard } from "@/lib/supabase"
import { cn } from "@/lib/utils"
import { CartaoDoGrafico, diferencaDaForma, oQueSeMede } from "./compartilhado"
import { mesPorExtenso } from "./rotulos"

// A segunda forma do mesmo tipo (dois cartões de crédito) sai a 60% da cor, a terceira em diante a 35%.
const ESMAECER_A_REPETIDA = [100, 60, 35]

/** A divisão do mês por forma de pagamento, com a diferença contra o mês anterior; uma forma só vira a rosca. Some sem dado. */
export function ComoFoiPago({
    porPagamento,
    porPagamentoAnterior,
    cartoes,
    aberto,
    yearMonth,
    despesa,
    className,
}: {
    porPagamento: FatiaDePagamento[]
    /** A mesma divisão no mês anterior, para a diferença de cada forma. */
    porPagamentoAnterior: FatiaDePagamento[]
    /** Os cartões da carteira: a bandeira no miolo da rosca de uma forma só. */
    cartoes: Pick<CreditCard, "id" | "brand">[]
    aberto: boolean
    yearMonth: string
    despesa: boolean
    className?: string
}) {
    // Cada forma tem a sua cor fixa; pela chave, e não pelo nome, para a repetida esmaecer pela ordem do valor.
    const configPagamento = useMemo(() => {
        const vistas: Record<string, number> = {}
        return Object.fromEntries(
            porPagamento.map((f) => {
                const n = vistas[f.forma] ?? 0
                vistas[f.forma] = n + 1
                const pct = ESMAECER_A_REPETIDA[Math.min(n, ESMAECER_A_REPETIDA.length - 1)]
                const cor = paymentMethodColor(f.forma)
                return [f.chave, { label: f.nome, color: pct === 100 ? cor : `color-mix(in oklab, ${cor} ${pct}%, transparent)` }]
            }),
        ) satisfies ChartConfig
    }, [porPagamento])
    if (porPagamento.length === 0) return null

    const oQue = oQueSeMede(despesa)
    const mesAnterior = mesPorExtenso(shiftYearMonth(yearMonth, -1))
    // O mesmo arredondamento da barra, para o destaque e a lista baterem com ela.
    const pctsPagamento = splitPercents(porPagamento.map((f) => f.valor))
    // O ladrilho veste a cor da forma a 18% e o ícone a cor cheia; a repetida esmaece os dois, pela cor já esmaecida.
    const ladrilhoDaForma = (chave: string) => {
        const cor = configPagamento[chave].color
        return { backgroundColor: `color-mix(in oklab, ${cor} 18%, transparent)`, color: cor }
    }
    // Sem nada no mês anterior não há contra o que comparar: nenhuma forma é "nova".
    const diferencas = porPagamentoAnterior.length > 0 ? diferencaPorForma(porPagamento, porPagamentoAnterior) : null
    const formaUnica = porPagamento.length === 1 ? porPagamento[0] : null
    const maiorForma = porPagamento[0]
    // A preposição segue a da forma única: "em dinheiro", "sem forma de pagamento", "no <nome>".
    const ondeFoiPago = (f: FatiaDePagamento) =>
        f.forma === "sem-forma" ? "sem forma de pagamento" : f.forma === "cash" ? `em ${f.nome.toLocaleLowerCase("pt-BR")}` : `no ${f.nome}`
    const diferencaUnica = formaUnica && diferencas?.[formaUnica.chave] != null ? diferencaDaForma(diferencas[formaUnica.chave], despesa) : null

    return (
        <CartaoDoGrafico
            titulo="Como foi pago"
            apoio={!formaUnica && diferencas ? `vs ${mesAnterior}${aberto ? " inteiro" : ""}` : undefined}
            className={className}
        >
            {formaUnica ? (
                <div className="flex items-center gap-4">
                    <ChartDonut
                        rounded
                        legend={false}
                        tooltip={false}
                        config={configPagamento}
                        data={porPagamento}
                        nameKey="chave"
                        dataKey="valor"
                        className="size-30 shrink-0"
                        label={`${oQue} do mês por forma de pagamento: tudo no ${formaUnica.nome}`}
                        center={
                            <div
                                aria-hidden
                                className="pointer-events-none absolute inset-0 grid place-items-center"
                                style={{ color: configPagamento[formaUnica.chave].color }}
                            >
                                {formaUnica.forma === "credit_card" ? (
                                    <CreditCardBrandChip brand={cartoes.find((c) => c.id === formaUnica.cardId)?.brand ?? null} />
                                ) : (
                                    // `createElement`: o ícone vem de uma tabela, e não é um componente criado aqui.
                                    createElement(paymentMethodIcon(formaUnica.forma, "lg"), { className: "size-6" })
                                )}
                            </div>
                        }
                    />
                    {/* Nome, contagem e diferença são o mesmo dado em três linhas: sem `gap`. */}
                    <div className="min-w-0 flex-1 text-sm">
                        <p className="break-words">
                            {formaUnica.forma === "sem-forma" ? (
                                "Tudo sem forma de pagamento"
                            ) : (
                                <>
                                    {formaUnica.forma === "cash" ? "Tudo em" : "Tudo no"}{" "}
                                    <span className="font-semibold">{formaUnica.forma === "cash" ? formaUnica.nome.toLocaleLowerCase("pt-BR") : formaUnica.nome}</span>
                                </>
                            )}
                        </p>
                        <p className="nums text-muted-foreground">
                            {formaUnica.compras} {despesa ? "compra" : "entrada"}
                            {formaUnica.compras === 1 ? "" : "s"} · {currencyBRL(formaUnica.valor)}
                        </p>
                        {diferencaUnica ? (
                            <p className={cn("nums text-muted-foreground", diferencaUnica.classe)}>
                                {/* Contra o mês anterior inteiro; com o mês aberto, diz isso, porque o Ritmo ao lado compara no mesmo dia. */}
                                {diferencaUnica.texto === "igual" ? `igual a ${mesAnterior}${aberto ? " inteiro" : ""}` : `${diferencaUnica.texto} vs ${mesAnterior}${aberto ? " inteiro" : ""}`}
                            </p>
                        ) : null}
                    </div>
                </div>
            ) : (
                <div className="flex min-w-0 flex-col gap-2">
                    <div className="flex items-baseline justify-between gap-3">
                        <p className="min-w-0">
                            <span className="nums text-xl font-semibold">{pctsPagamento[0]}%</span>{" "}
                            <span className="text-sm text-muted-foreground">{ondeFoiPago(maiorForma)}</span>
                        </p>
                        <Caption className="nums shrink-0">{porPagamento.length} formas</Caption>
                    </div>
                    <ChartSplit
                        labels="none"
                        config={configPagamento}
                        data={porPagamento}
                        nameKey="chave"
                        dataKey="valor"
                        label={`${oQue} do mês por forma de pagamento`}
                    />
                    <ul className="mt-2 grid grid-cols-1 gap-3">
                        {porPagamento.map((f, i) => {
                            const d = diferencas ? diferencaDaForma(diferencas[f.chave], despesa) : null
                            return (
                                <li key={f.chave} className="flex items-center gap-3 text-sm">
                                    <ItemMedia variant="tile" style={ladrilhoDaForma(f.chave)}>
                                        {createElement(paymentMethodIcon(f.forma))}
                                    </ItemMedia>
                                    <ItemContent>
                                        <span className="truncate">{f.nome}</span>
                                        <span className="nums flex items-center gap-1.5 text-xs text-muted-foreground">
                                            <ChartSwatch color={configPagamento[f.chave].color} />
                                            <span>
                                                {pctsPagamento[i]}%
                                                {d ? (
                                                    <>
                                                        {" · "}
                                                        <span className={d.classe}>{d.texto}</span>
                                                    </>
                                                ) : null}
                                            </span>
                                        </span>
                                    </ItemContent>
                                    <span className="nums shrink-0 font-mono font-semibold">{reaisInteiros(f.valor)}</span>
                                </li>
                            )
                        })}
                    </ul>
                </div>
            )}
        </CartaoDoGrafico>
    )
}
