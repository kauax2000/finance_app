import type { SupabaseClient } from "@supabase/supabase-js"

import type { Attachment } from "@/lib/supabase"

/**
 * Anexos privados (Bloco 2): a nota ou o recibo do lançamento, o boleto da conta
 * a pagar e o PDF da fatura do banco. O objeto mora no bucket privado
 * `attachments`, em `<workspace_id>/<uuid>.<ext>`, e a linha em
 * `public.attachments`. A cota por carteira é conferida aqui antes de enviar, e
 * o trigger `attachments_enforce_quota` é a guarda de verdade.
 */

export const BUCKET_ANEXOS = "attachments"
const LIMITE_ARQUIVO = 10485760
const COTA_CARTEIRA = 26214400
const URL_ASSINADA_SEGUNDOS = 3600

const EXTENSAO: Record<string, string> = {
    "image/webp": "webp",
    "image/jpeg": "jpg",
    "image/png": "png",
    "application/pdf": "pdf",
}

const ERRO_TIPO = "Tipo não aceito: use foto ou PDF."
const ERRO_TAMANHO = "Arquivo acima de 10 MB."
const ERRO_COTA = "Sem espaço: os anexos desta carteira passaram de 25 MB."

export type VinculoAnexo = { transactionId?: string; billInstanceId?: string; statementTotalId?: string }

type Resultado = { ok: true } | { ok: false; erro: string }

/** Uma imagem chega aqui já comprimida: o tamanho que conta é o do WebP. */
export function validarArquivo(arquivo: { type: string; size: number }, usadoBytes: number): Resultado {
    if (!(arquivo.type in EXTENSAO)) return { ok: false, erro: ERRO_TIPO }
    if (arquivo.size > LIMITE_ARQUIVO) return { ok: false, erro: ERRO_TAMANHO }
    if (usadoBytes + arquivo.size > COTA_CARTEIRA) return { ok: false, erro: ERRO_COTA }
    return { ok: true }
}

/** O lado maior vai a `max`, sem ampliar o que já é menor. */
export function dimensoesAlvo(largura: number, altura: number, max = 1600): { largura: number; altura: number } {
    const lado = Math.max(largura, altura)
    if (lado <= max) return { largura, altura }
    const fator = max / lado
    return { largura: Math.round(largura * fator), altura: Math.round(altura * fator) }
}

/**
 * A foto vira WebP com o lado maior em 1600 px e qualidade 0,8. O navegador que
 * não codifica WebP no canvas devolve PNG; `validarArquivo` confere o tipo que
 * de fato saiu.
 */
export async function comprimirImagem(arquivo: File): Promise<Blob> {
    const bitmap = await createImageBitmap(arquivo)
    const { largura, altura } = dimensoesAlvo(bitmap.width, bitmap.height)
    const canvas = document.createElement("canvas")
    canvas.width = largura
    canvas.height = altura
    const ctx = canvas.getContext("2d")
    if (!ctx) {
        bitmap.close()
        throw new Error("canvas 2d indisponível")
    }
    ctx.drawImage(bitmap, 0, 0, largura, altura)
    bitmap.close()
    return new Promise((resolve, reject) =>
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob vazio"))), "image/webp", 0.8),
    )
}

function colunasDoVinculo(v: VinculoAnexo) {
    return {
        transaction_id: v.transactionId ?? null,
        bill_instance_id: v.billInstanceId ?? null,
        statement_total_id: v.statementTotalId ?? null,
    }
}

async function bytesUsados(supabase: SupabaseClient, workspaceId: string): Promise<number> {
    const { data } = await supabase.from("attachments").select("size_bytes").eq("workspace_id", workspaceId)
    // Sem a soma, segue com 0: o trigger da cota recusa do mesmo jeito.
    return (data ?? []).reduce((s: number, r: { size_bytes: number }) => s + r.size_bytes, 0)
}

export async function enviarAnexo(
    supabase: SupabaseClient,
    ctx: { workspaceId: string },
    arquivo: File,
    vinculo: VinculoAnexo,
): Promise<{ ok: true; id: string } | { ok: false; erro: string }> {
    let blob: Blob = arquivo
    if (arquivo.type.startsWith("image/")) {
        try {
            blob = await comprimirImagem(arquivo)
        } catch {
            // HEIC ou imagem que o navegador não decodifica.
            return { ok: false, erro: ERRO_TIPO }
        }
    }

    const valido = validarArquivo(blob, await bytesUsados(supabase, ctx.workspaceId))
    if (!valido.ok) return valido

    const path = `${ctx.workspaceId}/${crypto.randomUUID()}.${EXTENSAO[blob.type]}`
    const storage = supabase.storage.from(BUCKET_ANEXOS)
    const { error: erroUpload } = await storage.upload(path, blob, { contentType: blob.type })
    if (erroUpload) return { ok: false, erro: `Não foi possível enviar: ${erroUpload.message}` }

    const { data, error } = await supabase
        .from("attachments")
        .insert({
            workspace_id: ctx.workspaceId,
            path,
            mime: blob.type,
            size_bytes: blob.size,
            ...colunasDoVinculo(vinculo),
        })
        .select("id")
        .single()
    if (error) {
        // Sem linha, o objeto não fica: nada órfão (Foco 5).
        await storage.remove([path])
        return {
            ok: false,
            erro: error.message.includes("cota_anexos_excedida")
                ? ERRO_COTA
                : `Não foi possível guardar o anexo: ${error.message}`,
        }
    }
    return { ok: true, id: (data as { id: string }).id }
}

export async function listarAnexos(supabase: SupabaseClient, vinculo: VinculoAnexo): Promise<Attachment[]> {
    const [coluna, id] = Object.entries(colunasDoVinculo(vinculo)).find(([, v]) => v != null) ?? []
    if (!coluna || !id) return []
    const { data, error } = await supabase
        .from("attachments")
        .select("*")
        .eq(coluna, id)
        .order("created_at", { ascending: true })
    if (error) throw new Error(error.message)
    return (data ?? []) as Attachment[]
}

export async function urlAssinada(supabase: SupabaseClient, path: string): Promise<string | null> {
    const { data } = await supabase.storage.from(BUCKET_ANEXOS).createSignedUrl(path, URL_ASSINADA_SEGUNDOS)
    return data?.signedUrl ?? null
}

/** O objeto sai primeiro; se ele falhar, a linha fica para tentar de novo. */
export async function apagarAnexo(supabase: SupabaseClient, anexo: Pick<Attachment, "id" | "path">): Promise<Resultado> {
    const { error: erroObjeto } = await supabase.storage.from(BUCKET_ANEXOS).remove([anexo.path])
    if (erroObjeto) return { ok: false, erro: `Não foi possível apagar: ${erroObjeto.message}` }
    const { error } = await supabase.from("attachments").delete().eq("id", anexo.id)
    if (error) return { ok: false, erro: `Não foi possível apagar: ${error.message}` }
    return { ok: true }
}

/**
 * Antes de excluir o lançamento, remove os objetos dele (a linha sai pelo
 * cascade). Não barra a exclusão: o que falhar aqui a limpeza semanal pega.
 */
export async function removerObjetosDaTransacao(supabase: SupabaseClient, transactionId: string): Promise<void> {
    try {
        const anexos = await listarAnexos(supabase, { transactionId })
        if (anexos.length > 0) await supabase.storage.from(BUCKET_ANEXOS).remove(anexos.map((a) => a.path))
    } catch {
        // ponytail: o órfão fica para o cron `attachments-cleanup-weekly`.
    }
}
