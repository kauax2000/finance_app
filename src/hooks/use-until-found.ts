"use client"

import * as React from "react"

/**
 * O bloco fechado que a busca do navegador encontra (rodada 189, no
 * `Collapsible`; dividido com o `Accordion` na rodada 200).
 *
 * O fechado fica no DOM como `hidden="until-found"`. O ⌘F o encontra, dispara
 * `beforematch`, e `abrir` é chamado. O Radix desta versão não tem a opção,
 * então quem usa o hook mantém o conteúdo montado (`forceMount`) e o atributo é
 * escrito aqui — **depois** da animação de fechar, senão `content-visibility:
 * hidden` cortaria o trajeto seco. Os filhos da cascata também disparam
 * `animationend`, e só o do próprio nó conta.
 *
 * **Quem abre tira o atributo antes de o Radix medir.** O Radix mede a altura
 * de abrir num efeito de layout que roda antes de qualquer efeito daqui; com o
 * atributo ainda lá, mede 0 e o bloco abre sem trajeto. Por isso o pedido de
 * abrir de quem usa o hook remove `hidden` na hora.
 *
 * Onde `until-found` não existe, o atributo cai no `hidden` comum: o bloco
 * fecha igual, só não é encontrado.
 *
 * Devolve o setter do nó: o efeito precisa rodar quando ele chega, e a tela
 * compõe a própria `ref` com ele.
 */
export function useUntilFound(
  ligado: boolean,
  aberto: boolean,
  abrir: (() => void) | undefined
) {
  const [el, setEl] = React.useState<HTMLDivElement | null>(null)

  React.useEffect(() => {
    if (!ligado || !el) return
    if (aberto) {
      el.removeAttribute("hidden")
      return
    }
    const esconder = () => el.setAttribute("hidden", "until-found")
    // Na montagem não há animação a esperar.
    if (el.getAnimations().length === 0) {
      esconder()
      return
    }
    const fim = (e: AnimationEvent) => {
      if (e.target === el) esconder()
    }
    el.addEventListener("animationend", fim)
    return () => el.removeEventListener("animationend", fim)
  }, [ligado, aberto, el])

  React.useEffect(() => {
    if (!ligado || !el || !abrir) return
    el.addEventListener("beforematch", abrir)
    return () => el.removeEventListener("beforematch", abrir)
  }, [ligado, abrir, el])

  return setEl
}
