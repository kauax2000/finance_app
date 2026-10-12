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
 * Select com busca.
 *
 * A versão do registry para o estilo `radix-nova` vem sobre Base UI, e trazê-la
 * como está adicionaria uma segunda biblioteca de primitivos por causa de um
 * componente só — o resto do design system é Radix. Este é o mesmo componente
 * montado sobre `Command` (cmdk) + `Popover`, que já existiam no projeto.
 *
 * Não confundir com `FormPickerPopover`: aquele é o seletor de lista longa com
 * painel próprio — busca, lista e **rodapé** com ação (o "criar categoria" da
 * transação). Este é o select com busca preso a um campo, com a semântica de
 * listbox; desde a rodada 207 ele também cria pela busca, mas sem rodapé.
 *
 * ## Rodada 207: o que o filtro de transações escrevia à mão
 *
 * - `ComboboxChips` — as escolhas de `multiple` em fichas removíveis embaixo
 *   do campo, recolhendo em `+N` (a ficha é `Badge`, o × é `Button`: fichas
 *   não cabem **dentro** do gatilho, que é um `<button>`).
 * - `ComboboxActions` — "Selecionar tudo" e "Limpar" no topo da lista, que
 *   leem **o que a busca deixou visível** (`useCommandState`).
 * - `ComboboxItem` com `media` (o `ColorTile` da categoria), `description` e
 *   `variant="none"` — a ausência ("Sem categoria"), esmaecida e, em
 *   `multiple`, **exclusiva**: escolhê-la solta as outras, e o contrário.
 * - `ComboboxCreate` — quando nada casa, a última linha cria o que se digitou.
 * - `ComboboxGroup recent` — o grupo das usadas há pouco, que some ao digitar.
 * - `variant="input"` com `ComboboxTextField` — o campo **é** a busca. A raiz
 *   do cmdk passa a envolver o campo e o painel (o painel é portal, mas o
 *   contexto do React atravessa), e o teclado do campo chega ao cmdk porque o
 *   campo mora dentro da raiz no DOM.
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
   * indexa o filtrado pelo **id** da linha, e não pelo valor — medido: o
   * "Selecionar tudo" escolhia `radix-_r_k_`. Quem precisa de valores filtra
   * este registro com o mesmo `commandFilter`.
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
      /**
       * `select` (o padrão): o gatilho é um campo-botão e a busca mora no
       * painel. `input`: o campo **é** a busca (autocomplete) — ver
       * `ComboboxTextField`. Só com uma escolha.
       */
      variant?: ComboboxVariant
    })
  | (ComboboxMultipleProps & { variant?: "select" })
) & {
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
          // A ausência é exclusiva nos dois sentidos: escolhê-la solta as
          // outras, e escolher outra a solta.
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
          // A raiz do cmdk envolve o campo **e** o painel: o campo é a busca,
          // e o teclado dele precisa chegar ao `onKeyDown` da raiz — o que só
          // acontece se ele morar dentro dela no DOM. O painel é portal, mas o
          // contexto do React atravessa portal, e a lista o encontra.
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
  const { campoRef } = useCombobox("ComboboxField")
  return (
    <PopoverAnchor asChild>
      <div
        ref={campoRef}
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
/**
 * Um `<button role="combobox">` cru **de propósito**. A regra da casa manda usar
 * o `Button` onde a peça é um botão — mas este gatilho é um **campo**: ele veste
 * `field-classes`, a mesma régua do `Input` e do `SelectTrigger`, e é isso que
 * o torna indistinguível de um select até abrir. `Button` daria contorno e
 * preenchimento de ação, que é a superfície de que ele saiu (ver o cabeçalho de
 * `field-classes.ts`). A peça de baixo de um campo é a régua de campo.
 */
function ComboboxTrigger({
  className,
  placeholder = "Selecionar…",
  children,
  size = "md",
  ...props
}: Omit<React.ComponentProps<"button">, "children"> & {
  /** A escada do sistema, os mesmos nomes: sm 28, md 32, lg 36, xl 40 — e o
      piso de 40 no dedo, como toda a família de campo. */
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
  none = false,
  media,
  ...props
}: React.ComponentProps<"span"> & {
  /**
   * O ladrilho ou ícone antes do rótulo — o `ColorTile size="xs"` da
   * categoria. É prop, e não filho, porque o rótulo trunca: dentro do mesmo
   * `<span>` de truncar, o ladrilho (que é flex) empilhava sobre o texto e o
   * empurrava para fora do campo — medido, 44px de altura num gatilho de 32.
   */
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
        // O × some quando não há seleção: sem devolver o foco ao gatilho, ele
        // caía no <body> e o teclado recomeçava do topo da página.
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
  /** O que a raiz do cmdk precisa receber — `shouldFilter={false}` para busca no servidor, por exemplo. */
  commandProps?: React.ComponentProps<typeof Command>
}) {
  const { variant, campoRef } = useCombobox("ComboboxContent")
  if (variant === "input") {
    return (
      <PopoverContent
        data-slot="combobox-content"
        align={align}
        padding="none"
        // O foco fica no campo, que é onde se digita: sem isto o Radix o
        // levaria para o painel na primeira tecla.
        onOpenAutoFocus={(e) => e.preventDefault()}
        // Clicar no próprio campo não é "fora".
        onInteractOutside={(e) => {
          if (campoRef.current?.contains(e.target as Node)) e.preventDefault()
        }}
        // Desdobra do campo, e as linhas sobem em cascata (rodada 248).
        motion="field"
        className={cn(
          "w-(--radix-popover-trigger-width) min-w-48 [--command-reveal:var(--duration-spring)]",
          // As medidas que a raiz do `Command` publicaria: aqui ela fica fora
          // do portal, e variável não atravessa portal no DOM.
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
    // **Uma placa só** (rodada 198, a pedido do dono): o popover pinta a
    // placa flutuante, e a pílula de busca e a lista moram **dentro** dela —
    // a forma do `SearchInput surface="plate"` num popover, que o catálogo
    // demonstra. Da rodada 143 à 197 ele foi a pilha do `CommandDialog`
    // (pílula e placa soltas, o popover sem pintar, uma sombra por peça).
    // O `Command` de dentro não pinta (`plain`): placa em volta de placa é a
    // placa dupla que a régua proíbe.
    <PopoverContent
      data-slot="combobox-content"
      align={align}
      padding="none"
      // Desdobra do campo, e as linhas sobem em cascata (a `command-reveal`
      // da lista, que fica parada sem a duração).
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
          // Com as ações, a faixa de cima soma a linha delas (24 do botão + 4
          // de folga) aos 48 da busca: a lista sobe por trás da faixa
          // (`-mt-(--scroll-fade-band-h)`) e, sem a soma, cobria as ações — o
          // clique em "Selecionar tudo" caía numa linha da lista. Por `:has()`
          // com **dois** atributos, e não por identidade do filho (que a casa
          // proíbe): ele pesa mais que o `:has()` de um da raiz do `Command`,
          // e vence sem depender da ordem de emissão.
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
      arrows
      // 8px dos lados e embaixo, o recuo da pílula: a linha acesa alinha com
      // as bordas dela. Em cima a linha nasce rente à faixa da pílula (sem os
      // 4px de folga da dissolução), que passam para baixo — a altura da lista
      // soma os mesmos 8.
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

/**
 * O prefixo do valor do cmdk dentro de um grupo de recentes. O mesmo item
 * aparece lá e na lista inteira, e duas linhas com o mesmo `value` acendem
 * juntas no cmdk — o recente leva um valor do cmdk próprio, e o valor da
 * escolha continua o do item.
 */
const PREFIXO_RECENTE = "recente:"
const ComboboxGroupContext = React.createContext<string>("")

function ComboboxGroup({
  className,
  recent = false,
  ...props
}: React.ComponentProps<typeof CommandGroup> & {
  /**
   * O grupo das usadas há pouco (rodada 207): fica no topo com o painel
   * ocioso e **some ao digitar** — buscando, a lista inteira já acha, e o
   * mesmo nome duas vezes seria ruído.
   */
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
 * A linha.
 *
 * `keywords` sai do próprio rótulo quando ele é texto, e é isso que faz a busca
 * funcionar com dados de verdade: num combobox real o `value` é a chave de
 * máquina (`"cat_7f3a"`), e casar a consulta contra ela não acha nada. Quem
 * passa um rótulo que não é string (um ícone mais o nome, por exemplo) declara
 * `keywords` na mão — ou `textValue`, que serve às duas coisas.
 *
 * A escolha usa o `value` do item, e não o que o cmdk devolve: no grupo de
 * recentes o valor do cmdk leva prefixo (ver `ComboboxGroup`).
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
  /**
   * `none` é a ausência ("Sem categoria"): esmaecida e, em `multiple`,
   * exclusiva — escolhê-la solta as outras, e escolher outra a solta.
   */
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
    // O recente é a mesma linha da lista inteira: registrá-lo duas vezes não
    // muda nada, e desregistrá-lo ao sumir não pode apagar a outra.
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
      // A linha de 36 com 8px de recuo — a dos outros dropdowns desde a rodada
      // 243d —, e `pr-8` para o tique. Os 36 saem do `py-2` sobre a entrelinha
      // de 20, e não de um `h-*`: a linha não é um degrau da escada de controles.
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
 * O campo que **é** a busca (rodada 207), para `<Combobox variant="input">`:
 * digitar abre a lista embaixo e filtra, as setas andam por ela, Enter
 * escolhe e o campo passa a mostrar o rótulo escolhido. É o `Command.Input`
 * do cmdk vestindo a régua de campo — a mesma do `ComboboxTrigger` — e por
 * isso o cmdk lhe dá `role="combobox"`, `aria-controls` e
 * `aria-activedescendant` de fábrica.
 *
 * Esc fecha pelo `Popover`; seta para baixo abre sem digitar.
 */
function ComboboxTextField({
  className,
  size = "md",
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
        "w-full min-w-0 py-1 text-base outline-none placeholder:text-muted-foreground md:text-sm",
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
 * As escolhas de `multiple` em fichas (rodada 207), embaixo do campo — dentro
 * dele não cabe: o gatilho é um `<button>`, e o × de cada ficha é outro.
 *
 * O rótulo vem de quem chama, pela mesma razão do `ComboboxValue`: os itens só
 * montam com o painel aberto. Acima de `max` as fichas recolhem num `+N`, que
 * é um botão e as mostra todas.
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
 * "Selecionar tudo" e "Limpar", no topo da lista de `multiple` (rodada 207).
 *
 * **"Tudo" é o que a busca deixou visível**, e não a lista inteira: quem
 * digitou "ali" e apertou "Selecionar tudo" quis as categorias de alimentação,
 * não as quarenta. O que o cmdk filtrou chega por `useCommandState`. A
 * ausência e os recentes ficam de fora — a primeira é exclusiva, e os segundos
 * são a mesma linha duas vezes.
 */
function ComboboxActions({ className, ...props }: React.ComponentProps<"div">) {
  const { selectMany, clear, count, exclusivos, itens } = useCombobox("ComboboxActions")
  const busca = useCommandState((estado) => estado.search.trim())
  const algumVisivel = useCommandState((estado) => estado.filtered.count > 0)

  // Calculado no clique, e não no render: o registro se enche nos efeitos das
  // linhas, depois do primeiro render do painel.
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
      // Acima da lista, que sobe por trás da faixa — ver `ComboboxContent`.
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
 * Criar o que se digitou (rodada 207): quando a busca não casa com nenhuma
 * linha, a última vira "Criar ‘Farmácia’". Ela **substitui** o vazio — o
 * `ComboboxEmpty` só aparece com contagem zero, e esta linha conta.
 *
 * Quem cria é quem chama (`onCreate` recebe o texto): ele grava e escolhe o
 * novo valor. Numa escolha só, o painel fecha junto.
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
  // A contagem do cmdk inclui esta própria linha quando ela está montada (as
  // palavras-chave dela são a busca, então ela sempre casa). Sem descontá-la,
  // a linha aparecia, se contava, e sumia — medido, nunca chegava à tela.
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
