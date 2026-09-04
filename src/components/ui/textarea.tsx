import * as React from "react"

import { cn } from "@/lib/utils"
import {
  fieldDisabledClassName,
  fieldFocusRingClassName,
  fieldInvalidClassName,
  fieldSurfaceClassName,
} from "@/lib/field-classes"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      data-slot="textarea"
      // A superfície é a de `field-classes` — a mesma do `Input`. Antes esta
      // linha era a quinta cópia da régua, e a única em que o desabilitado não
      // tinha preenchimento.
      className={cn(
        fieldSurfaceClassName,
        fieldFocusRingClassName,
        fieldInvalidClassName,
        fieldDisabledClassName,
        "field-sizing-content flex min-h-16 w-full px-2.5 py-2 placeholder:text-muted-foreground",
        className
      )}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
