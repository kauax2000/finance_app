"use client"

import * as React from "react"
import { Slot } from "radix-ui"
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EllipsisHorizontalIcon,
} from "@heroicons/react/16/solid"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

/**
 * A trilha até a tela atual.
 *
 * A `BreadcrumbList` recebe só `BreadcrumbItem` e insere os separadores: sem
 * ser dona deles ela não saberia quais filhos dobrar. `separator` troca o glifo
 * (`"chevron"`, `"slash"`, `"dot"`).
 *
 * Ela não quebra linha (o `flex-wrap` do shadcn dava duas linhas a 375px). Duas
 * defesas: `maxItems` dobra o miolo num menu, e `truncate` nos ancestrais cobre
 * o rótulo único e longo; a página atual é `shrink-0`. `collapse="back"` troca a
 * trilha por "‹ Pai" abaixo de `sm`. `BreadcrumbSwitcher` é a página atual com
 * menu dos irmãos; `BreadcrumbPage asChild` deixa a página ser o `<h1>`.
 */

const breadcrumbSizes = {
  sm: {
    list: "gap-1.5 text-xs",
    icon: "size-3",
    ellipsis: "size-4",
    // O ícone de um degrau acompanha o corpo do texto, um degrau acima do chevron.
    link: "[&_svg]:size-3.5",
  },
  md: {
    list: "gap-2 text-sm",
    icon: "size-3.5",
    ellipsis: "size-4",
    link: "[&_svg]:size-4",
  },
} as const

/** Os desenhos de separador por nome. */
type BreadcrumbSeparatorPreset = "chevron" | "slash" | "dot"

type BreadcrumbSize = keyof typeof breadcrumbSizes

const BreadcrumbSizeContext = React.createContext<BreadcrumbSize>("md")

function Breadcrumb({ ...props }: React.ComponentProps<"nav">) {
  return <nav data-slot="breadcrumb" aria-label="Trilha de navegação" {...props} />
}

/**
 * `maxItems` conta degraus, não nós. Passando dele, ficam a raiz e os dois
 * últimos; o miolo vai para o menu. O piso é 3.
 */
function BreadcrumbList({
  className,
  children,
  maxItems = 4,
  separator,
  size = "md",
  collapse = "menu",
  ...props
}: Omit<React.ComponentProps<"ol">, "children"> & {
  children?: React.ReactNode
  maxItems?: number
  /** Um desenho por nome, ou um nó para a lista toda. */
  separator?: BreadcrumbSeparatorPreset | React.ReactNode
  size?: BreadcrumbSize
  /**
   * `menu` dobra o miolo em reticências quando passa de `maxItems`. `back`
   * faz, além disso, a trilha virar um só "‹ Pai" abaixo de `sm`.
   */
  collapse?: "menu" | "back"
}) {
  const items = React.Children.toArray(children).filter(React.isValidElement)
  const limite = maxItems > 0 ? Math.max(3, maxItems) : 0

  let visiveis: React.ReactNode[] = items
  let escondidos: React.ReactNode[] = []

  if (limite > 0 && items.length > limite) {
    escondidos = items.slice(1, items.length - 2)
    visiveis = [items[0], null, ...items.slice(items.length - 2)]
  }

  const glifo =
    separator == null || typeof separator === "string" ? (
      <BreadcrumbSeparator preset={(separator as BreadcrumbSeparatorPreset) ?? "chevron"} />
    ) : (
      separator
    )

  // O voltar do telefone: o link do degrau de cima. Sem ele a trilha fica.
  const pai = items.length >= 2 ? items[items.length - 2] : null
  const voltar = collapse === "back" && pai ? <BreadcrumbBack item={pai} /> : null

  return (
    <BreadcrumbSizeContext.Provider value={size}>
      <ol
        data-slot="breadcrumb-list"
        data-size={size}
        className={cn(
          // `flex-nowrap` e `min-w-0` são o par: sem o segundo o `truncate`
          // dos filhos nunca age.
          "flex min-w-0 flex-nowrap items-center break-words text-muted-foreground",
          breadcrumbSizes[size].list,
          className
        )}
        {...props}
      >
        {voltar}
        {visiveis.map((item, i) => (
          <React.Fragment key={i}>
            {i > 0 ? (voltar ? soNoDesktop(glifo) : glifo) : null}
            {voltar
              ? soNoDesktop(item ?? <BreadcrumbMenu>{escondidos}</BreadcrumbMenu>)
              : (item ?? <BreadcrumbMenu>{escondidos}</BreadcrumbMenu>)}
          </React.Fragment>
        ))}
      </ol>
    </BreadcrumbSizeContext.Provider>
  )
}

/**
 * Com `collapse="back"` a trilha some abaixo de `sm`. A classe vai no `<li>`
 * (filho do `<ol>`): um invólucro deixaria a lista inválida.
 */
function soNoDesktop(no: React.ReactNode) {
  if (!React.isValidElement(no)) return no
  const el = no as React.ReactElement<{ className?: string }>
  return React.cloneElement(el, { className: cn(el.props.className, "max-sm:hidden") })
}

/** O "‹ Pai" do telefone: o link do degrau de cima, só abaixo de `sm`. */
function BreadcrumbBack({ item }: { item: React.ReactElement }) {
  const link = desembrulharLink(item)
  return (
    <li data-slot="breadcrumb-back" className="inline-flex min-w-0 items-center sm:hidden">
      {React.isValidElement(link)
        ? React.cloneElement(
            link as React.ReactElement<{ icon?: React.ReactNode }>,
            { icon: <ChevronLeftIcon /> }
          )
        : link}
    </li>
  )
}

/** O último degrau é `shrink-0`: quando falta largura cede o caminho, nunca o destino. */
function BreadcrumbItem({ className, ...props }: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="breadcrumb-item"
      className={cn(
        "inline-flex min-w-0 items-center gap-1.5 last:shrink-0",
        className
      )}
      {...props}
    />
  )
}

/**
 * `variant="menu"` é como o link se veste dentro de `BreadcrumbMenu`: a
 * geometria é do `DropdownMenuItem`, e `truncate`, o `::after` absoluto e o
 * realce da trilha atrapalhariam.
 */
function BreadcrumbLink({
  asChild,
  className,
  variant = "trail",
  icon,
  children,
  ...props
}: React.ComponentProps<"a"> & {
  asChild?: boolean
  variant?: "trail" | "menu"
  /** O ícone antes do rótulo; sozinho (a casa de "Início"), o nome vai em `aria-label`. */
  icon?: React.ReactNode
}) {
  const Comp = asChild ? Slot.Root : "a"
  const size = React.useContext(BreadcrumbSizeContext)
  // Com `asChild`, o ícone entra dentro do filho do filho, pelo `Slottable`.
  const conteudo = icon ? (
    asChild && React.isValidElement(children) ? (
      React.cloneElement(
        children as React.ReactElement<{ children?: React.ReactNode }>,
        undefined,
        icon,
        (children as React.ReactElement<{ children?: React.ReactNode }>).props.children
      )
    ) : (
      <>
        {icon}
        {children}
      </>
    )
  ) : (
    children
  )

  if (variant === "menu") {
    return (
      <Comp
        data-slot="breadcrumb-link"
        data-variant="menu"
        className={cn("w-full", icon && "inline-flex items-center gap-1.5", className)}
        {...props}
      >
        {conteudo}
      </Comp>
    )
  }

  return (
    <Comp
      data-slot="breadcrumb-link"
      data-variant="trail"
      className={cn(
        "relative truncate rounded-sm transition-colors duration-(--duration-fast)",
        // Sem `active:` a resposta vive dentro de `@media (hover: hover)` e não
        // existe no telefone.
        "hover:text-foreground active:text-foreground",
        "outline-none focus-visible:ring-3 focus-visible:ring-ring/45",
        // Alvo de dedo por pseudo-elemento (crescer de verdade empurraria a
        // linha do cabeçalho): 12px verticais levam 20 a 44; horizontal só 4px,
        // metade do `gap`, para ancestrais vizinhos não se sobreporem.
        "pointer-coarse:after:absolute pointer-coarse:after:-inset-x-1 pointer-coarse:after:-inset-y-3 pointer-coarse:after:content-['']",
        // Com ícone, o link vira uma linha de dois: o ícone não trunca.
        icon && ["inline-flex items-center gap-1", breadcrumbSizes[size].link],
        className
      )}
      {...props}
    >
      {conteudo}
    </Comp>
  )
}

/**
 * A página atual. Sem `role="link"` nem `aria-disabled` (um link que não
 * navega); `aria-current="page"` num `span` é o que a APG prescreve.
 * `font-medium` porque só a tinta mais escura some numa varredura rápida.
 */
function BreadcrumbPage({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> & {
  /** A página atual como outro elemento (o `<h1>` da tela); a trilha continua dizendo `aria-current`. */
  asChild?: boolean
}) {
  const Comp = asChild ? Slot.Root : "span"
  return (
    <Comp
      data-slot="breadcrumb-page"
      aria-current="page"
      className={cn("truncate font-medium text-foreground", className)}
      {...props}
    />
  )
}

function BreadcrumbSeparator({
  children,
  className,
  preset = "chevron",
  ...props
}: React.ComponentProps<"li"> & {
  /** O desenho, quando não há `children`. */
  preset?: BreadcrumbSeparatorPreset
}) {
  const size = React.useContext(BreadcrumbSizeContext)
  // A barra e o ponto são texto quieto (`/60`): pontuação, não sinal.
  const desenho =
    preset === "slash" ? (
      <span className="text-muted-foreground/60">/</span>
    ) : preset === "dot" ? (
      <span className="text-muted-foreground/60">·</span>
    ) : (
      <ChevronRightIcon className={breadcrumbSizes[size].icon} />
    )

  return (
    <li
      data-slot="breadcrumb-separator"
      role="presentation"
      aria-hidden="true"
      // O tamanho vai no `className` do ícone: o Tailwind varre o código como
      // texto, e uma classe interpolada nunca chega ao CSS.
      className={cn("shrink-0 [&>svg]:block", className)}
      {...props}
    >
      {children ?? desenho}
    </li>
  )
}

/**
 * O marcador estático de truncamento. Visual puro, `aria-hidden` e sem nome; a
 * caixa acompanha o corpo do texto (`size-8` faria a trilha medir 32px).
 */
function BreadcrumbEllipsis({
  className,
  ...props
}: React.ComponentProps<"span">) {
  const size = React.useContext(BreadcrumbSizeContext)

  return (
    <span
      data-slot="breadcrumb-ellipsis"
      role="presentation"
      aria-hidden="true"
      className={cn("flex shrink-0 items-center justify-center", className)}
      {...props}
    >
      <EllipsisHorizontalIcon className={breadcrumbSizes[size].ellipsis} />
    </span>
  )
}

/**
 * O que entra no menu é o link, não o `<li>` da trilha: um `<li>` sem `href`
 * dentro de `role="menu"` não navega. `variant="menu"` tira do link a
 * apresentação da trilha.
 */
function desembrulharLink(item: React.ReactElement): React.ReactNode {
  const filho = (item.props as { children?: React.ReactNode }).children
  return React.Children.toArray(filho).filter(React.isValidElement)[0] ?? item
}

function desembrulhar(item: React.ReactElement): React.ReactNode {
  const unico = desembrulharLink(item)
  if (unico === item || !React.isValidElement(unico)) return item
  return React.cloneElement(unico as React.ReactElement<{ variant?: string }>, {
    variant: "menu",
  })
}

/**
 * As reticências como gatilho: os ancestrais dobrados viram um menu, que a
 * `BreadcrumbList` monta sozinha quando `maxItems` corta. É o `Button` do
 * sistema em `icon-xs`, com o alvo de dedo por pseudo-elemento como no
 * `BreadcrumbLink`.
 */
function BreadcrumbMenu({
  children,
  className,
  label = "Mostrar caminho oculto",
  ...props
}: Omit<React.ComponentProps<"li">, "children"> & {
  children?: React.ReactNode
  label?: string
}) {
  const size = React.useContext(BreadcrumbSizeContext)
  const itens = React.Children.toArray(children).filter(React.isValidElement)

  return (
    <li
      data-slot="breadcrumb-menu"
      className={cn("inline-flex shrink-0 items-center", className)}
      {...props}
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="tertiary"
            size="icon-xs"
            aria-label={label}
            className={cn(
              "relative rounded-sm text-muted-foreground",
              "hover:text-foreground active:text-foreground aria-expanded:text-foreground",
              "pointer-coarse:after:absolute pointer-coarse:after:-inset-x-1 pointer-coarse:after:-inset-y-3 pointer-coarse:after:content-['']"
            )}
          >
            <EllipsisHorizontalIcon
              aria-hidden
              className={breadcrumbSizes[size].ellipsis}
            />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" size="sm">
          {itens.map((item, i) => (
            <DropdownMenuItem key={i} asChild>
              {desembrulhar(item)}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  )
}

/**
 * A página atual com um menu dos irmãos ("Cartões › Nubank ▾"). Ele é o último
 * degrau: vai dentro do `BreadcrumbItem` no lugar do `BreadcrumbPage`, com
 * `aria-current="page"`. O rótulo é `children`; os irmãos são
 * `BreadcrumbSwitcherItem`. Não cresce a linha.
 */
function BreadcrumbSwitcher({
  children,
  items,
  label = "Trocar",
  className,
}: {
  /** O nome da página atual. */
  children: React.ReactNode
  /** Os irmãos (`BreadcrumbSwitcherItem`). */
  items: React.ReactNode
  /** O nome do menu para o leitor de tela: "Trocar de cartão". */
  label?: string
  className?: string
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="tertiary"
          size="xs"
          aria-current="page"
          className={cn(
            // A caixa é a do texto: sem recuo vertical nem a borda transparente
            // do `Button` (a linha iria de 20 a 26). Os 4px dos lados voltam
            // por margem.
            "-mx-1 h-auto min-w-0 gap-1 rounded-sm border-0 px-1 py-0 font-medium text-foreground",
            "[font-size:inherit] [line-height:inherit]",
            "pointer-coarse:after:absolute pointer-coarse:after:-inset-x-1 pointer-coarse:after:-inset-y-3 pointer-coarse:after:content-['']",
            className
          )}
        >
          <span className="truncate">{children}</span>
          <span className="sr-only">, {label}</span>
          <ChevronDownIcon
            aria-hidden
            className="size-3.5 text-muted-foreground transition-transform duration-(--duration-base) group-aria-expanded/button:rotate-180"
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" size="md" aria-label={label}>
        {items}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/**
 * Um irmão no menu do `BreadcrumbSwitcher`. `asChild` com o `<Link>` do Next;
 * `current` marca o de agora com o tique e `aria-current`.
 */
function BreadcrumbSwitcherItem({
  current = false,
  children,
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuItem> & { current?: boolean }) {
  const filho = React.isValidElement(children) && props.asChild
    ? React.cloneElement(
        children as React.ReactElement<{ children?: React.ReactNode; "aria-current"?: string }>,
        { "aria-current": current ? "page" : undefined },
        (children as React.ReactElement<{ children?: React.ReactNode }>).props.children,
        current ? <CheckIcon aria-hidden className="ms-auto" /> : null
      )
    : children
  return (
    <DropdownMenuItem
      data-current={current || undefined}
      className={cn(current && "font-medium", className)}
      {...props}
    >
      {props.asChild ? (
        filho
      ) : (
        <>
          {children}
          {current ? <CheckIcon aria-hidden className="ms-auto" /> : null}
        </>
      )}
    </DropdownMenuItem>
  )
}

export {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbMenu,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbSwitcher,
  BreadcrumbSwitcherItem,
}
