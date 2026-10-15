"use client"

import * as React from "react"
import { Select as SelectPrimitive } from "radix-ui"

import { menuItemFadeClassName, menuPanelSurfaceClassName } from "@/lib/menu-classes"
import { cn } from "@/lib/utils"
import { ANCHORED_COLLISION_PADDING } from "@/lib/anchored-surface"
import { scrollFadeViewportClassName } from "@/lib/scroll-fade-classes"
import { useScrollFade } from "@/hooks/use-scroll-fade"
import { ScrollFadeArrows } from "@/lib/scroll-fade-arrows"
import {
  fieldControlHeightClassName,
  fieldControlPaddingClassName,
  fieldTriggerClassName,
  type FieldControlSize,
} from "@/lib/field-classes"
import { CheckIcon, ChevronDownIcon } from "@heroicons/react/16/solid"
import { Separator } from "@/components/ui/separator"
import { Caption } from "@/components/ui/typography"
function Select({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Root>) {
  return <SelectPrimitive.Root data-slot="select" {...props} />
}

function SelectGroup({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Group>) {
  return (
    <SelectPrimitive.Group
      data-slot="select-group"
      className={cn("scroll-my-1", className)}
      {...props}
    />
  )
}

function SelectValue({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Value>) {
  return <SelectPrimitive.Value data-slot="select-value" {...props} />
}

function SelectTrigger({
  className,
  size = "lg",
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger> & {
  size?: FieldControlSize
}) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      className={cn(
        // A superfície de campo mora em `lib/field-classes`, a mesma do `Input` e do `ComboboxTrigger`.
        fieldTriggerClassName,
        "flex w-fit items-center justify-between gap-1.5 py-1 whitespace-nowrap select-none data-placeholder:text-muted-foreground",
        // O recuo de início vem do registro; a ponta fica, porque é do chevron e o
        // `twMerge` deixa o `pr-2.5` vencer o `px-3`.
        fieldControlHeightClassName[size],
        fieldControlPaddingClassName[size],
        "pr-2.5",
        "*:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-1.5",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDownIcon className="pointer-events-none size-4 text-muted-foreground" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
}

function SelectContent({
  className,
  children,
  position = "popper",
  align = "center",
  collisionPadding = ANCHORED_COLLISION_PADDING,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        data-slot="select-content"
        data-align-trigger={position === "item-aligned"}
        className={cn(
          /** Above Sheet overlay/content (`z-(--z-sheet)`); below Toaster (`z-(--z-toast)`). */
          menuPanelSurfaceClassName,
          "relative z-(--z-popover) max-h-[min(var(--radix-select-content-available-height),var(--menu-max-h))] max-w-(--radix-select-content-available-width) min-w-36 origin-(--radix-select-content-transform-origin) overflow-x-hidden overflow-y-auto",
          // Desdobra do campo, o gesto da família dos campos (o do calendário do
          // `DatePicker`); alinhado ao item, não anima.
          "field-bloom",
          position === "popper" &&
            "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
          className,
        )}
        position={position}
        align={align}
        collisionPadding={collisionPadding}
        {...props}
      >
        {/*
           Sem faixas de rolagem do Radix: a lista longa dissolve nas pontas, e a seta
           (`ScrollFadeArrows`) é só indicação, sem altura nem rolagem ao pousar. Quem
           rola é o viewport, que não pinta nada.
        */}
        <SelectPrimitive.Viewport
          ref={useScrollFade({ arrows: true })}
          data-position={position}
          className={cn(
            scrollFadeViewportClassName,
            // O respiro do painel mora aqui, não no `SelectGroup` (agrupar é opcional; a
            // lista sem grupo ficaria colada nas bordas). `w-full` porque em `item-aligned`
            // o viewport encolhia para o conteúdo e deixava vazio à direita.
            "w-full p-2",
            // As opções chegam em cascata atrás do desdobrar.
            "overlay-cascade",
            // Sem a classe de altura sobre a altura do gatilho (não citada por extenso: o
            // Tailwind varre comentários e a emitiria): ela fixaria o viewport na altura do
            // gatilho e espremeria o painel inteiro. `min-w` fica: o painel nunca é mais
            // estreito que o gatilho (`min` vence o `max-w` da casca).
            "data-[position=popper]:w-full data-[position=popper]:min-w-(--radix-select-trigger-width)"
          )}
        >
          {children}
        </SelectPrimitive.Viewport>
        <ScrollFadeArrows />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
}

function SelectLabel({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Label>) {
  return (
    <SelectPrimitive.Label asChild data-slot="select-label" {...props}>
      <Caption className={cn("px-2.5 py-1", className)}>{children}</Caption>
    </SelectPrimitive.Label>
  )
}

/**
 * `variant="destructive"` escreve o atributo que o CSS do item já lia; é a mesma
 * variant do `DropdownMenuItem` e do `ContextMenuItem`.
 * `variant="none"` é a opção de ausência ("Sem categoria", "Qualquer plano"):
 * esmaecida na lista e no gatilho (o `SelectValue` copia o `ItemText`, por isso a
 * tinta mora num `span` dentro dele) e com o próprio separador. O Radix não
 * aceita valor vazio, então o valor é um sentinela da tela.
 * `description` é a linha de explicação, fora do `ItemText`: só na lista.
 */
function SelectItem({
  className,
  variant = "default",
  description,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item> & {
  variant?: "default" | "destructive" | "none"
  /** Uma linha embaixo do nome, só na lista. */
  description?: React.ReactNode
}) {
  const texto = (
    // `data-slot` e não `className`: o `ItemText` do Radix descarta `className` e
    // `style`, e só atributos chegam ao `span`.
    <SelectPrimitive.ItemText data-slot="select-item-text">
      {variant === "none" ? <span className="text-muted-foreground">{children}</span> : children}
    </SelectPrimitive.ItemText>
  )
  const item = (
    <SelectPrimitive.Item
      data-slot="select-item"
      data-variant={variant}
      className={cn(
        "concentric relative flex w-full cursor-default items-center gap-1.5 py-2 pr-8 pl-2.5 text-sm outline-hidden pointer-coarse:min-h-11 select-none focus:bg-foreground/9 focus:text-accent-foreground not-data-[variant=destructive]:not-data-[variant=none]:focus:**:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        // O texto da opção (ícone, ladrilho e nome em linha), achado pelo `data-slot`
        // em qualquer profundidade: com a descrição ele não é filho direto do item.
        "**:data-[slot=select-item-text]:flex **:data-[slot=select-item-text]:min-w-0 **:data-[slot=select-item-text]:items-center **:data-[slot=select-item-text]:gap-2",
        // O acender dos menus — ver `menuItemFadeClassName`.
        menuItemFadeClassName,
        variant === "destructive" &&
          "text-destructive focus:bg-destructive/10 focus:text-destructive [&_svg]:text-destructive",
        className
      )}
      {...props}
    >
      <span className="pointer-events-none absolute right-2 flex size-4 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <CheckIcon className="pointer-events-none" />
        </SelectPrimitive.ItemIndicator>
      </span>
      {description ? (
        // Nome sobre explicação é par de identidade: sem `gap`.
        <span data-slot="select-item-content" className="flex min-w-0 flex-col">
          {texto}
          <Caption asChild>
            <span>{description}</span>
          </Caption>
        </span>
      ) : (
        texto
      )}
    </SelectPrimitive.Item>
  )

  if (variant !== "none") return item
  return (
    <>
      {item}
      <SelectSeparator />
    </>
  )
}

function SelectSeparator({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Separator>) {
  return (
    // O fio é o `Separator` do sistema, sangrando o `p-2` da lista.
    <SelectPrimitive.Separator asChild {...props}>
      <Separator
        data-slot="select-separator"
        className={cn("pointer-events-none -mx-2 my-1 w-auto", className)}
      />
    </SelectPrimitive.Separator>
  )
}

/**
 * O `<select>` do sistema, na mesma régua de campo do `SelectTrigger`: o mesmo
 * controle com outro motor (o do navegador, com a roda do iOS). O `className`
 * veste a casca (o `<div>` do chevron) e o resto das props vai para o `<select>`.
 */
type NativeSelectProps = Omit<React.ComponentProps<"select">, "size"> & {
  size?: FieldControlSize
}

function NativeSelect({
  className,
  size = "lg",
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
        // A superfície, o anel, o inválido, o desabilitado, o hover de gatilho e a
        // escada vêm de `field-classes`, a régua do `Input` e do `SelectTrigger`. O
        // `disabled:pointer-events-none` fica: é o mesmo desvio do `Input`, documentado lá.
        className={cn(
          fieldTriggerClassName,
          // Sem `selection:*`: a regra global de `@layer base` tinge a seleção com o par
          // `--primary-muted` para não trocar a cor do texto que ela cobre.
          "w-full min-w-0 appearance-none py-1 select-none placeholder:text-muted-foreground disabled:pointer-events-none data-[size=sm]:py-0.5",
          fieldControlHeightClassName[size],
          fieldControlPaddingClassName[size],
          // A ponta é do chevron, e vem depois do registro.
          "pr-8"
        )}
        {...props}
      />
      {/* A opacidade do desabilitado é do `<select>` (pela régua); o chevron, irmão, acompanha por conta própria. */}
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

export {
  NativeSelect,
  NativeSelectOptGroup,
  NativeSelectOption,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
}
