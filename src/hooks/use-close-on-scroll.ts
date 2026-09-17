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
 * A rolagem tira a superfície do lugar?
 *
 * Fecha quando rola a página (o alvo é o `document`) ou um container que
 * **contém o gatilho aberto** — é isso que move o gatilho, e a superfície com
 * ele. Rolar a própria lista não fecha, e rolar um container sem relação também
 * não: a coluna do catálogo rola sozinha na montagem para revelar o item ativo,
 * e fechava um menu aberto por `defaultValue`. É a regra do `Tooltip` do Radix.
 *
 * O gatilho é achado por `aria-expanded="true"` cujo `aria-controls` aponta para
 * um conteúdo de superfície: um `Collapsible` aberto não conta.
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
 * Estado controlável de uma raiz ancorada, que se fecha quando a página rola.
 *
 * Uma superfície **não modal** acompanha o gatilho durante a rolagem, e,
 * portalizada em `--z-popover`, passa por cima do header sticky. Rolar é sair
 * dela: o Radix só fecha no Escape e no clique fora (o `Tooltip` é a exceção, e
 * faz exatamente isto por dentro), então o fechamento mora aqui.
 *
 * As modais ficam de fora com `enabled = false`: elas já travam a rolagem, e no
 * telefone o foco num input rola a janela sozinho, o que fecharia a superfície
 * no instante em que ela abre.
 *
 * Devolve `[valor, setValor, fechouPorRolagem]`. O ref existe para o `Content`
 * cancelar a devolução de foco ao gatilho: o Radix chama `trigger.focus()` sem
 * `preventScroll`, e a página pularia de volta para onde a pessoa saiu.
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
    // Reabrir zera a marca: um fechamento por rolagem que não passou pelo
    // `onCloseAutoFocus` não pode engolir a volta de foco do próximo.
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
