"use client"

import { useSheetSurface } from "@/components/ui/sheet"

/**
 * A alça da gaveta.
 *
 * **No telefone ela não renderiza nada** — ali a superfície é uma gaveta de
 * verdade, e a alça vem dela, ligada ao gesto. Duas alças seriam duas, e só uma
 * arrastaria.
 *
 * No desktop a folha entra pela lateral e não se arrasta, então também não há
 * alça. O componente sobrevive porque 16 telas o escrevem, e apagá-lo delas é
 * uma limpeza mecânica que não precisa acontecer no mesmo passo: enquanto isso
 * ele não desenha uma promessa que ninguém cumpre — que era exatamente o
 * defeito antigo.
 */
export function SheetDragHandle() {
  useSheetSurface()
  return null
}
