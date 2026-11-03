"use client"

import { ROUTES } from "@/config/navigation"
import type { SubPageMeta } from "@/types/navigation"

export function resolveAppSubPageMeta(pathname: string): SubPageMeta | null {
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
