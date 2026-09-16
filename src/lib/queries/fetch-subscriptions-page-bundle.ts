import {
    supabase,
    type Category,
    type CreditCard,
    type WorkspaceSubscription,
    type WorkspaceSubscriptionListRow,
} from "@/lib/supabase"
import { formatSupabasePostgrestError, isPostgrestRelationMissingError, throwIfQueryError } from "@/lib/supabase-errors"

const SUBSCRIPTION_LIST_SELECT = "*, category:categories(*)"

function normalizeSubRows(
    data: unknown,
    cats: Category[],
): WorkspaceSubscriptionListRow[] {
    const arr = (data ?? []) as Record<string, unknown>[]
    return arr.map((row) => {
        const base = row as unknown as WorkspaceSubscription
        const embCat = row.category as Category | null | undefined
        return {
            ...base,
            payment_method: base.payment_method ?? null,
            payment_credit_card_id: base.payment_credit_card_id ?? null,
            category:
                embCat ??
                (base.category_id
                    ? (cats.find((c) => c.id === base.category_id) ?? null)
                    : null),
        }
    })
}

export type SubscriptionsPageBundle = {
    rows: WorkspaceSubscriptionListRow[]
    categories: Category[]
    creditCards: CreditCard[]
    billingStats: Record<string, { count: number; lastDate: string }>
    tableMissing: boolean
}

type RpcSubscriptionsPayload = {
    categories?: unknown
    credit_cards?: unknown
    subscriptions?: unknown
    billing_stats?: Record<string, { count: number; lastDate: string }>
    table_missing?: boolean
}

async function fetchSubscriptionsPageBundleLegacy(
    workspaceId: string,
): Promise<SubscriptionsPageBundle> {
    let subsRes = await supabase
        .from("workspace_subscriptions")
        .select(SUBSCRIPTION_LIST_SELECT)
        .eq("workspace_id", workspaceId)
        .order("name")

    if (subsRes.error && isPostgrestRelationMissingError(subsRes.error)) {
        subsRes = await supabase
            .from("workspace_subscriptions")
            .select("amount, billing_anchor_day, billing_interval, category_id, created_at, currency, day_of_month, id, is_active, name, next_billing_date, notes, payment_credit_card_id, payment_method, start_date, updated_at, user_id, workspace_id")
            .eq("workspace_id", workspaceId)
            .order("name")
    }

    const [catRes, cardsRes, txSubRes] = await Promise.all([
        supabase
            .from("categories")
            .select("color, created_at, icon, id, name, type, updated_at, user_id, workspace_id")
            .eq("workspace_id", workspaceId)
            .order("name"),
        supabase
            .from("credit_cards")
            .select("brand, closing_day, created_at, credit_limit, due_day, expiry_month, expiry_year, id, is_active, last_four, name, updated_at, user_id, workspace_id")
            .eq("workspace_id", workspaceId)
            .order("name"),
        supabase
            .from("transactions")
            .select("subscription_id, date")
            .eq("workspace_id", workspaceId)
            .not("subscription_id", "is", null)
            .order("date", { ascending: false }),
    ])

    throwIfQueryError(catRes.error, "Não foi possível carregar as categorias.")
    const cats: Category[] = (catRes.data as Category[] | null) ?? []

    let creditCards: CreditCard[] = []
    if (cardsRes.error) {
        if (!isPostgrestRelationMissingError(cardsRes.error)) {
            throw new Error(
                formatSupabasePostgrestError(cardsRes.error) ??
                    "Não foi possível carregar os cartões.",
            )
        }
    } else {
        creditCards = (cardsRes.data as CreditCard[]) ?? []
    }

    let tableMissing = false
    let rows: WorkspaceSubscriptionListRow[] = []
    if (subsRes.error) {
        if (isPostgrestRelationMissingError(subsRes.error)) {
            tableMissing = true
            rows = []
        } else {
            throw new Error(
                formatSupabasePostgrestError(subsRes.error) ??
                    "Não foi possível carregar as assinaturas.",
            )
        }
    } else {
        rows = normalizeSubRows(subsRes.data, cats)
    }

    let billingStats: Record<string, { count: number; lastDate: string }> = {}
    throwIfQueryError(txSubRes.error, "Não foi possível carregar as cobranças das assinaturas.")
    if (txSubRes.data) {
        const m = new Map<string, { count: number; lastDate: string }>()
        for (const row of txSubRes.data as {
            subscription_id: string | null
            date: string
        }[]) {
            const sid = row.subscription_id
            if (!sid) continue
            const cur = m.get(sid)
            if (!cur) {
                m.set(sid, { count: 1, lastDate: row.date })
            } else {
                m.set(sid, {
                    count: cur.count + 1,
                    lastDate: cur.lastDate,
                })
            }
        }
        billingStats = Object.fromEntries(m)
    }

    return {
        rows,
        categories: cats,
        creditCards,
        billingStats,
        tableMissing,
    }
}

/**
 * Loads everything the subscriptions page needs in one round-trip (Postgres RPC).
 */
export async function fetchSubscriptionsPageBundle(
    workspaceId: string,
): Promise<SubscriptionsPageBundle> {
    const { data, error } = await supabase.rpc(
        "rpc_fetch_subscriptions_page_bundle",
        { p_workspace_id: workspaceId },
    )

    if (!error && data && typeof data === "object") {
        const d = data as RpcSubscriptionsPayload
        if (d.table_missing) {
            return {
                rows: [],
                categories: [],
                creditCards: [],
                billingStats: {},
                tableMissing: true,
            }
        }
        const cats = (d.categories as Category[]) ?? []
        const creditCards = (d.credit_cards as CreditCard[]) ?? []
        const billingStats = d.billing_stats ?? {}
        const rows = normalizeSubRows(d.subscriptions, cats)

        return {
            rows,
            categories: cats,
            creditCards,
            billingStats,
            tableMissing: false,
        }
    }

    if (error) {
        console.warn(
            "rpc_fetch_subscriptions_page_bundle failed, using legacy fetch:",
            error.message,
        )
    }

    return fetchSubscriptionsPageBundleLegacy(workspaceId)
}
