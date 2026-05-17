import { FunctionsHttpError } from '@supabase/functions-js'
import { supabase } from './supabase'
import { describeEdgeInvokeClientFailure, parseEdgeFunctionError } from './edge-errors'

/** Matches `SESSION_ID_KEY` in sessions.ts — avoid importing sessions here (circular). */
const APP_SESSION_ID_STORAGE_KEY = 'finance_app_session_id'

function getAppSessionIdHeader(): Record<string, string> {
    if (typeof window === 'undefined') return {}
    const id = localStorage.getItem(APP_SESSION_ID_STORAGE_KEY)?.trim()
    return id ? { 'x-app-session-id': id } : {}
}

async function ensureSessionForEdgeCall(): Promise<void> {
    const {
        data: { session },
    } = await supabase.auth.getSession()
    const nowSec = Math.floor(Date.now() / 1000)
    const accessExpired = session?.expires_at != null && session.expires_at <= nowSec

    if (!session?.access_token || accessExpired) {
        const { data, error } = await supabase.auth.refreshSession()
        if (error || !data.session?.access_token) {
            throw new Error('Sessão inválida ou expirada; faça login novamente.')
        }
    }
}

/**
 * Invokes a Supabase Edge Function using the client's authenticated fetch
 * (same apikey + Authorization path as PostgREST).
 */
export async function invokeEdgeJson<T>(
    path: string,
    options: {
        method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
        body?: Record<string, unknown>
    } = {}
): Promise<T> {
    await ensureSessionForEdgeCall()
    const method = options.method ?? 'POST'

    let { data, error, response } = await supabase.functions.invoke(path, {
        method,
        body: options.body,
        headers: getAppSessionIdHeader(),
    })

    // Retrying non-idempotent edge calls can create duplicate writes if the first request
    // actually reached the function but the client failed before receiving the response.
    // Keep a best-effort retry only for safe reads.
    if (method === 'GET' && error && !(error instanceof FunctionsHttpError)) {
        const second = await supabase.functions.invoke(path, {
            method,
            body: options.body,
            headers: getAppSessionIdHeader(),
        })
        data = second.data
        error = second.error
        response = second.response
    }

    if (error) {
        let responseText = ''
        let httpStatus: number | null = null
        if (error instanceof FunctionsHttpError && response) {
            httpStatus = response.status
            responseText = await response.text()
        }

        const fnName = path.split('?')[0]?.trim() || path
        const supabaseBase = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
        const isLikelyLocalSupabase =
            /\b127\.0\.0\.1\b/.test(supabaseBase) ||
            /\blocalhost\b/i.test(supabaseBase)

        if (httpStatus === 404) {
            throw new Error(
                isLikelyLocalSupabase
                    ? `Edge Function "${fnName}" não encontrada (404). Com Supabase local: mantenha \`supabase start\` a correr e noutro terminal \`supabase functions serve ${fnName}\` (ou \`supabase functions serve\`).`
                    : `Edge Function "${fnName}" não encontrada (404). Implante-a neste projeto (Supabase Dashboard → Edge Functions ou \`supabase functions deploy ${fnName}\`).`
            )
        }

        const fromResponse = responseText
            ? parseEdgeFunctionError(responseText, 'Edge function failed')
            : ''
        const transportHint = fromResponse || error.message || ''
        let message = responseText
            ? fromResponse
            : describeEdgeInvokeClientFailure(
                  transportHint ? new Error(transportHint) : error
              )

        if (
            isLikelyLocalSupabase &&
            /Não foi possível contactar as Edge Functions/i.test(message)
        ) {
            message += ` Desenvolvimento local: confirme \`supabase start\` e \`supabase functions serve\` (ex.: função "${fnName}").`
        }

        throw new Error(message)
    }

    return data as T
}
