"use client"

import { XMarkIcon } from "@heroicons/react/24/outline"
import { useState } from "react"
import { useWorkspace } from "@/components/workspace-provider"
import { WorkspaceAppearanceFormFields } from "@/components/workspace/workspace-appearance-form-fields"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetFooter,
} from "@/components/ui/sheet"
import {
    MobileSheetFormDragStrip,
    MobileSheetFormStickyHeader,
    mobileFormSheetContentClassName,
} from "@/components/ui/mobile-sheet-form-chrome"
import { useIsMobile } from "@/hooks/use-mobile"
import { CustomForm } from "@/components/ui/form"
import { cn } from "@/lib/utils"
import { randomWorkspaceAccentColor, type WorkspaceIconKey } from "@/lib/workspace-icons"

export type ProjectFormDialogProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
}

const dialogFooterClass =
    "!mx-0 !mb-0 mt-0 shrink-0 flex flex-row flex-wrap justify-end gap-2 border-t border-border bg-background px-6 py-4 sm:flex-row"

const sheetFooterMobileClass =
    "mt-0 shrink-0 flex-col gap-2 border-t border-border bg-background px-4 py-4"

function sheetHeaderCloseControl(submitting: boolean) {
    return (
        <SheetClose asChild>
            <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="shrink-0 -mr-1"
                aria-label="Fechar"
                disabled={submitting}
            >
                <XMarkIcon className="h-5 w-5" aria-hidden />
            </Button>
        </SheetClose>
    )
}

export function ProjectFormDialog({
    open,
    onOpenChange,
}: ProjectFormDialogProps) {
    const isMobile = useIsMobile()
    const { createWorkspace, error: contextError } = useWorkspace()

    const [name, setName] = useState("")
    const [icon, setIcon] = useState<WorkspaceIconKey>("home")
    const [previewColor, setPreviewColor] = useState(() =>
        randomWorkspaceAccentColor()
    )
    const [submitting, setSubmitting] = useState(false)
    const [localError, setLocalError] = useState<string | null>(null)

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
            onOpenChange(false)
        }
    }

    const displayError = localError ?? contextError

    const innerForm = (
        <CustomForm
            onSubmit={(e) => void handleSubmit(e)}
            className="flex min-h-0 flex-1 flex-col"
        >
            <div
                className={cn(
                    "min-h-0 flex-1 overflow-y-auto py-4",
                    isMobile ? "px-4" : "px-6",
                )}
            >
                <WorkspaceAppearanceFormFields
                    name={name}
                    onNameChange={setName}
                    icon={icon}
                    onIconChange={setIcon}
                    previewColor={previewColor}
                    onPreviewColorChange={setPreviewColor}
                    displayError={displayError}
                    idPrefix="project-dialog-create"
                    previewHint="Esta cor identifica a carteira na barra lateral e nos menus."
                />
            </div>
            {isMobile ? (
                <SheetFooter className={sheetFooterMobileClass}>
                    <Button type="submit" disabled={submitting} className="h-10 w-full">
                        {submitting ? "Criando…" : "Criar carteira"}
                    </Button>
                </SheetFooter>
            ) : (
                <DialogFooter className={dialogFooterClass}>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleOpenChange(false)}
                        disabled={submitting}
                    >
                        Cancelar
                    </Button>
                    <Button type="submit" disabled={submitting}>
                        {submitting ? "Criando…" : "Criar carteira"}
                    </Button>
                </DialogFooter>
            )}
        </CustomForm>
    )

    if (isMobile) {
        return (
            <Sheet open={open} onOpenChange={handleOpenChange}>
                <SheetContent
                    side="bottom"
                    fillMobileViewport
                    showCloseButton={false}
                    className={mobileFormSheetContentClassName}
                >
                    <MobileSheetFormDragStrip />
                    <MobileSheetFormStickyHeader
                        title="Nova carteira"
                        endAdornment={sheetHeaderCloseControl(submitting)}
                    />
                    {innerForm}
                </SheetContent>
            </Sheet>
        )
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="flex max-h-[min(90dvh,36rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-md">
                <DialogHeader className="shrink-0 px-6 py-4 text-left">
                    <DialogTitle>Nova carteira</DialogTitle>
                </DialogHeader>
                {innerForm}
            </DialogContent>
        </Dialog>
    )
}
