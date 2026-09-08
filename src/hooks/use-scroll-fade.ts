"use client"

import * as React from "react"

type UseScrollFadeOptions = {
  /** O eixo que dissolve. Os dois não se combinam — um gradiente por elemento. */
  axis?: "y" | "x"
  /** Desliga uma das pontas sem tocar no gradiente: a variável dela fica em zero. */
  sides?: "both" | "start" | "end"
  /**
   * Espelha as duas variáveis e o `data-scroll-fade` na **casca** (o pai do
   * rolável), para irmãos poderem lê-los — as camadas de borrão são irmãs, e
   * custom property não atravessa para o lado.
   *
   * Opt-in de propósito: sem isto o hook escreve num nó só, e nenhuma casca do
   * Radix ou do cmdk recebe mutação de atributo que não pediu.
   */
  shell?: boolean
}

/**
 * O mecanismo da dissolução de bordas. Devolve um callback ref para o elemento
 * que **rola** — ele é quem carrega `scroll-fade-y` (ou `-x`), e o hook escreve
 * só nele.
 *
 * ```tsx
 * <div ref={useScrollFade()} className={cn(scrollFadeViewportClassName, "overflow-y-auto")} />
 * ```
 *
 * ## O que ele escreve, e por que assim
 *
 * `--scroll-fade-start` e `--scroll-fade-end` são a distância já rolada e a que
 * falta. A zona **cresce no mesmo passo em que cada ponta consome o conteúdo**,
 * em vez de ligar de uma vez: um interruptor seria um pop severo, porque o item
 * da ponta nasce a poucos pixels da borda e cabe inteiro dentro da zona — ligá-la
 * de uma vez o levaria de chapado a um degradê em 1px de rolagem. Crescendo
 * junto, nos dois extremos não há zona e o item da ponta fica nítido. Contínuo
 * por construção, e por isso não há `@property` nem transição aqui: transição só
 * borraria a chegada a um estado final errado.
 *
 * `data-scroll-fade` liga a máscara. Ele **não pode** alimentar nada que mexa em
 * layout — ver a invariante 1 em `lib/scroll-fade-classes`.
 *
 * ## As leituras
 *
 * O handler de rolagem lê **só** `scrollTop`/`scrollLeft`, que é barato. As
 * métricas de layout vêm de um cache preenchido no `ResizeObserver`, cujo
 * callback roda depois do layout — ali a leitura é grátis. Sem isso, escrever uma
 * custom property e depois ler `scrollHeight` força recálculo a cada tick.
 *
 * Os valores vão quantizados em 4px, com guarda de valor anterior. Os dois
 * `clamp` são do CSS, e é lá que o rubber-band do macOS — que produz posição
 * negativa nas duas pontas — é aparado.
 *
 * ## O observador
 *
 * Observa o viewport e os filhos dele, com um `MutationObserver` mantendo as
 * inscrições em dia. Uma lista filtrada troca de filhos a cada tecla, e um
 * `ResizeObserver` só no primeiro filho enxerga isso apenas quando o conteúdo é
 * um wrapper único (o caso do cmdk); num menu com oito filhos diretos, não
 * enxergaria nada.
 */
export function useScrollFade({
  axis = "y",
  sides = "both",
  shell = false,
}: UseScrollFadeOptions = {}) {
  return React.useCallback(
    (el: HTMLElement | null) => {
      if (!el) return

      const vertical = axis === "y"
      // A casca é o pai. Nulo quando o rolável é a raiz de quem chama, e aí o
      // espelho simplesmente não acontece — não há irmão para ler.
      const casca = shell ? el.parentElement : null
      let rolagemMax = 0
      let ultimoInicio = -1
      let ultimoFim = -1

      const escrever = (nome: string, valor: number, anterior: number) => {
        const passo = Math.round(valor / 4) * 4
        if (passo === anterior) return anterior
        el.style.setProperty(nome, `${passo}px`)
        casca?.style.setProperty(nome, `${passo}px`)
        return passo
      }

      const pintar = () => {
        const pos = vertical ? el.scrollTop : el.scrollLeft
        ultimoInicio =
          sides === "end"
            ? ultimoInicio
            : escrever("--scroll-fade-start", pos, ultimoInicio)
        ultimoFim =
          sides === "start"
            ? ultimoFim
            : escrever("--scroll-fade-end", rolagemMax - pos, ultimoFim)
      }

      const medir = () => {
        rolagemMax = vertical
          ? el.scrollHeight - el.clientHeight
          : el.scrollWidth - el.clientWidth
        // 1px de folga: medidas fracionárias nunca fecham a conta exatamente.
        const ligado = rolagemMax > 1 ? "on" : "off"
        el.dataset.scrollFade = ligado
        if (casca) casca.dataset.scrollFade = ligado
        pintar()
      }
      medir()

      const ro = new ResizeObserver(medir)
      ro.observe(el)

      let filhos: Element[] = []
      const inscreverFilhos = () => {
        for (const filho of filhos) ro.unobserve(filho)
        filhos = Array.from(el.children)
        for (const filho of filhos) ro.observe(filho)
      }
      inscreverFilhos()

      const mo = new MutationObserver(() => {
        inscreverFilhos()
        medir()
      })
      mo.observe(el, { childList: true })

      // O listener mora aqui, e não numa prop `onScroll`: o hook já é dono do
      // elemento e já tem cleanup, então não é preciso mesclar com um `onScroll`
      // de quem chama nem abrir mão do `passive`.
      el.addEventListener("scroll", pintar, { passive: true })
      return () => {
        ro.disconnect()
        mo.disconnect()
        el.removeEventListener("scroll", pintar)
        if (casca) {
          casca.style.removeProperty("--scroll-fade-start")
          casca.style.removeProperty("--scroll-fade-end")
          delete casca.dataset.scrollFade
        }
      }
    },
    [axis, sides, shell]
  )
}
