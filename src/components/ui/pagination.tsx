import * as React from "react"
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  EllipsisHorizontalIcon,
} from "@heroicons/react/16/solid"

import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"

/**
 * Navegação entre páginas de uma lista.
 *
 * ## Paginação não é uma fileira de números
 *
 * É uma **posição** e dois **movimentos**. Numa lista de transações, "1–20 de
 * 342" responde a pergunta que a pessoa realmente tem; um link para a página 7
 * quase nunca responde. Por isso `PaginationStatus` existe como peça: a
 * documentação antiga já citava esse texto ("o texto 'página 2 de 8' ao lado é
 * o que continua orientando") sem entregá-lo, e toda tela o escreveria à mão.
 */

const paginationAlign = {
  center: "justify-center",
  between: "justify-between",
  end: "justify-end",
} as const

/**
 * `align` existe porque `mx-auto … justify-center` estava cravado, e a forma
 * mais comum numa lista de app é outra: contagem à esquerda, controles à
 * direita. Não dava para chegar nela sem desfazer duas classes por fora.
 */
function Pagination({
  className,
  align = "center",
  ...props
}: React.ComponentProps<"nav"> & {
  align?: keyof typeof paginationAlign
}) {
  return (
    <nav
      data-slot="pagination"
      data-align={align}
      role="navigation"
      aria-label="Paginação"
      className={cn(
        "flex w-full flex-wrap items-center gap-3",
        paginationAlign[align],
        className
      )}
      {...props}
    />
  )
}

function PaginationContent({
  className,
  ...props
}: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="pagination-content"
      className={cn("flex flex-row items-center gap-1", className)}
      {...props}
    />
  )
}

/**
 * A posição, em palavras.
 *
 * `.nums` porque os três números mudam a cada página e, sem figuras tabulares,
 * a frase inteira muda de largura junto — o olho lê isso como a linha se
 * mexendo, não como o dado mudando.
 */
function PaginationStatus({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="pagination-status"
      className={cn("nums text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

function PaginationItem({ className, ...props }: React.ComponentProps<"li">) {
  return <li data-slot="pagination-item" className={className} {...props} />
}

type PaginationLinkProps = {
  isActive?: boolean
} & Pick<React.ComponentProps<typeof Button>, "size"> &
  React.ComponentProps<"a">

/**
 * A página atual é `secondary`, e não `outline`.
 *
 * Medido no tema claro: `outline` entrega `oklch(0.985)` de preenchimento
 * contra uma página de `oklch(1)` — 1,03:1. Numa fileira de links
 * transparentes, "você está aqui" era um contorno de 1px e um branco quase
 * idêntico ao fundo. `secondary` preenche de cinza, que é a língua de
 * "selecionado" que `Button`, `Toggle` e a bandeja do `Tabs` já falam.
 *
 * `.nums` porque 1, 10 e 100 têm larguras diferentes em figuras
 * proporcionais — a fileira inteira se reacomoda ao virar a página.
 */
function PaginationLink({
  className,
  isActive,
  size = "icon-md",
  ...props
}: PaginationLinkProps) {
  return (
    <a
      aria-current={isActive ? "page" : undefined}
      data-slot="pagination-link"
      data-active={isActive ? "true" : undefined}
      className={cn(
        buttonVariants({
          variant: isActive ? "secondary" : "tertiary",
          size,
        }),
        "nums",
        isActive && "font-medium",
        // Alvo de dedo. Aqui não dá para usar o pseudo-elemento do Checkbox: os
        // links ficam lado a lado com 4px de intervalo, e áreas expandidas se
        // sobreporiam — a pessoa tocaria na página 3 mirando a 2. Então o
        // controle cresce de verdade, só em ponteiro grosso.
        "pointer-coarse:min-h-11 pointer-coarse:min-w-11",
        className
      )}
      {...props}
    />
  )
}

/**
 * Um `<a>` não desabilita, e nas duas pontas da lista os dois botões precisam
 * disso — hoje "Anterior" na página 1 é um link que leva à própria página.
 * Com `disabled` sai um `<span>`: sem `href`, sem foco, `aria-disabled` para o
 * leitor de tela, e a mesma opacidade que o `Button` usa.
 */
function PaginationEdge({
  className,
  disabled,
  size = "md",
  children,
  ...props
}: PaginationLinkProps & { disabled?: boolean }) {
  const classes = cn(
    buttonVariants({ variant: "tertiary", size }),
    // Abaixo de `sm` o rótulo some e o controle fica quadrado, na medida dos
    // números ao lado. Antes ele saía **40×32**, com 10px de recuo à esquerda
    // e 12 à direita — medido: um retângulo torto numa fileira de quadrados.
    "max-sm:size-8 max-sm:gap-0 max-sm:px-0",
    "pointer-coarse:min-h-11 pointer-coarse:min-w-11",
    className
  )

  if (disabled) {
    return (
      <span
        data-slot="pagination-link"
        aria-disabled="true"
        className={cn(classes, "pointer-events-none opacity-50")}
      >
        {children}
      </span>
    )
  }

  return (
    <a data-slot="pagination-link" className={classes} {...props}>
      {children}
    </a>
  )
}

function PaginationPrevious({
  className,
  ...props
}: React.ComponentProps<typeof PaginationEdge>) {
  return (
    <PaginationEdge
      aria-label="Ir para a página anterior"
      className={cn("sm:pl-2.5", className)}
      {...props}
    >
      <ChevronLeftIcon aria-hidden />
      <span className="hidden sm:inline">Anterior</span>
    </PaginationEdge>
  )
}

function PaginationNext({
  className,
  ...props
}: React.ComponentProps<typeof PaginationEdge>) {
  return (
    <PaginationEdge
      aria-label="Ir para a próxima página"
      className={cn("sm:pr-2.5", className)}
      {...props}
    >
      <span className="hidden sm:inline">Próxima</span>
      <ChevronRightIcon aria-hidden />
    </PaginationEdge>
  )
}

/**
 * O salto de páginas.
 *
 * O `<span class="sr-only">Mais páginas</span>` que morava aqui estava **dentro**
 * de um `aria-hidden="true"`: texto morto, que nunca chegou à árvore de
 * acessibilidade. Um marcador de salto é decoração — a navegação de verdade são
 * os links ao lado —, então ele fica escondido e sem nome, em vez de fingir que
 * tem um.
 */
function PaginationEllipsis({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="pagination-ellipsis"
      aria-hidden="true"
      className={cn(
        "flex size-8 items-center justify-center text-muted-foreground",
        className
      )}
      {...props}
    >
      <EllipsisHorizontalIcon className="size-4" />
    </span>
  )
}

export {
  Pagination,
  PaginationContent,
  PaginationEdge,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationStatus,
}
