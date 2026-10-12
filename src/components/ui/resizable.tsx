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
 * A costura não é uma borda: a lib publica a máquina de estados em
 * `data-separator` (`inactive`, `hover`, `active`, `focus`, `disabled`) e a
 * costura acende no acento da marca ao pousar e ao arrastar (`--primary-accent`:
 * traço fino é acento, e traço com alfa também).
 * O realce é um `::before` absoluto de 2px fora do fluxo, e só a cor transiciona
 * (engrossar a alça refluiria os painéis); `::before` e não `::after` porque o
 * `after` pintaria por cima da pega.
 * A região de arraste é da lib (v4): expande a `DOMRect` da costura por
 * `resizeTargetMinimumSize`, padrão `{ coarse: 20, fine: 10 }`. Aqui
 * `{ coarse: 44, fine: 10 }`: 44 é a medida de dedo da casa. Continua sendo prop.
 * O colapsar não mora na alça: a lib liga `pointerdown`, `dblclick`,
 * `contextmenu` e `pointerup` no documento em captura, então um `<button>` na
 * alça é impossível e qualquer controle a menos de metade da região de arraste
 * (22px) tem o clique engolido. O colapso é `useResizablePanel` +
 * `ResizableCollapseTrigger`, no cabeçalho do painel; o colapso por arraste é o
 * da lib (`collapsible` + `collapsedSize`).
 * A orientação vem do contexto, não do `aria-orientation`: o `Separator` emite
 * o valor invertido em relação ao grupo e o `Group` não emite nenhum (armadilha
 * de "corrigir" para o lado errado).
 * O `Group` declara `display`, `flex-direction`, `flex-wrap`, `overflow`,
 * `height` e `width` por estilo inline: a `className` do grupo não os muda
 * (use `style`).
 * Sem eixo `size` (nenhuma contagem o pede, como na `Toolbar`). A tinta da pega
 * é escrita literal aqui, sem importar o `DragHandle` (do `drawer.tsx`, um
 * Organismo): um Átomo importa **um** componente de `ui/`, e esse tem de ser
 * Átomo (`taxonomy.test.ts`), e o orçamento vai para o `Button` do gatilho. Pelo
 * mesmo motivo o fio do modo empilhado é uma `div`, e não um `<Separator>`.
 */

/**
 * O alvo de arraste. `coarse` é a medida de dedo do sistema (a do
 * `pointer-coarse:min-h-11`); `fine` é o padrão da lib.
 */
const DRAG_TARGET = { coarse: 44, fine: 10 } as const

/**
 * As props que a lib entende e uma `div` não: no modo empilhado não há `Group`
 * nem `Panel`, e deixá-las passar vira atributo desconhecido no DOM. As duas
 * listas são o contrato escrito, em vez de um descarte por destructuring.
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
 * O movimento do colapso, declarado no **grupo**: o `flex-grow` está na raiz de
 * cada painel e a `className` do `ResizablePanel` cai num `div` interno, então
 * a transição é um seletor de filho a partir do grupo.
 * Desliga durante o arraste e o teclado (`data-separator` `active`/`focus`):
 * transição aí é atraso, e a repetição de tecla empilharia interpolações. Sobra
 * o comando discreto, colapsar e expandir.
 * A duração desce por `--resizable-anim`, e não por um `transition-none`
 * empilhado: duas classes na mesma propriedade seriam decididas pela ordem de
 * emissão do Tailwind.
 * Custo: animar `flex-grow` reflui o conteúdo a cada quadro; por isso só o comando
 * anima. `prefers-reduced-motion` é coberto pelo bloco global.
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
    // O realce: 2px sobre uma costura de 1px, e só a cor transiciona.
    "before:absolute before:bg-transparent before:transition-colors",
    "before:duration-(--duration-fast) before:ease-(--ease-out)",
    // O acento acende ao pousar, ao focar pelo teclado e enquanto arrasta; `focus`
    // desloca `hover` na máquina da lib, então os três são declarados.
    "data-[separator=hover]:before:bg-primary-accent/60",
    "data-[separator=focus]:before:bg-primary-accent/60",
    "data-[separator=active]:before:bg-primary-accent",
    // O anel do sistema (`ring-3`).
    "focus-visible:ring-3 focus-visible:ring-ring/45",
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
   * Abaixo de 768px o grupo vira fluxo empilhado: os painéis soltam as proporções
   * e a costura deixa de arrastar (o mesmo par do `Sheet` entre painel e gaveta;
   * nenhuma tela escreve `isMobile`). O padrão é `orientation === "horizontal"`:
   * um grupo vertical num telefone já é uma coluna e mantém as alças.
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
    // Empilhado não há o que arrastar: a costura perde o papel e o foco. O fio fica,
    // senão duas regiões empilhadas leem como um bloco só.
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
            // A mesma tinta de arraste da folha e da gaveta, num alfa maior porque a área é
            // menor (4×32 entre dois painéis de conteúdo). 70% é o primeiro degrau que
            // alcança 3:1 nos dois temas (3,16 no claro, 4,05 no escuro).
            // `shrink-0` é carga estrutural: a pega é filha de um flex de 1px de largura e
            // sem ele sai 1×32.
            "pointer-events-none shrink-0 rounded-full bg-muted-foreground/70",
            orientation === "horizontal" ? "h-8 w-1" : "h-1 w-8"
          )}
        />
      )}
    </ResizablePrimitive.Separator>
  )
}

/**
 * `localStorage` com as duas guardas que a lib não tem: o padrão do
 * `useDefaultLayout` o lê na chamada do hook (e no `getServerSnapshot`), o que é
 * `ReferenceError` no servidor, e o `setItem` pode lançar por cota ou janela anônima.
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
      // Cota estourada ou armazenamento bloqueado: a proporção volta ao padrão no
      // próximo carregamento.
    }
  },
}

/**
 * Lembra a proporção entre carregamentos. Espalhe o retorno no
 * `ResizablePanelGroup` e dê `id` a cada `ResizablePanel` (é por ele que a
 * proporção é reencontrada). `onlySaveAfterUserInteractions` fica ligado:
 * redimensionar a janela não é escolher uma proporção.
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

  // A proporção guardada só entra depois da hidratação: a lib passa a mesma
  // função como `getSnapshot` e `getServerSnapshot` do `useSyncExternalStore`, o
  // cliente lê o `localStorage` e discorda do HTML do servidor (erro de
  // hidratação com diff de `flexGrow`). Nenhuma guarda de `typeof window` pega.
  const [hidratado, setHidratado] = React.useState(false)
  React.useEffect(() => setHidratado(true), [])

  // Adiar sozinho não basta: `defaultLayout` é lido só na montagem. O `groupKey`
  // troca uma vez, na hidratação, e remonta o grupo já com a proporção certa. O
  // custo é uma remontagem por carregamento, por isso é `key` explícito.
  const groupProps = React.useMemo(
    () => ({
      defaultLayout: hidratado ? defaultLayout : undefined,
      onLayoutChanged,
    }),
    [defaultLayout, hidratado, onLayoutChanged]
  )

  // `groupKey` fica fora de `groupProps` de propósito: é `key`, não prop; no
  // espalhamento chegaria à `div` do grupo.
  return { groupKey: hidratado ? "hidratado" : "servidor", groupProps }
}

/**
 * O colapso de um painel e o estado dele. `isCollapsed()` da lib é um getter,
 * não uma assinatura reativa: quem re-renderiza é o `onResize`, por isso vem em
 * `panelProps`. Passe `collapsible` (e `collapsedSize`) no próprio painel: é o
 * que dá o colapso por arraste.
 */
function useResizablePanel() {
  const [handle, setHandle] = ResizablePrimitive.usePanelCallbackRef()
  const [isCollapsed, setIsCollapsed] = React.useState(false)

  // O painel pode guardar o primeiro `onResize` que recebeu, de quando o `handle`
  // era nulo: lido pela ref, o colapso consulta sempre o atual.
  const handleRef = React.useRef(handle)
  React.useLayoutEffect(() => {
    handleRef.current = handle
  }, [handle])
  const sync = React.useCallback(() => {
    setIsCollapsed(handleRef.current?.isCollapsed() ?? false)
  }, [])

  const collapse = React.useCallback(() => handle?.collapse(), [handle])
  const expand = React.useCallback(() => handle?.expand(), [handle])
  const toggle = React.useCallback(() => {
    if (handle?.isCollapsed()) handle.expand()
    else handle?.collapse()
  }, [handle])

  // Um objeto novo a cada render faria o painel receber props "diferentes" sempre.
  const panelProps = React.useMemo(() => ({ panelRef: setHandle, onResize: sync }), [setHandle, sync])

  return {
    /** Espalhe no `ResizablePanel` que este hook governa. */
    panelProps,
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
 * O gatilho de colapso: mora no cabeçalho do painel, não na alça (um controle a
 * menos de metade da região de arraste tem o clique engolido).
 */
function ResizableCollapseTrigger({
  className,
  collapsed,
  side,
  size = "icon-md",
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

/**
 * As colunas de uma tabela: a mesma costura, no cabeçalho de uma `Table`. Não é
 * a lib (os painéis dela são flex; numa tabela quem manda na largura é a célula
 * da primeira linha): o arraste é nosso (`pointer` com captura, setas,
 * duplo-clique) e o desenho é o do `ResizableHandle plain`.
 * Uma coluna fica sem largura e é a folga: com `table-layout: fixed` ela
 * absorve a sobra, e é o que faz o arraste andar com o ponteiro. O piso dela
 * (`fluidMinWidth`, 192px) entra no `min-width` da tabela; abaixo dele o
 * viewport da `Table` rola na horizontal.
 */
type ResizableColumn = {
  /** A largura inicial, em px. */
  width: number
  /** O piso, em px. Padrão 48. */
  min?: number
  /** O teto, em px. Padrão sem teto. */
  max?: number
}

const COLUMN_MIN = 48
/** Um passo das setas. `Shift` multiplica por 4. */
const COLUMN_STEP = 8

function lerLarguras(id: string | undefined): Record<string, number> | null {
  if (!id) return null
  try {
    const bruto = safeLayoutStorage.getItem(`resizable-columns:${id}`)
    return bruto ? (JSON.parse(bruto) as Record<string, number>) : null
  } catch {
    return null
  }
}

/**
 * As larguras das colunas, o arraste e a memória. Espalhe `tableStyle` na
 * `Table`, `columnStyle(chave)` em cada `TableHead` redimensionável e
 * `handleProps(chave, rótulo)` num `ResizableColumnHandle` dentro dele. Com `id`
 * as larguras são lembradas, lidas depois da hidratação (como no
 * `useResizableLayout`).
 */
function useResizableColumns<K extends string>({
  id,
  columns,
  fluidMinWidth = 192,
}: {
  id?: string
  columns: Record<K, ResizableColumn>
  fluidMinWidth?: number
}) {
  const padrao = React.useMemo(() => {
    const out = {} as Record<K, number>
    for (const k of Object.keys(columns) as K[]) out[k] = columns[k].width
    return out
  }, [columns])
  const [larguras, setLarguras] = React.useState<Record<K, number>>(padrao)

  React.useEffect(() => {
    const guardado = lerLarguras(id)
    if (guardado) setLarguras((atual) => ({ ...atual, ...guardado }))
  }, [id])

  const limitar = React.useCallback(
    (k: K, v: number) => {
      const c = columns[k]
      return Math.round(Math.min(c.max ?? Infinity, Math.max(c.min ?? COLUMN_MIN, v)))
    },
    [columns]
  )

  const definir = React.useCallback(
    (k: K, v: number, salvar: boolean) => {
      setLarguras((atual) => {
        const proximo = { ...atual, [k]: limitar(k, v) }
        if (salvar && id) {
          safeLayoutStorage.setItem(`resizable-columns:${id}`, JSON.stringify(proximo))
        }
        return proximo
      })
    },
    [id, limitar]
  )

  const soma = (Object.values(larguras) as number[]).reduce((a, b) => a + b, 0)

  return {
    widths: larguras,
    tableStyle: {
      tableLayout: "fixed",
      minWidth: soma + fluidMinWidth,
    } satisfies React.CSSProperties,
    columnStyle: (k: K): React.CSSProperties => ({ width: larguras[k] }),
    handleProps: (k: K, label: string): ResizableColumnHandleProps => ({
      label,
      width: larguras[k],
      min: columns[k].min ?? COLUMN_MIN,
      max: columns[k].max,
      onWidthChange: (v, fim) => definir(k, v, fim),
      onReset: () => definir(k, columns[k].width, true),
    }),
  }
}

type ResizableColumnHandleProps = {
  /** O nome da coluna, para o `aria-label` da costura. */
  label: string
  width: number
  min: number
  max?: number
  /** `fim` é verdadeiro ao soltar e no teclado: é quando a largura é guardada. */
  onWidthChange: (width: number, fim: boolean) => void
  onReset: () => void
  className?: string
}

/**
 * A costura de uma coluna: o `role="separator"` na borda direita do `TableHead`.
 * O alvo é de 10px no mouse e 24px no dedo, e não os 44 da casa: numa coluna de
 * 88px, 44 cobririam metade do rótulo e o clique de ordenar passaria a arrastar.
 */
function ResizableColumnHandle({
  label,
  width,
  min,
  max,
  onWidthChange,
  onReset,
  className,
}: ResizableColumnHandleProps) {
  const inicio = React.useRef<{ x: number; w: number } | null>(null)
  const [arrastando, setArrastando] = React.useState(false)

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label={`Redimensionar a coluna ${label}`}
      aria-valuenow={width}
      aria-valuemin={min}
      aria-valuemax={max}
      tabIndex={0}
      data-slot="resizable-column-handle"
      data-dragging={arrastando ? "" : undefined}
      className={cn(
        "absolute inset-y-0 right-0 z-10 w-2.5 translate-x-1/2 cursor-col-resize touch-none outline-hidden select-none pointer-coarse:w-6",
        // O fio: nada em repouso, a borda ao pousar na célula, o acento ao pousar na
        // costura, ao focar e ao arrastar. 2px centrados, só a cor transiciona.
        "before:absolute before:inset-y-1.5 before:left-1/2 before:w-0.5 before:-translate-x-1/2 before:rounded-full before:bg-transparent before:transition-colors before:duration-(--duration-fast) before:ease-(--ease-out)",
        "[@media(hover:hover)]:in-[th:hover]:before:bg-border",
        "hover:before:bg-primary-accent/60 focus-visible:before:bg-primary-accent/60",
        "data-dragging:before:bg-primary-accent",
        "focus-visible:ring-3 focus-visible:ring-ring/45",
        className
      )}
      // A costura mora dentro do cabeçalho, e um clique nela não pode chegar ao
      // botão de ordenar da mesma célula.
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => {
        if (e.button !== 0) return
        e.preventDefault()
        e.stopPropagation()
        e.currentTarget.setPointerCapture(e.pointerId)
        inicio.current = { x: e.clientX, w: width }
        setArrastando(true)
      }}
      onPointerMove={(e) => {
        if (!inicio.current) return
        onWidthChange(inicio.current.w + e.clientX - inicio.current.x, false)
      }}
      onPointerUp={(e) => {
        if (!inicio.current) return
        onWidthChange(inicio.current.w + e.clientX - inicio.current.x, true)
        inicio.current = null
        setArrastando(false)
      }}
      onPointerCancel={() => {
        inicio.current = null
        setArrastando(false)
      }}
      onDoubleClick={(e) => {
        e.stopPropagation()
        onReset()
      }}
      onKeyDown={(e) => {
        const passo = COLUMN_STEP * (e.shiftKey ? 4 : 1)
        const alvo =
          e.key === "ArrowLeft"
            ? width - passo
            : e.key === "ArrowRight"
              ? width + passo
              : e.key === "Home"
                ? min
                : e.key === "End" && max != null
                  ? max
                  : e.key === "Enter"
                    ? null
                    : undefined
        if (alvo === undefined) return
        e.preventDefault()
        if (alvo === null) onReset()
        else onWidthChange(alvo, true)
      }}
    />
  )
}

export {
  ResizableCollapseTrigger,
  ResizableColumnHandle,
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  resizableHandleVariants,
  useResizableColumns,
  useResizableLayout,
  useResizablePanel,
}
export type { ResizableColumn, ResizableOrientation }
