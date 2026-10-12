"use client"

import * as React from "react"

type UseScrollFadeOptions = {
  /** O eixo que dissolve. Os dois não se combinam — um gradiente por elemento. */
  axis?: "y" | "x"
  /** Desliga uma das pontas sem tocar no gradiente: a variável dela fica em zero. */
  sides?: "both" | "start" | "end"
  /**
   * Espelha as duas variáveis e o `data-scroll-fade` na casca (o pai do
   * rolável), para irmãos poderem lê-los: custom property não atravessa para o
   * lado. Opt-in, para nenhuma casca do Radix ou do cmdk receber mutação que não pediu.
   */
  shell?: boolean
  /**
   * Publica para as setas de `ScrollFadeArrows` se há conteúdo antes e depois
   * (`data-scroll-more-start`/`-end`) e onde o rolável está dentro do pai
   * (`--scroll-fade-box-top`/`-bottom`), para a seta pousar na borda da lista.
   * Opt-in, como o `shell`.
   */
  arrows?: boolean
}

/**
 * O mecanismo da dissolução de bordas. Devolve um callback ref para o elemento
 * que rola (o que carrega `scroll-fade-y` ou `-x`); o hook escreve só nele.
 *
 * ```tsx
 * <div ref={useScrollFade()} className={cn(scrollFadeViewportClassName, "overflow-y-auto")} />
 * ```
 *
 * `--scroll-fade-start` e `--scroll-fade-end` são a distância rolada e a que
 * falta; a zona cresce no passo em que cada ponta consome o conteúdo, sem
 * interruptor, e por isso não há `@property` nem transição. `data-scroll-fade`
 * liga a máscara e não pode alimentar layout (invariante 1 em
 * `lib/scroll-fade-classes`).
 *
 * O handler de rolagem lê só `scrollTop`/`scrollLeft`; as métricas de layout
 * vêm de um cache do `ResizeObserver`. Os valores vão quantizados em 4px, e os
 * dois `clamp` do CSS aparam o rubber-band do macOS. O observador cobre o
 * viewport e todos os filhos (um `MutationObserver` mantém as inscrições): uma
 * lista filtrada troca de filhos a cada tecla, e observar só o primeiro serve
 * apenas ao wrapper único do cmdk.
 */
export function useScrollFade({
  axis = "y",
  sides = "both",
  shell = false,
  arrows = false,
}: UseScrollFadeOptions = {}) {
  return React.useCallback(
    (el: HTMLElement | null) => {
      if (!el) return

      const vertical = axis === "y"
      // A casca é o pai; nula quando o rolável é a raiz, e aí não há irmão para ler.
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

      const pai = arrows ? el.parentElement : null

      const pintar = () => {
        const pos = vertical ? el.scrollTop : el.scrollLeft
        if (arrows) {
          // 1px de folga, a mesma de `medir`.
          el.toggleAttribute("data-scroll-more-start", pos > 1)
          el.toggleAttribute("data-scroll-more-end", rolagemMax - pos > 1)
        }
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
        if (pai) {
          // Lido no `ResizeObserver`, depois do layout; as variáveis só posicionam as setas absolutas.
          const a = el.getBoundingClientRect()
          const b = pai.getBoundingClientRect()
          pai.style.setProperty("--scroll-fade-box-top", `${a.top - b.top - pai.clientTop}px`)
          pai.style.setProperty("--scroll-fade-box-bottom", `${b.bottom - a.bottom - pai.clientTop}px`)
        }
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

      // O listener mora aqui e não numa prop `onScroll`: o hook já é dono do elemento e do cleanup, e mantém o `passive`.
      el.addEventListener("scroll", pintar, { passive: true })
      return () => {
        ro.disconnect()
        mo.disconnect()
        el.removeEventListener("scroll", pintar)
        if (pai) {
          pai.style.removeProperty("--scroll-fade-box-top")
          pai.style.removeProperty("--scroll-fade-box-bottom")
        }
        if (casca) {
          casca.style.removeProperty("--scroll-fade-start")
          casca.style.removeProperty("--scroll-fade-end")
          delete casca.dataset.scrollFade
        }
      }
    },
    [axis, sides, shell, arrows]
  )
}
