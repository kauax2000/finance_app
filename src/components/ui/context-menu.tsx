"use client"

import * as React from "react"
import { CheckIcon, ChevronRightIcon } from "@heroicons/react/16/solid"
import { cva, type VariantProps } from "class-variance-authority"
import { ContextMenu as ContextMenuPrimitive } from "radix-ui"

import { Kbd } from "@/components/ui/kbd"
import { cn } from "@/lib/utils"
import { ANCHORED_COLLISION_PADDING } from "@/lib/anchored-surface"
import { scrollFadeViewportClassName } from "@/lib/scroll-fade-classes"
import { useScrollFade } from "@/hooks/use-scroll-fade"
import { ScrollFadeArrows } from "@/lib/scroll-fade-arrows"
import {
  MenuTitleContext,
  MenuTitleHeader,
  useMenuTitleId,
} from "@/lib/menu-title"
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
  menuViewportClassName,
} from "@/lib/menu-classes"

/**
 * As duas classes que trazem o nome da primitiva ficam escritas por extenso: o
 * Tailwind varre o código como texto, e uma classe interpolada nunca gera CSS
 * (o `max-height` computava `none` com a variável do Radix valendo).
 */
const CONTEXT_POPPER =
  "max-h-[min(var(--radix-context-menu-content-available-height),var(--menu-max-h))] max-w-(--radix-context-menu-content-available-width) origin-(--radix-context-menu-content-transform-origin)"

/**
 * O menu do botão direito. Mesma superfície do `DropdownMenu` (as medidas moram
 * em [`lib/menu-classes`](../../lib/menu-classes.ts)); difere em como é
 * invocado. `RadioItem` desenha o ponto (rádio é ponto, caixa é tique) e o
 * submenu veste a superfície do próprio `Content`.
 *
 * `header` + `ContextMenuHeader` dizem sobre o que o menu age e o nomeiam
 * (`aria-labelledby`); é prop porque a faixa é irmã do viewport, senão a
 * dissolução a apagaria. `size` é a escada de largura do `DropdownMenuContent`;
 * `shortcut` desenha a tecla com o `Kbd`; `description` é a segunda linha.
 * Shift+F10 e a tecla Menu abrem o menu sob o elemento focado, e o alvo aberto
 * acende (`data-state=open`). `contextMenuTargets` é a regra da seleção.
 */

/** As ações de um menu aberto sobre `id`: a seleção, se ele faz parte dela. */
function contextMenuTargets<T>(id: T, selected: ReadonlySet<T>): T[] {
  return selected.has(id) ? [...selected] : [id]
}

function ContextMenu({
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.Root>) {
  return <ContextMenuPrimitive.Root data-slot="context-menu" {...props} />
}

/**
 * O alvo. Com `asChild` ele é a linha, o `Item` ou o `Card`, sem nó no meio, e
 * acende enquanto o menu está aberto. Shift+F10 e a tecla Menu despacham um
 * `contextmenu` no elemento focado (o Radix só escuta o evento, que o Mac não
 * produz pelo teclado). O toque longo é do Radix (700ms, balão do iOS
 * desligado) e o soltar não entrega clique à linha.
 */
function ContextMenuTrigger({
  className,
  asChild,
  onKeyDown,
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.Trigger>) {
  return (
    <ContextMenuPrimitive.Trigger
      // Com `asChild` o atributo não é escrito: o `Slot` o passaria por cima do
      // `data-slot` do filho, e o `Card` e o `Item` se reconhecem por ele.
      {...(asChild ? {} : { "data-slot": "context-menu-trigger" })}
      asChild={asChild}
      className={cn(
        "select-none data-[state=open]:bg-muted/60",
        className
      )}
      onKeyDown={(e) => {
        onKeyDown?.(e)
        if (e.defaultPrevented) return
        if (e.key !== "ContextMenu" && !(e.shiftKey && e.key === "F10")) return
        e.preventDefault()
        const alvo = e.target as HTMLElement
        const caixa = alvo.getBoundingClientRect()
        alvo.dispatchEvent(
          new MouseEvent("contextmenu", {
            bubbles: true,
            cancelable: true,
            clientX: caixa.left,
            clientY: caixa.bottom,
          })
        )
      }}
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

// Abre do cursor e volta para ele (`@utility context-menu-burst`).
const contextMenuContentVariants = cva([menuSurfaceClassName, CONTEXT_POPPER, "context-menu-burst"], {
  variants: {
    // A escada de largura do `DropdownMenuContent`, com os mesmos nomes.
    size: {
      auto: "",
      sm: "w-44 pointer-coarse:w-52",
      md: "w-48 pointer-coarse:w-56",
      lg: "w-52 pointer-coarse:w-60",
      xl: "w-56 pointer-coarse:w-64",
    },
  },
  defaultVariants: { size: "auto" },
})

/** Sem `side`: o menu de contexto nasce onde o cursor estava. */
function ContextMenuContent({
  className,
  children,
  header,
  size,
  collisionPadding = ANCHORED_COLLISION_PADDING,
  "aria-labelledby": ariaLabelledBy,
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.Content> &
  VariantProps<typeof contextMenuContentVariants> & {
    /** A faixa do alvo (`ContextMenuHeader`), irmã do viewport. */
    header?: React.ReactNode
  }) {
  const [tituloId, setTituloId] = React.useState<string | null>(null)

  return (
    <ContextMenuPrimitive.Portal>
      <ContextMenuPrimitive.Content
        data-slot="context-menu-content"
        collisionPadding={collisionPadding}
        aria-labelledby={ariaLabelledBy ?? tituloId ?? undefined}
        className={cn(contextMenuContentVariants({ size }), className)}
        {...props}
      >
        {header ? (
          <div
            data-slot="context-menu-header-slot"
            className="relative z-10 shrink-0 border-b border-border"
          >
            <MenuTitleContext.Provider value={setTituloId}>
              {header}
            </MenuTitleContext.Provider>
          </div>
        ) : null}
        <div
          ref={useScrollFade({ arrows: true })}
          data-slot="context-menu-viewport"
          className={cn(menuViewportClassName, scrollFadeViewportClassName, "overlay-cascade")}
        >
          {children}
        </div>
        <ScrollFadeArrows />
      </ContextMenuPrimitive.Content>
    </ContextMenuPrimitive.Portal>
  )
}

/**
 * Sobre o que o menu age: o nome do alvo e uma legenda. Título sobre legenda é
 * par de identidade (sem `gap`); o título nomeia o menu.
 */
function ContextMenuHeader(
  props: Omit<React.ComponentProps<"div">, "title"> & {
    title: React.ReactNode
    description?: React.ReactNode
  }
) {
  const id = useMenuTitleId()
  return <MenuTitleHeader slot="context-menu-header" titleId={id} {...props} />
}

/**
 * `shortcut` desenha a tecla com o `Kbd`; é a dica de um atalho que já existe na
 * tela (com o menu aberto a tecla não dispara nada, por isso sem
 * `aria-keyshortcuts`). `description` é a segunda linha, e o lugar de dizer por
 * que um item está desabilitado.
 */
function ContextMenuItem({
  className,
  inset,
  variant = "default",
  shortcut,
  description,
  children,
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.Item> & {
  inset?: boolean
  variant?: "default" | "destructive"
  shortcut?: string
  description?: React.ReactNode
}) {
  return (
    <ContextMenuPrimitive.Item
      data-slot="context-menu-item"
      data-inset={inset}
      data-variant={variant}
      className={cn(
        menuItemClassName,
        // Com descrição a linha vira grade (ícone, rótulo e tecla na primeira
        // fileira): com `flex-wrap` o rótulo, um nó de texto solto, descia para
        // baixo do ícone. Sem `gap` vertical: é o mesmo item em duas linhas.
        description &&
          "grid grid-cols-[minmax(0,1fr)_auto] gap-y-0 has-[>svg]:grid-cols-[auto_minmax(0,1fr)_auto]",
        className
      )}
      {...props}
    >
      {children}
      {shortcut ? (
        <span data-slot="context-menu-shortcut" className="ml-auto pointer-coarse:hidden">
          <Kbd
            keys={shortcut}
            className="group-focus/menu-item:bg-background/70"
          />
        </span>
      ) : null}
      {description ? (
        <span
          data-slot="context-menu-item-description"
          className="col-start-1 col-end-[-1] text-xs text-muted-foreground group-has-[>svg]/menu-item:col-start-2 group-focus/menu-item:text-accent-foreground/80"
        >
          {description}
        </span>
      ) : null}
    </ContextMenuPrimitive.Item>
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
  children,
  collisionPadding = ANCHORED_COLLISION_PADDING,
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.SubContent>) {
  return (
    // No portal: dentro do menu o vidro (`backdrop-filter`) vira o bloco de
    // contenção do `fixed` do popper e o `overflow-hidden` recorta o submenu.
    <ContextMenuPrimitive.Portal>
      <ContextMenuPrimitive.SubContent
        data-slot="context-menu-sub-content"
        collisionPadding={collisionPadding}
        // O submenu brota do item que o abriu.
        className={cn(menuSubSurfaceClassName, CONTEXT_POPPER, "menu-sprout", className)}
        {...props}
      >
        <div
          ref={useScrollFade({ arrows: true })}
          data-slot="context-menu-sub-viewport"
          className={cn(menuViewportClassName, scrollFadeViewportClassName, "overlay-cascade")}
        >
          {children}
        </div>
        <ScrollFadeArrows />
      </ContextMenuPrimitive.SubContent>
    </ContextMenuPrimitive.Portal>
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
          {/* Um ponto, e não o tique da caixa — ver `RadioGroup`. `block`: inline, o ponto media 0×0. */}
          <span className="block size-2 rounded-full bg-current" />
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
  ContextMenuHeader,
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
  contextMenuTargets,
}
