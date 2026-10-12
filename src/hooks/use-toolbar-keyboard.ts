"use client"

import * as React from "react"

/** O que é parada da barra: os controles, e do `Tabs` só a aba ativa. */
const FOCAVEIS = "button, a[href], input, select, textarea, [role=tab]"

/**
 * O foco itinerante do `role="toolbar"` (WAI-ARIA APG), da `Toolbar keyboard`
 * e do `FilterBar`. As setas andam entre os controles visíveis, Home e End vão às
 * pontas, e só o último focado fica no Tab. Três exceções:
 * - **campo de texto** guarda as setas para o cursor;
 * - **o `Tabs`** cuida das próprias setas (e as consome — `defaultPrevented`),
 *   e a aba ativa continua com o `tabIndex` que o Radix escreve;
 * - **o × de um campo de busca** não é parada: é parte do campo.
 *
 * Os controles são os do `role="toolbar"` mais próximo — uma barra dentro de
 * outra guarda os seus —, e o que está saindo (`inert`) não conta. A limpeza
 * só desfaz o `tabindex` que o hook escreveu.
 */
export function useToolbarKeyboard(raiz: React.RefObject<HTMLElement | null>, ativo: boolean) {
  React.useEffect(() => {
    const el = raiz.current
    if (!ativo || !el) return

    const itens = () =>
      [...el.querySelectorAll<HTMLElement>(FOCAVEIS)].filter((n) => {
        if (n.closest("[role=toolbar]") !== el) return false
        if (n.matches(":disabled") || n.closest("[hidden], [inert]")) return false
        if (n.closest("[data-slot=search-input]") && n.tagName !== "INPUT") return false
        if (n.closest("[role=tablist]") && n.getAttribute("aria-selected") !== "true") return false
        return n.getClientRects().length > 0
      })

    const marcados = new Set<HTMLElement>()
    let atual: HTMLElement | null = null
    const marcar = () => {
      const lista = itens()
      if (!atual || !lista.includes(atual)) atual = lista[0] ?? null
      for (const n of lista) {
        if (n.getAttribute("role") === "tab") continue
        n.tabIndex = n === atual ? 0 : -1
        marcados.add(n)
      }
    }

    const foco = (e: FocusEvent) => {
      const n = itens().find((i) => i === e.target || i.contains(e.target as Node))
      if (n) {
        atual = n
        marcar()
      }
    }

    const tecla = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return
      const alvo = e.target as HTMLElement
      if (alvo.matches("input:not([type=checkbox]):not([type=radio]), textarea, select")) return
      const lista = itens()
      const i = lista.findIndex((n) => n === alvo || n.contains(alvo))
      if (i === -1) return
      const destino =
        e.key === "ArrowRight" ? lista[(i + 1) % lista.length]
        : e.key === "ArrowLeft" ? lista[(i - 1 + lista.length) % lista.length]
        : e.key === "Home" ? lista[0]
        : e.key === "End" ? lista[lista.length - 1]
        : null
      if (!destino) return
      e.preventDefault()
      atual = destino
      marcar()
      destino.focus()
    }

    marcar()
    // Controle que aparece depois (um filtro, a busca) entra fora do Tab; o
    // que sai (`inert`, `hidden`, `disabled`) devolve a parada a um vizinho.
    const mo = new MutationObserver(marcar)
    mo.observe(el, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["inert", "hidden", "disabled"],
    })
    el.addEventListener("focusin", foco)
    el.addEventListener("keydown", tecla)
    return () => {
      mo.disconnect()
      el.removeEventListener("focusin", foco)
      el.removeEventListener("keydown", tecla)
      for (const n of marcados) n.removeAttribute("tabindex")
    }
  }, [raiz, ativo])
}
