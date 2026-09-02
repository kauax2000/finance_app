"use client"

import type { ComponentProps } from "react"
import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XCircleIcon,
  XMarkIcon,
} from "@heroicons/react/16/solid"

import { Spinner } from "@/components/ui/spinner"
import { TOAST_DEFAULT_MS } from "@/lib/toast"

type ToasterProps = ComponentProps<typeof Sonner>

/**
 * A pilha de toasts do app.
 *
 * ## O que é decisão, e o que é padrão do sonner
 *
 * **Decisão:** a posição (`top-right`), o desvio no telefone e o botão de
 * fechar. **Padrão do sonner, mantido de propósito:** empilhamento, arraste
 * para dispensar, `promise`, deduplicação por `id` e a largura de 356px. Essa
 * física é justamente o que não se reescreve — é o mesmo julgamento da rodada
 * do `vaul`: pega-se o mecanismo emprestado e veste-se a cromagem própria.
 *
 * A cromagem mora em `globals.css`, no bloco `[data-sonner-toast]`: tipografia,
 * corpo, raio, sombra e o alvo de toque do ×. Ela precisa estar lá, e não aqui,
 * porque o sonner renderiza fora da árvore de classes do Tailwind.
 *
 * ## Os ícones são Heroicons, e não os da biblioteca
 *
 * O sonner desenha os próprios — medido no DOM: `viewBox="0 0 20 20"` sem
 * `data-slot` no ícone de tipo, `0 0 24 24` no ×. É a regra **G** do projeto
 * ("Heroicons, e só"), e era o único lugar onde ela vazava sem que nenhum
 * guarda pegasse: o ESLint olha imports e o auditor olha o repositório, e estes
 * SVGs moram em `node_modules`.
 *
 * O `Spinner` entra como ícone de `loading` pela mesma razão que ele está na
 * lista de SVG desenhado do auditor — a roda é o comportamento, não um glifo.
 *
 * ## O desvio no telefone tem uma causa
 *
 * `mobileOffset.top` soma a área segura ao cabeçalho do app (4,5rem). Sem isso
 * o toast nasce **atrás** do cabeçalho fixo. No topo e não no rodapé porque
 * embaixo está a ilha de navegação, e um toast sobre ela cobre o alvo de toque
 * mais usado do app.
 */
export function Toaster({ ...props }: ToasterProps) {
  const { resolvedTheme } = useTheme()

  return (
    <Sonner
      theme={resolvedTheme === "dark" ? "dark" : "light"}
      position="top-right"
      closeButton
      className="toaster group z-(--z-toast)"
      offset="1rem"
      mobileOffset={{
        top: "calc(env(safe-area-inset-top, 0px) + 4.5rem)",
      }}
      icons={{
        success: <CheckCircleIcon aria-hidden />,
        info: <InformationCircleIcon aria-hidden />,
        warning: <ExclamationTriangleIcon aria-hidden />,
        error: <XCircleIcon aria-hidden />,
        loading: <Spinner className="size-4" />,
        close: <XMarkIcon aria-hidden />,
      }}
      toastOptions={{
        // A duração vive em `lib/toast.ts` junto das outras: ela era 4000 aqui
        // e `TOAST_SUCCESS_MS = 4000` lá, dois números iguais sem relação
        // declarada — e o primeiro a mudar deixaria o outro para trás.
        duration: TOAST_DEFAULT_MS,
        classNames: {
          toast: "group toast",
        },
      }}
      {...props}
    />
  )
}
