import type { SupabaseClient } from "@supabase/supabase-js"

import { listarAnexos } from "@/lib/anexos"
import type { Attachment } from "@/lib/supabase"

/**
 * Os anexos do lançamento, mais o boleto da conta que ele pagou. O boleto é
 * anexo da instância e não é copiado: o lançamento o alcança por
 * `bill_instances.transaction_id`. O mesmo `path` aparece uma vez.
 */
export async function anexosDoLancamento(supabase: SupabaseClient, transactionId: string): Promise<Attachment[]> {
    const { data, error } = await supabase.from("bill_instances").select("id").eq("transaction_id", transactionId)
    if (error) throw new Error(error.message)
    const instancias = (data ?? []) as Array<{ id: string }>

    const listas = await Promise.all([
        listarAnexos(supabase, { transactionId }),
        ...instancias.map((i) => listarAnexos(supabase, { billInstanceId: i.id })),
    ])
    // Um path, uma linha; no empate vale a primeira, a do lançamento.
    const porPath = new Map<string, Attachment>()
    for (const a of listas.flat()) if (!porPath.has(a.path)) porPath.set(a.path, a)
    return [...porPath.values()].sort((a, b) => a.created_at.localeCompare(b.created_at))
}
