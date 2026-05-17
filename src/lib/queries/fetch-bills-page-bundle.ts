import {
    supabase,
    type Bill,
    type BillInstance,
    type Category,
    type CreditCard,
    type CreditCardInvoicePayment,
    type WorkspaceInstallmentPlan,
} from "@/lib/supabase"
import {
    CREDIT_CARD_EXPENSE_SELECT,
    normalizeCcTxRow,
    type CcTxRow,
} from "@/lib/credit-cards-workspace-transactions"
import {
    formatSupabasePostgrestError,
    isPostgrestRelationMissingError,
} from "@/lib/supabase-errors"

const BILL_LIST_SELECT =
    "*, category:categories(id,name,type,color,icon,user_id,workspace_id)"

export type BillRowWithCategory = Bill & { category?: Category | null }

export type BillInstanceWithBill = BillInstance & {
    bill?: BillRowWithCategory | null
}

export type BillsPageBundle = {
    bills: BillRowWithCategory[]
    pendingInstances: BillInstanceWithBill[]
    recentPaidInstances: BillInstanceWithBill[]
    categories: Category[]
    creditCards: CreditCard[]
    ccRows: CcTxRow[]
    installmentPlans: WorkspaceInstallmentPlan[]
    invoicePayments: CreditCardInvoicePayment[]
    tableMissing: boolean
}

function normalizeBills(rows: unknown): BillRowWithCategory[] {
    return ((rows ?? []) as Record<string, unknown>[]).map((r) => {
        const bill = r as unknown as BillRowWithCategory
        const emb = r.category as Category | Category[] | null | undefined
        const cat =
            Array.isArray(emb) ? emb[0] : emb ?? null
        return { ...bill, category: cat }
    })
}

function hydrateInstances(
    rows: unknown,
    billsById: Map<string, BillRowWithCategory>,
): BillInstanceWithBill[] {
    return ((rows ?? []) as BillInstance[]).map((inst) => ({
        ...inst,
        bill: billsById.get(inst.bill_id) ?? null,
    }))
}

const emptyBundle = (missing: boolean): BillsPageBundle => ({
    bills: [],
    pendingInstances: [],
    recentPaidInstances: [],
    categories: [],
    creditCards: [],
    ccRows: [],
    installmentPlans: [],
    invoicePayments: [],
    tableMissing: missing,
})

type RpcBillsPayload = {
    bills?: unknown
    pending_instances?: unknown
    recent_paid_instances?: unknown
    categories?: unknown
    credit_cards?: unknown
    cc_transactions?: unknown
    installment_plans?: unknown
    invoice_payments?: unknown
    table_missing?: boolean
}

async function fetchBillsPageBundleLegacy(
    workspaceId: string,
): Promise<BillsPageBundle> {
    const billsRes = await supabase
        .from("bills")
        .select(BILL_LIST_SELECT)
        .eq("workspace_id", workspaceId)
        .order("name")

    if (billsRes.error && isPostgrestRelationMissingError(billsRes.error)) {
        return emptyBundle(true)
    }

    if (billsRes.error) {
        throw new Error(
            formatSupabasePostgrestError(billsRes.error) ??
                billsRes.error.message ??
                "Erro ao carregar contas a pagar"
        )
    }

    const bills = normalizeBills(billsRes.data)
    const billsById = new Map(bills.map((b) => [b.id, b]))

    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
    const since = ninetyDaysAgo.toISOString().slice(0, 10)

    const [pendingRes, paidRes] = await Promise.all([
        supabase
            .from("bill_instances")
            .select("*")
            .eq("workspace_id", workspaceId)
            .eq("status", "pending")
            .order("due_date", { ascending: true }),
        supabase
            .from("bill_instances")
            .select("*")
            .eq("workspace_id", workspaceId)
            .eq("status", "paid")
            .gte("due_date", since)
            .order("paid_at", { ascending: false })
            .limit(120),
    ])

    if (pendingRes.error) {
        throw new Error(
            formatSupabasePostgrestError(pendingRes.error) ??
                pendingRes.error.message
        )
    }
    if (paidRes.error) {
        throw new Error(
            formatSupabasePostgrestError(paidRes.error) ??
                paidRes.error.message
        )
    }

    const [cats, cards, ccPack, plans, invPay] = await Promise.all([
        supabase
            .from("categories")
            .select("*")
            .eq("workspace_id", workspaceId)
            .order("name"),
        supabase
            .from("credit_cards")
            .select("*")
            .eq("workspace_id", workspaceId)
            .order("name"),
        supabase
            .from("transactions")
            .select(CREDIT_CARD_EXPENSE_SELECT)
            .eq("workspace_id", workspaceId)
            .eq("type", "expense")
            .eq("payment_method", "credit_card")
            .order("date", { ascending: false }),
        supabase
            .from("workspace_installment_plans")
            .select("*")
            .eq("workspace_id", workspaceId),
        supabase
            .from("credit_card_invoice_payments")
            .select("*")
            .eq("workspace_id", workspaceId),
    ])

    return {
        bills,
        pendingInstances: hydrateInstances(pendingRes.data, billsById),
        recentPaidInstances: hydrateInstances(paidRes.data, billsById),
        categories: (cats.data ?? []) as Category[],
        creditCards: (cards.data ?? []) as CreditCard[],
        ccRows: ((ccPack.data ?? []) as unknown[]).map((r) =>
            normalizeCcTxRow(r),
        ),
        installmentPlans: (plans.data ?? []) as WorkspaceInstallmentPlan[],
        invoicePayments: (invPay.data ?? []) as CreditCardInvoicePayment[],
        tableMissing: false,
    }
}

export async function fetchBillsPageBundle(
    workspaceId: string,
): Promise<BillsPageBundle> {
    const { data, error } = await supabase.rpc("rpc_fetch_bills_page_bundle", {
        p_workspace_id: workspaceId,
    })

    if (!error && data && typeof data === "object") {
        const d = data as RpcBillsPayload
        if (d.table_missing) {
            return emptyBundle(true)
        }
        const bills = normalizeBills(d.bills)
        const billsById = new Map(bills.map((b) => [b.id, b]))
        return {
            bills,
            pendingInstances: hydrateInstances(
                d.pending_instances,
                billsById,
            ),
            recentPaidInstances: hydrateInstances(
                d.recent_paid_instances,
                billsById,
            ),
            categories: (d.categories as Category[]) ?? [],
            creditCards: (d.credit_cards as CreditCard[]) ?? [],
            ccRows: ((d.cc_transactions ?? []) as unknown[]).map((r) =>
                normalizeCcTxRow(r),
            ),
            installmentPlans:
                (d.installment_plans as WorkspaceInstallmentPlan[]) ?? [],
            invoicePayments:
                (d.invoice_payments as CreditCardInvoicePayment[]) ?? [],
            tableMissing: false,
        }
    }

    if (error) {
        console.warn(
            "rpc_fetch_bills_page_bundle failed, using legacy fetch:",
            error.message,
        )
    }

    return fetchBillsPageBundleLegacy(workspaceId)
}

export async function fetchBillDetailBundle(
    workspaceId: string,
    billId: string
): Promise<{
    bill: BillRowWithCategory | null
    instances: BillInstance[]
}> {
    const { data: billRow, error: bErr } = await supabase
        .from("bills")
        .select(BILL_LIST_SELECT)
        .eq("workspace_id", workspaceId)
        .eq("id", billId)
        .maybeSingle()

    if (bErr) throw new Error(bErr.message)

    const billNorm = billRow ? normalizeBills([billRow])[0] ?? null : null

    const { data: inst, error: iErr } = await supabase
        .from("bill_instances")
        .select("*")
        .eq("workspace_id", workspaceId)
        .eq("bill_id", billId)
        .order("due_date", { ascending: false })
        .limit(200)

    if (iErr) throw new Error(iErr.message)

    return {
        bill: billNorm,
        instances: (inst ?? []) as BillInstance[],
    }
}
