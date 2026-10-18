import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { ChevronRightIcon } from "@heroicons/react/16/solid"

import { cn } from "@/lib/utils"
import { Muted } from "@/components/ui/typography"
import { Separator } from "@/components/ui/separator"

/**
 * A linha de uma lista: mídia, conteúdo, ações. `size` governa recuo, `gap` e a
 * mídia, e a altura sai da soma: uma linha cresce com o que carrega, e um título
 * que quebra empurra a linha em vez de ser recortado.
 */
const itemVariants = cva(
  [
    "group/item flex w-full items-center rounded-row-lg border text-start text-sm transition-colors duration-(--duration-instant) outline-none",
    // Só quebra quando há faixa: `ItemHeader` e `ItemFooter` ocupam a largura
    // toda e descem de linha; sem eles, conteúdo e ações ficam lado a lado e o
    // título trunca. `text-start` de fábrica, porque o `<button>` centraliza.
    "flex-nowrap has-[>[data-slot=item-header]]:flex-wrap has-[>[data-slot=item-footer]]:flex-wrap",
    // O link esticado (`ItemLink`, como o `CardLink`): a película dele cobre a
    // linha, o foco dele acende o anel da linha, e as ações sobem acima dela.
    // `isolate`: o `z-10` das ações fica dentro da linha, e não passa por cima
    // do `ItemGroupLabel sticky` (também `z-10`) ao rolar.
    "has-[[data-slot=item-link]]:relative has-[[data-slot=item-link]]:isolate",
    "has-[[data-slot=item-link]:focus-visible]:border-ring has-[[data-slot=item-link]:focus-visible]:ring-3 has-[[data-slot=item-link]:focus-visible]:ring-ring/45",
    "has-[[data-slot=item-link]]:[&_[data-slot=item-actions]]:relative has-[[data-slot=item-link]]:[&_[data-slot=item-actions]]:z-10",
  ].join(" "),
  {
    variants: {
      variant: {
        plain: "border-transparent",
        outline: "border-border",
        muted: "border-transparent bg-muted/50",
        /**
         * Rente: a linha de um `Card padding="none"`, sem borda nem canto, com
         * o recuo de 16px da tira do cartão (título e linhas alinham). Num
         * `ItemGroup divided` o fio continua, porque a borda é transparente e
         * não zerada.
         */
        flush: "rounded-none border-transparent",
      },
      size: {
        // O raio é a linha: com a superfície (22), uma linha de 38 a 44px sairia
        // cápsula. `sm` (38) veste a linha, os outros a alta.
        sm: "gap-2 px-2.5 py-2 rounded-row",
        md: "gap-2.5 px-3 py-2.5",
        lg: "gap-3 px-4 py-3.5",
      },
      // O realce é explícito, como o `interactive` do `Card`, e traz o par
      // `active:`: o realce compila dentro de `@media (hover: hover)` e sem ele
      // não existiria no telefone.
      /**
       * A linha atual ou escolhida: o contorno e o fundo do cartão de escolha
       * do `FieldLabel` (`--primary-accent` a 60%, o primeiro degrau que
       * alcança 3:1 de traço nos dois temas). Vem com `aria-current`.
       */
      selected: {
        true: "border-primary-accent/60 bg-primary/5 dark:bg-primary/10",
        false: "",
      },
      interactive: {
        true: [
          "cursor-pointer hover:bg-muted active:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/45 pointer-coarse:min-h-11",
          // O que a `ItemChevron` lê: só a linha que navega a faz andar. Variante
          // empilhada apontaria para o mesmo ancestral e não casaria; a saída é
          // a variável.
          "hover:[--item-nudge:--spacing(0.5)] active:[--item-nudge:--spacing(0.5)] hover:[--item-chevron:var(--color-foreground)] active:[--item-chevron:var(--color-foreground)]",
        ].join(" "),
        false: "",
      },
    },
    compoundVariants: [
      { variant: "flush", size: "sm", className: "px-4 py-2 rounded-none" },
      { variant: "flush", size: "md", className: "px-4 py-3" },
      { variant: "flush", size: "lg", className: "px-4 py-3.5" },
    ],
    defaultVariants: {
      variant: "plain",
      size: "md",
      selected: false,
      interactive: false,
    },
  }
)

const itemGroupVariants = cva("group/item-group flex w-full flex-col", {
  variants: {
    // `spaced` separa por respiro (linhas que são cartões); `divided` por fio,
    // o separador de itens repetidos que torna a lista varrível.
    variant: {
      spaced: "gap-4 has-data-[size=sm]:gap-2.5",
      // Não é `divide-y divide-border`: `divide-*` compila com `:where(...)`,
      // sem especificidade, e perde para o `border-transparent` que o `Item`
      // traz no próprio elemento (os fios saíam transparentes). O seletor
      // arbitrário ganha e só linhas viram fio. A largura vem do `border` da
      // base; aqui só a cor.
      //
      // O raio sai: uma borda de baixo num elemento arredondado curva nas
      // pontas, e uma linha de lista dividida não é um cartão (em `spaced` o
      // raio fica). O raio das pontas é de quem contém (`overflow-hidden`);
      // cravar `first:rounded-t-lg` copiaria para dentro um número do
      // contêiner. Com `interactive`, o realce vira uma faixa de largura
      // inteira.
      divided:
        "gap-0 [&>[data-slot=item]]:rounded-none [&>[data-slot=item]:not(:last-child)]:border-b-border",
    },
  },
  defaultVariants: {
    variant: "spaced",
  },
})

function ItemGroup({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof itemGroupVariants>) {
  return (
    <div
      // Sem `role="list"`: o `Item` pode ser um link, e uma lista sem itens é
      // anunciada errado. Quem é lista de verdade passa `role` e marca os itens.
      data-slot="item-group"
      data-variant={variant ?? "spaced"}
      className={cn(itemGroupVariants({ variant, className }))}
      {...props}
    />
  )
}

/**
 * O fio explícito, para a lista que separa por seção e não a cada linha;
 * `ItemGroup variant="divided"` cobre o caso comum.
 */
function ItemSeparator({
  className,
  ...props
}: React.ComponentProps<typeof Separator>) {
  return (
    <Separator
      data-slot="item-separator"
      orientation="horizontal"
      className={cn("my-2", className)}
      {...props}
    />
  )
}

function Item({
  className,
  variant = "plain",
  size = "md",
  interactive = false,
  selected = false,
  asChild = false,
  ...props
}: React.ComponentProps<"div"> &
  VariantProps<typeof itemVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "div"
  return (
    <Comp
      data-slot="item"
      data-variant={variant}
      data-size={size}
      data-interactive={interactive ? "true" : undefined}
      data-selected={selected || undefined}
      aria-current={selected ? "true" : undefined}
      className={cn(itemVariants({ variant, size, interactive, selected, className }))}
      {...props}
    />
  )
}

const itemMediaVariants = cva(
  "flex shrink-0 items-center justify-center gap-2 group-has-data-[slot=item-description]/item:translate-y-0.5 group-has-data-[slot=item-description]/item:self-start [&_svg]:pointer-events-none",
  {
    variants: {
      variant: {
        plain: "bg-transparent",
        icon: "[&_svg:not([class*='size-'])]:size-4",
        // O raio acompanha a medida (`rounded-sm` cravado deixaria 2px de canto).
        image:
          "size-10 overflow-hidden rounded-lg group-data-[size=sm]/item:size-8 group-data-[size=sm]/item:rounded-md group-data-[size=lg]/item:size-12 [&_img]:size-full [&_img]:object-cover",
        // O ladrilho de tom: o círculo na superfície `-muted` do tom, com o
        // ícone de 16 na tinta dele. A cor vem do `tone`, nunca do ícone.
        tile:
          "size-8 rounded-full group-data-[size=sm]/item:size-7 group-data-[size=lg]/item:size-10 [&_svg]:size-4",
      },
      // Só o `tile` pinta o tom (as combinações abaixo); nas outras mídias ele não faz nada.
      tone: {
        neutral: "",
        info: "",
        warning: "",
        destructive: "",
      },
    },
    compoundVariants: [
      { variant: "tile", tone: "neutral", className: "bg-muted text-muted-foreground" },
      { variant: "tile", tone: "info", className: "bg-info-muted text-info-muted-foreground" },
      { variant: "tile", tone: "warning", className: "bg-warning-muted text-warning-muted-foreground" },
      { variant: "tile", tone: "destructive", className: "bg-destructive-muted text-destructive-muted-foreground" },
    ],
    defaultVariants: {
      variant: "plain",
      tone: "neutral",
    },
  }
)

function ItemMedia({
  className,
  variant = "plain",
  tone = "neutral",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof itemMediaVariants>) {
  return (
    <div
      data-slot="item-media"
      data-variant={variant}
      data-tone={variant === "tile" ? tone : undefined}
      className={cn(itemMediaVariants({ variant, tone, className }))}
      {...props}
    />
  )
}

/** Título sobre descrição é par de identidade: quem os separa é a entrelinha, sem `gap`. */
function ItemContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="item-content"
      className={cn(
        // `min-w-0`: numa linha que não quebra, um título longo empurraria as
        // ações para fora em vez de truncar.
        "flex min-w-0 flex-1 flex-col gap-0 [&+[data-slot=item-content]]:flex-none",
        className
      )}
      {...props}
    />
  )
}

function ItemTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="item-title"
      className={cn(
        // Sem `line-clamp-1`: o `flex` vencia o `-webkit-box` e o corte nunca
        // acontecia; quem precisa cortar põe o texto num `span` com `truncate`.
        // `flex-wrap`: numa linha que não quebra o título encolhe, e um `Badge`
        // dentro dele era espremido em três linhas; assim ele desce inteiro.
        "flex w-fit flex-wrap items-center gap-x-2 gap-y-0.5 text-sm leading-snug font-medium underline-offset-4",
        className
      )}
      {...props}
    />
  )
}

function ItemDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <Muted
      data-slot="item-description"
      className={cn(
        "line-clamp-2 text-left leading-normal font-normal group-data-[size=sm]/item:text-xs [&>a]:underline [&>a]:underline-offset-4 [&>a]:hover:text-primary-accent [&>a:active]:text-primary-accent",
        className
      )}
      {...props}
    />
  )
}

function ItemActions({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="item-actions"
      className={cn("flex items-center gap-2", className)}
      {...props}
    />
  )
}

/**
 * O alvo da linha com ações dentro: um `<button>` (ou, com `asChild`, o `<a>`)
 * cuja película (`::after`) cobre o `Item` inteiro, sem botão dentro de botão.
 * Quem dá o realce é o `interactive` do `Item`; o anel do foco é da linha.
 */
function ItemLink({
  asChild = false,
  className,
  type,
  ...props
}: React.ComponentProps<"button"> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "button"
  return (
    <Comp
      data-slot="item-link"
      // `type="button"` de fábrica: dentro de um formulário, roubaria o Enter.
      type={asChild ? type : (type ?? "button")}
      className={cn(
        "min-w-0 text-start text-inherit no-underline outline-none",
        "after:absolute after:inset-0 after:rounded-[inherit] after:content-['']",
        className
      )}
      {...props}
    />
  )
}

/**
 * O rótulo de um grupo de linhas, em sobrancelha. Com `sticky` ele gruda no
 * topo do rolável, com o fundo da superfície que o contém
 * (`--item-group-label-surface`, a placa flutuante por padrão).
 */
function ItemGroupLabel({
  sticky = false,
  className,
  ...props
}: React.ComponentProps<"div"> & { sticky?: boolean }) {
  return (
    <div
      data-slot="item-group-label"
      data-sticky={sticky || undefined}
      className={cn(
        "px-3 py-1.5 text-xs font-medium text-muted-foreground",
        sticky && "sticky top-0 z-10 bg-(--item-group-label-surface,var(--color-popover))",
        className
      )}
      {...props}
    />
  )
}

function ItemHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="item-header"
      className={cn(
        "flex basis-full items-center justify-between gap-2",
        className
      )}
      {...props}
    />
  )
}

function ItemFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="item-footer"
      className={cn(
        "flex basis-full items-center justify-between gap-2",
        className
      )}
      {...props}
    />
  )
}

/**
 * A seta da linha que navega: apagada em repouso e, no cursor e no toque de uma
 * linha `interactive`, ganha a tinta cheia e anda 2px no sentido do clique.
 * Decorativa: quem diz para onde vai é a linha.
 */
function ItemChevron({ className, ...props }: React.ComponentProps<typeof ChevronRightIcon>) {
  return (
    <ChevronRightIcon
      data-slot="item-chevron"
      aria-hidden
      className={cn(
        "size-4 shrink-0 transition-[translate,color] duration-(--duration-base) ease-(--ease-out)",
        "translate-x-(--item-nudge,0px) text-(--item-chevron,var(--color-muted-foreground))",
        className
      )}
      {...props}
    />
  )
}

export {
  Item,
  ItemChevron,
  ItemMedia,
  ItemContent,
  ItemActions,
  ItemGroup,
  ItemGroupLabel,
  ItemLink,
  ItemSeparator,
  ItemTitle,
  ItemDescription,
  ItemHeader,
  ItemFooter,
  itemVariants,
}
