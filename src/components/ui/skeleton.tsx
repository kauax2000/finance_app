"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * O osso da tela enquanto o dado não chegou. `shape` dá nome às formas das
 * peças reais e `size` fala a escada da peça que o osso substitui, então a troca não salta.
 * - `block` (padrão): o retângulo, medido por `className`.
 * - `text`: uma linha de texto; a caixa tem a entrelinha do corpo (`1lh`) e o
 *   osso pinta 0,8em no meio. Ponha a classe de texto da linha real e a largura.
 * - `circle`: o `Avatar` (xs 24 … xl 56).
 * - `tile`: o `ColorTile` (xs 24 … 2xl 44).
 * - `pill`: o `Badge` (xs 14 · sm 18 · md 22).
 * Um movimento só, o pulso (o bloco global de movimento reduzido o isenta): dois
 * movimentos para o mesmo estado deixariam cada tela escolher o seu.
 * `SkeletonGroup` é o bloco que espera: o contêiner anuncia (`role="status"`,
 * `aria-busy`, rótulo) e guarda o `delay`, para uma resposta rápida não piscar esqueleto.
 */
type SkeletonShape = "block" | "text" | "circle" | "tile" | "pill"

/** O corpo de cada forma, por degrau. Literal por extenso: o Tailwind lê texto. */
const FORMAS = {
  block: { base: "rounded-md", sizes: {} as Record<string, string> },
  text: {
    base: "skeleton-text rounded-sm",
    sizes: {} as Record<string, string>,
  },
  circle: {
    base: "shrink-0 rounded-full",
    sizes: { xs: "size-6", sm: "size-8", md: "size-10", lg: "size-12", xl: "size-14" } as Record<string, string>,
    padrao: "md",
  },
  tile: {
    base: "shrink-0",
    sizes: {
      xs: "size-6 rounded-md",
      md: "size-8 rounded-row",
      lg: "size-9 rounded-row",
      xl: "size-10 rounded-row",
      "2xl": "size-11 rounded-row",
    } as Record<string, string>,
    padrao: "md",
  },
  pill: {
    base: "w-14 shrink-0 rounded-full",
    sizes: { xs: "h-3.5", sm: "h-4.5", md: "h-5.5" } as Record<string, string>,
    padrao: "md",
  },
} as const

type SkeletonSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl"

function Skeleton({
  className,
  shape = "block",
  size,
  ...props
}: React.ComponentProps<"div"> & {
  /** A forma da peça que o osso substitui. */
  shape?: SkeletonShape
  /** O degrau da peça: Avatar no `circle`, ColorTile no `tile`, Badge no `pill`. */
  size?: SkeletonSize
}) {
  const forma = FORMAS[shape]
  const degrau =
    "padrao" in forma ? forma.sizes[size ?? forma.padrao] : undefined
  return (
    <div
      data-slot="skeleton"
      data-shape={shape}
      aria-hidden
      className={cn(
        "animate-pulse bg-skeleton",
        forma.base,
        degrau,
        className
      )}
      {...props}
    />
  )
}

/**
 * O parágrafo ou a pilha de linhas: cada uma é um `Skeleton shape="text"`, então
 * a altura é a do texto real; a última sai mais curta. Ponha o corpo (`text-sm`) no `className`.
 */
function SkeletonText({
  className,
  lines = 3,
  ...props
}: React.ComponentProps<"div"> & {
  lines?: number
}) {
  return (
    <div data-slot="skeleton-text" aria-hidden className={cn("flex w-full flex-col", className)} {...props}>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton
          key={i}
          shape="text"
          className={lines > 1 && i === lines - 1 ? "w-3/5" : "w-full"}
        />
      ))}
    </div>
  )
}

/**
 * O bloco que espera: `role="status"`, `aria-busy` e o rótulo lido pelo leitor
 * de tela (os ossos são `aria-hidden`). `delay` o esconde nos primeiros 300ms
 * (ou nos ms recebidos) e o faz entrar esmaecendo por `@starting-style`; sem
 * suporte, aparece na hora.
 */
function SkeletonGroup({
  className,
  label = "Carregando…",
  delay = false,
  style,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  /** O que o leitor de tela anuncia. */
  label?: string
  /** Só aparece depois do atraso: `true` é 300ms. */
  delay?: boolean | number
}) {
  const ms = delay === true ? 300 : delay || 0
  return (
    <div
        data-slot="skeleton-group"
        role="status"
        aria-busy="true"
        className={cn(
          ms > 0 &&
            "transition-opacity duration-(--duration-base) ease-(--ease-out) starting:opacity-0",
          className
        )}
        style={ms > 0 ? { transitionDelay: `${ms}ms`, ...style } : style}
        {...props}
      >
        <span className="sr-only">{label}</span>
        {children}
    </div>
  )
}

export { Skeleton, SkeletonGroup, SkeletonText }
