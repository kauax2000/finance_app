"use client"

import { ProjectFormDialog } from "@/components/workspace/project-form-dialog"

type CreateProjectDialogProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function CreateProjectDialog({
    open,
    onOpenChange,
}: CreateProjectDialogProps) {
    return (
        <ProjectFormDialog
            key={String(open)}
            open={open}
            onOpenChange={onOpenChange}
        />
    )
}
