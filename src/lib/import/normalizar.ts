import { parseMoneyBrl } from "@/lib/money-brl"

export { normalizarDescricao, palavraSignificativa } from "@/lib/captura/frase"

/**
 * "1.234,56", "-12,50", "R$ 9,90", "20,00-" (crédito de fatura) e "12.50"
 * (ponto decimal, o do OFX). O sinal fica no número; o resto é do `parseMoneyBrl`.
 */
export function lerValorBr(s: string): number | null {
    let t = s.replace(/\s/g, "")
    let negativo = false
    if (t.endsWith("-")) {
        negativo = true
        t = t.slice(0, -1)
    }
    if (t.startsWith("-")) {
        negativo = !negativo
        t = t.slice(1)
    }
    t = t.replace(/^R\$/i, "")
    if (t.startsWith("-")) {
        negativo = !negativo
        t = t.slice(1)
    }
    if (!/^[\d.,]+$/.test(t)) return null
    const n = parseMoneyBrl(t)
    if (n == null) return null
    return negativo ? -n : n
}

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"]

function montar(ano: number, mes: number, dia: number): string | null {
    const d = new Date(Date.UTC(ano, mes - 1, dia))
    if (d.getUTCFullYear() !== ano || d.getUTCMonth() !== mes - 1 || d.getUTCDate() !== dia) return null
    return d.toISOString().slice(0, 10)
}

/**
 * "dd/mm/aaaa" (ou "dd/mm/aa"), "aaaa-mm-dd", "dd/mm" e "dd MMM" ("12 OUT").
 * Sem ano no texto, vale `anoPadrao` (o ano corrente se faltar).
 */
export function lerData(s: string, anoPadrao: number = new Date().getFullYear()): string | null {
    const t = s.trim()
    let m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(t)
    if (m) return montar(Number(m[1]), Number(m[2]), Number(m[3]))
    m = /^(\d{1,2})\/(\d{1,2})(?:\/(\d{4}|\d{2}))?$/.exec(t)
    if (m) {
        const ano = m[3] ? Number(m[3].length === 2 ? `20${m[3]}` : m[3]) : anoPadrao
        return montar(ano, Number(m[2]), Number(m[1]))
    }
    m = /^(\d{1,2})\s*([a-z]{3})\.?$/i.exec(t)
    if (m) {
        const mes = MESES.indexOf(m[2].toLowerCase()) + 1
        return mes ? montar(anoPadrao, mes, Number(m[1])) : null
    }
    return null
}
