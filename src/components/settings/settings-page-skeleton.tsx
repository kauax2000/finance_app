import { Card, CardContent } from "@/components/ui/card"
import { Skeleton, SkeletonGroup } from "@/components/ui/skeleton"

/** Placeholder das Configurações: a coluna de menu e dois cartões. */
export function SettingsPageSkeleton() {
    return (
        <SkeletonGroup className="flex min-w-0 max-w-full gap-4" label="Carregando configurações…" delay>
            <div className="hidden w-52 shrink-0 space-y-2 lg:block">
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-9 w-full" />
            </div>
            <div className="min-w-0 flex-1 space-y-5">
                {[0, 1].map((i) => (
                    <Card key={i} padding="none">
                        <CardContent className="space-y-3 p-4">
                            <Skeleton className="h-4 w-40 max-w-full" />
                            <Skeleton className="h-3 w-64 max-w-full" />
                            <Skeleton className="h-9 w-full" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        </SkeletonGroup>
    )
}
