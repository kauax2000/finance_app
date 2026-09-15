"use client"

import { RouteErrorFallback } from "@/components/layout/route-error-fallback"

/**
 * Erro numa tela do app. Mora abaixo do `layout.tsx` do grupo: a casca — barra
 * lateral, cabeçalho, navegação de baixo — continua montada, e a pessoa sai dali
 * pelo menu em vez de cair numa tela solta. `unstable_retry` busca e renderiza o
 * segmento de novo (o `reset` só limpava o erro).
 */
export default function AppErrorBoundary({
    error,
    unstable_retry,
}: {
    error: Error & { digest?: string }
    unstable_retry: () => void
}) {
    return <RouteErrorFallback error={error} retry={unstable_retry} variant="inline" />
}
