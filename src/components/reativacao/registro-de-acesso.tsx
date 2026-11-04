"use client"

import * as React from "react"
import { useAuth } from "@/components/providers"
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

/** Grava o acesso de hoje uma vez por dia por aparelho. Não desenha nada ainda. */
export function RegistroDeAcesso() {
    const { user } = useAuth()
    const { carregando, erro, ultimoAcessoEm } = useAcesso()
    const { isStandalone } = useDisplayMode()
    // Calculado na primeira leitura, antes da gravação; a Task 3 o lê para o diálogo.
    const [, setVoltou] = React.useState<boolean | null>(null)
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

    return null
}
