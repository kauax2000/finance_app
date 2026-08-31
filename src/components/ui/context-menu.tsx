"use client"

import * as React from "react"
import { CheckIcon, ChevronRightIcon } from "@heroicons/react/16/solid"
import { ContextMenu as ContextMenuPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"
import {
  menuSubSurfaceClassName,
  menuSurfaceClassName,
  menuIndicatorItemClassName,
  menuIndicatorSlotClassName,
  menuItemClassName,
  menuLabelClassName,
  menuSeparatorClassName,
  menuShortcutClassName,
  menuSubTriggerClassName,
} from "@/lib/menu-classes"

/**
 * As duas classes que trazem o nome da primitiva — escritas por extenso, e não
 * montadas. O Tailwind varre o código como texto: uma classe interpolada em
 * tempo de execução não existe para o scanner, e o CSS dela nunca é gerado.
 * Medido: com a versão interpolada, o `max-height` computado era `none` mesmo
 * com a variável do Radix valendo 318,75px.
 */
const CONTEXT_POPPER =
  "max-h-(--radix-context-menu-content-available-height) max-w-(--radix-context-menu-content-available-width) origin-(--radix-context-menu-content-transform-origin)"

/**
 * O menu do botão direito.
 *
 * Ele desenha a mesma superfície do `DropdownMenu` e difere só em como é
 * invocado — por isso as medidas moram em
 * [`lib/menu-classes`](../../lib/menu-classes.ts), e não aqui. Este arquivo era
 * o mais moderno do par e virou a régua; o que sobrou dele para corrigir foram
 * três coisas próprias:
 *
 * 1. **`RadioItem` usava `CheckIcon`** — o mesmo tique do `CheckboxItem`.
 *    "Escolha uma" e "marque quantas quiser" passavam o mesmo desenho, e a
 *    diferença entre os dois sumia.
 * 2. **`Content` declarava um prop `side`** que o Radix não tem: um menu de
 *    contexto abre onde o cursor está, não num lado. O tipo prometia um
 *    controle inexistente.
 * 3. **`SubContent` divergia do próprio `Content`** no mesmo arquivo —
 *    `border` + `shadow-lg` contra `ring-1` + `shadow-md`. Um submenu não
 *    flutua mais alto que o menu que o abriu.
 */

function ContextMenu({
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.Root>) {
  return <ContextMenuPrimitive.Root data-slot="context-menu" {...props} />
}

function ContextMenuTrigger({
  className,
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.Trigger>) {
  return (
    <ContextMenuPrimitive.Trigger
      data-slot="context-menu-trigger"
      className={cn("select-none", className)}
      {...props}
    />
  )
}

function ContextMenuGroup({
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.Group>) {
  return (
    <ContextMenuPrimitive.Group data-slot="context-menu-group" {...props} />
  )
}

function ContextMenuPortal({
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.Portal>) {
  return (
    <ContextMenuPrimitive.Portal data-slot="context-menu-portal" {...props} />
  )
}

function ContextMenuSub({
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.Sub>) {
  return <ContextMenuPrimitive.Sub data-slot="context-menu-sub" {...props} />
}

function ContextMenuRadioGroup({
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.RadioGroup>) {
  return (
    <ContextMenuPrimitive.RadioGroup
      data-slot="context-menu-radio-group"
      {...props}
    />
  )
}

/**
 * Sem `side`: o menu de contexto nasce onde o cursor estava. O prop existia no
 * tipo, não fazia nada, e prometia um controle que a primitiva não oferece.
 */
function ContextMenuContent({
  className,
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.Content>) {
  return (
    <ContextMenuPrimitive.Portal>
      <ContextMenuPrimitive.Content
        data-slot="context-menu-content"
        className={cn(menuSurfaceClassName, CONTEXT_POPPER, className)}
        {...props}
      />
    </ContextMenuPrimitive.Portal>
  )
}

function ContextMenuItem({
  className,
  inset,
  variant = "default",
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.Item> & {
  inset?: boolean
  variant?: "default" | "destructive"
}) {
  return (
    <ContextMenuPrimitive.Item
      data-slot="context-menu-item"
      data-inset={inset}
      data-variant={variant}
      className={cn(menuItemClassName, className)}
      {...props}
    />
  )
}

function ContextMenuSubTrigger({
  className,
  inset,
  children,
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.SubTrigger> & {
  inset?: boolean
}) {
  return (
    <ContextMenuPrimitive.SubTrigger
      data-slot="context-menu-sub-trigger"
      data-inset={inset}
      className={cn(menuSubTriggerClassName, className)}
      {...props}
    >
      {children}
      <ChevronRightIcon aria-hidden className="ml-auto" />
    </ContextMenuPrimitive.SubTrigger>
  )
}

function ContextMenuSubContent({
  className,
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.SubContent>) {
  return (
    <ContextMenuPrimitive.SubContent
      data-slot="context-menu-sub-content"
      className={cn(menuSubSurfaceClassName, CONTEXT_POPPER, className)}
      {...props}
    />
  )
}

function ContextMenuCheckboxItem({
  className,
  children,
  checked,
  inset,
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.CheckboxItem> & {
  inset?: boolean
}) {
  return (
    <ContextMenuPrimitive.CheckboxItem
      data-slot="context-menu-checkbox-item"
      data-inset={inset}
      className={cn(menuIndicatorItemClassName, className)}
      checked={checked}
      {...props}
    >
      <span className={menuIndicatorSlotClassName}>
        <ContextMenuPrimitive.ItemIndicator>
          <CheckIcon aria-hidden />
        </ContextMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </ContextMenuPrimitive.CheckboxItem>
  )
}

function ContextMenuRadioItem({
  className,
  children,
  inset,
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.RadioItem> & {
  inset?: boolean
}) {
  return (
    <ContextMenuPrimitive.RadioItem
      data-slot="context-menu-radio-item"
      data-inset={inset}
      className={cn(menuIndicatorItemClassName, className)}
      {...props}
    >
      <span className={menuIndicatorSlotClassName}>
        <ContextMenuPrimitive.ItemIndicator>
          {/* Um ponto, e não o tique da caixa — ver `RadioGroup`. */}
          <span className="size-2 rounded-full bg-current" />
        </ContextMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </ContextMenuPrimitive.RadioItem>
  )
}

function ContextMenuLabel({
  className,
  inset,
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.Label> & {
  inset?: boolean
}) {
  return (
    <ContextMenuPrimitive.Label
      data-slot="context-menu-label"
      data-inset={inset}
      className={cn(menuLabelClassName, className)}
      {...props}
    />
  )
}

function ContextMenuSeparator({
  className,
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.Separator>) {
  return (
    <ContextMenuPrimitive.Separator
      data-slot="context-menu-separator"
      className={cn(menuSeparatorClassName, className)}
      {...props}
    />
  )
}

function ContextMenuShortcut({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="context-menu-shortcut"
      className={cn(menuShortcutClassName, className)}
      {...props}
    />
  )
}

export {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuPortal,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
}
