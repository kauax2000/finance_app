import { MOBILE_QUERY } from "@/hooks/use-mobile"

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

/**
 * No telefone, tocar fora de um diálogo não o fecha: só o ×, o Cancelar ou o
 * arraste da gaveta (decisão do dono, 20/11/2026 — um toque sem querer no véu
 * perdia o que estava aberto). No desktop, clicar fora continua fechando. A
 * largura é a da janela do alvo, para valer também na moldura do catálogo.
 */
export function naoFecharPorForaNoTelefone(e: Event): boolean {
  const alvo = e.target as Partial<Node> | null
  const janela = alvo?.ownerDocument?.defaultView ?? (typeof window === "undefined" ? null : window)
  const telefone = janela?.matchMedia(MOBILE_QUERY).matches ?? false
  if (telefone) e.preventDefault()
  return telefone
}
