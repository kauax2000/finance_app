"use client"

import * as React from "react"
import { AlertDialog as AlertDialogPrimitive } from "radix-ui"
import { useComposedRefs } from "radix-ui/internal"
import { type VariantProps } from "class-variance-authority"

import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  TrashIcon,
} from "@heroicons/react/16/solid"

import { cn } from "@/lib/utils"
import { Muted } from "@/components/ui/typography"
import { Button } from "@/components/ui/button"
import {
  DIALOG_OVERLAY_CLASS,
  dialogContentVariants,
  useOrigemDoClique,
} from "@/components/ui/dialog"
import { Field, FieldControl, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"

/**
 * ## Rodada 201
 *
 * - **`pending`** na raiz: a ação em andamento. A ação ganha o `Spinner` e o
 *   rótulo de andamento (`pendingLabel`) e trava, o Cancelar trava, e **Esc
 *   deixa de fechar** — dez telas escreviam `disabled={deleting}` nos dois
 *   botões e `deleting ? "Excluindo…" : "Excluir"` à mão, e nenhuma segurava
 *   o Esc: fechar no meio da exclusão deixava a tela mentindo.
 * - **`AlertDialogMedia`**: o ícone na linha do título, na cor dele.
 * - **`AlertDialogList`** e **`AlertDialogError`**: a lista do que acontece,
 *   dentro da descrição, e a falha dentro do diálogo, `role="alert"`.
 * - **`AlertDialogConfirmInput`**: o "digite o nome para confirmar". Montado,
 *   ele trava a ação até o texto conferir.
 */

type AlertDialogContextValue = {
  pending: boolean
  /** Um `AlertDialogConfirmInput` montado e ainda sem o texto certo. */
  bloqueado: boolean
  setBloqueado: (v: boolean) => void
}

const AlertDialogContext = React.createContext<AlertDialogContextValue>({
  pending: false,
  bloqueado: false,
  setBloqueado: () => {},
})

function AlertDialog({
  pending = false,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Root> & {
  /** A ação está correndo: trava os dois botões e o Esc. */
  pending?: boolean
}) {
  const [bloqueado, setBloqueado] = React.useState(false)
  const ctx = React.useMemo(
    () => ({ pending, bloqueado, setBloqueado }),
    [pending, bloqueado]
  )
  return (
    <AlertDialogContext.Provider value={ctx}>
      <AlertDialogPrimitive.Root data-slot="alert-dialog" {...props} />
    </AlertDialogContext.Provider>
  )
}

function AlertDialogTrigger({
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Trigger>) {
  return (
    <AlertDialogPrimitive.Trigger data-slot="alert-dialog-trigger" {...props} />
  )
}

function AlertDialogPortal({
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Portal>) {
  return (
    <AlertDialogPrimitive.Portal data-slot="alert-dialog-portal" {...props} />
  )
}

function AlertDialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Overlay>) {
  return (
    <AlertDialogPrimitive.Overlay
      data-slot="alert-dialog-overlay"
      className={cn(DIALOG_OVERLAY_CLASS, className)}
      {...props}
    />
  )
}

/**
 * A moldura, e ela é **a mesma** do `Dialog`.
 *
 * Os dois eram irmãos que mediam diferente: `Dialog` abria em `sm:max-w-sm` e
 * `AlertDialog` em `sm:max-w-md`, com a mesma string de posicionamento,
 * animação e anel copiada nos dois arquivos — de modo que corrigir a sombra ou
 * a curva num deles deixava o outro para trás. Agora a régua é uma
 * (`dialogContentVariants`), e o que muda é só o que tem razão para mudar: o
 * alerta não oferece `layout="fixed"`, porque uma confirmação que precisa de
 * corpo rolável não é uma confirmação.
 */
function AlertDialogContent({
  className,
  size,
  onEscapeKeyDown,
  ref,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Content> &
  Pick<VariantProps<typeof dialogContentVariants>, "size">) {
  const { pending } = React.useContext(AlertDialogContext)
  // Nasce de onde se clicou, como o `Dialog` (rodada 248).
  const origem = useOrigemDoClique()
  const cascoRef = useComposedRefs<HTMLDivElement>(ref, origem)
  return (
    <AlertDialogPortal>
      <AlertDialogOverlay />
      <AlertDialogPrimitive.Content
        ref={cascoRef}
        data-slot="alert-dialog-content"
        data-layout="auto"
        aria-busy={pending || undefined}
        className={cn(
          dialogContentVariants({ size, layout: "auto" }),
          // O teto que o `auto` do `Dialog` não tem: uma confirmação curta
          // nunca chega nele, e a que leva um campo (o "digite o nome") rola
          // em vez de sair da tela quando o teclado do telefone sobe.
          "max-h-[calc(100dvh-2rem)] overflow-y-auto",
          className
        )}
        onEscapeKeyDown={(event) => {
          onEscapeKeyDown?.(event)
          // Com a ação correndo, o Esc fecharia a confirmação no meio dela.
          if (pending) event.preventDefault()
        }}
        {...props}
      />
    </AlertDialogPortal>
  )
}

const MEDIA_ICONE = {
  default: InformationCircleIcon,
  info: InformationCircleIcon,
  success: CheckCircleIcon,
  warning: ExclamationTriangleIcon,
  destructive: TrashIcon,
} as const

/**
 * O ícone do título (rodada 201): vai **dentro** do `AlertDialogHeader`,
 * antes do título, e fica na linha dele, na cor dele, sem poço — a
 * referência que o dono escolheu. A descrição passa embaixo, na largura toda.
 * O `tone` escolhe o glifo (a lixeira no `destructive`); `children` troca.
 * 16px, `16/solid`, como o corpo do título.
 *
 * Ele passou por três desenhos na mesma rodada: em cima do título num poço de
 * 40 tingido, à esquerda do texto num poço de 44 com o título centrado nele,
 * e este. O poço tingido pesava mais que a frase que ele acompanha.
 */
function AlertDialogMedia({
  tone = "default",
  className,
  children,
  ...props
}: React.ComponentProps<"span"> & { tone?: keyof typeof MEDIA_ICONE }) {
  const Icone = MEDIA_ICONE[tone]
  return (
    <span
      data-slot="alert-dialog-media"
      data-tone={tone}
      aria-hidden
      className={cn(
        "col-start-1 row-start-1 flex shrink-0 self-center text-foreground [&>svg]:size-4",
        className
      )}
      {...props}
    >
      {children ?? <Icone className="size-4" />}
    </span>
  )
}

/**
 * **Sem fio**, pela mesma razão do `DialogHeader`: o diálogo é uma superfície
 * só, e o que separa as faixas é o respiro — ou o conteúdo dissolvendo, onde há
 * rolagem. Numa confirmação, que costuma ser cabeçalho e rodapé e nada no meio,
 * um traço em cada emenda era o mais gratuito de todos.
 */
function AlertDialogHeader({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-dialog-header"
      className={cn(
        "flex w-full min-w-0 shrink-0 flex-col gap-2 text-left",
        // Com o ícone, ele vai **na linha do título**, e a descrição ocupa a
        // largura toda embaixo, a partir da borda do ícone — a referência que
        // o dono escolheu. Uma grade de duas colunas: o ícone e o título na
        // primeira linha, centrados entre si; o resto atravessa as duas.
        "has-[>[data-slot=alert-dialog-media]]:grid has-[>[data-slot=alert-dialog-media]]:grid-cols-[auto_minmax(0,1fr)] has-[>[data-slot=alert-dialog-media]]:gap-x-2",
        "[&>[data-slot=alert-dialog-title]]:col-start-2",
        "[&>:not([data-slot=alert-dialog-media]):not([data-slot=alert-dialog-title])]:col-span-2",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

/**
 * Cancelar primeiro, ação depois — e no telefone a ordem se inverte na tela
 * (`flex-col-reverse`), para o polegar encontrar a ação em cima da pilha sem
 * que a ordem do DOM, que é a que o teclado e o leitor de tela seguem, mude.
 */
function AlertDialogFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-dialog-footer"
      className={cn(
        "flex shrink-0 flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        // A geometria do `DialogFooter`: sem ela a confirmação fechava com 24px
        // embaixo e o diálogo com 16, na mesma moldura.
        "-mx-(--dialog-bleed) -mb-(--dialog-bleed) rounded-b-modal px-(--dialog-px) py-4",
        className
      )}
      {...props}
    />
  )
}

function AlertDialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Title>) {
  return (
    <AlertDialogPrimitive.Title
      data-slot="alert-dialog-title"
      className={cn(
        "min-w-0 font-heading text-base leading-none font-medium text-balance",
        className
      )}
      {...props}
    />
  )
}

/**
 * A descrição é um `<div>` desde a rodada 201: ela recebe a
 * `AlertDialogList`, e uma lista dentro de `<p>` não é HTML válido — as telas
 * escreviam `asChild` com um `<div>` à mão para caber a lista. Os parágrafos
 * de dentro se afastam 8px.
 */
function AlertDialogDescription({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Description>) {
  return (
    <AlertDialogPrimitive.Description
      asChild
      data-slot="alert-dialog-description"
      {...props}
    >
      <Muted
        asChild
        className={cn(
          "min-w-0 space-y-2 text-pretty *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-foreground *:[a]:active:text-foreground",
          className
        )}
      >
        <div>{children}</div>
      </Muted>
    </AlertDialogPrimitive.Description>
  )
}

/**
 * O que acontece, item a item (rodada 201) — as consequências, ou o que sai.
 * Mora **dentro** da `AlertDialogDescription`, para o leitor de tela lê-la
 * como parte do aviso. A tinta é a cheia: a lista é o conteúdo da decisão, e
 * a frase de cima é o contexto.
 */
function AlertDialogList({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="alert-dialog-list"
      className={cn(
        "flex list-disc flex-col gap-1 ps-5 text-foreground marker:text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

/** A falha dentro do diálogo (rodada 201): a ação não deu certo, e ele fica aberto. */
function AlertDialogError({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="alert-dialog-error"
      role="alert"
      className={cn("text-sm text-destructive", className)}
      {...props}
    />
  )
}

/**
 * O "digite o nome para confirmar" (rodada 201). Montado, trava a
 * `AlertDialogAction` até o texto conferir com `expected` — sem espaços nas
 * pontas, e com maiúsculas como estão. O estado é dele: fechar o diálogo
 * desmonta o conteúdo e o campo volta vazio.
 */
function AlertDialogConfirmInput({
  expected,
  label,
  placeholder,
  disabled,
  className,
}: {
  /** O texto que libera a ação — o nome da carteira, por exemplo. */
  expected: string
  label: React.ReactNode
  placeholder?: string
  disabled?: boolean
  className?: string
}) {
  const { setBloqueado, pending } = React.useContext(AlertDialogContext)
  const [texto, setTexto] = React.useState("")
  const confere = expected.trim().length > 0 && texto.trim() === expected.trim()

  React.useEffect(() => {
    setBloqueado(!confere)
    return () => setBloqueado(false)
  }, [confere, setBloqueado])

  return (
    <Field
      data-slot="alert-dialog-confirm-input"
      invalid={texto.length > 0 && !confere}
      className={className}
    >
      <FieldLabel>{label}</FieldLabel>
      <FieldControl>
        <Input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          spellCheck={false}
          disabled={disabled || pending}
        />
      </FieldControl>
    </Field>
  )
}

/**
 * A ação que o alerta veio propor — e ela é **um `Button` de verdade**.
 *
 * Antes eram as classes de botão carimbadas num primitivo do Radix
 * (`cn(buttonVariants(), className)`), sem `variant`, sem `size` e sem o
 * `<span>` que o `Button` embrulha em volta do rótulo. Duas consequências, e
 * as duas estão no app:
 *
 * 1. **A maiúscula inicial do CTA não alcançava aqui.** É o ponto que o
 *    AGENTS.md já registrava — "a garantia é do `Button`, não do
 *    `buttonVariants()`" —, e este arquivo era um dos nove.
 * 2. **Todas as oito confirmações do app precisaram repintar o botão.** Cinco
 *    passam `className={buttonVariants({ variant: "destructive" })}`; as outras
 *    três escrevem `bg-destructive text-destructive-foreground
 *    hover:bg-destructive/90` — que não é o `destructive` do design system (esse
 *    é tonal), é um vermelho sólido inventado na tela, sem par `active:`. E como
 *    `tailwind-merge` resolve fundo com fundo mas não tem o que fazer com uma
 *    borda que ninguém sobrescreveu, **o `border-primary` do `primary` sobrevive
 *    embaixo**: um botão vermelho com um fio verde em volta, em três telas de
 *    excluir. Medido, não suposto.
 *
 * Por isso o padrão é `destructive`: um `AlertDialog` existe para a ação que não
 * tem volta, e foi o que oito de oito chamadas pediram. Uma confirmação que não
 * destrói nada passa `variant="primary"` — e aí o nome diz o que a tela quis.
 */
function AlertDialogAction({
  className,
  variant = "destructive",
  size,
  type = "button",
  pendingLabel,
  disabled,
  children,
  ...props
}: React.ComponentProps<typeof Button> & {
  /** O rótulo enquanto a raiz está `pending` — "Excluindo…". */
  pendingLabel?: React.ReactNode
}) {
  const { pending, bloqueado } = React.useContext(AlertDialogContext)
  return (
    <AlertDialogPrimitive.Action asChild>
      <Button
        data-slot="alert-dialog-action"
        type={type}
        variant={variant}
        size={size}
        className={className}
        disabled={disabled || pending || bloqueado}
        aria-busy={pending || undefined}
        {...props}
      >
        {pending ? (
          <>
            <Spinner />
            {pendingLabel ?? children}
          </>
        ) : (
          children
        )}
      </Button>
    </AlertDialogPrimitive.Action>
  )
}

/**
 * A saída, e ela também é um `Button` — mesmo motivo.
 *
 * `tertiary` não preenche nada, e é o degrau certo: dois botões de contorno
 * lado a lado pesam igual, e o olho tem que ler os dois para descobrir qual é a
 * saída.
 */
function AlertDialogCancel({
  className,
  variant = "tertiary",
  size,
  type = "button",
  disabled,
  ...props
}: React.ComponentProps<typeof Button>) {
  // Sair no meio da ação deixa a tela mentindo: com a raiz `pending`, trava.
  const { pending } = React.useContext(AlertDialogContext)
  return (
    <AlertDialogPrimitive.Cancel asChild>
      <Button
        data-slot="alert-dialog-cancel"
        type={type}
        variant={variant}
        size={size}
        className={className}
        disabled={disabled || pending}
        {...props}
      />
    </AlertDialogPrimitive.Cancel>
  )
}

export {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogConfirmInput,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogError,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogList,
  AlertDialogMedia,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
  AlertDialogTrigger,
}
