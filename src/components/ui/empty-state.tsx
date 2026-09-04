"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"
import { H4, Muted } from "@/components/ui/typography"

/**
 * O que a tela diz quando não há nada nela.
 *
 * ## O respiro é do pai, e não dos filhos
 *
 * As quatro peças carregavam `mb-4`, `mb-2` e `mb-6`, e o contêiner ficava em
 * `gap: normal` — medido. O layout era decidido de baixo para cima: tirar a
 * descrição mudava sozinho o respiro entre o ícone e o título, e a última peça
 * da pilha deixava 24px de margem contra a borda de baixo do bloco. Agora o
 * `gap` é do `EmptyState`, e nenhum filho declara margem.
 *
 * ## `variant` existe porque duas telas já a escreviam
 *
 * `not-found-shell.tsx` e `route-error-fallback.tsx` abrem **com a mesma
 * string**: `className="w-full border-border/80 bg-card/40 py-10"`. Duas cópias
 * idênticas de uma sobrescrita são uma variante faltando — e o
 * `border-border/80` era ainda um quarto peso de borda no app.
 *
 * ## O título não é um `<h2>` cravado
 *
 * Ele era, e isso põe um `h2` na página toda vez que um bloco vazio aparece —
 * inclusive dentro de uma seção que já tem o seu, que é o caso de duas das
 * quatro telas. O padrão passa a ser um `<p>` estilizado, e quem precisa de
 * cabeçalho de verdade usa `asChild` com o nível certo.
 */
const emptyStateVariants = cva(
  "flex flex-col items-center justify-center text-center",
  {
    variants: {
      variant: {
        dashed: "rounded-xl border border-dashed border-border bg-muted/20",
        card: "rounded-xl border border-border bg-card/40",
        // Sem moldura, para dentro de um `Card` ou de uma célula de tabela que
        // já tem a sua. Cartão dentro de cartão é sempre errado.
        plain: "",
      },
      size: {
        sm: "gap-2 px-4 py-6 [--empty-state-icon:--spacing(9)]",
        md: "gap-3 px-6 py-10 [--empty-state-icon:--spacing(12)]",
        lg: "gap-4 px-6 py-16 [--empty-state-icon:--spacing(14)]",
      },
    },
    defaultVariants: {
      variant: "dashed",
      size: "md",
    },
  }
)

function EmptyState({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof emptyStateVariants>) {
  return (
    <div
      data-slot="empty-state"
      data-variant={variant ?? "dashed"}
      data-size={size ?? "md"}
      className={cn(emptyStateVariants({ variant, size }), className)}
      {...props}
    />
  )
}

const emptyStateIconVariants = cva(
  "flex shrink-0 items-center justify-center rounded-full size-(--empty-state-icon) [&_svg]:size-[calc(var(--empty-state-icon)/2)]",
  {
    variants: {
      // `route-error-fallback.tsx` pintava `bg-destructive-muted
      // text-destructive-muted-foreground` à mão. Um estado de erro é um estado
      // vazio de outra natureza, e a cor é do sistema.
      tone: {
        default: "bg-muted text-muted-foreground",
        info: "bg-info-muted text-info-muted-foreground",
        success: "bg-success-muted text-success-muted-foreground",
        warning: "bg-warning-muted text-warning-muted-foreground",
        destructive: "bg-destructive-muted text-destructive-muted-foreground",
      },
    },
    defaultVariants: {
      tone: "default",
    },
  }
)

function EmptyStateIcon({
  className,
  tone,
  ...props
}: React.ComponentProps<"div"> &
  VariantProps<typeof emptyStateIconVariants>) {
  return (
    <div
      data-slot="empty-state-icon"
      data-tone={tone ?? "default"}
      className={cn(emptyStateIconVariants({ tone }), className)}
      {...props}
    />
  )
}

/**
 * O título.
 *
 * `asChild` é a saída para quando ele precisa **ser** um cabeçalho — uma página
 * 404 inteira quer um `<h1>`; um bloco vazio no meio de uma lista não quer
 * nível nenhum. O padrão é o segundo caso, que é o comum.
 */
function EmptyStateTitle({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<"p"> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "p"
  // O estilo é o do `H4` — família, peso, tracking — um degrau abaixo no corpo.
  // O elemento continua sendo o `<p>` (ou o que `asChild` trouxer): o átomo dá
  // o estilo e o filho dá o nível, e a sobrescrita fica no átomo.
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
 * As ações.
 *
 * Ela ganha uma folga a mais que o `gap` do bloco: um botão logo abaixo de um
 * parágrafo lê como parte do parágrafo. É a mesma razão de 2 para 1 que separa
 * "outro assunto" de "mesmo assunto" no `HoverCardBody`.
 */
function EmptyStateActions({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="empty-state-actions"
      className={cn(
        "mt-1 flex flex-wrap items-center justify-center gap-2",
        className
      )}
      {...props}
    />
  )
}

export {
  EmptyState,
  EmptyStateActions,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
  emptyStateVariants,
}
