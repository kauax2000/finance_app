"use client"

import { useEffect, type ComponentProps } from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { Toaster as Sonner, toast } from "sonner"
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XCircleIcon,
  XMarkIcon,
} from "@heroicons/react/16/solid"

import { Spinner } from "@/components/ui/spinner"
import { registrarNavegacaoDoToast, TOAST_DEFAULT_MS } from "@/lib/toast"

type ToasterProps = ComponentProps<typeof Sonner>

/**
 * A pilha de toasts do app.
 * Decisão: a posição (`top-right`), o desvio no telefone, o botão de fechar, a
 * placa flutuante de vidro, a pausa honesta e o Esc. Padrão do sonner, mantido:
 * empilhamento (3 à vista, abrindo no cursor), arraste para dispensar,
 * `promise`, deduplicação por `id` e o ⌥T que leva o foco à pilha.
 * A cromagem mora em `globals.css`, no bloco `[data-sonner-toast]`, porque o
 * sonner renderiza fora da árvore de classes do Tailwind. Nenhuma tela chama o
 * `toast` do sonner: os helpers de `@/lib/toast` levam duração, assunto e contagem.
 * Os ícones são Heroicons (o sonner desenha os próprios, em `node_modules`, fora
 * do alcance do ESLint e do auditor), entrando pelo prop `icons`; o `Spinner` é
 * o do `loading`, porque a roda é o comportamento.
 * `mobileOffset.top` parte da base da barra fixa, ou da área segura sem ela; sem
 * isso o toast nasce atrás da barra ou do notch. No topo porque embaixo está a
 * ilha de navegação.
 */
export function Toaster({ ...props }: ToasterProps) {
  const { resolvedTheme } = useTheme()
  const router = useRouter()

  // O "Ver" de um toast navega pelo roteador, sem recarregar a página.
  useEffect(() => {
    registrarNavegacaoDoToast((href) => router.push(href))
    return () => registrarNavegacaoDoToast(null)
  }, [router])

  useEffect(() => {
    /**
     * A pausa honesta: o sonner para o relógio com o cursor na pilha e com a aba
     * escondida, mas não com o foco, e quem chega ao "Desfazer" pelo Tab (ou ⌥T)
     * veria o tempo correr. A pausa é o estado "aberta", que o React liga num
     * `mousemove` e desliga num `mouseout` para fora da lista; o foco entrando
     * despacha o primeiro, e saindo, o segundo.
     */
    const lista = (alvo: EventTarget | null) =>
      alvo instanceof Element ? alvo.closest<HTMLElement>("[data-sonner-toaster]") : null

    const entrou = (e: FocusEvent) => {
      const ol = lista(e.target)
      if (ol && !lista(e.relatedTarget)) {
        ol.dispatchEvent(new MouseEvent("mousemove", { bubbles: true }))
      }
    }
    const saiu = (e: FocusEvent) => {
      const ol = lista(e.target)
      if (ol && lista(e.relatedTarget) !== ol && !ol.matches(":hover")) {
        ol.dispatchEvent(new MouseEvent("mouseout", { bubbles: true, relatedTarget: document.body }))
      }
    }
    // Esc fecha o toast que tem o foco. O sonner só recolhe a pilha.
    const tecla = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return
      const li = (document.activeElement as HTMLElement | null)?.closest<HTMLElement>("[data-sonner-toast]")
      const id = li?.dataset.testid
      if (id) toast.dismiss(id)
    }

    // A aba escondida marca o `<html>`, para a roda do Desfazer — uma animação
    // de CSS — parar junto do relógio do sonner.
    const visibilidade = () => {
      document.documentElement.toggleAttribute("data-toast-paused", document.hidden)
    }

    document.addEventListener("visibilitychange", visibilidade)
    document.addEventListener("focusin", entrou)
    document.addEventListener("focusout", saiu)
    document.addEventListener("keydown", tecla)
    return () => {
      document.removeEventListener("visibilitychange", visibilidade)
      document.removeEventListener("focusin", entrou)
      document.removeEventListener("focusout", saiu)
      document.removeEventListener("keydown", tecla)
    }
  }, [])

  return (
    <Sonner
      theme={resolvedTheme === "dark" ? "dark" : "light"}
      position="top-right"
      closeButton
      visibleToasts={3}
      // Os rótulos do sonner vêm em inglês ("Notifications", "Close toast").
      containerAriaLabel="Notificações"
      // Sem `z-(--z-toast)`: o sonner declara `z-index: 999999999` fora de camada, e a
      // utility perderia calada. O toast já fica acima de tudo.
      className="toaster"
      // Abaixo da barra do topo, e não por cima dela: o topo da pilha é
      // `--top-bar-bottom` mais 12px. Sem barra (as telas de acesso), 16px do topo; no
      // telefone, abaixo do notch.
      offset={{
        top: "max(calc(var(--top-bar-bottom) + 12px), 1rem)",
        right: "1rem",
        bottom: "1rem",
        left: "1rem",
      }}
      mobileOffset={{
        top: "calc(max(var(--top-bar-bottom), env(safe-area-inset-top, 0px)) + 12px)",
      }}
      icons={{
        success: <CheckCircleIcon aria-hidden />,
        info: <InformationCircleIcon aria-hidden />,
        warning: <ExclamationTriangleIcon aria-hidden />,
        error: <XCircleIcon aria-hidden />,
        loading: <Spinner />,
        close: <XMarkIcon aria-hidden />,
      }}
      toastOptions={{
        duration: TOAST_DEFAULT_MS,
        closeButtonAriaLabel: "Fechar notificação",
        classNames: {
          toast: "toast",
        },
      }}
      {...props}
    />
  )
}
