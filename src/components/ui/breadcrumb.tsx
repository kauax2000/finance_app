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
 * ## A lista é dona dos separadores, e é isso que torna o colapso possível
 *
 * A versão anterior pedia que o consumidor escrevesse `<BreadcrumbSeparator />`
 * n−1 vezes, à mão, entre os itens. Isso não é só tedioso: **não se dobra um
 * miolo que não se possui**. Com os separadores espalhados pela marcação de
 * quem chama, a lista não sabe quais filhos são degraus da trilha e quais são
 * enfeite entre eles, então não tem como decidir o que esconder.
 *
 * Aqui a `BreadcrumbList` recebe só `BreadcrumbItem`, insere os separadores e
 * fica com a informação de que precisa para colapsar. `separator` continua
 * sendo o ponto de extensão para trocar o glifo — uma vez, e não n−1 vezes.
 *
 * ## Por que ela não pode quebrar linha
 *
 * O padrão do shadcn é `flex-wrap`. Medido a 375px, com 293px disponíveis: uma
 * trilha de quatro níveis sai com **46px de altura, em duas linhas**, logo
 * acima do título da página. A documentação antiga descrevia esse defeito e
 * deixava cada tela resolvê-lo à mão.
 *
 * São duas defesas, e elas cobrem casos diferentes:
 *
 * 1. **`maxItems`** cobre a trilha profunda: o miolo vira reticências, e as
 *    reticências abrem um menu com o que foi escondido — não um beco.
 * 2. **`truncate` nos ancestrais** cobre o rótulo único e longo ("Nubank
 *    Ultravioleta"), que contagem nenhuma resolve. A página atual é `shrink-0`
 *    e só cede depois que todos os ancestrais já cederam.
 *
 * ## Rodada 202
 *
 * - **`BreadcrumbSwitcher`**: a página atual com um menu dos irmãos —
 *   "Cartões › Nubank ▾" troca de cartão sem voltar à lista.
 * - **`collapse="back"`**: abaixo de `sm`, a trilha vira um só "‹ Pai", o
 *   voltar para o degrau de cima; acima, a trilha inteira.
 * - **`icon`** no `BreadcrumbLink`: o ícone antes do rótulo, ou sozinho (a
 *   casa de "Início") com o nome em `aria-label`.
 * - **`separator`** por nome: `"chevron"` (o padrão), `"slash"` e `"dot"`.
 * - **`BreadcrumbPage asChild`**: a página atual pode ser o `<h1>` da tela,
 *   que é o que a barra do app precisava para deixar de escrever a trilha à
 *   mão.
 */

const breadcrumbSizes = {
  sm: {
    list: "gap-1.5 text-xs",
    icon: "size-3",
    ellipsis: "size-4",
    // O ícone de um degrau acompanha o corpo do texto, um degrau acima do
    // chevron — ele é conteúdo, o chevron é pontuação.
    link: "[&_svg]:size-3.5",
  },
  md: {
    list: "gap-2 text-sm",
    icon: "size-3.5",
    ellipsis: "size-4",
    link: "[&_svg]:size-4",
  },
} as const

/** Os desenhos de separador por nome (rodada 202). */
type BreadcrumbSeparatorPreset = "chevron" | "slash" | "dot"

type BreadcrumbSize = keyof typeof breadcrumbSizes

const BreadcrumbSizeContext = React.createContext<BreadcrumbSize>("md")

function Breadcrumb({ ...props }: React.ComponentProps<"nav">) {
  return <nav data-slot="breadcrumb" aria-label="Trilha de navegação" {...props} />
}

/**
 * `maxItems` conta **degraus**, não nós renderizados. Quando a contagem passa
 * dele, ficam a raiz e os dois últimos: a raiz é para onde se volta, e os dois
 * últimos são onde se está e de onde se veio. O miolo vai para o menu.
 *
 * O piso é 3 — abaixo disso o colapso esconderia mais do que mostra, e uma
 * trilha de três degraus cabe em 293px.
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

  // O voltar do telefone: o link do degrau de cima, com a seta para a
  // esquerda. Sem degrau de cima não há para onde voltar, e a trilha fica.
  const pai = items.length >= 2 ? items[items.length - 2] : null
  const voltar = collapse === "back" && pai ? <BreadcrumbBack item={pai} /> : null

  return (
    <BreadcrumbSizeContext.Provider value={size}>
      <ol
        data-slot="breadcrumb-list"
        data-size={size}
        className={cn(
          // `flex-nowrap` e `min-w-0` são o par: sem o segundo, os filhos não
          // encolhem e o `truncate` deles nunca chega a agir.
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
 * Com `collapse="back"`, a trilha some abaixo de `sm`. Cada degrau é um `<li>`
 * filho do `<ol>`, então a classe vai **nele**: um invólucro em volta de um
 * `<li>` deixaria a lista inválida.
 */
function soNoDesktop(no: React.ReactNode) {
  if (!React.isValidElement(no)) return no
  const el = no as React.ReactElement<{ className?: string }>
  return React.cloneElement(el, { className: cn(el.props.className, "max-sm:hidden") })
}

/**
 * O "‹ Pai" do telefone (rodada 202): o link do degrau de cima, com a seta
 * para a esquerda. Só abaixo de `sm`; acima, a trilha inteira.
 */
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

/**
 * O último degrau é `shrink-0`: quando falta largura, quem cede é o caminho, e
 * nunca o destino. Sem isso o flex reparte o aperto igualmente e a página atual
 * sai truncada enquanto sobra espaço num ancestral que ninguém está lendo.
 */
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
 * `variant="menu"` é como o mesmo link se veste dentro de `BreadcrumbMenu`.
 *
 * Ali a geometria — altura, recuo, realce, alvo de toque — é do
 * `DropdownMenuItem`, e a apresentação da trilha atrapalharia: `truncate` num
 * menu que pode ser largo, um `::after` absoluto por cima da linha inteira, e
 * um realce disputando com o do item.
 *
 * O acoplamento é **dentro da mesma família**: o menu do breadcrumb sabe do
 * link do breadcrumb. É outra coisa do `in-data-[slot=dropdown-menu-content]`
 * que saiu do `Item` nesta mesma rodada — lá era um componente conhecendo o
 * contêiner de outro.
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
  /**
   * O ícone antes do rótulo (rodada 202). Sem rótulo, o degrau é só o ícone —
   * a casa de "Início" —, e o nome vai em `aria-label`.
   */
  icon?: React.ReactNode
}) {
  const Comp = asChild ? Slot.Root : "a"
  const size = React.useContext(BreadcrumbSizeContext)
  // Com `asChild`, o rótulo é o filho do filho: o ícone entra dentro dele, ao
  // lado do texto, pelo `Slottable`.
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
        // O par de toque. Sem `active:` a resposta vive dentro de
        // `@media (hover: hover)` e simplesmente não existe no telefone.
        "hover:text-foreground active:text-foreground",
        "outline-none focus-visible:ring-3 focus-visible:ring-ring/45",
        // Alvo de dedo por pseudo-elemento, e não por altura: crescer de
        // verdade empurraria a linha do cabeçalho de 20 para 44px.
        //
        // Vertical 12px de cada lado — 20 + 24 = **44**, medido —, e ali não há
        // nada acima nem abaixo para disputar. Horizontal só 4px, que é metade
        // do `gap` da lista: dois ancestrais vizinhos encostam sem se sobrepor.
        // É a mesma conta que a `PaginationLink` documenta ao recusar a área
        // expandida.
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
 * A página atual.
 *
 * Sem `role="link"` e sem `aria-disabled`, que é como o shadcn a entrega: um
 * papel de link num elemento que não navega faz o leitor de tela anunciar um
 * link e convidar à ativação. `aria-current="page"` num `span` é o que a APG
 * prescreve, e é o suficiente.
 *
 * `font-medium` porque "você está aqui" era dito só por uma tinta um degrau
 * mais escura — diferença que some numa varredura rápida.
 */
function BreadcrumbPage({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> & {
  /**
   * A página atual como outro elemento — o `<h1>` da tela, na barra do app
   * (rodada 202). A trilha continua dizendo `aria-current`.
   */
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
  /** O desenho, quando não há `children` (rodada 202). */
  preset?: BreadcrumbSeparatorPreset
}) {
  const size = React.useContext(BreadcrumbSizeContext)
  // A barra e o ponto são texto, quietos (`/60`): pontuação, não sinal. O
  // chevron é o ícone de sempre.
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
      // O tamanho vai no `className` do ícone, e **não** num
      // `[&>svg]:${…}` montado aqui: o Tailwind varre o código como texto, e
      // uma classe interpolada em tempo de execução nunca chega ao CSS. É a
      // mesma armadilha que os menus documentam ao escrever
      // `max-h-(--radix-*-content-available-height)` por extenso em cada
      // arquivo.
      className={cn("shrink-0 [&>svg]:block", className)}
      {...props}
    >
      {children ?? desenho}
    </li>
  )
}

/**
 * O marcador estático de truncamento.
 *
 * Duas correções sobre a versão anterior. A primeira é de acessibilidade: havia
 * um `<span class="sr-only">Mais</span>` **dentro** de um elemento
 * `aria-hidden="true"` — texto morto, que nunca chegou à árvore de
 * acessibilidade. Um marcador puramente visual não precisa de nome; ele precisa
 * é de não mentir.
 *
 * A segunda é de medida: a caixa era `size-8`. Numa linha de texto de 20px isso
 * fazia a trilha inteira medir **32px** — 60% mais alta — só por causa do
 * marcador. Agora ela acompanha o corpo do texto.
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
 * O que entra no menu é o **link**, e não o `<li>` que o embrulha na trilha.
 *
 * Medido antes deste conserto: `DropdownMenuItem asChild` recebia o
 * `BreadcrumbItem` inteiro, então cada linha do menu saía `<li>` sem `href`,
 * com a âncora aninhada dentro — `role="menuitem"` num elemento que não navega,
 * e um `<li>` dentro de um `role="menu"`, que é dono do próprio papel de lista.
 *
 * Junto vai `variant="menu"`, que tira do link a apresentação da trilha: ali a
 * geometria é do item de menu.
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
 * As reticências como gatilho, e não como beco.
 *
 * Um marcador de truncamento que não leva a lugar nenhum esconde caminho sem
 * devolver nada. Aqui os ancestrais dobrados viram um menu — e a
 * `BreadcrumbList` monta isto sozinha quando `maxItems` corta, então o
 * consumidor não escreve marcação nenhuma para ganhar o comportamento.
 *
 * O gatilho é o `Button` do sistema, em `icon-xs` — 24px de caixa visual, com o
 * alvo de dedo crescendo por pseudo-elemento na mesma conta do
 * `BreadcrumbLink`. Antes era a primitiva do Radix vestida à mão, com o próprio
 * anel de foco e a própria transição — e este arquivo não importava `Button`.
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
 * A página atual com um menu dos irmãos (rodada 202): "Cartões › Nubank ▾"
 * troca de cartão sem voltar à lista. Ele **é** o último degrau — vai dentro
 * do `BreadcrumbItem` no lugar do `BreadcrumbPage` —, e por isso o gatilho
 * leva `aria-current="page"` e a tinta e o peso da página atual. O rótulo é
 * `children`; os irmãos são `BreadcrumbSwitcherItem`. O gatilho não cresce a
 * linha: a caixa é a do texto, com 4px de recuo dos lados devolvidos por
 * margem.
 */
function BreadcrumbSwitcher({
  children,
  items,
  label = "Trocar",
  className,
}: {
  /** O nome da página atual. */
  children: React.ReactNode
  /** Os irmãos — `BreadcrumbSwitcherItem`. */
  items: React.ReactNode
  /** O nome do menu, para o leitor de tela: "Trocar de cartão". */
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
            // A caixa é a do texto: sem recuo vertical e sem a borda
            // transparente do `Button` — com os dois a linha ia de 20 a 26,
            // medido. Os 4px dos lados voltam por margem.
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
