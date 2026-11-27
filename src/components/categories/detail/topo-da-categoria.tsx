import type { Comparacao, TipoDaCategoria } from "@/lib/categoria-detalhe"
import { Badge } from "@/components/ui/badge"
import { MoneyDisplay } from "@/components/ui/money-display"
import { Caption } from "@/components/ui/typography"
import { fraseDaComparacao, nomeDoMes, reaisInteiros } from "./regua-do-mes-contas"

/** O valor que sobe à barra depois do nome: sem centavos, para caber ao lado dele. */
export const valorCurto = (lancado: number) => reaisInteiros(lancado)

/** O miolo do `PageHeaderHero` do detalhe: o valor do mês e, embaixo, o mês com o chip da comparação. */
export function TopoDaCategoria({
    tipo,
    yearMonth,
    lancado,
    comparacao,
}: {
    tipo: TipoDaCategoria
    yearMonth: string
    lancado: number
    comparacao: Comparacao | null
}) {
    const frase = comparacao ? fraseDaComparacao({ tipo, comparacao }) : null
    return (
        <>
            <MoneyDisplay value={lancado} size="3xl" />
            <Caption>{`${tipo === "expense" ? "Gasto" : "Recebido"} em ${nomeDoMes(yearMonth)}`}</Caption>
            {frase ? (
                // A fileira de chips do topo da gaveta do lançamento: 12px abaixo da legenda (o `gap-1`
                // do herói mais o `mt-2`), centrada, com o mesmo `gap-2` entre chips.
                <div className="mt-2 flex flex-wrap justify-center gap-2">
                    <Badge variant="soft" tone="neutral" size="md">
                        {/* O tom da seta é o da `ReguaDoMes`: verde quando gastou menos ou recebeu mais. */}
                        <span className={frase.bom ? "text-success" : "text-destructive"}>
                            {`${frase.seta} ${frase.percentual}`}
                        </span>
                        <span className="text-muted-foreground">{` ${frase.texto} · ${frase.anterior}`}</span>
                    </Badge>
                </div>
            ) : null}
        </>
    )
}
