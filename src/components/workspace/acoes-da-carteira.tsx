"use client"

import { useEffect, useState, type ReactNode } from "react"
import { useDivisaoEditavel } from "@/components/settings/carteira-divisao"
import { CarteiraProjetoForm, resumoDoCalendario } from "@/components/settings/carteira-projeto-form"
import { SettingsLink, SettingsRow } from "@/components/settings/settings-section"
import { TrashIcon } from "@heroicons/react/16/solid"
import { useAuth } from "@/components/providers"
import { useWorkspace } from "@/components/workspace-provider"
import { WorkspaceAppearanceEditDialog } from "@/components/settings/workspace-appearance-edit-dialog"
import { WorkspaceDeleteDialog } from "@/components/settings/workspace-delete-dialog"
import { WorkspaceLeaveDialog } from "@/components/settings/workspace-leave-dialog"
import { Button } from "@/components/ui/button"
import { Muted } from "@/components/ui/typography"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ItemGroup } from "@/components/ui/item"
import { AINDA_NAO_DISPONIVEL } from "@/lib/projetos/dados"

/**
 * Editar e sair de uma carteira, com os diálogos deles. Mora no seletor de
 * carteira, que é montado duas vezes (barra lateral e cabeçalho do telefone):
 * cada um chama o hook e tem o seu estado. Editar vale para qualquer carteira de
 * que a pessoa é dona (o lápis aparece na passagem, sem precisar entrar nela);
 * sair, para a atual de quem não é dono.
 */
export function useAcoesDaCarteira(): {
    podeEditar: (id: string) => boolean
    editar: (id: string) => void
    sair: (() => void) | null
    dialogos: ReactNode
} {
    const { user } = useAuth()
    const { currentWorkspace: atual, workspaces, isWorkspaceOwner } = useWorkspace()
    const eDono = (w: { id: string; created_by?: string | null } | null | undefined) =>
        Boolean(w && (isWorkspaceOwner(w.id) || w.created_by === user?.id))

    const [editOpen, setEditOpen] = useState(false)
    const [editTargetId, setEditTargetId] = useState<string | null>(null)
    const [deleteOpen, setDeleteOpen] = useState(false)
    const [leaveOpen, setLeaveOpen] = useState(false)
    const [datasOpen, setDatasOpen] = useState(false)
    const [salvandoDatas, setSalvandoDatas] = useState(false)

    // A carteira dos diálogos: a escolhida no lápis, senão a atual.
    const currentWorkspace = (editTargetId ? workspaces.find((w) => w.id === editTargetId) : null) ?? atual
    const dialogOpen = editOpen && editTargetId !== null && currentWorkspace?.id === editTargetId

    const openEdit = (id: string) => {
        setEditTargetId(id)
        setEditOpen(true)
    }

    const handleDialogOpenChange = (open: boolean) => {
        setEditOpen(open)
        if (!open) {
            setEditTargetId(null)
        }
    }

    // A carteira editada que sumiu (excluída, ou a pessoa saiu dela) fecha tudo.
    useEffect(() => {
        if (editTargetId == null) return
        if (!workspaces.some((w) => w.id === editTargetId)) {
            /* eslint-disable react-hooks/set-state-in-effect -- reset edit scope when the edited wallet is gone */
            setEditOpen(false)
            setEditTargetId(null)
            /* eslint-enable react-hooks/set-state-in-effect */
        }
    }, [workspaces, editTargetId])

    useEffect(() => {
        if (!atual?.id) return
        /* eslint-disable react-hooks/set-state-in-effect -- close destructive flows when switching workspace */
        setDeleteOpen(false)
        setLeaveOpen(false)
        setDatasOpen(false)
        setEditOpen(false)
        setEditTargetId(null)
        /* eslint-enable react-hooks/set-state-in-effect */
    }, [atual?.id])

    const owner = eDono(currentWorkspace)

    // Toda carteira se comporta igual; a primeira só não se apaga, porque a conta
    // precisa ter ao menos uma (o banco também recusa).
    const isPrimeira = currentWorkspace?.type === "personal"
    const canDeleteProject = Boolean(
        owner && currentWorkspace && !isPrimeira,
    )
    const podeDivisao = owner
    const podeDatas = owner && currentWorkspace?.purpose === "project"
    const splitMode = currentWorkspace?.split_mode
    const divisao = useDivisaoEditavel(dialogOpen && podeDivisao && splitMode !== undefined ? currentWorkspace : null)

    const dialogos = (
        <>
            <WorkspaceAppearanceEditDialog
                open={dialogOpen}
                onOpenChange={handleDialogOpenChange}
                workspace={dialogOpen ? currentWorkspace : null}
                divisao={podeDivisao && splitMode !== undefined ? divisao : undefined}
                acoes={
                    (podeDivisao && splitMode === undefined) || podeDatas || owner ? (
                        <>
                            {(podeDivisao && splitMode === undefined) || podeDatas ? (
                                <ItemGroup variant="divided">
                                    {podeDivisao && splitMode === undefined ? (
                                        <SettingsRow titulo="Divisão" descricao={AINDA_NAO_DISPONIVEL} />
                                    ) : null}
                                    {podeDatas ? (
                                        <SettingsLink
                                            titulo="Datas e orçamento"
                                            valor={currentWorkspace ? resumoDoCalendario(currentWorkspace) : ""}
                                            aria-label="Alterar datas e orçamento"
                                            onClick={() => setDatasOpen(true)}
                                        />
                                    ) : null}
                                </ItemGroup>
                            ) : null}
                            {canDeleteProject ? (
                                <Button
                                    type="button"
                                    variant="destructive"
                                    className="w-full"
                                    onClick={() => setDeleteOpen(true)}
                                >
                                    <TrashIcon data-icon="inline-start" aria-hidden />
                                    Excluir carteira
                                </Button>
                            ) : owner && isPrimeira ? (
                                <Muted>
                                    A carteira pessoal não pode ser excluída: ela é a sua carteira principal, e a conta
                                    precisa ter ao menos uma.
                                </Muted>
                            ) : null}
                        </>
                    ) : null
                }
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
        </>
    )

    return {
        podeEditar: (id) => eDono(workspaces.find((w) => w.id === id)),
        editar: openEdit,
        // Sem carteira atual não há linha no seletor onde o botão apareça.
        sair: atual && !eDono(atual) ? () => setLeaveOpen(true) : null,
        dialogos,
    }
}
