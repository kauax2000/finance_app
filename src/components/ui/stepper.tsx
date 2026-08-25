"use client"

import { CheckIcon } from "@heroicons/react/16/solid"
import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * Progresso por etapas de um fluxo.
 *
 * A etapa atual carrega `aria-current="step"` e a lista inteira é um `<ol>`, para
 * um leitor de tela anunciar "3 de 5" sem depender do desenho. No telefone o
 * rótulo some e ficam só os marcadores: cinco palavras lado a lado não cabem em
 * 360px, e a etapa atual continua nomeada acima do componente.
 */
function Stepper({
  className,
  ...props
}: React.ComponentProps<"ol">) {
  return (
    <ol
      data-slot="stepper"
      className={cn("flex w-full items-start gap-2", className)}
      {...props}
    />
  )
}

type StepState = "complete" | "current" | "upcoming"

function StepperItem({
  className,
  state = "upcoming",
  step,
  label,
  isLast = false,
  ...props
}: Omit<React.ComponentProps<"li">, "children"> & {
  state?: StepState
  /** Número exibido no marcador quando a etapa ainda não foi concluída. */
  step: number
  label?: string
  isLast?: boolean
}) {
  return (
    <li
      data-slot="stepper-item"
      data-state={state}
      aria-current={state === "current" ? "step" : undefined}
      className={cn("flex min-w-0 flex-1 flex-col gap-1.5", className)}
      {...props}
    >
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "flex size-6 shrink-0 items-center justify-center rounded-full border text-2xs font-medium transition-colors",
            state === "complete" &&
              "border-transparent bg-primary text-primary-foreground",
            state === "current" &&
              "border-primary bg-primary/10 text-primary",
            state === "upcoming" &&
              "border-border bg-transparent text-muted-foreground"
          )}
        >
          {state === "complete" ? (
            <CheckIcon className="size-3.5" aria-hidden />
          ) : (
            step
          )}
        </span>
        {!isLast ? (
          <span
            className={cn(
              "h-px flex-1",
              state === "complete" ? "bg-primary" : "bg-border"
            )}
            aria-hidden
          />
        ) : null}
      </div>
      {label ? (
        <span
          className={cn(
            // `hidden` tirava o rótulo da árvore de acessibilidade no telefone:
            // quem enxerga via "1 2 3" e entende pela largura; quem usa leitor
            // ouvia "1 2 3" e mais nada. `sr-only` esconde do olho e mantém no
            // leitor, que é o que "esconder no mobile" queria dizer.
            "sr-only truncate text-xs sm:not-sr-only sm:block",
            state === "upcoming" ? "text-muted-foreground" : "text-foreground"
          )}
        >
          {label}
        </span>
      ) : null}
    </li>
  )
}

export { Stepper, StepperItem }
export type { StepState }
