"use client"

import * as React from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "@/components/providers"
import { ensureUserSettingsRow } from "@/lib/settings"
import { supabase } from "@/lib/supabase"
import { toastError } from "@/lib/toast"

/**
 * Se o "+ Adicionar" abre a paleta de lançamento inteligente (ligado, o
 * padrão) ou o formulário clássico. Vale na conta (`user_settings.lancamento_inteligente`),
 * e o atalho do iPhone lê o mesmo valor. O localStorage antigo só serve de
 * valor inicial enquanto a conta carrega, e o "0" dele migra uma vez para a conta.
 */
const CHAVE = "finance:preferencia:lancamento-inteligente"

/** Ausente ou ilegível é ligado: só um "0" gravado desliga. */
export function lerLancamentoInteligente(storage: Pick<Storage, "getItem"> | null): boolean {
    try {
        return storage?.getItem(CHAVE) !== "0"
    } catch {
        return true
    }
}

/**
 * Leva o "0" deste aparelho para a conta: grava `false` só se a conta nunca
 * escolheu (`em` nulo). Com a chave presente, ela sai depois da leitura (e da
 * gravação, quando houve); a conta passa a mandar. Devolve se gravou.
 */
export async function migrarPreferenciaLocal(
    userId: string,
    storage: Pick<Storage, "getItem" | "removeItem"> | null,
    ler: () => Promise<{ valor: boolean; em: string | null } | null>,
    gravar: (v: boolean) => Promise<void>,
): Promise<boolean> {
    let local: string | null = null
    try {
        local = storage?.getItem(CHAVE) ?? null
    } catch {
        return false
    }
    if (local == null || !userId) return false
    const conta = await ler()
    const grava = local === "0" && conta?.em == null
    if (grava) await gravar(false)
    try {
        storage?.removeItem(CHAVE)
    } catch {
        /* sem armazenamento, a chave fica e a conta já manda */
    }
    return grava
}

function armazenamento() {
    return typeof localStorage === "undefined" ? null : localStorage
}

const semAssinatura = () => () => {}

async function gravarNaConta(userId: string, valor: boolean) {
    await ensureUserSettingsRow(userId)
    const { error } = await supabase
        .from("user_settings")
        .update({ lancamento_inteligente: valor, lancamento_inteligente_em: new Date().toISOString() })
        .eq("user_id", userId)
    if (error) throw error
}

export function useLancamentoInteligente() {
    const { user } = useAuth()
    const queryClient = useQueryClient()
    const userId = user?.id
    // No servidor, ligado: a página nasce como a maioria a vê.
    const local = React.useSyncExternalStore(semAssinatura, () => lerLancamentoInteligente(armazenamento()), () => true)
    const chave = React.useMemo(() => ["lancamento_inteligente", userId], [userId])

    const consulta = useQuery({
        queryKey: chave,
        enabled: Boolean(userId),
        retry: false,
        meta: { errorToast: false },
        queryFn: async () => {
            const { data, error } = await supabase
                .from("user_settings")
                .select("lancamento_inteligente, lancamento_inteligente_em")
                .eq("user_id", userId!)
                .maybeSingle()
            if (error) throw error
            const linha = data as { lancamento_inteligente?: boolean; lancamento_inteligente_em?: string | null } | null
            const conta = linha ? { valor: linha.lancamento_inteligente !== false, em: linha.lancamento_inteligente_em ?? null } : null
            try {
                const gravou = await migrarPreferenciaLocal(userId!, armazenamento(), async () => conta, (v) => gravarNaConta(userId!, v))
                if (gravou) return false
            } catch {
                // A migração falhou: vale a escolha deste aparelho, e a chave fica para a próxima leitura.
                return lerLancamentoInteligente(armazenamento())
            }
            // Sem linha, o default da coluna: ligado.
            return conta?.valor ?? true
        },
    })

    const definir = React.useCallback(
        (proximo: boolean) => {
            if (!userId) return
            queryClient.setQueryData(chave, proximo)
            void gravarNaConta(userId, proximo).catch(() => {
                // Volta ao que a conta tem.
                void queryClient.invalidateQueries({ queryKey: chave })
                toastError("Não foi possível salvar o lançamento inteligente.")
            })
        },
        [userId, queryClient, chave],
    )

    return [consulta.data ?? local, definir] as const
}
