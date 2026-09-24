"use client"

import * as React from "react"

/**
 * A rotação automática do `Carousel` — sem dependência, e sem esconder de
 * ninguém que ela está rodando.
 *
 * A página do catálogo recusava autoplay ("hostil num app de finanças") e
 * recusava a dependência do plugin. A segunda recusa ficou: são ~50 linhas, e
 * o plugin não expõe o tempo restante, que é o que o ponto-temporizador precisa
 * para andar junto do relógio. A primeira virou **regra de uso**: autoplay só
 * em conteúdo editorial (novidades, dicas), nunca sobre dado da pessoa.
 *
 * ## Quatro motivos param a rotação, e cada um é um motivo, não um booleano
 *
 * O cursor sobre a região, o foco dentro dela, a aba escondida e o próprio
 * usuário (o botão de pausar). Guardados num conjunto: um booleano só faria o
 * `blur` retomar uma rotação que o usuário tinha pausado.
 *
 * **Movimento reduzido começa pausado pelo usuário**, e não desligado: a
 * pessoa ainda pode apertar play. É a WCAG 2.2.2 pelos dois lados — quem não
 * quer movimento não o recebe, e quem quer pode ligá-lo.
 *
 * ## O relógio pausa, e não recomeça
 *
 * Pausar guarda o tempo que faltava, e retomar agenda só o resto. É o que
 * mantém o JS no mesmo passo do CSS: o preenchimento do ponto ativo é uma
 * animação com `animation-play-state: paused` sob `data-autoplay="paused"`, e
 * ela também continua de onde parou. Recomeçar do zero no JS deixaria a barra
 * cheia com o slide ainda parado.
 *
 * Trocar de slide (`chave`) zera o relógio, pela mão de quem trocou ou pela
 * própria rotação.
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

  // Movimento reduzido: começa pausado pelo usuário. Perguntado à mão porque o
  // bloco global de `prefers-reduced-motion` só alcança CSS — o precedente do
  // `useBrandGlow`.
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

  // **A ordem destes dois efeitos é carga estrutural.** Quando a chave muda,
  // o React roda primeiro as limpezas (a do relógio desconta o tempo corrido)
  // e depois as montagens na ordem de declaração: este zera, e o relógio
  // abaixo agenda o intervalo inteiro.
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
