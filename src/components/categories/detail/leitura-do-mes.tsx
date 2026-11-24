"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ChartSwatch } from "@/components/ui/chart"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import type { LeituraDoMes as Leitura, ParteDaFrase } from "@/lib/composicao-do-mes"
import { cn } from "@/lib/utils"
import { reaisInteiros } from "./regua-do-mes-contas"

const TOM: Record<NonNullable<ParteDaFrase["tom"]>, string> = { success: "text-success", warning: "text-warning" }

/** O humor da aurora pelo tom da manchete: subiu é quente, melhorou é frio, o normal é o neutro. */
const HUMOR = { warning: "warm", success: "cool", info: "neutral" } as const

/** As partes da frase; o forte vai em `font-semibold` na tinta do texto, o tom só na cor. */
function Partes({ partes }: { partes: ParteDaFrase[] }) {
    return partes.map((p, i) => (
        <span key={i} className={cn(p.forte && "nums font-semibold text-foreground", p.tom && TOM[p.tom])}>
            {p.texto}
        </span>
    ))
}

/**
 * A "Leitura do mês": o cartão de insight do detalhe da categoria. É a peça de marca da tela (a aurora, no humor do tom);
 * a manchete na Ledger, até 2 motivos com régua e a sugestão do mês seguinte com o botão que filtra a lista.
 */
export function LeituraDoMes({
    leitura,
    despesa,
    corDaSerie,
    onVer,
}: {
    leitura: Leitura
    despesa: boolean
    /** A cor da categoria: a bolinha e a régua dos motivos do variável. */
    corDaSerie: string
    /** Filtra a lista de lançamentos da página pelo nome do grupo. */
    onVer?: (nome: string) => void
}) {
    const { manchete, apoio, motivos, sugestao } = leitura
    const maior = Math.abs(motivos[0]?.delta ?? 0)
    return (
        <Card variant="brand" glow="static" mood={HUMOR[leitura.tom]}>
            <CardContent className="grid gap-2">
                <h2 className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span aria-hidden className="aurora-orb grid size-7 place-items-center text-sm">
                        <span className="brand-rainbow bg-clip-text text-transparent">✦</span>
                    </span>
                    Leitura do mês
                </h2>
                <p className="font-display text-2xl text-balance">
                    <Partes partes={manchete} />
                </p>
                {apoio.length ? (
                    <p className="text-sm text-muted-foreground">
                        <Partes partes={apoio} />
                    </p>
                ) : null}
                {motivos.length ? (
                    <ul className="mt-2 grid grid-cols-[minmax(0,max-content)_minmax(3rem,1fr)_auto] items-center gap-x-3.5 gap-y-2 text-sm sm:grid-cols-[max-content_minmax(5rem,13.75rem)_auto]">
                        {motivos.map((m) => {
                            const cor = m.parte === "variavel" ? corDaSerie : "var(--color-muted-foreground)"
                            return (
                                <li key={`${m.parte}-${m.chave ?? m.nome}`} className="contents">
                                    <span className="flex min-w-0 items-center gap-2">
                                        <ChartSwatch color={cor} />
                                        <span className="truncate">{m.nome}</span>
                                        {m.detalhe ? <span className="shrink-0 text-xs text-muted-foreground">{m.detalhe}</span> : null}
                                    </span>
                                    <span aria-hidden>
                                        <Progress size="sm" value={Math.abs(m.delta)} max={maior} fillColor={cor} aria-label={m.nome} />
                                    </span>
                                    <span className={cn("nums text-right font-mono font-semibold", (m.delta > 0) === despesa ? "text-warning" : "text-success")}>
                                        {m.delta > 0 ? "+" : "−"}
                                        {reaisInteiros(Math.abs(m.delta))}
                                    </span>
                                </li>
                            )
                        })}
                    </ul>
                ) : null}
                {sugestao ? (
                    <>
                        <Separator className="mt-2" />
                        <div className="flex flex-col gap-3 pt-1 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                            <p>
                                {despesa ? "Com as compras no ritmo de sempre" : "Com as entradas avulsas no ritmo de sempre"}, {sugestao.mes} {despesa ? "fecha" : "deve entrar"} perto de{" "}
                                <span className="nums font-semibold text-foreground">{reaisInteiros(sugestao.valor)}</span>
                            </p>
                            {sugestao.grupo && onVer ? (
                                <Button variant="secondary" size="sm" className="max-sm:w-full" onClick={() => onVer(sugestao.grupo!.nome)}>
                                    Ver {sugestao.grupo.nome}
                                </Button>
                            ) : null}
                        </div>
                    </>
                ) : null}
            </CardContent>
        </Card>
    )
}
