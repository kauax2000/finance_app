"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function AccountSkeleton() {
    return (
        <div className="space-y-8 max-w-xl mx-auto">
            {/* Card de Perfil Skeleton */}
            <Card className="border-border/50 py-0">
                <CardContent className="pb-6 pt-6">
                    {/* Mobile Layout */}
                    <div className="flex flex-col items-center gap-4 sm:hidden">
                        {/* Avatar */}
                        <Skeleton className="h-20 w-20 rounded-xl" />

                        {/* Badge */}
                        <Skeleton className="h-5 w-20 rounded-full" />

                        {/* Nome e Email */}
                        <div className="text-center space-y-2">
                            <Skeleton className="h-6 w-32 mx-auto" />
                            <Skeleton className="h-4 w-40 mx-auto" />
                        </div>

                        {/* Botões */}
                        <div className="flex flex-col gap-2 w-full pt-2">
                            <Skeleton className="h-10 w-full rounded-md" />
                            <Skeleton className="h-10 w-full rounded-md" />
                            <Skeleton className="h-10 w-full rounded-md" />
                        </div>
                    </div>

                    {/* Desktop Layout */}
                    <div className="hidden sm:flex flex-row items-center gap-6">
                        {/* Avatar */}
                        <Skeleton className="h-16 w-16 rounded-xl" />

                        {/* Informações */}
                        <div className="flex-1 text-left space-y-2">
                            <div className="flex items-center gap-2">
                                <Skeleton className="h-6 w-40" />
                                <Skeleton className="h-5 w-20 rounded-full" />
                            </div>
                            <Skeleton className="h-4 w-48" />
                        </div>

                        {/* Dropdown Trigger */}
                        <Skeleton className="h-10 w-10 rounded-md" />
                    </div>
                </CardContent>
            </Card>

            {/* Card de Segurança Skeleton */}
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-4 w-56" />
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Sessões */}
                    <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-10 w-10 rounded-lg" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-28" />
                                <Skeleton className="h-3 w-48" />
                            </div>
                        </div>
                        <Skeleton className="h-4 w-4" />
                    </div>

                    {/* Atividade */}
                    <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-10 w-10 rounded-lg" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-20" />
                                <Skeleton className="h-3 w-40" />
                            </div>
                        </div>
                        <Skeleton className="h-4 w-4" />
                    </div>

                    {/* Excluir Conta */}
                    <div className="relative overflow-hidden rounded-lg border border-destructive/30 bg-destructive/5 p-6">
                        <div className="relative flex items-start justify-between gap-4">
                            <div className="flex items-start gap-4">
                                <Skeleton className="h-10 w-10 rounded-full" />
                                <div className="space-y-2">
                                    <Skeleton className="h-5 w-24" />
                                    <Skeleton className="h-3 w-64" />
                                </div>
                            </div>
                            <Skeleton className="h-8 w-16 rounded-md" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Footer */}
            <div className="flex justify-center items-center py-4">
                <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4 rounded" />
                    <Skeleton className="h-4 w-32" />
                </div>
            </div>
        </div>
    )
}
