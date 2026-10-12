import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/16/solid"

import { cn } from "@/lib/utils"

/**
 * As setas de "tem mais" de uma lista que rola — a pedido do dono, para os
 * dropdowns: a dissolução diz que a lista continua, e a seta diz **para onde**.
 * Vão como **irmãs logo depois** do rolável, que precisa de
 * `useScrollFade({ arrows: true })`, dentro de um pai `relative`. Cada uma
 * acende quando o seu lado ainda tem conteúdo (`[data-scroll-more-end] ~ &`),
 * e pousa na borda da lista, sobre a faixa que já dissolve — somando as
 * faixas por onde a lista sangra (`--scroll-fade-band-h` e `-foot-h`), para
 * não cair debaixo da busca ou do rodapé.
 *
 * **Não é o `ScrollUpButton` do Radix**, que o `Select` não usa:
 * aquele é uma faixa de 24px que rolava ao pousar e ocupava altura da lista.
 * Esta é indicação: não ocupa espaço, não pega clique (`pointer-events-none`,
 * o clique vai ao item por baixo) e não fala (`aria-hidden` — o leitor de
 * tela já anuncia a posição na lista).
 */
function ScrollFadeArrows() {
  const seta =
    "pointer-events-none absolute left-1/2 z-10 -translate-x-1/2 text-muted-foreground opacity-0 transition-opacity duration-(--duration-fast) ease-(--ease-out)"
  return (
    <>
      <ChevronUpIcon
        aria-hidden
        data-slot="scroll-fade-arrow"
        data-edge="start"
        className={cn(
          seta,
          "top-[calc(var(--scroll-fade-box-top,0px)+var(--scroll-fade-band-h,0px)+--spacing(0.5))] size-4",
          "[[data-scroll-more-start]~&]:opacity-100"
        )}
      />
      <ChevronDownIcon
        aria-hidden
        data-slot="scroll-fade-arrow"
        data-edge="end"
        className={cn(
          seta,
          "bottom-[calc(var(--scroll-fade-box-bottom,0px)+var(--scroll-fade-foot-h,0px)+--spacing(0.5))] size-4",
          "[[data-scroll-more-end]~&]:opacity-100"
        )}
      />
    </>
  )
}

export { ScrollFadeArrows }
