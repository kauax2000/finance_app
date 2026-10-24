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
    const vistos = new Set<string>()
    return listas
        .flat()
        .filter((a) => !vistos.has(a.path) && vistos.add(a.path))
        .sort((a, b) => a.created_at.localeCompare(b.created_at))
}
