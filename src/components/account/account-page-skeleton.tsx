import { Card, CardContent, CardNote } from "@/components/ui/card"
import { Skeleton, SkeletonGroup } from "@/components/ui/skeleton"

/** Placeholder layout while auth / profile data loads on Minha conta. */
export function AccountPageSkeleton() {
    return (
        <SkeletonGroup className="min-w-0 max-w-full space-y-5" label="Carregando informações da conta…" delay>
            <div className="min-w-0 space-y-4">
                <div className="flex h-6 min-w-0 items-center">
                    <Skeleton className="h-4 w-16" />
                </div>
                <Card padding="none">
                    <CardContent className="flex flex-col">
                        <div className="flex items-center justify-between gap-3 px-4 py-3 sm:py-3.5">
                            <div className="flex min-w-0 flex-1 items-center gap-3">
                                <Skeleton shape="circle" size="lg" />
                                <div className="min-w-0 flex-1 space-y-2">
                                    <Skeleton className="h-4 w-36 max-w-full" />
                                    <Skeleton className="h-3 w-48 max-w-full" />
                                </div>
                            </div>
                            <Skeleton shape="tile" size="lg" />
                        </div>
                        <CardNote>
                            <Skeleton className="mt-0.5 size-3.5 shrink-0 rounded" />
                            <Skeleton className="h-3 w-44 max-w-full" />
                        </CardNote>
                    </CardContent>
                </Card>
            </div>

            <div className="min-w-0 space-y-4">
                <div className="flex h-6 min-w-0 items-center">
                    <Skeleton className="h-4 w-20" />
                </div>
                <Card padding="none">
                    <CardContent className="flex flex-col">
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
        </SkeletonGroup>
    )
}
