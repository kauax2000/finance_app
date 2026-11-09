import type { CicloFatura, ConferenciaNoCiclo } from "@/lib/fatura/ciclo"
import type { LancamentoParaConferir } from "@/lib/fatura/conferir"
import { sugerirCorrecoes } from "@/lib/fatura/correcoes"
import type { ItemImportavel } from "@/lib/import/importar"
import { roundCents } from "@/lib/money-brl"
import type { CreditCardStatementTotal } from "@/lib/supabase"

/** Despesa soma, receita e estorno abatem; só o que cai dentro do ciclo. */
export function somaDoCiclo(app: LancamentoParaConferir[], ciclo: CicloFatura): number {
    let s = 0
    for (const l of app) {
        if (l.date < ciclo.inicio || l.date > ciclo.fechamento) continue
        s += l.type === "income" ? -l.amount : l.amount
    }
    return roundCents(s)
}

/** Nada a corrigir e nada sobrando no app. */
export function semDiferencas(conf: ConferenciaNoCiclo<ItemImportavel>, ciclo: CicloFatura): boolean {
    return conf.soNoApp.length === 0 && sugerirCorrecoes(conf, ciclo).length === 0
}

export type EstadoDaFatura =
    | { tipo: "sem-total" }
    | { tipo: "a-conferir"; diferenca: number }
    | { tipo: "igual" }
    | { tipo: "aprovada"; em: string }
    | { tipo: "mudou-depois"; diferenca: number; em: string }

export function estadoDaFatura(total: CreditCardStatementTotal | null, somaApp: number): EstadoDaFatura {
    if (!total) return { tipo: "sem-total" }
    const diferenca = roundCents(Number(total.bank_total) - somaApp)
    if (total.approved_at) {
        return diferenca === 0
            ? { tipo: "aprovada", em: total.approved_at }
            : { tipo: "mudou-depois", diferenca, em: total.approved_at }
    }
    return diferenca === 0 ? { tipo: "igual" } : { tipo: "a-conferir", diferenca }
}
