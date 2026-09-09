"use client"

import * as React from "react"
import { CheckIcon, ChevronRightIcon } from "@heroicons/react/16/solid"
import { cva, type VariantProps } from "class-variance-authority"
import { Menubar as MenubarPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"
import { barSurfaceClassName } from "@/lib/bar-classes"
import { ANCHORED_COLLISION_PADDING } from "@/lib/anchored-surface"
import { scrollFadeViewportClassName } from "@/lib/scroll-fade-classes"
import { useScrollFade } from "@/hooks/use-scroll-fade"
import {
  menuIndicatorItemClassName,
  menuIndicatorSlotClassName,
  menuItemClassName,
  menuLabelClassName,
  menuSeparatorClassName,
  menuShortcutClassName,
  menuSubSurfaceClassName,
  menuSubTriggerClassName,
  menuSurfaceClassName,
  menuViewportClassName,
} from "@/lib/menu-classes"

/**
 * As duas classes que trazem o nome da primitiva — escritas por extenso, e não
 * montadas. O Tailwind varre o código como texto: uma classe interpolada em
 * tempo de execução não existe para o scanner, e o CSS dela nunca é gerado.
 */
const MENUBAR_POPPER =
  "max-h-(--radix-menubar-content-available-height) max-w-(--radix-menubar-content-available-width) origin-(--radix-menubar-content-transform-origin)"

/**
 * A barra de menus.
 *
 * ## A superfície é a mesma dos outros dois menus
 *
 * `DropdownMenu`, `ContextMenu` e `Menubar` desenham o mesmo painel e diferem
 * só em como são invocados — clique num gatilho, botão direito, e uma fileira
 * de gatilhos que se percorre com a seta. Por isso o painel, a linha, o rótulo,
 * o fio e o atalho vêm de [`lib/menu-classes`](../../lib/menu-classes.ts). O
 * que sobra aqui é o que só a barra tem: a fileira e os seus gatilhos.
 *
 * ## O que esta revisão corrigiu
 *
 * 1. **O gatilho tinha 24px** — medido. A barra era `h-8` com 3px de recuo e uma
 *    borda, e o que sobrava para o gatilho era o degrau `xs`, que o projeto
 *    reserva para dentro de outro controle. É o mesmo defeito que o `TabsList`
 *    teve; a diferença é que lá ninguém tinha medido este.
 * 2. **Sem teto de altura** (`max-height: none`). Um menu longo saía da tela.
 * 3. **Sem animação de saída** — o painel tinha `data-open:*` e nenhum
 *    `data-closed:*`, então ele sumia seco enquanto o próprio submenu
 *    desvanecia.
 * 4. **Indicador de marca à esquerda** e **rádio com o tique da caixa**, as
 *    duas coisas que os menus irmãos já tinham corrigido.
 *
 * ## O tamanho é do gatilho, e não da barra
 *
 * Ancorar no contêiner foi exatamente o que produziu os 24px: os gatilhos de
 * uma barra de menus são do tamanho do próprio rótulo, e a altura da barra é
 * consequência deles.
 *
 * Isto já foi descrito aqui como "a única divergência deliberada em relação ao
 * `TabsList`, porque as abas dele esticam" — e a premissa era falsa duas vezes.
 * `flex-1` dentro de um `w-fit` distribui sobra **zero**, então as abas nunca
 * esticaram; e o gatilho delas media **27px**, não os 28 que a conta do
 * `TabsList` prometia, porque ela nunca subtraía o `-1px` do
 * `h-[calc(100%-1px)]`. O `Tabs` foi corrigido e hoje ancora no gatilho, como
 * esta barra. Não há mais divergência.
 *
 * Então `size` mede o gatilho — `sm` 28, `md` 32, `lg` 36 —, e a barra cresce em
 * volta. Todos os três estão no piso da escada ou acima.
 */

type MenubarSize = "sm" | "md" | "lg"
type MenubarVariant = "outline" | "plain" | "solid"

/**
 * O tamanho e a superfície descem pelo contexto porque duas peças precisam
 * concordar sobre eles: a barra dá a moldura, o gatilho dá a altura e o realce
 * — e o realce depende de sobre o que ele acende. Mesmo motivo do `InputGroup`.
 */
const MenubarContext = React.createContext<{
  size: MenubarSize
  variant: MenubarVariant
}>({ size: "md", variant: "outline" })

const menubarVariants = cva("flex w-fit items-center gap-0.5 rounded-lg p-0.5", {
  variants: {
    variant: {
      /**
       * A barra que se sustenta sozinha, sobre a página — e a única com o
       * material do iOS.
       *
       * Ela veste a régua de barra (`lib/bar-classes`), a mesma do cabeçalho
       * fixo: `--background` opaco de base, abrindo a 60% só onde o borrão
       * existe. O painel que ela abre já era vidro; a fileira era tinta
       * chapada, e era essa diferença que se via.
       *
       * **O borrão só desenha onde há o que borrar.** Sobre um cartão liso ela
       * sai igual à opaca — o material aparece quando o conteúdo passa por
       * baixo, que é a fileira no topo de uma região que rola.
       */
      outline: `border border-border ${barSurfaceClassName}`,
      /**
       * Dentro de um cabeçalho que já tem a própria moldura — e por isso ela
       * **não** ganha material: o cabeçalho é que tem o vidro, e uma segunda
       * superfície de vidro sobre a primeira empilha borrão sem desenhar nada.
       */
      plain: "border border-transparent bg-transparent",
      /**
       * Bandeja preenchida, da mesma **tinta** que a do `TabsList` — e não da
       * mesma medida. Aqui o recuo é `p-0.5` mais borda; lá é `p-1`, porque é
       * o que mantém um anel de 3px dentro de uma trilha que rola. Uma barra de
       * menus não rola.
       *
       * **E ela também fica opaca**, medido: translúcida a 60% no escuro a
       * bandeja cai de rgb 38 para 27 sobre a página — enfraquece e deixa de
       * ler como bandeja —, e divergiria da `TabsList solid`, com quem ela é
       * idêntica hoje. Bandeja é preenchimento; barra é chrome.
       */
      solid: "border border-transparent bg-muted",
    },
    size: { sm: "", md: "", lg: "" },
  },
  defaultVariants: { variant: "outline", size: "md" },
})

/**
 * O gatilho.
 *
 * Na bandeja `solid` o realce **sobe** em vez de tingir: `--accent` e `--muted`
 * são praticamente a mesma cor no tema claro e **exatamente** a mesma no
 * escuro (`oklch(0.269 0 0)` nos dois), então acender com `accent` sobre uma
 * bandeja `muted` não desenharia nada. É a mesma saída do `TabsTrigger` — o
 * item ativo ganha `bg-background` e um fio, e se destaca por altura em vez de
 * por tinta.
 */
const menubarTriggerVariants = cva(
  [
    "flex shrink-0 items-center gap-1.5 rounded-md px-2 text-sm font-medium whitespace-nowrap outline-hidden select-none",
    "transition-colors",
    "focus-visible:ring-3 focus-visible:ring-ring/70",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ],
  {
    variants: {
      variant: {
        outline:
          "hover:bg-muted active:bg-muted aria-expanded:bg-muted aria-expanded:text-foreground",
        plain:
          "hover:bg-muted active:bg-muted aria-expanded:bg-muted aria-expanded:text-foreground",
        solid:
          "hover:bg-background/60 active:bg-background/60 aria-expanded:border-border/80 aria-expanded:bg-background aria-expanded:text-foreground aria-expanded:shadow-xs border border-transparent",
      },
      /** O piso é 28: `xs` (24) é para dentro de outro controle, não para uma barra. */
      size: { sm: "h-7", md: "h-8", lg: "h-9" },
    },
    defaultVariants: { variant: "outline", size: "md" },
  }
)

function Menubar({
  className,
  variant = "outline",
  size = "md",
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Root> &
  VariantProps<typeof menubarVariants>) {
  const ctx = React.useMemo(
    () => ({ size: size ?? "md", variant: variant ?? "outline" }),
    [size, variant]
  )

  return (
    <MenubarContext.Provider value={ctx}>
      <MenubarPrimitive.Root
        data-slot="menubar"
        data-variant={variant}
        data-size={size}
        className={cn(menubarVariants({ variant, size }), className)}
        {...props}
      />
    </MenubarContext.Provider>
  )
}

function MenubarMenu({
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Menu>) {
  return <MenubarPrimitive.Menu data-slot="menubar-menu" {...props} />
}

function MenubarGroup({
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Group>) {
  return <MenubarPrimitive.Group data-slot="menubar-group" {...props} />
}

function MenubarPortal({
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Portal>) {
  return <MenubarPrimitive.Portal data-slot="menubar-portal" {...props} />
}

function MenubarRadioGroup({
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.RadioGroup>) {
  return (
    <MenubarPrimitive.RadioGroup data-slot="menubar-radio-group" {...props} />
  )
}

function MenubarTrigger({
  className,
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Trigger>) {
  const { size, variant } = React.useContext(MenubarContext)

  return (
    <MenubarPrimitive.Trigger
      data-slot="menubar-trigger"
      className={cn(menubarTriggerVariants({ variant, size }), className)}
      {...props}
    />
  )
}

function MenubarContent({
  className,
  children,
  align = "start",
  alignOffset = -4,
  sideOffset = 8,
  collisionPadding = ANCHORED_COLLISION_PADDING,
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Content>) {
  return (
    <MenubarPortal>
      <MenubarPrimitive.Content
        data-slot="menubar-content"
        align={align}
        alignOffset={alignOffset}
        sideOffset={sideOffset}
        collisionPadding={collisionPadding}
        className={cn(menuSurfaceClassName, MENUBAR_POPPER, className)}
        {...props}
      >
        <div
          ref={useScrollFade()}
          data-slot="menubar-viewport"
          className={cn(menuViewportClassName, scrollFadeViewportClassName)}
        >
          {children}
        </div>
      </MenubarPrimitive.Content>
    </MenubarPortal>
  )
}

function MenubarItem({
  className,
  inset,
  variant = "default",
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Item> & {
  inset?: boolean
  variant?: "default" | "destructive"
}) {
  return (
    <MenubarPrimitive.Item
      data-slot="menubar-item"
      data-inset={inset}
      data-variant={variant}
      className={cn(menuItemClassName, className)}
      {...props}
    />
  )
}

function MenubarCheckboxItem({
  className,
  children,
  checked,
  inset,
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.CheckboxItem> & {
  inset?: boolean
}) {
  return (
    <MenubarPrimitive.CheckboxItem
      data-slot="menubar-checkbox-item"
      data-inset={inset}
      className={cn(menuIndicatorItemClassName, className)}
      checked={checked}
      {...props}
    >
      <span className={menuIndicatorSlotClassName}>
        <MenubarPrimitive.ItemIndicator>
          <CheckIcon aria-hidden />
        </MenubarPrimitive.ItemIndicator>
      </span>
      {children}
    </MenubarPrimitive.CheckboxItem>
  )
}

function MenubarRadioItem({
  className,
  children,
  inset,
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.RadioItem> & {
  inset?: boolean
}) {
  return (
    <MenubarPrimitive.RadioItem
      data-slot="menubar-radio-item"
      data-inset={inset}
      className={cn(menuIndicatorItemClassName, className)}
      {...props}
    >
      <span className={menuIndicatorSlotClassName}>
        <MenubarPrimitive.ItemIndicator>
          {/* Um ponto, e não o tique da caixa — ver `RadioGroup`. */}
          <span className="size-2 rounded-full bg-current" />
        </MenubarPrimitive.ItemIndicator>
      </span>
      {children}
    </MenubarPrimitive.RadioItem>
  )
}

function MenubarLabel({
  className,
  inset,
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Label> & {
  inset?: boolean
}) {
  return (
    <MenubarPrimitive.Label
      data-slot="menubar-label"
      data-inset={inset}
      className={cn(menuLabelClassName, className)}
      {...props}
    />
  )
}

function MenubarSeparator({
  className,
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Separator>) {
  return (
    <MenubarPrimitive.Separator
      data-slot="menubar-separator"
      className={cn(menuSeparatorClassName, className)}
      {...props}
    />
  )
}

function MenubarShortcut({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="menubar-shortcut"
      className={cn(menuShortcutClassName, className)}
      {...props}
    />
  )
}

function MenubarSub({
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Sub>) {
  return <MenubarPrimitive.Sub data-slot="menubar-sub" {...props} />
}

function MenubarSubTrigger({
  className,
  inset,
  children,
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.SubTrigger> & {
  inset?: boolean
}) {
  return (
    <MenubarPrimitive.SubTrigger
      data-slot="menubar-sub-trigger"
      data-inset={inset}
      className={cn(menuSubTriggerClassName, className)}
      {...props}
    >
      {children}
      <ChevronRightIcon aria-hidden className="ml-auto" />
    </MenubarPrimitive.SubTrigger>
  )
}

function MenubarSubContent({
  className,
  children,
  collisionPadding = ANCHORED_COLLISION_PADDING,
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.SubContent>) {
  return (
    <MenubarPrimitive.SubContent
      data-slot="menubar-sub-content"
      collisionPadding={collisionPadding}
      className={cn(menuSubSurfaceClassName, MENUBAR_POPPER, className)}
      {...props}
    >
      <div
        ref={useScrollFade()}
        data-slot="menubar-sub-viewport"
        className={cn(menuViewportClassName, scrollFadeViewportClassName)}
      >
        {children}
      </div>
    </MenubarPrimitive.SubContent>
  )
}

export {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarGroup,
  MenubarItem,
  MenubarLabel,
  MenubarMenu,
  MenubarPortal,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
  menubarTriggerVariants,
  menubarVariants,
}
