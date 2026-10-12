"use client"

import * as React from "react"

/**
 * As últimas escolhas de uma paleta, guardadas por chave.
 *
 * Guarda **destinos**, não termos: o termo costuma ser meio caminho ("but"), e
 * o que a pessoa quer de volta é aonde foi. Mora no `localStorage` porque é
 * memória de uma pessoa num navegador, e não dado do produto — e por isso
 * cada leitura e escrita tem `try/catch`: janela privada, cota cheia e
 * armazenamento bloqueado lançam, e nenhum deles pode derrubar a paleta.
 *
 * O primeiro render devolve a lista vazia e o efeito a lê: o servidor não tem
 * `localStorage`, e ler no render faria a hidratação divergir.
 */
export function rememberRecent(prev: readonly string[], valor: string, max: number): string[] {
  return [valor, ...prev.filter((v) => v !== valor)].slice(0, max)
}

function ler(chave: string): string[] {
  try {
    const bruto = window.localStorage.getItem(chave)
    const lista: unknown = bruto ? JSON.parse(bruto) : []
    return Array.isArray(lista) ? lista.filter((v): v is string => typeof v === "string") : []
  } catch {
    return []
  }
}

export function useCommandRecents(chave: string, { max = 5 }: { max?: number } = {}) {
  const [recents, setRecents] = React.useState<string[]>([])

  React.useEffect(() => {
    setRecents(ler(chave).slice(0, max))
  }, [chave, max])

  const add = React.useCallback(
    (valor: string) => {
      const proximo = rememberRecent(ler(chave), valor, max)
      setRecents(proximo)
      try {
        window.localStorage.setItem(chave, JSON.stringify(proximo))
      } catch {
        // Sem armazenamento não há memória, e a paleta segue igual.
      }
    },
    [chave, max]
  )

  const clear = React.useCallback(() => {
    setRecents([])
    try {
      window.localStorage.removeItem(chave)
    } catch {
      // idem
    }
  }, [chave])

  return { recents, add, clear }
}
