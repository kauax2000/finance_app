"use client"

import { useState } from "react"
import { ProjectFormDialog } from "@/components/workspace/project-form-dialog"

type CreateProjectDialogProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function CreateProjectDialog({
    open,
    onOpenChange,
}: CreateProjectDialogProps) {
    // Um formulário limpo a cada abertura, sem remontar ao fechar: com
    // `key={String(open)}` o diálogo era trocado por um novo, fechado, e sumia
    // sem a animação de saída.
    const [abertura, setAbertura] = useState(0)
    const [estavaAberto, setEstavaAberto] = useState(open)
    if (open !== estavaAberto) {
        setEstavaAberto(open)
        if (open) setAbertura((n) => n + 1)
    }

    return (
        <ProjectFormDialog
            key={abertura}
            open={open}
            onOpenChange={onOpenChange}
        />
    )
}
