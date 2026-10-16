"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Tooltip as TooltipPrimitive } from "radix-ui"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"

import { Kbd } from "@/components/ui/kbd"
import { deDedo } from "@/lib/pointer"
import { cn } from "@/lib/utils"
import { useViewportWindow } from "@/hooks/use-mobile"
import { ANCHORED_COLLISION_PADDING } from "@/lib/anchored-surface"
import { menuPanelSurfaceClassName } from "@/lib/menu-classes"

/**
 * Se esta dica está aberta. O `AnimatePresence` precisa do booleano para
 * desmontar depois da saída, e o Radix só o publica por `onOpenChange` e por
 * `data-state` no DOM.
 */
const TooltipAbertoContext = React.createContext<{
  aberto: boolean
  confirmacao: React.ReactNode
}>({ aberto: false, confirmacao: null })

function TooltipProvider({
  delayDuration = 0,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delayDuration={delayDuration}
      {...props}
    />
  )
}

/**
 * A raiz não segura a dica enquanto o ponteiro caminha até lá. O Radix mantém o
 * conteúdo aberto num polígono de graça entre o gatilho e a caixa; isso serve a
 * conteúdo que se aponta, e uma dica é um rótulo (quem tem conteúdo alcançável é
 * o `HoverCard`). No trilho recolhido da `Sidebar` (ícones a 36px, dica à
 * direita) o polígono cobre os vizinhos: a dica travava em "Início" e a do item
 * sob o cursor nunca abria. Continua sendo prop: `disableHoverableContent={false}`
 * assume o polígono.
 */
function Tooltip({
  disableHoverableContent = true,
  open,
  defaultOpen,
  onOpenChange,
  confirmation,
  children,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Root> & {
  /**
   * A confirmação do que o clique fez: enquanto existir, a dica fica aberta
   * mostrando-a, e é anunciada ao leitor de tela. Quem a liga é a tela, pelo
   * resultado (`linkCopied ? "Link copiado" : null`) e não pelo clique: uma cópia
   * que falha não pode confirmar nada. Existe porque o Radix fecha a dica no
   * `pointerdown` do gatilho, e um "Copiado" trocado dentro dela nunca aparece.
   */
  confirmation?: React.ReactNode
}) {
  // O Radix manda; isto só espelha o estado para o `AnimatePresence`. `open`
  // passado vence; ausente, o Radix segue não controlado.
  const [interno, setInterno] = React.useState(defaultOpen ?? false)
  const confirmando = confirmation != null && confirmation !== false
  const aberto = confirmando || (open ?? interno)

  const aoMudar = React.useCallback(
    (valor: boolean) => {
      setInterno(valor)
      onOpenChange?.(valor)
    },
    [onOpenChange]
  )

  return (
    <TooltipAbertoContext.Provider
      value={{ aberto, confirmacao: confirmando ? confirmation : null }}
    >
      <TooltipPrimitive.Root
        data-slot="tooltip"
        disableHoverableContent={disableHoverableContent}
        open={confirmando ? true : open}
        defaultOpen={defaultOpen}
        onOpenChange={aoMudar}
        {...props}
      >
        {children}
      </TooltipPrimitive.Root>
      {/*
         A dica é ligada por `aria-describedby`, e mudar a descrição não é anunciado: a
         confirmação fala por aqui. Absoluta, para não ocupar lugar na linha de quem a contém.
      */}
      <span className="sr-only" role="status" aria-live="polite">
        {confirmando ? confirmation : null}
      </span>
    </TooltipAbertoContext.Provider>
  )
}

/**
 * O gatilho alcança um controle desabilitado. Um `<button disabled>` não recebe
 * ponteiro (o `Button` declara `pointer-events: none`) nem foco, então a dica
 * nunca abria. Com `asChild` e um filho `disabled`, o gatilho vira um `span`
 * focável em volta dele: o ponteiro passa pelo botão até o `span`, o Tab para
 * nele, e a dica explica por que o controle está desligado. O `aria-label` do
 * filho sobe para o `span`, senão o leitor de tela focaria um nó sem nome.
 */
function TooltipTrigger({
  asChild,
  children,
  onPointerMove,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
  // A dica abre com o cursor parado em cima, e a moldura do iPhone do catálogo é
  // dedo emulado: o Radix via um mouse e abria. Ele respeita o `preventDefault` e
  // não abre; no telefone de verdade já ignora o toque.
  const semHoverNaMoldura = (e: React.PointerEvent<HTMLButtonElement>) => {
    onPointerMove?.(e)
    if (deDedo(e.currentTarget)) e.preventDefault()
  }
  const filho = React.isValidElement<{ disabled?: boolean; "aria-label"?: string }>(
    children
  )
    ? children
    : null
  if (asChild && filho?.props.disabled) {
    return (
      <TooltipPrimitive.Trigger
        data-slot="tooltip-trigger"
        asChild
        {...props}
        onPointerMove={semHoverNaMoldura}
      >
        <span
          data-slot="tooltip-disabled-trigger"
          tabIndex={0}
          aria-label={filho.props["aria-label"]}
          aria-disabled
          className="inline-flex rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/45"
        >
          {filho}
        </span>
      </TooltipPrimitive.Trigger>
    )
  }
  return (
    <TooltipPrimitive.Trigger
      data-slot="tooltip-trigger"
      asChild={asChild}
      {...props}
      onPointerMove={semHoverNaMoldura}
    >
      {children}
    </TooltipPrimitive.Trigger>
  )
}

/**
 * `size` é o corpo da dica. `md` é o de sempre (14px, a leitura de uma frase);
 * `sm` desce a 12px e aperta o recuo, para rotular um ícone numa fileira densa
 * (na coluna de ações da `Table` uma caixa de 14px com 12 de recuo saía maior que
 * o botão de 28 que ela nomeia).
 * Sem `text-balance`: `w-fit` resolve para `min(max-content, 20rem)`, e como a
 * frase inteira passa do teto a caixa trava em 320px; só então o `balance`
 * reparte o texto, e não há segunda passada que encolha a caixa. Medido com
 * "Fatura fechada. Lançamentos novos entram na próxima.": `balance` deixava 98px
 * de caixa vazia à direita; `pretty` e `wrap` deixam 3px (e `pretty` não muda
 * nada aqui no Chrome). Vale para esta peça; os outros componentes que vestem
 * `text-balance` não têm o teto mordendo a caixa do mesmo jeito.
 */
const tooltipContentVariants = cva("font-medium", {
  variants: {
    // O raio é do degrau, e nunca cápsula: `sm` (24) veste o `rounded-lg` (10) e `md`
    // (32) a linha (12); o degrau seguinte de cada um seria a metade da altura, e a
    // dica sairia pílula. Vence o `rounded-surface` da placa pelo `twMerge`, porque vem depois.
    size: {
      sm: "rounded-lg px-2 py-1 text-xs",
      md: "rounded-row px-3 py-1.5 text-sm",
    },
    /**
     * `plate` (padrão) é a placa flutuante dos menus. `contrast` é a pílula grave
     * (`--primary`, preta no claro e branca no escuro), sem vidro nem anel, para o
     * rótulo de ícone que precisa se destacar. O `Kbd` dentro dela ganha a tinta da pílula.
     */
    variant: {
      plate: "",
      // Não veste a placa por baixo: a placa traz `supports-backdrop-filter:bg-popover/60`,
      // o `glass-surface` e a variante de transparência reduzida, e cada um venceria o
      // `bg-primary` num tema ou ambiente. Anular um por um é compensar por seletor.
      contrast: [
        "bg-primary text-primary-foreground shadow-md",
        "**:data-[slot=kbd]:bg-primary-foreground/15 **:data-[slot=kbd]:text-primary-foreground",
        // O par `dark:` não é redundância: o `Kbd` declara `dark:bg-muted` e
        // `dark:text-muted-foreground`, que empatam com a regra de cima e venciam pela
        // ordem (a tecla saía cinza-escura sobre a pílula branca).
        "dark:**:data-[slot=kbd]:bg-primary-foreground/15 dark:**:data-[slot=kbd]:text-primary-foreground",
      ].join(" "),
    },
  },
  // `sm` é o padrão, por decisão do dono: a dica de 32px com texto de 14 pesava
  // mais que o ícone que ela nomeia.
  defaultVariants: { size: "sm", variant: "plate" },
})

/**
 * A caixa flutuante do tooltip.
 * A superfície é `--popover` (a do `Popover` e do `DropdownMenu`), e não a da
 * sidebar emprestada: um overlay de qualquer canto do app não deve se mexer
 * quando se mexe no item ativo do menu lateral.
 * A altura vem do padding, e não de `h-8` (cortaria dica de duas linhas).
 * O Radix marca o conteúdo como `delayed-open`, `instant-open` ou `closed`, nunca
 * `open`: `data-open:*` é letra morta, e os três estados estão cobertos
 * (`instant-open` é o estado quando outro tooltip acabou de fechar).
 * Não há costura com o `Kbd` aqui: nenhuma tela monta o par.
 */
function TooltipContent({
  className,
  sideOffset = 6,
  collisionPadding = ANCHORED_COLLISION_PADDING,
  size,
  variant,
  shortcut,
  children,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content> &
  VariantProps<typeof tooltipContentVariants> & {
    /**
     * O atalho, na grafia do `Kbd` (`"mod+b"`): ⌘ no Mac, Ctrl no resto. Entra à
     * direita do texto.
     */
    shortcut?: string
  }) {
  // O portal vai para o `body` da janela ativa. Fora da moldura do catálogo o
  // contexto é `null` e o Radix usa o próprio documento — o app não muda.
  const janela = useViewportWindow()
  const { aberto, confirmacao } = React.useContext(TooltipAbertoContext)
  // Com movimento reduzido a dica desmonta na hora (o CSS da volta já encurta pelo
  // bloco global; a espera do `motion` não).
  const reduzido = useReducedMotion()


  return (
    <AnimatePresence>
      {aberto && (
        <TooltipPrimitive.Portal forceMount container={janela?.document.body}>
          <TooltipPrimitive.Content
            asChild
            forceMount
            data-slot="tooltip-content"
            data-size={size ?? "md"}
            data-variant={variant ?? "plate"}
            sideOffset={sideOffset}
            collisionPadding={collisionPadding}
            {...props}
          >
            <motion.div
              key="tooltip-content"
              // O gesto é o do menu, em CSS (`@utility menu-sprout`, pelo `data-state` do
              // Radix: `delayed-open`/`instant-open` e `closed`). O `motion` só segura a
              // dica montada durante os 210ms da volta.
              initial={false}
              exit={{ opacity: 1, transition: { duration: reduzido ? 0 : 0.21 } }}
              className={cn(
                "menu-sprout",
                // 20rem é o teto de leitura; o `available-width` é o teto da janela, e o menor
                // dos dois vence numa classe só (com duas, `max-w-xs` e `max-w-(--radix-…)`, o
                // `twMerge` apagaria a primeira).
                "z-(--z-popover) w-fit max-w-[min(20rem,var(--radix-tooltip-content-available-width))] origin-(--radix-tooltip-content-transform-origin)",
                "max-h-(--radix-tooltip-content-available-height) overflow-y-auto overscroll-contain",
                variant === "contrast" ? null : menuPanelSurfaceClassName,
                tooltipContentVariants({ size, variant }),
                shortcut && confirmacao == null && "flex items-center gap-2",
                className
              )}
            >
              {confirmacao ?? (
                <>
                  {children}
                  {shortcut ? <Kbd keys={shortcut} className="pointer-coarse:hidden" /> : null}
                </>
              )}
            </motion.div>
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      )}
    </AnimatePresence>
  )
}

// `tooltipContentVariants` sai para o `AvatarGroup`, cuja dica viaja entre os
// rostos e não é um `Tooltip` do Radix: ela veste a mesma pílula.
export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, tooltipContentVariants }
