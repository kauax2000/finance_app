"use client"

import { useRef, useState } from "react"
import { useWorkspace } from "@/components/workspace-provider"
import { WorkspaceAppearanceFormFields } from "@/components/workspace/workspace-appearance-form-fields"
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CustomForm, FormCancel, FormSubmit } from "@/components/ui/form"
import { randomWorkspaceAccentColor, type WorkspaceIconKey } from "@/lib/workspace-icons"

export type ProjectFormDialogProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
}


export function ProjectFormDialog({
    open,
    onOpenChange,
}: ProjectFormDialogProps) {
    const { createWorkspace, setCurrentWorkspaceId, error: contextError } = useWorkspace()
    // A carteira criada espera o diálogo terminar de sair para virar a atual.
    const criada = useRef<string | null>(null)

    const [name, setName] = useState("")
    const [icon, setIcon] = useState<WorkspaceIconKey>("home")
    const [previewColor, setPreviewColor] = useState(() =>
        randomWorkspaceAccentColor()
    )
    const [submitting, setSubmitting] = useState(false)
    const [localError, setLocalError] = useState<string | null>(null)

    // Enquanto cria, o `pending` do `Dialog` já segura todo pedido de fechar.
    const handleOpenChange = (next: boolean) => {
        if (!next) {
            setLocalError(null)
        }
        onOpenChange(next)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLocalError(null)
        const trimmed = name.trim()
        if (!trimmed) {
            setLocalError("Informe um nome para a carteira.")
            return
        }

        setSubmitting(true)
        const created = await createWorkspace({
            name: trimmed,
            icon,
            type: "shared",
            icon_background_color: previewColor,
        })
        setSubmitting(false)
        if (created) {
            criada.current = created.id
            onOpenChange(false)
        }
    }

    const displayError = localError ?? contextError

    // Diálogo no desktop, gaveta alta no telefone (`surface="auto"`).
    return (
        <Dialog
            surface="auto"
            pending={submitting}
            open={open}
            onOpenChange={handleOpenChange}
        >
            {/* O `onCloseAutoFocus` chega depois da animação de saída (o Radix
                desmonta o conteúdo só quando ela acaba): só então a carteira
                nova entra, com a troca animada do provedor. */}
            <DialogContent
                layout="fixed"
                onCloseAutoFocus={() => {
                    const id = criada.current
                    criada.current = null
                    if (id) void setCurrentWorkspaceId(id)
                }}
            >
                <DialogHeader>
                    <DialogTitle>Nova carteira</DialogTitle>
                </DialogHeader>
                <CustomForm
                    pending={submitting}
                    onSubmit={(e) => void handleSubmit(e)}
                    className="flex min-h-0 flex-1 flex-col"
                >
                    <DialogBody>
                        <WorkspaceAppearanceFormFields
                            name={name}
                            onNameChange={setName}
                            icon={icon}
                            onIconChange={setIcon}
                            previewColor={previewColor}
                            onPreviewColorChange={setPreviewColor}
                            displayError={displayError}
                            idPrefix="project-dialog-create"
                            previewHint="Assim ela aparece na barra lateral e nos menus."
                        />
                    </DialogBody>
                    <DialogFooter>
                        <DialogClose asChild>
                            <FormCancel>Cancelar</FormCancel>
                        </DialogClose>
                        <FormSubmit>Criar carteira</FormSubmit>
                    </DialogFooter>
                </CustomForm>
            </DialogContent>
        </Dialog>
    )
}
