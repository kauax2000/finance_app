import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * O ladrilho que carrega uma cor escolhida pela pessoa — ícone de categoria,
 * marca de conta, capa de conta a pagar.
 *
 * **Este é o único lugar do app onde `white` e `black` crus são a resposta
 * certa**, e é por isso que ele existe. O fundo não vem do tema: vem de
 * `categories.color`, `bills.color`, `workspaces.brand_color` — cor de runtime,
 * arbitrária e saturada. Sobre ela, o verniz claro e o fio escuro são material,
 * não decisão de tema: eles têm que ser os mesmos no claro e no escuro, senão o
 * ladrilho muda de aparência sem que a cor tenha mudado.
 *
 * Estava copiado em oito arquivos, idêntico até nos décimos de opacidade. Cada
 * cópia era um achado do auditor, e nenhuma delas dizia por que estava certa.
 *
 * O que ele **não** resolve: se a pessoa escolher um amarelo claro, o ícone
 * branco fica ilegível. Isso exige medir contraste contra a cor gravada, o que
 * é decisão de produto e não de front end.
 */
const colorTileVariants = cva(
  [
    "relative flex shrink-0 items-center justify-center overflow-hidden",
    "border border-white/20 shadow-sm ring-1 ring-black/5 backdrop-blur-md",
    "after:absolute after:inset-0 after:bg-gradient-to-br after:from-white/30 after:to-white/5 after:opacity-80",
    // O conteúdo sobe acima do verniz; o branco aqui é contraste contra a cor
    // de runtime, pela mesma razão da borda.
    "[&>*]:relative [&>*]:z-(--z-raised) [&>*]:text-white",
  ].join(" "),
  {
    variants: {
      size: {
        sm: "size-8 rounded-md [&>svg]:size-4",
        default: "size-9 rounded-md [&>svg]:size-4",
        lg: "size-11 rounded-lg [&>svg]:size-5",
      },
    },
    defaultVariants: {
      size: "default",
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
      style={{ backgroundColor: color?.trim() || "var(--primary)", ...style }}
      {...props}
    />
  )
}

export { ColorTile, colorTileVariants }
