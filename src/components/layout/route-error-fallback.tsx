"use client"

import { ExclamationTriangleIcon } from "@heroicons/react/24/outline"
import { ExclamationTriangleIcon as ExclamationTriangleMicroIcon } from "@heroicons/react/16/solid"
import { useEffect } from "react"

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
    retry: () => void
    /**
     * `page` ocupa a tela toda (erro fora da casca); `inline` mora dentro da
     * casca do app, com a barra lateral e o cabeçalho ainda montados.
     */
    variant?: "page" | "inline"
}

export function RouteErrorFallback({ error, retry, variant = "page" }: RouteErrorFallbackProps) {
    useEffect(() => {
        console.error(error)
    }, [error])

    return (
        <div
            className={
                variant === "page"
                    ? "flex min-h-dvh w-full flex-1 flex-col justify-center bg-background px-4 py-12 sm:px-6"
                    : "flex w-full flex-1 flex-col justify-center py-8"
            }
        >
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
                        <Button type="button" variant="primary" onClick={retry}>
                            Tentar novamente
                        </Button>
                        <Button type="button" variant="outline" asChild>
                            <a href={ROUTES.DASHBOARD}>Ir para o painel</a>
                        </Button>
                    </EmptyStateActions>
                </EmptyState>
                <Alert tone="destructive" className="w-full">
                    {/* O alerta desenha o ícone a 16px (`--alert-icon`), e o do
                        bloco vazio sai a 24 — conjuntos diferentes, de propósito. */}
                    <ExclamationTriangleMicroIcon />
                    <AlertTitle>Detalhes técnicos</AlertTitle>
                    <AlertDescription className="break-words font-mono text-xs">
                        {/* A mensagem crua é para quem desenvolve; em produção
                            fica só o código, que casa com o log do servidor. */}
                        {process.env.NODE_ENV === "development"
                            ? error.message || "Erro desconhecido."
                            : "Erro inesperado."}
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

