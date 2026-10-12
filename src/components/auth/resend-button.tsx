"use client"

import { useState } from "react"

import { Alert, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { formatCooldown, useCooldown } from "@/hooks/use-cooldown"
import { formatAuthErrorMessagePt } from "@/lib/supabase-errors"
import { toastSuccess } from "@/lib/toast"

/**
 * Reenviar o código ou o e-mail, liberado depois da contagem. A contagem
 * começa ao entrar no passo (o envio acabou de acontecer). Um reenvio que
 * falha mostra o erro no lugar e **não** zera a contagem — pedir de novo na
 * hora só esbarraria no limite de taxa outra vez.
 */
export function ResendButton({
    label,
    successMessage,
    onResend,
    seconds = 60,
}: {
    label: string
    successMessage: string
    /** Lança em erro (a mensagem crua do Supabase). */
    onResend: () => Promise<void>
    seconds?: number
}) {
    const { remaining, restart } = useCooldown(seconds)
    const [pending, setPending] = useState(false)
    const [error, setError] = useState("")

    const resend = async () => {
        setError("")
        setPending(true)
        try {
            await onResend()
            toastSuccess(successMessage)
            restart()
        } catch (e) {
            setError(formatAuthErrorMessagePt(e instanceof Error ? e.message : String(e)))
        } finally {
            setPending(false)
        }
    }

    return (
        <div className="flex flex-col gap-3">
            {error ? (
                <Alert tone="destructive">
                    <AlertTitle>{error}</AlertTitle>
                </Alert>
            ) : null}
            <Button
                variant="tertiary"
                size="xl"
                className="w-full"
                disabled={remaining > 0 || pending}
                aria-busy={pending || undefined}
                onClick={resend}
            >
                {remaining > 0 ? `${label} em ${formatCooldown(remaining)}` : label}
            </Button>
        </div>
    )
}
