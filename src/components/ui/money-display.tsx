"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { currencyBRL } from "@/lib/formatters"
import { cn } from "@/lib/utils"

const moneyDisplayVariants = cva("nums", {
  variants: {
    tone: {
      default: "text-foreground",
      income: "text-income",
      expense: "text-expense",
      muted: "text-muted-foreground",
    },
    /** A **face** das figuras (Geist Mono ou Inter); a figura tabular está sempre ligada. */
    mono: {
      true: "font-mono",
      false: "",
    },
    size: {
      sm: "text-xs",
      md: "text-sm",
      lg: "text-base",
      xl: "text-lg font-semibold",
      "2xl": "text-2xl font-semibold",
    },
  },
  defaultVariants: {
    tone: "default",
    size: "md",
  },
})

/**
 * Os tamanhos em que o valor é o assunto da tela: aí as figuras vão para
 * Geist Mono por padrão. Nas linhas de lista, Inter com figura tabular.
 * `mono` sobrescreve nos dois sentidos.
 */
const FIGURE_SIZES = new Set(["xl", "2xl"])

type MoneyDisplayProps = Omit<React.ComponentProps<"span">, "children"> &
  Omit<VariantProps<typeof moneyDisplayVariants>, "mono"> & {
    value: number | null | undefined
    currency?: string
    signed?: boolean
    compact?: boolean
    mono?: boolean
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
  mono,
  size,
  ...props
}: MoneyDisplayProps) {
  const opts = {
    currency,
    signed,
    minimumFractionDigits,
    maximumFractionDigits,
  }

  // `null` é ausência de dado, não zero: não afirma um número que ninguém apurou.
  const text = currencyBRL(value ?? NaN, { ...opts, compact })

  // A notação compacta perde precisão: o valor cheio vai no `title` e no nome acessível.
  const exact =
    compact && value != null && Number.isFinite(value)
      ? currencyBRL(value, opts)
      : undefined

  const figures = mono ?? FIGURE_SIZES.has(size ?? "md")

  return (
    <span
      data-slot="money-display"
      title={exact}
      className={cn(
        moneyDisplayVariants({ tone, mono: figures, size }),
        className
      )}
      {...props}
    >
      {/* `aria-label` num <span> sem papel é ignorado: o valor cheio vai como texto. */}
      {exact ? (
        <>
          <span aria-hidden>{text}</span>
          <span className="sr-only">{exact}</span>
        </>
      ) : (
        text
      )}
    </span>
  )
}

export { MoneyDisplay, moneyDisplayVariants }
