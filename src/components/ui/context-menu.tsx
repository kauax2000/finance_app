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
 * As duas classes que trazem o nome da primitiva — escritas por extenso, e não
 * montadas. O Tailwind varre o código como texto: uma classe interpolada em
 * tempo de execução não existe para o scanner, e o CSS dela nunca é gerado.
 * Medido: com a versão interpolada, o `max-height` computado era `none` mesmo
 * com a variável do Radix valendo 318,75px.
 */
const CONTEXT_POPPER =
  "max-h-[min(var(--radix-context-menu-content-available-height),var(--menu-max-h))] max-w-(--radix-context-menu-content-available-width) origin-(--radix-context-menu-content-transform-origin)"

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
 *
 * ## Rodada 209 — o que o menu ganhou
 *
 * - **`header`** + `ContextMenuHeader`: diz sobre o que o menu age ("Mercado ·
 *   −R$ 42,90"), e o título nomeia o menu (`aria-labelledby`). É prop e não
 *   filho pela razão do `DropdownMenuContent`: a faixa é irmã do viewport,
 *   senão a dissolução a apagaria ao rolar.
 * - **`size`**: a escada de largura do `DropdownMenuContent` (176 a 224).
 * - **`ContextMenuItem shortcut`** desenha a tecla com o `Kbd`, e
 *   **`description`** é a segunda linha miúda, alinhada com o rótulo.
 * - **O gatilho**: Shift+F10 e a tecla Menu abrem o menu sob o elemento
 *   focado (antes só o mouse abria); o toque longo já era do Radix (700ms,
 *   balão do iOS desligado) e não vaza clique para a linha — medido; e o alvo
 *   aberto acende (`data-state=open`), o que torna
 *   `asChild` sobre uma linha, um `Item` ou um `Card` a forma normal.
 * - **`contextMenuTargets`**: a regra das ações da seleção — sobre uma linha
 *   selecionada o menu age em toda a seleção; fora dela, só na linha.
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
 * O alvo. Com `asChild` ele **é** a linha, o `Item` ou o `Card`, sem nó no
 * meio, e acende enquanto o menu dele está aberto.
 *
 * - **Teclado**: Shift+F10 e a tecla Menu despacham um `contextmenu` no
 *   elemento focado — o próprio alvo ou um botão dentro dele —, e o menu nasce
 *   sob ele. O Radix só escuta o evento, que o Mac não produz pelo teclado.
 * - **Toque longo**: é do Radix — abre em 700ms e desliga o balão do iOS
 *   (`WebkitTouchCallout: none` inline). Medido com toque emulado no
 *   Chromium: o soltar do dedo **não** entrega clique à linha, com ou sem
 *   trava, então não há trava. O Safari do iOS não foi medido.
 */
function ContextMenuTrigger({
  className,
  asChild,
  onKeyDown,
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.Trigger>) {
  return (
    <ContextMenuPrimitive.Trigger
      // Com `asChild` o atributo não é escrito: o `Slot` o passaria por cima
      // do `data-slot` do filho (medido, o `Item` saía `context-menu-trigger`),
      // e o `Card` e o `Item` se reconhecem por ele.
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

// Abre do cursor e volta para ele (rodada 248, `@utility context-menu-burst`).
const contextMenuContentVariants = cva([menuSurfaceClassName, CONTEXT_POPPER, "context-menu-burst"], {
  variants: {
    // A escada de largura do `DropdownMenuContent`, com os mesmos nomes.
    size: {
      auto: "",
      sm: "w-44",
      md: "w-48",
      lg: "w-52",
      xl: "w-56",
    },
  },
  defaultVariants: { size: "auto" },
})

/**
 * Sem `side`: o menu de contexto nasce onde o cursor estava. O prop existia no
 * tipo, não fazia nada, e prometia um controle que a primitiva não oferece.
 */
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
    /** A faixa do alvo — `ContextMenuHeader`. Irmã do viewport, com o fio. */
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
 * Sobre o que o menu age: o nome do alvo e uma legenda (a data e o valor, ou
 * "3 lançamentos selecionados"). Título sobre legenda é par de identidade —
 * sem `gap`. O título nomeia o menu.
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
 * `shortcut` desenha a tecla com o `Kbd` (`"mod+e"` sai ⌘E no Mac e Ctrl+E no
 * resto). Ela é a dica de um atalho que **já existe na tela**: com o menu
 * aberto a tecla não dispara nada, por isso não há `aria-keyshortcuts`.
 *
 * `description` é a segunda linha, alinhada com o rótulo quando há ícone — e o
 * lugar de dizer por que um item está desabilitado.
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
        // Com descrição a linha vira grade: ícone, rótulo e tecla na primeira
        // fileira, a descrição sob o rótulo. `flex-wrap` foi a primeira
        // versão, e o rótulo — um nó de texto solto — descia para baixo do
        // ícone quando não cabia ao lado dele. Sem `gap` vertical: rótulo e
        // descrição são o mesmo item em duas linhas.
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
    // No portal: dentro do menu, o vidro (`backdrop-filter`) vira o bloco de
    // contenção do `fixed` do popper e o `overflow-hidden` o recorta — o
    // submenu abria e não aparecia (medido, rodada 213).
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
