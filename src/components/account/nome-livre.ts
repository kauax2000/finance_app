/** O nome sugerido para um aparelho novo: o `base` se ninguém o usa, senão "base 2", "base 3"… (sem caixa nem espaços nas pontas). */
export function nomeLivre(base: string, emUso: string[]): string {
    const usados = new Set(emUso.map((n) => n.trim().toLocaleLowerCase("pt-BR")))
    let nome = base
    for (let n = 2; usados.has(nome.toLocaleLowerCase("pt-BR")); n++) nome = `${base} ${n}`
    return nome
}
