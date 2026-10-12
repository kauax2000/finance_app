import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Trecho de código ou identificador literal: nome de token, caminho de arquivo,
 * classe, atalho de teclado escrito.
 *
 * - `inline` — dentro de uma frase, sem fundo (pastilha picaria a linha); corpo
 *   e tinta iguais aos do `<code>` da prosa.
 * - `chip` — sozinho, como rótulo; o fundo separa o literal do entorno. O canto
 *   é `rounded-md`, não cápsula.
 */
const codeVariants = cva("font-mono", {
  variants: {
    variant: {
      inline: "text-xs text-foreground",
      chip: "rounded-md bg-muted px-1.5 py-0.5 text-2xs text-muted-foreground",
    },
  },
  defaultVariants: {
    variant: "chip",
  },
})

function Code({
  className,
  variant,
  ...props
}: React.ComponentProps<"code"> & VariantProps<typeof codeVariants>) {
  return (
    <code
      data-slot="code"
      data-variant={variant ?? "chip"}
      className={cn(codeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Code, codeVariants }
