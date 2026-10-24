/**
 * Os textos de preço, sem hook nem cliente do Supabase: a página pública
 * `/precos` é de servidor e os importa daqui; `plano.ts` os re-exporta.
 */
import { currencyBRL } from "@/lib/formatters"
import { FIM_FUNDADORES } from "../../../supabase/functions/_shared/plano"

export const doze = (centavos: number) => `12x de ${currencyBRL(centavos / 1200)}`

export const porAno = (centavos: number) => `${currencyBRL(centavos / 100)}/ano`

/** O último dia da oferta de fundadores, em Brasília: `FIM_FUNDADORES` é a meia-noite seguinte. */
export const ultimoDiaDosFundadores = () =>
    new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", year: "numeric" }).format(
        Date.parse(FIM_FUNDADORES) - 1,
    )
