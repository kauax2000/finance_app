import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * A linha de ações e filtros acima de uma tabela ou lista.
 *
 * Ela existe porque esse bloco já é desenhado à mão em transações, faturas e
 * membros, cada um com um espaçamento diferente. No telefone os itens quebram em
 * linhas em vez de encolher: um filtro espremido em 80px não é filtro.
 *
 * **Sem `role="toolbar"`, de propósito.** Esse papel é um contrato de teclado:
 * o grupo inteiro ocupa uma parada de tabulação e as setas andam entre os
 * controles. Aqui cada controle é tabulável por conta própria, então o papel
 * anunciava um widget que não existia — pior que não anunciar nada, porque
 * quem navega por teclado tentava as setas e nada acontecia. Enquanto o
 * comportamento não existir, isto é o que de fato é: uma linha de layout.
 * Para nomear o grupo, passe `role="group"` com `aria-label`.
 */
function Toolbar({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="toolbar"
      className={cn(
        "flex flex-wrap items-center gap-2",
        className
      )}
      {...props}
    />
  )
}

/** Grupo à esquerda: busca e filtros. Cresce e encolhe com o espaço. */
function ToolbarSearch({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="toolbar-search"
      className={cn("flex min-w-0 flex-1 items-center gap-2", className)}
      {...props}
    />
  )
}

/** Grupo à direita: as ações. Nunca encolhe. */
function ToolbarActions({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="toolbar-actions"
      className={cn("flex shrink-0 items-center gap-2", className)}
      {...props}
    />
  )
}

export { Toolbar, ToolbarActions, ToolbarSearch }
