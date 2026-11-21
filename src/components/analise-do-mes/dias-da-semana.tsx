"use client"

import { ChartHeatStrip } from "@/components/ui/chart"
import { reaisInteiros } from "@/components/categories/detail/regua-do-mes-contas"
import { diasUteisEFimDeSemana, type porDiaDaSemana } from "@/lib/categoria-resumo"
import { cn } from "@/lib/utils"
import { CartaoDoGrafico } from "./compartilhado"
import { diaPorExtenso } from "./rotulos"

/** Os dias úteis contra o fim de semana e a fileira de calor dos sete dias; some sem gasto em dia nenhum. */
export function DiasDaSemana({
    diasDaSemana,
    corDaSerie,
    despesa,
    className,
}: {
    diasDaSemana: ReturnType<typeof porDiaDaSemana>
    /** A cor do calor (a do ladrilho, já resolvida). */
    corDaSerie: string
    despesa: boolean
    className?: string
}) {
    if (!diasDaSemana.some((d) => d.total > 0)) return null
    const lados = diasUteisEFimDeSemana(diasDaSemana)

    return (
        <CartaoDoGrafico titulo="Dias da semana" className={className}>
            <div className="flex flex-col gap-4">
                <div className="flex gap-4">
                    {(
                        [
                            ["dias úteis", lados.uteis, lados.uteis.total >= lados.fim.total],
                            ["fim de semana", lados.fim, lados.fim.total > lados.uteis.total],
                        ] as const
                    ).map(([nome, lado, maior]) => (
                        // O % e a legenda são o mesmo dado em duas linhas: sem `gap`.
                        <div key={nome} className="min-w-0">
                            <p className={cn("nums text-xl font-semibold", !maior && "text-muted-foreground")}>{lado.pct}%</p>
                            <p className="nums text-sm text-muted-foreground">
                                {nome} <span className="whitespace-nowrap">· {reaisInteiros(lado.total)}</span>
                            </p>
                        </div>
                    ))}
                </div>
                <ChartHeatStrip
                    data={diasDaSemana}
                    nameKey="nome"
                    dataKey="total"
                    color={corDaSerie}
                    labelText={diaPorExtenso}
                    label={`${despesa ? "Gasto" : "Entradas"} do mês por dia da semana`}
                />
            </div>
        </CartaoDoGrafico>
    )
}
