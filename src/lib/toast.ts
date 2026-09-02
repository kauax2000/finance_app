import { toast as sonnerToast } from "sonner"

export { toast } from "sonner"

/**
 * As durações, e por que elas são diferentes.
 *
 * O tempo de um toast é o tempo de **ler e decidir**, não um número redondo. Um
 * sucesso já aconteceu e só precisa ser percebido; um erro precisa ser lido; um
 * erro com descrição precisa ser lido duas vezes; e um desfazer precisa durar a
 * janela de arrependimento inteira — quem apagou por engano leva alguns
 * segundos para perceber.
 *
 * `TOAST_DEFAULT_MS` é o que o `Toaster` lê. Ele e `TOAST_SUCCESS_MS` eram dois
 * `4000` iguais sem relação declarada, um aqui e um no componente: o primeiro a
 * mudar deixaria o outro para trás.
 */
export const TOAST_DEFAULT_MS = 4000
export const TOAST_SUCCESS_MS = TOAST_DEFAULT_MS
export const TOAST_WARNING_MS = 5000
export const TOAST_ERROR_MS = 6000
export const TOAST_UNDO_MS = 8000

const pageFetchId = (pageId: string) => `page-fetch:${pageId}`

/** Replaces previous fetch error for this page id (avoids spam on retries). */
export function toastPageFetchError(pageId: string, message: string) {
  sonnerToast.error(message, { id: pageFetchId(pageId), duration: TOAST_ERROR_MS })
}

export function dismissPageFetchError(pageId: string) {
  sonnerToast.dismiss(pageFetchId(pageId))
}

export function toastSuccess(message: string) {
  sonnerToast.success(message, { duration: TOAST_SUCCESS_MS })
}

export function toastError(message: string) {
  sonnerToast.error(message, { duration: TOAST_ERROR_MS })
}

export function toastErrorWithDescription(message: string, description: string) {
  sonnerToast.error(message, {
    description,
    duration: TOAST_ERROR_MS * 2,
  })
}

export function toastWarning(message: string) {
  sonnerToast.warning(message, { duration: TOAST_WARNING_MS })
}

/**
 * O `info` faltava.
 *
 * O tipo já estava estilizado em `globals.css` — com `--normal-bg`,
 * `--normal-border` e `--normal-text` remapeados para os tokens de `--info` —
 * e não tinha helper, então a única forma de chegar nele era o `toast.info`
 * cru, pulando as durações daqui.
 */
export function toastInfo(message: string) {
  sonnerToast.info(message, { duration: TOAST_DEFAULT_MS })
}

/**
 * O desfazer.
 *
 * É o padrão mais valioso num app de finanças, e o mais barato: ele substitui
 * um diálogo de confirmação por uma janela de arrependimento. Apagar uma
 * transação sem perguntar nada e oferecer "Desfazer" por oito segundos custa um
 * clique a menos no caminho certo e nada no caminho errado — enquanto o
 * `AlertDialog` cobra um clique de todo mundo para proteger os poucos que
 * erraram.
 *
 * A duração é a mais longa da casa de propósito: quem apagou por engano leva
 * alguns segundos para perceber, e um desfazer que expira antes disso é um
 * desfazer que não existe.
 *
 * **Ele não substitui o `AlertDialog` no que não tem volta.** Excluir a conta,
 * sair do workspace, apagar um cartão com histórico — ali não há oito segundos
 * que resolvam, e a confirmação continua sendo a resposta.
 */
export function toastUndo(
  message: string,
  options: { onUndo: () => void; label?: string; description?: string }
) {
  sonnerToast.success(message, {
    description: options.description,
    duration: TOAST_UNDO_MS,
    action: {
      label: options.label ?? "Desfazer",
      onClick: options.onUndo,
    },
  })
}

/**
 * A operação longa, com o que acontece **durante**.
 *
 * Sincronizar, importar, gerar relatório: hoje essas viram um `toastSuccess`
 * disparado no fim, e entre o clique e ele não há nada — a pessoa clica de novo.
 * O `promise` do sonner troca a mesma bolha de carregando para o resultado, sem
 * empilhar duas.
 *
 * `error` aceita função porque a mensagem útil quase sempre está no erro; quando
 * não estiver, uma string serve.
 */
export function toastPromise<T>(
  promise: Promise<T>,
  messages: {
    loading: string
    success: string | ((data: T) => string)
    error: string | ((error: unknown) => string)
  }
) {
  return sonnerToast.promise(promise, {
    loading: messages.loading,
    success: messages.success,
    error: messages.error,
  })
}
