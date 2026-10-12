"use client"

import * as React from "react"
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/16/solid"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"
import { composeRefs } from "radix-ui/internal"
import { useBrandGlow } from "@/hooks/use-brand-glow"
import { ariaShortcut, isEditableTarget, matchShortcut } from "@/lib/shortcut"
import {
  searchFieldClearClassName,
  searchFieldCoarseClassName,
  searchFieldFocusClassName,
  searchFieldIconClassName,
  searchFieldInputClassName,
  searchFieldShapeClassName,
  searchFieldShortcutClassName,
  searchFieldSizeClassName,
  searchFieldSurfaceClassName,
  type SearchFieldSize,
  type SearchFieldSurface,
} from "@/lib/search-field-classes"
import { Button } from "@/components/ui/button"
import { Kbd } from "@/components/ui/kbd"
import { Spinner } from "@/components/ui/spinner"

/**
 * O campo de busca do projeto — a pílula do cabeçalho e da paleta.
 *
 * ## Rodada 198: a mesma pílula das referências
 *
 * Ele era um `InputGroup` — caixa `rounded-lg`, fio de campo de formulário,
 * recuo de addon — enquanto as três buscas que a pessoa mais vê (o gatilho do
 * cabeçalho do catálogo, o `CommandDialog` e o `Combobox`) eram uma pílula
 * com a lupa quieta. Agora os três e ele vestem `lib/search-field-classes`:
 * a forma, a escada, as duas superfícies, a lupa, o × e a tecla do atalho são
 * escritos uma vez. Ele deixou de compor o `InputGroup` porque a pílula não é
 * o grupo de campo: o recuo, o raio e o fio seriam todos sobrescritos.
 *
 * ## O × do navegador sai; a semântica fica
 *
 * `type="search"` traz um × desenhado pelo WebKit — azul do sistema, fora do
 * tema e da escada. O desenho é suprimido e o botão é nosso. A semântica
 * **fica**: é ela que dá a tecla "Buscar" no teclado do iOS e o
 * `role="searchbox"` que o leitor de tela anuncia.
 *
 * **O × só aparece quando há texto, e só com `onClear`** — um × que não limpa
 * nada é pior que nenhum. Ao limpar, o foco volta ao campo: o botão some com o
 * texto, e sem isso o foco caía no `<body>`.
 *
 * ## `className` dimensiona o campo, e não o texto
 *
 * Ele vai para a pílula, porque é ela que desenha a borda e a largura. Medido
 * numa versão antiga, em que ia para o `<input>`: um `max-w-xs` encolhia só a
 * área de digitação e deixava a moldura com a largura toda, com o × **354px**
 * à direita do texto. Para o `<input>` existe `inputClassName`.
 *
 * ## As versões
 *
 * - `surface="plate"`: a pílula de vidro da pilha do `Command`, para busca
 *   dentro de painel flutuante (o `FormPickerPopoverSearch`).
 * - `shortcut`: a tecla à direita, sem pastilha, como o ⌘K do cabeçalho — e
 *   o atalho **foca** o campo. Sem modificadora (`"/"`), ele não dispara com
 *   o foco num campo de texto: ali a tecla é texto.
 * - `variant="brand"`: o brilho de marca na borda ao aproximar o ponteiro, o
 *   do gatilho do cabeçalho. Só na superfície `field` — a `plate` já é vidro,
 *   e o brilho é a borda de uma peça na página. Uma por tela.
 * - `pending`: a lupa vira `Spinner` e a pílula ganha `aria-busy`, sem
 *   mudar de tamanho.
 *
 * ## O campo pode ser de outro (rodada 198)
 *
 * O `CommandInput` — a busca do `CommandDialog` e do `Combobox` — monta
 * **este** componente, com o `Command.Input` do cmdk como filho: o cmdk
 * precisa do campo dele para filtrar a lista, e o `Slot` funde nele as classes,
 * o `type` e o `ref` daqui. É o que faz o `Combobox` ser o `SearchInput
 * surface="plate"`, e não uma cópia da receita. Para ele existem também
 * `leading` (o escopo da paleta, entre a lupa e o texto), `focusRing` (a
 * paleta nasce focada e não acende anel), `touchFloor` (a pilha tem medidas
 * próprias) e `rootProps` (o `data-waiting` do feixe).
 */

type SearchInputProps = Omit<React.ComponentProps<"input">, "size"> & {
  /** A escada dos campos: 28 · 32 · 36 · 40. */
  size?: SearchFieldSize
  /** Mostra o × quando há texto. Sem ele, não há botão. */
  onClear?: (event: React.MouseEvent<HTMLButtonElement>) => void
  /** O nome acessível do ×. */
  clearLabel?: string
  /** Para o `<input>` de dentro. `className` dimensiona a pílula. */
  inputClassName?: string
  /** A tecla que foca o campo, na grafia do `Kbd` (`"/"`, `"mod+k"`). */
  shortcut?: string
  /** A lupa vira `Spinner`, e a pílula, `aria-busy`. */
  pending?: boolean
  /** O campo de outro — o `Command.Input` do cmdk. Recebe as props daqui. */
  children?: React.ReactElement
  /** Entre a lupa e o texto: o `CommandScope` da paleta. */
  leading?: React.ReactNode
  /** O anel de foco. A paleta, que nasce focada, o desliga. */
  focusRing?: boolean
  /** O piso de 40 no dedo. A pilha do `Command`, que tem medidas próprias, o desliga. */
  touchFloor?: boolean
  /** Atributos da pílula, e não do campo. */
  rootProps?: Omit<React.ComponentProps<"div">, "className" | "children" | "ref">
} & (
    | { surface?: "field"; variant?: "default" | "brand" }
    | { surface: Extract<SearchFieldSurface, "plate">; variant?: "default" }
  )

function SearchInput({
  className,
  inputClassName,
  size = "md",
  surface = "field",
  variant = "default",
  type = "search",
  placeholder = "Buscar…",
  autoComplete = "off",
  onClear,
  clearLabel = "Limpar busca",
  shortcut,
  pending = false,
  children,
  leading,
  focusRing = true,
  touchFloor = true,
  rootProps,
  ref,
  ...props
}: SearchInputProps) {
  const Campo = children ? Slot.Root : "input"
  const campo = React.useRef<HTMLInputElement>(null)
  const marca = variant === "brand" && surface === "field"
  const glowRef = useBrandGlow<HTMLDivElement>(marca)
  const temTexto = props.value != null && String(props.value).length > 0

  React.useEffect(() => {
    if (!shortcut) return
    const comMod = /(^|\+)mod\+/i.test(shortcut)
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.defaultPrevented || !matchShortcut(shortcut, e)) return
      // Sem modificadora, a tecla é texto quando o foco está num campo.
      if (!comMod && isEditableTarget(e.target)) return
      e.preventDefault()
      campo.current?.focus()
      campo.current?.select()
    }
    document.addEventListener("keydown", aoTeclar)
    return () => document.removeEventListener("keydown", aoTeclar)
  }, [shortcut])

  return (
    <div
      {...rootProps}
      ref={glowRef}
      data-slot="search-input"
      data-surface={surface}
      data-size={size}
      aria-busy={pending || undefined}
      className={cn(
        searchFieldShapeClassName,
        searchFieldSizeClassName[size],
        touchFloor && searchFieldCoarseClassName,
        searchFieldSurfaceClassName[surface],
        focusRing && searchFieldFocusClassName,
        "w-full cursor-text transition-colors",
        "has-[input:disabled]:cursor-not-allowed has-[input:disabled]:opacity-50",
        marca && "relative isolate brand-glow",
        className
      )}
      // A pílula inteira é alvo: clicar no recuo ou na lupa leva ao campo.
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) {
          e.preventDefault()
          campo.current?.focus()
        }
      }}
    >
      {pending ? (
        <Spinner size="md" className="shrink-0 text-muted-foreground" />
      ) : (
        <MagnifyingGlassIcon aria-hidden className={searchFieldIconClassName} />
      )}
      {leading}
      <Campo
        ref={composeRefs(campo, ref)}
        data-slot="search-input-control"
        type={type}
        autoComplete={autoComplete}
        placeholder={placeholder}
        aria-keyshortcuts={shortcut ? ariaShortcut(shortcut) : undefined}
        className={cn(
          searchFieldInputClassName,
          // A rampa que impede o zoom do iOS ao focar, a do campo de
          // formulário; e o `sm` desce o corpo, como na escada de campo.
          "text-base md:text-sm",
          size === "sm" && "md:text-control-sm",
          // O × do navegador sai; o nosso entra logo abaixo.
          "[&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none",
          inputClassName
        )}
        {...props}
      >
        {children}
      </Campo>
      {onClear && temTexto ? (
        <Button
          type="button"
          variant="tertiary"
          size="icon-xs"
          aria-label={clearLabel}
          className={searchFieldClearClassName}
          onClick={(event) => {
            onClear(event)
            campo.current?.focus()
          }}
        >
          <XMarkIcon aria-hidden />
        </Button>
      ) : shortcut ? (
        // `aria-hidden`: o atalho já é anunciado pelo `aria-keyshortcuts` do
        // campo. Some quando há texto — ali o lugar é do ×.
        <Kbd keys={shortcut} aria-hidden className={searchFieldShortcutClassName} />
      ) : null}
    </div>
  )
}

export { SearchInput }
