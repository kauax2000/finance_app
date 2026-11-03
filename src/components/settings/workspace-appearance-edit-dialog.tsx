"use client"

import { useEffect, useState } from "react"
import { CamposDaDivisao, type DivisaoEditavel } from "@/components/settings/carteira-divisao"
import { useWorkspace } from "@/components/workspace-provider"
import { WorkspaceAppearanceFormFields } from "@/components/workspace/workspace-appearance-form-fields"
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CustomForm, FormCancel, FormSubmit } from "@/components/ui/form"
import type { Workspace } from "@/lib/supabase"
import {
    isWorkspaceIconKey,
    type WorkspaceIconKey,
} from "@/lib/workspace-icons"
import { TILE_WORKSPACE_DEFAULT } from "@/lib/tile-palette"

type WorkspaceAppearanceEditDialogProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
    workspace: Workspace | null
    acoes?: React.ReactNode
    /** A divisão editável: vai logo abaixo da aparência e grava no mesmo Salvar. */
    divisao?: DivisaoEditavel
    /** A ação à esquerda do rodapé (Excluir carteira). */
    rodapeInicio?: React.ReactNode
}

export function WorkspaceAppearanceEditDialog({
    open,
    onOpenChange,
    workspace,
    acoes,
    divisao,
    rodapeInicio,
}: WorkspaceAppearanceEditDialogProps) {
    const { updateWorkspace, error: contextError } = useWorkspace()

    const [name, setName] = useState("")
    const [icon, setIcon] = useState<WorkspaceIconKey>("home")
    const [previewColor, setPreviewColor] = useState(TILE_WORKSPACE_DEFAULT)
    const [submitting, setSubmitting] = useState(false)
    const [localError, setLocalError] = useState<string | null>(null)

    useEffect(() => {
        if (!open || !workspace) return
        setName(workspace.name)
        setIcon(
            isWorkspaceIconKey(workspace.icon) ? workspace.icon : "home"
        )
        setPreviewColor(workspace.icon_background_color || TILE_WORKSPACE_DEFAULT)
        setLocalError(null)
        setSubmitting(false)
        // eslint-disable-next-line react-hooks/exhaustive-deps -- seed when opening or switching edited workspace id
    }, [open, workspace?.id])

    // Enquanto salva, o `pending` do `Dialog` já segura todo pedido de fechar.
    const handleOpenChange = (next: boolean) => {
        if (!next) {
            setLocalError(null)
        }
        onOpenChange(next)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLocalError(null)
        if (!workspace) return

        const trimmed = name.trim()
        if (!trimmed) {
            setLocalError("Informe um nome para a carteira.")
            return
        }
        // Pesos inválidos não gravam nada, nem o nome.
        const erroDaDivisao = divisao?.validar() ?? null
        if (erroDaDivisao) {
            setLocalError(erroDaDivisao)
            return
        }

        setSubmitting(true)
        try {
            const updated = await updateWorkspace(workspace.id, {
                name: trimmed,
                icon,
                icon_background_color: previewColor,
            })
            if (updated) {
                const falhaDaDivisao = divisao ? await divisao.salvar() : null
                if (falhaDaDivisao) {
                    setLocalError(falhaDaDivisao)
                    return
                }
                setLocalError(null)
                onOpenChange(false)
            }
        } catch {
            setLocalError("Não foi possível salvar a carteira. Tente novamente.")
        } finally {
            setSubmitting(false)
        }
    }

    const displayError = localError ?? contextError

    if (!workspace) {
        return null
    }

    // Diálogo no desktop, gaveta alta no telefone (`surface="auto"`).
    return (
        <Dialog
            surface="auto"
            pending={submitting}
            open={open}
            onOpenChange={handleOpenChange}
        >
            <DialogContent layout="fixed">
                <DialogHeader>
                    <DialogTitle>Editar carteira</DialogTitle>
                    <DialogDescription className="text-xs leading-snug">
                        {divisao ? "Nome, aparência e como o dinheiro se divide." : "Altere nome, ícone e cor de destaque da carteira."}
                    </DialogDescription>
                </DialogHeader>
                <CustomForm
                    pending={submitting}
                    onSubmit={(e) => void handleSubmit(e)}
                    className="flex min-h-0 flex-1 flex-col"
                >
                    <DialogBody className="flex flex-col gap-6">
                        <WorkspaceAppearanceFormFields
                            name={name}
                            onNameChange={setName}
                            icon={icon}
                            onIconChange={setIcon}
                            previewColor={previewColor}
                            onPreviewColorChange={setPreviewColor}
                            displayError={displayError}
                            idPrefix="settings-workspace-edit-dialog"
                            previewHint="Assim ela aparece na barra lateral e nos menus."
                        />
                        {divisao ? <CamposDaDivisao divisao={divisao} /> : null}
                        {acoes}
                    </DialogBody>
                    <DialogFooter start={rodapeInicio}>
                        <DialogClose asChild>
                            <FormCancel>Cancelar</FormCancel>
                        </DialogClose>
                        <FormSubmit>Salvar alterações</FormSubmit>
                    </DialogFooter>
                </CustomForm>
            </DialogContent>
        </Dialog>
    )
}
