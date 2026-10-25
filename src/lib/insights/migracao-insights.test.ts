import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"

// O `semComentarios` corta comentário de JS; o `--` do SQL sai aqui, para as
// asserções de ausência não lerem a prosa da migração.
const sql = semComentarios(lerFonte("supabase/migrations/20261028120000_insights.sql")).replace(/--.*$/gm, "")

function funcao(nome: string): string {
    const fn = sql.match(new RegExp(`create or replace function public\\.${nome}\\([\\s\\S]*?\\n\\$\\$;`))
    expect(fn, nome).not.toBeNull()
    return fn![0]
}

const KINDS =
    "'fatura_fechou', 'relatorio_mes', 'recorrencia', 'gasto_atipico', 'preco_assinatura', 'duplicidade', 'parcelas_acabando', 'seguro_baixo', 'sazonal', 'a_conferir'"

describe("migração insights", () => {
    it("a tabela: os dez tipos, os quatro status, payload e o índice único com coalesce", () => {
        expect(sql).toMatch(/create table if not exists public\.insights \(/)
        expect(sql).toContain(`kind text not null check (kind in (${KINDS}))`)
        expect(sql).toMatch(/status text not null default 'new' check \(status in \('new', 'seen', 'dismissed', 'acted'\)\)/)
        expect(sql).toMatch(/payload jsonb not null default '\{\}'/)
        expect(sql).toMatch(/user_id uuid references auth\.users\(id\) on delete cascade/)
        expect(sql).toMatch(
            /create unique index if not exists insights_dedupe_uidx\s+on public\.insights \(workspace_id, coalesce\(user_id, '00000000-0000-0000-0000-000000000000'::uuid\), kind, dedupe_key\);/,
        )
    })

    it("insights: RLS de leitura (membro, próprio ou da carteira, não silenciado) e nenhuma escrita direta", () => {
        expect(sql).toMatch(/alter table public\.insights enable row level security;/)
        const pol = sql.match(/create policy insights_select on public\.insights\s+for select[\s\S]*?\);\n/)
        expect(pol).not.toBeNull()
        expect(pol![0]).toMatch(/public\.is_workspace_member\(workspace_id\)/)
        expect(pol![0]).toMatch(/user_id is null or user_id = \(select auth\.uid\(\)\)/)
        expect(pol![0]).toMatch(/not exists \(\s*select 1 from public\.insights_silenciados s/)
        expect(sql).not.toMatch(/create policy \w+ on public\.insights\s+for (insert|update|delete|all)/)
        expect(sql).toMatch(/revoke insert, update, delete, truncate on public\.insights from authenticated;/)
    })

    it("silenciados: a pessoa lê, insere e apaga só os próprios", () => {
        expect(sql).toMatch(/create table if not exists public\.insights_silenciados \(/)
        expect(sql).toMatch(/primary key \(user_id, kind\)/)
        for (const op of ["select", "insert", "delete"]) {
            expect(sql).toMatch(new RegExp(`create policy insights_silenciados_${op} on public\\.insights_silenciados\\s+for ${op}`))
        }
        expect(sql).not.toMatch(/on public\.insights_silenciados\s+for update/)
    })

    it("teto de push: tabela só do servidor e reivindicação atômica abaixo de 3", () => {
        expect(sql).toMatch(/create table if not exists public\.insights_push_semana \(/)
        expect(sql).toMatch(/primary key \(user_id, semana\)/)
        expect(sql).toMatch(/alter table public\.insights_push_semana enable row level security;/)
        expect(sql).toMatch(/revoke all on public\.insights_push_semana from anon, authenticated;/)
        const fn = funcao("reivindicar_push_de_insight")
        expect(fn).toMatch(/returns boolean/)
        expect(fn).toMatch(/on conflict \(user_id, semana\) do update\s+set enviados = s\.enviados \+ 1\s+where s\.enviados < 3;/)
        expect(fn).toMatch(/return found;/)
        expect(sql).toMatch(
            /revoke all on function public\.reivindicar_push_de_insight\(uuid, date\) from public, anon, authenticated;/,
        )
        expect(sql).toMatch(/grant execute on function public\.reivindicar_push_de_insight\(uuid, date\) to service_role;/)
    })

    it("marcar_insight: só seen, dismissed e acted, pelas regras da RLS; acted duas vezes é INSIGHT_JA_USADO", () => {
        const fn = funcao("marcar_insight")
        expect(fn).toMatch(/^create or replace function public\.marcar_insight\(p_id uuid, p_status text\)\s+returns void/)
        expect(fn).toMatch(/security definer\s+set search_path = ''/)
        expect(fn).toMatch(/p_status not in \('seen', 'dismissed', 'acted'\)/)
        expect(fn).toMatch(/public\.is_workspace_member\(i\.workspace_id\)/)
        expect(fn).toMatch(/i\.user_id is null or i\.user_id = v_uid/)
        expect(fn).toMatch(/public\.insights_silenciados/)
        expect(fn).toMatch(/and status <> 'acted'/)
        expect(fn).toMatch(/raise exception 'INSIGHT_JA_USADO'/)
        expect(sql).toMatch(/revoke all on function public\.marcar_insight\(uuid, text\) from public, anon;/)
        expect(sql).toMatch(/grant execute on function public\.marcar_insight\(uuid, text\) to authenticated;/)
    })

    it("registrar_insight: membro, só seguro_baixo, da própria pessoa, sem duplicar nem criar silenciado", () => {
        const fn = funcao("registrar_insight")
        expect(fn).toMatch(
            /^create or replace function public\.registrar_insight\(p_workspace_id uuid, p_kind text, p_dedupe_key text, p_payload jsonb\)\s+returns uuid/,
        )
        expect(fn).toMatch(/security definer\s+set search_path = ''/)
        expect(fn).toMatch(/public\.is_workspace_member\(p_workspace_id\)/)
        expect(fn).toMatch(/p_kind is distinct from 'seguro_baixo'/)
        expect(fn).toMatch(/public\.insights_silenciados/)
        expect(fn).toMatch(/values \(p_workspace_id, v_uid, p_kind, p_dedupe_key,/)
        expect(fn).toMatch(/on conflict do nothing/)
        expect(sql).toMatch(/grant execute on function public\.registrar_insight\(uuid, text, text, jsonb\) to authenticated;/)
    })

    it("virar_assinatura: invoker, marca acted, cria a assinatura e liga só os lançamentos soltos", () => {
        const fn = funcao("virar_assinatura")
        expect(fn).toMatch(
            /^create or replace function public\.virar_assinatura\(p_insight_id uuid, p_nome text, p_valor numeric, p_dia smallint, p_payment_method text, p_card_id uuid, p_category_id uuid\)\s+returns uuid/,
        )
        expect(fn).toMatch(/security invoker\s+set search_path = public/)
        expect(fn).toMatch(/perform public\.marcar_insight\(p_insight_id, 'acted'\);/)
        expect(fn).toMatch(/insert into public\.workspace_subscriptions/)
        // A primeira cobrança é a do dia seguinte a hoje, e o seed a lança nele.
        expect(fn).toMatch(/v_next <= v_hoje/)
        expect(fn).toMatch(/v_next, v_next,/)
        expect(fn).toMatch(/update public\.transactions t\s+set subscription_id = v_sub/)
        expect(fn).toMatch(/v_ins\.kind <> 'recorrencia'/)
        expect(fn).toMatch(/x\.subscription_id is null/)
        expect(fn).toMatch(/not exists \(select 1 from public\.bill_instances i where i\.transaction_id = x\.id\)/)
        expect(fn).toMatch(/for update/)
        // Uma cobrança por dia UTC: o de menor id, e nenhum no dia que a assinatura já cobra (o seed).
        expect(fn).toMatch(
            /select distinct on \(\(x\.date at time zone 'UTC'\)::date\) x\.id[\s\S]*?order by \(x\.date at time zone 'UTC'\)::date, x\.id/,
        )
        expect(fn).toMatch(
            /not exists \(\s*select 1 from public\.transactions y\s+where y\.subscription_id = v_sub\s+and \(y\.date at time zone 'UTC'\)::date = \(t\.date at time zone 'UTC'\)::date\s*\)/,
        )
        expect(sql).toMatch(
            /grant execute on function public\.virar_assinatura\(uuid, text, numeric, smallint, text, uuid, uuid\) to authenticated;/,
        )
    })

    it("virar_conta: invoker, marca acted, a conta, uma paga por lançamento solto e a próxima pendente", () => {
        const fn = funcao("virar_conta")
        expect(fn).toMatch(
            /^create or replace function public\.virar_conta\(p_insight_id uuid, p_nome text, p_dia smallint, p_valor_variavel boolean, p_category_id uuid, p_next_due_date date\)\s+returns uuid/,
        )
        expect(fn).toMatch(/security invoker\s+set search_path = public/)
        expect(fn).toMatch(/perform public\.marcar_insight\(p_insight_id, 'acted'\);/)
        expect(fn).toMatch(/v_ins\.kind not in \('recorrencia', 'sazonal'\)/)
        expect(fn).toMatch(/insert into public\.bills/)
        expect(fn).toMatch(/valor_variavel/)
        expect(fn).toMatch(/t\.subscription_id is null/)
        expect(fn).toMatch(/not exists \(select 1 from public\.bill_instances i where i\.transaction_id = t\.id\)/)
        expect(fn).toMatch(/for update/)
        expect(fn).toMatch(/'paid', t\.amount, t\.date, t\.amount, t\.payment_method, t\.payment_credit_card_id, t\.id/)
        expect(fn).toMatch(/p_next_due_date, 'pending', null\)\s+on conflict do nothing;/)
        expect(sql).toMatch(
            /grant execute on function public\.virar_conta\(uuid, text, smallint, boolean, uuid, date\) to authenticated;/,
        )
    })

    it("virar_conta valida o dia (1–31) e a próxima pendente, que nunca nasce antes de hoje", () => {
        const fn = funcao("virar_conta")
        const valida = fn.indexOf("perform public.marcar_insight")
        const dia = fn.indexOf("if p_dia is null or p_dia not between 1 and 31 then")
        const data = fn.indexOf("if p_next_due_date is null or p_next_due_date < public.app_today() then")
        expect(dia).toBeGreaterThan(-1)
        expect(data).toBeGreaterThan(-1)
        expect(dia).toBeLessThan(valida)
        expect(data).toBeLessThan(valida)
        expect(fn).toMatch(/raise exception 'INSIGHT_DIA_INVALIDO' using errcode = '22023';/)
        expect(fn).toMatch(/raise exception 'INSIGHT_DATA_INVALIDA' using errcode = '22023';/)
    })

    it("inserir_insights: só service_role, on conflict pela expressão do índice, devolve só as novas", () => {
        const fn = funcao("inserir_insights")
        expect(fn).toMatch(/^create or replace function public\.inserir_insights\(p_linhas jsonb\)\s+returns setof public\.insights/)
        expect(fn).toMatch(/security definer\s+set search_path = ''/)
        expect(fn).toMatch(
            /on conflict \(workspace_id, coalesce\(user_id, '00000000-0000-0000-0000-000000000000'::uuid\), kind, dedupe_key\) do nothing\s+returning \*;/,
        )
        expect(fn).toMatch(/public\.insights_silenciados/)
        expect(sql).toMatch(/revoke all on function public\.inserir_insights\(jsonb\) from public, anon, authenticated;/)
        expect(sql).toMatch(/grant execute on function public\.inserir_insights\(jsonb\) to service_role;/)
    })

    it("o aviso: o tipo 'insight' entra no check com os outros sete, e a preferência nasce ligada", () => {
        expect(sql).toMatch(
            /check \(type = any \(array\['transaction', 'budget', 'system', 'promotion', 'credit_card', 'bill', 'review', 'insight'\]\)\)\s+not valid;/,
        )
        expect(sql).toMatch(/alter table public\.notifications validate constraint notifications_type_check;/)
        expect(sql).toMatch(
            /alter table public\.workspace_member_notification_prefs\s+add column if not exists notify_insights boolean not null default true;/,
        )
    })

    it("o cron diário às 13h UTC", () => {
        expect(sql).toMatch(/'insights-daily', '0 13 \* \* \*',\s+\$cmd\$select public\.invoke_edge_function\('insights-daily'\)\$cmd\$/)
    })

    it("só acrescenta", () => {
        expect(sql).not.toMatch(/drop column/i)
        expect(sql).not.toMatch(/drop table/i)
    })
})
