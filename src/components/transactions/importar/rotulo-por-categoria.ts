import { numberBR } from "@/lib/formatters"

/** O rótulo do botão de "Pôr categoria": uma frase por escolha, juntas por " e " (nome `null` = sem categoria). */
export function rotuloDePorCategoria(partes: { nome: string | null; n: number }[]): string {
    if (partes.length === 0) return "Pôr categoria"
    return partes
        .map((p, i) => {
            const frase = p.nome == null ? `Tirar a categoria de ${numberBR(p.n)}` : `Pôr ${p.nome} em ${numberBR(p.n)}`
            return i === 0 ? frase : frase.charAt(0).toLowerCase() + frase.slice(1)
        })
        .join(" e ")
}

/** A linha abaixo das abas: para quem vale a lista aberta e, se já houver, a escolha dela. */
export function guiaDaAba(tipo: "expense" | "income", n: number, escolha: string | null): string {
    const quem = tipo === "expense" ? (n === 1 ? "a 1 saída" : `as ${numberBR(n)} saídas`) : n === 1 ? "a 1 entrada" : `as ${numberBR(n)} entradas`
    return escolha ? `Para ${quem}: ${escolha}.` : `Escolha a categoria d${quem}.`
}
