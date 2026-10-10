"use client"

import * as React from "react"
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

/**
 * O recuo que desvia do botão de fechar.
 *
 * `--dialog-close` é o território do × medido da borda do diálogo, e
 * `--dialog-px` é onde a caixa do cabeçalho termina. A diferença é o quanto
 * ainda falta desviar — zero quando não há × para desviar.
 *
 * Ele desvia de um lado só porque o cabeçalho é alinhado à esquerda nas duas
 * larguras. Enquanto ele era centralizado no telefone, o recuo precisava ser
 * simétrico — um recuo de um lado só tirava o título do eixo em 10px, medidos,
 * enquanto a descrição ficava no lugar.
 *
 * A classe é escrita por extenso, e não montada a partir de uma constante com a
 * medida: o Tailwind varre o **texto** do fonte atrás de candidatos, e uma
 * classe interpolada num template literal não existe para ele — sairia daqui
 * como string e não sairia do CSS como regra.
 */
const DIALOG_CLOSE_RESERVE =
  "pe-[max(0px,calc(var(--dialog-close)-var(--dialog-px)))]"

/**
 * ## Rodada 211
 *
 * - **`surface="auto"`**: abaixo de 768px o diálogo vira a gaveta do `Sheet`
 *   (arrastável, com a área segura), com a mesma API — gatilho, conteúdo,
 *   fechar e cromagem. Dezessete telas escreviam o par `Dialog`/`Sheet` à mão,
 *   cada uma com um `if (isMobile)` e as classes da folha em três grafias. É
 *   possível pelo mesmo motivo que a cromagem serve os dois: as três
 *   superfícies são a mesma primitiva do Radix.
 * - **`pending`**: enquanto salva, Esc, véu, ×, Cancelar e o arraste da gaveta
 *   não fecham, e o casco marca `aria-busy` — o `pending` do `AlertDialog`,
 *   que já segurava o Esc. O botão de enviar continua sendo o `FormSubmit`.
 * - **`dirty` + `confirmDiscard`**: fechar um formulário alterado pergunta
 *   "Descartar alterações?" antes. A pergunta usa a primitiva do Radix, e não o
 *   `AlertDialog` da casa, porque ele importa este arquivo.
 * - **`DialogSteps`**, **`DialogMedia`**, **`DialogFooter start`** e
 *   **`size="full"`**: ver cada peça.
 * - **O título e a descrição deixaram de ter `gap`** — par de identidade, a
 *   regra da casa. Quem os separa é a entrelinha do título (`leading-snug`).
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
  const controlado = openProp !== undefined
  const [interno, setInterno] = React.useState(defaultOpen ?? false)
  const open = controlado ? openProp : interno
  const [perguntando, setPerguntando] = React.useState(false)

  const mudar = (proximo: boolean) => {
    if (!controlado) setInterno(proximo)
    onOpenChange?.(proximo)
  }
  // Todo pedido de fechar passa por aqui: Esc, véu, ×, `DialogClose` e o
  // arraste da gaveta. Fechar por fora — o `open` que a tela controla — não.
  const pedir = (proximo: boolean) => {
    if (proximo) return mudar(true)
    if (pending) return
    if (dirty && confirmDiscard) {
      setPerguntando(true)
      return
    }
    mudar(false)
  }

  const estado = React.useMemo(() => ({ gaveta, pending }), [gaveta, pending])
  const textos = typeof confirmDiscard === "object" ? confirmDiscard : {}

  return (
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
      {confirmDiscard ? (
        <ConfirmarDescarte
          open={perguntando}
          onOpenChange={setPerguntando}
          title={textos.title}
          description={textos.description}
          onDiscard={() => {
            setPerguntando(false)
            mudar(false)
          }}
        />
      ) : null}
    </DialogEstadoContext.Provider>
  )
}

/**
 * "Descartar alterações?" — a confirmação de fechar um formulário alterado.
 * Mora na camada da folha (`--z-sheet`) e depois dela no DOM, para ficar por
 * cima tanto de um diálogo quanto de uma gaveta. Esc fecha só ela.
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
          className="fixed inset-0 z-(--z-sheet) bg-overlay animation-duration-(--duration-base) data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0"
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

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        "fixed inset-0 isolate z-(--z-modal) bg-overlay animation-duration-(--duration-slow) ease-(--ease-out) supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
        className
      )}
      {...props}
    />
  )
}

/**
 * A moldura do diálogo.
 *
 * A versão anterior descrevia **um** diálogo, e o app constrói **dois**. Treze
 * das quinze chamadas com `className` abriam com a mesma string para desmontar
 * o que vinha de fábrica — `flex flex-col gap-0 overflow-hidden p-0
 * sm:max-w-md`, mais um teto de altura em `min(90dvh, 36rem)`.
 *
 * E o que elas montavam no lugar não existia aqui: **32 corpos roláveis**
 * escritos à mão (`min-h-0 flex-1 overflow-y-auto`), **16 cabeçalhos** que
 * precisam dizer `shrink-0 px-6` toda vez, em cinco grafias, e um rodapé que
 * sete chamadas anulavam com `mx-0 mb-0 mt-0` — porque o `-mx-4 -mb-4` daqui
 * pressupunha um `p-4` no casco, e o casco delas é `p-0`. (Contado na rodada
 * 211: nenhuma chamada anula mais o rodapé.)
 *
 * Então o eixo virou o que as telas já separavam: **`layout`**.
 *
 * - `auto` — a altura vem do conteúdo. Confirmação curta, um campo, um aviso.
 * - `fixed` — a altura é teto, e o corpo rola entre um cabeçalho e um rodapé
 *   parados. É o formulário em diálogo — 14 dos 18 diálogos do app, contados
 *   na rodada 211.
 *
 * E **`size`** deixou de ser um `sm:max-w-*` escrito na tela: o padrão é `md`,
 * que é o que 17 das 19 chamadas explícitas pediam e o que o `AlertDialog` já
 * usava. Os dois gêmeos passam a medir igual.
 *
 * ## A placa é `--background` de vidro, e o véu é quem mais borra
 *
 * Ela veste `modalSurfaceClassName`: `--background` a 85%, 40% no escuro onde o
 * borrão existe, com o material do iOS — mais aberta que a flutuante (`--popover` a 60%),
 * porque a 60% sobre a página ela lia como fosca. Uma rodada a levou a `--popover` para
 * igualar o DatePicker, e a tela reprovou: a 60% sobre a página velada o
 * `--popover` compõe acima de tudo que está atrás e a placa lê como opaca. O
 * `--background` afunda no véu, e é o borrão que a distingue (ver
 * `lib/glass-classes`).
 *
 * O `backdrop-filter` renderiza aqui, e o que ele vê é o `--overlay` a 40% mais
 * a página: medido, delta 0 sobre um card, 2 sobre a página, 15 sobre um botão
 * `primary`. Só cor cheia atrás faz o vidro aparecer; quem quiser o efeito mais
 * visível mexe no véu (rodada 52c), e não aqui.
 *
 * Houve uma rodada em que a placa ficou opaca por uma medição errada — capturas
 * cedo demais e uma comparação viciada concluíram que o borrão não renderizava
 * nos poppers. Refeita limpa, a medição disse o contrário; a história está em
 * `lib/menu-classes`.
 */
/**
 * O ponto do último clique (rodada 248): é de onde o diálogo nasce e para onde
 * ele volta. Um ouvinte só, em captura na janela, registrado ao carregar o
 * módulo — o clique que abre o diálogo acontece antes de ele montar. Dentro de
 * uma moldura do catálogo (um iframe) o clique é de outra janela, e o diálogo
 * nasce do centro.
 */
let ultimoClique: { x: number; y: number; t: number } | null = null
if (typeof window !== "undefined") {
  window.addEventListener(
    "pointerdown",
    (e) => {
      ultimoClique = { x: e.clientX, y: e.clientY, t: e.timeStamp }
    },
    { capture: true, passive: true }
  )
}

/**
 * Escreve `--dialog-origin` no casco: o ponto do clique, nas coordenadas da
 * caixa dele. Sem clique recente (o teclado, o código), nada — o centro. Uma
 * vez por casco, porque o Radix recompõe a `ref` a cada render. A escala de
 * entrada já vale quando a `ref` chega, mas em volta do centro (a origem ainda
 * não existe): o centro medido é o da caixa, e o canto sai do `offsetWidth`.
 */
function useOrigemDoClique() {
  const feito = React.useRef<HTMLElement | null>(null)
  return React.useCallback((el: HTMLElement | null) => {
    if (!el || el === feito.current) return
    feito.current = el
    const clique = ultimoClique
    if (!clique || performance.now() - clique.t > 1000) return
    const caixa = el.getBoundingClientRect()
    const x = clique.x - (caixa.left + caixa.width / 2 - el.offsetWidth / 2)
    const y = clique.y - (caixa.top + caixa.height / 2 - el.offsetHeight / 2)
    el.style.setProperty("--dialog-origin", `${Math.round(x)}px ${Math.round(y)}px`)
  }, [])
}

/** Junta a `ref` de quem chama com a do casco. */
function juntarRefs<T>(...refs: (React.Ref<T> | undefined)[]) {
  return (el: T | null) => {
    for (const r of refs) {
      if (typeof r === "function") r(el)
      else if (r) (r as React.RefObject<T | null>).current = el
    }
  }
}

const dialogContentVariants = cva(
  [
    "group/dialog-content fixed top-1/2 left-1/2 z-(--z-modal)",
    "w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2",
    "rounded-modal text-sm shadow-lg ring-1 ring-foreground/10 outline-none [--radius-parent:var(--radius-modal)] [--radius-inset:var(--dialog-px)]",
    // A placa é o material da casa, e o alfa é o mesmo par das superfícies
    // flutuantes — a receita fica igual em todo overlay do sistema. Ver o
    // bloco do doc-comment acima para o que o véu limita.
    modalSurfaceClassName,
    // **Nasce de onde se clicou** (rodada 248, `@utility dialog-sprout`): a
    // origem é o ponto do clique que o abriu (`--dialog-origin`, escrito pelo
    // `useOrigemDoClique`), e fechar volta a ele. Era o zoom genérico de 95%.
    "dialog-sprout",
    // O recuo do diálogo é **um**, e são os 24px que vinte chamadas já
    // escreviam à mão como `px-6`. Ninguém escolheu os 16 anteriores: eles eram
    // o que sobrava para quem não sobrescrevia.
    "[--dialog-px:--spacing(6)]",
    // O teto de altura do `fixed`, na variável, para uma tela alta poder subi-lo
    // sem reescrever a cadeia de flex que o acompanha.
    "[--dialog-max-h:min(90dvh,36rem)]",
    // Quanto território o × ocupa a partir da borda direita: 12 de folga + 28
    // de botão + 4 de respiro. Zero quando não há × — e é o caso do
    // `AlertDialog`, que herda esta mesma régua e nunca mostra um.
    "[--dialog-close:0px]",
  ],
  {
    variants: {
      size: {
        sm: "sm:max-w-sm",
        md: "sm:max-w-md",
        lg: "sm:max-w-lg",
        xl: "sm:max-w-xl",
        // Tela cheia (rodada 211): a janela com 2rem de margem, para conteúdo
        // largo. Com `fixed` a altura é a da janela, e não o teto.
        full: "sm:max-w-[calc(100%-4rem)] [--dialog-max-h:calc(100dvh-2rem)] sm:[--dialog-max-h:calc(100dvh-4rem)]",
      },
      layout: {
        // `--dialog-bleed` é quanto o rodapé precisa recuar para alcançar a
        // borda. Ele é uma **variável**, e não uma regra `group-data-*`, para
        // quem anular o rodapé com `mx-0` vencer por `tailwind-merge` — as
        // duas classes disputam a mesma propriedade.
        auto: "grid gap-4 p-(--dialog-px) [--dialog-bleed:--spacing(6)]",
        fixed: [
          "flex max-h-(--dialog-max-h) flex-col gap-0 overflow-hidden p-0 [--dialog-bleed:0px]",
          // Com passos, a janela não muda de altura de um passo para outro:
          // ela ocupa o teto, e quem rola é o corpo.
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

function DialogContent({
  className,
  children,
  size,
  layout,
  showCloseButton = true,
  ref,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> &
  VariantProps<typeof dialogContentVariants> & {
    showCloseButton?: boolean
  }) {
  const { gaveta, pending } = React.useContext(DialogEstadoContext)
  const origem = useOrigemDoClique()

  // No telefone, com `surface="auto"`: a gaveta do `Sheet`. A largura não
  // vale ali, e a gaveta alta é a do formulário (`fixed`), a da tela cheia e a
  // dos passos — esta por classe, porque só o DOM sabe que há passos.
  if (gaveta) {
    return (
      <SheetContent
        ref={ref}
        fillMobileViewport={layout === "fixed" || size === "full"}
        aria-busy={pending || undefined}
        className={cn(
          "has-[[data-slot=dialog-steps]]:h-(--sheet-drawer-h)",
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
        ref={juntarRefs(ref, origem)}
        data-slot="dialog-content"
        data-layout={layout ?? "auto"}
        aria-busy={pending || undefined}
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

/** Title + description row with optional trailing control (e.g. close). Use inside `DialogHeader`. */
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
        <div className={cn("shrink-0", DIALOG_CLOSE_RESERVE)}>
          {endAdornment}
        </div>
      ) : null}
    </div>
  )
}

/**
 * O cabeçalho. Sem fio: o que o separa do corpo é o respiro, e a dissolução
 * quando há rolagem.
 *
 * `shrink-0` e o recuo passaram a vir de fábrica: eram exatamente as duas
 * coisas que as 16 chamadas escreviam toda vez (`shrink-0 px-6 pt-6 pb-2`), em
 * cinco grafias que divergiam no pé.
 *
 * No `layout="auto"` o casco já dá o recuo, então aqui ele é zero — senão o
 * título entraria 48px.
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
        // Sempre à esquerda. `text-center sm:text-left` centralizava o título
        // no telefone — e dentro de um `DialogHeaderRow`, que é uma grade de
        // duas colunas, ele centralizava numa coluna de 188px que termina a
        // 131px da borda direita: um eixo que não é o de nada. Um cabeçalho
        // de diálogo é o mesmo cabeçalho nas duas larguras.
        // **Sem `gap`** (rodada 211): título sobre descrição é par de
        // identidade, e quem os separa é a entrelinha do título. Os passos
        // trazem o próprio respiro.
        "flex w-full min-w-0 shrink-0 flex-col text-left",
        // Com o ícone, ele vai na linha do título e a descrição atravessa a
        // largura embaixo — a grade do `AlertDialogHeader`.
        "has-[>[data-slot=dialog-media]]:grid has-[>[data-slot=dialog-media]]:grid-cols-[auto_minmax(0,1fr)] has-[>[data-slot=dialog-media]]:gap-x-2",
        // Incondicionais, como no `AlertDialogHeader`: sem ícone o cabeçalho é
        // flex, e `col-*` não faz nada nele.
        "[&>[data-slot=dialog-title]]:col-start-2",
        "[&>:not([data-slot=dialog-media]):not([data-slot=dialog-title])]:col-span-2",
        // **Sem tinta, e o motivo é medido.** A tira chegou a pintar um degradê
        // (`from-popover` → transparente) para "a cor cheia encostar na
        // dissolução". Sobre a placa translúcida isso é impossível: a placa é
        // translúcida a 60% sobre o véu, e um token opaco no topo da tira é
        // **mais claro** que ela — a faixa aparecia como banda na gaveta.
        // Cor com alfa não tem "cor cheia" pintável sem empilhar. E a tira não
        // precisa de tinta: o corpo é irmão dela e se mascara sozinho, então o
        // fundo da tira **já é** a placa. Sem fio também — regra **J**.
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
 * O × — **uma peça, não uma injeção**.
 *
 * O `DialogContent` ainda insere um por conta própria, e ali a conveniência se
 * paga: um diálogo é curto, o conteúdo não rola por baixo do botão, e só 6 das
 * 25 chamadas o desligam. Na folha a conta se inverte — **16 das 36 desligam**,
 * porque lá o cabeçalho é fixo e o × flutuante desaparece atrás dele assim que
 * a pessoa rola. Por isso o `SheetContent` deixou de injetar, e quem quer o
 * botão o compõe.
 *
 * Funciona nos dois porque é a mesma primitiva do Radix.
 *
 * **`placement` é onde ele pousa**, e o eixo nasceu de contagem: `floating` é o
 * canto da superfície, o caso comum e o padrão; `inline` é dentro do cabeçalho,
 * no `endAdornment` de um `DialogHeaderRow`. Numa folha de formulário o
 * flutuante desaparece atrás do cabeçalho fixo assim que a pessoa rola, e por
 * isso 9 telas montavam o botão à mão ali — 5 pelo
 * `MobileSheetFormHeaderCloseButton`, que existia só para isso, e 4 escrevendo
 * `Close` + `Button` + ícone por extenso. Com o eixo, a peça é uma só.
 *
 * O `-me-1` de `inline` é o recuo negativo que aquele componente trazia, na
 * forma lógica: a caixa do botão é mais larga que o glifo, e sem ele o × fica
 * visualmente afastado da borda do cabeçalho.
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
 * O corpo que rola, entre um cabeçalho e um rodapé parados.
 *
 * São 32 regiões `min-h-0 flex-1 overflow-y-auto` escritas à mão no app — e
 * cada uma das três classes é obrigatória por um motivo que não se lembra
 * sozinho: `flex-1` para ocupar a sobra, `min-h-0` porque sem ele um item de
 * flex não encolhe abaixo do conteúdo e a rolagem nunca aparece, e
 * `overflow-y-auto` para rolar. Esquecer o do meio é o erro clássico, e ele
 * falha calado: o diálogo simplesmente cresce até sair da tela.
 *
 * `overscroll-contain` é o que impede a página atrás de rolar junto quando o
 * corpo chega ao fim — no telefone, sem ele, o gesto vaza para o documento.
 */
function DialogBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      ref={useScrollFade()}
      data-slot="dialog-body"
      className={cn(
        "min-h-0 flex-1 overflow-y-auto overscroll-contain px-(--dialog-px) py-4",
        // A dissolução das duas bordas, **no lugar dos dois fios** — e nada
        // mais: sem faixa, sem sangramento, sem camada de borrão. É o modo sem
        // faixa: o cabeçalho e o rodapé têm altura variável (título com ou sem
        // descrição, botões que empilham no telefone), e o conteúdo dissolve na
        // borda do próprio corpo, nos 44px de todo componente da casa.
        //
        // **O piso aqui é zero, e não os 0,06 da casa.** A borda do corpo é a
        // emenda com a tira, e a tira não pinta nada (sobre a placa translúcida,
        // tinta vira banda). Com piso 0,06 o texto que atravessa a borda sai a
        // 6–15% e é **recortado em seco** ali — uma linha nítida logo abaixo do
        // título, medida. A zero o recorte cai em alfa zero e não existe. Os
        // 0,06 servem à paleta, onde a ponta precisa dizer "há mais" sob um
        // campo; aqui quem diz isso é a dissolução, e a emenda tem de sumir.
        //
        // Três rodadas tentaram somar o borrão do iOS aqui (sobra, faixa
        // medida, faixa + material) e as três viraram um retângulo de tom —
        // ver a invariante 6 em `lib/scroll-fade-classes`.
        //
        // Ele também traz a folga de rolagem, bem-vinda num formulário: um
        // campo que ganha foco perto da borda para 48px dentro, fora da zona.
        scrollFadeViewportClassName,
        "[--scroll-fade-floor:0]",
        className
      )}
      {...props}
    />
  )
}

/**
 * O rodapé — uma tira encostada na borda de baixo, nos dois layouts.
 *
 * O `-mx-4 -mb-4` anterior era um recuo negativo fixo, calculado para um `p-4`
 * que a forma dominante do app não usa: em `p-0`, ele arrancava o rodapé para
 * fora do diálogo. Daí as sete chamadas com `mx-0 mb-0 mt-0` — telas anulando
 * o componente para poder usá-lo.
 *
 * Agora o recuo negativo sai da mesma variável do recuo positivo e **só existe
 * no layout que tem recuo**. Em `fixed` o casco é `p-0` e não há o que anular.
 *
 * O tingido também saiu. Era `bg-muted/50`, e sete das nove chamadas o
 * trocavam por `bg-background`: o peso dos botões já separa o rodapé, e a
 * faixa cinza só acrescentava outro sinal para a mesma divisão. (O fio que
 * aqui se dizia separar o rodapé também saiu, numa rodada depois.)
 *
 * **`start`** (rodada 211) é a ação que fica do outro lado — "Excluir",
 * "Voltar" —, encostada à esquerda no desktop e, pelo `flex-col-reverse`,
 * embaixo de tudo no telefone.
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
        // **Sem fio.** Nem aqui nem no cabeçalho: o diálogo é uma superfície só,
        // e o que separa as faixas é o conteúdo dissolvendo quando há rolagem, e
        // o respiro quando não há. Um traço horizontal para cada emenda numa
        // caixa de três blocos era o que o próprio arquivo já criticava ao
        // explicar por que o `bg-muted/50` saiu daqui: o peso dos botões e o
        // recuo já dizem que ali começa outra coisa.
        "flex shrink-0 flex-col-reverse gap-2",
        // O par do cabeçalho: sem tinta, pelo mesmo motivo escrito lá.
        "-mx-(--dialog-bleed) -mb-(--dialog-bleed)",
        "px-(--dialog-px) py-4 sm:flex-row sm:justify-end",
        // **No dedo, os botões do rodapé sobem a 40**, o piso de toque da casa.
        // As telas o escreviam à mão (`h-10 w-full`) só no ramo do telefone;
        // com um diálogo só nas duas larguras (rodada 211), o piso é daqui. A
        // pergunta é sobre o apontador, como na escada de campo.
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

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn(
        // `leading-snug`, e não `leading-none`: sem `gap` no cabeçalho, é a
        // entrelinha do título que o separa da descrição.
        "min-w-0 font-heading text-base leading-snug font-medium text-balance",
        // O × é `absolute` e não reserva lugar nenhum: sem isto, um título
        // longo passa por baixo dele — 16px medidos, e não é hipótese.
        //
        // A conta é uma só nos dois layouts porque a caixa do cabeçalho sempre
        // termina a `--dialog-px` da borda do diálogo: em `auto` pelo recuo do
        // casco, em `fixed` pelo recuo do próprio cabeçalho. Sobra o que o ×
        // avança além disso.
        DIALOG_CLOSE_RESERVE,
        // Dentro de `DialogHeaderRow` quem reserva é a coluna do adorno; aqui
        // o recuo só encolheria a coluna do texto à toa.
        "in-data-[slot=dialog-header-row]:pe-0",
        className
      )}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  // A primitiva fica por fora: é ela que escreve o `id` do `aria-describedby`.
  // O corpo e a tinta são do `Muted`.
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
 * O ícone do título (rodada 211), na linha dele e na cor dele, sem poço — o
 * `AlertDialogMedia` sem os tons. Vai dentro do `DialogHeader`, antes do
 * título; a descrição passa embaixo, na largura toda.
 */
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
 * "Passo 2 de 3", com a barra segmentada (rodada 211). Vai dentro do
 * `DialogHeader`, antes do título. Com ela, um diálogo `fixed` ocupa o teto
 * de altura, e a janela não pula quando o passo troca.
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
      // Desvia do × como o título desvia: a barra é a primeira linha do
      // cabeçalho, e corria por baixo do botão — medido na demonstração.
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
  // A pergunta de descarte, que o `Sheet` também faz (rodada 222).
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
  dialogContentVariants,
  // A origem do clique, que o `AlertDialog` também usa (rodada 248).
  juntarRefs,
  useOrigemDoClique,
}
