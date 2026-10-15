"use client"

import * as React from "react"
import { Toggle as TogglePrimitive } from "radix-ui"
import { cva, type VariantProps } from "class-variance-authority"

import { CheckIcon } from "@heroicons/react/16/solid"

import { tileColorFor } from "@/lib/tile-palette"
import { cn } from "@/lib/utils"

/**
 * Um estado, não uma ação, e a silhueta precisa dizer isso antes do rótulo. É
 * fantasma: em repouso não tem cromo (sem borda, preenchimento nem sombra) e a
 * tinta é a apagada; ligado, a tinta fica cheia sobre o cinza do `secondary`. O
 * chão sozinho quase empata com o do `hover`, então quem responde é o salto de tinta.
 * Diferenças de propósito em relação ao `Button`: sem `active:translate-y-px` (o
 * toggle não é pressionado, passa a valer; o deslocamento sugeriria um retorno
 * que não existe), e a pele sem contorno se chama `plain`, a palavra do sistema
 * para "não desenha nada" (`Card`, `Tabs`, `Menubar`, `Accordion`), e não
 * `tertiary`, que é um degrau de uma escada que o toggle não tem.
 * - A cápsula é a forma de todo toggle (círculo nos degraus de ícone); a amostra
 *   (`swatch`) fica de canto, a família do `ColorTile`.
 * - `size="icon-*"`: quadrados, 28 · 32 · 36 · 40, como a coluna de ícone do `Button`.
 * - `variant="swatch"` com `color`: a amostra de cor dos seletores. A superfície é
 *   a do `ColorTile` (`--tile-color` pela `tileColorFor`, na claridade do sistema),
 *   então o que se escolhe é o que se vê. Escolhida, ganha o contorno de
 *   `--foreground` e um tique (o estado não depende só do contorno).
 * - `icon` e `iconOn`: o ícone acende ao ligar (contorno desligado, sólido ligado,
 *   a convenção do `ThemeToggle` e da `BottomBar`). É prop porque a peça não sabe o
 *   sólido de um ícone qualquer; os dois ficam montados e trocam por opacidade,
 *   porque o estado pode ser do Radix e montar e desmontar não tem o que esmaecer.
 * - `variant="chip"`: a ficha de filtro, classe a classe a superfície dos chips do
 *   `Badge` (`tagChipNeutral` desligada, `tagChipFilterSelected` ligada) e a da
 *   ficha do `RadioGroup`.
 * - `count`: a contagem ao lado do rótulo, tabular e no peso normal ("Transações
 *   8"); entra no nome acessível, porque é texto.
 */
const toggleVariants = cva(
  cn(
    "group/toggle inline-flex items-center justify-center gap-2 rounded-full border border-transparent bg-transparent",
    // Desligado é tinta apagada: é metade do sinal. Sem essa diferença, ligar só
    // acrescentaria um fundo, a caixa que fazia o controle parecer botão.
    "text-sm font-medium whitespace-nowrap text-muted-foreground",
    "transition-colors duration-(--duration-fast) ease-(--ease-out) outline-none",
    // `active:` é o par de toque do `hover:` (no telefone `hover` não existe).
    // O chão do hover é o mesmo cinza de sempre: `--muted` e `--secondary` são o
    // mesmo valor no escuro e ficam a 1,01 no claro, então o chão sozinho não separa
    // hover de ligado. Mantendo a tinta apagada, o hover diz "estou aqui" e só o
    // ligado diz "estou valendo".
    "hover:bg-muted active:bg-muted",
    "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/45",
    "disabled:pointer-events-none disabled:opacity-50",
    // Ligado é o cinza do `secondary`, não o verde da marca: o verde é a ação
    // principal e, num app de finanças, dinheiro que entra, e um toggle aceso de
    // verde competiria com o CTA. Quem carrega o sinal é a tinta; o chão só confirma.
    "data-[state=on]:bg-secondary data-[state=on]:text-secondary-foreground",
    "data-[state=on]:hover:bg-secondary-hover data-[state=on]:active:bg-secondary-hover",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
  ),
  {
    variants: {
      variant: {
        plain: "",
        // A exceção, para o toggle sozinho numa superfície sem outra pista de que ali se
        // clica. Sem `shadow-xs`: sombra levanta a peça da página, e estado não levanta.
        outline: "border-border",
        // A amostra de cor: a superfície do `ColorTile`, sem recuo; o estado é o
        // contorno de `--foreground` afastado 2px mais o tique. O realce de cinza não
        // vale (a cor é o conteúdo), e o `outline` não disputa com o anel de foco, que é `box-shadow`.
        swatch: [
          // O canto do `ColorTile` do `md` ao `2xl` (a linha, 12): a amostra é o
          // ladrilho que ela escolhe, e ao lado da prévia o `rounded-lg` (10) destoava.
          "rounded-row p-0 bg-(--tile-surface) text-(--tile-ink)",
          "hover:bg-(--tile-surface) active:bg-(--tile-surface)",
          "data-[state=on]:bg-(--tile-surface) data-[state=on]:text-(--tile-ink)",
          "data-[state=on]:hover:bg-(--tile-surface) data-[state=on]:active:bg-(--tile-surface)",
          // `outline-solid` explícito: a base declara `outline-none` e o `outline-2` só
          // mexe na largura, então o estilo computaria `none`.
          "data-[state=on]:outline-2 data-[state=on]:outline-solid data-[state=on]:outline-offset-2 data-[state=on]:outline-foreground",
        ].join(" "),
        // A ficha. Repouso e escolha são `tagChipNeutral` e `tagChipFilterSelected` do
        // `Badge`, reescritas sob o estado (uma constante não se prefixa; `toggle.test.ts`
        // cobra a igualdade). O foco é `outline`, porque o anel de 1px da escolha já é `ring`.
        chip: [
          "text-xs font-semibold",
          "bg-muted text-muted-foreground",
          "hover:bg-muted hover:text-foreground active:bg-muted active:text-foreground",
          "data-[state=on]:bg-primary-muted data-[state=on]:text-primary-muted-foreground data-[state=on]:ring-1 data-[state=on]:ring-primary-accent/25 dark:data-[state=on]:ring-primary-accent/40",
          "data-[state=on]:hover:bg-primary-muted data-[state=on]:active:bg-primary-muted",
          "focus-visible:border-transparent focus-visible:ring-0 focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-ring",
        ].join(" "),
      },
      // A versão da amostra: as utilities só publicam `--tile-surface` e `--tile-ink`,
      // então fora do `swatch` não pintam nada.
      tint: {
        vivid: "tile-vivid",
        soft: "tile-soft",
      },
      // As alturas são a escada do projeto (28, 32, 36); `default` foi removido de
      // `Button`, `Input`, `SelectTrigger` e `NativeSelect` para o compilador acusar
      // quem o escrevesse.
      size: {
        // O recuo é o da cápsula: meio degrau acima do retângulo de antes.
        sm: "h-7 min-w-7 px-2.5 text-xs",
        md: "h-8 min-w-8 px-3",
        lg: "h-9 min-w-9 px-3.5",
        // A coluna de ícone do `Button`, degrau a degrau.
        "icon-sm": "size-7 p-0",
        "icon-md": "size-8 p-0",
        "icon-lg": "size-9 p-0",
        "icon-xl": "size-10 p-0 [&_svg:not([class*='size-'])]:size-5",
      },
    },
    defaultVariants: {
      variant: "plain",
      tint: "vivid",
      size: "md",
    },
  }
)

type HeroIcon = React.ComponentType<React.ComponentProps<"svg">>

/** O que o toggle e o item do grupo recebem além da primitiva. */
type ToggleExtras = {
  /** O ícone desligado — de contorno, se houver `iconOn`. */
  icon?: HeroIcon
  /** O ícone ligado, o par sólido: o ícone acende quando o estado liga. */
  iconOn?: HeroIcon
  /** Com `variant="swatch"`, a cor gravada — a mesma que o `ColorTile` recebe. */
  color?: string | null
  /** A contagem ao lado do rótulo ("Transações 8"). */
  count?: React.ReactNode
}

/** A cor da amostra desce por variável, como no `ColorTile`. */
function toggleStyle(color: string | null | undefined, style?: React.CSSProperties) {
  if (color === undefined) return style
  return {
    "--tile-color": tileColorFor(color) ?? "var(--muted-foreground)",
    ...style,
  } as React.CSSProperties
}

/**
 * O miolo, dividido com o `ToggleGroupItem`: o ícone (com o par que acende), o
 * conteúdo e, na amostra, o tique.
 */
function ToggleContent({
  variant,
  icon: Icone,
  iconOn: IconeLigado,
  count,
  children,
}: Omit<ToggleExtras, "color"> & {
  variant?: VariantProps<typeof toggleVariants>["variant"]
  children?: React.ReactNode
}) {
  return (
    <>
      {variant === "swatch" ? (
        <CheckIcon
          aria-hidden
          className="hidden size-4 group-data-[state=on]/toggle:block"
        />
      ) : null}
      {Icone && IconeLigado ? (
        <span data-slot="toggle-icon" aria-hidden className="relative size-4 shrink-0">
          <Icone className="absolute inset-0 size-4 transition-opacity duration-(--duration-fast) ease-(--ease-out) group-data-[state=on]/toggle:opacity-0" />
          <IconeLigado className="absolute inset-0 size-4 opacity-0 transition-opacity duration-(--duration-fast) ease-(--ease-out) group-data-[state=on]/toggle:opacity-100" />
        </span>
      ) : Icone ? (
        <Icone aria-hidden data-slot="toggle-icon" />
      ) : null}
      {children}
      {count != null ? (
        <>
          {/*
             O espaço é para o nome acessível: sem ele o leitor de tela ouve "Transações8".
             Num flex um texto só de espaço não ocupa lugar; o respiro visual é o `gap`.
          */}
          {" "}
          {/*
             No peso normal: o rótulo é o nome, o número é o tamanho dele. Sem opacidade:
             a tinta apagada a 70% cairia abaixo de 4,5:1.
          */}
          <span data-slot="toggle-count" className="font-normal tabular-nums">
            {count}
          </span>
        </>
      ) : null}
    </>
  )
}

function Toggle({
  className,
  variant,
  tint,
  size,
  icon,
  iconOn,
  color,
  count,
  style,
  children,
  ...props
}: React.ComponentProps<typeof TogglePrimitive.Root> &
  VariantProps<typeof toggleVariants> &
  ToggleExtras) {
  return (
    <TogglePrimitive.Root
      data-slot="toggle"
      data-variant={variant ?? "plain"}
      className={cn(toggleVariants({ variant, tint, size, className }))}
      style={toggleStyle(color, style)}
      {...props}
    >
      <ToggleContent variant={variant} icon={icon} iconOn={iconOn} count={count}>
        {children}
      </ToggleContent>
    </TogglePrimitive.Root>
  )
}

export { Toggle, ToggleContent, toggleStyle, toggleVariants }
export type { ToggleExtras }
