"use client"

import * as React from "react"

/**
 * A paleta que abre **sem nada selecionado**, e entra na lista na primeira seta.
 *
 * ## O que ele conserta
 *
 * O cmdk marca a primeira linha assim que os itens se registram, e de novo a cada
 * tecla digitada. Numa paleta isso lê como se o cursor já estivesse na lista —
 * mas o foco está no campo de busca, e ninguém escolheu nada ainda. Medido antes:
 * ao abrir `⌘K` no catálogo, `Cores` saía com `aria-selected="true"`.
 *
 * ## Por que não é um problema de CSS
 *
 * Esconder o realce com uma regra de estilo é o caminho curto e está errado. O
 * cmdk escreve `aria-selected="true"` no item e alimenta o `aria-activedescendant`
 * da lista: um leitor de tela continuaria anunciando uma linha ativa que ninguém
 * vê. A seleção precisa **não existir**, e não ficar invisível.
 *
 * ## Por que são dois sentinelas, e não um
 *
 * Lido em `node_modules/cmdk/dist/index.mjs` (1.1.1) — três fatos que juntos
 * explicam a forma deste hook:
 *
 * 1. A prop `value` controlada só é reaplicada ao estado interno **quando muda**:
 *    o efeito que faz `interno.value = value.trim()` depende de `[value]`.
 * 2. Mudar a busca agenda `selectFirstItem()`, e o registro de cada item faz
 *    `interno.value || selectFirstItem()`.
 * 3. No ramo controlado, `setState("value", …)` **escreve o estado interno
 *    antes** de chamar `onValueChange` e retornar.
 *
 * O (3) é o que derruba a solução ingênua: **ignorar o `onValueChange` não
 * basta**. Quando ele chega, o estado interno já foi sujo; como a prop não mudou,
 * o efeito do (1) não roda para desfazer, e o primeiro item acende assim mesmo.
 *
 * Daí a alternância. Devolver um sentinela **diferente** do atual faz a prop
 * mudar, o efeito rodar, e o estado interno voltar para um valor que nenhum item
 * tem — então nada casa e nada acende. Os dois carregam um `\0` no começo
 * justamente porque nenhum `value` real pode tê-lo: o valor de um item vem de
 * texto de interface, e o cmdk ainda lhe aplica `.trim()`.
 *
 * ## A seta para baixo sai de graça
 *
 * Com nada selecionado, o movimento do cmdk faz `findIndex(null) === -1` e pega
 * `itens[-1 + 1]` — **a primeira linha**. Não há tecla a interceptar ali, e é por
 * isso que este hook não tem um caso para `ArrowDown`.
 *
 * A de **cima** precisa de código: `itens[-1]` é `undefined`, e sem isto a tecla
 * ficaria morta no estado ocioso. Ela é atendida na raiz, o que é possível porque
 * o `onKeyDown` de quem chama roda **antes** do switch interno do cmdk.
 *
 * ## O Enter não precisa de nada
 *
 * Sem seleção, o cmdk não encontra item para disparar e o Enter simplesmente não
 * faz nada — que é a decisão desejada: se a tela não marca nada, a tecla não abre
 * nada às cegas.
 */

/**
 * Os dois valores que revezam enquanto ninguém navegou.
 *
 * O `\0` é o que garante que nenhum item real colida com eles.
 */
const OCIOSO_A = "\0command-idle-a"
const OCIOSO_B = "\0command-idle-b"

/**
 * O seletor de item navegável, **na grafia do próprio cmdk** — ele monta
 * `[cmdk-item=""]:not([aria-disabled="true"])` para varrer a lista, e é a mesma
 * ordem de DOM que as setas percorrem.
 */
const ITEM_NAVEGAVEL = '[cmdk-item=""]:not([aria-disabled="true"])'

/**
 * As teclas que tiram a paleta do estado ocioso.
 *
 * São as que o cmdk trata como navegação — inclusive os atalhos vim, que ele
 * mantém ligados por padrão (`vimBindings`), e que de outro modo moveriam a
 * seleção sem que este hook soubesse.
 */
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
}

export function useCommandIdleSelection(ativo: boolean): CommandIdleSelection {
  const [valor, setValor] = React.useState<string>(OCIOSO_A)
  /**
   * `ref` e não estado: quem lê isto são handlers de evento, e uma renderização a
   * mais por tecla não muda pintura nenhuma. O estado ocioso já é visível no
   * próprio `valor`.
   */
  const navegou = React.useRef(false)

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
      // O cmdk tentou auto-selecionar. Alternar é o que força o efeito dele a
      // desfazer o estado interno — ver o cabeçalho.
      voltarAoOcioso()
    },
    [voltarAoOcioso]
  )

  const onKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.defaultPrevented) return

      if (!navegou.current && event.key === "ArrowUp") {
        // Simétrica à de baixo, que entra na primeira linha por conta própria.
        // Sem isto a tecla ficaria morta, porque o cmdk procuraria o item
        // **anterior** a uma seleção que não existe.
        //
        // `currentTarget` é a própria raiz `Command` — o handler está nela —, e
        // é o que dispensa um `ref` e a composição que ele exigiria de quem
        // chama.
        const itens = event.currentTarget.querySelectorAll<HTMLElement>(ITEM_NAVEGAVEL)
        const ultimo = itens[itens.length - 1]
        // `data-value` guarda o valor **cru**: o `useValue` do cmdk o escreve com
        // `setAttribute`, e é o mesmo atributo que as setas dele leem para
        // mover. (O `encodeURIComponent` que aparece no fonte é de outro ponto,
        // onde o valor entra num seletor.)
        const bruto = ultimo?.getAttribute("data-value")
        if (bruto == null) return
        event.preventDefault()
        navegou.current = true
        setValor(bruto)
        return
      }

      if (ehNavegacao(event)) navegou.current = true
    },
    []
  )

  const onInput = React.useCallback(() => {
    // `onInput` e não `onKeyDown`: assim colar e limpar pelo × do campo também
    // devolvem a paleta ao estado sem seleção.
    voltarAoOcioso()
  }, [voltarAoOcioso])

  if (!ativo) return {}

  return { value: valor, onValueChange, onKeyDown, onInput }
}
