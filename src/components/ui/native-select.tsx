import { ChevronDownIcon } from "@heroicons/react/16/solid"
import * as React from "react"

import { cn } from "@/lib/utils"
import {
  fieldDisabledClassName,
  fieldFocusRingClassName,
  fieldInvalidClassName,
  fieldSurfaceClassName,
  fieldTriggerHoverClassName,
  fieldTriggerSizeClassName,
} from "@/lib/field-classes"

type NativeSelectProps = Omit<React.ComponentProps<"select">, "size"> & {
  size?: "sm" | "md" | "lg" | "xl"
}

function NativeSelect({
  className,
  size = "md",
  ...props
}: NativeSelectProps) {
  return (
    <div
      className={cn("group/native-select relative w-fit", className)}
      data-slot="native-select-wrapper"
      data-size={size}
    >
      <select
        data-slot="native-select"
        data-size={size}
        // A superfície, o anel, o inválido, o desabilitado, o hover de gatilho e
        // a escada vêm de `field-classes` — a mesma régua do `Input` e do
        // `SelectTrigger`. Esta linha era a "quinta cópia" do backlog, e trazia
        // três desvios só dela: `data-[size=sm]:rounded-md` (raio diferente num
        // degrau, que nenhum outro controle faz), `dark:hover:` sem par `active:`
        // e só no escuro, e `text-sm` sem a rampa de 16px que evita o zoom do
        // iOS. Os três saíram. O `disabled:pointer-events-none` fica: é o mesmo
        // desvio do `Input`, e está documentado lá.
        className={cn(
          fieldSurfaceClassName,
          fieldFocusRingClassName,
          fieldInvalidClassName,
          fieldDisabledClassName,
          fieldTriggerHoverClassName,
          fieldTriggerSizeClassName,
          "w-full min-w-0 appearance-none py-1 pr-8 pl-2.5 select-none selection:bg-primary selection:text-primary-foreground placeholder:text-muted-foreground disabled:pointer-events-none data-[size=sm]:py-0.5"
        )}
        {...props}
      />
      {/* A opacidade do desabilitado é do `<select>` (pela régua); o chevron,
          que é irmão, acompanha por conta própria — antes ela estava na casca e
          se somaria à do controle. */}
      <ChevronDownIcon
        className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-muted-foreground select-none group-has-[select:disabled]/native-select:opacity-50"
        aria-hidden="true"
        data-slot="native-select-icon"
      />
    </div>
  )
}

function NativeSelectOption({
  className,
  ...props
}: React.ComponentProps<"option">) {
  return (
    <option
      data-slot="native-select-option"
      className={cn("bg-[Canvas] text-[CanvasText]", className)}
      {...props}
    />
  )
}

function NativeSelectOptGroup({
  className,
  ...props
}: React.ComponentProps<"optgroup">) {
  return (
    <optgroup
      data-slot="native-select-optgroup"
      className={cn("bg-[Canvas] text-[CanvasText]", className)}
      {...props}
    />
  )
}

export { NativeSelect, NativeSelectOptGroup, NativeSelectOption }
