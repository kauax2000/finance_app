"use client"

import { APP_SUB_PAGE_TITLES, ROUTES } from "@/config/navigation"
import type { SubPageMeta } from "@/types/navigation"

export function resolveAppSubPageMeta(pathname: string): SubPageMeta | null {
    const staticMeta = APP_SUB_PAGE_TITLES[pathname]
    if (staticMeta) return staticMeta
    if (
        /^\/credit-cards\/[^/]+$/.test(pathname) &&
        pathname !== ROUTES.CREDIT_CARDS
    ) {
        return {
            parent: ROUTES.CREDIT_CARDS,
            parentTitle: "Cartões de crédito",
            title: "Detalhes do cartão",
        }
    }
    return null
}
