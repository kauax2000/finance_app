"use client"

import * as React from "react"

import { useViewportWindow } from "@/hooks/use-mobile"

/** O conteúdo das superfícies ancoradas: rolar aqui dentro é usar a lista, não sair dela. */
const SURFACE_SELECTOR = [
  "[data-radix-popper-content-wrapper]",
  '[data-slot="navigation-menu-viewport"]',
  '[data-slot="navigation-menu-content"]',
].join(", ")

/**
 * A rolagem tira a superfície do lugar? Fecha quando rola a página (o alvo é o
 * `document`) ou um container que contém o gatilho aberto. Rolar a própria lista
 * ou um container sem relação não fecha (a coluna do catálogo rola sozinha na
 * montagem). O gatilho é achado por `aria-expanded="true"` cujo `aria-controls`
 * aponta para um conteúdo de superfície: um `Collapsible` aberto não conta.
 */
export function shouldCloseOnScroll(target: EventTarget | null) {
  const el = target as Partial<Element> | null
  if (typeof el?.querySelectorAll !== "function") return true
  if (el.closest?.(SURFACE_SELECTOR)) return false
  // Quando a página rola o alvo é o próprio `document`, cujo `ownerDocument` é `null`.
  const doc = ((el as Element).ownerDocument ?? el) as Document
  for (const gatilho of el.querySelectorAll('[aria-expanded="true"][aria-controls]')) {
    const alvo = doc?.getElementById(gatilho.getAttribute("aria-controls") ?? "")
    if (alvo?.closest(SURFACE_SELECTOR)) return true
  }
  return false
}

/**
 * Estado controlável de uma raiz ancorada que se fecha quando a página rola:
 * uma superfície não modal acompanha o gatilho e, em `--z-popover`, passaria por
 * cima do header sticky. As modais ficam de fora com `enabled = false` (já
 * travam a rolagem, e no telefone o foco num input rola a janela e a fecharia ao
 * abrir). Devolve `[valor, setValor, fechouPorRolagem]`; o ref é para o
 * `Content` cancelar a devolução de foco, que o Radix faz sem `preventScroll`.
 */
export function useCloseOnScroll<T>({
  value,
  defaultValue,
  onChange,
  closed,
  enabled = true,
}: {
  value: T | undefined
  defaultValue: T | undefined
  onChange: ((value: T) => void) | undefined
  /** O valor de "fechado": `false` para `open`, `""` para `value`. */
  closed: T
  enabled?: boolean
}) {
  const [interno, setInterno] = React.useState<T>(defaultValue ?? closed)
  const atual = value !== undefined ? value : interno
  const fechouPorRolagem = React.useRef(false)
  const janelaDaMoldura = useViewportWindow()

  const onChangeRef = React.useRef(onChange)
  React.useEffect(() => {
    onChangeRef.current = onChange
  })

  const set = React.useCallback((proximo: T) => {
    // Reabrir zera a marca: um fechamento por rolagem sem `onCloseAutoFocus` não pode engolir a volta de foco do próximo.
    if (proximo !== closed) fechouPorRolagem.current = false
    setInterno(proximo)
    onChangeRef.current?.(proximo)
  }, [closed])

  const aberto = atual !== closed
  React.useEffect(() => {
    if (!enabled || !aberto) return
    const janela = janelaDaMoldura ?? window
    const aoRolar = (e: Event) => {
      if (!shouldCloseOnScroll(e.target)) return
      fechouPorRolagem.current = true
      set(closed)
    }
    janela.addEventListener("scroll", aoRolar, { capture: true, passive: true })
    return () =>
      janela.removeEventListener("scroll", aoRolar, { capture: true })
  }, [enabled, aberto, janelaDaMoldura, set, closed])

  return [atual, set, fechouPorRolagem] as const
}

/**
 * O `onCloseAutoFocus` do `Content`: cancela a volta do foco quando quem fechou
 * foi a rolagem, e deixa o do consumidor rodar antes.
 */
export function skipFocusAfterScrollClose(
  fechouPorRolagem: React.RefObject<boolean> | null,
  handler: ((event: Event) => void) | undefined
) {
  return (event: Event) => {
    handler?.(event)
    if (fechouPorRolagem?.current) {
      event.preventDefault()
      fechouPorRolagem.current = false
    }
  }
}
