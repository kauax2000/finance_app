"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

interface CardSkeletonProps {
    count?: number
    variant?: "default" | "compact" | "wide"
}

export function CardSkeleton({ count = 1, variant = "default" }: CardSkeletonProps) {
    if (variant === "compact") {
        return (
            <div className="space-y-3">
                {Array.from({ length: count }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-1/2" />
                        </div>
                        <Skeleton className="h-5 w-16" />
                    </div>
                ))}
            </div>
        )
    }

    if (variant === "wide") {
        return (
            <div className="space-y-4">
                {Array.from({ length: count }).map((_, i) => (
                    <Card key={i}>
                        <CardContent className="p-6">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-4">
                                    <Skeleton className="h-12 w-12 rounded-lg" />
                                    <div className="space-y-2">
                                        <Skeleton className="h-5 w-40" />
                                        <Skeleton className="h-4 w-56" />
                                    </div>
                                </div>
                                <Skeleton className="h-6 w-24" />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: count }).map((_, i) => (
                <Card key={i}>
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Skeleton className="h-3 w-3 rounded-full" />
                                <Skeleton className="h-5 w-32" />
                            </div>
                            <div className="flex gap-1">
                                <Skeleton className="h-8 w-8" />
                                <Skeleton className="h-8 w-8" />
                            </div>
                        </div>
                        <Skeleton className="h-3 w-24" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-8 w-36 mb-2" />
                        <Skeleton className="h-3 w-20" />
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
