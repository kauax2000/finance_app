"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"

interface GridSkeletonProps {
    count?: number
    columns?: 2 | 3 | 4
}

export function GridSkeleton({ count = 6, columns = 3 }: GridSkeletonProps) {
    const gridCols = {
        2: "grid-cols-1 md:grid-cols-2",
        3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
        4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
    }

    return (
        <div className={`grid ${gridCols[columns]} gap-4`}>
            {Array.from({ length: count }).map((_, i) => (
                <Card key={i}>
                    <CardContent className="p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Skeleton className="h-4 w-4 rounded-full" />
                                <Skeleton className="h-5 w-32" />
                            </div>
                            <Skeleton className="h-6 w-6 rounded" />
                        </div>
                        <Skeleton className="h-8 w-36" />
                        <Skeleton className="h-3 w-24" />
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
