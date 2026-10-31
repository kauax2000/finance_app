"use client"

import { useEffect, useState } from "react"
import { CarteiraDivisaoDialog } from "@/components/settings/carteira-divisao-dialog"
import { CarteiraProjetoForm, resumoDoCalendario } from "@/components/settings/carteira-projeto-form"
import { SettingsRow, SettingsSection } from "@/components/settings/settings-section"
import { InformationCircleIcon } from "@heroicons/react/16/solid"
import { useAuth } from "@/components/providers"
import { useWorkspace } from "@/components/workspace-provider"
import { WorkspaceAppearanceEditDialog } from "@/components/settings/workspace-appearance-edit-dialog"
import { WorkspaceDeleteDialog } from "@/components/settings/workspace-delete-dialog"
import { WorkspaceLeaveDialog } from "@/components/settings/workspace-leave-dialog"
import { WorkspaceBrandMark } from "@/components/workspace/workspace-brand-mark"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardNote } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { EmptyState, EmptyStateDescription, EmptyStateTitle } from "@/components/ui/empty-state"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { AINDA_NAO_DISPONIVEL } from "@/lib/projetos/dados"

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

export function WorkspaceAppearanceSettings() {
    const { loading: authLoading, user } = useAuth()
    const { currentWorkspace, loading, isWorkspaceOwner } = useWorkspace()

    const [editOpen, setEditOpen] = useState(false)
    const [editTargetId, setEditTargetId] = useState<string | null>(null)
    const [deleteOpen, setDeleteOpen] = useState(false)
    const [leaveOpen, setLeaveOpen] = useState(false)
    const [divisaoOpen, setDivisaoOpen] = useState(false)
    const [datasOpen, setDatasOpen] = useState(false)
    const [salvandoDatas, setSalvandoDatas] = useState(false)

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
        setDivisaoOpen(false)
        setDatasOpen(false)
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
    const podeDivisao = owner && !isPersonal
    const podeDatas = owner && currentWorkspace?.purpose === "project"
    const splitMode = currentWorkspace?.split_mode

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
            <CarteiraDivisaoDialog
                open={divisaoOpen && podeDivisao}
                onOpenChange={setDivisaoOpen}
                workspace={podeDivisao ? currentWorkspace : null}
            />
            <Dialog
                surface="auto"
                pending={salvandoDatas}
                open={datasOpen && podeDatas}
                onOpenChange={setDatasOpen}
            >
                <DialogContent layout="fixed">
                    <DialogHeader>
                        <DialogTitle>Datas e orçamento</DialogTitle>
                    </DialogHeader>
                    {currentWorkspace ? (
                        <CarteiraProjetoForm
                            key={currentWorkspace.id}
                            workspace={currentWorkspace}
                            onSalvo={() => setDatasOpen(false)}
                            onCancelar={() => setDatasOpen(false)}
                            onPendente={setSalvandoDatas}
                            cancelarLabel="Cancelar"
                        />
                    ) : null}
                </DialogContent>
            </Dialog>
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
                    alcance={`Vale para todos em ${currentWorkspace.name}.`}
                >
                    <Card padding="none">
                        <CardContent className="flex flex-col">
                            <div className="flex min-w-0 items-center justify-between gap-3 px-4 py-3">
                                <div className="flex min-w-0 items-center gap-3">
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
                                {owner ? (
                                    <Button type="button" variant="secondary" onClick={openEdit}>
                                        Editar
                                    </Button>
                                ) : null}
                            </div>
                            {!owner ? (
                                <CardNote>
                                    <InformationCircleIcon className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                                    <p className="min-w-0 break-words">
                                        Só o dono pode alterar nome, ícone e cor.
                                    </p>
                                </CardNote>
                            ) : null}
                            {podeDivisao ? (
                                <>
                                    <Separator />
                                    <SettingsRow
                                        titulo="Divisão"
                                        descricao={
                                            splitMode === undefined
                                                ? AINDA_NAO_DISPONIVEL
                                                : splitMode === "split"
                                                  ? "Dividida"
                                                  : "Pote único"
                                        }
                                    >
                                        {splitMode === undefined ? null : (
                                            <Button type="button" variant="secondary" onClick={() => setDivisaoOpen(true)}>
                                                Alterar
                                            </Button>
                                        )}
                                    </SettingsRow>
                                </>
                            ) : null}
                            {podeDatas ? (
                                <>
                                    <Separator />
                                    <SettingsRow titulo="Datas e orçamento" descricao={resumoDoCalendario(currentWorkspace)}>
                                        <Button type="button" variant="secondary" onClick={() => setDatasOpen(true)}>
                                            Alterar
                                        </Button>
                                    </SettingsRow>
                                </>
                            ) : null}
                            {canDeleteProject ? (
                                <>
                                    <Separator />
                                    <SettingsRow titulo="Excluir carteira" descricao="Apaga a carteira e tudo que há nela.">
                                        <Button type="button" variant="destructive" onClick={() => setDeleteOpen(true)}>
                                            Excluir
                                        </Button>
                                    </SettingsRow>
                                </>
                            ) : !owner ? (
                                <>
                                    <Separator />
                                    <SettingsRow titulo="Sair da carteira" descricao="Você perde o acesso a esta carteira.">
                                        <Button type="button" variant="destructive" onClick={() => setLeaveOpen(true)}>
                                            Sair
                                        </Button>
                                    </SettingsRow>
                                </>
                            ) : null}
                        </CardContent>
                    </Card>
                </SettingsSection>
            )}
        </>
    )
}
