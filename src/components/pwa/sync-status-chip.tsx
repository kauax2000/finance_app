"use client"

import { ArrowPathIcon, CloudArrowUpIcon } from "@heroicons/react/24/outline"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { usePwaShellOptional } from "@/components/pwa/pwa-shell-context"
import { cn } from "@/lib/utils"

type SyncStatusChipProps = {
    className?: string
}

export function SyncStatusChip({ className }: SyncStatusChipProps) {
    const shell = usePwaShellOptional()
    if (!shell || shell.pendingSyncCount === 0) return null

    return (
        <div className={cn("flex flex-wrap items-center gap-2", className)}>
            <Badge variant="warning" size="sm" className="gap-1">
                <CloudArrowUpIcon className="size-3" aria-hidden />
                {shell.pendingSyncCount} pendente{shell.pendingSyncCount === 1 ? "" : "s"}
            </Badge>
            <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!shell.isOnline || shell.isSyncing}
                onClick={() => void shell.syncNow()}
                className="h-8 gap-1.5"
            >
                <ArrowPathIcon
                    className={cn("size-3.5", shell.isSyncing && "animate-spin")}
                    aria-hidden
                />
                {shell.isSyncing ? "Sincronizando…" : "Sincronizar"}
            </Button>
        </div>
    )
}
