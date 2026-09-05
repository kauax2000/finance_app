"use client"

import * as React from "react"
import { Select as SelectPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"
import { ANCHORED_COLLISION_PADDING } from "@/lib/anchored-surface"
import {
  fieldDisabledClassName,
  fieldFocusRingClassName,
  fieldInvalidClassName,
  fieldSurfaceClassName,
  fieldTriggerHoverClassName,
} from "@/lib/field-classes"
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/16/solid"
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
  size = "md",
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger> & {
  size?: "sm" | "md" | "lg" | "xl"
}) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      className={cn(
        // A superfície de campo mora em `lib/field-classes` — a mesma que o
        // `Input` e o `ComboboxTrigger` vestem. Antes esta linha e a do `Input`
        // eram duas cópias que ninguém garantia iguais.
        fieldSurfaceClassName,
        fieldFocusRingClassName,
        fieldInvalidClassName,
        fieldDisabledClassName,
        fieldTriggerHoverClassName,
        "flex w-fit items-center justify-between gap-1.5 py-1 pr-2.5 pl-3 whitespace-nowrap select-none data-placeholder:text-muted-foreground",
        "data-[size=sm]:h-7 data-[size=md]:h-8 data-[size=lg]:h-9 data-[size=xl]:h-10",
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
          "relative z-(--z-popover) max-h-(--radix-select-content-available-height) max-w-(--radix-select-content-available-width) min-w-36 origin-(--radix-select-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-lg bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10 duration-(--duration-instant) data-[align-trigger=true]:animate-none data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
          position === "popper" &&
            "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
          className,
        )}
        position={position}
        align={align}
        collisionPadding={collisionPadding}
        {...props}
      >
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport
          data-position={position}
          className={cn(
            // O respiro do painel mora aqui, não no `SelectGroup`. Agrupar é
            // semântica opcional; a lista sem grupo — que é o caso mais comum —
            // ficava colada nas quatro bordas, encostando no canto arredondado.
            //
            // `w-full` porque em `item-aligned` o painel herda a largura do
            // gatilho mas o viewport encolhia para o conteúdo: com um gatilho
            // de largura fixa sobravam dezenas de pixels vazios à direita, e o
            // separador parava no meio do painel.
            "w-full p-1",
            // **Sem a classe de altura sobre `--radix-select-trigger-height`.**
            // (Escrita assim, sem a sintaxe de utilitário, de propósito: o
            // Tailwind varre **o arquivo inteiro**, comentário incluído, e citar
            // a classe por extenso aqui a faz voltar para a folha de estilo —
            // verificado, ela continuava emitida depois de sair do JSX.)
            //
            // Ela vinha do shadcn e declarava como altura do viewport a altura
            // do **gatilho** — a
            // família do "envelope que declara como altura a medida que ele
            // próprio produz", que o `AccordionContent` já pagou. Ela nunca
            // aparecia porque o padrão era `item-aligned`; com `popper` como
            // padrão, ela passa a valer em toda tela. Medido antes de sair:
            // painel aberto com **36px** de altura — `height: 36px` no viewport
            // e `scrollHeight` 36, contra um gatilho de 36. O painel inteiro
            // espremido na caixa do gatilho.
            //
            // `min-w` fica: o painel nunca é mais estreito que o gatilho. Ele
            // vence o `max-w-…-available-width` da casca quando os dois se
            // cruzam (`min` sempre ganha em CSS), e isso só acontece com um
            // gatilho mais largo que a janela menos a folga — caso em que a
            // tela já tem problema maior.
            "data-[position=popper]:w-full data-[position=popper]:min-w-(--radix-select-trigger-width)"
          )}
        >
          {children}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
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
      <Caption className={cn("px-2 py-1", className)}>{children}</Caption>
    </SelectPrimitive.Label>
  )
}

/**
 * `variant="destructive"` fecha um seletor que já existia sem dono: o CSS deste
 * item sempre trouxe `not-data-[variant=destructive]:…`, mas a prop que escreve
 * esse atributo nunca veio junto, então a exceção não tinha como acontecer.
 * É a mesma variant do `DropdownMenuItem` e do `ContextMenuItem`, para os três
 * lugares onde se escolhe uma opção se comportarem igual.
 */
function SelectItem({
  className,
  variant = "default",
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item> & {
  variant?: "default" | "destructive"
}) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      data-variant={variant}
      className={cn(
        "relative flex w-full cursor-default items-center gap-1.5 rounded-md py-1 pr-8 pl-2 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground not-data-[variant=destructive]:focus:**:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2",
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
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
}

function SelectSeparator({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Separator>) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn("pointer-events-none -mx-1 my-1 h-px bg-border", className)}
      {...props}
    />
  )
}

function SelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpButton>) {
  return (
    <SelectPrimitive.ScrollUpButton
      data-slot="select-scroll-up-button"
      className={cn(
        "z-10 flex cursor-default items-center justify-center bg-popover py-1 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      <ChevronUpIcon
      />
    </SelectPrimitive.ScrollUpButton>
  )
}

function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownButton>) {
  return (
    <SelectPrimitive.ScrollDownButton
      data-slot="select-scroll-down-button"
      className={cn(
        "z-10 flex cursor-default items-center justify-center bg-popover py-1 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      <ChevronDownIcon
      />
    </SelectPrimitive.ScrollDownButton>
  )
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
}
