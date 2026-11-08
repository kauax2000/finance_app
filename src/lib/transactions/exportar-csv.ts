import { numberBR } from "@/lib/formatters"
import { LIMITE_DE_SOMA } from "@/lib/queries/transacoes-filtradas"
import { localYmdFromDate } from "@/lib/transaction-date"

/** `transacoes-AAAA-MM-DD.csv`, na data local (spec §11). */
export const nomeDoCsv = (hoje: Date) => `transacoes-${localYmdFromDate(hoje)}.csv`

/** O toast do Exportar: a contagem, ou o aviso do teto. */
export function mensagemDaExportacao(n: number, truncado: boolean): string {
    if (truncado) return `Exportados os primeiros ${numberBR(LIMITE_DE_SOMA)}`
    return n === 1 ? "1 lançamento exportado" : `${numberBR(n)} lançamentos exportados`
}
