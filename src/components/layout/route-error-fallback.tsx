"use client"

import { useEffect } from "react"
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline"

import { ROUTES } from "@/config/navigation"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
    EmptyState,
    EmptyStateActions,
    EmptyStateDescription,
    EmptyStateIcon,
    EmptyStateTitle,
} from "@/components/ui/empty-state"
import { Muted } from "@/components/ui/typography"

type RouteErrorFallbackProps = {
    error: Error & { digest?: string }
    reset: () => void
}

export function RouteErrorFallback({ error, reset }: RouteErrorFallbackProps) {
    useEffect(() => {
        console.error(error)
    }, [error])

    return (
        <div className="flex min-h-dvh w-full flex-1 flex-col justify-center bg-background px-4 py-12 sm:px-6">
            <div className="mx-auto w-full max-w-md space-y-6">
                <EmptyState className="w-full border-border/80 bg-card/40 py-10">
                    <EmptyStateIcon className="bg-destructive-muted text-destructive-muted-foreground">
                        <ExclamationTriangleIcon aria-hidden />
                    </EmptyStateIcon>
                    <EmptyStateTitle>Algo deu errado</EmptyStateTitle>
                    <EmptyStateDescription>
                        Não foi possível concluir esta ação. Você pode tentar de
                        novo ou voltar ao painel.
                    </EmptyStateDescription>
                    <EmptyStateActions>
                        <Button type="button" variant="default" onClick={reset}>
                            Tentar novamente
                        </Button>
                        <Button type="button" variant="outline" asChild>
                            <a href={ROUTES.DASHBOARD}>Ir para o painel</a>
                        </Button>
                    </EmptyStateActions>
                </EmptyState>
                <Alert variant="destructive" className="w-full">
                    <ExclamationTriangleIcon />
                    <AlertTitle>Detalhes técnicos</AlertTitle>
                    <AlertDescription className="break-words font-mono text-xs">
                        {error.message || "Erro desconhecido."}
                        {error.digest ? (
                            <span className="mt-1 block text-muted-foreground">
                                Código: {error.digest}
                            </span>
                        ) : null}
                    </AlertDescription>
                </Alert>
                <Muted className="block text-center text-xs">
                    Se o problema continuar, atualize a página ou faça login de
                    novo.
                </Muted>
            </div>
        </div>
    )
}

