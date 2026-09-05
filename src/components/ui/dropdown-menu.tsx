"use client"

import * as React from "react"
import { CheckIcon, ChevronRightIcon } from "@heroicons/react/16/solid"
import { cva, type VariantProps } from "class-variance-authority"
import { DropdownMenu as DropdownMenuPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"
import { ANCHORED_COLLISION_PADDING } from "@/lib/anchored-surface"
import { scrollFadeViewportClassName } from "@/lib/scroll-fade-classes"
import { useScrollFade } from "@/hooks/use-scroll-fade"
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
const DROPDOWN_POPPER =
  "max-h-(--radix-dropdown-menu-content-available-height) max-w-(--radix-dropdown-menu-content-available-width) origin-(--radix-dropdown-menu-content-transform-origin)"

/**
 * O menu de um gatilho.
 *
 * ## O que esta revisão corrigiu
 *
 * Este era o arquivo mais atrasado do diretório — quase o do shadcn intacto —
 * e ao mesmo tempo o mais usado: **21 telas, 54 linhas de menu**. O
 * `ContextMenu`, que desenha a mesma superfície, não tinha nenhum consumidor e
 * já estava moderno. A régua que venceu foi a dele, e agora as duas vivem em
 * [`lib/menu-classes`](../../lib/menu-classes.ts).
 *
 * Quatro defeitos eram funcionais, não cosméticos:
 *
 * 1. **`SubTrigger` não desenhava chevron nenhum** — medido. Nada dizia que
 *    havia submenu; a pessoa descobria por acidente ao passar o cursor.
 * 2. **Sem teto de altura** (`max-height: none`, medido). Um menu longo saía da
 *    tela, sem rolagem e sem fim.
 * 3. **`[&_svg]:size-4` forçava o tamanho** e engolia um `size-5` explícito de
 *    quem chamava.
 * 4. **Os indicadores eram SVG do Radix Icons colados** — outro conjunto de
 *    ícone dentro de um projeto que usa Heroicons, e a regra **G** do auditor
 *    os acusava.
 *
 * A conversão de `forwardRef` para função veio junto: no React 19 `ref` é um
 * prop comum e desce no `{...props}`, então o embrulho não fazia mais nada além
 * de manter dois estilos de arquivo no mesmo diretório — e a indentação deste
 * arquivo era literalmente as duas, 2 espaços no topo e 4 do meio para baixo.
 */

function DropdownMenu({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Root>) {
  return <DropdownMenuPrimitive.Root data-slot="dropdown-menu" {...props} />
}

function DropdownMenuTrigger({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Trigger>) {
  return (
    <DropdownMenuPrimitive.Trigger
      data-slot="dropdown-menu-trigger"
      {...props}
    />
  )
}

function DropdownMenuGroup({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Group>) {
  return (
    <DropdownMenuPrimitive.Group data-slot="dropdown-menu-group" {...props} />
  )
}

function DropdownMenuPortal({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Portal>) {
  return (
    <DropdownMenuPrimitive.Portal data-slot="dropdown-menu-portal" {...props} />
  )
}

function DropdownMenuSub({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Sub>) {
  return <DropdownMenuPrimitive.Sub data-slot="dropdown-menu-sub" {...props} />
}

function DropdownMenuRadioGroup({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.RadioGroup>) {
  return (
    <DropdownMenuPrimitive.RadioGroup
      data-slot="dropdown-menu-radio-group"
      {...props}
    />
  )
}

/**
 * Os dois eixos do painel, e ambos saem de contagem, não de gosto.
 *
 * **`size` é a largura**, como no `Dialog` — e não uma altura de controle. Das
 * 25 chamadas do app, **18 declaram só uma largura**, e sempre uma destas
 * quatro: `w-44` (8×), `w-48` (5×), `w-56` (3×), `w-52` (2×). Quatro valores
 * repetidos dezoito vezes é uma escala que já existe; só não tinha nome.
 * `auto` continua o padrão, então nada muda para quem não pede.
 *
 * **`variant` é a superfície.** `menu` é a lista de comandos. `panel` é o que
 * o `UserMenu` e o `WorkspaceSwitcher` montavam à mão — `rounded-xl p-0` mais
 * uma sombra e um anel próprios — porque ali dentro não há comandos, e sim um
 * cabeçalho de conta, um avatar, blocos. É a mesma distinção que o `Card` faz
 * com `padding="none"`: a casca cede o recuo para o conteúdo sangrar.
 */
const dropdownMenuContentVariants = cva(
  [menuSurfaceClassName, DROPDOWN_POPPER],
  {
    variants: {
      variant: {
        menu: "",
        // O recuo sai do casco e passa para `DropdownMenuSection`, que é quem
        // o devolve onde há comandos. Assim o `-mx-1` do separador continua
        // valendo: ele sangra o recuo da seção e alcança a borda do painel.
        panel: [
          "rounded-xl",
          // O recuo mudou de dono: ele saiu da casca e foi para o viewport, e
          // aqui o painel o cede de novo para o `DropdownMenuSection`.
          "[&>[data-slot=dropdown-menu-viewport]]:p-0",
        ].join(" "),
      },
      size: {
        auto: "",
        sm: "w-44",
        md: "w-48",
        lg: "w-52",
        xl: "w-56",
      },
    },
    defaultVariants: { variant: "menu", size: "auto" },
  }
)

function DropdownMenuContent({
  className,
  children,
  header,
  footer,
  sideOffset = 4,
  collisionPadding = ANCHORED_COLLISION_PADDING,
  variant,
  size,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Content> &
  VariantProps<typeof dropdownMenuContentVariants> & {
    /**
     * A faixa de identidade do painel — avatar, nome, contexto.
     *
     * Ela é **prop e não filho** por um motivo medido: para o conteúdo dissolver
     * por baixo dela, ela precisa ser **irmã** do viewport, e não estar dentro
     * dele. Detectar isso em tempo de execução com `React.Children` não
     * funcionaria — o consumidor real do padrão é o `UserMenu`, e ali a faixa
     * não é um `DropdownMenuHeader`, é um `<AccountMenuUserSummary />`. Um teste
     * por `child.type` nunca a encontraria, ela cairia dentro do viewport, a
     * máscara a dissolveria, e ninguém descobriria até rolar.
     *
     * Slot-como-prop é o idioma daqui: `DialogHeaderRow` tem `endAdornment`, o
     * `MobileSheetFormStickyHeader` também.
     */
    header?: React.ReactNode
    /** A faixa de pé, pelas mesmas razões. */
    footer?: React.ReactNode
  }) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        data-slot="dropdown-menu-content"
        data-variant={variant}
        sideOffset={sideOffset}
        collisionPadding={collisionPadding}
        className={cn(
          dropdownMenuContentVariants({ variant, size }),
          className
        )}
        {...props}
      >
        {header ? (
          // **O fio é do slot, não da faixa.** Ele vive aqui e não em
          // `DropdownMenuHeader` porque o consumidor real do padrão não usa
          // aquela peça: o `UserMenu` passa um `DropdownMenuLabel` embrulhando
          // um `<AccountMenuUserSummary />`. Uma regra escrita na faixa
          // alcançaria o catálogo e deixaria o app de fora — que é exatamente
          // como o `border-t` do `DialogFooter` já enganou este projeto uma
          // vez.
          <div
            data-slot="dropdown-menu-header-slot"
            className="relative z-10 shrink-0 border-b border-border"
          >
            {header}
          </div>
        ) : null}
        <div
          ref={useScrollFade()}
          data-slot="dropdown-menu-viewport"
          className={cn(menuViewportClassName, scrollFadeViewportClassName)}
        >
          {children}
        </div>
        {footer}
      </DropdownMenuPrimitive.Content>
    </DropdownMenuPrimitive.Portal>
  )
}

/**
 * `variant="destructive"` existe porque as telas escreviam
 * `text-destructive focus:text-destructive` na mão. **Ela ainda espera por
 * elas**: hoje são 14 chamadas em 12 arquivos, todas na mesma grafia, e nenhuma
 * usa a variant — que além da tinta traz o `focus:bg-destructive/10` e o par
 * escuro que a grafia manual não tem.
 */
/**
 * A faixa de identidade do painel — avatar, nome, contexto.
 *
 * Ela sangra até a borda, como `CardToolbar` e `DialogHeader`. Existe porque o
 * `variant="panel"` sem ela empurrava a geometria para quem chama: o
 * `UserMenu` e o `WorkspaceSwitcher` escreviam esta `div` à mão, e a
 * demonstração deste catálogo escreveu uma terceira grafia.
 *
 * **Aqui o fio fica, e não é exceção à regra das tiras.** Uma tira de
 * superfície rotula o corpo que vem abaixo — `CardToolbar` diz o que a lista é
 * —, e ali o fio é o segundo sinal para a mesma emenda. Esta faixa não rotula
 * comando nenhum: ela é **um bloco de outra natureza** (identidade) empilhado
 * sobre uma lista de comandos, e a fronteira entre os dois é a mesma que o
 * painel já marca entre grupos de comando com `DropdownMenuSeparator`. Mesmo
 * papel, mesmo peso (`border-border`) — é a categoria que o projeto sempre
 * manteve com fio: o traço que divide **itens**, não superfícies.
 *
 * A dissolução do viewport continua valendo e não disputa com ele: ela diz "há
 * mais conteúdo acima", que é outra informação. Um `DropdownMenuSeparator`
 * dentro de uma lista rolável convive com o fade pela mesma razão. E o painel
 * do `UserMenu` não rola, então sem o fio a identidade não tinha fronteira
 * nenhuma.
 */
function DropdownMenuHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dropdown-menu-header"
      className={cn(
        // **A faixa não desenha fio nem tinta** — quem o desenha é o slot que a
        // recebe, e por isso ela continua chegando pela prop `header`, como
        // irmã do viewport e não como filha.
        "relative z-10 flex shrink-0 items-center gap-2.5 px-3 py-2.5 text-sm",
        className
      )}
      {...props}
    />
  )
}

/**
 * A região de comandos dentro de um painel.
 *
 * Ela devolve o recuo que o `variant="panel"` tirou do casco — e é o que faz a
 * conta do separador fechar. O `-mx-1` do `DropdownMenuSeparator` sangra
 * exatamente este `p-1`, então o fio alcança a borda do painel em vez de parar
 * 4px antes. Sem a seção, o painel tinha dois traços horizontais de larguras
 * diferentes: 224px o do cabeçalho, 216px o do meio.
 */
function DropdownMenuSection({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dropdown-menu-section"
      className={cn("p-1", className)}
      {...props}
    />
  )
}

function DropdownMenuItem({
  className,
  inset,
  variant = "default",
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Item> & {
  inset?: boolean
  variant?: "default" | "destructive"
}) {
  return (
    <DropdownMenuPrimitive.Item
      data-slot="dropdown-menu-item"
      data-inset={inset}
      data-variant={variant}
      className={cn(menuItemClassName, className)}
      {...props}
    />
  )
}

function DropdownMenuSubTrigger({
  className,
  inset,
  children,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.SubTrigger> & {
  inset?: boolean
}) {
  return (
    <DropdownMenuPrimitive.SubTrigger
      data-slot="dropdown-menu-sub-trigger"
      data-inset={inset}
      className={cn(menuSubTriggerClassName, className)}
      {...props}
    >
      {children}
      {/* A seta é a única coisa que diz que há um submenu. Ela não existia. */}
      <ChevronRightIcon aria-hidden className="ml-auto" />
    </DropdownMenuPrimitive.SubTrigger>
  )
}

function DropdownMenuSubContent({
  className,
  children,
  collisionPadding = ANCHORED_COLLISION_PADDING,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.SubContent>) {
  return (
    <DropdownMenuPrimitive.SubContent
      data-slot="dropdown-menu-sub-content"
      collisionPadding={collisionPadding}
      className={cn(menuSubSurfaceClassName, DROPDOWN_POPPER, className)}
      {...props}
    >
      <div
        ref={useScrollFade()}
        data-slot="dropdown-menu-sub-viewport"
        className={cn(menuViewportClassName, scrollFadeViewportClassName)}
      >
        {children}
      </div>
    </DropdownMenuPrimitive.SubContent>
  )
}

function DropdownMenuCheckboxItem({
  className,
  children,
  checked,
  inset,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.CheckboxItem> & {
  inset?: boolean
}) {
  return (
    <DropdownMenuPrimitive.CheckboxItem
      data-slot="dropdown-menu-checkbox-item"
      data-inset={inset}
      className={cn(menuIndicatorItemClassName, className)}
      checked={checked}
      {...props}
    >
      <span className={menuIndicatorSlotClassName}>
        <DropdownMenuPrimitive.ItemIndicator>
          <CheckIcon aria-hidden />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.CheckboxItem>
  )
}

function DropdownMenuRadioItem({
  className,
  children,
  inset,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.RadioItem> & {
  inset?: boolean
}) {
  return (
    <DropdownMenuPrimitive.RadioItem
      data-slot="dropdown-menu-radio-item"
      data-inset={inset}
      className={cn(menuIndicatorItemClassName, className)}
      {...props}
    >
      <span className={menuIndicatorSlotClassName}>
        <DropdownMenuPrimitive.ItemIndicator>
          {/* Um ponto, e não o mesmo tique da caixa: rádio é "escolha uma",
              caixa é "marque quantas quiser", e usar o mesmo desenho nos dois
              apaga a diferença. O `RadioGroup` já decidiu isto — um ponto não
              precisa ser SVG, e o Heroicons não traz círculo puro. */}
          <span className="size-2 rounded-full bg-current" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.RadioItem>
  )
}

function DropdownMenuLabel({
  className,
  inset,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Label> & {
  inset?: boolean
}) {
  return (
    <DropdownMenuPrimitive.Label
      data-slot="dropdown-menu-label"
      data-inset={inset}
      className={cn(menuLabelClassName, className)}
      {...props}
    />
  )
}

function DropdownMenuSeparator({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Separator>) {
  return (
    <DropdownMenuPrimitive.Separator
      data-slot="dropdown-menu-separator"
      className={cn(menuSeparatorClassName, className)}
      {...props}
    />
  )
}

function DropdownMenuShortcut({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="dropdown-menu-shortcut"
      className={cn(menuShortcutClassName, className)}
      {...props}
    />
  )
}

export {
  dropdownMenuContentVariants,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuHeader,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSection,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
}
