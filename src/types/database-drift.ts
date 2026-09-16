import type { Tables } from "@/types/database"
import type {
    Bill,
    BillInstance,
    Budget,
    Category,
    CreditCard,
    CreditCardInvoicePayment,
    Profile,
    Session,
    Transaction,
    Workspace,
    WorkspaceInstallmentPlan,
    WorkspaceInvite,
    WorkspaceMember,
    WorkspaceSubscription,
} from "@/lib/supabase"

/**
 * Os tipos de `lib/supabase.ts` são escritos à mão e estreitam o que o banco
 * guarda como `text` (`type: "income" | "expense"`). Trocar todos pelo gerado
 * mexeria em cada consulta do app; o que este arquivo garante é que os dois não
 * se afastem **em colunas**: coluna nova, renomeada ou apagada no banco (como o
 * `token_raw` que saiu dos convites) reprova o `tsc` até o tipo à mão acompanhar.
 * Depois de mudar o schema: `npm run db:types`.
 */

type Expect<T extends true> = T

/**
 * `Hand` tem exatamente as colunas de `Row`, fora `RowOnly` (colunas internas
 * que a tela não lê) e `Relations` (embeds do PostgREST no tipo à mão).
 */
type SameColumns<
    Row,
    Hand,
    RowOnly extends keyof Row = never,
    Relations extends keyof Hand = never,
> = [Exclude<Exclude<keyof Row, RowOnly>, keyof Hand>] extends [never]
    ? [Exclude<Exclude<keyof Hand, Relations>, keyof Row>] extends [never]
        ? true
        : false
    : false

export type DatabaseDriftChecks = [
    Expect<SameColumns<Tables<"transactions">, Transaction, "client_id", "category" | "payment_card" | "subscription" | "installment_plan">>,
    Expect<SameColumns<Tables<"categories">, Category, "client_id">>,
    Expect<SameColumns<Tables<"credit_cards">, CreditCard, "client_id">>,
    Expect<SameColumns<Tables<"credit_card_invoice_payments">, CreditCardInvoicePayment>>,
    Expect<SameColumns<Tables<"workspace_subscriptions">, WorkspaceSubscription, "client_id">>,
    Expect<SameColumns<Tables<"bills">, Bill, "client_id", "category">>,
    Expect<SameColumns<Tables<"bill_instances">, BillInstance, "client_id", "bill">>,
    Expect<SameColumns<Tables<"workspace_installment_plans">, WorkspaceInstallmentPlan>>,
    Expect<SameColumns<Tables<"workspaces">, Workspace>>,
    Expect<SameColumns<Tables<"budgets">, Budget, "client_id">>,
    Expect<SameColumns<Tables<"workspace_members">, WorkspaceMember, never, "workspace">>,
    Expect<SameColumns<Tables<"workspace_invites">, WorkspaceInvite, "token_hash">>,
    Expect<SameColumns<Tables<"profiles">, Profile>>,
    Expect<SameColumns<Tables<"user_sessions">, Session, "auth_session_id" | "device_fingerprint" | "device_id" | "token_hash">>,
]
