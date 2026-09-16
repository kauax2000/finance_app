"use client"

import {
    Card,
    CardContent,
    CardNote,
    CardToolbar,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

/**
 * O esqueleto da tela de atividade. Ele morava dentro do `page-client`, e um
 * componente declarado em `src/app/` é invisível para qualquer outra tela.
 */
export function ActivityPageSkeleton() {
    return (
        <div className="min-w-0 max-w-full space-y-5" role="status" aria-busy="true">
            <div className="min-w-0 space-y-4">
                <div className="flex h-6 min-w-0 items-center">
                    <Skeleton className="h-4 w-36" />
                </div>
                <Card padding="none">
                    <CardContent className="flex flex-col p-0">
                        <CardToolbar className="justify-end">
                            <Skeleton className="h-3 w-28 shrink-0" />
                        </CardToolbar>
                        <CardToolbar>
                            <div className="flex flex-wrap gap-2">
                                {[1, 2, 3, 4].map((i) => (
                                    <Skeleton key={i} className="h-8 w-24 shrink-0 rounded-full" />
                                ))}
                            </div>
                        </CardToolbar>
                        <ul className="divide-y divide-border" role="list">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <li key={i}>
                                    <div className="flex items-start gap-3 px-4 py-2.5">
                                        <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
                                        <div className="min-w-0 flex-1 space-y-1.5">
                                            <div className="flex min-w-0 items-center gap-2">
                                                <Skeleton className="h-4 min-w-0 max-w-[12rem] flex-1" />
                                                <Skeleton className="h-3 w-10 shrink-0 rounded" />
                                            </div>
                                            <Skeleton className="h-3 w-full max-w-md" />
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
        </div>
    )
}
