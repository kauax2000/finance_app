"use client"

import * as React from "react"

/**
 * A rotação automática do `Carousel`, sem dependência: o plugin não expõe o
 * tempo restante, que o ponto-temporizador precisa. Autoplay só em conteúdo
 * editorial, nunca sobre dado da pessoa.
 *
 * Quatro motivos param a rotação (cursor, foco, aba escondida, usuário), num
 * conjunto: um booleano faria o `blur` retomar uma rotação que o usuário pausou.
 * Movimento reduzido começa pausado pelo usuário (WCAG 2.2.2), e a pessoa ainda
 * pode dar play. Pausar guarda o tempo que faltava e retomar agenda só o resto,
 * para o JS ficar no passo do preenchimento do ponto (`animation-play-state:
 * paused`). Trocar de slide (`chave`) zera o relógio.
 */
type Motivo = "cursor" | "foco" | "oculta" | "usuario"

export function useCarouselAutoplay({
  intervalo,
  avancar,
  chave,
}: {
  /** Em milissegundos. `0` desliga. */
  intervalo: number
  avancar: () => void
  /** O índice selecionado: quando muda, o relógio recomeça. */
  chave: number
}) {
  const ativo = intervalo > 0
  const [motivos, setMotivos] = React.useState<ReadonlySet<Motivo>>(
    () => new Set()
  )

  const pausar = React.useCallback((motivo: Motivo) => {
    setMotivos((atual) => {
      if (atual.has(motivo)) return atual
      const proximo = new Set(atual)
      proximo.add(motivo)
      return proximo
    })
  }, [])

  const retomar = React.useCallback((motivo: Motivo) => {
    setMotivos((atual) => {
      if (!atual.has(motivo)) return atual
      const proximo = new Set(atual)
      proximo.delete(motivo)
      return proximo
    })
  }, [])

  const alternar = React.useCallback(() => {
    setMotivos((atual) => {
      const proximo = new Set(atual)
      if (proximo.has("usuario")) proximo.delete("usuario")
      else proximo.add("usuario")
      return proximo
    })
  }, [])

  // Movimento reduzido é perguntado à mão: o bloco global só alcança CSS.
  React.useEffect(() => {
    if (!ativo) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      pausar("usuario")
    }
  }, [ativo, pausar])

  // A aba escondida para a rotação: ninguém está vendo o slide trocar.
  React.useEffect(() => {
    if (!ativo) return
    const aoMudar = () =>
      document.hidden ? pausar("oculta") : retomar("oculta")
    document.addEventListener("visibilitychange", aoMudar)
    return () => document.removeEventListener("visibilitychange", aoMudar)
  }, [ativo, pausar, retomar])

  const avancarRef = React.useRef(avancar)
  React.useEffect(() => {
    avancarRef.current = avancar
  }, [avancar])

  const rodando = ativo && motivos.size === 0
  const restante = React.useRef(intervalo)

  // A ordem destes dois efeitos é carga estrutural: na troca de `chave` as
  // limpezas rodam primeiro (a do relógio desconta o tempo corrido), este zera,
  // e o relógio abaixo agenda o intervalo inteiro.
  React.useEffect(() => {
    restante.current = intervalo
  }, [chave, intervalo])

  React.useEffect(() => {
    if (!rodando) return
    const inicio = performance.now()
    const t = window.setTimeout(() => {
      restante.current = intervalo
      avancarRef.current()
    }, restante.current)
    return () => {
      window.clearTimeout(t)
      restante.current = Math.max(
        0,
        restante.current - (performance.now() - inicio)
      )
    }
  }, [rodando, chave, intervalo])

  return {
    ativo,
    rodando,
    pausadoPeloUsuario: motivos.has("usuario"),
    pausar,
    retomar,
    alternar,
  }
}
