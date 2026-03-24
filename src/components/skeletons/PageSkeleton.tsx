"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

interface PageSkeletonProps {
    showHeader?: boolean
    headerTitle?: boolean
    headerDescription?: boolean
    cards?: number
    showChart?: boolean
    showTable?: boolean
    tableRows?: number
}

export function PageSkeleton({
    showHeader = true,
    headerTitle = true,
    headerDescription = true,
    cards = 3,
    showChart = false,
    showTable = false,
    tableRows = 5
}: PageSkeletonProps) {
    return (
        <div className="space-y-6">
            {/* Header Skeleton */}
            {showHeader && (
                <div className="flex items-center justify-between">
                    <div className="space-y-2">
                        {headerTitle && <Skeleton className="h-9 w-48" />}
                        {headerDescription && <Skeleton className="h-4 w-64" />}
                    </div>
                    <Skeleton className="h-10 w-40" />
                </div>
            )}

            {/* Cards Skeleton */}
            {cards > 0 && (
                <div className={`grid gap-4 ${cards === 1 ? 'grid-cols-1' : cards === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-3'}`}>
                    {Array.from({ length: cards }).map((_, i) => (
                        <Card key={i}>
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-4 w-4 rounded-full" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-8 w-28 mb-2" />
                                <Skeleton className="h-3 w-20" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Chart Skeleton */}
            {showChart && (
                <Card>
                    <CardHeader>
                        <Skeleton className="h-5 w-40 mb-2" />
                        <Skeleton className="h-4 w-56" />
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] flex items-center justify-center">
                            <Skeleton className="h-full w-full" />
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Table/List Skeleton */}
            {showTable && (
                <Card>
                    <CardHeader>
                        <Skeleton className="h-5 w-40 mb-2" />
                        <Skeleton className="h-4 w-56" />
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {Array.from({ length: tableRows }).map((_, i) => (
                            <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                                <div className="flex items-center gap-3">
                                    <Skeleton className="h-10 w-10 rounded-full" />
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-32" />
                                        <Skeleton className="h-3 w-48" />
                                    </div>
                                </div>
                                <Skeleton className="h-5 w-20" />
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
