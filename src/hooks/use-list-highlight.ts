"use client"

import * as React from "react"

type UseListHighlightOptions = {
  /**
   * O seletor da linha ativa. O cmdk marca `[cmdk-item][data-selected="true"]`
   * — e o mesmo atributo serve o ponteiro e as setas; o Radix marca
   * `[data-highlighted]` nos menus e no `Select`.
   */
  active: string
  /**
   * `pointer` é para a lista que só tem hover — `FormPickerPopover` e
   * `NavigationMenu`. O hook escreve `data-highlighted` na linha sob o ponteiro
   * ou com foco, e o resto do caminho é o mesmo das outras.
   */
  mode?: "attribute" | "pointer"
  /** A linha, no modo `pointer`. */
  item?: string
}

/**
 * Mede a linha ativa e escreve a posição dela no indicador. Devolve o `ref`
 * do indicador; o contêiner é o **pai** dele, e precisa ser posicionado.
 *
 * ## Em coordenadas do conteúdo
 *
 * `linha.rect − contêiner.rect + contêiner.scrollTop` — o `offsetTop` do
 * `Tabs`, sem depender da cadeia de `offsetParent` (as linhas do cmdk moram
 * dentro de grupos). O indicador rola junto com as linhas, então rolar a lista
 * não desalinha nada; a rolagem só remede por segurança, coalescida.
 *
 * ## Dois observadores e um quadro por rajada
 *
 * `MutationObserver` nos atributos que marcam a linha ativa (e no `hidden`,
 * que o cmdk usa para esconder grupos sem tirá-los do DOM) e `ResizeObserver`
 * no contêiner. Os dois só **agendam** a medida: um `requestAnimationFrame`
 * por rajada, cancelado na saída — o que coalesce, não o laço que se
 * re-agenda, que é o que esta casa proíbe.
 */
export function useListHighlight({
  active,
  mode = "attribute",
  item,
}: UseListHighlightOptions) {
  // Um `ref` callback com limpeza (React 19): monta quando o indicador entra no
  // DOM, desmonta quando sai. O elemento não passa por estado — o React
  // Compiler proíbe escrever num valor devolvido por `useState`, e aqui o
  // trabalho inteiro é escrever nele.
  return React.useCallback(
    (el: HTMLElement | null) => {
      const host = el?.parentElement
      if (!el || !host) return

      let medida = 0
      let acender = 0
      let aceso = false

      const apagar = () => {
        if (!aceso) return
        aceso = false
        cancelAnimationFrame(acender)
        acender = 0
        el.dataset.state = "off"
      }

      const medir = () => {
        medida = 0
        const alvo = host.querySelector<HTMLElement>(active)
        if (!alvo || alvo.closest("[hidden]")) return apagar()

        const h = host.getBoundingClientRect()
        const r = alvo.getBoundingClientRect()
        el.style.setProperty(
          "--list-highlight-x",
          `${r.left - h.left + host.scrollLeft - host.clientLeft}px`
        )
        el.style.setProperty(
          "--list-highlight-y",
          `${r.top - h.top + host.scrollTop - host.clientTop}px`
        )
        el.style.setProperty("--list-highlight-w", `${r.width}px`)
        el.style.setProperty("--list-highlight-h", `${r.height}px`)
        el.dataset.tone =
          alvo.dataset.variant === "destructive" ? "destructive" : ""

        if (aceso) return
        // Chegada: a posição entra sem transição, e só o quadro seguinte acende.
        aceso = true
        el.dataset.state = "jump"
        acender = requestAnimationFrame(() => {
          acender = 0
          if (aceso) el.dataset.state = "on"
        })
      }

      const agendar = () => {
        if (!medida) medida = requestAnimationFrame(medir)
      }

      const mo = new MutationObserver(agendar)
      mo.observe(host, {
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: ["data-selected", "data-highlighted", "hidden"],
      })
      const ro = new ResizeObserver(agendar)
      ro.observe(host)
      host.addEventListener("scroll", agendar, {
        capture: true,
        passive: true,
      })

      // O modo `pointer`: a lista não tem cursor próprio, e o hook o escreve.
      let marcada: HTMLElement | null = null
      const marcar = (linha: HTMLElement | null) => {
        if (linha === marcada) return
        marcada?.removeAttribute("data-highlighted")
        marcada = linha
        marcada?.setAttribute("data-highlighted", "")
      }
      const linhaDe = (alvo: EventTarget | null) => {
        if (!item || !(alvo instanceof Element)) return null
        const linha = alvo.closest<HTMLElement>(item)
        return linha &&
          host.contains(linha) &&
          !linha.matches(":disabled,[data-disabled]")
          ? linha
          : null
      }
      const aoPassar = (e: Event) => {
        const linha = linhaDe(e.target)
        if (linha) marcar(linha)
      }
      const aoSair = () => marcar(null)
      const aoPerderFoco = (e: FocusEvent) => {
        if (
          !(e.relatedTarget instanceof Node) ||
          !host.contains(e.relatedTarget)
        )
          marcar(null)
      }
      if (mode === "pointer") {
        host.addEventListener("pointerover", aoPassar)
        host.addEventListener("pointerleave", aoSair)
        host.addEventListener("focusin", aoPassar)
        host.addEventListener("focusout", aoPerderFoco)
      }

      medir()

      return () => {
        mo.disconnect()
        ro.disconnect()
        host.removeEventListener("scroll", agendar, { capture: true })
        host.removeEventListener("pointerover", aoPassar)
        host.removeEventListener("pointerleave", aoSair)
        host.removeEventListener("focusin", aoPassar)
        host.removeEventListener("focusout", aoPerderFoco)
        marcar(null)
        cancelAnimationFrame(medida)
        cancelAnimationFrame(acender)
      }
    },
    [active, item, mode]
  )
}
