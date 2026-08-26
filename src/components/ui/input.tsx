import * as React from "react"

import { cn } from "@/lib/utils"

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
        "w-full min-w-0 rounded-lg border border-input bg-input-fill/30 px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/70 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input-fill/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:disabled:bg-input-fill/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
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
