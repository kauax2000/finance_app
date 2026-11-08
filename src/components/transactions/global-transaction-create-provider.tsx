"use client"

import { useCallback } from "react"
import { useGlobalShellDialogsOptional } from "@/components/layout/global-shell-dialogs-provider"
import type { NewTransactionMode } from "@/components/transactions/transactions-toolbar"
import type { Transaction } from "@/lib/supabase"
import { valoresDuplicados } from "@/lib/transactions/duplicar"

/**
 * `duplicarComoNova(t)`: abre o criar com os campos da linha e a data de hoje
 * (spec §6.4). A casca é um contexto, por isso a função sai de um hook.
 */
export function useDuplicarComoNova(): (t: Transaction) => void {
    const shell = useGlobalShellDialogsOptional()
    return useCallback(
        (t: Transaction) => {
            const valores = valoresDuplicados(t, new Date())
            shell?.openTransactionCreate(valores.tipo === "income" ? "income" : "expense", { valores })
        },
        [shell],
    )
}

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
