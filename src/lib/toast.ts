import { toast as sonnerToast } from "sonner"

export { toast } from "sonner"

export const TOAST_SUCCESS_MS = 4000
export const TOAST_ERROR_MS = 6000
export const TOAST_WARNING_MS = 5000

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
