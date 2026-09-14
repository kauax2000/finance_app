/** Mensagens das edges que chegam em inglês até a tela. */
const EDGE_ERROR_PT: Record<string, string> = {
    "Invite not found": "Convite não encontrado. Peça um novo a quem convidou você.",
    "Invite is not pending": "Este convite já foi utilizado ou não está mais pendente.",
    "Invite expired": "Este convite expirou. Peça um novo a quem convidou você.",
    "Invite has expired": "Este convite expirou.",
    "Invite email does not match current user": "Este convite foi enviado para outro e-mail. Entre com a conta desse e-mail.",
    "Invite exhausted": "Este convite já atingiu o limite de usos.",
    "Only owner can invite": "Só quem é dono da carteira pode convidar.",
    "Only owner can resend invites": "Só quem é dono da carteira pode reenviar convites.",
    "Personal workspaces cannot be shared": "A carteira pessoal não pode ser compartilhada.",
    "Link invites cannot be resent by email": "Convite por link não é reenviado por e-mail.",
    "Not a member of this workspace": "Você não faz parte desta carteira.",
    "Invalid or expired token": "Sessão inválida ou expirada; faça login novamente.",
    "Session expired or invalidated": "Sessão encerrada; faça login novamente.",
    "Missing authorization header": "Sessão inválida ou expirada; faça login novamente.",
    "Too many invites": "Muitos convites enviados nas últimas 24 horas. Tente de novo mais tarde.",
    "Email send failed": "Não foi possível enviar o e-mail do convite. Tente de novo.",
}

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
        if (typeof parsed.error === 'string' && parsed.error) {
            return EDGE_ERROR_PT[parsed.error] ?? parsed.error
        }
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
