"use client"

import { useEffect, useState } from "react"
import type { ReactNode } from "react"
import { SettingsSection } from "@/components/settings/settings-section"
import { InformationCircleIcon } from "@heroicons/react/16/solid"
import { useAuth } from "@/components/providers"
import { useWorkspace } from "@/components/workspace-provider"
import { WorkspaceAppearanceEditDialog } from "@/components/settings/workspace-appearance-edit-dialog"
import { WorkspaceDeleteDialog } from "@/components/settings/workspace-delete-dialog"
import { WorkspaceLeaveDialog } from "@/components/settings/workspace-leave-dialog"
import { WorkspaceBrandMark } from "@/components/workspace/workspace-brand-mark"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardNote } from "@/components/ui/card"
import { EmptyState, EmptyStateDescription, EmptyStateTitle } from "@/components/ui/empty-state"
import { Skeleton } from "@/components/ui/skeleton"

function WorkspaceAppearanceSkeleton() {
    return (
        <div className="min-w-0 space-y-4">
            <div className="flex h-6 min-w-0 items-center">
                <Skeleton className="h-4 w-24" />
            </div>
            <Card padding="none">
                <CardContent className="flex flex-col">
                    <div
                        className="flex min-w-0 items-center justify-between gap-3 px-4 py-3 sm:py-3.5"
                        aria-busy="true"
                    >
                        <div className="flex items-center gap-3">
                            <Skeleton className="size-12 shrink-0 rounded-lg" />
                            <Skeleton className="h-4 w-36 max-w-full" />
                        </div>
                        <Skeleton shape="tile" size="lg" />
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export function WorkspaceAppearanceSettings({ children }: { children?: ReactNode }) {
    const { loading: authLoading, user } = useAuth()
    const { currentWorkspace, loading, isWorkspaceOwner } = useWorkspace()

    const [editOpen, setEditOpen] = useState(false)
    const [editTargetId, setEditTargetId] = useState<string | null>(null)
    const [deleteOpen, setDeleteOpen] = useState(false)
    const [leaveOpen, setLeaveOpen] = useState(false)

    const dialogOpen =
        editOpen &&
        editTargetId !== null &&
        editTargetId === currentWorkspace?.id

    const openEdit = () => {
        if (!currentWorkspace) return
        setEditTargetId(currentWorkspace.id)
        setEditOpen(true)
    }

    const handleDialogOpenChange = (open: boolean) => {
        setEditOpen(open)
        if (!open) {
            setEditTargetId(null)
        }
    }

    useEffect(() => {
        if (editTargetId == null) return
        if (currentWorkspace?.id !== editTargetId) {
            /* eslint-disable react-hooks/set-state-in-effect -- reset edit scope when sidebar project changes */
            setEditOpen(false)
            setEditTargetId(null)
            /* eslint-enable react-hooks/set-state-in-effect */
        }
    }, [currentWorkspace?.id, editTargetId])

    useEffect(() => {
        if (!currentWorkspace?.id) return
        /* eslint-disable react-hooks/set-state-in-effect -- close destructive flows when switching workspace */
        setDeleteOpen(false)
        setLeaveOpen(false)
        /* eslint-enable react-hooks/set-state-in-effect */
    }, [currentWorkspace?.id])

    const owner = Boolean(
        currentWorkspace &&
            (isWorkspaceOwner(currentWorkspace.id) ||
                currentWorkspace.created_by === user?.id),
    )

    const isPersonal = currentWorkspace?.type === "personal"
    const canDeleteProject = Boolean(
        owner && currentWorkspace && !isPersonal,
    )

    return (
        <>
            <WorkspaceAppearanceEditDialog
                open={dialogOpen}
                onOpenChange={handleDialogOpenChange}
                workspace={dialogOpen ? currentWorkspace : null}
            />
            <WorkspaceDeleteDialog
                open={deleteOpen}
                onOpenChange={setDeleteOpen}
                workspace={
                    deleteOpen && canDeleteProject ? currentWorkspace : null
                }
            />
            <WorkspaceLeaveDialog
                open={leaveOpen}
                onOpenChange={setLeaveOpen}
                workspace={leaveOpen ? currentWorkspace : null}
            />
            {authLoading || loading ? (
                <WorkspaceAppearanceSkeleton />
            ) : !currentWorkspace ? (
                <EmptyState>
                    <EmptyStateTitle>Nenhuma carteira disponível</EmptyStateTitle>
                    <EmptyStateDescription>
                        Crie ou entre numa carteira para configurar a aparência.
                    </EmptyStateDescription>
                </EmptyState>
            ) : (
                <SettingsSection
                    titulo="Carteira"
                    alcance={`Vale para ${currentWorkspace.name}.`}
                    actions={
                        owner ? (
                            <Button type="button" variant="secondary" onClick={openEdit}>
                                Editar
                            </Button>
                        ) : undefined
                    }
                >
                    <Card padding="none">
                        <CardContent className="flex flex-col">
                            <div className="flex min-w-0 items-center gap-3 px-4 py-3 sm:py-3.5">
                                <WorkspaceBrandMark
                                    iconKey={currentWorkspace.icon}
                                    backgroundColor={currentWorkspace.icon_background_color}
                                    className="size-12 shrink-0 rounded-lg"
                                    iconClassName="size-5"
                                />
                                <p className="min-w-0 truncate text-sm font-medium">
                                    {currentWorkspace.name}
                                </p>
                            </div>
                            {!owner ? (
                                <CardNote>
                                    <InformationCircleIcon className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                                    <p className="min-w-0 break-words">
                                        Só o dono pode alterar nome, ícone e cor.
                                    </p>
                                </CardNote>
                            ) : null}
                        </CardContent>
                    </Card>
                    {children}
                    {canDeleteProject ? (
                        <LinhaFinal
                            titulo="Excluir carteira"
                            descricao="Apaga a carteira e tudo que há nela."
                            onClick={() => setDeleteOpen(true)}
                        />
                    ) : !owner ? (
                        <LinhaFinal
                            titulo="Sair da carteira"
                            descricao="Você perde o acesso a esta carteira."
                            onClick={() => setLeaveOpen(true)}
                        />
                    ) : null}
                </SettingsSection>
            )}
        </>
    )
}

function LinhaFinal({
    titulo,
    descricao,
    onClick,
}: {
    titulo: string
    descricao: string
    onClick: () => void
}) {
    return (
        <Card padding="none">
            <CardContent className="flex min-w-0 items-center justify-between gap-3 px-4 py-3 sm:py-3.5">
                <div className="min-w-0">
                    <p className="text-sm font-medium">{titulo}</p>
                    <p className="text-sm text-muted-foreground">{descricao}</p>
                </div>
                <Button type="button" variant="destructive" onClick={onClick} className="shrink-0">
                    {titulo}
                </Button>
            </CardContent>
        </Card>
    )
}
