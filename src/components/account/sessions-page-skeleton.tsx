"use client"

import {
    Card,
    CardContent,
    CardNote,
    CardToolbar,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

/**
 * O esqueleto da tela de sessões, pelo mesmo motivo do de atividade.
 */
export function SessionsPageSkeleton() {
    return (
        <div className="min-w-0 max-w-full space-y-5" role="status" aria-busy="true">
            <div className="min-w-0 space-y-4">
                <div className="flex min-w-0 items-center justify-between gap-4">
                    <div className="flex h-6 min-w-0 items-center">
                        <Skeleton className="h-4 w-28" />
                    </div>
                    <Skeleton className="h-8 w-32 shrink-0 rounded-md pointer-coarse:h-10" />
                </div>
                <Card padding="none">
                    <CardContent className="flex flex-col p-0">
                        <CardToolbar className="justify-end">
                            <Skeleton className="h-3 w-24 shrink-0" />
                        </CardToolbar>
                        <ul
                            className="flex list-none flex-col gap-2.5 px-3 py-3 sm:px-4 sm:py-4"
                            role="list"
                        >
                            {[1, 2, 3].map((i) => (
                                <li key={i} className="min-w-0">
                                    <div className="rounded-lg border border-border/80 p-3 sm:p-3.5">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex min-w-0 flex-1 items-center gap-2.5">
                                                <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
                                                <div className="min-w-0 flex-1 space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <Skeleton className="h-4 w-36 max-w-full" />
                                                        <Skeleton className="h-5 w-12 shrink-0 rounded-full" />
                                                    </div>
                                                    <Skeleton className="h-3 w-32 max-w-full" />
                                                </div>
                                            </div>
                                            <Skeleton className="h-8 w-8 shrink-0 rounded-md" />
                                        </div>
                                        <div className="mt-2 flex items-center justify-between border-t border-border/50 pt-2">
                                            <Skeleton className="h-3 w-24" />
                                            <Skeleton className="h-3 w-16" />
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                        <CardNote
                            aria-hidden
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
