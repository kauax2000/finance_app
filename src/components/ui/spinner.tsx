// O tamanho do spinner varia de `size-4` a `size-8` conforme quem o usa, e
// nenhum conjunto redesenhado cobre essa faixa: micro embola a 32px e mini
// pesa a 16. Ícone de tamanho variável fica no outline de 24.
import { ArrowPathIcon } from "@heroicons/react/24/outline"

import { cn } from "@/lib/utils"

/**
 * A roda de espera, para ação curta e sem fim conhecido.
 *
 * **Ele é decorativo por padrão, e isso é uma correção.** O componente
 * declarava `role="status"` e `aria-label="Carregando"` — mas o Heroicons põe
 * `aria-hidden="true"` no próprio `<svg>`, e o spread das nossas props não o
 * derrubava. Os três atributos conviviam no mesmo elemento e o `aria-hidden`
 * vence sempre: o role e o rótulo não faziam nada. Um spinner sozinho não
 * anunciava coisa alguma, que é exatamente o caso para o qual o role existia.
 *
 * Decorativo é o padrão certo porque o rótulo quase sempre já está do lado —
 * um botão que diz "Salvando…" não quer ouvir "Carregando" depois. Quando não
 * está, `label` liga a região viva de verdade, removendo o `aria-hidden`.
 */
function Spinner({
  className,
  label,
  ...props
}: React.ComponentProps<"svg"> & {
  /**
   * O que anunciar quando o spinner está **sozinho**, sem texto ao lado.
   * Sem ele o spinner é invisível para o leitor de tela, de propósito.
   */
  label?: string
}) {
  return (
    <ArrowPathIcon
      data-slot="spinner"
      className={cn("size-4 animate-spin", className)}
      {...(label
        ? { role: "status", "aria-label": label, "aria-hidden": undefined }
        : { "aria-hidden": true })}
      {...props}
    />
  )
}

export { Spinner }
