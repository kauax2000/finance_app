"use client"

import { useState } from "react"
import { useWorkspace } from "@/components/workspace-provider"
import { buttonVariants } from "@/components/ui/button"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import type { Workspace } from "@/lib/supabase"

type WorkspaceLeaveDialogProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
    workspace: Workspace | null
}

export function WorkspaceLeaveDialog({
    open,
    onOpenChange,
    workspace,
}: WorkspaceLeaveDialogProps) {
    const { leaveWorkspace } = useWorkspace()
    const [leaving, setLeaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleOpenChange = (next: boolean) => {
        if (!next) {
            setError(null)
            setLeaving(false)
        }
        onOpenChange(next)
    }

    const confirmLeave = async () => {
        if (!workspace) return
        setError(null)
        setLeaving(true)
        const result = await leaveWorkspace(workspace.id)
        setLeaving(false)
        if (result.ok) {
            handleOpenChange(false)
        } else {
            setError(result.message)
        }
    }

    const show = Boolean(open && workspace)

    return (
        <AlertDialog open={show} onOpenChange={handleOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Sair da carteira?</AlertDialogTitle>
                    <AlertDialogDescription asChild>
                        <div className="space-y-2 text-sm text-muted-foreground">
                            <p>
                                Você deixa de ter acesso a esta carteira e aos
                                dados compartilhados.
                            </p>
                            <ul className="list-inside list-disc space-y-1 text-foreground">
                                <li>
                                    Os outros membros mantêm tudo; o projeto
                                    não é apagado.
                                </li>
                                <li>
                                    Você pode voltar a ser convidado pelo
                                    responsável.
                                </li>
                            </ul>
                        </div>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                {error ? (
                    <p className="text-sm text-destructive">{error}</p>
                ) : null}
                <AlertDialogFooter>
                    <AlertDialogCancel type="button" disabled={leaving}>
                        Cancelar
                    </AlertDialogCancel>
                    <AlertDialogAction
                        type="button"
                        className={buttonVariants({ variant: "destructive" })}
                        disabled={leaving}
                        onClick={(e) => {
                            e.preventDefault()
                            void confirmLeave()
                        }}
                    >
                        {leaving ? "Saindo…" : "Sair da carteira"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
