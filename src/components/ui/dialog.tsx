"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { cva, type VariantProps } from "class-variance-authority"
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
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
import { overlayClassName } from "@/components/ui/drawer"

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
 * A placa veste `modalSurfaceClassName` (`--background` a 85%, 40% no escuro),
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
    // O teto de altura do `fixed` vai em variável, para uma tela alta subi-lo.
    "[--dialog-max-h:min(90dvh,36rem)]",
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
          // Com passos a janela ocupa o teto e quem rola é o corpo.
          "has-[[data-slot=dialog-steps]]:h-(--dialog-max-h)",
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
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> &
  VariantProps<typeof dialogContentVariants> & {
    showCloseButton?: boolean
  }) {
  const { gaveta, pending } = React.useContext(DialogEstadoContext)
  const aoClicarLink = useLinkQueFecha(onClickCapture)
  const revelacao = useRevelacao(onAnimationEnd)

  // No telefone, com `surface="auto"`: a gaveta do `Sheet`. A gaveta alta é a
  // do formulário (`fixed`), a da tela cheia e a dos passos (esta por classe,
  // porque só o DOM sabe que há passos).
  if (gaveta) {
    return (
      <SheetContent
        ref={ref}
        onClickCapture={onClickCapture}
        fillMobileViewport={layout === "fixed" || size === "full"}
        onAnimationEnd={onAnimationEnd}
        aria-busy={pending || undefined}
        className={cn(
          "has-[[data-slot=dialog-steps]]:h-(--drawer-h)",
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
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        onClickCapture={aoClicarLink}
        data-slot="dialog-content"
        data-layout={layout ?? "auto"}
        aria-busy={pending || undefined}
        {...revelacao}
        className={cn(
          dialogContentVariants({ size, layout }),
          showCloseButton && "[--dialog-close:--spacing(11)]",
          // Um `DialogCloseButton` composto também reserva, como no `Sheet`.
          "has-[>[data-slot=dialog-close-button]]:[--dialog-close:--spacing(11)]",
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
  endAdornment,
}: React.ComponentProps<"div"> & {
  endAdornment?: React.ReactNode
}) {
  return (
    <div
      data-slot="dialog-header-row"
      className={cn(
        "grid w-full min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-3",
        className
      )}
    >
      <div className="min-w-0">{children}</div>
      {endAdornment != null ? (
        <div className={cn("-my-0.75 flex shrink-0 items-center gap-1", DIALOG_CLOSE_RESERVE)}>
          {endAdornment}
        </div>
      ) : null}
    </div>
  )
}

/**
 * O cabeçalho. Sem fio: o que o separa do corpo é o respiro, e a dissolução
 * onde há rolagem. `shrink-0` e o recuo vêm de fábrica; em `layout="auto"` o
 * casco já dá o recuo, então aqui ele é zero.
 */
function DialogHeader({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn(
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
 * `endAdornment` de um `DialogHeaderRow`). O `-me-1` de `inline` compensa a
 * caixa do botão, mais larga que o glifo.
 */
const dialogCloseButtonVariants = cva("", {
  variants: {
    placement: {
      floating: "absolute top-3 right-3",
      inline: "-me-1",
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
        size="icon-sm"
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
  "[--scroll-fade-ramp:linear-gradient(to_bottom,rgb(0_0_0/0)_calc(var(--scroll-fade-top-h)_-_var(--scroll-fade-h)*1),rgb(0_0_0/0.016)_calc(var(--scroll-fade-top-h)_-_var(--scroll-fade-h)*0.875),rgb(0_0_0/0.06)_calc(var(--scroll-fade-top-h)_-_var(--scroll-fade-h)*0.75),rgb(0_0_0/0.14)_calc(var(--scroll-fade-top-h)_-_var(--scroll-fade-h)*0.625),rgb(0_0_0/0.25)_calc(var(--scroll-fade-top-h)_-_var(--scroll-fade-h)*0.5),rgb(0_0_0/0.39)_calc(var(--scroll-fade-top-h)_-_var(--scroll-fade-h)*0.375),rgb(0_0_0/0.56)_calc(var(--scroll-fade-top-h)_-_var(--scroll-fade-h)*0.25),rgb(0_0_0/0.77)_calc(var(--scroll-fade-top-h)_-_var(--scroll-fade-h)*0.125),#000_var(--scroll-fade-top-h),#000_var(--scroll-fade-bottom-y),rgb(0_0_0/0.77)_calc(var(--scroll-fade-bottom-y)_+_var(--scroll-fade-h)*0.125),rgb(0_0_0/0.56)_calc(var(--scroll-fade-bottom-y)_+_var(--scroll-fade-h)*0.25),rgb(0_0_0/0.39)_calc(var(--scroll-fade-bottom-y)_+_var(--scroll-fade-h)*0.375),rgb(0_0_0/0.25)_calc(var(--scroll-fade-bottom-y)_+_var(--scroll-fade-h)*0.5),rgb(0_0_0/0.14)_calc(var(--scroll-fade-bottom-y)_+_var(--scroll-fade-h)*0.625),rgb(0_0_0/0.06)_calc(var(--scroll-fade-bottom-y)_+_var(--scroll-fade-h)*0.75),rgb(0_0_0/0.016)_calc(var(--scroll-fade-bottom-y)_+_var(--scroll-fade-h)*0.875),rgb(0_0_0/0)_calc(var(--scroll-fade-bottom-y)_+_var(--scroll-fade-h)*1))]!"

function DialogBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      ref={useScrollFade()}
      data-slot="dialog-body"
      className={cn(
        "min-h-0 flex-1 overflow-y-auto overscroll-contain px-(--dialog-px) py-4",
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
        "[--scroll-fade-floor:0] [--scroll-fade-h:--spacing(6)]",
        dialogBodyRampClassName,
        className
      )}
      {...props}
    />
  )
}

/**
 * O rodapé: uma tira na borda de baixo, nos dois layouts. O recuo negativo sai
 * da mesma variável do recuo positivo e só existe no layout que tem recuo. Sem
 * tingido: o peso dos botões já separa o rodapé. `start` é a ação do outro lado
 * ("Excluir", "Voltar"), à esquerda no desktop e embaixo de tudo no telefone.
 */
function DialogFooter({
  className,
  showCloseButton = false,
  start,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  showCloseButton?: boolean
  start?: React.ReactNode
}) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        // Sem fio, nem aqui nem no cabeçalho: o diálogo é uma superfície só, e
        // o que separa as faixas é a dissolução (com rolagem) ou o respiro.
        "flex shrink-0 flex-col-reverse gap-2",
        // O par do cabeçalho: sem tinta.
        "-mx-(--dialog-bleed) -mb-(--dialog-bleed)",
        "px-(--dialog-px) py-4 sm:flex-row sm:justify-end",
        // No dedo os botões do rodapé sobem a 40, o piso de toque da casa (a
        // pergunta é sobre o apontador).
        "pointer-coarse:[&_button]:min-h-10",
        className
      )}
      {...props}
    >
      {start ? (
        <div
          data-slot="dialog-footer-start"
          className="flex flex-col-reverse gap-2 sm:me-auto sm:flex-row"
        >
          {start}
        </div>
      ) : null}
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
  "in-data-[slot=dialog-header-row]:pe-0"
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

/** O ícone do título, na linha dele e na cor dele, sem poço. Vai dentro do `DialogHeader`, antes do título. */
function DialogMedia({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="dialog-media"
      aria-hidden
      className={cn(
        "col-start-1 flex shrink-0 self-center text-foreground [&>svg]:size-4",
        className
      )}
      {...props}
    />
  )
}

/**
 * "Passo 2 de 3", com a barra segmentada. Vai dentro do `DialogHeader`, antes
 * do título. Com ela um diálogo `fixed` ocupa o teto, e a janela não pula.
 */
function DialogSteps({
  current,
  total,
  labels,
  className,
}: {
  /** O passo atual, a partir de 0. */
  current: number
  total: number
  /** O nome de cada passo, mostrado ao lado da contagem. */
  labels?: string[]
  className?: string
}) {
  const nome = labels?.[current]
  const texto = `Passo ${current + 1} de ${total}${nome ? ` · ${nome}` : ""}`
  return (
    <div
      data-slot="dialog-steps"
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
