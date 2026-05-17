import type { VirtualCreditCardBill } from "@/lib/bills/credit-card-bill-projector"
import type { BillInstance } from "@/lib/supabase"
import type { BillRowWithCategory } from "@/lib/queries/fetch-bills-page-bundle"

/** One row in the pending list: regular bill instance or projected credit card invoice. */
export type BillPendingRow =
    | {
          kind: "regular"
          id: string
          title: string
          dueYmd: string
          amountHint: number | null
          instance: BillInstance
          bill: BillRowWithCategory
      }
    | {
          kind: "virtual_cc"
          id: string
          title: string
          dueYmd: string
          amountHint: number | null
          virtual: VirtualCreditCardBill
      }
