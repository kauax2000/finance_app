import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Trecho de código ou identificador literal: nome de token, caminho de arquivo,
 * classe, atalho de teclado escrito.
 *
 * **Duas aparências, e agora a regra está escrita.** O catálogo tinha três
 * tratamentos convivendo sem ninguém dizer qual usar quando: a pastilha deste
 * componente (11px, fundo `muted`), o `<code>` da prosa estilizado pelas
 * páginas (12px, `foreground`, sem fundo) e um punhado de `<code>` com classes
 * escritas à mão. O primeiro aparecia em 6 lugares, o segundo em mais de 500.
 *
 * A divisão que faz sentido é a de **contexto**, não de gosto:
 *
 * - `inline` — dentro de uma frase. Sem fundo, porque uma pastilha no meio de
 *   um parágrafo pica a linha e atrapalha a leitura corrida. Corpo e tinta
 *   iguais aos do `<code>` da prosa, para os dois não brigarem na mesma página.
 * - `chip` — sozinho, como rótulo: o `meta` de um espécime, o token ao lado de
 *   um ladrilho de cor. Aí o fundo é o que separa o literal do que está em
 *   volta, já que não há frase para ancorá-lo.
 */
const codeVariants = cva("font-mono", {
  variants: {
    variant: {
      inline: "text-xs text-foreground",
      chip: "rounded-sm bg-muted px-1.5 py-0.5 text-2xs text-muted-foreground",
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
