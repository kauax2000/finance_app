"use client"

import { useEffect, useState } from "react"

import { AppWordmark } from "@/components/layout/app-wordmark"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

type AppBootstrapScreenProps = {
    className?: string
}

/**
 * A abertura: a tela enquanto a sessão carrega, antes de o app ou o login
 * existirem. Usada pela home e pelo `AuthGuard`.
 *
 * **O sinal de progresso é atrasado de propósito.** Quase todo arranque é
 * rápido demais para merecer um spinner, e um que pisca por 120ms é ruído.
 * Depois de 600ms a história é outra: sem sinal nenhum, a pessoa não distingue
 * "carregando" de "travado". O atraso mora aqui, e não em quem chama.
 *
 * `Spinner` e não uma barra: a regra da casa é spinner para ação curta sem fim
 * conhecido, e o bloco global de movimento reduzido isenta `animate-spin` —
 * uma barra com keyframe próprio congelaria, que é pior que não ter barra.
 *
 * Ela fica neutra (`bg-background`) e não veste o campo de marca: daqui não dá
 * para saber se o próximo passo é o app ou a tela de acesso, e pintar de verde
 * quem vai para o Painel seria prometer a tela errada.
 */
const SIGNAL_DELAY_MS = 600

export function AppBootstrapScreen({ className }: AppBootstrapScreenProps) {
    const [showSignal, setShowSignal] = useState(false)

    useEffect(() => {
        const id = window.setTimeout(() => setShowSignal(true), SIGNAL_DELAY_MS)
        return () => window.clearTimeout(id)
    }, [])

    return (
        <div
            className={cn(
                // `fixed inset-0` já dá a altura toda; `h-dvh` é o reforço
                // para o navegador do telefone, onde a barra de endereço
                // encolhe a viewport. Era `h-[100dvh] min-h-[100dvh]
                // supports-[height:100dvh]:h-[100dvh]` — o mesmo valor escrito
                // três vezes, duas delas como valor arbitrário de uma medida
                // que a escala do Tailwind já nomeia.
                "fixed inset-0 z-(--z-modal) h-dvh flex flex-col items-center justify-center gap-8 bg-background",
                className,
            )}
            role="status"
            aria-busy="true"
            aria-live="polite"
            aria-label="Carregando aplicativo"
            suppressHydrationWarning
        >
            <AppWordmark size="xl" aria-hidden />
            {/* O espaço é reservado desde o primeiro quadro: sem isso a marca
                salta 40px para cima quando o sinal entra. */}
            <div
                className={cn(
                    "flex h-5 items-center transition-opacity duration-(--duration-slow) ease-(--ease-out)",
                    showSignal ? "opacity-100" : "opacity-0",
                )}
                aria-hidden
            >
                <Spinner className="text-muted-foreground" />
            </div>
        </div>
    )
}
