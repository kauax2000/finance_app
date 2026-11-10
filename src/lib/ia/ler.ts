import { isEdgeInvokeTransportFailure } from "@/lib/edge-errors"
import { invokeEdgeJson } from "@/lib/edge-invoke"
import { supabase } from "@/lib/supabase"
import { marcarCotaEsgotada } from "@/lib/ia/cota-esgotada"

/** O que a Edge `ia-ler` devolve; espelha `CamposIA` e `ItemFaturaIA` de `supabase/functions/_shared/ia.ts`. */
export type CamposIA = {
    valor: number | null
    data: string | null
    descricao: string | null
    tipo: "expense" | "income" | null
    parcelas: number | null
    forma: "pix" | "debit" | "credit_card" | "cash" | null
    cartao: string | null
}
export type ItemFaturaIA = {
    data: string
    descricao: string
    valor: number
    estorno: boolean
    parcela: { k: number; n: number } | null
}

/** Espelham `ItemParaAlinhar` e `ParAlinhado` de `supabase/functions/_shared/ia.ts`. */
export type ItemParaAlinhar = { i: number; data: string; descricao: string; valor: number; estorno: boolean }
export type ParAlinhado = { banco: number; app: number }

/** Espelham `ItemParaCategorizar`, `CategoriasPorTipo` e `Sugestao` de `supabase/functions/_shared/ia.ts`. */
export type ItemParaCategorizar = { i: number; descricao: string; tipo: "expense" | "income" }
export type CategoriasPorTipo = { expense: string[]; income: string[] }
export type Sugestao = { i: number; categoria: string }

/** `esgotada`: a cota do dia acabou (e ficou marcada neste aparelho). */
export type Lido<T> = ({ ok: true; provedor: string; modelo: string } & T) | { ok: false; mensagem: string; esgotada?: true }
type Resposta<T> = ({ ok: true; provedor: string; modelo: string } & T) | { ok: false; motivo: string }

const MENSAGEM: Record<string, string> = {
    cota: "Você usou a IA 30 vezes hoje. Amanhã volta.",
    sem_ia: "A IA não respondeu agora. Confira à mão.",
    fatura_grande: "Fatura grande demais para a IA. Use o CSV do banco.",
}
const SEM_CONEXAO = "Sem conexão com a IA."

function traduzir<T>(r: Resposta<T>, mensagens: Record<string, string> = MENSAGEM): Lido<T> {
    if (r.ok) return r
    if (r.motivo === "cota") {
        marcarCotaEsgotada()
        return { ok: false, mensagem: MENSAGEM.cota, esgotada: true }
    }
    return { ok: false, mensagem: mensagens[r.motivo] ?? MENSAGEM.sem_ia }
}

async function pelaEdge<T>(body: Record<string, unknown>, mensagens?: Record<string, string>): Promise<Lido<T>> {
    try {
        return traduzir(await invokeEdgeJson<Resposta<T>>("ia-ler", { body }), mensagens)
    } catch (e) {
        const mensagem = isEdgeInvokeTransportFailure(e) || !(e instanceof Error) || !e.message ? SEM_CONEXAO : e.message
        return { ok: false, mensagem }
    }
}

export function lerFraseComIA(workspaceId: string, texto: string) {
    return pelaEdge<{ campos: CamposIA }>({ op: "frase", workspaceId, texto })
}

export function lerFaturaComIA(workspaceId: string, texto: string, fechamento: string) {
    return pelaEdge<{ itens: ItemFaturaIA[] }>({ op: "fatura", workspaceId, texto, fechamento })
}

export function alinharFaturaComIA(workspaceId: string, banco: ItemParaAlinhar[], app: ItemParaAlinhar[]) {
    // Aqui "fatura_grande" é sobra demais dos dois lados: o CSV não ajudaria.
    return pelaEdge<{ pares: ParAlinhado[] }>(
        { op: "alinhar", workspaceId, banco, app },
        { ...MENSAGEM, fatura_grande: "Muitas diferenças para a IA alinhar. Confira à mão." },
    )
}

export function categorizarComIA(workspaceId: string, itens: ItemParaCategorizar[], categorias: CategoriasPorTipo) {
    return pelaEdge<{ sugestoes: Sugestao[] }>(
        { op: "categorizar", workspaceId, itens, categorias },
        { ...MENSAGEM, grande: "Muitas linhas para a IA. Categorize o resto à mão." },
    )
}

/** A foto vai em multipart (o `invokeEdgeJson` só manda JSON), com o token da sessão. */
export async function lerImagemComIA(workspaceId: string, arquivo: File): Promise<Lido<{ campos: CamposIA }>> {
    const {
        data: { session },
    } = await supabase.auth.getSession()
    // O mesmo texto do `invokeEdgeJson`, que a frase e a fatura recebem.
    if (!session?.access_token) return { ok: false, mensagem: "Sessão inválida ou expirada; faça login novamente." }

    const form = new FormData()
    form.set("op", "imagem")
    form.set("workspaceId", workspaceId)
    form.set("file", arquivo)

    let res: Response
    try {
        res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "")}/functions/v1/ia-ler`, {
            method: "POST",
            headers: { Authorization: `Bearer ${session.access_token}`, apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "" },
            body: form,
        })
    } catch {
        return { ok: false, mensagem: SEM_CONEXAO }
    }
    const corpo = (await res.json().catch(() => null)) as (Resposta<{ campos: CamposIA }> & { error?: unknown }) | null
    if (!res.ok || !corpo) {
        return { ok: false, mensagem: typeof corpo?.error === "string" && corpo.error ? corpo.error : MENSAGEM.sem_ia }
    }
    return traduzir(corpo)
}
