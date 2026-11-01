"use client"

import { useEffect, useState } from "react"
import {
    DescriptionDetails,
    DescriptionList,
    DescriptionListItem,
    DescriptionTerm,
} from "@/components/ui/description-list"
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

    // Só o que existe: uma linha "Orçamentos 0" não informa nada.
    const impacto: [string, string | number][] = [
        ...(transactions > 0 ? [["Transações", transactions] as [string, number]] : []),
        ...(budgets > 0 ? [["Orçamentos", budgets] as [string, number]] : []),
        ...(categories > 0 ? [["Categorias", categories] as [string, number]] : []),
        ...(otherMembers > 0
            ? [["Perdem o acesso", otherMembers === 1 ? "1 pessoa" : `${otherMembers} pessoas`] as [string, string]]
            : []),
        ["Membros, convites e notificações", "Tudo"],
    ]

    const resumo = impactLoading ? (
        <div className="space-y-2" aria-busy="true">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-2/3" />
        </div>
    ) : impactError ? (
        <AlertDialogError>{impactError}</AlertDialogError>
    ) : (
        <DescriptionList layout="inline" size="sm" divided>
            {impacto.map(([termo, valor]) => (
                <DescriptionListItem key={termo}>
                    <DescriptionTerm>{termo}</DescriptionTerm>
                    <DescriptionDetails className="nums">{valor}</DescriptionDetails>
                </DescriptionListItem>
            ))}
        </DescriptionList>
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
                    <AlertDialogTitle>Excluir {workspace?.name}?</AlertDialogTitle>
                    <AlertDialogDescription>Não dá para desfazer.</AlertDialogDescription>
                </AlertDialogHeader>
                {resumo}
                <AlertDialogConfirmInput
                    expected={workspace?.name ?? ""}
                    label={
                        <span>
                            Digite <span className="font-semibold text-foreground">{workspace?.name ?? ""}</span> para confirmar
                        </span>
                    }
                    placeholder={workspace?.name ?? ""}
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
