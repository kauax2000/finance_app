import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * O ladrilho que carrega uma cor escolhida pela pessoa — ícone de categoria,
 * marca de conta, capa de conta a pagar.
 *
 * **A cor da pessoa entra como matiz, não como preenchimento.** O ladrilho a
 * dissolve num véu sobre o cartão e devolve o mesmo matiz, saturado, no ícone —
 * a construção do `Avatar` com os tons de identidade, e pelo mesmo motivo:
 * quando a cor vem do banco, quem garante a legibilidade é o sistema.
 *
 * Ele já foi o contrário disso. Preenchia de cor cheia com ícone branco por
 * cima, e quatro dos dez presets de categoria reprovavam nos 3:1 da WCAG
 * 1.4.11 — âmbar dava 2,15, esmeralda 2,54. A rodada anterior consertou isso
 * medindo a luminância e virando a tinta para escura quando o branco não
 * alcançava. Funcionava, mas era remendo: uma conta corrigindo um desenho que
 * não fechava. Fixando a **claridade** da tinta e deixando a pessoa escolher só
 * matiz e croma, não há o que medir — o contraste é estrutural.
 *
 * Antes disso ele também foi lustrado: degradê branco na diagonal, borda clara,
 * sombra e um `backdrop-blur`. Saiu porque o resto do sistema preenche chapado.
 */
const colorTileVariants = cva(
  [
    "flex shrink-0 items-center justify-center overflow-hidden",
    // O véu tem as mesmas proporções de `--identity-N-surface`: 12% da cor
    // sobre o cartão no claro, 18% no escuro. Opaco e não alpha — dois
    // ladrilhos vizinhos não devem se atravessar.
    "bg-[color-mix(in_srgb,var(--tile-color)_12%,var(--card))]",
    "dark:bg-[color-mix(in_srgb,var(--tile-color)_18%,var(--card))]",
    // A tinta vem da cor da pessoa com a **claridade trocada** pela do sistema:
    // 0,42 no claro e 0,78 no escuro, os mesmos números da rampa de identidade.
    // `oklch(from …)` pega matiz e croma do que ela escolheu e descarta o resto,
    // então amarelo puro e azul-marinho chegam aqui com o mesmo peso.
    "[&>*]:text-[oklch(from_var(--tile-color)_0.42_c_h)]",
    "dark:[&>*]:text-[oklch(from_var(--tile-color)_0.78_c_h)]",
    // O fio leva a mesma claridade normalizada da tinta, e não a cor crua.
    // Medido: com a cor crua, um ladrilho branco dava véu de 1,00 contra o
    // cartão **e** fio branco sobre branco — o corpo sumia inteiro e sobrava um
    // ícone flutuando. Normalizado, o fio de um branco é um cinza de 0,42, que
    // se enxerga. É o mesmo motivo da tinta, aplicado à aresta.
    "ring-1 ring-[oklch(from_var(--tile-color)_0.42_c_h_/_0.25)]",
    "dark:ring-[oklch(from_var(--tile-color)_0.78_c_h_/_0.25)]",
  ].join(" "),
  {
    variants: {
      size: {
        sm: "size-8 rounded-md [&>svg]:size-4",
        md: "size-9 rounded-md [&>svg]:size-4",
        lg: "size-11 rounded-lg [&>svg]:size-5",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
)

function ColorTile({
  className,
  size,
  color,
  style,
  ...props
  // `div` já tem um `color` — o atributo HTML legado, `string | undefined`.
  // Sem o Omit, a interseção proíbe o `null` que vem do banco.
}: Omit<React.ComponentProps<"div">, "color"> &
  VariantProps<typeof colorTileVariants> & {
    /** Cor gravada no banco. Vazia cai em `--primary`. */
    color?: string | null
  }) {
  return (
    <div
      data-slot="color-tile"
      aria-hidden
      className={cn(colorTileVariants({ size }), className)}
      // A cor entra uma vez, como variável, e as três camadas — véu, tinta e
      // fio — se derivam dela no CSS. Passá-la três vezes pelo `style` exigiria
      // repetir a conta em JavaScript e perderia o `dark:`.
      style={
        {
          "--tile-color": color?.trim() || "var(--primary)",
          ...style,
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { ColorTile, colorTileVariants }
