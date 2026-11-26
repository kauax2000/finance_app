import type { Comparacao, TipoDaCategoria } from "@/lib/categoria-detalhe"
import { MoneyDisplay } from "@/components/ui/money-display"
import { Caption } from "@/components/ui/typography"
import { fraseDaComparacao, nomeDoMes, reaisInteiros } from "./regua-do-mes-contas"

/** O valor que sobe à barra depois do nome: sem centavos, para caber ao lado dele. */
export const valorCurto = (lancado: number) => reaisInteiros(lancado)

/** O miolo do `PageHeaderHero` do detalhe: o valor do mês e, embaixo, o mês com a comparação. */
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
            <Caption>
                {`${tipo === "expense" ? "Gasto" : "Recebido"} em ${nomeDoMes(yearMonth)}`}
                {frase ? (
                    <>
                        {" · "}
                        {/* O tom da seta é o da `ReguaDoMes`: verde quando gastou menos ou recebeu mais. */}
                        <span className={frase.bom ? "text-success" : "text-destructive"}>
                            {`${frase.seta} ${frase.percentual}`}
                        </span>{" "}
                        {frase.resto}
                    </>
                ) : null}
            </Caption>
        </>
    )
}
