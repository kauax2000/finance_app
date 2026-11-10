import { numberBR } from "@/lib/formatters"

/**
 * O rótulo do botão de "Pôr categoria" (nome `null` = sem categoria). Uma
 * escolha diz qual e em quantos; duas viram "Aplicar em N", porque a linha de
 * cada aba já diz o que vai para as saídas e o que vai para as entradas.
 */
export function rotuloDePorCategoria(partes: { nome: string | null; n: number }[]): string {
    if (partes.length === 0) return "Pôr categoria"
    if (partes.length > 1) return `Aplicar em ${numberBR(partes.reduce((t, p) => t + p.n, 0))}`
    const [p] = partes
    return p.nome == null ? `Tirar a categoria de ${numberBR(p.n)}` : `Pôr ${p.nome} em ${numberBR(p.n)}`
}

/** A linha abaixo das abas: para quem vale a lista aberta e, se já houver, a escolha dela. */
export function guiaDaAba(tipo: "expense" | "income", n: number, escolha: string | null): string {
    const quem = tipo === "expense" ? (n === 1 ? "a 1 saída" : `as ${numberBR(n)} saídas`) : n === 1 ? "a 1 entrada" : `as ${numberBR(n)} entradas`
    return escolha ? `Para ${quem}: ${escolha}.` : `Escolha a categoria d${quem}.`
}

/**
 * A ordem da aba Pela IA: pelo nome da categoria sugerida e, no empate do
 * nome ("Outros" de saída e de entrada), pelo id, para cada id ficar contíguo
 * (um grupo só por categoria). O sort é estável: dentro dela, a ordem de hoje.
 */
export function ordemPelaIa<T>(itens: T[], categoriaDe: (i: T) => string | null, nomeDe: (id: string | null) => string): T[] {
    return [...itens].sort((a, b) => {
        const ia = categoriaDe(a)
        const ib = categoriaDe(b)
        return nomeDe(ia).localeCompare(nomeDe(ib), "pt-BR") || String(ia).localeCompare(String(ib))
    })
}
