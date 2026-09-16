"use client"

import * as React from "react"
import type { VariantProps } from "class-variance-authority"
import { ToggleGroup as ToggleGroupPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"
import { toggleVariants } from "@/components/ui/toggle"

const ToggleGroupContext = React.createContext<
  VariantProps<typeof toggleVariants>
>({
  size: "md",
  variant: "plain",
})

/**
 * **Em `type="single"`, clicar no item ativo não desmarca tudo.**
 *
 * Medido no Radix: ele trata o grupo de um valor como um toggle, então o
 * segundo clique no item selecionado devolve `""` e o grupo fica com **zero**
 * selecionados. Num filtro que já tem "Todas" como neutro isso é um quarto
 * estado que ninguém pediu — e era o que impedia os três filtros do app de
 * saírem de `role="tab"`, porque cada tela precisaria do próprio guarda
 * (`onValueChange={(v) => v && setX(v)}`), em seis grafias.
 *
 * O guarda mora aqui: a mudança para vazio é engolida, e o grupo `single` passa
 * a ser controlado por dentro quando quem chama não controla — senão o Radix
 * desmarca antes de avisar. `type="multiple"` não passa por isto — lá esvaziar é uma
 * resposta legítima.
 */
function ToggleGroup({
  className,
  variant,
  size,
  children,
  onValueChange,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Root> &
  VariantProps<typeof toggleVariants>) {
  const unico = props.type === "single"
  // Num grupo não controlado quem guarda o valor é o Radix, e ali o guarda de
  // callback não alcança: ele já desmarcou por dentro antes de avisar. Por isso
  // o `single` passa a ser sempre controlado — com `defaultValue` como semente
  // quando quem chama não controla.
  const [interno, setInterno] = React.useState<string>(
    typeof props.defaultValue === "string" ? props.defaultValue : ""
  )
  const controlado = props.value !== undefined
  const valor = unico ? (controlado ? props.value : interno) : props.value

  const aoTrocar = React.useCallback(
    (proximo: string | string[]) => {
      if (unico && proximo === "") return
      if (unico && !controlado && typeof proximo === "string") setInterno(proximo)
      ;(onValueChange as ((v: string | string[]) => void) | undefined)?.(proximo)
    },
    [controlado, onValueChange, unico]
  )

  // A união discriminada do Radix (`single` | `multiple`) não sobrevive a um
  // valor calculado no espalhamento: o objeto é montado aqui e convertido uma
  // vez só, que é o mesmo idioma da ponte de tipos em `form.tsx`.
  const raiz = {
    ...props,
    ...(unico ? { value: valor as string, defaultValue: undefined } : {}),
    onValueChange: aoTrocar,
  } as React.ComponentProps<typeof ToggleGroupPrimitive.Root>

  return (
    <ToggleGroupPrimitive.Root
      data-slot="toggle-group"
      className={cn("flex items-center justify-center gap-1", className)}
      {...raiz}
    >
      <ToggleGroupContext.Provider value={{ variant, size }}>
        {children}
      </ToggleGroupContext.Provider>
    </ToggleGroupPrimitive.Root>
  )
}

function ToggleGroupItem({
  className,
  children,
  variant,
  size,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Item> &
  VariantProps<typeof toggleVariants>) {
  const context = React.useContext(ToggleGroupContext)

  return (
    <ToggleGroupPrimitive.Item
      data-slot="toggle-group-item"
      className={cn(
        toggleVariants({
          variant: variant ?? context.variant,
          size: size ?? context.size,
        }),
        className
      )}
      {...props}
    >
      {children}
    </ToggleGroupPrimitive.Item>
  )
}

export { ToggleGroup, ToggleGroupItem }
