"use client"


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
