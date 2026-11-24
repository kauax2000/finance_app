"use client"

import Link from "next/link"
import { CartaoDoGrafico } from "@/components/analise-do-mes/compartilhado"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ChartSplit, ChartSwatch, splitPercents, type ChartConfig } from "@/components/ui/chart"
import { serializeFilters } from "@/components/ui/filter-bar"
import { ItemContent } from "@/components/ui/item"
import { coresDasPessoas, identityIndexFor, identityToneFor } from "@/lib/avatar"
import { monthRangeYmd } from "@/lib/period-range"
import type { MemberDirectoryRow } from "@/lib/queries/use-member-directory"
import { cn, getInitials } from "@/lib/utils"
import { reaisInteiros } from "./regua-do-mes-contas"

/**
 * "Quem gastou": a barra dividida por pessoa, na cor do avatar, e a lista com a
 * fatia, a contagem e o valor, no desenho do "Como foi pago". Quem decide se aparece é a tela.
 */
export function QuemGastou({
    pessoas,
    diretorio,
    despesa,
    categoryId,
    yearMonth,
}: {
    pessoas: { userId: string; valor: number; compras: number }[]
    diretorio: MemberDirectoryRow[]
    despesa: boolean
    categoryId: string
    /** `AAAA-MM`: o mês que o "Ver em Transações" abre. */
    yearMonth: string
}) {
    const total = pessoas.reduce((a, p) => a + p.valor, 0)
    if (pessoas.length < 2 || total <= 0) return null

    const linhas = pessoas.map((p) => {
        const membro = diretorio.find((d) => d.user_id === p.userId)
        const nome = membro?.full_name || membro?.email?.split("@")[0] || "Ex-membro"
        const seed = membro?.email || nome
        return { ...p, membro, nome, tom: identityToneFor(membro?.avatar_color, seed), indice: identityIndexFor(membro?.avatar_color, seed) }
    })
    // Duas pessoas na mesma identidade: o cartão todo vai à rampa de série, para a barra separar as duas.
    const cores = coresDasPessoas(linhas.map((l) => l.indice))
    const config = Object.fromEntries(linhas.map((l, i) => [l.userId, { label: l.nome, color: cores[i] }])) satisfies ChartConfig
    // O mesmo arredondamento da barra, para a lista somar 100 com ela.
    const pcts = splitPercents(linhas.map((l) => l.valor))
    const unidade = despesa ? "compra" : "entrada"
    // Transações já filtrada: o mês, a categoria e quem lançou (o "Lançado por", com as pessoas do cartão).
    const [ano, mes] = yearMonth.split("-").map(Number)
    const periodo = monthRangeYmd({ year: ano, month: mes - 1 }, { year: ano, month: mes - 1 })
    const filtros = serializeFilters([
        { field: "periodo", operator: "is", values: [periodo.from, periodo.to] },
        { field: "categoria", operator: "is", values: [categoryId] },
        { field: "pessoa", operator: "is", values: pessoas.map((p) => p.userId) },
    ])
    const transacoes = `/transactions?type=${despesa ? "expense" : "income"}&f=${encodeURIComponent(filtros ?? "")}`

    return (
        <CartaoDoGrafico
            titulo={despesa ? "Quem gastou" : "Quem recebeu"}
            acao={
                <Button asChild variant="tertiary" size="sm" className="-me-2">
                    <Link href={transacoes}>Ver em Transações</Link>
                </Button>
            }
        >
            <div className="flex min-w-0 flex-col gap-2">
                <ChartSplit
                    labels="none"
                    config={config}
                    data={pessoas}
                    nameKey="userId"
                    dataKey="valor"
                    label={despesa ? "Gastos do mês por pessoa" : "Entradas do mês por pessoa"}
                />
                <ul className="mt-2 grid grid-cols-1 gap-3">
                    {linhas.map((l, i) => (
                        <li key={l.userId} className="flex items-center gap-3 text-sm">
                            <Avatar size="sm" className="shrink-0" aria-hidden>
                                {l.membro?.avatar_url ? <AvatarImage src={l.membro.avatar_url} alt="" /> : null}
                                <AvatarFallback className={cn("font-semibold", l.tom.surface, l.tom.ink)}>{getInitials(l.nome)}</AvatarFallback>
                            </Avatar>
                            {/* Nome e linha miúda são o mesmo dado em duas linhas: sem `gap`. */}
                            <ItemContent>
                                <span className="truncate">{l.nome}</span>
                                <span className="nums flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <ChartSwatch color={cores[i]} />
                                    <span>
                                        {pcts[i] === 0 && l.valor > 0 ? "<1" : pcts[i]}% · {l.compras} {unidade}
                                        {l.compras === 1 ? "" : "s"}
                                    </span>
                                </span>
                            </ItemContent>
                            <span className="nums shrink-0 font-mono font-semibold">{reaisInteiros(l.valor)}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </CartaoDoGrafico>
    )
}
