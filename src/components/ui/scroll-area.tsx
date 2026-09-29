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
 * Uma região rolável: a barra do sistema desenhada, e a borda que diz que
 * ainda há mais.
 *
 * ## Um componente, e o fade é a variante (rodada 171)
 *
 * Até a rodada 170 eram dois átomos: o `ScrollArea` (a barra do Radix, sem
 * consumidor no app) e o `ScrollFade` (a dissolução das pontas, com um só, a
 * grade do `ChartHeatmap`). Os dois respondiam à mesma pergunta — como uma
 * região rolável avisa que continua —, e a própria página do `ScrollArea`
 * mandava somá-los. Hoje o fade é `variant`, e a máscara mora no **viewport
 * do Radix**, que é quem rola e não pinta nada (a invariante 2 da
 * dissolução). A barra continua irmã dele, fora da máscara.
 *
 * - **`plain`** (o padrão) — só a barra.
 * - **`fade`** — a máscara: o conteúdo apaga até 6% de alfa, e só do lado em
 *   que ainda há conteúdo.
 * - **`blur`** — a máscara **mais** borrão. Os dois se somam.
 * - **`material`** — o material do iOS, e ele **substitui** a dissolução: o
 *   conteúdo passa por baixo nítido, e quem o esconde é o borrão.
 *
 * ## Por que máscara, e não um gradiente pintado
 *
 * O `ScrollFade` de antes desenhava dois `<span>` com `bg-gradient
 * from-card`: uma cor cravada, que dentro de um popover pintava uma faixa
 * clara. Máscara é **alfa, não cor**: serve qualquer superfície.
 *
 * ## O borrão não mora no elemento mascarado
 *
 * Um `backdrop-filter` no viewport seria recortado pela própria rampa — forte
 * onde a máscara é opaca, ausente justo na ponta. As camadas são irmãs do
 * viewport, dentro da raiz (que é `relative`), e o hook vai com `shell` fora do
 * `fade` porque irmão não lê custom property de irmão. Elas ficam inertes pelo
 * `pointer-events: none` da utility. **A tinta do material nasce
 * `transparent`**: quem sabe sobre o que está escreve `--scroll-fade-blur-tint`.
 *
 * ## O que ele não faz
 *
 * **Os dois eixos de fade ao mesmo tempo** — é um gradiente por elemento, e
 * `mask-composite: intersect` com uma camada `none` apaga o elemento. E quem
 * já tem casca própria (o `Command`, um menu, o corpo do `Dialog`) compõe as
 * classes de `lib/scroll-fade-classes` direto: um `<div>` interposto quebraria
 * o contexto do Radix ou do cmdk.
 */
type ScrollAreaVariant = "plain" | "fade" | "blur" | "material"

/**
 * As camadas de borrão das duas pontas. Precisam de três coisas, e as três
 * são mecânicas:
 *
 * 1. ser irmãs do rolável, nunca filhas;
 * 2. uma casca `relative`, senão o absoluto resolve contra um ancestral
 *    qualquer (medido no `Carousel`: 111px de camada contra 75 de viewport);
 * 3. `useScrollFade({ shell: true })` no rolável.
 *
 * Nenhuma outra peça de `ui/` as monta: dentro de um casco que já borra, cada
 * aresta vira uma linha de tom (medido no diálogo, na folha e na paleta).
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
      {/* Em ordem crescente de índice: a camada de extensão maior fica por
          baixo, e cada uma borra o que a de baixo já compôs. */}
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
   * As setas de "tem mais", para a lista suspensa (rodada 172). Só na
   * vertical, e só nas variantes de borda: a seta pousa sobre a faixa que
   * dissolve.
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
    // A moldura, a altura e a tinta moram na raiz — e só nela. Ela é também a
    // casca: hospeda o viewport, as camadas de borrão e a barra como irmãos.
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
          // O Radix embrulha o conteúdo num `<div style="display: table;
          // min-width: 100%">`, que cresce até a largura natural do conteúdo:
          // na vertical, com o eixo X cortado, nada trunca e a ponta direita
          // some — medido, "R$ 1.284,60" saía "R$ 1.284,6". Em bloco ele tem a
          // largura do viewport. `!` porque o `display` do Radix é inline. Na
          // horizontal a tabela fica: é ela que deixa a fileira crescer.
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
      {/* O polegar era `bg-border`, a cor do fio, e sumia justo quando a
          barra aparece para dizer onde a rolagem está. Medido contra a
          página: `--muted-foreground` a 45% dá 1,94 no claro e 2,38 no
          escuro; **70% é o primeiro degrau que passa 3:1 nos dois** (3,06 e
          4,24) — o mesmo degrau e o mesmo critério da pega do `Resizable`.
          Ao pousar ele vai à tinta cheia, que é quando a pessoa vai arrastar. */}
      <ScrollAreaPrimitive.Thumb
        data-slot="scroll-area-thumb"
        className="relative flex-1 rounded-full bg-muted-foreground/70 transition-colors duration-(--duration-fast) hover:bg-muted-foreground active:bg-muted-foreground"
      />
    </ScrollAreaPrimitive.Scrollbar>
  )
}

export { ScrollArea, ScrollBar }
