"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { currencyBRL } from "@/lib/formatters"
import { cn } from "@/lib/utils"

const moneyDisplayVariants = cva("tabular-nums", {
  variants: {
    tone: {
      default: "text-foreground",
      income: "text-income",
      expense: "text-expense",
      muted: "text-muted-foreground",
    },
    tabular: {
      true: "font-mono",
      false: "",
    },
    size: {
      sm: "text-xs",
      default: "text-sm",
      lg: "text-base",
      xl: "text-lg font-semibold",
      "2xl": "text-2xl font-semibold",
    },
  },
  defaultVariants: {
    tone: "default",
    size: "default",
  },
})

/**
 * Os tamanhos em que o valor é o assunto da tela, e não um dado de linha.
 *
 * Nestes, as figuras vão para Geist Mono por padrão. O saldo é o herói deste
 * produto, e a face de extrato é a que ele merece: dígito de largura fixa, a
 * coluna que não dança, e o registro de livro-caixa que combina com a serifa
 * dos títulos. Nas linhas de lista o valor volta a ser Inter com
 * `tabular-nums`, que é o certo — mono em 46 linhas de extrato viraria textura.
 *
 * `tabular` continua sobrescrevendo nos dois sentidos: passe `false` num saldo
 * grande e ele volta para a sans.
 */
const FIGURE_SIZES = new Set(["xl", "2xl"])

type MoneyDisplayProps = Omit<React.ComponentProps<"span">, "children"> &
  VariantProps<typeof moneyDisplayVariants> & {
    value: number | null | undefined
    currency?: string
    signed?: boolean
    compact?: boolean
    minimumFractionDigits?: number
    maximumFractionDigits?: number
  }

function MoneyDisplay({
  className,
  value,
  currency = "BRL",
  signed = false,
  compact = false,
  minimumFractionDigits,
  maximumFractionDigits,
  tone,
  tabular,
  size,
  ...props
}: MoneyDisplayProps) {
  const text = currencyBRL(value ?? 0, {
    currency,
    signed,
    compact,
    minimumFractionDigits,
    maximumFractionDigits,
  })

  const figures = tabular ?? FIGURE_SIZES.has(size ?? "default")

  return (
    <span
      data-slot="money-display"
      className={cn(
        moneyDisplayVariants({ tone, tabular: figures, size }),
        className
      )}
      {...props}
    >
      {text}
    </span>
  )
}

export { MoneyDisplay, moneyDisplayVariants }
