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
    /** Sans + tabular-nums; set `tabular` to true for Geist Mono figures. */
    tabular: false,
    size: "default",
  },
})

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

  return (
    <span
      data-slot="money-display"
      className={cn(moneyDisplayVariants({ tone, tabular, size }), className)}
      {...props}
    >
      {text}
    </span>
  )
}

export { MoneyDisplay, moneyDisplayVariants }
