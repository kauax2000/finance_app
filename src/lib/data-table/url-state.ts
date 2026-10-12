/**
 * A tabela na URL: ordenação, página e filtros por chave, para o
 * link ser compartilhável e o voltar do navegador devolver a mesma vista.
 *
 * O formato é o curto e legível — `sort=valor.desc,data.asc`, `page=3`,
 * `status=ativa,pausada` —, e a página vai **a partir de 1** na URL (é o que a
 * pessoa lê), e a partir de 0 no estado.
 */

export type UrlSort = { id: string; desc: boolean }[]

export function serializeSort(sort: UrlSort): string {
  return sort.map((s) => `${s.id}.${s.desc ? "desc" : "asc"}`).join(",")
}

/** Ignora o que não reconhece: um link velho não pode quebrar a tela. */
export function parseSort(texto: string | null, allowed?: readonly string[]): UrlSort {
  if (!texto) return []
  return texto
    .split(",")
    .map((parte) => {
      const [id, sentido] = parte.split(".")
      if (!id || (sentido !== "asc" && sentido !== "desc")) return null
      if (allowed && !allowed.includes(id)) return null
      return { id, desc: sentido === "desc" }
    })
    .filter((s): s is { id: string; desc: boolean } => s !== null)
}

export function serializePage(pageIndex: number): string | null {
  return pageIndex > 0 ? String(pageIndex + 1) : null
}

export function parsePage(texto: string | null): number {
  const n = Number(texto)
  return Number.isInteger(n) && n > 1 ? n - 1 : 0
}

export function serializeList(valores: readonly string[]): string | null {
  return valores.length ? valores.map(encodeURIComponent).join(",") : null
}

export function parseList(texto: string | null): string[] {
  return texto ? texto.split(",").filter(Boolean).map(decodeURIComponent) : []
}

/**
 * Escreve as chaves em cima dos parâmetros que já existem — os outros (o
 * filtro de período, o `txn` que abre uma folha) ficam. `null` apaga.
 */
export function mergeParams(
  atual: URLSearchParams | string,
  proximo: Record<string, string | null>
): string {
  const params = new URLSearchParams(atual.toString())
  for (const [k, v] of Object.entries(proximo)) {
    if (v == null || v === "") params.delete(k)
    else params.set(k, v)
  }
  return params.toString()
}
