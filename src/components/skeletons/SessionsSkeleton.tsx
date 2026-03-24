"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface SessionsSkeletonProps {
    rows?: number
    showRevokeAllButton?: boolean
    showInfoCard?: boolean
}

export function SessionsSkeleton({
    rows = 3,
    showRevokeAllButton = true,
    showInfoCard = true
}: SessionsSkeletonProps) {
    return (
        <div className="space-y-8 max-w-xl mx-auto">
            {/* Sessions List Card */}
            <Card>
                <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-2">
                            <Skeleton className="h-6 w-28" />
                            <Skeleton className="h-4 w-48" />
                        </div>
                        {showRevokeAllButton && (
                            <Skeleton className="h-9 w-32" />
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {Array.from({ length: rows }).map((_, i) => (
                            <div
                                key={i}
                                className="flex items-center gap-4 p-4 rounded-lg border"
                            >
                                {/* Device Icon */}
                                <Skeleton className="h-12 w-12 rounded-full shrink-0" />

                                {/* Session Info */}
                                <div className="flex-1 min-w-0 space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Skeleton className="h-5 w-24" />
                                        {i === 0 && (
                                            <Skeleton className="h-5 w-24 rounded-full" />
                                        )}
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Skeleton className="h-4 w-20" />
                                        <Skeleton className="h-4 w-32" />
                                    </div>
                                </div>

                                {/* Revoke Button (only for non-current sessions) */}
                                {i > 0 && (
                                    <Skeleton className="h-9 w-24 shrink-0" />
                                )}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Info Card */}
            {showInfoCard && (
                <Card className="bg-muted/50">
                    <CardContent className="pt-6">
                        <div className="flex gap-4">
                            <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-5 w-28" />
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-3/4" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
