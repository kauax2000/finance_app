"use client"

import Link from "next/link"
import { ChevronRightIcon, ArrowLeftIcon } from "@heroicons/react/24/outline"
import { Button } from "@/components/ui/button"
import {
    APP_PAGE_TITLES,
    APP_SUB_PAGE_TITLES,
    ROUTES,
} from "@/config/navigation"
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

type AppBreadcrumbNavProps = {
    pathname: string
}

export function AppBreadcrumbNav({ pathname }: AppBreadcrumbNavProps) {
    const subPage = resolveAppSubPageMeta(pathname)

    if (!subPage) {
        const title = APP_PAGE_TITLES[pathname] ?? "Finance App"
        return (
            <h1 className="truncate text-base font-medium leading-none">
                {title}
            </h1>
        )
    }

    return (
        <div className="flex min-w-0 items-center gap-2 text-sm">
            <Link
                href={subPage.parent}
                className="min-w-0 max-w-[45%] truncate text-muted-foreground hover:text-foreground transition-colors"
            >
                {subPage.parentTitle}
            </Link>
            <ChevronRightIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
            <h1 className="min-w-0 flex-1 truncate text-base font-medium leading-none text-foreground">
                {subPage.title}
            </h1>
        </div>
    )
}

type SubPageBackButtonProps = {
    pathname: string
}

export function SubPageBackButton({ pathname }: SubPageBackButtonProps) {
    const subPage = resolveAppSubPageMeta(pathname)

    if (!subPage) {
        return null
    }

    return (
        <div className="-mt-2">
            <Button variant="ghost" size="sm" asChild className="gap-2">
                <Link href={subPage.parent}>
                    <ArrowLeftIcon className="h-4 w-4" />
                    Voltar
                </Link>
            </Button>
        </div>
    )
}
