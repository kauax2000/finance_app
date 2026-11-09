import type { SupabaseClient } from "@supabase/supabase-js"
import { ajustarAoCiclo, type CicloFatura } from "@/lib/fatura/ciclo"
import type { Correcao, DecisaoSoNoApp } from "@/lib/fatura/correcoes"
import { desfazerImportacao, importarLancamentos, type SourceImportacao } from "@/lib/import/importar"
import { formatSupabasePostgrestError } from "@/lib/supabase-errors"

export type ContextoDeCorrecao = {
    userId: string
    workspaceId: string
    cardId: string
    ciclo: CicloFatura
    source: SourceImportacao
    batchId: string
}
export type LoteAplicado = {
    workspaceId: string
    batchId: string | null
    antes: Array<{
        id: string
        date: string
        description: string | null
        amount: number
        installment_sequence: number | null
        payment_method: string | null
        payment_credit_card_id: string | null
    }>
    apagados: Array<Record<string, unknown>>
    anexosApagados: Array<Record<string, unknown>> // o delete do lançamento leva os anexos em cascata
    assinaturas: Array<{ id: string; amount: number }>
}

const COLUNAS = "id, date, description, amount, installment_sequence, payment_method, payment_credit_card_id"
const msg = (e: unknown, padrao: string) => formatSupabasePostgrestError(e as never) ?? padrao

export async function aplicarCorrecoes(
    db: SupabaseClient,
    ctx: ContextoDeCorrecao,
    correcoes: Correcao[],
    decisoes: ReadonlyMap<string, DecisaoSoNoApp>,
): Promise<{ ok: true; lote: LoteAplicado; aplicadas: number } | { ok: false; erro: string; desfeito: boolean }> {
    const lote: LoteAplicado = { workspaceId: ctx.workspaceId, batchId: null, antes: [], apagados: [], anexosApagados: [], assinaturas: [] }
    const falhar = async (erro: string) => {
        const d = await desfazerCorrecoes(db, lote)
        return {
            ok: false as const,
            erro: d.ok ? erro : `${erro} Além disso, não foi possível desfazer: ${d.erro}`,
            desfeito: d.ok,
        }
    }

    const patches = new Map<string, Record<string, unknown>>()
    const patch = (id: string, p: Record<string, unknown>) => patches.set(id, { ...patches.get(id), ...p })
    const assinaturas = new Map<string, number>()
    const criar = []
    for (const c of correcoes) {
        if (c.motivo === "fora-do-periodo") patch(c.appId, { date: `${c.para}T12:00:00Z`, description: c.novaDescricao })
        else if (c.motivo === "valor-diferente") {
            patch(c.appId, { amount: c.para })
            if (c.assinaturaId) assinaturas.set(c.assinaturaId, c.para)
        } else if (c.motivo === "parcela") patch(c.appId, { installment_sequence: c.para })
        else criar.push(c.item)
    }
    const apagar: string[] = []
    let decisoesAplicadas = 0
    for (const [id, d] of decisoes) {
        if (d === "manter") continue
        decisoesAplicadas++
        if (d === "apagar") apagar.push(id)
        else patch(id, { payment_method: d.forma, payment_credit_card_id: null })
    }

    // 1. ler antes de escrever
    const ids = [...patches.keys()]
    if (ids.length) {
        const { data, error } = await db.from("transactions").select(COLUNAS).eq("workspace_id", ctx.workspaceId).in("id", ids)
        if (error) return falhar(msg(error, "Não foi possível ler os lançamentos."))
        lote.antes = (data ?? []) as LoteAplicado["antes"]
    }
    let apagados: Array<Record<string, unknown>> = []
    let anexos: Array<Record<string, unknown>> = []
    if (apagar.length) {
        const { data, error } = await db.from("transactions").select("*").eq("workspace_id", ctx.workspaceId).in("id", apagar)
        if (error) return falhar(msg(error, "Não foi possível ler os lançamentos."))
        apagados = (data ?? []) as typeof apagados
        const an = await db.from("attachments").select("*").eq("workspace_id", ctx.workspaceId).in("transaction_id", apagar)
        if (an.error) return falhar(msg(an.error, "Não foi possível ler os anexos."))
        anexos = (an.data ?? []) as typeof anexos
    }
    if (assinaturas.size) {
        const { data, error } = await db.from("workspace_subscriptions").select("id, amount").eq("workspace_id", ctx.workspaceId).in("id", [...assinaturas.keys()])
        if (error) return falhar(msg(error, "Não foi possível ler as assinaturas."))
        lote.assinaturas = (data ?? []) as LoteAplicado["assinaturas"]
    }

    // 2. um update por lançamento
    for (const [id, p] of patches) {
        const { error } = await db.from("transactions").update(p).eq("id", id).eq("workspace_id", ctx.workspaceId)
        if (error) return falhar(msg(error, "Não foi possível corrigir os lançamentos."))
    }
    // 3. assinaturas
    for (const [id, amount] of assinaturas) {
        const { error } = await db.from("workspace_subscriptions").update({ amount }).eq("id", id).eq("workspace_id", ctx.workspaceId)
        if (error) return falhar(msg(error, "Não foi possível corrigir as assinaturas."))
    }
    // 4. apagar
    if (apagar.length) {
        const { error } = await db.from("transactions").delete().eq("workspace_id", ctx.workspaceId).in("id", apagar)
        if (error) return falhar(msg(error, "Não foi possível apagar os lançamentos."))
        lote.apagados = apagados
        lote.anexosApagados = anexos
    }
    // 5. criar
    if (criar.length) {
        lote.batchId = ctx.batchId // antes: a falha pode ter inserido parte
        const r = await importarLancamentos(db, ctx, ajustarAoCiclo(criar, ctx.ciclo), { tipo: "cartao", cardId: ctx.cardId }, ctx.source, ctx.batchId)
        if (!r.ok) return falhar(r.erro)
    }
    return { ok: true, lote, aplicadas: correcoes.length + decisoesAplicadas }
}

/** Melhor esforço: tenta cada devolução e junta os erros. */
export async function desfazerCorrecoes(db: SupabaseClient, lote: LoteAplicado): Promise<{ ok: true } | { ok: false; erro: string }> {
    const w = lote.workspaceId
    const erros: string[] = []
    const tentar = (erro: unknown, padrao: string) => {
        if (erro) erros.push(msg(erro, padrao))
    }
    if (lote.batchId) {
        const r = await desfazerImportacao(db, w, lote.batchId)
        if (!r.ok) erros.push(r.erro ?? "Não foi possível desfazer.")
    }
    for (const { id, ...resto } of lote.antes) {
        tentar((await db.from("transactions").update(resto).eq("id", id).eq("workspace_id", w)).error, "Não foi possível desfazer.")
    }
    if (lote.apagados.length) {
        tentar((await db.from("transactions").insert(lote.apagados)).error, "Não foi possível devolver os lançamentos.")
        if (lote.anexosApagados.length) {
            tentar((await db.from("attachments").insert(lote.anexosApagados)).error, "Não foi possível devolver os anexos.")
        }
    }
    for (const { id, amount } of lote.assinaturas) {
        tentar((await db.from("workspace_subscriptions").update({ amount }).eq("id", id).eq("workspace_id", w)).error, "Não foi possível desfazer.")
    }
    return erros.length ? { ok: false, erro: erros.join(" ") } : { ok: true }
}
