import { existsSync, readdirSync } from "node:fs"
import { resolve } from "node:path"
import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"
import { ultimasFuncoes } from "@/test/migracoes"

// O `--` do SQL sai aqui, para as asserções de ausência não lerem a prosa.
const MIGRACAO = "20261102120000_bloco9.sql"
const CAMINHO = `supabase/migrations/${MIGRACAO}`
const sql = existsSync(resolve(process.cwd(), CAMINHO))
    ? semComentarios(lerFonte(CAMINHO)).replace(/--.*$/gm, "")
    : ""
const tipos = lerFonte("src/types/database.ts")
const aceite = semComentarios(lerFonte("supabase/functions/workspace-invites-accept/index.ts"))
const captura = semComentarios(lerFonte("supabase/functions/capture/index.ts"))

const ULTIMA = ultimasFuncoes()

/** A última definição, e ela tem de morar nesta migração. */
function daqui(nome: string): string {
    const fn = ULTIMA.get(nome)
    expect(fn?.arquivo, nome).toBe(MIGRACAO)
    return fn!.texto
}

describe(`migração ${MIGRACAO}`, () => {
    it("ordena depois da cobrança do Asaas", () => {
        const todas = readdirSync(resolve(process.cwd(), "supabase/migrations")).filter((f) => f.endsWith(".sql")).sort()
        expect(todas.indexOf(MIGRACAO)).toBeGreaterThan(todas.indexOf("20261101120000_cobranca_asaas.sql"))
    })

    it("só acrescenta: a única coisa que cai é a assinatura antiga do criar_plano_parcelado", () => {
        expect(sql).not.toBe("")
        expect(sql).not.toMatch(/drop column/i)
        expect(sql).not.toMatch(/drop table/i)
        expect(sql).not.toMatch(/alter column[^;]*\btype\b/i)
        expect(sql.match(/drop function/gi)).toHaveLength(1)
    })

    it("Decisão 2: o titular que sai ou vira convidado deixa de ser titular", () => {
        const c = daqui("soltar_titular_que_sai")
        expect(c).toMatch(/security definer\s+set search_path = ''/)
        expect(c).toMatch(/if pg_trigger_depth\(\) > 1 then\s+return null;/)
        expect(c).toMatch(/if tg_op = 'UPDATE' and new\.role in \('owner', 'member'\) then\s+return null;/)
        expect(c).toMatch(/not exists \(select 1 from public\.workspaces w where w\.id = old\.workspace_id\)/)
        expect(c).toMatch(
            /update public\.credit_cards\s+set holder_user_id = null\s+where workspace_id = old\.workspace_id\s+and holder_user_id = old\.user_id;/,
        )
        expect(sql).toMatch(
            /create trigger soltar_titular_que_sai\s+after delete or update of role on public\.workspace_members\s+for each row\s+when \(old\.role in \('owner', 'member'\)\)\s+execute function public\.soltar_titular_que_sai\(\);/,
        )
        expect(sql).toMatch(/revoke all on function public\.soltar_titular_que_sai\(\) from public, anon, authenticated;/)
    })

    it("Decisão 3: quem não é adulto só anexa o objeto que ele mesmo subiu", () => {
        const c = daqui("attachments_enforce_quota")
        expect(c).toMatch(/select \(o\.metadata->>'size'\)::bigint, o\.owner_id into v_tamanho, v_dono/)
        const dono = c.search(
            /if auth\.uid\(\) is not null\s+and not public\.is_workspace_adult\(new\.workspace_id\)\s+and v_dono is distinct from auth\.uid\(\)::text then\s+raise exception 'anexo_de_outro' using errcode = '42501';/,
        )
        expect(dono).toBeGreaterThan(c.indexOf("raise exception 'anexo_sem_objeto'"))
        // As regras do 3B continuam: o tamanho é o do objeto, a trava e a cota.
        expect(c).toMatch(/new\.size_bytes := v_tamanho;/)
        expect(c).toMatch(/perform pg_advisory_xact_lock\(hashtext\('attachments_quota:' \|\| new\.workspace_id::text\)\);/)
        expect(c).toMatch(/if v_usado \+ new\.size_bytes > 26214400 then\s+raise exception 'cota_anexos_excedida'/)
        expect(c).toMatch(/security definer\s+set search_path = ''/)
    })

    it("Decisão 4: quem saiu como convidado fica lembrado, sem acesso do cliente", () => {
        expect(sql).toMatch(
            /create table if not exists public\.workspace_ex_convidados \(\s*workspace_id uuid not null references public\.workspaces\(id\) on delete cascade,\s*user_id uuid not null references auth\.users\(id\) on delete cascade,\s*saiu_em timestamptz not null default now\(\),\s*primary key \(workspace_id, user_id\)\s*\);/,
        )
        expect(sql).toMatch(/alter table public\.workspace_ex_convidados enable row level security;/)
        expect(sql).toMatch(/revoke all on public\.workspace_ex_convidados from anon, authenticated;/)
        expect(sql).not.toMatch(/policy[^;]*workspace_ex_convidados/i)
        expect(sql).not.toMatch(/grant[^;]*on (table )?public\.workspace_ex_convidados/i)

        const c = daqui("lembrar_ex_convidado")
        expect(c).toMatch(/security definer\s+set search_path = ''/)
        expect(c).toMatch(/if pg_trigger_depth\(\) > 1\s+or not exists \(select 1 from public\.workspaces w where w\.id = old\.workspace_id\) then/)
        expect(c).toMatch(
            /insert into public\.workspace_ex_convidados \(workspace_id, user_id\)\s+values \(old\.workspace_id, old\.user_id\)\s+on conflict \(workspace_id, user_id\) do update set saiu_em = now\(\);/,
        )
        expect(sql).toMatch(
            /create trigger lembrar_ex_convidado\s+after delete on public\.workspace_members\s+for each row\s+when \(old\.role = 'guest'\)\s+execute function public\.lembrar_ex_convidado\(\);/,
        )
    })

    it("Decisão 4: o link recusa o ex-convidado; o e-mail aceita e apaga a lembrança", () => {
        const c = daqui("accept_workspace_invite")
        const jaMembro = c.indexOf("'already_member'")
        const ex = c.search(
            /if v_invite\.invited_email is null and exists \(\s*select 1 from public\.workspace_ex_convidados x\s+where x\.workspace_id = v_invite\.workspace_id and x\.user_id = p_user_id\s*\) then\s+return jsonb_build_object\('status', 'ex_convidado', 'workspace_id', v_invite\.workspace_id\);/,
        )
        expect(ex).toBeGreaterThan(jaMembro)
        // Link revogado ou expirado responde o estado real, não o ex-convidado.
        expect(ex).toBeGreaterThan(c.indexOf("v_invite.expires_at < now()"))
        const entra = c.indexOf("insert into public.workspace_members")
        expect(ex).toBeLessThan(entra)
        const apaga = c.search(
            /delete from public\.workspace_ex_convidados\s+where workspace_id = v_invite\.workspace_id and user_id = p_user_id;/,
        )
        expect(apaga).toBeGreaterThan(entra)
        // O resto do aceite do 7A continua.
        for (const status of ["invalid_user", "not_found", "not_pending", "expired", "email_mismatch", "exhausted", "accepted"]) {
            expect(c, status).toContain(`'${status}'`)
        }
        expect(c).toMatch(/for update;/)
        expect(c).toMatch(/v_invite\.max_uses is not null and v_invite\.usage_count >= v_invite\.max_uses/)
        expect(c).toMatch(/values \(v_invite\.workspace_id, p_user_id, v_invite\.role,\s+case when v_invite\.role = 'guest' then v_invite\.created_by end\)/)
        expect(sql).toMatch(/grant execute on function public\.accept_workspace_invite\(text, uuid, text\) to service_role;/)
    })

    it("Decisão 5: o mesmo client_id dá o mesmo plano, com a chave gravada por dentro", () => {
        expect(sql).toMatch(
            /drop function if exists public\.criar_plano_parcelado\(uuid, uuid, uuid, text, text, uuid, integer, numeric, numeric, date, text, boolean\);/,
        )
        const c = daqui("criar_plano_parcelado")
        expect(c).toMatch(/p_source text default 'app',\s*p_needs_review boolean default false,\s*p_client_id uuid default null,\s*p_capture_meta jsonb default null\s*\)/)
        const trava = c.search(/perform pg_advisory_xact_lock\(hashtext\('plano:' \|\| p_client_id::text\)\);/)
        const existente = c.search(
            /select t\.installment_plan_id into v_plan_id\s+from public\.transactions t\s+join public\.workspace_members m on m\.workspace_id = t\.workspace_id and m\.user_id = p_user_id\s+where t\.client_id = p_client_id\s+and t\.installment_plan_id is not null/,
        )
        expect(trava).toBeGreaterThan(c.indexOf("raise exception 'Forbidden'"))
        expect(existente).toBeGreaterThan(trava)
        expect(c.indexOf("insert into public.workspace_installment_plans")).toBeGreaterThan(existente)
        expect(c).toMatch(
            /update public\.transactions\s+set client_id = p_client_id, capture_meta = p_capture_meta\s+where id = \(\s*select t\.id from public\.transactions t\s+where t\.installment_plan_id = v_plan_id\s+order by t\.date, t\.id\s+limit 1\s*\);/,
        )
        // O resto do 3B continua.
        expect(c).toMatch(/raise exception 'Invalid total_installments'/)
        expect(c).toMatch(/public\.charge_workspace_installment_plan_step\(v_plan_id\)/)
        expect(c).toMatch(/set source = coalesce\(p_source, 'app'\), needs_review = p_needs_review\s+where installment_plan_id = v_plan_id/)
        expect(c).not.toMatch(/auth\.uid\(\)/)

        const assinatura =
            "public.criar_plano_parcelado(uuid, uuid, uuid, text, text, uuid, integer, numeric, numeric, date, text, boolean, uuid, jsonb)"
        expect(sql).toContain(`revoke all on function ${assinatura} from public, anon, authenticated;`)
        expect(sql).toContain(`grant execute on function ${assinatura} to service_role;`)
        expect(sql.match(/grant execute on function public\.criar_plano_parcelado/g)).toHaveLength(1)
    })

    it("Decisão 5: o create_workspace_installment_plan do main não muda", () => {
        // O MCP (20261103130000) a estende depois, com três parâmetros de `default`.
        expect(ULTIMA.get("create_workspace_installment_plan")?.arquivo).toBe("20261103130000_mcp_token_somente_leitura.sql")
        expect(sql).not.toMatch(/create_workspace_installment_plan/)
    })

    it("Decisão 6: a só leitura cobre projeto, peso e limite", () => {
        expect(sql).toMatch(
            /create trigger garantir_escrita before insert or update on public\.projects\s+for each row execute function public\.garantir_escrita\(\);/,
        )
        for (const tabela of ["workspace_split_weights", "workspace_member_limits"]) {
            expect(sql, tabela).toMatch(
                new RegExp(
                    `create trigger garantir_escrita before insert or update or delete on public\\.${tabela}\\s+for each row execute function public\\.garantir_escrita\\(\\);`,
                ),
            )
        }
        expect(sql).not.toMatch(/create (or replace )?function public\.garantir_escrita/)
    })

    it("Decisão 12a: o aviso de cobrança pode ficar pendente", () => {
        expect(sql).toMatch(/alter table public\.billing_avisos\s+add column if not exists pendente boolean not null default false;/)
    })

    it("os tipos à mão conhecem o que nasceu", () => {
        expect(tipos).toContain("workspace_ex_convidados: {")
        expect(tipos).toMatch(/billing_avisos: \{\s*Row: \{[^}]*pendente: boolean/)
        expect(tipos).toMatch(/criar_plano_parcelado: \{\s*Args: \{[^}]*p_capture_meta\?: Json[^}]*p_client_id\?: string/)
    })
})

describe("Edges do Bloco 9", () => {
    it("o aceite responde 403 ao ex-convidado e mantém os outros caminhos", () => {
        expect(aceite).toMatch(/case 'ex_convidado':\s+return json\(403, \{ error: 'Peça ao dono um convite por e-mail\.' \}\)/)
        expect(aceite).toMatch(/case 'accepted':\s+break/)
        expect(aceite).toMatch(/default:\s+return json\(500, \{ error: 'Unexpected invite acceptance result' \}\)/)
        expect(aceite).toMatch(/case 'already_member':\s+return json\(200,/)
    })

    it("a captura passa o client_id à RPC e não grava a chave à parte", () => {
        const rpc = captura.match(/rpc\('criar_plano_parcelado', \{[\s\S]*?\}\)/)
        expect(rpc).not.toBeNull()
        expect(rpc![0]).toContain("p_client_id: clientId")
        expect(rpc![0]).toContain("p_capture_meta: linha.capture_meta")
        const plano = captura.slice(captura.indexOf("rpc('criar_plano_parcelado'"), captura.indexOf(".upsert("))
        expect(plano).not.toMatch(/\.update\(/)
        expect(captura).not.toContain("capture: chave do plano")
    })
})
