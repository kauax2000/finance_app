/**
 * O gasto privado (Bloco 7B) visto de fora e de dentro. A linha de
 * `transactions` chega mascarada a todo mundo (`description = 'Gasto
 * pessoal'`, sem categoria e sem `capture_meta`); os detalhes moram em
 * `transacoes_privadas`, que só o autor lê. As telas do autor (a lista, a
 * folha de detalhe, o formulário) e o Cofre juntam os dois aqui.
 */
import type { SupabaseClient } from "@supabase/supabase-js"

/** A palavra fixa que o gatilho `guardar_privado` deixa na linha. */
export const MASCARA_PRIVADA = "Gasto pessoal"

export type DetalhePrivado = {
    transaction_id: string
    description: string | null
    category_id: string | null
    capture_meta?: unknown
    /** O embed `category:categories(*)`, quando a consulta o pede. */
    category?: unknown
}

type LinhaComAutor = { id: string; is_private?: boolean | null; user_id: string }

/**
 * Pura: troca descrição, categoria (e `capture_meta`/`category`, se o detalhe
 * os traz) só nas privadas do próprio autor. A de outra pessoa fica como veio.
 */
export function comDetalhesPrivados<T extends LinhaComAutor>(
    linhas: T[],
    detalhes: DetalhePrivado[],
    meuId: string,
): T[] {
    if (!detalhes.length) return linhas
    const porId = new Map(detalhes.map((d) => [d.transaction_id, d]))
    return linhas.map((t) => {
        const d = t.is_private && t.user_id === meuId ? porId.get(t.id) : undefined
        if (!d) return t
        return {
            ...t,
            description: d.description,
            category_id: d.category_id,
            ...("capture_meta" in d ? { capture_meta: d.capture_meta ?? null } : {}),
            ...("category" in d ? { category: d.category ?? undefined } : {}),
        }
    })
}

/**
 * Os detalhes das privadas pedidas, numa consulta só. A RLS de
 * `transacoes_privadas` só devolve as do próprio autor.
 * ponytail: um `.in()` só; as ids são só as privadas do autor na página. Em
 * lotes se uma lista "tudo no intervalo" passar de umas centenas delas.
 */
export async function buscarDetalhesPrivados(
    supabase: SupabaseClient,
    ids: string[],
): Promise<DetalhePrivado[]> {
    if (!ids.length) return []
    const { data, error } = await supabase
        .from("transacoes_privadas")
        .select("transaction_id, description, category_id, capture_meta, category:categories(*)")
        .in("transaction_id", ids)
    if (error) throw new Error(error.message)
    return (data ?? []) as DetalhePrivado[]
}

/** Quem está na sessão (sem rede: o `getSession` lê o armazenamento local). */
export async function meuIdDaSessao(supabase: SupabaseClient): Promise<string | null> {
    const { data } = await supabase.auth.getSession()
    return data.session?.user.id ?? null
}

/**
 * Junta os detalhes só quando a página tem privada do próprio autor. Quem
 * está na sessão é lido aqui: toda consulta que passa por esta função sai com
 * os detalhes, sem cada tela lembrar de mandar o id. Se a leitura dos detalhes
 * falhar, as linhas voltam mascaradas (e o log diz): salvar uma privada
 * mascarada não apaga o original, o gatilho mantém o campo igual à máscara.
 */
export async function juntarDetalhesPrivados<T extends LinhaComAutor>(
    supabase: SupabaseClient,
    linhas: T[],
): Promise<T[]> {
    if (!linhas.some((t) => t.is_private)) return linhas
    const meuId = await meuIdDaSessao(supabase)
    if (!meuId) return linhas
    const ids = linhas.filter((t) => t.is_private && t.user_id === meuId).map((t) => t.id)
    if (!ids.length) return linhas
    try {
        return comDetalhesPrivados(linhas, await buscarDetalhesPrivados(supabase, ids), meuId)
    } catch (e) {
        console.error("juntarDetalhesPrivados:", e)
        return linhas
    }
}

/**
 * O nome da linha: na privada de outra pessoa, "Gasto pessoal de {nome}"
 * (o nome vem do diretório de membros); senão, a descrição (vazia sem uma,
 * para o `||` de quem chama cair na categoria).
 */
export function rotuloDaTransacao(
    t: { is_private?: boolean | null; user_id: string; description: string | null },
    nomeDoAutor: string,
    meuId: string,
): string {
    if (t.is_private && t.user_id !== meuId) return `${MASCARA_PRIVADA} de ${nomeDoAutor}`
    return t.description ?? ""
}
