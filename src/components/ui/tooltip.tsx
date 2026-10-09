"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Tooltip as TooltipPrimitive } from "radix-ui"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"

import { Kbd } from "@/components/ui/kbd"
import { cn } from "@/lib/utils"
import { useViewportWindow } from "@/hooks/use-mobile"
import { ANCHORED_COLLISION_PADDING } from "@/lib/anchored-surface"
import { MOLA } from "@/lib/spring"
import { menuPanelSurfaceClassName } from "@/lib/menu-classes"

/**
 * Se **esta** dica está aberta.
 *
 * O `AnimatePresence` precisa do booleano para desmontar depois da saída, e o
 * Radix só o publica por `onOpenChange` e por `data-state` no DOM. Um contexto
 * de uma linha é mais barato que ler atributo.
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
 * A raiz — e ela **não** segura a dica enquanto o ponteiro caminha até lá.
 *
 * O Radix mantém o conteúdo aberto enquanto o ponteiro se move dentro de um
 * polígono de graça entre o gatilho e a caixa, para dar tempo de alcançá-la.
 * Isso serve a conteúdo que se aponta; uma dica não é isso — ela é um rótulo,
 * e quem tem conteúdo alcançável neste sistema é o `HoverCard`.
 *
 * O preço estava medido no trilho recolhido da `Sidebar`: os ícones ficam a
 * 36px um do outro e a dica abre à direita, então o polígono de graça cobre os
 * vizinhos. Passando por "Início" e indo até "Carteiras", a dica continuava
 * escrita **"Início"** e o `aria-describedby` continuava no primeiro botão — a
 * dica travava e a do item sob o cursor nunca abria.
 *
 * Continua sendo prop: quem tiver um caso de dica alcançável passa
 * `disableHoverableContent={false}` e assume o polígono.
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
   * **A confirmação do que o clique fez** (rodada 185): enquanto ela existir,
   * a dica fica aberta mostrando-a, e ela é anunciada ao leitor de tela. Quem
   * a liga e desliga é a tela, pelo estado do resultado — `linkCopied ?
   * "Link copiado" : null` —, e não o clique: uma cópia que falha não pode
   * confirmar nada.
   *
   * Existe porque o Radix **fecha a dica no `pointerdown`** do gatilho, e
   * medido: o "Copiado" que as duas telas de convite trocavam dentro da dica
   * nunca chegou a aparecer.
   */
  confirmation?: React.ReactNode
}) {
  // O Radix é quem manda; isto só espelha o estado para o `AnimatePresence` do
  // conteúdo. `open` continua opcional: passado, ele vence; ausente, o Radix
  // segue não controlado como sempre foi.
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
      {/* A dica é ligada por `aria-describedby`, e mudar a descrição não é
          anunciado. A confirmação fala por aqui. Absoluta, então não ocupa
          lugar na linha de quem a contém. */}
      <span className="sr-only" role="status" aria-live="polite">
        {confirmando ? confirmation : null}
      </span>
    </TooltipAbertoContext.Provider>
  )
}

/**
 * O gatilho — e ele **alcança um controle desabilitado** (rodada 185).
 *
 * Um `<button disabled>` não recebe ponteiro (o `Button` ainda declara
 * `pointer-events: none` nele) nem foco, então a dica sobre ele nunca abria —
 * medido: a demonstração "Só o owner remove membros" desta página estava morta.
 * Com `asChild` e um filho `disabled`, o gatilho vira um `span` focável em
 * volta dele: o ponteiro passa pelo botão até o `span`, o Tab para no `span`, e
 * a dica explica por que o controle está desligado. O `aria-label` do filho
 * sobe para o `span`, senão o leitor de tela focaria um nó sem nome.
 */
function TooltipTrigger({
  asChild,
  children,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
  const filho = React.isValidElement<{ disabled?: boolean; "aria-label"?: string }>(
    children
  )
    ? children
    : null
  if (asChild && filho?.props.disabled) {
    return (
      <TooltipPrimitive.Trigger data-slot="tooltip-trigger" asChild {...props}>
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
    <TooltipPrimitive.Trigger data-slot="tooltip-trigger" asChild={asChild} {...props}>
      {children}
    </TooltipPrimitive.Trigger>
  )
}

/**
 * `size` é o corpo da dica. `md` é o de sempre — 14px, a leitura de uma frase.
 * `sm` desce a 12px e aperta o recuo, para rotular um ícone numa fileira densa:
 * na coluna de ações da `Table` uma caixa de 14px com 12 de recuo saía maior
 * que o botão de 28 que ela nomeia.
 *
 * # Sem `text-balance`, e a razão é que a caixa não encolhe atrás dele
 *
 * Ele estava aqui, como está no shadcn e na referência do Animate UI — e numa
 * dica de duas linhas o resultado é uma **caixa que não abraça o próprio
 * texto**. A ordem é a do CSS, e ela não tem volta: `w-fit` resolve para
 * `min(max-content, 20rem)`, e como a frase inteira passa do teto a caixa
 * trava em **320px**; só então o `balance` reparte o texto. Não existe segunda
 * passada de layout que encolha a caixa até o resultado balanceado.
 *
 * Medido, com "Fatura fechada. Lançamentos novos entram na próxima.":
 *
 * | `text-wrap` | caixa | linhas | sobra à direita |
 * | --- | --- | --- | --- |
 * | `balance` | 320 | 198 + 173 | **98px** |
 * | `pretty` | 320 | 293 + 78 | 3px |
 * | `wrap` | 320 | 293 + 78 | 3px |
 *
 * Noventa e oito pixels de caixa vazia leem como defeito; uma última linha
 * curta é tipografia de duas linhas. `pretty` não foi escolhido porque aqui
 * ele não muda nada — o Chrome devolve a mesma quebra do `wrap` —, e um nome
 * que não faz diferença é uma promessa a menos.
 *
 * Isto vale para **esta** peça. Os outros nove componentes que vestem
 * `text-balance` não têm o teto mordendo a caixa do mesmo jeito, e ficaram
 * como estavam.
 */
const tooltipContentVariants = cva("font-medium", {
  variants: {
    // O raio é do degrau, e nunca cápsula (rodadas 241q e 241s): `sm` (24)
    // veste o `rounded-lg` (10, 42%) e `md` (32) a linha (12) — o degrau
    // seguinte de cada um seria a metade da altura, e a dica sairia pílula. Ele
    // vence o `rounded-surface` da placa pelo `twMerge`, porque vem depois.
    size: {
      sm: "rounded-lg px-2 py-1 text-xs",
      md: "rounded-row px-3 py-1.5 text-sm",
    },
    /**
     * `plate` (o padrão) é a placa flutuante dos menus. `contrast` (rodada 185)
     * é a pílula grave — `--primary`, preta no claro e branca no escuro —, sem
     * vidro nem anel, para o rótulo de ícone que precisa se destacar do que
     * está atrás. O `Kbd` dentro dela ganha a tinta da pílula.
     */
    variant: {
      plate: "",
      // Ela **não** veste a placa por baixo: a placa traz
      // `supports-backdrop-filter:dark:bg-popover/60`, o `glass-surface` e a
      // variante de transparência reduzida, e cada um venceria o `bg-primary`
      // num tema ou num ambiente. Anular um por um é o que esta casa chama de
      // compensar por seletor.
      contrast: [
        "bg-primary text-primary-foreground shadow-md",
        "**:data-[slot=kbd]:bg-primary-foreground/15 **:data-[slot=kbd]:text-primary-foreground",
        // O par `dark:` não é redundância: o `Kbd` declara `dark:bg-muted` e
        // `dark:text-muted-foreground`, que empatam com a regra de cima e
        // venciam pela ordem — medido, a tecla saía cinza-escura sobre a
        // pílula branca.
        "dark:**:data-[slot=kbd]:bg-primary-foreground/15 dark:**:data-[slot=kbd]:text-primary-foreground",
      ].join(" "),
    },
  },
  // `sm` é o padrão desde a rodada 241r, a pedido do dono: a dica de 32px
  // com texto de 14 pesava mais que o ícone que ela nomeia.
  defaultVariants: { size: "sm", variant: "plate" },
})

/**
 * A caixa flutuante do tooltip.
 *
 * Era uma linha de novecentos caracteres com quatro coisas erradas dentro.
 *
 * **A superfície era emprestada da sidebar.** `bg-sidebar-accent`,
 * `text-sidebar-accent-foreground` e `border-sidebar-border` num overlay que
 * aparece em qualquer canto do app. O preço apareceu sozinho: ao corrigir o
 * item ativo do menu lateral — que era o mesmo cinza da lateral, razão 1,00 —,
 * o fundo e a tinta **do tooltip** se mexeram junto, sem ninguém pedir. Agora
 * ele fala a língua de overlay do sistema, `--popover`, a mesma do `Popover` e
 * do `DropdownMenu`.
 *
 * **`h-8` cortava tooltip de duas linhas.** Medido: com `max-w-xs` o texto
 * quebrava, o conteúdo pedia 45px de altura e a caixa continuava com 32. A
 * altura agora vem do padding.
 *
 * **Metade da animação nunca rodou.** O Radix marca o conteúdo do tooltip como
 * `delayed-open`, `instant-open` ou `closed` — nunca `open`. As classes
 * `data-open:*` eram letra morta, e `instant-open`, que é o estado quando outro
 * tooltip acabou de fechar, entrava sem transição nenhuma. Os três estados
 * estão cobertos.
 *
 * **A costura com o `Kbd` não costurava nada.** Quatro classes aqui
 * (`has-data-[slot=kbd]:pr-1.5` e três `**:data-[slot=kbd]:*`) e três no
 * `Kbd`, para um par que **nenhuma tela monta** — a única aparição era um
 * `<kbd>` cru na página do catálogo, que não é o componente. Saíram das duas
 * pontas.
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
     * O atalho, na grafia do `Kbd` (`"mod+b"`): ⌘ no Mac, Ctrl no resto.
     * Entra à direita do texto (rodada 185).
     */
    shortcut?: string
  }) {
  // O portal vai para o `body` da janela ativa. Fora da moldura do catálogo o
  // contexto é `null` e o Radix usa o próprio documento — o app não muda.
  const janela = useViewportWindow()
  const { aberto, confirmacao } = React.useContext(TooltipAbertoContext)
  // A mola é de JavaScript, e o bloco de `prefers-reduced-motion` do
  // `globals.css` só alcança animação de CSS. Sem isto, a única peça do sistema
  // que ignora a preferência seria esta.
  const reduzido = useReducedMotion()

  const fechada = { opacity: 0, scale: reduzido ? 1 : 0.5 }

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
              initial={fechada}
              animate={{ opacity: 1, scale: 1 }}
              exit={fechada}
              transition={reduzido ? { duration: 0 } : MOLA}
              className={cn(
                // 20rem é o teto de leitura; o `available-width` é o teto da
                // janela, e o menor dos dois vence — numa classe só. Com duas
                // (`max-w-xs` e `max-w-(--radix-…)`) o twMerge apagava a
                // primeira, e a dica perdia o teto de leitura.
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
                  {shortcut ? <Kbd keys={shortcut} /> : null}
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
