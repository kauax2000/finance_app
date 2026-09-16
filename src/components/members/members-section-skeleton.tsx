"use client"

import {
    Card,
    CardContent,
    CardNote,
    CardToolbar,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

/**
 * O esqueleto da lista de membros, pelo mesmo motivo dos outros dois.
 */
export function MembersSectionSkeleton() {
    return (
        <div className="min-w-0 space-y-4">
            <div className="flex h-6 min-w-0 items-center">
                <Skeleton className="h-4 w-24" />
            </div>
            <Card padding="none">
                <CardContent className="flex flex-col p-0">
                    <CardToolbar>
                        <Skeleton className="h-4 w-32 max-w-[55%]" />
                        <Skeleton className="h-4 w-20 shrink-0" />
                    </CardToolbar>
                    <ul
                        className="flex list-none flex-col gap-2.5 px-3 py-3 sm:px-4 sm:py-4"
                        role="list"
                    >
                        {[1, 2, 3].map((i) => (
                            <li key={i} className="min-w-0">
                                <div className="rounded-lg border border-border/80 bg-muted/30 p-3 sm:p-3.5">
                                    <div className="flex items-center gap-3">
                                        <Skeleton className="size-9 shrink-0 rounded-lg" />
                                        <div className="min-w-0 flex-1 space-y-2">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <Skeleton className="h-4 w-28 max-w-full" />
                                                <Skeleton className="h-5 w-14 shrink-0 rounded-full" />
                                            </div>
                                            <Skeleton className="h-3 w-40 max-w-full" />
                                        </div>
                                        <Skeleton className="size-8 shrink-0 rounded-md" />
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                    <CardNote>
                        <Skeleton className="mt-0.5 size-3.5 shrink-0 rounded" />
                        <Skeleton className="h-3 w-full max-w-md" />
                    </CardNote>
                </CardContent>
            </Card>
        </div>
    )
}
