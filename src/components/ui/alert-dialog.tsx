"use client"

import * as React from "react"
import { AlertDialog as AlertDialogPrimitive } from "radix-ui"
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
  overlayClassName,
  DialogFooter,
  DialogHeader,
  dialogContentVariants,
  dialogTitleClassName,
} from "@/components/ui/dialog"
import { Field, FieldControl, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"

/**
 * `pending` na raiz trava a ação (com `Spinner` e `pendingLabel`) e o Cancelar,
 * e o Esc deixa de fechar. `AlertDialogMedia` é o ícone na linha do título;
 * `AlertDialogList` e `AlertDialogError` vão dentro da descrição e do diálogo;
 * `AlertDialogConfirmInput` trava a ação até o texto conferir.
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
      className={cn(overlayClassName("modal"), className)}
      {...props}
    />
  )
}

/**
 * A moldura é a mesma do `Dialog` (`dialogContentVariants`), sem
 * `layout="fixed"`: uma confirmação que precisa de corpo rolável não é uma
 * confirmação.
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
  return (
    <AlertDialogPortal>
      <AlertDialogOverlay />
      <AlertDialogPrimitive.Content
        ref={ref}
        data-slot="alert-dialog-content"
        data-layout="auto"
        aria-busy={pending || undefined}
        className={cn(
          dialogContentVariants({ size, layout: "auto" }),
          // O teto que o `auto` do `Dialog` não tem: a confirmação com campo
          // rola em vez de sair da tela quando o teclado do telefone sobe.
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
 * O ícone do título: dentro do `AlertDialogHeader`, na linha do título e na cor
 * dele, sem poço. O `tone` escolhe o glifo (lixeira no `destructive`);
 * `children` troca.
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

/** Sem fio, como o `DialogHeader`: o que separa as faixas é o respiro. */
function AlertDialogHeader(props: React.ComponentProps<"div">) {
  return <DialogHeader data-slot="alert-dialog-header" {...props} />
}

/**
 * Cancelar primeiro, ação depois; no telefone a ordem se inverte na tela
 * (`flex-col-reverse`) sem mudar a ordem do DOM.
 */
function AlertDialogFooter(props: React.ComponentProps<"div">) {
  // O `sm:flex-row sm:justify-end`, a ordem invertida e o piso de 40 no dedo
  // vêm do rodapé do `Dialog`.
  return <DialogFooter data-slot="alert-dialog-footer" {...props} />
}

function AlertDialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Title>) {
  return (
    <AlertDialogPrimitive.Title
      data-slot="alert-dialog-title"
      className={cn(dialogTitleClassName, className)}
      {...props}
    />
  )
}

/**
 * A descrição é um `<div>` porque recebe a `AlertDialogList`, e lista dentro de
 * `<p>` não é HTML válido.
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
 * O que acontece, item a item. Mora dentro da `AlertDialogDescription`, para o
 * leitor de tela ler como parte do aviso.
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

/** A falha dentro do diálogo: a ação não deu certo e ele fica aberto. */
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
 * O "digite o nome para confirmar": trava a `AlertDialogAction` até o texto
 * conferir com `expected` (sem espaços nas pontas). O estado é dele.
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
 * A ação que o alerta veio propor, um `Button` de verdade (a maiúscula inicial
 * do CTA só alcança `Button`). O padrão é `destructive`, porque o `AlertDialog`
 * existe para o que não tem volta; uma confirmação que não destrói passa
 * `variant="primary"`. Não pinte o botão à mão: o `border-primary` do `primary`
 * sobrevive embaixo como fio verde.
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

/** A saída, também um `Button`: `tertiary`, porque dois contornos lado a lado pesam igual. */
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
