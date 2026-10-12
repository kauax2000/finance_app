"use client"

import * as React from "react"
import { CheckIcon, ChevronRightIcon } from "@heroicons/react/16/solid"
import { CheckIcon as CheckMiniIcon } from "@heroicons/react/20/solid"
import { cva, type VariantProps } from "class-variance-authority"
import { DropdownMenu as DropdownMenuPrimitive, Slot } from "radix-ui"

import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"
import { ariaShortcut, matchShortcut } from "@/lib/shortcut"
import { commandFilter } from "@/lib/command-filter"
import { Kbd } from "@/components/ui/kbd"
import { Spinner } from "@/components/ui/spinner"
import { Separator } from "@/components/ui/separator"
import { SearchInput } from "@/components/ui/search-input"
import {
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Drawer,
  drawerActionClassName,
  DrawerCancel,
  DrawerContent,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { ANCHORED_COLLISION_PADDING } from "@/lib/anchored-surface"
import { scrollFadeViewportClassName } from "@/lib/scroll-fade-classes"
import { useScrollFade } from "@/hooks/use-scroll-fade"
import { ScrollFadeArrows } from "@/lib/scroll-fade-arrows"
import {
  MenuTitleContext,
  MenuTitleHeader,
  useMenuTitleId,
} from "@/lib/menu-title"
import {
  skipFocusAfterScrollClose,
  useCloseOnScroll,
} from "@/hooks/use-close-on-scroll"
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
 * As duas classes que trazem o nome da primitiva ficam escritas por extenso: o
 * Tailwind varre o código como texto, e uma classe interpolada nunca gera CSS.
 */
const DROPDOWN_POPPER =
  "max-h-[min(var(--radix-dropdown-menu-content-available-height),var(--menu-max-h))] max-w-(--radix-dropdown-menu-content-available-width) origin-(--radix-dropdown-menu-content-transform-origin)"

/**
 * O menu de um gatilho. Desenha a mesma superfície do `ContextMenu`; a régua
 * mora em [`lib/menu-classes`](../../lib/menu-classes.ts). O `SubTrigger` traz
 * o chevron, o painel tem teto de altura, os indicadores são Heroicons e o
 * tamanho do ícone é do conjunto (não força `size-4`).
 */

/** A marca de "fechou por rolagem", da raiz para o `Content`. */
const DropdownMenuScrollCloseContext =
  React.createContext<React.RefObject<boolean> | null>(null)

/**
 * `mobile="sheet"`: no telefone o mesmo menu é a folha de ações do `Drawer`;
 * cada peça lê o `DropdownMenuEstadoContext` e se desenha como menu ou como
 * linha (caixas, rádios e submenus viram linhas). `shortcut` na raiz abre o
 * menu pela tecla: o da linha com o foco ou, fora de linha, o da tela quando
 * nada tem foco. `DropdownMenuHeader title/description` é o alvo e nomeia o
 * menu; `DropdownMenuContent search` filtra as linhas (`commandFilter`).
 * `DropdownMenuItem`: `shortcut`, `description`, `confirm` (a destrutiva pede
 * um segundo toque) e um `onSelect` que devolve `Promise` (a linha carrega e o
 * menu fecha no fim). A caixa não fecha o menu (`closeOnSelect` volta ao
 * comportamento do Radix).
 */
type MenuEstado = {
  /** No telefone, com `mobile="sheet"`: a folha de ações. */
  folha: boolean
  fechar: () => void
  gatilhoRef: React.RefObject<HTMLElement | null>
  shortcut?: string
  busca: string
  setBusca: (busca: string) => void
}

const DropdownMenuEstadoContext = React.createContext<MenuEstado>({
  folha: false,
  fechar: () => {},
  gatilhoRef: { current: null },
  busca: "",
  setBusca: () => {},
})

/**
 * O menu com busca mede como o `Combobox` (a mesma placa com a pílula e a
 * lista dentro): pílula `md` a 8px das bordas, linhas de 36.
 */
const DropdownMenuBuscaContext = React.createContext(false)
const LINHA_DA_BUSCA = "gap-2 px-2 py-2"

/** O rádio da folha: o valor e quem o troca, sem o Radix. */
const FolhaRadioContext = React.createContext<{
  value?: string
  onValueChange?: (value: string) => void
} | null>(null)

/** O texto de uma linha, para a busca: as folhas de texto dos filhos. */
function textoDe(no: React.ReactNode): string {
  if (no == null || typeof no === "boolean") return ""
  if (typeof no === "string" || typeof no === "number") return String(no)
  if (Array.isArray(no)) return no.map(textoDe).join(" ")
  if (React.isValidElement<{ children?: React.ReactNode }>(no))
    return textoDe(no.props.children)
  return ""
}

/** Troca o texto de uma linha pelo da confirmação, mantendo o ícone. */
function trocarTexto(no: React.ReactNode, texto: string): React.ReactNode {
  const elementos = React.Children.toArray(no).filter((f) =>
    React.isValidElement(f)
  )
  return (
    <>
      {elementos.slice(0, 1)}
      <span>{texto}</span>
    </>
  )
}

/** Com `modal={false}` a página rola com o menu aberto e ele fecha (`useCloseOnScroll`); o modal já trava a rolagem. */
function DropdownMenu({
  open: openProp,
  defaultOpen,
  onOpenChange,
  modal,
  mobile = "menu",
  shortcut,
  children,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Root> & {
  /** `sheet`: no telefone, a folha de ações do `Drawer`. */
  mobile?: "menu" | "sheet"
  /** A tecla que abre o menu, na grafia do `Kbd` (`"."`, `"mod+."`). */
  shortcut?: string
}) {
  const [open, setOpen, fechouPorRolagem] = useCloseOnScroll({
    value: openProp,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
    closed: false,
    enabled: modal === false,
  })
  const isMobile = useIsMobile()
  const folha = mobile === "sheet" && isMobile
  const gatilhoRef = React.useRef<HTMLElement | null>(null)
  const [busca, setBusca] = React.useState("")

  // Fechar esquece a busca: o menu reabre inteiro.
  const mudar = React.useCallback(
    (proximo: boolean) => {
      if (!proximo) setBusca("")
      setOpen(proximo)
    },
    [setOpen]
  )

  React.useEffect(() => {
    if (!shortcut) return
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.defaultPrevented || !matchShortcut(shortcut, e)) return
      const alvo = gatilhoRef.current
      if (!alvo || !alvo.isConnected) return
      const ativo = document.activeElement
      // O menu de uma linha abre só com o foco nela; o da tela, só com nada
      // focado, senão uma tecla abriria o menu de todas.
      const escopo = alvo.closest(
        "tr, [data-slot=item], [data-slot=card], [data-menu-scope]"
      )
      const vale = escopo
        ? escopo.contains(ativo)
        : ativo === alvo || ativo === document.body || ativo === null
      if (!vale) return
      e.preventDefault()
      mudar(true)
    }
    document.addEventListener("keydown", aoTeclar)
    return () => document.removeEventListener("keydown", aoTeclar)
  }, [shortcut, mudar])

  const estado = React.useMemo<MenuEstado>(
    () => ({ folha, fechar: () => mudar(false), gatilhoRef, shortcut, busca, setBusca }),
    [folha, mudar, shortcut, busca]
  )

  return (
    <DropdownMenuScrollCloseContext.Provider value={fechouPorRolagem}>
      <DropdownMenuEstadoContext.Provider value={estado}>
        {folha ? (
          <Drawer open={open} onOpenChange={mudar}>
            {children}
          </Drawer>
        ) : (
          <DropdownMenuPrimitive.Root
            data-slot="dropdown-menu"
            open={open}
            onOpenChange={mudar}
            modal={modal}
            {...props}
          >
            {children}
          </DropdownMenuPrimitive.Root>
        )}
      </DropdownMenuEstadoContext.Provider>
    </DropdownMenuScrollCloseContext.Provider>
  )
}

function DropdownMenuTrigger({
  ref,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Trigger>) {
  const { folha, gatilhoRef, shortcut } = React.useContext(DropdownMenuEstadoContext)
  const registrar = React.useCallback(
    (el: HTMLButtonElement | null) => {
      gatilhoRef.current = el
      if (typeof ref === "function") ref(el)
      else if (ref) ref.current = el
    },
    [gatilhoRef, ref]
  )
  const Comp = folha ? DrawerTrigger : DropdownMenuPrimitive.Trigger
  return (
    <Comp
      data-slot="dropdown-menu-trigger"
      ref={registrar}
      aria-keyshortcuts={shortcut ? ariaShortcut(shortcut) : undefined}
      {...props}
    />
  )
}

function DropdownMenuGroup({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Group>) {
  const { folha } = React.useContext(DropdownMenuEstadoContext)
  if (folha) {
    const { asChild: _a, ...resto } = props as typeof props & { asChild?: boolean }
    void _a
    return <div role="group" data-slot="dropdown-menu-group" {...resto} />
  }
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

/** Na folha, o submenu é um grupo com rótulo: não há segundo nível no dedo. */
function DropdownMenuSub({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Sub>) {
  const { folha } = React.useContext(DropdownMenuEstadoContext)
  if (folha) return <>{props.children}</>
  return <DropdownMenuPrimitive.Sub data-slot="dropdown-menu-sub" {...props} />
}

function DropdownMenuRadioGroup({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.RadioGroup>) {
  const { folha } = React.useContext(DropdownMenuEstadoContext)
  if (folha) {
    return (
      <FolhaRadioContext.Provider
        value={{ value: props.value, onValueChange: props.onValueChange }}
      >
        <div role="group" data-slot="dropdown-menu-radio-group">
          {props.children}
        </div>
      </FolhaRadioContext.Provider>
    )
  }
  return (
    <DropdownMenuPrimitive.RadioGroup
      data-slot="dropdown-menu-radio-group"
      {...props}
    />
  )
}

/**
 * `size` é a largura (`auto` por padrão, e `sm` a `xl` nomeiam as quatro que as
 * telas já repetiam). `variant`: `menu` é a lista de comandos; `panel` é a
 * casca que cede o recuo, para cabeçalho de conta e blocos (o `UserMenu`, o
 * `WorkspaceSwitcher`).
 */
const dropdownMenuContentVariants = cva(
  // Brota do botão e volta para ele (`@utility menu-sprout`).
  [menuSurfaceClassName, DROPDOWN_POPPER, "menu-sprout"],
  {
    variants: {
      variant: {
        menu: "",
        // O recuo sai do casco e vai para `DropdownMenuSection`, que o devolve
        // onde há comandos, para o `-mx-2` do separador alcançar a borda.
        panel: [
          // A placa é a linha alta e publica o próprio raio: herdando o 22 as
          // linhas de dentro sairiam com 14.
          "rounded-row-lg [--radius-parent:var(--radius-row-lg)]",
          // O painel não é lista: o teto das listas suspensas não vale.
          "[--menu-max-h:100dvh]",
          // O painel cede de novo o recuo para o `DropdownMenuSection`.
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
  search,
  sideOffset = 4,
  collisionPadding = ANCHORED_COLLISION_PADDING,
  variant,
  size,
  onCloseAutoFocus,
  "aria-labelledby": ariaLabelledBy,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Content> &
  VariantProps<typeof dropdownMenuContentVariants> & {
    /**
     * A faixa de cima (a identidade do painel, ou o alvo do menu). É prop e
     * não filho porque precisa ser irmã do viewport para o conteúdo dissolver
     * por baixo dela, e o `UserMenu` passa um `AccountMenuUserSummary`, não um
     * `DropdownMenuHeader`.
     */
    header?: React.ReactNode
    /** A faixa de pé, pelas mesmas razões. */
    footer?: React.ReactNode
    /** Um campo que filtra as linhas pelo nome. `true` ou o placeholder. */
    search?: boolean | string
  }) {
  const fechouPorRolagem = React.useContext(DropdownMenuScrollCloseContext)
  const estado = React.useContext(DropdownMenuEstadoContext)
  const [tituloId, setTituloId] = React.useState<string | null>(null)
  const campo = React.useRef<HTMLInputElement>(null)
  const placeholder = typeof search === "string" ? search : "Buscar…"
  // Antes do `return` da folha: um hook depois dele mudaria a ordem quando o menu troca de desenho.
  const dissolver = useScrollFade({ arrows: true })

  const vazio = estado.busca ? (
    <p
      data-slot="dropdown-menu-empty"
      className="hidden px-2 py-6 text-center text-sm text-muted-foreground"
    >
      Nada encontrado
    </p>
  ) : null

  if (estado.folha) {
    const rotulo =
      estado.gatilhoRef.current?.getAttribute("aria-label") ??
      estado.gatilhoRef.current?.textContent?.trim() ??
      "Ações"
    return (
      <DrawerContent data-slot="dropdown-menu-sheet">
        <MenuTitleContext.Provider value={setTituloId}>
          {header}
        </MenuTitleContext.Provider>
        {/* Sem um título no cabeçalho, a gaveta leva o nome do gatilhoRef —
            "Ações da transação" —, escondido. */}
        {tituloId ? null : (
          <DialogHeader className="sr-only">
            <DialogTitle>{rotulo}</DialogTitle>
            <DialogDescription>Ações disponíveis</DialogDescription>
          </DialogHeader>
        )}
        <div
          data-slot="dropdown-menu-sheet-list"
          className="flex flex-col px-2 [&:not(:has([role^=menuitem]))>[data-slot=dropdown-menu-empty]]:block"
        >
          {search ? (
            <div className="px-1 pb-2">
              <SearchInput
                ref={campo}
                value={estado.busca}
                onChange={(e) => estado.setBusca(e.target.value)}
                onClear={() => estado.setBusca("")}
                placeholder={placeholder}
                aria-label={placeholder}
              />
            </div>
          ) : null}
          {children}
          {vazio}
        </div>
        <DrawerCancel />
      </DrawerContent>
    )
  }

  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        data-slot="dropdown-menu-content"
        data-variant={variant}
        sideOffset={sideOffset}
        collisionPadding={collisionPadding}
        aria-labelledby={ariaLabelledBy ?? tituloId ?? undefined}
        onCloseAutoFocus={skipFocusAfterScrollClose(
          fechouPorRolagem,
          onCloseAutoFocus
        )}
        className={cn(
          dropdownMenuContentVariants({ variant, size }),
          className
        )}
        {...props}
      >
        {header ? (
          // O fio é do slot e não da faixa: o `UserMenu` não usa
          // `DropdownMenuHeader`, e uma regra na faixa deixaria o app de fora.
          <div
            data-slot="dropdown-menu-header-slot"
            className="relative z-10 shrink-0 border-b border-border"
          >
            <MenuTitleContext.Provider value={setTituloId}>
              {header}
            </MenuTitleContext.Provider>
          </div>
        ) : null}
        {search ? (
          <div
            data-slot="dropdown-menu-search"
            className="relative z-10 shrink-0 p-2"
            // Com busca o foco vai para o campo; o conteúdo do Radix não expõe
            // `onOpenAutoFocus`, e ele mesmo foca o menu ao abrir.
            ref={(el) => {
              if (el) requestAnimationFrame(() => campo.current?.focus())
            }}
            // O Radix busca por digitação e levaria o foco à linha que casa;
            // no campo a tecla é texto. Só a seta para baixo e o Esc passam.
            onKeyDown={(e) => {
              if (e.key === "Escape") return
              if (e.key === "ArrowDown") {
                e.preventDefault()
                e.currentTarget.parentElement
                  ?.querySelector<HTMLElement>(
                    "[role^=menuitem]:not([data-disabled])"
                  )
                  ?.focus()
                return
              }
              e.stopPropagation()
            }}
          >
            <SearchInput
              ref={campo}
              surface="plate"
              value={estado.busca}
              onChange={(e) => estado.setBusca(e.target.value)}
              onClear={() => estado.setBusca("")}
              placeholder={placeholder}
              aria-label={placeholder}
            />
          </div>
        ) : null}
        <div
          ref={dissolver}
          data-slot="dropdown-menu-viewport"
          className={cn(
            menuViewportClassName,
            scrollFadeViewportClassName,
            "overlay-cascade",
            search && "px-2 pt-0 pb-2",
            "[&:not(:has([role^=menuitem]))>[data-slot=dropdown-menu-empty]]:block"
          )}
        >
          <DropdownMenuBuscaContext.Provider value={Boolean(search)}>
            {children}
          </DropdownMenuBuscaContext.Provider>
          {vazio}
        </div>
        <ScrollFadeArrows />
        {footer ? <div className="shrink-0">{footer}</div> : null}
      </DropdownMenuPrimitive.Content>
    </DropdownMenuPrimitive.Portal>
  )
}

/**
 * A faixa de cima do menu. Com `title` é o alvo ("Mercado", "12 set · −R$
 * 42,90") e nomeia o menu (na folha, é o cabeçalho da gaveta); sem ele é a
 * faixa de identidade do painel, que sangra até a borda. O fio que a separa dos
 * comandos é do slot (ver `DropdownMenuContent`).
 */
function DropdownMenuHeader({
  className,
  title,
  description,
  children,
  ...props
}: Omit<React.ComponentProps<"div">, "title"> & {
  title?: React.ReactNode
  description?: React.ReactNode
}) {
  const { folha } = React.useContext(DropdownMenuEstadoContext)
  const temTitulo = title != null
  const id = useMenuTitleId(temTitulo)

  if (folha && temTitulo) {
    return (
      <DialogHeader>
        {/* Sem `id` próprio: é o Radix quem liga o título à gaveta, e um `id`
            aqui apontava o `aria-labelledby` dela para o vazio — medido. */}
        <DialogTitle>{title}</DialogTitle>
        {description ? <DialogDescription>{description}</DialogDescription> : null}
      </DialogHeader>
    )
  }

  if (temTitulo) {
    return (
      <MenuTitleHeader
        slot="dropdown-menu-header"
        titleId={id}
        className={className}
        title={title}
        description={description}
        {...props}
      />
    )
  }

  return (
    <div
      data-slot="dropdown-menu-header"
      className={cn(
        "relative z-10 flex shrink-0 items-center gap-2.5 px-3 py-2.5 text-sm",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

/**
 * A região de comandos dentro de um painel: devolve o recuo que o
 * `variant="panel"` tirou do casco, para o `-mx-2` do `DropdownMenuSeparator`
 * alcançar a borda do painel.
 */
function DropdownMenuSection({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { folha } = React.useContext(DropdownMenuEstadoContext)
  return (
    <div
      data-slot="dropdown-menu-section"
      className={cn(!folha && "p-2", className)}
      {...props}
    />
  )
}

/**
 * O que a linha faz ao ser escolhida, nos dois desenhos: `confirm` pede o
 * segundo toque; um `onSelect` que devolve `Promise` carrega e fecha no fim.
 * Devolve `true` quando o menu pode fechar já.
 */
function useEscolha({
  confirm,
  onSelect,
  pending,
}: {
  confirm?: boolean | string
  onSelect?: (event: Event) => void | Promise<unknown>
  pending: boolean
}) {
  const { fechar } = React.useContext(DropdownMenuEstadoContext)
  const [armado, setArmado] = React.useState(false)
  const [carregando, setCarregando] = React.useState(false)

  // O segundo toque vale por três segundos; depois a linha volta ao normal.
  React.useEffect(() => {
    if (!armado) return
    const t = window.setTimeout(() => setArmado(false), 3000)
    return () => window.clearTimeout(t)
  }, [armado])

  const escolher = (event: Event): boolean => {
    if (pending || carregando) return false
    if (confirm && !armado) {
      setArmado(true)
      return false
    }
    const resultado = onSelect?.(event)
    if (event.defaultPrevented) return false
    if (resultado && typeof (resultado as Promise<unknown>).then === "function") {
      setCarregando(true)
      void (resultado as Promise<unknown>).finally(() => {
        setCarregando(false)
        setArmado(false)
        fechar()
      })
      return false
    }
    return true
  }

  return { armado, carregando: carregando || pending, escolher }
}

/**
 * `variant="destructive"` traz o `focus:bg-destructive/10`, o par escuro e a
 * tinta do ícone. `shortcut` desenha a tecla com o `Kbd` (só a dica);
 * `description` vira a segunda linha (a linha vira grade, como no
 * `ContextMenu`); `confirm` pede o segundo toque; um `onSelect` que devolve
 * `Promise` mostra o `Spinner` e fecha o menu ao terminar. `pending` é o mesmo
 * estado, controlado por quem chama.
 */
function DropdownMenuItem({
  className,
  inset,
  variant = "default",
  shortcut,
  description,
  confirm,
  pending = false,
  onSelect,
  textValue,
  children,
  asChild,
  disabled,
  ...props
}: Omit<React.ComponentProps<typeof DropdownMenuPrimitive.Item>, "onSelect"> & {
  inset?: boolean
  variant?: "default" | "destructive"
  shortcut?: string
  description?: React.ReactNode
  /** A linha pede um segundo toque. `true` ou o texto da confirmação. */
  confirm?: boolean | string
  /** A linha carrega, e o menu espera. */
  pending?: boolean
  onSelect?: (event: Event) => void | Promise<unknown>
}) {
  const estado = React.useContext(DropdownMenuEstadoContext)
  const naBusca = React.useContext(DropdownMenuBuscaContext)
  const { armado, carregando, escolher } = useEscolha({ confirm, onSelect, pending })
  const texto = textValue ?? textoDe(children)
  if (estado.busca && commandFilter(texto, estado.busca) <= 0) return null

  const textoConfirmacao =
    typeof confirm === "string" ? confirm : "toque de novo para confirmar"
  const miolo = (
    <>
      {armado ? trocarTexto(children, textoConfirmacao) : children}
      {carregando ? (
        <Spinner className="ms-auto" />
      ) : shortcut && !estado.folha ? (
        <span data-slot="dropdown-menu-item-shortcut" className="ms-auto pointer-coarse:hidden">
          <Kbd
            keys={shortcut}
            className="group-focus/menu-item:bg-background/70"
          />
        </span>
      ) : null}
      {description ? (
        <span
          data-slot="dropdown-menu-item-description"
          className="col-start-1 col-end-[-1] text-xs text-muted-foreground group-has-[>svg]/menu-item:col-start-2 group-focus/menu-item:text-accent-foreground/80"
        >
          {description}
        </span>
      ) : null}
    </>
  )
  const grade =
    description &&
    "grid grid-cols-[minmax(0,1fr)_auto] gap-y-0 has-[>svg]:grid-cols-[auto_minmax(0,1fr)_auto]"

  if (estado.folha) {
    const Comp = asChild ? Slot.Root : "button"
    // O `onClick` da tela roda primeiro: com ele por último no espalhamento, a linha não fecharia a gaveta.
    const { onClick: aoClicar, ...resto } = props as React.ComponentProps<"button">
    return (
      <Comp
        role="menuitem"
        data-slot="dropdown-menu-item"
        data-variant={variant}
        data-armed={armado || undefined}
        aria-busy={carregando || undefined}
        {...(asChild ? {} : { type: "button" as const, disabled })}
        aria-disabled={disabled || undefined}
        className={cn(
          "group/menu-item",
          drawerActionClassName,
          // As telas passam o ícone de 16 (o do menu); a folha o desenhava a 20.
          "[&_svg]:size-4",
          grade,
          description && "py-2",
          "data-armed:bg-destructive/10",
          className
        )}
        {...resto}
        onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
          // Com `confirm`, o primeiro toque só arma: a ação da tela espera.
          if (!(confirm && !armado)) aoClicar?.(e)
          if (e.defaultPrevented) return
          if (escolher(e.nativeEvent)) estado.fechar()
        }}
      >
        {asChild ? children : miolo}
      </Comp>
    )
  }

  return (
    <DropdownMenuPrimitive.Item
      data-slot="dropdown-menu-item"
      data-inset={inset}
      data-variant={variant}
      data-armed={armado || undefined}
      aria-busy={carregando || undefined}
      textValue={texto}
      asChild={asChild}
      disabled={disabled}
      onSelect={(e) => {
        if (!escolher(e)) e.preventDefault()
      }}
      {...props}
      // Com `confirm`, o primeiro toque só arma: a ação da tela espera — muitas
      // telas agem pelo `onClick`, e não pelo `onSelect`.
      onClick={(e) => {
        if (confirm && !armado) return
        props.onClick?.(e)
      }}
      className={cn(
        menuItemClassName,
        naBusca && LINHA_DA_BUSCA,
        grade,
        "data-armed:bg-destructive/10 data-armed:text-destructive",
        className
      )}
    >
      {asChild ? children : miolo}
    </DropdownMenuPrimitive.Item>
  )
}

/** Na folha o gatilhoRef de submenu é o rótulo do grupo; o submenu, o grupo. */
function DropdownMenuSubTrigger({
  className,
  inset,
  children,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.SubTrigger> & {
  inset?: boolean
}) {
  const { folha } = React.useContext(DropdownMenuEstadoContext)
  const naBusca = React.useContext(DropdownMenuBuscaContext)
  if (folha) {
    return (
      <p className="px-3 pt-3 pb-1 text-xs font-medium text-muted-foreground">
        {children}
      </p>
    )
  }
  return (
    <DropdownMenuPrimitive.SubTrigger
      data-slot="dropdown-menu-sub-trigger"
      data-inset={inset}
      className={cn(menuSubTriggerClassName, naBusca && LINHA_DA_BUSCA, className)}
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
  const { folha } = React.useContext(DropdownMenuEstadoContext)
  const dissolver = useScrollFade({ arrows: true })
  if (folha) return <div className="flex flex-col">{children}</div>
  return (
    // No portal: dentro do menu o vidro (`backdrop-filter`) vira o bloco de
    // contenção do `fixed` do popper e o `overflow-hidden` recorta o submenu.
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.SubContent
        data-slot="dropdown-menu-sub-content"
        collisionPadding={collisionPadding}
        // O submenu brota do item que o abriu: a origem do Radix é o lado dele.
        className={cn(menuSubSurfaceClassName, DROPDOWN_POPPER, "menu-sprout", className)}
        {...props}
      >
        <div
          ref={dissolver}
          data-slot="dropdown-menu-sub-viewport"
          className={cn(menuViewportClassName, scrollFadeViewportClassName, "overlay-cascade")}
        >
          {/* O submenu não tem busca, e o contexto atravessa o portal. */}
          <DropdownMenuBuscaContext.Provider value={false}>
            {children}
          </DropdownMenuBuscaContext.Provider>
        </div>
        <ScrollFadeArrows />
      </DropdownMenuPrimitive.SubContent>
    </DropdownMenuPrimitive.Portal>
  )
}

/** A caixa não fecha o menu ao marcar (quem marca uma opção costuma marcar outra); `closeOnSelect` devolve o comportamento do Radix. */
function DropdownMenuCheckboxItem({
  className,
  children,
  checked,
  inset,
  closeOnSelect = false,
  onSelect,
  onCheckedChange,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.CheckboxItem> & {
  inset?: boolean
  closeOnSelect?: boolean
}) {
  const estado = React.useContext(DropdownMenuEstadoContext)
  const naBusca = React.useContext(DropdownMenuBuscaContext)
  if (estado.folha) {
    const marcado = checked === true
    return (
      <button
        type="button"
        role="menuitemcheckbox"
        aria-checked={marcado}
        data-slot="dropdown-menu-checkbox-item"
        disabled={props.disabled}
        className={cn(drawerActionClassName, className)}
        onClick={() => {
          onCheckedChange?.(!marcado)
          if (closeOnSelect) estado.fechar()
        }}
      >
        <span className="min-w-0 flex-1">{children}</span>
        {marcado ? <CheckMiniIcon aria-hidden className="size-5 !text-foreground" /> : null}
      </button>
    )
  }
  return (
    <DropdownMenuPrimitive.CheckboxItem
      data-slot="dropdown-menu-checkbox-item"
      data-inset={inset}
      className={cn(menuIndicatorItemClassName, naBusca && "gap-2 pl-2 py-1.5", className)}
      checked={checked}
      onCheckedChange={onCheckedChange}
      onSelect={(e) => {
        onSelect?.(e)
        if (!closeOnSelect) e.preventDefault()
      }}
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
  const estado = React.useContext(DropdownMenuEstadoContext)
  const naBusca = React.useContext(DropdownMenuBuscaContext)
  const radio = React.useContext(FolhaRadioContext)
  if (estado.folha) {
    const marcado = radio?.value === props.value
    return (
      <button
        type="button"
        role="menuitemradio"
        aria-checked={marcado}
        data-slot="dropdown-menu-radio-item"
        disabled={props.disabled}
        className={cn(drawerActionClassName, className)}
        onClick={() => {
          radio?.onValueChange?.(props.value)
          estado.fechar()
        }}
      >
        <span className="min-w-0 flex-1">{children}</span>
        {marcado ? <span aria-hidden className="size-2 rounded-full bg-current" /> : null}
      </button>
    )
  }
  return (
    <DropdownMenuPrimitive.RadioItem
      data-slot="dropdown-menu-radio-item"
      data-inset={inset}
      className={cn(menuIndicatorItemClassName, naBusca && "gap-2 pl-2 py-1.5", className)}
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
  const { folha } = React.useContext(DropdownMenuEstadoContext)
  const naBusca = React.useContext(DropdownMenuBuscaContext)
  if (folha) {
    return (
      <div
        data-slot="dropdown-menu-label"
        className={cn("px-3 pt-2 pb-1 text-xs font-medium text-muted-foreground", className)}
      >
        {props.children}
      </div>
    )
  }
  return (
    <DropdownMenuPrimitive.Label
      data-slot="dropdown-menu-label"
      data-inset={inset}
      className={cn(menuLabelClassName, naBusca && "px-2", className)}
      {...props}
    />
  )
}

function DropdownMenuSeparator({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Separator>) {
  const { folha } = React.useContext(DropdownMenuEstadoContext)
  const naBusca = React.useContext(DropdownMenuBuscaContext)
  if (folha) return <Separator tone="soft" className="my-2" />
  return (
    <DropdownMenuPrimitive.Separator
      data-slot="dropdown-menu-separator"
      className={cn(menuSeparatorClassName, naBusca && "-mx-2", className)}
      {...props}
    />
  )
}

/** Na folha a tecla não aparece: o dedo não tem teclado. */
function DropdownMenuShortcut({
  className,
  ...props
}: React.ComponentProps<"span">) {
  const { folha } = React.useContext(DropdownMenuEstadoContext)
  if (folha) return null
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
