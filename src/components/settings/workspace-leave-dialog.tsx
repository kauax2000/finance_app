"use client"

import { useState } from "react"
import { useWorkspace } from "@/components/workspace-provider"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogError,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogList,
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
        <AlertDialog pending={leaving} open={show} onOpenChange={handleOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Sair da carteira?</AlertDialogTitle>
                    <AlertDialogDescription>
                        <p>
                            Você deixa de ter acesso a esta carteira e aos
                            dados compartilhados.
                        </p>
                        <AlertDialogList>
                            <li>
                                Os outros membros mantêm tudo; o projeto
                                não é apagado.
                            </li>
                            <li>
                                Você pode voltar a ser convidado pelo
                                responsável.
                            </li>
                        </AlertDialogList>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                {error ? <AlertDialogError>{error}</AlertDialogError> : null}
                <AlertDialogFooter>
                    <AlertDialogCancel type="button">
                        Cancelar
                    </AlertDialogCancel>
                    <AlertDialogAction
                        pendingLabel="Saindo…"
                        type="button"
                        onClick={(e) => {
                            e.preventDefault()
                            void confirmLeave()
                        }}
                    >
                        Sair da carteira
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
