import type { CSSProperties, ReactNode } from "react"
import { toast as sonnerToast, type ExternalToast } from "sonner"

import { progressoDoToast, tituloDoToast as titulo } from "@/lib/toast-parts"

/**
 * Os toasts do app. **Nenhuma tela importa o `toast` do sonner**: são estes
 * helpers que carregam a duração, o assunto, a contagem de repetidos e o
 * leitor de tela. A cromagem mora em `globals.css` (bloco
 * `[data-sonner-toast]`), e a pilha em `components/ui/sonner.tsx`.
 *
 * ## As durações, e por que elas são diferentes
 *
 * O tempo de um toast é o tempo de **ler e decidir**, não um número redondo. Um
 * sucesso já aconteceu e só precisa ser percebido; um erro precisa ser lido; um
 * erro com descrição precisa ser lido duas vezes; e um desfazer precisa durar a
 * janela de arrependimento inteira.
 */
export const TOAST_DEFAULT_MS = 4000
export const TOAST_SUCCESS_MS = TOAST_DEFAULT_MS
export const TOAST_WARNING_MS = 5000
export const TOAST_ERROR_MS = 6000
export const TOAST_UNDO_MS = 8000
export const TOAST_PILL_MS = 2000

type Tipo = "success" | "error" | "warning" | "info"

/** Uma ação do toast: um clique, ou uma rota (o "Ver" depois de salvar). */
export type ToastAction =
  | { label: string; onClick: () => void }
  | { label: string; href: string }

export type ToastOptions = {
  /** A segunda linha: texto, um `MoneyDisplay`, um avatar. */
  description?: ReactNode
  /**
   * **O assunto.** Dois toasts com o mesmo `id` são a mesma bolha: o segundo
   * substitui o primeiro — é assim que um "Salvo" toma o lugar do "Não foi
   * possível salvar" do mesmo formulário, em vez de os dois ficarem na pilha.
   */
  id?: string
  /** A ação principal. */
  action?: ToastAction
  /** A segunda ação, mais quieta ("Agora não", "Detalhes"). */
  cancel?: { label: string; onClick?: () => void }
  duration?: number
}

/**
 * Quem navega é o `Toaster`, que tem o roteador: ele se registra aqui ao montar.
 * Sem ele (num teste, antes de hidratar), o "Ver" cai no `location`.
 */
let navegar: ((href: string) => void) | null = null
export function registrarNavegacaoDoToast(fn: ((href: string) => void) | null) {
  navegar = fn
}

function irPara(href: string) {
  if (navegar) navegar(href)
  else window.location.assign(href)
}

function paraAcao(a: ToastAction | undefined): ExternalToast["action"] {
  if (!a) return undefined
  return {
    label: a.label,
    onClick: "href" in a ? () => irPara(a.href) : a.onClick,
  }
}

/**
 * Os repetidos. O mesmo aviso disparado com a bolha ainda à vista
 * não empilha: a bolha fica, mostra ×2, ×3, e o tempo recomeça. Uma rajada de
 * cinco requisições falhando vira um toast só.
 *
 * O tempo recomeça porque a `duration` alterna 1ms a cada emissão (a
 * repetição, e também a bolha que um `id` substitui): o sonner só zera o
 * relógio quando ela **muda**.
 */
const repetidos = new Map<string, { id: string; n: number }>()
let sequencia = 0
/** A cada emissão a fase alterna — é ela que recomeça o relógio do sonner. */
let fase = 0

function ativo(id: string) {
  return sonnerToast.getToasts().some((t) => t.id === id)
}

function emitir(tipo: Tipo, mensagem: string, duracaoPadrao: number, opts: ToastOptions = {}) {
  const duracao = opts.duration ?? duracaoPadrao
  const chave = opts.id ?? `${tipo}:${mensagem}`
  const anterior = repetidos.get(chave)
  const repete = anterior && ativo(anterior.id) && !opts.id
  const id = repete ? anterior.id : (opts.id ?? `toast-${++sequencia}`)
  const n = repete ? anterior.n + 1 : 1
  repetidos.set(chave, { id, n })

  const temporizado = Number.isFinite(duracao)
  fase = (fase + 1) % 2
  sonnerToast[tipo](titulo(mensagem, tipo, n), {
    id,
    testId: id,
    description: opts.description,
    duration: temporizado ? duracao + fase : duracao,
    // A bolha que um `id` substitui deixa a classe da anterior (a roda do
    // Desfazer): o sonner mescla o toast novo sobre o velho.
    className: undefined,
    action: paraAcao(opts.action),
    cancel: opts.cancel
      ? { label: opts.cancel.label, onClick: opts.cancel.onClick ?? (() => undefined) }
      : undefined,
    onDismiss: () => repetidos.delete(chave),
    onAutoClose: () => repetidos.delete(chave),
  })
  return id
}

export function toastSuccess(message: string, opts?: ToastOptions) {
  return emitir("success", message, TOAST_SUCCESS_MS, opts)
}

export function toastError(message: string, opts?: ToastOptions) {
  return emitir("error", message, TOAST_ERROR_MS, opts)
}

/** O erro que precisa ser lido duas vezes: o dobro do tempo. */
export function toastErrorWithDescription(message: string, description: ReactNode, opts?: ToastOptions) {
  return emitir("error", message, TOAST_ERROR_MS * 2, { ...opts, description })
}

export function toastWarning(message: string, opts?: ToastOptions) {
  return emitir("warning", message, TOAST_WARNING_MS, opts)
}

export function toastInfo(message: string, opts?: ToastOptions) {
  return emitir("info", message, TOAST_DEFAULT_MS, opts)
}

export function dismissToast(id: string) {
  sonnerToast.dismiss(id)
}

const pageFetchId = (pageId: string) => `page-fetch:${pageId}`

/** Substitui o erro anterior desta página, em vez de empilhar a cada tentativa. */
export function toastPageFetchError(pageId: string, message: string) {
  return toastError(message, { id: pageFetchId(pageId) })
}

export function dismissPageFetchError(pageId: string) {
  sonnerToast.dismiss(pageFetchId(pageId))
}

/**
 * O aviso que espera uma decisão — hoje a nova versão do app. Não some
 * sozinho: sem o clique nada acontece.
 */
export function toastPersistentAction(
  message: string,
  opts: { id: string; label: string; onClick: () => void; description?: ReactNode }
) {
  return emitir("info", message, Infinity, {
    id: opts.id,
    description: opts.description,
    action: { label: opts.label, onClick: opts.onClick },
  })
}

/**
 * A confirmação de uma palavra: "Copiado", "Salvo". Uma pílula
 * no mesmo canto dos outros avisos, sem descrição nem ×, por dois segundos.
 * Para o que tem consequência, o toast inteiro.
 */
export function toastPill(message: string, tipo: Tipo = "success") {
  return sonnerToast[tipo](titulo(message, tipo), {
    duration: TOAST_PILL_MS,
    closeButton: false,
    className: "toast-pill",
  })
}

/**
 * O desfazer, e a janela de arrependimento à vista.
 *
 * É o padrão mais valioso num app de finanças: troca um diálogo de confirmação
 * por oito segundos de volta. O botão é o mesmo de toda ação (o do "Ver"), com
 * uma **roda que esvazia** com o tempo antes do rótulo, e o resultado troca
 * **a mesma bolha** — o "Desfazendo…" e depois "Restaurado",
 * ou o erro — em vez de empilhar outra.
 * `onUndo` pode devolver uma `Promise`.
 *
 * **Ele não substitui o `AlertDialog` no que não tem volta.** Excluir a conta,
 * sair do workspace, apagar um cartão com histórico — ali a confirmação
 * continua sendo a resposta.
 */
export function toastUndo(
  message: string,
  options: {
    onUndo: () => void | Promise<unknown>
    label?: string
    description?: ReactNode
    /** O que a bolha diz depois de desfeito. */
    undone?: string
    /** O que ela diz se desfazer falhar. */
    undoError?: string
  }
) {
  const id = `toast-${++sequencia}`
  sonnerToast.success(titulo(message, "success"), {
    id,
    testId: id,
    description: options.description,
    duration: TOAST_UNDO_MS,
    className: "toast-undo",
    style: { "--toast-duration": `${TOAST_UNDO_MS}ms` } as CSSProperties,
    action: {
      label: options.label ?? "Desfazer",
      onClick: (event) => {
        // A bolha não fecha no clique: ela vira o resultado.
        event.preventDefault()
        const feito = options.undone ?? "Desfeito"
        const falhou = options.undoError ?? "Não foi possível desfazer"
        const resultado = options.onUndo()
        if (resultado instanceof Promise) {
          sonnerToast.loading(titulo("Desfazendo…", "default"), { id, action: undefined, description: undefined })
          resultado.then(
            () => toastSuccess(feito, { id }),
            () => toastError(falhou, { id })
          )
        } else {
          toastSuccess(feito, { id })
        }
      },
    },
  })
  return id
}

/**
 * A operação longa, com o que acontece **durante**: sincronizar, importar,
 * gerar relatório. A mesma bolha vai de "carregando" ao resultado, sem empilhar
 * duas. `error` aceita função porque a mensagem útil quase sempre está no erro.
 */
export function toastPromise<T>(
  promise: Promise<T>,
  messages: {
    loading: string
    success: string | ((data: T) => string)
    error: string | ((error: unknown) => string)
    /** O "Ver" do resultado. */
    action?: ToastAction
  }
) {
  return sonnerToast.promise(promise, {
    loading: titulo(messages.loading, "default"),
    success: (data: T) => ({
      message: titulo(
        typeof messages.success === "function" ? messages.success(data) : messages.success,
        "success"
      ),
      action: paraAcao(messages.action),
    }),
    error: (erro: unknown) =>
      titulo(
        typeof messages.error === "function" ? messages.error(erro) : messages.error,
        "error"
      ),
  })
}

/**
 * O progresso com número: importar, enviar. Chame de novo com o
 * mesmo `id` a cada passo — a bolha é a mesma, e a barra anda. Ao terminar,
 * `toastSuccess(…, { id })` a substitui pelo resultado.
 */
export function toastProgress(
  id: string,
  message: string,
  value: number,
  opts?: { description?: ReactNode }
) {
  const pct = Math.max(0, Math.min(100, Math.round(value)))
  return sonnerToast.loading(titulo(message, "default"), {
    id,
    testId: id,
    className: "toast-progress",
    description: progressoDoToast(message, pct, opts?.description),
  })
}
