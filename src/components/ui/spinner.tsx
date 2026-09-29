import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * A roda de espera, para ação curta e sem fim conhecido.
 *
 * ## Uma roda desenhada, e não a seta de atualizar (rodada 178)
 *
 * Até a rodada 177 o spinner era o `ArrowPathIcon` girando — e no app essa
 * seta **é o "tentar novamente"**: a tela de erro, o `Button iconMotion="spin"`.
 * Um botão salvando e um botão de atualizar desenhavam o mesmo glifo. Agora é
 * um arco de 25% sobre um trilho de 20% de tinta, desenhado — a exceção de
 * `DRAWN_SVG_FILES` do auditor, que sempre nomeou o spinner como primitivo
 * cuja geometria é o comportamento. O traço tem 3 unidades de 24: 2px a 16,
 * 4px a 32.
 *
 * ## `size` é a escada do ícone
 *
 * `sm` 14 · **`md` 16** · `lg` 20 · `xl` 24 · `2xl` 32 — os corpos em que o
 * app o escrevia à mão (`size-3.5`, `size-6`, `size-8`).
 *
 * ## `variant="brand"` é o arco em arco-íris
 *
 * Um anel em `conic-gradient` da marca, com a cauda transparente, recortado
 * por máscara (`@utility spinner-brand`). É da tela de abertura do app, ao lado
 * do wordmark em arco-íris. Uma por tela.
 *
 * ## Decorativo por padrão
 *
 * O rótulo quase sempre já está do lado — um botão que diz "Salvando…" não
 * quer ouvir "Carregando" depois. Sem `label` o spinner é `aria-hidden`; com
 * ele, vira `role="status"` com nome. (O `ArrowPathIcon` punha `aria-hidden`
 * no próprio `<svg>`, e o `role` que a peça declarava nunca valeu nada.)
 *
 * ## Ele gira com movimento reduzido
 *
 * O bloco global de `prefers-reduced-motion` **isenta** `animate-spin`: uma
 * roda parada não diz que algo acontece.
 */
const TAMANHOS = {
  sm: "size-3.5",
  md: "size-4",
  lg: "size-5",
  xl: "size-6",
  "2xl": "size-8",
} as const

type SpinnerSize = keyof typeof TAMANHOS

function Spinner({
  className,
  label,
  size = "md",
  variant = "default",
  ...props
}: React.ComponentProps<"svg"> & {
  /**
   * O que anunciar quando o spinner está **sozinho**, sem texto ao lado.
   * Sem ele o spinner é invisível para o leitor de tela, de propósito.
   */
  label?: string
  /** O corpo, na escada do ícone: 14, 16, 20, 24 e 32px. */
  size?: SpinnerSize
  /** `brand` é o arco em arco-íris. Uma por tela. */
  variant?: "default" | "brand"
}) {
  const voz = label
    ? ({ role: "status", "aria-label": label } as const)
    : ({ "aria-hidden": true } as const)

  if (variant === "brand") {
    return (
      <span
        data-slot="spinner"
        data-variant="brand"
        className={cn("inline-block shrink-0 animate-spin spinner-brand", TAMANHOS[size], className)}
        {...voz}
      />
    )
  }

  return (
    <svg
      data-slot="spinner"
      data-variant="default"
      viewBox="0 0 24 24"
      fill="none"
      className={cn("shrink-0 animate-spin", TAMANHOS[size], className)}
      {...voz}
      {...props}
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.2" />
      {/* `pathLength` 100 faz o traço valer a porcentagem: 25 é um quarto da volta. */}
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        pathLength={100}
        strokeDasharray="25 100"
      />
    </svg>
  )
}

/**
 * O bloco de espera: o spinner com o texto, centrado numa região.
 *
 * É o anunciador (`role="status"`, e o texto é o que se lê — o spinner de
 * dentro é decorativo). E ele **atrasa**: com `delay` o bloco só aparece depois
 * de 300ms (ou dos milissegundos que receber), esmaecendo, por
 * `@starting-style` — a espera curta não pisca, e o espaço fica reservado
 * desde o primeiro quadro, então nada salta quando ele entra. É o que a tela de
 * abertura do app fazia à mão, com um `setTimeout` e um `opacity` trocado.
 */
function SpinnerBlock({
  className,
  label,
  showLabel = true,
  delay = true,
  size = "lg",
  variant = "default",
  style,
  ...props
}: React.ComponentProps<"div"> & {
  /** O que se lê e se anuncia. */
  label: string
  /** `false` deixa o texto só para o leitor de tela. */
  showLabel?: boolean
  /** Só aparece depois do atraso: `true` é 300ms. */
  delay?: boolean | number
  size?: SpinnerSize
  variant?: "default" | "brand"
}) {
  const ms = delay === true ? 300 : delay || 0
  return (
    <div
      data-slot="spinner-block"
      role="status"
      aria-live="polite"
      className={cn(
        "flex flex-col items-center justify-center gap-3 text-sm text-muted-foreground",
        ms > 0 && "transition-opacity duration-(--duration-slow) ease-(--ease-out) starting:opacity-0",
        className
      )}
      style={ms > 0 ? { transitionDelay: `${ms}ms`, ...style } : style}
      {...props}
    >
      <Spinner size={size} variant={variant} />
      <span className={showLabel ? undefined : "sr-only"}>{label}</span>
    </div>
  )
}

export { Spinner, SpinnerBlock }
