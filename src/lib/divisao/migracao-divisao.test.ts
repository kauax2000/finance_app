import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"
import { politicasFinais, ultimasFuncoes } from "@/test/migracoes"

// O `semComentarios` corta comentário de JS; o `--` do SQL sai aqui, para as
// asserções de ausência não lerem a prosa da migração.
const MIGRACAO = "20261031130000_divisao.sql"
const sql = semComentarios(lerFonte(`supabase/migrations/${MIGRACAO}`)).replace(/--.*$/gm, "")
const tipos = lerFonte("src/types/database.ts")
const supabaseTs = lerFonte("src/lib/supabase.ts")

const ULTIMA = ultimasFuncoes()
const POLITICAS = politicasFinais()

function ultima(nome: string): string {
    const fn = ULTIMA.get(nome)
    expect(fn, nome).toBeDefined()
    expect(fn!.arquivo, nome).toBe(MIGRACAO)
    return fn!.texto
}

function politicasDe(tabela: string) {
    return [...POLITICAS.values()].filter((p) => p.tabela === `public.${tabela}`)
}

function gatilho(nome: string): string {
    const m = sql.match(new RegExp(`create trigger ${nome}\\s+([\\s\\S]*?);`))
    expect(m, nome).not.toBeNull()
    return m![1]
}

describe("migração divisão: quem pagou, partes, acerto e a saída do transaction_splits", () => {
    it("as colunas novas, sem repetir o split_mode da Tarefa 1", () => {
        expect(sql).toMatch(
            /alter table public\.transactions\s+add column if not exists paid_by uuid references auth\.users\(id\) on delete set null,\s+add column if not exists shares_manual boolean not null default false;/,
        )
        expect(sql).toMatch(/alter table public\.workspaces\s+add column if not exists split_since date;/)
        expect(sql).toMatch(
            /alter table public\.workspace_installment_plans\s+add column if not exists split_weights jsonb\s+constraint workspace_installment_plans_split_weights_array\s+check \(split_weights is null or pg_catalog\.jsonb_typeof\(split_weights\) = 'array'\);/,
        )
        expect(sql).not.toMatch(/split_mode text/)
    })

    it("Decisão 4: quem pagou é o autor, ou o sponsor_user_id do convidado", () => {
        const fn = ultima("definir_quem_pagou")
        expect(fn).toMatch(/security definer\s+set search_path = ''/)
        // O autor de antes: o `preserve_transactions_author` roda depois deste.
        expect(fn).toMatch(/v_autor uuid := case when tg_op = 'UPDATE' then old\.user_id else new\.user_id end;/)
        expect(fn).toMatch(/select wm\.role, wm\.sponsor_user_id into v_papel, v_responsavel/)
        expect(fn).toMatch(/elsif v_papel = 'guest' then\s+new\.paid_by := coalesce\(v_responsavel,/)
        expect(fn).toMatch(/elsif new\.paid_by is null then\s+new\.paid_by := v_autor;/)
        // Escolher alguém de fora dos adultos é recusado.
        expect(fn).toMatch(/and wm\.user_id = new\.paid_by\s+and wm\.role in \('owner', 'member'\)/)
        expect(fn).toMatch(/raise exception 'PAGADOR_INVALIDO'/)
        // A linha nasce automática.
        expect(fn).toMatch(/if tg_op = 'INSERT' then\s+new\.shares_manual := false;/)
        expect(gatilho("definir_quem_pagou")).toMatch(
            /^before insert or update on public\.transactions\s+for each row execute function public\.definir_quem_pagou\(\)$/,
        )
        expect(sql).toMatch(/revoke all on function public\.definir_quem_pagou\(\) from public, anon, authenticated;/)
    })

    it("o split_since é carimbado quando o modo vira split, e nunca apagado", () => {
        const fn = ultima("carimbar_split_since")
        expect(fn).toMatch(/if new\.split_mode = 'split' then\s+new\.split_since := coalesce\(new\.split_since, public\.app_today\(\)\);/)
        expect(fn).not.toMatch(/split_since := null/)
        expect(gatilho("carimbar_split_since")).toMatch(
            /^before insert or update of split_mode on public\.workspaces\s+for each row execute function public\.carimbar_split_since\(\)$/,
        )
    })

    it("Decisão 5: o algoritmo mora no dividir_em_partes — floor, o resto para quem pagou, senão o menor user_id", () => {
        const fn = ultima("dividir_em_partes")
        expect(fn).toMatch(
            /^create or replace function public\.dividir_em_partes\(p_total_centavos bigint, p_pesos jsonb, p_pagador uuid\)\s+returns table\(user_id uuid, centavos bigint\)/,
        )
        expect(fn).toMatch(/pg_catalog\.floor\(p_total_centavos \* p\.peso \/ sum\(p\.peso\) over \(\)\)::bigint as centavos/)
        expect(fn).toMatch(/select p_total_centavos - sum\(b\.centavos\)::bigint as centavos from base b/)
        expect(fn).toMatch(
            /coalesce\(\s*\(select b\.user_id from base b where b\.user_id = p_pagador\),\s*\(select b\.user_id from base b order by b\.user_id limit 1\)\s*\)/,
        )
        expect(fn).toMatch(/b\.centavos \+ case when b\.user_id = q\.user_id then r\.centavos else 0 end/)
        expect(sql).toMatch(/revoke all on function public\.dividir_em_partes\(bigint, jsonb, uuid\) from public, anon, authenticated;/)
    })

    it("Decisão 5: refazer_partes divide entre os adultos, a partir do split_since e fora do manual", () => {
        const fn = ultima("refazer_partes")
        expect(fn).toMatch(/^create or replace function public\.refazer_partes\(p_transaction_id uuid\)\s+returns void/)
        expect(fn).toMatch(/security definer\s+set search_path = ''/)
        expect(fn).toMatch(/if not found or v_manual then\s+return;/)
        expect(fn).toMatch(/select w\.split_mode, w\.split_since into v_modo, v_desde/)
        expect(fn).toMatch(/v_tipo <> 'expense'/)
        expect(fn).toMatch(/\(v_data at time zone 'America\/Sao_Paulo'\)::date < v_desde/)
        expect(fn).toMatch(/v_modo is distinct from 'split'/)
        expect(fn).toMatch(/wm\.role in \('owner', 'member'\)/)
        expect(fn).not.toMatch(/'guest'/)
        expect(fn).toMatch(
            /from public\.dividir_em_partes\(pg_catalog\.round\(v_valor \* 100\)::bigint, v_pesos, v_pagador\) d;/,
        )
        // Os pesos do plano antes dos da carteira; sem linha, peso 1.
        expect(fn.indexOf("p.split_weights")).toBeGreaterThan(-1)
        expect(fn.indexOf("p.split_weights")).toBeLessThan(fn.indexOf("if v_pesos is null then"))
        expect(fn.indexOf("if v_pesos is null then")).toBeLessThan(fn.indexOf("public.workspace_split_weights"))
        expect(fn).toMatch(/where p\.id = v_plano/)
        expect(fn).toMatch(/coalesce\(sw\.weight, 1\)/)
        expect(fn).not.toMatch(/auth\.uid\(\)/)
        expect(sql).toMatch(/revoke all on function public\.refazer_partes\(uuid\) from public, anon, authenticated;/)
    })

    it("gerar_partes é after insert or update de toda origem e chama refazer_partes", () => {
        const fn = ultima("gerar_partes")
        expect(fn).toMatch(/security definer\s+set search_path = ''/)
        expect(fn).toMatch(/perform public\.refazer_partes\(new\.id\);/)
        // Mudar de carteira começa do zero: as partes da outra casa saem antes.
        expect(fn).toMatch(
            /if tg_op = 'UPDATE' and new\.workspace_id is distinct from old\.workspace_id then\s+delete from public\.transaction_shares s where s\.transaction_id = new\.id;/,
        )
        const g = gatilho("gerar_partes")
        expect(g).toMatch(
            /^after insert or update of amount, paid_by, type, date, workspace_id, installment_plan_id, shares_manual, is_private\s+on public\.transactions\s+for each row execute function public\.gerar_partes\(\)$/,
        )
        // Toda origem passa: sem `when`, sem depender de quem chama.
        expect(g).not.toMatch(/\bwhen\b/)
        expect(fn).not.toMatch(/auth\.uid\(\)/)
        expect(sql).toMatch(/revoke all on function public\.gerar_partes\(\) from public, anon, authenticated;/)
    })

    it("Ruling 2: as partes não leem o que o 7B mascara e só escrevem em transaction_shares", () => {
        for (const nome of ["gerar_partes", "refazer_partes"]) {
            const fn = ultima(nome)
            expect(fn, nome).not.toMatch(/description|category_id|capture_meta|transacoes_privadas/)
            const escritas = [...fn.matchAll(/\b(insert into|update|delete from) (public\.\w+)/g)].map((m) => m[2])
            expect(new Set(escritas), nome).toEqual(new Set(["public.transaction_shares"]))
        }
    })

    it("Ruling 4: a privada tem uma parte só, inteira do autor, que é quem pagou", () => {
        const fn = ultima("refazer_partes")
        expect(fn).toMatch(/t\.is_private/)
        expect(fn).toMatch(
            /if v_privada then\s+insert into public\.transaction_shares \(transaction_id, user_id, amount\)\s+values \(p_transaction_id, v_autor, v_valor\);\s+return;/,
        )
        // A privada sai antes dos pesos: ninguém divide o que não pode ver.
        expect(fn.indexOf("if v_privada then")).toBeLessThan(fn.indexOf("p.split_weights"))

        const pagou = ultima("definir_quem_pagou")
        expect(pagou).toMatch(/elsif new\.is_private then\s+new\.paid_by := v_autor;/)
        expect(pagou).toMatch(/and new\.is_private is not distinct from old\.is_private/)
        expect(pagou).toMatch(/or new\.is_private is distinct from old\.is_private/)
        // Nada legítimo deixa partes à mão numa privada: nem um update cru.
        expect(pagou).toMatch(/if new\.is_private then\s+new\.shares_manual := false;\s+end if;/)

        const definir = ultima("definir_partes")
        expect(definir).toMatch(/if v_privada then\s+raise exception 'PRIVADO_NAO_PERMITIDO'/)
        expect(definir.indexOf("if v_privada then")).toBeLessThan(definir.indexOf("if p_partes is null then"))
    })

    it("Ruling 5: os pesos do plano são validados na escrita, e as partes não quebram com um valor ruim", () => {
        const fn = ultima("validar_pesos_do_plano")
        expect(fn).toMatch(/security definer\s+set search_path = ''/)
        expect(fn).toMatch(/pg_catalog\.jsonb_typeof\(new\.split_weights\) <> 'array'/)
        expect(fn).toMatch(/pg_catalog\.jsonb_typeof\(e\) <> 'object'/)
        // Sem a chave `weight`, o typeof é nulo: `is distinct from` o pega, `<>` não.
        expect(fn).toMatch(/pg_catalog\.jsonb_typeof\(e -> 'weight'\) is distinct from 'number'/)
        expect(fn).not.toMatch(/jsonb_typeof\(e -> 'weight'\) <>/)
        expect(fn).toMatch(/coalesce\(e ->> 'user_id', ''\) !~\*/)
        expect(fn).toMatch(/\(e ->> 'weight'\)::numeric <= 0/)
        expect(fn).toMatch(/wm\.role in \('owner', 'member'\)/)
        expect(fn).toMatch(/count\(distinct pg_catalog\.lower\(e ->> 'user_id'\)\) <> count\(\*\)/)
        expect(fn).toMatch(/raise exception 'PESOS_INVALIDOS'/)
        expect(gatilho("validar_pesos_do_plano")).toMatch(
            /^before insert or update of split_weights, workspace_id on public\.workspace_installment_plans\s+for each row execute function public\.validar_pesos_do_plano\(\)$/,
        )
        // As partes leem com as conversões guardadas e um peso por pessoa.
        const refazer = ultima("refazer_partes")
        expect(refazer).toMatch(/case when e ->> 'user_id' ~\* '\^\[0-9a-f\]\{8\}-/)
        expect(refazer).toMatch(/case when pg_catalog\.jsonb_typeof\(e -> 'weight'\) = 'number' then \(e ->> 'weight'\)::numeric end/)
        expect(refazer).toMatch(/group by wm\.user_id/)
    })

    it("Ruling 6: mudar os pesos do plano refaz as partes automáticas das parcelas dele", () => {
        const fn = ultima("refazer_partes_do_plano")
        expect(fn).toMatch(/security definer\s+set search_path = ''/)
        expect(fn).toMatch(/where t\.installment_plan_id = new\.id\s+and not t\.shares_manual/)
        expect(fn).toMatch(/perform public\.refazer_partes\(v_id\);/)
        expect(gatilho("refazer_partes_do_plano")).toMatch(
            /^after update of split_weights on public\.workspace_installment_plans\s+for each row\s+when \(new\.split_weights is distinct from old\.split_weights\)\s+execute function public\.refazer_partes_do_plano\(\)$/,
        )
        // O `main` chama o criar_plano_parcelado: a assinatura não muda aqui.
        expect(sql).not.toMatch(/function public\.criar_plano_parcelado/)
    })

    it("origem que escapa do gatilho: nenhuma outra função escreve paid_by nem partes", () => {
        const donas = ["definir_quem_pagou", "gerar_partes", "refazer_partes", "refazer_partes_do_plano", "definir_partes", "saldos_da_carteira"]
        for (const [nome, { texto }] of ULTIMA) {
            if (donas.includes(nome)) continue
            expect(texto, nome).not.toMatch(/paid_by|transaction_shares/)
        }
    })

    it("definir_partes: só o adulto, PARTES_NAO_FECHAM, e nulo volta ao automático", () => {
        const fn = ultima("definir_partes")
        expect(fn).toMatch(/^create or replace function public\.definir_partes\(p_transaction_id uuid, p_partes jsonb\)\s+returns void/)
        expect(fn).toMatch(/security definer\s+set search_path = ''/)
        expect(fn).toMatch(/if v_ws is null or not public\.is_workspace_adult\(v_ws\) then\s+raise exception 'not a workspace adult' using errcode = '42501';/)
        expect(fn).toMatch(/if p_partes is null then\s+update public\.transactions set shares_manual = false where id = p_transaction_id;\s+return;/)
        expect(fn).toMatch(/if v_soma is distinct from v_valor then\s+raise exception 'PARTES_NAO_FECHAM'/)
        // Só entre os adultos.
        expect(fn).toMatch(/and wm\.user_id = \(e ->> 'user_id'\)::uuid\s+and wm\.role in \('owner', 'member'\)/)
        // A marca vem antes das partes: o gatilho vê a linha à mão e não a refaz.
        const marca = fn.indexOf("update public.transactions set shares_manual = true")
        expect(marca).toBeGreaterThan(fn.indexOf("PARTES_NAO_FECHAM"))
        expect(marca).toBeLessThan(fn.indexOf("insert into public.transaction_shares"))
        expect(sql).toMatch(/revoke all on function public\.definir_partes\(uuid, jsonb\) from public, anon;/)
        expect(sql).toMatch(/grant execute on function public\.definir_partes\(uuid, jsonb\) to authenticated;/)
    })

    it("Decisão 6 e Ruling 7: saldos_da_carteira só para o adulto, com quem saiu marcado, pago − partes + acertos", () => {
        const fn = ultima("saldos_da_carteira")
        expect(fn).toMatch(
            /^create or replace function public\.saldos_da_carteira\(p_workspace_id uuid\)\s+returns table\(user_id uuid, pago numeric, partes numeric, acertos numeric, saldo numeric, saiu boolean\)/,
        )
        expect(fn).toMatch(/security definer\s+set search_path = ''/)
        expect(fn).toMatch(/if not public\.is_workspace_adult\(p_workspace_id\) then\s+raise exception/)
        expect(fn).toMatch(/with adultos as \(\s*select wm\.user_id\s+from public\.workspace_members wm\s+where wm\.workspace_id = p_workspace_id\s+and wm\.role in \('owner', 'member'\)/)
        expect(fn).toMatch(/\(t\.date at time zone 'America\/Sao_Paulo'\)::date >= w\.split_since/)
        expect(fn).toMatch(/and exists \(select 1 from public\.transaction_shares s where s\.transaction_id = t\.id\)/)
        expect(fn).toMatch(/select d\.paid_by as user_id, sum\(d\.amount\) as valor/)
        expect(fn).toMatch(/select st\.from_user as user_id, st\.amount as valor/)
        expect(fn).toMatch(/select st\.to_user as user_id, -st\.amount as valor/)
        expect(fn).toMatch(/\(coalesce\(pg\.valor, 0\) - coalesce\(mi\.valor, 0\) \+ coalesce\(ac\.valor, 0\)\)::numeric/)
        // Ruling 7: todo mundo que aparece nas partes, nos pagamentos ou nos acertos, para Σ saldo = 0.
        const pessoas = fn.match(/pessoas as \(([\s\S]*?)\n  \)/)
        expect(pessoas).not.toBeNull()
        for (const fonte of ["from adultos", "from pagos", "from minhas", "from acertados"]) {
            expect(pessoas![1], fonte).toContain(fonte)
        }
        expect(fn).toMatch(/from pessoas pe\s+left join pagos/)
        expect(fn).toMatch(/not exists \(select 1 from adultos ad where ad\.user_id = pe\.user_id\)/)
        expect(sql).toMatch(/grant execute on function public\.saldos_da_carteira\(uuid\) to authenticated;/)
    })

    it("transaction_shares: o adulto lê, ninguém escreve direto", () => {
        expect(sql).toMatch(
            /create table if not exists public\.transaction_shares \(\s+transaction_id uuid not null references public\.transactions\(id\) on delete cascade,\s+user_id uuid not null,\s+amount numeric\(15, 2\) not null,\s+primary key \(transaction_id, user_id\)\s+\);/,
        )
        expect(sql).toMatch(/alter table public\.transaction_shares enable row level security;/)
        expect(sql).toMatch(/revoke insert, update, delete, truncate on public\.transaction_shares from authenticated;/)
        const lista = politicasDe("transaction_shares")
        expect(lista.map((p) => p.comando)).toEqual(["select"])
        expect(lista[0].texto).toMatch(/public\.is_workspace_adult\(t\.workspace_id\)/)
        expect(lista[0].texto).not.toMatch(/is_workspace_member/)
    })

    it("workspace_split_weights: peso positivo; o adulto lê, só o dono escreve, e só o peso de um adulto (T4 I2)", () => {
        expect(sql).toMatch(/weight numeric\(6, 2\) not null check \(weight > 0\),\s+primary key \(workspace_id, user_id\)/)
        const lista = politicasDe("workspace_split_weights")
        expect(lista.map((p) => p.comando).sort()).toEqual(["delete", "insert", "select", "update"])
        const de = (comando: string) => lista.find((p) => p.comando === comando)!.texto
        expect(de("select")).toMatch(/public\.is_workspace_adult\(workspace_id\)/)
        for (const comando of ["insert", "update", "delete"]) {
            expect(de(comando), comando).toMatch(/public\.is_workspace_owner\(workspace_id\)/)
            expect(de(comando), comando).not.toMatch(/is_workspace_adult|is_workspace_member/)
        }
        // O peso guardado é de um adulto da carteira, no insert e no with check do update.
        const adulto =
            /wm\.workspace_id = workspace_split_weights\.workspace_id and wm\.user_id = workspace_split_weights\.user_id and wm\.role in \('owner', 'member'\)/
        expect(de("insert")).toMatch(adulto)
        expect(de("update")).toMatch(new RegExp(`with check \\(.*${adulto.source}`))
        for (const p of lista) expect(p.texto, p.comando).not.toMatch(/is_workspace_member/)
    })

    it("settlements: select e insert do adulto, delete só de quem criou, sem update", () => {
        const tabela = sql.match(/create table if not exists public\.settlements \(([\s\S]*?)\n\);/)
        expect(tabela).not.toBeNull()
        const c = tabela![1]
        expect(c).toMatch(/amount numeric\(12, 2\) not null check \(amount > 0\)/)
        expect(c).toMatch(/settled_on date not null default public\.app_today\(\)/)
        expect(c).toMatch(/check \(from_user <> to_user\)/)
        expect(sql).toMatch(/revoke update, truncate on public\.settlements from authenticated;/)

        const lista = politicasDe("settlements")
        expect(lista.map((p) => p.comando).sort()).toEqual(["delete", "insert", "select"])
        const de = (comando: string) => lista.find((p) => p.comando === comando)!.texto
        for (const comando of ["select", "insert", "delete"]) {
            expect(de(comando), comando).toMatch(/public\.is_workspace_adult\(workspace_id\)/)
            expect(de(comando), comando).not.toMatch(/is_workspace_member/)
        }
        expect(de("insert")).toMatch(/created_by = \(select auth\.uid\(\)\)/)
        // Ruling 8: quem grava é adulto atual e uma das duas partes; a outra é
        // quem aparece no saldo da carteira (adultos, partes, pagamentos, acertos).
        expect(de("insert")).toMatch(/\(select auth\.uid\(\)\) in \(from_user, to_user\)/)
        for (const lado of ["from_user", "to_user"]) {
            expect(de("insert"), lado).toMatch(
                new RegExp(`exists \\( select 1 from public\\.saldos_da_carteira\\(settlements\\.workspace_id\\) s where s\\.user_id = settlements\\.${lado} \\)`),
            )
        }
        expect(de("insert")).not.toMatch(/wm\.role in/)
        // A política chama a função: o `create policy` só resolve o nome se ela já existe.
        expect(sql.indexOf("create policy settlements_insert")).toBeGreaterThan(
            sql.indexOf("create or replace function public.saldos_da_carteira"),
        )
        expect(de("delete")).toMatch(/created_by = \(select auth\.uid\(\)\)/)
    })

    it("I1: sem paid_by, quem pagou é o autor, nas partes e no saldo (Σ saldo = 0)", () => {
        const refazer = ultima("refazer_partes")
        expect(refazer).toMatch(
            /select t\.amount, coalesce\(t\.paid_by, t\.user_id\), t\.user_id, t\.type, t\.date, t\.workspace_id, t\.installment_plan_id, t\.is_private, t\.shares_manual\s+into v_valor, v_pagador,/,
        )
        // O plano refaz pela mesma função: o pagador é resolvido num lugar só.
        expect(ultima("refazer_partes_do_plano")).toMatch(/perform public\.refazer_partes\(v_id\);/)
        expect(ultima("refazer_partes_do_plano")).not.toMatch(/paid_by/)
        const saldos = ultima("saldos_da_carteira")
        expect(saldos).toMatch(/despesas as \(\s*select t\.id, t\.amount, coalesce\(t\.paid_by, t\.user_id\) as paid_by\s+from public\.transactions t/)
        expect(saldos).not.toMatch(/select t\.id, t\.amount, t\.paid_by\b/)
    })

    it("Ruling 10: valor, tipo ou carteira mudando zeram o shares_manual, venha de onde vier", () => {
        const fn = ultima("definir_quem_pagou")
        // Sem exigir a marca antiga: um update cru que liga a marca e muda o valor na mesma frase também volta.
        expect(fn).not.toMatch(/old\.shares_manual/)
        const bloco = fn.match(/elsif new\.shares_manual and \(([\s\S]*?)\) then\s+new\.shares_manual := false;/)
        expect(bloco).not.toBeNull()
        for (const coluna of ["amount", "type", "workspace_id", "is_private"]) {
            expect(bloco![1], coluna).toContain(`new.${coluna} is distinct from old.${coluna}`)
        }
    })

    it("M1: a linha à mão que vai para antes do split_since perde as partes e a marca", () => {
        const fn = ultima("definir_quem_pagou")
        const bloco = fn.match(/elsif new\.shares_manual and \(([\s\S]*?)\) then\s+new\.shares_manual := false;/)
        expect(bloco![1]).toMatch(
            /new\.date is distinct from old\.date and not exists \(\s*select 1 from public\.workspaces w\s+where w\.id = new\.workspace_id\s+and w\.split_since is not null\s+and \(new\.date at time zone 'America\/Sao_Paulo'\)::date >= w\.split_since/,
        )
        // Sem a marca, o refazer_partes chega ao ramo "fora da divisão" e apaga.
        expect(ultima("refazer_partes")).toMatch(/< v_desde then\s+delete from public\.transaction_shares/)
    })

    it("M2: definir_partes confere a forma antes de converter, e o 22P02 vira PARTES_INVALIDAS", () => {
        const fn = ultima("definir_partes")
        const forma = fn.indexOf("jsonb_typeof(e -> 'amount') is distinct from 'number'")
        expect(forma).toBeGreaterThan(-1)
        expect(fn).toMatch(/pg_catalog\.jsonb_typeof\(e\) <> 'object'/)
        expect(fn).toMatch(/coalesce\(e ->> 'user_id', ''\) !~\* '\^\[0-9a-f\]\{8\}-/)
        // A forma vem antes de qualquer conversão.
        expect(forma).toBeLessThan(fn.indexOf("::uuid"))
        expect(forma).toBeLessThan(fn.indexOf("::numeric"))
        expect(fn).toMatch(/count\(distinct pg_catalog\.lower\(e ->> 'user_id'\)\) <> count\(\*\)/)
    })

    it("Decisão 7: a guarda de tabela vazia antes do drop do transaction_splits, e nenhum outro drop", () => {
        const guarda = sql.indexOf("execute 'select exists (select 1 from public.transaction_splits)' into v_tem_linha;")
        const erro = sql.indexOf("raise exception 'transaction_splits tem linhas")
        const drop = sql.indexOf("drop table if exists public.transaction_splits;")
        expect(guarda).toBeGreaterThan(-1)
        expect(guarda).toBeLessThan(erro)
        expect(erro).toBeLessThan(drop)
        expect([...sql.matchAll(/drop table/gi)]).toHaveLength(1)
        expect(sql).not.toMatch(/drop (column|function|constraint|index|view|schema)\b/i)
        expect(sql).not.toMatch(/\bcascade;/)
        for (const m of sql.matchAll(/drop (policy|trigger) if exists ("[^"]+"|\w+) on [\w.]+;/g)) {
            expect(sql, m[0]).toContain(`create ${m[1]} ${m[2]}`)
        }
    })

    it("I4: o pgTAP da divisão cobre os exemplos, o convidado, a privada, o manual e quem saiu", () => {
        const pg = lerFonte("supabase/tests/database/divisao.test.sql")
        expect(pg).toMatch(/^-- pgTAP/)
        expect(pg).toMatch(/begin;\nselect plan\(\d+\);/)
        expect(pg).toMatch(/select \* from finish\(\);\nrollback;\s*$/)
        for (const marca of [
            "dividir_em_partes(10000",
            "dividir_em_partes(1000",
            "sponsor_user_id",
            "is_private",
            "PARTES_NAO_FECHAM",
            "PESOS_INVALIDOS",
            "saldos_da_carteira",
            "saiu",
            "PRIVADO_NAO_PERMITIDO",
            "set split_mode = 'pooled'",
            "antes do split_since",
            "volta ao automático",
            "sem a chave weight",
            "pula a linha à mão",
            "desmarcar a privada",
            "paid_by nulo",
            "disable trigger definir_quem_pagou",
            "shares_manual = true, amount",
            "acerto com quem saiu",
            "quem grava não é uma das partes",
            "peso escrito por quem não é dono",
            "peso de quem não é adulto",
            "PARTES_INVALIDAS",
            "para antes do split_since",
        ]) {
            expect(pg, marca).toContain(marca)
        }
    })

    it("os tipos: sem transaction_splits, com as tabelas, as colunas e as RPCs novas", () => {
        expect(tipos).not.toMatch(/transaction_splits/)
        expect(supabaseTs).not.toMatch(/TransactionSplit\b/)
        for (const tabela of ["transaction_shares", "settlements", "workspace_split_weights"]) {
            expect(tipos, tabela).toMatch(new RegExp(`\\n      ${tabela}: \\{\\s+Row: \\{`))
        }
        for (const coluna of ["paid_by: string | null", "shares_manual: boolean", "split_since: string | null", "split_weights: Json | null"]) {
            expect(tipos, coluna).toContain(coluna)
        }
        expect(tipos).toMatch(/definir_partes: \{\s+Args: \{ p_partes: Json; p_transaction_id: string \}\s+Returns: undefined/)
        expect(tipos).toMatch(/saldos_da_carteira: \{\s+Args: \{ p_workspace_id: string \}\s+Returns: \{\s+acertos: number\s+pago: number\s+partes: number\s+saiu: boolean\s+saldo: number/)
        expect(supabaseTs).toMatch(/export interface TransactionShare \{/)
        expect(supabaseTs).toMatch(/export interface Settlement \{/)
    })
})
