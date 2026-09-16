"use client"

import { useEffect, useState } from "react"
import { useWorkspace } from "@/components/workspace-provider"
import { WorkspaceAppearanceFormFields } from "@/components/workspace/workspace-appearance-form-fields"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogBody,
  DialogCloseButton,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet"
import { useIsMobile } from "@/hooks/use-mobile"
import { CustomForm } from "@/components/ui/form"
import type { Workspace } from "@/lib/supabase"
import {
    isWorkspaceIconKey,
    type WorkspaceIconKey,
} from "@/lib/workspace-icons"

type WorkspaceAppearanceEditDialogProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
    workspace: Workspace | null
}

export function WorkspaceAppearanceEditDialog({
    open,
    onOpenChange,
    workspace,
}: WorkspaceAppearanceEditDialogProps) {
    const isMobile = useIsMobile()
    const { updateWorkspace, error: contextError } = useWorkspace()

    const [name, setName] = useState("")
    const [icon, setIcon] = useState<WorkspaceIconKey>("home")
    const [previewColor, setPreviewColor] = useState("#2563EB")
    const [submitting, setSubmitting] = useState(false)
    const [localError, setLocalError] = useState<string | null>(null)

    useEffect(() => {
        if (!open || !workspace) return
        setName(workspace.name)
        setIcon(
            isWorkspaceIconKey(workspace.icon) ? workspace.icon : "home"
        )
        setPreviewColor(workspace.icon_background_color || "#2563EB")
        setLocalError(null)
        setSubmitting(false)
        // eslint-disable-next-line react-hooks/exhaustive-deps -- seed when opening or switching edited workspace id
    }, [open, workspace?.id])

    const handleOpenChange = (next: boolean) => {
        if (!next && submitting) return
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

        setSubmitting(true)
        try {
            const updated = await updateWorkspace(workspace.id, {
                name: trimmed,
                icon,
                icon_background_color: previewColor,
            })
            if (updated) {
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

    const innerForm = workspace ? (
        <CustomForm
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
                    idPrefix="settings-workspace-edit-dialog"
                    previewHint="Esta cor identifica esta carteira na barra lateral e nos menus."
                />
            </DialogBody>
            {isMobile ? (
                <DialogFooter className="flex-col">
                    <Button type="submit" disabled={submitting} size="xl" className="w-full">
                        {submitting ? "Salvando…" : "Salvar alterações"}
                    </Button>
                </DialogFooter>
            ) : (
                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleOpenChange(false)}
                        disabled={submitting}
                    >
                        Cancelar
                    </Button>
                    <Button type="submit" disabled={submitting}>
                        {submitting ? "Salvando…" : "Salvar alterações"}
                    </Button>
                </DialogFooter>
            )}
        </CustomForm>
    ) : null

    if (!workspace) {
        return null
    }

    if (isMobile) {
        return (
            <Sheet open={open} onOpenChange={handleOpenChange}>
                <SheetContent
                    side="bottom"
                    fillMobileViewport
                >
                    <DialogHeader>
                        <DialogTitle>Editar carteira</DialogTitle>
                        <DialogDescription>Altere nome, ícone e cor de destaque da carteira.</DialogDescription>
                    </DialogHeader>
                    {innerForm}
                <DialogCloseButton />
                </SheetContent>
            </Sheet>
        )
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent layout="fixed">
                <DialogHeader className="shrink-0 px-6 py-4 text-left">
                    <DialogTitle>Editar carteira</DialogTitle>
                    <DialogDescription className="text-xs leading-snug">
                        Altere nome, ícone e cor de destaque da carteira.
                    </DialogDescription>
                </DialogHeader>
                {innerForm}
            </DialogContent>
        </Dialog>
    )
}
