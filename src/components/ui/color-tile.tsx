import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { tileColorFor } from "@/lib/tile-palette"
import { cn } from "@/lib/utils"

/**
 * O ladrilho que carrega uma cor escolhida pela pessoa — ícone de categoria,
 * marca de conta, capa de conta a pagar.
 *
 * É a construção do `AvatarFallback`: superfície chapada, tinta escura por
 * cima, um valor só nos dois temas. O matiz é da pessoa; a claridade e o croma
 * são do sistema (`oklch(from var(--tile-color) …)`), o que prende o contraste
 * sem medir cor por cor. A cor não entra crua: nenhuma tinta única serve as
 * oito paradas da marca. Medição em `scripts/tile-contrast.mjs`.
 */
const colorTileVariants = cva(
  [
    "flex shrink-0 items-center justify-center overflow-hidden",
    // `tile-vivid` / `tile-soft` publicam a superfície e a tinta a partir de
    // `--tile-color`.
    "bg-(--tile-surface) text-(--tile-ink)",
  ].join(" "),
  {
    variants: {
      /**
       * A escada, com os nomes do sistema (32 · 36 · 40 · 44): um ladrilho `md`
       * alinha com um botão `md`. Só `2xl` alcança o alvo de toque de 44px. O
       * ícone acompanha o corpo (`size-4` micro, `size-5` mini).
       */
      /** `vivid` (padrão): cor cheia com tinta escura. `soft`: quase branca, com o ícone no tom forte. */
      tint: {
        vivid: "tile-vivid",
        soft: "tile-soft",
      },
      size: {
        // O degrau de dentro de uma linha de lista e do gatilho de um campo.
        xs: "size-6 rounded-md [&>svg]:size-3.5",
        // Do `md` para cima o canto é a linha; o `xs` fica no `rounded-md`
        // porque 12 num ladrilho de 24 já lê como círculo, a forma do `Avatar`.
        md: "size-8 rounded-row [&>svg]:size-4",
        lg: "size-9 rounded-row [&>svg]:size-4",
        xl: "size-10 rounded-row [&>svg]:size-5",
        "2xl": "size-11 rounded-row [&>svg]:size-5",
      },
    },
    defaultVariants: {
      tint: "vivid",
      size: "md",
    },
  }
)

function ColorTile({
  className,
  size,
  tint,
  color,
  style,
  ...props
  // `div` já tem um `color` — o atributo HTML legado, `string | undefined`.
  // Sem o Omit, a interseção proíbe o `null` que vem do banco.
}: Omit<React.ComponentProps<"div">, "color"> &
  VariantProps<typeof colorTileVariants> & {
    /**
     * Cor gravada no banco. Vazia cai no cinza do sistema, e um preset legado é
     * dobrado na parada de marca mais próxima por `tileColorFor`.
     */
    color?: string | null
  }) {
  return (
    <div
      data-slot="color-tile"
      aria-hidden
      data-tint={tint ?? "vivid"}
      className={cn(colorTileVariants({ size, tint }), className)}
      // A cor entra uma vez, como variável, e a superfície se deriva dela no
      // CSS (JavaScript perderia o `oklch(from …)`). Sem cor o ladrilho é
      // cinza: `--muted-foreground` tem croma 0. O arco-íris não entra como
      // preenchimento; entra pela paleta que a pessoa escolhe (`tileColorFor`).
      style={
        {
          "--tile-color": tileColorFor(color) ?? "var(--muted-foreground)",
          ...style,
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { ColorTile, colorTileVariants }
