"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { cva, type VariantProps } from "class-variance-authority"
import { useComposedRefs } from "radix-ui/internal"
import {
  AlertDialog as AlertDialogPrimitive,
  Dialog as DialogPrimitive,
} from "radix-ui"
import { XMarkIcon } from "@heroicons/react/16/solid"

import { cn } from "@/lib/utils"
import { modalSurfaceClassName } from "@/lib/glass-classes"
import { Muted } from "@/components/ui/typography"
import { scrollFadeViewportClassName } from "@/lib/scroll-fade-classes"
import { useScrollFade } from "@/hooks/use-scroll-fade"
import { useIsMobile } from "@/hooks/use-mobile"
import { useAlturaAnimada } from "@/hooks/use-altura-animada"
import { Button, TresAcoesContext, contarAcoes } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
import { DrawerRaizContext, overlayClassName } from "@/components/ui/drawer"
import { ignorarToqueNoToast } from "@/lib/toast-interact"

/**
 * O recuo que desvia do botão de fechar: `--dialog-close` é o território do × e
 * `--dialog-px` onde a caixa do cabeçalho termina; a diferença é quanto falta
 * desviar (zero sem ×). Desvia de um lado só porque o cabeçalho é alinhado à
 * esquerda. A classe é escrita por extenso: uma interpolada num template não
 * existe para o scanner do Tailwind.
 */
const DIALOG_CLOSE_RESERVE =
  "pe-[max(0px,calc(var(--dialog-close)-var(--dialog-px)))]"

/**
 * `surface="auto"`: abaixo de 768px o diálogo vira a gaveta do `Sheet`, com a
 * mesma API e cromagem (as três superfícies são a mesma primitiva do Radix).
 * `pending` trava Esc, véu, ×, Cancelar e o arraste, e marca `aria-busy`.
 * `dirty` + `confirmDiscard` perguntam "Descartar alterações?" antes de fechar
 * (com a primitiva do Radix, porque o `AlertDialog` importa este arquivo).
 * Título sobre descrição é par de identidade, separado pela entrelinha.
 */
type DialogEstado = {
  /** No telefone, com `surface="auto"`: a gaveta do `Sheet`. */
  gaveta: boolean
  pending: boolean
}

const DialogEstadoContext = React.createContext<DialogEstado>({
  gaveta: false,
  pending: false,
})

/**
 * Um link de dentro do diálogo que abre uma tela: o diálogo fecha com o próprio
 * gesto (passando pelo pedido de fechar, com o "Descartar alterações?" quando há
 * rascunho) e só depois a tela abre. Sem isto o `Link` trocava de rota com o
 * diálogo da casca ainda aberto por cima. Vale para o `Dialog` e o `Sheet`; a
 * raiz mais de fora é quem responde, porque fechá-la fecha as de dentro.
 */
type NavegarFechando = (href: string, casco: HTMLElement) => void

const NavegarFechandoContext = React.createContext<NavegarFechando | null>(null)

/**
 * O `onClickCapture` do casco: pega o clique simples num link interno (também de
 * um seletor portalizado, porque o evento do React sobe pela árvore) antes do
 * `Link`, e entrega ao diálogo. Nova aba, modificadoras, `download` e outro
 * domínio seguem o navegador.
 */
function useLinkQueFecha(
  proprio?: React.MouseEventHandler<HTMLDivElement>
): React.MouseEventHandler<HTMLDivElement> {
  const navegar = React.useContext(NavegarFechandoContext)
  return (e) => {
    proprio?.(e)
    if (!navegar || e.defaultPrevented || e.button !== 0) return
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    const link = (e.target as Element | null)?.closest?.("a[href]")
    if (!link || link.getAttribute("target") === "_blank" || link.hasAttribute("download")) return
    const url = new URL(link.getAttribute("href") ?? "", window.location.href)
    if (url.origin !== window.location.origin) return
    e.preventDefault()
    // O link mora numa placa ancorada (o seletor de categoria, de cartão): ela
    // fecha com o próprio gesto. O Esc chega só à camada de cima.
    if (link.closest("[data-radix-popper-content-wrapper]")) {
      link.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }))
    }
    navegar(`${url.pathname}${url.search}${url.hash}`, e.currentTarget)
  }
}

/** Abre a tela quando o casco sai do DOM (o fim da animação de fechar), com teto. */
function abrirDepoisDeSair(abrir: () => void, casco: HTMLElement) {
  const inicio = performance.now()
  const passo = () => {
    if (!casco.isConnected || performance.now() - inicio > 800) abrir()
    else requestAnimationFrame(passo)
  }
  requestAnimationFrame(passo)
}

type ConfirmDiscard = boolean | { title?: string; description?: string }

function Dialog({
  surface = "dialog",
  pending = false,
  dirty = false,
  confirmDiscard = false,
  open: openProp,
  defaultOpen,
  onOpenChange,
  children,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root> & {
  /** `auto`: diálogo no desktop, gaveta no telefone. */
  surface?: "dialog" | "auto"
  /** Salvando: nada fecha o diálogo até acabar. */
  pending?: boolean
  /** O formulário tem alterações não salvas. */
  dirty?: boolean
  /** Com `dirty`, fechar pergunta antes. `true` usa os textos padrão. */
  confirmDiscard?: ConfirmDiscard
}) {
  const isMobile = useIsMobile()
  const gaveta = surface === "auto" && isMobile
  const { open, pedir, pergunta, navegarFechando } = usePedidoDeFechar({
    open: openProp,
    defaultOpen,
    onOpenChange,
    pending,
    dirty,
    confirmDiscard,
  })
  const navegarDeFora = React.useContext(NavegarFechandoContext)

  const estado = React.useMemo(() => ({ gaveta, pending }), [gaveta, pending])

  return (
    <NavegarFechandoContext.Provider value={navegarDeFora ?? navegarFechando}>
    <DialogEstadoContext.Provider value={estado}>
      {gaveta ? (
        <Sheet open={open} onOpenChange={pedir} {...props}>
          {children}
        </Sheet>
      ) : (
        <DialogPrimitive.Root
          data-slot="dialog"
          open={open}
          onOpenChange={pedir}
          {...props}
        >
          {children}
        </DialogPrimitive.Root>
      )}
      {pergunta}
    </DialogEstadoContext.Provider>
    </NavegarFechandoContext.Provider>
  )
}

/**
 * O aberto e o pedido de fechar, do `Dialog` e do `Sheet`. Todo pedido de fechar
 * (Esc, véu, ×, o fechar, o arraste da gaveta) passa por `pedir`; fechar pelo
 * `open` controlado não. `pergunta` é o "Descartar alterações?", renderizado ao
 * lado da raiz.
 */
function usePedidoDeFechar({
  open: openProp,
  defaultOpen,
  onOpenChange,
  pending,
  dirty,
  confirmDiscard,
}: {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  pending: boolean
  dirty: boolean
  confirmDiscard: ConfirmDiscard
}) {
  const controlado = openProp !== undefined
  const [interno, setInterno] = React.useState(defaultOpen ?? false)
  const open = controlado ? openProp : interno
  const [perguntando, setPerguntando] = React.useState(false)
  const router = useRouter()
  // O link que pediu para fechar: a tela abre quando o diálogo fechar de fato.
  const destino = React.useRef<{ href: string; casco: HTMLElement } | null>(null)
  // O "descartar" também fecha a pergunta (o `Action` do Radix chama o
  // `onOpenChange` depois do `onClick`): sem esta marca, o fechar dela lia como
  // "continuar editando" e esquecia o link antes de a tela abrir.
  const descartando = React.useRef(false)
  React.useEffect(() => {
    if (open || !destino.current) return
    const { href, casco } = destino.current
    destino.current = null
    abrirDepoisDeSair(() => router.push(href), casco)
  }, [open, router])

  const mudar = (proximo: boolean) => {
    if (!controlado) setInterno(proximo)
    onOpenChange?.(proximo)
  }
  const pedir = (proximo: boolean) => {
    if (proximo) return mudar(true)
    if (pending) {
      destino.current = null
      return
    }
    if (dirty && confirmDiscard) {
      setPerguntando(true)
      return
    }
    mudar(false)
  }

  const textos = typeof confirmDiscard === "object" ? confirmDiscard : {}
  const pergunta = confirmDiscard ? (
    <ConfirmarDescarte
      open={perguntando}
      onOpenChange={(aberta) => {
        setPerguntando(aberta)
        // "Continuar editando": o link que pediu para fechar não abre mais.
        if (!aberta && !descartando.current) destino.current = null
        descartando.current = false
      }}
      title={textos.title}
      description={textos.description}
      onDiscard={() => {
        descartando.current = true
        setPerguntando(false)
        mudar(false)
      }}
    />
  ) : null

  const navegarFechando: NavegarFechando = (href, casco) => {
    destino.current = { href, casco }
    pedir(false)
  }

  return { open, pedir, pergunta, navegarFechando }
}

/**
 * "Descartar alterações?": mora na camada da folha (`--z-sheet`) e depois dela
 * no DOM, para ficar por cima de um diálogo e de uma gaveta. Esc fecha só ela.
 */
function ConfirmarDescarte({
  open,
  onOpenChange,
  onDiscard,
  title = "Descartar alterações?",
  description = "O que foi preenchido aqui não será salvo.",
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onDiscard: () => void
  title?: string
  description?: string
}) {
  return (
    <AlertDialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialogPrimitive.Portal>
        <AlertDialogPrimitive.Overlay
          data-slot="dialog-discard-overlay"
          className={overlayClassName("sheet")}
        />
        <AlertDialogPrimitive.Content
          data-slot="dialog-discard"
          className={cn(
            dialogContentVariants({ size: "sm", layout: "auto" }),
            "z-(--z-sheet)"
          )}
        >
          <div className="flex flex-col text-left">
            <AlertDialogPrimitive.Title className="font-heading text-base leading-snug font-medium text-balance">
              {title}
            </AlertDialogPrimitive.Title>
            <AlertDialogPrimitive.Description asChild>
              <Muted className="text-pretty">{description}</Muted>
            </AlertDialogPrimitive.Description>
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <AlertDialogPrimitive.Cancel asChild>
              <Button type="button" variant="tertiary">
                continuar editando
              </Button>
            </AlertDialogPrimitive.Cancel>
            <AlertDialogPrimitive.Action asChild>
              <Button type="button" variant="destructive" onClick={onDiscard}>
                descartar
              </Button>
            </AlertDialogPrimitive.Action>
          </div>
        </AlertDialogPrimitive.Content>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  )
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  const { gaveta } = React.useContext(DialogEstadoContext)
  if (gaveta) return <SheetTrigger {...props} />
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

/** Enquanto salva, fechar fica desabilitado — com `asChild`, no botão filho. */
function DialogClose({
  disabled,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  const { gaveta, pending } = React.useContext(DialogEstadoContext)
  const Comp = gaveta ? SheetClose : DialogPrimitive.Close
  return (
    <Comp
      data-slot="dialog-close"
      disabled={pending || disabled}
      {...props}
    />
  )
}

/** O véu do diálogo — o mesmo do `AlertDialog`, que o importa daqui. */
const DIALOG_OVERLAY_CLASS = overlayClassName("modal")

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(DIALOG_OVERLAY_CLASS, className)}
      {...props}
    />
  )
}

/**
 * A moldura do diálogo. `layout`: `auto` (a altura vem do conteúdo) ou `fixed`
 * (a altura é teto, e o corpo rola entre cabeçalho e rodapé parados, a forma do
 * formulário em diálogo). `size` é a largura, `md` por padrão.
 *
 * A placa veste `modalSurfaceClassName` (`--background` a 85%, 50% no escuro),
 * mais aberta que a flutuante: a 60% sobre a página velada o `--popover` compõe
 * acima de tudo e a placa lê como opaca. O `backdrop-filter` só aparece com cor
 * cheia atrás; quem quiser o efeito mais visível mexe no véu, não aqui (ver
 * `lib/glass-classes` e `lib/menu-classes`).
 */
const dialogContentVariants = cva(
  [
    "group/dialog-content fixed top-1/2 left-1/2 z-(--z-modal)",
    "w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2",
    "rounded-modal text-sm shadow-lg ring-1 ring-foreground/10 outline-none [--radius-parent:var(--radius-modal)] [--radius-inset:var(--dialog-px)]",
    // A placa é o material da casa, no mesmo par de alfa das superfícies flutuantes.
    modalSurfaceClassName,
    // A entrada da paleta (`CommandDialog`): abre na mola e fecha curto em
    // `--ease-out` (uma mola até zero passa por baixo de zero). O gesto do menu
    // fica para o que se ancora num gatilho (rodada 293). O conteúdo chega aos
    // poucos atrás, peça a peça, do desfoque (`@utility dialog-reveal`).
    "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-open:animation-duration-(--duration-spring) data-open:ease-(--ease-spring) data-open:slide-in-from-top-1",
    "data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 data-closed:animation-duration-(--duration-fast) data-closed:ease-(--ease-out)",
    "dialog-reveal",
    // O recuo do diálogo é um, 24px (o `px-6` que vinte chamadas já escreviam).
    "[--dialog-px:--spacing(6)]",
    // O teto de altura do `fixed` é a janela com 2rem de margem: o diálogo mostra
    // tudo o que couber e só rola com conteúdo maior que a tela (o teto de 36rem
    // fazia o Editar perfil rolar numa tela com espaço sobrando).
    "[--dialog-max-h:calc(100dvh-4rem)]",
    // O território do × a partir da borda direita (12 + 28 + 4). Zero sem ×,
    // como no `AlertDialog`, que herda esta régua.
    "[--dialog-close:0px]",
  ],
  {
    variants: {
      size: {
        sm: "sm:max-w-sm",
        md: "sm:max-w-md",
        lg: "sm:max-w-lg",
        xl: "sm:max-w-xl",
        // Tela cheia: a janela com 2rem de margem; com `fixed` a altura é a da janela.
        full: "sm:max-w-[calc(100%-4rem)] [--dialog-max-h:calc(100dvh-2rem)] sm:[--dialog-max-h:calc(100dvh-4rem)]",
      },
      layout: {
        // `--dialog-bleed` é quanto o rodapé recua para alcançar a borda; é
        // variável (e não `group-data-*`) para `mx-0` vencer por `tailwind-merge`.
        auto: "grid gap-4 p-(--dialog-px) [--dialog-bleed:--spacing(6)]",
        fixed: [
          "flex max-h-(--dialog-max-h) flex-col gap-0 overflow-hidden p-0 [--dialog-bleed:0px]",
          // Com passos a janela tem altura fixa (não pula de um passo para outro) e
          // quem rola é o corpo; o teto dela fica nos 36rem, e não na janela inteira.
          "has-[[data-slot=dialog-steps]]:h-(--dialog-max-h) has-[[data-slot=dialog-steps]]:[--dialog-max-h:min(90dvh,36rem)]",
        ].join(" "),
      },
    },
    compoundVariants: [
      { size: "full", layout: "fixed", className: "h-(--dialog-max-h)" },
    ],
    defaultVariants: {
      size: "md",
      layout: "auto",
    },
  }
)

/**
 * A entrada do conteúdo (`@utility dialog-reveal`) vale só na abertura: quando a
 * última peça termina de surgir, a placa ganha `data-revealed` e a regra sai. Sem
 * isso, o que entra depois — os campos de outra aba do formulário — surgia do
 * desfoque de novo a cada troca. A marca zera quando a placa termina de sair
 * (`exit`): quem chama o diálogo costuma ficar montado entre uma abertura e outra
 * (o formulário de lançamento é da casca), e sem zerar só a primeira abertura
 * chegava aos poucos.
 */
function useRevelacao(onAnimationEnd?: React.AnimationEventHandler<HTMLDivElement>) {
  const [revelado, setRevelado] = React.useState(false)
  const aoTerminar = (e: React.AnimationEvent<HTMLDivElement>) => {
    onAnimationEnd?.(e)
    if (e.target === e.currentTarget && e.animationName === "exit") {
      setRevelado(false)
      return
    }
    if (revelado || e.animationName !== "menu-content-in") return
    const ainda = e.currentTarget
      .getAnimations({ subtree: true })
      .some((a) => "animationName" in a && a.animationName === "menu-content-in" && a.playState === "running")
    if (!ainda) setRevelado(true)
  }
  return { "data-revealed": revelado || undefined, onAnimationEnd: aoTerminar }
}

function DialogContent({
  className,
  children,
  size,
  layout,
  showCloseButton = true,
  ref,
  onClickCapture,
  onAnimationEnd,
  onInteractOutside,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> &
  VariantProps<typeof dialogContentVariants> & {
    showCloseButton?: boolean
  }) {
  const { gaveta, pending } = React.useContext(DialogEstadoContext)
  const aoClicarLink = useLinkQueFecha(onClickCapture)
  const revelacao = useRevelacao(onAnimationEnd)
  // O conteúdo que muda de altura (trocar de aba num formulário) anda na mola,
  // em vez de saltar: a placa cresce e encolhe pelos dois lados, centrada.
  const alturaAnimada = useAlturaAnimada<HTMLDivElement>()
  const placaRef = useComposedRefs(ref, alturaAnimada)
  // Aberto de dentro de uma folha, o diálogo sobe à camada dela (`--z-sheet`):
  // em `--z-modal` ele ficaria atrás da folha que o abriu. Portalizado depois,
  // empata na camada e vence pela ordem do DOM.
  const dentroDeFolha = React.useContext(DrawerRaizContext) != null

  // No telefone, com `surface="auto"`: a gaveta do `Sheet`. A gaveta alta é a
  // do formulário (`fixed`) e a da tela cheia; com passos, só no `fixed` ela
  // trava na altura alta (por classe, porque só o DOM sabe que há passos). No
  // `auto` a gaveta com passos mede cada passo e anda entre eles, como a placa
  // do desktop.
  if (gaveta) {
    return (
      <SheetContent
        ref={ref}
        onClickCapture={onClickCapture}
        fillMobileViewport={layout === "fixed" || size === "full"}
        onAnimationEnd={onAnimationEnd}
        onInteractOutside={(e) => {
          ignorarToqueNoToast(e)
          onInteractOutside?.(e)
        }}
        aria-busy={pending || undefined}
        className={cn(
          layout === "fixed" && "has-[[data-slot=dialog-steps]]:h-(--drawer-h)",
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton ? <DialogCloseButton /> : null}
      </SheetContent>
    )
  }

  return (
    <DialogPortal>
      <DialogOverlay className={dentroDeFolha ? "z-(--z-sheet)" : undefined} />
      <DialogPrimitive.Content
        ref={placaRef}
        onClickCapture={aoClicarLink}
        data-slot="dialog-content"
        data-layout={layout ?? "auto"}
        aria-busy={pending || undefined}
        onInteractOutside={(e) => {
          ignorarToqueNoToast(e)
          onInteractOutside?.(e)
        }}
        {...revelacao}
        className={cn(
          dialogContentVariants({ size, layout }),
          showCloseButton && "[--dialog-close:--spacing(11)]",
          // Um `DialogCloseButton` composto também reserva, como no `Sheet`.
          "has-[>[data-slot=dialog-close-button]]:[--dialog-close:--spacing(11)]",
          dentroDeFolha && "z-(--z-sheet)",
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton ? <DialogCloseButton /> : null}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

/**
 * Title + description row with optional trailing controls (e.g. a menu and the
 * inline close). Use inside `DialogHeader`. Os controles ficam lado a lado (4px)
 * e centrados na primeira linha do título: o botão de 28 sobre a linha de 22 do
 * título sobe e desce 3px (`-my-0.75`), sem empurrar a altura da linha.
 */
function DialogHeaderRow({
  className,
  children,
  startAdornment,
  endAdornment,
  center,
  centerShown = false,
}: React.ComponentProps<"div"> & {
  /**
   * A ação do lado esquerdo da barra (o "‹ Cancelar" da edição dentro de uma folha). Na gaveta
   * ocupa a reserva da esquerda, espelhando o `endAdornment`; no desktop vem antes do título.
   */
  startAdornment?: React.ReactNode
  endAdornment?: React.ReactNode
  /** Resumo que entra no meio da linha (o título do corpo passou por baixo dela). */
  center?: React.ReactNode
  centerShown?: boolean
}) {
  const barra = endAdornment != null || startAdornment != null
  return (
    <div
      data-slot="dialog-header-row"
      className={cn(
        "group/dialog-header-row grid w-full min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-3",
        // Na gaveta (abaixo de 768px) é a barra das folhas do iOS (dono, 17/11/2026): a linha
        // sobe à altura do ✕ do canto (`top-2.5`), o título fica no centro dela, numa linha só,
        // entre duas reservas iguais (as ações à direita, 44 + 4 + 44), e a descrição desce
        // para baixo da barra, à esquerda. Sem título (as setas do detalhe), a linha sobe inteira.
        barra && "max-md:-mt-8",
        startAdornment != null && "grid-cols-[auto_minmax(0,1fr)_auto]",
        barra &&
          "max-md:has-[[data-slot=dialog-title]]:grid-cols-[5.75rem_minmax(0,1fr)_5.75rem] max-md:has-[[data-slot=dialog-title]]:gap-x-0 max-md:has-[[data-slot=dialog-title]]:gap-y-2 max-md:has-[[data-slot=dialog-title]]:items-center",
        barra &&
          "max-md:[&_[data-slot=dialog-title]]:col-start-2 max-md:[&_[data-slot=dialog-title]]:row-start-1 max-md:[&_[data-slot=dialog-title]]:truncate max-md:[&_[data-slot=dialog-title]]:text-center max-md:[&_[data-slot=dialog-title]]:font-semibold",
        barra &&
          "max-md:[&_[data-slot=dialog-description]]:col-span-full max-md:[&_[data-slot=dialog-description]]:row-start-2",
        center != null && "relative",
        className
      )}
    >
      {startAdornment != null ? (
        <div
          data-slot="dialog-header-start"
          className="-my-0.75 flex shrink-0 items-center gap-1 max-md:my-0 max-md:col-start-1 max-md:row-start-1 max-md:justify-self-start"
        >
          {startAdornment}
        </div>
      ) : null}
      {/* Com título, na gaveta, o invólucro some (`contents`): título e descrição viram itens da grade. */}
      <div className="min-w-0 max-md:group-has-[[data-slot=dialog-title]]/dialog-header-row:contents">
        {children}
      </div>
      {endAdornment != null ? (
        <div
          data-slot="dialog-header-end"
          className={cn(
            "-my-0.75 flex shrink-0 items-center gap-1 max-md:my-0",
            "max-md:group-has-[[data-slot=dialog-title]]/dialog-header-row:col-start-3 max-md:group-has-[[data-slot=dialog-title]]/dialog-header-row:row-start-1 max-md:group-has-[[data-slot=dialog-title]]/dialog-header-row:justify-self-end",
            DIALOG_CLOSE_RESERVE
          )}
        >
          {endAdornment}
        </div>
      ) : null}
      {center != null ? (
        // inset-x-19 (76px): folga igual dos dois lados (setas 32+4+32 = ⋯ × ), o centro é o da placa.
        <div
          data-slot="dialog-header-center"
          aria-hidden="true"
          inert={!centerShown || undefined}
          data-shown={centerShown || undefined}
          className="pointer-events-none absolute inset-y-0 inset-x-19 flex min-w-0 items-center justify-center gap-2 transition-[opacity,translate,filter] duration-(--duration-base) ease-(--ease-out) translate-y-1.5 opacity-0 blur-xs data-shown:translate-y-0 data-shown:opacity-100 data-shown:blur-none motion-reduce:translate-y-0 motion-reduce:blur-none"
        >
          {center}
        </div>
      ) : null}
    </div>
  )
}

/** `docked` é true quando o elemento saiu por cima da borda de cima do corpo do diálogo. */
function useDialogHeaderDock<T extends HTMLElement>(): [(el: T | null) => void, boolean] {
  const [el, setEl] = React.useState<T | null>(null)
  const [docked, setDocked] = React.useState(false)
  React.useEffect(() => {
    // Sem corpo (ou sem o nó) não há de onde sair: fica falso.
    const root = el?.closest<HTMLElement>('[data-slot="dialog-body"]')
    // A janela do nó, e não a global: o catálogo roda dentro de iframe.
    const Observer = el?.ownerDocument.defaultView?.IntersectionObserver
    if (!el || !root || !Observer) {
      setDocked(false)
      return
    }
    // Com o cabeçalho translúcido, o corpo sobe por trás dele: sair de vista é
    // passar por baixo da base do cabeçalho, não da borda do corpo. A margem
    // negativa do corpo é a altura que ele sobe (zero sem o `translucent`).
    const sob = Math.max(0, -parseFloat(getComputedStyle(root).marginTop) || 0)
    const io = new Observer(
      ([e]) => setDocked(!e.isIntersecting && e.boundingClientRect.top < (e.rootBounds?.top ?? 0)),
      { root, threshold: 0, rootMargin: `${-sob}px 0px 0px 0px` }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [el])
  return [setEl, docked]
}

/**
 * `align="center"`: o topo de uma confirmação que pausa (Excluir conta), à moda
 * do iOS — o poço em cima, título e descrição centrados e os pontos dos passos
 * embaixo. O recuo do × vale dos dois lados no título e na descrição, para o
 * texto centrado ficar no meio da placa, e não da sobra à esquerda do ×.
 */
const dialogHeaderVariants = cva("", {
  variants: {
    align: {
      start: "",
      center: [
        "items-center text-center has-[>[data-slot$=-media]]:flex",
        "[&>[data-slot$=-title]]:ps-[max(0px,calc(var(--dialog-close)-var(--dialog-px)))]",
        "[&>[data-slot$=-description]]:px-[max(0px,calc(var(--dialog-close)-var(--dialog-px)))]",
      ],
    },
  },
  defaultVariants: { align: "start" },
})

/**
 * O cabeçalho. Sem fio: o que o separa do corpo é o respiro, e a dissolução
 * onde há rolagem. `shrink-0` e o recuo vêm de fábrica; em `layout="auto"` o
 * casco já dá o recuo, então aqui ele é zero.
 */
/**
 * A placa de uma tira translúcida acende só quando o corpo do diálogo rola
 * (rodada 386): `data-placa` no elemento, que o CSS lê. No cabeçalho, com
 * rolagem; no rodapé, também com rolagem, e apaga nos últimos 24px (rodada 395).
 * Por script, e não por `animation-timeline`: no iPhone a linha do tempo da
 * rolagem não ativava, e a placa nunca acendia — o conteúdo passava nítido por
 * trás do cabeçalho (o painel de notificações, 19/11/2026).
 */
function usePlacaPorRolagem(el: HTMLDivElement | null, ligado: boolean, lado: "topo" | "pe") {
  React.useEffect(() => {
    const casco = el?.closest<HTMLElement>('[data-layout="fixed"]')
    const corpo = casco?.querySelector<HTMLElement>('[data-slot="dialog-body"]')
    const win = el?.ownerDocument.defaultView
    if (!ligado || !el || !corpo || !win) return
    const conferir = () => {
      const sobra = corpo.scrollHeight - corpo.clientHeight
      const acesa = sobra > 1 && (lado === "topo" || corpo.scrollTop < sobra - 24)
      el.toggleAttribute("data-placa", acesa)
      // O degradê do cabeçalho desce com a rolagem: parado, termina logo depois da borda (não
      // cobre a primeira linha); nos primeiros 40px rolados, chega à altura inteira (20/11/2026).
      if (lado === "topo") el.style.setProperty("--dialog-header-rolagem", String(Math.min(1, corpo.scrollTop / 40)))
    }
    conferir()
    corpo.addEventListener("scroll", conferir, { passive: true })
    const tamanho = new win.ResizeObserver(conferir)
    tamanho.observe(corpo)
    const conteudo = new win.MutationObserver(conferir)
    conteudo.observe(corpo, { childList: true, subtree: true })
    return () => {
      corpo.removeEventListener("scroll", conferir)
      tamanho.disconnect()
      conteudo.disconnect()
      el.removeAttribute("data-placa")
      el.style.removeProperty("--dialog-header-rolagem")
    }
  }, [el, ligado, lado])
}

/**
 * A altura de uma tira, publicada no pai na variável `nome`: com
 * `translucent`, o corpo irmão passa por trás dela nessa medida
 * (`--dialog-header-h` no `@utility dialog-header-translucent`,
 * `--dialog-footer-h` no `dialog-footer-translucent`). Medida antes da pintura
 * e a cada mudança de tamanho.
 */
function useAlturaPublicada(nome: string, ligado: boolean) {
  const [el, setEl] = React.useState<HTMLDivElement | null>(null)
  React.useLayoutEffect(() => {
    const pai = el?.parentElement
    const Observer = el?.ownerDocument.defaultView?.ResizeObserver
    if (!ligado || !el || !pai || !Observer) return
    const medir = () => pai.style.setProperty(nome, `${el.offsetHeight}px`)
    medir()
    const ob = new Observer(medir)
    ob.observe(el)
    return () => {
      ob.disconnect()
      pai.style.removeProperty(nome)
    }
  }, [el, nome, ligado])
  return [el, setEl] as const
}

function DialogHeader({
  className,
  children,
  align,
  translucent = true,
  ref,
  ...props
}: React.ComponentProps<"div"> &
  VariantProps<typeof dialogHeaderVariants> & {
    /**
     * O corpo rola por trás do cabeçalho, que fica levemente translúcido e
     * desce num degradê longo, sem linha reta (o B3, 13/11/2026, em todas as
     * folhas). Vale no `layout="fixed"` com o `DialogBody` logo depois (irmão
     * ou dentro do `form` irmão). `false` é a saída de quem monta a própria
     * borda (o painel de notificações, com o dia preso sob as abas).
     */
    translucent?: boolean
  }) {
  const [tira, medir] = useAlturaPublicada("--dialog-header-h", translucent)
  usePlacaPorRolagem(tira, translucent, "topo")
  return (
    <div
      ref={useComposedRefs(ref, medir)}
      data-slot="dialog-header"
      data-align={align ?? "start"}
      data-translucent={translucent || undefined}
      className={cn(
        translucent && "dialog-header-translucent",
        // Sempre à esquerda, nas duas larguras. Sem `gap`: título sobre
        // descrição é par de identidade, separado pela entrelinha do título.
        "flex w-full min-w-0 shrink-0 flex-col text-left",
        // Com o ícone, ele vai na linha do título e a descrição atravessa a
        // largura embaixo. Os seletores casam o sufixo do slot (`$=-media`,
        // `$=-title`) porque o `AlertDialogHeader` é este cabeçalho com slots
        // `alert-dialog-*`.
        "has-[>[data-slot$=-media]]:grid has-[>[data-slot$=-media]]:grid-cols-[auto_minmax(0,1fr)] has-[>[data-slot$=-media]]:gap-x-2",
        // Incondicionais: sem ícone o cabeçalho é flex, e `col-*` não faz nada.
        "[&>[data-slot$=-title]]:col-start-2",
        "[&>:not([data-slot$=-media]):not([data-slot$=-title])]:col-span-2",
        // Sem tinta: sobre a placa translúcida, um token opaco no topo da tira
        // aparece como banda. O corpo é irmão e se mascara sozinho, então o
        // fundo da tira já é a placa. Sem fio também (regra J).
        "group-data-[layout=fixed]/dialog-content:px-(--dialog-px)",
        "group-data-[layout=fixed]/dialog-content:pt-(--dialog-px)",
        "group-data-[layout=fixed]/dialog-content:pb-4",
        // Sem título (só a linha de controles: setas, ⋯, ×), o recuo de baixo
        // cai a 8: somado à rampa do corpo, os 16 deixavam uma faixa morta
        // sob os botões (detalhe do lançamento, 11/nov/2026).
        "group-data-[layout=fixed]/dialog-content:not-has-[[data-slot$=-title]]:pb-2",
        dialogHeaderVariants({ align }),
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

/**
 * O × como peça composta, não injeção. O `DialogContent` ainda insere um (um
 * diálogo é curto e o conteúdo não rola por baixo); na folha o cabeçalho é fixo
 * e o × flutuante some atrás dele, então o `SheetContent` não injeta.
 * `placement`: `floating` (canto da superfície, padrão) ou `inline` (no
 * `endAdornment` de um `DialogHeaderRow`). O botão mede 32 (`icon-md`, rodada
 * 318; era 28): o `-me-1.5` de `inline` compensa a caixa, mais larga que o
 * glifo, e o `-my-0.5` a centra no título (a linha do cabeçalho recua 3px, a
 * conta de 28); no canto, `top-2.5 right-2.5` deixa o glifo onde estava.
 */
const dialogCloseButtonVariants = cva("", {
  variants: {
    placement: {
      // Acima do cabeçalho translúcido (`z-index: 10`, `dialog-header-translucent`): atrás dele, o toque caía no cabeçalho.
      floating: "absolute top-2.5 right-2.5 z-20",
      inline: "-me-1.5 -my-0.5",
    },
  },
  defaultVariants: { placement: "floating" },
})

function DialogCloseButton({
  className,
  label = "Fechar",
  placement,
  ...props
}: React.ComponentProps<typeof Button> &
  VariantProps<typeof dialogCloseButtonVariants> & { label?: string }) {
  const { pending } = React.useContext(DialogEstadoContext)
  return (
    <DialogPrimitive.Close asChild>
      <Button
        data-slot="dialog-close-button"
        type="button"
        variant="tertiary"
        size="icon-md"
        disabled={pending || props.disabled}
        className={cn(dialogCloseButtonVariants({ placement }), className)}
        {...props}
      >
        <XMarkIcon />
        <span className="sr-only">{label}</span>
      </Button>
    </DialogPrimitive.Close>
  )
}

/**
 * O corpo que rola, entre um cabeçalho e um rodapé parados. As três classes são
 * obrigatórias: `flex-1` ocupa a sobra, `min-h-0` deixa o item de flex encolher
 * (sem ele o diálogo cresce até sair da tela, calado) e `overflow-y-auto` rola.
 * `overscroll-contain` impede a página atrás de rolar junto.
 */
/** A rampa quadrática da dissolução do corpo (ver `DialogBody`). */
const dialogBodyRampClassName =
  "[--scroll-fade-ramp:linear-gradient(to_bottom,rgb(0_0_0/0)_calc(var(--scroll-fade-top-h)_-_var(--scroll-fade-top-z)*1),rgb(0_0_0/0.016)_calc(var(--scroll-fade-top-h)_-_var(--scroll-fade-top-z)*0.875),rgb(0_0_0/0.06)_calc(var(--scroll-fade-top-h)_-_var(--scroll-fade-top-z)*0.75),rgb(0_0_0/0.14)_calc(var(--scroll-fade-top-h)_-_var(--scroll-fade-top-z)*0.625),rgb(0_0_0/0.25)_calc(var(--scroll-fade-top-h)_-_var(--scroll-fade-top-z)*0.5),rgb(0_0_0/0.39)_calc(var(--scroll-fade-top-h)_-_var(--scroll-fade-top-z)*0.375),rgb(0_0_0/0.56)_calc(var(--scroll-fade-top-h)_-_var(--scroll-fade-top-z)*0.25),rgb(0_0_0/0.77)_calc(var(--scroll-fade-top-h)_-_var(--scroll-fade-top-z)*0.125),#000_var(--scroll-fade-top-h),#000_var(--scroll-fade-bottom-y),rgb(0_0_0/0.77)_calc(var(--scroll-fade-bottom-y)_+_var(--scroll-fade-bottom-z)*0.125),rgb(0_0_0/0.56)_calc(var(--scroll-fade-bottom-y)_+_var(--scroll-fade-bottom-z)*0.25),rgb(0_0_0/0.39)_calc(var(--scroll-fade-bottom-y)_+_var(--scroll-fade-bottom-z)*0.375),rgb(0_0_0/0.25)_calc(var(--scroll-fade-bottom-y)_+_var(--scroll-fade-bottom-z)*0.5),rgb(0_0_0/0.14)_calc(var(--scroll-fade-bottom-y)_+_var(--scroll-fade-bottom-z)*0.625),rgb(0_0_0/0.06)_calc(var(--scroll-fade-bottom-y)_+_var(--scroll-fade-bottom-z)*0.75),rgb(0_0_0/0.016)_calc(var(--scroll-fade-bottom-y)_+_var(--scroll-fade-bottom-z)*0.875),rgb(0_0_0/0)_calc(var(--scroll-fade-bottom-y)_+_var(--scroll-fade-bottom-z)*1))]!"

function DialogBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      ref={useScrollFade()}
      data-slot="dialog-body"
      className={cn(
        "min-h-0 flex-1 overflow-y-auto overscroll-contain px-(--dialog-px) py-4",
        // No `layout="auto"` a placa já recua `--dialog-px`: o corpo sangra até
        // ela, senão o conteúdo recuaria em dobro (48px) e ficaria mais estreito
        // que o cabeçalho. O recuo dele continua, para o anel de foco não ser
        // cortado pelo `overflow`.
        "group-data-[layout=auto]/dialog-content:-mx-(--dialog-px)",
        // A dissolução das duas bordas no lugar dos fios, sem faixa nem camada
        // de borrão: cabeçalho e rodapé têm altura variável, e o conteúdo
        // dissolve na borda do próprio corpo. O piso é zero (não os 0,06 da
        // casa): a emenda com a tira não pinta nada, e com piso o texto que a
        // atravessa seria recortado em seco (invariante 6 em
        // `lib/scroll-fade-classes`). Traz também a folga de rolagem de 48px
        // para o campo focado perto da borda.
        scrollFadeViewportClassName,
        // A faixa da dissolução do corpo é de 24px (a da casa é 44), numa curva
        // quadrática (opacidade = distância da borda ao quadrado): bem fraca perto
        // da borda e cheia no fim da faixa. Com a sigmoide da casa, o fio de um
        // campo a 10px da borda ainda aparecia a ~30% e lia como uma divisória.
        // A faixa é `--dialog-body-fade-h` (24px por padrão): quem precisa de rampa
        // maior (o painel de notificações, com o corpo sob as abas) a declara num
        // ancestral. A de baixo pode ser outra, `--dialog-body-fade-end-h` (por
        // padrão a mesma): a rampa de cima do painel atravessa as abas e o dia, e a
        // de baixo, com a mesma altura, apagava 80px de lista.
        "[--scroll-fade-floor:0] [--scroll-fade-h:var(--dialog-body-fade-h,--spacing(6))]",
        "[--scroll-fade-end-h:var(--dialog-body-fade-end-h,var(--scroll-fade-h))]",
        // As paradas são frações da zona aberta (`--scroll-fade-top-z` e
        // `-bottom-z`, de `scroll-fade-y`): a rampa encolhe, não desliza.
        "[--scroll-fade-bottom-z:clamp(0px,var(--scroll-fade-end,0px),var(--scroll-fade-bottom-max,var(--scroll-fade-end-h)))]!",
        dialogBodyRampClassName,
        className
      )}
      {...props}
    />
  )
}

/**
 * O rodapé: uma tira na borda de baixo, nos dois layouts. O recuo negativo sai
 * da mesma variável do recuo positivo e só existe no layout que tem recuo. Com
 * `translucent` (o padrão), no `layout="fixed"` o corpo rola por trás dele, sob
 * a placa e o degradê que só aparecem com conteúdo embaixo; fora disso, sem
 * tingido: o peso dos botões já separa o rodapé. `start` é a ação do outro lado
 * ("Excluir", "Voltar"), à esquerda no desktop e embaixo de tudo no telefone.
 */
function DialogFooter({
  className,
  showCloseButton = false,
  start,
  translucent = true,
  children,
  ref,
  ...props
}: React.ComponentProps<"div"> & {
  showCloseButton?: boolean
  start?: React.ReactNode
  /**
   * O corpo rola por trás do rodapé, o espelho do cabeçalho translúcido: a
   * mesma placa a 95% e o degradê de 56px, subindo (rodada 382, 17/11/2026).
   * Vale no `layout="fixed"` com o `DialogBody` logo antes (irmão, ou os dois
   * no mesmo `form`). `false` é a saída.
   */
  translucent?: boolean
}) {
  const [tira, medir] = useAlturaPublicada("--dialog-footer-h", translucent)
  usePlacaPorRolagem(tira, translucent, "pe")
  return (
    <div
      ref={useComposedRefs(ref, medir)}
      data-slot="dialog-footer"
      data-translucent={translucent || undefined}
      className={cn(
        translucent && "dialog-footer-translucent",
        // Sem fio, nem aqui nem no cabeçalho: o diálogo é uma superfície só, e
        // o que separa as faixas é a dissolução (com rolagem) ou o respiro.
        "flex shrink-0 flex-col-reverse gap-2",
        // O par do cabeçalho: sem tinta.
        "-mx-(--dialog-bleed) -mb-(--dialog-bleed)",
        "px-(--dialog-px) py-4 sm:flex-row sm:justify-end",
        // No dedo os botões do rodapé sobem a 40, o piso de toque da casa (a
        // pergunta é sobre o apontador).
        "pointer-coarse:[&_button]:min-h-11",
        className
      )}
      {...props}
    >
      {start ? (
        <div
          data-slot="dialog-footer-start"
          className="flex flex-col-reverse gap-2 sm:me-auto sm:flex-row"
        >
          <TresAcoesContext.Provider value={false}>{start}</TresAcoesContext.Provider>
        </div>
      ) : null}
      {/* Três ações juntas, três pesos: com a da esquerda, o Cancelar
          (`tertiary`) das outras duas sobe a `secondary`. */}
      <TresAcoesContext.Provider
        value={Boolean(start) && contarAcoes(children) + (showCloseButton ? 1 : 0) >= 2}
      >
        {/* Cancelar vem antes da ação: à esquerda no desktop e, com o
            `flex-col-reverse`, embaixo no telefone. */}
        {showCloseButton && (
          <DialogClose asChild>
            <Button type="button" variant="tertiary">
              Cancelar
            </Button>
          </DialogClose>
        )}
        {children}
      </TresAcoesContext.Provider>
    </div>
  )
}

/** A tinta do título, dividida com o `AlertDialogTitle`. */
const dialogTitleClassName = cn(
  // `leading-snug`: sem `gap` no cabeçalho, a entrelinha separa o título da descrição.
  "min-w-0 font-heading text-base leading-snug font-medium text-balance",
  // O × é `absolute` e não reserva lugar: sem isto um título longo passa por
  // baixo dele. A conta é uma só nos dois layouts porque a caixa do cabeçalho
  // sempre termina a `--dialog-px` da borda; sobra o que o × avança além disso.
  DIALOG_CLOSE_RESERVE,
  // Dentro de `DialogHeaderRow` quem reserva é a coluna do adorno.
  "in-data-[slot=dialog-header-row]:pe-0",
  // Na gaveta, o título solto no cabeçalho (sem `DialogHeaderRow`) sobe à linha do ✕ do
  // canto e fica no centro dela, numa linha só, com 52px livres de cada lado (dono, 17/11/2026).
  "max-md:[[data-slot=sheet-content]_[data-slot=dialog-header]>&]:-mt-8 max-md:[[data-slot=sheet-content]_[data-slot=dialog-header]>&]:px-13 max-md:[[data-slot=sheet-content]_[data-slot=dialog-header]>&]:leading-11 max-md:[[data-slot=sheet-content]_[data-slot=dialog-header]>&]:truncate max-md:[[data-slot=sheet-content]_[data-slot=dialog-header]>&]:text-center max-md:[[data-slot=sheet-content]_[data-slot=dialog-header]>&]:font-semibold"
)

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn(dialogTitleClassName, className)}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  // A primitiva fica por fora: ela escreve o `id` do `aria-describedby`.
  return (
    <DialogPrimitive.Description asChild data-slot="dialog-description" {...props}>
      <Muted
        className={cn(
          "min-w-0 text-pretty *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-foreground *:[a]:active:text-foreground",
          className
        )}
      >
        {children}
      </Muted>
    </DialogPrimitive.Description>
  )
}

/**
 * O ícone do cabeçalho. `inline` (o padrão): na linha do título, na cor dele,
 * sem poço. `well`: o poço de 56px acima do título, com 12px embaixo, para o
 * cabeçalho centrado; a superfície e a tinta são o par `-muted` do `tone`. No
 * poço o ícone mede 24: passe o `24/outline`. Vai antes do título.
 */
const dialogMediaVariants = cva("col-start-1 flex shrink-0 self-center", {
  variants: {
    variant: {
      inline: "text-foreground [&>svg]:size-4",
      well: "mb-3 size-14 items-center justify-center rounded-full [&>svg]:size-6",
    },
    tone: {
      default: "",
      destructive: "",
      success: "",
      warning: "",
    },
  },
  compoundVariants: [
    { variant: "well", tone: "default", className: "bg-muted text-muted-foreground" },
    { variant: "well", tone: "destructive", className: "bg-destructive-muted text-destructive-muted-foreground" },
    { variant: "well", tone: "success", className: "bg-success-muted text-success-muted-foreground" },
    { variant: "well", tone: "warning", className: "bg-warning-muted text-warning-muted-foreground" },
  ],
  defaultVariants: { variant: "inline", tone: "default" },
})

function DialogMedia({
  className,
  variant,
  tone,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof dialogMediaVariants>) {
  return (
    <span
      data-slot="dialog-media"
      data-variant={variant ?? "inline"}
      aria-hidden
      className={cn(dialogMediaVariants({ variant, tone }), className)}
      {...props}
    />
  )
}

/**
 * Os passos. `bar` (o padrão): "Passo 2 de 3" com a barra segmentada, antes do
 * título; com ela um diálogo `fixed` ocupa o teto, e a janela não pula.
 * `dots`: uma fileira de pílulas centrada, sem barra nem texto à vista (o
 * "Passo N de M · nome" fica como nome acessível), e vai DEPOIS da descrição
 * num `DialogHeader align="center"`.
 */
function DialogSteps({
  current,
  total,
  labels,
  variant = "bar",
  className,
}: {
  /** O passo atual, a partir de 0. */
  current: number
  total: number
  /** O nome de cada passo, mostrado ao lado da contagem. */
  labels?: string[]
  variant?: "bar" | "dots"
  className?: string
}) {
  const nome = labels?.[current]
  const texto = `Passo ${current + 1} de ${total}${nome ? ` · ${nome}` : ""}`
  if (variant === "dots") {
    return (
      <div
        data-slot="dialog-steps"
        data-variant="dots"
        role="img"
        aria-label={texto}
        className={cn("flex items-center justify-center gap-1.5 pt-3", className)}
      >
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className={cn(
              "h-1.5 rounded-full transition-[width,background-color] duration-(--duration-fast) ease-(--ease-out) motion-reduce:transition-none",
              i === current ? "w-4 bg-foreground" : "w-1.5 bg-foreground/20"
            )}
          />
        ))}
      </div>
    )
  }
  return (
    <div
      data-slot="dialog-steps"
      data-variant="bar"
      // Desvia do × como o título: a barra é a primeira linha do cabeçalho.
      className={cn("flex flex-col gap-1.5 pb-3", DIALOG_CLOSE_RESERVE, className)}
    >
      <Progress
        value={((current + 1) / total) * 100}
        segments={total}
        size="sm"
        aria-label={texto}
      />
      <p className="text-xs text-muted-foreground nums" aria-hidden>
        {texto}
      </p>
    </div>
  )
}

export {
  useRevelacao,
  // A pergunta de descarte; o `Sheet` a faz por `usePedidoDeFechar`.
  ConfirmarDescarte,
  Dialog,
  DialogBody,
  DialogClose,
  DialogCloseButton,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogHeaderRow,
  useDialogHeaderDock,
  DialogMedia,
  DialogOverlay,
  DialogPortal,
  DialogSteps,
  DialogTitle,
  DialogTrigger,
  DIALOG_OVERLAY_CLASS,
  overlayClassName,
  dialogContentVariants,
  dialogTitleClassName,
  // O pedido de fechar, que o `Sheet` também faz.
  usePedidoDeFechar,
  // O link que fecha antes de abrir a tela, que o `Sheet` também faz.
  NavegarFechandoContext,
  useLinkQueFecha,
}
