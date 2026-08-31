"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { useScrollFade } from "@/hooks/use-scroll-fade"
import {
  scrollFadeViewportClassName,
  scrollFadeViewportXClassName,
} from "@/lib/scroll-fade-classes"

/**
 * Área rolável cujas bordas dissolvem o conteúdo enquanto ainda há mais.
 *
 * Resolve o problema de saber que a lista continua: **uma lista cortada em seco
 * na borda de um cartão lê como lista terminada**. A dissolução aparece só do
 * lado em que ainda há conteúdo, então quando tudo cabe ela não aparece nunca.
 *
 * ## Ele é conveniência, não a primitiva
 *
 * A máquina mora em `lib/scroll-fade-classes` + `hooks/use-scroll-fade`, e este
 * componente é o caso em que **ninguém é dono da casca**: uma região rolável
 * solta, que precisa de um elemento para segurar a moldura e a altura enquanto
 * outro rola. Quem já tem casca própria — o `Command`, um popover, um menu —
 * compõe as classes direto e não passa por aqui, porque um `<div>` interposto
 * quebraria o contexto do Radix ou do cmdk.
 *
 * ## Por que máscara, e não um gradiente pintado
 *
 * A versão anterior desenhava dois `<span>` absolutos com
 * `bg-gradient from-card`. Uma **cor cravada**: dentro de um `PopoverContent`
 * (`bg-popover`) ou de um menu, ela pintava uma faixa clara em vez de dissolver
 * — o mesmo defeito que o `Command` registrou ao tentar pintar o rodapé, e a
 * razão de este componente nunca ter tido um consumidor.
 *
 * Máscara é **alfa, não cor**: ela serve qualquer superfície sem precisar saber
 * de que cor é o fundo. E `pointer-events` deixou de ser assunto — não há mais
 * nada por cima do conteúdo para comer o clique dos itens que ficam embaixo.
 *
 * ## O que ele não faz
 *
 * **Os dois eixos ao mesmo tempo.** É um gradiente por elemento: a spec define
 * `mask-image: none` como camada preta transparente, então compor duas máscaras
 * com `mask-composite: intersect` daria alfa zero e apagaria o elemento.
 *
 * **Faixa fixa por cima ou por baixo.** Para o conteúdo passar *por trás* de um
 * cabeçalho, quem publica a altura dele é a casca, e aí a composição é manual —
 * ver `scrollFadeBandsClassName`.
 */
function ScrollFade({
  className,
  viewportClassName,
  axis = "y",
  sides = "both",
  children,
  ...props
}: React.ComponentProps<"div"> & {
  /** O eixo que dissolve. Os dois não se combinam. */
  axis?: "y" | "x"
  /** Desliga uma das pontas: `start` só dissolve no começo, `end` só no fim. */
  sides?: "both" | "start" | "end"
  viewportClassName?: string
}) {
  const vertical = axis === "y"

  return (
    // A moldura, a altura e a tinta moram aqui — e **só** aqui. O elemento
    // mascarado não pode desenhar nada: a máscara recorta o alfa dele inteiro,
    // borda e sombra externa junto, e um retângulo com os cantos apagados e os
    // lados opacos lê como falha de renderização.
    <div
      data-slot="scroll-fade"
      data-axis={axis}
      className={cn("relative min-h-0", className)}
      {...props}
    >
      <div
        ref={useScrollFade({ axis, sides })}
        className={cn(
          "min-h-0 overscroll-contain",
          vertical
            ? "h-full touch-pan-y overflow-y-auto"
            : "touch-pan-x overflow-x-auto",
          vertical ? scrollFadeViewportClassName : scrollFadeViewportXClassName,
          viewportClassName
        )}
      >
        {children}
      </div>
    </div>
  )
}

export { ScrollFade }
