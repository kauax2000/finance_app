"use client"

import { useState, useEffect } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

// Template para páginas com skeleton loading
// Use este template como base para criar novas páginas

interface PageTemplateProps {
    title: string
    description: string
    showSkeleton?: boolean
    skeletonType?: "default" | "form" | "list" | "grid" | "dashboard"
    children?: React.ReactNode
}

export function PageTemplate({
    title,
    description,
    showSkeleton = false,
    skeletonType = "default",
    children
}: PageTemplateProps) {
    if (showSkeleton) {
        return <SkeletonLoader type={skeletonType} />
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">{title}</h1>
                    <p className="text-muted-foreground">{description}</p>
                </div>
            </div>
            {children}
        </div>
    )
}

// Skeleton Loaders por tipo
function SkeletonLoader({ type }: { type: string }) {
    switch (type) {
        case "form":
            return <FormSkeletonLoader />
        case "list":
            return <ListSkeletonLoader />
        case "grid":
            return <GridSkeletonLoader />
        case "dashboard":
            return <DashboardSkeletonLoader />
        default:
            return <DefaultSkeletonLoader />
    }
}

function DefaultSkeletonLoader() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-9 w-48" />
                    <Skeleton className="h-4 w-64" />
                </div>
                <Skeleton className="h-10 w-32" />
            </div>
            <Card>
                <CardContent className="p-6 space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </CardContent>
            </Card>
        </div>
    )
}

function FormSkeletonLoader() {
    return (
        <div className="space-y-6 max-w-2xl">
            <div className="space-y-2">
                <Skeleton className="h-9 w-48" />
                <Skeleton className="h-4 w-64" />
            </div>
            <Card>
                <CardHeader>
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-4 w-56" />
                </CardHeader>
                <CardContent className="space-y-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="space-y-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    ))}
                    <div className="flex gap-3 pt-4">
                        <Skeleton className="h-10 w-24" />
                        <Skeleton className="h-10 w-32" />
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

function ListSkeletonLoader() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-9 w-48" />
                    <Skeleton className="h-4 w-64" />
                </div>
                <Skeleton className="h-10 w-32" />
            </div>
            <Card>
                <CardHeader>
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-4 w-56" />
                </CardHeader>
                <CardContent className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center gap-4">
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
        </div>
    )
}

function GridSkeletonLoader() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-9 w-48" />
                    <Skeleton className="h-4 w-64" />
                </div>
                <Skeleton className="h-10 w-32" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Card key={i}>
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Skeleton className="h-3 w-3 rounded-full" />
                                    <Skeleton className="h-5 w-32" />
                                </div>
                                <Skeleton className="h-6 w-6 rounded" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-8 w-36 mb-2" />
                            <Skeleton className="h-3 w-24" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}

function DashboardSkeletonLoader() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-9 w-48" />
                    <Skeleton className="h-4 w-64" />
                </div>
                <Skeleton className="h-10 w-40" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                    <Card key={i}>
                        <CardHeader className="pb-2">
                            <Skeleton className="h-4 w-32" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-8 w-28 mb-2" />
                            <Skeleton className="h-3 w-20" />
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[1, 2].map((i) => (
                    <Card key={i}>
                        <CardHeader>
                            <Skeleton className="h-5 w-40 mb-2" />
                            <Skeleton className="h-4 w-56" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-[300px] w-full rounded-lg" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}

// Hook para usar skeleton em páginas
export function usePageSkeleton() {
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Para páginas que não precisam buscar dados,
        // você pode remover este timer
        const timer = setTimeout(() => setLoading(false), 300)
        return () => clearTimeout(timer)
    }, [])

    return loading
}
