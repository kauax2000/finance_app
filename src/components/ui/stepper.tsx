"use client"

import * as React from "react"
import { CheckIcon, ExclamationCircleIcon } from "@heroicons/react/16/solid"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

/**
 * Progresso por etapas de um fluxo.
 *
 * ## A lista assume o que é dela
 *
 * `StepperItem` recebia `step` (o número) e `isLast` como props. Os dois são
 * exatamente o que o **pai** sabe e o filho não: o índice e o fim da lista. É
 * a mesma correção que a `BreadcrumbList` recebeu ao assumir os separadores: o
 * contêiner deriva do índice, e o item volta a aceitar `children`.
 *
 * ## O passo é da lista (rodada 224)
 *
 * Com `value` (ou `defaultValue`) a `Stepper` **é** o estado do fluxo: cada
 * item deriva `complete`/`current`/`upcoming` do próprio índice, e ninguém
 * escreve `estadoDe(i, atual)`. `state` no item continua valendo, e vence —
 * é o que marca uma etapa com `error`. Com `onValueChange` as etapas
 * concluídas viram botão sozinhas (as futuras também, com `linear={false}`),
 * as setas andam entre elas, e uma região viva anuncia "Passo 3 de 4,
 * Categorias" ao trocar.
 *
 * ## O estado chega ao leitor de tela
 *
 * `data-state` não é lido por tecnologia assistiva, e o tique é `aria-hidden`:
 * cada item carrega o estado em `sr-only`, depois do rótulo.
 */

type StepState = "complete" | "current" | "upcoming" | "error"

type StepperOrientation = "horizontal" | "vertical" | "responsive"
type StepperSize = "sm" | "md"

const ESTADO_EM_PALAVRAS: Record<StepState, string> = {
  complete: "concluída",
  current: "etapa atual",
  upcoming: "não iniciada",
  error: "com erro",
}

const MARCADOR: Record<StepperSize, string> = {
  sm: "size-5 text-2xs [&_svg]:size-3",
  md: "size-6 text-2xs [&_svg]:size-3.5",
}

/**
 * A medida do marcador, publicada como variável para o **rótulo** e o
 * **conector** se centrarem nela — um número só, e não dois que precisam
 * concordar.
 */
const MARCADOR_VAR: Record<StepperSize, string> = {
  sm: "[--stepper-marker:--spacing(5)]",
  md: "[--stepper-marker:--spacing(6)]",
}

/** A marca que separa os itens do resto dos filhos da `Stepper`. */
const MARCA_DE_ITEM = "__stepperItem" as const

type StepperContexto = {
  orientation: "horizontal" | "vertical"
  size: StepperSize
  variant: "default" | "bar"
  value: number | null
  irPara: ((indice: number) => void) | null
  linear: boolean
  total: number
  rotulos: string[]
  /** 1 avançando, −1 voltando: o sentido em que o painel desliza. */
  sentido: 1 | -1
}

const StepperContext = React.createContext<StepperContexto>({
  orientation: "horizontal",
  size: "md",
  variant: "default",
  value: null,
  irPara: null,
  linear: true,
  total: 0,
  rotulos: [],
  sentido: 1,
})

/** O estado do fluxo, para quem está fora da lista (os painéis, os botões). */
function useStepper() {
  return React.useContext(StepperContext)
}

/** O texto de um item: `label`, ou os filhos quando são texto. */
function rotuloDe(item: React.ReactElement) {
  const p = item.props as { label?: string; children?: React.ReactNode }
  if (p.label) return p.label
  return typeof p.children === "string" ? p.children : ""
}

/** "Passo 2 de 4 · Categorias" — a contagem da barra e do telefone. */
function contagem(atual: number, total: number, nome?: string) {
  return `Passo ${atual + 1} de ${total}${nome ? ` · ${nome}` : ""}`
}

function Stepper({
  className,
  children,
  orientation = "horizontal",
  size = "md",
  variant = "default",
  value: valueProp,
  defaultValue,
  onValueChange,
  linear = true,
  ...props
}: Omit<React.ComponentProps<"div">, "children" | "defaultValue"> & {
  children?: React.ReactNode
  /**
   * `responsive` é a fila horizontal a partir de `sm` e, no telefone, a
   * contagem compacta — "Passo 2 de 4", o nome da etapa e a barra fina —, em
   * vez de "1 2 3 4" sem nome.
   */
  orientation?: StepperOrientation
  size?: StepperSize
  /** `bar`: segmentos que acendem, com a contagem em cima (a forma do `DialogSteps`). */
  variant?: "default" | "bar"
  /** O passo atual, a partir de 0. Com ele, cada item deriva o próprio estado. */
  value?: number
  defaultValue?: number
  /** Com ele, as etapas concluídas voltam ao clique, e os botões andam. */
  onValueChange?: (value: number) => void
  /** `false`: as etapas futuras também clicam. */
  linear?: boolean
}) {
  const todos = React.Children.toArray(children).filter(React.isValidElement)
  // Os itens vão para a lista; o resto (painéis, botões) vem depois dela. **Pela
  // marca, e não pela identidade da função**: o Fast Refresh troca a função a
  // cada edição e `c.type === StepperItem` deixa de bater calado (o 26 de
  // `table-ladder.test.ts`). A marca é reaplicada quando o módulo recarrega.
  const ehItem = (c: React.ReactElement) =>
    Boolean((c.type as { [MARCA_DE_ITEM]?: boolean })[MARCA_DE_ITEM])
  const itens = todos.filter(ehItem)
  const resto = todos.filter((c) => !ehItem(c))

  const controlado = valueProp !== undefined
  const [interno, setInterno] = React.useState(defaultValue ?? null)
  const value = controlado ? valueProp : interno
  const [sentido, setSentido] = React.useState<1 | -1>(1)
  const temValor = value !== null && value !== undefined
  const irPara = React.useCallback(
    (i: number) => {
      if (!temValor) return
      setSentido(i >= (value as number) ? 1 : -1)
      if (!controlado) setInterno(i)
      onValueChange?.(i)
    },
    [temValor, value, controlado, onValueChange]
  )

  const rotulos = itens.map(rotuloDe)
  const total = itens.length
  const fila = orientation === "vertical" ? "vertical" : "horizontal"

  const contexto = React.useMemo<StepperContexto>(
    () => ({
      orientation: fila,
      size,
      variant,
      value: temValor ? (value as number) : null,
      irPara: onValueChange || !controlado ? irPara : null,
      linear,
      total,
      rotulos,
      sentido,
    }),
    // `rotulos` é derivado dos filhos a cada render; a junção é a identidade dele.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fila, size, variant, temValor, value, onValueChange, controlado, irPara, linear, total, rotulos.join("|"), sentido]
  )

  /** Setas: andam entre as etapas que clicam, como numa lista de abas. */
  const teclas = (e: React.KeyboardEvent<HTMLOListElement>) => {
    const eixo = fila === "vertical" ? ["ArrowUp", "ArrowDown"] : ["ArrowLeft", "ArrowRight"]
    if (!eixo.includes(e.key) && e.key !== "Home" && e.key !== "End") return
    const botoes = [
      ...e.currentTarget.querySelectorAll<HTMLElement>("[data-slot=stepper-trigger]:not(:disabled)"),
    ]
    const i = botoes.indexOf(document.activeElement as HTMLElement)
    if (i === -1) return
    e.preventDefault()
    const proximo =
      e.key === "Home" ? 0 : e.key === "End" ? botoes.length - 1 : i + (e.key === eixo[1] ? 1 : -1)
    botoes[(proximo + botoes.length) % botoes.length]?.focus()
  }

  const atual = temValor ? (value as number) : itens.findIndex((c) => (c.props as { state?: StepState }).state === "current")

  const lista = (
    <ol
      data-slot="stepper-list"
      onKeyDown={teclas}
      className={cn(
        "flex w-full",
        variant === "bar"
          ? "items-stretch gap-1"
          : fila === "horizontal"
            ? "items-start gap-2"
            : "flex-col gap-0",
        orientation === "responsive" && variant === "default" && "max-sm:hidden"
      )}
    >
      {itens.map((item, i) =>
        React.cloneElement(item as React.ReactElement<{ step?: number; isLast?: boolean; index?: number }>, {
          // Uma lista que não começa em 1 passa `step` à mão; o índice só preenche.
          step: (item as React.ReactElement<{ step?: number }>).props.step ?? i + 1,
          isLast: i === itens.length - 1,
          index: i,
        })
      )}
    </ol>
  )

  return (
    <StepperContext.Provider value={contexto}>
      <div
        data-slot="stepper"
        data-orientation={orientation}
        data-size={size}
        data-variant={variant}
        className={cn("flex w-full flex-col gap-4", MARCADOR_VAR[size], className)}
        {...props}
      >
        {variant === "bar" ? (
          <div className="flex flex-col gap-1.5">
            {lista}
            {atual >= 0 ? (
              <p aria-hidden className="nums text-xs text-muted-foreground">
                {contagem(atual, total, rotulos[atual])}
              </p>
            ) : null}
          </div>
        ) : (
          lista
        )}
        {/* No telefone a fila vira a contagem com o nome — a barra fina, sem os
            números soltos. Ela é só desenho: a lista continua na árvore. */}
        {orientation === "responsive" && variant === "default" && atual >= 0 ? (
          <div aria-hidden data-slot="stepper-compact" className="flex flex-col gap-1.5 sm:hidden">
            <div className="flex gap-1">
              {itens.map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    "h-1 flex-1 rounded-full transition-colors duration-(--duration-slow) ease-(--ease-out)",
                    i <= atual ? "bg-primary-accent" : "bg-muted"
                  )}
                />
              ))}
            </div>
            <p className="nums text-xs text-muted-foreground">{contagem(atual, total, rotulos[atual])}</p>
          </div>
        ) : null}
        {/* A troca, para quem não vê a fila mudar. */}
        {temValor ? (
          <span aria-live="polite" className="sr-only">
            {`Passo ${(value as number) + 1} de ${total}${rotulos[value as number] ? `, ${rotulos[value as number]}` : ""}`}
          </span>
        ) : null}
        {resto}
      </div>
    </StepperContext.Provider>
  )
}

function StepperItem({
  className,
  state: stateProp,
  step,
  index = 0,
  label,
  description,
  icon,
  optional = false,
  isLast = false,
  asChild = false,
  children,
  ...props
}: React.ComponentProps<"li"> & {
  /** Vence o que a lista deriva de `value` — é como uma etapa fica `error`. */
  state?: StepState
  /** O número do marcador. A `Stepper` o preenche a partir do índice. */
  step?: number
  /** Preenchido pela `Stepper`. */
  index?: number
  /** Atalho para `children`, quando o rótulo é só texto. */
  label?: string
  /** A segunda linha da etapa. */
  description?: React.ReactNode
  /** Um ícone (16/solid) no lugar do número, enquanto a etapa não conclui. */
  icon?: React.ReactNode
  /** Mostra "Opcional" ao lado do nome. */
  optional?: boolean
  /** Preenchido pela `Stepper`. */
  isLast?: boolean
  asChild?: boolean
}) {
  const { orientation, size, variant, value, irPara, linear } = React.useContext(StepperContext)
  const vertical = orientation === "vertical"

  const state: StepState =
    stateProp ??
    (value === null ? "upcoming" : index < value ? "complete" : index === value ? "current" : "upcoming")
  const concluida = state === "complete"
  // Volta-se clicando no que já foi feito; o futuro só clica fora do modo linear.
  const clicavel = irPara !== null && !asChild && state !== "current" && (concluida || !linear)

  const elementoFilho =
    asChild && React.isValidElement(children)
      ? (children as React.ReactElement<{ children?: React.ReactNode }>)
      : null
  const conteudo = elementoFilho ? elementoFilho.props.children : (children ?? label)

  const nome = (
    <>
      {conteudo}
      {optional ? (
        <span className="ms-1.5 text-2xs font-normal text-muted-foreground">Opcional</span>
      ) : null}
    </>
  )

  // ── A forma em barra: um segmento por etapa ───────────────────────────────
  if (variant === "bar") {
    return (
      <li
        data-slot="stepper-item"
        data-state={state}
        aria-current={state === "current" ? "step" : undefined}
        className={cn("relative h-1.5 flex-1 overflow-hidden rounded-full bg-muted", className)}
        {...props}
      >
        <span
          aria-hidden
          className={cn(
            "absolute inset-0 origin-left rounded-full transition-[scale] duration-(--duration-spring) ease-(--ease-spring)",
            state === "error" ? "bg-destructive" : "bg-primary-accent",
            state === "upcoming" ? "[scale:0_1]" : "[scale:1_1]"
          )}
        />
        <span className="sr-only">
          {conteudo}, {ESTADO_EM_PALAVRAS[state]}
        </span>
      </li>
    )
  }

  const marcador = (
    <span
      data-slot="stepper-marker"
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full border font-medium transition-[background-color,border-color,color,box-shadow] duration-(--duration-slow) ease-(--ease-out)",
        MARCADOR[size],
        concluida && "border-transparent bg-primary text-primary-foreground",
        // A atual ganha um anel suave: a etapa em que a pessoa está.
        state === "current" &&
          "border-primary-accent bg-primary-muted text-primary-accent ring-4 ring-primary-accent/15",
        state === "upcoming" && "border-border bg-transparent text-muted-foreground",
        state === "error" && "border-transparent bg-destructive text-destructive-foreground"
      )}
    >
      {concluida ? (
        // `key` remonta o tique quando a etapa conclui: ele estala na mola, a
        // régua do tique do `Menubar`.
        <CheckIcon
          key="tique"
          aria-hidden
          className="animate-in zoom-in-50 animation-duration-(--duration-spring) ease-(--ease-spring)"
        />
      ) : state === "error" ? (
        <ExclamationCircleIcon aria-hidden />
      ) : (
        (icon ?? step)
      )}
    </span>
  )

  /** O conector: o trilho cinza e, por cima, a trilha que enche na mola. */
  const conector = (direcao: "x" | "y") => (
    <span
      aria-hidden
      data-slot="stepper-connector"
      className={cn(
        "relative overflow-hidden rounded-full bg-border",
        direcao === "x" ? "h-0.5 flex-1" : "my-1 min-h-6 w-0.5 flex-1 ms-[calc((var(--stepper-marker)_-_2px)/2)]"
      )}
    >
      <span
        className={cn(
          "absolute inset-0 rounded-full bg-primary-accent transition-[scale] duration-(--duration-spring) ease-(--ease-spring)",
          direcao === "x" ? "origin-left" : "origin-top",
          // `scale` direto (e não as variáveis `--tw-scale-*`): a transição
          // anima a propriedade, e o valor de cada estado fica legível aqui.
          concluida ? "[scale:1_1]" : direcao === "x" ? "[scale:0_1]" : "[scale:1_0]"
        )}
      />
    </span>
  )

  const textos = (
    <span data-slot="stepper-text" className="flex min-w-0 flex-col">
      <span
        data-slot="stepper-label"
        className={cn(
          "min-w-0 text-sm leading-tight transition-colors duration-(--duration-slow)",
          state === "upcoming" ? "text-muted-foreground" : "text-foreground",
          state === "current" && "font-medium",
          state === "error" && "text-destructive"
        )}
      >
        {nome}
      </span>
      {description ? (
        <span data-slot="stepper-description" className="text-xs text-muted-foreground">
          {description}
        </span>
      ) : null}
    </span>
  )

  const corpo = vertical ? (
    // Na vertical: o marcador e o conector numa coluna, os textos ao lado — o
    // conector cresce com a descrição em vez de ter altura cravada.
    <span className="flex min-w-0 gap-3">
      <span className="flex flex-col items-start">
        {marcador}
        {!isLast ? conector("y") : null}
      </span>
      <span className={cn("min-w-0 pt-[calc((var(--stepper-marker)_-_1.25rem)/2)]", !isLast && "pb-4")}>
        {textos}
      </span>
    </span>
  ) : (
    <>
      <span className="flex min-w-0 items-center gap-2">
        {marcador}
        {!isLast ? conector("x") : null}
      </span>
      {conteudo ? (
        <span
          className={cn(
            // `sr-only` abaixo de `sm`, e não `hidden`: o leitor de tela continua
            // ouvindo o nome. A saída para o telefone é `responsive` ou `vertical`.
            "sr-only sm:not-sr-only sm:block",
            // Centrado no marcador, e não na célula; a primeira é a exceção,
            // porque o marcador dela encosta na borda da trilha.
            "sm:w-max sm:max-w-40 sm:ms-[calc(var(--stepper-marker)/2)] sm:-translate-x-1/2 sm:text-center",
            step === 1 && "sm:ms-0 sm:translate-x-0 sm:text-left"
          )}
        >
          {textos}
        </span>
      ) : null}
    </>
  )

  const estadoAudivel = <span className="sr-only">{ESTADO_EM_PALAVRAS[state]}</span>

  const corpoClassName = cn(
    // `text-left` em todos: o item do modo interativo é sempre `button`, e
    // botão centra o texto por padrão — os desabilitados saíam recuados.
    "flex min-w-0 flex-col text-left",
    !vertical && "gap-1.5",
    // Só quando a etapa navega. O par `active:` não é cortesia: `hover:`
    // compila dentro de `@media (hover: hover)` e não existe no telefone.
    (asChild || clicavel) &&
      "cursor-pointer rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/45 [&_[data-slot=stepper-label]]:hover:text-foreground [&_[data-slot=stepper-label]]:hover:underline [&_[data-slot=stepper-label]]:active:text-foreground"
  )

  return (
    <li
      data-slot="stepper-item"
      data-state={state}
      aria-current={state === "current" ? "step" : undefined}
      className={cn(
        "flex min-w-0 flex-col",
        // O último não estica — senão reserva a largura de um item inteiro
        // para mostrar um marcador de 24px.
        !vertical && (isLast ? "flex-none" : "flex-1"),
        className
      )}
      {...props}
    >
      {elementoFilho ? (
        <Slot.Root className={corpoClassName}>
          {React.cloneElement(
            elementoFilho,
            undefined,
            <>
              {corpo}
              {estadoAudivel}
            </>
          )}
        </Slot.Root>
      ) : irPara !== null ? (
        // **No modo interativo todo item é botão**, desabilitado quando não
        // clica. Trocar de `div` para `button` ao concluir remontava a
        // subárvore, e a trilha nascia cheia em vez de encher — medido.
        <button
          type="button"
          data-slot="stepper-trigger"
          disabled={!clicavel}
          className={cn(corpoClassName, "disabled:cursor-default")}
          onClick={() => irPara?.(index)}
        >
          {corpo}
          {estadoAudivel}
        </button>
      ) : (
        <div className={corpoClassName}>
          {corpo}
          {estadoAudivel}
        </div>
      )}
    </li>
  )
}

Object.assign(StepperItem, { [MARCA_DE_ITEM]: true })

/**
 * O painel de uma etapa. Só o da etapa atual monta, e ele entra deslizando
 * do lado para onde o fluxo andou — da direita ao avançar, da esquerda ao
 * voltar.
 */
function StepperContent({
  className,
  value,
  ...props
}: React.ComponentProps<"div"> & { value: number }) {
  const ctx = useStepper()
  if (ctx.value !== value) return null
  return (
    <div
      data-slot="stepper-content"
      data-direction={ctx.sentido === 1 ? "forward" : "backward"}
      className={cn(
        "animate-in fade-in-0 animation-duration-(--duration-spring) ease-(--ease-spring)",
        ctx.sentido === 1 ? "slide-in-from-right-4" : "slide-in-from-left-4",
        className
      )}
      {...props}
    />
  )
}

/** A linha dos botões do fluxo: Voltar à esquerda, Continuar à direita. */
function StepperActions({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="stepper-actions"
      className={cn("flex items-center justify-between gap-2", className)}
      {...props}
    />
  )
}

function StepperPrevious({
  children = "voltar",
  onClick,
  ...props
}: React.ComponentProps<typeof Button>) {
  const ctx = useStepper()
  const primeiro = ctx.value === null || ctx.value <= 0
  return (
    <Button
      type="button"
      variant="tertiary"
      data-slot="stepper-previous"
      disabled={primeiro || props.disabled}
      onClick={(e) => {
        onClick?.(e)
        if (!e.defaultPrevented && ctx.value !== null) ctx.irPara?.(ctx.value - 1)
      }}
      {...props}
    >
      {children}
    </Button>
  )
}

/**
 * Continuar — e, na última etapa, **Concluir**. `onNext` pode devolver uma
 * `Promise` (validar, salvar): o botão mostra a roda e trava até ela
 * assentar, e só avança se ela não devolver `false`. `pending` liga a espera
 * por fora.
 */
function StepperNext({
  children,
  onNext,
  pending: pendingProp = false,
  ...props
}: Omit<React.ComponentProps<typeof Button>, "onClick"> & {
  onNext?: () => boolean | void | Promise<boolean | void>
  pending?: boolean
}) {
  const ctx = useStepper()
  const [esperando, setEsperando] = React.useState(false)
  const pending = pendingProp || esperando
  const ultimo = ctx.value !== null && ctx.value >= ctx.total - 1
  const rotulo = children ?? (ultimo ? "concluir" : "continuar")

  const avancar = (resultado: boolean | void) => {
    if (resultado === false || ctx.value === null || ultimo) return
    ctx.irPara?.(ctx.value + 1)
  }

  return (
    <Button
      type="button"
      data-slot="stepper-next"
      aria-busy={pending || undefined}
      disabled={pending || props.disabled}
      onClick={() => {
        const r = onNext?.()
        if (r && typeof (r as Promise<unknown>).then === "function") {
          setEsperando(true)
          void (r as Promise<boolean | void>)
            .then(avancar)
            .finally(() => setEsperando(false))
          return
        }
        avancar(r as boolean | void)
      }}
      {...props}
    >
      {pending ? <Spinner aria-hidden /> : null}
      {rotulo}
    </Button>
  )
}

export {
  Stepper,
  StepperActions,
  StepperContent,
  StepperItem,
  StepperNext,
  StepperPrevious,
  useStepper,
}
export type { StepState }
