"use client"

import * as React from "react"
import Link from "next/link"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { TRAJETO_MACIO } from "@/lib/liquid-move"
import { useMarcador } from "@/hooks/use-marcador"
import { glassControlSurfaceClassName, menuPanelTintClassName } from "@/lib/glass-classes"
import { proximoEscondido } from "@/lib/hide-on-scroll"
import type { HeroIcon } from "@/types/navigation"
import { cn } from "@/lib/utils"

/**
 * A pílula: a tinta flutuante dos menus suspensos (`menuPanelTintClassName`, o
 * `--popover` translúcido com o borrão por trás), o anel de 1px do `Tabs
 * floating` e nenhuma sombra.
 */
const PILULA_CLASSNAME = cn(menuPanelTintClassName, "ring-1 ring-foreground/10")

/**
 * A barra de baixo do telefone, irmã do `TopBar`. A pílula e o marcador são os
 * do `Tabs floating`, a mesma pele (o `--popover`, o anel em `--foreground` a
 * 10%, a tecla em `--muted` com `shadow-xs`, a viagem líquida); só a altura é
 * da barra. A altura é do
 * degrau (`--bottom-bar-h`, publicada pelo eixo `labels`), e a barra assenta a
 * `--bottom-bar-offset` (20) do pé, sobre a área segura, como a do iOS 26; a
 * lateral é `--bottom-bar-margin` (16). O `<nav>` não recebe eventos (cobre a largura toda e engoliria
 * o toque fora da pílula); quem recebe é a linha. A camada é `--z-modal`:
 * empata com o `Dialog` e perde por ordem de DOM.
 */
const bottomBarVariants = cva(
  [
    "group/bottom-bar pointer-events-none fixed inset-x-0 bottom-0 md:hidden",
    "z-(--z-modal)",
    // A 20 do pé da tela, sobre a faixa do indicador de início, como a tab bar
    // do iOS 26: a área segura não soma (somada, a barra flutuava a 54 do pé).
    "pb-(--bottom-bar-offset)",
  ].join(" "),
  {
    variants: {
      /**
       * A barra mede 56 nos três, a régua da tab bar do iOS 26: sem rótulo, uma
       * fileira de ícones; com rótulo, o ícone de 24 e o nome de 11 empilhados
       * (37 de conteúdo numa aba de 52); `active` põe o nome só na ativa, ao lado.
       * Com rótulo ela já teve 64.
       */
      labels: {
        false: "[--bottom-bar-h:3.5rem]",
        true: "[--bottom-bar-h:3.5rem]",
        active: "[--bottom-bar-h:3.5rem]",
      },
      /** `island` flutua, com margem nos quatro lados; é ele que dá dono ao `--bottom-bar-margin`. */
      shape: {
        island: "[--bottom-bar-margin:1rem] [--bottom-bar-offset:1.25rem]",
      },
    },
    defaultVariants: { labels: false, shape: "island" },
  }
)

type Rotulos = boolean | "active"

/**
 * O que desce da barra aos itens: o eixo `labels` (por contexto; `in-*`
 * compila com `:where()` e empataria com o `hidden` do rótulo) e o "subir ao
 * topo" da aba ativa.
 */
const BottomBarContext = React.createContext<{
  labels: Rotulos
  glass: boolean
  subirAoTopo: () => void
}>({ labels: false, glass: false, subirAoTopo: () => {} })

/** Se o marcador já mediu, e portanto se o item cede a ele o preenchimento (contexto, pela razão do `:where()`). */
const BottomBarMarkerContext = React.createContext(false)

function BottomBar({
  className,
  labels,
  shape,
  action,
  hideOnScroll = false,
  glass = false,
  children,
  ...props
}: React.ComponentProps<"nav"> &
  VariantProps<typeof bottomBarVariants> & {
    /** A ação primária, à direita da pílula (de preferência um `BottomBarAction`). */
    action?: React.ReactNode
    /** Rolando para baixo a pílula e a ação afundam juntas; rolando para cima, voltam. */
    hideOnScroll?: boolean
    /** O marcador de vidro — o `glass` do `TabsList`, sobre o mesmo tom. */
    glass?: boolean
  }) {
  const navRef = React.useRef<HTMLElement>(null)
  const subirAoTopo = useRolagemDaTela(navRef, hideOnScroll)
  const rotulos: Rotulos = labels ?? false
  const contexto = React.useMemo(
    () => ({ labels: rotulos, glass, subirAoTopo }),
    [rotulos, glass, subirAoTopo]
  )

  return (
    <nav
      ref={navRef}
      data-slot="bottom-bar"
      data-labels={labels ? String(labels) : undefined}
      data-shape={shape ?? "island"}
      className={cn(bottomBarVariants({ labels, shape }), className)}
      {...props}
    >
      <BottomBarContext.Provider value={contexto}>
        <BottomBarRow>
          <BottomBarTabs>{children}</BottomBarTabs>
          {action ? (
            <div
              data-slot="bottom-bar-action-slot"
              className={cn("flex h-(--bottom-bar-h) shrink-0 items-center", someAoRolarClassName)}
            >
              {action}
            </div>
          ) : null}
        </BottomBarRow>
      </BottomBarContext.Provider>
    </nav>
  )
}

/**
 * Quem rola a tela, e o que a barra faz com isso: um ouvinte de `scroll` em
 * captura (a rolagem de um contêiner não borbulha), passivo, que guarda o
 * último que rolou, o que a aba ativa leva ao topo. Só conta quem é alto (60%
 * da janela). Com `esconder`, rolar para baixo marca `data-hidden`; no topo, e
 * com o foco dentro, a barra nunca some.
 */
function useRolagemDaTela(navRef: React.RefObject<HTMLElement | null>, esconder: boolean) {
  const ultimo = React.useRef<Element | null>(null)

  React.useEffect(() => {
    const nav = navRef.current
    if (!nav) return
    const doc = nav.ownerDocument
    const janela = doc.defaultView ?? window
    const posicoes = new WeakMap<Element, number>()

    const rolou = (e: Event) => {
      const alvo = e.target === doc ? doc.scrollingElement : (e.target as Element)
      if (!alvo || alvo.clientHeight < janela.innerHeight * 0.6) return
      ultimo.current = alvo
      const y = alvo.scrollTop
      const antes = posicoes.get(alvo) ?? y
      posicoes.set(alvo, y)
      if (!esconder) return
      nav.toggleAttribute(
        "data-hidden",
        proximoEscondido(nav.hasAttribute("data-hidden"), {
          y,
          antes,
          focada: nav.contains(doc.activeElement),
        })
      )
    }

    doc.addEventListener("scroll", rolou, { capture: true, passive: true })
    return () => {
      doc.removeEventListener("scroll", rolou, { capture: true })
      nav.removeAttribute("data-hidden")
    }
  }, [navRef, esconder])

  return React.useCallback(() => {
    const doc = navRef.current?.ownerDocument ?? document
    const janela = doc.defaultView ?? window
    const alvo = ultimo.current ?? doc.scrollingElement
    const reduzido = janela.matchMedia("(prefers-reduced-motion: reduce)").matches
    alvo?.scrollTo({ top: 0, behavior: reduzido ? "auto" : "smooth" })
  }, [navRef])
}

function BottomBarRow({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="bottom-bar-row"
      className={cn(
        "pointer-events-auto mx-(--bottom-bar-margin) flex items-stretch gap-2",
        className
      )}
      {...props}
    />
  )
}

/**
 * O tom da tecla: o `--muted` do `Tabs floating`. Ele já teve tom próprio
 * (`--muted` empatava com as linhas que passavam por trás do vidro, ~1,09:1);
 * com a pílula opaca nada passa por trás, e a tecla volta à das abas.
 */
const pilulaTomClassName = "[--bottom-bar-key:var(--muted)]"

/** O marcador do `Tabs floating` mora 2px para dentro do item: a tecla dentro do trilho. */
const RECUO_DO_MARCADOR = 2

/**
 * A pílula de vidro, e a fileira. Com `rounded-full` os arcos da pílula, do
 * item e do marcador ficam concêntricos em qualquer degrau. A contagem de
 * colunas é derivada (`Children.count`); com `labels="active"` a fileira vira
 * flex. O dedo desliza pela pílula e o marcador segue o item sob ele; soltar
 * em outro item o clica. O arraste começa depois de 8px de lado, e com o
 * ponteiro capturado o soltar não vira clique no item onde o dedo desceu.
 */
function BottomBarTabs({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  const { labels, glass } = React.useContext(BottomBarContext)
  const colunas = React.Children.toArray(children).length
  const trilhaRef = React.useRef<HTMLDivElement | null>(null)
  const marcadorRef = React.useRef<HTMLSpanElement | null>(null)
  const ativoAnterior = React.useRef<HTMLElement | null>(null)
  const larguraDoRotulo = React.useRef(0)
  const rotulosEmCurso = React.useRef<Animation[]>([])

  // Trocar o eixo `labels` não é trocar de aba: o rótulo começa do zero.
  // Declarado antes do `useMarcador`, para rodar antes da medida dele.
  React.useLayoutEffect(() => {
    ativoAnterior.current = null
  }, [labels])

  /**
   * O rótulo abre no relógio do marcador (`labels="active"`): a largura dos
   * dois rótulos anda no mesmo trajeto e na mesma duração da viagem, e as
   * animações não guardam estado (`fill: none`). Devolve se o rótulo abriu,
   * para o marcador acompanhar a largura nova sem esticar.
   */
  function abrirRotulo() {
    const trilha = trilhaRef.current
    if (!trilha) return false
    const ativo = trilha.querySelector<HTMLElement>(":scope > [data-active]")
    const velho = ativoAnterior.current
    ativoAnterior.current = ativo
    const rotulo = (el: HTMLElement | null) =>
      el?.querySelector<HTMLElement>('[data-slot="bottom-bar-label"]') ?? null
    const novo = rotulo(ativo)
    if (!velho || velho === ativo) {
      if (novo) larguraDoRotulo.current = novo.offsetWidth
      return false
    }
    const janela = trilha.ownerDocument.defaultView ?? window
    const final = novo?.offsetWidth ?? 0
    const de = larguraDoRotulo.current
    larguraDoRotulo.current = final
    for (const a of rotulosEmCurso.current) a.cancel()
    if (janela.matchMedia("(prefers-reduced-motion: reduce)").matches) return false
    const saindo = rotulo(velho)
    rotulosEmCurso.current = [
      novo?.animate(
        [{ width: "0px", opacity: 0 }, { width: final + "px", opacity: 1 }],
        { ...TRAJETO_MACIO, fill: "none" }
      ),
      saindo?.animate(
        [{ width: de + "px", opacity: 1 }, { width: "0px", opacity: 0 }],
        { ...TRAJETO_MACIO, fill: "none" }
      ),
    ].filter((a): a is Animation => a != null)
    return true
  }

  /**
   * O marcador é o do `Tabs` (`useMarcador`): a viagem em WAAPI só quando o
   * item muda, e o arraste (`data-scrub`) também é troca de item.
   */
  const medido = useMarcador({
    trilha: trilhaRef,
    marcador: marcadorRef,
    ativo: (trilha) => {
      const alvo =
        trilha.querySelector<HTMLElement>(":scope > [data-scrub]") ??
        trilha.querySelector<HTMLElement>(":scope > [data-active]")
      // O arraste soltou e a rota chegou: a marca do arraste não é mais preciso.
      if (alvo?.hasAttribute("data-scrub") && alvo.hasAttribute("data-active")) {
        alvo.removeAttribute("data-scrub")
      }
      return alvo
    },
    atributos: ["data-active", "data-scrub"],
    prefixo: "bottom-bar-marker",
    insete: RECUO_DO_MARCADOR,
    viajar: true,
    acompanhar: labels === "active" ? abrirRotulo : undefined,
    deps: [labels],
  })

  const arraste = useArraste(trilhaRef)

  return (
    <BottomBarMarkerContext.Provider value={medido}>
      <div
        ref={trilhaRef}
        data-slot="bottom-bar-tabs"
        style={{ "--bottom-bar-cols": colunas } as React.CSSProperties}
        className={cn(
          PILULA_CLASSNAME,
          pilulaTomClassName,
          "relative h-(--bottom-bar-h) min-w-0 flex-1 touch-pan-y rounded-full p-0.5",
          // Com rótulo, cada aba parte da largura do próprio nome e o marcador
          // acompanha; sem rótulo, colunas iguais.
          labels
            ? "flex items-stretch gap-0.5"
            : "grid grid-cols-[repeat(var(--bottom-bar-cols),minmax(0,1fr))] items-stretch gap-0.5",
          someAoRolarClassName,
          className
        )}
        {...arraste}
        {...props}
      >
        {/*
          O marcador. **Primeiro filho, e sem `z-index`**: os itens são
          `relative`, e quem decide a pintura é a ordem no documento. Ele só
          existe depois de medido — montado antes, escorregaria de 0,0.
        */}
        {medido ? (
          <span
            ref={marcadorRef}
            aria-hidden
            data-slot="bottom-bar-marker"
            className={cn(
              "pointer-events-none absolute top-0 left-0 rounded-full",
              glass
                ? [glassControlSurfaceClassName, "shadow-sm [--glass-tone:var(--bottom-bar-key)]"]
                : "bg-(--bottom-bar-key) ring-1 ring-foreground/10 shadow-xs",
              "translate-x-(--bottom-bar-marker-x) translate-y-(--bottom-bar-marker-y)",
              "w-(--bottom-bar-marker-w) h-(--bottom-bar-marker-h)"
            )}
          />
        ) : null}
        {children}
      </div>
    </BottomBarMarkerContext.Provider>
  )
}

/**
 * Some ao rolar, devagar nas duas direções: indo, afunda, encolhe a 95% a
 * partir da base e apaga em `--ease-in-out`; voltando, sobe na mola. As duas em
 * `--duration-gentle`. `scale` e não `filter`: um borrão faria da pílula uma
 * raiz de fundo e o vidro sumiria. A pílula e a ação vestem a mesma régua e
 * saem juntas (uma ação sozinha lê como botão esquecido).
 */
const someAoRolarClassName = [
  "origin-bottom transition-[translate,scale,opacity] duration-(--duration-gentle) ease-(--ease-spring)",
  "group-data-hidden/bottom-bar:translate-y-[calc(100%+var(--bottom-bar-offset))] group-data-hidden/bottom-bar:scale-95 group-data-hidden/bottom-bar:opacity-0",
  "group-data-hidden/bottom-bar:ease-(--ease-in-out)",
].join(" ")

/** O arraste pela pílula (ver `BottomBarTabs`). */
function useArraste(trilhaRef: React.RefObject<HTMLDivElement | null>) {
  const estado = React.useRef<{ id: number; x0: number; ativo: boolean; alvo: HTMLElement | null } | null>(null)
  const limpeza = React.useRef<number | undefined>(undefined)

  // O item sob o dedo, pelo documento da pílula (no `IphoneFrame`, o do iframe).
  // Fora da pílula não troca de item.
  const itemEm = (x: number, y: number) => {
    const trilha = trilhaRef.current
    const no = trilha?.ownerDocument.elementFromPoint(x, y)
    const item = no?.closest<HTMLElement>(":is([data-slot=bottom-bar-tab],[data-slot=bottom-bar-slot])")
    return item && item.parentElement === trilha ? item : null
  }

  const marcar = (el: HTMLElement | null) => {
    const trilha = trilhaRef.current
    for (const f of trilha?.querySelectorAll(":scope > [data-scrub]") ?? []) {
      if (f !== el) f.removeAttribute("data-scrub")
    }
    el?.setAttribute("data-scrub", "")
  }

  return {
    onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.button !== 0) return
      estado.current = { id: e.pointerId, x0: e.clientX, ativo: false, alvo: null }
    },
    onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => {
      const s = estado.current
      if (!s || s.id !== e.pointerId) return
      if (!s.ativo) {
        if (Math.abs(e.clientX - s.x0) < 8) return
        s.ativo = true
        window.clearTimeout(limpeza.current)
        // Sem um ponteiro de verdade por trás (um evento sintético), a captura
        // lança; o arraste segue sem ela.
        try {
          e.currentTarget.setPointerCapture(e.pointerId)
        } catch {}
      }
      const alvo = itemEm(e.clientX, e.clientY)
      if (alvo && alvo !== s.alvo) {
        s.alvo = alvo
        marcar(alvo)
      }
    },
    onPointerUp: (e: React.PointerEvent<HTMLDivElement>) => {
      const s = estado.current
      estado.current = null
      if (!s?.ativo || s.id !== e.pointerId) return
      const alvo = s.alvo
      if (alvo && !alvo.hasAttribute("data-active")) {
        alvo.click()
        // A rota chega e tira a marca; um slot (que abre um menu) não fica
        // ativo, e o marcador volta ao item da página.
        limpeza.current = window.setTimeout(() => marcar(null), 900)
      } else {
        marcar(null)
      }
    },
    onPointerCancel: () => {
      estado.current = null
      marcar(null)
    },
  }
}

/**
 * A caixa de um item, dividida pela aba e pelo slot. O alvo é a caixa e não um
 * pseudo-elemento (um `::after` de 44px engoliria o vizinho); o anel de foco é
 * externo, há `p-0.5` de folga até a borda da pílula. Sem o afundar de 1px no
 * toque: as abas do `Tabs` não afundam, e a barra responde como elas (a tinta).
 */
const itemRootClassName = [
  "group/bottom-bar-item relative flex h-full w-full min-w-0 items-stretch rounded-full",
  "outline-none focus-visible:ring-3 focus-visible:ring-ring/45",
].join(" ")

/**
 * Com rótulo (`labels` ligado ou `"active"`): cada aba parte do próprio conteúdo
 * (`flex: auto`) e a sobra se divide igual, e o fundo da ativa tem a largura do
 * nome dela. Nunca abaixo dos 44 do alvo de toque; sem espaço o
 * rótulo trunca. `w-auto`: com o `w-full` da caixa, `basis: auto` seria 100%.
 */
const itemFlexClassName = "w-auto min-w-11 flex-auto"

/**
 * Com todos os rótulos (`labels`), cada aba parte da coluna igual de antes (a
 * trilha menos os vãos de 2px, dividida pelas colunas; o `%` da base é da
 * trilha) e nunca fica menor que o próprio nome (`min-w-fit`; o rótulo tem piso
 * de 40). Cabendo, são todas iguais; quando um nome passa da coluna (um
 * telefone de 320), só as abas curtas cedem o espaço — os curtos não encolhem
 * abaixo da coluna sem um longo precisar.
 */
const itemColunaClassName =
  "w-auto min-w-fit flex-[1_1_calc((100%_-_(var(--bottom-bar-cols)_-_1)*--spacing(0.5))/var(--bottom-bar-cols))]"

/**
 * O miolo e as tintas. `active` escreve `aria-current="page"` na aba de link e
 * `data-active` em todos. O par `hover:`/`active:` é obrigatório: `hover:` não
 * existe no dedo, `active:` não existe no trackpad do iPad.
 */
const itemInnerClassName = [
  "flex h-full w-full items-center justify-center gap-0.5 rounded-full",
  "text-muted-foreground",
  "transition-[background-color,color] duration-(--duration-base) ease-(--ease-out)",
  "hover:text-foreground active:text-foreground",
  "group-data-[active]/bottom-bar-item:text-foreground group-data-[scrub]/bottom-bar-item:text-foreground",
].join(" ")

/** O realce enquanto não há medida: a tecla do marcador pintada no item, para a primeira pintura e para quem roda sem JavaScript. */
const itemFallbackClassName = [
  "group-data-[active]/bottom-bar-item:bg-(--bottom-bar-key)",
  "group-data-[active]/bottom-bar-item:ring-1 group-data-[active]/bottom-bar-item:ring-foreground/10",
  "group-data-[active]/bottom-bar-item:shadow-xs",
].join(" ")

/**
 * O glifo, parado: as abas do `Tabs` não encolhem no toque nem estalam ao
 * ativar, e a barra responde como elas (a tinta e o marcador que viaja).
 */
const glifoClassName = "relative flex shrink-0"

function BottomBarLabel({ children, ativo }: { children: React.ReactNode; ativo?: boolean }) {
  const { labels } = React.useContext(BottomBarContext)
  if (!labels) return null
  if (labels === "active") {
    // Montado em todas as abas e fechado (largura zero) nas inativas: é a
    // largura dele que a pílula anima. O recuo mora dentro, para fechar junto.
    return (
      <span
        aria-hidden
        data-slot="bottom-bar-label"
        className={cn("block min-w-0 overflow-hidden", !ativo && "w-0 opacity-0")}
      >
        <span className="block truncate ps-1.5 pe-1 text-xs font-medium">{children}</span>
      </span>
    )
  }
  return (
    // O recuo é o respiro do nome dentro do fundo da ativa. Com 2px,
    // "Transações" (≈58px) cabe na coluna de 65 de um telefone de 375; com 4
    // já cortava.
    // Piso de 40, e não 44: num telefone de 320 a trilha útil tem 212, e Painel
    // e Conta a 44 mais Transações (64) e Categorias (60) inteiras passavam dela;
    // a aba tem 64 de altura, o toque segue folgado.
    // O `truncate` recorta na caixa, e com `leading-none` a caixa acaba na linha de
    // base mais pouco: a perna do "g" de Categorias saía cortada. `pb-0.5 -mb-0.5`
    // estende o recorte 2px para baixo sem mexer na altura da aba.
    <span className="-mb-0.5 w-full min-w-10 truncate px-0.5 pb-0.5 text-center text-2xs leading-none" aria-hidden>
      {children}
    </span>
  )
}

/** A contagem no canto do ícone (até 99+, ou `true` para o ponto). `aria-hidden`: o número entra no nome do item. */
function BottomBarCount({ count }: { count: number | boolean }) {
  if (count === false || count === 0) return null
  if (count === true) {
    return (
      <span
        aria-hidden
        data-slot="bottom-bar-count"
        className="pointer-events-none absolute -top-0.5 -right-0.5 size-2 rounded-full bg-primary-accent"
      />
    )
  }
  return (
    <span
      aria-hidden
      data-slot="bottom-bar-count"
      className="pointer-events-none absolute -top-1.5 -right-2.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-2xs leading-none font-medium text-primary-foreground nums"
    >
      {count > 99 ? "99+" : count}
    </span>
  )
}

/** O nome com a contagem: "Contas, 3 a vencer". */
function nomeComContagem(label: string | undefined, count?: number | boolean, countLabel?: string) {
  if (!label || count == null || count === false || count === 0) return label
  if (count === true) return label + ", " + (countLabel ?? "há novidades")
  return [label + ",", count, countLabel].filter((p) => p != null).join(" ")
}

type BottomBarTabProps = Omit<React.ComponentProps<typeof Link>, "href"> & {
  /** Sem `href` a aba é um `<button>`, para a tela que troca de vista sem rota. */
  href?: string
  label: string
  icon: HeroIcon
  /** O par preenchido para a aba ativa; é prop porque adivinhar por nome quebraria no build de produção. */
  iconActive?: HeroIcon
  active?: boolean
  /** O número no canto do ícone, ou `true` para o ponto. Entra no nome. */
  count?: number | boolean
  /** O que o número conta, para o nome: "a vencer" → "Contas, 3 a vencer". */
  countLabel?: string
}

function BottomBarTab({
  className,
  href,
  label,
  icon: Icon,
  iconActive: IconActive,
  active,
  count,
  countLabel,
  onClick,
  ...props
}: BottomBarTabProps) {
  const Glifo = active && IconActive ? IconActive : Icon
  const temMarcador = React.useContext(BottomBarMarkerContext)
  const { labels, subirAoTopo } = React.useContext(BottomBarContext)
  const miolo = (
    <span
      className={cn(
        itemInnerClassName,
        labels === true ? "flex-col" : "flex-row",
        labels === "active" && "px-2",
        !temMarcador && itemFallbackClassName
      )}
    >
      <span className={glifoClassName}>
        <Glifo className="size-6 shrink-0" aria-hidden />
        {count != null ? <BottomBarCount count={count} /> : null}
      </span>
      <BottomBarLabel ativo={active}>{label}</BottomBarLabel>
    </span>
  )

  const comum = {
    "data-slot": "bottom-bar-tab",
    "data-active": active ? "" : undefined,
    "aria-label": nomeComContagem(label, count, countLabel),
    className: cn(itemRootClassName, labels === "active" && itemFlexClassName, labels === true && itemColunaClassName, className),
    // Tocar na aba da tela atual a leva ao topo, como no iOS.
    onClick: (e: React.MouseEvent<HTMLAnchorElement & HTMLButtonElement>) => {
      onClick?.(e as React.MouseEvent<HTMLAnchorElement>)
      if (active) {
        e.preventDefault()
        subirAoTopo()
      }
    },
  }

  if (href == null) {
    return (
      <button
        type="button"
        aria-pressed={active ?? false}
        {...comum}
        {...(props as React.ComponentProps<"button">)}
      >
        {miolo}
      </button>
    )
  }

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      draggable={false}
      {...comum}
      {...props}
    >
      {miolo}
    </Link>
  )
}

/**
 * A mesma caixa da aba, sem `href`, para hospedar o gatilho de um popover ou
 * gaveta. Não recebe `aria-current`.
 */
function BottomBarSlot({
  className,
  active,
  label,
  count,
  countLabel,
  children,
  asChild = false,
  "aria-label": ariaLabel,
  ...props
}: React.ComponentProps<"button"> & {
  active?: boolean
  /** O rótulo sob o conteúdo, quando a barra liga `labels`. */
  label?: string
  count?: number | boolean
  countLabel?: string
  asChild?: boolean
}) {
  const Comp = asChild ? Slot.Root : "button"
  const temMarcador = React.useContext(BottomBarMarkerContext)
  const { labels } = React.useContext(BottomBarContext)

  return (
    <Comp
      data-slot="bottom-bar-slot"
      data-active={active ? "" : undefined}
      type={asChild ? undefined : "button"}
      aria-label={nomeComContagem(ariaLabel ?? label, count, countLabel)}
      className={cn(itemRootClassName, labels === "active" && itemFlexClassName, labels === true && itemColunaClassName, className)}
      {...props}
    >
      <span
        className={cn(
          itemInnerClassName,
          labels === true ? "flex-col" : "flex-row",
          labels === "active" && "px-2",
          !temMarcador && itemFallbackClassName
        )}
      >
        <span className={glifoClassName}>
          {children}
          {count != null ? <BottomBarCount count={count} /> : null}
        </span>
        {label ? <BottomBarLabel ativo={active}>{label}</BottomBarLabel> : null}
      </span>
    </Comp>
  )
}

/**
 * A ação primária, à direita da pílula: redonda, na altura da barra
 * (`--bottom-bar-h`; 56 não é degrau do `Button`), com a sombra e sem anel: o
 * anel da pílula, em volta da tecla cheia, lia como uma borda solta fora dela.
 * Não declara cor: quem pinta é o `variant` do `Button`.
 */
const bottomBarActionClassName = [
  "size-(--bottom-bar-h) shrink-0 rounded-full p-0 shadow-lg",
  "[&_svg:not([class*='size-'])]:size-5",
].join(" ")

/** O `Button` da ação, com o nome obrigatório (ela é só ícone). */
function BottomBarAction({
  label,
  variant = "primary",
  className,
  ...props
}: Omit<React.ComponentProps<typeof Button>, "size" | "aria-label"> & { label: string }) {
  return (
    <Button
      type="button"
      variant={variant}
      data-slot="bottom-bar-action"
      aria-label={label}
      className={cn(bottomBarActionClassName, className)}
      {...props}
    />
  )
}

/** A barra enquanto a casca carrega: a pílula com os círculos dos ícones e a ação, no mesmo lugar e altura. */
function BottomBarSkeleton({
  tabs = 4,
  action = true,
  labels,
  className,
}: {
  tabs?: number
  action?: boolean
  labels?: boolean
  className?: string
}) {
  return (
    <div aria-hidden data-slot="bottom-bar-skeleton" className={cn(bottomBarVariants({ labels }), className)}>
      <BottomBarRow>
        <div
          className={cn(
            PILULA_CLASSNAME,
            pilulaTomClassName,
            "grid h-(--bottom-bar-h) min-w-0 flex-1 items-center gap-0.5 rounded-full p-0.5",
            "grid-cols-[repeat(var(--bottom-bar-cols),minmax(0,1fr))]"
          )}
          style={{ "--bottom-bar-cols": tabs } as React.CSSProperties}
        >
          {Array.from({ length: tabs }, (_, i) => (
            <span key={i} className="flex flex-col items-center gap-1">
              <Skeleton shape="circle" size="xs" />
              {labels ? <Skeleton className="h-2 w-8 rounded-full" /> : null}
            </span>
          ))}
        </div>
        {action ? <Skeleton shape="circle" className="size-(--bottom-bar-h) shrink-0" /> : null}
      </BottomBarRow>
    </div>
  )
}

export {
  BottomBar,
  BottomBarAction,
  BottomBarRow,
  BottomBarSkeleton,
  BottomBarTabs,
  BottomBarTab,
  BottomBarSlot,
  bottomBarActionClassName,
  bottomBarVariants,
}
