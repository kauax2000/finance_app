"use client"

import { useQuery } from "@tanstack/react-query"
import { fetchCategoryDetailBundle } from "@/lib/queries/fetch-category-detail-bundle"
import { categoryDetailBundleKeys } from "@/lib/queries/keys"

export function useCategoryDetailBundleQuery(args: {
    workspaceId: string | null
    userId: string | null
    categoryId: string
    yearMonth: string
    enabled: boolean
}) {
    const { workspaceId, userId, categoryId, yearMonth, enabled } = args

    return useQuery({
        queryKey: categoryDetailBundleKeys.bundle(
            workspaceId ?? "__none__",
            categoryId,
            yearMonth,
        ),
        queryFn: () =>
            fetchCategoryDetailBundle({
                workspaceId: workspaceId!,
                userId: userId!,
                categoryId,
                yearMonth,
            }),
        enabled: Boolean(workspaceId && userId && enabled),
        staleTime: 60_000,
    })
}
