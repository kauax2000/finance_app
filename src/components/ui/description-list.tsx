import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Pares termo/valor para telas de detalhe (a fatura, a assinatura, o cartão).
 *
 * ## O layout desce sozinho, e não por prop repetido
 *
 * A versão anterior pedia `layout` **duas vezes** — na lista e em cada item —,
 * e a própria página do catálogo documentava isso como se fosse regra:
 * "precisa ser passado na lista e em cada item". Não é regra, é defeito:
 * `<DescriptionList layout="inline">` sozinho não fazia nada, calado.
 *
 * A lista já escrevia `data-layout`. Agora o item **lê** o do pai, com
 * `in-data-[layout=…]`, e o prop local vira o que ele devia ser: uma
 * sobrescrita para a linha que foge do padrão.
 *
 * **A armadilha que isso custa, e por que ela não pega aqui.** `in-*` compila
 * com `:where()`, que não soma especificidade — uma classe sob esse variante
 * perde para uma classe base no mesmo elemento. Este projeto já pagou essa
 * medição no `Command`. Funciona aqui porque a base do item é `min-w-0` e mais
 * nada: não há declaração concorrente para perder a disputa. Quem acrescentar
 * uma base que colida (um `flex-col` fixo, um `text-*`) reabre o problema.
 */

const listSizes = {
  sm: { stacked: "gap-3", inline: "gap-2", grid: "gap-x-6 gap-y-3" },
  md: { stacked: "gap-4", inline: "gap-3", grid: "gap-x-8 gap-y-4" },
} as const

type DescriptionListLayout = "stacked" | "inline" | "grid"

/**
 * `stacked` empilha rótulo sobre valor e é o que serve no telefone; `inline`
 * coloca os dois na mesma linha e só se abre a partir de `sm`; `grid` reparte
 * os pares em duas colunas a partir de `sm`, para o detalhe com seis campos
 * que, empilhado, vira uma coluna alta com a metade direita da tela vazia.
 *
 * O padrão é `stacked` porque toda tela deste app é vista num telefone antes de
 * qualquer outra coisa.
 *
 * `divided` põe o fio entre os pares — é o desenho de extrato e de fatura, e a
 * mesma categoria de fio do `ItemGroup variant="divided"`: separador de itens
 * repetidos, que é o que torna a lista varrível.
 */
function DescriptionList({
  className,
  layout = "stacked",
  size = "md",
  divided = false,
  ...props
}: React.ComponentProps<"dl"> & {
  layout?: DescriptionListLayout
  size?: keyof typeof listSizes
  divided?: boolean
}) {
  return (
    <dl
      data-slot="description-list"
      data-layout={layout}
      data-size={size}
      data-divided={divided ? "true" : undefined}
      className={cn(
        layout === "grid" ? "grid sm:grid-cols-2" : "flex flex-col",
        listSizes[size][layout],
        // Com fio, o respiro do `gap` vira recuo em cada par: o fio precisa
        // ficar no meio da folga, e não colado no valor de cima. `gap` mais
        // `divide-y` deixaria o traço flutuando no vazio.
        // Só nos dois layouts de coluna. Num `grid` de duas colunas o fio
        // seguiria a ordem do DOM e não a das colunas, e sairia atravessando
        // pares que não são vizinhos na tela.
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
 * Uma linha da lista. O rótulo e o valor são o mesmo dado em duas linhas, então
 * quem os separa é a entrelinha: nada de `gap` entre eles. Dois pixels bastam
 * para o par deixar de ler como uma coisa só.
 *
 * `layout` aqui é **sobrescrita**, e não obrigação — sem ele, a linha segue o
 * que a lista disse.
 */
function DescriptionListItem({
  className,
  layout,
  ...props
}: React.ComponentProps<"div"> & {
  layout?: DescriptionListLayout
}) {
  return (
    <div
      data-slot="description-list-item"
      data-layout={layout}
      className={cn(
        "min-w-0",
        // Herdado do pai. As duas classes são escritas por extenso porque o
        // Tailwind varre o código como texto — `in-data-[layout=${x}]` nunca
        // chegaria ao CSS.
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
    <dt
      data-slot="description-term"
      className={cn("text-xs text-muted-foreground", className)}
      {...props}
    />
  )
}

const detailsSizes = {
  sm: "text-sm",
  // O total de uma fatura pede peso, e o **rótulo dele não** — por isso o eixo
  // mora no `<dd>`, e não no item. Prop no próprio elemento também escapa da
  // armadilha de especificidade do `in-*` descrita no topo do arquivo.
  lg: "text-base font-medium",
} as const

/**
 * `.nums` sai de fábrica. Dígito em lista de detalhe é sempre dado — valor,
 * limite, data, contagem —, e sem figuras tabulares uma coluna de números não
 * alinha. Hoje cada tela escrevia `className="nums"` à mão, e a própria página
 * do catálogo o fazia em três linhas seguidas.
 */
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

export {
  DescriptionDetails,
  DescriptionList,
  DescriptionListItem,
  DescriptionTerm,
}
