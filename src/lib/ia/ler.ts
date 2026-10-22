import { isEdgeInvokeTransportFailure } from "@/lib/edge-errors"
import { invokeEdgeJson } from "@/lib/edge-invoke"
import { supabase } from "@/lib/supabase"

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

type Lido<T> = ({ ok: true; provedor: string; modelo: string } & T) | { ok: false; mensagem: string }
type Resposta<T> = ({ ok: true; provedor: string; modelo: string } & T) | { ok: false; motivo: string }

const MENSAGEM: Record<string, string> = {
    cota: "Você usou a IA 30 vezes hoje. Amanhã volta.",
    sem_ia: "A IA não respondeu agora. Confira à mão.",
    fatura_grande: "Fatura grande demais para a IA. Use o CSV do banco.",
}
const SEM_CONEXAO = "Sem conexão com a IA."

function traduzir<T>(r: Resposta<T>): Lido<T> {
    return r.ok ? r : { ok: false, mensagem: MENSAGEM[r.motivo] ?? MENSAGEM.sem_ia }
}

async function pelaEdge<T>(body: Record<string, unknown>): Promise<Lido<T>> {
    try {
        return traduzir(await invokeEdgeJson<Resposta<T>>("ia-ler", { body }))
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
