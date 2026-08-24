import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

/**
 * O tailwind-merge precisa conhecer os tamanhos de texto próprios do projeto.
 *
 * Sem isto, `text-control-sm` não casa com nenhum tamanho conhecido e cai no
 * grupo de **cor** de texto — então ele apaga o `text-*-foreground` declarado
 * antes. Na prática: todo `Button size="sm"` colorido perdia a cor do texto e
 * renderizava quase preto sobre o fundo da variante (medido: 1,95:1 no botão
 * verde, contra os 9,73:1 do mesmo botão em `size="default"`).
 *
 * `text-2xs` não precisa estar aqui — o validador de t-shirt-size já reconhece
 * `2xs` —, mas fica declarado de propósito: o próximo degrau de texto que
 * alguém acrescentar tem que passar por esta lista, e uma lista com um item só
 * não ensina isso.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: ["2xs", "control-sm"] }],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getInitials(name: string): string {
  const parts = name.trim().split(" ")
  if (parts.length >= 2) {
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
  }
  return name.charAt(0).toUpperCase()
}
