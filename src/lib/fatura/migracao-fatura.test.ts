import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"

const sql = semComentarios(lerFonte("supabase/migrations/20261022120000_fatura_que_bate.sql"))
const tipos = lerFonte("src/types/database.ts")

const SOURCES = [
    "app",
    "quick_text",
    "shortcut",
    "apple_pay",
    "whatsapp",
    "share",
    "import_pdf",
    "import_sheet",
    "import_statement",
    "recurring",
]

describe("migração fatura que bate", () => {
    it("acrescenta as colunas de importação em transactions", () => {
        expect(sql).toMatch(/add column if not exists source text not null default 'app'/)
        expect(sql).toMatch(/add column if not exists needs_review boolean not null default false/)
        expect(sql).toMatch(/add column if not exists import_batch_id uuid/)
        expect(sql).toMatch(/on public\.transactions \(import_batch_id\)\s+where import_batch_id is not null/)
    })

    it("o check de source tem exatamente os 10 valores", () => {
        const m = sql.match(/check \(source in \(([^)]*)\)\)/)
        expect(m).not.toBeNull()
        const valores = [...m![1].matchAll(/'([a-z_]+)'/g)].map((x) => x[1])
        expect(valores).toEqual(SOURCES)
    })

    it("cria o total do banco com RLS, unique e triggers", () => {
        expect(sql).toMatch(/create table if not exists public\.credit_card_statement_totals/)
        expect(sql).toMatch(/bank_total numeric\(15, ?2\) not null/)
        expect(sql).toMatch(/check \(source in \('manual', 'pdf', 'csv', 'ofx'\)\)/)
        expect(sql).toMatch(/created_by uuid not null default auth\.uid\(\)/)
        expect(sql).toMatch(/unique \(workspace_id, credit_card_id, statement_close_date\)/)
        expect(sql).toMatch(/references public\.workspaces\(id\) on delete cascade/)
        expect(sql).toMatch(/references public\.credit_cards\(id\) on delete cascade/)
        expect(sql).toMatch(/enable row level security/)
        expect(sql).toMatch(/set_updated_at\(\)/)
        expect(sql).toMatch(/assert_same_workspace_ref\('credit_card_id', 'credit_cards'\)/)
        expect(sql).toMatch(/same_ws_credit_card_id/)
        for (const op of ["select", "update", "delete"]) {
            expect(sql).toMatch(new RegExp(`for ${op}\\b[^;]*is_workspace_member\\(workspace_id\\)`))
        }
        expect(sql).toMatch(
            /for insert[^;]*is_workspace_member\(workspace_id\) and created_by = \(select auth\.uid\(\)\)/,
        )
    })

    it("o trigger de aviso ignora lançamento importado", () => {
        const when = sql.match(/create trigger transactions_notify_created[\s\S]*?when \(([\s\S]*?)\)\s*execute/)
        expect(when).not.toBeNull()
        expect(when![1]).toContain("new.type = 'expense'")
        expect(when![1]).toContain("new.subscription_id is null")
        expect(when![1]).toContain("new.installment_plan_id is null")
        expect(when![1]).toContain("new.import_batch_id is null")
    })

    it("os tipos gerados conhecem a tabela e a coluna novas", () => {
        expect(tipos).toContain("credit_card_statement_totals")
        expect(tipos).toContain("import_batch_id")
    })
})
