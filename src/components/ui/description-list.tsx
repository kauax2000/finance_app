import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Pares termo/valor para telas de detalhe (a fatura, a assinatura, o cartão).
 *
 * `stacked` empilha rótulo sobre valor e é o que serve no telefone; `inline`
 * coloca os dois na mesma linha e só cabe a partir de `sm`. O padrão é stacked
 * porque toda tela deste app é vista num telefone antes de qualquer outra coisa.
 */
function DescriptionList({
  className,
  layout = "stacked",
  ...props
}: React.ComponentProps<"dl"> & {
  layout?: "stacked" | "inline"
}) {
  return (
    <dl
      data-slot="description-list"
      data-layout={layout}
      className={cn(
        "flex flex-col",
        layout === "stacked" && "gap-4",
        layout === "inline" && "gap-3",
        className
      )}
      {...props}
    />
  )
}

/**
 * Uma linha da lista. O rótulo e o valor são o mesmo dado em duas linhas, então
 * quem os separa é a entrelinha: nada de `gap` entre eles. Dois pixels bastam
 * para o par deixar de ler como uma coisa só.
 */
function DescriptionListItem({
  className,
  layout = "stacked",
  ...props
}: React.ComponentProps<"div"> & {
  layout?: "stacked" | "inline"
}) {
  return (
    <div
      data-slot="description-list-item"
      data-layout={layout}
      className={cn(
        "min-w-0",
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
    <dt
      data-slot="description-term"
      className={cn("text-xs text-muted-foreground", className)}
      {...props}
    />
  )
}

function DescriptionDetails({
  className,
  ...props
}: React.ComponentProps<"dd">) {
  return (
    <dd
      data-slot="description-details"
      className={cn("min-w-0 text-sm text-foreground", className)}
      {...props}
    />
  )
}

export {
  DescriptionDetails,
  DescriptionList,
  DescriptionListItem,
  DescriptionTerm,
}
