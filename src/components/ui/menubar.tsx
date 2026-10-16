"use client"

import * as React from "react"
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from "@heroicons/react/16/solid"
import { Bars3Icon, CheckIcon as CheckMiniIcon } from "@heroicons/react/20/solid"
import { cva, type VariantProps } from "class-variance-authority"
import { LayoutGroup, motion, useReducedMotion } from "motion/react"
import { Menubar as MenubarPrimitive } from "radix-ui"

import { ehCursor } from "@/lib/pointer"
import { cn } from "@/lib/utils"
import { commandFilter } from "@/lib/command-filter"
import { barSurfaceClassName, menuPanelTintClassName } from "@/lib/glass-classes"
import { ANCHORED_COLLISION_PADDING } from "@/lib/anchored-surface"
import { scrollFadeViewportClassName } from "@/lib/scroll-fade-classes"
import { ariaShortcut, isEditableTarget, matchShortcut } from "@/lib/shortcut"
import { useScrollFade } from "@/hooks/use-scroll-fade"
import { ScrollFadeArrows } from "@/lib/scroll-fade-arrows"
import { useCloseOnScroll } from "@/hooks/use-close-on-scroll"
import { useIsMobile } from "@/hooks/use-mobile"
import {
  menuIndicatorItemClassName,
  menuIndicatorSlotClassName,
  menuItemClassName,
  menuLabelClassName,
  menuSeparatorClassName,
  menuShortcutClassName,
  menuSubSurfaceClassName,
  menuSubTriggerClassName,
  menuSurfaceClassName,
  menuViewportClassName,
} from "@/lib/menu-classes"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Drawer,
  DrawerCancel,
  DrawerContent,
  DrawerTrigger,
  drawerActionClassName,
} from "@/components/ui/drawer"
import { Kbd } from "@/components/ui/kbd"
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover"
import { SearchInput } from "@/components/ui/search-input"
import { Spinner } from "@/components/ui/spinner"

/**
 * As duas classes que trazem o nome da primitiva — escritas por extenso, e não
 * montadas. O Tailwind varre o código como texto: uma classe interpolada em
 * tempo de execução não existe para o scanner, e o CSS dela nunca é gerado.
 */
const MENUBAR_POPPER =
  "max-h-[min(var(--radix-menubar-content-available-height),var(--menu-max-h))] max-w-(--radix-menubar-content-available-width) origin-(--radix-menubar-content-transform-origin)"

/**
 * A barra de menus.
 * `DropdownMenu`, `ContextMenu` e `Menubar` desenham o mesmo painel; a casca,
 * a linha, o fio e o atalho vêm de `lib/menu-classes`. Aqui mora o que é só da
 * barra: a fileira, os gatilhos, o realce que viaja e o movimento.
 * O realce da fileira é um objeto só (`layoutId`); o que corre entre as linhas
 * do painel é proibido (`menu-fade.test.ts`). Com um menu aberto, passar ao
 * vizinho desliza o painel.
 * O índice: o Radix só monta as linhas de um menu aberto, e a tecla, a busca,
 * a folha do telefone e o estado do gatilho precisam delas fechadas. Cada
 * `MenubarContent` renderiza os filhos também num índice que nunca pinta, onde
 * a linha só se registra e devolve `null`.
 * `size` mede o gatilho (28, 32, 36), não a barra.
 */

type MenubarSize = "sm" | "md" | "lg"
type MenubarVariant = "outline" | "plain" | "solid" | "floating"

/** Uma linha registrada no índice. */
type Comando = {
  id: string
  menu: string
  texto: string
  shortcut?: string
  disabled?: boolean
  tipo: "item" | "checkbox" | "radio"
  marcado?: boolean
  variant?: "default" | "destructive"
  executar: () => void
}

type MenubarContextValue = {
  size: MenubarSize
  variant: MenubarVariant
  barId: string
  /** O menu aceso: o aberto, o do cursor ou o do foco. */
  realce: string | null
  setHover: (menu: string | null) => void
  setFoco: (menu: string | null) => void
  /** O menu aberto, e quem o abre por código (letra de acesso, busca). */
  aberto: string
  abrir: (menu: string) => void
  fechar: () => void
  /** Ao trocar de menu aberto: a distância do gatilho anterior ao novo. */
  troca: { ate: string; dx: number } | null
  alt: boolean
  registrarGatilho: (menu: string, el: HTMLElement | null, mnemonic?: string, rotulo?: string) => void
  rotulos: Record<string, string>
  comandos: Comando[]
  registrar: (c: Comando) => () => void
}

const MenubarContext = React.createContext<MenubarContextValue | null>(null)
function useMenubar() {
  const ctx = React.useContext(MenubarContext)
  if (!ctx) throw new Error("As peças do Menubar vivem dentro de <Menubar>.")
  return ctx
}

/** O menu em volta: o `value` dele, para gatilho, painel e índice. */
const MenubarMenuContext = React.createContext<string>("")
/** Dentro do índice as linhas se registram e não pintam. */
const IndiceContext = React.createContext(false)
/** O rádio no índice: o valor e quem o troca. */
const IndiceRadioContext = React.createContext<{
  value?: string
  onValueChange?: (v: string) => void
} | null>(null)

const menubarVariants = cva("relative isolate flex w-fit items-center gap-0.5 rounded-full p-0.5", {
  variants: {
    variant: {
      /**
       * O padrão é a pílula flutuante (abaixo); esta é a barra que se sustenta
       * sozinha, na régua de barra (`lib/glass-classes`).
       */
      outline: `border border-border ${barSurfaceClassName}`,
      /** Dentro de um cabeçalho que já tem moldura: sem material, para não empilhar borrão. */
      plain: "border border-transparent bg-transparent",
      /** Bandeja da mesma tinta do `TabsList`, opaca: a 60% no escuro deixa de ler como bandeja. */
      solid: "border border-transparent bg-muted",
      /** A pílula solta sobre o conteúdo, com sombra e na tinta **flutuante** dos menus. */
      floating: `rounded-full p-1 shadow-lg ring-1 ring-foreground/10 ${menuPanelTintClassName}`,
    },
  },
  defaultVariants: { variant: "floating" },
})

/**
 * O gatilho. Ele não pinta o próprio realce: quem acende é o objeto que viaja
 * (`menubar-highlight`), desenhado por baixo do rótulo.
 */
const menubarTriggerVariants = cva(
  [
    "group/menubar-trigger relative flex shrink-0 items-center gap-1.5 rounded-full px-2.5 text-sm font-medium whitespace-nowrap outline-hidden select-none",
    "transition-[color,scale] duration-(--duration-fast) ease-(--ease-out) active:scale-[0.985]",
    "focus-visible:ring-3 focus-visible:ring-ring/45",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ],
  {
    variants: {
      variant: {
        outline: "text-muted-foreground data-[aceso]:text-foreground",
        plain: "text-muted-foreground data-[aceso]:text-foreground",
        solid: "text-muted-foreground data-[aceso]:text-foreground",
        floating: "rounded-full px-3 text-muted-foreground data-[aceso]:text-foreground",
      },
      /** O piso é 28: `xs` (24) é para dentro de outro controle, não para uma barra. */
      size: { sm: "h-7", md: "h-8", lg: "h-9" },
    },
    defaultVariants: { variant: "floating", size: "md" },
  }
)

/**
 * O realce que viaja. Na bandeja `solid` ele **sobe** em vez de tingir:
 * `--accent` e `--muted` são a mesma cor no escuro, e acender `muted` sobre
 * `muted` não desenharia nada — a saída do `TabsTrigger`.
 */
const realceClassName: Record<MenubarVariant, string> = {
  outline: "bg-muted",
  plain: "bg-muted",
  solid: "bg-background shadow-xs ring-1 ring-border/80",
  floating: "bg-muted",
}

/** A mola do realce, da referência: 0,28s com 20% de quique. */
const MOLA_DO_REALCE = { type: "spring", duration: 0.28, bounce: 0.2 } as const

function Menubar({
  className,
  variant = "floating",
  size = "md",
  value: valueProp,
  defaultValue,
  onValueChange,
  mobile = "bar",
  mobileLabel = "Menu",
  search,
  children,
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Root> &
  VariantProps<typeof menubarVariants> & {
    /** A altura do gatilho (28, 32, 36). A fileira cresce em volta. */
    size?: MenubarSize
    /** No telefone, `sheet` troca a fileira por um botão que abre a folha. */
    mobile?: "bar" | "sheet"
    /** O rótulo desse botão. */
    mobileLabel?: string
    /** A busca de comandos ao lado da fileira; uma string é o placeholder. */
    search?: boolean | string
  }) {
  const barId = React.useId()
  const isMobile = useIsMobile()
  const folha = mobile === "sheet" && isMobile
  const raizRef = React.useRef<HTMLDivElement | null>(null)

  // Os menus não são modais: a página rola com um aberto, e ele fecha.
  const [value, setValueBase] = useCloseOnScroll({
    value: valueProp,
    defaultValue,
    onChange: onValueChange,
    closed: "",
  })

  const gatilhosRef = React.useRef(new Map<string, { el: HTMLElement; mnemonic?: string }>())
  const [rotulos, setRotulos] = React.useState<Record<string, string>>({})
  const registrarGatilho = React.useCallback(
    (menu: string, el: HTMLElement | null, mnemonic?: string, rotulo?: string) => {
      if (el) gatilhosRef.current.set(menu, { el, mnemonic })
      else gatilhosRef.current.delete(menu)
      if (rotulo) {
        setRotulos((r) => (r[menu] === rotulo ? r : { ...r, [menu]: rotulo }))
      }
    },
    []
  )

  const [troca, setTroca] = React.useState<{ ate: string; dx: number } | null>(null)
  const setValue = React.useCallback(
    (proximo: string) => {
      const antes = gatilhosRef.current.get(value)?.el
      const depois = gatilhosRef.current.get(proximo)?.el
      // Trocar de um aberto para outro é deslizar, não fechar e abrir.
      if (value && proximo && value !== proximo && antes && depois) {
        setTroca({ ate: proximo, dx: antes.offsetLeft - depois.offsetLeft })
      } else {
        setTroca(null)
      }
      setValueBase(proximo)
    },
    [value, setValueBase]
  )

  const [hover, setHover] = React.useState<string | null>(null)
  const [foco, setFoco] = React.useState<string | null>(null)
  const realce = value || hover || foco || null

  // O índice: as linhas de todos os menus, abertos ou não.
  const [comandos, setComandos] = React.useState<Comando[]>([])
  const registrar = React.useCallback((c: Comando) => {
    setComandos((lista) => {
      const i = lista.findIndex((x) => x.id === c.id)
      if (i < 0) return [...lista, c]
      const nova = lista.slice()
      nova[i] = c
      return nova
    })
    return () => setComandos((lista) => lista.filter((x) => x.id !== c.id))
  }, [])

  // F10 foca a barra (o atalho de toda barra de menus); Alt mostra as letras
  // de acesso, e Alt + a letra abre o menu. `code`, e não `key`: no Mac,
  // Alt+A escreve "å".
  const [alt, setAlt] = React.useState(false)
  const comandosRef = React.useRef(comandos)
  React.useEffect(() => {
    comandosRef.current = comandos
  })
  React.useEffect(() => {
    if (folha) return
    const descer = (e: KeyboardEvent) => {
      if (e.key === "Alt") {
        setAlt(true)
        return
      }
      // Com várias barras na tela, a primeira visível atende e as outras
      // respeitam; uma escondida (`hidden`, a de desktop no telefone) não.
      if (e.defaultPrevented || !raizRef.current?.offsetParent) return
      if (e.key === "F10" && !e.shiftKey) {
        const primeiro = raizRef.current?.querySelector<HTMLElement>("[data-slot=menubar-trigger]")
        if (primeiro) {
          e.preventDefault()
          primeiro.focus()
        }
        return
      }
      if (e.altKey && !e.metaKey && !e.ctrlKey && /^Key[A-Z]$/.test(e.code)) {
        const letra = e.code.slice(3).toLowerCase()
        for (const [menu, g] of gatilhosRef.current) {
          if (g.mnemonic?.toLowerCase() === letra) {
            e.preventDefault()
            setAlt(false)
            g.el.focus()
            setValue(menu)
            return
          }
        }
      }
      // A tecla de cada linha funciona com a barra na tela, e não só com o
      // menu aberto — dentro de um campo, só com modificadora.
      if (e.repeat) return
      const editavel = isEditableTarget(e.target)
      for (const c of comandosRef.current) {
        if (!c.shortcut || c.disabled) continue
        if (editavel && !/(mod|alt)\+/i.test(c.shortcut)) continue
        if (matchShortcut(c.shortcut, e)) {
          e.preventDefault()
          c.executar()
          return
        }
      }
    }
    const subir = (e: KeyboardEvent) => {
      if (e.key === "Alt") setAlt(false)
    }
    const perder = () => setAlt(false)
    document.addEventListener("keydown", descer)
    document.addEventListener("keyup", subir)
    window.addEventListener("blur", perder)
    return () => {
      document.removeEventListener("keydown", descer)
      document.removeEventListener("keyup", subir)
      window.removeEventListener("blur", perder)
    }
  }, [folha, setValue])

  const ctx = React.useMemo<MenubarContextValue>(
    () => ({
      size: size ?? "md",
      variant: variant ?? "floating",
      barId,
      realce,
      setHover,
      setFoco,
      aberto: value,
      abrir: setValue,
      fechar: () => setValue(""),
      troca,
      alt,
      registrarGatilho,
      rotulos,
      comandos,
      registrar,
    }),
    [size, variant, barId, realce, value, setValue, troca, alt, registrarGatilho, rotulos, comandos, registrar]
  )

  const comBusca = Boolean(search) && !folha
  const fileira = (classe: string | null | undefined) => (
    <MenubarPrimitive.Root
      ref={raizRef}
      data-slot="menubar"
      value={value}
      onValueChange={setValue}
      data-variant={variant}
      data-size={size}
      onPointerLeave={() => setHover(null)}
      // Na folha a fileira não aparece, mas fica montada: é ela que mantém o
      // índice de onde a folha lê as linhas.
      className={cn(menubarVariants({ variant }), folha && "hidden", classe)}
      {...props}
    >
      {children}
    </MenubarPrimitive.Root>
  )

  return (
    <MenubarContext.Provider value={ctx}>
      {folha ? <MenubarFolha label={mobileLabel} /> : null}
      <LayoutGroup id={barId}>
        {comBusca ? (
          // Com a busca, o `className` vai ao invólucro: a fileira presa dentro dele só
          // grudaria na própria altura. `items-stretch` dá à busca a altura da fileira.
          <div
            data-slot="menubar-shell"
            className={cn("flex items-stretch gap-2", className)}
          >
            {fileira(null)}
            <MenubarSearch
              placeholder={typeof search === "string" ? search : undefined}
            />
          </div>
        ) : (
          fileira(className)
        )}
      </LayoutGroup>
    </MenubarContext.Provider>
  )
}

function MenubarMenu({
  value: valueProp,
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Menu>) {
  const auto = React.useId()
  const value = valueProp ?? auto
  return (
    <MenubarMenuContext.Provider value={value}>
      <MenubarPrimitive.Menu data-slot="menubar-menu" value={value} {...props} />
    </MenubarMenuContext.Provider>
  )
}

function MenubarGroup({
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Group>) {
  const indice = React.useContext(IndiceContext)
  if (indice) return <>{props.children}</>
  return <MenubarPrimitive.Group data-slot="menubar-group" {...props} />
}

function MenubarPortal({
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Portal>) {
  return <MenubarPrimitive.Portal data-slot="menubar-portal" {...props} />
}

function MenubarRadioGroup({
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.RadioGroup>) {
  const indice = React.useContext(IndiceContext)
  if (indice) {
    return (
      <IndiceRadioContext.Provider
        value={{ value: props.value, onValueChange: props.onValueChange }}
      >
        {props.children}
      </IndiceRadioContext.Provider>
    )
  }
  return (
    <MenubarPrimitive.RadioGroup data-slot="menubar-radio-group" {...props} />
  )
}

/** O texto de um nó, para o índice: as folhas de texto dos filhos. */
function textoDe(no: React.ReactNode): string {
  if (no == null || typeof no === "boolean") return ""
  if (typeof no === "string" || typeof no === "number") return String(no)
  if (Array.isArray(no)) return no.map(textoDe).join("").trim()
  if (React.isValidElement<{ children?: React.ReactNode }>(no)) {
    return textoDe(no.props.children)
  }
  return ""
}

/**
 * O gatilho: `icon`, `count` (sem ele, as caixas marcadas do menu), `chevron`
 * e `mnemonic` (letra de acesso, sublinhada com o Alt).
 */
function MenubarTrigger({
  className,
  children,
  icon,
  count,
  chevron = false,
  mnemonic,
  onPointerEnter,
  onFocus,
  onBlur,
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Trigger> & {
  icon?: React.ReactNode
  /** A contagem no gatilho. Sem ela, conta as caixas marcadas do menu. */
  count?: number
  chevron?: boolean
  /** A letra de Alt + letra. Ela tem de estar no rótulo. */
  mnemonic?: string
}) {
  const bar = useMenubar()
  const menu = React.useContext(MenubarMenuContext)
  const reduzido = useReducedMotion()
  const rotulo = textoDe(children)
  const registrarGatilho = bar.registrarGatilho

  const ref = React.useCallback(
    (el: HTMLButtonElement | null) => registrarGatilho(menu, el, mnemonic, rotulo),
    [registrarGatilho, menu, mnemonic, rotulo]
  )

  const marcadas = bar.comandos.filter(
    (c) => c.menu === menu && c.tipo === "checkbox" && c.marcado
  ).length
  const contagem = count ?? (marcadas > 0 ? marcadas : undefined)
  const aceso = bar.realce === menu

  // A letra de acesso sublinhada só com o Alt descido, como no Windows: o
  // traço o tempo todo seria ruído para quem não usa o teclado.
  let rotuloDesenhado: React.ReactNode = children
  if (mnemonic && typeof children === "string") {
    const i = children.toLowerCase().indexOf(mnemonic.toLowerCase())
    if (i >= 0) {
      // Um `<span>` só: solto, cada pedaço do texto vira item do flex e o `gap` parte o rótulo.
      rotuloDesenhado = (
        <span>
          {children.slice(0, i)}
          <span className={cn(bar.alt && "underline underline-offset-2")}>
            {children[i]}
          </span>
          {children.slice(i + 1)}
        </span>
      )
    }
  }

  return (
    <MenubarPrimitive.Trigger
      ref={ref}
      data-slot="menubar-trigger"
      data-aceso={aceso ? "" : undefined}
      aria-keyshortcuts={mnemonic ? ariaShortcut(`alt+${mnemonic}`) : undefined}
      className={cn(
        menubarTriggerVariants({ variant: bar.variant, size: bar.size }),
        className
      )}
      onPointerEnter={(e) => {
        // O realce que viaja segue o cursor; o toque o deixaria preso.
        if (ehCursor(e)) bar.setHover(menu)
        onPointerEnter?.(e)
      }}
      onFocus={(e) => {
        bar.setFoco(menu)
        onFocus?.(e)
      }}
      onBlur={(e) => {
        bar.setFoco(null)
        onBlur?.(e)
      }}
      {...props}
    >
      {aceso ? (
        <motion.span
          layoutId={`${bar.barId}-realce`}
          aria-hidden
          data-slot="menubar-highlight"
          transition={reduzido ? { duration: 0 } : MOLA_DO_REALCE}
          className={cn(
            "pointer-events-none absolute inset-0 -z-10 rounded-[inherit]",
            realceClassName[bar.variant]
          )}
        />
      ) : null}
      {icon}
      {rotuloDesenhado}
      {contagem != null ? (
        <Badge
          variant="contrast"
          size="xs"
          className="nums"
          aria-label={`${contagem} ${contagem === 1 ? "marcada" : "marcadas"}`}
        >
          {contagem}
        </Badge>
      ) : null}
      {chevron ? (
        <ChevronDownIcon
          aria-hidden
          className="size-3.5 opacity-70 transition-transform duration-(--duration-base) ease-(--ease-out) group-data-[state=open]/menubar-trigger:rotate-180"
        />
      ) : null}
    </MenubarPrimitive.Trigger>
  )
}

/**
 * O painel. `title` e `description` são o cabeçalho; sem `description`, ela
 * diz os rádios marcados ("Vencimento ↑").
 */
function MenubarContent({
  className,
  children,
  align = "start",
  alignOffset = -4,
  sideOffset = 8,
  collisionPadding = ANCHORED_COLLISION_PADDING,
  title,
  description,
  style,
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Content> & {
  title?: React.ReactNode
  description?: React.ReactNode
}) {
  const bar = useMenubar()
  const menu = React.useContext(MenubarMenuContext)
  const dissolver = useScrollFade({ arrows: true })
  const tituloId = React.useId()

  const escolhidos = bar.comandos
    .filter((c) => c.menu === menu && c.tipo === "radio" && c.marcado)
    .map((c) => c.texto)
  const legenda = description ?? (escolhidos.length ? escolhidos.join(" · ") : null)

  const chegando = bar.troca?.ate === menu
  const saindoNaTroca = bar.troca != null && bar.troca.ate !== menu

  return (
    <>
      {/* O índice: os filhos de novo, sem pintar — ver o cabeçalho do arquivo. */}
      <IndiceContext.Provider value={true}>{children}</IndiceContext.Provider>
      <MenubarPortal>
        <MenubarPrimitive.Content
          data-slot="menubar-content"
          align={align}
          alignOffset={alignOffset}
          sideOffset={sideOffset}
          collisionPadding={collisionPadding}
          aria-labelledby={title ? tituloId : undefined}
          data-trocando={saindoNaTroca ? "" : undefined}
          className={cn(
            menuSurfaceClassName,
            MENUBAR_POPPER,
            // Brota do gatilho no gesto do menu (`@utility menu-sprout`); ao trocar de menu
            // o que sai some na hora e o que chega desliza de lado (o `style` abaixo).
            "menu-sprout data-[trocando]:data-closed:animate-none",
            className
          )}
          style={
            chegando
              ? ({
                  "--tw-enter-translate-x": `${bar.troca!.dx}px`,
                  "--tw-enter-translate-y": "0px",
                  "--tw-enter-scale": "1",
                  "--tw-enter-opacity": "0.4",
                  ...style,
                } as React.CSSProperties)
              : style
          }
          {...props}
        >
          {title ? (
            <div
              data-slot="menubar-content-header"
              className="flex shrink-0 flex-col px-3 pt-2.5 pb-1.5"
            >
              <p id={tituloId} className="text-sm font-medium leading-snug">
                {title}
              </p>
              {legenda ? (
                <p className="text-xs leading-snug text-muted-foreground">{legenda}</p>
              ) : null}
            </div>
          ) : null}
          <div
            ref={dissolver}
            data-slot="menubar-viewport"
            className={cn(
              menuViewportClassName,
              scrollFadeViewportClassName,
              "menubar-reveal"
            )}
          >
            {children}
          </div>
          <ScrollFadeArrows />
        </MenubarPrimitive.Content>
      </MenubarPortal>
    </>
  )
}

/**
 * `confirm` arma no primeiro toque (3s); um `onSelect` que devolve `Promise`
 * mantém o menu aberto, com a linha ocupada, até assentar.
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
  const bar = React.useContext(MenubarContext)
  const [armado, setArmado] = React.useState(false)
  const [carregando, setCarregando] = React.useState(false)

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
        bar?.fechar()
      })
      return false
    }
    return true
  }

  return { armado, carregando: carregando || pending, escolher }
}

/**
 * Num menu em que alguma linha tem ícone, as que não têm recuam o que ele
 * ocupa (16 + 6), e o texto de todas cai na mesma coluna — submenu e rótulo
 * de grupo inclusive. Sem `inset` à mão.
 */
const RECUO_SEM_ICONE =
  "[[data-slot=menubar-viewport]:has([data-slot=menubar-item-icon])_&]:ps-7.5"

/** Registra a linha no índice, com o que a barra precisa dela. */
function useRegistro(c: Omit<Comando, "id" | "menu"> | null) {
  const bar = React.useContext(MenubarContext)
  const menu = React.useContext(MenubarMenuContext)
  const id = React.useId()
  const executarRef = React.useRef(c?.executar)
  React.useEffect(() => {
    executarRef.current = c?.executar
  })
  const registrar = bar?.registrar
  const texto = c?.texto
  const shortcut = c?.shortcut
  const disabled = c?.disabled
  const tipo = c?.tipo
  const marcado = c?.marcado
  const variant = c?.variant
  React.useEffect(() => {
    if (!registrar || texto == null || tipo == null) return
    return registrar({
      id,
      menu,
      texto,
      shortcut,
      disabled,
      tipo,
      marcado,
      variant,
      executar: () => executarRef.current?.(),
    })
  }, [registrar, id, menu, texto, shortcut, disabled, tipo, marcado, variant])
}

function MenubarItem({
  className,
  inset,
  variant = "default",
  icon,
  shortcut,
  description,
  confirm,
  pending = false,
  onSelect,
  disabled,
  textValue,
  children,
  ...props
}: Omit<React.ComponentProps<typeof MenubarPrimitive.Item>, "onSelect"> & {
  inset?: boolean
  variant?: "default" | "destructive"
  /** O ícone à esquerda. Num menu com ícones, as linhas sem ele recuam sozinhas. */
  icon?: React.ReactNode
  /** A tecla (na grafia do `Kbd`), desenhada e ligada enquanto a barra está na tela. */
  shortcut?: string
  /** A segunda linha. */
  description?: React.ReactNode
  /** O primeiro toque só arma. `true` ou o texto da confirmação. */
  confirm?: boolean | string
  /** A linha carrega, e o menu espera. */
  pending?: boolean
  onSelect?: (event: Event) => void | Promise<unknown>
}) {
  const indice = React.useContext(IndiceContext)
  const texto = textValue ?? textoDe(children)
  const { armado, carregando, escolher } = useEscolha({ confirm, onSelect, pending })
  useRegistro(
    indice
      ? {
          texto,
          shortcut,
          disabled,
          tipo: "item",
          variant,
          // Pela tecla, pela busca ou pela folha não há segundo toque: quem
          // chega por eles já escolheu de propósito.
          executar: () => void onSelect?.(new Event("select")),
        }
      : null
  )
  if (indice) return null

  const textoConfirmacao =
    typeof confirm === "string" ? confirm : "toque de novo para confirmar"

  return (
    <MenubarPrimitive.Item
      data-slot="menubar-item"
      data-inset={inset}
      data-variant={variant}
      data-armed={armado ? "" : undefined}
      aria-busy={carregando || undefined}
      aria-keyshortcuts={shortcut ? ariaShortcut(shortcut) : undefined}
      disabled={disabled}
      textValue={texto}
      onSelect={(e) => {
        if (!escolher(e)) e.preventDefault()
      }}
      className={cn(
        menuItemClassName,
        description && "grid grid-cols-[auto_1fr_auto] items-start gap-x-1.5 gap-y-0",
        // Num menu com ícones, a linha sem ícone recua o que o ícone ocupa.
        !icon && RECUO_SEM_ICONE,
        "data-armed:bg-destructive/10 data-armed:text-destructive",
        className
      )}
      {...props}
    >
      {icon ? (
        <span data-slot="menubar-item-icon" className="flex shrink-0 [&_svg]:size-4">
          {icon}
        </span>
      ) : description ? (
        <span />
      ) : null}
      <span className="flex min-w-0 flex-col">
        <span className="truncate">{armado ? textoConfirmacao : children}</span>
        {description ? (
          <span className="text-xs leading-snug text-muted-foreground">
            {description}
          </span>
        ) : null}
      </span>
      {carregando ? (
        <Spinner className="ms-auto" />
      ) : shortcut ? (
        <span className={cn(menuShortcutClassName, "ms-auto")}>
          <Kbd keys={shortcut} />
        </span>
      ) : null}
    </MenubarPrimitive.Item>
  )
}

/** A caixa não fecha o menu: marcar uma é para marcar outra. */
function MenubarCheckboxItem({
  className,
  children,
  checked,
  inset,
  onSelect,
  onCheckedChange,
  closeOnSelect = false,
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.CheckboxItem> & {
  inset?: boolean
  closeOnSelect?: boolean
}) {
  const indice = React.useContext(IndiceContext)
  useRegistro(
    indice
      ? {
          texto: textoDe(children),
          disabled: props.disabled,
          tipo: "checkbox",
          marcado: checked === true,
          executar: () => onCheckedChange?.(!(checked === true)),
        }
      : null
  )
  if (indice) return null
  return (
    <MenubarPrimitive.CheckboxItem
      data-slot="menubar-checkbox-item"
      data-inset={inset}
      className={cn(menuIndicatorItemClassName, className)}
      checked={checked}
      onCheckedChange={onCheckedChange}
      onSelect={(e) => {
        onSelect?.(e)
        if (!closeOnSelect) e.preventDefault()
      }}
      {...props}
    >
      <span className={menuIndicatorSlotClassName}>
        <MenubarPrimitive.ItemIndicator>
          {/* O tique estala na mola, como na referência. */}
          <CheckIcon
            aria-hidden
            className="animate-in zoom-in-50 fade-in-0 animation-duration-(--duration-spring) ease-(--ease-spring)"
          />
        </MenubarPrimitive.ItemIndicator>
      </span>
      {children}
    </MenubarPrimitive.CheckboxItem>
  )
}

function MenubarRadioItem({
  className,
  children,
  inset,
  value,
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.RadioItem> & {
  inset?: boolean
}) {
  const indice = React.useContext(IndiceContext)
  const radio = React.useContext(IndiceRadioContext)
  useRegistro(
    indice
      ? {
          texto: textoDe(children),
          disabled: props.disabled,
          tipo: "radio",
          marcado: radio?.value === value,
          executar: () => radio?.onValueChange?.(value),
        }
      : null
  )
  if (indice) return null
  return (
    <MenubarPrimitive.RadioItem
      data-slot="menubar-radio-item"
      data-inset={inset}
      value={value}
      className={cn(menuIndicatorItemClassName, className)}
      {...props}
    >
      <span className={menuIndicatorSlotClassName}>
        <MenubarPrimitive.ItemIndicator>
          {/* Um ponto, e não o tique da caixa — ver `RadioGroup`. */}
          <span className="block size-2 animate-in rounded-full bg-current zoom-in-50 fade-in-0 animation-duration-(--duration-spring) ease-(--ease-spring)" />
        </MenubarPrimitive.ItemIndicator>
      </span>
      {children}
    </MenubarPrimitive.RadioItem>
  )
}

function MenubarLabel({
  className,
  inset,
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Label> & {
  inset?: boolean
}) {
  const indice = React.useContext(IndiceContext)
  if (indice) return null
  return (
    <MenubarPrimitive.Label
      data-slot="menubar-label"
      data-inset={inset}
      className={cn(menuLabelClassName, RECUO_SEM_ICONE, className)}
      {...props}
    />
  )
}

function MenubarSeparator({
  className,
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Separator>) {
  const indice = React.useContext(IndiceContext)
  if (indice) return null
  return (
    <MenubarPrimitive.Separator
      data-slot="menubar-separator"
      className={cn(menuSeparatorClassName, className)}
      {...props}
    />
  )
}

/** A tecla escrita à mão. Prefira `MenubarItem shortcut`, que desenha e liga. */
function MenubarShortcut({
  className,
  ...props
}: React.ComponentProps<"span">) {
  const indice = React.useContext(IndiceContext)
  if (indice) return null
  return (
    <span
      data-slot="menubar-shortcut"
      className={cn(menuShortcutClassName, className)}
      {...props}
    />
  )
}

function MenubarSub({
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Sub>) {
  const indice = React.useContext(IndiceContext)
  if (indice) return <>{props.children}</>
  return <MenubarPrimitive.Sub data-slot="menubar-sub" {...props} />
}

function MenubarSubTrigger({
  className,
  inset,
  children,
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.SubTrigger> & {
  inset?: boolean
}) {
  const indice = React.useContext(IndiceContext)
  if (indice) return null
  return (
    <MenubarPrimitive.SubTrigger
      data-slot="menubar-sub-trigger"
      data-inset={inset}
      className={cn(menuSubTriggerClassName, RECUO_SEM_ICONE, className)}
      {...props}
    >
      {children}
      <ChevronRightIcon aria-hidden className="ml-auto" />
    </MenubarPrimitive.SubTrigger>
  )
}

function MenubarSubContent({
  className,
  children,
  collisionPadding = ANCHORED_COLLISION_PADDING,
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.SubContent>) {
  const indice = React.useContext(IndiceContext)
  const dissolver = useScrollFade({ arrows: true })
  if (indice) return <>{children}</>
  return (
    // No portal: dentro do menu, o `backdrop-filter` vira o bloco de contenção do
    // `fixed` do popper e o `overflow-hidden` recorta o submenu.
    <MenubarPrimitive.Portal>
      <MenubarPrimitive.SubContent
        data-slot="menubar-sub-content"
        collisionPadding={collisionPadding}
        className={cn(
          menuSubSurfaceClassName,
          MENUBAR_POPPER,
          // O submenu brota do item, no gesto do menu.
          "menu-sprout",
          className
        )}
        {...props}
      >
        <div
          ref={dissolver}
          data-slot="menubar-sub-viewport"
          className={cn(menuViewportClassName, scrollFadeViewportClassName)}
        >
          {children}
        </div>
        <ScrollFadeArrows />
      </MenubarPrimitive.SubContent>
    </MenubarPrimitive.Portal>
  )
}

/**
 * A busca de comandos: procura entre as linhas de todos os menus, pelo índice,
 * e executa a escolhida. Mora ao lado da fileira (`role="menubar"` só tem gatilhos).
 */
function MenubarSearch({
  placeholder = "Buscar comandos…",
  className,
}: {
  placeholder?: string
  className?: string
}) {
  const bar = useMenubar()
  const [busca, setBusca] = React.useState("")
  const listaRef = React.useRef<HTMLDivElement | null>(null)

  const achados = busca.trim()
    ? bar.comandos
        .filter((c) => !c.disabled)
        .map((c) => ({ c, nota: commandFilter(c.texto, busca) }))
        .filter((x) => x.nota > 0)
        .sort((a, b) => b.nota - a.nota)
        .slice(0, 8)
        .map((x) => x.c)
    : []

  const executar = (c: Comando) => {
    c.executar()
    setBusca("")
  }

  return (
    <Popover open={busca.trim() !== ""} onOpenChange={(o) => !o && setBusca("")}>
      <PopoverAnchor asChild>
        <div className={cn("flex w-56", className)} data-slot="menubar-search">
          {/* A altura é a da fileira (o invólucro estica) e o degrau é o do gatilho. */}
          <SearchInput
            size={bar.size}
            className="h-full"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            onClear={() => setBusca("")}
            placeholder={placeholder}
            aria-label={placeholder}
            onKeyDown={(e) => {
              if (e.key === "Enter" && achados[0]) {
                e.preventDefault()
                executar(achados[0])
              }
              if (e.key === "ArrowDown") {
                e.preventDefault()
                listaRef.current?.querySelector<HTMLElement>("button")?.focus()
              }
            }}
          />
        </div>
      </PopoverAnchor>
      <PopoverContent
        align="start"
        padding="none"
        className="w-(--radix-popover-trigger-width) min-w-64"
        // O foco fica no campo, onde se digita.
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div
          ref={listaRef}
          role="listbox"
          aria-label="Comandos encontrados"
          className="flex flex-col p-2"
          onKeyDown={(e) => {
            const botoes = Array.from(
              listaRef.current?.querySelectorAll<HTMLElement>("button") ?? []
            )
            const i = botoes.indexOf(document.activeElement as HTMLElement)
            if (e.key === "ArrowDown") {
              e.preventDefault()
              botoes[Math.min(botoes.length - 1, i + 1)]?.focus()
            }
            if (e.key === "ArrowUp") {
              e.preventDefault()
              botoes[Math.max(0, i - 1)]?.focus()
            }
          }}
        >
          {achados.length ? (
            achados.map((c) => (
              <button
                key={c.id}
                type="button"
                role="option"
                aria-selected={false}
                data-variant={c.variant}
                onClick={() => executar(c)}
                className={cn(menuItemClassName, "w-full text-left focus:bg-foreground/9")}
              >
                <span className="flex min-w-0 flex-col">
                  <span className="truncate">{c.texto}</span>
                  <span className="text-xs text-muted-foreground">
                    {bar.rotulos[c.menu] ?? ""}
                  </span>
                </span>
                {c.marcado ? <CheckIcon aria-hidden className="ms-auto" /> : null}
                {c.shortcut ? (
                  <span className={cn(menuShortcutClassName, "ms-auto")}>
                    <Kbd keys={c.shortcut} />
                  </span>
                ) : null}
              </button>
            ))
          ) : (
            <p className="px-2 py-6 text-center text-sm text-muted-foreground">
              Nenhum comando com esse nome.
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

/**
 * No telefone (`mobile="sheet"`) a fileira não cabe em 375px: a folha lista o
 * índice agrupado por menu, e cada linha executa e fecha.
 */
function MenubarFolha({ label }: { label: string }) {
  const bar = useMenubar()
  const [aberta, setAberta] = React.useState(false)
  const menus = Array.from(new Set(bar.comandos.map((c) => c.menu)))

  return (
    <Drawer open={aberta} onOpenChange={setAberta}>
      <DrawerTrigger asChild>
        <Button variant="outline" size="lg" data-slot="menubar-sheet-trigger">
          <Bars3Icon aria-hidden className="size-5" />
          {label}
        </Button>
      </DrawerTrigger>
      <DrawerContent data-slot="menubar-sheet">
        <DialogHeader className="sr-only">
          <DialogTitle>{label}</DialogTitle>
          <DialogDescription>Os comandos desta barra</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col px-2">
          {menus.map((menu) => (
            <div key={menu} role="group" aria-label={bar.rotulos[menu]}>
              <p className="px-3 pt-3 pb-1 text-xs font-medium text-muted-foreground">
                {bar.rotulos[menu]}
              </p>
              {bar.comandos
                .filter((c) => c.menu === menu)
                .map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    disabled={c.disabled}
                    data-variant={c.variant}
                    role={c.tipo === "checkbox" ? "menuitemcheckbox" : c.tipo === "radio" ? "menuitemradio" : undefined}
                    aria-checked={c.tipo === "item" ? undefined : c.marcado === true}
                    className={drawerActionClassName}
                    onClick={() => {
                      c.executar()
                      // A caixa não fecha a folha.
                      if (c.tipo !== "checkbox") setAberta(false)
                    }}
                  >
                    <span className="flex-1">{c.texto}</span>
                    {c.marcado ? (
                      <CheckMiniIcon aria-hidden className="size-5 !text-foreground" />
                    ) : null}
                  </button>
                ))}
            </div>
          ))}
        </div>
        <DrawerCancel />
      </DrawerContent>
    </Drawer>
  )
}

export {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarGroup,
  MenubarItem,
  MenubarLabel,
  MenubarMenu,
  MenubarPortal,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
  menubarTriggerVariants,
  menubarVariants,
}
