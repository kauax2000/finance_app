"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Popover as PopoverPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

/**
 * Um popover é um `role="dialog"` — e ele precisa de nome.
 *
 * O `Popover.Content` do Radix renderiza `role="dialog"` e **nunca escreve
 * `aria-labelledby`**. Um papel de diálogo sem nome é anunciado como "diálogo",
 * e mais nada: quem usa leitor de tela sabe que alguma coisa abriu, e não o
 * quê.
 *
 * O `PopoverTitle` daqui não corrigia isso — ele era uma `<div>` tipada como
 * `h2`, sem `id`, sem ligação nenhuma com o conteúdo. O
 * `MobileAccountMenu` chegou a escrever `<PopoverHeader className="sr-only">`
 * com título e descrição dentro, exatamente para nomear o popover; o texto
 * existia no DOM e não chegava ao papel.
 *
 * Agora o título e a descrição **se registram**: cada um recebe um `id` deste
 * contexto, e o `PopoverContent` só aponta `aria-labelledby` /
 * `aria-describedby` para eles quando eles de fato foram renderizados —
 * apontar para um `id` que não existe deixa o nome vazio, que é onde
 * estávamos. É o mesmo mecanismo do `Dialog` do Radix, aplicado à superfície
 * que compartilha o papel dele.
 *
 * Quem passa o próprio `aria-labelledby` continua ganhando: os props do
 * chamador são espalhados depois.
 */
type PopoverLabelContextValue = {
  titleId: string
  descriptionId: string
  setHasTitle: (present: boolean) => void
  setHasDescription: (present: boolean) => void
}

const PopoverLabelContext =
  React.createContext<PopoverLabelContextValue | null>(null)

function Popover({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Root>) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />
}

function PopoverTrigger({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Trigger>) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />
}

function PopoverClose({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Close>) {
  return <PopoverPrimitive.Close data-slot="popover-close" {...props} />
}

/**
 * O recuo é um eixo, como no `Card`.
 *
 * Cinco chamadas o anulam à mão — três escrevem `w-auto p-0` para pôr um
 * calendário dentro, e o `Combobox` e o `FormPickerPopoverContent` fazem o
 * mesmo porque quem manda no respiro é a lista de dentro. Um popover que
 * hospeda um componente inteiro não quer recuo nenhum: o conteúdo sangra até a
 * borda e cuida do próprio.
 *
 * `none` tira o `gap` junto. As chamadas escreviam `gap-0 p-0` porque as duas
 * coisas andam juntas — sem recuo, a folga entre filhos é do conteúdo também.
 */
const popoverContentVariants = cva(
  [
    /** Above Sheet overlay/content (`z-(--z-sheet)`); below Toaster (`z-(--z-toast)`). */
    "z-(--z-popover) flex w-72 origin-(--radix-popover-content-transform-origin) flex-col rounded-lg bg-popover text-sm text-popover-foreground shadow-md ring-1 ring-foreground/10 outline-hidden",
    "max-h-(--radix-popover-content-available-height) overflow-y-auto overscroll-contain",
    "duration-(--duration-instant) data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
  ],
  {
    variants: {
      padding: {
        default: "gap-2.5 p-2.5",
        none: "gap-0 p-0",
      },
    },
    defaultVariants: { padding: "default" },
  }
)

function PopoverContent({
  className,
  align = "center",
  sideOffset = 4,
  collisionPadding = 8,
  padding,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Content> &
  VariantProps<typeof popoverContentVariants>) {
  const reactId = React.useId()
  const [hasTitle, setHasTitle] = React.useState(false)
  const [hasDescription, setHasDescription] = React.useState(false)

  const label = React.useMemo<PopoverLabelContextValue>(
    () => ({
      titleId: `${reactId}-title`,
      descriptionId: `${reactId}-description`,
      setHasTitle,
      setHasDescription,
    }),
    [reactId]
  )

  return (
    <PopoverPrimitive.Portal data-slot="popover-portal">
      <PopoverLabelContext.Provider value={label}>
        <PopoverPrimitive.Content
          data-slot="popover-content"
          align={align}
          sideOffset={sideOffset}
          // Sem isto o popover encosta na borda da tela. O
          // `FormPickerPopoverContent` já somava a folga à mão (16/16/12/12) —
          // era o único que somava, e não é um caso especial dele.
          collisionPadding={collisionPadding}
          aria-labelledby={hasTitle ? label.titleId : undefined}
          aria-describedby={hasDescription ? label.descriptionId : undefined}
          data-padding={padding}
          className={cn(popoverContentVariants({ padding }), className)}
          {...props}
        />
      </PopoverLabelContext.Provider>
    </PopoverPrimitive.Portal>
  )
}

function PopoverAnchor({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Anchor>) {
  return <PopoverPrimitive.Anchor data-slot="popover-anchor" {...props} />
}

/**
 * Título sobre descrição é **o mesmo dado em duas linhas**, e quem os separa é
 * a entrelinha. O `gap-0.5` que estava aqui bastava para o par deixar de ler
 * como uma coisa só.
 */
function PopoverHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="popover-header"
      className={cn("flex flex-col text-sm", className)}
      {...props}
    />
  )
}

function PopoverTitle({ className, ...props }: React.ComponentProps<"h2">) {
  const label = React.useContext(PopoverLabelContext)
  const setHasTitle = label?.setHasTitle

  React.useEffect(() => {
    if (!setHasTitle) return
    setHasTitle(true)
    return () => setHasTitle(false)
  }, [setHasTitle])

  return (
    <h2
      data-slot="popover-title"
      id={label?.titleId}
      className={cn("font-heading font-medium text-balance", className)}
      {...props}
    />
  )
}

function PopoverDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  const label = React.useContext(PopoverLabelContext)
  const setHasDescription = label?.setHasDescription

  React.useEffect(() => {
    if (!setHasDescription) return
    setHasDescription(true)
    return () => setHasDescription(false)
  }, [setHasDescription])

  return (
    <p
      data-slot="popover-description"
      id={label?.descriptionId}
      className={cn("text-pretty text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  popoverContentVariants,
  Popover,
  PopoverAnchor,
  PopoverClose,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
}
