import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"

// O `semComentarios` corta comentário de JS; o `--` do SQL sai aqui, para as
// asserções de ausência não lerem a prosa da migração.
const sql = semComentarios(lerFonte("supabase/migrations/20261025120000_planos.sql")).replace(/--.*$/gm, "")
const tipos = lerFonte("src/types/database.ts")

function funcao(nome: string): string {
    const fn = sql.match(new RegExp(`create or replace function public\\.${nome}\\([\\s\\S]*?\\n\\$\\$;`))
    expect(fn, nome).not.toBeNull()
    return fn![0]
}

/** O corpo entre o primeiro `begin` (ou `as $$`) e o fim. */
function corpo(nome: string): string {
    const fn = funcao(nome)
    return fn.slice(fn.indexOf("as $$"))
}

describe("migração planos", () => {
    it("as três tabelas são só da service role", () => {
        for (const tabela of ["billing_settings", "billing_subscriptions", "billing_avisos"]) {
            expect(sql).toMatch(new RegExp(`create table if not exists public\\.${tabela} \\(`))
            expect(sql).toMatch(new RegExp(`alter table public\\.${tabela} enable row level security;`))
            expect(sql).toMatch(new RegExp(`revoke all on public\\.${tabela} from anon, authenticated;`))
            expect(sql).not.toMatch(new RegExp(`create policy[^;]*on public\\.${tabela}\\b`))
            expect(sql).not.toMatch(new RegExp(`grant [^;]*on (table )?public\\.${tabela}\\b`))
        }
    })

    it("billing_settings é uma linha só, nascida sem enforced_since", () => {
        expect(sql).toMatch(/id boolean primary key default true check \(id\)/)
        expect(sql).toMatch(/enforced_since timestamptz\s*\)/)
        expect(sql).toMatch(/insert into public\.billing_settings \(id\) values \(true\)\s+on conflict \(id\) do nothing;/)
    })

    it("billing_subscriptions: uma linha por pessoa, os provedores e os status", () => {
        expect(sql).toMatch(/user_id uuid not null unique references auth\.users\(id\) on delete cascade/)
        expect(sql).toMatch(/provider text not null check \(provider in \('asaas', 'manual', 'apple', 'google'\)\)/)
        expect(sql).toMatch(/plan text not null default 'familia' check \(plan = 'familia'\)/)
        // `interval` é palavra-chave: entre aspas, o nome da coluna é o mesmo.
        expect(sql).toMatch(/"interval" text not null default 'year' check \("interval" = 'year'\)/)
        expect(sql).toMatch(/status text not null check \(status in \('pending', 'active', 'past_due', 'expired'\)\)/)
        expect(sql).toMatch(/cancel_at_period_end boolean not null default false/)
        expect(sql).toMatch(/founder boolean not null default false/)
        expect(sql).toMatch(/primary key \(user_id, tipo, referencia\)/)
    })

    it("user_settings ganha jornada_concluida_em", () => {
        expect(sql).toMatch(/alter table public\.user_settings\s+add column if not exists jornada_concluida_em timestamptz;/)
    })

    it("tem_plano_proprio: ativa no período ou em atraso dentro da carência", () => {
        const fn = funcao("tem_plano_proprio")
        expect(fn).toMatch(/b\.status = 'active' and \(b\.current_period_end is null or b\.current_period_end > now\(\)\)/)
        expect(fn).toMatch(/b\.status = 'past_due' and b\.grace_until > now\(\)/)
    })

    it("plano_do_usuario e workspace_plan começam pelo atalho do enforced_since nulo", () => {
        for (const nome of ["plano_do_usuario", "workspace_plan"]) {
            const c = corpo(nome)
            const atalho = c.search(/if v_enforced_since is null then\s+return 'familia';/)
            expect(atalho, nome).toBeGreaterThan(-1)
            // A única leitura antes do atalho é a do billing_settings.
            const antes = c.slice(0, atalho)
            expect(antes.match(/\bfrom public\.\w+/g)).toEqual(["from public.billing_settings"])
            expect(antes).not.toMatch(/auth\.users|tem_plano_proprio|plano_do_usuario|workspace_members/)
        }
    })

    it("plano_do_usuario: plano próprio, teste de 14 dias, cobertura de 5, senão leitura", () => {
        const c = corpo("plano_do_usuario")
        const passos = [
            c.indexOf("public.tem_plano_proprio(p_user_id)"),
            c.search(/greatest\(u\.created_at, v_enforced_since\) \+ interval '14 days' > now\(\)/),
            c.indexOf("public.tem_cobertura(p_user_id)"),
            c.indexOf("return 'leitura';"),
        ]
        for (const p of passos) expect(p).toBeGreaterThan(-1)
        expect([...passos].sort((a, b) => a - b)).toEqual(passos)
    })

    it("a cobertura: as 5 primeiras pessoas distintas das carteiras de que o assinante é dono", () => {
        const fn = funcao("tem_cobertura")
        expect(fn).toMatch(/public\.tem_plano_proprio\(a\.assinante\)/)
        expect(fn).toMatch(/d\.role = 'owner'/)
        expect(fn).toMatch(/m\.user_id <> d\.user_id/)
        expect(fn).toMatch(/order by min\(m\.joined_at\), m\.user_id\s+limit 5/)
    })

    it("workspace_plan mantém a assinatura e os grants do stub", () => {
        const fn = funcao("workspace_plan")
        expect(fn).toMatch(/public\.workspace_plan\(p_workspace_id uuid\)\s+returns text/)
        expect(fn).toMatch(/wm\.role = 'owner'/)
        expect(fn).toMatch(/public\.plano_do_usuario\(wm\.user_id\) = 'familia'/)
        expect(sql).toMatch(/grant execute on function public\.workspace_plan\(uuid\) to authenticated, service_role;/)
    })

    it("garantir_escrita deixa o cron passar e barra a pessoa em só leitura", () => {
        const c = corpo("garantir_escrita")
        const cron = c.indexOf("if auth.uid() is null then")
        const plano = c.indexOf("public.workspace_plan(coalesce(new.workspace_id, old.workspace_id)) = 'leitura'")
        expect(cron).toBeGreaterThan(-1)
        expect(plano).toBeGreaterThan(cron)
        expect(c).toMatch(/raise exception 'workspace_somente_leitura' using errcode = 'P0001';/)
        expect(c).toMatch(/if tg_op = 'DELETE' then\s+return old;/)
        expect(funcao("garantir_escrita")).toMatch(/security definer/)
    })

    it("a cascata passa: a exclusão de carteira, cartão ou categoria já foi permitida", () => {
        const c = corpo("garantir_escrita")
        const cron = c.indexOf("if auth.uid() is null then")
        const cascata = c.search(/if pg_trigger_depth\(\) > 1 then\s+if tg_op = 'DELETE' then\s+return old;\s+end if;\s+return new;/)
        const plano = c.indexOf("public.workspace_plan(")
        expect(cascata).toBeGreaterThan(cron)
        expect(plano).toBeGreaterThan(cascata)
    })

    it("o lançamento contratado passa: assinatura ou parcela em transactions", () => {
        const c = corpo("garantir_escrita")
        const contratado = c.search(
            /if tg_table_name = 'transactions' and tg_op = 'INSERT' then\s+if new\.subscription_id is not null or new\.installment_plan_id is not null then\s+return new;/,
        )
        expect(contratado).toBeGreaterThan(-1)
        expect(c.indexOf("public.workspace_plan(")).toBeGreaterThan(contratado)
        // Nas outras tabelas o registro não tem `subscription_id`: a leitura fica num `if` aninhado.
        expect(c).not.toMatch(/tg_table_name = 'transactions'[^\n]*subscription_id/)
    })

    it("os quatro gatilhos de escrita, com criar assinatura entre eles", () => {
        expect(sql).toMatch(
            /create trigger garantir_escrita before insert or update or delete on public\.transactions\s+for each row execute function public\.garantir_escrita\(\);/,
        )
        for (const tabela of ["workspace_installment_plans", "workspace_subscriptions", "attachments"]) {
            expect(sql).toMatch(
                new RegExp(
                    `create trigger garantir_escrita before insert on public\\.${tabela}\\s+for each row execute function public\\.garantir_escrita\\(\\);`,
                ),
            )
        }
        expect(sql.match(/create trigger garantir_escrita\b/g)).toHaveLength(4)
    })

    it("origem_do_cron grava 'recurring' em todo lançamento de assinatura ou parcela que chega como app", () => {
        const c = corpo("origem_do_cron")
        expect(c).toMatch(
            /if new\.source = 'app'\s+and \(new\.subscription_id is not null or new\.installment_plan_id is not null\) then\s+new\.source := 'recurring';/,
        )
        // Vale também para o catch-up do navegador, que roda com a pessoa logada.
        expect(c).not.toMatch(/auth\.uid\(\)/)
        expect(sql).toMatch(
            /create trigger origem_do_cron before insert on public\.transactions\s+for each row execute function public\.origem_do_cron\(\);/,
        )
    })

    it("meu_plano é da pessoa logada", () => {
        const fn = funcao("meu_plano")
        expect(fn).toMatch(/returns jsonb/)
        expect(fn).toMatch(/security definer/)
        expect(fn).toMatch(/auth\.uid\(\)/)
        for (const chave of ["plano", "origem", "status", "teste_ate", "periodo_ate", "cancelar_no_fim", "preco_centavos", "fundador"]) {
            expect(fn).toContain(`'${chave}'`)
        }
        for (const origem of ["livre", "assinatura", "vitalicio", "teste", "convite", "nenhuma"]) {
            expect(fn).toContain(`'${origem}'`)
        }
        expect(sql).toMatch(/revoke all on function public\.meu_plano\(\) from public, anon;/)
        expect(sql).toMatch(/grant execute on function public\.meu_plano\(\) to authenticated;/)
    })

    it("avisos_de_teste_pendentes: dias 12 a 14, sem plano nem cobertura, vazio sem enforced_since", () => {
        const fn = funcao("avisos_de_teste_pendentes")
        expect(fn).toMatch(/returns table\s*\(\s*user_id uuid,\s*email text,\s*workspace_id uuid,\s*fim_do_teste timestamptz,\s*relatorio jsonb\s*\)/)
        expect(fn).toMatch(/s\.enforced_since is not null/)
        expect(fn).toMatch(/interval '12 days' <= now\(\)/)
        expect(fn).toMatch(/now\(\) < [^\n]*interval '14 days'/)
        expect(fn).toMatch(/not public\.tem_plano_proprio\(c\.id\)/)
        expect(fn).toMatch(/not public\.tem_cobertura\(c\.id\)/)
        expect(fn).toMatch(/w\.type = 'personal' and w\.created_by = c\.id/)
        for (const chave of ["lancados_sozinho", "a_conferir", "avisos"]) expect(fn).toContain(`'${chave}'`)
        expect(fn).toMatch(/t\.source <> 'app'/)
        expect(fn).toMatch(/t\.needs_review/)
        expect(fn).toMatch(/from public\.notifications n/)
    })

    it("o que é interno fica só com a service role", () => {
        for (const assinatura of [
            "billing_lancar\\(\\)",
            "avisos_de_teste_pendentes\\(\\)",
            "tem_plano_proprio\\(uuid\\)",
            "plano_do_usuario\\(uuid\\)",
            "tem_cobertura\\(uuid\\)",
        ]) {
            expect(sql).toMatch(new RegExp(`revoke all on function public\\.${assinatura} from public, anon, authenticated;`))
            expect(sql).toMatch(new RegExp(`grant execute on function public\\.${assinatura} to service_role;`))
        }
        expect(corpo("billing_lancar")).toMatch(
            /update public\.billing_settings\s+set enforced_since = now\(\)\s+where enforced_since is null;/,
        )
    })

    it("toda função fixa o search_path vazio", () => {
        const funcoes = sql.match(/create or replace function public\.\w+\([\s\S]*?\nas \$\$/g) ?? []
        expect(funcoes).toHaveLength(9)
        expect(funcoes).toHaveLength(sql.match(/create or replace function/g)!.length)
        for (const f of funcoes) expect(f).toMatch(/set search_path = ''/)
    })

    it("agenda o billing-daily", () => {
        expect(sql).toMatch(/where j\.jobname = 'billing-daily'/)
        expect(sql).toMatch(
            /'billing-daily', '0 12 \* \* \*',\s*\$cmd\$select public\.invoke_edge_function\('billing-daily'\)\$cmd\$/,
        )
    })

    it("é aditiva", () => {
        expect(sql).not.toMatch(/drop column/i)
        expect(sql).not.toMatch(/alter column[^;]*\btype\b/i)
        expect(sql).not.toMatch(/drop table/i)
    })

    it("os tipos à mão conhecem as tabelas, a coluna e as funções", () => {
        for (const nome of [
            "billing_subscriptions",
            "billing_settings",
            "billing_avisos",
            "jornada_concluida_em",
            "meu_plano: { Args: never; Returns: Json }",
            "plano_do_usuario",
            "tem_plano_proprio",
        ]) {
            expect(tipos).toContain(nome)
        }
    })
})
