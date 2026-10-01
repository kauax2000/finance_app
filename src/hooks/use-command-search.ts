"use client"

import * as React from "react"

/**
 * A busca de uma paleta que pergunta ao servidor (rodada 208).
 *
 * Três garantias, e cada uma é um defeito clássico de busca assíncrona:
 *
 * 1. **Espera a digitação parar** (`delay`, 250ms): uma consulta por tecla
 *    seria uma rajada de pedidos para jogar fora.
 * 2. **Cancela a consulta velha** (`AbortController`) quando o texto muda —
 *    quem chama recebe o `signal` e o passa ao `fetch` ou ao cliente.
 * 3. **Resposta atrasada não sobrescreve a nova**: o resultado de uma
 *    consulta cancelada é descartado, mesmo que chegue depois, porque quem
 *    confere é o `signal` dela, e não a ordem de chegada.
 *
 * Com a paleta, a raiz vai com `shouldFilter={false}` — quem filtra é o
 * servidor — e o `CommandInput` é controlado por `query`/`setQuery`.
 */
export function useCommandSearch<T>(
  buscar: (consulta: string, signal: AbortSignal) => Promise<T[]>,
  { delay = 250, minLength = 1 }: { delay?: number; minLength?: number } = {}
) {
  const [query, setQuery] = React.useState("")
  const [results, setResults] = React.useState<T[]>([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<unknown>(null)
  const buscarRef = React.useRef(buscar)
  React.useEffect(() => {
    buscarRef.current = buscar
  })

  React.useEffect(() => {
    const consulta = query.trim()
    if (consulta.length < minLength) {
      setResults([])
      setLoading(false)
      setError(null)
      return
    }
    setLoading(true)
    const controle = new AbortController()
    const espera = setTimeout(() => {
      buscarRef
        .current(consulta, controle.signal)
        .then((r) => {
          if (controle.signal.aborted) return
          setResults(r)
          setError(null)
        })
        .catch((e: unknown) => {
          if (controle.signal.aborted) return
          setError(e)
        })
        .finally(() => {
          if (!controle.signal.aborted) setLoading(false)
        })
    }, delay)
    return () => {
      clearTimeout(espera)
      controle.abort()
    }
  }, [query, delay, minLength])

  return { query, setQuery, results, loading, error }
}
