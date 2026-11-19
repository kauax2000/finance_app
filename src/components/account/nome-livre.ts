const SUFIXO_DE_MODO = / · (Voz|Toque)$/

/** O nome com o modo no fim ("iPhone · Voz"); um sufixo de modo que já exista é trocado. */
export function nomeComModo(base: string, modo: "voz" | "toque"): string {
    return `${base.replace(SUFIXO_DE_MODO, "")} · ${modo === "voz" ? "Voz" : "Toque"}`
}

/** O nome já termina num modo, então a lista não precisa repeti-lo. */
export const nomeTemModo = (nome: string) => SUFIXO_DE_MODO.test(nome)

export const TAMANHO_MAXIMO_DO_NOME = 60

/** O nome com o modo, sem passar de 60: "iPhone · Voz", "iPhone 2 · Voz"…; o que sobra é aparado da base. */
export function nomeSugerido(base: string, modo: "voz" | "toque", emUso: string[]): string {
    const usados = new Set(emUso.map((n) => n.trim().toLocaleLowerCase("pt-BR")))
    const monta = (n: number) => {
        const fim = `${n > 1 ? ` ${n}` : ""} · ${modo === "voz" ? "Voz" : "Toque"}`
        return `${base.replace(SUFIXO_DE_MODO, "").slice(0, TAMANHO_MAXIMO_DO_NOME - fim.length).trimEnd()}${fim}`
    }
    let n = 1
    while (usados.has(monta(n).toLocaleLowerCase("pt-BR"))) n++
    return monta(n)
}
