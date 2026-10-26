import { readdirSync } from "node:fs"
import { resolve } from "node:path"
import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"
import { ultimasFuncoes } from "@/test/migracoes"

// Bloco 8, Tarefa 1: as colunas do Asaas, a idempotência do webhook e as
// redefinições de `meu_plano` e `tem_plano_proprio`. O `--` do SQL sai antes,
// para as asserções de ausência não lerem a prosa da migração.
const MIGRACAO = "20261101120000_cobranca_asaas.sql"
const sql = semComentarios(lerFonte(`supabase/migrations/${MIGRACAO}`)).replace(/--.*$/gm, "")
const tipos = lerFonte("src/types/database.ts")

const ULTIMA = ultimasFuncoes()

function ultima(nome: string): { arquivo: string; texto: string } {
    const fn = ULTIMA.get(nome)
    expect(fn, nome).toBeDefined()
    return fn!
}

const COLUNAS: Record<string, string> = {
    reembolsavel_ate: "timestamptz",
    asaas_customer_id: "text",
    card_token: "text",
    card_last4: "text",
    card_brand: "text",
    ultimo_ip: "text",
    checkout_ref: "text",
    checkout_url: "text",
    checkout_criado_em: "timestamptz",
    nfse_para: "text",
}

/**
 * Decisão 11: a "só leitura" cobre estas tabelas, e esta migração não mexe
 * nisso. O Bloco 9 (#79) acrescenta projeto, peso e limite.
 */
const GATILHOS_ESCRITA = [
    "attachments",
    "projects",
    "settlements",
    "transactions",
    "workspace_installment_plans",
    "workspace_member_limits",
    "workspace_split_weights",
    "workspace_subscriptions",
]

describe(`migração ${MIGRACAO}`, () => {
    it("billing_subscriptions ganha as colunas do Asaas, sem RLS aberta", () => {
        for (const [coluna, tipo] of Object.entries(COLUNAS)) {
            expect(sql, coluna).toMatch(new RegExp(`add column if not exists ${coluna} ${tipo}\\s*[,;]`))
        }
        expect(sql).not.toMatch(/policy[^;]*billing_subscriptions/i)
        expect(sql).not.toMatch(/grant[^;]*on (table )?public\.billing_subscriptions/i)
    })

    it("billing_events: chave pelo id do evento, processado_em (Ruling 25), RLS ligada, nenhuma política, revoke", () => {
        expect(sql).toMatch(
            /create table if not exists public\.billing_events \(\s*id text primary key,\s*tipo text not null,\s*recebido_em timestamptz not null default now\(\),\s*processado_em timestamptz\s*\);/,
        )
        expect(sql).toMatch(/alter table public\.billing_events enable row level security;/)
        expect(sql).toMatch(/revoke all on public\.billing_events from anon, authenticated;/)
        expect(sql).not.toMatch(/create policy/i)
    })

    it("billing_parcelamentos: o registro da Ruling 9, só da service role", () => {
        expect(sql).toMatch(
            /create table if not exists public\.billing_parcelamentos \(\s*installment text primary key,\s*subscription_id uuid not null references public\.billing_subscriptions\(id\) on delete cascade,\s*criado_em timestamptz not null default now\(\),\s*ativado_em timestamptz,\s*estorno_status text check \(estorno_status in \('pendente', 'feito'\)\),\s*estorno_tentado_em timestamptz\s*\);/,
        )
        expect(sql).toMatch(/alter table public\.billing_parcelamentos enable row level security;/)
        expect(sql).toMatch(/revoke all on public\.billing_parcelamentos from anon, authenticated;/)
        expect(sql).not.toMatch(/grant[^;]*on (table )?public\.billing_parcelamentos/i)
    })

    it("tem_plano_proprio: a ativa espera a confirmação pela grace_until (Decisão 8)", () => {
        const { arquivo, texto } = ultima("tem_plano_proprio")
        expect(arquivo).toBe(MIGRACAO)
        expect(texto).toMatch(/^create or replace function public\.tem_plano_proprio\(p_user_id uuid\)\s+returns boolean/)
        expect(texto).toMatch(/security definer\s+set search_path = ''/)
        expect(texto).toMatch(
            /\(b\.status = 'active' and \(b\.current_period_end is null or b\.current_period_end > now\(\) or b\.grace_until > now\(\)\)\)\s+or \(b\.status = 'past_due' and b\.grace_until > now\(\)\)/,
        )
        expect(sql).toMatch(/revoke all on function public\.tem_plano_proprio\(uuid\) from public, anon, authenticated;/)
        expect(sql).toMatch(/grant execute on function public\.tem_plano_proprio\(uuid\) to service_role;/)
    })

    it("meu_plano: os campos novos, e nunca o token, o cliente do Asaas nem o IP", () => {
        const { arquivo, texto } = ultima("meu_plano")
        expect(arquivo).toBe(MIGRACAO)
        expect(texto).toMatch(/^create or replace function public\.meu_plano\(\)\s+returns jsonb/)
        expect(texto).toMatch(/security definer\s+set search_path = ''/)
        const objeto = texto.match(/jsonb_build_object\(([\s\S]*?)\);/)
        expect(objeto).not.toBeNull()
        const chaves = [...objeto![1].matchAll(/^\s*'(\w+)',/gm)].map((m) => m[1])
        expect(chaves).toEqual([
            "plano",
            "origem",
            "status",
            "teste_ate",
            "periodo_ate",
            "cancelar_no_fim",
            "preco_centavos",
            "fundador",
            "cartao_final",
            "reembolsavel_ate",
            "carencia_ate",
            "checkout_url",
        ])
        expect(objeto![1]).toMatch(/'carencia_ate', v_assinatura\.grace_until/)
        expect(objeto![1]).toMatch(/'cartao_final', v_assinatura\.card_last4/)
        expect(texto).toMatch(
            /when v_assinatura\.status in \('pending', 'past_due'\)\s+and v_assinatura\.checkout_criado_em > now\(\) - interval '1 day'\s+then v_assinatura\.checkout_url/,
        )
        expect(texto).not.toMatch(/card_token|asaas_customer_id|ultimo_ip/)
        expect(sql).toMatch(/revoke all on function public\.meu_plano\(\) from public, anon;/)
        expect(sql).toMatch(/grant execute on function public\.meu_plano\(\) to authenticated;/)
    })

    it("I5: o updated_at da linha é do gatilho set_updated_at, em toda escrita", () => {
        expect(sql).toMatch(
            /create or replace trigger set_billing_subscriptions_updated_at before update on public\.billing_subscriptions\s+for each row execute function public\.set_updated_at\(\);/,
        )
    })

    it("é aditiva e não mexe na lista de gatilhos da só leitura (Decisão 11)", () => {
        expect(sql).not.toMatch(/drop column/i)
        expect(sql).not.toMatch(/alter column[^;]*\btype\b/i)
        expect(sql).not.toMatch(/drop table/i)
        expect(sql).not.toMatch(/garantir_escrita/)

        const tabelas = new Set<string>()
        const pasta = resolve(process.cwd(), "supabase/migrations")
        for (const arquivo of readdirSync(pasta).filter((f) => f.endsWith(".sql")).sort()) {
            const texto = lerFonte(`supabase/migrations/${arquivo}`).replace(/--.*$/gm, "")
            for (const m of texto.matchAll(/\b(create|drop) trigger (?:if exists )?garantir_escrita\b[^;]*?on public\.(\w+)/g)) {
                if (m[1] === "create") tabelas.add(m[2])
                else tabelas.delete(m[2])
            }
        }
        expect([...tabelas].sort()).toEqual(GATILHOS_ESCRITA)
    })

    it("os tipos à mão conhecem as colunas e a tabela nova", () => {
        for (const coluna of Object.keys(COLUNAS)) expect(tipos, coluna).toContain(`${coluna}: string | null`)
        expect(tipos).toMatch(/billing_events: \{\s+Row: \{\s+id: string\s+processado_em: string \| null\s+recebido_em: string\s+tipo: string/)
        expect(tipos).toMatch(
            /billing_parcelamentos: \{\s+Row: \{\s+ativado_em: string \| null\s+criado_em: string\s+estorno_status: string \| null\s+estorno_tentado_em: string \| null\s+installment: string\s+subscription_id: string/,
        )
    })
})
