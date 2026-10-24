import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"

// O `semComentarios` corta comentário de JS; o `--` do SQL sai aqui, para as
// asserções de ausência não lerem a prosa da migração.
const sql = semComentarios(lerFonte("supabase/migrations/20261026120000_previsao.sql")).replace(/--.*$/gm, "")

function funcao(nome: string): string {
    const fn = sql.match(new RegExp(`create or replace function public\\.${nome}\\([\\s\\S]*?\\n\\$\\$;`))
    expect(fn, nome).not.toBeNull()
    return fn![0]
}

/** O `insert into public.transactions (…) values (…) on conflict` da função. */
function insertDaTransacao(nome: string): string {
    const fn = funcao(nome)
    const ins = fn.match(/insert into public\.transactions \([\s\S]*?on conflict/)
    expect(ins, nome).not.toBeNull()
    return ins![0]
}

describe("migração previsão", () => {
    it("a assinatura ganha kind, com padrão expense, e a receita não usa cartão", () => {
        expect(sql).toMatch(
            /alter table public\.workspace_subscriptions\s+add column if not exists kind text not null default 'expense'\s+check \(kind in \('expense', 'income'\)\);/,
        )
        expect(sql).toMatch(
            /add constraint workspace_subscriptions_income_no_card\s+check \(kind = 'expense' or payment_method is distinct from 'credit_card'\);/,
        )
    })

    it("a transação de assinatura deixa de ser só despesa", () => {
        expect(sql).toMatch(
            /alter table public\.transactions drop constraint if exists transactions_subscription_expense_only;/,
        )
    })

    it("as duas funções de assinatura gravam o kind, e o resto fica", () => {
        for (const [nome, linha] of [
            ["charge_subscription_cycle", "r"],
            ["seed_subscription_first_transaction", "new"],
        ] as const) {
            const ins = insertDaTransacao(nome)
            expect(ins, nome).not.toMatch(/'expense'/)
            expect(ins, nome).toContain(`${linha}.kind`)
            const fn = funcao(nome)
            expect(fn, nome).toMatch(/security definer\s+set search_path = public\s+as \$\$/)
            expect(fn, nome).toMatch(
                /on conflict \(subscription_id, \(\(date at time zone 'UTC'\)::date\)\)\s+where subscription_id is not null\s+do nothing;/,
            )
            expect(fn, nome).toContain("perform set_config('app.billing_advance', 'on', true);")
            expect(fn, nome).toContain("perform set_config('app.billing_advance', 'off', true);")
        }
        expect(funcao("charge_subscription_cycle")).toMatch(/^create or replace function public\.charge_subscription_cycle\(p_subscription_id uuid\)\s+returns smallint/)
        expect(funcao("seed_subscription_first_transaction")).toMatch(/^create or replace function public\.seed_subscription_first_transaction\(\)\s+returns trigger/)
        expect(sql).toMatch(/revoke all on function public\.charge_subscription_cycle\(uuid\) from public, anon, authenticated;/)
        expect(sql).toMatch(/revoke all on function public\.seed_subscription_first_transaction\(\) from public, anon, authenticated;/)
    })

    it("repeats nasce falso, o mês corrente passa a repetir e só então o padrão vira verdadeiro", () => {
        const passos = [
            sql.search(/alter table public\.budgets\s+add column if not exists repeats boolean not null default false;/),
            sql.search(
                /update public\.budgets\s+set repeats = true\s+where period_start = date_trunc\('month', public\.app_today\(\)\)::date;/,
            ),
            sql.search(/alter table public\.budgets alter column repeats set default true;/),
        ]
        for (const p of passos) expect(p).toBeGreaterThan(-1)
        expect([...passos].sort((a, b) => a - b)).toEqual(passos)
    })

    it("copiar_orcamentos_do_mes: só o que repete, do mês anterior, sem duplicar, só pela service role", () => {
        const fn = funcao("copiar_orcamentos_do_mes")
        expect(fn).toMatch(/^create or replace function public\.copiar_orcamentos_do_mes\(p_period_start date, p_workspace_id uuid default null\)\s+returns integer/)
        expect(fn).toMatch(/security definer\s+set search_path = ''/)
        expect(fn).toMatch(/insert into public\.budgets \(/)
        expect(fn).toMatch(/b\.period_start = \(v_inicio - interval '1 month'\)::date/)
        expect(fn).toMatch(/and b\.repeats\b/)
        expect(fn).toMatch(/p_workspace_id is null or b\.workspace_id = p_workspace_id/)
        expect(fn).toMatch(/on conflict \(workspace_id, category_id, period_start\) do nothing;/)
        expect(fn).not.toMatch(/threshold_|client_id/)
        expect(fn).toMatch(/get diagnostics v_n = row_count;/)
        expect(sql).toMatch(/revoke all on function public\.copiar_orcamentos_do_mes\(date, uuid\) from public, anon, authenticated;/)
        expect(sql).toMatch(/grant execute on function public\.copiar_orcamentos_do_mes\(date, uuid\) to service_role;/)
        expect(sql).not.toMatch(/grant [^;]*copiar_orcamentos_do_mes[^;]*authenticated/)
    })

    it("garantir_orcamentos_do_mes: só o membro, para o mês de hoje", () => {
        const fn = funcao("garantir_orcamentos_do_mes")
        expect(fn).toMatch(/^create or replace function public\.garantir_orcamentos_do_mes\(p_workspace_id uuid\)\s+returns integer/)
        expect(fn).toMatch(/security definer\s+set search_path = ''/)
        expect(fn).toMatch(/if not public\.is_workspace_member\(p_workspace_id\) then\s+raise exception 'not a workspace member'/)
        expect(fn).toMatch(
            /public\.copiar_orcamentos_do_mes\(date_trunc\('month', public\.app_today\(\)\)::date, p_workspace_id\)/,
        )
        expect(sql).toMatch(/revoke all on function public\.garantir_orcamentos_do_mes\(uuid\) from public, anon;/)
        expect(sql).toMatch(/grant execute on function public\.garantir_orcamentos_do_mes\(uuid\) to authenticated;/)
    })

    it("o cron orcamentos-do-mes roda no dia 1 às 03:05 UTC", () => {
        expect(sql).toMatch(/where j\.jobname = 'orcamentos-do-mes';/)
        expect(sql).toMatch(
            /cron\.schedule\(\s+'orcamentos-do-mes', '5 3 1 \* \*',\s+\$cmd\$select public\.copiar_orcamentos_do_mes\(date_trunc\('month', public\.app_today\(\)\)::date\)\$cmd\$\s+\);/,
        )
        expect(sql).toMatch(/if exists \(select 1 from pg_extension where extname = 'pg_cron'\) then/)
    })

    it("a reserva mensal mora na carteira, nula ou não negativa", () => {
        expect(sql).toMatch(
            /alter table public\.workspaces\s+add column if not exists monthly_savings_target numeric\(15, 2\)\s+check \(monthly_savings_target is null or monthly_savings_target >= 0\);/,
        )
    })

    it("as funções novas fixam search_path vazio", () => {
        for (const nome of ["copiar_orcamentos_do_mes", "garantir_orcamentos_do_mes"]) {
            expect(funcao(nome), nome).toMatch(/set search_path = ''/)
        }
    })

    it("só acrescenta: nada de drop column nem troca de tipo", () => {
        expect(sql).not.toMatch(/drop column/i)
        expect(sql).not.toMatch(/alter column \w+ (set data )?type/i)
        expect(sql).not.toMatch(/drop table|drop function/i)
    })
})
