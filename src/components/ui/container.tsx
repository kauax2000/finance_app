import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Os degraus de largura, como tabela: o `cva` as lê e as páginas que desenham a
 * régua as iteram. Cada tabela é um literal porque o Tailwind varre o código
 * como texto (`container-versions.test.ts` tranca que o `cva` as referencia).
 * Os números são os das cascas de página do app: 576 em seis, 448 em duas, 672
 * em uma.
 */
const containerSizes = {
  /** 448 — as telas de erro e a coluna das telas de acesso (`SplitShell`). */
  sm: "max-w-md",
  /** 576 — o padrão: configurações, conta, membros, planos e o aceite de convite. */
  md: "max-w-xl",
  /** 672 — o detalhe de cartão. */
  lg: "max-w-2xl",
  /** 1280 — a casca do catálogo. */
  xl: "max-w-7xl",
  /** Sem teto: quem já tem largura de fora. */
  full: "max-w-none",
} as const

/**
 * A calha lateral é opt-in: a casca do app já é dona dela, e adotar o
 * `Container` com calha a dobrava. `page` fala a gramática que o app renderiza
 * (um degrau, quebrando em 768).
 */
const containerGutters = {
  none: "",
  page: "px-4 md:px-6",
} as const

/**
 * O ritmo vertical do que ele contém. `block` é o respiro entre blocos e
 * `section` entre seções, na razão de 2 para 1 que separa "mesmo assunto" de
 * "outro assunto".
 */
const containerStacks = {
  none: "",
  block: "flex flex-col gap-(--space-block)",
  section: "flex flex-col gap-(--space-section)",
} as const

const containerVariants = cva("mx-auto w-full", {
  variants: {
    size: containerSizes,
    gutter: containerGutters,
    stack: containerStacks,
  },
  defaultVariants: { size: "md", gutter: "none", stack: "none" },
})

/** O degrau que `defaultVariants` aplica, para o `data-size` não o adivinhar. */
const DEFAULT_CONTAINER_SIZE = "md" satisfies keyof typeof containerSizes

function Container({
  className,
  size,
  gutter,
  stack,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof containerVariants>) {
  return (
    <div
      data-slot="container"
      // O padrão é declarado uma vez, no `cva`; omitir a única variante num
      // `Omit` deixaria `{}`.
      data-size={size ?? DEFAULT_CONTAINER_SIZE}
      className={cn(containerVariants({ size, gutter, stack }), className)}
      {...props}
    />
  )
}

export {
  Container,
  containerGutters,
  containerSizes,
  containerStacks,
  containerVariants,
  DEFAULT_CONTAINER_SIZE,
}
