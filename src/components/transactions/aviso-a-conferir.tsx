"use client"

import * as React from "react"
import {
    Alert,
    AlertAction,
    AlertActions,
    AlertDescription,
    AlertTitle,
} from "@/components/ui/alert"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogError,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

type Props = {
    total: number
    ativo: boolean
    onRevisar: () => void
    onConfirmarTodos: () => Promise<void>
    /** O convidado só vê os próprios lançamentos: revisa, mas não confirma a carteira toda. */
    podeConfirmarTodos?: boolean
}

export function AvisoAConferir({ total, ativo, onRevisar, onConfirmarTodos, podeConfirmarTodos = true }: Props) {
    const [pending, setPending] = React.useState(false)
    const [aberto, setAberto] = React.useState(false)
    const [erro, setErro] = React.useState<string | null>(null)
    if (total <= 0) return null

    const confirmar = async () => {
        setPending(true)
        setErro(null)
        try {
            await onConfirmarTodos()
            setAberto(false)
        } catch (e) {
            setErro(e instanceof Error ? e.message : "Não foi possível confirmar os lançamentos.")
        } finally {
            setPending(false)
        }
    }

    return (
        <Alert tone="info">
            <AlertTitle>
                {ativo ? `Conferindo ${total}` : `${total} ${total === 1 ? "lançamento" : "lançamentos"} a conferir`}
            </AlertTitle>
            {ativo ? null : (
                <AlertDescription>
                    Entraram pelo Atalho, Apple Pay, IA ou importação. Confira categoria e valor.
                </AlertDescription>
            )}
            {ativo && !podeConfirmarTodos ? null : (
                <AlertActions placement="inline">
                    {ativo ? (
                        <AlertDialog
                            open={aberto}
                            onOpenChange={(o) => {
                                // Reabrir começa sem o erro da tentativa anterior.
                                if (o) setErro(null)
                                setAberto(o)
                            }}
                            pending={pending}
                        >
                            <AlertDialogTrigger asChild>
                                <AlertAction>Confirmar todos</AlertAction>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>
                                        Confirmar {total} {total === 1 ? "lançamento" : "lançamentos"}?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Todos saem da lista a conferir. Dá para editar cada um depois.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                {erro ? <AlertDialogError>{erro}</AlertDialogError> : null}
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                        variant="primary"
                                        onClick={(e) => {
                                            e.preventDefault()
                                            void confirmar()
                                        }}
                                    >
                                        Confirmar
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    ) : (
                        <AlertAction onClick={onRevisar}>Revisar</AlertAction>
                    )}
                </AlertActions>
            )}
        </Alert>
    )
}
