"use client"

import { RouteErrorFallback } from "@/components/layout/route-error-fallback"

export default function ErrorBoundaryPage({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    return <RouteErrorFallback error={error} reset={reset} />
}
