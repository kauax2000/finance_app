"use client"

import { useMemo } from "react"
import { ChartStrip } from "@/components/ui/chart"
import { reaisInteiros } from "@/components/categories/detail/regua-do-mes-contas"
import type { concentracaoDasCompras } from "@/lib/categoria-resumo"
import { currencyBRL } from "@/lib/formatters"
import { CartaoDoGrafico } from "./compartilhado"
import { diaDeMesPorExtenso, diaEMes } from "./rotulos"

/** Quantas compras fizeram 80% do mês, a fileira da maior para a menor e as duas maiores; some sem compra. */
export function TamanhoDasCompras({
    concentracao,
    corDaSerie,
    despesa,
    className,
}: {
    concentracao: ReturnType<typeof concentracaoDasCompras>
    /** A cor dos blocos em destaque (a do ladrilho, já resolvida). */
    corDaSerie: string
    despesa: boolean
    className?: string
}) {
    // A fileira: cada compra um bloco, da maior para a menor; o rabo acima de 40 vira "outras M compras".
    const blocos = useMemo(
        () => [
            ...concentracao.compras.map((c) => ({ id: c.id, valor: c.valor })),
            ...(concentracao.outras ? [{ id: "outras", valor: concentracao.outras.valor }] : []),
        ],
        [concentracao],
    )
    if (concentracao.quantidade === 0) return null

    const umaOuMais = (n: number) => `${n} ${despesa ? "compra" : "entrada"}${n === 1 ? "" : "s"}`
    const frase =
        concentracao.quantidade === 1
            ? { numero: umaOuMais(1), resto: "fez o mês inteiro" }
            : {
                  numero: `${concentracao.n80} de ${concentracao.quantidade}`,
                  resto: `${despesa ? "compras" : "entradas"} ${concentracao.n80 === 1 ? "fez" : "fizeram"} 80% do mês`,
              }
    const rotuloDoBloco = (id: unknown) => {
        if (id === "outras" && concentracao.outras) return `outras ${umaOuMais(concentracao.outras.quantidade)}`
        const c = concentracao.compras.find((x) => x.id === id)
        return c ? [c.descricao, diaDeMesPorExtenso(c.data)].filter(Boolean).join(" · ") : String(id)
    }
    const nomeDaFileira = `${frase.numero} ${frase.resto}. ${despesa ? "Maiores" : "Maiores entradas"}: ${concentracao.compras
        .slice(0, 3)
        .map((c) => `${c.descricao || diaDeMesPorExtenso(c.data)} ${currencyBRL(c.valor)}`)
        .join(", ")}.`

    return (
        <CartaoDoGrafico titulo={despesa ? "Tamanho das compras" : "Tamanho das entradas"} className={className}>
            <div className="flex flex-col gap-3">
                <p className="min-w-0">
                    <span className="nums text-xl font-semibold">{frase.numero}</span>{" "}
                    <span className="text-sm text-muted-foreground">{frase.resto}</span>
                </p>
                <div>
                    <ChartStrip
                        data={blocos}
                        nameKey="id"
                        dataKey="valor"
                        color={corDaSerie}
                        highlight={Math.min(concentracao.n80, concentracao.compras.length)}
                        labelText={rotuloDoBloco}
                        label={nomeDaFileira}
                    />
                    <div aria-hidden className="mt-1.5 flex justify-between text-xs text-muted-foreground">
                        <span>maiores</span>
                        <span>menores</span>
                    </div>
                </div>
                {/* As maiores, as mesmas em destaque na fileira (até 2): o cartão diz o que foi a compra grande. */}
                <ul className="grid grid-cols-1 gap-2.5 border-t border-border pt-3">
                    {concentracao.compras.slice(0, Math.min(2, concentracao.n80)).map((c) => (
                        <li key={c.id} className="flex items-center justify-between gap-3 text-sm">
                            {/* Descrição e data são o mesmo dado em duas linhas: sem `gap`. */}
                            <span className="min-w-0">
                                <span className="block truncate">{c.descricao || diaDeMesPorExtenso(c.data)}</span>
                                <span className="block text-xs text-muted-foreground">{diaEMes(c.data)}</span>
                            </span>
                            <span className="nums shrink-0 font-mono font-semibold">{reaisInteiros(c.valor)}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </CartaoDoGrafico>
    )
}
