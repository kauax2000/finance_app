"use client"

import { SignalSlashIcon } from "@heroicons/react/16/solid"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { usePwaShellOptional } from "@/components/pwa/pwa-shell-context"

export function OfflineBanner() {
    const shell = usePwaShellOptional()
    if (!shell || shell.isOnline) return null

    return (
        <Alert
            variant="default"
            className="fixed inset-x-0 top-[var(--mobile-header-offset)] z-(--z-banner) rounded-none border-x-0 border-t-0 md:top-0"
        >
            <SignalSlashIcon className="size-4 shrink-0" aria-hidden />
            <AlertDescription>
                Você está offline. Alterações serão sincronizadas quando a conexão voltar.
            </AlertDescription>
        </Alert>
    )
}
