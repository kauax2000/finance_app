import * as React from "react"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

/**
 * Os nove átomos de texto, e a base que o resto do sistema veste. Existem porque
 * vinte e tantos lugares escreviam `text-sm text-muted-foreground` ou
 * `font-heading … font-semibold tracking-tight` à mão, livres para divergir.
 * `asChild` (o `Slot` do `Button`) existe para o nível: `PageHeaderTitle` é um
 * `<h1>` que às vezes precisa ser `<h2>`, `EmptyStateTitle` é um `<p>` que na 404
 * vira `<h1>`, `TableCaption` é um `<caption>`. O átomo dá o estilo; o filho, o elemento.
 * Com `asChild`, a sobrescrita vai no `className` do átomo, nunca no filho: o
 * `Slot` concatena as duas `className` sem `twMerge` (`text-lg` e `text-base`
 * ficariam no DOM, e venceria a ordem de emissão).
 * `cn()` resolve tamanho contra tamanho e entrelinha contra entrelinha
 * (`cn("text-3xl text-(length:--page-title)")` devolve só a variável), por isso
 * `PageHeaderTitle` veste `H1` e troca o corpo sem eixo novo. A família não se
 * troca: `H1` é a serifa de display (`.page-title`) e os outros são a sans.
 * `H2` não traz régua: o `PageSectionTitle`, o `<h2>` real de toda tela, não a
 * tem, e um átomo que o template precisa desfazer não é a peça de baixo. A régua
 * de seção é de quem dispõe: `PageSection variant="ruled"`.
 */

type TextProps<T extends keyof React.JSX.IntrinsicElements> =
  React.ComponentProps<T> & {
    /** Troca o elemento, mantendo o estilo. A sobrescrita fica no átomo. */
    asChild?: boolean
  }

/**
 * O corpo dos nove: o elemento, o `data-slot` (`typography-` + o nome em
 * minúsculas) e a classe base. Um corpo só, para nenhum divergir.
 */
function texto<T extends keyof React.JSX.IntrinsicElements>(
  nome: string,
  tag: T,
  base: string
) {
  function Texto({ className, asChild = false, ...props }: TextProps<T>) {
    const Comp: React.ElementType = asChild ? Slot.Root : tag
    return (
      <Comp
        data-slot={`typography-${nome.toLowerCase()}`}
        className={cn(base, className)}
        {...props}
      />
    )
  }
  Texto.displayName = nome
  return Texto
}

const H1 = texto("H1", "h1", "page-title scroll-m-20 text-3xl text-foreground")

const H2 = texto(
  "H2",
  "h2",
  "font-heading scroll-m-20 text-2xl font-semibold tracking-tight text-foreground"
)

const H3 = texto(
  "H3",
  "h3",
  "font-heading scroll-m-20 text-xl font-semibold tracking-tight text-foreground"
)

const H4 = texto(
  "H4",
  "h4",
  "font-heading scroll-m-20 text-lg font-semibold tracking-tight text-foreground"
)

const Lead = texto("Lead", "p", "text-lg text-muted-foreground")

const P = texto("P", "p", "text-sm leading-relaxed text-foreground")

const Muted = texto("Muted", "p", "text-sm text-muted-foreground")

const Small = texto("Small", "small", "text-xs font-medium leading-none text-foreground")

const Caption = texto("Caption", "p", "text-xs leading-snug text-muted-foreground")

export { Caption, H1, H2, H3, H4, Lead, Muted, P, Small }
