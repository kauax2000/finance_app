import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"
import { politicasFinais, ultimasFuncoes } from "@/test/migracoes"

// O `semComentarios` corta comentário de JS; o `--` do SQL sai aqui, para as
// asserções de ausência não lerem a prosa da migração.
const MIGRACAO = "20261031120000_projetos.sql"
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

/** Decisão 3, literal: as categorias de cada modelo, na ordem. */
const CASA = {
    expense: ["Mercado", "Contas da casa", "Transporte", "Saúde", "Lazer", "Educação", "Outros"],
    income: ["Salário", "Outros"],
}
const CATEGORIAS: Record<string, { expense: string[]; income: string[] }> = {
    casa: CASA,
    viagem: { expense: ["Passagens", "Hospedagem", "Alimentação", "Passeios", "Transporte", "Outros"], income: [] },
    reforma: { expense: ["Material", "Mão de obra", "Projeto", "Móveis", "Outros"], income: [] },
    evento: { expense: ["Local", "Comida e bebida", "Decoração", "Convites", "Fornecedores", "Outros"], income: [] },
}

describe("migração projetos: o projeto, a carteira de projeto e os modelos", () => {
    it("projects: as colunas e os checks da Decisão 1", () => {
        const tabela = sql.match(/create table if not exists public\.projects \(([\s\S]*?)\n\);/)
        expect(tabela).not.toBeNull()
        const c = tabela![1]
        expect(c).toMatch(/id uuid primary key default gen_random_uuid\(\)/)
        expect(c).toMatch(/workspace_id uuid not null references public\.workspaces\(id\) on delete cascade/)
        expect(c).toMatch(/name text not null/)
        expect(c).toMatch(/starts_on date,/)
        expect(c).toMatch(/ends_on date,/)
        expect(c).toMatch(/budget_total numeric\(12, 2\) check \(budget_total is null or budget_total > 0\)/)
        expect(c).toMatch(/archived_at timestamptz,/)
        expect(c).toMatch(/created_by uuid default auth\.uid\(\) references auth\.users\(id\) on delete set null/)
        expect(c).toMatch(/created_at timestamptz not null default now\(\)/)
        expect(c).toMatch(/updated_at timestamptz not null default now\(\)/)
        expect(c).toMatch(/check \(starts_on is null or ends_on is null or ends_on >= starts_on\)/)
        expect(sql).toMatch(/create trigger set_projects_updated_at before update on public\.projects\s+for each row execute function public\.set_updated_at\(\);/)
    })

    it("projects: o membro lê (convidado incluído), só o adulto escreve, e a carteira não troca", () => {
        expect(sql).toMatch(/alter table public\.projects enable row level security;/)
        expect(sql).toMatch(/revoke all on public\.projects from anon;/)
        const lista = [...POLITICAS.values()].filter((p) => p.tabela === "public.projects")
        expect(lista.map((p) => p.comando).sort()).toEqual(["delete", "insert", "select", "update"])
        for (const p of lista) expect(p.arquivo, p.comando).toBe(MIGRACAO)
        const de = (comando: string) => lista.find((p) => p.comando === comando)!.texto
        expect(de("select")).toMatch(/using \( ?public\.is_workspace_member\(workspace_id\) ?\)/)
        expect(de("insert")).toMatch(/with check \( ?public\.is_workspace_adult\(workspace_id\) and created_by = \(select auth\.uid\(\)\) ?\)/)
        expect(de("update")).toMatch(/using \( ?public\.is_workspace_adult\(workspace_id\) ?\) with check \( ?public\.is_workspace_adult\(workspace_id\) ?\)/)
        expect(de("delete")).toMatch(/using \( ?public\.is_workspace_adult\(workspace_id\) ?\)/)
        for (const comando of ["insert", "update", "delete"]) expect(de(comando), comando).not.toMatch(/is_workspace_member/)
        // A carteira e o autor não se trocam pelo update: os vínculos apontariam para outra casa.
        expect(sql).toMatch(/revoke update on public\.projects from authenticated;/)
        expect(sql).toMatch(/grant update \(name, starts_on, ends_on, budget_total, archived_at\) on public\.projects to authenticated;/)
    })

    it("transactions.project_id: on delete set null, a mesma carteira e o projeto arquivado recusado", () => {
        expect(sql).toMatch(
            /alter table public\.transactions\s+add column if not exists project_id uuid references public\.projects\(id\) on delete set null;/,
        )
        expect(sql).toMatch(
            /create trigger same_ws_project_id\s+before insert or update of project_id, workspace_id on public\.transactions\s+for each row execute function public\.assert_same_workspace_ref\('project_id', 'projects'\);/,
        )
        const fn = ultima("recusar_projeto_arquivado")
        expect(fn).toMatch(/security definer\s+set search_path = ''/)
        // Só o vínculo novo: editar um lançamento antigo de um projeto arquivado passa.
        expect(fn).toMatch(/if tg_op = 'UPDATE' and new\.project_id is not distinct from old\.project_id then\s+return new;/)
        expect(fn).toMatch(/where p\.id = new\.project_id\s+and p\.archived_at is not null/)
        expect(fn).toMatch(/raise exception 'PROJETO_ARQUIVADO'/)
        expect(sql).toMatch(
            /create trigger recusar_projeto_arquivado\s+before insert or update of project_id on public\.transactions\s+for each row\s+when \(new\.project_id is not null\)\s+execute function public\.recusar_projeto_arquivado\(\);/,
        )
        expect(sql).toMatch(/revoke all on function public\.recusar_projeto_arquivado\(\) from public, anon, authenticated;/)
    })

    it("workspaces: purpose, o período e o orçamento do projeto, e o modo da divisão", () => {
        expect(sql).toMatch(
            /add column if not exists purpose text not null default 'everyday'\s+constraint workspaces_purpose_check check \(purpose in \('everyday', 'project'\)\)/,
        )
        expect(sql).toMatch(/add column if not exists starts_on date,/)
        expect(sql).toMatch(/add column if not exists ends_on date,/)
        expect(sql).toMatch(
            /add column if not exists budget_total numeric\(12, 2\)\s+constraint workspaces_budget_total_check check \(budget_total is null or budget_total > 0\)/,
        )
        expect(sql).toMatch(
            /add column if not exists split_mode text not null default 'pooled'\s+constraint workspaces_split_mode_check check \(split_mode in \('pooled', 'split'\)\)/,
        )
        // Nulos fora do `project`.
        expect(sql).toMatch(
            /add constraint workspaces_project_fields\s+check \(purpose = 'project' or \(starts_on is null and ends_on is null and budget_total is null\)\);/,
        )
    })

    it("as duas funções de orçamento pulam a carteira de projeto", () => {
        const copiar = ultima("copiar_orcamentos_do_mes")
        const alvos = copiar.match(/with alvos as \(([\s\S]*?)\), marcadas as/)
        expect(alvos).not.toBeNull()
        expect(alvos![1]).toMatch(/join public\.workspaces w on w\.id = b\.workspace_id/)
        expect(alvos![1]).toMatch(/and w\.purpose = 'everyday'/)
        // O resto é o corpo do 6B.
        const previsao = lerFonte("supabase/migrations/20261026120000_previsao.sql").replace(/--.*$/gm, "")
        const antes = previsao.match(/create or replace function public\.copiar_orcamentos_do_mes\([\s\S]*?\$\$[\s\S]*?\$\$/)![0]
        expect(
            copiar.replace(/\n\s+join public\.workspaces w on w\.id = b\.workspace_id/, "").replace(/\n\s+and w\.purpose = 'everyday'/, ""),
        ).toBe(antes)

        const garantir = ultima("garantir_orcamentos_do_mes")
        // A ordem do 7A fica: membro, adulto, e só então o propósito.
        expect(garantir).toMatch(
            /if not public\.is_workspace_member\(p_workspace_id\) then\s+raise exception 'not a workspace member' using errcode = '42501';\s+end if;\s+if not public\.is_workspace_adult\(p_workspace_id\) then\s+return 0;\s+end if;\s+if exists \(\s*select 1 from public\.workspaces w\s+where w\.id = p_workspace_id and w\.purpose = 'project'\s*\) then\s+return 0;\s+end if;/,
        )
        expect(garantir).toMatch(/security definer\s+set search_path = ''/)
        expect(garantir).toMatch(/public\.copiar_orcamentos_do_mes\(date_trunc\('month', public\.app_today\(\)\)::date, p_workspace_id\)/)
    })

    it("criar_carteira_de_modelo: invoker, o caminho do create_shared_workspace e o assistente fechado", () => {
        const fn = ultima("criar_carteira_de_modelo")
        expect(fn).toMatch(/^create or replace function public\.criar_carteira_de_modelo\(p_modelo text, p_nome text\)\s+returns uuid/)
        expect(fn).toMatch(/security invoker\s+set search_path = ''/)
        expect(fn).not.toMatch(/security definer/)
        expect(fn).toMatch(/raise exception 'NOT_AUTHENTICATED'/)
        expect(fn).toMatch(/raise exception 'WORKSPACE_NAME_REQUIRED'/)
        expect(fn).toMatch(/raise exception 'MODELO_DESCONHECIDO'/)
        expect(fn).toMatch(
            /insert into public\.workspaces \(\s*name, type, created_by, icon, icon_background_color,\s*purpose, split_mode, categories_onboarding_completed_at\s*\)\s+values \(btrim\(p_nome\), 'shared', v_uid, v_icone, v_cor, v_purpose, v_split, now\(\)\)/,
        )
        expect(fn).toMatch(/insert into public\.workspace_members \(workspace_id, user_id, role\)\s+values \(v_ws, v_uid, 'owner'\);/)
        expect(sql).toMatch(/revoke all on function public\.criar_carteira_de_modelo\(text, text\) from public, anon;/)
        expect(sql).toMatch(/grant execute on function public\.criar_carteira_de_modelo\(text, text\) to authenticated;/)
    })

    it("os seis modelos: propósito, modo, e a pessoal aponta para a que já existe", () => {
        const fn = ultima("criar_carteira_de_modelo")
        const modo: Record<string, [string, string]> = {
            casa: ["everyday", "pooled"],
            casal: ["everyday", "split"],
            viagem: ["project", "split"],
            reforma: ["project", "split"],
            evento: ["project", "split"],
        }
        for (const [modelo, [purpose, split]] of Object.entries(modo)) {
            expect(fn, modelo).toMatch(
                new RegExp(`when '${modelo}' then\\s+v_purpose := '${purpose}'; v_split := '${split}';`),
            )
        }
        // A pessoal não cria nada: devolve a do `handle_new_user`, antes de qualquer insert.
        const pessoal = fn.match(/if p_modelo = 'pessoal' then([\s\S]*?return v_ws;)\s+end if;/)
        expect(pessoal).not.toBeNull()
        expect(pessoal![1]).toMatch(/where w\.created_by = v_uid\s+and w\.type = 'personal'/)
        expect(pessoal![1]).toMatch(/return v_ws;/)
        expect(pessoal![1]).not.toMatch(/insert/)
        expect(fn.indexOf("if p_modelo = 'pessoal'")).toBeLessThan(fn.indexOf("insert into"))
    })

    it("as categorias de cada modelo, exatas, na forma do handle_new_user", () => {
        const fn = ultima("criar_carteira_de_modelo")
        expect(fn).toMatch(
            /insert into public\.categories \(user_id, workspace_id, name, type, color, icon\)\s+select v_uid, v_ws, c\.nome, c\.tipo, c\.cor, c\.icone\s+from \(values/,
        )
        // O casal semeia as mesmas da Casa.
        expect(fn).toMatch(/where c\.modelo = case when p_modelo = 'casal' then 'casa' else p_modelo end/)
        const achadas: Record<string, { expense: string[]; income: string[] }> = {}
        for (const m of fn.matchAll(/\('(\w+)', '([^']+)', '(expense|income)', '(#[0-9A-F]{6})', '([a-z0-9-]+)'\)/g)) {
            achadas[m[1]] ??= { expense: [], income: [] }
            achadas[m[1]][m[3] as "expense" | "income"].push(m[2])
        }
        expect(achadas).toEqual(CATEGORIAS)
    })

    it("só acrescenta: nenhum drop de tabela, coluna, função ou constraint", () => {
        expect(sql).not.toMatch(/drop (table|column|function|constraint|index|view)\b/i)
        for (const m of sql.matchAll(/drop (policy|trigger) if exists ("[^"]+"|\w+) on [\w.]+;/g)) {
            expect(sql, m[0]).toContain(`create ${m[1]} ${m[2]}`)
        }
    })

    it("os tipos: projects, as colunas novas e a RPC", () => {
        expect(tipos).toMatch(/projects: \{\s+Row: \{/)
        expect(tipos).toMatch(/criar_carteira_de_modelo: \{\s+Args: \{ p_modelo: string; p_nome: string \}\s+Returns: string/)
        for (const coluna of ["project_id: string | null", "purpose: string", "split_mode: string", "budget_total: number | null"]) {
            expect(tipos, coluna).toContain(coluna)
        }
        expect(supabaseTs).toMatch(/export interface Project \{/)
        expect(supabaseTs).toMatch(/export type WorkspacePurpose = "everyday" \| "project"/)
    })
})
