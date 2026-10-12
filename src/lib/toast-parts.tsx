import type { ReactNode } from "react"

import { Progress } from "@/components/ui/progress"

/**
 * As peças com JSX dos toasts. Moram aqui e não em `lib/toast.ts`, para aquele
 * continuar `.ts`: 30 telas o importam, e renomeá-lo deixou o servidor de
 * desenvolvimento procurando o caminho antigo.
 */

/**
 * O título que o sonner desenha, com o ×N dos repetidos. Erro entra com
 * `role="alert"`: a região do sonner é `polite`, e um erro precisa
 * interromper.
 */
export function tituloDoToast(mensagem: ReactNode, tipo: "success" | "error" | "warning" | "info" | "default", n = 1) {
  return (
    <>
      <span data-slot="toast-title" role={tipo === "error" ? "alert" : undefined}>
        {mensagem}
      </span>
      {n > 1 ? (
        <span key={n} data-slot="toast-count" aria-label={`${n} vezes`}>
          ×{n}
        </span>
      ) : null}
    </>
  )
}

/** A barra e a porcentagem do `toastProgress`. */
export function progressoDoToast(message: string, pct: number, description?: ReactNode) {
  return (
    <span data-slot="toast-progress" className="flex flex-col gap-1.5">
      {description ? <span>{description}</span> : null}
      <span className="flex items-center gap-2">
        <Progress value={pct} size="sm" aria-label={message} className="flex-1" />
        <span className="nums">{pct}%</span>
      </span>
    </span>
  )
}
