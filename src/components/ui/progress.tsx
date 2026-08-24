"use client"

import * as React from "react"
import { Progress as ProgressPrimitive } from "radix-ui"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const progressIndicatorVariants = cva("h-full transition-[width] duration-300 ease-out", {
  variants: {
    // `income` e `expense` existem aqui porque esta é a barra de orçamento
    // consumido: uma categoria que estourou o limite é gasto, não erro do
    // sistema. Sem eles, a única cor disponível era `destructive`, e a
    // invariante do projeto ("success/destructive não são income/expense")
    // ficava impossível de cumprir justamente onde ela mais importa.
    tone: {
      default: "bg-primary",
      success: "bg-success",
      warning: "bg-warning",
      destructive: "bg-destructive",
      income: "bg-income",
      expense: "bg-expense",
    },
  },
  defaultVariants: {
    tone: "default",
  },
})

type ProgressProps = React.ComponentProps<typeof ProgressPrimitive.Root> &
  VariantProps<typeof progressIndicatorVariants> & {
    max?: number
  }

function Progress({
  className,
  value,
  max = 100,
  tone,
  ...props
}: ProgressProps) {
  const pct =
    value != null && max > 0
      ? Math.min(100, Math.max(0, (value / max) * 100))
      : 0

  // O Radix rejeita `value` acima de `max`: ele avisa no console e trata o
  // progresso como indeterminado, o que zera o `aria-valuenow`. Num app de
  // orçamento isso acontece justamente no caso que mais importa — a categoria
  // que estourou. A barra já era limitada a 100% visualmente; o valor enviado ao
  // primitivo passa a ser limitado junto, e o número real vai no
  // `aria-valuetext`, que aceita qualquer coisa.
  const clamped =
    value != null ? Math.min(max, Math.max(0, value)) : value
  const excedeu = value != null && value > max

  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      data-tone={tone ?? "default"}
      data-over={excedeu ? "" : undefined}
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-muted",
        className
      )}
      value={clamped}
      max={max}
      aria-valuetext={
        excedeu ? `${Math.round((value / max) * 100)}%` : undefined
      }
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className={cn(progressIndicatorVariants({ tone }))}
        style={{ width: `${pct}%` }}
      />
    </ProgressPrimitive.Root>
  )
}

export { Progress, progressIndicatorVariants, type ProgressProps }
