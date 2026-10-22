import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"

// O `semComentarios` corta comentário de JS; o `--` do SQL sai aqui, para as
// asserções de ausência não lerem a prosa da migração.
const sql = semComentarios(lerFonte("supabase/migrations/20261023120000_captura.sql")).replace(/--.*$/gm, "")
const tipos = lerFonte("src/types/database.ts")

describe("migração captura", () => {
    it("cria capture_tokens com o hash único e RLS só do dono", () => {
        expect(sql).toMatch(/create table if not exists public\.capture_tokens/)
        expect(sql).toMatch(/token_hash text not null unique/)
        expect(sql).toMatch(/user_id uuid not null references auth\.users\(id\) on delete cascade/)
        expect(sql).toMatch(/workspace_id uuid not null references public\.workspaces\(id\) on delete cascade/)
        expect(sql).toMatch(/check \(char_length\(name\) between 1 and 60\)/)
        expect(sql).toMatch(/alter table public\.capture_tokens enable row level security/)
        expect(sql).toMatch(/on public\.capture_tokens for select[^;]*using \(user_id = \(select auth\.uid\(\)\)\)/)
        expect(sql).not.toMatch(/on public\.capture_tokens for (insert|update|delete|all)/)
    })

    it("o hash nunca chega ao cliente: sem grant de tabela, select só das outras colunas", () => {
        // Um revoke de coluna não vale com o select de tabela de pé (o padrão do Supabase).
        expect(sql).toMatch(/revoke all on public\.capture_tokens from anon, authenticated;/)
        const grant = sql.match(/grant select \(([^)]*)\)\s+on public\.capture_tokens to authenticated;/)
        expect(grant).not.toBeNull()
        const colunas = grant![1].split(",").map((c) => c.trim())
        expect(colunas).toEqual(["id", "user_id", "workspace_id", "name", "created_at", "last_used_at", "revoked_at"])
        // O único grant da tabela é esse, por coluna.
        expect(sql.match(/grant [^;]*on (table )?public\.capture_tokens\b/g)).toHaveLength(1)
    })

    it("create_capture_token gera o token, guarda só o sha256 e limita a 10", () => {
        const fn = sql.match(/create or replace function public\.create_capture_token\([\s\S]*?\n\$\$;/)
        expect(fn).not.toBeNull()
        const corpo = fn![0]
        expect(corpo).toMatch(/p_workspace_id uuid,\s*p_name text/)
        expect(corpo).toMatch(/returns text/)
        expect(corpo).toMatch(/security definer/)
        expect(corpo).toMatch(/set search_path = ''/)
        expect(corpo).toMatch(/public\.is_workspace_member\(p_workspace_id\)/)
        expect(corpo).toMatch(/raise exception 'nao_membro'/)
        expect(corpo).toMatch(/raise exception 'limite_tokens'/)
        expect(corpo).toMatch(/>= 10/)
        expect(corpo).toMatch(/'fac_' \|\| encode\(extensions\.gen_random_bytes\(32\), 'hex'\)/)
        expect(corpo).toMatch(/encode\(extensions\.digest\(v_token, 'sha256'\), 'hex'\)/)
        expect(sql).toMatch(/grant execute on function public\.create_capture_token\(uuid, text\) to authenticated;/)
        expect(sql).toMatch(/revoke all on function public\.create_capture_token\(uuid, text\) from public, anon;/)
    })

    it("revoke_capture_token só marca o token da própria pessoa", () => {
        const fn = sql.match(/create or replace function public\.revoke_capture_token\([\s\S]*?\n\$\$;/)
        expect(fn).not.toBeNull()
        expect(fn![0]).toMatch(/security definer/)
        expect(fn![0]).toMatch(/set search_path = ''/)
        expect(fn![0]).toMatch(/set revoked_at = now\(\)/)
        expect(fn![0]).toMatch(/user_id = auth\.uid\(\)/)
        expect(sql).toMatch(/grant execute on function public\.revoke_capture_token\(uuid\) to authenticated;/)
    })

    it("workspace_plan nasce devolvendo 'familia'", () => {
        const fn = sql.match(/create or replace function public\.workspace_plan\([\s\S]*?\n\$\$;/)
        expect(fn).not.toBeNull()
        expect(fn![0]).toMatch(/language sql/)
        expect(fn![0]).toMatch(/stable/)
        expect(fn![0]).toMatch(/select 'familia'/)
        expect(sql).toMatch(/grant execute on function public\.workspace_plan\(uuid\) to authenticated, service_role;/)
    })

    it("as colunas novas são aditivas e com padrão ou nulas", () => {
        expect(sql).toMatch(/alter table public\.credit_cards\s+add column if not exists wallet_alias text;/)
        expect(sql).toMatch(/check \(wallet_alias is null or char_length\(wallet_alias\) between 1 and 60\)/)
        expect(sql).toMatch(/add column if not exists capture_meta jsonb;/)
        expect(sql).toMatch(/add column if not exists notify_review boolean not null default true;/)
        expect(sql).not.toMatch(/drop column/i)
        expect(sql).not.toMatch(/alter column[^;]*\btype\b/i)
    })

    it("o dedupe do lembrete é só da service role", () => {
        expect(sql).toMatch(/create table if not exists public\.review_reminder_dedupe/)
        expect(sql).toMatch(/primary key \(user_id, workspace_id, sent_on\)/)
        expect(sql).toMatch(/alter table public\.review_reminder_dedupe enable row level security/)
        expect(sql).toMatch(/revoke all on public\.review_reminder_dedupe from anon, authenticated;/)
        expect(sql).not.toMatch(/on public\.review_reminder_dedupe for/)
    })

    it("agenda o lembrete das 20h em Brasília", () => {
        expect(sql).toMatch(/where j\.jobname = 'review-reminder-daily'/)
        expect(sql).toMatch(
            /'review-reminder-daily', '0 23 \* \* \*',\s*\$cmd\$select public\.invoke_edge_function\('review-reminder'\)\$cmd\$/,
        )
    })

    it("os tipos à mão conhecem a tabela, as colunas e as funções", () => {
        for (const nome of [
            "capture_tokens",
            "review_reminder_dedupe",
            "wallet_alias",
            "capture_meta",
            "notify_review",
            "create_capture_token",
            "revoke_capture_token",
            "workspace_plan",
        ]) {
            expect(tipos).toContain(nome)
        }
    })
})
