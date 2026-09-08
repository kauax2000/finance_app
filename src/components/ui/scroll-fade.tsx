"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { useScrollFade } from "@/hooks/use-scroll-fade"
import {
  SCROLL_FADE_BLUR_LAYERS,
  scrollFadeBlurClassName,
  scrollFadeBlurXClassName,
  scrollFadeMaterialClassName,
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
 * de que cor é o fundo.
 *
 * ## `edge` decide o que a borda faz, e os três não são graus do mesmo efeito
 *
 * - **`fade`** (o padrão) — só a máscara. O conteúdo apaga até 6% de alfa.
 * - **`blur`** — a máscara **mais** borrão. Os dois se somam: apaga e desfoca.
 * - **`material`** — o material do iOS, e ele **substitui** a dissolução. O
 *   conteúdo passa por baixo **nítido**, e quem o esconde é o borrão. É a
 *   diferença entre um material e um véu, e é por isso que ali a máscara sai.
 *
 * O borrão **não pode** morar no elemento mascarado. Um `backdrop-filter` ali
 * seria recortado pela própria rampa — forte onde a máscara é opaca, ausente
 * justo na ponta, que é o contrário do que se quer. As camadas são irmãs do
 * rolável, e a casca hospeda as duas coisas; é por isso que o hook vai com
 * `shell` fora do modo `fade`, porque irmão não lê custom property de irmão.
 *
 * **E `pointer-events` volta a ser assunto.** Em `fade` não há nada por cima do
 * conteúdo; nos outros dois há seis camadas, e o que as mantém inertes é o
 * `pointer-events: none` da utility — não a ausência de nós.
 *
 * **A tinta do material nasce `transparent`.** Cravar uma cor é o defeito que
 * enterrou o `ScrollFade` de gradiente pintado, e `--mobile-glass-bg` não serve
 * porque segue superfícies diferentes em cada tema. Quem sabe sobre o que está
 * escreve `--scroll-fade-blur-tint` no próprio elemento.
 *
 * ## O que ele não faz
 *
 * **Os dois eixos ao mesmo tempo.** É um gradiente por elemento: a spec define
 * `mask-image: none` como camada preta transparente, então compor duas máscaras
 * com `mask-composite: intersect` daria alfa zero e apagaria o elemento.
 *
 * **Faixa fixa por cima ou por baixo.** Para o conteúdo passar *por trás* de um
 * cabeçalho, quem publica a altura dele é a casca, e aí a composição é manual —
 * ver `scrollFadeBandsClassName`. O borrão já respeita as duas medidas.
 */
/**
 * As camadas de borrão das duas pontas — a peça, para quem hospeda a própria
 * casca.
 *
 * Ela existe porque o mesmo bloco de JSX passou a ser escrito em três lugares:
 * aqui, na paleta e no corpo das superfícies modais. Quem a renderiza precisa
 * de **três** coisas, e as três são mecânicas:
 *
 * 1. ser irmã do rolável, nunca filha — um `backdrop-filter` no nó mascarado
 *    sai recortado pela própria rampa;
 * 2. uma casca `relative`, senão o absoluto resolve contra um ancestral
 *    qualquer (medido no `Carousel`: 111px de camada contra 75 de viewport);
 * 3. `useScrollFade({ shell: true })` no rolável — irmão não lê custom
 *    property de irmão.
 *
 * `material` é o padrão porque é o que os consumidores pedem: o raio e a
 * vibrância do iOS. Em `false` ela cai no borrão base de 2px.
 */
function ScrollFadeBlurLayers({
  axis = "y",
  sides = "both",
  material = true,
}: {
  axis?: "x" | "y"
  sides?: "both" | "start" | "end"
  material?: boolean
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

function ScrollFade({
  className,
  viewportClassName,
  axis = "y",
  sides = "both",
  edge = "fade",
  children,
  ...props
}: React.ComponentProps<"div"> & {
  /** O eixo que dissolve. Os dois não se combinam. */
  axis?: "y" | "x"
  /** Desliga uma das pontas: `start` só dissolve no começo, `end` só no fim. */
  sides?: "both" | "start" | "end"
  /** O que a borda faz. `material` substitui a dissolução, não soma a ela. */
  edge?: "fade" | "blur" | "material"
  viewportClassName?: string
}) {
  const vertical = axis === "y"
  const material = edge === "material"
  const comBorrao = edge !== "fade"
  const ref = useScrollFade({ axis, sides, shell: comBorrao })

  return (
    // A moldura, a altura e a tinta moram aqui — e **só** aqui. O elemento
    // mascarado não pode desenhar nada: a máscara recorta o alfa dele inteiro,
    // borda e sombra externa junto, e um retângulo com os cantos apagados e os
    // lados opacos lê como falha de renderização.
    //
    // Ela é também a casca: hospeda o rolável e as camadas de borrão como
    // irmãos, e é nela que o hook publica as variáveis que os dois leem.
    <div
      data-slot="scroll-fade"
      data-axis={axis}
      data-edge={edge}
      className={cn("relative min-h-0", className)}
      {...props}
    >
      <div
        ref={ref}
        // A máscara sai no material, e quem a desliga é a própria utility: as
        // duas regras empatam em especificidade, e lá a do modo vem depois.
        data-scroll-fade-mode={material ? "material" : undefined}
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

      {comBorrao && (
        <ScrollFadeBlurLayers axis={axis} sides={sides} material={material} />
      )}
    </div>
  )
}

export { ScrollFade, ScrollFadeBlurLayers }
