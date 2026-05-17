/** Parses Edge Function handler JSON or Supabase gateway errors (e.g. Invalid JWT). */
export function parseEdgeFunctionError(responseText: string, fallback: string): string {
    try {
        const parsed = JSON.parse(responseText) as {
            error?: string
            message?: string
            code?: number
        }
        if (parsed.code === 401 || parsed.message === 'Invalid JWT') {
            return 'Sessão inválida ou expirada; faça login novamente.'
        }
        if (typeof parsed.error === 'string' && parsed.error) return parsed.error
        if (typeof parsed.message === 'string' && parsed.message) return parsed.message
    } catch {
        /* non-JSON body */
    }
    const trimmed = responseText.trim()
    return trimmed ? `${fallback} (${trimmed.slice(0, 200)})` : fallback
}

function flattenErrorMessages(err: unknown, maxDepth = 5): string {
    const parts: string[] = []
    let cur: unknown = err
    let depth = 0
    while (cur != null && depth < maxDepth) {
        if (cur instanceof Error) {
            if (cur.message) parts.push(cur.message)
            cur = cur.cause
        } else if (typeof cur === "object" && cur !== null && "message" in cur) {
            const m = (cur as { message?: unknown }).message
            if (typeof m === "string" && m) parts.push(m)
            break
        } else {
            parts.push(String(cur))
            break
        }
        depth++
    }
    return parts.filter(Boolean).join(": ") || String(err ?? "")
}

/** True when the client could not complete an Edge Function call (network, not served, wrong project URL). */
export function isEdgeInvokeTransportFailure(err: unknown): boolean {
    const raw = err instanceof Error ? err.message : String(err ?? "")
    return (
        /Não foi possível contactar as Edge Functions/i.test(raw) ||
        /Não foi possível ligar ao Supabase/i.test(raw) ||
        /failed to fetch/i.test(raw) ||
        /failed to send/i.test(raw)
    )
}

/** When the Supabase client cannot reach Edge Functions (offline, wrong URL, or not deployed). */
export function describeEdgeInvokeClientFailure(err: unknown): string {
    const raw = flattenErrorMessages(err).trim() || String(err ?? "")

    if (/failed to fetch/i.test(raw) || /networkerror/i.test(raw) || /load failed/i.test(raw)) {
        return "Não foi possível ligar ao Supabase (rede, CORS, URL em .env ou bloqueio do browser). Verifique NEXT_PUBLIC_SUPABASE_URL e a ligação."
    }
    if (/failed to send/i.test(raw) || /edge function/i.test(raw)) {
        return "Não foi possível contactar as Edge Functions. Confirme que as funções estão implantadas no Supabase e que não há bloqueio de rede."
    }
    if (/invalid or expired token/i.test(raw)) {
        return "Sessão inválida ou expirada. Saia da conta e entre de novo (confirme também que o .env aponta para o mesmo Supabase onde fez o deploy)."
    }
    return raw || "Erro ao contactar o servidor."
}
