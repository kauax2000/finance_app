"use client"

import Link from "next/link"
import { ChevronRightIcon } from "@heroicons/react/24/outline"
import { ROUTES } from "@/config/navigation"

function parseCategoriesSubroute(pathname: string): "new" | "detail" | null {
    const parts = pathname.split("/").filter(Boolean)
    if (parts.length !== 2 || parts[0] !== "categories") return null
    if (parts[1] === "new") return "new"
    return "detail"
}

export function useDashboardCategoriesSubrouteLabels(pathname: string): null | {
    titleLabel: string
    kind: "new" | "detail"
} {
    const kind = parseCategoriesSubroute(pathname)

    if (!kind) return null

    const titleLabel =
        kind === "new" ? "Nova categoria" : "Detalhes da categoria"

    return { titleLabel, kind }
}

/** Desktop breadcrumb in `AppHeader` for `/categories/new` (Nova categoria) and `/categories/[id]` (Detalhes da categoria). */
export function DashboardCategorySubrouteDesktopNav({ pathname }: { pathname: string }) {
    const parsed = useDashboardCategoriesSubrouteLabels(pathname)
    if (!parsed) return null

    return (
        <div className="hidden min-w-0 items-center gap-2 text-sm md:flex">
            <Link
                href={ROUTES.DASHBOARD_CATEGORIES}
                className="min-w-0 max-w-[45%] truncate text-muted-foreground transition-colors hover:text-foreground"
            >
                Categorias
            </Link>
            <ChevronRightIcon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            <h1 className="min-w-0 flex-1 truncate text-base font-medium leading-none text-foreground">
                {parsed.titleLabel}
            </h1>
        </div>
    )
}

export function isDashboardCategoriesSubroute(pathname: string): boolean {
    return parseCategoriesSubroute(pathname) !== null
}
