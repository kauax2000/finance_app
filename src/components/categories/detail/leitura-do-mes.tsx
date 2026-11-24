"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ChartSwatch } from "@/components/ui/chart"
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
 * A "Leitura do mês": o cartão de insight do detalhe da categoria. É a peça de marca da tela (a aurora, no humor do tom).
 * A forma N2 (`docs/design/painel/leitura-repaginada.html`): a manchete e o porquê numa frase, o mês seguinte como
 * número ao lado, e os motivos em pílulas com o botão que filtra a lista na mesma linha.
 */
export function LeituraDoMes({
    leitura,
    despesa,
    corDaSerie,
    onVer,
}: {
    leitura: Leitura
    despesa: boolean
    /** A cor da categoria: o ponto dos motivos do variável. */
    corDaSerie: string
    /** Filtra a lista de lançamentos da página pelo nome do grupo. */
    onVer?: (nome: string) => void
}) {
    const { manchete, apoio, motivos, sugestao } = leitura
    const grupo = sugestao?.grupo
    const ver = grupo && onVer ? () => onVer(grupo.nome) : null
    return (
        <Card variant="brand" glow="static" mood={HUMOR[leitura.tom]}>
            <CardContent className="grid gap-3.5">
                <div className="flex items-center justify-between gap-2">
                    <h2 className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span aria-hidden className="aurora-orb grid size-5.5 place-items-center text-2xs">
                            <span>✦</span>
                        </span>
                        Leitura do mês
                    </h2>
                    {grupo && ver ? (
                        <Button variant="tertiary" size="sm" className="-me-2" onClick={ver}>
                            Ver {grupo.nome}
                        </Button>
                    ) : null}
                </div>
                <p className="font-display text-xl text-pretty">
                    <Partes partes={manchete} />
                    {apoio.length ? (
                        <span className="text-muted-foreground">
                            {" — "}
                            <Partes partes={apoio} />
                        </span>
                    ) : null}
                </p>
                {motivos.length ? (
                    <div className="flex flex-wrap items-center gap-2">
                        {/* O delta na tinta `-muted-foreground` do tom: o `--warning` cheio sobre a pílula `muted` mede 1,6:1 no claro. */}
                        {motivos.map((m) => (
                            <Badge key={`${m.parte}-${m.chave ?? m.nome}`} tone="neutral" size="lg" className="max-w-full font-normal text-foreground">
                                <ChartSwatch color={m.parte === "variavel" ? corDaSerie : "var(--color-muted-foreground)"} />
                                <span className="min-w-0 truncate">{m.nome}</span>
                                {m.detalhe ? <span className="shrink-0 text-xs text-muted-foreground">{m.detalhe}</span> : null}
                                <span className={cn("nums shrink-0 font-mono font-semibold", (m.delta > 0) === despesa ? "text-warning-muted-foreground" : "text-success-muted-foreground")}>
                                    {m.delta > 0 ? "+" : "−"}
                                    {reaisInteiros(Math.abs(m.delta))}
                                </span>
                            </Badge>
                        ))}
                    </div>
                ) : null}
            </CardContent>
        </Card>
    )
}
