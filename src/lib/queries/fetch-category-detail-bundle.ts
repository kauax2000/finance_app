import {
    supabase,
    type Budget,
    type Category,
    type CreditCard,
    type Transaction,
    type WorkspaceInstallmentPlan,
    type WorkspaceSubscription,
} from "@/lib/supabase"
import {
    addMonths,
} from "@/components/categories/detail/category-detail-utils"
import {
    periodBoundsFromYearMonth,
    shiftYearMonth,
} from "@/lib/budget-month"
import {
    aggregateIncomeExpenseForMonth,
    buildCreditCardClosingLookup,
    transactionCountsInExpenseMonth,
} from "@/lib/expense-month-attribution"
import { formatSupabasePostgrestError } from "@/lib/supabase-errors"
import { toastError } from "@/lib/toast"

const TX_MONTH_SELECT =
    "*, category:categories(id,name,color), subscription:workspace_subscriptions!subscription_id(id,name), installment_plan:workspace_installment_plans(id,total_installments,installment_amount,final_installment_amount,generated_count,is_active,next_billing_date,description)"

const SERIES_SELECT =
    "date,amount,type,category_id,payment_method,payment_credit_card_id"

export type CategoryDetailBundle = {
    category: Category | null
    budget: Budget | null
    txs: Transaction[]
    seriesSource: Pick<
        Transaction,
        "date" | "amount" | "type" | "category_id" | "payment_method" | "payment_credit_card_id"
    >[]
    workspaceMonthSums: { income: number; expense: number }
    prevMonthCategoryTotal: number
    installmentPlans: WorkspaceInstallmentPlan[]
    subscriptions: WorkspaceSubscription[]
    creditCards: Pick<CreditCard, "id" | "closing_day">[]
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

function paddedBoundsForYearMonth(yearMonth: string) {
    const prevYm = shiftYearMonth(yearMonth, -1)
    const nextYm = shiftYearMonth(yearMonth, 1)
    return {
        padStart: periodBoundsFromYearMonth(prevYm).period_start,
        padEnd: periodBoundsFromYearMonth(nextYm).period_end,
    }
}

function minYmd(a: string, b: string) {
    return a.localeCompare(b) <= 0 ? a : b
}

async function fetchCreditCardsForWorkspace(
    workspaceId: string,
): Promise<Pick<CreditCard, "id" | "closing_day">[]> {
    const { data, error } = await supabase
        .from("credit_cards")
        .select("id, closing_day")
        .eq("workspace_id", workspaceId)
    if (error) {
        console.warn("fetchCategoryDetailBundle credit cards:", error.message)
        return []
    }
    return (data as Pick<CreditCard, "id" | "closing_day">[]) ?? []
}

function applyExpenseMonthAttribution(
    bundle: Omit<CategoryDetailBundle, "creditCards">,
    args: {
        categoryId: string
        yearMonth: string
        creditCards: Pick<CreditCard, "id" | "closing_day">[]
        categoryTxsWide: Transaction[]
        workspaceTxsWide: Pick<
            Transaction,
            "type" | "amount" | "date" | "payment_method" | "payment_credit_card_id"
        >[]
        seriesRows: Pick<
            Transaction,
            "date" | "amount" | "type" | "category_id" | "payment_method" | "payment_credit_card_id"
        >[]
    },
): CategoryDetailBundle {
    const lookup = buildCreditCardClosingLookup(args.creditCards)
    const prevYm = shiftYearMonth(args.yearMonth, -1)
    const catType = bundle.category?.type

    const txs = args.categoryTxsWide.filter((t) =>
        transactionCountsInExpenseMonth(t, args.yearMonth, lookup),
    )

    const workspaceMonthSums = aggregateIncomeExpenseForMonth(
        args.workspaceTxsWide,
        args.yearMonth,
        lookup,
    )

    let prevMonthCategoryTotal = 0
    for (const t of args.categoryTxsWide) {
        if (catType && t.type !== catType) continue
        if (!transactionCountsInExpenseMonth(t, prevYm, lookup)) continue
        const v = Number(t.amount)
        if (Number.isFinite(v)) prevMonthCategoryTotal += v
    }

    return {
        ...bundle,
        txs,
        seriesSource: args.seriesRows,
        workspaceMonthSums,
        prevMonthCategoryTotal,
        creditCards: args.creditCards,
    }
}

async function fetchCategoryDetailBundleLegacy(args: {
    workspaceId: string
    userId: string
    categoryId: string
    yearMonth: string
    creditCards: Pick<CreditCard, "id" | "closing_day">[]
}): Promise<CategoryDetailBundle> {
    const { workspaceId, userId, categoryId, yearMonth, creditCards } = args

    const { period_start } = periodBoundsFromYearMonth(yearMonth)
    const { padStart, padEnd } = paddedBoundsForYearMonth(yearMonth)
    const monthsBack = 12
    const rangeStartYm = addMonths(yearMonth, -(monthsBack - 1))
    const { period_start: rangeStart } = periodBoundsFromYearMonth(rangeStartYm)
    const seriesStart = minYmd(rangeStart, padStart)

    const [
        catRes,
        budRes,
        txPaddedRes,
        txSeriesRes,
        workspacePaddedRes,
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
            .gte("date", `${padStart}T00:00:00.000Z`)
            .lte("date", `${padEnd}T23:59:59.999Z`)
            .order("date", { ascending: false })
            .order("created_at", { ascending: false }),
        supabase
            .from("transactions")
            .select(SERIES_SELECT)
            .eq("workspace_id", workspaceId)
            .eq("category_id", categoryId)
            .gte("date", `${seriesStart}T00:00:00.000Z`)
            .lte("date", `${padEnd}T23:59:59.999Z`),
        supabase
            .from("transactions")
            .select("amount,type,date,payment_method,payment_credit_card_id")
            .eq("workspace_id", workspaceId)
            .gte("date", `${padStart}T00:00:00.000Z`)
            .lte("date", `${padEnd}T23:59:59.999Z`),
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

    let categoryTxsWide: Transaction[] = []
    if (txPaddedRes.error) {
        toastError(
            formatSupabasePostgrestError(txPaddedRes.error) ??
                "Não foi possível carregar as transações do mês.",
        )
    } else {
        categoryTxsWide = (txPaddedRes.data as Transaction[] | null) ?? []
    }

    const installmentPlans =
        (plansRes.data as WorkspaceInstallmentPlan[] | null) ?? []
    const subscriptions = (subsRes.data as WorkspaceSubscription[] | null) ?? []

    const seriesRows =
        (txSeriesRes.data as Pick<
            Transaction,
            "date" | "amount" | "type" | "category_id" | "payment_method" | "payment_credit_card_id"
        >[] | null) ?? []

    const workspaceTxsWide =
        (workspacePaddedRes.data as Pick<
            Transaction,
            "type" | "amount" | "date" | "payment_method" | "payment_credit_card_id"
        >[] | null) ?? []

    return applyExpenseMonthAttribution(
        {
            category: cat,
            budget,
            txs: [],
            seriesSource: [],
            workspaceMonthSums: { income: 0, expense: 0 },
            prevMonthCategoryTotal: 0,
            installmentPlans,
            subscriptions,
        },
        {
            categoryId,
            yearMonth,
            creditCards,
            categoryTxsWide,
            workspaceTxsWide,
            seriesRows,
        },
    )
}

export async function fetchCategoryDetailBundle(args: {
    workspaceId: string
    userId: string
    categoryId: string
    yearMonth: string
}): Promise<CategoryDetailBundle> {
    const creditCards = await fetchCreditCardsForWorkspace(args.workspaceId)
    const { padStart, padEnd } = paddedBoundsForYearMonth(args.yearMonth)

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
        const monthsBack = 12
        const rangeStartYm = addMonths(args.yearMonth, -(monthsBack - 1))
        const { period_start: rangeStart } = periodBoundsFromYearMonth(rangeStartYm)
        const seriesStart = minYmd(rangeStart, padStart)

        const [txPaddedRes, workspacePaddedRes, txSeriesRes] = await Promise.all([
            supabase
                .from("transactions")
                .select(TX_MONTH_SELECT)
                .eq("workspace_id", args.workspaceId)
                .eq("category_id", args.categoryId)
                .gte("date", `${padStart}T00:00:00.000Z`)
                .lte("date", `${padEnd}T23:59:59.999Z`)
                .order("date", { ascending: false })
                .order("created_at", { ascending: false }),
            supabase
                .from("transactions")
                .select("amount,type,date,payment_method,payment_credit_card_id")
                .eq("workspace_id", args.workspaceId)
                .gte("date", `${padStart}T00:00:00.000Z`)
                .lte("date", `${padEnd}T23:59:59.999Z`),
            supabase
                .from("transactions")
                .select(SERIES_SELECT)
                .eq("workspace_id", args.workspaceId)
                .eq("category_id", args.categoryId)
                .gte("date", `${seriesStart}T00:00:00.000Z`)
                .lte("date", `${padEnd}T23:59:59.999Z`),
        ])

        const categoryTxsWide =
            (txPaddedRes.data as Transaction[] | null) ?? d.txs_month ?? []
        const workspaceTxsWide =
            (workspacePaddedRes.data as Pick<
                Transaction,
                "type" | "amount" | "date" | "payment_method" | "payment_credit_card_id"
            >[] | null) ?? []
        const seriesRows =
            (txSeriesRes.data as Pick<
                Transaction,
                "date" | "amount" | "type" | "category_id" | "payment_method" | "payment_credit_card_id"
            >[] | null) ??
            (d.series_rows as Pick<
                Transaction,
                "date" | "amount" | "type" | "category_id" | "payment_method" | "payment_credit_card_id"
            >[] | null) ??
            []

        return applyExpenseMonthAttribution(
            {
                category: d.category ?? null,
                budget: d.budget ?? null,
                txs: d.txs_month ?? [],
                seriesSource: seriesRows,
                workspaceMonthSums: { income: 0, expense: 0 },
                prevMonthCategoryTotal: 0,
                installmentPlans: d.installment_plans ?? [],
                subscriptions: d.subscriptions ?? [],
            },
            {
                categoryId: args.categoryId,
                yearMonth: args.yearMonth,
                creditCards,
                categoryTxsWide,
                workspaceTxsWide,
                seriesRows,
            },
        )
    }

    if (error) {
        console.warn(
            "rpc_fetch_category_detail_bundle failed, using legacy fetch:",
            error.message,
        )
    }

    return fetchCategoryDetailBundleLegacy({
        ...args,
        creditCards,
    })
}
