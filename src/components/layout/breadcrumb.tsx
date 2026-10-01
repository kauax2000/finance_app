"use client"

import Link from "next/link"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
} from "@/components/ui/breadcrumb"
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

    // A trilha do sistema (rodada 202): era um link, um chevron e o `<h1>`
    // escritos à mão, com uma largura máxima cravada no ancestral no lugar da
    // regra de quem cede. O `<h1>` continua sendo a página atual, pelo
    // `asChild`.
    return (
        <Breadcrumb className="min-w-0">
            <BreadcrumbList>
                <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                        <Link href={subPage.parent}>{subPage.parentTitle}</Link>
                    </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbItem>
                    <BreadcrumbPage asChild>
                        <h1 className="text-base leading-none">{subPage.title}</h1>
                    </BreadcrumbPage>
                </BreadcrumbItem>
            </BreadcrumbList>
        </Breadcrumb>
    )
}
