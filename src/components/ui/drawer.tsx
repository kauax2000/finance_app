"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"
import { useComposedRefs } from "radix-ui/internal"
import { Drawer as DrawerPrimitive } from "vaul"

import { cn } from "@/lib/utils"
import { modalSurfaceClassName } from "@/lib/glass-classes"
import { useViewportModal, useViewportWindow } from "@/hooks/use-mobile"
import { useScrollFade } from "@/hooks/use-scroll-fade"
import { Button } from "@/components/ui/button"

/**
 * O véu de todo modal do sistema, numa função só (a camada é o parâmetro). Mora
 * aqui porque a dependência corre num sentido só (`dialog` importa `sheet`, que
 * importa este arquivo) e o `dialog.tsx` o reexporta. As camadas ficam num mapa
 * de literais, porque uma classe montada por template não chega ao CSS. `fade`
 * é o esmaecer por keyframe; a gaveta o desliga porque o vaul anima o próprio
 * véu e o acompanha no arraste.
 */
const OVERLAY_Z = {
  modal: "z-(--z-modal)",
  sheet: "z-(--z-sheet)",
} as const

function overlayClassName(camada: keyof typeof OVERLAY_Z, fade = true) {
  return cn(
    "fixed inset-0 isolate bg-overlay supports-backdrop-filter:backdrop-blur-xs",
    OVERLAY_Z[camada],
    fade &&
      "animation-duration-(--duration-slow) ease-(--ease-out) data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0"
  )
}

/** O véu das superfícies de borda: o de `overlayClassName("sheet")`, sem o esmaecer. */
const SHEET_OVERLAY_CLASS = overlayClassName("sheet", false)

/**
 * O contrato que a cromagem do `Dialog` lê nas superfícies de borda (esta
 * gaveta e o `Sheet`): recuo e sangramento, o raio que o `concentric` de dentro
 * lê (sem ele sairia pílula) e a reserva do ×, que vem de haver um ×, não de um
 * prop. O `DialogContent` escreve o dele, com 24px.
 */
const SURFACE_CONTRACT_CLASS =
  "[--dialog-px:--spacing(4)] [--dialog-bleed:0px] [--radius-parent:var(--radius-modal)] [--radius-inset:var(--dialog-px)] [--dialog-close:0px] has-[>[data-slot=dialog-close-button]]:[--dialog-close:--spacing(11)]"

/**
 * A alça: a pista de que a superfície se arrasta e o próprio alvo do gesto. Mora
 * neste arquivo porque as duas superfícies que a vestem são gavetas do vaul
 * (esta e o `Sheet` no telefone); uma tela nunca a escreve
 * (`drawer-drag-handle.test.ts` tranca).
 *
 * `DrawerPrimitive.Handle` renderiza a barra com `data-vaul-handle` e um
 * `<span data-vaul-handle-hitarea>` de 44px, ambos `aria-hidden` (a alça é
 * afordância de ponteiro; fecha-se por `Esc` ou pelo ×). Tocar a alça não fecha:
 * o vaul só fecha ali com `dismissible` falso e, sem `snapPoints`, é no-op.
 *
 * O vaul injeta uma folha de estilo sem camada, e a cascata resolve a camada
 * antes da especificidade, então ela ganha de qualquer utility. Toda propriedade
 * que este arquivo redeclara precisa de `!` (a asserção 1 do teste garante);
 * `my-2.5` é a única sem ele, porque o vaul não a declara.
 *
 * A tinta é 75%: abaixo disso reprova os 3:1 da 1.4.11 no claro sobre a placa de
 * vidro (alfa medido contra um fundo não sobrevive à troca do fundo). O par
 * hover/active a 90% é obrigatório, porque o `hover:` não existe no telefone.
 *
 * O vaul errou o seletor que encolheria a área de acerto no ponteiro fino
 * (emite `(pointer:fine)` com um `:` sobrando), então os 44px persistiam no
 * mouse e roubavam 9px de clique do cabeçalho. `pointer-fine:` faz o que ele
 * pretendia, com 20px que cabem inteiros na margem da alça; `my-2.5` é
 * estrutural.
 */
const dragHandleClassName = cn(
  // `my-2.5` é o único sem `!`: o vaul declara os outros quatro (margem
  // lateral, altura, largura, raio) e eles precisam vencer a folha dele.
  "!mx-auto my-2.5 shrink-0",
  "!h-1.5 !w-12 !rounded-full",
  // Por cima da placa do cabeçalho translúcido (`z-10`), que sobe até a borda da
  // gaveta e cobre esta faixa. O `relative` o vaul já declara; o `z` não.
  "relative z-20",
  // A tinta. `!opacity-100` tira o fator 0,7 do vaul de cima do alfa.
  "!opacity-100 !bg-muted-foreground/75",
  "hover:!bg-muted-foreground/90 active:!bg-muted-foreground/90",
  "transition-colors duration-(--duration-fast) ease-(--ease-out)",
  // O alvo de acerto no mouse, o que o vaul quis fazer.
  "pointer-fine:[&>[data-vaul-handle-hitarea]]:!h-5",
  // Numa gaveta de cima a alça é a borda de baixo. As duas superfícies declaram
  // `group/dialog-content`, então a alça sabe sozinha de que lado nasce.
  "group-data-[vaul-drawer-direction=top]/dialog-content:order-last"
)

/**
 * Exige o contexto do vaul (fora de um `Drawer.Root` o `useDrawerContext`
 * lança), o que impede a alça de existir onde não há gesto.
 */
function DragHandle({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Handle>) {
  return (
    <DrawerPrimitive.Handle
      data-slot="drag-handle"
      className={cn(dragHandleClassName, className)}
      {...props}
    />
  )
}


/**
 * A gaveta, em qualquer largura de tela. `Sheet` troca de superfície (painel de
 * borda acima de 768px, gaveta abaixo); `Drawer` é gaveta sempre, para quando o
 * gesto é a afordância. Usa `--z-sheet`, `modalSurfaceClassName`, `dvh` + área segura e
 * o teclado do iOS por conta própria (`rolarSobOTeclado`: a gaveta fica parada,
 * o teclado a cobre e só o meio rola; o `repositionInputs` do vaul fica desligado).
 *
 * A cromagem (cabeçalho, título, corpo rolável, rodapé) vem do `Dialog`: o
 * vaul é construído sobre `@radix-ui/react-dialog` e há uma instância só em
 * `node_modules`, então `DialogTitle` acha o contexto dentro de um
 * `DrawerContent`.
 *
 * `direction` aceita só `bottom` e `top`: a alça do vaul é `touch-action:
 * pan-y`, e uma gaveta lateral teria a alça de enfeite (a borda lateral é o
 * ramo desktop do `Sheet`).
 */

const drawerContentVariants = cva(
  [
    // `group/dialog-content` é o nome que a cromagem do `Dialog` procura para
    // saber que está num layout `fixed`.
    "group/dialog-content fixed inset-x-0 z-(--z-sheet)",
    "flex flex-col text-sm shadow-lg",
    modalSurfaceClassName,
    "focus:outline-none",
    // O contrato que a cromagem do `Dialog` lê, o mesmo do `SheetContent`.
    SURFACE_CONTRACT_CLASS,
    // As alturas saem de variáveis para uma gaveta baixar o teto sem reescrever a fórmula.
    // O teto é a gaveta alta (`--drawer-h`): com espaço em cima ela cresce até lá
    // antes de o meio rolar; o meio só rola quando o conteúdo passa da tela.
    "[--drawer-max-h:var(--drawer-h)]",
    // A faixa do puxador, para o cabeçalho translúcido cobri-la: `!h-1.5` (6) mais o
    // `my-2.5` dos dois lados (20) do `dragHandleClassName`. Mudou um, muda o outro.
    "[--drawer-handle-h:calc(var(--spacing)*6.5)]",
    // A área segura é da superfície, com a mesma conta da gaveta do `Sheet`:
    // 24px de respiro mais a barra de gestos.
    "data-[vaul-drawer-direction=bottom]:pb-(--drawer-safe)",
    // Sem rodapé a lista ia até uma faixa vazia de vidro: agora passa por trás da barra de
    // gestos, e o último item assenta acima dela.
    "data-[vaul-drawer-direction=bottom]:not-has-[[data-slot=dialog-footer]]:pb-0",
    "data-[vaul-drawer-direction=bottom]:not-has-[[data-slot=dialog-footer]]:[&_[data-drawer-meio]]:pb-(--drawer-safe)",
    "data-[vaul-drawer-direction=top]:pt-(--drawer-safe)",
    "data-[vaul-drawer-direction=bottom]:[--drawer-safe:calc(--spacing(6)+env(safe-area-inset-bottom,0px))]",
    "data-[vaul-drawer-direction=top]:[--drawer-safe:calc(--spacing(6)+env(safe-area-inset-top,0px))]",
    // A folga do topo muda com o aparelho, então ela também é variável.
    "data-[vaul-drawer-direction=bottom]:[--drawer-h:calc(100dvh-max(0.5rem,env(safe-area-inset-top,0px))_-_var(--drawer-desconto,0px))]",
    "data-[vaul-drawer-direction=top]:[--drawer-h:calc(100dvh-max(0.5rem,env(safe-area-inset-bottom,0px))_-_var(--drawer-desconto,0px))]",
    // A gaveta aberta por cima de outra é 12px mais baixa: com o topo no mesmo
    // lugar, a da frente cobriria a de trás inteira, e o recuo não apareceria.
    "[--drawer-recuo:calc(var(--spacing)*6)]",
    "data-aninhada:[--drawer-desconto:var(--drawer-recuo)]",
    // O raio e a borda ficam do lado que **não** encosta na tela.
    "data-[vaul-drawer-direction=bottom]:bottom-0 data-[vaul-drawer-direction=bottom]:rounded-t-modal data-[vaul-drawer-direction=bottom]:border-t",
    "data-[vaul-drawer-direction=top]:top-0 data-[vaul-drawer-direction=top]:rounded-b-modal data-[vaul-drawer-direction=top]:border-b",
  ],
  {
    variants: {
      /** Gaveta alta: ocupa quase a tela, com folga na borda oposta; sem ela mede o conteúdo e para na mesma altura. */
      fill: {
        true: "h-(--drawer-h)",
        false: "max-h-(--drawer-max-h)",
      },
      /**
       * Onde a gaveta encosta: `flush` (padrão, a do telefone) cola nas bordas
       * e arredonda o lado de dentro; `inset` a solta da tela, com margem e
       * cantos completos (de borda a borda no desktop lê como erro de layout).
       */
      variant: {
        flush: "",
        inset: [
          "inset-x-(--drawer-inset) rounded-modal border",
          "data-[vaul-drawer-direction=bottom]:bottom-(--drawer-inset)",
          "data-[vaul-drawer-direction=top]:top-(--drawer-inset)",
          "[--drawer-inset:--spacing(2)]",
        ].join(" "),
      },
      /**
       * O teto de largura: `md` e `lg` centralizam e param (uma gaveta de
       * 1900px vira linha de leitura impossível); `full` é o telefone, e o padrão.
       */
      size: {
        full: "",
        md: "mx-auto sm:max-w-lg",
        lg: "mx-auto sm:max-w-2xl",
      },
    },
    defaultVariants: {
      fill: false,
      variant: "flush",
      size: "full",
    },
  }
)

type DrawerDirection = "bottom" | "top"

/**
 * O aninhamento das superfícies de borda, um só para esta gaveta e o `Sheet`.
 *
 * - `gaveta`: o que a raiz do `Drawer` diz ao conteúdo (se há degraus, se está
 *   salvando) e, só por existir, que há uma gaveta aberta acima: é como a de
 *   dentro vira `NestedRoot`. No telefone a folha é este `Drawer`.
 * - `painel`: o painel de borda do `Sheet` no desktop. Uma folha aberta de
 *   dentro avisa que o cobre (`cobrir`); ele zera a pilha, porque uma gaveta
 *   dentro de um painel é raiz.
 */
type DrawerRaiz =
  | {
      superficie: "gaveta"
      degraus: boolean
      pending: boolean
      /** Na moldura do catálogo: o véu e o fechar no toque fora são desenhados aqui. */
      veuEmulado: boolean
      fechar: () => void
      /** Esta gaveta está aberta por cima de outra (a raiz é `NestedRoot`). */
      aninhada: boolean
      /** O `DrawerContent` desta raiz se registra aqui, para o recuo achar o nó. */
      registrarConteudo: (no: HTMLDivElement | null) => void
      /** Outra gaveta abriu (ou fechou) por cima desta: ela encolhe e sobe (ou volta). */
      recuar: (aberta: boolean) => void
    }
  | { superficie: "painel"; cobrir: (coberta: boolean) => void }

const DrawerRaizContext = React.createContext<DrawerRaiz | null>(null)

/** O deslocamento do recuo, o `NESTED_DISPLACEMENT` do vaul. */
const RECUO_PX = 16

/**
 * O transform da gaveta de trás, o mesmo que o vaul escreve no
 * `onNestedOpenChange`: encolhe 16px na largura e sobe 16px; fechada, volta.
 */
function transformDoRecuo(aberta: boolean, largura: number): string {
  if (!aberta) return "translate3d(0, 0, 0)"
  return `scale(${(largura - RECUO_PX) / largura}) translate3d(0, -${RECUO_PX}px, 0)`
}

/** A transição do recuo, a `TRANSITIONS` do vaul, para o arraste e a abertura darem o mesmo. */
const TRANSICAO_DO_RECUO = "transform 0.5s cubic-bezier(0.32, 0.72, 0, 1)"

/**
 * Uma `Drawer` aberta dentro de outra vira `NestedRoot` sozinha (a de baixo
 * recua e escurece). `scaleBackground` escala o `[data-vaul-drawer-wrapper]`
 * da raiz do app. `snapPoints` deixa o conteúdo alto sozinho. `pending` barra
 * arrastar, tocar fora, Esc e a alça: o vaul só fecha no toque da alça com
 * `dismissible` falso, e é falso que a trava o deixa, então o pedido de fechar
 * é barrado também na raiz. `modal={false}` é a gaveta presa embaixo, sem véu.
 */
function Drawer({
  direction = "bottom",
  repositionInputs = false,
  scaleBackground = false,
  pending = false,
  dismissible = true,
  modal: modalProp,
  open: openProp,
  defaultOpen,
  onOpenChange,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Root> & {
  /**
   * Só o eixo vertical (a alça do vaul é `touch-action: pan-y`). A restrição é
   * uma interseção e não um `Omit`: os props do vaul são uma união
   * discriminada, e `Omit` a achata num objeto não atribuível a nenhum lado.
   */
  direction?: DrawerDirection
  /** A página recua e arredonda atrás da gaveta (iOS). */
  scaleBackground?: boolean
  /** Salvando: nada fecha a gaveta até acabar. */
  pending?: boolean
}) {
  const pai = React.useContext(DrawerRaizContext)
  const controlado = openProp !== undefined
  const [interno, setInterno] = React.useState(defaultOpen ?? false)
  const open = controlado ? openProp : interno
  const pedir = (proximo: boolean) => {
    if (!proximo && pending) return
    if (!controlado) setInterno(proximo)
    onOpenChange?.(proximo)
  }
  const degraus = Boolean(
    (props as { snapPoints?: unknown[] }).snapPoints?.length
  )
  // Dentro da moldura do catálogo a gaveta deixa de ser modal, e gaveta não
  // modal não monta véu nem fecha no toque fora. Quando a falta de modal é da
  // moldura (e não de um `modal={false}` de quem chamou), o véu é desenhado
  // aqui. `modal` é desestruturado e não lido de `{...props}`: um
  // `modal={undefined}` explícito apagaria o padrão da moldura no espalhamento.
  const modalDaMoldura = useViewportModal()
  const modal = modalProp ?? modalDaMoldura
  const veuEmulado = modalDaMoldura === false && modalProp === undefined
  const pedirRef = React.useRef(pedir)
  React.useEffect(() => {
    pedirRef.current = pedir
  })
  const aninhada = pai?.superficie === "gaveta"
  // O recuo: o vaul só avisa a gaveta de trás quando ele mesmo muda o `open`, e as
  // nossas abrem e fecham pelo `open` controlado. Então a de cima avisa a de trás
  // por aqui (`pai.recuar`), e a de trás escreve no próprio nó o que o vaul
  // escreveria. O arraste continua com o vaul (`onNestedDrag`).
  const conteudoRef = React.useRef<HTMLDivElement | null>(null)
  const voltaRef = React.useRef<number | undefined>(undefined)
  const raiz = React.useMemo(
    () => ({
      superficie: "gaveta" as const,
      degraus,
      pending,
      veuEmulado,
      fechar: () => pedirRef.current(false),
      aninhada,
      registrarConteudo: (no: HTMLDivElement | null) => {
        conteudoRef.current = no
      },
      recuar: (aberta: boolean) => {
        const no = conteudoRef.current
        if (!no) return
        const janela = no.ownerDocument.defaultView ?? window
        janela.clearTimeout(voltaRef.current)
        const reduzido = janela.matchMedia("(prefers-reduced-motion: reduce)").matches
        no.style.transition = reduzido ? "none" : TRANSICAO_DO_RECUO
        no.style.transform = transformDoRecuo(aberta, janela.innerWidth)
        // De volta ao lugar, a transição sai, como no vaul: senão o próximo
        // arraste andaria atrasado do dedo.
        if (!aberta) {
          voltaRef.current = janela.setTimeout(() => {
            no.style.transition = "none"
          }, 500)
        }
      },
    }),
    [degraus, pending, veuEmulado, aninhada]
  )
  // Aberta por cima de outra gaveta, ela recua a de trás; fechada pelo `open` ou
  // desmontada aberta, a de trás volta.
  React.useEffect(() => {
    if (pai?.superficie !== "gaveta" || !open) return
    pai.recuar(true)
    return () => pai.recuar(false)
  }, [open, pai])
  const Raiz =
    pai?.superficie === "gaveta" ? DrawerPrimitive.NestedRoot : DrawerPrimitive.Root

  return (
    <DrawerRaizContext.Provider value={raiz}>
      <Raiz
        data-slot="drawer"
        direction={direction}
        // Desligado: quem cuida do teclado é o `rolarSobOTeclado`.
        repositionInputs={repositionInputs}
        shouldScaleBackground={scaleBackground}
        // Dentro da moldura ela deixa de ser modal (senão o `RemoveScroll` do
        // Radix trava a rolagem da página de fora). Antes de `{...props}`, para
        // quem chama mandar. Ver `useViewportModal`.
        modal={modal}
        {...props}
        dismissible={pending ? false : dismissible}
        open={open}
        onOpenChange={pedir}
      />
    </DrawerRaizContext.Provider>
  )
}

function DrawerTrigger({
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Trigger>) {
  return <DrawerPrimitive.Trigger data-slot="drawer-trigger" {...props} />
}

/**
 * O portal vai para o `body` da janela ativa, como o do `Sheet`. Fora da
 * moldura do catálogo o contexto é `null` e o vaul usa o próprio documento;
 * dentro dela, é isso que impede a gaveta de escapar do `<iframe>`.
 */
function DrawerPortal({
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Portal>) {
  const janela = useViewportWindow()
  return <DrawerPrimitive.Portal container={janela?.document.body} {...props} />
}

function DrawerClose({
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Close>) {
  return <DrawerPrimitive.Close data-slot="drawer-close" {...props} />
}

/**
 * O véu, o mesmo do painel e da folha (`SHEET_OVERLAY_CLASS`), sem a duração
 * fixa: aqui o véu acompanha o dedo e um keyframe brigaria com o arraste.
 */
function DrawerOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Overlay>) {
  return (
    <DrawerPrimitive.Overlay
      data-slot="drawer-overlay"
      className={cn(SHEET_OVERLAY_CLASS, className)}
      {...props}
    />
  )
}

/**
 * O meio de uma gaveta sem `DialogBody`: o filho direto que não é cromagem. É
 * ele que rola, entre cabeçalho e rodapé parados. Quem acha o meio é o JS e o
 * CSS lê a marca (`data-drawer-meio`, escrita pelo efeito do `DrawerContent`),
 * para a lista de slots de borda morar uma vez em `acharMeio`. As classes estão
 * escritas por extenso, uma a uma: um template literal não gera regra.
 */
const MEIO_CLASSES = [
  // O meio ocupa a sobra: o rodapé fica no pé da gaveta, e não colado ao conteúdo curto.
  "[&>[data-drawer-meio]]:flex-1",
  "[&>[data-drawer-meio]]:min-h-0",
  "[&>[data-drawer-meio]]:overflow-y-auto",
  "[&>[data-drawer-meio]]:overscroll-contain",
  "[&>[data-drawer-meio]]:scroll-fade-y",
  "[&>[data-drawer-meio]]:[--scroll-fade-floor:0]",
  // O invólucro que embrulha `DialogBody` (um formulário, ou o `div` do detalhe do
  // lançamento) só repassa a coluna: quem rola é o corpo, e o rodapé desce ao pé da
  // gaveta. Rolando o invólucro, o cabeçalho rolava junto e recortava o que sobe dele
  // (as ações do `DialogHeaderRow` na linha do ✕, 17/11/2026).
  "[&>*:has(>[data-slot=dialog-body])]:flex",
  "[&>*:has(>[data-slot=dialog-body])]:min-h-0",
  "[&>*:has(>[data-slot=dialog-body])]:flex-1",
  "[&>*:has(>[data-slot=dialog-body])]:flex-col",
].join(" ")

function acharMeio(el: HTMLElement): HTMLElement | null {
  const cromagem = new Set([
    "drag-handle",
    "dialog-header",
    "dialog-footer",
    "dialog-close-button",
    "dialog-body",
    "dialog-title",
    "dialog-description",
    "drawer-cancel",
  ])
  for (const filho of Array.from(el.children)) {
    const slot = (filho as HTMLElement).dataset.slot
    // O invólucro com `DialogBody` dentro (formulário ou não) não é o meio: o corpo dele é que rola.
    if (filho.querySelector(':scope > [data-slot="dialog-body"]')) continue
    if (!slot || !cromagem.has(slot)) return filho as HTMLElement
  }
  return null
}

// A viagem curta: a de toda gaveta que muda de altura (o editor de um filtro).
const VIAGEM_CURTA = { duration: 300, easing: "cubic-bezier(0.16, 1, 0.3, 1)" }

/** "700ms" ou "0.7s" em milissegundos; `NaN` para o que não é tempo. */
function emMs(valor: string) {
  const n = Number.parseFloat(valor)
  return valor.trim().endsWith("ms") ? n : n * 1000
}

/**
 * A gaveta com passos anda na viagem longa do diálogo do desktop
 * (`useAlturaAnimada`, o Importar extrato); as outras, na curta. O
 * `Element.animate` não lê `var()`, então os tokens vêm computados, com a
 * curta de reserva.
 */
function viagemDa(el: HTMLElement) {
  if (!el.querySelector('[data-slot="dialog-steps"]')) return VIAGEM_CURTA
  const estilo = getComputedStyle(el)
  const duracao = emMs(estilo.getPropertyValue("--duration-gentle"))
  const curva = estilo.getPropertyValue("--ease-emphasized").trim()
  return {
    duration: Number.isFinite(duracao) ? duracao : VIAGEM_CURTA.duration,
    easing: curva || VIAGEM_CURTA.easing,
  }
}

/**
 * A altura acompanha o conteúdo: quando ele muda, a gaveta anima da altura de
 * antes até a nova em vez de saltar. O `ResizeObserver` dispara antes da
 * pintura, então a altura nova nunca aparece de estalo.
 * Durante a viagem ele dispara a cada quadro (a animação mexe na altura), e o
 * callback só marca `pendente`: mexer no tamanho ali dentro dá o aviso de laço
 * do `ResizeObserver`. No fim da viagem a altura natural é medida uma vez; se o
 * conteúdo mudou no meio, uma viagem só segue do destino até a nova.
 */
function useAlturaQueAcompanha(el: HTMLElement | null, ativo: boolean) {
  React.useEffect(() => {
    if (!el || !ativo) return
    const reduzido = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches
    let anterior = el.getBoundingClientRect().height
    let animando: Animation | null = null
    let pendente = false
    // Com o teclado a altura segue o viewport visual na hora: animada, o meio
    // rolaria o campo para um lugar que ainda vai mudar.
    const parado = () =>
      reduzido || el.style.getPropertyValue("--drawer-teclado") !== ""
    const viajar = (de: number, para: number) => {
      const quadros = [{ height: `${de}px` }, { height: `${para}px` }]
      let a: Animation
      try {
        a = el.animate(quadros, viagemDa(el))
      } catch {
        // Uma curva inválida no token não pode derrubar o observador.
        a = el.animate(quadros, VIAGEM_CURTA)
      }
      pendente = false
      animando = a
      // Cancelada por fora (o vaul, uma troca de tema), a viagem também acaba: sem isto
      // `animando` ficava preso e toda mudança de altura depois era ignorada.
      a.oncancel = () => {
        if (animando !== a) return
        animando = null
        pendente = false
        anterior = el.getBoundingClientRect().height
      }
      a.onfinish = () => {
        if (animando !== a) return
        animando = null
        if (!pendente) return
        pendente = false
        const natural = el.getBoundingClientRect().height
        anterior = natural
        if (Math.abs(natural - para) >= 1 && !parado()) viajar(para, natural)
      }
    }
    const ro = new ResizeObserver(() => {
      if (animando) {
        pendente = true
        return
      }
      const atual = el.getBoundingClientRect().height
      const de = anterior
      anterior = atual
      if (Math.abs(atual - de) < 1 || de === 0 || parado()) return
      viajar(de, atual)
    })
    ro.observe(el)
    return () => {
      ro.disconnect()
      animando?.cancel()
    }
  }, [el, ativo])
}

/** O quanto o viewport visual precisa encolher para contar como teclado (a barra do Safari mexe menos). */
const TECLADO_MIN = 80

/** Quanto da gaveta precisa ficar à vista acima do teclado (cabeçalho e um campo) para ela não crescer. */
const VISIVEL_MIN = 160


/**
 * Com o teclado do iOS aberto, a gaveta não muda de tamanho nem de lugar: ela
 * guarda embaixo o lugar do teclado, o rodapé assenta logo acima dele e o meio
 * encolhe e rola o campo focado para cima, por trás do cabeçalho, que fica
 * parado. O iOS rolaria a página para mostrar o
 * campo, e a gaveta (`fixed`) subiria junto: o foco é feito sem essa rolagem,
 * e a que escapar volta para onde estava.
 * A altura fica presa na de antes do teclado (o iOS também encolhe a janela, e
 * a gaveta que mede o conteúdo cresceria com a folga). Tudo é estilo inline e
 * sai quando o teclado fecha. Na moldura do catálogo a janela é a do
 * `<iframe>`, onde não há teclado.
 */
/** Campo que abre o teclado: texto, número, e-mail…, área de texto ou editável. */
function ehCampoDeTexto(alvo: HTMLElement | null): alvo is HTMLElement {
  if (!alvo || alvo.nodeType !== 1) return false
  if (alvo.isContentEditable || alvo.tagName === "TEXTAREA") return true
  if (alvo.tagName !== "INPUT") return false
  const semTeclado = ["checkbox", "radio", "range", "color", "file", "image", "button", "submit", "reset"]
  return !semTeclado.includes((alvo as HTMLInputElement).type)
}

function rolarSobOTeclado(el: HTMLElement): (() => void) | undefined {
  const janela = el.ownerDocument.defaultView
  const vv = janela?.visualViewport
  if (!janela || !vv) return
  // A rolagem da página com a gaveta aberta, antes de o teclado mexer nela.
  const rolagem = janela.scrollY
  // A altura da gaveta sem teclado: medida antes, porque o iOS também encolhe a janela.
  let altura = 0
  // O recuo de baixo sem teclado (24 + área segura): com ele aberto, quem guarda o pé é o teclado.
  let recuo = 0
  // A janela sem teclado: com ele o iOS às vezes também encolhe o `innerHeight`
  // (956 → 918 no iPhone 18 Pro Max), e a conta perderia a barra de setas e ✓
  // que fica acima do teclado — o rodapé assentaria atrás dela.
  let janelaInteira = janela.innerHeight
  // O maior pedaço que o teclado já cobriu nesta abertura. O iOS mede primeiro
  // com a barra de setas e ✓ (956 → 567 no iPhone 18 Pro Max) e, meio segundo
  // depois, sem ela (635), com a barra ainda na tela: seguir o segundo número
  // punha o rodapé atrás da barra. Enquanto o teclado está aberto, a área
  // coberta só cresce; zera quando ele fecha.
  let cobertoMax = 0
  const soltar = () => {
    // `--drawer-teclado` marca o estado para o `useAlturaQueAcompanha` não animar.
    for (const p of ["--drawer-teclado", "height", "padding-bottom"]) el.style.removeProperty(p)
  }
  const medir = () => {
    const medido = Math.max(janelaInteira, janela.innerHeight) - vv.height
    if (medido <= TECLADO_MIN || vv.scale >= 1.01) {
      cobertoMax = 0
      soltar()
      janelaInteira = janela.innerHeight
      altura = el.getBoundingClientRect().height
      recuo = parseFloat(janela.getComputedStyle(el).paddingBottom) || 0
      return
    }
    cobertoMax = Math.max(cobertoMax, medido)
    const coberto = cobertoMax
    if (!el.style.getPropertyValue("--drawer-teclado")) {
      el.style.setProperty("--drawer-teclado", "1")
      altura = altura || el.getBoundingClientRect().height
    }
    // A gaveta alta fica presa na altura de antes; a curta (o editor de um filtro)
    // cresce até o conteúdo assentar logo acima do teclado (sem o recuo de baixo, que o
    // teclado substitui), senão o teclado a cobria inteira. O teto é o da gaveta alta (`max-height`) e, sem ele, a janela.
    const teto = parseFloat(janela.getComputedStyle(el).maxHeight) || janelaInteira
    // Só a curta cresce: a alta (o Editar perfil) que ainda mostra um campo acima
    // do teclado fica parada; crescida até o teto, o título ia para baixo da barra de status.
    const curta = altura - recuo - coberto < VISIVEL_MIN
    el.style.setProperty("height", `${curta ? Math.max(altura, Math.min(altura - recuo + coberto, teto)) : altura}px`)
    // A gaveta guarda embaixo o lugar do teclado: o meio encolhe, o rodapé
    // assenta logo acima dele, e o cabeçalho não sai do lugar.
    el.style.setProperty("padding-bottom", `${coberto}px`)
    // O iOS rola a página para mostrar o campo, e a gaveta (`fixed`) sobe junto,
    // levando o cabeçalho para fora da tela: a página volta para onde estava.
    if (janela.scrollY !== rolagem) janela.scrollTo(0, rolagem)
    // O campo focado vai para cima do teclado rolando só quem o contém.
    const foco = el.ownerDocument.activeElement
    if (!foco || foco.nodeType !== 1 || !el.contains(foco)) return
    const rolavel = el.querySelector<HTMLElement>(
      ':scope > [data-slot="dialog-body"], :scope > * > [data-slot="dialog-body"], :scope > [data-drawer-meio]'
    )
    if (!rolavel || !rolavel.contains(foco)) return
    const campo = (foco as HTMLElement).getBoundingClientRect()
    const caixa = rolavel.getBoundingClientRect()
    const respiro = 16
    // Em cima, o corpo passa por trás do cabeçalho translúcido e do puxador: o
    // `scroll-padding` dele diz quanto fica coberto, e o campo assenta abaixo disso.
    // Embaixo, o mesmo com o rodapé translúcido: o corpo desce por trás dele.
    const estilo = janela.getComputedStyle(rolavel)
    const topo = Math.max(respiro, parseFloat(estilo.scrollPaddingTop) || 0)
    const baixo = Math.max(respiro, parseFloat(estilo.scrollPaddingBottom) || 0)
    if (campo.bottom > caixa.bottom - baixo) rolavel.scrollTop += campo.bottom - caixa.bottom + baixo
    else if (campo.top < caixa.top + topo) rolavel.scrollTop -= caixa.top + topo - campo.top
  }
  // O iOS centraliza o campo focado rolando a página, e a gaveta inteira pularia
  // antes de o `scroll` acima desfazer. Com o campo empurrado 2000px para cima
  // no instante do foco, o iOS o acha à vista e não rola nada; no quadro
  // seguinte ele volta, e quem o traz para cima do teclado é o `medir` (a mesma
  // manobra do `usePreventScroll` do vaul, desligado com o `repositionInputs`).
  const esconder = (alvo: HTMLElement) => {
    alvo.style.transform = "translateY(-2000px)"
    janela.requestAnimationFrame(() => {
      alvo.style.transform = ""
      medir()
    })
  }
  const aoSoltarDedo = (e: TouchEvent) => {
    const alvo = e.target as HTMLElement | null
    if (!ehCampoDeTexto(alvo) || alvo === el.ownerDocument.activeElement) return
    e.preventDefault()
    esconder(alvo)
    alvo.focus({ preventScroll: true })
  }
  const aoFocar = (e: FocusEvent) => {
    const alvo = e.target as HTMLElement | null
    // Antes do teclado: a altura sem ele fica guardada.
    medir()
    if (ehCampoDeTexto(alvo) && !alvo.style.transform) esconder(alvo)
  }
  // O iOS mede o viewport visual primeiro sem a barra de setas e ✓ e só a
  // desconta depois, às vezes sem novo `resize` (a mesma conta do lançamento
  // inteligente): a cada mudança, mede de novo até o teclado assentar.
  let reMedidas: number[] = []
  const assentar = () => {
    medir()
    for (const t of reMedidas) janela.clearTimeout(t)
    reMedidas = [120, 300, 600, 1000].map((ms) => janela.setTimeout(medir, ms))
  }
  medir()
  vv.addEventListener("resize", assentar)
  vv.addEventListener("scroll", medir)
  el.addEventListener("touchend", aoSoltarDedo, { passive: false, capture: true })
  el.addEventListener("focusin", aoFocar)
  janela.addEventListener("scroll", medir)
  return () => {
    janela.removeEventListener("scroll", medir)
    for (const t of reMedidas) janela.clearTimeout(t)
    vv.removeEventListener("resize", assentar)
    vv.removeEventListener("scroll", medir)
    el.removeEventListener("touchend", aoSoltarDedo, { capture: true })
    el.removeEventListener("focusin", aoFocar)
    soltar()
  }
}

function DrawerContent({
  className,
  children,
  fill,
  variant,
  size,
  showHandle = true,
  ref,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Content> &
  VariantProps<typeof drawerContentVariants> & {
    /** A gaveta sem alça, para quando ela não se arrasta (`dismissible={false}`); com o gesto ligado, tirá-la tira a única pista dele. */
    showHandle?: boolean
  }) {
  const contexto = React.useContext(DrawerRaizContext)
  const raiz = contexto?.superficie === "gaveta" ? contexto : null
  // Com degraus a gaveta é alta: o vaul a desloca de um a outro e o conteúdo
  // precisa existir inteiro por baixo.
  const alta = fill ?? raiz?.degraus ?? false
  // O elemento mora em estado e não numa `ref` de função: refeita a cada render
  // ela criava um observador novo sem desligar o anterior.
  const [el, setEl] = React.useState<HTMLDivElement | null>(null)
  const conteudo = useComposedRefs<HTMLDivElement>(setEl, ref)
  useAlturaQueAcompanha(el, !alta)
  // O nó vai à raiz, para o recuo achá-lo quando outra gaveta abrir por cima.
  React.useEffect(() => {
    if (!raiz) return
    raiz.registrarConteudo(el)
    return () => raiz.registrarConteudo(null)
  }, [el, raiz])
  // Com degraus, o vaul desloca a gaveta pela altura da janela; ali o teclado fica com ele.
  const degraus = raiz?.degraus ?? false
  React.useEffect(() => {
    if (el && !degraus) return rolarSobOTeclado(el)
  }, [el, degraus])
  // A gaveta nunca rola, quem rola é o meio. O navegador rola a caixa mesmo com
  // `overflow: hidden` para pôr um campo focado à vista enquanto ela ainda anda até
  // a altura nova (o Continuar do Importar), e o puxador e o título sumiam por cima.
  React.useEffect(() => {
    if (!el) return
    const zerar = () => {
      if (el.scrollTop !== 0) el.scrollTop = 0
    }
    el.addEventListener("scroll", zerar)
    return () => el.removeEventListener("scroll", zerar)
  }, [el])
  const dissolver = useScrollFade()
  // Marca o meio e repete a busca quando filhos entram ou saem, tirando a marca
  // e a dissolução do antigo.
  React.useEffect(() => {
    if (!el) return
    let meio: HTMLElement | null = null
    let soltar: (() => void) | undefined
    const largar = () => {
      soltar?.()
      meio?.removeAttribute("data-drawer-meio")
    }
    const marcar = () => {
      const achado = acharMeio(el)
      if (achado === meio) return
      largar()
      meio = achado
      meio?.setAttribute("data-drawer-meio", "")
      soltar = meio ? dissolver(meio) : undefined
    }
    marcar()
    const ob = new MutationObserver(marcar)
    ob.observe(el, { childList: true })
    return () => {
      ob.disconnect()
      largar()
    }
  }, [el, dissolver])

  return (
    // Aberta por cima de outra gaveta, o véu é mais claro e sem desfoque: a de trás, que
    // recuou, continua à vista atrás da de cima, como as folhas empilhadas do iOS.
    <DrawerPortal>
      <DrawerOverlay
        className={
          raiz?.aninhada
            ? "bg-overlay/50 supports-backdrop-filter:backdrop-blur-none"
            : undefined
        }
      />
      {raiz?.veuEmulado ? (
        // O véu da moldura: o mesmo desenho, e tocar nele fecha.
        // `pointer-events-auto` porque o Radix pode deixar o `body` de dentro em
        // `none`, e a propriedade é herdada.
        <div
          aria-hidden
          data-slot="drawer-overlay"
          className={cn(
            SHEET_OVERLAY_CLASS,
            "pointer-events-auto animate-in fade-in-0 animation-duration-(--duration-base)"
          )}
          onPointerDown={() => raiz.fechar()}
        />
      ) : null}
      <DrawerPrimitive.Content
        ref={conteudo}
        data-slot="drawer-content"
        data-surface="drawer"
        data-variant={variant}
        data-size={size}
        // `fixed` é o que a cromagem do `Dialog` lê para dar recuo ao cabeçalho
        // e deixar o corpo rolar entre ele e o rodapé.
        data-layout="fixed"
        // Aberta por cima de outra: a altura desconta `--drawer-recuo`.
        data-aninhada={raiz?.aninhada ? "" : undefined}
        aria-busy={raiz?.pending || undefined}
        className={cn(
          drawerContentVariants({ fill: alta, variant, size }),
          // Sem `DialogBody`, o meio é quem rola, e dissolve nas bordas.
          "overflow-hidden",
          MEIO_CLASSES,
          className
        )}
        {...props}
      >
        {/* Com ✕ e sem degraus o ✕ é a saída: a alça some, mas guarda os 26px da barra. A ação da
            esquerda da barra (`dialog-header-start`, o "‹ Cancelar" da edição) conta igual. */}
        {showHandle ? (
          <DragHandle
            className={
              degraus
                ? undefined
                : "group-has-[[data-slot=dialog-close-button]]/dialog-content:invisible group-has-[[data-slot=dialog-header-start]]/dialog-content:invisible"
            }
          />
        ) : null}
        {children}
      </DrawerPrimitive.Content>
    </DrawerPortal>
  )
}

/**
 * A folha de ações (o action sheet do iOS): linhas de 52px com ícone, a
 * destrutiva em vermelho e o `DrawerCancel` separado embaixo. Cada ação fecha a
 * gaveta depois de rodar.
 */
function DrawerActions({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      role="group"
      data-slot="drawer-actions"
      className={cn("flex flex-col px-2", className)}
      {...props}
    />
  )
}

/** A linha da folha de ações, para quem monta a própria (o `DropdownMenu` no telefone, cujas linhas que confirmam ou carregam não fecham no toque). */
const drawerActionClassName = cn(
  "flex min-h-13 w-full items-center gap-3 rounded-surface px-4 text-left text-base text-foreground outline-none select-none",
  "transition-colors duration-(--duration-fast) ease-(--ease-out)",
  // Tinta sobre o vidro da gaveta, e não `bg-muted` opaco.
  "hover:bg-foreground/9 active:bg-foreground/15 focus-visible:bg-foreground/9",
  "disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50",
  "[&_svg]:size-5 [&_svg]:shrink-0 [&_svg]:text-muted-foreground",
  "data-[variant=destructive]:text-destructive data-[variant=destructive]:[&_svg]:text-destructive"
)

/** Uma linha da folha de ações. O ícone é desenhado a 20px (`20/solid`); `asChild` para um link. */
function DrawerAction({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> & {
  variant?: "default" | "destructive"
  asChild?: boolean
}) {
  const Comp = asChild ? Slot.Root : "button"
  return (
    <DrawerPrimitive.Close asChild>
      <Comp
        data-slot="drawer-action"
        data-variant={variant}
        {...(asChild ? {} : { type: "button" as const })}
        className={cn(drawerActionClassName, className)}
        {...props}
      />
    </DrawerPrimitive.Close>
  )
}

/** O "Cancelar" da folha de ações: um botão sozinho, separado das ações. */
function DrawerCancel({
  className,
  children = "cancelar",
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <DrawerPrimitive.Close asChild>
      <Button
        data-slot="drawer-cancel"
        type="button"
        variant="secondary"
        size="xl"
        className={cn("mx-2 mt-2 shrink-0", className)}
        {...props}
      >
        {children}
      </Button>
    </DrawerPrimitive.Close>
  )
}

export {
  DragHandle,
  dragHandleClassName,
  Drawer,
  DrawerAction,
  DrawerActions,
  drawerActionClassName,
  DrawerCancel,
  DrawerClose,
  DrawerContent,
  DrawerOverlay,
  DrawerPortal,
  DrawerRaizContext,
  DrawerTrigger,
  drawerContentVariants,
  transformDoRecuo,
  overlayClassName,
  SHEET_OVERLAY_CLASS,
  SURFACE_CONTRACT_CLASS,
}
