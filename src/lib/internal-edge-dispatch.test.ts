import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"

const fonte = (caminho: string) => semComentarios(lerFonte(caminho))
const MIGRACAO = "supabase/migrations/20261021120000_internal_edge_dispatch.sql"

// Do `create or replace function public.<nome>` até o `$$;` que fecha o corpo.
function funcao(f: string, nome: string) {
    const ini = f.indexOf(`create or replace function public.${nome}(`)
    expect(ini, `função ${nome} existe`).toBeGreaterThan(-1)
    const fim = f.indexOf("$$;", f.indexOf("$$", ini) + 2)
    expect(fim, `função ${nome} fecha com $$;`).toBeGreaterThan(ini)
    return f.slice(ini, fim)
}

describe("chamada interna às Edge Functions (pg_net + Vault)", () => {
    it("a migração lê URL e segredo do Vault, sem literal", () => {
        const f = fonte(MIGRACAO)
        expect(f).toContain("vault.decrypted_secrets")
        expect(f).toContain("'edge_functions_url'")
        expect(f).toContain("'cron_secret'")
        expect(f).not.toContain("supabase.co")
        expect(f).not.toContain("Bearer ")
        expect(f).not.toContain("eyJ")
    })

    it("invoke_edge_function não derruba quem chama", () => {
        const invoke = funcao(fonte(MIGRACAO), "invoke_edge_function")
        const ini = invoke.indexOf("if v_url is null")
        expect(ini).toBeGreaterThan(-1)
        const semSegredo = invoke.slice(ini, invoke.indexOf("end if;", ini))
        expect(semSegredo).toContain("return null")
        expect(invoke).toContain("exception when others")
    })

    it("invoke_edge_function não é do app", () => {
        const f = fonte(MIGRACAO)
        expect(f).toMatch(
            /revoke all on function public\.invoke_edge_function\(text, jsonb\) from public, anon, authenticated/i,
        )
    })

    it("invoke_edge_function e o trigger são security definer com search_path vazio", () => {
        const f = fonte(MIGRACAO)
        for (const nome of ["invoke_edge_function", "transactions_notify_created"]) {
            const corpo = funcao(f, nome)
            expect(corpo, nome).toContain("security definer")
            expect(corpo, nome).toContain("set search_path = ''")
        }
    })

    it("o trigger chama a invoke com o schema qualificado", () => {
        const trigger = funcao(fonte(MIGRACAO), "transactions_notify_created")
        expect(trigger).toContain("public.invoke_edge_function(")
        expect(trigger).toContain("'notify-transaction-created'")
    })

    it("os dois crons substituem os manuais", () => {
        const f = fonte(MIGRACAO)
        expect(f).toContain("'credit-card-calendar-alerts-daily'")
        expect(f).toContain("'bills-reminders-daily'")
        expect(f.split("'0 12 * * *'").length - 1).toBe(2)
        expect(f).toContain("cron.unschedule")
    })

    it("o trigger só pega despesa manual", () => {
        const f = fonte(MIGRACAO)
        expect(f).toContain("after insert on public.transactions")
        expect(f).toContain("new.type = 'expense'")
        expect(f).toContain("new.subscription_id is null")
        expect(f).toContain("new.installment_plan_id is null")
        expect(f).toContain("'notify-transaction-created'")
    })

    it("o webhook entende o segredo do cron", () => {
        const f = fonte("supabase/functions/notify-transaction-created/index.ts")
        expect(f).toContain("'x-cron-secret'")
        expect(f).toContain("CRON_SECRET")
        expect(f).not.toContain("NOTIFY_INTERNAL_SECRET")
    })

    it("a função só aceita segredo de serviço, sem JWT de usuário", () => {
        const f = fonte("supabase/functions/notify-transaction-created/index.ts")
        expect(f).not.toContain("getAuthUserFromJwt")
        expect(f).not.toContain("bearerJwt")
        expect(f).toContain("!isServiceAuthorized(req)")
    })
})
