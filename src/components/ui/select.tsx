"use client"

import * as React from "react"
import { Select as SelectPrimitive } from "radix-ui"

import { menuItemFadeClassName, menuPanelSurfaceClassName } from "@/lib/menu-classes"
import { cn } from "@/lib/utils"
import { ANCHORED_COLLISION_PADDING } from "@/lib/anchored-surface"
import { scrollFadeViewportClassName } from "@/lib/scroll-fade-classes"
import { useScrollFade } from "@/hooks/use-scroll-fade"
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
import { CheckIcon, ChevronDownIcon } from "@heroicons/react/16/solid"
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
  size?: FieldControlSize
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
        "flex w-fit items-center justify-between gap-1.5 py-1 whitespace-nowrap select-none data-placeholder:text-muted-foreground",
        // A escada era uma linha literal aqui — uma das cinco grafias. O recuo
        // de início vem do registro; a ponta fica, porque ela é do chevron e
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
          "relative z-(--z-popover) max-h-(--radix-select-content-available-height) max-w-(--radix-select-content-available-width) min-w-36 origin-(--radix-select-content-transform-origin) overflow-x-hidden overflow-y-auto duration-(--duration-instant) data-[align-trigger=true]:animate-none data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
          position === "popper" &&
            "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
          className,
        )}
        position={position}
        align={align}
        collisionPadding={collisionPadding}
        {...props}
      >
        {/* As setas de rolagem do Radix saíram na rodada 166: a lista longa
            dissolve nas pontas, como os menus, e a seta seria o segundo sinal
            para a mesma borda. Quem rola é o viewport, que não pinta nada — a
            invariante 2 da dissolução. */}
        <SelectPrimitive.Viewport
          ref={useScrollFade()}
          data-position={position}
          className={cn(
            scrollFadeViewportClassName,
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
        "relative flex w-full cursor-default items-center gap-1.5 rounded-md py-1 pr-8 pl-2 text-sm outline-hidden pointer-coarse:min-h-11 select-none focus:bg-accent focus:text-accent-foreground not-data-[variant=destructive]:focus:**:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2",
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

/**
 * O `<select>` do sistema, na mesma régua de campo do `SelectTrigger`.
 *
 * Mora aqui desde a rodada 165: é o mesmo controle com outro motor (o do
 * navegador, sem JavaScript e com a roda do iOS), e a página dele é a do
 * `Select`. O precedente é a `DragHandle` no `drawer.tsx`.
 *
 * O `className` veste a **casca** (o `<div>` que carrega o chevron), e o resto
 * das props vai para o `<select>`: largura e margem se dão por fora.
 */
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
