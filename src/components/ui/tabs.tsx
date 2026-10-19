"use client"

import * as React from "react"
import { cva } from "class-variance-authority"
import { Slot, Tabs as TabsPrimitive } from "radix-ui"
import { composeRefs } from "radix-ui/internal"
import { PlusIcon, XMarkIcon } from "@heroicons/react/16/solid"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { glassControlSurfaceClassName } from "@/lib/glass-classes"
import { limparExcesso, quemSai } from "@/lib/overflow"
import { OverflowMenu } from "@/lib/overflow-menu"
import {
  scrollFadeViewportClassName,
  scrollFadeViewportXClassName,
} from "@/lib/scroll-fade-classes"
import { useMarcador } from "@/hooks/use-marcador"
import { useScrollFade } from "@/hooks/use-scroll-fade"
import { isEditableTarget } from "@/lib/shortcut"

/**
 * Painéis irmãos do mesmo nível, dos quais só um aparece por vez.
 * `size` mede o gatilho (`sm` 28, `md` 32, `lg` 36) e a bandeja cresce em volta
 * (a padrão é 40): ancorar a escada no contêiner entregava um gatilho de 27,
 * abaixo do piso de 28 (a mesma raiz que o `Menubar` corrigiu). A lista não
 * declara altura.
 * A moldura fica fora da lista e a lista não desenha nada: a dissolução recorta
 * o alfa do elemento inteiro (invariante 2 de `lib/scroll-fade-classes`), e uma
 * bandeja mascarada sairia com os cantos apagados. A moldura vai fora, e não
 * dentro, porque um nó entre `role="tablist"` e as `role="tab"` mexe na posse
 * ARIA (a razão do `ButtonGroup` não embrulhar um trilho segmentado).
 * O recuo é da lista, não da moldura: `overflow-x` recorta no padding box, e com
 * o `p-1` na moldura o `focus-visible:ring-3` do primeiro e do último gatilho
 * seria cortado. Em `underline` a lista precisa de `pb-0` para o marcador
 * encontrar o fio, e ali o anel perde 3px na base (aceito).
 * O marcador é um objeto só, e viaja: `tabs-indicator`, absoluto dentro da
 * trilha, que publica a caixa da aba ativa em `--tabs-indicator-x/y/w/h`. Está
 * fora do fluxo, então animar `width`/`height` não reflui irmão; `scaleX` foi
 * descartado porque distorce o raio e a borda de 1px do `solid`. A medição é um
 * `ResizeObserver` na trilha e nos gatilhos mais um `MutationObserver` em
 * `data-state` (cobre a troca programática, que o Radix marca), sem
 * `requestAnimationFrame` em laço.
 * Antes de haver medida (e sem JavaScript) o gatilho se pinta sozinho, e só
 * para quando o marcador está vivo. A troca é um booleano no contexto
 * (`indicatorReady`), e não um seletor: `in-*` e `group-*` compilam com
 * `:where()` e não somam especificidade.
 * Movimento reduzido: o bloco global encurta transições para 0,01ms, o marcador
 * salta e o estado final chega igual.
 */

type TabsSize = "sm" | "md" | "lg" | "xl"
type TabsVariant = "floating" | "solid" | "underline" | "plain"
type TabsOrientation = "horizontal" | "vertical"

/**
 * A escada, como dado e não como classe: um teste sobre a saída de `cva` só casa
 * substring, e isso tranca a grafia em vez da medida. Com a escada em número, o
 * teste pergunta o que interessa (nenhum degrau abaixo de 28, passos de 4,
 * nenhuma altura na lista).
 * `size` nomeia a bandeja, a caixa que um layout posiciona (como `Button`,
 * `Toggle`, `Select`), para `lg` alinhar com a linha de controles de 36 sem
 * ninguém dizer `size`.
 * | `size` | bandeja | gatilho |
 * | --- | --- | --- |
 * | `sm` | 28 | 24 |
 * | `md` | 32 | 28 |
 * | `lg` | **36** | 32 |
 * | `xl` | 40 | 36 |
 * `xl` é o que o app renderiza no telefone (`transaction-type-segment.tsx`).
 * O degrau padrão é `lg` nas quatro variantes: `floating` e `solid` são
 * controle segmentado numa linha de controles (bandeja de 36, rente ao `Button`
 * e ao `Input`); `underline` e `plain` são abas de página, que dividem a página
 * com título e texto corrido. `lg` é o degrau em que o rótulo volta ao corpo de
 * texto da página: só `sm` e `md` carregam `text-control-sm` (12,8px); `lg` e
 * `xl` herdam o `text-sm`.
 */
export const DEFAULT_TABS_SIZE: TabsSize = "lg"

/**
 * O vão entre o marcador e a borda da bandeja, além do recuo da trilha. No
 * `floating` o marcador é desenhado 2px para dentro da aba (mais ar em volta da
 * ativa), e o vão vai de 2 para 4px sem mexer na escada: a bandeja continua 36 e
 * a aba 32, e o alvo de clique é a aba inteira (recuar a trilha derrubaria a aba
 * a 28). O marcador sai com 28 de altura no `lg`.
 */
const RECUO_DO_MARCADOR: Record<TabsVariant, number> = {
  floating: 2,
  solid: 0,
  underline: 0,
  plain: 0,
}

/** As variantes que são controle segmentado: esticam e medem 36 de fábrica. */
const SEGMENTADA: Record<TabsVariant, boolean> = {
  floating: true,
  solid: true,
  underline: false,
  plain: false,
}

export const TABS_SIZES = {
  sm: { tray: 28, trigger: 24 },
  md: { tray: 32, trigger: 28 },
  lg: { tray: 36, trigger: 32 },
  xl: { tray: 40, trigger: 36 },
} as const

/*
 * O recuo da trilha (`p-0.5`, em `tabsListTrackVariants`) é um só: as chamadas
 * migradas pediam todas o mesmo, e eixo sem contagem sai. Custo aceito: sob
 * `scrollable`, `overflow-x` recorta no padding box e o anel de foco de 3px
 * perde 1px nas pontas horizontais.
 */

export const TABS_TRAY_HEIGHTS = {
  sm: TABS_SIZES.sm.tray,
  md: TABS_SIZES.md.tray,
  lg: TABS_SIZES.lg.tray,
  xl: TABS_SIZES.xl.tray,
} as const

/**
 * A ponte número → classe. Não monta classe nenhuma em runtime (o Tailwind varre
 * texto; `pointer-coarse:h-9` montada não chegava ao CSS). As classes são
 * escritas por extenso nos `cva`; esta tabela existe para o teste provar que os
 * literais e a escada não divergiram.
 */
export const ALTURA_CLASS = {
  24: "h-6",
  28: "h-7",
  32: "h-8",
  36: "h-9",
  40: "h-10",
} as const

/**
 * Quem tem marcador viajante; o `plain` não tem, de propósito. O marcador viaja
 * ao longo de alguma coisa (a bandeja do `solid`, o fio do `underline`); sem
 * trilho o movimento viraria um bloco preenchido deslizando sozinho, na variante
 * escolhida para não chamar atenção. Sem marcador, o `plain` cai no caminho de
 * antes da hidratação: cada gatilho pinta o próprio realce, e a tinta troca com
 * `transition-colors` (mudança de cor, não deslocamento).
 */
const VARIANTE_VIAJA: Record<TabsVariant, boolean> = {
  floating: true,
  solid: true,
  underline: true,
  plain: false,
}

/**
 * A orientação desce por contexto porque a moldura é o único nó que o Radix não
 * carimba. Root e Content recebem `data-orientation` do `Tabs`; List e Trigger
 * recebem do `RovingFocusGroup` que renderizam por dentro (detalhe de uma
 * dependência, a premissa a olhar se o marcador de `underline` aparecer no lado errado).
 */
const TabsOrientationContext =
  React.createContext<TabsOrientation>("horizontal")

/**
 * Tamanho, superfície e distribuição descem por contexto, pela razão do `Menubar`: a
 * moldura dá a superfície, o gatilho dá a altura e o realce, que depende de
 * sobre o que ele acende. Contexto e não CSS: `in-data-[size=…]` compila com
 * `:where()`, e a classe perderia para a base no mesmo elemento.
 */
const TabsListContext = React.createContext<{
  size: TabsSize
  variant: TabsVariant
  stretch: boolean
  /** O marcador viajante já mediu e assumiu a pintura do realce. */
  indicatorReady: boolean
}>({ size: "lg", variant: "floating", stretch: true, indicatorReady: false })

/**
 * O estado mora na raiz. O Radix guarda a aba ativa sozinho, e nada fora dele
 * sabia dela nem para onde ela andou. Com o valor aqui (controlado ou não,
 * entregue controlado ao Radix) passam a existir: o sentido da última troca (o
 * painel desliza do lado certo), a aba na URL, o arrastar no telefone, os
 * atalhos ⌥1–9, o menu "Mais" e os painéis já vistos (`keepMounted`). A ordem
 * das abas é a do DOM (`[data-slot=tabs-trigger]` com `data-value`), a que a
 * pessoa vê.
 */
type TabsRootValue = {
  value: string | undefined
  setValue: (v: string) => void
  /** +1 andou para a frente, −1 para trás, 0 sem troca ainda. */
  sentido: number
  /** Os painéis já mostrados, para `keepMounted`. */
  vistas: ReadonlySet<string>
  /** Vai à vizinha (`+1`/`−1`), pulando as desabilitadas. */
  andar: (passo: number) => void
  shortcuts: boolean
}
const TabsRootContext = React.createContext<TabsRootValue | null>(null)

function abasDe(raiz: HTMLElement | null) {
  return raiz
    ? [...raiz.querySelectorAll<HTMLElement>('[data-slot="tabs-trigger"]')].filter(
        // Só as desta raiz, e não as de um `Tabs` aninhado num painel.
        (t) => t.closest('[data-slot="tabs"]') === raiz
      )
    : []
}

function Tabs({
  className,
  orientation = "horizontal",
  value: valueProp,
  defaultValue,
  onValueChange,
  urlParam,
  swipe = false,
  shortcuts = false,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root> & {
  /**
   * A aba na URL (`?aba=faturas`): lida ao abrir, depois da hidratação, e gravada
   * a cada troca com `history.replaceState` (a régua do `urlState` do
   * `DataTable`, sem `useSearchParams`, que pediria um `Suspense` em volta de toda
   * página estática).
   */
  urlParam?: string
  /** Arrastar o painel para os lados troca de aba, no toque. */
  swipe?: boolean
  /**
   * ⌥1…⌥9 vão para a aba N. Não é ⌘ (⌘1–9 troca a aba do navegador e o Chrome não
   * deixa cancelar, como `mod+n/t/w` no `Command`). Fora de campo de texto, e
   * anunciado em `aria-keyshortcuts`.
   */
  shortcuts?: boolean
}) {
  const [interno, setInterno] = React.useState(defaultValue)
  const value = valueProp !== undefined ? valueProp : interno
  const [sentido, setSentido] = React.useState(0)
  const [vistas, setVistas] = React.useState<ReadonlySet<string>>(
    () => new Set(value ? [value] : [])
  )
  if (value && !vistas.has(value)) setVistas(new Set([...vistas, value]))
  const raizRef = React.useRef<HTMLDivElement>(null)

  const setValue = React.useCallback(
    (proximo: string) => {
      if (proximo === value) return
      const valores = abasDe(raizRef.current).map((t) => t.dataset.value)
      const de = valores.indexOf(value)
      const para = valores.indexOf(proximo)
      setSentido(de === -1 || para === -1 ? 0 : Math.sign(para - de))
      if (valueProp === undefined) setInterno(proximo)
      onValueChange?.(proximo)
    },
    [value, valueProp, onValueChange]
  )

  const andar = React.useCallback(
    (passo: number) => {
      const abas = abasDe(raizRef.current).filter((t) => !t.hasAttribute("disabled"))
      const i = abas.findIndex((t) => t.dataset.value === value)
      const alvo = abas[i + passo]?.dataset.value
      if (alvo) setValue(alvo)
    },
    [value, setValue]
  )

  // A URL: lida uma vez, depois da hidratação.
  const urlLida = React.useRef(false)
  React.useEffect(() => {
    if (!urlParam || urlLida.current) return
    urlLida.current = true
    const daUrl = new URLSearchParams(window.location.search).get(urlParam)
    if (daUrl && abasDe(raizRef.current).some((t) => t.dataset.value === daUrl)) setValue(daUrl)
  }, [urlParam, setValue])
  React.useEffect(() => {
    if (!urlParam || !urlLida.current || !value) return
    const params = new URLSearchParams(window.location.search)
    if (params.get(urlParam) === value) return
    // A aba de fábrica não suja o endereço: só vai para a URL depois de trocar.
    if (!params.has(urlParam) && value === defaultValue) return
    params.set(urlParam, value)
    window.history.replaceState(
      window.history.state,
      "",
      `${window.location.pathname}?${params.toString()}${window.location.hash}`
    )
  }, [urlParam, value, defaultValue])

  // ⌥1…⌥9. `code`, e não `key`: no Mac o ⌥ troca o caractere ("¡", "™").
  React.useEffect(() => {
    if (!shortcuts) return
    const aoTeclar = (e: KeyboardEvent) => {
      if (!e.altKey || e.metaKey || e.ctrlKey || isEditableTarget(e.target)) return
      const m = /^Digit([1-9])$/.exec(e.code)
      if (!m) return
      const aba = abasDe(raizRef.current)[Number(m[1]) - 1]
      if (!aba || aba.hasAttribute("disabled") || !aba.dataset.value) return
      e.preventDefault()
      setValue(aba.dataset.value)
    }
    document.addEventListener("keydown", aoTeclar)
    return () => document.removeEventListener("keydown", aoTeclar)
  }, [shortcuts, setValue])

  const contexto = React.useMemo<TabsRootValue>(
    () => ({ value, setValue, sentido, vistas, andar, shortcuts }),
    [value, setValue, sentido, vistas, andar, shortcuts]
  )

  return (
    <TabsRootContext.Provider value={contexto}>
      <TabsSwipeContext.Provider value={swipe}>
        <TabsOrientationContext.Provider value={orientation}>
          <TabsPrimitive.Root
            ref={raizRef}
            data-slot="tabs"
            orientation={orientation}
            value={value}
            onValueChange={setValue}
            className={cn(
              // `min-w-0` não é cosmético: sem ele, um `Tabs` que é item de um flex herda
              // `min-width: auto`, recusa encolher abaixo do conteúdo e a fileira `scrollable`
              // nunca transborda (estica o pai, sem erro). A mesma armadilha do `DialogBody`.
              "flex min-w-0 flex-col gap-2",
              "data-[orientation=vertical]:flex-row data-[orientation=vertical]:gap-4",
              className
            )}
            {...props}
          />
        </TabsOrientationContext.Provider>
      </TabsSwipeContext.Provider>
    </TabsRootContext.Provider>
  )
}

const TabsSwipeContext = React.createContext(false)

/**
 * A moldura pinta, e é ela que o `className` do `TabsList` dimensiona (a caixa
 * externa, a que um layout posiciona).
 */
const tabsListFrameVariants = cva("flex", {
  variants: {
    variant: {
      /**
       * O padrão: a pílula flutuante da casa, a placa chapada dos flutuantes
       * (`--popover`), o anel de 1px e nenhuma sombra (fica no plano da linha de
       * controles). Sem vidro: nenhum trilho deste app é fixo.
       * Na vertical a pílula vira placa (`rounded-surface`): numa coluna de três abas
       * o `rounded-full` viraria um estádio com as pontas cortando a primeira e a
       * última aba (a seção agrupada do iOS 26).
       */
      floating:
        "rounded-full bg-popover ring-1 ring-foreground/10 data-[orientation=vertical]:self-start data-[orientation=vertical]:rounded-surface",
      /**
       * A bandeja preenchida. Na vertical não acompanha a altura do painel
       * (`self-start`): uma bandeja que desce até o fim do texto lê como coluna vazia.
       */
      solid: "rounded-full bg-muted data-[orientation=vertical]:self-start data-[orientation=vertical]:rounded-surface",
      /**
       * Sem bandeja: um fio percorre a fileira e o marcador pousa sobre ele. É
       * separador de itens, a categoria que nunca perdeu o traço.
       */
      underline:
        "border-border data-[orientation=horizontal]:border-b data-[orientation=vertical]:border-e",
      /** Nem bandeja nem fio: para dentro de uma superfície que já tem moldura. */
      plain: "data-[orientation=vertical]:self-start",
    },
    /**
     * `w-fit` é o padrão; esticar ou rolar exige largura de verdade, e `min-w-0`
     * junto, senão a moldura carrega para fora o que a fileira deveria rolar por dentro.
     */
    fill: { true: "w-full min-w-0", false: "w-fit shrink-0" },
    /**
     * A altura do componente: é esta caixa que um layout posiciona, e por isso
     * `size` a nomeia. O piso de toque é `pointer-coarse:h-11` (44, o alvo do iOS; 40 até a rodada 332), o degrau da
     * `Toolbar` (`--toolbar-control`) e o que o app renderiza no telefone; a
     * pergunta é o apontador, não a largura.
     * A altura só existe na horizontal: na vertical `size` não significa nada (o
     * eixo cruzado vira a largura e a altura a soma das linhas). Incondicional, a
     * moldura vertical saía com 36px para 106px de conteúdo, e o `border-e` percorria
     * só os 36 primeiros pixels como um traço parado que não acompanhava o marcador.
     */
    size: {
      sm: "data-[orientation=horizontal]:h-7 pointer-coarse:data-[orientation=horizontal]:h-11",
      md: "data-[orientation=horizontal]:h-8 pointer-coarse:data-[orientation=horizontal]:h-11",
      lg: "data-[orientation=horizontal]:h-9 pointer-coarse:data-[orientation=horizontal]:h-11",
      xl: "data-[orientation=horizontal]:h-10 pointer-coarse:data-[orientation=horizontal]:h-11",
    },
  },
  defaultVariants: { variant: "floating", size: "lg", fill: false },
})

/** A trilha: não desenha nada (invariante 2) e carrega o recuo, a rolagem e a máscara. */
const tabsListTrackVariants = cva(
  "relative flex min-w-0 items-center p-0.5",
  {
    variants: {
      variant: {
        floating: "gap-0.5",
        solid: "gap-0.5",
        underline:
          "gap-1 data-[orientation=horizontal]:pb-0 data-[orientation=vertical]:pe-0",
        plain: "gap-0.5",
      },
      orientation: {
        horizontal: "flex-row",
        vertical: "flex-col items-stretch",
      },
      fill: { true: "w-full", false: "" },
      /**
       * O realce de estado do marcador de vidro, publicado aqui: custom property não
       * atravessa para irmão, e a trilha é o pai dos dois (o `:has()` pergunta pelo
       * gatilho e o marcador lê por herança; a razão da opção `shell` do `useScrollFade`).
       * O `:hover` mora dentro de `@media (hover: hover)`, à mão: num seletor
       * arbitrário ele não ganha a mídia da variante `hover:`, e no telefone o toque o
       * acenderia e ele grudaria. O par `:active` é a resposta do dedo.
       * O realce vira de direção com o tema, pela régua do `--secondary-hover`: a
       * lâmina clara é 92% branca e um realce branco não desenharia nada. Puxa sempre
       * na direção do contato: escurece no claro, clareia no escuro.
       */
      glass: {
        true: [
          "[@media(hover:hover)]:has-[[data-slot=tabs-trigger][data-state=active]:hover]:[--glass-sheen:oklch(0_0_0_/_5%)]",
          "has-[[data-slot=tabs-trigger][data-state=active]:active]:[--glass-sheen:oklch(0_0_0_/_9%)]",
          "dark:[@media(hover:hover)]:has-[[data-slot=tabs-trigger][data-state=active]:hover]:[--glass-sheen:oklch(1_0_0_/_7%)]",
          "dark:has-[[data-slot=tabs-trigger][data-state=active]:active]:[--glass-sheen:oklch(1_0_0_/_12%)]",
        ].join(" "),
        false: "",
      },
    },
    defaultVariants: {
      variant: "floating",
      orientation: "horizontal",
      fill: false,
      glass: false,
    },
  }
)


const tabsTriggerVariants = cva(
  [
    "relative flex shrink-0 cursor-default items-center gap-1.5 text-sm font-medium whitespace-nowrap outline-hidden select-none",
    // Centrado na horizontal, alinhado ao início na vertical: com `justify-center`
    // nas duas, numa coluna os rótulos começavam em larguras diferentes (borda
    // serrilhada). Uma coluna de navegação se lê pela margem esquerda.
    "data-[orientation=horizontal]:justify-center data-[orientation=vertical]:justify-start",
    // A mesma duração e curva do marcador: a tinta do rótulo e o deslocamento do
    // realce são um evento só, e relógios diferentes fariam a aba acender antes de o
    // marcador chegar.
    "transition-colors duration-(--duration-base) ease-(--ease-out)",
    // `ring-3`, o valor do sistema: a diferença de 1px aparece quando uma aba e um
    // botão ficam na mesma linha.
    "focus-visible:ring-3 focus-visible:ring-ring/45",
    // No dedo a aba alcança os 44 do alvo do iOS (rodada 332): a bandeja mede 44 e
    // a aba menos, por dentro do recuo; o `::after` de altura fixa, centrado, cobre
    // o recuo sem mexer no desenho. Altura fixa e não "aba + recuo": o `::after`
    // mede por dentro da borda de 1px, e o recuo muda de variante para variante.
    "pointer-coarse:data-[orientation=horizontal]:after:absolute pointer-coarse:data-[orientation=horizontal]:after:inset-x-0 pointer-coarse:data-[orientation=horizontal]:after:top-1/2 pointer-coarse:data-[orientation=horizontal]:after:h-11 pointer-coarse:data-[orientation=horizontal]:after:-translate-y-1/2 pointer-coarse:data-[orientation=horizontal]:after:content-['']",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ],
  {
    variants: {
      variant: {
        // A pílula pede mais ar nas pontas que o retângulo: com `px-2` o rótulo encostava na curva.
        floating: [
          "rounded-full border border-transparent px-3",
          "text-muted-foreground hover:text-foreground active:text-foreground",
          "data-[state=active]:text-foreground",
        ].join(" "),
        solid: [
          "rounded-full border border-transparent px-2.5",
          "text-muted-foreground hover:text-foreground active:text-foreground",
          "data-[state=active]:text-foreground",
        ].join(" "),
        underline: [
          // Borda nos dois lados do eixo, transparente, para o texto não deslocar 2px
          // quando a aba fica ativa; quem pinta a aresta é o marcador, aqui ela só reserva o espaço.
          "border-2 border-transparent px-2",
          "data-[orientation=horizontal]:border-x-0 data-[orientation=vertical]:border-y-0",
          "text-muted-foreground hover:text-foreground active:text-foreground",
          "data-[state=active]:text-foreground",
        ].join(" "),
        plain: [
          "rounded-full border border-transparent px-2.5",
          "text-muted-foreground hover:bg-muted hover:text-foreground active:bg-muted active:text-foreground",
          "data-[state=active]:text-foreground",
        ].join(" "),
      },
      /**
       * A altura do gatilho deriva da bandeja (`bandeja − 2×recuo`): 24 · 28 · 32 · 36.
       * No dedo a bandeja mede 44 e o gatilho 40 (rodada 332; eram 40 e 36): com 36
       * numa bandeja de 44, a pílula ficava a 6px da borda em cima e a 4px dos lados.
       */
      size: {
        sm: "h-6 pointer-coarse:h-10 text-control-sm",
        md: "h-7 pointer-coarse:h-10 text-control-sm",
        lg: "h-8 pointer-coarse:h-10",
        xl: "h-9 pointer-coarse:h-10",
      },
      /**
       * O alvo de toque cresce só quando a aba não estica. Com `stretch`, uma aba
       * ocupa um terço da tela e forçar 44px faria toda barra de abas de telefone
       * medir 52; sem `stretch`, a aba tem a largura do rótulo e 28px de altura. A
       * pergunta é o apontador, não a largura.
       */
      stretch: {
        true: "min-w-0 flex-1",
        /**
         * Sem `pointer-coarse:min-h-11` aqui: ele dava 44px a uma aba de largura de
         * rótulo e fazia a bandeja medir 48 contra controles de 40 no telefone. No toque
         * cresce a bandeja, que sobe um degrau e leva o gatilho junto (`md` vira 40/36).
         */
        false: "",
      },
    },
    defaultVariants: { variant: "floating", size: "lg", stretch: true },
  }
)

/**
 * O realce enquanto não há medida, e só enquanto: a pintura que o gatilho fazia
 * sozinho, para a primeira pintura e para quem roda sem JavaScript. Quando o
 * marcador mede, ela sai e ele assume.
 */
const tabsTriggerFallbackVariants = cva("", {
  variants: {
    variant: {
      floating:
        "data-[state=active]:bg-muted data-[state=active]:ring-1 data-[state=active]:ring-foreground/10 data-[state=active]:shadow-xs",
      solid:
        "data-[state=active]:border-border/80 data-[state=active]:bg-background data-[state=active]:shadow-xs",
      underline: [
        // Acento, e não `--primary`: traço fino sobre o fundo é sempre acento
        // (`--primary` a este peso cai para 2:1 no escuro).
        "data-[state=active]:data-[orientation=horizontal]:border-b-primary-accent",
        "data-[state=active]:data-[orientation=vertical]:border-e-primary-accent",
      ].join(" "),
      plain: "data-[state=active]:bg-muted",
    },
  },
  defaultVariants: { variant: "floating" },
})

/**
 * O marcador que viaja: desenha o realce das três variantes, com a mesma
 * geometria (a caixa da aba ativa); muda a tinta. A caixa vem de quatro
 * variáveis publicadas pela trilha (uma custom property atravessa o React sem
 * re-render), e `translate` e `width`/`height` são o que transiciona.
 */
const tabsIndicatorVariants = cva(
  [
    // Sem `z-index` negativo: a moldura pinta `bg-muted` e não cria contexto de
    // empilhamento, então `-z-10` mandaria o marcador para trás dela. Ele é `auto` e
    // vem antes dos gatilhos no DOM; eles são `relative` e pintam por cima.
    "pointer-events-none absolute top-0 left-0",
    "translate-x-(--tabs-indicator-x) translate-y-(--tabs-indicator-y)",
    "w-(--tabs-indicator-w) h-(--tabs-indicator-h)",
    // Sem transição de CSS: a viagem é a do `ThemeToggle`, em WAAPI (o trajeto com
    // inércia e o esticão que acompanha a velocidade, `lib/liquid-move`). As
    // variáveis são o repouso; a animação, com `fill: "none"`, só cobre o caminho.
  ],
  {
    variants: {
      // A superfície do `solid` não mora aqui: é composta abaixo, um ramo para cada
      // valor de `glass` (a forma do `ColorTile`; asserção 13 de `glass.test.ts`: onde
      // o eixo dispensa o neutralizador, ele não pode existir, e apagar `bg-background`
      // com `bg-transparent` morreria calado sob o shorthand `background` da utility).
      variant: {
        floating: "rounded-full",
        solid: "rounded-full",
        underline: [
          "border-primary-accent",
          "data-[orientation=horizontal]:border-b-2 data-[orientation=vertical]:border-e-2",
        ].join(" "),
        // `plain` existe no tipo porque a variante existe, mas nunca é montado (ver
        // `VARIANTE_VIAJA`); deixá-lo evita um `undefined` silencioso num `variant` novo.
        plain: "rounded-full bg-muted",
      },
      glass: { true: "", false: "" },
    },
    compoundVariants: [
      /**
       * O marcador do `floating` é uma tecla em relevo sobre a placa: `--muted` com
       * anel e sombra mínima. A sombra é dele; a bandeja não tem nenhuma.
       */
      { variant: "floating", glass: false, class: "bg-muted ring-1 ring-foreground/10 shadow-xs" },
      {
        variant: "floating",
        glass: true,
        class: [glassControlSurfaceClassName, "shadow-xs", "[--glass-tone:var(--muted)]"].join(" "),
      },
      { variant: "solid", glass: false, class: "border border-border/80 bg-background shadow-xs" },
      /**
       * O marcador de vidro. O corpo é idêntico ao chapado (`--glass-tone` é
       * `--background` opaco, o que o ramo de cima pinta): entra só o aro, que faz o
       * material, sem mover contraste. A borda já estava ali (`border-border/80`), então
       * o aro, pintado no `border-box`, não custa os 2px que custaria numa bandeja
       * `h-8` (26 para um gatilho de 28, e a escada está trancada por cinco asserções).
       * `glass-control` porque a peça é pequena: encolhe a pegada das nuvens, movendo
       * só a variável.
       */
      {
        variant: "solid",
        glass: true,
        class: [
          glassControlSurfaceClassName,
          "shadow-xs",
          "[--glass-tone:var(--background)]",
        ].join(" "),
      },
    ],
    defaultVariants: { variant: "floating", glass: false },
  }
)

function TabsList({
  className,
  size,
  variant = "floating",
  stretch,
  scrollable = false,
  overflow,
  glass = false,
  end,
  children,
  ...props
}: Omit<React.ComponentProps<typeof TabsPrimitive.List>, "children"> & {
  size?: TabsSize
  variant?: TabsVariant
  /** Abas de largura igual, dividindo a linha. Padrão: no `floating` e no `solid`. */
  stretch?: boolean
  /**
   * O marcador vira a peça de vidro do sistema, o *thumb* que viaja (como um
   * controle segmentado do iOS). Só a peça que se move, nunca a bandeja: abrir a
   * lâmina a 60% no escuro leva a bandeja de rgb 38 para 27 e ela deixa de ler
   * como bandeja. Opt-in, sem efeito no `underline` (fio de 2px, sem corpo) nem no
   * `plain` (nem é montado).
   */
  glass?: boolean
  /**
   * A fileira rola quando não cabe, dissolvendo nas pontas. Opt-in: `scroll-fade-x`
   * declara 36px de `scroll-padding-inline`, e ligá-la sempre mudaria o
   * `scrollIntoView` de toda barra de abas, inclusive das que nunca transbordam.
   */
  scrollable?: boolean
  /**
   * `"menu"`: as abas que não cabem saem da fileira para o menu ⋯ (Mais abas), no
   * fim. A ativa nunca sai (sai a última que cabia). Alternativa ao `scrollable`.
   */
  overflow?: "menu"
  /**
   * O que vem depois das abas, dentro da moldura e fora do `tablist` (o `TabsAdd`,
   * uma ação): um nó que não é aba entre o `tablist` e as `tab` quebra a posse ARIA.
   */
  end?: React.ReactNode
  children?: React.ReactNode
}) {
  const orientation = React.useContext(TabsOrientationContext)
  const raiz = React.useContext(TabsRootContext)

  /**
   * `scrollable` e `overflow` vencem `stretch`, explicitamente: com filhos `flex-1`
   * a trilha nunca transborda e as duas props não fariam nada, sem erro nem aviso.
   */
  const resolvedSize = size ?? DEFAULT_TABS_SIZE
  // Na vertical não há o que esticar: `stretch` divide a largura da linha, e na
  // coluna levaria a moldura a `w-full` e espremeria o painel numa fresta, com o
  // `flex-1` repartindo a altura. As abas já ocupam a largura pelo `items-stretch` da trilha.
  const doesStretch =
    scrollable || overflow || orientation === "vertical"
      ? false
      : (stretch ?? SEGMENTADA[variant])
  const axis = orientation === "vertical" ? "y" : "x"

  /** `glass` desenha o marcador, e só as variantes segmentadas têm corpo. */
  const vidro = glass && SEGMENTADA[variant]

  /**
   * A classe do fade é escolhida entre duas constantes literais, nunca montada
   * (`scroll-fade-${axis}` não existiria para o scanner do Tailwind).
   */
  const fadeClassName =
    axis === "y" ? scrollFadeViewportClassName : scrollFadeViewportXClassName
  const scrollFadeRef = useScrollFade({ axis })

  const trilhaRef = React.useRef<HTMLDivElement | null>(null)
  const viaja = VARIANTE_VIAJA[variant]

  const molduraRef = React.useRef<HTMLDivElement | null>(null)
  const escondidas = useExcesso(overflow === "menu", molduraRef, trilhaRef, raiz?.value)

  // Memorizado: montado no JSX, o ref era uma função nova a cada render e religava
  // os observadores da dissolução em todo render.
  const listRef = React.useMemo(
    () => composeRefs(trilhaRef, scrollable ? scrollFadeRef : undefined),
    [trilhaRef, scrollable, scrollFadeRef]
  )

  const marcadorRef = React.useRef<HTMLSpanElement | null>(null)
  const indicatorReady = useMarcador({
    trilha: trilhaRef,
    marcador: marcadorRef,
    ativo: (t) =>
      t.querySelector<HTMLElement>('[data-slot="tabs-trigger"][data-state="active"]:not([hidden])'),
    atributos: ["data-state", "aria-current", "hidden"],
    prefixo: "tabs-indicator",
    insete: RECUO_DO_MARCADOR[variant],
    eixo: orientation === "vertical" ? "y" : "x",
    viajar: viaja,
    deps: [variant, doesStretch, resolvedSize, scrollable],
  })

  return (
    <TabsListContext.Provider
      value={{ size: resolvedSize, variant, stretch: doesStretch, indicatorReady }}
    >
      <div
        ref={molduraRef}
        data-slot="tabs-list-frame"
        data-orientation={orientation}
        className={cn(
          tabsListFrameVariants({
            variant,
            size: resolvedSize,
            // O `underline` horizontal ocupa a largura toda mesmo sem esticar as abas: o fio
            // dele é a fronteira entre a fileira e o painel, e um fio que para depois da
            // última aba lê como sublinhado do grupo. Na vertical não: o fio é o de uma
            // coluna e já estica no eixo de bloco pelo `align-items: stretch` do pai.
            fill:
              doesStretch ||
              scrollable ||
              Boolean(overflow) ||
              (variant === "underline" && orientation === "horizontal"),
          }),
          (end || overflow) && "items-center",
          className
        )}
      >
        <TabsPrimitive.List
          ref={listRef}
          data-slot="tabs-list"
          data-orientation={orientation}
          className={cn(
            tabsListTrackVariants({
              variant,
              orientation,
              fill: doesStretch || scrollable || Boolean(overflow),
              glass: vidro,
            }),
            overflow && "overflow-hidden",
            scrollable && [
              fadeClassName,
              axis === "x"
                ? "overflow-x-auto overscroll-x-contain touch-pan-x"
                : "overflow-y-auto overscroll-y-contain touch-pan-y",
              // `no-scrollbar` não está definida em lugar nenhum: as duas declarações vão por
              // extenso em vez de herdar a classe morta.
              "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
            ]
          )}
          {...props}
        >
          {/*
             Primeiro filho: os gatilhos são `relative`, então pintam por cima sem
             `z-index`. O marcador só existe depois de medido (montá-lo antes o faria
             escorregar de 0,0 até o lugar na primeira pintura).
          */}
          {indicatorReady ? (
            <span
              ref={marcadorRef}
              aria-hidden
              data-slot="tabs-indicator"
              data-orientation={orientation}
              data-glass={vidro ? "" : undefined}
              className={tabsIndicatorVariants({ variant, glass: vidro })}
            />
          ) : null}
          {children}
        </TabsPrimitive.List>
        {overflow === "menu" && escondidas.length ? (
          <TabsMoreMenu abas={escondidas} />
        ) : null}
        {end}
      </div>
    </TabsListContext.Provider>
  )
}

/**
 * Quem cabe na fileira. Mede as abas todas à vista (tira o `hidden` antes de ler
 * a largura) e manda para o ⋯ as do fim que não cabem com ele, menos a ativa
 * (sai a última que cabia; `quemSai`, de `lib/overflow`, a conta das ações da
 * `Toolbar`). Roda num `ResizeObserver` da moldura e quando a aba ativa muda.
 */
function useExcesso(
  ligado: boolean,
  molduraRef: React.RefObject<HTMLDivElement | null>,
  trilhaRef: React.RefObject<HTMLDivElement | null>,
  ativa: string | undefined
) {
  const [escondidas, setEscondidas] = React.useState<{ value: string; label: string }[]>([])
  React.useLayoutEffect(() => {
    const moldura = molduraRef.current
    const trilha = trilhaRef.current
    if (!ligado || !moldura || !trilha) return
    const RESERVA_DO_MAIS = 40
    const lerAbas = () => [...trilha.querySelectorAll<HTMLElement>('[data-slot="tabs-trigger"]')]

    const medir = () => {
      const abas = lerAbas()
      limparExcesso(abas)
      const outros = [...moldura.children]
        .filter((f) => f !== trilha && f.getAttribute("data-slot") !== "tabs-more")
        .reduce((soma, f) => soma + (f as HTMLElement).offsetWidth, 0)
      const larguras = abas.map((a) => a.offsetWidth + 2)
      const cabe = moldura.clientWidth - outros - 6
      const iAtiva = abas.findIndex((a) => a.dataset.value === ativa)
      const fora = quemSai(larguras, cabe, {
        ponta: "fim",
        fixos: new Set(iAtiva >= 0 ? [iAtiva] : []),
        reserva: RESERVA_DO_MAIS,
      }).map((i) => {
        const a = abas[i]
        a.setAttribute("hidden", "")
        return { value: a.dataset.value ?? "", label: a.dataset.label ?? a.textContent ?? "" }
      })
      setEscondidas((v) =>
        v.length === fora.length && v.every((x, i) => x.value === fora[i].value) ? v : fora
      )
    }

    medir()
    const ro = new ResizeObserver(medir)
    ro.observe(moldura)
    return () => {
      ro.disconnect()
      limparExcesso(lerAbas())
    }
  }, [ligado, ativa, molduraRef, trilhaRef])
  return ligado ? escondidas : []
}

/** O ⋯ tem a altura da aba (`TABS_SIZES[size].trigger`), e não a da bandeja. */
const MAIS_POR_DEGRAU = { sm: "icon-xs", md: "icon-sm", lg: "icon-md", xl: "icon-lg" } as const

/**
 * O ⋯ (Mais abas): as abas que não couberam, num menu que troca de aba de fora.
 * É o `OverflowMenu` da `Toolbar`; o invólucro guarda o `data-slot="tabs-more"`,
 * que a medição pula ao somar os vizinhos.
 */
function TabsMoreMenu({ abas }: { abas: { value: string; label: string }[] }) {
  const raiz = React.useContext(TabsRootContext)
  const { size } = React.useContext(TabsListContext)
  return (
    <div data-slot="tabs-more" className="ms-0.5 flex shrink-0">
      <OverflowMenu
        label="Mais abas"
        align="end"
        size={MAIS_POR_DEGRAU[size]}
        items={abas.map((a) => ({ key: a.value, label: a.label, onSelect: () => raiz?.setValue(a.value) }))}
      />
    </div>
  )
}

/** O "+" no fim da fileira: redondo, do degrau da aba, para o slot `end`. */
function TabsAdd({
  label = "Nova aba",
  className,
  ...props
}: Omit<React.ComponentProps<typeof Button>, "children"> & { label?: string }) {
  return (
    <Button
      type="button"
      variant="tertiary"
      size="icon-sm"
      aria-label={label}
      data-slot="tabs-add"
      className={cn("ms-0.5 shrink-0", className)}
      {...props}
    >
      <PlusIcon aria-hidden />
    </Button>
  )
}

function TabsTrigger({
  className,
  value,
  icon,
  iconActive,
  count,
  onClose,
  closeLabel,
  children,
  onKeyDown,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger> & {
  /** Um ícone `16/solid` antes do rótulo. */
  icon?: React.ReactNode
  /** O par sólido quando a aba está ativa — o contorno vira preenchido. */
  iconActive?: React.ReactNode
  /**
   * A contagem ao lado do rótulo ("Ativas 8"), tabular, com um espaço de verdade
   * antes, senão o nome acessível sai "Ativas8".
   */
  count?: React.ReactNode
  /**
   * A aba fecha: um × redondo no fim e Delete com a aba focada. O × é só para o
   * ponteiro (`aria-hidden`): botão dentro de `role="tab"` é controle aninhado, que
   * o leitor de tela não anuncia. Quem não usa ponteiro fecha pela tecla
   * (`aria-keyshortcuts`). Fechar a ativa leva à vizinha antes, e o foco vai junto.
   */
  onClose?: () => void
  closeLabel?: string
}) {
  const { size, variant, stretch, indicatorReady } = React.useContext(TabsListContext)
  const raiz = React.useContext(TabsRootContext)
  const rotulo = typeof children === "string" ? children : undefined

  const fechar = (gatilho: HTMLElement | null) => {
    if (!onClose) return
    const raizEl = gatilho?.closest<HTMLElement>('[data-slot="tabs"]') ?? null
    const abas = abasDe(raizEl).filter((t) => !t.hasAttribute("disabled"))
    const i = abas.findIndex((t) => t.dataset.value === value)
    const vizinha = abas[i + 1] ?? abas[i - 1]
    if (raiz?.value === value && vizinha?.dataset.value) raiz.setValue(vizinha.dataset.value)
    onClose()
    vizinha?.focus()
  }

  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      data-value={value}
      data-label={rotulo}
      value={value}
      aria-keyshortcuts={onClose ? "Delete" : undefined}
      onKeyDown={(e) => {
        onKeyDown?.(e)
        if (onClose && (e.key === "Delete" || e.key === "Backspace") && !e.defaultPrevented) {
          e.preventDefault()
          fechar(e.currentTarget)
        }
      }}
      className={cn(
        "group/tab",
        tabsTriggerVariants({ variant, size, stretch }),
        // Enquanto o marcador não mediu, o gatilho pinta o próprio realce (ver
        // `tabsTriggerFallbackVariants`): um booleano do contexto, e não um seletor.
        !indicatorReady && tabsTriggerFallbackVariants({ variant }),
        onClose && "pe-1.5",
        className
      )}
      {...props}
    >
      {icon ? (
        iconActive ? (
          <>
            <span className="contents group-data-[state=active]/tab:hidden">{icon}</span>
            <span className="hidden group-data-[state=active]/tab:contents">{iconActive}</span>
          </>
        ) : (
          icon
        )
      ) : null}
      {children}
      {count !== undefined && count !== null ? (
        <>
          {" "}
          <span
            data-slot="tabs-count"
            className="nums text-2xs text-muted-foreground group-data-[state=active]/tab:text-foreground/70"
          >
            {count}
          </span>
        </>
      ) : null}
      {onClose ? (
        <span
          aria-hidden
          data-slot="tabs-close"
          title={closeLabel ?? (rotulo ? `Fechar ${rotulo}` : "Fechar")}
          // O × não é uma tab: o clique nele não troca de aba.
          onPointerDown={(e) => {
            e.stopPropagation()
            e.preventDefault()
          }}
          onClick={(e) => {
            e.stopPropagation()
            fechar(e.currentTarget.closest<HTMLElement>('[data-slot="tabs-trigger"]'))
          }}
          className="ms-0.5 inline-flex size-5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground active:bg-foreground/10 [&_svg]:size-3"
        >
          <XMarkIcon />
        </span>
      ) : null}
    </TabsPrimitive.Trigger>
  )
}

function TabsContent({
  className,
  value,
  keepMounted = false,
  forceMount,
  onPointerDown,
  onPointerUp,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content> & {
  /**
   * Mantém o painel montado depois de visto (o formulário dentro dele não perde o
   * rascunho); escondido com `hidden` enquanto inativo, fora da árvore de acessibilidade.
   */
  keepMounted?: boolean
}) {
  const raiz = React.useContext(TabsRootContext)
  const swipe = React.useContext(TabsSwipeContext)
  const inicio = React.useRef<{ x: number; y: number } | null>(null)
  const montar = keepMounted && raiz?.vistas.has(value) ? true : forceMount
  const sentido = raiz?.sentido ?? 0

  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      value={value}
      forceMount={montar || undefined}
      onPointerDown={(e) => {
        onPointerDown?.(e)
        if (swipe && e.pointerType === "touch") inicio.current = { x: e.clientX, y: e.clientY }
      }}
      onPointerUp={(e) => {
        onPointerUp?.(e)
        const de = inicio.current
        inicio.current = null
        if (!de || !raiz) return
        const dx = e.clientX - de.x
        const dy = e.clientY - de.y
        // Um arraste de verdade, e de lado: 56px e bem mais horizontal que vertical,
        // senão a rolagem da página trocaria de aba.
        if (Math.abs(dx) >= 56 && Math.abs(dx) > Math.abs(dy) * 1.5) raiz.andar(dx < 0 ? 1 : -1)
      }}
      className={cn(
        "min-w-0 flex-1 outline-none focus-visible:ring-3 focus-visible:ring-ring/45",
        swipe && "touch-pan-y",
        montar && "data-[state=inactive]:hidden",
        // O painel desliza do lado para onde a aba andou (12px, na mola), como o
        // `StepperContent`. Sem sentido (primeira pintura, troca programática), o fade
        // com 4px de assentamento. O `data-[state=active]` guarda contra `forceMount`.
        "data-[state=active]:animate-in data-[state=active]:fade-in-0",
        sentido > 0
          ? "data-[state=active]:slide-in-from-right-3 duration-(--duration-spring) ease-(--ease-spring)"
          : sentido < 0
            ? "data-[state=active]:slide-in-from-left-3 duration-(--duration-spring) ease-(--ease-spring)"
            : "data-[state=active]:slide-in-from-bottom-1 duration-(--duration-fast) ease-(--ease-out)",
        className
      )}
      {...props}
    />
  )
}

/**
 * As abas de navegação: cada uma é uma rota. A mesma moldura, trilha e marcador
 * do `TabsList`, num `<nav>` e sem `role="tab"`: o padrão de abas do W3C é para
 * painéis na mesma página; navegação é link, e a atual é `aria-current="page"`.
 */
function TabsNav({
  className,
  size,
  variant = "floating",
  stretch,
  glass = false,
  children,
  ...props
}: React.ComponentProps<"nav"> & {
  size?: TabsSize
  variant?: TabsVariant
  stretch?: boolean
  glass?: boolean
}) {
  const resolvedSize = size ?? DEFAULT_TABS_SIZE
  const doesStretch = stretch ?? SEGMENTADA[variant]
  const vidro = glass && SEGMENTADA[variant]
  const trilhaRef = React.useRef<HTMLDivElement | null>(null)
  const marcadorRef = React.useRef<HTMLSpanElement | null>(null)
  const medido = useMarcador({
    trilha: trilhaRef,
    marcador: marcadorRef,
    ativo: (t) => t.querySelector<HTMLElement>('[data-slot="tabs-nav-link"][aria-current="page"]'),
    atributos: ["data-state", "aria-current", "hidden"],
    prefixo: "tabs-indicator",
    insete: RECUO_DO_MARCADOR[variant],
    viajar: VARIANTE_VIAJA[variant],
    deps: [variant, doesStretch, resolvedSize],
  })
  return (
    <TabsListContext.Provider
      value={{ size: resolvedSize, variant, stretch: doesStretch, indicatorReady: medido }}
    >
      <nav
        data-slot="tabs-nav"
        data-orientation="horizontal"
        className={cn(
          tabsListFrameVariants({
            variant,
            size: resolvedSize,
            fill: doesStretch || variant === "underline",
          }),
          className
        )}
        {...props}
      >
        <div
          ref={trilhaRef}
          data-orientation="horizontal"
          className={tabsListTrackVariants({
            variant,
            orientation: "horizontal",
            fill: doesStretch,
            glass: vidro,
          })}
        >
          {medido ? (
            <span
              ref={marcadorRef}
              aria-hidden
              data-slot="tabs-indicator"
              data-orientation="horizontal"
              className={tabsIndicatorVariants({ variant, glass: vidro })}
            />
          ) : null}
          {children}
        </div>
      </nav>
    </TabsListContext.Provider>
  )
}

/** Um link do `TabsNav`. `asChild` para o `<Link>` do Next. */
function TabsNavLink({
  className,
  active = false,
  asChild = false,
  ...props
}: React.ComponentProps<"a"> & { active?: boolean; asChild?: boolean }) {
  const { size, variant, stretch, indicatorReady } = React.useContext(TabsListContext)
  const Comp = asChild ? Slot.Root : "a"
  return (
    <Comp
      data-slot="tabs-nav-link"
      data-orientation="horizontal"
      data-state={active ? "active" : "inactive"}
      aria-current={active ? "page" : undefined}
      className={cn(
        tabsTriggerVariants({ variant, size, stretch }),
        !indicatorReady && tabsTriggerFallbackVariants({ variant }),
        "cursor-pointer",
        className
      )}
      {...props}
    />
  )
}

export {
  Tabs,
  TabsAdd,
  TabsContent,
  TabsList,
  TabsNav,
  TabsNavLink,
  TabsTrigger,
  tabsListFrameVariants,
  tabsListTrackVariants,
  tabsTriggerVariants,
  tabsIndicatorVariants,
}
export type { TabsOrientation, TabsSize, TabsVariant }
