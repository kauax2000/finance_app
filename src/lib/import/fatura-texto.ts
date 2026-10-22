import { roundCents } from "@/lib/money-brl"
import { lerData, lerValorBr } from "./normalizar"
import { PAGAMENTO } from "./ofx"
import type { ItemBanco, LeituraFatura } from "./tipos"

/**
 * Tira do texto o que identifica a pessoa antes de guardá-lo ou mostrá-lo:
 * linhas de CPF, endereço e titular, CPF solto, CEP, e o cartão de 16
 * dígitos, que fica só com os 4 finais. O cartão sai antes do CPF, senão o
 * CPF sem pontos casaria com os 11 primeiros dígitos dele.
 */
export function removerIdentificacao(texto: string): string {
    return texto
        .replace(/^[ \t]*(?:cpf|endere[cç]o|titular).*(?:\r?\n|$)/gim, "")
        .replace(/\b\d{4}([ .-]?)\d{4}\1\d{4}\1(\d{4})\b/g, "$2")
        .replace(/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g, "")
        .replace(/\b\d{5}-\d{3}\b/g, "")
}

const MES = "jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez"
const ITEM = new RegExp(
    `^\\s*(\\d{1,2}\\/\\d{1,2}|\\d{1,2}\\s*(?:${MES})\\.?)\\s+(.+?)\\s+(-?\\s?(?:R\\$\\s?)?-?[\\d.]*\\d,\\d{2}\\s?-?)\\s*$`,
    "i",
)
const ESTORNO = /estorno|credito|crédito|reembolso/i
// "anterior" de fora: "Total da fatura anterior" é o ciclo passado.
const TOTAL = /(total (da fatura|a pagar)|valor total)(?!\s+anterior)\D*([\d.]+,\d{2})/i
const VENCIMENTO = /vencimento\D*(\d{2}\/\d{2}\/\d{4})/i
const FECHAMENTO = /fechamento\D*(\d{2}\/\d{2}\/\d{4})/i

function lerParcela(descricao: string): ItemBanco["parcela"] {
    const m =
        /parcela\s+(\d{1,2})\s+de\s+(\d{1,2})/i.exec(descricao) ??
        /(?:^|\s)(\d{1,2})\/(\d{1,2})(?=\s|$)/.exec(descricao)
    if (!m) return null
    const k = Number(m[1])
    const n = Number(m[2])
    return k >= 1 && k <= n ? { k, n } : null
}

/** O total: um "-" colado antes do número (ou do "R$") ou depois dele é saldo credor. */
function lerTotal(texto: string): number | null {
    const m = TOTAL.exec(texto)
    if (!m) return null
    const valor = lerValorBr(m[3])
    if (valor == null) return null
    const antes = m[0].slice(0, -m[3].length)
    const depois = texto[m.index + m[0].length]
    return /(?:^|\s)-(?:R\$\s?)?$|R\$\s?-$/i.test(antes) || depois === "-" ? -valor : valor
}

/**
 * A régua de `completa`: total achado e |total − soma| < 0,01, com o estorno
 * contando negativo. A leitura pela IA confere com a mesma.
 */
export function completude(total: number | null, itens: ItemBanco[]): Pick<LeituraFatura, "completa" | "diferenca"> {
    const soma = itens.reduce((s, i) => s + (i.estorno ? -i.valor : i.valor), 0)
    // `|| 0` tira o -0 do arredondamento.
    const diferenca = total == null ? null : roundCents(total - soma) || 0
    return { completa: diferenca != null && Math.abs(diferenca) < 0.01, diferenca }
}

/**
 * Lê o texto de uma fatura de cartão. Linha de item: data no início
 * ("dd/mm" ou "dd MMM"), descrição e valor no fim. O ano vem do fechamento:
 * mês do item maior que o do fechamento é do ano anterior.
 *
 * `completa` só é verdadeira com o total achado e a soma batendo (estorno
 * conta negativo); senão a diferença (total − soma) vai junto e os itens
 * achados continuam importáveis.
 */
export function extrairItensDaFatura(texto: string, contexto: { fechamento: string }): LeituraFatura {
    const anoFechamento = Number(contexto.fechamento.slice(0, 4))
    const mesFechamento = Number(contexto.fechamento.slice(5, 7))
    const itens: ItemBanco[] = []

    for (const linha of texto.split(/\r?\n/)) {
        const m = ITEM.exec(linha)
        if (!m || PAGAMENTO.test(m[2])) continue
        let data = lerData(m[1], anoFechamento)
        if (data && Number(data.slice(5, 7)) > mesFechamento) data = lerData(m[1], anoFechamento - 1)
        const valor = lerValorBr(m[3])
        if (!data || valor == null || valor === 0) continue
        const descricao = m[2].trim()
        itens.push({
            data,
            descricao,
            valor: Math.abs(valor),
            estorno: valor < 0 || ESTORNO.test(descricao),
            parcela: lerParcela(descricao),
        })
    }

    const total = lerTotal(texto)
    const vencimento = VENCIMENTO.exec(texto)
    const fechamento = FECHAMENTO.exec(texto)
    return {
        itens,
        total,
        vencimento: vencimento ? lerData(vencimento[1]) : null,
        fechamento: fechamento ? lerData(fechamento[1]) : null,
        ...completude(total, itens),
    }
}
