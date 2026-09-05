"use client"

import * as React from "react"
import * as ResizablePrimitive from "react-resizable-panels"
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
} from "@heroicons/react/16/solid"
import { cva, type VariantProps } from "class-variance-authority"

import { Button } from "@/components/ui/button"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"

/**
 * Painéis redimensionáveis.
 *
 * ## A costura não é uma borda
 *
 * O arquivo anterior pintava a alça com `bg-border`, 1px, sem estado nenhum —
 * exatamente o mesmo desenho de um `Separator` estático. A única peça de
 * cromagem do app cujo trabalho inteiro é dizer *esta linha não é uma parede,
 * ela se move* não dizia nada, e a pega do `withHandle` era **também**
 * `bg-border`: uma pastilha da cor do fio em que ela se apoia, ≈1,3:1 contra a
 * superfície — o mesmo número que o `AGENTS.md` registra para o contorno de
 * campo fora da 1.4.11.
 *
 * A lib publica a máquina de estados desde a v4 e o arquivo lia **zero**:
 * `data-separator` vale `inactive`, `hover`, `active`, `focus` ou `disabled`.
 * Hoje a costura acende no acento da marca ao pousar e ao arrastar.
 *
 * `--primary-accent` e não `--primary`: a régua da casa diz que traço fino é
 * acento, e que **traço com alfa é sempre acento** — `--primary` a 60% sobre a
 * página escura cai para 2:1 e some.
 *
 * ## O realce é pintado fora do fluxo
 *
 * Engrossar a alça de verdade reflui os dois painéis a cada passagem do cursor.
 * O realce é um `::before` absoluto de 2px centrado na costura, e só a **cor**
 * transiciona — nenhuma propriedade de layout entra na conta. É o mecanismo do
 * marcador do `Tabs`. `::before` e não `::after` de propósito: pseudo-elemento
 * `after` é o último filho e pintaria por cima da pega, o que exigiria um
 * `z-index` para desfazer.
 *
 * ## A região de arraste é da lib desde a v4, e o número era 20
 *
 * A doc antiga dizia que a alça tinha 4px e era "impossível com o dedo". Isso
 * descrevia uma versão que não está instalada: a v4 faz o próprio hit-testing,
 * expandindo a `DOMRect` da costura por `resizeTargetMinimumSize`, cujo padrão
 * é `{ coarse: 20, fine: 10 }` — escolhido por `isCoarsePointer()`. O `after:`
 * de 4px do arquivo antigo não era o alvo de nada havia uma versão inteira.
 *
 * O que restava de verdadeiro é que **20 é menos que os 44 do sistema**, e a
 * prop que fecha isso nunca tinha sido plugada. O padrão daqui é
 * `{ coarse: 44, fine: 10 }`: 44 é a medida de dedo desta casa, e `fine` fica
 * no valor da lib porque 10px de alvo de mouse sobre uma linha de 1px não tem
 * defeito medido. Continua sendo prop.
 *
 * ## Por que o colapsar não mora na alça
 *
 * Não é escolha. A lib liga `pointerdown`, `dblclick`, `contextmenu` e
 * `pointerup` **no documento, em fase de captura** (`addEventListener(t, f,
 * true)`), e decide por hit-testing de ponto contra as `DOMRect` expandidas.
 *
 * Um `<button>` dentro da alça é impossível: a captura do documento dispara
 * antes do handler do botão, e `stopPropagation` de dentro não alcança um
 * ancestral que já correu. Pior — qualquer controle a menos de **metade da
 * região de arraste** da costura (22px, com `coarse: 44`) tem o próprio clique
 * engolido pelo início de um arraste.
 *
 * Por isso o colapso é `useResizablePanel` + `ResizableCollapseTrigger`, que o
 * consumidor posiciona no cabeçalho do próprio painel, longe da costura por
 * construção. O colapso por arraste continua sendo o da lib (`collapsible` +
 * `collapsedSize`).
 *
 * ## A orientação vem do contexto, e não do `aria-orientation`
 *
 * O `Separator` emite `aria-orientation` **invertido** em relação ao grupo
 * (`grupo horizontal → separador vertical`), e o `Group` **não emite atributo
 * de orientação nenhum**. O arquivo antigo dependia dessa inversão sem
 * registrá-la, e é a armadilha exata que faz a próxima pessoa "corrigir" para o
 * lado errado. Aqui a geometria sai de uma condicional sobre o contexto — o
 * precedente do `separator.tsx`, que tirou as medidas de `data-[orientation=…]`
 * pelo mesmo motivo.
 *
 * ## Três classes do arquivo antigo não faziam nada
 *
 * **`flex h-full w-full` no grupo.** O `Group` declara `display`,
 * `flex-direction`, `flex-wrap`, `overflow`, `height` e `width` por **estilo
 * inline** — o próprio `.d.ts` avisa que as quatro primeiras não podem ser
 * sobrescritas. Inline vence classe: a `className` do grupo era inteiramente
 * inerte. Quem precisa mudar a caixa do grupo usa `style`, não classe.
 *
 * **`aria-[orientation=vertical]:flex-col` no grupo.** O nó do grupo só carrega
 * `data-group`, `data-testid` e `id`. O seletor não casava com nada.
 *
 * **`ring-offset-background` sem largura de offset**, e `rounded-lg` (10px)
 * numa pega de 4px, que o navegador clampa para 2. A família do "Desfazer" do
 * toast, que declarava `border-color` e nenhum `border-style`.
 *
 * ## O que ele não faz
 *
 * **Não tem eixo `size`.** Nenhuma contagem o pede — o precedente é a
 * `Toolbar`, que não ganhou eixo nenhum e registrou isso como a leitura honesta
 * das contagens.
 *
 * **Não importa a régua do `DragHandle`.** A pega usa a mesma tinta de arraste
 * que a folha e a gaveta, e no **mesmo** degrau: 70% — a rodada da alça varreu
 * os degraus contra `--background` e chegou ao mesmo piso desta varredura, por
 * caminho independente. Com isso cai o argumento que esta nota fazia, de que a
 * área explicaria alças mais claras: área muda como a cor **lê**, não o que a
 * 1.4.11 **exige**. A tinta é escrita literal aqui: o
 * `drag-handle` é Átomo, mas a asserção 2 do `taxonomy.test.ts` deixa este arquivo
 * — Átomo — importar **um** componente de `ui/`, que tem de ser Átomo. O
 * orçamento inteiro vai para o `Button` do gatilho de colapso. Pela mesma
 * razão, o fio do modo empilhado é uma `div` e **não** um `<Separator>`.
 */

/**
 * O alvo de arraste. `coarse` é a medida de dedo do sistema, a mesma do
 * `pointer-coarse:min-h-11`; `fine` é o padrão da lib.
 */
const DRAG_TARGET = { coarse: 44, fine: 10 } as const

/**
 * As props que a lib entende e uma `div` não. No modo empilhado não há `Group`
 * nem `Panel` para recebê-las, e deixá-las passar vira atributo desconhecido no
 * DOM. As duas listas são o contrato escrito, e não um descarte por
 * destructuring — que compila igual e não diz o que está sendo jogado fora.
 */
const GROUP_ONLY_PROPS = [
  "defaultLayout",
  "disableCursor",
  "disabled",
  "elementRef",
  "groupRef",
  "onLayoutChange",
  "onLayoutChanged",
] as const

const PANEL_ONLY_PROPS = [
  "collapsedSize",
  "collapsible",
  "defaultSize",
  "disabled",
  "elementRef",
  "groupResizeBehavior",
  "maxSize",
  "minSize",
  "onResize",
  "panelRef",
] as const

function toDomProps<T extends object>(
  props: T,
  drop: readonly string[]
): React.HTMLAttributes<HTMLDivElement> {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(props)) {
    if (!drop.includes(key)) out[key] = value
  }
  return out as React.HTMLAttributes<HTMLDivElement>
}

type ResizableOrientation = ResizablePrimitive.Orientation

const ResizableContext = React.createContext<{
  orientation: ResizableOrientation
  stacked: boolean
}>({ orientation: "horizontal", stacked: false })

const useResizableContext = () => React.useContext(ResizableContext)

/**
 * O movimento do colapso, e por que ele é declarado no **grupo**.
 *
 * Quem carrega o `flex-grow` é a **raiz** de cada painel, e a `className` do
 * `ResizablePanel` cai num `div` **interno** — o `.d.ts` da lib diz isso com
 * todas as letras ("Class is applied to nested HTMLDivElement to avoid styles
 * that interfere with Flex layout"). Então a transição não tem como ser escrita
 * no painel: ela é um seletor de filho a partir do grupo, que é o único nó com
 * `className` na mesma árvore.
 *
 * ## Ela desliga durante o arraste, e isso é o ponto
 *
 * `flex-grow` transiciona (é um `<number>`), mas transição durante arraste é
 * **atraso**: o painel passaria a perseguir o cursor com 200ms de sobra. O mesmo
 * vale para o teclado, onde cada seta é um passo e a repetição de tecla
 * empilharia interpolações.
 *
 * Os dois estados já estão publicados pela lib no `data-separator` — `active`
 * enquanto arrasta, `focus` enquanto o teclado manda —, então a regra é ler
 * esses dois e zerar a duração. Sobra exatamente o caso que **é** um comando
 * discreto: colapsar e expandir.
 *
 * ## Variável, e não uma segunda classe disputando
 *
 * A duração desce por `--resizable-anim` em vez de um
 * `has-…:[&>…]:transition-none` empilhado sobre a classe base. As duas
 * escreveriam a **mesma** propriedade no mesmo elemento, e quem venceria seria a
 * ordem de emissão do Tailwind — não o que se escreveu. Variável herda e não
 * disputa; é o mecanismo de `--toolbar-control` e de `--disclosure-nudge`.
 *
 * ## O custo, dito
 *
 * Animar `flex-grow` reflui o conteúdo dos painéis a cada quadro. Num painel com
 * tabela longa isso é caro, e é a razão de o movimento ficar restrito ao
 * comando em vez de valer para toda mudança de tamanho. `prefers-reduced-motion`
 * não precisa de regra própria: o bloco global encurta transições para 0,01ms.
 */
const resizableGroupMotionClassName = [
  "[--resizable-anim:var(--duration-base)]",
  "has-[[data-separator=active]]:[--resizable-anim:0s]",
  "has-[[data-separator=focus]]:[--resizable-anim:0s]",
  "[&>[data-slot=resizable-panel]]:transition-[flex-grow]",
  "[&>[data-slot=resizable-panel]]:duration-(--resizable-anim)",
  "[&>[data-slot=resizable-panel]]:ease-(--ease-out)",
].join(" ")

const resizableHandleVariants = cva(
  [
    "relative flex shrink-0 items-center justify-center outline-hidden",
    // O realce. 2px sobre uma costura de 1px, e só a cor transiciona.
    "before:absolute before:bg-transparent before:transition-colors",
    "before:duration-(--duration-fast) before:ease-(--ease-out)",
    // O acento acende ao pousar, ao focar pelo teclado e enquanto arrasta.
    // `focus` desloca `hover` na máquina da lib, então os três são declarados.
    "data-[separator=hover]:before:bg-primary-accent/60",
    "data-[separator=focus]:before:bg-primary-accent/60",
    "data-[separator=active]:before:bg-primary-accent",
    // O anel do sistema. Era `ring-1` mais um `ring-offset-background` sem
    // largura — a única peça de `ui/` fora do `ring-3`.
    "focus-visible:ring-3 focus-visible:ring-ring/70",
    // Desabilitado volta a ser um fio, sem acento e sem pega.
    "data-[separator=disabled]:before:bg-transparent",
  ],
  {
    variants: {
      variant: {
        line: "bg-border",
        grip: "bg-border",
        plain: "bg-transparent",
      },
      /** A orientação do **grupo**. A costura corre no eixo cruzado dela. */
      orientation: {
        horizontal: "h-full w-px before:inset-y-0 before:left-1/2 before:w-0.5 before:-translate-x-1/2",
        vertical: "h-px w-full before:inset-x-0 before:top-1/2 before:h-0.5 before:-translate-y-1/2",
      },
    },
    defaultVariants: { variant: "line", orientation: "horizontal" },
  }
)

type ResizablePanelGroupProps = ResizablePrimitive.GroupProps & {
  /**
   * Abaixo de 768px o grupo vira fluxo empilhado: os painéis soltam as
   * proporções e a costura deixa de arrastar. Um split é móvel de desktop, e é
   * o mesmo par que o `Sheet` já faz entre painel e gaveta — uma API só,
   * nenhuma tela escreve `isMobile`.
   *
   * O padrão é `orientation === "horizontal"`. Um grupo vertical num telefone
   * **já** é uma coluna, e o telefone é alto: ele mantém as alças.
   */
  stack?: boolean
}

function ResizablePanelGroup({
  className,
  orientation = "horizontal",
  resizeTargetMinimumSize = DRAG_TARGET,
  stack,
  children,
  ...props
}: ResizablePanelGroupProps) {
  const isMobile = useIsMobile()
  const stacked = (stack ?? orientation === "horizontal") && isMobile
  const context = React.useMemo(
    () => ({ orientation, stacked }),
    [orientation, stacked]
  )

  if (stacked) {
    return (
      <ResizableContext.Provider value={context}>
        <div
          data-slot="resizable-panel-group"
          data-stacked=""
          className={cn("flex min-w-0 flex-col", className)}
          {...toDomProps(props, GROUP_ONLY_PROPS)}
        >
          {children}
        </div>
      </ResizableContext.Provider>
    )
  }

  return (
    <ResizableContext.Provider value={context}>
      <ResizablePrimitive.Group
        data-slot="resizable-panel-group"
        orientation={orientation}
        resizeTargetMinimumSize={resizeTargetMinimumSize}
        className={cn(resizableGroupMotionClassName, className)}
        {...props}
      >
        {children}
      </ResizablePrimitive.Group>
    </ResizableContext.Provider>
  )
}

function ResizablePanel({
  className,
  children,
  ...props
}: ResizablePrimitive.PanelProps) {
  const { stacked } = useResizableContext()

  if (stacked) {
    return (
      <div
        data-slot="resizable-panel"
        data-stacked=""
        className={cn("min-w-0", className)}
        {...toDomProps(props, PANEL_ONLY_PROPS)}
      >
        {children}
      </div>
    )
  }

  return (
    <ResizablePrimitive.Panel
      data-slot="resizable-panel"
      className={className}
      {...props}
    >
      {children}
    </ResizablePrimitive.Panel>
  )
}

type ResizableHandleProps = ResizablePrimitive.SeparatorProps &
  Pick<VariantProps<typeof resizableHandleVariants>, "variant">

function ResizableHandle({
  className,
  variant = "line",
  "aria-label": ariaLabel = "Redimensionar painéis",
  ...props
}: ResizableHandleProps) {
  const { orientation, stacked } = useResizableContext()

  if (stacked) {
    // Empilhado não há o que arrastar, e a costura perde o papel e o foco. O
    // fio fica: duas regiões de conteúdo empilhadas sem nada entre elas leem
    // como um bloco só, e fio entre itens é a categoria que nunca o perde.
    if (variant === "plain") return null

    return (
      <div
        data-slot="resizable-handle"
        data-stacked=""
        data-variant={variant}
        aria-hidden
        className={cn("h-px w-full shrink-0 bg-border", className)}
      />
    )
  }

  return (
    <ResizablePrimitive.Separator
      data-slot="resizable-handle"
      data-variant={variant}
      aria-label={ariaLabel}
      className={cn(resizableHandleVariants({ orientation, variant }), className)}
      {...props}
    >
      {variant === "grip" && (
        <div
          data-slot="resizable-grip"
          className={cn(
            // A mesma tinta de arraste da folha e da gaveta, num alfa maior — e
            // o que separa os dois é **área**. A alça da gaveta é 48×6 numa
            // superfície que a pessoa acabou de abrir; esta pega é 4×32 entre
            // dois painéis de conteúdo, e a mesma cor lê como menos: é a
            // medição da `AnnouncementBar`, onde 12px de ícone precisaram de
            // mais tinta que um botão de texto pelo mesmo motivo.
            //
            // Varridos os degraus sobre o fundo real, **70% é o primeiro que
            // alcança 3:1 nos dois temas** — 3,16 no claro e 4,05 no escuro,
            // contra 1,66 e 1,92 a 35%. É a varredura que o cartão de escolha
            // do `Field` já fez, e o mesmo critério.
            //
            // `shrink-0` é carga estrutural, não enfeite: a pega é filha de um
            // flex de **1px** de largura, e sem ela o flex a esmaga. Medido sem
            // a classe, ela saía 1×32 em vez de 4×32.
            "pointer-events-none shrink-0 rounded-full bg-muted-foreground/70",
            orientation === "horizontal" ? "h-8 w-1" : "h-1 w-8"
          )}
        />
      )}
    </ResizablePrimitive.Separator>
  )
}

/**
 * `localStorage` com as duas guardas que a lib não tem.
 *
 * O padrão do `useDefaultLayout` é `storage = localStorage`, avaliado na
 * chamada do hook — e o `getServerSnapshot` dele também lê o storage. Num
 * componente cliente pré-renderizado pelo Next isso é `ReferenceError` no
 * servidor. O `setItem` ainda pode lançar por cota ou por janela anônima.
 */
const safeLayoutStorage: ResizablePrimitive.LayoutStorage = {
  getItem: (key) => {
    if (typeof window === "undefined") return null
    try {
      return window.localStorage.getItem(key)
    } catch {
      return null
    }
  },
  setItem: (key, value) => {
    if (typeof window === "undefined") return
    try {
      window.localStorage.setItem(key, value)
    } catch {
      // Cota estourada ou armazenamento bloqueado. A proporção volta ao padrão
      // no próximo carregamento, que é o pior caso aceitável.
    }
  },
}

/**
 * Lembra a proporção entre carregamentos.
 *
 * Um split cuja proporção reseta a cada navegação é um split que ninguém
 * ajusta. Espalhe o retorno no `ResizablePanelGroup`, e dê `id` a cada
 * `ResizablePanel` — é por ele que a proporção é reencontrada.
 *
 * `onlySaveAfterUserInteractions` fica ligado: redimensionar a janela não é a
 * pessoa escolhendo uma proporção.
 */
function useResizableLayout({
  id,
  panelIds,
  storage = safeLayoutStorage,
}: {
  /** Identifica a proporção guardada. Único no app. */
  id: string
  /** Só para grupos com painel condicional, para não haver salto no SSR. */
  panelIds?: string[]
  storage?: ResizablePrimitive.LayoutStorage
}) {
  const { defaultLayout, onLayoutChanged } =
    ResizablePrimitive.useDefaultLayout({
      id,
      onlySaveAfterUserInteractions: true,
      panelIds,
      storage,
    })

  // A proporção guardada só entra **depois** da hidratação, e isso não é
  // cautela: medido no catálogo, o grupo lançava
  // `A tree hydrated but some attributes … didn't match` com um diff inteiro de
  // `flexGrow`. A causa é a lib passar **a mesma função** como `getSnapshot` e
  // como `getServerSnapshot` do `useSyncExternalStore` — então, na passagem de
  // hidratação, o cliente lê o `localStorage` e discorda do HTML que o servidor
  // acabou de mandar, onde nada havia. Nenhuma guarda de `typeof window` pega
  // isso: na hidratação o `window` existe.
  const [hidratado, setHidratado] = React.useState(false)
  React.useEffect(() => setHidratado(true), [])

  // E adiar sozinho não basta — medido: com o `defaultLayout` chegando depois,
  // o grupo o **ignora** e fica no `defaultSize` de cada painel (25/75 guardado,
  // 40/60 na tela). `defaultLayout` é lido na montagem, e só nela. Por isso o
  // `groupKey`: ele troca uma vez, na hidratação, e remonta o grupo já com a
  // proporção certa. O custo é uma remontagem por carregamento, e é por isso
  // que ele é `key` explícito em vez de vir no espalhamento — quem paga tem de
  // ver o preço escrito na chamada.
  const groupProps = React.useMemo(
    () => ({
      defaultLayout: hidratado ? defaultLayout : undefined,
      onLayoutChanged,
    }),
    [defaultLayout, hidratado, onLayoutChanged]
  )

  // `groupKey` sai **fora** de `groupProps` de propósito: ele é `key`, não
  // prop. Devolvido junto com os outros, o espalhamento o levava até a `div` do
  // grupo e o React reclamava de atributo desconhecido — medido.
  return { groupKey: hidratado ? "hidratado" : "servidor", groupProps }
}

/**
 * O colapso de um painel, e o estado dele.
 *
 * `isCollapsed()` da lib é um getter, não uma assinatura reativa — quem
 * re-renderiza é o `onResize`, por isso ele vem dentro de `panelProps`. Passe
 * `collapsible` e, quando fizer sentido, `collapsedSize` no próprio painel:
 * são eles que também dão o colapso por arraste.
 */
function useResizablePanel() {
  const [handle, setHandle] = ResizablePrimitive.usePanelCallbackRef()
  const [isCollapsed, setIsCollapsed] = React.useState(false)

  const sync = React.useCallback(() => {
    setIsCollapsed(handle?.isCollapsed() ?? false)
  }, [handle])

  const collapse = React.useCallback(() => handle?.collapse(), [handle])
  const expand = React.useCallback(() => handle?.expand(), [handle])
  const toggle = React.useCallback(() => {
    if (handle?.isCollapsed()) handle.expand()
    else handle?.collapse()
  }, [handle])

  return {
    /** Espalhe no `ResizablePanel` que este hook governa. */
    panelProps: { panelRef: setHandle, onResize: sync },
    isCollapsed,
    collapse,
    expand,
    toggle,
  }
}

type ResizableCollapseTriggerProps = Omit<
  React.ComponentProps<typeof Button>,
  "variant" | "children"
> & {
  /** O painel está colapsado. Decide o sentido da seta e o `aria-expanded`. */
  collapsed: boolean
  /** De que lado do grupo mora o painel que este gatilho colapsa. */
  side: "start" | "end"
}

/**
 * O gatilho de colapso.
 *
 * Ele mora no cabeçalho do painel, e **não** na alça: qualquer controle a menos
 * de metade da região de arraste da costura tem o clique engolido pelo início
 * de um arraste. A medição está no cabeçalho deste arquivo.
 */
function ResizableCollapseTrigger({
  className,
  collapsed,
  side,
  size = "icon-sm",
  ...props
}: ResizableCollapseTriggerProps) {
  const { orientation } = useResizableContext()

  // A seta aponta para onde o clique vai levar o painel: para fora quando ele
  // vai fechar, para dentro quando vai abrir.
  const pointsToStart = side === "start" ? !collapsed : collapsed
  const Icon =
    orientation === "horizontal"
      ? pointsToStart
        ? ChevronLeftIcon
        : ChevronRightIcon
      : pointsToStart
        ? ChevronUpIcon
        : ChevronDownIcon

  return (
    <Button
      data-slot="resizable-collapse-trigger"
      type="button"
      variant="tertiary"
      size={size}
      aria-expanded={!collapsed}
      className={className}
      {...props}
    >
      <Icon />
    </Button>
  )
}

export {
  ResizableCollapseTrigger,
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  resizableHandleVariants,
  useResizableLayout,
  useResizablePanel,
}
export type { ResizableOrientation }
