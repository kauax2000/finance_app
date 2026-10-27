import { describe, expect, it } from "vitest"
import { lerFonte } from "@/test/fonte"
import { politicasFinais, ultimasFuncoes } from "@/test/migracoes"

const MIGRACAO = "20261103130000_mcp_token_somente_leitura.sql"
const sql = lerFonte(`supabase/migrations/${MIGRACAO}`).replace(/--.*$/gm, "")
const tabelas = [...sql.match(/foreach t in array array\[([\s\S]*?)\]/)![1].matchAll(/'(\w+)'/g)].map((m) => m[1])

describe(`migração ${MIGRACAO}`, () => {
    it("toda tabela de public com política de escrita está na lista do token de IA", () => {
        const comEscrita = new Set(
            [...politicasFinais().values()]
                .filter((p) => p.tabela.startsWith("public.") && p.comando !== "select" && !p.texto.includes("as restrictive"))
                .map((p) => p.tabela.slice("public.".length))
                // O `drop table` (20261031130000) leva as políticas junto; o leitor não o vê.
                .filter((t) => t !== "transaction_splits"),
        )
        expect(tabelas).toEqual([...tabelas].sort())
        expect(tabelas).toEqual(expect.arrayContaining([...comEscrita]))
    })

    it("as políticas são restritivas, para authenticated, e só o insert de transactions fica", () => {
        expect(sql).toMatch(/coalesce\(auth\.jwt\(\) ->> 'client_id', ''\) <> ''/)
        expect(sql).toMatch(/continue when t = 'transactions' and op = 'insert';/)
        expect(sql).toMatch(/'create policy %I on public\.%I as restrictive for %s to authenticated %s \(not \(select public\.eh_token_de_ia\(\)\)\)'/)
        expect(sql).toMatch(/create policy ia_lancamento_marcado on public\.transactions\s+as restrictive\s+for insert\s+to authenticated\s+with check \(not \(select public\.eh_token_de_ia\(\)\) or \(source = 'ia_externa' and needs_review\)\);/)
        for (const op of ["insert", "update", "delete"]) {
            expect(sql, op).toMatch(new RegExp(`create policy ia_somente_leitura_${op} on storage\\.objects\\s+as restrictive\\s+for ${op}\\s+to authenticated`))
        }
    })

    it("o create_workspace_installment_plan aceita a chamada de 9 do app e passa as marcas ao criar_plano_parcelado", () => {
        const fn = ultimasFuncoes().get("create_workspace_installment_plan")!
        expect(fn.arquivo).toBe(MIGRACAO)
        expect(sql).toMatch(/drop function if exists public\.create_workspace_installment_plan\(uuid, uuid, text, text, uuid, integer, numeric, numeric, date\);/)
        expect(fn.texto).toMatch(/p_next_billing_date date,\s*p_source text default 'app',\s*p_needs_review boolean default false,\s*p_capture_meta jsonb default null\s*\)/)
        expect(fn.texto).toMatch(/p_next_billing_date,\s*p_source,\s*p_needs_review,\s*null,\s*p_capture_meta\s*\);/)
        expect(fn.texto).toMatch(/if public\.eh_token_de_ia\(\) then\s+p_source := 'ia_externa';\s+p_needs_review := true;/)
        const assinatura = "public.create_workspace_installment_plan(uuid, uuid, text, text, uuid, integer, numeric, numeric, date, text, boolean, jsonb)"
        expect(sql).toContain(`revoke all on function ${assinatura} from public, anon;`)
        expect(sql).toContain(`grant execute on function ${assinatura} to authenticated, service_role;`)
    })
})
