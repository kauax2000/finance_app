import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { Caption, P } from "@/components/ui/typography"

/**
 * Feed vertical de histórico: ponto, conector e conteúdo.
 *
 * O uso previsto é a atividade do workspace e o histórico de uma fatura, que hoje
 * desenham a linha à mão. O conector é um pseudo-elemento em vez de um `<span>`,
 * para o último item poder suprimi-lo sem que o consumidor precise saber qual é
 * o último.
 */
function Timeline({ className, ...props }: React.ComponentProps<"ol">) {
  return (
    <ol
      data-slot="timeline"
      className={cn("flex flex-col", className)}
      {...props}
    />
  )
}

const timelineDotVariants = cva(
  "relative z-(--z-raised) mt-0.5 flex size-2.5 shrink-0 items-center justify-center rounded-full ring-4 ring-background",
  {
    variants: {
      tone: {
        default: "bg-border",
        primary: "bg-primary",
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
  }
)

/**
 * Um evento. `isLast` corta o conector — sem ele a linha continua para baixo do
 * último item e o feed parece truncado.
 */
function TimelineItem({
  className,
  tone,
  isLast = false,
  children,
  ...props
}: React.ComponentProps<"li"> &
  VariantProps<typeof timelineDotVariants> & {
    isLast?: boolean
  }) {
  return (
    <li
      data-slot="timeline-item"
      data-last={isLast ? "" : undefined}
      className={cn("flex gap-3", className)}
      {...props}
    >
      <div className="relative flex flex-col items-center">
        <span className={cn(timelineDotVariants({ tone }))} aria-hidden />
        {!isLast ? (
          <span className="w-px flex-1 bg-border" aria-hidden />
        ) : null}
      </div>
      <div className={cn("min-w-0 flex-1", isLast ? "pb-0" : "pb-6")}>
        {children}
      </div>
    </li>
  )
}

/** Título do evento e sua legenda: mesmo dado em duas linhas, sem `gap`. */
function TimelineTitle({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <P
      data-slot="timeline-title"
      className={cn("font-medium", className)}
      {...props}
    />
  )
}

function TimelineDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <Caption data-slot="timeline-description" className={className} {...props} />
  )
}

/** Carimbo de tempo. `nums` mantém a coluna de horários alinhada. */
function TimelineTime({ className, ...props }: React.ComponentProps<"time">) {
  return (
    <Caption asChild data-slot="timeline-time" className={cn("nums text-2xs", className)}>
      <time {...props} />
    </Caption>
  )
}

export {
  Timeline,
  TimelineDescription,
  TimelineItem,
  TimelineTime,
  TimelineTitle,
  timelineDotVariants,
}
