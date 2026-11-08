import type { Transaction } from "@/lib/supabase"
import { paymentMethodLabel } from "@/lib/payment-methods"
import { formatTransactionDmyPtBr } from "@/lib/transaction-date"

const CABECALHO = "data;descrição;categoria;tipo;valor;forma;cartão;lançado por;a conferir"

/** Aspas só quando preciso: `;`, aspas ou quebra de linha. */
const celula = (v: string) => (/[;"\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v)

const valor = (t: Transaction) => {
    const n = Number(t.amount).toFixed(2).replace(".", ",")
    return t.type === "expense" ? `-${n}` : n
}

/** CSV do Excel em português: `;`, vírgula decimal, BOM no começo. */
export function transacoesParaCsv(
    rows: Transaction[],
    ctx: { nomeDoMembro: (userId: string) => string },
): string {
    const linhas = rows.map((t) =>
        [
            formatTransactionDmyPtBr(t.date),
            t.description ?? "",
            t.category?.name ?? "",
            t.type === "expense" ? "despesa" : "receita",
            valor(t),
            paymentMethodLabel(t.payment_method),
            t.payment_card?.name ?? "",
            ctx.nomeDoMembro(t.user_id),
            t.needs_review ? "sim" : "não",
        ]
            .map(celula)
            .join(";"),
    )
    return "\uFEFF" + [CABECALHO, ...linhas].join("\n")
}
