import * as React from "react"

import { cn } from "@/lib/utils"
import {
  fieldControlPaddingClassName,
  fieldDisabledClassName,
  fieldFocusRingClassName,
  fieldInvalidClassName,
  fieldSurfaceClassName,
  type FieldControlSize,
} from "@/lib/field-classes"

/**
 * O degrau **não mede altura aqui**, e o tipo diz isso por escrito.
 *
 * A altura do textarea vem de `field-sizing-content min-h-16` — ela cresce com
 * o conteúdo, já nasce acima do piso de toque, e um `h-*` brigaria com ela. O
 * que o degrau carrega é o recuo e o corpo do texto, para um `FormTextarea`
 * poder ficar ao lado de um `FormInput size="lg"` falando o mesmo nome.
 *
 * Dito na mesa: com dois valores distintos de recuo na escada inteira, o prop
 * compra 4px num degrau que hoje ninguém usa. Ele existe porque a família fala
 * uma língua só.
 */
type TextareaProps = Omit<React.ComponentProps<"textarea">, "size"> & {
  size?: FieldControlSize
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, size = "md", ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        data-slot="textarea"
        data-size={size}
        // A superfície é a de `field-classes` — a mesma do `Input`. Antes esta
        // linha era a quinta cópia da régua, e a única em que o desabilitado não
        // tinha preenchimento.
        className={cn(
          fieldSurfaceClassName,
          fieldFocusRingClassName,
          fieldInvalidClassName,
          fieldDisabledClassName,
          // `px-2.5` saiu: eram 10px contra os 12 do `Input`, e empilhados num
          // formulário a borda esquerda do texto serrilhava.
          "field-sizing-content flex min-h-16 w-full py-2 placeholder:text-muted-foreground",
          fieldControlPaddingClassName[size],
          className
        )}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
export type { TextareaProps }
