"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "@/components/providers"
import { ensureUserSettingsRow } from "@/lib/settings"
import { supabase } from "@/lib/supabase"

export type UltimaCompraDoApplePay = { amount: number; description: string; created_at: string }

/**
 * O estado de Lançar ao pagar: `novo` (o guia nunca terminou), `aguardando`
 * (terminou, `user_settings.apple_pay_configurado_em`, e nenhuma compra chegou) e
 * `funcionando` (já existe uma transação da pessoa com `source = 'apple_pay'`, a
 * prova de que a automação roda; vale mesmo sem o guia).
 */
export type EstadoDoApplePay = "novo" | "aguardando" | "funcionando"

export function estadoDoApplePay(configuradoEm: string | null, ultima: UltimaCompraDoApplePay | null): EstadoDoApplePay {
    if (ultima) return "funcionando"
    return configuradoEm ? "aguardando" : "novo"
}

export function useLancarAoPagar() {
    const { user } = useAuth()
    const queryClient = useQueryClient()
    const chave = ["lancar_ao_pagar", user?.id]
    const consulta = useQuery({
        queryKey: chave,
        enabled: Boolean(user),
        retry: false,
        meta: { errorToast: false },
        queryFn: async () => {
            const [ajustes, compra] = await Promise.all([
                supabase.from("user_settings").select("apple_pay_configurado_em").eq("user_id", user!.id).maybeSingle(),
                supabase
                    .from("transactions")
                    .select("amount, description, created_at")
                    .eq("user_id", user!.id)
                    .eq("source", "apple_pay")
                    .order("created_at", { ascending: false })
                    .limit(1)
                    .maybeSingle(),
            ])
            if (ajustes.error) throw ajustes.error
            if (compra.error) throw compra.error
            const configuradoEm =
                (ajustes.data as { apple_pay_configurado_em?: string | null } | null)?.apple_pay_configurado_em ?? null
            const ultima = (compra.data as UltimaCompraDoApplePay | null) ?? null
            return { configuradoEm, ultima }
        },
    })

    /** O Pronto do guia: guarda o momento na conta, para o computador e o celular verem o mesmo estado. */
    async function marcarConfigurado() {
        if (!user) return
        await ensureUserSettingsRow(user.id)
        const { error } = await supabase
            .from("user_settings")
            .update({ apple_pay_configurado_em: new Date().toISOString() })
            .eq("user_id", user.id)
        if (error) throw error
        await queryClient.invalidateQueries({ queryKey: chave })
    }

    const ultima = consulta.data?.ultima ?? null
    return {
        carregando: consulta.isLoading,
        estado: estadoDoApplePay(consulta.data?.configuradoEm ?? null, ultima),
        ultima,
        marcarConfigurado,
    }
}
