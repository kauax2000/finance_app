import { supabase, type BillInstance } from "@/lib/supabase"
import type { BillRowWithCategory } from "@/lib/queries/fetch-bills-page-bundle"
import {
    formatSupabasePostgrestError,
    isPostgrestRelationMissingError,
} from "@/lib/supabase-errors"

/** Pending instance hydrated with bill name / estimate for dashboard & calendar */
export type BillInstanceCalendarRow = BillInstance & {
    bill:
        | (Pick<
              BillRowWithCategory,
              "id" | "name" | "is_active" | "amount_estimated"
          > &
              Partial<BillRowWithCategory>)
        | null
}

/** Lightweight rows for dashboard calendar (~pending instances only). */
export async function fetchPendingBillInstancesForDashboard(
    workspaceId: string
): Promise<{ rows: BillInstanceCalendarRow[]; error: string | null }> {
    const res = await supabase
        .from("bill_instances")
        .select(
            "id,bill_id,due_date,status,workspace_id,user_id,bills(id,name,is_active,amount_estimated)",
        )
        .eq("workspace_id", workspaceId)
        .eq("status", "pending")
        .order("due_date", { ascending: true })

    if (res.error && isPostgrestRelationMissingError(res.error)) {
        return { rows: [], error: null }
    }

    if (res.error) {
        const raw = await supabase
            .from("bill_instances")
            .select("*")
            .eq("workspace_id", workspaceId)
            .eq("status", "pending")
            .order("due_date", { ascending: true })
        if (raw.error) {
            return {
                rows: [],
                error:
                    formatSupabasePostgrestError(raw.error) ??
                    raw.error.message ??
                    null,
            }
        }
        return {
            rows: (raw.data ?? []).map((r) => ({
                ...(r as BillInstance),
                bill: null,
            })),
            error: null,
        }
    }

    const rows =
        ((res.data ?? []) as Record<string, unknown>[]).map((raw) => {
            const embed = raw.bills as
                | Partial<BillRowWithCategory>
                | Partial<BillRowWithCategory>[]
                | null
            const flat = Array.isArray(embed) ? embed[0] ?? null : embed
            const billPart: BillInstanceCalendarRow["bill"] =
                flat && typeof flat === "object" && flat.id
                    ? ({
                          id: String(flat.id),
                          name: String(flat.name ?? "Conta"),
                          is_active: Boolean(flat.is_active),
                          amount_estimated:
                              flat.amount_estimated != null
                                  ? Number(flat.amount_estimated)
                                  : null,
                      } as BillInstanceCalendarRow["bill"])
                    : null
            const rest = { ...raw }
            delete rest.bills
            const inst = rest as unknown as BillInstance
            return { ...inst, bill: billPart }
        })

    return { rows, error: null }
}
