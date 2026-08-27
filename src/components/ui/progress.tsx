"use client"

import * as React from "react"
import { Progress as ProgressPrimitive } from "radix-ui"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * O trilho. A altura mora aqui porque ela é do componente, não da tela.
 *
 * As três chamadas do app declaravam a própria altura em `className` — duas em
 * `h-1.5` e uma em `h-2` —, e nenhuma sabia da outra. Dois degraus nomeados
 * dizem a mesma coisa uma vez só: `sm` para barra dentro de linha de lista,
 * `md` para barra que é o assunto do bloco.
 */
const progressVariants = cva(
  cn(
    "relative w-full overflow-hidden rounded-full",
    // Era `bg-muted`, que no tema claro fica a meio ponto de cinza do cartão:
    // a parte **não** consumida sumia, e a barra lia como um traço solto em vez
    // de uma proporção. Uma barra de progresso sem o trilho visível não diz
    // "45% de", diz "45". É o mesmo token do trilho vazio do `Slider`.
    "bg-input-fill"
  ),
  {
    variants: {
      size: {
        sm: "h-1.5",
        md: "h-2",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
)

const progressIndicatorVariants = cva(
  cn(
    "h-full rounded-full",
    "transition-[width] duration-(--duration-slow) ease-out"
  ),
  {
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
      // Piso de largura para valor pequeno e diferente de zero. A 1% de um
      // trilho de 300px sobram 3px, que sob `rounded-full` viram uma lasca
      // quase invisível — "mal começou" desenhava igual a "não começou". O
      // piso é a própria altura da barra, então o mínimo é um ponto redondo.
      size: {
        sm: "data-filled:min-w-1.5",
        md: "data-filled:min-w-2",
      },
    },
    defaultVariants: {
      tone: "default",
      size: "md",
    },
  }
)

type ProgressProps = React.ComponentProps<typeof ProgressPrimitive.Root> &
  VariantProps<typeof progressVariants> &
  Pick<VariantProps<typeof progressIndicatorVariants>, "tone"> & {
    max?: number
  }

function Progress({
  className,
  value,
  max = 100,
  tone,
  size,
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
      className={cn(progressVariants({ size }), className)}
      value={clamped}
      max={max}
      aria-valuetext={
        excedeu ? `${Math.round((value / max) * 100)}%` : undefined
      }
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        data-filled={pct > 0 ? "" : undefined}
        className={cn(progressIndicatorVariants({ tone, size }))}
        style={{ width: `${pct}%` }}
      />
    </ProgressPrimitive.Root>
  )
}

export {
  Progress,
  progressVariants,
  progressIndicatorVariants,
  type ProgressProps,
}
