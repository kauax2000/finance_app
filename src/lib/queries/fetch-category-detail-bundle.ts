import {
    supabase,
    type Budget,
    type Category,
    type Transaction,
    type WorkspaceInstallmentPlan,
    type WorkspaceSubscription,
} from "@/lib/supabase"
import {
    addMonths,
    sumWorkspaceMonthByType,
} from "@/components/categories/detail/category-detail-utils"
import {
    periodBoundsFromYearMonth,
    shiftYearMonth,
} from "@/lib/budget-month"
import { formatSupabasePostgrestError } from "@/lib/supabase-errors"
import { toastError } from "@/lib/toast"

const TX_MONTH_SELECT =
    "*, category:categories(id,name,color), subscription:workspace_subscriptions!subscription_id(id,name), installment_plan:workspace_installment_plans(id,total_installments,installment_amount,final_installment_amount,generated_count,is_active,next_billing_date,description)"

export type CategoryDetailBundle = {
    category: Category | null
    budget: Budget | null
    txs: Transaction[]
    seriesSource: Pick<Transaction, "date" | "amount" | "type" | "category_id">[]
    workspaceMonthSums: { income: number; expense: number }
    prevMonthCategoryTotal: number
    installmentPlans: WorkspaceInstallmentPlan[]
    subscriptions: WorkspaceSubscription[]
}

type RpcCategoryDetailPayload = {
    category?: Category | null
    budget?: Budget | null
    txs_month?: Transaction[]
    series_rows?: Pick<
        Transaction,
        "date" | "amount" | "type" | "category_id"
    >[]
    workspace_month_rows?: { amount: number | string; type: string }[]
    prev_category_rows?: { amount: number | string; type: string }[]
    installment_plans?: WorkspaceInstallmentPlan[]
    subscriptions?: WorkspaceSubscription[]
}

async function fetchCategoryDetailBundleLegacy(args: {
    workspaceId: string
    userId: string
    categoryId: string
    yearMonth: string
}): Promise<CategoryDetailBundle> {
    const { workspaceId, userId, categoryId, yearMonth } = args

    const { period_start, period_end } = periodBoundsFromYearMonth(yearMonth)
    const prevYm = shiftYearMonth(yearMonth, -1)
    const { period_start: prev_start, period_end: prev_end } =
        periodBoundsFromYearMonth(prevYm)
    const monthsBack = 12
    const rangeStartYm = addMonths(yearMonth, -(monthsBack - 1))
    const { period_start: rangeStart } = periodBoundsFromYearMonth(rangeStartYm)

    const [
        catRes,
        budRes,
        txMonthRes,
        txRangeRes,
        workspaceMonthRes,
        prevCatRes,
        plansRes,
        subsRes,
    ] = await Promise.all([
        supabase
            .from("categories")
            .select("*")
            .eq("workspace_id", workspaceId)
            .eq("id", categoryId)
            .maybeSingle(),
        supabase
            .from("budgets")
            .select("*")
            .eq("workspace_id", workspaceId)
            .eq("user_id", userId)
            .eq("category_id", categoryId)
            .eq("period_start", period_start)
            .maybeSingle(),
        supabase
            .from("transactions")
            .select(TX_MONTH_SELECT)
            .eq("workspace_id", workspaceId)
            .eq("category_id", categoryId)
            .gte("date", `${period_start}T00:00:00.000Z`)
            .lte("date", `${period_end}T23:59:59.999Z`)
            .order("date", { ascending: false })
            .order("created_at", { ascending: false }),
        supabase
            .from("transactions")
            .select("date,amount,type,category_id")
            .eq("workspace_id", workspaceId)
            .eq("category_id", categoryId)
            .gte("date", `${rangeStart}T00:00:00.000Z`)
            .lte("date", `${period_end}T23:59:59.999Z`),
        supabase
            .from("transactions")
            .select("amount,type")
            .eq("workspace_id", workspaceId)
            .gte("date", `${period_start}T00:00:00.000Z`)
            .lte("date", `${period_end}T23:59:59.999Z`),
        supabase
            .from("transactions")
            .select("amount,type")
            .eq("workspace_id", workspaceId)
            .eq("category_id", categoryId)
            .gte("date", `${prev_start}T00:00:00.000Z`)
            .lte("date", `${prev_end}T23:59:59.999Z`),
        supabase
            .from("workspace_installment_plans")
            .select("*")
            .eq("workspace_id", workspaceId)
            .eq("category_id", categoryId)
            .order("next_billing_date", { ascending: true }),
        supabase
            .from("workspace_subscriptions")
            .select("*")
            .eq("workspace_id", workspaceId)
            .eq("category_id", categoryId)
            .order("name", { ascending: true }),
    ])

    const cat = (catRes.data as Category | null) ?? null
    const budget = (budRes.data as Budget | null) ?? null

    let txs: Transaction[] = []
    if (txMonthRes.error) {
        toastError(
            formatSupabasePostgrestError(txMonthRes.error) ??
                "Não foi possível carregar as transações do mês.",
        )
        txs = []
    } else {
        txs = (txMonthRes.data as Transaction[] | null) ?? []
    }

    let installmentPlans: WorkspaceInstallmentPlan[] = []
    if (plansRes.error) {
        installmentPlans = []
    } else {
        installmentPlans =
            (plansRes.data as WorkspaceInstallmentPlan[] | null) ?? []
    }

    let subscriptions: WorkspaceSubscription[] = []
    if (subsRes.error) {
        subscriptions = []
    } else {
        subscriptions = (subsRes.data as WorkspaceSubscription[] | null) ?? []
    }

    const seriesRows =
        (txRangeRes.data as
            | Pick<Transaction, "date" | "amount" | "type" | "category_id">[]
            | null) ?? []

    const workspaceMonthSums = sumWorkspaceMonthByType(
        workspaceMonthRes.data as never,
    )

    const prevRows =
        (prevCatRes.data as { amount: number | string; type: string }[] | null) ??
        []
    const catType = cat?.type
    const prevMonthCategoryTotal = prevRows.reduce((s, r) => {
        if (catType && r.type !== catType) return s
        const v = Number(r.amount)
        return s + (Number.isFinite(v) ? v : 0)
    }, 0)

    return {
        category: cat,
        budget,
        txs,
        seriesSource: seriesRows,
        workspaceMonthSums,
        prevMonthCategoryTotal,
        installmentPlans,
        subscriptions,
    }
}

export async function fetchCategoryDetailBundle(args: {
    workspaceId: string
    userId: string
    categoryId: string
    yearMonth: string
}): Promise<CategoryDetailBundle> {
    const { data, error } = await supabase.rpc(
        "rpc_fetch_category_detail_bundle",
        {
            p_workspace_id: args.workspaceId,
            p_category_id: args.categoryId,
            p_year_month: args.yearMonth,
        },
    )

    if (!error && data && typeof data === "object") {
        const d = data as RpcCategoryDetailPayload
        const cat = d.category ?? null
        const budget = d.budget ?? null
        const txs = d.txs_month ?? []
        const seriesSource = d.series_rows ?? []
        const workspaceMonthSums = sumWorkspaceMonthByType(
            d.workspace_month_rows ?? null,
        )
        const prevRows = d.prev_category_rows ?? []
        const catType = cat?.type
        const prevMonthCategoryTotal = prevRows.reduce((s, r) => {
            if (catType && r.type !== catType) return s
            const v = Number(r.amount)
            return s + (Number.isFinite(v) ? v : 0)
        }, 0)

        return {
            category: cat,
            budget,
            txs,
            seriesSource,
            workspaceMonthSums,
            prevMonthCategoryTotal,
            installmentPlans: d.installment_plans ?? [],
            subscriptions: d.subscriptions ?? [],
        }
    }

    if (error) {
        console.warn(
            "rpc_fetch_category_detail_bundle failed, using legacy fetch:",
            error.message,
        )
    }

    return fetchCategoryDetailBundleLegacy(args)
}
