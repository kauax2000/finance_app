"use client"

import * as React from "react"
import { Toggle as TogglePrimitive } from "radix-ui"
import { cva, type VariantProps } from "class-variance-authority"

import { CheckIcon } from "@heroicons/react/16/solid"

import { tileColorFor } from "@/lib/tile-palette"
import { cn } from "@/lib/utils"

/**
 * Um estado, não uma ação — e a silhueta precisa dizer isso antes do rótulo.
 *
 * O desenho anterior era um `Button variant="secondary"` com outro nome: canto
 * `xl`, contorno visível quando ligado, preenchimento cinza, e no `outline`
 * ainda um `shadow-xs`. Três sinais que a interface reserva para "clique aqui
 * para fazer algo", num controle que só responde "isto está ligado".
 *
 * Agora ele é fantasma: **em repouso não tem cromo nenhum** — sem borda, sem
 * preenchimento, sem sombra, e a tinta é a apagada. Ligado, a tinta fica cheia
 * sobre o cinza do `secondary`. O chão sozinho não seria sinal — ele quase
 * empata com o do `hover` —, e é por isso que o salto de tinta é que responde.
 *
 * Duas diferenças de propósito em relação ao `Button`:
 *
 * - **Sem `active:translate-y-px`.** O botão afunda porque foi pressionado e
 *   algo aconteceu. O toggle não é pressionado, ele passa a valer — e o
 *   deslocamento sugeria um retorno que não existe.
 * - **A pele sem contorno não se chama `tertiary`.** No `Button` o nome diz um
 *   degrau de uma escada de três; o toggle não tem escada, tem duas peles, e o
 *   nome descreve o cromo em vez de uma posição que não existe. Ela se chama
 *   `plain`, que é a palavra do sistema para "não desenha nada" (o `Card`, o
 *   `Tabs`, o `Menubar` e o `Accordion` dizem o mesmo).
 *
 * ## As versões da rodada 183
 *
 * - **`shape="pill"`** — o eixo do `Button`, com meio degrau a mais de recuo;
 *   nos degraus de ícone vira círculo. Os filtros da atividade o escreviam à
 *   mão (`rounded-full px-3`).
 * - **`size="icon-*"`** — quadrados, 28 · 32 · 36 · 40, como a coluna de
 *   ícone do `Button`. As grades de ícone escreviam `size-9` e `size-11`.
 * - **`variant="swatch"` com `color`** — a amostra de cor dos seletores. A
 *   superfície é a do `ColorTile` (`--tile-color` pela `tileColorFor`, na
 *   claridade do sistema), então **o que se escolhe é o que se vê** no
 *   ladrilho; antes a amostra pintava o hex cru e o ladrilho mostrava outra
 *   cor. Escolhida, ganha o contorno de `--foreground` e um tique — o estado
 *   não depende só do contorno. Eram dois desenhos à mão, um quadrado com anel
 *   primário e um círculo com borda.
 * - **`icon` e `iconOn`** — o ícone acende ao ligar: contorno desligado,
 *   sólido ligado, a convenção das faces do `ThemeToggle` e das abas da
 *   `BottomBar`. É prop e não derivação, pela razão da `BottomBar`: a peça não
 *   tem como saber o sólido de um ícone qualquer. Os dois ficam montados e
 *   trocam por opacidade, porque o estado pode ser do Radix (não controlado) e
 *   montar e desmontar não tem o que esmaecer.
 *
 * ## As versões da rodada 199
 *
 * - **`variant="chip"`** — a ficha de filtro, classe a classe a superfície dos
 *   chips do `Badge` (`tagChipNeutral` desligada, `tagChipFilterSelected`
 *   ligada) e a mesma da ficha do `RadioGroup`. A folha de filtros das
 *   transações a escrevia à mão, num `Button aria-pressed`.
 * - **`count`** — a contagem ao lado do rótulo, em algarismos tabulares e no
 *   peso normal: "Transações 8". Entra no nome acessível, porque é texto. Os
 *   filtros da atividade a escreviam como "(8)" dentro do rótulo.
 */
const toggleVariants = cva(
  cn(
    "group/toggle inline-flex items-center justify-center gap-2 rounded-lg border border-transparent bg-transparent",
    // Desligado é tinta apagada. É metade do sinal: sem essa diferença de
    // tinta, ligar só acrescentaria um fundo, e o fundo sozinho é a caixa que
    // fazia o controle parecer botão.
    "text-sm font-medium whitespace-nowrap text-muted-foreground",
    "transition-colors duration-(--duration-fast) ease-(--ease-out) outline-none",
    // `active:` é o par de toque do `hover:` — no telefone `hover` não existe,
    // e sem ele encostar no controle não devolvia nada.
    //
    // O chão do hover é o mesmo cinza de sempre; o que saiu foi a troca de
    // tinta que vinha junto. `--muted` e `--secondary` são o mesmo valor no
    // escuro e ficam a 1,01 no claro, então o chão sozinho não separa hover de
    // ligado — com a tinta trocando também, passar o ponteiro num toggle
    // desligado o deixava idêntico a um ligado. Mantendo a tinta apagada, o
    // hover diz "estou aqui" e só o ligado diz "estou valendo".
    "hover:bg-muted active:bg-muted",
    "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/45",
    "disabled:pointer-events-none disabled:opacity-50",
    // Ligado é o cinza do `secondary`, não o verde da marca. O verde já é a
    // ação principal e, num app de finanças, também é dinheiro que entra: um
    // toggle aceso de verde competia com o CTA da tela e pedia para ser lido
    // como sinal de valor. Estado não gasta a cor que a ação precisa.
    //
    // Quem carrega o sinal continua sendo a tinta — apagada desligado, cheia
    // ligado —, e o chão só confirma. É a diferença para o desenho antigo, que
    // era o mesmo cinza somado a borda visível e sombra.
    "data-[state=on]:bg-secondary data-[state=on]:text-secondary-foreground",
    "data-[state=on]:hover:bg-secondary-hover data-[state=on]:active:bg-secondary-hover",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
  ),
  {
    variants: {
      variant: {
        plain: "",
        // A exceção, para o toggle que aparece sozinho numa superfície sem
        // nenhuma outra pista de que ali se clica. Sem o `shadow-xs` de antes:
        // sombra é o que levanta a peça da página, e estado não levanta.
        outline: "border-border",
        // A amostra de cor (rodada 183): a superfície do `ColorTile`, sem
        // recuo, e o estado é o contorno de `--foreground` afastado 2px mais o
        // tique. O realce de cinza não vale aqui — a cor é o conteúdo —, e o
        // `outline` não disputa com o anel de foco, que é `box-shadow`.
        swatch: [
          "p-0 bg-(--tile-surface) text-(--tile-ink)",
          "hover:bg-(--tile-surface) active:bg-(--tile-surface)",
          "data-[state=on]:bg-(--tile-surface) data-[state=on]:text-(--tile-ink)",
          "data-[state=on]:hover:bg-(--tile-surface) data-[state=on]:active:bg-(--tile-surface)",
          // `outline-solid` explícito: a base declara `outline-none`, e o
          // `outline-2` só mexe na largura — medido, o estilo computava `none`
          // e a escolhida saía sem contorno.
          "data-[state=on]:outline-2 data-[state=on]:outline-solid data-[state=on]:outline-offset-2 data-[state=on]:outline-foreground",
        ].join(" "),
        // A ficha (rodada 199). Repouso e escolha são `tagChipNeutral` e
        // `tagChipFilterSelected` do `Badge`, reescritas sob o estado — uma
        // constante não se prefixa; `toggle.test.ts` cobra a igualdade. O
        // foco é `outline`, porque o anel de 1px da escolha já é `ring`.
        chip: [
          "rounded-full text-xs font-semibold",
          "bg-muted text-muted-foreground",
          "hover:bg-muted hover:text-foreground active:bg-muted active:text-foreground",
          "data-[state=on]:bg-primary-muted data-[state=on]:text-primary-muted-foreground data-[state=on]:ring-1 data-[state=on]:ring-primary-accent/25 dark:data-[state=on]:ring-primary-accent/40",
          "data-[state=on]:hover:bg-primary-muted data-[state=on]:active:bg-primary-muted",
          "focus-visible:border-transparent focus-visible:ring-0 focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-ring",
        ].join(" "),
      },
      shape: {
        rounded: "",
        pill: "rounded-full",
      },
      // A versão da amostra (rodada 184): as utilities só publicam
      // `--tile-surface` e `--tile-ink`, então fora do `swatch` não pintam nada.
      tint: {
        vivid: "tile-vivid",
        soft: "tile-soft",
      },
      // As alturas já eram a escada do projeto — 28, 32, 36 —, só que o degrau
      // do meio se chamava `default`. O nome foi removido de `Button`, `Input`,
      // `SelectTrigger` e `NativeSelect` justamente para o compilador acusar
      // quem o escrevesse; este era o último lugar que ainda o dizia.
      size: {
        sm: "h-7 min-w-7 px-1.5 text-xs",
        md: "h-8 min-w-8 px-2",
        lg: "h-9 min-w-9 px-2.5",
        // A coluna de ícone do `Button`, degrau a degrau (rodada 183).
        "icon-sm": "size-7 p-0",
        "icon-md": "size-8 p-0",
        "icon-lg": "size-9 p-0",
        "icon-xl": "size-10 p-0 [&_svg:not([class*='size-'])]:size-5",
      },
    },
    // A pílula ganha meio degrau de recuo, como no `Button`.
    compoundVariants: [
      { shape: "pill", size: "sm", class: "px-2.5" },
      { shape: "pill", size: "md", class: "px-3" },
      { shape: "pill", size: "lg", class: "px-3.5" },
      // A ficha é pílula por natureza, com o mesmo meio degrau de recuo.
      { variant: "chip", size: "sm", class: "px-2.5" },
      { variant: "chip", size: "md", class: "px-3" },
      { variant: "chip", size: "lg", class: "px-3.5" },
    ],
    defaultVariants: {
      variant: "plain",
      shape: "rounded",
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
  /** A contagem ao lado do rótulo — "Transações 8" (rodada 199). */
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
 * O miolo, dividido com o `ToggleGroupItem`: o ícone (com o par que acende),
 * o conteúdo e, na amostra, o tique.
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
          {/* O espaço é para o nome acessível: sem ele o leitor de tela ouvia
              "Transações8" (medido no `textContent`). Num flex, um texto só de
              espaço não ocupa lugar — o respiro visual é o `gap`. */}
          {" "}
          {/* No peso normal: o rótulo é o nome, o número é o tamanho dele. Sem
              opacidade — a tinta apagada a 70% cairia abaixo de 4,5:1. */}
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
  shape,
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
      className={cn(toggleVariants({ variant, shape, tint, size, className }))}
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
