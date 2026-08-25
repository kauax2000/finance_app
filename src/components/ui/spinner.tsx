// O tamanho do spinner varia de `size-4` a `size-8` conforme quem o usa, e
// nenhum conjunto redesenhado cobre essa faixa: micro embola a 32px e mini
// pesa a 16. Ícone de tamanho variável fica no outline de 24.
import { ArrowPathIcon } from "@heroicons/react/24/outline"
import { cn } from "@/lib/utils"
function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <ArrowPathIcon data-slot="spinner" role="status" aria-label="Carregando" className={cn("size-4 animate-spin", className)} {...props} />
  )
}

export { Spinner }
