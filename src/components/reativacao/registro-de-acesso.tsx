"use client"

import * as React from "react"
import { useAuth } from "@/components/providers"
import { useAcesso } from "@/hooks/use-acesso"
import { useDisplayMode } from "@/hooks/use-display-mode"
import { deveGravar, voltouDeAusencia } from "@/lib/reativacao"
import { ensureUserSettingsRow } from "@/lib/settings"
import { supabase } from "@/lib/supabase"

const MARCA = "acesso-registrado"

function hojeLocal(agora: Date) {
    const mes = String(agora.getMonth() + 1).padStart(2, "0")
    return `${agora.getFullYear()}-${mes}-${String(agora.getDate()).padStart(2, "0")}`
}

/** Grava o acesso de hoje uma vez por dia por aparelho. Não desenha nada ainda. */
export function RegistroDeAcesso() {
    const { user } = useAuth()
    const { carregando, ultimoAcessoEm } = useAcesso()
    const { isStandalone } = useDisplayMode()
    // Calculado na primeira leitura, antes da gravação; a Task 3 o lê para o diálogo.
    const [, setVoltou] = React.useState<boolean | null>(null)
    const feito = React.useRef(false)

    React.useEffect(() => {
        if (carregando || !user || feito.current) return
        feito.current = true
        const agora = new Date()
        setVoltou(voltouDeAusencia(ultimoAcessoEm, agora))

        const hoje = hojeLocal(agora)
        let marca: string | null = null
        try {
            marca = localStorage.getItem(MARCA)
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
                    localStorage.setItem(MARCA, hoje)
                } catch {}
            } catch {
                // sem rede: tenta de novo na próxima carga
            }
        })()
    }, [carregando, user, ultimoAcessoEm, isStandalone])

    return null
}
