import { createClient } from '@supabase/supabase-js'

/** Same placeholders as `.github/workflows/ci.yml` — build/SSG only. */
const BUILD_PLACEHOLDER_SUPABASE_URL = 'https://placeholder.supabase.co'
const BUILD_PLACEHOLDER_SUPABASE_ANON_KEY =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder'

function resolveSupabaseEnv(): { url: string; anonKey: string } {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()

    if (url && anonKey) {
        return { url, anonKey }
    }

    // `next build` prerenders app routes; allow CI/Vercel builds before env is configured.
    if (process.env.NEXT_PHASE === 'phase-production-build') {
        return {
            url: BUILD_PLACEHOLDER_SUPABASE_URL,
            anonKey: BUILD_PLACEHOLDER_SUPABASE_ANON_KEY,
        }
    }

    throw new Error(
        'Missing Supabase environment variables. Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in your .env.local file.'
    )
}

const { url: supabaseUrl, anonKey: supabaseAnonKey } = resolveSupabaseEnv()

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for the database
export interface Profile {
    id: string
    email: string
    full_name: string | null
    avatar_url: string | null
    avatar_color?: string | null
    created_at: string
    updated_at: string
}

export interface Category {
    id: string
    user_id: string
    workspace_id?: string | null
    name: string
    type: 'income' | 'expense'
    color: string | null
    icon: string | null
    created_at: string
    updated_at: string
}

export type TransactionPaymentMethod =
    | 'pix'
    | 'ted'
    | 'debit_card'
    | 'credit_card'
    | 'cash'
    | 'other'

export interface CreditCard {
    id: string
    workspace_id: string
    user_id: string
    name: string
    last_four: string
    brand: string | null
    closing_day: number
    due_day: number
    credit_limit: number | null
    /** MM/YYYY validade; omit or null if not set (older rows / pre-migration) */
    expiry_month?: number | null
    expiry_year?: number | null
    is_active: boolean
    created_at: string
    updated_at: string
}

export type CreditCardInvoicePaymentStatus = 'paid'

/** User-marked payment for a card invoice (statement close calendar date). */
export interface CreditCardInvoicePayment {
    id: string
    workspace_id: string
    credit_card_id: string
    /** YYYY-MM-DD (Postgres date). */
    statement_close_date: string
    status: CreditCardInvoicePaymentStatus
    paid_at: string
    created_by: string
    created_at: string
    updated_at: string
}

export type SubscriptionBillingInterval = 'weekly' | 'monthly' | 'yearly'

export interface WorkspaceSubscription {
    id: string
    workspace_id: string
    user_id: string
    name: string
    amount: number
    billing_interval: SubscriptionBillingInterval
    currency: string
    start_date: string
    next_billing_date: string | null
    day_of_month: number | null
    category_id: string | null
    notes: string | null
    payment_method: TransactionPaymentMethod | null
    payment_credit_card_id: string | null
    is_active: boolean
    created_at: string
    updated_at: string
}

/** List row with optional PostgREST embeds. */
export type WorkspaceSubscriptionListRow = WorkspaceSubscription & {
    category?: Category | null
}

/** Contas a Pagar — template recorrente */
export type BillFrequency =
    | "monthly"
    | "bimonthly"
    | "quarterly"
    | "yearly"
    | "one_time"

export interface Bill {
    id: string
    workspace_id: string
    user_id: string
    name: string
    description: string | null
    notes: string | null
    /** Same icon id vocabulary as `categories.icon` (e.g. utensils, receipt). */
    icon: string | null
    category_id: string | null
    frequency: BillFrequency
    due_day_of_month: number
    amount_estimated: number | null
    start_date: string
    end_date: string | null
    default_payment_method: TransactionPaymentMethod | null
    default_payment_credit_card_id: string | null
    reminder_days_before: number[]
    is_active: boolean
    created_at: string
    updated_at: string
    category?: Category | null
}

export type BillInstanceStatus = "pending" | "paid" | "skipped"

/** Uma parcela/ocorrência de uma conta cadastrada */
export interface BillInstance {
    id: string
    workspace_id: string
    user_id: string
    bill_id: string
    due_date: string
    amount: number | null
    status: BillInstanceStatus
    paid_at: string | null
    paid_amount: number | null
    payment_method: TransactionPaymentMethod | null
    payment_credit_card_id: string | null
    transaction_id: string | null
    notes: string | null
    created_at: string
    updated_at: string
    bill?: Bill | null
}

/** Recurring installment purchase; billing rows are created by `run_installment_billing()`. */
export interface WorkspaceInstallmentPlan {
    id: string
    workspace_id: string
    user_id: string
    category_id: string | null
    description: string | null
    payment_method: TransactionPaymentMethod | null
    payment_credit_card_id: string | null
    total_installments: number
    generated_count: number
    installment_amount: number
    final_installment_amount: number
    next_billing_date: string
    is_active: boolean
    created_at: string
    updated_at: string
}

/** Nested select from workspace_subscriptions (subscription billing). */
export type TransactionSubscriptionRef = Pick<
    WorkspaceSubscription,
    'id' | 'name'
>

/** Nested select from workspace_installment_plans (list embed). */
export type TransactionInstallmentPlanRef = Pick<
    WorkspaceInstallmentPlan,
    | 'id'
    | 'total_installments'
    | 'installment_amount'
    | 'final_installment_amount'
    | 'generated_count'
    | 'is_active'
    | 'next_billing_date'
    | 'description'
    | 'category_id'
    | 'payment_method'
    | 'payment_credit_card_id'
>

export interface Transaction {
    id: string
    user_id: string
    workspace_id?: string | null
    category_id: string | null
    type: 'income' | 'expense'
    amount: number
    description: string | null
    date: string
    is_recurring: boolean
    recurring_interval: 'daily' | 'weekly' | 'monthly' | null
    payment_method?: TransactionPaymentMethod | null
    payment_credit_card_id?: string | null
    /** Set when this expense was generated from an assinatura. */
    subscription_id?: string | null
    /** Set when this expense was generated from a compra parcelada plan. */
    installment_plan_id?: string | null
    /** 1-based parcel index when generated by installment billing. */
    installment_sequence?: number | null
    created_at: string
    updated_at: string
    // Related data
    category?: Category
    payment_card?: CreditCard | null
    subscription?: TransactionSubscriptionRef | null
    installment_plan?: TransactionInstallmentPlanRef | null
}

export interface TransactionSplit {
    id: string
    transaction_id: string
    category_id: string | null
    amount: number
    percentage: number
    created_at: string
}

export interface Session {
    id: string
    user_id: string
    device_type: 'desktop' | 'mobile' | 'tablet'
    device_name: string
    browser: string
    os: string
    ip_address: string
    user_agent: string
    created_at: string
    last_active_at: string
    is_active: boolean
}

export interface Wallet {
    id: string
    user_id: string
    workspace_id: string
    name: string
    type: string
    balance: number
    color: string | null
    created_at: string
    updated_at?: string
}

export type WorkspaceType = "personal" | "shared"
export type WorkspaceRole = "owner" | "member"

export interface Workspace {
    id: string
    name: string
    type: WorkspaceType
    created_by: string
    icon: string
    icon_background_color: string
    created_at: string
    updated_at: string
    /** When set, categories/budgets onboarding wizard is not shown. */
    categories_onboarding_completed_at?: string | null
}

/** Monthly budget cap for a category (workspace-scoped RLS). */
export interface Budget {
    id: string
    user_id: string
    workspace_id: string | null
    category_id: string
    year?: number
    month?: number
    period_start: string
    period_end: string
    amount: number
    threshold_80_sent_at: string | null
    threshold_100_sent_at: string | null
    threshold_over_sent_at: string | null
    created_at: string
    updated_at: string
}

/** Row counts from `get_workspace_delete_impact` RPC */
export interface WorkspaceDeleteImpact {
    transactions: number
    budgets: number
    categories: number
    members: number
    other_members: number
}

export interface WorkspaceMember {
    workspace_id: string
    user_id: string
    role: WorkspaceRole
    joined_at: string
    workspace?: Workspace
}

export type WorkspaceInviteStatus = "pending" | "accepted" | "revoked" | "expired"

export interface WorkspaceInvite {
    id: string
    workspace_id: string
    invited_email: string | null
    role: "member"
    token_hash: string
    /** Plain token for building accept URL; only returned when RLS allows (owner or invited email). */
    token_raw?: string | null
    status: WorkspaceInviteStatus
    expires_at: string
    created_by: string
    created_at: string
    accepted_at: string | null
    usage_count: number
    max_uses: number | null
}
