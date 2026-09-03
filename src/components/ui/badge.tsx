import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border border-transparent text-center font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  {
    variants: {
      /**
       * A **forma**, e só ela.
       *
       * Este eixo carregava três coisas ao mesmo tempo: peso (`primary`,
       * `secondary`), forma (`outline`) e **tom** (`success`, `warning`,
       * `income`, `expense`). Tom é o que `Alert`, `StatCard`, `Timeline`,
       * `Progress`, `Separator` e `AnnouncementBar` chamam de `tone` — o
       * `Badge` era o único a discordar, que é palavra por palavra a correção
       * que a rodada do `Alert` já tinha feito quando ele era o único.
       *
       * Com os dois eixos separados, uma combinação que antes não existia
       * passa a existir: contorno **na cor do tom**. Antes, `outline` só sabia
       * ser cinza.
       */
      variant: {
        soft: "border-transparent",
        outline: "bg-transparent",
      },
      /**
       * A **cor**, com o mesmo nome e os mesmos valores do resto do sistema.
       *
       * `primary` é a marca em tinta suave. Ela rendia `bg-info-muted`, ou seja
       * **azul**, num sistema em que `primary` é o verde em todo o resto —
       * medido, 4/44/67 em RGB. O par `--primary-muted` foi criado para isto.
       */
      tone: {
        primary: "",
        neutral: "",
        success: "",
        warning: "",
        destructive: "",
        income: "",
        expense: "",
      },
      // Cada degrau tem entrelinha própria porque é ela, não o padding, que
      // manda na altura de um rótulo desta escala: `leading-tight` na base
      // resolvia para 16px tanto no texto de 11px quanto no de 12px, e por isso
      // `xs` e `sm` saíam com a mesma altura — três nomes, duas alturas.
      //
      // Altura = entrelinha + 2×py + 2 (a borda transparente da base, que fica
      // para o `outline` ter contorno sem mudar a geometria dos outros).
      //
      // `default` saiu do tipo: o nome dizia *o padrão* em vez de dizer a
      // medida, e é o mesmo que já saiu de `Button`, `Input`, `SelectTrigger`,
      // `NativeSelect` e `Container`.
      size: {
        xs: "px-1.5 py-0 text-2xs leading-3",
        sm: "px-2 py-0 text-xs leading-4",
        md: "px-2.5 py-0.5 text-xs leading-4",
      },
    },
    /**
     * A tinta sai do cruzamento dos dois eixos.
     *
     * `soft` preenche com a tinta suave do tom; `outline` desenha o contorno e
     * o texto **na cor do tom**, sem preencher. É por isso que os valores de
     * `tone` acima são vazios: sozinho, um tom não sabe se pinta fundo ou
     * borda.
     */
    compoundVariants: [
      { variant: "soft", tone: "primary", class: "bg-primary-muted text-primary-muted-foreground hover:bg-primary-muted/80" },
      { variant: "soft", tone: "neutral", class: "bg-muted text-muted-foreground hover:bg-muted/80" },
      { variant: "soft", tone: "success", class: "bg-success-muted text-success-muted-foreground hover:bg-success-muted/80" },
      { variant: "soft", tone: "warning", class: "bg-warning-muted text-warning-muted-foreground hover:bg-warning-muted/80" },
      { variant: "soft", tone: "destructive", class: "bg-destructive-muted text-destructive-muted-foreground hover:bg-destructive-muted/80" },
      { variant: "soft", tone: "income", class: "bg-income-muted text-income-muted-foreground hover:bg-income-muted/80" },
      { variant: "soft", tone: "expense", class: "bg-expense-muted text-expense-muted-foreground hover:bg-expense-muted/80" },

      { variant: "outline", tone: "primary", class: "border-primary-accent/40 text-primary-accent hover:bg-primary-muted/40" },
      { variant: "outline", tone: "neutral", class: "border-border text-foreground hover:bg-muted" },
      { variant: "outline", tone: "success", class: "border-success/40 text-success-muted-foreground hover:bg-success-muted/40" },
      { variant: "outline", tone: "warning", class: "border-warning/40 text-warning-muted-foreground hover:bg-warning-muted/40" },
      { variant: "outline", tone: "destructive", class: "border-destructive/40 text-destructive-muted-foreground hover:bg-destructive-muted/40" },
      { variant: "outline", tone: "income", class: "border-income/40 text-income-muted-foreground hover:bg-income-muted/40" },
      { variant: "outline", tone: "expense", class: "border-expense/40 text-expense-muted-foreground hover:bg-expense-muted/40" },
    ],
    defaultVariants: {
      variant: "soft",
      tone: "primary",
      size: "md",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, tone, size, ...props }: BadgeProps) {
  return (
    <div
      data-slot="badge"
      className={cn(badgeVariants({ variant, tone, size }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
