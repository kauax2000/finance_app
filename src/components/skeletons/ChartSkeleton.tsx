"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

interface ChartSkeletonProps {
    height?: number
    showLegend?: boolean
}

export function ChartSkeleton({ height = 300, showLegend = true }: ChartSkeletonProps) {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="space-y-2">
                        <Skeleton className="h-5 w-40" />
                        <Skeleton className="h-4 w-56" />
                    </div>
                    <Skeleton className="h-4 w-4 rounded-full" />
                </div>
            </CardHeader>
            <CardContent>
                <div style={{ height: `${height}px` }} className="relative">
                    <Skeleton className="h-full w-full rounded-lg" />

                    {/* Animated shimmer effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
                </div>

                {showLegend && (
                    <div className="flex justify-center gap-4 mt-4">
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-3 w-3 rounded-full" />
                            <Skeleton className="h-3 w-16" />
                        </div>
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-3 w-3 rounded-full" />
                            <Skeleton className="h-3 w-16" />
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
