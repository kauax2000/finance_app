"use client"

import { RouteErrorFallback } from "@/components/layout/route-error-fallback"

/** Erro fora da casca do app (entrada, catálogo): ocupa a tela. */
export default function ErrorBoundaryPage({
    error,
    unstable_retry,
}: {
    error: Error & { digest?: string }
    unstable_retry: () => void
}) {
    return <RouteErrorFallback error={error} retry={unstable_retry} />
}
