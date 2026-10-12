"use client"

import * as React from "react"
import { ScrollArea as ScrollAreaPrimitive } from "radix-ui"

import { useScrollFade } from "@/hooks/use-scroll-fade"
import { ScrollFadeArrows } from "@/lib/scroll-fade-arrows"
import {
  SCROLL_FADE_BLUR_LAYERS,
  scrollFadeBlurClassName,
  scrollFadeBlurXClassName,
  scrollFadeMaterialClassName,
  scrollFadeViewportClassName,
  scrollFadeViewportXClassName,
} from "@/lib/scroll-fade-classes"
import { cn } from "@/lib/utils"

/**
 * Uma região rolável: a barra do sistema desenhada, e a borda que diz que ainda
 * há mais. O fade é a `variant`, e a máscara mora no viewport do Radix (quem
 * rola e não pinta); a barra é irmã dele, fora da máscara.
 * - `plain` (padrão): só a barra.
 * - `fade`: o conteúdo apaga até 6% de alfa, só do lado em que há conteúdo.
 * - `blur`: a máscara mais borrão.
 * - `material`: o material do iOS; substitui a dissolução (o conteúdo passa
 *   nítido por baixo e o borrão o esconde).
 * Máscara é alfa, não cor: serve qualquer superfície (um gradiente `from-card`
 * pintaria faixa clara num popover).
 * O borrão não mora no elemento mascarado (o `backdrop-filter` seria recortado
 * pela própria rampa): as camadas são irmãs do viewport, dentro da raiz
 * `relative`, e o hook vai com `shell` fora do `fade`. A tinta do material nasce
 * `transparent`; quem sabe sobre o que está escreve `--scroll-fade-blur-tint`.
 * Não faz os dois eixos de fade juntos (`mask-composite: intersect` com uma
 * camada `none` apaga o elemento). Quem já tem casca própria (`Command`, menu,
 * corpo do `Dialog`) compõe as classes de `lib/scroll-fade-classes` direto: um
 * `<div>` interposto quebraria o contexto do Radix ou do cmdk.
 */
type ScrollAreaVariant = "plain" | "fade" | "blur" | "material"

/**
 * As camadas de borrão das duas pontas. Precisam de: ser irmãs do rolável; uma
 * casca `relative` (senão o absoluto resolve contra um ancestral qualquer);
 * `useScrollFade({ shell: true })` no rolável. Nenhuma outra peça de `ui/` as
 * monta: dentro de um casco que já borra, cada aresta vira uma linha de tom.
 */
function ScrollFadeBlurLayers({
  axis,
  sides,
  material,
}: {
  axis: "x" | "y"
  sides: "both" | "start" | "end"
  material: boolean
}) {
  const pontas = sides === "both" ? (["start", "end"] as const) : ([sides] as const)

  return (
    <>
      {/*
         Em ordem crescente de índice: a camada de extensão maior fica por baixo, e
         cada uma borra o que a de baixo já compôs.
      */}
      {pontas.map((ponta) =>
        SCROLL_FADE_BLUR_LAYERS.map((i) => (
          <div
            key={`${ponta}-${i}`}
            aria-hidden
            data-slot="scroll-fade-blur"
            data-edge={ponta}
            className={cn(
              axis === "y" ? scrollFadeBlurClassName : scrollFadeBlurXClassName,
              material && scrollFadeMaterialClassName
            )}
            style={{ "--scroll-fade-blur-i": i } as React.CSSProperties}
          />
        ))
      )}
    </>
  )
}

function ScrollArea({
  className,
  viewportClassName,
  orientation = "vertical",
  variant = "plain",
  sides = "both",
  arrows = false,
  children,
  ...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.Root> & {
  /** O eixo que rola: decide a barra e, nas variantes de borda, o fade. */
  orientation?: "vertical" | "horizontal"
  /** O que a borda faz. `material` substitui a dissolução, não soma a ela. */
  variant?: ScrollAreaVariant
  /** Desliga uma das pontas do fade: `start` só no começo, `end` só no fim. */
  sides?: "both" | "start" | "end"
  /** Classes do viewport — o nó que rola —, não da raiz. */
  viewportClassName?: string
  /**
   * As setas de "tem mais", para a lista suspensa. Só na vertical e nas variantes
   * de borda: a seta pousa sobre a faixa que dissolve.
   */
  arrows?: boolean
}) {
  const axis = orientation === "vertical" ? "y" : "x"
  const dissolve = variant !== "plain"
  const material = variant === "material"
  const comBorrao = variant === "blur" || material
  const setas = arrows && dissolve && axis === "y"
  const fadeRef = useScrollFade({ axis, sides, shell: comBorrao, arrows: setas })

  return (
    // A moldura, a altura e a tinta moram na raiz, que também é a casca (hospeda o
    // viewport, as camadas de borrão e a barra como irmãos).
    <ScrollAreaPrimitive.Root
      data-slot="scroll-area"
      data-variant={variant}
      data-orientation={orientation}
      className={cn("relative min-h-0 overflow-hidden", className)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport
        ref={dissolve ? fadeRef : undefined}
        data-slot="scroll-area-viewport"
        // A máscara sai no material, e quem a desliga é a própria utility.
        data-scroll-fade-mode={material ? "material" : undefined}
        className={cn(
          // Sem `rounded-[inherit]`: o elemento mascarado não desenha nada, e o
          // canto já é recortado pelo `overflow-hidden` da raiz.
          "size-full overscroll-contain",
          axis === "y" ? "touch-pan-y" : "touch-pan-x",
          // O Radix embrulha o conteúdo num `<div style="display: table; min-width:
          // 100%">` que cresce até a largura natural: na vertical, com o eixo X cortado,
          // nada trunca e a ponta direita some. Em bloco ele tem a largura do viewport (`!`
          // porque o `display` do Radix é inline). Na horizontal a tabela fica: é ela que
          // deixa a fileira crescer.
          axis === "y" && "[&>div]:block!",
          dissolve &&
            (axis === "y" ? scrollFadeViewportClassName : scrollFadeViewportXClassName),
          viewportClassName
        )}
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      {setas && <ScrollFadeArrows />}
      {comBorrao && <ScrollFadeBlurLayers axis={axis} sides={sides} material={material} />}
      <ScrollBar orientation={orientation} />
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  )
}

function ScrollBar({
  className,
  orientation = "vertical",
  ...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.Scrollbar>) {
  return (
    <ScrollAreaPrimitive.Scrollbar
      data-slot="scroll-area-scrollbar"
      orientation={orientation}
      className={cn(
        // Acima das camadas de borrão, que são absolutas e vêm antes no DOM.
        "z-10 flex touch-none p-0.5 select-none",
        orientation === "vertical" && "h-full w-2.5 border-l border-l-transparent",
        orientation === "horizontal" && "h-2.5 flex-col border-t border-t-transparent",
        className
      )}
      {...props}
    >
      {/*
         O polegar usa `--muted-foreground` a 70%, o primeiro degrau que passa 3:1 nos
         dois temas (o mesmo critério da pega do `Resizable`); ao pousar vai à tinta
         cheia, que é quando a pessoa vai arrastar.
      */}
      <ScrollAreaPrimitive.Thumb
        data-slot="scroll-area-thumb"
        className="relative flex-1 rounded-full bg-muted-foreground/70 transition-colors duration-(--duration-fast) hover:bg-muted-foreground active:bg-muted-foreground"
      />
    </ScrollAreaPrimitive.Scrollbar>
  )
}

export { ScrollArea, ScrollBar }
