"use client"

import { useEffect, useState } from "react"
import {
    PageSection,
    PageSectionHeader,
    PageSectionTitle,
} from "@/components/ui/page-section"
import { ArrowRightStartOnRectangleIcon, EllipsisVerticalIcon, InformationCircleIcon, PencilIcon, TrashIcon } from "@heroicons/react/16/solid"
import { useAuth } from "@/components/providers"
import { useWorkspace } from "@/components/workspace-provider"
import { WorkspaceAppearanceEditDialog } from "@/components/settings/workspace-appearance-edit-dialog"
import { WorkspaceDeleteDialog } from "@/components/settings/workspace-delete-dialog"
import { WorkspaceLeaveDialog } from "@/components/settings/workspace-leave-dialog"
import { WorkspaceBrandMark } from "@/components/workspace/workspace-brand-mark"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardNote } from "@/components/ui/card"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"

function WorkspaceAppearanceSkeleton() {
    return (
        <div className="min-w-0 space-y-4">
            <div className="flex h-6 min-w-0 items-center">
                <Skeleton className="h-4 w-24" />
            </div>
            <Card padding="none">
                <CardContent className="flex flex-col p-0">
                    <div
                        className="flex min-w-0 items-center justify-between gap-3 px-4 py-3 sm:py-3.5"
                        aria-busy="true"
                    >
                        <div className="flex items-center gap-3">
                            <Skeleton className="size-12 shrink-0 rounded-lg" />
                            <Skeleton className="h-4 w-36 max-w-full" />
                        </div>
                        <Skeleton className="size-9 shrink-0 rounded-md" />
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

function InvitedCarteiraOverflowMenu({
    workspaceName,
    onLeave,
}: {
    workspaceName: string
    onLeave: () => void
}) {
    return (
        <div className="shrink-0">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        type="button"
                        variant="tertiary"
                        size="icon-lg"
                        className="size-9 shrink-0 text-muted-foreground hover:text-foreground active:text-foreground"
                        aria-label={`Mais opções da carteira ${workspaceName}`}
                    >
                        <EllipsisVerticalIcon className="size-4" aria-hidden />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                    align="end" size="md"
                >
                    <DropdownMenuItem variant="destructive"
                        onSelect={() => onLeave()}
                    >
                        <ArrowRightStartOnRectangleIcon className="h-4 w-4" aria-hidden />
                        Sair da carteira
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    )
}

function OwnerCarteiraOverflowMenu({
    workspaceName,
    canDeleteProject,
    onEdit,
    onDelete,
}: {
    workspaceName: string
    canDeleteProject: boolean
    onEdit: () => void
    onDelete: () => void
}) {
    return (
        <div className="shrink-0">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        type="button"
                        variant="tertiary"
                        size="icon-lg"
                        className="size-9 shrink-0 text-muted-foreground hover:text-foreground active:text-foreground"
                        aria-label={`Mais opções da carteira ${workspaceName}`}
                    >
                        <EllipsisVerticalIcon className="size-4" aria-hidden />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                    align="end" size="md"
                >
                    <DropdownMenuItem onSelect={() => onEdit()}>
                        <PencilIcon className="h-4 w-4" aria-hidden />
                        Editar
                    </DropdownMenuItem>
                    {canDeleteProject ? (
                        <DropdownMenuItem variant="destructive"
                            onSelect={() => onDelete()}
                        >
                            <TrashIcon aria-hidden />
                            Excluir carteira
                        </DropdownMenuItem>
                    ) : null}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    )
}

export function WorkspaceAppearanceSettings() {
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
            ) : (
                <PageSection>
                    <PageSectionHeader>
                        <PageSectionTitle>Carteira</PageSectionTitle>
                    </PageSectionHeader>
                    <Card padding="none">
                        <CardContent className="flex flex-col p-0">
                            {!currentWorkspace ? (
                                <div className="px-4 py-3 sm:py-3.5">
                                    <p className="text-sm text-muted-foreground">
                                        Nenhuma carteira disponível. Crie ou entre numa
                                        carteira para configurar a aparência.
                                    </p>
                                </div>
                            ) : !owner ? (
                                <>
                                    <div className="flex min-w-0 items-center justify-between gap-3 px-4 py-3 sm:py-3.5">
                                        <div className="flex min-w-0 flex-1 items-center gap-3">
                                            <WorkspaceBrandMark
                                                iconKey={currentWorkspace.icon}
                                                backgroundColor={
                                                    currentWorkspace.icon_background_color
                                                }
                                                className="size-12 shrink-0 rounded-lg"
                                                iconClassName="size-5"
                                            />
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-medium">
                                                    {currentWorkspace.name}
                                                </p>
                                            </div>
                                        </div>
                                        <InvitedCarteiraOverflowMenu
                                            workspaceName={currentWorkspace.name}
                                            onLeave={() => setLeaveOpen(true)}
                                        />
                                    </div>
                                    <CardNote>
                                        <InformationCircleIcon className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                                        <p className="min-w-0 break-words">
                                            Só o dono pode alterar nome, ícone e cor.
                                        </p>
                                    </CardNote>
                                </>
                            ) : (
                                <div className="flex min-w-0 items-center justify-between gap-3 px-4 py-3 sm:py-3.5">
                                    <div className="flex min-w-0 flex-1 items-center gap-3">
                                        <WorkspaceBrandMark
                                            iconKey={currentWorkspace.icon}
                                            backgroundColor={
                                                currentWorkspace.icon_background_color
                                            }
                                            className="size-12 shrink-0 rounded-lg"
                                            iconClassName="size-5"
                                        />
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-medium">
                                                {currentWorkspace.name}
                                            </p>
                                        </div>
                                    </div>
                                    <OwnerCarteiraOverflowMenu
                                        workspaceName={currentWorkspace.name}
                                        canDeleteProject={canDeleteProject}
                                        onEdit={openEdit}
                                        onDelete={() => setDeleteOpen(true)}
                                    />
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </PageSection>
            )}
        </>
    )
}
