"use client"

import * as React from "react"
import { Slot } from "radix-ui"
import { ChevronRightIcon, EllipsisHorizontalIcon } from "@heroicons/react/16/solid"

import { cn } from "@/lib/utils"
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
 */

const breadcrumbSizes = {
  sm: {
    list: "gap-1.5 text-xs",
    icon: "size-3",
    ellipsis: "size-4",
  },
  md: {
    list: "gap-2 text-sm",
    icon: "size-3.5",
    ellipsis: "size-5",
  },
} as const

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
  ...props
}: Omit<React.ComponentProps<"ol">, "children"> & {
  children?: React.ReactNode
  maxItems?: number
  separator?: React.ReactNode
  size?: BreadcrumbSize
}) {
  const items = React.Children.toArray(children).filter(React.isValidElement)
  const limite = maxItems > 0 ? Math.max(3, maxItems) : 0

  let visiveis: React.ReactNode[] = items
  let escondidos: React.ReactNode[] = []

  if (limite > 0 && items.length > limite) {
    escondidos = items.slice(1, items.length - 2)
    visiveis = [items[0], null, ...items.slice(items.length - 2)]
  }

  const glifo = separator ?? <BreadcrumbSeparator />

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
        {visiveis.map((item, i) => (
          <React.Fragment key={i}>
            {i > 0 ? glifo : null}
            {item ?? <BreadcrumbMenu>{escondidos}</BreadcrumbMenu>}
          </React.Fragment>
        ))}
      </ol>
    </BreadcrumbSizeContext.Provider>
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
  ...props
}: React.ComponentProps<"a"> & {
  asChild?: boolean
  variant?: "trail" | "menu"
}) {
  const Comp = asChild ? Slot.Root : "a"

  if (variant === "menu") {
    return (
      <Comp
        data-slot="breadcrumb-link"
        data-variant="menu"
        className={cn("w-full", className)}
        {...props}
      />
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
        "outline-none focus-visible:ring-3 focus-visible:ring-ring/70",
        // Alvo de dedo por pseudo-elemento, e não por altura: crescer de
        // verdade empurraria a linha do cabeçalho de 20 para 44px.
        //
        // Vertical 12px de cada lado — 20 + 24 = **44**, medido —, e ali não há
        // nada acima nem abaixo para disputar. Horizontal só 4px, que é metade
        // do `gap` da lista: dois ancestrais vizinhos encostam sem se sobrepor.
        // É a mesma conta que a `PaginationLink` documenta ao recusar a área
        // expandida.
        "pointer-coarse:after:absolute pointer-coarse:after:-inset-x-1 pointer-coarse:after:-inset-y-3 pointer-coarse:after:content-['']",
        className
      )}
      {...props}
    />
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
function BreadcrumbPage({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
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
  ...props
}: React.ComponentProps<"li">) {
  const size = React.useContext(BreadcrumbSizeContext)

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
      {children ?? <ChevronRightIcon className={breadcrumbSizes[size].icon} />}
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
function desembrulhar(item: React.ReactElement): React.ReactNode {
  const filho = (item.props as { children?: React.ReactNode }).children
  const unico = React.Children.toArray(filho).filter(React.isValidElement)[0]
  if (!unico) return item
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
 * O gatilho é um `<button>` de verdade: 24px de caixa visual, com o alvo de dedo
 * crescendo por pseudo-elemento na mesma conta do `BreadcrumbLink`.
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
        <DropdownMenuTrigger
          aria-label={label}
          className={cn(
            "relative flex items-center justify-center rounded-sm text-muted-foreground transition-colors duration-(--duration-fast)",
            "hover:text-foreground active:text-foreground",
            "outline-none focus-visible:ring-3 focus-visible:ring-ring/70",
            "aria-expanded:text-foreground",
            "pointer-coarse:after:absolute pointer-coarse:after:-inset-x-1 pointer-coarse:after:-inset-y-3 pointer-coarse:after:content-['']"
          )}
        >
          <EllipsisHorizontalIcon
            aria-hidden
            className={breadcrumbSizes[size].ellipsis}
          />
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

export {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbMenu,
  BreadcrumbPage,
  BreadcrumbSeparator,
}
