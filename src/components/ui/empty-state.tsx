"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { CheckIcon } from "@heroicons/react/24/outline"

import { cn } from "@/lib/utils"
import { ButtonSizeContext, type ButtonSize } from "@/components/ui/button"
import { H1, H4, Muted } from "@/components/ui/typography"

/**
 * O que a tela diz quando não há nada nela. O respiro é do pai (`gap`), e nenhum
 * filho declara margem. A forma diz a situação:
 *
 * | Situação | Forma |
 * | --- | --- |
 * | primeiro uso | `EmptyStateGhost` |
 * | filtro, período ou lista vazia | `EmptyStateIcon variant="stack"` |
 * | não encontrado | `size="page"` + `EmptyStateCode` ("404") |
 * | erro de runtime | `size="page"` + `EmptyStateCode` ("Ops!") |
 * | boa notícia (nada a fazer) | `EmptyStateIcon variant="done"` |
 * | o vazio pequeno de um formulário | `layout="inline"` |
 *
 * O arco-íris da marca fica só no numeral das páginas de erro. O título é um
 * `<p>` estilizado, não um `<h2>` cravado (o bloco pode estar dentro de uma
 * seção que já tem o seu); `asChild` traz o nível certo.
 */
const emptyStateVariants = cva(
  "flex flex-col items-center justify-center text-center",
  {
    variants: {
      variant: {
        dashed: "rounded-surface border border-dashed border-border bg-muted/20",
        card: "rounded-surface border border-border bg-card/40 bg-clip-padding",
        // Sem moldura, para dentro de um `Card` ou de uma célula de tabela que já tem a sua.
        plain: "",
      },
      size: {
        sm: "gap-2 px-4 py-6 [--empty-state-icon:--spacing(9)] [--empty-state-tile-r:var(--radius-md)]",
        md: "gap-3 px-6 py-10 [--empty-state-icon:--spacing(12)] [--empty-state-tile-r:var(--radius-lg)]",
        lg: "gap-4 px-6 py-16 [--empty-state-icon:--spacing(14)] [--empty-state-tile-r:var(--radius-row)]",
        // A página de erro ocupa a tela.
        page: "gap-4 px-6 py-24 [--empty-state-icon:--spacing(14)] [--empty-state-tile-r:var(--radius-row)]",
      },
      /**
       * `inline`: o vazio pequeno de formulário ou painel estreito, com o ícone
       * à esquerda e o texto e a ação à direita. É grade (o ícone atravessa as
       * linhas) e vem depois do `size`, para o `tailwind-merge` trocar o respiro
       * e a medida do ícone do degrau pelos daqui.
       */
      layout: {
        stack: "",
        inline: [
          "grid items-start justify-stretch gap-x-3 gap-y-0.5 p-3 text-left [--empty-state-icon:--spacing(8)] [--empty-state-tile-r:var(--radius-md)]",
          "has-[>[data-slot=empty-state-icon]]:grid-cols-[auto_1fr]",
          "[&>[data-slot=empty-state-icon]]:row-span-3",
          "has-[>[data-slot=empty-state-icon]]:[&>:not([data-slot=empty-state-icon])]:col-start-2",
        ].join(" "),
      },
    },
    defaultVariants: {
      variant: "dashed",
      size: "md",
      layout: "stack",
    },
  }
)

type EmptyStateSize = NonNullable<VariantProps<typeof emptyStateVariants>["size"]>
type EmptyStateLayout = NonNullable<VariantProps<typeof emptyStateVariants>["layout"]>

/** O degrau desce por contexto: o título de `page` é outro átomo, não outra classe. */
const EmptyStateContext = React.createContext<{
  size: EmptyStateSize
  layout: EmptyStateLayout
}>({ size: "md", layout: "stack" })

function EmptyState({
  className,
  variant,
  size,
  layout,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof emptyStateVariants>) {
  const contexto = React.useMemo(
    () => ({ size: size ?? "md", layout: layout ?? "stack" }),
    [size, layout]
  )
  return (
    <EmptyStateContext value={contexto}>
      <div
        data-slot="empty-state"
        data-variant={variant ?? "dashed"}
        data-size={size ?? "md"}
        data-layout={layout ?? "stack"}
        className={cn(
          "group/empty-state",
          emptyStateVariants({ variant, size, layout }),
          className
        )}
        {...props}
      />
    </EmptyStateContext>
  )
}

const emptyStateIconVariants = cva(
  "flex shrink-0 items-center justify-center [&_svg]:size-[calc(var(--empty-state-icon)/2)]",
  {
    variants: {
      variant: {
        circle: "size-(--empty-state-icon) rounded-full",
        // O leque não pinta a própria caixa: quem tem superfície são os
        // ladrilhos, e o `tone` fica na tinta dos ícones.
        stack: "h-(--empty-state-icon)",
        /**
         * Tudo em dia: o vazio que é boa notícia. O círculo nasce na mola e o
         * tique se desenha por `clip-path` (e não por traço de SVG, para o
         * ícone continuar o do Heroicons), pelo `@starting-style`. O
         * `clip-path` final é declarado (`inset(0)`) porque `none` não
         * interpola com `inset()`.
         */
        done: [
          "size-(--empty-state-icon) rounded-full",
          "transition-[scale] duration-(--duration-spring) ease-(--ease-spring) starting:scale-50",
          "[&_svg]:[clip-path:inset(0)] [&_svg]:transition-[clip-path] [&_svg]:delay-150 [&_svg]:duration-(--duration-slow) [&_svg]:ease-(--ease-out)",
          "starting:[&_svg]:[clip-path:inset(0_100%_0_0)]",
        ].join(" "),
      },
      // Um estado de erro é um estado vazio de outra natureza, e a cor é do sistema.
      tone: {
        default: "text-muted-foreground",
        info: "text-info-muted-foreground",
        success: "text-success-muted-foreground",
        warning: "text-warning-muted-foreground",
        destructive: "text-destructive-muted-foreground",
      },
    },
    // A superfície tonal é só do círculo; no leque o tom fica na tinta.
    compoundVariants: [
      { variant: "done", tone: "default", className: "bg-muted" },
      { variant: "done", tone: "success", className: "bg-success-muted" },
      { variant: "circle", tone: "default", className: "bg-muted" },
      { variant: "circle", tone: "info", className: "bg-info-muted" },
      { variant: "circle", tone: "success", className: "bg-success-muted" },
      { variant: "circle", tone: "warning", className: "bg-warning-muted" },
      { variant: "circle", tone: "destructive", className: "bg-destructive-muted" },
    ],
    defaultVariants: {
      variant: "circle",
      tone: "default",
    },
  }
)

/**
 * Os três ladrilhos do leque: o do meio levantado, os laterais inclinados por
 * baixo. No cursor ou no toque (par `active:`) eles se afastam na mola da casa.
 * Escrito por posição, porque cada um se move para o seu lado.
 */
const TILE_POSICAO = [
  "-me-3 -rotate-8 translate-y-1 group-hover/empty-state:-rotate-14 group-hover/empty-state:-translate-x-2 group-active/empty-state:-rotate-14 group-active/empty-state:-translate-x-2",
  "z-10 group-hover/empty-state:-translate-y-1.5 group-active/empty-state:-translate-y-1.5",
  "-ms-3 rotate-8 translate-y-1 group-hover/empty-state:rotate-14 group-hover/empty-state:translate-x-2 group-active/empty-state:rotate-14 group-active/empty-state:translate-x-2",
] as const

function EmptyStateIcon({
  className,
  variant,
  tone,
  children,
  ...props
}: React.ComponentProps<"div"> &
  VariantProps<typeof emptyStateIconVariants>) {
  const leque = variant === "stack"
  const feito = variant === "done"
  // Boa notícia é verde por padrão; quem quiser outro tom passa `tone`.
  const tom = tone ?? (feito ? "success" : "default")
  return (
    <div
      data-slot="empty-state-icon"
      data-variant={variant ?? "circle"}
      data-tone={tom}
      className={cn(emptyStateIconVariants({ variant, tone: tom }), className)}
      {...props}
    >
      {feito && !children ? <CheckIcon aria-hidden /> : null}
      {leque
        ? React.Children.toArray(children)
            .slice(0, 3)
            .map((filho, i) => (
              <span
                key={i}
                data-slot="empty-state-icon-tile"
                className={cn(
                  // O canto é o degrau da escada (8 · 10 · 12) pelo degrau do vazio.
                  "flex size-(--empty-state-icon) items-center justify-center rounded-(--empty-state-tile-r) border border-border bg-card bg-clip-padding shadow-sm",
                  "transition-[rotate,translate] duration-(--duration-spring) ease-(--ease-spring)",
                  TILE_POSICAO[i]
                )}
              >
                {filho}
              </span>
            ))
        : children}
    </div>
  )
}

/**
 * O título. `asChild` é a saída para quando ele precisa ser um cabeçalho (uma
 * 404 quer `<h1>`; um bloco no meio de uma lista não quer nível nenhum).
 */
function EmptyStateTitle({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<"p"> & { asChild?: boolean }) {
  const { size } = React.useContext(EmptyStateContext)
  // Na página de erro o título nasce `<h1>`, sem `asChild`: um server component
  // que passava `<h1>` por `asChild` o entregava ao `Slot` do Radix como
  // referência preguiçosa do RSC e o título sumia sem erro.
  if (size === "page") {
    const PageComp = asChild ? Slot.Root : "h1"
    return (
      <H1 asChild data-slot="empty-state-title" className={cn("text-4xl sm:text-5xl", className)}>
        <PageComp {...props} />
      </H1>
    )
  }
  const Comp = asChild ? Slot.Root : "p"
  // O estilo é o do `H4`, um degrau abaixo no corpo; o elemento segue sendo o
  // `<p>` (ou o que `asChild` trouxer).
  return (
    <H4 asChild data-slot="empty-state-title" className={cn("text-base text-balance", className)}>
      <Comp {...props} />
    </H4>
  )
}

function EmptyStateDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <Muted
      data-slot="empty-state-description"
      className={cn("max-w-sm text-pretty", className)}
      {...props}
    />
  )
}

/**
 * As ações. Ganham uma folga a mais que o `gap` do bloco: um botão logo abaixo
 * de um parágrafo lê como parte dele.
 */
/**
 * O degrau dos botões sai do bloco pelo `ButtonSizeContext`: `sm` e `md` ficam
 * em `md` (32; eram 28 até a rodada 322), `lg` e `page` em `xl`. Um `size` no
 * botão vence.
 */
const ACOES_DEGRAU: Record<EmptyStateSize, ButtonSize> = {
  sm: "md",
  md: "md",
  lg: "xl",
  page: "xl",
}

function EmptyStateActions({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  const { size, layout } = React.useContext(EmptyStateContext)
  return (
    <div
      data-slot="empty-state-actions"
      className={cn(
        "mt-1 flex flex-wrap items-center justify-center gap-2",
        // Em linha, a ação alinha com o texto: o `link` do `Button` traz recuo
        // lateral. O seletor de atributo vence a classe do degrau.
        layout === "inline" && "justify-start [&>[data-variant=link]]:px-0",
        className
      )}
      {...props}
    >
      <ButtonSizeContext value={ACOES_DEGRAU[size]}>{children}</ButtonSizeContext>
    </div>
  )
}

/**
 * Os fantasmas: linhas da lista que ainda não existe, subindo devagar atrás do
 * título e dissolvendo nas bordas (o primeiro uso é um convite, não uma
 * ausência). As props são de forma (`leading`, `trailing`), não de domínio. O
 * laço não tem emenda porque as linhas são duplicadas e o respiro é margem, não
 * `gap`; o movimento reduzido o congela no quadro 0.
 */
const GHOST_LEADING = {
  tile: "size-7 rounded-md",
  card: "h-5 w-8 rounded-sm",
  avatar: "size-7 rounded-full",
} as const

const GHOST_TRAILING = {
  amount: "h-2 w-12 rounded-full bg-muted",
  date: "h-5 w-11 rounded-md bg-muted/70",
  none: "hidden",
} as const

/** A largura do nome muda de linha a linha, senão a lista lê como carimbo. */
const GHOST_LARGURA = ["w-3/5", "w-2/5", "w-4/5", "w-1/2", "w-2/3", "w-1/3"] as const

function EmptyStateGhost({
  className,
  leading = "tile",
  trailing = "amount",
  ...props
}: React.ComponentProps<"div"> & {
  leading?: keyof typeof GHOST_LEADING
  trailing?: keyof typeof GHOST_TRAILING
}) {
  const linhas = [...GHOST_LARGURA, ...GHOST_LARGURA]
  return (
    <div
      data-slot="empty-state-ghost"
      aria-hidden
      className={cn(
        "relative h-40 w-full max-w-xs overflow-hidden",
        "[mask-image:linear-gradient(to_bottom,transparent,#000_30%,#000_70%,transparent)]",
        className
      )}
      {...props}
    >
      <div className="empty-state-drift">
        {linhas.map((largura, i) => (
          <div
            key={i}
            className="mb-2 flex h-11 items-center gap-3 rounded-lg border border-border bg-card/70 bg-clip-padding px-3"
          >
            <span className={cn("shrink-0 bg-muted", GHOST_LEADING[leading])} />
            <span className="flex min-w-0 flex-1 flex-col items-start gap-1.5">
              <span className={cn("h-2 rounded-full bg-muted", largura)} />
              <span className="h-1.5 w-1/4 rounded-full bg-muted/60" />
            </span>
            <span className={cn("shrink-0", GHOST_TRAILING[trailing])} />
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * O numeral — ou a palavra — da página de erro ("404", "Ops!"), `aria-hidden`
 * (quem diz o que houve é o título). Na Ledger, com o arco-íris preenchendo o
 * glifo e dissolvendo para baixo até o título pousar na base; desliza de ida e
 * volta porque o `--brand-rainbow` é linear.
 */
const EMPTY_STATE_CODE = [
  "pointer-events-none select-none font-display leading-none",
  "brand-rainbow-image bg-(image:--brand-rainbow) bg-clip-text text-transparent",
  "empty-state-sheen",
  "[mask-image:linear-gradient(to_bottom,#000_30%,transparent_85%)]",
].join(" ")

/**
 * O corpo do numeral acompanha o bloco. O recuo negativo de baixo faz o título
 * pousar na base dissolvida e cresce com o corpo.
 */
const CODE_DEGRAU: Record<EmptyStateSize, string> = {
  sm: "-mb-3 text-5xl",
  md: "-mb-4 text-6xl sm:-mb-6 sm:text-7xl",
  lg: "-mb-6 text-7xl sm:-mb-8 sm:text-8xl",
  page: "-mb-8 text-8xl sm:-mb-12 sm:text-9xl",
}

function EmptyStateCode({ className, ...props }: React.ComponentProps<"span">) {
  const { size } = React.useContext(EmptyStateContext)
  return (
    <span
      data-slot="empty-state-code"
      aria-hidden
      className={cn(EMPTY_STATE_CODE, CODE_DEGRAU[size], className)}
      {...props}
    />
  )
}

export {
  EmptyState,
  EmptyStateCode,
  EmptyStateGhost,
  EmptyStateActions,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
  emptyStateVariants,
}
