"use client"

import * as React from "react"
import { AlertDialog as AlertDialogPrimitive } from "radix-ui"
import { type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { dialogContentVariants } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"

function AlertDialog({
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Root>) {
  return <AlertDialogPrimitive.Root data-slot="alert-dialog" {...props} />
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
      className={cn(
        "fixed inset-0 isolate z-(--z-modal) bg-overlay duration-(--duration-slow) ease-out supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
        className
      )}
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
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Content> &
  Pick<VariantProps<typeof dialogContentVariants>, "size">) {
  return (
    <AlertDialogPortal>
      <AlertDialogOverlay />
      <AlertDialogPrimitive.Content
        data-slot="alert-dialog-content"
        data-layout="auto"
        className={cn(
          dialogContentVariants({ size, layout: "auto" }),
          className
        )}
        {...props}
      />
    </AlertDialogPortal>
  )
}

function AlertDialogHeader({
  className,
  hideSeparator = false,
  children,
  ...props
}: React.ComponentProps<"div"> & { hideSeparator?: boolean }) {
  return (
    <>
      <div
        data-slot="alert-dialog-header"
        className={cn(
          "flex w-full min-w-0 shrink-0 flex-col gap-2 text-left",
          className
        )}
        {...props}
      >
        {children}
      </div>
      {!hideSeparator ? (
        <Separator
          tone="soft"
          decorative
          className={cn(
            "-mx-(--dialog-bleed) w-auto",
            // Uma confirmação costuma ser exatamente isto: cabeçalho e rodapé,
            // nada no meio. Aí o fio do rodapé basta.
            "[&:has(+[data-slot=alert-dialog-footer])]:hidden"
          )}
        />
      ) : null}
    </>
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
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
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

function AlertDialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Description>) {
  return (
    <AlertDialogPrimitive.Description
      data-slot="alert-dialog-description"
      className={cn(
        "min-w-0 text-sm text-pretty text-muted-foreground *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-foreground *:[a]:active:text-foreground",
        className
      )}
      {...props}
    />
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
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <AlertDialogPrimitive.Action asChild>
      <Button
        data-slot="alert-dialog-action"
        type={type}
        variant={variant}
        size={size}
        className={className}
        {...props}
      />
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
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <AlertDialogPrimitive.Cancel asChild>
      <Button
        data-slot="alert-dialog-cancel"
        type={type}
        variant={variant}
        size={size}
        className={className}
        {...props}
      />
    </AlertDialogPrimitive.Cancel>
  )
}

export {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
  AlertDialogTrigger,
}
