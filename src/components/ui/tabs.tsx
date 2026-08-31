"use client"

import * as React from "react"
import { cva } from "class-variance-authority"
import { Tabs as TabsPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"
import {
  scrollFadeViewportClassName,
  scrollFadeViewportXClassName,
} from "@/lib/scroll-fade-classes"
import { useScrollFade } from "@/hooks/use-scroll-fade"

/**
 * Painéis irmãos do mesmo nível, dos quais só um aparece por vez.
 *
 * ## O gatilho media 27px, e a justificativa escrita não fechava a conta
 *
 * `TabsList` era `h-9` (36) com `p-1` (8), o que deixa 28 de caixa de conteúdo;
 * o gatilho era `h-[calc(100%-1px)]`, ou seja **27** — um pixel abaixo do piso
 * de 28 da escada de controles, e cinco abaixo do `md` que todo o resto do
 * sistema usa por padrão.
 *
 * O AGENTS.md justificava os 36 dizendo que "a 32 o gatilho interno cairia a
 * 24". A conta faz 36 − 8 = 28 e para: ela nunca subtrai o `-1px` que o próprio
 * componente escrevia. A altura declarada protegia um piso que ela já violava.
 *
 * A raiz é a mesma que o `Menubar` já teve e já corrigiu: **ancorar a escada no
 * contêiner**. Lá o defeito foi medido em 24px e o conserto foi mover a medida
 * para o gatilho. Aqui a premissa que sustentava a exceção — "as abas esticam,
 * então a lista determina o gatilho" — é falsa por um motivo mais simples:
 * `TabsList` era `w-fit`, e `flex-1` dentro de um contêiner que encolhe para o
 * conteúdo distribui sobra **zero**. O `flex-1` de todo gatilho era decorativo.
 *
 * Então `size` mede o gatilho — `sm` 28, `md` 32, `lg` 36 — e a bandeja cresce
 * em volta. Consequência declarada: **a bandeja padrão passa de 36 para 40**,
 * porque `md` é o padrão do sistema e nomeia um gatilho de 32. Quem quiser os
 * 36 de antes pede `size="sm"`, e ganha o gatilho de 28 que a versão anterior
 * prometia sem entregar.
 *
 * ## A moldura fica fora da lista, e a lista não desenha nada
 *
 * A dissolução de bordas recorta o alfa do **elemento inteiro** — fundo, anel e
 * sombra junto (invariante 2 de `lib/scroll-fade-classes`). Uma bandeja
 * mascarada sairia com os quatro cantos apagados e os lados opacos, que lê como
 * falha de renderização. Por isso quem pinta é uma moldura, e quem rola e
 * dissolve é a `Tabs.List`, que não desenha nada.
 *
 * A moldura vai **fora** da lista, e não dentro: um nó entre um `role="tablist"`
 * e as suas `role="tab"` mexe na posse ARIA, que é a mesma razão pela qual o
 * `ButtonGroup` não pode embrulhar um trilho segmentado.
 *
 * ## O recuo é da lista, não da moldura
 *
 * `overflow-x` recorta no **padding box** do elemento que rola. Com o `p-1` na
 * moldura, o scrollport ficaria com zero recuo e o `focus-visible:ring-3` do
 * primeiro e do último gatilho seria cortado — nos quatro lados, em toda
 * variante. Com o recuo na lista, os 4px cobrem os 3px do anel.
 *
 * A exceção medida e aceita: em `underline` a lista precisa de `pb-0` para o
 * marcador do gatilho encontrar o fio da moldura, então ali o anel perde 3px na
 * base. Continua visível nos outros três lados, e a alternativa (recuo mais
 * `after:-bottom-1`) custa um pseudo-elemento para devolver 3 pixels.
 *
 * ## O marcador é **um** objeto, e ele viaja
 *
 * Antes, cada gatilho pintava o próprio realce e o apagava: a bandeja levantada
 * do `solid` e o traço de acento do `underline` **teleportavam** de uma aba
 * para a outra. Três marcadores piscando não dizem a mesma coisa que um
 * marcador se movendo — o segundo explica de onde se veio e para onde se foi,
 * que é a única coisa numa fileira de abas que merece autoria.
 *
 * Então o realce saiu do gatilho e virou um nó só, `tabs-indicator`, absoluto
 * dentro da trilha. A lista publica a caixa da aba ativa em quatro variáveis
 * (`--tabs-indicator-x/y/w/h`) e o marcador transiciona para ela.
 *
 * **Ele está fora do fluxo**, então animar `width`/`height` nele não reflui
 * irmão nenhum — é o mesmo elemento mudando de caixa, e não o layout da
 * fileira sendo recalculado. A alternativa transform-only (`scaleX`) foi
 * rejeitada porque distorce o raio de 6px e a borda de 1px do `solid`: uma
 * pílula esticada lê como bug, não como movimento.
 *
 * **A medição não é um laço.** Um `ResizeObserver` cobre a trilha e os
 * gatilhos, e um `MutationObserver` em `data-state` cobre a troca de aba —
 * inclusive a programática, porque quem marca a aba ativa é o Radix e não este
 * componente. Nada de `requestAnimationFrame` em loop.
 *
 * ## O que acontece antes de haver medida
 *
 * Sem JavaScript não há caixa para publicar, e um marcador sem posição
 * deixaria a aba ativa **sem marca nenhuma** na primeira pintura. Por isso o
 * gatilho continua sabendo se pintar, e só para quando o marcador está vivo.
 *
 * A troca é decidida em React (`indicatorReady` no contexto), e **não** por
 * seletor: `in-*` e `group-*` compilam com `:where()`, que não soma
 * especificidade, e este projeto já pagou essa medição duas vezes — no
 * `Command` e no recuo do `ComboboxTrigger`. Um booleano não disputa.
 *
 * ## Movimento reduzido
 *
 * Nada de especial aqui, e é de propósito: o bloco global de
 * `prefers-reduced-motion` em `globals.css` encurta transições para 0,01ms. O
 * marcador **salta** em vez de viajar, e o estado final chega igual — que é
 * exatamente "menos movimento, mesmo significado".
 */

type TabsSize = "sm" | "md" | "lg"
type TabsVariant = "solid" | "underline" | "ghost"
type TabsOrientation = "horizontal" | "vertical"

/**
 * A escada, como **dado** e não como classe.
 *
 * Um teste sobre a saída de `cva` só sabe casar substring, e casar substring
 * tranca a grafia em vez da medida. Com a escada em número, o teste pergunta o
 * que interessa: nenhum degrau abaixo de 28, passos de 4, e nenhuma altura
 * declarada na lista.
 */
export const TABS_TRIGGER_HEIGHTS = { sm: 28, md: 32, lg: 36 } as const

const TRIGGER_HEIGHT_CLASS = { 28: "h-7", 32: "h-8", 36: "h-9" } as const

/**
 * Quem tem marcador viajante — e o `ghost` não tem, de propósito.
 *
 * O marcador viaja **ao longo de alguma coisa**: a bandeja do `solid` e o fio
 * do `underline` são o trilho que dá sentido ao deslocamento. O `ghost` não
 * desenha nem bandeja nem fio, então ali o mesmo movimento não é um realce
 * correndo por um trilho, é um bloco preenchido deslizando sozinho sobre o
 * fundo — e ele é justamente a variante escolhida para uma fileira que **não**
 * deve chamar atenção, dentro de uma superfície que já tem moldura própria.
 * A variante mais silenciosa das três não pode ter o marcador mais barulhento.
 *
 * Sem marcador, o `ghost` cai no caminho que o componente já mantém para antes
 * da hidratação: cada gatilho pinta o próprio realce. A tinta ainda troca com
 * `transition-colors`, que é uma mudança de cor e não um deslocamento.
 */
const VARIANTE_VIAJA: Record<TabsVariant, boolean> = {
  solid: true,
  underline: true,
  ghost: false,
}

/**
 * A orientação desce por contexto porque a **moldura** é o único nó da árvore
 * que o Radix não carimba. Root e Content recebem `data-orientation` do próprio
 * `Tabs`; List e Trigger recebem do `RovingFocusGroup` que eles renderizam por
 * dentro — detalhe de implementação de uma dependência, e a premissa a olhar
 * se um dia o marcador de `underline` aparecer no lado errado.
 */
const TabsOrientationContext =
  React.createContext<TabsOrientation>("horizontal")

/**
 * Tamanho, superfície e distribuição descem por contexto pela mesma razão do
 * `Menubar`: duas peças precisam concordar. A moldura dá a superfície, o
 * gatilho dá a altura e o realce — e o realce depende de sobre o que ele
 * acende.
 *
 * Contexto e não CSS: `in-data-[size=…]` compila com `:where()`, que **não soma
 * especificidade**, então uma classe sob esse variante perde para a classe base
 * no mesmo elemento. Este projeto já pagou essa medição no `Command`.
 */
const TabsListContext = React.createContext<{
  size: TabsSize
  variant: TabsVariant
  stretch: boolean
  /** O marcador viajante já mediu e assumiu a pintura do realce. */
  indicatorReady: boolean
}>({ size: "md", variant: "solid", stretch: true, indicatorReady: false })

/**
 * `useLayoutEffect` mede antes da pintura — é o que evita o marcador aparecer
 * em 0,0 e escorregar até o lugar na primeira montagem. No servidor ele não
 * existe, e o React avisa; `useEffect` ali não muda nada, porque não há layout
 * para medir.
 */
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect

/** Junta o ref do hook de dissolução com o ref local da medição. */
function composeRefs<T>(...refs: Array<React.Ref<T> | undefined>) {
  return (node: T | null) => {
    for (const ref of refs) {
      if (typeof ref === "function") ref(node)
      else if (ref) (ref as React.RefObject<T | null>).current = node
    }
  }
}

function Tabs({
  className,
  orientation = "horizontal",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsOrientationContext.Provider value={orientation}>
      <TabsPrimitive.Root
        data-slot="tabs"
        orientation={orientation}
        className={cn(
          // `min-w-0` não é cosmético: sem ele, um `Tabs` que por acaso é item
          // de um flex herda `min-width: auto`, recusa encolher abaixo do
          // conteúdo, e a fileira `scrollable` **nunca transborda** — ela
          // simplesmente estica o pai. Medido no próprio catálogo: numa caixa
          // de 341px a lista saía com 511 e a dissolução ficava em `off`, sem
          // erro nenhum. É a mesma armadilha que o `DialogBody` documenta.
          "flex min-w-0 flex-col gap-2",
          "data-[orientation=vertical]:flex-row data-[orientation=vertical]:gap-4",
          className
        )}
        {...props}
      />
    </TabsOrientationContext.Provider>
  )
}

/**
 * A moldura. Ela pinta, e é ela que o `className` do `TabsList` dimensiona —
 * porque é a caixa externa, a que um layout posiciona.
 */
const tabsListFrameVariants = cva("flex", {
  variants: {
    variant: {
      /** A bandeja preenchida. A forma dominante, e o padrão. */
      solid: "rounded-lg bg-muted",
      /**
       * Sem bandeja: um fio percorre a fileira e o marcador do gatilho pousa
       * sobre ele. É separador de **itens**, a categoria que nunca perdeu o
       * traço — não a emenda de superfície que as tiras do `Card` deixaram
       * para trás.
       */
      underline:
        "border-border data-[orientation=horizontal]:border-b data-[orientation=vertical]:border-e",
      /** Nem bandeja nem fio: para dentro de uma superfície que já tem moldura. */
      ghost: "",
    },
    /**
     * `w-fit` é o padrão histórico; esticar ou rolar exige largura de verdade —
     * e `min-w-0` junto, senão a moldura carrega para fora o que a fileira
     * deveria rolar por dentro.
     */
    fill: { true: "w-full min-w-0", false: "w-fit shrink-0" },
  },
  defaultVariants: { variant: "solid", fill: false },
})

/**
 * A trilha. Ela **não desenha nada** — ver a invariante 2 no cabeçalho — e é
 * quem carrega o recuo, a rolagem e a máscara.
 */
const tabsListTrackVariants = cva("relative flex min-w-0 items-center", {
  variants: {
    variant: {
      solid: "gap-0.5 p-1",
      underline: "gap-1 p-1 data-[orientation=horizontal]:pb-0 data-[orientation=vertical]:pe-0",
      ghost: "gap-0.5 p-1",
    },
    orientation: {
      horizontal: "flex-row",
      vertical: "flex-col items-stretch",
    },
    fill: { true: "w-full", false: "" },
  },
  defaultVariants: { variant: "solid", orientation: "horizontal", fill: false },
})

const tabsTriggerVariants = cva(
  [
    "relative flex shrink-0 cursor-default items-center justify-center gap-1.5 text-sm font-medium whitespace-nowrap outline-hidden select-none",
    // A mesma duração e a mesma curva do marcador: a tinta do rótulo e o
    // deslocamento do realce são **um** evento, e relógios diferentes fariam a
    // aba acender antes de o marcador chegar.
    "transition-colors duration-(--duration-base) ease-(--ease-out)",
    // `ring-3`, o valor do sistema. Era `ring-2` aqui, e o `Tabs` era o único
    // controle fora do valor — a diferença de 1px só aparece quando uma aba e
    // um botão ficam na mesma linha, que é onde ela mais acontece.
    "focus-visible:ring-3 focus-visible:ring-ring/70",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ],
  {
    variants: {
      variant: {
        solid: [
          "rounded-md border border-transparent px-2",
          "text-muted-foreground hover:text-foreground active:text-foreground",
          "data-[state=active]:text-foreground",
        ].join(" "),
        underline: [
          // Borda nos dois lados do eixo, transparente, para o texto não
          // deslocar 2px quando a aba fica ativa. Quem pinta a aresta é o
          // marcador viajante; aqui ela só reserva o espaço.
          "border-2 border-transparent px-2",
          "data-[orientation=horizontal]:border-x-0 data-[orientation=vertical]:border-y-0",
          "text-muted-foreground hover:text-foreground active:text-foreground",
          "data-[state=active]:text-foreground",
        ].join(" "),
        ghost: [
          "rounded-md border border-transparent px-2",
          "text-muted-foreground hover:bg-muted hover:text-foreground active:bg-muted active:text-foreground",
          "data-[state=active]:text-foreground",
        ].join(" "),
      },
      size: {
        sm: `${TRIGGER_HEIGHT_CLASS[TABS_TRIGGER_HEIGHTS.sm]} text-control-sm`,
        md: TRIGGER_HEIGHT_CLASS[TABS_TRIGGER_HEIGHTS.md],
        lg: TRIGGER_HEIGHT_CLASS[TABS_TRIGGER_HEIGHTS.lg],
      },
      /**
       * O alvo de toque cresce **só quando a aba não estica**.
       *
       * Com `stretch`, uma aba ocupa um terço da largura da tela: a área do
       * alvo já é enorme, e forçar 44px de altura faria toda barra de abas de
       * telefone medir 52. Sem `stretch`, a aba tem a largura do rótulo e 28px
       * de altura, que é exatamente a situação para a qual o
       * `pointer-coarse:min-h-11` dos menus foi escrito.
       *
       * A pergunta é sobre o **apontador** e não sobre a largura da janela,
       * pela mesma razão que `hover: hover` é.
       */
      stretch: {
        true: "min-w-0 flex-1",
        false: "pointer-coarse:min-h-11",
      },
    },
    defaultVariants: { variant: "solid", size: "md", stretch: true },
  }
)

/**
 * O realce **enquanto não há medida** — e só enquanto.
 *
 * É a pintura que o gatilho fazia sozinho antes desta rodada, preservada para
 * a primeira pintura e para quem roda sem JavaScript. Assim que o marcador
 * viajante mede, ela sai e ele assume: sem isso, a aba ativa apareceria sem
 * marca nenhuma até a hidratação.
 */
const tabsTriggerFallbackVariants = cva("", {
  variants: {
    variant: {
      solid:
        "data-[state=active]:border-border/80 data-[state=active]:bg-background data-[state=active]:shadow-xs",
      underline: [
        // Acento, e não `--primary`: traço fino sobre o fundo é sempre acento —
        // `--primary` a este peso cai para 2:1 no tema escuro.
        "data-[state=active]:data-[orientation=horizontal]:border-b-primary-accent",
        "data-[state=active]:data-[orientation=vertical]:border-e-primary-accent",
      ].join(" "),
      ghost: "data-[state=active]:bg-muted",
    },
  },
  defaultVariants: { variant: "solid" },
})

/**
 * O marcador que viaja. Ele desenha o realce das três variantes — a mesma
 * geometria em todas, porque a caixa que ele ocupa é sempre a da aba ativa; o
 * que muda é a tinta.
 *
 * A caixa vem de quatro variáveis publicadas pela trilha, e não de props: uma
 * custom property atravessa o React sem re-render, e a medição roda num
 * observador. `translate` e `width`/`height` são o que transiciona.
 */
const tabsIndicatorVariants = cva(
  [
    // Sem `z-index` negativo, e a razão é mecânica: a moldura pinta
    // `bg-muted` e **não** cria contexto de empilhamento, então um `-z-10`
    // mandaria o marcador para trás dela e ele sumiria. Aqui ele é
    // posicionado com `z-index: auto` e vem **antes** dos gatilhos no DOM;
    // eles são `relative`, também `auto`, e por ordem de documento pintam por
    // cima. Nenhum dos dois precisa declarar camada.
    "pointer-events-none absolute top-0 left-0",
    "translate-x-(--tabs-indicator-x) translate-y-(--tabs-indicator-y)",
    "w-(--tabs-indicator-w) h-(--tabs-indicator-h)",
    // 200ms é a distância curta de uma fileira de abas: a 300 o marcador
    // arrasta e a interface parece lenta; a 100 ele pisca e não se lê como
    // deslocamento. A curva é a de chegada confiante do sistema.
    "transition-[translate,width,height] duration-(--duration-base) ease-(--ease-out)",
  ],
  {
    variants: {
      variant: {
        solid: "rounded-md border border-border/80 bg-background shadow-xs",
        underline: [
          "border-primary-accent",
          "data-[orientation=horizontal]:border-b-2 data-[orientation=vertical]:border-e-2",
        ].join(" "),
        // `ghost` existe no tipo porque a variante existe, e desenha o mesmo
        // que o gatilho desenharia — mas ele nunca é montado: ver
        // `VARIANTE_VIAJA`. Deixá-lo aqui evita que um `variant` novo passe a
        // cair num `undefined` silencioso.
        ghost: "rounded-md bg-muted",
      },
    },
    defaultVariants: { variant: "solid" },
  }
)

function TabsList({
  className,
  size = "md",
  variant = "solid",
  stretch,
  scrollable = false,
  children,
  ...props
}: Omit<React.ComponentProps<typeof TabsPrimitive.List>, "children"> & {
  size?: TabsSize
  variant?: TabsVariant
  /** Abas de largura igual, dividindo a linha. Padrão: só em `solid`. */
  stretch?: boolean
  /**
   * A fileira rola quando não cabe, dissolvendo nas pontas.
   *
   * Opt-in, e não por timidez: `scroll-fade-x` declara 36px de
   * `scroll-padding-inline`, e ligá-la sempre mudaria o `scrollIntoView` de
   * toda barra de abas do app — inclusive das que nunca transbordam.
   */
  scrollable?: boolean
  children?: React.ReactNode
}) {
  const orientation = React.useContext(TabsOrientationContext)

  /**
   * `scrollable` vence `stretch`, e o silêncio é o motivo de a precedência ser
   * explícita: com filhos `flex-1` a trilha nunca transborda
   * (`scrollWidth === clientWidth`), o hook marca `data-scroll-fade="off"` e a
   * prop não faria **nada** — sem erro, sem aviso.
   */
  const doesStretch = scrollable ? false : (stretch ?? variant === "solid")
  const axis = orientation === "vertical" ? "y" : "x"

  /**
   * A classe do fade é escolhida entre duas constantes literais, nunca montada.
   * O Tailwind varre o código como texto: `scroll-fade-${axis}` não existiria
   * para o scanner, e o CSS nunca seria gerado.
   *
   * O `ref` do hook devolve uma função de limpeza, e ela sobrevive à cadeia de
   * refs do Radix porque o `composeRefs` desta versão a propaga. É premissa de
   * dependência, como a instância única do `Dialog`: se ela cair, o
   * `ResizeObserver` vaza a cada desmontagem.
   */
  const fadeClassName =
    axis === "y" ? scrollFadeViewportClassName : scrollFadeViewportXClassName
  const scrollFadeRef = useScrollFade({ axis })

  /**
   * A medição do marcador viajante.
   *
   * Ela lê `offsetLeft`/`offsetTop` **relativos à trilha**, e não
   * `getBoundingClientRect`: com `scrollable` a trilha rola, e uma caixa em
   * coordenada de viewport faria o marcador escorregar para fora da aba a cada
   * pixel rolado. Em coordenada de conteúdo ele acompanha a rolagem de graça,
   * porque é filho do mesmo elemento que rola.
   *
   * Os dois observadores cobrem coisas diferentes: o `ResizeObserver` pega
   * mudança de largura (janela, fonte, rótulo que troca) e o `MutationObserver`
   * pega a troca de aba, que é uma mudança de `data-state` escrita pelo Radix.
   * Observar `data-state` em vez de receber o valor por prop é o que faz o
   * marcador seguir **também** a troca programática e a navegação por seta.
   */
  const trilhaRef = React.useRef<HTMLDivElement | null>(null)
  const [medido, setMedido] = React.useState(false)
  const viaja = VARIANTE_VIAJA[variant]
  const indicatorReady = viaja && medido

  useIsomorphicLayoutEffect(() => {
    const trilha = trilhaRef.current
    // O `ghost` não mede nem observa nada: sem marcador, não há caixa a
    // publicar, e os dois observadores seriam custo puro.
    if (!trilha || !viaja) return

    const medir = () => {
      const ativa = trilha.querySelector<HTMLElement>(
        '[data-slot="tabs-trigger"][data-state="active"]'
      )
      if (!ativa) {
        setMedido(false)
        return
      }
      trilha.style.setProperty("--tabs-indicator-x", `${ativa.offsetLeft}px`)
      trilha.style.setProperty("--tabs-indicator-y", `${ativa.offsetTop}px`)
      trilha.style.setProperty("--tabs-indicator-w", `${ativa.offsetWidth}px`)
      trilha.style.setProperty("--tabs-indicator-h", `${ativa.offsetHeight}px`)
      setMedido(true)
    }

    medir()

    const ro = new ResizeObserver(medir)
    ro.observe(trilha)
    for (const gatilho of trilha.querySelectorAll('[data-slot="tabs-trigger"]')) {
      ro.observe(gatilho)
    }

    const mo = new MutationObserver(medir)
    mo.observe(trilha, {
      attributes: true,
      attributeFilter: ["data-state"],
      subtree: true,
      childList: true,
    })

    return () => {
      ro.disconnect()
      mo.disconnect()
    }
  }, [viaja, variant, doesStretch, size, orientation, scrollable])

  return (
    <TabsListContext.Provider
      value={{ size, variant, stretch: doesStretch, indicatorReady }}
    >
      <div
        data-slot="tabs-list-frame"
        data-orientation={orientation}
        className={cn(
          tabsListFrameVariants({
            variant,
            // O `underline` **horizontal** ocupa a largura toda mesmo sem
            // esticar as abas: o fio dele é a fronteira entre a fileira e o
            // painel, e um fio que para depois da última aba lê como
            // sublinhado do grupo, não como base da página. As abas continuam
            // do tamanho do rótulo — quem estica é a trilha, não a moldura.
            //
            // Na vertical **não**: ali o fio é o de uma coluna, e ele já se
            // estica sozinho no eixo de bloco pelo `align-items: stretch` do
            // pai. Forçar `w-full` esmagava o painel contra a borda — medido,
            // com o texto saindo em coluna de quatro letras.
            fill:
              doesStretch ||
              scrollable ||
              (variant === "underline" && orientation === "horizontal"),
          }),
          className
        )}
      >
        <TabsPrimitive.List
          ref={composeRefs(
            trilhaRef,
            scrollable ? scrollFadeRef : undefined
          )}
          data-slot="tabs-list"
          data-orientation={orientation}
          className={cn(
            tabsListTrackVariants({
              variant,
              orientation,
              fill: doesStretch || scrollable,
            }),
            scrollable && [
              fadeClassName,
              axis === "x"
                ? "overflow-x-auto overscroll-x-contain touch-pan-x"
                : "overflow-y-auto overscroll-y-contain touch-pan-y",
              // `no-scrollbar` não existe neste projeto — é usada em quatro
              // arquivos e não está definida em lugar nenhum. Aqui as duas
              // declarações vão por extenso em vez de herdar a classe morta.
              "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
            ]
          )}
          {...props}
        >
          {/* Primeiro filho e `-z-10`: os gatilhos são `relative`, então eles
              pintam por cima sem precisar de `z-index` próprio. O marcador só
              existe depois de medido — montá-lo antes o faria escorregar de
              0,0 até o lugar na primeira pintura. */}
          {indicatorReady ? (
            <span
              aria-hidden
              data-slot="tabs-indicator"
              data-orientation={orientation}
              className={tabsIndicatorVariants({ variant })}
            />
          ) : null}
          {children}
        </TabsPrimitive.List>
      </div>
    </TabsListContext.Provider>
  )
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  const { size, variant, stretch, indicatorReady } =
    React.useContext(TabsListContext)

  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        tabsTriggerVariants({ variant, size, stretch }),
        // Enquanto o marcador não mediu, o gatilho pinta o próprio realce —
        // ver `tabsTriggerFallbackVariants`. Um booleano do contexto, e não um
        // seletor: `:where()` não soma especificidade.
        !indicatorReady && tabsTriggerFallbackVariants({ variant }),
        className
      )}
      {...props}
    />
  )
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn(
        "min-w-0 flex-1 outline-none focus-visible:ring-3 focus-visible:ring-ring/70",
        // O painel **reconhece** a troca, e nada mais: 150ms de fade com 4px de
        // assentamento. O Radix desmonta o painel inativo, então só existe
        // entrada — e é bom que seja curta, porque quem trocou de aba veio ler,
        // não assistir. O `data-[state=active]` guarda contra `forceMount`.
        "data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:slide-in-from-bottom-1",
        "duration-(--duration-fast) ease-(--ease-out)",
        className
      )}
      {...props}
    />
  )
}

export {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  tabsListFrameVariants,
  tabsListTrackVariants,
  tabsTriggerVariants,
  tabsIndicatorVariants,
}
export type { TabsOrientation, TabsSize, TabsVariant }
