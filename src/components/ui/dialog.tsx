"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Dialog as DialogPrimitive } from "radix-ui"
import { XMarkIcon } from "@heroicons/react/16/solid"

import { cn } from "@/lib/utils"
import { scrollFadeViewportClassName } from "@/lib/scroll-fade-classes"
import { useScrollFade } from "@/hooks/use-scroll-fade"
import { Button } from "@/components/ui/button"

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

function Dialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        "fixed inset-0 isolate z-(--z-modal) bg-overlay duration-(--duration-slow) ease-out supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
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
 * **sete chamadas anulam com `mx-0 mb-0 mt-0`** — porque o `-mx-4 -mb-4` daqui
 * pressupõe um `p-4` no casco, e o casco delas é `p-0`. O rodapé de fábrica não
 * estava só apertado: ele estava **quebrado** para a forma dominante do app.
 *
 * Então o eixo virou o que as telas já separavam: **`layout`**.
 *
 * - `auto` — a altura vem do conteúdo. Confirmação curta, um campo, um aviso.
 * - `fixed` — a altura é teto, e o corpo rola entre um cabeçalho e um rodapé
 *   parados. É o formulário em diálogo, e são 13 das 25 telas.
 *
 * E **`size`** deixou de ser um `sm:max-w-*` escrito na tela: o padrão é `md`,
 * que é o que 17 das 19 chamadas explícitas pediam e o que o `AlertDialog` já
 * usava. Os dois gêmeos passam a medir igual.
 */
const dialogContentVariants = cva(
  [
    "group/dialog-content fixed top-1/2 left-1/2 z-(--z-modal)",
    "w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2",
    "rounded-xl bg-background text-sm shadow-lg ring-1 ring-foreground/10 outline-none",
    "duration-(--duration-slow) ease-out",
    "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95",
    "data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
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
      },
      layout: {
        // `--dialog-bleed` é quanto o rodapé precisa recuar para alcançar a
        // borda. Ele é uma **variável**, e não uma regra `group-data-*`, por um
        // motivo prático: as sete telas que ainda anulam o rodapé com `mx-0`
        // continuam vencendo por `tailwind-merge`, porque `mx-0` e
        // `-mx-(--dialog-bleed)` disputam a mesma propriedade. Como regra de
        // grupo, o recuo negativo teria especificidade maior e voltaria por
        // cima delas — quebrando exatamente as telas que a mudança veio servir.
        auto: "grid gap-4 p-(--dialog-px) [--dialog-bleed:--spacing(6)]",
        fixed:
          "flex max-h-(--dialog-max-h) flex-col gap-0 overflow-hidden p-0 [--dialog-bleed:0px]",
      },
    },
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
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> &
  VariantProps<typeof dialogContentVariants> & {
    showCloseButton?: boolean
  }) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        data-layout={layout ?? "auto"}
        className={cn(
          dialogContentVariants({ size, layout }),
          showCloseButton && "[--dialog-close:--spacing(11)]",
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close data-slot="dialog-close" asChild>
            <Button
              variant="tertiary"
              className="absolute top-3 right-3"
              size="icon-sm"
            >
              <XMarkIcon />
              <span className="sr-only">Fechar</span>
            </Button>
          </DialogPrimitive.Close>
        )}
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
      <div className="min-w-0 space-y-1">{children}</div>
      {endAdornment != null ? (
        <div className={cn("shrink-0", DIALOG_CLOSE_RESERVE)}>
          {endAdornment}
        </div>
      ) : null}
    </div>
  )
}

/**
 * O cabeçalho, e o fio sob ele.
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
        "flex w-full min-w-0 shrink-0 flex-col gap-2 text-left",
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
 * Funciona nos dois porque é a mesma primitiva do Radix. A posição flutuante
 * vem de fábrica por ser o caso comum; dentro de um cabeçalho fixo, passe
 * `className="static"` — ou use o `MobileSheetFormHeaderCloseButton`, que já
 * resolve o par com a alça da gaveta.
 */
function DialogCloseButton({
  className,
  label = "Fechar",
  ...props
}: React.ComponentProps<typeof Button> & { label?: string }) {
  return (
    <DialogPrimitive.Close asChild>
      <Button
        data-slot="dialog-close-button"
        type="button"
        variant="tertiary"
        size="icon-sm"
        className={cn("absolute top-3 right-3", className)}
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
        // A dissolução das duas bordas, **no lugar dos dois fios**. É o modo
        // sem faixa: o cabeçalho e o rodapé têm altura variável — título com
        // ou sem descrição, botões que empilham no telefone —, e medi-los
        // exigiria um observador escrevendo a altura do JS, com flash na
        // primeira pintura. Aqui o conteúdo dissolve na borda do próprio
        // corpo, e as duas faixas ficam onde estão.
        //
        // Ele também traz a folga de rolagem, e ela é bem-vinda num formulário:
        // um campo que ganha foco perto da borda para 48px dentro, fora da
        // zona, em vez de encostar nela.
        scrollFadeViewportClassName,
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
 * trocavam por `bg-background`: o rodapé de um diálogo já está separado por um
 * fio e pelo peso dos botões, e a faixa cinza só acrescentava um terceiro
 * sinal para a mesma divisão.
 */
function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  showCloseButton?: boolean
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
        "flex shrink-0 flex-col-reverse gap-2 rounded-b-xl",
        "-mx-(--dialog-bleed) -mb-(--dialog-bleed)",
        "px-(--dialog-px) py-4 sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close asChild>
          <Button type="button" variant="tertiary">
            Cancelar
          </Button>
        </DialogPrimitive.Close>
      )}
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
        "min-w-0 font-heading text-base leading-none font-medium text-balance",
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
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn(
        "min-w-0 text-sm text-pretty text-muted-foreground *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-foreground *:[a]:active:text-foreground",
        className
      )}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogBody,
  DialogClose,
  DialogCloseButton,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogHeaderRow,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
  dialogContentVariants,
}
