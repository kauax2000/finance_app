import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"

// O `semComentarios` corta comentário de JS; o `--` do SQL sai aqui, para as
// asserções de ausência não lerem a prosa da migração.
const sql = semComentarios(lerFonte("supabase/migrations/20261024120000_ia.sql")).replace(/--.*$/gm, "")
const tipos = lerFonte("src/types/database.ts")

function funcao(nome: string): string {
    const fn = sql.match(new RegExp(`create or replace function public\\.${nome}\\([\\s\\S]*?\\n\\$\\$;`))
    expect(fn, nome).not.toBeNull()
    return fn![0]
}

describe("migração ia", () => {
    it("as três tabelas só a service role lê e grava", () => {
        for (const tabela of ["ia_uso", "ia_cache", "ia_eventos"]) {
            expect(sql).toMatch(new RegExp(`create table if not exists public\\.${tabela}`))
            expect(sql).toMatch(new RegExp(`alter table public\\.${tabela} enable row level security;`))
            expect(sql).toMatch(new RegExp(`revoke all on public\\.${tabela} from anon, authenticated;`))
            expect(sql).not.toMatch(new RegExp(`on public\\.${tabela} for`))
            expect(sql).not.toMatch(new RegExp(`grant [^;]*on (table )?public\\.${tabela}\\b`))
        }
        expect(sql).toMatch(/primary key \(user_id, dia\)/)
        expect(sql).toMatch(/chave text primary key/)
        expect(sql).toMatch(/primary key \(dia, provedor, modelo, status\)/)
    })

    it("consumir_cota_ia é um upsert atômico que só soma abaixo do limite", () => {
        const corpo = funcao("consumir_cota_ia")
        expect(corpo).toMatch(/p_user_id uuid,\s*p_dia date,\s*p_limite integer/)
        expect(corpo).toMatch(/returns boolean/)
        expect(corpo).toMatch(/security definer/)
        expect(corpo).toMatch(/set search_path = ''/)
        expect(corpo).toMatch(/on conflict \(user_id, dia\) do update/)
        expect(corpo).toMatch(/set chamadas = u\.chamadas \+ 1\s+where u\.chamadas < p_limite/)
        expect(corpo).toMatch(/returning chamadas into/)
        expect(sql).toMatch(/revoke all on function public\.consumir_cota_ia\(uuid, date, integer\) from public, anon, authenticated;/)
        expect(sql).toMatch(/grant execute on function public\.consumir_cota_ia\(uuid, date, integer\) to service_role;/)
    })

    it("registrar_evento_ia soma 1 por dia, provedor, modelo e status", () => {
        const corpo = funcao("registrar_evento_ia")
        expect(corpo).toMatch(/security definer/)
        expect(corpo).toMatch(/set search_path = ''/)
        expect(corpo).toMatch(/on conflict \(dia, provedor, modelo, status\) do update/)
        expect(sql).toMatch(/revoke all on function public\.registrar_evento_ia\(date, text, text, text\) from public, anon, authenticated;/)
        expect(sql).toMatch(/grant execute on function public\.registrar_evento_ia\(date, text, text, text\) to service_role;/)
    })

    it("criar_plano_parcelado checa o membro sem auth.uid() e marca origem e revisão", () => {
        const corpo = funcao("criar_plano_parcelado")
        expect(corpo).toMatch(/p_source text default 'app',\s*p_needs_review boolean default false/)
        expect(corpo).toMatch(/returns uuid/)
        expect(corpo).toMatch(/security definer/)
        expect(corpo).toMatch(/set search_path = ''/)
        expect(corpo).not.toMatch(/auth\.uid\(\)/)
        expect(corpo).not.toMatch(/is_workspace_member/)
        expect(corpo).toMatch(/from public\.workspace_members[\s\S]*?user_id = p_user_id/)
        expect(corpo).toMatch(/raise exception 'Forbidden'/)
        expect(corpo).toMatch(/raise exception 'Invalid total_installments'/)
        expect(corpo).toMatch(/public\.charge_workspace_installment_plan_step\(v_plan_id\)/)
        expect(corpo).toMatch(/if coalesce\(p_source, 'app'\) <> 'app' or p_needs_review then/)
        expect(corpo).toMatch(/set source = coalesce\(p_source, 'app'\), needs_review = p_needs_review\s+where installment_plan_id = v_plan_id/)
        const assinatura = "public.criar_plano_parcelado(uuid, uuid, uuid, text, text, uuid, integer, numeric, numeric, date, text, boolean)"
        expect(sql).toContain(`revoke all on function ${assinatura} from public, anon, authenticated;`)
        expect(sql).toContain(`grant execute on function ${assinatura} to service_role;`)
        expect(sql.match(/grant execute on function public\.criar_plano_parcelado/g)).toHaveLength(1)
    })

    it("create_workspace_installment_plan mantém assinatura e erros e delega", () => {
        const corpo = funcao("create_workspace_installment_plan")
        expect(corpo).toMatch(
            /p_workspace_id uuid,\s*p_category_id uuid,\s*p_description text,\s*p_payment_method text,\s*p_payment_credit_card_id uuid,\s*p_total_installments integer,\s*p_installment_amount numeric,\s*p_final_installment_amount numeric,\s*p_next_billing_date date\s*\)/,
        )
        expect(corpo).toMatch(/returns uuid/)
        expect(corpo).toMatch(/security definer/)
        expect(corpo).toMatch(/v_uid uuid := auth\.uid\(\)/)
        expect(corpo).toMatch(/raise exception 'Not authenticated'/)
        expect(corpo).toMatch(/if not public\.is_workspace_member\(p_workspace_id\) then\s+raise exception 'Forbidden'/)
        expect(corpo).toMatch(/return public\.criar_plano_parcelado\(\s*v_uid,\s*p_workspace_id,/)
        // O grant de hoje (authenticated, service_role) não muda.
        expect(sql).not.toMatch(/function public\.create_workspace_installment_plan\([^)]*\) (from|to)/)
    })

    it("agenda a limpeza semanal do cache em SQL direto", () => {
        expect(sql).toMatch(/where j\.jobname = 'ia-cache-limpeza'/)
        expect(sql).toMatch(
            /'ia-cache-limpeza', '30 7 \* \* 0',\s*\$cmd\$delete from public\.ia_cache where created_at < now\(\) - interval '30 days'\$cmd\$/,
        )
    })

    it("só acrescenta", () => {
        expect(sql).not.toMatch(/drop column/i)
        expect(sql).not.toMatch(/alter column[^;]*\btype\b/i)
        expect(sql).not.toMatch(/drop (table|function)/i)
    })

    it("os tipos à mão conhecem as tabelas e as funções", () => {
        for (const nome of [
            "ia_uso",
            "ia_cache",
            "ia_eventos",
            "consumir_cota_ia",
            "registrar_evento_ia",
            "criar_plano_parcelado",
        ]) {
            expect(tipos).toContain(`${nome}: {`)
        }
    })
})
