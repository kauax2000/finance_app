import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border border-transparent text-center font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  {
    variants: {
      variant: {
        /**
         * A marca, em tinta suave — como as outras sete.
         *
         * Ela rendia `bg-info-muted`, ou seja **azul**, num sistema em que
         * `primary` é o verde da marca em todo o resto (o `Button primary`
         * preenche de verde). Medido: 4/44/67 em RGB — azul escuro. O nome mentia, e havia
         * um consumidor vivo — o "Beta" de `bills-toolbar.tsx:189`, que saía
         * azul sem ninguém ter pedido azul.
         *
         * O par `--primary-muted` foi criado para isto: não existia, e sem ele
         * a única saída seria preencher de `--primary` cheio, que seria a
         * única variante saturada entre oito tintas.
         */
        primary:
          "bg-primary-muted text-primary-muted-foreground hover:bg-primary-muted/80",
        secondary: "bg-muted text-muted-foreground hover:bg-muted/80",
        destructive:
          "bg-destructive-muted text-destructive-muted-foreground hover:bg-destructive-muted/80",
        outline:
          "border-border bg-transparent text-foreground hover:bg-muted hover:text-foreground",
        success:
          "bg-success-muted text-success-muted-foreground hover:bg-success-muted/80",
        warning:
          "bg-warning-muted text-warning-muted-foreground hover:bg-warning-muted/80",
        income:
          "bg-income-muted text-income-muted-foreground hover:bg-income-muted/80",
        expense:
          "bg-expense-muted text-expense-muted-foreground hover:bg-expense-muted/80",
      },
      // Cada degrau tem entrelinha própria porque é ela, não o padding, que
      // manda na altura de um rótulo desta escala: `leading-tight` na base
      // resolvia para 16px tanto no texto de 11px quanto no de 12px, e por isso
      // `xs` e `sm` saíam com a mesma altura — três nomes, duas alturas.
      //
      // Altura = entrelinha + 2×py + 2 (a borda transparente da base, que fica
      // para o `outline` ter contorno sem mudar a geometria dos outros).
      size: {
        xs: "px-1.5 py-0 text-2xs leading-3",
        sm: "px-2 py-0 text-xs leading-4",
        default: "px-2.5 py-0.5 text-xs leading-4",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div
      data-slot="badge"
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
