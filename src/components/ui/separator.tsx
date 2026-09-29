"use client"

import * as React from "react"
import { Separator as SeparatorPrimitive } from "radix-ui"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * A régua.
 *
 * ## O peso é um prop (`tone`)
 *
 * O app tinha **três** pesos da mesma linha escritos à mão — `bg-border`,
 * `bg-border/60`, `bg-border/80` e um `opacity-60` —, medidos contra o cartão
 * em 1,35, 1,19 e 1,26: diferenças reais, nenhuma dita em lugar nenhum. A
 * intenção era uma só, e é legítima: a régua que **estrutura** uma página pesa
 * mais que a que **arruma** o interior de uma superfície já delimitada.
 *
 * O peso mora numa variável (`--separator-color`), e não numa classe de fundo,
 * porque três desenhos a leem de jeitos diferentes: o `solid` pinta o fundo, o
 * `dashed` pinta a borda, e o `fade` a põe no meio de um degradê.
 *
 * ## O desenho é `variant` (rodada 175)
 *
 * - **`solid`** (o padrão) — a linha de 1px.
 * - **`dashed`** — tracejada, a do extrato antes de um total: diz "o que vem
 *   abaixo é a soma do que vem acima".
 * - **`fade`** — some nas duas pontas, para separar blocos soltos numa página
 *   sem desenhar a aresta de uma caixa.
 *
 * ## `bleed` atravessa o recuo da superfície
 *
 * A régua encosta nas bordas de quem a contém, lendo o recuo que a superfície
 * **publica**: `--card-px` num `Card`, `--dialog-px` num `Dialog` ou numa
 * folha (a ordem é essa porque um cartão dentro de um diálogo tem o recuo
 * dele). Quem não publica recuo escreve `--separator-bleed`. Era o `-mx-4
 * w-[calc(100%+2rem)] sm:-mx-5 …` que os filtros de transação escreviam em
 * cinco réguas — e erravam, porque a folha recua 16px em toda largura.
 *
 * ## `children` é o rótulo do meio
 *
 * Duas meias-réguas e o texto entre elas: o "ou" de um formulário, o "Hoje"
 * de uma lista. Sem retângulo mascarando o meio de uma linha inteira — ele só
 * acerta a cor direto na página. O `FieldSeparator` compõe esta peça.
 */
const separatorVariants = cva("shrink-0", {
  variants: {
    tone: {
      default: "[--separator-color:var(--border)]",
      soft: "[--separator-color:color-mix(in_oklab,var(--border)_60%,transparent)]",
    },
  },
  defaultVariants: {
    tone: "default",
  },
})

type SeparatorVariant = "solid" | "dashed" | "fade"
type Orientation = "horizontal" | "vertical"

/** O desenho da linha, por orientação. Literal por extenso: o Tailwind lê texto. */
function linha(variant: SeparatorVariant, orientation: Orientation, metade?: "inicio" | "fim") {
  const h = orientation === "horizontal"
  if (variant === "dashed") {
    return h ? "h-0 border-t border-dashed border-(--separator-color)" : "w-0 border-l border-dashed border-(--separator-color)"
  }
  if (variant === "fade") {
    // Com rótulo, cada metade some só na ponta de fora.
    if (metade === "inicio") return "bg-linear-to-r from-transparent to-(--separator-color)"
    if (metade === "fim") return "bg-linear-to-r from-(--separator-color) to-transparent"
    return h
      ? "bg-linear-to-r from-transparent via-(--separator-color) to-transparent"
      : "bg-linear-to-b from-transparent via-(--separator-color) to-transparent"
  }
  return "bg-(--separator-color)"
}

/** O recuo que a régua atravessa: o do cartão, o da folha ou o declarado. */
const BLEED =
  "[--separator-bleed-x:var(--separator-bleed,var(--card-px,var(--dialog-px,0px)))] -mx-(--separator-bleed-x) w-[calc(100%_+_2*var(--separator-bleed-x))] max-w-none"

function Separator({
  className,
  orientation = "horizontal",
  decorative = true,
  tone,
  variant = "solid",
  bleed = false,
  children,
  ...props
}: React.ComponentProps<typeof SeparatorPrimitive.Root> &
  VariantProps<typeof separatorVariants> & {
    /** O desenho: linha, tracejado ou pontas que dissolvem. */
    variant?: SeparatorVariant
    /** Atravessa o recuo da superfície e encosta nas bordas. Só na horizontal. */
    bleed?: boolean
    /** O rótulo do meio. Só na horizontal. */
    children?: React.ReactNode
  }) {
  const horizontal = orientation === "horizontal"

  if (children != null && horizontal) {
    // Com rótulo, a peça é uma fileira: as duas metades são decorativas e o
    // texto é texto. `decorative={false}` põe o papel na fileira, e o rótulo
    // vira o nome dela.
    const metade = (lado: "inicio" | "fim") => (
      <span
        aria-hidden
        data-slot="separator-line"
        className={cn("h-px min-w-4 flex-1", linha(variant, "horizontal", lado), variant === "dashed" && "h-0")}
      />
    )
    return (
      <div
        data-slot="separator"
        data-variant={variant}
        data-tone={tone ?? "default"}
        role={decorative ? undefined : "separator"}
        aria-orientation={decorative ? undefined : "horizontal"}
        className={cn(
          separatorVariants({ tone }),
          "flex w-full items-center gap-3 text-xs font-medium text-muted-foreground",
          bleed && BLEED,
          className
        )}
        {...(props as React.ComponentProps<"div">)}
      >
        {metade("inicio")}
        <span data-slot="separator-label" className="shrink-0">
          {children}
        </span>
        {metade("fim")}
      </div>
    )
  }

  return (
    <SeparatorPrimitive.Root
      data-slot="separator"
      data-variant={variant}
      data-tone={tone ?? "default"}
      decorative={decorative}
      orientation={orientation}
      className={cn(
        separatorVariants({ tone }),
        // As medidas saem de uma condicional, e não de
        // `data-[orientation=…]:h-4` como antes. Classe com variante não entra
        // no mesmo grupo do merge do Tailwind, então uma classe crua no
        // `className` não a substituía — ela simplesmente não fazia nada.
        //
        // Custou preço duas vezes: o cabeçalho do catálogo pediu `h-5` num
        // separador vertical e continuou com 16px, e o painel de filtros de
        // transações teve que copiar o prefixo inteiro para vencer a base. Um
        // componente que promete um ponto de extensão precisa entregá-lo.
        horizontal ? "h-px w-full" : "h-4 w-px self-center",
        linha(variant, orientation),
        horizontal && bleed && BLEED,
        className
      )}
      {...props}
    />
  )
}

export { Separator, separatorVariants }
