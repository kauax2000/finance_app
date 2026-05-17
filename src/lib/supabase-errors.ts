/**
 * Normalizes PostgREST / Supabase client errors for UI and logging.
 * Some failures surface as truthy objects that stringify as `{}` in the DevTools console.
 */
export function formatSupabasePostgrestError(error: unknown): string | null {
    if (error == null) return null
    if (typeof error === "string") return error.trim() || null
    if (typeof error !== "object") return String(error)

    const e = error as {
        message?: string
        code?: string
        details?: string
        hint?: string
    }

    const semantic = [e.message, e.details, e.hint]
        .filter((s): s is string => typeof s === "string" && s.trim().length > 0)
        .join(" · ")

    if (semantic) {
        return e.code && String(e.code).trim() ? `${semantic} (${e.code})` : semantic
    }

    if (e.code && String(e.code).trim()) return String(e.code)

    const keys = Object.keys(error as object)
    if (keys.length > 0) {
        try {
            return JSON.stringify(error)
        } catch {
            return "Erro do servidor (resposta não serializável)."
        }
    }

    return "Falha ao comunicar com o Supabase (rede, URL ou configuração). Confirme NEXT_PUBLIC_SUPABASE_URL, a chave anon e a ligação à internet."
}

/**
 * PostgREST PGRST205: relation not in schema cache (table missing, not exposed, or cache stale after migration).
 */
export function isPostgrestRelationMissingError(error: unknown): boolean {
    if (error == null || typeof error !== "object") return false
    const e = error as { code?: string; message?: string }
    if (e.code === "PGRST205") return true
    const msg = (e.message ?? "").toLowerCase()
    return (
        msg.includes("schema cache") &&
        (msg.includes("could not find") || msg.includes("not find"))
    )
}

/**
 * PostgREST PGRST202: RPC not in schema cache (function not deployed, wrong overload, or cache stale).
 * Message often also mentions "schema cache" — do not treat as missing table/column.
 */
export function isPostgrestRpcFunctionNotFoundError(error: unknown): boolean {
    if (error == null || typeof error !== "object") return false
    const e = error as { code?: string; message?: string }
    if (e.code === "PGRST202") return true
    const msg = (e.message ?? "").toLowerCase()
    return (
        msg.includes("could not find the function") ||
        (msg.includes("function") && msg.includes("no matches were found"))
    )
}

/**
 * PostgREST schema cache stale or object unknown to API (common right after `db push`).
 * PGRST205 = table/relation; PGRST204 = column.
 * PGRST202 (RPC) is excluded — use `isPostgrestRpcFunctionNotFoundError`.
 */
export function isPostgrestSchemaCacheError(error: unknown): boolean {
    if (error == null || typeof error !== "object") return false
    const e = error as { code?: string; message?: string }
    if (e.code === "PGRST202") return false
    if (e.code === "PGRST205" || e.code === "PGRST204") return true
    return isPostgrestRelationMissingError(error)
}

/**
 * PGRST205 when PostgREST does not know `public.workspace_installment_plans`
 * (migration not applied on this project or API schema cache stale).
 */
export function isWorkspaceInstallmentPlansTableMissingError(
    error: unknown
): boolean {
    if (error == null || typeof error !== "object") return false
    const e = error as { code?: string; message?: string }
    if (e.code !== "PGRST205") return false
    const m = (e.message ?? "").toLowerCase()
    return m.includes("workspace_installment_plans")
}

/**
 * PostgREST when `transactions.payment_method` / `payment_credit_card_id` are not in the schema cache (migration not applied or not reloaded).
 */
export function isTransactionsPaymentColumnsUnsupportedError(
    error: unknown
): boolean {
    if (error == null || typeof error !== "object") return false
    const e = error as { code?: string; message?: string; details?: string }
    const blob = [e.message, e.details, e.code]
        .filter((x): x is string => typeof x === "string")
        .join(" ")
        .toLowerCase()
    if (
        blob.includes("payment_method") ||
        blob.includes("payment_credit_card")
    ) {
        return (
            blob.includes("schema cache") ||
            blob.includes("could not find") ||
            blob.includes("column") ||
            e.code === "PGRST204"
        )
    }
    return false
}

/**
 * Postgres undefined_column (42703) or PostgREST PGRST204 when `transactions.subscription_id`
 * / `installment_plan_id` are missing (migrations not applied). Enables a narrower select retry.
 */
export function isTransactionsSubscriptionBillingColumnsMissingError(
    error: unknown
): boolean {
    if (error == null || typeof error !== "object") return false
    const e = error as { code?: string; message?: string; details?: string }
    if (e.code === "42703") return true
    const blob = [e.message, e.details]
        .filter((x): x is string => typeof x === "string")
        .join(" ")
    const lower = blob.toLowerCase()
    if (e.code === "PGRST204") {
        return lower.includes("subscription_id") || lower.includes("installment_plan_id")
    }
    return (
        lower.includes("does not exist") &&
        lower.includes("column") &&
        (lower.includes("subscription_id") || lower.includes("installment_plan_id"))
    )
}

/**
 * PostgREST PGRST200: embed on `transactions.subscription_id` → `workspace_subscriptions`
 * when the FK is missing from the schema cache (migration not applied or PostgREST not reloaded).
 */
/**
 * PostgREST PGRST200: embed on `transactions.installment_plan_id` → `workspace_installment_plans`
 * when the FK relationship is missing from the schema cache.
 */
export function isTransactionsInstallmentPlanEmbedUnsupportedError(
    error: unknown
): boolean {
    if (error == null || typeof error !== "object") return false
    const e = error as { code?: string; message?: string; details?: string }
    if (e.code !== "PGRST200") return false
    const blob = [e.message, e.details]
        .filter((x): x is string => typeof x === "string")
        .join(" ")
        .toLowerCase()
    return (
        blob.includes("workspace_installment_plans") ||
        (blob.includes("installment_plan_id") &&
            blob.includes("relationship"))
    )
}

export function isTransactionsSubscriptionEmbedUnsupportedError(
    error: unknown
): boolean {
    if (error == null || typeof error !== "object") return false
    const e = error as { code?: string; message?: string; details?: string }
    if (e.code !== "PGRST200") return false
    const blob = [e.message, e.details]
        .filter((x): x is string => typeof x === "string")
        .join(" ")
        .toLowerCase()
    return (
        blob.includes("workspace_subscriptions") ||
        (blob.includes("subscription_id") &&
            blob.includes("relationship"))
    )
}

/**
 * Maps common Supabase Auth (GoTrue) English messages to Portuguese for login/OAuth UI.
 * Unknown messages are returned unchanged (may already be localized).
 */
export function formatAuthErrorMessagePt(raw: string): string {
    const s = raw.trim()
    if (!s) {
        return "Não foi possível entrar. Tente novamente."
    }
    const lower = s.toLowerCase()

    if (
        lower.includes("invalid login credentials") ||
        lower.includes("invalid email or password") ||
        lower === "invalid credentials"
    ) {
        return "Email ou senha incorretos."
    }

    if (lower.includes("email not confirmed")) {
        return "Confirme seu email antes de entrar."
    }

    if (
        lower.includes("user not found") ||
        lower.includes("user does not exist")
    ) {
        return "Não encontramos uma conta com estes dados."
    }

    if (lower.includes("email rate limit") || lower.includes("too many requests")) {
        return "Muitas tentativas. Aguarde um momento e tente novamente."
    }

    if (
        lower.includes("for security purposes") &&
        lower.includes("once every")
    ) {
        return "Por segurança, aguarde antes de tentar novamente."
    }

    if (lower.includes("signup") && lower.includes("not allowed")) {
        return "Novos cadastros não estão permitidos no momento."
    }

    if (
        lower.includes("failed to fetch") ||
        lower.includes("network request failed") ||
        lower === "networkerror" ||
        lower.includes("load failed")
    ) {
        return "Falha de conexão. Verifique sua internet e tente novamente."
    }

    if (lower.includes("invalid refresh token") || lower.includes("session expired")) {
        return "Sessão expirada. Entre novamente."
    }

    if (lower.includes("invalid") && lower.includes("oauth")) {
        return "Não foi possível conectar com o provedor. Tente de novo."
    }

    if (lower.includes("provider") && lower.includes("not enabled")) {
        return "Este método de login não está disponível."
    }

    return s
}
