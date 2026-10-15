"use client"

import * as React from "react"
import { AdjustmentsHorizontalIcon, XMarkIcon } from "@heroicons/react/16/solid"

import { Badge } from "@/components/ui/badge"
import { Button, ButtonSizeContext } from "@/components/ui/button"
import { SearchInput } from "@/components/ui/search-input"
import { useToolbarKeyboard } from "@/hooks/use-toolbar-keyboard"
import { topBarBottom } from "@/lib/top-bar-bottom"
import { numberBR } from "@/lib/formatters"
import { barSurfaceClassName } from "@/lib/glass-classes"
import { proximoEscondido } from "@/lib/hide-on-scroll"
import { limparExcesso, quemSai } from "@/lib/overflow"
import { OverflowMenu, type ItemNoExcesso } from "@/lib/overflow-menu"
import { cn } from "@/lib/utils"

/**
 * A linha de ações e filtros acima de uma tabela ou lista.
 * `role="toolbar"` só com o teclado dele: o papel é um contrato de teclado (o
 * grupo ocupa uma parada de Tab e as setas andam entre os controles). Sem
 * `keyboard`, cada controle é tabulável por conta própria e a barra é uma linha
 * de layout; o papel anunciaria um widget que não existe.
 * O telefone troca de conteúdo, não quebra: `ToolbarButton collapse` substitui
 * as duas árvores (`md:hidden` + `hidden md:flex`) num nó só (o rótulo vira
 * `sr-only` abaixo de `md` e o botão fica quadrado). `ToolbarRow` é a linha do
 * telefone que se dissolve.
 * A altura é a da barra: a raiz publica `--toolbar-control` (`size`: sm 28 · md
 * 32 · **lg 36**, e 40 com o ponteiro grosso) e os controles filhos diretos de uma
 * peça da barra a leem sozinhos (`Button` de ícone em `size`, `SelectTrigger`,
 * `ComboboxTrigger`, `SearchInput`). O seletor é de filho direto porque o × de um
 * `SearchInput` e o de uma ficha também são `Button`, e um descendente os
 * esticaria a 36. Especificidade (0,4,0): vence a altura do controle sem `!`.
 * `toolbarControlClassName` é para o controle embrulhado num `<div>`.
 */

/**
 * Os degraus, com os nomes da escada do sistema (xs 24 … xl 40). `fine`/`coarse`
 * são o `lg` e o piso do dedo.
 */
export const TOOLBAR_CONTROL_HEIGHTS = { fine: 36, coarse: 40 } as const
export const TOOLBAR_SIZES = { sm: 28, md: 32, lg: 36 } as const
type ToolbarSize = keyof typeof TOOLBAR_SIZES

/**
 * A raiz publica a densidade e não declara altura. A pergunta do piso é o dedo,
 * não a largura (`pointer-coarse:`): com `md:`, um desktop estreito ganharia 40px sem pedir.
 */
const toolbarClassName = [
  "flex min-w-0 flex-wrap items-center gap-2 md:gap-3",
  "[--toolbar-control:--spacing(9)] pointer-coarse:[--toolbar-control:--spacing(10)]",
].join(" ")

const TOOLBAR_SIZE_CLASS: Record<ToolbarSize, string> = {
  sm: "[--toolbar-control:--spacing(7)]",
  md: "[--toolbar-control:--spacing(8)]",
  lg: "",
}

/**
 * O controle filho direto de uma peça da barra lê a altura. Escrito por extenso,
 * cinco vezes: o Tailwind lê o fonte como texto.
 */
const toolbarControlsClassName = [
  "[:is(&,&_[data-slot=toolbar-filters],&_[data-slot=toolbar-actions],&_[data-slot=toolbar-row],&_[data-slot=button-group])>[data-slot=button]:not([data-size^=icon])]:h-(--toolbar-control)",
  "[:is(&,&_[data-slot=toolbar-filters],&_[data-slot=toolbar-actions],&_[data-slot=toolbar-row],&_[data-slot=button-group])>[data-slot=button][data-size^=icon]]:size-(--toolbar-control)",
  "[:is(&,&_[data-slot=toolbar-filters],&_[data-slot=toolbar-actions],&_[data-slot=toolbar-row],&_[data-slot=button-group])>[data-slot=select-trigger]]:h-(--toolbar-control)",
  "[:is(&,&_[data-slot=toolbar-filters],&_[data-slot=toolbar-actions],&_[data-slot=toolbar-row],&_[data-slot=button-group])>[data-slot=combobox-trigger]]:h-(--toolbar-control)",
  "[:is(&,&_[data-slot=toolbar-filters],&_[data-slot=toolbar-actions],&_[data-slot=toolbar-row],&_[data-slot=button-group])>[data-slot=search-input]]:h-(--toolbar-control)",
].join(" ")

/**
 * Para o controle que a tela embrulhou num `<div>` (fora do alcance do seletor
 * de filho direto). Só vale dentro de um `Toolbar`. Chega por `className` e não
 * por `in-*`/`group-*`, que compilam com `:where()` e perderiam para o `h-8` do
 * controle; por `className` o `twMerge` remove o degrau.
 */
export const toolbarControlClassName = "h-(--toolbar-control)"

/** O mesmo, para botão de ícone: `size-*` governa os dois eixos. */
export const toolbarIconControlClassName = "size-(--toolbar-control)"

/**
 * Presa: logo abaixo da barra do topo, com 8px de folga (`--top-bar-bottom`, do
 * `globals.css`; `--toolbar-top` zera num contêiner que rola sem a barra). Some
 * ao rolar para baixo, só no telefone (onde a altura é cara), e volta ao subir; o
 * deslocamento é a altura mais 16px, para a placa (que sobra 8px de cada lado)
 * sumir inteira atrás da barra do topo.
 */
const toolbarStickyClassName = [
  "sticky top-[calc(var(--toolbar-top,var(--top-bar-bottom))+--spacing(2))] z-(--z-sticky) isolate",
  "transition-[translate,opacity] duration-(--duration-base) ease-(--ease-out)",
  "max-md:data-hidden:-translate-y-[calc(100%+--spacing(4))] max-md:data-hidden:opacity-0",
].join(" ")

/**
 * A placa da barra presa: só existe presa, na tinta de barra (a do `TopBar`) e
 * com o fio de baixo. Sobra 8px acima e abaixo da fileira, para a altura não
 * mudar ao prender (padding mudaria, e a página pularia), e atravessa
 * `--toolbar-bleed` de cada lado (a calha da página, de quem monta a tela).
 */
const toolbarPlateClassName = cn(
  barSurfaceClassName,
  "pointer-events-none absolute -inset-y-2 -inset-x-(--toolbar-bleed,0px) -z-1 rounded-t-(--toolbar-plate-r,0px) border-b border-border opacity-0",
  "transition-opacity duration-(--duration-base) ease-(--ease-out) group-data-stuck/toolbar:opacity-100"
)

/**
 * A linha do telefone que se dissolve na barra a partir de `md` (`display:
 * contents`): os filhos sobem a itens de flex da própria barra. Em `md` a caixa
 * não existe (o `gap` e o `flex-1` dela deixam de valer, e `role`/`aria-label`
 * confundiriam a árvore); nomeie com `ToolbarFilters`.
 */
const toolbarRowClassName = "flex min-w-0 items-center gap-2 md:contents"

/**
 * O ponto de "há filtro ativo", só para botão sem rótulo (com rótulo a marca é a
 * contagem). `top-1 right-1` saem de medição: a 1 ele invade o ícone em 1px e
 * fica a 4,59px da curva do canto. `bg-primary-accent`: um ponto de 8px precisa
 * ser visto contra a página. `aria-hidden`: o estado mora no nome do controle.
 */
const toolbarFilterIndicatorClassName =
  "pointer-events-none absolute top-1 right-1 size-2 rounded-full bg-primary-accent"

type ToolbarProps = React.ComponentProps<"div"> & {
  /** A altura dos controles: sm 28 · md 32 · lg 36 (40 no dedo, nos três). */
  size?: ToolbarSize
  /** Prende abaixo da barra do topo e ganha a placa só quando presa. `"hide"` também some ao rolar para baixo, no telefone. */
  sticky?: boolean | "hide"
  /** O teclado de toolbar: `role="toolbar"`, uma parada de Tab e setas entre os controles. */
  keyboard?: boolean
}

function Toolbar({
  className,
  size = "lg",
  sticky = false,
  keyboard = false,
  children,
  ref,
  ...props
}: ToolbarProps) {
  const raiz = React.useRef<HTMLDivElement>(null)
  usePresa(raiz, Boolean(sticky), sticky === "hide")
  // O foco itinerante mora em `hooks/use-toolbar-keyboard`: o `FilterBar` é o
  // outro `role="toolbar"` do sistema.
  useToolbarKeyboard(raiz, keyboard)

  const barra = (
    <div
      ref={(no) => {
        raiz.current = no
        if (typeof ref === "function") ref(no)
        else if (ref) ref.current = no
      }}
      data-slot="toolbar"
      role={keyboard ? "toolbar" : undefined}
      aria-orientation={keyboard ? "horizontal" : undefined}
      className={cn(
        "group/toolbar",
        toolbarClassName,
        TOOLBAR_SIZE_CLASS[size],
        toolbarControlsClassName,
        sticky && toolbarStickyClassName,
        className
      )}
      {...props}
    >
      {sticky ? (
        <span aria-hidden data-slot="toolbar-plate" className={toolbarPlateClassName} />
      ) : null}
      {children}
    </div>
  )

  // O degrau desce aos botões (recuo e corpo de texto); a altura vem da variável.
  return size === "lg" ? barra : (
    <ButtonSizeContext.Provider value={size}>{barra}</ButtonSizeContext.Provider>
  )
}

/**
 * Presa e escondida. Um ouvinte de `scroll` passivo em quem rola: presa é a
 * barra encostada no seu `top` com o contêiner rolado; escondida é presa e
 * rolando para baixo, e nunca com o foco dentro dela.
 * O `top` depende de quem rola: na página, a base da barra do topo; num
 * contêiner que rola com a própria barra do topo dentro (a tela do `IphoneFrame`),
 * a mesma; num contêiner sem barra, zero.
 */
function usePresa(
  raiz: React.RefObject<HTMLDivElement | null>,
  ativo: boolean,
  esconder: boolean
) {
  React.useEffect(() => {
    const el = raiz.current
    if (!ativo || !el) return
    const doc = el.ownerDocument
    const janela = doc.defaultView ?? window

    const pagina = doc.scrollingElement!
    let caixa: Element = pagina
    let comBarra = true
    let antes = 0
    // Quem rola: o primeiro ancestral com `overflow`, ou a página. O ouvinte fica no
    // documento, em captura (`scroll` não borbulha), e troca de caixa se outro
    // ancestral rolar (no iframe da prévia o CSS chega depois da montagem, e a
    // primeira busca acha a página).
    const usar = (nova: Element) => {
      caixa = nova
      antes = nova.scrollTop
      const naPagina = nova === pagina
      const barraDoTopo = doc.querySelector('[data-slot="top-bar"]')
      comBarra = naPagina || Boolean(barraDoTopo && nova.contains(barraDoTopo))
      if (comBarra) el.style.removeProperty("--toolbar-top")
      else el.style.setProperty("--toolbar-top", "0px")
      // Presa num contêiner arredondado, a placa encosta na borda de cima dele: os
      // cantos dela seguem o raio de dentro, senão vazam (o `backdrop-filter` escapa
      // do recorte arredondado no Chrome).
      if (naPagina) el.style.removeProperty("--toolbar-plate-r")
      else {
        const raio = parseFloat(janela.getComputedStyle(nova).borderTopLeftRadius) || 0
        el.style.setProperty("--toolbar-plate-r", `${Math.max(0, raio - nova.clientTop)}px`)
      }
    }
    const rolaY = (n: Element) =>
      n === pagina || /(auto|scroll)/.test(janela.getComputedStyle(n).overflowY)
    let rolavel: Element | null = el.parentElement
    while (rolavel && rolavel !== doc.body && !rolaY(rolavel)) {
      rolavel = rolavel.parentElement
    }
    usar(!rolavel || rolavel === doc.body ? pagina : rolavel)

    const medir = (e?: Event) => {
      const alvo = e?.target
      if (alvo) {
        const nova = alvo === doc ? pagina : (alvo as Element)
        if (nova !== caixa) {
          // Só troca para quem rola na vertical (o `overflow-x` também computa
          // `overflow-y: auto`); para a página, só se a caixa deixou de rolar. Rolar a
          // página, ou um ancestral de lado, não tira a barra da caixa dela.
          const troca = nova === pagina ? !rolaY(caixa) : nova.contains(el) && rolaY(nova) && nova.scrollHeight > nova.clientHeight
          if (!troca) return
          usar(nova)
        }
      }
      const y = caixa.scrollTop
      // O `top` do sticky conta da borda de dentro do contêiner (`clientTop`).
      const borda = caixa === pagina ? 0 : caixa.getBoundingClientRect().top + caixa.clientTop
      const encosto = borda + (comBarra ? topBarBottom(doc) : 0) + 8
      const presa = y > 0 && el.getBoundingClientRect().top <= encosto + 0.5
      el.toggleAttribute("data-stuck", presa)
      if (esconder) {
        el.toggleAttribute(
          "data-hidden",
          presa &&
            proximoEscondido(el.hasAttribute("data-hidden"), {
              y,
              antes,
              focada: el.contains(doc.activeElement),
            })
        )
      }
      antes = y
    }

    medir()
    doc.addEventListener("scroll", medir, { capture: true, passive: true })
    return () => {
      doc.removeEventListener("scroll", medir, { capture: true })
      el.style.removeProperty("--toolbar-top")
      el.style.removeProperty("--toolbar-plate-r")
      el.removeAttribute("data-hidden")
    }
  }, [raiz, ativo, esconder])
}

function ToolbarRow({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="toolbar-row"
      className={cn(toolbarRowClassName, className)}
      {...props}
    />
  )
}

/**
 * O grupo da esquerda: o trilho segmentado, a busca e os gatilhos de filtro.
 * Cresce e encolhe com o espaço.
 */
function ToolbarFilters({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="toolbar-filters"
      className={cn("flex min-w-0 flex-1 items-center gap-2", className)}
      {...props}
    />
  )
}

/**
 * O grupo da direita: as ações. Nunca encolhe, menos com `overflow="menu"`.
 * A ordem é do menor para o maior, de fora para dentro: o botão só de ícone (e o
 * que encolhe no telefone) vem primeiro, na ponta esquerda do grupo, e a ação
 * principal fecha a fileira na borda. É a ordem do DOM, e não `order` de CSS (o
 * foco e o leitor de tela seguem o que se vê). O ⋯ do excesso nasce nessa ponta.
 * `ms-auto`, e não `justify-between` na raiz: a margem acerta um, dois e três
 * grupos. É a única margem automática do arquivo, e isso é carga estrutural: duas
 * na mesma linha dividem a sobra em vez de empurrar.
 * `overflow="menu"`: o que não cabe vai para o ⋯. Só sai `Button` sem menu
 * próprio (um gatilho de `DropdownMenu` abre no `pointerdown`, e um item de menu
 * não tem como abri-lo); o último filho nunca sai (é a ação principal). O item do
 * ⋯ clica o botão escondido, então `onClick`, `href` e o diálogo são os mesmos.
 */
function ToolbarActions({
  className,
  overflow,
  moreLabel = "Mais ações",
  children,
  ...props
}: React.ComponentProps<"div"> & {
  overflow?: "menu"
  /** O nome do ⋯. */
  moreLabel?: string
}) {
  const ref = React.useRef<HTMLDivElement>(null)
  const fora = useExcessoDeAcoes(ref, overflow === "menu")

  return (
    <div
      ref={ref}
      data-slot="toolbar-actions"
      data-overflow={overflow}
      className={cn(
        "flex shrink-0 flex-wrap items-center justify-end gap-2 ms-auto",
        overflow && "flex-nowrap",
        className
      )}
      {...props}
    >
      {fora.length ? <OverflowMenu items={fora} label={moreLabel} /> : null}
      {children}
    </div>
  )
}

/** A maiúscula inicial que o `Button` dá ao rótulo (`::first-letter`) e o item de menu não. */
const maiuscula = (t: string) => t.charAt(0).toLocaleUpperCase("pt-BR") + t.slice(1)

/** Um item do ⋯ com o botão escondido que ele clica — o que diz se a lista mudou. */
type AcaoNoExcesso = ItemNoExcesso & { el: HTMLElement }

/**
 * Quem cabe. Mostra tudo, mede, e esconde do começo para o fim os botões que
 * podem sair até a fileira caber numa linha com o ⋯. O espaço é a barra menos os
 * outros grupos, e deles conta o conteúdo, não a caixa (um grupo `flex-1` mediria
 * a sobra inteira).
 */
function useExcessoDeAcoes(
  ref: React.RefObject<HTMLDivElement | null>,
  ativo: boolean,
  /**
   * Outra casa para as ações: o seletor do contêiner que se observa e a conta de
   * quanto cabe. Sem ele, a conta é a da barra.
   */
  outraCasa?: { raiz: string; espaco: (raiz: HTMLElement) => number }
) {
  const [fora, setFora] = React.useState<AcaoNoExcesso[]>([])
  // A casa é uma constante de módulo de quem chama: estável entre renders.
  const raizDaCasa = outraCasa?.raiz
  const espacoDaCasa = outraCasa?.espaco

  React.useLayoutEffect(() => {
    const acoes = ref.current
    const barra = acoes?.closest<HTMLElement>(raizDaCasa ?? "[data-slot=toolbar]")
    if (!ativo || !acoes || !barra) return

    const lerFilhos = () =>
      [...acoes.children].filter(
        (f): f is HTMLElement => f instanceof HTMLElement && !f.hasAttribute("data-overflow-more")
      )
    const medir = () => {
      const filhos = lerFilhos()
      limparExcesso(filhos)
      const gap = parseFloat(getComputedStyle(acoes).columnGap) || 0
      const larguras = filhos.map((f) => f.offsetWidth)
      const cabe = espacoDaCasa ? espacoDaCasa(barra) : espacoNaBarra(barra, acoes)
      // O ⋯ é quadrado: a largura dele é a altura de um controle.
      const mais = filhos.at(-1)?.offsetHeight ?? 36
      // Saem do começo; a última ação e um gatilho de menu nunca saem.
      const saem = quemSai(larguras, cabe, {
        ponta: "inicio",
        fixos: new Set([filhos.length - 1]),
        podeSair: (i) => filhos[i].dataset.slot === "button" && !filhos[i].hasAttribute("aria-haspopup"),
        reserva: mais,
        gap,
      }).map((i): AcaoNoExcesso => {
        const f = filhos[i]
        f.setAttribute("hidden", "")
        return {
          key: String(i),
          el: f,
          label: maiuscula(f.getAttribute("aria-label") ?? f.textContent?.trim() ?? ""),
          icone: f.querySelector("svg"),
          onSelect: () => f.click(),
        }
      })
      setFora((v) =>
        v.length === saem.length && v.every((x, k) => x.el === saem[k].el) ? v : saem
      )
    }

    medir()
    const ro = new ResizeObserver(medir)
    ro.observe(barra)
    return () => {
      ro.disconnect()
      limparExcesso(lerFilhos())
    }
  }, [ativo, raizDaCasa, espacoDaCasa, ref])

  return ativo ? fora : []
}

/**
 * O espaço das ações na barra: ela menos os outros grupos, e deles conta o
 * conteúdo, não a caixa.
 */
function espacoNaBarra(barra: HTMLElement, acoes: HTMLElement) {
  const gapBarra = parseFloat(getComputedStyle(barra).columnGap) || 0
  const outros = [...barra.children].filter(
    (f): f is HTMLElement =>
      f instanceof HTMLElement &&
      f !== acoes &&
      !["toolbar-plate", "toolbar-chips"].includes(f.dataset.slot ?? "") &&
      f.getClientRects().length > 0
  )
  // Um grupo `flex-1` mede a sobra, e não o que precisa: durante a leitura
  // ele vai a `flex: 0 0 auto`, que é a largura do conteúdo.
  const flex = outros.map((f) => f.style.flex)
  for (const f of outros) f.style.flex = "0 0 auto"
  const ocupado = outros.reduce((s, f) => s + f.offsetWidth + gapBarra, 0)
  outros.forEach((f, i) => (f.style.flex = flex[i]))
  const estilo = getComputedStyle(barra)
  return barra.clientWidth - parseFloat(estilo.paddingLeft) - parseFloat(estilo.paddingRight) - ocupado
}

/**
 * Um comando da barra com ícone e rótulo. Com `collapse`, abaixo de `md` fica só
 * com o ícone, quadrado (o rótulo vira `sr-only` e segue sendo o nome). O rótulo
 * leva o `data-slot="button-label"`, para a maiúscula do CTA valer. Fora de um
 * `Toolbar` a largura quadrada cai na reserva de 36 (`lg`).
 */
function ToolbarButton({
  icon,
  label,
  collapse = false,
  marker,
  variant = "outline",
  className,
  children,
  ...props
}: Omit<React.ComponentProps<typeof Button>, "children"> & {
  icon?: React.ReactNode
  label: string
  collapse?: boolean
  /** O que vai depois do rótulo — uma contagem, um chevron. Com `collapse`, some com o rótulo. */
  children?: React.ReactNode
  /** A marca que fica também no botão quadrado (o ponto do filtro). */
  marker?: React.ReactNode
}) {
  return (
    <Button
      variant={variant}
      data-collapse={collapse ? "" : undefined}
      className={cn(
        collapse && "max-md:w-(--toolbar-control,--spacing(9)) max-md:px-0",
        className
      )}
      {...props}
    >
      {icon}
      <span data-slot="button-label" className={cn(collapse && "max-md:sr-only")}>
        {label}
      </span>
      {collapse && children != null ? (
        <span className="contents max-md:hidden">{children}</span>
      ) : (
        children
      )}
      {marker}
    </Button>
  )
}

/**
 * O botão de filtros. Rotulado, a marca é a contagem; só ícone, no telefone, é o
 * ponto. O nome já diz o estado ("Filtros — 2 ativos"), e o `Badge` e o ponto
 * ficam fora da árvore de acessibilidade. `active` é para quem sabe que há
 * filtro mas não quantos.
 */
function ToolbarFilterButton({
  count = 0,
  active,
  label = "Filtros",
  icon = <AdjustmentsHorizontalIcon aria-hidden />,
  className,
  ...props
}: Omit<React.ComponentProps<typeof ToolbarButton>, "label" | "icon" | "collapse"> & {
  count?: number
  active?: boolean
  label?: string
  icon?: React.ReactNode
}) {
  const ligado = active ?? count > 0
  const nome = !ligado
    ? label
    : count > 0
      ? `${label} — ${count} ${count === 1 ? "ativo" : "ativos"}`
      : `${label} — ativos`
  return (
    <ToolbarButton
      collapse
      icon={icon}
      label={label}
      aria-label={nome}
      marker={ligado ? <ToolbarFilterIndicator className="md:hidden" /> : null}
      className={cn("relative", className)}
      {...props}
    >
      {count > 0 ? (
        <Badge aria-hidden size="xs" className="nums">
          {count}
        </Badge>
      ) : ligado ? (
        // Há filtro, sem número: no rótulo, o ponto em linha (o do canto encostaria no texto).
        <span aria-hidden className="size-1.5 rounded-full bg-primary-accent" />
      ) : null}
    </ToolbarButton>
  )
}

/**
 * A busca da barra: o `SearchInput` que cresce no grupo, com `/` para focar (fora
 * de campo de texto). O piso de 160px é o que ela guarda quando as ações apertam,
 * e o que o ⋯ conta como dela.
 */
function ToolbarSearch({
  className,
  shortcut = "/",
  ...props
}: React.ComponentProps<typeof SearchInput>) {
  return (
    <SearchInput
      shortcut={shortcut}
      className={cn("min-w-40 flex-1 md:max-w-xs", className)}
      {...props}
    />
  )
}

/**
 * A contagem do que a lista mostra ("42 resultados"), numa região viva: quem
 * filtra ouve o resultado sem sair do controle.
 */
function ToolbarCount({
  count,
  noun = ["resultado", "resultados"],
  className,
  ...props
}: React.ComponentProps<"span"> & {
  count: number
  /** Singular e plural. */
  noun?: [string, string]
}) {
  return (
    <span
      role="status"
      data-slot="toolbar-count"
      className={cn("shrink-0 text-sm whitespace-nowrap text-muted-foreground nums", className)}
      {...props}
    >
      {numberBR(count)} {count === 1 ? noun[0] : noun[1]}
    </span>
  )
}

type ToolbarChip = {
  key: string
  label: string
  /** O texto inteiro, quando o rótulo trunca. */
  title?: string
  media?: React.ReactNode
  onRemove: () => void
}

/**
 * Os filtros aplicados, em fichas removíveis, numa linha própria sob a barra
 * (`basis-full`). Passado `max`, o resto recolhe em `+N`. Tirar uma ficha leva o
 * foco à vizinha.
 */
function ToolbarChips({
  items,
  onClearAll,
  clearLabel = "Limpar tudo",
  tone = "success",
  max = 6,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  items: ToolbarChip[]
  onClearAll?: () => void
  clearLabel?: string
  tone?: React.ComponentProps<typeof Badge>["tone"]
  max?: number
}) {
  const [todas, setTodas] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)
  if (items.length === 0) return null
  const visiveis = todas ? items : items.slice(0, max)
  const resto = items.length - visiveis.length

  const focarVizinha = (i: number) =>
    requestAnimationFrame(() => {
      const botoes = ref.current?.querySelectorAll<HTMLElement>("button")
      botoes?.[Math.min(i, botoes.length - 1)]?.focus()
    })

  return (
    <div
      ref={ref}
      role="group"
      aria-label="Filtros ativos"
      data-slot="toolbar-chips"
      className={cn("flex basis-full flex-wrap items-center gap-1.5", className)}
      {...props}
    >
      {visiveis.map((c, i) => (
        <Badge
          key={c.key}
          variant="soft"
          tone={tone}
          size="sm"
          title={c.title ?? c.label}
          className="max-w-full gap-1 pe-0.5"
        >
          {c.media}
          <span className="min-w-0 truncate">{c.label}</span>
          <Button
            type="button"
            variant="tertiary"
            size="icon-xs"
            className="size-5 shrink-0 rounded-full"
            aria-label={`Remover filtro: ${c.label}`}
            onClick={() => {
              c.onRemove()
              focarVizinha(i)
            }}
          >
            <XMarkIcon aria-hidden />
          </Button>
        </Badge>
      ))}
      {resto > 0 ? (
        <Button
          type="button"
          variant="tertiary"
          size="xs"
          className="nums"
          aria-label={`Mostrar mais ${resto}`}
          onClick={() => setTodas(true)}
        >
          {`+${resto}`}
        </Button>
      ) : null}
      {onClearAll && items.length > 1 ? (
        <Button type="button" variant="tertiary" size="xs" onClick={onClearAll}>
          {clearLabel}
        </Button>
      ) : null}
    </div>
  )
}

function ToolbarFilterIndicator({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      aria-hidden
      data-slot="toolbar-filter-indicator"
      className={cn(toolbarFilterIndicatorClassName, className)}
      {...props}
    />
  )
}

export {
  OverflowMenu as OverflowActionsMenu,
  useExcessoDeAcoes as useOverflowActions,
  usePresa as useStickyBar,
  Toolbar,
  ToolbarActions,
  ToolbarButton,
  ToolbarChips,
  ToolbarCount,
  ToolbarFilterButton,
  ToolbarFilterIndicator,
  ToolbarFilters,
  ToolbarRow,
  ToolbarSearch,
  toolbarClassName,
  toolbarFilterIndicatorClassName,
  toolbarRowClassName,
  type ToolbarChip,
}
