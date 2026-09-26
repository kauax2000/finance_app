/**
 * As últimas páginas abertas pela paleta do catálogo.
 *
 * Guarda **páginas**, não termos digitados: o termo costuma ser meio caminho
 * ("but"), e o que a pessoa quer de volta é o destino. Mora no `localStorage`
 * porque é memória de uma pessoa num navegador, e não dado do produto.
 */

const CHAVE = "ds:recentes"
export const RECENTES_MAX = 5

/** Pura: tira a duplicata, põe na frente, corta no teto. */
export function lembrar(prev: readonly string[], slug: string): string[] {
  return [slug, ...prev.filter((s) => s !== slug)].slice(0, RECENTES_MAX)
}

/**
 * `try/catch` nos dois lados: janela privada, cota cheia e `localStorage`
 * bloqueado lançam, e nenhum deles pode derrubar a paleta.
 */
export function lerRecentes(): string[] {
  if (typeof window === "undefined") return []
  try {
    const bruto = window.localStorage.getItem(CHAVE)
    const lista: unknown = bruto ? JSON.parse(bruto) : []
    return Array.isArray(lista)
      ? lista.filter((s): s is string => typeof s === "string")
      : []
  } catch {
    return []
  }
}

export function gravarRecente(slug: string): void {
  try {
    window.localStorage.setItem(CHAVE, JSON.stringify(lembrar(lerRecentes(), slug)))
  } catch {
    // Sem armazenamento não há memória, e a paleta segue igual.
  }
}
