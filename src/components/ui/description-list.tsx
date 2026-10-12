import * as React from "react"

import { cn } from "@/lib/utils"
import { Caption } from "@/components/ui/typography"

/**
 * Pares termo/valor para telas de detalhe (a fatura, a assinatura, o cartão).
 *
 * O item lê o `data-layout` do pai com `in-data-[layout=…]`; o `layout` local é
 * só sobrescrita. `in-*` compila com `:where()` e não soma especificidade, então
 * a base do item é `min-w-0` e mais nada: uma base que colida perderia a disputa.
 */

const listSizes = {
  sm: { stacked: "gap-3", inline: "gap-2", grid: "gap-x-6 gap-y-3" },
  md: { stacked: "gap-4", inline: "gap-3", grid: "gap-x-8 gap-y-4" },
} as const

type DescriptionListLayout = "stacked" | "inline" | "grid"

/**
 * `stacked` (padrão, o do telefone) empilha rótulo sobre valor; `inline` põe os
 * dois na mesma linha a partir de `sm`; `grid` reparte os pares em duas colunas.
 * `divided` põe o fio entre os pares (extrato, fatura). `columns` fixa as colunas
 * do `grid` em qualquer largura.
 *
 * `term="eyebrow"` é aplicado pela lista e não por contexto, porque o painel de
 * acesso é server component. O seletor desce um nível (`> * >`) para uma lista
 * aninhada não herdar, e dá (0,2,0) para vencer o `text-xs` do `Caption`.
 */
const TERM_EYEBROW =
  "[&>*>[data-slot=description-term]]:text-2xs [&>*>[data-slot=description-term]]:font-medium [&>*>[data-slot=description-term]]:uppercase [&>*>[data-slot=description-term]]:tracking-wide"

const GRID_COLUMNS = {
  2: "grid grid-cols-2",
  3: "grid grid-cols-3",
} as const

function DescriptionList({
  className,
  layout = "stacked",
  size = "md",
  divided = false,
  term = "caption",
  columns,
  ...props
}: React.ComponentProps<"dl"> & {
  layout?: DescriptionListLayout
  size?: keyof typeof listSizes
  divided?: boolean
  /** `eyebrow` põe os rótulos em caixa alta, 11px e espaçados. */
  term?: "caption" | "eyebrow"
  /** As colunas em qualquer largura; implica `grid` (sozinho seria ignorado). */
  columns?: keyof typeof GRID_COLUMNS
}) {
  if (columns) layout = "grid"
  return (
    <dl
      data-slot="description-list"
      data-layout={layout}
      data-size={size}
      data-term={term}
      data-divided={divided ? "true" : undefined}
      className={cn(
        layout === "grid"
          ? columns
            ? GRID_COLUMNS[columns]
            : "grid sm:grid-cols-2"
          : "flex flex-col",
        term === "eyebrow" && TERM_EYEBROW,
        listSizes[size][layout],
        // Com fio, o respiro do `gap` vira recuo em cada par, para o fio ficar
        // no meio da folga. Só nos layouts de coluna: num `grid` o fio seguiria
        // a ordem do DOM e cruzaria pares que não são vizinhos.
        divided &&
          layout !== "grid" && [
            "gap-0 divide-y divide-border",
            size === "sm" ? "[&>*]:py-2" : "[&>*]:py-3",
            "[&>*:first-child]:pt-0 [&>*:last-child]:pb-0",
          ],
        className
      )}
      {...props}
    />
  )
}

/**
 * Uma linha da lista. Rótulo e valor são o mesmo dado em duas linhas: sem
 * `gap`, quem separa é a entrelinha. `layout` aqui é sobrescrita;
 * `align="end"` encosta o par à direita.
 */
function DescriptionListItem({
  className,
  layout,
  align = "start",
  ...props
}: React.ComponentProps<"div"> & {
  layout?: DescriptionListLayout
  align?: "start" | "end"
}) {
  return (
    <div
      data-slot="description-list-item"
      data-layout={layout}
      className={cn(
        "min-w-0",
        align === "end" && "text-end",
        // Escritas por extenso: o Tailwind varre o código como texto.
        !layout &&
          "in-data-[layout=inline]:flex in-data-[layout=inline]:flex-col sm:in-data-[layout=inline]:flex-row sm:in-data-[layout=inline]:items-baseline sm:in-data-[layout=inline]:justify-between sm:in-data-[layout=inline]:gap-4",
        // Sobrescrita local.
        layout === "inline" &&
          "flex flex-col sm:flex-row sm:items-baseline sm:justify-between sm:gap-4",
        className
      )}
      {...props}
    />
  )
}

function DescriptionTerm({ className, ...props }: React.ComponentProps<"dt">) {
  return (
    <Caption asChild data-slot="description-term" className={className}>
      <dt {...props} />
    </Caption>
  )
}

const detailsSizes = {
  sm: "text-sm",
  // O peso do total vai no `<dd>` e não no item, para o rótulo não herdá-lo (e
  // para escapar da especificidade do `in-*`).
  lg: "text-base font-medium",
  // O número da tela: o total do cartão no painel.
  xl: "text-xl font-semibold tracking-tight",
} as const

/** `.nums` de fábrica: sem figuras tabulares uma coluna de números não alinha. */
function DescriptionDetails({
  className,
  size = "sm",
  ...props
}: React.ComponentProps<"dd"> & {
  size?: keyof typeof detailsSizes
}) {
  return (
    <dd
      data-slot="description-details"
      data-size={size}
      className={cn(
        "nums min-w-0 text-foreground",
        detailsSizes[size],
        className
      )}
      {...props}
    />
  )
}

/**
 * A linha miúda que explica o valor. Mora dentro do `<dd>`, para o leitor de
 * tela a ler como parte da definição; desfaz o peso do degrau do valor.
 */
function DescriptionHint({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="description-hint"
      className={cn(
        "mt-0.5 block text-2xs leading-snug font-normal tracking-normal text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

export {
  DescriptionDetails,
  DescriptionHint,
  DescriptionList,
  DescriptionListItem,
  DescriptionTerm,
}
