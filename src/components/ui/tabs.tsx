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

type TabsSize = "sm" | "md" | "lg" | "xl"
type TabsVariant = "floating" | "solid" | "underline" | "plain"
type TabsOrientation = "horizontal" | "vertical"

/**
 * A escada, como **dado** e não como classe.
 *
 * Um teste sobre a saída de `cva` só sabe casar substring, e casar substring
 * tranca a grafia em vez da medida. Com a escada em número, o teste pergunta o
 * que interessa: nenhum degrau abaixo de 28, passos de 4, e nenhuma altura
 * declarada na lista.
 */
/**
 * A escada do `Tabs` — **e `size` nomeia a bandeja**, que é a caixa que um
 * layout posiciona.
 *
 * Era o único componente do sistema em que `size` nomeava uma peça **interna**:
 * `Button`, `Toggle`, `Select` e `NativeSelect` todos medem a própria altura
 * (`h-7 / h-8 / h-9 / h-10`). Com o gatilho nomeado, `size="md"` entregava um
 * componente de **40** numa linha de controles de 32, e a promessa que a página
 * do `Button` faz — *"alinha sem ninguém dizer `size`"* — era falsa só aqui.
 *
 * **Isto não repete o defeito que a rodada anterior consertou.** Lá o
 * `TabsList` era `h-9` (36) com `p-1` e o gatilho saía `h-[calc(100%-1px)]` =
 * **27** — um número que não existe na escada, enquanto a documentação dizia
 * 32. O defeito era a **mentira**, não o modelo. Aqui a bandeja é 32, o gatilho
 * é 28, os dois são degraus reais, e os dois estão escritos.
 *
 * | `size` | bandeja | gatilho |
 * | --- | --- | --- |
 * | `sm` | 28 | 24 |
 * | `md` | **32** | 28 |
 * | `lg` | 36 | 32 |
 * | `xl` | 40 | 36 |
 *
 * `xl` não é enfeite: 40 com gatilho 36 é exatamente o que o app renderiza no
 * telefone — `transaction-type-segment.tsx` escreve `h-10 … p-0.5
 * items-stretch`.
 */
/**
 * O degrau padrão de cada variante — e as três **não** compartilham um.
 *
 * Medido antes desta rodada, com as três lado a lado e nenhum `size` declarado:
 * moldura 32, gatilho 28 e fonte 12,8px nas **três**. Elas diferiam só no que a
 * moldura pintava, e em mais nada — o que é errado, porque elas não são a mesma
 * coisa:
 *
 * - **`solid`** é um controle segmentado, e vive numa **linha de controles**.
 *   A bandeja tem de medir 32 para ficar rente ao `Button` e ao `Input` ao lado.
 * - **`underline` e `plain`** são **abas de página**. Elas não dividem linha com
 *   controle nenhum; dividem a página com título e texto corrido.
 *
 * E `lg` não é só mais alto: é o degrau em que o rótulo **volta ao corpo de
 * texto da página**. Só `sm` e `md` carregam `text-control-sm` (12,8px); `lg` e
 * `xl` herdam o `text-sm` da base. Uma aba de página em 12,8px era o defeito.
 *
 * A forma tem precedente no próprio arquivo: `stretch` resolve assim desde a
 * rodada do `Tabs` (`stretch ?? variant === "solid"`). Esta é a segunda prop a
 * usá-la, e é o que faz as três variantes serem três **tipos** em vez de três
 * pinturas.
 */
export function defaultTabsSize(variant: TabsVariant): TabsSize {
  // O `floating` (rodada 226) é controle segmentado, como o `solid`: vive
  // numa linha de controles e fica rente ao `Button md`.
  return variant === "solid" || variant === "floating" ? "md" : "lg"
}

/**
 * O vão entre o marcador e a borda da bandeja, **além** do recuo da trilha.
 * No `floating` o marcador é desenhado 2px para dentro da aba — o dono pediu
 * mais ar em volta da aba ativa, primeiro 3px e depois 4 —, e o vão vai de 2
 * para 4px **sem mexer na escada**: a bandeja continua 32 e a aba 28, e o
 * alvo de clique é a aba inteira. Recuar a trilha teria derrubado a aba a 24,
 * fora do degrau. O marcador sai com 24 de altura no `md`.
 */
const RECUO_DO_MARCADOR: Record<TabsVariant, number> = {
  floating: 2,
  solid: 0,
  underline: 0,
  plain: 0,
}

/** As variantes que são controle segmentado — esticam e medem 32 de fábrica. */
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
 * O recuo da trilha (`p-0.5`, em `tabsListTrackVariants`), e ele é **um só**.
 *
 * A rodada anterior o transformou em eixo (`default` 4 / `tight` 2), e a
 * migração provou que o eixo não existia: **6 de 6** chamadas pediam `tight` e
 * nenhuma usava o padrão. Eixo sem contagem sai.
 *
 * O custo é medido e aceito: sob `scrollable`, `overflow-x` recorta no *padding
 * box*, então o anel de foco de 3px perde **1px** nas pontas horizontais. Este
 * mesmo arquivo já aceita uma troca maior — em `underline` o anel perde **3px**
 * na base, "medido, aceito, e visível nos outros três lados".
 */

export const TABS_TRAY_HEIGHTS = {
  sm: TABS_SIZES.sm.tray,
  md: TABS_SIZES.md.tray,
  lg: TABS_SIZES.lg.tray,
  xl: TABS_SIZES.xl.tray,
} as const

/**
 * A ponte número → classe. **Ela não monta classe nenhuma em runtime** — o
 * Tailwind varre o código como texto, e uma classe construída por template
 * literal nunca chega ao CSS. Medido nesta rodada: `pointer-coarse:h-9` estava
 * no elemento e **não existia** na folha, enquanto a altura base funcionava.
 *
 * As classes são escritas por extenso nos `cva` acima; esta tabela existe para
 * o teste provar que os literais e a escada não divergiram.
 */
export const ALTURA_CLASS = {
  24: "h-6",
  28: "h-7",
  32: "h-8",
  36: "h-9",
  40: "h-10",
} as const

/**
 * Quem tem marcador viajante — e o `plain` não tem, de propósito.
 *
 * O marcador viaja **ao longo de alguma coisa**: a bandeja do `solid` e o fio
 * do `underline` são o trilho que dá sentido ao deslocamento. O `plain` não
 * desenha nem bandeja nem fio, então ali o mesmo movimento não é um realce
 * correndo por um trilho, é um bloco preenchido deslizando sozinho sobre o
 * fundo — e ele é justamente a variante escolhida para uma fileira que **não**
 * deve chamar atenção, dentro de uma superfície que já tem moldura própria.
 * A variante mais silenciosa das três não pode ter o marcador mais barulhento.
 *
 * Sem marcador, o `plain` cai no caminho que o componente já mantém para antes
 * da hidratação: cada gatilho pinta o próprio realce. A tinta ainda troca com
 * `transition-colors`, que é uma mudança de cor e não um deslocamento.
 */
const VARIANTE_VIAJA: Record<TabsVariant, boolean> = {
  floating: true,
  solid: true,
  underline: true,
  plain: false,
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
}>({ size: "md", variant: "floating", stretch: true, indicatorReady: false })

/**
 * O estado mora na raiz (rodada 226). O Radix guarda a aba ativa sozinho, e
 * por isso nada fora dele sabia dela — nem para onde ela andou. Com o valor
 * aqui (controlado ou não, entregue **controlado** ao Radix) passam a existir:
 * o **sentido** da última troca, que o painel usa para deslizar do lado certo;
 * a aba na URL; o arrastar no telefone; os atalhos ⌥1–9; o menu "Mais", que
 * troca de aba de fora da fileira; e os painéis já vistos, para `keepMounted`.
 *
 * A ordem das abas é a do DOM (`[data-slot=tabs-trigger]` com `data-value`),
 * e não um registro: é a ordem que a pessoa vê, e não pode divergir dela.
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
   * A aba na URL (`?aba=faturas`): lida ao abrir, depois da hidratação, e
   * gravada a cada troca com `history.replaceState` — a régua do `urlState` do
   * `DataTable`, sem `useSearchParams` (que pediria um `Suspense` em volta de
   * toda página estática).
   */
  urlParam?: string
  /** Arrastar o painel para os lados troca de aba, no toque. */
  swipe?: boolean
  /**
   * ⌥1…⌥9 vão para a aba N. **Não é ⌘**: ⌘1–9 troca a aba do navegador, e o
   * Chrome não deixa a página cancelar — a mesma razão do `mod+n/t/w` no
   * `Command`. Fora de campo de texto, e anunciado em `aria-keyshortcuts`.
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
      </TabsSwipeContext.Provider>
    </TabsRootContext.Provider>
  )
}

const TabsSwipeContext = React.createContext(false)

/**
 * A moldura. Ela pinta, e é ela que o `className` do `TabsList` dimensiona —
 * porque é a caixa externa, a que um layout posiciona.
 */
const tabsListFrameVariants = cva("flex", {
  variants: {
    variant: {
      /**
       * **O padrão desde a rodada 226**: a pílula flutuante da casa — a placa
       * chapada dos flutuantes (`--popover`), o anel de 1px e **nenhuma
       * sombra**, a pedido do dono. Quem a separa da página é o anel, como as
       * placas do `CommandDialog`; sem sombra ela fica no plano da linha de
       * controles em vez de pairar sobre ela. Sem vidro: nenhum trilho deste
       * app é fixo, e não há nada passando por baixo para borrar.
       */
      //
      // **Na vertical a pílula vira placa** (`rounded-surface`): numa
      // coluna de três abas o `rounded-full` virava um estádio de 50px de raio,
      // com as pontas cortando a primeira e a última aba. É a seção agrupada do
      // iOS 26 — a placa de superfície com as linhas em cápsula dentro.
      floating:
        "rounded-full bg-popover ring-1 ring-foreground/10 data-[orientation=vertical]:self-start data-[orientation=vertical]:rounded-surface",
      /**
       * A bandeja preenchida — o padrão até a rodada 225. Na vertical ela não
       * acompanha a altura do painel (`self-start`): uma bandeja que desce até
       * o fim do texto ao lado lê como coluna vazia.
       */
      solid: "rounded-full bg-muted data-[orientation=vertical]:self-start data-[orientation=vertical]:rounded-surface",
      /**
       * Sem bandeja: um fio percorre a fileira e o marcador do gatilho pousa
       * sobre ele. É separador de **itens**, a categoria que nunca perdeu o
       * traço — não a emenda de superfície que as tiras do `Card` deixaram
       * para trás.
       */
      underline:
        "border-border data-[orientation=horizontal]:border-b data-[orientation=vertical]:border-e",
      /** Nem bandeja nem fio: para dentro de uma superfície que já tem moldura. */
      plain: "data-[orientation=vertical]:self-start",
    },
    /**
     * `w-fit` é o padrão histórico; esticar ou rolar exige largura de verdade —
     * e `min-w-0` junto, senão a moldura carrega para fora o que a fileira
     * deveria rolar por dentro.
     */
    fill: { true: "w-full min-w-0", false: "w-fit shrink-0" },
    /**
     * **A altura do componente.** É esta caixa que um layout posiciona, e é
     * por isso que `size` a nomeia — como em `Button`, `Toggle`, `Select` e
     * `NativeSelect`.
     *
     * O piso de toque é `pointer-coarse:h-10` (40), o mesmo degrau que a
     * `Toolbar` publica em `--toolbar-control` e a mesma altura que o app
     * renderiza no telefone. A pergunta é o **apontador** e não a largura da
     * janela — é a regra já registrada no item de menu, e o `Calendar` a aplica
     * do mesmo jeito.
     */
    /**
     * **A altura só existe na horizontal.** Ali `size` nomeia a bandeja, que é
     * a caixa que um layout posiciona numa linha de controles.
     *
     * Na vertical ela não significa nada — o eixo cruzado passa a ser a
     * largura, e a altura vira a soma das linhas. Enquanto a classe era
     * incondicional, a moldura vertical saía com **36px para 106px de
     * conteúdo**: dois dos três gatilhos ficavam fora dela, e o `border-e`
     * (o fio) percorria só os 36 primeiros pixels — aparecendo como um traço
     * parado ao lado da primeira aba, que **não se movia** ao trocar de aba,
     * porque não era o marcador. Medido.
     */
    size: {
      sm: "data-[orientation=horizontal]:h-7 pointer-coarse:data-[orientation=horizontal]:h-10",
      md: "data-[orientation=horizontal]:h-8 pointer-coarse:data-[orientation=horizontal]:h-10",
      lg: "data-[orientation=horizontal]:h-9 pointer-coarse:data-[orientation=horizontal]:h-10",
      xl: "data-[orientation=horizontal]:h-10",
    },
  },
  defaultVariants: { variant: "floating", size: "md", fill: false },
})

/**
 * A trilha. Ela **não desenha nada** — ver a invariante 2 no cabeçalho — e é
 * quem carrega o recuo, a rolagem e a máscara.
 */
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
       * O realce de estado do marcador de vidro, e ele é publicado **aqui**.
       *
       * Custom property não atravessa para irmão: quem acende é o gatilho
       * ativo, e o marcador é irmão dele. A trilha é o pai dos dois, então é
       * dela a variável — o `:has()` pergunta pelo gatilho e o marcador lê por
       * herança. É a mesma razão pela qual o `useScrollFade` tem a opção
       * `shell`.
       *
       * **O `:hover` mora dentro de `@media (hover: hover)`, à mão** (rodada
       * 250). Num seletor arbitrário ele não ganha a mídia que a variante
       * `hover:` traz, e no telefone o toque o acendia e ele **grudava** até o
       * toque seguinte. O par `:active` é a resposta do dedo.
       *
       * E o realce vira de direção com o tema, pela régua do
       * `--secondary-hover`: a lâmina clara é 92% branca, e um realce branco
       * ali não desenha nada. Ele puxa sempre na direção do contato — escurece
       * no claro, clareia no escuro.
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
    // Centrado na horizontal, alinhado ao início na vertical. Medido com
    // `justify-center` nas duas: numa coluna de 105px os rótulos começavam a
    // 35, 24 e 10px — 25px de borda serrilhada, porque cada aba centrava o
    // próprio texto numa largura comum. Uma coluna de navegação se lê pela
    // margem esquerda.
    "data-[orientation=horizontal]:justify-center data-[orientation=vertical]:justify-start",
    // A mesma duração e a mesma curva do marcador: a tinta do rótulo e o
    // deslocamento do realce são **um** evento, e relógios diferentes fariam a
    // aba acender antes de o marcador chegar.
    "transition-colors duration-(--duration-base) ease-(--ease-out)",
    // `ring-3`, o valor do sistema. Era `ring-2` aqui, e o `Tabs` era o único
    // controle fora do valor — a diferença de 1px só aparece quando uma aba e
    // um botão ficam na mesma linha, que é onde ela mais acontece.
    "focus-visible:ring-3 focus-visible:ring-ring/45",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ],
  {
    variants: {
      variant: {
        // A pílula pede mais ar nas pontas que o retângulo: com `px-2` o rótulo
        // encostava na curva.
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
          // Borda nos dois lados do eixo, transparente, para o texto não
          // deslocar 2px quando a aba fica ativa. Quem pinta a aresta é o
          // marcador viajante; aqui ela só reserva o espaço.
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
       * A altura do gatilho **deriva** da bandeja: `bandeja − 2×recuo`. Quem
       * escolhe é o `size` do `TabsList`, e os quatro resultados são degraus
       * da escada — 24 · 28 · 32 · 36.
       */
      size: {
        sm: "h-6 pointer-coarse:h-9 text-control-sm",
        md: "h-7 pointer-coarse:h-9 text-control-sm",
        lg: "h-8 pointer-coarse:h-9",
        xl: "h-9",
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
        /**
         * O `pointer-coarse:min-h-11` saiu daqui.
         *
         * Ele dava 44px de alvo a uma aba de largura de rótulo, e era ele que
         * fazia a bandeja medir **48** contra controles de 40 no telefone —
         * medido a 375px. Hoje quem cresce no toque é a **bandeja**, que sobe
         * um degrau e leva o gatilho junto: `md` vira 40/36, que é a mesma
         * geometria que o app já renderiza no telefone.
         */
        false: "",
      },
    },
    defaultVariants: { variant: "floating", size: "md", stretch: true },
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
      floating:
        "data-[state=active]:bg-muted data-[state=active]:ring-1 data-[state=active]:ring-foreground/10 data-[state=active]:shadow-xs",
      solid:
        "data-[state=active]:border-border/80 data-[state=active]:bg-background data-[state=active]:shadow-xs",
      underline: [
        // Acento, e não `--primary`: traço fino sobre o fundo é sempre acento —
        // `--primary` a este peso cai para 2:1 no tema escuro.
        "data-[state=active]:data-[orientation=horizontal]:border-b-primary-accent",
        "data-[state=active]:data-[orientation=vertical]:border-e-primary-accent",
      ].join(" "),
      plain: "data-[state=active]:bg-muted",
    },
  },
  defaultVariants: { variant: "floating" },
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
    // **Sem transição de CSS** (rodada 226): a viagem é a do `ThemeToggle`,
    // em WAAPI — o trajeto com inércia e o esticão que acompanha a velocidade
    // (`lib/liquid-move`). As variáveis são o repouso; a animação, com
    // `fill: "none"`, só cobre o caminho. Era 200ms de `--ease-out`, e o
    // marcador deslizava como um bloco.
  ],
  {
    variants: {
      // A superfície do `solid` não mora aqui: ela é composta abaixo, um ramo
      // para cada valor de `glass`. É a forma do `ColorTile`, e a razão é a
      // asserção 13 de `glass.test.ts` — **onde o eixo dispensa o
      // neutralizador, ele não pode existir**. Deixar `bg-background` na base
      // e apagá-lo com `bg-transparent` no ramo de vidro seria escrever a
      // classe que morre calada sob o shorthand `background` da utility.
      variant: {
        floating: "rounded-full",
        solid: "rounded-full",
        underline: [
          "border-primary-accent",
          "data-[orientation=horizontal]:border-b-2 data-[orientation=vertical]:border-e-2",
        ].join(" "),
        // `plain` existe no tipo porque a variante existe, e desenha o mesmo
        // que o gatilho desenharia — mas ele nunca é montado: ver
        // `VARIANTE_VIAJA`. Deixá-lo aqui evita que um `variant` novo passe a
        // cair num `undefined` silencioso.
        plain: "rounded-full bg-muted",
      },
      glass: { true: "", false: "" },
    },
    compoundVariants: [
      /**
       * O marcador do `floating` é uma tecla em relevo sobre a placa: o
       * `--muted` com o anel e a sombra mínima. A sombra é **dele** — a
       * bandeja não tem nenhuma.
       */
      { variant: "floating", glass: false, class: "bg-muted ring-1 ring-foreground/10 shadow-xs" },
      {
        variant: "floating",
        glass: true,
        class: [glassControlSurfaceClassName, "shadow-xs", "[--glass-tone:var(--muted)]"].join(" "),
      },
      { variant: "solid", glass: false, class: "border border-border/80 bg-background shadow-xs" },
      /**
       * O marcador de vidro.
       *
       * **O corpo é idêntico ao chapado, por construção**: `--glass-tone` é
       * `--background` opaco, que é exatamente o que o ramo de cima pinta. O
       * que entra é o **aro** — e é ele, sozinho, que faz o material, como a
       * rodada 44 mediu ("numa peça com tom as nuvens já chegavam a 3,6%").
       * Nada de contraste se move: o rótulo ativo continua sobre a mesma cor.
       *
       * A borda também já estava aqui (`border-border/80` no ramo chapado), e
       * é isso que faz a armadilha nº 2 da régua não morder: o aro é pintado
       * no `border-box`, e a peça já reservava 1px para ele. Numa bandeja
       * `h-8` a mesma troca custaria 2px do conteúdo — 26 para um gatilho de
       * 28 —, e a escada está trancada por cinco asserções.
       *
       * `glass-control` porque a peça é pequena: ele encolhe a pegada das
       * nuvens, e move **só a variável**, nunca uma propriedade.
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
   * O marcador vira a peça de vidro do sistema — o *thumb* que viaja, que é o
   * que um controle segmentado do iOS faz.
   *
   * **Só a peça que se move, e nunca a bandeja.** A bandeja com vidro foi
   * medida numa fileira idêntica a esta (o `Menubar solid`, rodada 59): abrir
   * a lâmina a 60% no escuro a leva de rgb 38 para 27, e ela deixa de ler como
   * bandeja. O marcador é o oposto — o corpo dele não se move (o tom é o mesmo
   * que ele já pintava) e o que entra é a aresta.
   *
   * Opt-in, e sem efeito no `underline` (o marcador é um fio de 2px, sem
   * corpo onde um aro more) nem no `plain` (ele nem é montado).
   */
  glass?: boolean
  /**
   * A fileira rola quando não cabe, dissolvendo nas pontas.
   *
   * Opt-in, e não por timidez: `scroll-fade-x` declara 36px de
   * `scroll-padding-inline`, e ligá-la sempre mudaria o `scrollIntoView` de
   * toda barra de abas do app — inclusive das que nunca transbordam.
   */
  scrollable?: boolean
  /**
   * `"menu"` (rodada 226): as abas que não cabem saem da fileira para o menu
   * **⋯ (Mais abas)**, no fim. A ativa nunca sai — se ela não cabe, sai a última que
   * cabia. É a alternativa ao `scrollable` para quem não quer rolar.
   */
  overflow?: "menu"
  /**
   * O que vem depois das abas, **dentro da moldura e fora do `tablist`** — o
   * `TabsAdd`, uma ação. Fora porque um nó que não é aba entre o `tablist` e as
   * `tab` quebra a posse ARIA.
   */
  end?: React.ReactNode
  children?: React.ReactNode
}) {
  const orientation = React.useContext(TabsOrientationContext)
  const raiz = React.useContext(TabsRootContext)

  /**
   * `scrollable` e `overflow` vencem `stretch`, e o silêncio é o motivo de a
   * precedência ser explícita: com filhos `flex-1` a trilha nunca transborda,
   * e as duas props não fariam **nada** — sem erro, sem aviso.
   */
  const resolvedSize = size ?? defaultTabsSize(variant)
  // **Na vertical não há o que esticar.** `stretch` divide a *largura* da
  // linha, e na coluna ele fazia o contrário do pedido: a moldura ia a
  // `w-full`, ocupava a linha inteira do `Tabs` e espremia o painel numa
  // fresta à direita (medido no catálogo, o texto quebrava a cada palavra), e
  // o `flex-1` das abas repartia a altura. Na coluna as abas já ocupam a
  // largura dela pelo `items-stretch` da trilha.
  const doesStretch =
    scrollable || overflow || orientation === "vertical"
      ? false
      : (stretch ?? SEGMENTADA[variant])
  const axis = orientation === "vertical" ? "y" : "x"

  /** `glass` desenha o marcador, e só as variantes segmentadas têm corpo. */
  const vidro = glass && SEGMENTADA[variant]

  /**
   * A classe do fade é escolhida entre duas constantes literais, nunca montada.
   * O Tailwind varre o código como texto: `scroll-fade-${axis}` não existiria
   * para o scanner, e o CSS nunca seria gerado.
   */
  const fadeClassName =
    axis === "y" ? scrollFadeViewportClassName : scrollFadeViewportXClassName
  const scrollFadeRef = useScrollFade({ axis })

  const trilhaRef = React.useRef<HTMLDivElement | null>(null)
  const viaja = VARIANTE_VIAJA[variant]

  const molduraRef = React.useRef<HTMLDivElement | null>(null)
  const escondidas = useExcesso(overflow === "menu", molduraRef, trilhaRef, raiz?.value)

  // Memorizado: montado no JSX, o ref era uma função nova a cada render, e o
  // React chamava o antigo com null e o novo com o nó — religando os
  // observadores da dissolução em todo render.
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
            // O `underline` **horizontal** ocupa a largura toda mesmo sem
            // esticar as abas: o fio dele é a fronteira entre a fileira e o
            // painel, e um fio que para depois da última aba lê como
            // sublinhado do grupo, não como base da página.
            //
            // Na vertical **não**: ali o fio é o de uma coluna, e ele já se
            // estica sozinho no eixo de bloco pelo `align-items: stretch` do
            // pai. Forçar `w-full` esmagava o painel contra a borda.
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
              // `no-scrollbar` não existe neste projeto — é usada em quatro
              // arquivos e não está definida em lugar nenhum. Aqui as duas
              // declarações vão por extenso em vez de herdar a classe morta.
              "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
            ]
          )}
          {...props}
        >
          {/* Primeiro filho: os gatilhos são `relative`, então eles pintam por
              cima sem precisar de `z-index` próprio. O marcador só existe
              depois de medido — montá-lo antes o faria escorregar de 0,0 até
              o lugar na primeira pintura. */}
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
 * Quem cabe na fileira. Mede as abas **todas à vista** (tira o `hidden` antes
 * de ler a largura) e manda para o ⋯ as do fim que não cabem com ele — menos a
 * ativa, que fica: sai a última que cabia (`quemSai`, de `lib/overflow`, a
 * mesma conta das ações da `Toolbar`). Ele roda num `ResizeObserver` da
 * moldura, e de novo quando a aba ativa muda.
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
 * O ⋯ (Mais abas): as abas que não couberam, num menu que troca de aba de
 * fora. É o `OverflowMenu` da `Toolbar`; o invólucro guarda o
 * `data-slot="tabs-more"`, que a medição pula ao somar os vizinhos.
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
   * A contagem ao lado do rótulo — "Ativas 8" —, tabular, com um **espaço de
   * verdade** antes, senão o nome acessível sai "Ativas8".
   */
  count?: React.ReactNode
  /**
   * A aba fecha: um × redondo no fim e **Delete** com a aba focada. O × é só
   * para o ponteiro (`aria-hidden`): um botão dentro de um `role="tab"` é
   * controle aninhado, que o leitor de tela não sabe anunciar. Quem não usa
   * ponteiro fecha pela tecla, anunciada em `aria-keyshortcuts`. Fechar a
   * ativa leva à vizinha antes, e o foco vai junto.
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
        // Enquanto o marcador não mediu, o gatilho pinta o próprio realce —
        // ver `tabsTriggerFallbackVariants`. Um booleano do contexto, e não um
        // seletor: `:where()` não soma especificidade.
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
   * Mantém o painel montado depois de visto — o formulário dentro dele não
   * perde o rascunho ao trocar de aba. Escondido com `hidden` enquanto
   * inativo, fora da árvore de acessibilidade.
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
        // Um arraste de verdade, e de lado: 56px e bem mais horizontal que
        // vertical — senão a rolagem da página trocaria de aba.
        if (Math.abs(dx) >= 56 && Math.abs(dx) > Math.abs(dy) * 1.5) raiz.andar(dx < 0 ? 1 : -1)
      }}
      className={cn(
        "min-w-0 flex-1 outline-none focus-visible:ring-3 focus-visible:ring-ring/45",
        swipe && "touch-pan-y",
        montar && "data-[state=inactive]:hidden",
        // O painel **desliza do lado para onde a aba andou** (rodada 226) —
        // 12px, na mola —, como o `StepperContent`. Sem sentido (a primeira
        // pintura, uma troca programática sem ordem), o fade de antes com 4px
        // de assentamento. O `data-[state=active]` guarda contra `forceMount`.
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
 * As abas de **navegação** (rodada 226): cada uma é uma rota. A mesma
 * moldura, a mesma trilha e o mesmo marcador viajante do `TabsList`, num
 * `<nav>` — e **sem `role="tab"`**: o padrão de abas do W3C é para painéis
 * na mesma página; navegação é link, e a atual é `aria-current="page"`.
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
  const resolvedSize = size ?? defaultTabsSize(variant)
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
