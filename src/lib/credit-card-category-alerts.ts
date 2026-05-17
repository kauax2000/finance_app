import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js"

function wrapPostgrestError(err: PostgrestError): Error & { code?: string } {
    const e = new Error(err.message) as Error & { code?: string }
    e.code = err.code
    return e
}

/** Matches legacy localStorage payload + UI keys. */
export const UNCATEGORIZED_CATEGORY_KEY = "__none__" as const

export type CategorySpendAlert = {
    id: string
    categoryKey: string
    thresholdBrl: number
}

export type CreditCardCategorySpendAlertRow = {
    id: string
    workspace_id: string
    credit_card_id: string
    category_id: string | null
    threshold_brl: string | number
    created_by: string
    created_at: string
    updated_at: string
}

export function categoryIdToKey(categoryId: string | null): string {
    return categoryId ?? UNCATEGORIZED_CATEGORY_KEY
}

export function categoryKeyToId(categoryKey: string): string | null {
    return categoryKey === UNCATEGORIZED_CATEGORY_KEY ? null : categoryKey
}

export function rowToSpendAlert(row: CreditCardCategorySpendAlertRow): CategorySpendAlert {
    const threshold =
        typeof row.threshold_brl === "number"
            ? row.threshold_brl
            : Number.parseFloat(String(row.threshold_brl))
    return {
        id: row.id,
        categoryKey: categoryIdToKey(row.category_id),
        thresholdBrl: threshold,
    }
}

const TABLE = "credit_card_category_spend_alerts" as const

export async function fetchCreditCardCategorySpendAlerts(
    supabase: SupabaseClient,
    creditCardId: string
): Promise<{ data: CategorySpendAlert[]; error: Error | null }> {
    const { data, error } = await supabase
        .from(TABLE)
        .select(
            "id, workspace_id, credit_card_id, category_id, threshold_brl, created_by, created_at, updated_at"
        )
        .eq("credit_card_id", creditCardId)
        .order("created_at", { ascending: true })

    if (error) {
        return { data: [], error: wrapPostgrestError(error) }
    }
    const rows = (data ?? []) as CreditCardCategorySpendAlertRow[]
    return { data: rows.map(rowToSpendAlert), error: null }
}

export async function insertCreditCardCategorySpendAlert(
    supabase: SupabaseClient,
    params: {
        creditCardId: string
        categoryKey: string
        thresholdBrl: number
        createdBy: string
    }
): Promise<{ data: CategorySpendAlert | null; error: (Error & { code?: string }) | null }> {
    const category_id = categoryKeyToId(params.categoryKey)
    const { data, error } = await supabase
        .from(TABLE)
        .insert({
            credit_card_id: params.creditCardId,
            category_id,
            threshold_brl: params.thresholdBrl,
            created_by: params.createdBy,
        })
        .select(
            "id, workspace_id, credit_card_id, category_id, threshold_brl, created_by, created_at, updated_at"
        )
        .single()

    if (error) {
        return { data: null, error: wrapPostgrestError(error) }
    }
    return { data: rowToSpendAlert(data as CreditCardCategorySpendAlertRow), error: null }
}

export async function deleteCreditCardCategorySpendAlert(
    supabase: SupabaseClient,
    alertId: string
): Promise<{ error: Error | null }> {
    const { error } = await supabase.from(TABLE).delete().eq("id", alertId)

    if (error) {
        return { error: wrapPostgrestError(error) }
    }
    return { error: null }
}

/** Legacy localStorage key (v1). */
export const LEGACY_CC_CAT_ALERT_STORAGE_PREFIX = "finance-cc-cat-alert-v1"

export function legacyLocalStorageKey(workspaceId: string, cardId: string) {
    return `${LEGACY_CC_CAT_ALERT_STORAGE_PREFIX}:${workspaceId}:${cardId}`
}

export type LegacyCategorySpendAlert = {
    categoryKey: string
    thresholdBrl: number
}

export function parseLegacyLocalAlerts(raw: string | null): LegacyCategorySpendAlert[] {
    if (!raw) return []
    try {
        const p = JSON.parse(raw) as unknown
        if (!Array.isArray(p)) return []
        return p
            .map((x) => x as LegacyCategorySpendAlert)
            .filter(
                (x) =>
                    typeof x?.categoryKey === "string" &&
                    typeof x?.thresholdBrl === "number"
            )
    } catch {
        return []
    }
}

/**
 * If the server has no alerts yet, push legacy localStorage rules once and clear the key.
 */
export async function migrateLegacyLocalStorageAlertsIfEmpty(options: {
    supabase: SupabaseClient
    workspaceId: string
    creditCardId: string
    userId: string
    serverAlerts: CategorySpendAlert[]
}): Promise<void> {
    if (typeof window === "undefined") return
    if (options.serverAlerts.length > 0) return

    const key = legacyLocalStorageKey(options.workspaceId, options.creditCardId)
    const legacy = parseLegacyLocalAlerts(localStorage.getItem(key))
    if (legacy.length === 0) return

    let anyInserted = false
    for (const a of legacy) {
        if (a.thresholdBrl <= 0) continue
        const { error } = await insertCreditCardCategorySpendAlert(options.supabase, {
            creditCardId: options.creditCardId,
            categoryKey: a.categoryKey,
            thresholdBrl: a.thresholdBrl,
            createdBy: options.userId,
        })
        if (!error) {
            anyInserted = true
        }
    }

    if (anyInserted) {
        try {
            localStorage.removeItem(key)
        } catch {
            /* ignore */
        }
    }
}
