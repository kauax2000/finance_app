import { Card, CardContent } from "@/components/ui/card"
import { PageHeaderSkeleton } from "@/components/ui/page-header"
import { Skeleton, SkeletonGroup } from "@/components/ui/skeleton"

/** Placeholder das Configurações: o cabeçalho e uma coluna de dois cartões. */
export function SettingsPageSkeleton() {
    return (
        <SkeletonGroup className="min-w-0 max-w-full" label="Carregando configurações…" delay>
            <div className="min-w-0 space-y-8">
                <PageHeaderSkeleton description={false} actions={0} />
                <div className="min-w-0 space-y-5">
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
            </div>
        </SkeletonGroup>
    )
}
