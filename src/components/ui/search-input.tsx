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
 * O campo de busca do projeto: a pílula do cabeçalho e da paleta. Veste
 * `lib/search-field-classes` (forma, escada, as duas superfícies, lupa, × e tecla
 * do atalho), como o gatilho do cabeçalho, o `CommandDialog` e o `Combobox`. Não
 * compõe o `InputGroup`: o recuo, o raio e o fio dele seriam todos sobrescritos.
 * O × do navegador sai e a semântica fica: `type="search"` traz um × do WebKit
 * (fora do tema e da escada), mas dá a tecla "Buscar" do iOS e o
 * `role="searchbox"`. O nosso só aparece com texto e com `onClear`, e ao limpar o
 * foco volta ao campo (o botão some com o texto).
 * `className` dimensiona a pílula, que desenha a borda e a largura; para o
 * `<input>` existe `inputClassName`.
 * - `surface="plate"`: a pílula de vidro da pilha do `Command`, para busca dentro
 *   de painel flutuante.
 * - `shortcut`: a tecla à direita, sem pastilha; o atalho foca o campo, e sem
 *   modificadora (`"/"`) não dispara com o foco num campo de texto.
 * - `variant="brand"`: o brilho de marca na borda ao aproximar o ponteiro, só na
 *   superfície `field`. Uma por tela.
 * - `pending`: a lupa vira `Spinner` e a pílula ganha `aria-busy`.
 * - `caret`: o cursor desenhado (`type-caret`) no lugar do nativo, aceso com ou
 *   sem foco — para a busca que se digita sozinha numa vitrine. Uma grade de uma
 *   célula sobrepõe ao campo o reflexo invisível do `value` e o traço, no mesmo
 *   corpo de texto. Segue o `value` controlado; sem ele, o traço fica no começo.
 * O `CommandInput` monta **este** componente com o `Command.Input` do cmdk como
 * filho (o `Slot` funde classes, `type` e `ref`); daí `leading` (o escopo da
 * paleta), `focusRing` (a paleta nasce focada), `touchFloor` e `rootProps`.
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
  /** O cursor desenhado no lugar do nativo, piscando com ou sem foco; segue o `value`. */
  caret?: boolean
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
  caret = false,
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
  // A rampa que impede o zoom do iOS ao focar, a do campo de formulário; e o
  // `sm` desce o corpo, como na escada de campo. O reflexo do cursor desenhado
  // veste a mesma, para o traço cair no fim do texto.
  const corpo = cn("text-base md:text-sm", size === "sm" && "md:text-control-sm")

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

  const controle = (
    <Campo
      ref={composeRefs(campo, ref)}
      data-slot="search-input-control"
      type={type}
      autoComplete={autoComplete}
      placeholder={placeholder}
      aria-keyshortcuts={shortcut ? ariaShortcut(shortcut) : undefined}
      className={cn(
        searchFieldInputClassName,
        corpo,
        // Na célula do cursor desenhado, o nativo some e o campo divide a caixa.
        caret && "col-start-1 row-start-1 caret-transparent",
        // O × do navegador sai; o nosso entra logo abaixo.
        "[&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none",
        inputClassName
      )}
      {...props}
    >
      {children}
    </Campo>
  )

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
      {caret ? (
        // Uma célula só: o campo e o reflexo ocupam a mesma caixa (o `<input>`
        // não tem borda nem recuo), e o traço cai depois do texto invisível.
        <span data-slot="search-input-caret-field" className="grid min-w-0 flex-1 grid-cols-1">
          {controle}
          <span
            aria-hidden
            data-slot="search-input-caret"
            className={cn(
              "pointer-events-none col-start-1 row-start-1 flex min-w-0 items-center overflow-hidden",
              corpo
            )}
          >
            <span className="invisible whitespace-pre">{props.value ?? ""}</span>
            <span className="type-caret shrink-0" />
          </span>
        </span>
      ) : (
        controle
      )}
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
