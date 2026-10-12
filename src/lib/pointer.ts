/**
 * O documento é de dedo? Num telefone o `pointerType` já diz; a moldura do
 * iPhone do catálogo roda no navegador do desktop, onde ele diz "mouse", e marca
 * o `<html>` de dentro com `data-pointer="coarse"` — a mesma marca que faz a
 * variante `pointer-coarse:` valer lá. No app ninguém a escreve.
 */
export function deDedo(el: Element) {
  return el.ownerDocument.documentElement.dataset.pointer === "coarse"
}

/**
 * Hover de verdade: um mouse, fora da moldura do iPhone.
 *
 * `pointerenter` e `pointermove` disparam também no toque — o dedo "entra" no
 * elemento que tocou —, e um realce que acompanha o cursor fica preso onde o
 * dedo pousou. Todo ouvinte de "passou por cima" pergunta isto antes.
 */
export function ehCursor(e: { pointerType: string; currentTarget: EventTarget | null }) {
  const el = e.currentTarget as Element | null
  return e.pointerType === "mouse" && !(el?.ownerDocument && deDedo(el))
}
