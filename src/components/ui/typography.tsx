import * as React from "react"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

/**
 * Os nove átomos de texto — e a base que o resto do sistema veste.
 *
 * Eles nasceram sem consumidor dentro de `ui/`: `PageHeaderTitle`,
 * `PageSectionTitle`, `CardDescription`, `EmptyStateTitle` e mais dezoito
 * lugares escreviam `text-sm text-muted-foreground` ou `font-heading …
 * font-semibold tracking-tight` à mão, cada um livre para divergir. A regra da
 * casa — **um componente não reimplementa o que a camada de baixo já dá** — é
 * o que os trouxe para cá.
 *
 * ## `asChild`
 *
 * O mesmo `Slot` do `Button`. Existe para o **nível**: `PageHeaderTitle` é um
 * `<h1>` que às vezes precisa ser `<h2>`, `EmptyStateTitle` é um `<p>` que numa
 * página 404 vira `<h1>`, `TableCaption` é um `<caption>`. O átomo dá o estilo;
 * o filho dá o elemento.
 *
 * **Com `asChild`, a sobrescrita vai no `className` do átomo, nunca no filho.**
 * O `Slot` concatena as duas `className` sem `twMerge`: `<H4 asChild><p
 * className="text-base"/></H4>` deixa `text-lg` **e** `text-base` no DOM, e
 * quem vence é a ordem de emissão do CSS, não a intenção.
 *
 * ## O que muda por `className`, e o que não
 *
 * `cn()` resolve tamanho contra tamanho e entrelinha contra entrelinha —
 * verificado: `cn("text-3xl text-(length:--page-title)")` devolve só a
 * variável. É por isso que `PageHeaderTitle` veste `H1` e troca o corpo sem
 * eixo novo. O que **não** se troca é a família: `H1` é a serifa de display por
 * `.page-title`, e os outros são a sans — quem precisa de outra coisa não está
 * escrevendo um título.
 *
 * ## `H2` não traz régua
 *
 * Trazia — `border-b border-border pb-2`, herança do shadcn, que a chamava de
 * divisor de seção de prosa. Zero consumidores no app; e `PageSectionTitle`, que
 * é o `<h2>` real de toda tela, é um `h2` **sem** régua. Um átomo que o template
 * precisa desfazer para vestir não é a peça de baixo. A régua de seção existe, e
 * é de quem dispõe: `PageSection variant="ruled"`.
 */

type TextProps<T extends keyof React.JSX.IntrinsicElements> =
  React.ComponentProps<T> & {
    /** Troca o elemento, mantendo o estilo. A sobrescrita fica no átomo. */
    asChild?: boolean
  }

function H1({ className, asChild = false, ...props }: TextProps<"h1">) {
  const Comp = asChild ? Slot.Root : "h1"
  return (
    <Comp
      data-slot="typography-h1"
      className={cn(
        "page-title scroll-m-20 text-3xl text-foreground",
        className
      )}
      {...props}
    />
  )
}

function H2({ className, asChild = false, ...props }: TextProps<"h2">) {
  const Comp = asChild ? Slot.Root : "h2"
  return (
    <Comp
      data-slot="typography-h2"
      className={cn(
        "font-heading scroll-m-20 text-2xl font-semibold tracking-tight text-foreground",
        className
      )}
      {...props}
    />
  )
}

function H3({ className, asChild = false, ...props }: TextProps<"h3">) {
  const Comp = asChild ? Slot.Root : "h3"
  return (
    <Comp
      data-slot="typography-h3"
      className={cn(
        "font-heading scroll-m-20 text-xl font-semibold tracking-tight text-foreground",
        className
      )}
      {...props}
    />
  )
}

function H4({ className, asChild = false, ...props }: TextProps<"h4">) {
  const Comp = asChild ? Slot.Root : "h4"
  return (
    <Comp
      data-slot="typography-h4"
      className={cn(
        "font-heading scroll-m-20 text-lg font-semibold tracking-tight text-foreground",
        className
      )}
      {...props}
    />
  )
}

function Lead({ className, asChild = false, ...props }: TextProps<"p">) {
  const Comp = asChild ? Slot.Root : "p"
  return (
    <Comp
      data-slot="typography-lead"
      className={cn("text-lg text-muted-foreground", className)}
      {...props}
    />
  )
}

function P({ className, asChild = false, ...props }: TextProps<"p">) {
  const Comp = asChild ? Slot.Root : "p"
  return (
    <Comp
      data-slot="typography-p"
      className={cn("text-sm leading-relaxed text-foreground", className)}
      {...props}
    />
  )
}

function Muted({ className, asChild = false, ...props }: TextProps<"p">) {
  const Comp = asChild ? Slot.Root : "p"
  return (
    <Comp
      data-slot="typography-muted"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

function Small({ className, asChild = false, ...props }: TextProps<"small">) {
  const Comp = asChild ? Slot.Root : "small"
  return (
    <Comp
      data-slot="typography-small"
      className={cn("text-xs font-medium leading-none text-foreground", className)}
      {...props}
    />
  )
}

function Caption({ className, asChild = false, ...props }: TextProps<"p">) {
  const Comp = asChild ? Slot.Root : "p"
  return (
    <Comp
      data-slot="typography-caption"
      className={cn("text-xs leading-snug text-muted-foreground", className)}
      {...props}
    />
  )
}

export { Caption, H1, H2, H3, H4, Lead, Muted, P, Small }
