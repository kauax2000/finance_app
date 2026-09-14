"use client"

import * as React from "react"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

type ConfirmOptions = {
    title: string
    description?: string
    actionLabel: string
}

/**
 * O `confirm()` do navegador no desenho do app: `await confirm({...})` devolve
 * `true` só quando a pessoa confirma. Quem chama renderiza `dialog` em qualquer
 * lugar da árvore — ele vai para um portal.
 */
export function useConfirmDialog() {
    const [open, setOpen] = React.useState(false)
    // As opções ficam depois de fechar, para o texto não sumir na animação de saída.
    const [options, setOptions] = React.useState<ConfirmOptions | null>(null)
    const resolver = React.useRef<((ok: boolean) => void) | null>(null)

    const settle = React.useCallback((ok: boolean) => {
        resolver.current?.(ok)
        resolver.current = null
        setOpen(false)
    }, [])

    const confirm = React.useCallback(
        (next: ConfirmOptions) =>
            new Promise<boolean>((resolve) => {
                resolver.current?.(false)
                resolver.current = resolve
                setOptions(next)
                setOpen(true)
            }),
        []
    )

    const dialog = (
        <AlertDialog open={open} onOpenChange={(next) => !next && settle(false)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{options?.title}</AlertDialogTitle>
                    {options?.description ? (
                        <AlertDialogDescription>{options.description}</AlertDialogDescription>
                    ) : null}
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => settle(true)}>
                        {options?.actionLabel}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )

    return { confirm, dialog }
}
