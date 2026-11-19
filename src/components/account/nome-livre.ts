/** O nome sugerido para um aparelho novo: o `base` se ninguém o usa, senão "base 2", "base 3"… (sem caixa nem espaços nas pontas). */
export function nomeLivre(base: string, emUso: string[]): string {
    const usados = new Set(emUso.map((n) => n.trim().toLocaleLowerCase("pt-BR")))
    let nome = base
    for (let n = 2; usados.has(nome.toLocaleLowerCase("pt-BR")); n++) nome = `${base} ${n}`
    return nome
}

const SUFIXO_DE_MODO = / · (Voz|Toque)$/

/** O nome com o modo no fim ("iPhone · Voz"); um sufixo de modo que já exista é trocado. */
export function nomeComModo(base: string, modo: "voz" | "toque"): string {
    return `${base.replace(SUFIXO_DE_MODO, "")} · ${modo === "voz" ? "Voz" : "Toque"}`
}

/** O nome já termina num modo, então a lista não precisa repeti-lo. */
export const nomeTemModo = (nome: string) => SUFIXO_DE_MODO.test(nome)

/** `nomeLivre` sobre o nome já com o modo: "iPhone · Voz", "iPhone 2 · Voz"… */
export function nomeSugerido(base: string, modo: "voz" | "toque", emUso: string[]): string {
    const usados = new Set(emUso.map((n) => n.trim().toLocaleLowerCase("pt-BR")))
    let nome = nomeComModo(base, modo)
    for (let n = 2; usados.has(nome.toLocaleLowerCase("pt-BR")); n++) nome = nomeComModo(`${base} ${n}`, modo)
    return nome
}
