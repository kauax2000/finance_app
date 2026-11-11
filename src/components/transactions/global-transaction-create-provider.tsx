"use client"

import { useGlobalShellDialogsOptional } from "@/components/layout/global-shell-dialogs-provider"
import type { NewTransactionMode } from "@/components/transactions/transactions-toolbar"

type GlobalTransactionCreateContextValue = {
    openCreate: (mode: NewTransactionMode) => void
}

/**
 * @deprecated Prefer `useGlobalShellDialogsOptional()` from `@/components/layout/global-shell-dialogs-provider`.
 * Kept for `useTransactionsListController` and legacy imports.
 */
export function useGlobalTransactionCreateOptional(): GlobalTransactionCreateContextValue | null {
    const shell = useGlobalShellDialogsOptional()
    if (!shell) return null
    return { openCreate: shell.openTransactionCreate }
}

/** No-op wrapper — use `GlobalShellDialogsProvider` in the app shell instead. */
export function GlobalTransactionCreateProvider({
    children,
}: {
    children: React.ReactNode
}) {
    return <>{children}</>
}
