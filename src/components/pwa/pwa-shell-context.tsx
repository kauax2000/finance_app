"use client"

import { createContext, useContext } from "react"

export type PwaShellContextValue = {
    isOnline: boolean
    isStandalone: boolean
    pendingSyncCount: number
    isSyncing: boolean
    syncNow: () => Promise<void>
    openInstallSheet: () => void
}

export const PwaShellContext = createContext<PwaShellContextValue | null>(null)

export function usePwaShell(): PwaShellContextValue {
    const ctx = useContext(PwaShellContext)
    if (!ctx) {
        throw new Error("usePwaShell must be used within PwaShellProvider")
    }
    return ctx
}

export function usePwaShellOptional(): PwaShellContextValue | null {
    return useContext(PwaShellContext)
}
