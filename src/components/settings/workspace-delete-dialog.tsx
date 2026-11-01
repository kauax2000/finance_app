"use client"

import { useEffect, useState } from "react"
import {
    Card,
} from "@/components/ui/card"
import { useWorkspace } from "@/components/workspace-provider"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogConfirmInput,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogError,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogList,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Skeleton } from "@/components/ui/skeleton"
import type { Workspace } from "@/lib/supabase"

type WorkspaceDeleteDialogProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
    workspace: Workspace | null
}

export function WorkspaceDeleteDialog({
    open,
    onOpenChange,
    workspace,
}: WorkspaceDeleteDialogProps) {
    const {
        fetchWorkspaceDeleteImpact,
        deleteWorkspace,
    } = useWorkspace()

    const [impactLoading, setImpactLoading] = useState(false)
    const [impactError, setImpactError] = useState<string | null>(null)
    const [transactions, setTransactions] = useState(0)
    const [budgets, setBudgets] = useState(0)
    const [categories, setCategories] = useState(0)
    const [otherMembers, setOtherMembers] = useState(0)
    const [deleting, setDeleting] = useState(false)
    const [deleteError, setDeleteError] = useState<string | null>(null)

    const resetLocalState = () => {
        setImpactLoading(false)
        setImpactError(null)
        setTransactions(0)
        setBudgets(0)
        setCategories(0)
        setOtherMembers(0)
        setDeleting(false)
        setDeleteError(null)
    }

    useEffect(() => {
        if (!open || !workspace || workspace.type === "personal") {
            if (!open) resetLocalState()
            return
        }

        let cancelled = false
        setImpactLoading(true)
        setImpactError(null)
        setDeleteError(null)

        void (async () => {
            const result = await fetchWorkspaceDeleteImpact(workspace.id)
            if (cancelled) return
            setImpactLoading(false)
            if (!result.ok) {
                setImpactError(result.message)
                return
            }
            setTransactions(result.impact.transactions)
            setBudgets(result.impact.budgets)
            setCategories(result.impact.categories)
            setOtherMembers(result.impact.other_members)
        })()

        return () => {
            cancelled = true
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- workspace identity via id/type
    }, [open, workspace?.id, workspace?.type, fetchWorkspaceDeleteImpact])

    const handleOpenChange = (next: boolean) => {
        if (!next && deleting) return
        if (!next) resetLocalState()
        onOpenChange(next)
    }

    const handleDelete = async () => {
        // O nome digitado é conferido pelo `AlertDialogConfirmInput`, que
        // trava a ação até bater.
        if (!workspace || workspace.type === "personal") return
        setDeleteError(null)
        setDeleting(true)
        const result = await deleteWorkspace(workspace.id)
        setDeleting(false)
        if (result.ok) {
            resetLocalState()
            onOpenChange(false)
        } else {
            setDeleteError(result.message)
        }
    }

    const showDialog = Boolean(
        open && workspace && workspace.type !== "personal"
    )

    const resumo = impactLoading ? (
        <div className="space-y-2" aria-busy="true">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-2/3" />
        </div>
    ) : impactError ? (
        <AlertDialogError>{impactError}</AlertDialogError>
    ) : (
        <Card variant="muted" padding="none" className="px-3 py-2 text-sm">
            <p className="font-medium text-foreground">Resumo nesta carteira</p>
            <ul className="mt-2 space-y-1 text-muted-foreground">
                <li>
                    Transações:{" "}
                    <span className="tabular-nums text-foreground">{transactions}</span>
                </li>
                <li>
                    Orçamentos:{" "}
                    <span className="tabular-nums text-foreground">{budgets}</span>
                </li>
                <li>
                    Categorias:{" "}
                    <span className="tabular-nums text-foreground">{categories}</span>
                </li>
            </ul>
        </Card>
    )

    // Uma confirmação do que não tem volta é `AlertDialog` (rodada 201): até
    // aqui era um `Dialog` — uma `Sheet` no telefone — com o "digite o nome"
    // e a regra de habilitar o botão escritos à mão, e o Cancelar em
    // `outline`, contra a hierarquia do rodapé. O Esc não fechava no meio da
    // exclusão só porque o `onOpenChange` engolia; agora é o `pending`.
    return (
        <AlertDialog pending={deleting} open={showDialog} onOpenChange={handleOpenChange}>
            <AlertDialogContent size="lg">
                <AlertDialogHeader>
                    <AlertDialogMedia tone="destructive" />
                    <AlertDialogTitle>Excluir carteira?</AlertDialogTitle>
                    <AlertDialogDescription>
                        <p>Esta ação é permanente e não pode ser desfeita. Serão removidos desta carteira:</p>
                        <AlertDialogList>
                            <li>todas as transações e divisões associadas</li>
                            <li>categorias e orçamentos</li>
                            <li>membros, convites e notificações da carteira</li>
                        </AlertDialogList>
                        {otherMembers > 0 ? (
                            <p className="text-destructive">
                                Outras {otherMembers}{" "}
                                {otherMembers === 1 ? "pessoa perderá o acesso" : "pessoas perderão o acesso"} e os
                                dados desta carteira para elas também serão apagados.
                            </p>
                        ) : null}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                {resumo}
                <AlertDialogConfirmInput
                    expected={workspace?.name ?? ""}
                    label={
                        <span>
                            Digite o nome da carteira para confirmar:{" "}
                            <span className="font-semibold text-foreground">{workspace?.name ?? ""}</span>
                        </span>
                    }
                    placeholder="Nome exato da carteira"
                    disabled={impactLoading || Boolean(impactError)}
                />
                {deleteError ? <AlertDialogError>{deleteError}</AlertDialogError> : null}
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                        pendingLabel="Excluindo…"
                        disabled={impactLoading || Boolean(impactError)}
                        onClick={(e) => {
                            e.preventDefault()
                            void handleDelete()
                        }}
                    >
                        Excluir carteira
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
