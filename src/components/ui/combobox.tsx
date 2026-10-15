"use client"

import {
  CheckIcon,
  ChevronUpDownIcon,
  PlusIcon,
  XMarkIcon,
} from "@heroicons/react/16/solid"
import { Command as CommandPrimitive, useCommandState } from "cmdk"
import * as React from "react"

import { cn } from "@/lib/utils"
import { commandFilter } from "@/lib/command-filter"
import { scrollFadeBandsClassName } from "@/lib/scroll-fade-classes"
import {
  fieldControlClassName,
  fieldControlHeightClassName,
  fieldControlPaddingClassName,
  fieldTriggerClassName,
  type FieldControlSize,
} from "@/lib/field-classes"
import { useIsMobile } from "@/hooks/use-mobile"
import { Badge } from "@/components/ui/badge"
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
 * Select com busca, montado sobre `Command` (cmdk) + `Popover` (a versão do
 * registry vem sobre Base UI, uma segunda biblioteca de primitivos). Não é o
 * `FormPickerPopover` (lista longa com painel próprio e rodapé de ação): este
 * é o select com busca preso a um campo, com semântica de listbox, que também
 * cria pela busca, sem rodapé.
 *
 * `ComboboxChips` mostra as escolhas de `multiple` em fichas removíveis embaixo
 * do campo (não cabem no gatilho, que é um `<button>`); `ComboboxActions` é
 * "Selecionar tudo"/"Limpar" sobre o que a busca deixou visível;
 * `ComboboxItem variant="none"` é a ausência, esmaecida e, em `multiple`,
 * exclusiva; `ComboboxCreate` cria o que se digitou; `ComboboxGroup recent`
 * some ao digitar; `variant="input"` com `ComboboxTextField` faz o campo ser a
 * busca.
 *
 * O gatilho é um campo e veste [`lib/field-classes`](../../lib/field-classes.ts),
 * a régua do `Input` e do `SelectTrigger`, para ser indistinguível de um select
 * até abrir; por isso sai da garantia de maiúscula do CTA. O
 * `FormPickerPopoverTrigger` segue em `Button variant="outline"`, divergência
 * anotada. O indicador fica à direita, como em `SelectItem` e nos menus.
 * A busca é [`lib/command-filter`](../../lib/command-filter.ts), a da paleta do
 * catálogo (o padrão do cmdk é difuso e não conhece acento).
 */

type ComboboxVariant = "select" | "input"

type ComboboxToggleOptions = {
  /** O rótulo da linha — o texto que o campo do `variant="input"` passa a mostrar. */
  label?: string
  /** A linha de ausência (`variant="none"`): em `multiple`, exclui as outras. */
  exclusive?: boolean
}

type ComboboxContextValue = {
  /** O `id` da listbox, para o `aria-controls` do gatilho. */
  listId: string
  multiple: boolean
  variant: ComboboxVariant
  selected: string[]
  isSelected: (value: string) => boolean
  toggle: (value: string, options?: ComboboxToggleOptions) => void
  /** Acrescenta vários de uma vez — o "Selecionar tudo". */
  selectMany: (values: string[]) => void
  clear: () => void
  count: number
  open: boolean
  setOpen: (open: boolean) => void
  /** As linhas de ausência que já montaram — o "Selecionar tudo" as pula. */
  exclusivos: React.RefObject<Set<string>>
  /** O texto do campo no `variant="input"`. */
  inputText: string
  setInputText: (text: string) => void
  /** A casca do campo, para o painel não se fechar ao clicar nela. */
  campoRef: React.RefObject<HTMLDivElement | null>
  /**
   * As linhas montadas, valor → palavras-chave. O `useCommandState` do cmdk
   * indexa o filtrado pelo id da linha, não pelo valor; quem precisa de valores
   * filtra este registro com o mesmo `commandFilter`.
   */
  itens: React.RefObject<Map<string, string[]>>
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

type ComboboxProps = (
  | (ComboboxSingleProps & {
      /** `select` (padrão): o gatilho é um campo-botão e a busca mora no painel. `input`: o campo é a busca (ver `ComboboxTextField`); só com uma escolha. */
      variant?: ComboboxVariant
    })
  | (ComboboxMultipleProps & { variant?: "select" })
) & {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  /** Trava a rolagem de trás; o padrão é ligar no telefone, como o `FormPickerPopover`, senão rolar a lista arrasta a folha. */
  modal?: boolean
  children: React.ReactNode
}

/**
 * Cuidados da união discriminada: `props` não é desestruturado (o
 * estreitamento quebra com renomeação ou valor padrão); a união nunca desce
 * pelo contexto (o `ComboboxItem` recebe `isSelected` e `toggle`); a emissão
 * passa por ramo estreitado, sem `as`. `<Combobox multiple={umBooleano}>` não
 * estreita: precisa de literal.
 */
function Combobox(props: ComboboxProps) {
  const { open: openProp, defaultOpen = false, onOpenChange, modal, children } = props
  const variant: ComboboxVariant = props.variant ?? "select"
  const isMobile = useIsMobile()
  const listId = `${React.useId()}-listbox`
  const exclusivos = React.useRef(new Set<string>())
  const campoRef = React.useRef<HTMLDivElement | null>(null)
  const itens = React.useRef(new Map<string, string[]>())
  const [inputText, setInputText] = React.useState("")

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

  // `props` inteiro na dependência: o estreitamento da união só sobrevive
  // enquanto o acesso é `props.multiple` dentro do corpo.
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
      variant,
      selected,
      count: selected.length,
      isSelected: (value) => selected.includes(value),
      toggle: (value, options) => {
        if (multiple) {
          if (selected.includes(value)) {
            commit(selected.filter((v) => v !== value))
            return
          }
          // A ausência é exclusiva nos dois sentidos.
          commit(
            options?.exclusive
              ? [value]
              : [...selected.filter((v) => !exclusivos.current.has(v)), value]
          )
          return
        }
        commit([value])
        if (variant === "input" && options?.label !== undefined) {
          setInputText(options.label)
        }
        setOpen(false)
      },
      selectMany: (values) => {
        const novos = values.filter(
          (v) => !selected.includes(v) && !exclusivos.current.has(v)
        )
        commit([
          ...selected.filter((v) => !exclusivos.current.has(v)),
          ...novos,
        ])
      },
      clear: () => {
        commit([])
        if (variant === "input") setInputText("")
      },
      open: currentOpen,
      setOpen,
      exclusivos,
      inputText,
      setInputText,
      campoRef,
      itens,
    }
  }, [listId, props, variant, isValueControlled, selected, currentOpen, setOpen, inputText])

  return (
    <ComboboxContext.Provider value={context}>
      <Popover
        open={currentOpen}
        onOpenChange={setOpen}
        modal={variant === "input" ? false : (modal ?? isMobile)}
      >
        {variant === "input" ? (
          // A raiz do cmdk envolve o campo e o painel: o teclado do campo só
          // chega ao `onKeyDown` dela se ele morar dentro no DOM (o contexto do
          // React atravessa o portal do painel).
          <Command filter={commandFilter} className="contents">
            {children}
          </Command>
        ) : (
          children
        )}
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
 * A casca do campo. `<button>` não aninha em `<button>`, então o × de limpar é
 * irmão do gatilho, posicionado por cima. O `PopoverAnchor` é obrigatório:
 * `--radix-popover-trigger-width` mede a âncora, e sem ele o painel sairia com
 * a largura do gatilho em vez da do campo.
 */
function ComboboxField({ className, ...props }: React.ComponentProps<"div">) {
  const { campoRef } = useCombobox("ComboboxField")
  return (
    <PopoverAnchor asChild>
      <div
        ref={campoRef}
        data-slot="combobox-field"
        className={cn(
          "relative w-full",
          // Quem recua para o × é o rótulo, não o gatilho (recuar o gatilho
          // empurra o chevron sobre o ×). O recuo vem por variável, não por
          // variante: `in-[…]:pe-7` e `group-has-…:pe-7` compilam para (0,1,0)
          // por causa do `:where()` e só venceriam por ordem de emissão.
          "has-[[data-slot=combobox-clear]]:[--combobox-value-pe:--spacing(7)]",
          className
        )}
        {...props}
      />
    </PopoverAnchor>
  )
}

/**
 * O gatilho, que é o campo. `aria-haspopup="listbox"` de propósito: o
 * `PopoverTrigger` do Radix anuncia `dialog`, e o que abre é a lista do cmdk.
 * Vem antes de `{...props}` para o consumidor poder trocar. `aria-controls`
 * aponta para o `ComboboxList` (o `role="listbox"`).
 */
/**
 * Um `<button role="combobox">` cru de propósito: este gatilho é um campo (veste
 * `field-classes`), e o `Button` daria contorno e preenchimento de ação.
 */
function ComboboxTrigger({
  className,
  placeholder = "Selecionar…",
  children,
  size = "lg",
  ...props
}: Omit<React.ComponentProps<"button">, "children"> & {
  /** A escada do sistema (sm 28, md 32, lg 36, xl 40), com o piso de 40 no dedo. */
  size?: FieldControlSize
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
          fieldTriggerClassName,
          "flex w-full items-center justify-between gap-1.5 py-1 text-left whitespace-nowrap select-none",
          fieldControlHeightClassName[size],
          fieldControlPaddingClassName[size],
          "pr-2.5",
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
 * O rótulo do que está escolhido. Vem de quem chama, e não de auto-registro dos
 * itens, porque o conteúdo do popover só monta ao abrir. A peça resolve o
 * placeholder, a truncagem e o resumo `+N`.
 */
function ComboboxValue({
  className,
  placeholder = "Selecionar…",
  children,
  overflowCount = 0,
  none = false,
  media,
  ...props
}: React.ComponentProps<"span"> & {
  /** O ladrilho ou ícone antes do rótulo; é prop porque dentro do `<span>` que trunca ele empilharia sobre o texto. */
  media?: React.ReactNode
  placeholder?: string
  /** Quantas escolhas ficaram de fora do rótulo. Só em `multiple`. */
  overflowCount?: number
  /** A escolha é a ausência ("Sem categoria"): esmaecida, como no `Select`. */
  none?: boolean
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
      {!vazio && media ? (
        <span data-slot="combobox-value-media" className="flex shrink-0 items-center">
          {media}
        </span>
      ) : null}
      <span className={cn("min-w-0 truncate", none && "text-muted-foreground")}>
        {vazio ? placeholder : children}
      </span>
      {!vazio && overflowCount > 0 ? (
        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
          +{overflowCount}
        </span>
      ) : null}
    </span>
  )
}

/**
 * O × que limpa a escolha. Irmão do gatilho (ver `ComboboxField`), com a receita
 * do × do `CommandInput`; some quando não há o que limpar.
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
        // 32px da borda: o chevron ocupa de 10 a 26, e o × fica antes dele, com 6px de respiro.
        "absolute inset-y-0 end-8 my-auto text-muted-foreground",
        className
      )}
      onClick={(event) => {
        // O × some sem seleção: sem devolver o foco ao gatilho, ele cairia no <body>.
        const gatilho = event.currentTarget.parentElement?.querySelector<HTMLElement>(
          '[data-slot="combobox-trigger"]'
        )
        clear()
        gatilho?.focus()
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
  /** O que a raiz do cmdk precisa receber (`shouldFilter={false}` para busca no servidor). */
  commandProps?: React.ComponentProps<typeof Command>
}) {
  const { variant, campoRef } = useCombobox("ComboboxContent")
  if (variant === "input") {
    return (
      <PopoverContent
        data-slot="combobox-content"
        align={align}
        padding="none"
        // O foco fica no campo, onde se digita; senão o Radix o levaria ao painel na primeira tecla.
        onOpenAutoFocus={(e) => e.preventDefault()}
        // Clicar no próprio campo não é "fora".
        onInteractOutside={(e) => {
          if (campoRef.current?.contains(e.target as Node)) e.preventDefault()
        }}
        // Desdobra do campo, e as linhas sobem em cascata.
        motion="field"
        className={cn(
          "w-(--radix-popover-trigger-width) min-w-48 [--command-reveal:var(--duration-spring)]",
          // As medidas que a raiz do `Command` publicaria: ela fica fora do
          // portal, e variável não atravessa portal no DOM.
          scrollFadeBandsClassName,
          "[--command-list-max-h:--spacing(72)]",
          className
        )}
        {...props}
      >
        {children}
      </PopoverContent>
    )
  }
  return (
    // Uma placa só: o popover pinta a placa flutuante, e a pílula de busca e a
    // lista moram dentro (a forma do `SearchInput surface="plate"`). O
    // `Command` de dentro não pinta (`plain`): placa dupla é proibida.
    <PopoverContent
      data-slot="combobox-content"
      align={align}
      padding="none"
      // Desdobra do campo; as linhas sobem em cascata (a `command-reveal` da lista).
      motion="field"
      className={cn(
        "w-(--radix-popover-trigger-width) min-w-48 [--command-reveal:var(--duration-spring)]",
        className
      )}
      {...props}
    >
      <Command
        filter={commandFilter}
        {...commandProps}
        className={cn(
          // Com as ações, a faixa de cima soma a linha delas (24 + 4) aos 48 da
          // busca; sem a soma, a lista que sobe por trás da faixa as cobriria.
          // Por `:has()` com dois atributos (não por identidade do filho), que
          // pesa mais que o `:has()` da raiz do `Command`.
          "has-[[data-slot=command-input-wrapper]~[data-slot=combobox-actions]]:[--scroll-fade-band-h:calc(--spacing(8)+--spacing(4)+--spacing(7))]",
          commandProps?.className
        )}
      >
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
      // A pílula de vidro dentro da placa, como no popover da demonstração.
      surface="plate"
      placeholder={placeholder}
      className={className}
      {...props}
    />
  )
}

/**
 * A listbox, com o `id` que o `aria-controls` do gatilho aponta (o cmdk já dá
 * `role="listbox"` e `aria-activedescendant`). O idref fica pendurado com o
 * popover fechado, porque o portal só monta ao abrir; um idref inexistente é
 * ignorado, e não declará-lo deixaria o papel de combobox incompleto.
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
      arrows
      // 8px dos lados e embaixo, o recuo da pílula; em cima a linha nasce rente
      // à faixa da pílula, e os 4px de folga da dissolução passam para baixo.
      className={cn("px-2 pt-(--scroll-fade-band-h) pb-2", className)}
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

/** A lista carregando. Armadilha do cmdk: `Command.Empty` renderiza com contagem zero, então o vazio pisca sob o carregamento a menos que quem chama esconda um dos dois. */
function ComboboxLoading({
  ...props
}: React.ComponentProps<typeof CommandLoading>) {
  return <CommandLoading data-slot="combobox-loading" {...props} />
}

/** O prefixo do valor do cmdk no grupo de recentes: duas linhas com o mesmo `value` acendem juntas, então o recente leva um valor próprio. */
const PREFIXO_RECENTE = "recente:"
const ComboboxGroupContext = React.createContext<string>("")

function ComboboxGroup({
  className,
  recent = false,
  ...props
}: React.ComponentProps<typeof CommandGroup> & {
  /** O grupo das usadas há pouco: fica no topo com o painel ocioso e some ao digitar (a lista inteira já acha). */
  recent?: boolean
}) {
  const buscando = useCommandState((estado) => estado.search.trim() !== "")
  if (recent && buscando) return null
  return (
    <ComboboxGroupContext.Provider value={recent ? PREFIXO_RECENTE : ""}>
      <CommandGroup
        data-slot="combobox-group"
        data-recent={recent || undefined}
        // O cabeçalho no recuo da linha (`px-2`).
        className={cn("**:[[cmdk-group-heading]]:px-2", className)}
        {...props}
      />
    </ComboboxGroupContext.Provider>
  )
}

function ComboboxSeparator({
  ...props
}: React.ComponentProps<typeof CommandSeparator>) {
  return <CommandSeparator data-slot="combobox-separator" {...props} />
}

/**
 * A linha. `keywords` sai do rótulo quando ele é texto, porque num combobox real
 * o `value` é uma chave de máquina; um rótulo que não é string declara
 * `keywords` (ou `textValue`). A escolha usa o `value` do item, não o que o
 * cmdk devolve (no grupo de recentes ele leva prefixo).
 */
function ComboboxItem({
  className,
  value,
  children,
  keywords,
  onSelect,
  media,
  description,
  variant = "default",
  textValue,
  ...props
}: Omit<React.ComponentProps<typeof CommandItem>, "value"> & {
  value: string
  /** O ladrilho ou ícone à esquerda — o `ColorTile size="xs"` da categoria. */
  media?: React.ReactNode
  /** A linha de explicação embaixo do rótulo — par de identidade, sem `gap`. */
  description?: React.ReactNode
  /** `none` é a ausência ("Sem categoria"): esmaecida e, em `multiple`, exclusiva nos dois sentidos. */
  variant?: "default" | "none"
  /** O texto da linha quando `children` não é texto: busca e campo do `input`. */
  textValue?: string
}) {
  const { isSelected, toggle, exclusivos, itens } = useCombobox("ComboboxItem")
  const prefixo = React.useContext(ComboboxGroupContext)
  const selecionado = isSelected(value)
  const ausencia = variant === "none"
  const texto = textValue ?? (typeof children === "string" ? children : undefined)

  const palavras = keywords ?? (texto ? [texto] : undefined)
  const chavePalavras = palavras?.join("\u0000") ?? ""
  React.useEffect(() => {
    // O recente é a mesma linha da lista inteira: registrá-lo duas vezes não muda nada.
    if (prefixo) return
    const registro = itens.current
    registro.set(value, chavePalavras ? chavePalavras.split("\u0000") : [])
    return () => {
      registro.delete(value)
    }
  }, [itens, prefixo, value, chavePalavras])

  React.useEffect(() => {
    if (!ausencia) return
    const registro = exclusivos.current
    registro.add(value)
    return () => {
      registro.delete(value)
    }
  }, [ausencia, exclusivos, value])

  return (
    <CommandItem
      data-slot="combobox-item"
      data-variant={variant}
      value={`${prefixo}${value}`}
      keywords={palavras}
      onSelect={(next) => {
        toggle(value, { label: texto, exclusive: ausencia })
        onSelect?.(next)
      }}
      // A linha de 36 com 8px de recuo, e `pr-8` para o tique; os 36 vêm do
      // `py-2` sobre a entrelinha de 20, não de um `h-*`.
      className={cn(
        "gap-2 px-2 py-2 pr-8",
        ausencia && "text-muted-foreground",
        className
      )}
      {...props}
    >
      {media ? (
        <span data-slot="combobox-item-media" className="flex shrink-0 items-center">
          {media}
        </span>
      ) : null}
      {description ? (
        <span className="flex min-w-0 flex-col">
          <span className="truncate">{children}</span>
          <span className="truncate text-xs text-muted-foreground">{description}</span>
        </span>
      ) : (
        children
      )}
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

/**
 * O campo que é a busca (`variant="input"`): digitar abre a lista e filtra,
 * Enter escolhe e o campo mostra o rótulo escolhido. É o `Command.Input` do cmdk
 * com a régua de campo (o cmdk dá `role="combobox"`, `aria-controls` e
 * `aria-activedescendant`). Esc fecha; seta para baixo abre sem digitar.
 */
function ComboboxTextField({
  className,
  size = "lg",
  placeholder = "Buscar…",
  onKeyDown,
  ...props
}: Omit<
  React.ComponentProps<typeof CommandPrimitive.Input>,
  "value" | "onValueChange" | "size"
> & {
  size?: FieldControlSize
}) {
  const { open, setOpen, inputText, setInputText } = useCombobox("ComboboxTextField")
  return (
    <CommandPrimitive.Input
      data-slot="combobox-text-field"
      data-size={size}
      value={inputText}
      onValueChange={(texto) => {
        setInputText(texto)
        if (!open) setOpen(true)
      }}
      onKeyDown={(e) => {
        if (e.key === "ArrowDown" && !open) setOpen(true)
        onKeyDown?.(e)
      }}
      placeholder={placeholder}
      className={cn(
        fieldControlClassName,
        // O mesmo 3/5 do `Input` a partir de `md`: o `<input>` nativo assenta o texto 1px abaixo.
        "w-full min-w-0 py-1 md:pt-0.75 md:pb-1.25 text-base outline-none placeholder:text-muted-foreground md:text-sm",
        fieldControlHeightClassName[size],
        fieldControlPaddingClassName[size],
        // O recuo do × do `ComboboxField`, como no gatilho.
        "pe-[calc(var(--combobox-value-pe,0px)+--spacing(3))]",
        className
      )}
      {...props}
    />
  )
}

/**
 * As escolhas de `multiple` em fichas, embaixo do campo (o gatilho é um
 * `<button>`). O rótulo vem de quem chama, como no `ComboboxValue`. Acima de
 * `max` as fichas recolhem num `+N`.
 */
function ComboboxChips({
  className,
  labelFor,
  mediaFor,
  tone = "neutral",
  max = 6,
  ...props
}: React.ComponentProps<"div"> & {
  /** O rótulo de cada valor. Texto: é também o nome do × ("Remover Mercado"). */
  labelFor: (value: string) => string
  /** O que vai antes do rótulo — a bolinha ou o ladrilho da cor. */
  mediaFor?: (value: string) => React.ReactNode
  /** A tinta das fichas, a do `Badge`. O filtro de transações as pinta `success`. */
  tone?: React.ComponentProps<typeof Badge>["tone"]
  /** Quantas fichas antes de recolher em `+N`. */
  max?: number
}) {
  const { selected, toggle, listId } = useCombobox("ComboboxChips")
  const [todas, setTodas] = React.useState(false)
  if (selected.length === 0) return null
  const visiveis = todas ? selected : selected.slice(0, max)
  const resto = selected.length - visiveis.length

  return (
    <div
      data-slot="combobox-chips"
      className={cn("flex flex-wrap items-center gap-1.5", className)}
      {...props}
    >
      {visiveis.map((valor) => {
        const rotulo = labelFor(valor)
        return (
          <Badge key={valor} variant="soft" tone={tone} size="sm" className="max-w-full gap-1 pe-0.5">
            {mediaFor ? mediaFor(valor) : null}
            <span className="min-w-0 truncate">{rotulo}</span>
            <Button
              type="button"
              variant="tertiary"
              size="icon-xs"
              className="size-5 shrink-0 rounded-full"
              aria-label={`Remover ${rotulo}`}
              onClick={(e) => {
                // A ficha some: o foco vai para a vizinha, ou para o campo.
                const grupo = e.currentTarget.closest("[data-slot=combobox-chips]")
                toggle(valor)
                requestAnimationFrame(() => {
                  const proximo =
                    grupo?.querySelector<HTMLElement>("button") ??
                    document.querySelector<HTMLElement>(`[aria-controls="${listId}"]`)
                  proximo?.focus()
                })
              }}
            >
              <XMarkIcon aria-hidden />
            </Button>
          </Badge>
        )
      })}
      {resto > 0 ? (
        <Button
          type="button"
          variant="tertiary"
          size="xs"
          className="nums"
          aria-label={`Mostrar mais ${resto}`}
          onClick={() => setTodas(true)}
        >
          {/* Um texto só: dois nós ("+" e o número) viravam dois rótulos de
              botão, cada um com a própria maiúscula inicial. */}
          {`+${resto}`}
        </Button>
      ) : null}
    </div>
  )
}

/**
 * "Selecionar tudo" e "Limpar", no topo da lista de `multiple`. "Tudo" é o que a
 * busca deixou visível (`useCommandState`), sem a ausência e os recentes.
 */
function ComboboxActions({ className, ...props }: React.ComponentProps<"div">) {
  const { selectMany, clear, count, exclusivos, itens } = useCombobox("ComboboxActions")
  const busca = useCommandState((estado) => estado.search.trim())
  const algumVisivel = useCommandState((estado) => estado.filtered.count > 0)

  // Calculado no clique: o registro se enche nos efeitos das linhas, depois do primeiro render.
  const selecionarVisiveis = () =>
    selectMany(
      [...itens.current.entries()]
        .filter(([valor, palavras]) => !busca || commandFilter(valor, busca, palavras) > 0)
        .map(([valor]) => valor)
        .filter((valor) => !exclusivos.current.has(valor))
    )

  return (
    <div
      data-slot="combobox-actions"
      // Acima da lista, que sobe por trás da faixa (ver `ComboboxContent`).
      className={cn("relative z-10 flex items-center gap-1 px-2 pb-1", className)}
      {...props}
    >
      <Button
        type="button"
        variant="tertiary"
        size="xs"
        disabled={!algumVisivel}
        onClick={selecionarVisiveis}
      >
        {busca ? "selecionar os visíveis" : "selecionar tudo"}
      </Button>
      <Button type="button" variant="tertiary" size="xs" disabled={count === 0} onClick={clear}>
        limpar
      </Button>
    </div>
  )
}

/** O valor da linha de criar, que nenhum item real usa. */
const VALOR_CRIAR = "\u0000criar"

/**
 * Criar o que se digitou: sem nenhuma linha casando, a última vira "Criar
 * ‘Farmácia’". Substitui o vazio. Quem cria é quem chama (`onCreate` recebe o
 * texto); numa escolha só o painel fecha junto.
 */
function ComboboxCreate({
  onCreate,
  children = (texto: string) => `Criar “${texto}”`,
  className,
}: {
  onCreate: (texto: string) => void
  /** O rótulo da linha, a partir do texto digitado. */
  children?: (texto: string) => React.ReactNode
  className?: string
}) {
  const { multiple, setOpen, setInputText } = useCombobox("ComboboxCreate")
  const busca = useCommandState((estado) => estado.search.trim())
  const contagem = useCommandState((estado) => estado.filtered.count)
  // A contagem do cmdk inclui esta própria linha (as palavras-chave dela são a
  // busca); sem descontá-la ela aparecia, se contava e sumia.
  const [mostrando, setMostrando] = React.useState(false)
  const outras = mostrando ? contagem - 1 : contagem
  const mostrar = busca !== "" && outras <= 0
  React.useEffect(() => {
    setMostrando(mostrar)
  }, [mostrar])
  if (!mostrar) return null

  return (
    <CommandItem
      data-slot="combobox-create"
      value={VALOR_CRIAR}
      keywords={[busca]}
      forceMount
      onSelect={() => {
        onCreate(busca)
        setInputText(multiple ? "" : busca)
        if (!multiple) setOpen(false)
      }}
      className={cn("gap-2 px-2 py-2 text-primary-accent", className)}
    >
      <PlusIcon aria-hidden />
      <span className="min-w-0 truncate">{children(busca)}</span>
    </CommandItem>
  )
}

export {
  Combobox,
  ComboboxActions,
  ComboboxChips,
  ComboboxClear,
  ComboboxContent,
  ComboboxCreate,
  ComboboxEmpty,
  ComboboxField,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxLoading,
  ComboboxSeparator,
  ComboboxTextField,
  ComboboxTrigger,
  ComboboxValue,
}
