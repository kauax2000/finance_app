import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

/** Placeholder layout while auth / profile data loads on Minha conta. */
export function AccountPageSkeleton() {
    return (
        <div
            className="min-w-0 max-w-full space-y-5"
            role="status"
            aria-busy="true"
            aria-label="Carregando informações da conta"
        >
            <div className="min-w-0 space-y-2">
                <div className="flex h-8 min-w-0 items-end">
                    <Skeleton className="h-3 w-16" />
                </div>
                <Card className="gap-0 overflow-hidden border border-border py-0 shadow-none ring-0">
                    <CardContent className="flex flex-col p-0">
                        <div className="flex items-center justify-between gap-3 px-4 py-3 sm:py-3.5">
                            <div className="flex min-w-0 flex-1 items-center gap-3">
                                <Skeleton className="size-12 shrink-0 rounded-lg" />
                                <div className="min-w-0 flex-1 space-y-2">
                                    <Skeleton className="h-4 w-36 max-w-full" />
                                    <Skeleton className="h-3 w-48 max-w-full" />
                                </div>
                            </div>
                            <Skeleton className="size-9 shrink-0 rounded-md" />
                        </div>
                        <div className="flex shrink-0 items-start gap-2 border-t border-border bg-muted/15 px-4 py-3 dark:bg-muted/25">
                            <Skeleton className="mt-0.5 size-3.5 shrink-0 rounded" />
                            <Skeleton className="h-3 w-44 max-w-full" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="min-w-0 space-y-2">
                <div className="flex h-8 min-w-0 items-end">
                    <Skeleton className="h-3 w-20" />
                </div>
                <Card className="gap-0 overflow-hidden border border-border py-0 shadow-none ring-0">
                    <CardContent className="flex flex-col p-0">
                        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 sm:py-3.5">
                            <div className="flex min-w-0 flex-1 items-center gap-3">
                                <Skeleton className="h-9 w-9 shrink-0 rounded-lg" />
                                <div className="min-w-0 flex-1 space-y-2">
                                    <Skeleton className="h-4 w-32 max-w-full" />
                                    <Skeleton className="h-3 w-40 max-w-full" />
                                </div>
                            </div>
                            <Skeleton className="h-4 w-4 shrink-0 rounded" />
                        </div>
                        <div className="flex items-center justify-between gap-3 px-4 py-3 sm:py-3.5">
                            <div className="flex min-w-0 flex-1 items-center gap-3">
                                <Skeleton className="h-9 w-9 shrink-0 rounded-lg" />
                                <div className="min-w-0 flex-1 space-y-2">
                                    <Skeleton className="h-4 w-40 max-w-full" />
                                    <Skeleton className="h-3 w-44 max-w-full" />
                                </div>
                            </div>
                            <Skeleton className="h-4 w-4 shrink-0 rounded" />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
