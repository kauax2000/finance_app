import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Trecho de código ou identificador literal dentro do texto.
 *
 * Existe para que nome de token, caminho de arquivo e classe apareçam sempre com
 * a mesma forma. `--font-mono` (Geist Mono) já está declarado no layout raiz.
 */
function Code({ className, ...props }: React.ComponentProps<"code">) {
  return (
    <code
      data-slot="code"
      className={cn(
        "rounded-sm bg-muted px-1.5 py-0.5 font-mono text-2xs text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

export { Code }
