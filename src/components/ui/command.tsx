"use client"

import * as React from "react"
import { ArrowUpRightIcon } from "@heroicons/react/16/solid"
import { cva, type VariantProps } from "class-variance-authority"
import { Command as CommandPrimitive, useCommandState } from "cmdk"

import { SearchInput } from "@/components/ui/search-input"
import { Kbd } from "@/components/ui/kbd"
import { Drawer, DrawerContent } from "@/components/ui/drawer"
import { useIsMobile } from "@/hooks/use-mobile"
import { ehCursor } from "@/lib/pointer"
import { cn } from "@/lib/utils"
import { ariaShortcut, matchShortcut } from "@/lib/shortcut"
import { Caption, P } from "@/components/ui/typography"
import {
  menuItemGeometryClassName,
  menuSeparatorClassName,
  menuItemFadeClassName, menuPanelTintClassName } from "@/lib/menu-classes"
import {
  scrollFadeBandsClassName,
  scrollFadeBleedClassName,
  scrollFadeViewportClassName,
} from "@/lib/scroll-fade-classes"
import { useScrollFade } from "@/hooks/use-scroll-fade"
import { ScrollFadeArrows } from "@/lib/scroll-fade-arrows"
import { useCommandIdleSelection } from "@/hooks/use-command-idle-selection"
import { Dialog as DialogPrimitive } from "radix-ui"
import {
  Dialog,
  DialogCloseButton,
  DialogDescription,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from "@/components/ui/dialog"
/**
 * O eixo é a moldura (quem desenha a borda), não só o raio. `plain` (padrão) é
 * o caso do `Combobox`: dentro do anel do popover, uma segunda borda faria duas
 * linhas a 1px. Solta numa página a moldura é da própria paleta (`panel`);
 * dentro de um `CommandDialog` é do `DialogContent`.
 *
 * `CommandPages` + `CommandPage` + `useCommandPages` são as sub-páginas (a
 * trilha no campo como `CommandScope`, Backspace com o campo vazio volta em dois
 * toques); `CommandHighlight` negrita o trecho que casou; `CommandSplit` +
 * `CommandPreview` é a coluna da linha selecionada (some abaixo de `md`);
 * `CommandGroup count`; `CommandItem shortcut` dispara a ação com o foco na
 * paleta. No telefone o `CommandDialog` é gaveta (`Drawer`). Os ganchos
 * `useCommandRecents` e `useCommandSearch` moram em `hooks/`.
 */
const commandVariants = cva(
  [
    // O `Command` hospedado não pinta, quem pinta é a casca: num `Popover`
    // seriam duas placas a 60% empilhadas (regra "uma placa por superfície" de
    // `lib/menu-classes`). Só a variante `panel` pinta a própria.
    // `relative` é estrutural: as camadas de borrão das pontas são irmãs
    // absolutas do rolável, e o `overflow-hidden` as apara no canto.
    "relative flex size-full flex-col overflow-hidden text-popover-foreground",
    "[--command-list-max-h:--spacing(72)]",
    // A casca só publica as duas medidas estruturais (ela é a única que vê as
    // faixas como irmãs do rolável); a dissolução mora na própria lista. A
    // altura da faixa de busca é campo (32) + recuo (16).
    //
    // As duas são condicionais à presença da faixa, nunca à rolagem: demos
    // montam `CommandList` sem `CommandInput`, e condicionar o rodapé a
    // `data-scrollable` realimentava a condição (`pb` é `foot-h + 4`, então
    // declarar "rola" acrescentava 36px ao conteúdo).
    scrollFadeBandsClassName,
    "has-[[data-slot=command-input-wrapper]]:[--scroll-fade-band-h:calc(--spacing(8)+--spacing(4))]",
    // O campo `lg` (36) publica a própria faixa; o `:has()` com dois atributos pesa mais que o de um.
    "has-[[data-slot=command-input-wrapper][data-size=lg]]:[--scroll-fade-band-h:calc(--spacing(9)+--spacing(4))]",
    // O campo com piso de toque sobe a 40 no dedo e a faixa acompanha (40 + 16);
    // três atributos no `:has()` vencem os dois do `lg`.
    "pointer-coarse:has-[[data-slot=command-input-wrapper][data-touch-floor][data-size]]:[--scroll-fade-band-h:calc(--spacing(10)+--spacing(4))]",
  ],
  {
    variants: {
      variant: {
        /** Sem moldura e sem canto próprio: ele herda o de quem contém (popover, diálogo), sem copiar um número do contêiner. */
        plain: "[border-radius:inherit]",
        /**
         * A pilha: a raiz é uma coluna que não pinta, e cada peça pinta a sua
         * superfície (pílula de busca, placa da lista, cápsulas da legenda, a
         * 12px uma da outra, no mesmo plano). `overflow-visible` devolve o que a
         * base recorta (o anel da pílula fica fora da caixa).
         */
        panel: "gap-3 overflow-visible [--command-reveal:var(--duration-spring)]",
      },
      /**
       * A densidade da pilha: `palette` (pílula de 36, linhas de 36, respiro
       * largo) ou `menu` (pílula de 32, linhas de 28; sem consumidor hoje).
       */
      density: {
        palette: "",
        menu: "gap-1",
      },
    },
    defaultVariants: { variant: "plain", density: "palette" },
  }
)

/** Se a peça está na pilha (`Command variant="panel"`, a do `CommandDialog` e da paleta solta); na pilha campo, lista, grupo e linha vestem as três superfícies. */
const CommandStackContext = React.createContext<"palette" | "menu" | null>(null)

/** Se a pilha está num `CommandDialog`, o único lugar que acende o feixe da pílula. */
const CommandBeamContext = React.createContext(false)

/**
 * `autoSelectFirst={false}` abre a paleta sem nada selecionado (mecanismo em
 * [`use-command-idle-selection`](src/hooks/use-command-idle-selection.ts)). O
 * padrão é `true`, o que serve o `Combobox` (um seletor de valor); o
 * `CommandDialog`, destino de busca, liga o modo ocioso. Ele é dono do `value`:
 * um `value` controlado por fora seria sobrescrito, por isso o hook devolve `{}`
 * quando desligado.
 */
function Command({
  className,
  variant,
  density,
  autoSelectFirst = true,
  children,
  ...props
}: React.ComponentProps<typeof CommandPrimitive> &
  VariantProps<typeof commandVariants> & {
    /** Abrir com a primeira linha já selecionada. `false` = modo ocioso. */
    autoSelectFirst?: boolean
  }) {
  const resolvida = variant ?? "plain"
  const pilha = resolvida === "panel" ? (density ?? "palette") : null
  const ocioso = useCommandIdleSelection(!autoSelectFirst)

  return (
    <CommandPrimitive
      data-slot="command"
      data-variant={resolvida}
      className={cn(commandVariants({ variant: resolvida, density }), className)}
      {...props}
      // Os três handlers são compostos, não sobrescritos; o de quem chama roda
      // primeiro, para poder prevenir (o do hook confere `defaultPrevented`).
      value={ocioso.value ?? props.value}
      onValueChange={ocioso.onValueChange ?? props.onValueChange}
      onKeyDown={(event) => {
        props.onKeyDown?.(event)
        ocioso.onKeyDown?.(event)
      }}
      onInput={(event) => {
        props.onInput?.(event)
        ocioso.onInput?.(event)
      }}
      onPointerMoveCapture={(event) => {
        // O cmdk acende a linha no `pointermove` e o dedo rolando a acendia: a
        // seleção pelo ponteiro é do cursor. Em captura o item não recebe o toque.
        if (!ehCursor(event)) {
          event.stopPropagation()
          return
        }
        props.onPointerMoveCapture?.(event)
        ocioso.onPointerMoveCapture?.(event)
      }}
      onPointerLeave={(event) => {
        props.onPointerLeave?.(event)
        ocioso.onPointerLeave?.(event)
      }}
    >
      <CommandStackContext.Provider value={pilha}>
        {children}
      </CommandStackContext.Provider>

      {/* Sem camadas de borrão nas pontas: dentro de um casco que já borra, cada
          `backdrop-filter` aninhado re-borrava a placa e a aresta saía como uma
          linha de tom. A máscara sozinha faz o trabalho. */}
    </CommandPrimitive>
  )
}

/**
 * A paleta em diálogo, dona do próprio `Command` (`CommandInput` e
 * `CommandList` exigem o contexto da raiz; sem ela o cmdk estoura com `Cannot
 * read properties of undefined (reading 'subscribe')`). Monta-o transparente
 * (`plain`); `commandProps` é a saída para o que a raiz precisa receber (o
 * `filter` próprio do `ds-search`).
 */
function CommandDialog({
  title = "Paleta de comandos",
  description = "Busque uma tela, uma ação ou um registro.",
  children,
  className,
  showCloseButton = false,
  commandProps,
  size = "md",
  ...props
}: React.ComponentProps<typeof Dialog> & {
  title?: string
  description?: string
  /** Classes da raiz `Command`, a pilha (não pinta). */
  className?: string
  showCloseButton?: boolean
  /** O que a raiz `Command` precisa receber: `filter`, `shouldFilter`, `loop`. */
  commandProps?: Omit<React.ComponentProps<typeof Command>, "children">
  /** `lg` é a paleta larga, para a pré-visualização ao lado (`CommandSplit` + `CommandPreview`); no telefone é gaveta. */
  size?: "md" | "lg"
}) {
  const isMobile = useIsMobile()

  // No telefone a paleta é gaveta (o diálogo centrado ficava atrás do teclado):
  // a busca fica em cima, a legenda (`dock`) some no toque. O `vaul` é o mesmo
  // `Dialog` do Radix, então o `DialogTitle` continua valendo.
  if (isMobile) {
    return (
      <Drawer {...props}>
        <DrawerContent
          data-slot="command-drawer"
          className="px-3 pb-[max(--spacing(3),env(safe-area-inset-bottom))]"
        >
          <DialogHeader className="sr-only">
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <Command
            variant="panel"
            autoSelectFirst={false}
            className={cn(
              "gap-2 pt-1",
              "[--command-list-ceiling:min(60dvh,24rem)]",
              className
            )}
            {...commandProps}
          >
            {children}
          </Command>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog {...props}>
      <DialogPortal>
        <DialogOverlay />
        {/* O `Content` é uma coluna que não pinta: a placa é um filho e a legenda
            de teclado (`dock`) é a irmã dela, embaixo. Não é o `DialogContent`
            porque ali a placa é o `Content` (vidro e `overflow-hidden` no mesmo
            nó), e um elemento com `backdrop-filter` é raiz de fundo: o borrão
            das cápsulas não veria a página. Posição, largura e camada são as do
            `dialogContentVariants`. */}
        <DialogPrimitive.Content
          data-slot="command-dialog"
          className={cn(
            "fixed left-1/2 z-(--z-modal) flex w-full max-w-[calc(100%-2rem)] -translate-x-1/2 flex-col text-sm outline-none sm:max-w-md",
            size === "lg" && "sm:max-w-3xl",
            // Sem sombra atrás do conjunto: pílula, placa e legenda são formas
            // soltas, e a sombra de um retângulo que não é nenhuma delas
            // aparecia como mancha; quem separa a paleta da página é o véu com
            // borrão. A posição precisa de conta própria: centralizar pela
            // altura real fazia o campo subir e descer a cada tecla, então o
            // topo é fixado onde a placa cheia começaria (`50% - altura-máxima/2`)
            // e só a borda de baixo encolhe. 24rem de teto.
            "[--command-dialog-h:min(60dvh,24rem)]",
            // O topo centraliza a pilha cheia (a placa mais 48: pílula de 36,
            // respiro de 12 e a legenda), não só a placa. No toque a legenda
            // some (`pointer-coarse:hidden`).
            "[--command-dialog-stack:calc(var(--command-dialog-h)+--spacing(12))]",
            "pointer-coarse:[--command-dialog-stack:calc(var(--command-dialog-h)+--spacing(1))]",
            "[--command-dialog-top:calc(50%-var(--command-dialog-stack)/2)]",
            "top-(--command-dialog-top)",
            // A paleta abre na mola e fecha curto em `--ease-out` (uma mola até
            // zero passa por baixo de zero).
            "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-open:animation-duration-(--duration-spring) data-open:ease-(--ease-spring) data-open:slide-in-from-top-1",
            "data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 data-closed:animation-duration-(--duration-fast) data-closed:ease-(--ease-out)"
          )}
        >
          {/* O nome acessível mora dentro do `Content`: fora dele o `DialogHeader`
              (`w-full` vence o `width: 1px` do `sr-only`) empurrava o documento
              em 40px e criava rolagem horizontal a 320px. */}
          <DialogHeader className="sr-only">
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <CommandBeamContext.Provider value>
          <Command
            // A pilha: pílula, placa e, se o consumidor puser um `CommandDock`
            // como último filho, a legenda. Abre sem nada selecionado; vem antes
            // do spread para `commandProps` poder voltar atrás.
            variant="panel"
            autoSelectFirst={false}
            className={cn(
              "[&_[data-slot=command-list]]:max-h-none",
              "[&_[data-slot=command-list]]:min-h-0",
              // O teto da lista e a transição são declarados pela casca: o teto
              // é o da paleta menos 44 (pílula de 36 e 8 de respiro); com 12 de
              // respiro a raiz aberta (camadas e dois recentes) continua cabendo
              // sem rolar, e descontar 48 a fazia rolar 4px.
              "[--command-list-ceiling:calc(var(--command-dialog-h)_-_--spacing(11))]",
              // Só o diálogo anima a altura: o `Combobox` mora num popover que se
              // reposiciona, e uma altura em movimento faria o painel perseguir o gatilho.
              "[--command-list-transition:var(--duration-base)]",
              className
              // Sem `flex-1`: `flex: 1 1 0%` faz o `flex-basis: 0` vencer
              // qualquer `height`, e a altura derivada da lista nunca chegaria ao layout.
            )}
            {...commandProps}
          >
            {children}
          </Command>
          </CommandBeamContext.Provider>
          {showCloseButton ? <DialogCloseButton /> : null}
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  )
}

/* Sub-páginas */

type CommandPageEntry = { id: string; label: string; icon?: React.ReactNode }

type CommandPagesValue = {
  /** A pilha de páginas abertas; vazia é a raiz. */
  stack: CommandPageEntry[]
  /** A página atual, ou `undefined` na raiz. */
  current: string | undefined
  push: (page: CommandPageEntry) => void
  pop: () => void
  reset: () => void
  /** O primeiro Backspace com o campo vazio: o próximo volta. */
  armed: boolean
  setArmed: (armed: boolean) => void
}

const CommandPagesContext = React.createContext<CommandPagesValue | null>(null)

/**
 * As sub-páginas da paleta. Não desenha nada: embrulha o campo e a lista e
 * guarda a pilha. O campo a lê sozinho (a trilha vira o `CommandScope`, o
 * Backspace com o campo vazio volta em dois toques, o texto esvazia a cada
 * passo) e cada `CommandPage` mostra o que é seu. É o gesto do escopo da busca
 * do catálogo.
 */
function CommandPages({
  children,
  onPageChange,
}: {
  children: React.ReactNode
  /** A página atual mudou — para quem quer gravar recente ou medir. */
  onPageChange?: (page: string | undefined) => void
}) {
  const [stack, setStack] = React.useState<CommandPageEntry[]>([])
  const [armed, setArmed] = React.useState(false)
  const avisar = React.useRef(onPageChange)
  React.useEffect(() => {
    avisar.current = onPageChange
  })

  const value = React.useMemo<CommandPagesValue>(() => {
    const mudar = (proxima: CommandPageEntry[]) => {
      setStack(proxima)
      setArmed(false)
      avisar.current?.(proxima.at(-1)?.id)
    }
    return {
      stack,
      current: stack.at(-1)?.id,
      push: (page) => mudar([...stack, page]),
      pop: () => mudar(stack.slice(0, -1)),
      reset: () => mudar([]),
      armed,
      setArmed,
    }
  }, [stack, armed])

  return <CommandPagesContext.Provider value={value}>{children}</CommandPagesContext.Provider>
}

/** A pilha das sub-páginas, para o item que abre uma (`push`) ou volta. */
function useCommandPages() {
  const ctx = React.useContext(CommandPagesContext)
  if (!ctx) throw new Error("useCommandPages precisa estar dentro de <CommandPages>")
  return ctx
}

/** O conteúdo de uma página: aparece só quando ela é a atual. Sem `id` é a raiz. Remonta a cada troca, e é isso que faz as linhas subirem ao entrar. */
function CommandPage({ id, children }: { id?: string; children: React.ReactNode }) {
  const { current } = useCommandPages()
  if (current !== id) return null
  return <React.Fragment key={id ?? "raiz"}>{children}</React.Fragment>
}

/**
 * A faixa de busca. A pílula, a escada, a lupa e o × vêm de
 * `lib/search-field-classes`, a receita que o gatilho do cabeçalho e o
 * `SearchInput` também vestem (quem abre a paleta vem de clicar naquele campo).
 * A superfície é a da casca: o `CommandDialog` veste a placa modal e o `Command`
 * de dentro não pinta (uma placa por superfície).
 */
function CommandInput({
  className,
  value,
  onValueChange,
  leading,
  size: sizeProp,
  surface,
  touchFloor = false,
  "aria-label": ariaLabel = "Buscar",
  onKeyDown,
  ...props
}: Omit<React.ComponentProps<typeof CommandPrimitive.Input>, "size"> & {
  /** O que fica entre a lupa e o texto — o `CommandScope` da busca por camada. */
  leading?: React.ReactNode
  /** `md` (32) é o gatilho do cabeçalho do catálogo; `lg` (36) é a pílula da pilha, e o padrão dentro dela. A faixa de dissolução acompanha (`data-size` no wrapper). */
  size?: "md" | "lg"
  /** A superfície da pílula: `plate` na pilha; fora dela `field`, menos num popover (o `Combobox`), que pede `plate`. */
  surface?: "field" | "plate"
  /** O piso de toque: 40 no dedo, e a faixa de busca da raiz acompanha. Desligado por padrão (a paleta tem medidas próprias); o `FilterBar` liga. */
  touchFloor?: boolean
}) {
  const pilha = React.useContext(CommandStackContext)
  const naPilha = pilha !== null
  // Na paleta o campo nasce `lg` (36); na densidade de menu e solto, `md` (32).
  const size = sizeProp ?? (pilha === "palette" ? "lg" : "md")
  const noDialogo = React.useContext(CommandBeamContext)
  const comFeixe = naPilha && noDialogo
  // A busca vazia, lida do cmdk (vale controlado ou não); liga o feixe da pílula.
  const busca = useCommandState((estado) => estado.search)
  const esperando = (value != null ? String(value) : busca) === ""
  // Sem dono, o texto mora aqui: o × do `SearchInput` precisa saber se há texto
  // e limpá-lo. O conteúdo de um popover desmonta ao fechar, e ela recomeça vazia.
  const [interno, setInterno] = React.useState("")
  const controlado = value !== undefined
  const texto = controlado ? value : interno
  const mudar = (proximo: string) => {
    if (!controlado) setInterno(proximo)
    onValueChange?.(proximo)
  }

  // As sub-páginas: a trilha é o escopo do campo, o texto esvazia a cada
  // passo, e o Backspace com o campo vazio volta em dois toques.
  const paginas = React.useContext(CommandPagesContext)
  const profundidade = paginas?.stack.length ?? 0
  const mudarRef = React.useRef(mudar)
  React.useEffect(() => {
    mudarRef.current = mudar
  })
  React.useEffect(() => {
    if (paginas) mudarRef.current("")
    // Só quando a página muda, não a cada render do contexto.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profundidade])
  const topo = paginas?.stack.at(-1)
  const escopo =
    leading ??
    (topo ? (
      <CommandScope icon={topo.icon} armed={paginas?.armed}>
        {topo.label}
      </CommandScope>
    ) : null)

  return (
    <div
      data-slot="command-input-wrapper"
      // `relative z-10`: a faixa fica sobre a lista, e o conteúdo rola por trás
      // do campo. Sem fio e sem tinta: repintar a placa aqui empilharia dois
      // 85% (97,75%) e viraria um retângulo mais claro com aresta na base.
      data-size={size}
      data-touch-floor={touchFloor || undefined}
      className={cn(
        "relative z-10 flex shrink-0 items-center",
        // Na pilha a pílula é solta, sem o recuo da faixa.
        !naPilha && "p-2"
      )}
    >
      {/* O campo é o `SearchInput` com o `Command.Input` do cmdk como filho (o
          cmdk precisa do campo dele para filtrar). Na pilha é a superfície
          `plate`; solto é a `field`, menos no `Combobox`, que pede `plate`. Na
          paleta não há anel nem piso de toque: o campo é autofocado e o anel
          nasceria aceso (quem carrega o foco visível é a linha selecionada), e
          a pilha tem medidas próprias. No `Combobox` e solto, quem chega por
          teclado vê o anel do campo. */}
      <SearchInput
        surface={surface ?? (naPilha ? "plate" : "field")}
        size={size}
        focusRing={pilha !== "palette"}
        // Sem piso de toque por padrão: a faixa de busca é publicada pela raiz
        // (`--scroll-fade-band-h`, 32 + 16), e a pílula crescendo no dedo sem
        // ela ficaria 8px por baixo da lista. `touchFloor` leva a faixa junto.
        touchFloor={touchFloor}
        leading={escopo}
        value={texto}
        onClear={(event) => {
          mudar("")
          // Limpar pelo × não dispara `input` no campo, e a raiz lê `onInput`
          // para voltar ao ocioso. O evento sai do botão para não reentrar no
          // `onChange` com o texto velho.
          event.currentTarget.dispatchEvent(new Event("input", { bubbles: true }))
        }}
        // O feixe da borda de baixo, aceso por `data-waiting`, só no diálogo (ver `globals.css`).
        className={cn(comFeixe && "command-beam")}
        rootProps={{ "data-waiting": (comFeixe && esperando) || undefined } as React.ComponentProps<"div">}
      >
        <CommandPrimitive.Input
          data-slot="command-input"
          aria-label={ariaLabel}
          value={texto}
          onValueChange={mudar}
          onKeyDown={(e) => {
            onKeyDown?.(e)
            if (e.defaultPrevented || !paginas || profundidade === 0) return
            if (e.key === "Backspace" && !texto) {
              e.preventDefault()
              if (paginas.armed) paginas.pop()
              else paginas.setArmed(true)
              return
            }
            if (paginas.armed && e.key !== "Shift") paginas.setArmed(false)
          }}
          className={cn("disabled:opacity-50", className)}
          {...props}
        />
      </SearchInput>
    </div>
  )
}

/**
 * O escopo da busca: o texto pintado antes do que se digita (como o destinatário
 * de um e-mail), no mesmo corpo do campo. Não há ×: com o campo vazio o
 * primeiro Backspace arma o escopo (`armed`, o fundo acende) e o segundo o
 * remove; quem conta os toques é quem tem o estado, e uma região viva diz o que
 * o próximo toque faz. A tinta é uma parada do arco-íris por escopo (`tint`),
 * exceção registrada à invariante de marca. O recuo de 4px vive nos dois
 * estados, compensado por margem negativa, para acender o fundo não empurrar o
 * texto.
 */
function CommandScope({
  icon,
  armed = false,
  tint,
  children,
  className,
  style,
  ...props
}: React.ComponentProps<"span"> & {
  icon?: React.ReactNode
  /** O primeiro Backspace com o campo vazio: o próximo remove o escopo. */
  armed?: boolean
  /** A cor do escopo, um `var(--brand-*)`. Violeta por padrão. */
  tint?: string
}) {
  return (
    <span
      data-slot="command-scope"
      data-armed={armed || undefined}
      style={tint ? ({ "--command-scope-tint": tint, ...style } as React.CSSProperties) : style}
      className={cn(
        // `tint` é uma parada do arco-íris (violeta por padrão). No claro a luz
        // é fixa em 0,47 (as paradas claras davam ~2:1 contra o campo); no
        // escuro todas passam cruas.
        "[--command-scope-ink:oklch(from_var(--command-scope-tint,var(--brand-violet))_0.47_c_h)] dark:[--command-scope-ink:var(--command-scope-tint,var(--brand-violet))]",
        "-mx-1 inline-flex shrink-0 items-center gap-1 rounded-sm px-1 py-0.5 leading-tight font-semibold text-(--command-scope-ink)",
        "[&_svg:not([class*='size-'])]:size-4",
        "transition-colors duration-(--duration-base) ease-(--ease-out)",
        "data-armed:bg-(--command-scope-ink)/20",
        "animate-in fade-in-0 animation-duration-(--duration-base) ease-(--ease-out)",
        className
      )}
      {...props}
    >
      {icon}
      {children}
      <span aria-live="polite" className="sr-only">
        {armed
          ? `Apague de novo para sair de ${typeof children === "string" ? children : "o escopo"}.`
          : ""}
      </span>
    </span>
  )
}

/**
 * A lista, com a altura medida. O cmdk publica a altura do conteúdo em
 * `--cmdk-list-height` (a API oficial para animar altura) e a lista a lê. Como
 * o projeto roda `border-box` e a lista carrega o `pt`/`pb` de
 * `scrollFadeBleedClassName`, a altura da caixa soma os dois recuos mais os 4px
 * de folga de cada um.
 *
 * O teto e a transição são da casca: `--command-list-ceiling` cai no
 * `--command-list-max-h` e `--command-list-transition` em `0s` quando ninguém
 * diz nada (o `CommandDialog` sobrescreve as duas). A transição não vale na
 * primeira pintura: a variável do cmdk só existe depois de dois quadros, e sem
 * a espera a lista deslizaria do teto até o tamanho certo (dois
 * `requestAnimationFrame` encadeados, como no `ThemeToggle`).
 */
function CommandList({
  className,
  children,
  arrows,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.List> & {
  /** As setas de "tem mais": na pilha vêm sempre; fora dela quem é lista suspensa as pede (o `Combobox`). */
  arrows?: boolean
}) {
  const [medido, setMedido] = React.useState(false)

  React.useEffect(() => {
    let segundo: number | null = null
    const primeiro = requestAnimationFrame(() => {
      segundo = requestAnimationFrame(() => setMedido(true))
    })
    return () => {
      cancelAnimationFrame(primeiro)
      if (segundo !== null) cancelAnimationFrame(segundo)
    }
  }, [])

  const pilha = React.useContext(CommandStackContext)
  const naPilha = pilha !== null
  const naPaleta = pilha === "palette"
  // As setas só na pilha pousam na placa (o pai `relative); o `Combobox` as pede por `arrows`.
  const setas = arrows ?? naPilha
  const fadeRef = useScrollFade({ arrows: setas })
  const lista = (
    <CommandPrimitive.List
      ref={fadeRef}
      data-slot="command-list"
      data-medido={medido || undefined}
      className={cn(
        "no-scrollbar overflow-x-hidden overflow-y-auto p-1 outline-none",
        // As linhas sobem ao aparecer, só onde a casca declara `--command-reveal` (`0s` por padrão).
        "command-reveal",
        // A dissolução das duas pontas (âncoras, rampa, máscara, folga de
        // rolagem) mora aqui, no elemento que rola; a casca só publica as alturas.
        scrollFadeViewportClassName,
        // O conteúdo sobe para trás das faixas e devolve o mesmo tanto em
        // recuo: o primeiro item nasce abaixo do campo e o que rola passa por
        // baixo, o que dá à rampa o que dissolver.
        scrollFadeBleedClassName,
        // A lista só lê o teto; quem o declara é a casca (variante por seletor
        // perderia a disputa: o `in-*` compila com `:where()`).
        "max-h-(--command-list-max-h)",
        // Os padrões moram no `var()` e não numa declaração aqui: uma local
        // venceria a herdada e a casca nunca mandaria. O `_-_` do `calc()`: o
        // Tailwind não normaliza espaço em torno de `-`.
        "h-[min(calc(var(--cmdk-list-height,var(--command-list-ceiling,var(--command-list-max-h)))_+_var(--scroll-fade-band-h)_+_var(--scroll-fade-foot-h)_+_--spacing(2)),var(--command-list-ceiling,var(--command-list-max-h)))]",
        // Só transiciona depois da primeira medida (ver o cabeçalho).
        "data-medido:transition-[height] data-medido:duration-[var(--command-list-transition,0s)] data-medido:ease-(--ease-out)",
        // Na pilha a placa recua 8px dos lados, para a linha acesa alinhar com as bordas da pílula.
        naPaleta && "px-2",
        className
      )}
      {...props}
    >
      {naPaleta ? (
        // O respiro de cima e de baixo mora dentro do conteúdo medido: um `py`
        // na lista a faria rolar 12px sem precisar.
        <div data-slot="command-list-body" className="py-1.5">
          {children}
        </div>
      ) : (
        children
      )}
    </CommandPrimitive.List>
  )

  // Fora da pilha, as setas pousam na raiz do `Command`, que é `relative`.
  if (!naPilha)
    return setas ? (
      <>
        {lista}
        <ScrollFadeArrows />
      </>
    ) : (
      lista
    )

  // No diálogo a lista mora numa placa própria, porque o campo saiu dela. A
  // placa é um embrulho e não a lista: a lista é o elemento mascarado, e a
  // máscara recortaria fundo, anel e sombra. A faixa do topo zera aqui (não há
  // nada por cima). O canto é a superfície (22) e as linhas são concêntricas com
  // o recuo real da lista (22 − 8 = 14 numa linha de 36).
  return (
    <div
      data-slot="command-dialog-panel"
      className={cn(
        "relative flex min-h-0 flex-col overflow-hidden rounded-surface ring-1 ring-foreground/10 [--scroll-fade-band-h:0px] [--radius-parent:var(--radius-surface)] [--radius-inset:--spacing(2)]",
        menuPanelTintClassName
      )}
    >
      {lista}
      <ScrollFadeArrows />
    </div>
  )
}

/** O vazio. Em coluna, porque um vazio de paleta costuma ter título e dica; `text-muted-foreground` para não competir com os comandos. */
function CommandEmpty({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Empty>) {
  return (
    <CommandPrimitive.Empty
      data-slot="command-empty"
      className={cn(
        // Sem `gap`: título sobre descrição é o mesmo dado em duas linhas.
        "flex flex-col items-center px-6 text-center text-sm text-muted-foreground",
        // O recuo próprio é curto porque a lista já reserva as faixas quando existem.
        "py-6",
        // A ação é outra coisa e ganha respiro (gap entre coisas diferentes).
        "[&_button]:mt-4",
        // O vazio só monta quando a contagem zera, então sobe ao nascer.
        "animate-in fade-in-0 slide-in-from-bottom-1 animation-duration-(--duration-base) ease-(--ease-out)",
        className
      )}
      {...props}
    />
  )
}

/** A linha forte do vazio: o que não foi encontrado. */
function CommandEmptyTitle({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <P
      data-slot="command-empty-title"
      className={cn("font-medium text-balance", className)}
      {...props}
    />
  )
}

/** A saída: o que a pessoa pode tentar em vez disso. */
function CommandEmptyDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <Caption
      data-slot="command-empty-description"
      className={cn("max-w-xs text-balance", className)}
      {...props}
    />
  )
}

/**
 * O estado de busca assíncrona.
 *
 * O cmdk sempre teve `Command.Loading` e o projeto nunca o expôs — então uma
 * paleta que consulta o servidor não tinha como dizer que está consultando, e
 * a lista vazia se passava por "nada encontrado" enquanto o dado vinha.
 */
function CommandLoading({
  className,
  children,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Loading>) {
  return (
    <CommandPrimitive.Loading
      data-slot="command-loading"
      className={cn(
        // O cmdk embrulha os filhos num `<div aria-hidden>` próprio: é nele
        // que a roda e o texto ficam lado a lado, não na raiz.
        "flex justify-center py-6 text-sm text-muted-foreground [&>div]:flex [&>div]:items-center [&>div]:gap-2",
        className
      )}
      {...props}
    >
      {children}
    </CommandPrimitive.Loading>
  )
}

function CommandGroup({
  className,
  count = false,
  heading,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Group> & {
  /** Quantas linhas casaram, no rótulo ("Transações · 12"): o cmdk desmonta as que não casam e não expõe a contagem por grupo, então ela é contada no DOM do grupo. */
  count?: boolean
}) {
  const naPaleta = React.useContext(CommandStackContext) === "palette"
  const ref = React.useRef<HTMLDivElement | null>(null)
  const [quantas, setQuantas] = React.useState<number | null>(null)
  React.useEffect(() => {
    const no = ref.current
    if (!count || !no) return
    const contar = () => setQuantas(no.querySelectorAll("[cmdk-item]").length)
    contar()
    const observador = new MutationObserver(contar)
    observador.observe(no, { childList: true, subtree: true })
    return () => observador.disconnect()
  }, [count])

  return (
    <CommandPrimitive.Group
      ref={ref}
      heading={
        count && heading != null ? (
          <>
            {heading}
            {quantas != null ? (
              // A contagem não é rótulo: sai da caixa alta e do espaçamento.
              <span data-slot="command-group-count" className="nums font-normal tracking-normal normal-case">
                {" · "}
                {quantas}
              </span>
            ) : null}
          </>
        ) : (
          heading
        )
      }
      data-slot="command-group"
      className={cn(
        // O recuo do cabeçalho acompanha o do item (`px-1.5`), senão o texto do
        // grupo ficava 2px à direita das linhas. `p-0` no grupo porque a casca já recua.
        "overflow-hidden p-0 text-foreground **:[[cmdk-group-heading]]:px-1.5 **:[[cmdk-group-heading]]:text-2xs **:[[cmdk-group-heading]]:font-semibold **:[[cmdk-group-heading]]:tracking-wider **:[[cmdk-group-heading]]:uppercase **:[[cmdk-group-heading]]:text-muted-foreground",
        // O cabeçalho não é um item apagado: caixa alta com `tracking-wider` (a
        // régua `labels="caps"` do `TableHead`) é rótulo, e `text-xs font-medium`
        // é a receita de "linha desabilitada". O respiro é assimétrico, para ele
        // pertencer à lista abaixo e não ficar equidistante dos dois grupos.
        "**:[[cmdk-group-heading]]:pt-1 **:[[cmdk-group-heading]]:pb-0.5",
        // A folga entre grupos é margem no grupo, não recuo no cabeçalho (um
        // `pt` base mais um sob variante seria a mesma propriedade decidida pela
        // ordem de emissão). O primeiro grupo visível não recebe a folga, por
        // `~` e não `+`: o cmdk esconde grupos sem resultado com `hidden` sem
        // tirá-los do DOM, e a adjacência perderia o segundo grupo visível.
        "[[cmdk-group]:not([hidden])~&]:mt-2.5",
        // Na pilha as linhas são de 36, e o respiro cresce junto: 16px entre
        // grupos e 6px entre o rótulo e a primeira linha. Margem, pela mesma razão.
        naPaleta && "[[cmdk-group]:not([hidden])~&]:mt-4 [&>[cmdk-group-items]]:mt-1",
        className
      )}
      {...props}
    />
  )
}

function CommandSeparator({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Separator>) {
  return (
    <CommandPrimitive.Separator
      data-slot="command-separator"
      className={cn(menuSeparatorClassName, className)}
      {...props}
    />
  )
}

/**
 * A linha da paleta. Não desenha tique: o cmdk não emite `data-checked`, e quem
 * marca seleção é quem sabe o que está selecionado (o `Combobox` desenha o
 * próprio check). A geometria vem de `menuItemGeometryClassName`; os estados
 * ficam aqui porque o cmdk os escreve diferente (a linha ativa é
 * `data-selected`, e `data-disabled="false"` fica sempre presente, o que a
 * regra por presença dos menus trataria como desabilitado).
 */
function CommandItem({
  className,
  shortcut,
  children,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Item> & {
  /**
   * A tecla que dispara a linha, na grafia do `Kbd` (`"mod+e"`); aparece na
   * ponta e funciona com o foco na paleta. Evite as do navegador (`mod+n`,
   * `mod+t`, `mod+w`): o Chrome não deixa cancelá-las.
   */
  shortcut?: string
}) {
  const naPaleta = React.useContext(CommandStackContext) === "palette"
  const ref = React.useRef<HTMLDivElement | null>(null)
  const selecionar = React.useRef(props.onSelect)
  React.useEffect(() => {
    selecionar.current = props.onSelect
  })
  const valor = props.value

  React.useEffect(() => {
    if (!shortcut) return
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.defaultPrevented || !matchShortcut(shortcut, e)) return
      // Só com o foco dentro desta paleta: duas paletas numa página não disputam a tecla.
      const raiz = ref.current?.closest("[cmdk-root]")
      if (!raiz || !raiz.contains(document.activeElement)) return
      e.preventDefault()
      selecionar.current?.(valor ?? "")
    }
    document.addEventListener("keydown", aoTeclar)
    return () => document.removeEventListener("keydown", aoTeclar)
  }, [shortcut, valor])

  return (
    <CommandPrimitive.Item
      ref={ref}
      aria-keyshortcuts={shortcut ? ariaShortcut(shortcut) : undefined}
      data-slot="command-item"
      className={cn(
        "group/command-item",
        menuItemGeometryClassName,
        // O acender dos menus (`menuItemFadeClassName`).
        menuItemFadeClassName,
        // Tinta, não cor: o `--foreground` a 9% sobre o vidro (ver `menu-classes`).
        "data-selected:bg-foreground/9 data-selected:text-accent-foreground data-selected:*:[svg]:text-accent-foreground",
        // `=true` e não por presença: ver o comentário acima.
        "data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50",
        // Na pilha a linha tem 36; isto garante o piso se a geometria dos menus mudar.
        naPaleta && "min-h-9",
        className
      )}
      {...props}
    >
      {children}
      {shortcut ? (
        <CommandShortcut>
          <Kbd keys={shortcut} />
        </CommandShortcut>
      ) : null}
    </CommandPrimitive.Item>
  )
}

/**
 * O trecho que casou, em negrito, sem acento dos dois lados como o
 * `commandFilter` ("saude" acende "Saú"). Exportada para teste. Anda letra a
 * letra sobre o texto original para manter os índices alinhados; uma letra que
 * vire duas ao perder o acento desliga o destaque em vez de acender o trecho errado.
 */
export function highlightParts(texto: string, busca: string): { text: string; match: boolean }[] {
  const consulta = semAcento(busca.trim())
  if (!consulta) return [{ text: texto, match: false }]
  const letras = [...texto].map(semAcento)
  if (letras.some((l) => l.length !== 1)) return [{ text: texto, match: false }]
  const i = letras.join("").indexOf(consulta)
  if (i < 0) return [{ text: texto, match: false }]
  const original = [...texto]
  const partes = [
    { text: original.slice(0, i).join(""), match: false },
    { text: original.slice(i, i + consulta.length).join(""), match: true },
    { text: original.slice(i + consulta.length).join(""), match: false },
  ]
  return partes.filter((p) => p.text !== "")
}

function semAcento(s: string) {
  return s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase()
}

function CommandHighlight({ children, className }: { children: string; className?: string }) {
  const busca = useCommandState((estado) => estado.search)
  return (
    <>
      {highlightParts(children, busca).map((parte, i) =>
        parte.match ? (
          <mark
            key={i}
            data-slot="command-highlight"
            className={cn("bg-transparent font-semibold text-inherit", className)}
          >
            {parte.text}
          </mark>
        ) : (
          <React.Fragment key={i}>{parte.text}</React.Fragment>
        )
      )}
    </>
  )
}

/** A lista e a pré-visualização lado a lado (`CommandDialog size="lg"`); abaixo de `md` a pré-visualização some. */
function CommandSplit({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="command-split"
      className={cn(
        "flex min-h-0 items-stretch gap-3",
        "*:data-[slot=command-dialog-panel]:min-w-0 *:data-[slot=command-dialog-panel]:flex-1",
        "*:data-[slot=command-list]:min-w-0 *:data-[slot=command-list]:flex-1",
        className
      )}
      {...props}
    />
  )
}

/**
 * O detalhe da linha selecionada, numa placa ao lado da lista. Lê o valor
 * realçado do cmdk e chama `children` com ele; sem linha realçada mostra
 * `empty`. É região nomeada e não viva: o `aria-activedescendant` já anuncia a
 * linha, e repetir o detalhe a cada seta atropelaria o leitor de tela.
 */
function CommandPreview({
  children,
  empty = null,
  className,
}: {
  children: (value: string) => React.ReactNode
  /** O que mostrar sem linha realçada. */
  empty?: React.ReactNode
  className?: string
}) {
  const valor = useCommandState((estado) => estado.value)
  const naPilha = React.useContext(CommandStackContext) !== null
  return (
    <div
      data-slot="command-preview"
      role="region"
      aria-label="Pré-visualização"
      className={cn(
        "hidden w-72 shrink-0 flex-col gap-3 overflow-y-auto p-4 text-sm md:flex",
        naPilha && cn("rounded-surface ring-1 ring-foreground/10", menuPanelTintClassName),
        className
      )}
    >
      {valor ? (
        <div key={valor} className="flex flex-col gap-3 animate-in fade-in-0 animation-duration-(--duration-base) ease-(--ease-out)">
          {children(valor)}
        </div>
      ) : (
        empty
      )}
    </div>
  )
}

/** A pilha de texto de uma linha de duas linhas (`Content`, `Title`, `Description`, a gramática do `Item`). */
function CommandItemContent({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="command-item-content"
      // Sem `gap`: nome sobre descrição é o mesmo dado em duas linhas.
      className={cn("flex min-w-0 flex-col", className)}
      {...props}
    />
  )
}

function CommandItemTitle({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="command-item-title"
      className={cn("truncate font-medium", className)}
      {...props}
    />
  )
}

function CommandItemDescription({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="command-item-description"
      className={cn(
        "truncate text-xs text-muted-foreground group-data-selected/command-item:text-accent-foreground/80",
        className
      )}
      {...props}
    />
  )
}

/**
 * O ícone da linha, numa caixa de 24 que alinha o nome na mesma coluna em
 * qualquer grupo. Fica cinza e acende com a linha selecionada; quem o tinge é o
 * `group`, não a regra de filho direto do `CommandItem`.
 */
function CommandItemIcon({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="command-item-icon"
      aria-hidden
      className={cn(
        "flex size-6 shrink-0 items-center justify-center text-muted-foreground transition-colors duration-(--duration-base) ease-(--ease-out) group-data-selected/command-item:text-accent-foreground",
        "[&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    />
  )
}

/** O lado direito da linha (contagem, descrição, seta): empurrado para a ponta, com 16px de folga do nome, e cortando antes de encostar nele. */
function CommandItemMeta({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="command-item-meta"
      className={cn("ml-auto flex min-w-0 items-center gap-2 pl-4", className)}
      {...props}
    />
  )
}

/** A seta de "ir": só na linha selecionada, entrando na diagonal em que aponta; diz que Enter leva a algum lugar. */
function CommandItemArrow({
  className,
  ...props
}: React.ComponentProps<typeof ArrowUpRightIcon>) {
  return (
    <ArrowUpRightIcon
      data-slot="command-item-arrow"
      aria-hidden
      className={cn(
        "ml-auto size-4 shrink-0 -translate-x-0.5 translate-y-0.5 opacity-0 transition-[opacity,translate] duration-(--duration-base) ease-(--ease-out) group-data-selected/command-item:translate-x-0 group-data-selected/command-item:translate-y-0 group-data-selected/command-item:opacity-100",
        className
      )}
      {...props}
    />
  )
}

/**
 * A legenda de teclado da pilha: cada dica é uma cápsula de vidro solta, fora
 * da placa e embaixo dela. É irmã da placa porque um ancestral com
 * `backdrop-filter` é raiz de fundo e o borrão das cápsulas não veria a
 * página. São legendas, não botões, e somem no toque (sem teclado). Último
 * filho de qualquer `Command variant="panel"`.
 */
function CommandDock({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="command-dock"
      className={cn(
        "flex items-center justify-between gap-2 pointer-coarse:hidden",
        "animate-in fade-in-0 slide-in-from-top-2 animation-duration-(--duration-spring) ease-(--ease-spring) [animation-delay:80ms] fill-mode-both",
        className
      )}
      {...props}
    />
  )
}

/** Uma cápsula da legenda: a tecla e o que ela faz, no vidro dos menus. */
function CommandDockItem({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="command-dock-item"
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs text-muted-foreground ring-1 ring-foreground/10",
        menuPanelTintClassName,
        // As teclas sem a pastilha (caixa dentro de caixa); o seletor de
        // descendente (0,2,0) vence o `bg-*` do `Kbd` sem `!important`.
        "[&_[data-slot=kbd]]:min-w-0 [&_[data-slot=kbd]]:bg-transparent [&_[data-slot=kbd]]:px-0",
        className
      )}
      {...props}
    />
  )
}

function CommandShortcut({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="command-shortcut"
      className={cn(
        // Some no toque: sem teclado físico, a tecla não diz nada.
        "ml-auto text-xs tracking-widest text-muted-foreground group-data-selected/command-item:text-accent-foreground pointer-coarse:hidden",
        className
      )}
      {...props}
    />
  )
}

export {
  Command,
  commandVariants,
  CommandDialog,
  CommandHighlight,
  CommandPage,
  CommandPages,
  CommandPreview,
  CommandSplit,
  useCommandPages,
  CommandDock,
  CommandDockItem,
  CommandEmpty,
  CommandEmptyDescription,
  CommandEmptyTitle,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandItemContent,
  CommandItemArrow,
  CommandItemDescription,
  CommandItemIcon,
  CommandItemMeta,
  CommandItemTitle,
  CommandList,
  CommandLoading,
  CommandScope,
  CommandSeparator,
  CommandShortcut,
}
