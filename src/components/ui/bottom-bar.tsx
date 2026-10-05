"use client"

import * as React from "react"
import { useIsomorphicLayoutEffect } from "@/hooks/use-isomorphic-layout-effect"
import Link from "next/link"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { TRAJETO_MACIO, viajarLiquido, type CaixaLiquida } from "@/lib/liquid-move"
import { glassControlSurfaceClassName } from "@/lib/glass-classes"
import { MOBILE_GLASS_SURFACE_CLASSNAME } from "@/lib/mobile-glass-surface"
import type { HeroIcon } from "@/types/navigation"
import { cn } from "@/lib/utils"

/**
 * A barra de baixo do telefone — a irmã do `TopBar`.
 *
 * ## A referência é o `Tabs` (rodada 230)
 *
 * A pílula e o marcador são os do `Tabs floating`: o anel de 1px em
 * `--foreground` a 10%, o marcador em relevo (a tecla: `--muted`, anel e
 * `shadow-xs`, 2px para dentro do item) e a viagem líquida
 * (`viajarLiquido`, o trajeto macio das abas). O vidro fica — a ilha flutua
 * sobre a lista, e é a premissa do `backdrop-filter`.
 *
 * **O anel substituiu a borda, e resolve os dois temas sozinho.** A pílula
 * tinha borda **e** anel porque cada um só desenhava num tema: a borda era
 * `--mobile-glass-border` (branco, 1,007 no claro) e o anel `--border` a 20%
 * (1,042 no escuro). Em `--foreground` a 10% o anel escurece no claro e
 * clareia no escuro — a direção do contato nos dois, como o das `Tabs`.
 *
 * ## A altura é do degrau, e a área segura entra dentro da caixa
 *
 * `--bottom-bar-h` é publicada pelo eixo `labels`, como o `TopBar` publica
 * `--top-bar-h`. O que fica no tema é `--bottom-bar-margin`, que é o que a
 * casca precisa saber para reservar espaço.
 *
 * ## A casca não recebe eventos
 *
 * O `<nav>` cobre a largura toda e a folga de baixo; sem `pointer-events-none`
 * ele engoliria o toque na base da tela, fora da pílula. Quem recebe é a linha.
 *
 * ## A camada é `--z-modal`, e é decisão registrada
 *
 * Ela empata com o `Dialog` e vence por ordem de DOM — o diálogo é
 * portalizado ao `body`, depois dela (`docs/layers.tsx`).
 */
const bottomBarVariants = cva(
  [
    "group/bottom-bar pointer-events-none fixed inset-x-0 bottom-0 md:hidden",
    "z-(--z-modal)",
    "[--bottom-bar-safe:env(safe-area-inset-bottom,0px)]",
    "pb-[calc(var(--bottom-bar-margin)+var(--bottom-bar-safe,0px))]",
  ].join(" "),
  {
    variants: {
      /**
       * Sem rótulo a barra é uma fileira de ícones de 24 numa caixa de 56.
       * Com rótulo o par ícone+texto precisa de 64. `active` põe o nome só na
       * aba ativa, **ao lado** do ícone — a aba se abre como uma de `Tabs` e
       * as outras encolhem —, e cabe nos mesmos 56.
       */
      labels: {
        false: "[--bottom-bar-h:3.5rem]",
        true: "[--bottom-bar-h:4rem]",
        active: "[--bottom-bar-h:3.5rem]",
      },
      /**
       * `island` flutua, com margem nos quatro lados. Um valor só, de
       * propósito: é ele que dá dono ao `--bottom-bar-margin`.
       */
      shape: {
        island: "[--bottom-bar-margin:1rem]",
      },
    },
    defaultVariants: { labels: false, shape: "island" },
  }
)

type Rotulos = boolean | "active"

/**
 * O que desce da barra aos itens: o eixo `labels` (por contexto, e não por
 * `in-*`, que compila com `:where()` e empataria com o `hidden` do próprio
 * rótulo) e o "subir ao topo" da aba ativa.
 */
const BottomBarContext = React.createContext<{
  labels: Rotulos
  glass: boolean
  subirAoTopo: () => void
}>({ labels: false, glass: false, subirAoTopo: () => {} })

/**
 * Se o marcador já mediu — e portanto se o item cede a ele o preenchimento.
 * Contexto e não seletor pela razão de sempre (`:where()`).
 */
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
    /** A ação primária, à direita da pílula — de preferência um `BottomBarAction`. */
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
 * Quem rola a tela, e o que a barra faz com isso. Um ouvinte de `scroll` em
 * captura no documento da barra (a rolagem de um contêiner não borbulha),
 * passivo, que guarda **o último que rolou** — é ele que a aba ativa leva ao
 * topo, seja a página, seja a tela do `PhoneFrame`. Só conta quem é alto
 * (60% da janela): um carrossel ou a lista de um menu não escondem a barra.
 *
 * Com `esconder`, rolar para baixo marca `data-hidden` na barra e rolar para
 * cima tira; no topo, e com o foco dentro dela, ela nunca some.
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
      if (y <= 0 || nav.contains(doc.activeElement)) nav.removeAttribute("data-hidden")
      else if (y - antes > 4) nav.setAttribute("data-hidden", "")
      else if (antes - y > 4) nav.removeAttribute("data-hidden")
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
 * **O tom da pílula e o da tecla, e o contraste entre os dois** (rodada 230,
 * pedido do dono: "fraco, principalmente quando tem algo atrás").
 *
 * A pílula vestia `--mobile-glass-bg` (55% no claro, 45% no escuro) e a tecla
 * era `--muted` — que é **o fundo das linhas da lista que passa por trás**.
 * Sobre uma linha, a pílula composta ia a ~0,24 de luz no escuro e a tecla
 * ficava em 0,269: ~1,09:1, e ~1,08:1 no claro. A tecla empatava com o que a
 * pílula deixava ver.
 *
 * Dois movimentos, os dois locais (a variável do vidro é redeclarada só aqui;
 * a gaveta e o menu da conta continuam no token):
 * - a pílula passa à tinta dos flutuantes, `--popover` a 82% — o conteúdo de
 *   trás pesa menos, e o vidro continua (o borrão é do `mobile-glass-surface`);
 * - a tecla ganha tom próprio, `--bottom-bar-key`: a tinta do texto misturada
 *   ao `--popover`, 12% no claro e 18% no escuro — o mais claro (no escuro) ou
 *   mais escuro (no claro) da barra, e **nunca** um tom que o conteúdo usa.
 * Medido depois (luminância relativa, a pílula composta em sRGB sobre o que
 * está atrás): **1,52:1** no escuro e **1,32:1** no claro sobre uma linha da
 * lista, 1,59 e 1,35 sobre a página. Não é texto, é forma; quem identifica a ativa
 * também é o ícone sólido e a tinta cheia.
 */
const pilulaTomClassName = [
  "[--mobile-glass-bg:color-mix(in_oklab,var(--popover)_82%,transparent)]",
  "[--bottom-bar-key:color-mix(in_oklab,var(--foreground)_12%,var(--popover))]",
  "dark:[--bottom-bar-key:color-mix(in_oklab,var(--foreground)_18%,var(--popover))]",
].join(" ")

/** O marcador do `Tabs floating` mora 2px para dentro do item: a tecla dentro do trilho. */
const RECUO_DO_MARCADOR = 2

/**
 * A pílula de vidro, e a fileira.
 *
 * ## A pílula e o realce são `rounded-full`, e isso é concentricidade de graça
 *
 * Com `rounded-full` o raio é metade da menor dimensão de cada caixa, e os
 * arcos da pílula, do item e do marcador continuam concêntricos em qualquer
 * degrau sem ninguém recalcular nada.
 *
 * **A contagem de colunas é derivada** (`Children.count`), e com
 * `labels="active"` a fileira vira flex: a aba ativa toma a largura do
 * rótulo e as outras dividem o resto.
 *
 * ## O arraste
 *
 * O dedo desliza pela pílula e o marcador segue o item sob ele; soltar num
 * item diferente o clica — o link navega, o slot abre o menu. O arraste só
 * começa depois de 8px de lado; antes disso é um toque comum. Com o ponteiro
 * capturado, o soltar não vira clique no item onde o dedo desceu.
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
  const anterior = React.useRef<{ el: HTMLElement; caixa: CaixaLiquida } | null>(null)
  const emCurso = React.useRef<Animation[]>([])
  const ativoAnterior = React.useRef<HTMLElement | null>(null)
  const larguraDoRotulo = React.useRef(0)
  const rotulosEmCurso = React.useRef<Animation[]>([])
  const [medido, setMedido] = React.useState(false)

  /**
   * A medição do marcador — o mecanismo do `Tabs`: um `ResizeObserver` na
   * pílula e nos itens, um `MutationObserver` em `data-active` e `data-scrub`,
   * e nada de laço por quadro. O repouso mora nas variáveis; a viagem é WAAPI
   * sobre elas, e só acontece quando o item **muda** (redimensionar só
   * reposiciona).
   */
  useIsomorphicLayoutEffect(() => {
    const trilha = trilhaRef.current
    if (!trilha) return
    // Trocar o eixo `labels` não é trocar de aba: o rótulo começa do zero.
    ativoAnterior.current = null

    const medir = () => {
      const alvo =
        trilha.querySelector<HTMLElement>(":scope > [data-scrub]") ??
        trilha.querySelector<HTMLElement>(":scope > [data-active]")
      // O arraste soltou e a rota chegou: a marca do arraste já não é preciso.
      if (alvo?.hasAttribute("data-scrub") && alvo.hasAttribute("data-active")) {
        alvo.removeAttribute("data-scrub")
      }
      if (!alvo) {
        anterior.current = null
        setMedido(false)
        return
      }
      const caixa: CaixaLiquida = {
        x: alvo.offsetLeft + RECUO_DO_MARCADOR,
        y: alvo.offsetTop + RECUO_DO_MARCADOR,
        w: alvo.offsetWidth - RECUO_DO_MARCADOR * 2,
        h: alvo.offsetHeight - RECUO_DO_MARCADOR * 2,
      }
      trilha.style.setProperty("--bottom-bar-marker-x", `${caixa.x}px`)
      trilha.style.setProperty("--bottom-bar-marker-y", `${caixa.y}px`)
      trilha.style.setProperty("--bottom-bar-marker-w", `${caixa.w}px`)
      trilha.style.setProperty("--bottom-bar-marker-h", `${caixa.h}px`)

      const antes = anterior.current
      anterior.current = { el: alvo, caixa }
      const peca = marcadorRef.current
      const abriu = labels === "active" && abrirRotulo()
      if (antes && peca && (antes.el !== alvo || abriu)) {
        for (const a of emCurso.current) a.cancel()
        const andado = Math.abs(caixa.x - antes.caixa.x)
        // Se só o rótulo mudou (o arraste já tinha levado o marcador), ele
        // acompanha a largura sem esticar.
        const amplitude =
          antes.el === alvo ? 0 : Math.min(0.18, caixa.w > 0 ? (andado / caixa.w) * 0.09 : 0.09)
        emCurso.current = viajarLiquido(peca, antes.caixa, caixa, {
          amplitude,
          trajeto: TRAJETO_MACIO,
        })
      }
      setMedido(true)
    }

    /**
     * **O rótulo abre no relógio do marcador** (`labels="active"`). Quando a
     * ativa muda, o layout já está no fim — o rótulo novo inteiro, o velho em
     * zero — e é ele que o marcador mede como destino. Daí a largura dos dois
     * rótulos anda de onde estava até onde fica, no mesmo trajeto e na mesma
     * duração da viagem: as abas abrem e fecham juntas, os ícones deslizam em
     * vez de saltar, e o marcador e a aba chegam no mesmo quadro. As
     * animações não guardam estado (`fill: none`): no fim, quem manda é o CSS,
     * que já está no destino.
     */
    function abrirRotulo() {
      const ativo = trilha!.querySelector<HTMLElement>(":scope > [data-active]")
      const velho = ativoAnterior.current
      ativoAnterior.current = ativo
      const rotulo = (el: HTMLElement | null) =>
        el?.querySelector<HTMLElement>('[data-slot="bottom-bar-label"]') ?? null
      const novo = rotulo(ativo)
      if (!velho || velho === ativo) {
        if (novo) larguraDoRotulo.current = novo.offsetWidth
        return false
      }
      const janela = trilha!.ownerDocument.defaultView ?? window
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

    medir()

    const ro = new ResizeObserver(medir)
    ro.observe(trilha)
    for (const item of trilha.children) ro.observe(item)

    const mo = new MutationObserver(medir)
    mo.observe(trilha, {
      attributes: true,
      attributeFilter: ["data-active", "data-scrub"],
      subtree: true,
      childList: true,
    })

    return () => {
      ro.disconnect()
      mo.disconnect()
    }
  }, [labels])

  const arraste = useArraste(trilhaRef)

  return (
    <BottomBarMarkerContext.Provider value={medido}>
      <div
        ref={trilhaRef}
        data-slot="bottom-bar-tabs"
        style={{ "--bottom-bar-cols": colunas } as React.CSSProperties}
        className={cn(
          MOBILE_GLASS_SURFACE_CLASSNAME,
          pilulaTomClassName,
          "relative h-(--bottom-bar-h) min-w-0 flex-1 touch-pan-y rounded-full p-0.5",
          labels === "active"
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
                : "bg-(--bottom-bar-key) ring-1 ring-foreground/10 shadow-sm",
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
 * **Some ao rolar, devagar nas duas direções** (pedido do dono). Quem decide
 * a transição é o estado de destino: indo, a peça afunda (com a folga e a área
 * segura), encolhe a 95% a partir da base e apaga em `--ease-in-out` —
 * começa devagar e assenta devagar; voltando, sobe na mola, com o quique. As
 * duas em `--duration-gentle` (700ms). O que lia mal não era a mola, era a
 * velocidade: em 300ms e na curva enfatizada, com 90ms a peça já tinha feito
 * 60% do caminho. `scale` e não `filter`: um borrão faria da pílula uma raiz
 * de fundo, e o vidro sumiria durante a saída.
 *
 * **A pílula e a ação vestem a mesma régua**, e saem juntas: uma ação
 * flutuando sozinha no canto, sem a barra que a ancora, lê como um botão
 * esquecido — e cobre a lista que a pessoa está rolando para ler.
 */
const someAoRolarClassName = [
  "origin-bottom transition-[translate,scale,opacity] duration-(--duration-gentle) ease-(--ease-spring)",
  "group-data-hidden/bottom-bar:translate-y-[calc(100%+var(--bottom-bar-margin)+var(--bottom-bar-safe,0px))] group-data-hidden/bottom-bar:scale-95 group-data-hidden/bottom-bar:opacity-0",
  "group-data-hidden/bottom-bar:ease-(--ease-in-out)",
].join(" ")

/** O arraste pela pílula — ver `BottomBarTabs`. */
function useArraste(trilhaRef: React.RefObject<HTMLDivElement | null>) {
  const estado = React.useRef<{ id: number; x0: number; ativo: boolean; alvo: HTMLElement | null } | null>(null)
  const limpeza = React.useRef<number | undefined>(undefined)

  // O item sob o dedo, pelo documento da pílula (no `PhoneFrame` ele é o do
  // iframe). Fora da pílula — o dedo subiu demais — não troca de item.
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
 * A caixa de um item — a aba e o slot dividem esta régua.
 *
 * **O alvo é a caixa, e não um pseudo-elemento**: numa fileira de alvos
 * adjacentes um `::after` de 44px engoliria o vizinho. O anel de foco é
 * externo — há `p-0.5` de folga até a borda da pílula.
 */
const itemRootClassName = [
  "group/bottom-bar-item relative flex h-full w-full min-w-0 items-stretch rounded-full",
  "outline-none focus-visible:ring-3 focus-visible:ring-ring/45",
  "transition-[translate] duration-(--duration-fast) ease-(--ease-out)",
  "active:translate-y-px",
].join(" ")

/**
 * Com `labels="active"`: cada aba parte do próprio conteúdo (`flex: auto`) e
 * a sobra se divide igual — a ativa é mais larga pelo rótulo, que é o que se
 * anima. Nunca abaixo dos 44 do alvo de toque (medido sem o piso: 37px com
 * quatro itens numa pílula de 279). Sem espaço, quem cede é o rótulo, que
 * trunca. `w-auto`: com o `w-full` da caixa, `basis: auto` seria 100%.
 */
const itemFlexClassName = "w-auto min-w-11 flex-auto"

/**
 * O miolo, e as tintas. `active` escreve `aria-current="page"` na aba de link
 * (a verdade semântica) e `data-active` em todos, que é o que o estilo lê. O
 * par `hover:`/`active:` é obrigatório: `hover:` não existe no dedo, `active:`
 * não existe no trackpad do iPad.
 */
const itemInnerClassName = [
  "flex h-full w-full items-center justify-center gap-0.5 rounded-full",
  "text-muted-foreground",
  "transition-[background-color,color] duration-(--duration-base) ease-(--ease-out)",
  "hover:text-foreground active:text-foreground",
  "group-data-[active]/bottom-bar-item:text-foreground group-data-[scrub]/bottom-bar-item:text-foreground",
].join(" ")

/**
 * O realce **enquanto não há medida** — a mesma tecla do marcador, pintada no
 * próprio item, para a primeira pintura e para quem roda sem JavaScript.
 */
const itemFallbackClassName = [
  "group-data-[active]/bottom-bar-item:bg-(--bottom-bar-key)",
  "group-data-[active]/bottom-bar-item:ring-1 group-data-[active]/bottom-bar-item:ring-foreground/10",
  "group-data-[active]/bottom-bar-item:shadow-sm",
].join(" ")

/**
 * O glifo, e o toque com mola: ele afunda a 88% no toque e volta na mola da
 * casa. `scale`, e não `transform`, para não disputar com o `translate` do
 * afundamento da caixa.
 */
const glifoClassName =
  "relative flex shrink-0 transition-[scale] duration-(--duration-spring) ease-(--ease-spring) group-active/bottom-bar-item:scale-88"

function BottomBarLabel({ children, ativo }: { children: React.ReactNode; ativo?: boolean }) {
  const { labels } = React.useContext(BottomBarContext)
  if (!labels) return null
  if (labels === "active") {
    // Montado em todas as abas, e fechado (largura zero) nas inativas: é a
    // largura dele que a pílula anima ao trocar de aba. O recuo mora dentro,
    // para fechar junto.
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
    <span className="w-full truncate px-2 text-center text-2xs leading-none" aria-hidden>
      {children}
    </span>
  )
}

/**
 * A contagem no canto do ícone: um número (até 99+) ou, com `true`, o ponto.
 * Ela é `aria-hidden` — o número entra no nome do item, que é quem o leitor
 * de tela anuncia.
 */
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

/**
 * O estalo do sólido: quando o item **passa** a ativo (e não na montagem), o
 * glifo nasce a 75% e assenta na mola. WAAPI, porque uma classe de animação
 * adicionada na hidratação tocaria na primeira pintura; movimento reduzido é
 * perguntado à mão.
 */
function useEstalo(ativo: boolean | undefined) {
  const ref = React.useRef<HTMLSpanElement>(null)
  const antes = React.useRef(ativo)
  React.useEffect(() => {
    const era = antes.current
    antes.current = ativo
    const el = ref.current
    if (!ativo || era || !el) return
    const janela = el.ownerDocument.defaultView ?? window
    if (janela.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const estilo = janela.getComputedStyle(el)
    el.animate([{ scale: "0.75" }, { scale: "1" }], {
      duration: parseFloat(estilo.getPropertyValue("--duration-spring")) || 500,
      easing: estilo.getPropertyValue("--ease-spring").trim() || "ease",
    })
  }, [ativo])
  return ref
}

type BottomBarTabProps = Omit<React.ComponentProps<typeof Link>, "href"> & {
  /** Sem `href` a aba é um `<button>` — a tela que troca de vista sem rota. */
  href?: string
  label: string
  icon: HeroIcon
  /**
   * O par preenchido, para a aba ativa — a convenção de tab bar do iOS. É
   * prop e não derivação: adivinhar por nome quebraria no build de produção.
   */
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
  const estalo = useEstalo(active)

  const miolo = (
    <span
      className={cn(
        itemInnerClassName,
        labels === true ? "flex-col" : "flex-row",
        labels === "active" && "px-2",
        !temMarcador && itemFallbackClassName
      )}
    >
      <span ref={estalo} className={glifoClassName}>
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
    className: cn(itemRootClassName, labels === "active" && itemFlexClassName, className),
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
 * A mesma caixa da aba, sem `href` — para hospedar o gatilho de um popover ou
 * de uma gaveta. Não recebe `aria-current`: o que abre um painel não é a
 * página atual. O conteúdo é de quem chama.
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
      className={cn(itemRootClassName, labels === "active" && itemFlexClassName, className)}
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
 * (`--bottom-bar-h`; 56 não é degrau do `Button`), com o anel e a sombra da
 * pílula — as duas peças são uma família. Ela **não declara cor**: quem pinta
 * é o `variant` do `Button`.
 */
const bottomBarActionClassName = [
  "size-(--bottom-bar-h) shrink-0 rounded-full p-0 ring-1 ring-foreground/10 shadow-lg",
  "[&_svg:not([class*='size-'])]:size-5",
].join(" ")

/** O `Button` da ação, com o nome obrigatório — ela é só ícone. */
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

/**
 * A barra enquanto a casca carrega: a pílula com os círculos dos ícones e a
 * ação, no mesmo lugar e na mesma altura — a barra de verdade entra sem pular.
 */
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
            MOBILE_GLASS_SURFACE_CLASSNAME,
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
