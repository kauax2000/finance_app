import { lerData, lerValorBr } from "./normalizar"
import type { ItemBanco } from "./tipos"

/**
 * Pagamento da fatura, no OFX e no texto da fatura: não é compra nem estorno.
 * A palavra não encosta em letra (`\p{L}`, e não `\b`, que é só ASCII e deixava
 * passar `PGTO123` e `PAGTO_FATURA`); a exceção é `FATURA` colada (`PAGTOFATURA`).
 * "XYZ PAGAMENTOS LTDA" é loja e fica.
 */
export const PAGAMENTO = /(?<!\p{L})(pagamento|pgto|pagto)(?=fatura|(?!\p{L}))/iu

function campo(bloco: string, tag: string): string {
    const m = new RegExp(`<${tag}>([^<\\r\\n]*)`, "i").exec(bloco)
    return m ? m[1].trim() : ""
}

/**
 * Blocos `<STMTTRN>` de um OFX (SGML ou XML). No cartão, negativo é compra,
 * o pagamento da fatura fica de fora e o outro positivo é estorno; na conta,
 * negativo é despesa e positivo é receita (`estorno: true`).
 */
export function lerOfx(texto: string, destino: "cartao" | "conta"): { itens: ItemBanco[]; ignoradas: number } {
    const itens: ItemBanco[] = []
    let ignoradas = 0
    for (const [, bloco] of texto.matchAll(/<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi)) {
        const d = /^(\d{4})(\d{2})(\d{2})/.exec(campo(bloco, "DTPOSTED"))
        const data = d && lerData(`${d[1]}-${d[2]}-${d[3]}`)
        const valor = lerValorBr(campo(bloco, "TRNAMT"))
        const descricao = campo(bloco, "MEMO") || campo(bloco, "NAME")
        if (!data || valor == null || valor === 0) {
            ignoradas++
            continue
        }
        if (destino === "cartao" && valor > 0 && PAGAMENTO.test(descricao)) {
            ignoradas++
            continue
        }
        itens.push({
            data,
            descricao,
            valor: Math.abs(valor),
            estorno: valor > 0,
            parcela: null,
        })
    }
    return { itens, ignoradas }
}
