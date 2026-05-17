"use client"

import { useEffect, useState } from "react"
import { useWorkspace } from "@/components/workspace-provider"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Sheet,
    SheetContent,
    SheetFooter,
} from "@/components/ui/sheet"
import {
    MobileSheetFormDragStrip,
    MobileSheetFormStickyHeader,
    mobileFormSheetContentClassName,
} from "@/components/ui/mobile-sheet-form-chrome"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import type { Workspace } from "@/lib/supabase"

const dialogFooterClass =
    "!mx-0 !mb-0 mt-0 flex flex-row flex-wrap justify-end gap-2 border-t border-border bg-background px-6 py-4 sm:flex-row"

const sheetFooterMobileClass =
    "mt-0 shrink-0 flex-col gap-2 border-t border-border bg-background px-4 py-4"

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
    const isMobile = useIsMobile()
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
    const [confirmName, setConfirmName] = useState("")
    const [deleting, setDeleting] = useState(false)
    const [deleteError, setDeleteError] = useState<string | null>(null)

    const resetLocalState = () => {
        setImpactLoading(false)
        setImpactError(null)
        setTransactions(0)
        setBudgets(0)
        setCategories(0)
        setOtherMembers(0)
        setConfirmName("")
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
        setConfirmName("")

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

    const nameMatches =
        workspace !== null &&
        confirmName.trim() === workspace.name.trim() &&
        confirmName.trim().length > 0

    const handleDelete = async () => {
        if (!workspace || workspace.type === "personal" || !nameMatches) return
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

    const headerDetailBlock = (
        <div className="space-y-2 pt-2 text-sm text-muted-foreground">
            <p>Serão removidos desta carteira:</p>
            <ul className="list-inside list-disc space-y-0.5">
                <li>todas as transações e divisões associadas</li>
                <li>categorias e orçamentos</li>
                <li>membros, convites e notificações da carteira</li>
            </ul>
            {otherMembers > 0 ? (
                <p className="text-destructive">
                    Outras {otherMembers}{" "}
                    {otherMembers === 1 ? "pessoa perderá o acesso" : "pessoas perderão o acesso"} e os dados desta
                    carteira para elas também serão apagados.
                </p>
            ) : null}
        </div>
    )

    const scrollBody = (
        <div
            className={cn(
                "space-y-4 overflow-y-auto py-4",
                isMobile ? "max-h-none min-h-0 flex-1 px-4" : "max-h-[min(50vh,22rem)] px-6",
            )}
        >
            {isMobile ? headerDetailBlock : null}
            {impactLoading ? (
                <div className="space-y-2" aria-busy="true">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-2/3" />
                </div>
            ) : impactError ? (
                <p className="text-sm text-destructive">{impactError}</p>
            ) : (
                <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm">
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
                </div>
            )}

            <div className="space-y-2">
                <Label htmlFor="workspace-delete-confirm-name">
                    Digite o nome da carteira para confirmar:{" "}
                    <span className="font-semibold text-foreground">{workspace?.name ?? ""}</span>
                </Label>
                <Input
                    id="workspace-delete-confirm-name"
                    autoComplete="off"
                    value={confirmName}
                    onChange={(e) => setConfirmName(e.target.value)}
                    placeholder="Nome exato da carteira"
                    disabled={impactLoading || Boolean(impactError)}
                    aria-invalid={confirmName.length > 0 && !nameMatches}
                />
            </div>

            {deleteError ? <p className="text-sm text-destructive">{deleteError}</p> : null}
        </div>
    )

    const footerActions = isMobile ? (
        <SheetFooter className={sheetFooterMobileClass}>
            <Button
                type="button"
                variant="destructive"
                className="h-10 w-full"
                disabled={deleting || impactLoading || Boolean(impactError) || !nameMatches}
                onClick={() => void handleDelete()}
            >
                {deleting ? "Excluindo…" : "Excluir carteira"}
            </Button>
        </SheetFooter>
    ) : (
        <DialogFooter className={dialogFooterClass}>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={deleting}>
                Cancelar
            </Button>
            <Button
                type="button"
                variant="destructive"
                disabled={deleting || impactLoading || Boolean(impactError) || !nameMatches}
                onClick={() => void handleDelete()}
            >
                {deleting ? "Excluindo…" : "Excluir carteira"}
            </Button>
        </DialogFooter>
    )

    if (isMobile && showDialog) {
        return (
            <Sheet open={showDialog} onOpenChange={handleOpenChange}>
                <SheetContent
                    side="bottom"
                    fillMobileViewport
                    showCloseButton
                    className={mobileFormSheetContentClassName}
                >
                    <MobileSheetFormDragStrip />
                    <MobileSheetFormStickyHeader
                        title="Excluir carteira"
                        description="Esta ação é permanente e não pode ser desfeita."
                    />
                    <div className="flex min-h-0 flex-1 flex-col">{scrollBody}</div>
                    {footerActions}
                </SheetContent>
            </Sheet>
        )
    }

    return (
        <Dialog open={showDialog} onOpenChange={handleOpenChange}>
            <DialogContent className="max-h-[min(92vh,40rem)] gap-0 overflow-hidden p-0 sm:max-w-lg">
                <DialogHeader className="px-6 py-4 text-left">
                    <DialogTitle>Excluir carteira</DialogTitle>
                    <DialogDescription>Esta ação é permanente e não pode ser desfeita.</DialogDescription>
                    {headerDetailBlock}
                </DialogHeader>
                {scrollBody}
                {footerActions}
            </DialogContent>
        </Dialog>
    )
}
