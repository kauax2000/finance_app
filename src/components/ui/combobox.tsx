"use client"

import * as React from "react"
import { CheckIcon, ChevronsUpDownIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

/**
 * Select com busca.
 *
 * A versão do registry para o estilo `radix-nova` vem sobre Base UI, e trazê-la
 * como está adicionaria uma segunda biblioteca de primitivos por causa de um
 * componente só — os outros 30 daqui são todos Radix. Este é o mesmo componente
 * montado sobre `Command` (cmdk) + `Popover`, que já existiam no projeto.
 *
 * Não confundir com `FormPickerPopover`: aquele é só o posicionamento de um
 * popover ancorado num campo. Este resolve busca, navegação por teclado e a
 * semântica de listbox.
 */

type ComboboxContextValue = {
  value: string | undefined
  onValueChange: (value: string) => void
  open: boolean
  setOpen: (open: boolean) => void
}

const ComboboxContext = React.createContext<ComboboxContextValue | null>(null)

function useCombobox(component: string) {
  const context = React.useContext(ComboboxContext)
  if (!context) {
    throw new Error(`<${component}> precisa estar dentro de <Combobox>`)
  }
  return context
}

function Combobox({
  value,
  defaultValue,
  onValueChange,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  children,
}: {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}) {
  const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue)
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen)

  const isValueControlled = value !== undefined
  const isOpenControlled = openProp !== undefined
  const currentValue = isValueControlled ? value : uncontrolledValue
  const currentOpen = isOpenControlled ? openProp : uncontrolledOpen

  const setOpen = React.useCallback(
    (next: boolean) => {
      if (!isOpenControlled) setUncontrolledOpen(next)
      onOpenChange?.(next)
    },
    [isOpenControlled, onOpenChange]
  )

  const handleValueChange = React.useCallback(
    (next: string) => {
      if (!isValueControlled) setUncontrolledValue(next)
      onValueChange?.(next)
      setOpen(false)
    },
    [isValueControlled, onValueChange, setOpen]
  )

  const context = React.useMemo(
    () => ({
      value: currentValue,
      onValueChange: handleValueChange,
      open: currentOpen,
      setOpen,
    }),
    [currentValue, handleValueChange, currentOpen, setOpen]
  )

  return (
    <ComboboxContext.Provider value={context}>
      <Popover open={currentOpen} onOpenChange={setOpen}>
        {children}
      </Popover>
    </ComboboxContext.Provider>
  )
}

/**
 * O gatilho. `placeholder` aparece enquanto nada foi escolhido; o rótulo do item
 * selecionado entra como children para o consumidor decidir como formatá-lo.
 */
/**
 * `aria-haspopup="listbox"` é declarado de propósito.
 *
 * `PopoverTrigger` anuncia `aria-haspopup="dialog"`, e o que abre aqui é a
 * lista do cmdk. O leitor de tela prometia um diálogo — com o contrato de foco
 * preso e Esc que um diálogo tem — e entregava uma listbox. Vem antes de
 * `{...props}` para o consumidor ainda poder trocar.
 */
function ComboboxTrigger({
  className,
  placeholder = "Selecionar…",
  children,
  size = "default",
  ...props
}: Omit<React.ComponentProps<typeof Button>, "children"> & {
  placeholder?: string
  children?: React.ReactNode
}) {
  const { value, open } = useCombobox("ComboboxTrigger")

  return (
    <PopoverTrigger asChild>
      <Button
        type="button"
        variant="outline"
        size={size}
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        data-slot="combobox-trigger"
        data-placeholder={value ? undefined : ""}
        className={cn(
          "w-full justify-between font-normal data-placeholder:text-muted-foreground",
          className
        )}
        {...props}
      >
        <span className="truncate">{children ?? placeholder}</span>
        <ChevronsUpDownIcon className="ml-2 size-4 shrink-0 opacity-50" />
      </Button>
    </PopoverTrigger>
  )
}

function ComboboxContent({
  className,
  align = "start",
  children,
  ...props
}: React.ComponentProps<typeof PopoverContent>) {
  return (
    <PopoverContent
      data-slot="combobox-content"
      align={align}
      className={cn(
        "w-[var(--radix-popover-trigger-width)] min-w-[12rem] p-0",
        className
      )}
      {...props}
    >
      <Command>{children}</Command>
    </PopoverContent>
  )
}

function ComboboxInput({
  className,
  placeholder = "Buscar…",
  ...props
}: React.ComponentProps<typeof CommandInput>) {
  return (
    <CommandInput
      data-slot="combobox-input"
      placeholder={placeholder}
      className={className}
      {...props}
    />
  )
}

function ComboboxList({
  className,
  ...props
}: React.ComponentProps<typeof CommandList>) {
  return (
    <CommandList
      data-slot="combobox-list"
      className={className}
      {...props}
    />
  )
}

function ComboboxEmpty({
  children = "Nada encontrado.",
  ...props
}: React.ComponentProps<typeof CommandEmpty>) {
  return (
    <CommandEmpty data-slot="combobox-empty" {...props}>
      {children}
    </CommandEmpty>
  )
}

function ComboboxGroup({
  ...props
}: React.ComponentProps<typeof CommandGroup>) {
  return <CommandGroup data-slot="combobox-group" {...props} />
}

function ComboboxSeparator({
  ...props
}: React.ComponentProps<typeof CommandSeparator>) {
  return <CommandSeparator data-slot="combobox-separator" {...props} />
}

/**
 * O check à esquerda marca o item ativo. Ele ocupa espaço mesmo quando invisível
 * (`opacity-0`) para a lista não deslocar horizontalmente ao trocar a seleção.
 */
function ComboboxItem({
  className,
  value,
  children,
  onSelect,
  ...props
}: Omit<React.ComponentProps<typeof CommandItem>, "value"> & {
  value: string
}) {
  const { value: selected, onValueChange } = useCombobox("ComboboxItem")

  return (
    <CommandItem
      data-slot="combobox-item"
      value={value}
      onSelect={(next) => {
        onValueChange(next)
        onSelect?.(next)
      }}
      className={className}
      {...props}
    >
      <CheckIcon
        className={cn(
          "size-4 shrink-0",
          selected === value ? "opacity-100" : "opacity-0"
        )}
      />
      {children}
    </CommandItem>
  )
}

export {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxSeparator,
  ComboboxTrigger,
}
