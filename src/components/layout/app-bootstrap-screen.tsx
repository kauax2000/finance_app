"use client"

import * as React from "react"
import { ArrowPathIcon } from "@heroicons/react/16/solid"
import { AppWordmark } from "@/components/layout/app-wordmark"
import { Button } from "@/components/ui/button"
import { SpinnerBlock } from "@/components/ui/spinner"
import { Muted } from "@/components/ui/typography"
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
 * "carregando" de "travado". Desde a rodada 178 o atraso é o do
 * `SpinnerBlock` (`@starting-style`, sem `setTimeout`), e a roda é a de marca,
 * ao lado do wordmark em arco-íris.
 *
 * **E ela tem teto.** Com o Auth fora do ar, um pedido pendurado prende o
 * `getSession()` (o auth-js não põe teto por pedido e segura um lock), e a roda
 * girava para sempre. Passados 15s, a roda dá lugar ao "Tentar novamente", que
 * recarrega a página.
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
const STALL_MS = 15_000

export function AppBootstrapScreen({ className }: AppBootstrapScreenProps) {
    const [parado, setParado] = React.useState(false)

    React.useEffect(() => {
        const id = window.setTimeout(() => setParado(true), STALL_MS)
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
            aria-busy={!parado}
            suppressHydrationWarning
        >
            <AppWordmark size="xl" rainbow aria-hidden />
            {parado ? (
                <div role="alert" className="flex flex-col items-center gap-4 px-4 text-center">
                    <Muted>O servidor está demorando para responder.</Muted>
                    <Button
                        type="button"
                        variant="secondary"
                        iconMotion="spin"
                        onClick={() => window.location.reload()}
                    >
                        <ArrowPathIcon aria-hidden />
                        Tentar novamente
                    </Button>
                </div>
            ) : (
                /* O bloco ocupa o espaço desde o primeiro quadro, e só a
                   opacidade espera: sem isso a marca saltaria para cima quando
                   o sinal entra. Ele é quem anuncia (`role="status"`). */
                <SpinnerBlock
                    label="Carregando o aplicativo"
                    showLabel={false}
                    variant="brand"
                    size="xl"
                    delay={SIGNAL_DELAY_MS}
                />
            )}
        </div>
    )
}
