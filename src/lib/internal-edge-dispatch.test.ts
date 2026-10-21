import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"

const fonte = (caminho: string) => semComentarios(lerFonte(caminho))
const MIGRACAO = "supabase/migrations/20261021120000_internal_edge_dispatch.sql"

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
        const f = fonte(MIGRACAO)
        expect(f).toContain("exception when others")
        expect(f).toContain("return null")
    })

    it("invoke_edge_function não é do app", () => {
        const f = fonte(MIGRACAO)
        expect(f).toMatch(
            /revoke all on function public\.invoke_edge_function\(text, jsonb\) from public, anon, authenticated/i,
        )
        expect(f).toContain("security definer")
        expect(f).toContain("set search_path = ''")
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
