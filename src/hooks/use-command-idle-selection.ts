"use client"

import * as React from "react"

/**
 * A paleta que abre sem nada selecionado e entra na lista na primeira seta. O
 * cmdk marca a primeira linha ao registrar os itens e a cada tecla, e esconder
 * o realce por CSS deixaria o `aria-activedescendant` apontando para uma linha
 * que ninguém vê: a seleção tem de não existir.
 *
 * São dois sentinelas porque, no cmdk 1.1.1, `value` controlado só é
 * reaplicado ao estado interno quando muda e `setState("value")` suja o estado
 * interno antes de chamar `onValueChange`: ignorar o callback não basta, e
 * devolver um sentinela diferente do atual é o que faz a prop mudar e o estado
 * voltar a um valor que nenhum item tem. O `\0` garante que nenhum item real
 * colida.
 *
 * A seta para baixo entra na primeira linha por conta do cmdk (`itens[-1 + 1]`);
 * a de cima (`itens[-1]`) ficaria morta e é atendida na raiz, antes do switch
 * interno. O Enter sem seleção não faz nada, de propósito.
 */

/** Os dois valores que revezam enquanto ninguém navegou; o `\0` impede colisão com um item real. */
const OCIOSO_A = "\0command-idle-a"
const OCIOSO_B = "\0command-idle-b"

/** O seletor de item navegável, na grafia do próprio cmdk (a mesma ordem de DOM que as setas percorrem). */
const ITEM_NAVEGAVEL = '[cmdk-item=""]:not([aria-disabled="true"])'

/** As teclas que o cmdk trata como navegação, inclusive os atalhos vim, ligados por padrão. */
function ehNavegacao(event: React.KeyboardEvent) {
  switch (event.key) {
    case "ArrowDown":
    case "ArrowUp":
    case "Home":
    case "End":
      return true
    case "n":
    case "j":
    case "p":
    case "k":
      return event.ctrlKey
    default:
      return false
  }
}

/** O que o hook entrega à raiz `Command`. Tudo `undefined` quando desligado. */
export type CommandIdleSelection = {
  value?: string
  onValueChange?: (value: string) => void
  onKeyDown?: (event: React.KeyboardEvent<HTMLDivElement>) => void
  onInput?: (event: React.FormEvent<HTMLDivElement>) => void
  onPointerMoveCapture?: (event: React.PointerEvent<HTMLDivElement>) => void
  onPointerLeave?: (event: React.PointerEvent<HTMLDivElement>) => void
}

export function useCommandIdleSelection(ativo: boolean): CommandIdleSelection {
  const [valor, setValor] = React.useState<string>(OCIOSO_A)
  // `ref` e não estado: quem lê são handlers de evento.
  const navegou = React.useRef(false)
  /** A seleção atual veio do ponteiro, e não do teclado. */
  const porPonteiro = React.useRef(false)

  const voltarAoOcioso = React.useCallback(() => {
    navegou.current = false
    setValor((atual) => (atual === OCIOSO_A ? OCIOSO_B : OCIOSO_A))
  }, [])

  const onValueChange = React.useCallback(
    (proximo: string) => {
      if (navegou.current) {
        setValor(proximo)
        return
      }
      // O cmdk tentou auto-selecionar: alternar força o efeito dele a desfazer o estado interno.
      voltarAoOcioso()
    },
    [voltarAoOcioso]
  )

  const onKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.defaultPrevented) return

      // Ctrl+P e Ctrl+K são a seta para cima do cmdk (atalhos vim): a partir do
      // ocioso elas procurariam `itens[-2]` e ficariam mortas como a seta.
      const sobe =
        event.key === "ArrowUp" || (event.ctrlKey && (event.key === "p" || event.key === "k"))
      if (!navegou.current && sobe) {
        // Simétrica à de baixo, que entra na primeira linha por conta própria.
        const itens = event.currentTarget.querySelectorAll<HTMLElement>(ITEM_NAVEGAVEL)
        const ultimo = itens[itens.length - 1]
        // `data-value` guarda o valor cru, o mesmo que as setas do cmdk leem.
        const bruto = ultimo?.getAttribute("data-value")
        if (bruto == null) return
        event.preventDefault()
        navegou.current = true
        porPonteiro.current = false
        setValor(bruto)
        return
      }

      if (ehNavegacao(event)) {
        navegou.current = true
        porPonteiro.current = false
      }
    },
    []
  )

  /**
   * O ponteiro também navega: o cmdk seleciona a linha no `pointermove` do item,
   * e sem marcar `navegou` a seleção voltaria ao ocioso e nenhuma linha acenderia
   * no hover. Em captura, para rodar antes do handler do item.
   */
  const onPointerMoveCapture = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if ((event.target as HTMLElement).closest?.("[cmdk-item]")) {
        navegou.current = true
        porPonteiro.current = true
      }
    },
    []
  )

  /**
   * Sair com o mouse apaga só o realce que o ponteiro acendeu; a seleção do
   * teclado fica. `pointerleave` não borbulha, então parar sobre o rodapé ou o
   * campo não apaga nada.
   */
  const onPointerLeave = React.useCallback(() => {
    if (porPonteiro.current) {
      porPonteiro.current = false
      voltarAoOcioso()
    }
  }, [voltarAoOcioso])

  const onInput = React.useCallback(() => {
    // `onInput` e não `onKeyDown`: colar e limpar pelo × também devolvem a paleta ao ocioso.
    voltarAoOcioso()
  }, [voltarAoOcioso])

  if (!ativo) return {}

  return { value: valor, onValueChange, onKeyDown, onInput, onPointerMoveCapture, onPointerLeave }
}
