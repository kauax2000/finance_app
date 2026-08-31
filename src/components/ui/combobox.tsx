"use client"

import { CheckIcon, ChevronUpDownIcon, XMarkIcon } from "@heroicons/react/16/solid"
import * as React from "react"

import { cn } from "@/lib/utils"
import { commandFilter } from "@/lib/command-filter"
import {
  fieldDisabledClassName,
  fieldFocusRingClassName,
  fieldInvalidClassName,
  fieldSurfaceClassName,
  fieldTriggerHoverClassName,
} from "@/lib/field-classes"
import { useIsMobile } from "@/hooks/use-mobile"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandLoading,
  CommandSeparator,
} from "@/components/ui/command"
import {
  Popover,
  PopoverAnchor,
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
 *
 * ## O gatilho era um botão, e parecia um botão
 *
 * Ele nascia de `Button variant="outline"` — `border-border` + `bg-background`
 * no tema claro —, enquanto `Select` e `Input` são `border-input` +
 * `bg-input-fill/30`. Os dois só convergiam sob `dark:`, então no tema claro um
 * combobox ao lado de um select eram **duas superfícies visivelmente
 * diferentes** fazendo o mesmo trabalho. Um combobox é um select com busca: até
 * abrir, ele tem de ser indistinguível de um.
 *
 * Agora ele veste a régua de [`lib/field-classes`](../../lib/field-classes.ts),
 * a mesma do `Input` e do `SelectTrigger`. Consequências assumidas: ele sai do
 * `Button`, logo sai da garantia de maiúscula inicial do CTA — o que é correto,
 * porque o placeholder de um campo não é rótulo de ação. E o
 * `FormPickerPopoverTrigger` continua em `Button variant="outline"` por decisão
 * registrada: a divergência de três pontas fica anotada, não resolvida à
 * revelia.
 *
 * ## O indicador foi para a direita
 *
 * Ele era um check à esquerda com `opacity-0` reservando espaço. `SelectItem`,
 * `DropdownMenuCheckboxItem` e `ContextMenuCheckboxItem` põem o indicador à
 * **direita**, e o motivo já está escrito em `menu-classes`: à esquerda ele
 * empurra o rótulo para longe do ícone da ação, e as duas colunas de recuo
 * disputam o mesmo lugar. Três superfícies onde se escolhe uma opção, três
 * indicadores no mesmo lugar. O truque do `opacity-0` sai junto — com o
 * indicador absoluto não há o que reservar.
 *
 * ## A busca é a do projeto, não a do cmdk
 *
 * O padrão do cmdk casa por subsequência difusa e não conhece acento. Aqui a
 * lista usa [`lib/command-filter`](../../lib/command-filter.ts), a mesma da
 * paleta do catálogo — ver lá a razão e a tabela de notas.
 */

type ComboboxContextValue = {
  /** O `id` da listbox, para o `aria-controls` do gatilho. */
  listId: string
  multiple: boolean
  isSelected: (value: string) => boolean
  toggle: (value: string) => void
  clear: () => void
  count: number
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

type ComboboxSingleProps = {
  /** Uma escolha só — o padrão. O popover fecha ao escolher. */
  multiple?: false
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
}

type ComboboxMultipleProps = {
  /** Várias escolhas. O popover **não** fecha, e o indicador fica aceso. */
  multiple: true
  value?: string[]
  defaultValue?: string[]
  onValueChange?: (value: string[]) => void
}

type ComboboxProps = (ComboboxSingleProps | ComboboxMultipleProps) & {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  /**
   * Trava a rolagem de trás. O padrão é ligar no telefone, como o
   * `FormPickerPopover`: sem isso, rolar a lista arrasta a folha que a contém e
   * o dedo não distingue as duas.
   */
  modal?: boolean
  children: React.ReactNode
}

/**
 * A união discriminada obriga três cuidados, e os três estão aqui de propósito:
 *
 * 1. **`props` não é desestruturado.** O estreitamento por desestruturação
 *    quebra assim que um campo é renomeado ou ganha valor padrão — que é
 *    exatamente o que o corpo de um componente faz.
 * 2. **A união nunca desce pelo contexto.** O `ComboboxItem` recebe
 *    `isSelected` e `toggle`, e não vê genérico nenhum.
 * 3. **A emissão passa por ramo estreitado**, e não por um `as`.
 *
 * Limitação conhecida: `<Combobox multiple={umBooleano}>` não estreita. É
 * preciso um literal, ou duas chamadas.
 */
function Combobox(props: ComboboxProps) {
  const { open: openProp, defaultOpen = false, onOpenChange, modal, children } = props
  const isMobile = useIsMobile()
  const listId = `${React.useId()}-listbox`

  const [uncontrolledValue, setUncontrolledValue] = React.useState<string[]>(
    () => normalizeValue(props.defaultValue)
  )
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen)

  const isValueControlled = props.value !== undefined
  const isOpenControlled = openProp !== undefined
  const selected = isValueControlled
    ? normalizeValue(props.value)
    : uncontrolledValue
  const currentOpen = isOpenControlled ? openProp : uncontrolledOpen

  const setOpen = React.useCallback(
    (next: boolean) => {
      if (!isOpenControlled) setUncontrolledOpen(next)
      onOpenChange?.(next)
    },
    [isOpenControlled, onOpenChange]
  )

  // `props` inteiro na dependência, e não os campos desestruturados: o
  // estreitamento da união só sobrevive enquanto o acesso é `props.multiple`
  // dentro do corpo — ver o cuidado 1 acima. Um objeto novo a cada render faz
  // este memo render pouco, e tudo bem: o provider só re-renderiza quando o pai
  // já re-renderizou, e aí os consumidores iriam junto de qualquer forma.
  const context = React.useMemo<ComboboxContextValue>(() => {
    const multiple = props.multiple === true

    const commit = (next: string[]) => {
      if (!isValueControlled) setUncontrolledValue(next)
      if (props.multiple) props.onValueChange?.(next)
      else props.onValueChange?.(next[0] ?? "")
    }

    return {
      listId,
      multiple,
      count: selected.length,
      isSelected: (value) => selected.includes(value),
      toggle: (value) => {
        if (multiple) {
          commit(
            selected.includes(value)
              ? selected.filter((v) => v !== value)
              : [...selected, value]
          )
          return
        }
        commit([value])
        setOpen(false)
      },
      clear: () => commit([]),
      open: currentOpen,
      setOpen,
    }
  }, [listId, props, isValueControlled, selected, currentOpen, setOpen])

  return (
    <ComboboxContext.Provider value={context}>
      <Popover
        open={currentOpen}
        onOpenChange={setOpen}
        modal={modal ?? isMobile}
      >
        {children}
      </Popover>
    </ComboboxContext.Provider>
  )
}

function normalizeValue(value: string | string[] | undefined): string[] {
  if (value === undefined) return []
  if (Array.isArray(value)) return value
  return value === "" ? [] : [value]
}

/**
 * A casca do campo.
 *
 * Ela existe por uma razão mecânica: `<button>` não aninha em `<button>`, então
 * o × de limpar **não pode** morar dentro do gatilho. Ele é irmão, posicionado
 * por cima. (Isto não é o arranjo do `InputGroup`, que usa irmãos de flex de
 * verdade — ali o controle é um `<input>`, que divide a linha sem reclamar.)
 *
 * O `PopoverAnchor` é obrigatório e não decorativo: `--radix-popover-trigger-width`
 * mede a **âncora**, e sem ele o painel sairia com a largura do gatilho em vez
 * da largura do campo que se vê.
 */
function ComboboxField({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <PopoverAnchor asChild>
      <div
        data-slot="combobox-field"
        className={cn(
          "relative w-full",
          // Quem recua é o **rótulo**, não o gatilho.
          //
          // Recuar o gatilho foi a primeira tentativa, e ela empilhou o × em
          // cima do chevron: o `padding-inline-end` empurra o chevron para
          // dentro, e ele foi parar exatamente sobre o × — 25px de sobreposição,
          // medidos. O chevron mora na aresta e não se mexe; o que precisa
          // desviar do × é o texto.
          //
          // E o recuo vem por **variável**, não por variante: medido, tanto
          // `in-[…]:pe-7` quanto `group-has-…:pe-7` compilam para (0,1,0) — o
          // mesmo peso da classe base no próprio elemento —, porque o Tailwind
          // envolve o ancestral em `:where()`, que não soma especificidade. Os
          // dois só venceriam pela ordem de emissão, que é do framework e não
          // do autor. Variável herda e não disputa.
          "has-[[data-slot=combobox-clear]]:[--combobox-value-pe:--spacing(7)]",
          className
        )}
        {...props}
      />
    </PopoverAnchor>
  )
}

/**
 * O gatilho — que **é** o campo.
 *
 * `aria-haspopup="listbox"` é declarado de propósito: o `PopoverTrigger` do
 * Radix anuncia `dialog`, e o que abre aqui é a lista do cmdk. O leitor de tela
 * prometia um diálogo — com o contrato de foco preso e Esc que um diálogo tem —
 * e entregava uma listbox. Vem antes de `{...props}` para o consumidor ainda
 * poder trocar.
 *
 * `aria-controls` aponta para o `ComboboxList`, que é quem o cmdk marca como
 * `role="listbox"`. Ele faltava, e sem ele o papel de combobox ficava
 * incompleto — o gatilho dizia "abro uma lista" sem dizer qual.
 */
function ComboboxTrigger({
  className,
  placeholder = "Selecionar…",
  children,
  size = "md",
  ...props
}: Omit<React.ComponentProps<"button">, "children"> & {
  /** A escada do sistema, os mesmos nomes: sm 28, md 32, lg 36, xl 40. */
  size?: "sm" | "md" | "lg" | "xl"
  placeholder?: string
  children?: React.ReactNode
}) {
  const { open, count, listId } = useCombobox("ComboboxTrigger")

  return (
    <PopoverTrigger asChild>
      <button
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-haspopup="listbox"
        data-slot="combobox-trigger"
        data-size={size}
        data-placeholder={count > 0 ? undefined : ""}
        className={cn(
          fieldSurfaceClassName,
          fieldFocusRingClassName,
          fieldInvalidClassName,
          fieldDisabledClassName,
          fieldTriggerHoverClassName,
          "flex w-full items-center justify-between gap-1.5 py-1 pr-2.5 pl-3 text-left whitespace-nowrap select-none",
          "data-[size=sm]:h-7 data-[size=md]:h-8 data-[size=lg]:h-9 data-[size=xl]:h-10",
          "data-placeholder:text-muted-foreground",
          "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
          className
        )}
        {...props}
      >
        {/* O recuo sai do `ComboboxField`, que é quem sabe se há um × para
            desviar; sem casca, zero. */}
        <span className="min-w-0 flex-1 truncate pe-[var(--combobox-value-pe,0px)]">
          {children ?? placeholder}
        </span>
        <ChevronUpDownIcon className="text-muted-foreground" />
      </button>
    </PopoverTrigger>
  )
}

/**
 * O rótulo do que está escolhido.
 *
 * O rótulo continua vindo de quem chama, e não de auto-registro dos itens: o
 * conteúdo do popover só **monta quando ele abre** (`<Presence present={open}>`,
 * sem `forceMount`), então um combobox que nunca foi aberto não teria rótulo
 * nenhum para mostrar. Quem tem os dados antes de abrir é o consumidor.
 *
 * O que esta peça resolve é o resto: o placeholder, a truncagem e o resumo
 * `+N` de várias escolhas, que senão cada tela escreveria de um jeito.
 */
function ComboboxValue({
  className,
  placeholder = "Selecionar…",
  children,
  overflowCount = 0,
  ...props
}: React.ComponentProps<"span"> & {
  placeholder?: string
  /** Quantas escolhas ficaram de fora do rótulo. Só em `multiple`. */
  overflowCount?: number
}) {
  const vazio =
    children === undefined ||
    children === null ||
    children === "" ||
    (Array.isArray(children) && children.length === 0)

  return (
    <span
      data-slot="combobox-value"
      className={cn("flex min-w-0 items-center gap-1.5", className)}
      {...props}
    >
      <span className="min-w-0 truncate">{vazio ? placeholder : children}</span>
      {!vazio && overflowCount > 0 ? (
        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
          +{overflowCount}
        </span>
      ) : null}
    </span>
  )
}

/**
 * O × que limpa a escolha.
 *
 * Irmão do gatilho, e não filho — ver `ComboboxField`. Ele repete a receita do
 * × do `CommandInput` (`tertiary`, `icon-xs`, `XMarkIcon`) para os dois clears
 * do sistema lerem como uma decisão só, e some quando não há o que limpar:
 * um controle que não faz nada não deve ocupar lugar.
 */
function ComboboxClear({
  className,
  onClick,
  ...props
}: React.ComponentProps<typeof Button>) {
  const { clear, count } = useCombobox("ComboboxClear")
  if (count === 0) return null

  return (
    <Button
      type="button"
      variant="tertiary"
      size="icon-xs"
      aria-label="Limpar seleção"
      data-slot="combobox-clear"
      className={cn(
        // 32px da borda: o chevron ocupa de 10 a 26, e o × fica logo antes
        // dele, com 6px de respiro entre os dois.
        "absolute inset-y-0 end-8 my-auto text-muted-foreground",
        className
      )}
      onClick={(event) => {
        clear()
        onClick?.(event)
      }}
      {...props}
    >
      <XMarkIcon aria-hidden />
    </Button>
  )
}

function ComboboxContent({
  className,
  align = "start",
  children,
  commandProps,
  ...props
}: React.ComponentProps<typeof PopoverContent> & {
  /** O que a raiz do cmdk precisa receber — `shouldFilter={false}` para busca no servidor, por exemplo. */
  commandProps?: React.ComponentProps<typeof Command>
}) {
  return (
    <PopoverContent
      data-slot="combobox-content"
      align={align}
      padding="none"
      className={cn(
        "w-(--radix-popover-trigger-width) min-w-48",
        className
      )}
      {...props}
    >
      <Command filter={commandFilter} {...commandProps}>
        {children}
      </Command>
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

/**
 * A listbox. Ela leva o `id` que o `aria-controls` do gatilho aponta — o cmdk
 * já lhe dá `role="listbox"` e `aria-activedescendant`, então o que faltava era
 * só a ponta do outro lado.
 *
 * O idref fica pendurado enquanto o popover está fechado, porque o conteúdo do
 * portal só monta ao abrir. É o comportamento das implementações de referência,
 * e um idref inexistente é ignorado — o contrário (não declarar) deixa o papel
 * de combobox incompleto o tempo todo.
 */
function ComboboxList({
  className,
  ...props
}: React.ComponentProps<typeof CommandList>) {
  const { listId } = useCombobox("ComboboxList")
  return (
    <CommandList
      id={listId}
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

/**
 * A lista carregando.
 *
 * Armadilha do cmdk a conhecer: `Command.Empty` renderiza sempre que a
 * contagem filtrada é zero, então o vazio pisca por baixo do carregamento a
 * menos que quem chama esconda um dos dois.
 */
function ComboboxLoading({
  ...props
}: React.ComponentProps<typeof CommandLoading>) {
  return <CommandLoading data-slot="combobox-loading" {...props} />
}

function ComboboxGroup({ ...props }: React.ComponentProps<typeof CommandGroup>) {
  return <CommandGroup data-slot="combobox-group" {...props} />
}

function ComboboxSeparator({
  ...props
}: React.ComponentProps<typeof CommandSeparator>) {
  return <CommandSeparator data-slot="combobox-separator" {...props} />
}

/**
 * A linha.
 *
 * `keywords` sai do próprio rótulo quando ele é texto, e é isso que faz a busca
 * funcionar com dados de verdade: num combobox real o `value` é a chave de
 * máquina (`"cat_7f3a"`), e casar a consulta contra ela não acha nada. Quem
 * passa um rótulo que não é string (um ícone mais o nome, por exemplo) declara
 * `keywords` na mão.
 */
function ComboboxItem({
  className,
  value,
  children,
  keywords,
  onSelect,
  ...props
}: Omit<React.ComponentProps<typeof CommandItem>, "value"> & {
  value: string
}) {
  const { isSelected, toggle } = useCombobox("ComboboxItem")
  const selecionado = isSelected(value)

  return (
    <CommandItem
      data-slot="combobox-item"
      value={value}
      keywords={
        keywords ?? (typeof children === "string" ? [children] : undefined)
      }
      onSelect={(next) => {
        toggle(next)
        onSelect?.(next)
      }}
      className={cn("pr-8", className)}
      {...props}
    >
      {children}
      {/* O tique **não** escreve `aria-selected`, e é decisão: o cmdk usa esse
          atributo para a linha *realçada* pela seta, não para a escolhida.
          Sobrescrevê-lo apagaria o cursor de teclado do leitor de tela. Quem
          diz "este é o escolhido" é este rótulo. */}
      <span className="pointer-events-none absolute right-2 flex size-4 items-center justify-center">
        {selecionado ? (
          <>
            <CheckIcon aria-hidden />
            <span className="sr-only">Selecionado</span>
          </>
        ) : null}
      </span>
    </CommandItem>
  )
}

export {
  Combobox,
  ComboboxClear,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxField,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxLoading,
  ComboboxSeparator,
  ComboboxTrigger,
  ComboboxValue,
}
