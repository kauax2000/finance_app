"use client"

import * as React from "react"
import { useAuth } from "@/components/providers"
import { DialogoDeVolta } from "@/components/reativacao/dialogo-de-volta"
import { useAcesso } from "@/hooks/use-acesso"
import { useDisplayMode } from "@/hooks/use-display-mode"
import { deveGravar, voltouDeAusencia } from "@/lib/reativacao"
import { ensureUserSettingsRow } from "@/lib/settings"
import { supabase } from "@/lib/supabase"

const nada = () => () => {}

// Por pessoa: num aparelho com duas contas, a segunda também registra.
const marcaDe = (userId: string) => `acesso:${userId}`

function hojeLocal(agora: Date) {
    const mes = String(agora.getMonth() + 1).padStart(2, "0")
    return `${agora.getFullYear()}-${mes}-${String(agora.getDate()).padStart(2, "0")}`
}

/**
 * Grava o acesso de hoje uma vez por dia por aparelho e, depois de 10 dias sem
 * acesso, abre o diálogo de volta uma vez nesta sessão.
 */
export function RegistroDeAcesso() {
    const { user } = useAuth()
    const { carregando, erro, ultimoAcessoEm } = useAcesso()
    const { isStandalone } = useDisplayMode()
    // Calculado na primeira leitura, antes da gravação: é ele que decide o diálogo.
    const [voltou, setVoltou] = React.useState<boolean | null>(null)
    const [aberto, setAberto] = React.useState(false)
    // O isStandalone do servidor é false: só vale depois de montar.
    const montado = React.useSyncExternalStore(nada, () => true, () => false)
    const feito = React.useRef(false)

    React.useEffect(() => {
        if (!montado || carregando || erro || !user || feito.current) return
        feito.current = true
        const agora = new Date()
        setVoltou(voltouDeAusencia(ultimoAcessoEm, agora))

        const hoje = hojeLocal(agora)
        let marca: string | null = null
        try {
            marca = localStorage.getItem(marcaDe(user.id))
        } catch {}
        if (!deveGravar(marca, hoje)) return

        const iso = agora.toISOString()
        void (async () => {
            try {
                await ensureUserSettingsRow(user.id)
                const { error } = await supabase
                    .from("user_settings")
                    .update({
                        ultimo_acesso_em: iso,
                        ...(isStandalone ? { app_aberto_em: iso } : {}),
                    })
                    .eq("user_id", user.id)
                if (error) return
                try {
                    localStorage.setItem(marcaDe(user.id), hoje)
                } catch {}
            } catch {
                // sem rede: tenta de novo na próxima carga
            }
        })()
    }, [montado, carregando, erro, user, ultimoAcessoEm, isStandalone])

    React.useEffect(() => {
        if (!voltou) return
        const espera = window.setTimeout(() => {
            // Outro diálogo aberto (tour, guia): não cobre, e não tenta de novo nesta sessão.
            if (document.querySelector('[role="dialog"], [role="alertdialog"]')) return
            setAberto(true)
        }, 1500)
        return () => window.clearTimeout(espera)
    }, [voltou])

    return <DialogoDeVolta open={aberto} onOpenChange={setAberto} />
}
