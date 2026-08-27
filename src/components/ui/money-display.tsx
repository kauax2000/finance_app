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
    /**
     * A **face**, não a figura tabular.
     *
     * O prop se chamava `tabular` e mentia: a figura tabular está na base e
     * está sempre ligada — `tabular={false}` não a desligava, desligava a
     * Geist Mono. O nome descrevia a coisa errada.
     */
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
 * Os tamanhos em que o valor é o assunto da tela, e não um dado de linha.
 *
 * Nestes, as figuras vão para Geist Mono por padrão. O saldo é o herói deste
 * produto, e a face de extrato é a que ele merece: dígito de largura fixa, a
 * coluna que não dança, e o registro de livro-caixa que combina com a serifa
 * dos títulos. Nas linhas de lista o valor volta a ser Inter com figura
 * tabular, que é o certo — mono em 46 linhas de extrato viraria textura.
 *
 * `mono` continua sobrescrevendo nos dois sentidos: passe `false` num saldo
 * grande e ele volta para a sans.
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

  // `null` é ausência de dado, não zero. Ele desenhava R$ 0,00 — a mesma coisa
  // que um saldo zerado de verdade — enquanto um `NaN` já respondia "—". Duas
  // respostas para a mesma pergunta, e num app de finanças a errada é a que
  // afirma um número que ninguém apurou. `NaN` cai no travessão do formatador.
  const text = currencyBRL(value ?? NaN, { ...opts, compact })

  // A notação compacta joga fora a precisão: `R$ 1,23 mi` não diz se são
  // 1.234.567 ou 1.230.000. O valor cheio fica no `title`, para o ponteiro, e
  // no nome acessível, para quem não tem ponteiro.
  const exact =
    compact && value != null && Number.isFinite(value)
      ? currencyBRL(value, opts)
      : undefined

  const figures = mono ?? FIGURE_SIZES.has(size ?? "md")

  return (
    <span
      data-slot="money-display"
      title={exact}
      aria-label={exact}
      className={cn(
        moneyDisplayVariants({ tone, mono: figures, size }),
        className
      )}
      {...props}
    >
      {text}
    </span>
  )
}

export { MoneyDisplay, moneyDisplayVariants }
