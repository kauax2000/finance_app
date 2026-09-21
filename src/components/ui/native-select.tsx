import { ChevronDownIcon } from "@heroicons/react/16/solid"
import * as React from "react"

import { cn } from "@/lib/utils"
import {
  fieldControlHeightClassName,
  fieldControlPaddingClassName,
  fieldDisabledClassName,
  fieldFocusRingClassName,
  fieldInvalidClassName,
  fieldSurfaceClassName,
  fieldTriggerHoverClassName,
  type FieldControlSize,
} from "@/lib/field-classes"

type NativeSelectProps = Omit<React.ComponentProps<"select">, "size"> & {
  size?: FieldControlSize
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
          // `selection:bg-primary selection:text-primary-foreground` saiu: a
          // regra global de `@layer base` tinge a seleção com o par
          // `--primary-muted`, de propósito, para não trocar a cor do texto que
          // ela cobre. Isto a sobrescrevia com o primário cheio, e era o único
          // controle do app a discordar.
          // `pl-2.5` saiu junto: eram 10px contra os 12 do `Input`.
          "w-full min-w-0 appearance-none py-1 select-none placeholder:text-muted-foreground disabled:pointer-events-none data-[size=sm]:py-0.5",
          fieldControlHeightClassName[size],
          fieldControlPaddingClassName[size],
          // A ponta é do chevron, e vem depois do registro.
          "pr-8"
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
