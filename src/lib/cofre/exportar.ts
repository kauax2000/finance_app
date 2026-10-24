import { toCsv, type CsvColumn } from "@/lib/data-table/csv"
import { supabase } from "@/lib/supabase"
import type { Database } from "@/types/database"
import { zipSemCompressao } from "./zip"

/** As tabelas do Cofre. Os anexos saem só como metadados: o arquivo não vai. */
export const TABELAS_EXPORTADAS = [
    "transactions",
    "categories",
    "credit_cards",
    "credit_card_statement_totals",
    "workspace_subscriptions",
    "workspace_installment_plans",
    "bills",
    "bill_instances",
    "budgets",
    "attachments",
] as const

const PAGINA = 1000
/** Ids por `.in()`: uuids longos estouram a URL do PostgREST bem antes de mil. */
const LOTE_IDS = 100

type Tabela = (typeof TABELAS_EXPORTADAS)[number]
type Row<T extends Tabela> = Database["public"]["Tables"][T]["Row"]

/**
 * Todas as colunas de cada tabela, na ordem do `Row`, para o arquivo de uma
 * tabela vazia sair só com o cabeçalho. Tipado contra `database.ts`: nome
 * errado não compila.
 */
export const COLUNAS_CONHECIDAS: { [T in Tabela]: ReadonlyArray<keyof Row<T>> } = {
    transactions: [
        "amount",
        "capture_meta",
        "category_id",
        "client_id",
        "created_at",
        "date",
        "description",
        "id",
        "import_batch_id",
        "installment_plan_id",
        "installment_sequence",
        "is_recurring",
        "needs_review",
        "payment_credit_card_id",
        "payment_method",
        "recurring_interval",
        "source",
        "subscription_id",
        "type",
        "updated_at",
        "user_id",
        "workspace_id",
    ],
    categories: [
        "client_id",
        "color",
        "created_at",
        "icon",
        "id",
        "name",
        "type",
        "updated_at",
        "user_id",
        "workspace_id",
    ],
    credit_cards: [
        "brand",
        "client_id",
        "closing_day",
        "created_at",
        "credit_limit",
        "due_day",
        "expiry_month",
        "expiry_year",
        "id",
        "is_active",
        "last_four",
        "name",
        "updated_at",
        "user_id",
        "wallet_alias",
        "workspace_id",
    ],
    credit_card_statement_totals: [
        "bank_total",
        "created_at",
        "created_by",
        "credit_card_id",
        "id",
        "source",
        "statement_close_date",
        "updated_at",
        "workspace_id",
    ],
    workspace_subscriptions: [
        "amount",
        "billing_anchor_day",
        "billing_interval",
        "category_id",
        "client_id",
        "created_at",
        "currency",
        "day_of_month",
        "id",
        "is_active",
        "name",
        "next_billing_date",
        "notes",
        "payment_credit_card_id",
        "payment_method",
        "start_date",
        "updated_at",
        "user_id",
        "workspace_id",
    ],
    workspace_installment_plans: [
        "billing_anchor_day",
        "category_id",
        "created_at",
        "description",
        "final_installment_amount",
        "generated_count",
        "id",
        "installment_amount",
        "is_active",
        "next_billing_date",
        "payment_credit_card_id",
        "payment_method",
        "total_installments",
        "updated_at",
        "user_id",
        "workspace_id",
    ],
    bills: [
        "amount_estimated",
        "category_id",
        "client_id",
        "created_at",
        "default_payment_credit_card_id",
        "default_payment_method",
        "description",
        "due_day_of_month",
        "end_date",
        "frequency",
        "icon",
        "id",
        "is_active",
        "name",
        "notes",
        "reminder_days_before",
        "start_date",
        "updated_at",
        "user_id",
        "workspace_id",
    ],
    bill_instances: [
        "amount",
        "bill_id",
        "client_id",
        "created_at",
        "due_date",
        "id",
        "notes",
        "paid_amount",
        "paid_at",
        "payment_credit_card_id",
        "payment_method",
        "status",
        "transaction_id",
        "updated_at",
        "user_id",
        "workspace_id",
    ],
    budgets: [
        "amount",
        "category_id",
        "client_id",
        "created_at",
        "id",
        "month",
        "period_end",
        "period_start",
        "threshold_100_sent_at",
        "threshold_80_sent_at",
        "threshold_over_sent_at",
        "updated_at",
        "user_id",
        "workspace_id",
        "year",
    ],
    attachments: [
        "bill_instance_id",
        "created_at",
        "created_by",
        "id",
        "mime",
        "path",
        "size_bytes",
        "statement_total_id",
        "transaction_id",
        "workspace_id",
    ],
}

type Resposta<T> = { data: T[] | null; error: unknown }

/** Lê tudo em páginas de 1000 (o teto do PostgREST) até vir uma menor. Erro lança. */
export async function lerTudo<T>(consulta: (de: number, ate: number) => PromiseLike<Resposta<T>>): Promise<T[]> {
    const todas: T[] = []
    for (let de = 0; ; de += PAGINA) {
        const { data, error } = await consulta(de, de + PAGINA - 1)
        if (error) throw error instanceof Error ? error : new Error(String((error as { message?: string })?.message ?? error))
        const pagina = data ?? []
        todas.push(...pagina)
        if (pagina.length < PAGINA) return todas
    }
}

type Linha = Record<string, unknown>

function paraCelula(v: unknown): string | number | boolean | null {
    if (v == null) return null
    if (typeof v === "object") return JSON.stringify(v)
    return v as string | number | boolean
}

function csvDe(linhas: Linha[], conhecidas: string[]): string {
    const chaves = linhas.length ? Object.keys(linhas[0]) : conhecidas
    const colunas: CsvColumn<Linha>[] = chaves.map((k) => ({ header: k, value: (r) => paraCelula(r[k]) }))
    return toCsv(linhas, colunas)
}

function lerPorCarteira(tabela: string, ids: string[]) {
    return lerTudo<Linha>((de, ate) =>
        supabase.from(tabela).select("*").in("workspace_id", ids).order("id").range(de, ate),
    )
}

async function lerInstancias(billIds: string[]): Promise<Linha[]> {
    const lotes: string[][] = []
    for (let i = 0; i < billIds.length; i += LOTE_IDS) lotes.push(billIds.slice(i, i + LOTE_IDS))
    const partes = await Promise.all(
        lotes.map((lote) =>
            lerTudo<Linha>((de, ate) =>
                supabase.from("bill_instances").select("*").in("bill_id", lote).order("id").range(de, ate),
            ),
        ),
    )
    return partes.flat()
}

/** O ZIP de CSVs de todas as carteiras dadas. Só lê: vale também em "só leitura". */
export async function exportarTudo(carteiras: Array<{ id: string; name: string }>): Promise<Blob> {
    const workspaceIds = carteiras.map((c) => c.id)
    const arquivos: Array<{ nome: string; conteudo: string }> = []
    let billIds: string[] = []
    for (const tabela of TABELAS_EXPORTADAS) {
        let linhas: Linha[]
        if (tabela === "bill_instances") linhas = await lerInstancias(billIds)
        else linhas = await lerPorCarteira(tabela, workspaceIds)
        if (tabela === "bills") billIds = linhas.map((l) => String(l.id))
        arquivos.push({ nome: `${tabela}.csv`, conteudo: csvDe(linhas, [...COLUNAS_CONHECIDAS[tabela]]) })
    }
    arquivos.push({
        nome: "LEIA-ME.txt",
        conteudo: [
            `Exportação do Finance App em ${new Date().toISOString()}.`,
            `Carteiras: ${carteiras.map((c) => `${c.name} (${c.id})`).join(", ")}.`,
            "Os CSVs são para o Excel em português: colunas separadas por ponto e vírgula (;) e números com vírgula decimal (128,40).",
            "Os anexos saem só como metadados; os arquivos não vão.",
            "Seus dados são seus. Este arquivo foi gerado no seu aparelho.",
            "",
        ].join("\r\n"),
    })
    return new Blob([zipSemCompressao(arquivos) as BlobPart], { type: "application/zip" })
}
