import * as React from "react"

import { cn } from "@/lib/utils"
import {
  fieldDisabledClassName,
  fieldFocusRingClassName,
  fieldInvalidClassName,
  fieldSurfaceClassName,
} from "@/lib/field-classes"

const Input = React.forwardRef<
  HTMLInputElement,
  Omit<React.ComponentProps<"input">, "size"> & {
    /** Mesma escada do Button, mesmos nomes: sm 28, md 32, lg 36, xl 40.
        Substitui o `size` nativo do <input>, que é largura em caracteres e
        nunca foi usado aqui. */
    size?: "sm" | "md" | "lg" | "xl"
  }
>(({ className, type, size = "md", ...props }, ref) => {
  return (
    <input
      ref={ref}
      type={type}
      data-slot="input"
      data-size={size}
      className={cn(
        // A régua compartilhada vem primeiro; o degrau, por último. `cn` é
        // `twMerge`, e o `sm` traz `md:text-control-sm` — que só vence o
        // `md:text-sm` da superfície se vier depois dele.
        fieldSurfaceClassName,
        fieldFocusRingClassName,
        fieldInvalidClassName,
        fieldDisabledClassName,
        // `disabled:pointer-events-none` fica aqui, e não na régua: o
        // `SelectTrigger` não o tem, e igualá-los seria mudar comportamento
        // dentro de uma extração que promete não mudar nenhum.
        "w-full min-w-0 px-2.5 py-1 placeholder:text-muted-foreground disabled:pointer-events-none",
        "file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
        size === "sm" && "h-7 px-2 md:text-control-sm",
        size === "md" && "h-8 px-3",
        size === "lg" && "h-9 px-3",
        size === "xl" && "h-10 px-3",
        className
      )}
      {...props}
    />
  )
})
Input.displayName = "Input"

export { Input }
