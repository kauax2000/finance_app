"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

interface ListSkeletonProps {
    rows?: number
    showAvatar?: boolean
    showActions?: boolean
    columns?: number
}

export function ListSkeleton({
    rows = 5,
    showAvatar = true,
    showActions = true,
    columns = 2
}: ListSkeletonProps) {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="space-y-2">
                        <Skeleton className="h-5 w-40" />
                        <Skeleton className="h-4 w-56" />
                    </div>
                    <Skeleton className="h-10 w-32" />
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                {Array.from({ length: rows }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4 flex-1">
                            {showAvatar && <Skeleton className="h-10 w-10 rounded-full" />}
                            <div className="space-y-2 flex-1">
                                <Skeleton className="h-4 w-3/4 max-w-md" />
                                <Skeleton className="h-3 w-1/2 max-w-sm" />
                            </div>
                        </div>
                        {showActions && (
                            <div className="flex items-center gap-2">
                                <Skeleton className="h-5 w-20" />
                                <Skeleton className="h-8 w-8" />
                                <Skeleton className="h-8 w-8" />
                            </div>
                        )}
                    </div>
                ))}
            </CardContent>
        </Card>
    )
}
