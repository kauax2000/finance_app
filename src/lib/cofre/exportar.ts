import { toCsv, type CsvColumn } from "@/lib/data-table/csv"
import { supabase } from "@/lib/supabase"
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

/** Colunas de uma tabela vazia, para o arquivo sair só com o cabeçalho. */
const COLUNAS_CONHECIDAS: Record<(typeof TABELAS_EXPORTADAS)[number], string[]> = {
    transactions: ["id", "workspace_id", "date", "amount", "type", "description", "category_id", "credit_card_id", "source"],
    categories: ["id", "workspace_id", "name", "color"],
    credit_cards: ["id", "workspace_id", "name", "last4", "credit_limit", "closing_day", "due_day"],
    credit_card_statement_totals: ["id", "workspace_id", "credit_card_id", "statement_close_date", "total"],
    workspace_subscriptions: ["id", "workspace_id", "name", "amount", "billing_day", "status"],
    workspace_installment_plans: ["id", "workspace_id", "description", "total_amount", "installments_count", "status"],
    bills: ["id", "workspace_id", "name", "amount", "due_day"],
    bill_instances: ["id", "workspace_id", "bill_id", "due_date", "amount", "status"],
    budgets: ["id", "workspace_id", "category_id", "amount"],
    attachments: ["id", "workspace_id", "transaction_id", "bill_instance_id", "statement_total_id", "path", "mime"],
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
export async function exportarTudo(workspaceIds: string[]): Promise<Blob> {
    const arquivos: Array<{ nome: string; conteudo: string }> = []
    let billIds: string[] = []
    for (const tabela of TABELAS_EXPORTADAS) {
        let linhas: Linha[]
        if (tabela === "bill_instances") linhas = await lerInstancias(billIds)
        else linhas = await lerPorCarteira(tabela, workspaceIds)
        if (tabela === "bills") billIds = linhas.map((l) => String(l.id))
        arquivos.push({ nome: `${tabela}.csv`, conteudo: csvDe(linhas, COLUNAS_CONHECIDAS[tabela]) })
    }
    arquivos.push({
        nome: "LEIA-ME.txt",
        conteudo: [
            `Exportação do Finance App em ${new Date().toISOString()}.`,
            `Carteiras: ${workspaceIds.join(", ")}.`,
            "Os anexos saem só como metadados; os arquivos não vão.",
            "Seus dados são seus. Este arquivo foi gerado no seu aparelho.",
            "",
        ].join("\r\n"),
    })
    return new Blob([zipSemCompressao(arquivos) as BlobPart], { type: "application/zip" })
}
