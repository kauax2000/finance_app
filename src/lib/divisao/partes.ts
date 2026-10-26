/**
 * A divisão no cliente (Bloco 7C). A tela nunca calcula as partes: quem as
 * gera é o banco (`gerar_partes`), e as mostradas vêm de `transaction_shares`.
 * Aqui só a conferência das partes digitadas à mão, o texto do saldo e a
 * sugestão de quem paga quem. Tudo em centavos.
 */
import { currencyBRL } from "@/lib/formatters"

/** O `numeric` do banco (número ou texto) em centavos inteiros. */
export const emCentavos = (valor: number | string) => Math.round(Number(valor) * 100)

/**
 * As partes digitadas fecham o valor da despesa: centavos inteiros, nenhuma
 * negativa, uma por pessoa, e a soma exata. O banco confere de novo
 * (`PARTES_NAO_FECHAM`, `PARTES_INVALIDAS`).
 */
export function partesFecham(partes: { user_id: string; centavos: number }[], totalCentavos: number): boolean {
    if (partes.length === 0) return false
    if (new Set(partes.map((p) => p.user_id)).size !== partes.length) return false
    if (partes.some((p) => !Number.isInteger(p.centavos) || p.centavos < 0)) return false
    return partes.reduce((s, p) => s + p.centavos, 0) === totalCentavos
}

/** Positivo: os outros devem à pessoa. "Você…" quando é quem lê. */
export function textoDoSaldo(saldoCentavos: number, nome: string, meuId: string, userId: string): string {
    const quem = userId === meuId ? "Você" : nome
    const valor = currencyBRL(Math.abs(saldoCentavos) / 100)
    if (saldoCentavos > 0) return `${quem} tem a receber ${valor}`
    if (saldoCentavos < 0) return `${quem} deve ${valor}`
    return `${quem} está em dia`
}

/**
 * Quem deve paga a quem tem a receber, do maior devedor para o maior credor,
 * até zerar: a regra gulosa, com o número de pagamentos que ela dá.
 */
export function sugestaoDeAcerto(
    saldos: { user_id: string; saldoCentavos: number }[],
): { de: string; para: string; centavos: number }[] {
    const credores = saldos.filter((s) => s.saldoCentavos > 0).map((s) => ({ id: s.user_id, c: s.saldoCentavos }))
    const devedores = saldos.filter((s) => s.saldoCentavos < 0).map((s) => ({ id: s.user_id, c: -s.saldoCentavos }))
    const maior = <T extends { c: number }>(xs: T[]) => xs.reduce((m, x) => (x.c > m.c ? x : m), xs[0])
    const pagamentos: { de: string; para: string; centavos: number }[] = []
    for (;;) {
        const vivos = { cr: credores.filter((x) => x.c > 0), de: devedores.filter((x) => x.c > 0) }
        if (!vivos.cr.length || !vivos.de.length) return pagamentos
        const para = maior(vivos.cr)
        const de = maior(vivos.de)
        const centavos = Math.min(para.c, de.c)
        pagamentos.push({ de: de.id, para: para.id, centavos })
        para.c -= centavos
        de.c -= centavos
    }
}

/**
 * Ruling 8: quem entra num acerto — os adultos de hoje e quem saiu mas ainda
 * está no saldo (`saiu`), que o banco aceita como a outra parte. Cada ex-membro
 * leva um sufixo do id, para dois deles não se confundirem.
 */
export function pessoasDoAcerto(
    adultos: { user_id: string; nome: string }[],
    saldos: { user_id: string; saiu: boolean }[],
): { user_id: string; nome: string }[] {
    const fora = saldos
        .filter((s) => s.saiu && !adultos.some((a) => a.user_id === s.user_id))
        .map((s) => ({ user_id: s.user_id, nome: `Ex-membro ·${s.user_id.slice(0, 4)}` }))
    return [...adultos, ...fora]
}

/** Ruling 8: quem grava o acerto é uma das duas partes (a política de insert confere). */
export const acertoEhMeu = (meuId: string, de: string, para: string) => meuId === de || meuId === para

/** O peso digitado ("1", "1,5"): maior que zero, até 9999,99, com até 2 casas; senão `null`. */
export function lerPeso(texto: string): number | null {
    const t = texto.trim().replace(",", ".")
    if (!/^\d+(\.\d{1,2})?$/.test(t)) return null
    const n = Number(t)
    return n > 0 && n < 10000 ? n : null
}

/** Os pesos digitados, um por adulto; `null` se algum não vale. */
export function pesosDigitados(valores: Record<string, string>): { user_id: string; weight: number }[] | null {
    const pesos = Object.entries(valores).map(([user_id, t]) => ({ user_id, weight: lerPeso(t) }))
    return pesos.length && pesos.every((p) => p.weight != null) ? (pesos as { user_id: string; weight: number }[]) : null
}
