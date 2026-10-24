import { fetchAllRows } from "@/lib/queries/fetch-all-rows"
import { supabase } from "@/lib/supabase"
import { formatSupabasePostgrestError } from "@/lib/supabase-errors"

export const ROTULO_DA_ORIGEM: Record<string, string> = {
    quick_text: "Frase rápida",
    shortcut: "Atalho do iPhone",
    apple_pay: "Apple Pay",
    whatsapp: "WhatsApp",
    share: "Compartilhado",
    import_pdf: "Fatura em PDF",
    import_sheet: "Planilha",
    import_statement: "Extrato",
    recurring: "Assinatura ou parcela",
}

export type LinhaPiloto = {
    id: string
    description: string
    amount: number
    date: string
    created_at: string
    source: string
    import_batch_id: string | null
    needs_review: boolean
    category: { name: string } | null
}

export type ItemPiloto = {
    id: string
    descricao: string
    valor: number
    data: string
    criadoEm: string
    origem: string
    aConferir: boolean
    categoria: string | null
}

export type GrupoPiloto =
    | { tipo: "captura"; itens: ItemPiloto[] }
    | { tipo: "importacao"; loteId: string; origem: string; criadoEm: string; total: number; valor: number }
    | { tipo: "recorrente"; itens: ItemPiloto[] }

const rotulo = (source: string) => ROTULO_DA_ORIGEM[source] ?? source
const comparar = (x: string, y: string) => (x < y ? -1 : x > y ? 1 : 0)
const chave = (x: { id: string } | { loteId: string }) => ("id" in x ? x.id : x.loteId)
/** Mais novo primeiro; no mesmo `criadoEm`, pelo id, para a ordem não depender da chegada. */
const maisRecente = <T extends { criadoEm: string } & ({ id: string } | { loteId: string })>(a: T, b: T) =>
    comparar(b.criadoEm, a.criadoEm) || comparar(chave(a), chave(b))

export function agruparPiloto(linhas: LinhaPiloto[]): GrupoPiloto[] {
    const captura: ItemPiloto[] = []
    const recorrente: ItemPiloto[] = []
    const lotes = new Map<string, Extract<GrupoPiloto, { tipo: "importacao" }>>()

    for (const l of linhas) {
        if (l.import_batch_id && l.source.startsWith("import_")) {
            const g = lotes.get(l.import_batch_id)
            if (g) {
                g.total += 1
                g.valor += l.amount
                if (l.created_at > g.criadoEm) g.criadoEm = l.created_at
            } else {
                lotes.set(l.import_batch_id, {
                    tipo: "importacao",
                    loteId: l.import_batch_id,
                    origem: rotulo(l.source),
                    criadoEm: l.created_at,
                    total: 1,
                    valor: l.amount,
                })
            }
            continue
        }
        const item: ItemPiloto = {
            id: l.id,
            descricao: l.description,
            valor: l.amount,
            data: l.date,
            criadoEm: l.created_at,
            origem: rotulo(l.source),
            aConferir: l.needs_review,
            categoria: l.category?.name ?? null,
        }
        ;(l.source === "recurring" ? recorrente : captura).push(item)
    }

    const grupos: GrupoPiloto[] = []
    if (captura.length) grupos.push({ tipo: "captura", itens: captura.sort(maisRecente) })
    grupos.push(...[...lotes.values()].sort(maisRecente))
    if (recorrente.length) grupos.push({ tipo: "recorrente", itens: recorrente.sort(maisRecente) })
    return grupos
}

/** O que o app lançou sozinho desde `desde` (ISO): tudo que não veio da mão da pessoa. */
export function buscarPiloto(workspaceId: string, desde: string): Promise<LinhaPiloto[]> {
    return fetchAllRows<LinhaPiloto>((from, to) =>
        supabase
            .from("transactions")
            .select("id, description, amount, date, created_at, source, import_batch_id, needs_review, category:categories(name)")
            .eq("workspace_id", workspaceId)
            .neq("source", "app")
            .gte("created_at", desde)
            .order("created_at", { ascending: false })
            .order("id")
            .range(from, to)
            .overrideTypes<LinhaPiloto[], { merge: false }>(),
    )
}

export async function desfazerLancamento(workspaceId: string, id: string): Promise<{ ok: boolean; erro?: string }> {
    const { data, error } = await supabase
        .from("transactions")
        .delete()
        .eq("workspace_id", workspaceId)
        .eq("id", id)
        .select("id")
    if (error) {
        return { ok: false, erro: formatSupabasePostgrestError(error) ?? "Não foi possível apagar o lançamento." }
    }
    if (!data?.length) return { ok: false, erro: "O lançamento já não existe." }
    return { ok: true }
}

/** A pergunta antes de apagar uma importação: singular para 1 lançamento, plural nos demais. */
export function textoDesfazerImportacao(total: number): string {
    return total === 1 ? "Apagar o lançamento desta importação?" : `Apagar os ${total} lançamentos desta importação?`
}
