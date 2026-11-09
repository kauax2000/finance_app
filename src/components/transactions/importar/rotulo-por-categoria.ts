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
