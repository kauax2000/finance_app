import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"
import { politicasFinais, ultimasFuncoes, type Politica } from "@/test/migracoes"

// O `semComentarios` corta comentário de JS; o `--` do SQL sai aqui, para as
// asserções de ausência não lerem a prosa da migração.
const MIGRACAO = "20261029120000_papeis.sql"
const sql = semComentarios(lerFonte(`supabase/migrations/${MIGRACAO}`)).replace(/--.*$/gm, "")
const tipos = lerFonte("src/types/database.ts")
const supabaseTs = lerFonte("src/lib/supabase.ts")

const ULTIMA = ultimasFuncoes()

function ultima(nome: string): string {
    const fn = ULTIMA.get(nome)
    expect(fn, nome).toBeDefined()
    return fn!.texto
}

const POLITICAS = politicasFinais()

function politicasDe(tabela: string): Politica[] {
    return [...POLITICAS.values()].filter((p) => p.tabela === tabela)
}

/** A política final de um comando; exige que seja uma só. */
function politicaFinal(tabela: string, comando: string, filtro: (p: Politica) => boolean = () => true): Politica {
    const lista = politicasDe(tabela).filter((p) => (p.comando === comando || p.comando === "all") && filtro(p))
    expect(lista.map((p) => p.nome), `${tabela} ${comando}`).toHaveLength(1)
    return lista[0]
}

function definer(texto: string): boolean {
    return /security\s+definer/i.test(texto)
}

function politica(nome: string, tabela: string): string {
    const esc = nome.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    const tab = tabela.replace(".", "\\.")
    expect(sql, `drop de "${nome}"`).toMatch(new RegExp(`drop policy if exists "${esc}" on ${tab};`))
    const pol = sql.match(new RegExp(`create policy "${esc}" on ${tab}[\\s\\S]*?;\\n`))
    expect(pol, `create de "${nome}"`).not.toBeNull()
    return pol![0]
}

/** Decisão 2: as tabelas da casa que o convidado não lê nem escreve. */
const SO_DO_ADULTO: Record<string, string> = {
    budgets: "user_id",
    bills: "user_id",
    bill_instances: "user_id",
    workspace_subscriptions: "user_id",
    workspace_installment_plans: "user_id",
    credit_card_invoice_payments: "created_by",
    credit_card_category_spend_alerts: "created_by",
    credit_card_statement_totals: "created_by",
}

/** Decisão 3: as RPCs `security definer` que passam a conferir adulto. */
const RPC_DO_ADULTO = [
    "complete_workspace_categories_onboarding",
    "delete_workspace_installment_plan_cascade",
    "garantir_orcamentos_do_mes",
    "registrar_insight",
] as const

/**
 * Decisão 3: as que são `security invoker`. Quem barra o convidado é a RLS de
 * `bill_instances`, `bills`, `workspace_subscriptions` e companhia (só do
 * adulto); os três bundles devolvem vazio para ele pela mesma RLS.
 */
const RPC_INVOKER = [
    "pay_bill_instance",
    "pular_instancia_da_conta",
    "ligar_pagamento_da_conta",
    "virar_assinatura",
    "virar_conta",
    "rpc_fetch_bills_page_bundle",
    "rpc_fetch_category_detail_bundle",
    "rpc_fetch_subscriptions_page_bundle",
] as const

/** Lançar despesa é do convidado: estas ficam com membro. */
const ABERTAS_AO_CONVIDADO: Record<string, string> = {
    criar_plano_parcelado: "a compra parcelada é um lançamento; as parcelas são transações dele, e o plano fica invisível a ele",
    create_workspace_installment_plan: "a porta do app para o criar_plano_parcelado",
    create_capture_token: "a captura (atalho, e-mail) lança despesa em nome de quem criou o token",
    marcar_insight: "ele marca os insights que vê; o da carteira (user_id nulo) exige adulto, como o insights_select",
}

/**
 * As outras `security definer` que leem `workspace_members` e não passam a
 * conferir adulto, cada uma com o porquê.
 */
const FICAM_COM_MEMBRO: Record<string, string> = {
    is_workspace_member: "o helper de membro; o convidado é membro (Decisão 2: ele não muda)",
    is_workspace_adult: "o helper novo, que já confere o papel",
    workspace_role: "devolve o papel de quem chama",
    is_workspace_owner: "confere dono",
    workspace_has_members: "a guarda do criador na carteira vazia; não devolve dado",
    workspace_members_guard: "o gatilho das chaves imutáveis e do último dono",
    workspace_member_directory: "nome e foto de quem está na carteira; o convidado vê quem divide a casa com ele",
    handle_new_user: "o cadastro cria a carteira pessoal com o dono",
    accept_workspace_invite: "a entrada pelo convite, só da service role; grava o papel do convite",
    catch_up_recurring_billing: "só adianta o que o cron já faria nas assinaturas e parcelas; devolve contagens e nenhuma linha",
    delete_workspace: "confere dono",
    get_workspace_delete_impact: "confere dono",
    trocar_papel: "confere dono",
    tem_cobertura: "o assento do plano conta o convidado (Decisão 1)",
    workspace_plan: "lê só os donos",
    avisos_de_teste_pendentes: "lê só os donos, pela service role",
    guardar_privado: "o gatilho do 7B confere o papel do autor da linha (role in owner, member), não o de quem chama",
    conferir_titular: "o gatilho do 7B confere que o titular do cartão é adulto da carteira",
    conferencia_liberada: "o helper do 7B: o dono, ou o titular do cartão; não devolve dado",
    definir_quem_pagou: "o gatilho do 7C lê o papel do autor da linha (o convidado paga pelo responsável), não o de quem chama",
    gerar_partes: "o gatilho do 7C chama o refazer_partes; não devolve dado",
    refazer_partes: "o corpo das partes do 7C divide entre os adultos da carteira (role in owner, member); não devolve dado",
    validar_pesos_do_plano: "o gatilho do 7C confere que cada peso do plano é de um adulto da carteira",
    definir_partes: "a RPC do 7C confere is_workspace_adult de quem chama e que cada parte é de um adulto",
    saldos_da_carteira: "a RPC do 7C confere is_workspace_adult de quem chama e só lista os adultos",
}

describe("migração papéis: o convidado e o adulto", () => {
    it("os três checks de papel", () => {
        expect(sql).toMatch(/alter table public\.workspace_members drop constraint if exists workspace_members_role_check;/)
        expect(sql).toMatch(
            /add constraint workspace_members_role_check\s+check \(role in \('owner', 'member', 'guest'\)\)\s+not valid;/,
        )
        expect(sql).toMatch(/alter table public\.workspace_members validate constraint workspace_members_role_check;/)

        expect(sql).toMatch(/alter table public\.workspace_invites drop constraint if exists workspace_invites_role_check;/)
        expect(sql).toMatch(/add constraint workspace_invites_role_check\s+check \(role in \('member', 'guest'\)\)\s+not valid;/)
        expect(sql).toMatch(/alter table public\.workspace_invites validate constraint workspace_invites_role_check;/)

        const upd = politica("Owners can update member roles", "public.workspace_members")
        expect(upd).toMatch(/for update/)
        expect(upd).toMatch(/using \(public\.is_workspace_owner\(workspace_id\)\)/)
        expect(upd).toMatch(/with check \(public\.is_workspace_owner\(workspace_id\) and role in \('member', 'guest'\)\)/)
    })

    it("os dois checks do convite e as colunas novas", () => {
        expect(sql).toMatch(/add column if not exists menor boolean not null default false;/)
        expect(sql).toMatch(/add column if not exists consentimento_em timestamptz;/)
        expect(sql).toMatch(
            /add constraint workspace_invites_guest_requer_email\s+check \(role = 'member' or invited_email is not null\)\s+not valid;/,
        )
        expect(sql).toMatch(/validate constraint workspace_invites_guest_requer_email;/)
        expect(sql).toMatch(
            /add constraint workspace_invites_menor_requer_consentimento\s+check \(not menor or \(role = 'guest' and consentimento_em is not null\)\)\s+not valid;/,
        )
        expect(sql).toMatch(/validate constraint workspace_invites_menor_requer_consentimento;/)
        // O front antigo não manda `role`: o padrão continua `member`.
        expect(sql).not.toMatch(/alter column role set default/)
    })

    it("sponsor_user_id: nulo para adultos, solto se a conta do responsável sai", () => {
        expect(sql).toMatch(
            /alter table public\.workspace_members\s+add column if not exists sponsor_user_id uuid references auth\.users\(id\) on delete set null;/,
        )
    })

    it("is_workspace_adult: dono ou membro, definer, stable, search_path vazio", () => {
        const fn = ultima("is_workspace_adult")
        expect(ULTIMA.get("is_workspace_adult")!.arquivo).toBe(MIGRACAO)
        expect(fn).toMatch(/^create or replace function public\.is_workspace_adult\(p_workspace_id uuid\)\s+returns boolean/)
        expect(fn).toMatch(/stable\s+security definer\s+set search_path = ''/)
        expect(fn).toMatch(/wm\.workspace_id = p_workspace_id/)
        expect(fn).toMatch(/wm\.user_id = \(select auth\.uid\(\)\)/)
        expect(fn).toMatch(/wm\.role in \('owner', 'member'\)/)
        expect(sql).toMatch(/revoke all on function public\.is_workspace_adult\(uuid\) from public;/)
        expect(sql).toMatch(/grant execute on function public\.is_workspace_adult\(uuid\) to anon, authenticated, service_role;/)
        // O helper de membro não muda (Decisão 2).
        expect(sql).not.toMatch(/function public\.is_workspace_member\(/)
    })

    it("as tabelas só do adulto: as quatro políticas usam is_workspace_adult, e o insert mantém o autor", () => {
        for (const [tabela, autor] of Object.entries(SO_DO_ADULTO)) {
            for (const [verbo, op] of [["view", "select"], ["insert", "insert"], ["update", "update"], ["delete", "delete"]]) {
                const pol = politica(`Workspace members can ${verbo} ${tabela}`, `public.${tabela}`)
                expect(pol, `${tabela} ${op}`).toMatch(new RegExp(`for ${op}\\b`))
                expect(pol, `${tabela} ${op}`).toMatch(/public\.is_workspace_adult\(workspace_id\)/)
                expect(pol, `${tabela} ${op}`).not.toMatch(/is_workspace_member/)
                if (op === "insert") expect(pol).toMatch(new RegExp(`and ${autor} = \\(select auth\\.uid\\(\\)\\)`))
            }
        }
    })

    it("transactions: o adulto como hoje; o convidado lê, edita e apaga só as dele", () => {
        for (const [verbo, op] of [["view", "select"], ["update", "update"], ["delete", "delete"]]) {
            const pol = politica(`Workspace members can ${verbo} transactions`, "public.transactions")
            expect(pol).toMatch(new RegExp(`for ${op}\\b`))
            expect(pol).toMatch(
                /using \(\s*public\.is_workspace_adult\(workspace_id\)\s+or \(user_id = \(select auth\.uid\(\)\) and public\.is_workspace_member\(workspace_id\)\)\s*\)/,
            )
        }
    })

    it("transactions: o convidado só lança despesa (Ruling 11), no insert e no with check do update", () => {
        const ins = politica("Workspace members can insert transactions", "public.transactions")
        expect(ins).toMatch(/for insert\b/)
        expect(ins).toMatch(
            /with check \(\s*user_id = \(select auth\.uid\(\)\)\s+and \(\s*public\.is_workspace_adult\(workspace_id\)\s+or \(public\.is_workspace_member\(workspace_id\) and type = 'expense'\)\s*\)\s*\)/,
        )
        const upd = politica("Workspace members can update transactions", "public.transactions")
        expect(upd).toMatch(
            /with check \(\s*public\.is_workspace_adult\(workspace_id\)\s+or \(user_id = \(select auth\.uid\(\)\) and public\.is_workspace_member\(workspace_id\) and type = 'expense'\)\s*\)/,
        )
    })

    it("categories e credit_cards: select por membro (fica como está), escrita por adulto", () => {
        for (const [nome, tabela] of [["categories", "categories"], ["credit cards", "credit_cards"]]) {
            expect(sql).not.toMatch(new RegExp(`"Workspace members can view ${nome}"`))
            for (const op of ["insert", "update", "delete"]) {
                const pol = politica(`Workspace members can ${op} ${nome}`, `public.${tabela}`)
                expect(pol).toMatch(new RegExp(`for ${op}\\b`))
                expect(pol).toMatch(/public\.is_workspace_adult\(workspace_id\)/)
                expect(pol).not.toMatch(/is_workspace_member/)
                if (op === "insert") expect(pol).toMatch(/and user_id = \(select auth\.uid\(\)\)/)
            }
        }
    })

    it("attachments: o adulto, ou quem anexou, ou o dono da transação; o convidado só anexa à transação dele", () => {
        for (const [verbo, op] of [["view", "select"], ["delete", "delete"]]) {
            const pol = politica(`Workspace members can ${verbo} attachments`, "public.attachments")
            expect(pol).toMatch(new RegExp(`for ${op}\\b`))
            expect(pol).toMatch(/public\.is_workspace_adult\(workspace_id\)\s+or \(\s*public\.is_workspace_member\(workspace_id\)\s+and \(/)
            expect(pol).toMatch(/created_by = \(select auth\.uid\(\)\)/)
            expect(pol).toMatch(
                /exists \(\s*select 1 from public\.transactions t\s+where t\.id = attachments\.transaction_id\s+and t\.user_id = \(select auth\.uid\(\)\)\s*\)/,
            )
        }
        const ins = politica("Workspace members can insert attachments", "public.attachments")
        expect(ins).toMatch(/for insert/)
        expect(ins).toMatch(/with check \(\s*created_by = \(select auth\.uid\(\)\)\s+and \(\s*public\.is_workspace_adult\(workspace_id\)\s+or \(/)
        expect(ins).toMatch(/public\.is_workspace_member\(workspace_id\)\s+and bill_instance_id is null\s+and statement_total_id is null/)
        expect(ins).toMatch(
            /exists \(\s*select 1 from public\.transactions t\s+where t\.id = attachments\.transaction_id\s+and t\.user_id = \(select auth\.uid\(\)\)\s*\)/,
        )
    })

    it("storage attachments: o adulto da pasta; o convidado pelo dono do objeto ou pela linha do anexo", () => {
        for (const [verbo, op] of [["view", "select"], ["delete", "delete"]]) {
            const pol = politica(`Workspace members can ${verbo} attachments`, "storage.objects")
            expect(pol).toMatch(new RegExp(`for ${op} to authenticated`))
            expect(pol).toMatch(/bucket_id = 'attachments'/)
            expect(pol).toMatch(/then public\.is_workspace_adult\(\(\(storage\.foldername\(name\)\)\[1\]\)::uuid\)/)
            expect(pol).toMatch(/or \(\s*public\.is_workspace_member\(\(\(storage\.foldername\(name\)\)\[1\]\)::uuid\)\s+and \(/)
            expect(pol).toMatch(/owner_id = \(select auth\.uid\(\)\)::text/)
            // O recibo da captura sobe pela service role (`owner_id` nulo): o
            // convidado chega a ele pela linha de `attachments`.
            expect(pol).toMatch(/exists \(\s*select 1 from public\.attachments a\s+where a\.path = objects\.name/)
            expect(pol).toMatch(/a\.created_by = \(select auth\.uid\(\)\)/)
            expect(pol).toMatch(/t\.id = a\.transaction_id\s+and t\.user_id = \(select auth\.uid\(\)\)/)
            expect(pol).toMatch(/else false end\);/)
        }
        expect(sql).not.toMatch(/"Workspace members can upload attachments"/)
        expect(sql).toMatch(/exception\s+when insufficient_privilege then/)
    })

    it("insights_select: a carteira só para o adulto; o convidado vê só os dele", () => {
        expect(sql).toMatch(/drop policy if exists insights_select on public\.insights;/)
        const pol = sql.match(/create policy insights_select on public\.insights\s+for select[\s\S]*?\);\n/)
        expect(pol).not.toBeNull()
        expect(pol![0]).toMatch(/public\.is_workspace_member\(workspace_id\)/)
        expect(pol![0]).toMatch(
            /user_id = \(select auth\.uid\(\)\)\s+or \(user_id is null and public\.is_workspace_adult\(workspace_id\)\)/,
        )
        expect(pol![0]).toMatch(/not exists \(\s*select 1 from public\.insights_silenciados s/)
    })

    it("sair da carteira vale para membro e convidado", () => {
        const pol = politica("Members can leave workspace", "public.workspace_members")
        expect(pol).toMatch(/for delete/)
        expect(pol).toMatch(/public\.workspace_role\(workspace_id\) in \('member', 'guest'\)/)
        expect(pol).toMatch(/user_id = \(select auth\.uid\(\)\)/)
    })

    it("accept_workspace_invite grava o papel do convite e o responsável do convidado", () => {
        const fn = ultima("accept_workspace_invite")
        expect(ULTIMA.get("accept_workspace_invite")!.arquivo).toBe(MIGRACAO)
        expect(fn).toMatch(/security definer\s+set search_path = ''/)
        expect(fn).toMatch(/insert into public\.workspace_members \(workspace_id, user_id, role, sponsor_user_id\)/)
        expect(fn).toMatch(/values \(v_invite\.workspace_id, p_user_id, v_invite\.role,\s+case when v_invite\.role = 'guest' then v_invite\.created_by end\)/)
        expect(fn).not.toMatch(/p_user_id, 'member'\)/)
        expect(sql).toMatch(/revoke all on function public\.accept_workspace_invite\(text, uuid, text\) from public, anon, authenticated;/)
        expect(sql).toMatch(/grant execute on function public\.accept_workspace_invite\(text, uuid, text\) to service_role;/)
    })

    it("trocar_papel: só o dono, só member ou guest, nunca a linha de um dono nem a própria", () => {
        const fn = ultima("trocar_papel")
        expect(fn).toMatch(
            /^create or replace function public\.trocar_papel\(p_workspace_id uuid, p_user_id uuid, p_role text\)\s+returns void/,
        )
        expect(fn).toMatch(/security definer\s+set search_path = ''/)
        expect(fn).toMatch(/if v_uid is null or not public\.is_workspace_owner\(p_workspace_id\) then/)
        expect(fn).toMatch(/p_role not in \('member', 'guest'\)/)
        expect(fn).toMatch(/if p_user_id = v_uid then/)
        expect(fn).toMatch(/if v_anterior = 'owner' then\s+raise exception 'PAPEL_DONO'/)
        expect(fn).toMatch(/for update;/)
        expect(fn).toMatch(
            /sponsor_user_id = case when p_role = 'guest' then coalesce\(m\.sponsor_user_id, v_uid\) end/,
        )
        expect(fn).toMatch(/'family_role_changed'/)
        expect(sql).toMatch(/revoke all on function public\.trocar_papel\(uuid, uuid, text\) from public, anon;/)
        expect(sql).toMatch(/grant execute on function public\.trocar_papel\(uuid, uuid, text\) to authenticated;/)
    })

    it("as RPCs definer da Decisão 3 conferem adulto", () => {
        for (const nome of RPC_DO_ADULTO) {
            const fn = ultima(nome)
            // O 7C redefine a garantia para pular a carteira de projeto, com a guarda daqui.
            expect(ULTIMA.get(nome)!.arquivo, nome).toBe(
                nome === "garantir_orcamentos_do_mes" ? "20261031120000_projetos.sql" : MIGRACAO,
            )
            expect(definer(fn), nome).toBe(true)
            expect(fn, nome).toMatch(/set search_path = ''/)
            expect(fn, nome).toMatch(/public\.is_workspace_adult\(/)
        }
        expect(ultima("complete_workspace_categories_onboarding")).not.toMatch(/is_workspace_member/)
    })

    it("Ruling 4: o convidado apaga o próprio parcelamento; o de outro, só o adulto", () => {
        const fn = ultima("delete_workspace_installment_plan_cascade")
        expect(fn).toMatch(/select p\.workspace_id, p\.user_id into v_workspace_id, v_user_id/)
        expect(fn).toMatch(
            /if not \(\s*public\.is_workspace_adult\(v_workspace_id\)\s+or \(v_user_id = auth\.uid\(\) and public\.is_workspace_member\(v_workspace_id\)\)\s*\) then\s+raise exception 'Forbidden';/,
        )
        // A guarda de autenticação continua antes de qualquer leitura.
        expect(fn.indexOf("'Not authenticated'")).toBeLessThan(fn.indexOf("from public.workspace_installment_plans"))
    })

    it("Ruling 5: o seguro baixo e a cópia do orçamento calam para o convidado, sem erro", () => {
        const garantir = ultima("garantir_orcamentos_do_mes")
        expect(garantir).toMatch(
            /if not public\.is_workspace_member\(p_workspace_id\) then\s+raise exception 'not a workspace member' using errcode = '42501';\s+end if;\s+if not public\.is_workspace_adult\(p_workspace_id\) then\s+return 0;\s+end if;/,
        )
        const registrar = ultima("registrar_insight")
        expect(registrar).toMatch(
            /if v_uid is null or not public\.is_workspace_member\(p_workspace_id\) then\s+raise exception 'not a workspace member' using errcode = '42501';\s+end if;\s+if not public\.is_workspace_adult\(p_workspace_id\) then\s+return null;\s+end if;/,
        )
    })

    it("as RPCs invoker da Decisão 3 continuam invoker: a RLS do adulto barra o convidado", () => {
        for (const nome of RPC_INVOKER) {
            const fn = ultima(nome)
            // Sem `security definer`, a função é invoker (o padrão do Postgres).
            expect(definer(fn), nome).toBe(false)
        }
    })

    it("as quatro abertas ao convidado ficam com membro", () => {
        for (const nome of Object.keys(ABERTAS_AO_CONVIDADO)) {
            const fn = ultima(nome)
            expect(fn, nome).toMatch(/public\.is_workspace_member\(|public\.workspace_members/)
        }
        for (const nome of ["criar_plano_parcelado", "create_workspace_installment_plan", "create_capture_token"]) {
            expect(ultima(nome), nome).not.toMatch(/is_workspace_adult/)
        }
        const marcar = ultima("marcar_insight")
        expect(ULTIMA.get("marcar_insight")!.arquivo).toBe(MIGRACAO)
        expect(marcar).toMatch(/security definer\s+set search_path = ''/)
        expect(marcar).toMatch(/public\.is_workspace_member\(i\.workspace_id\)/)
        expect(marcar).toMatch(
            /i\.user_id = v_uid\s+or \(i\.user_id is null and public\.is_workspace_adult\(i\.workspace_id\)\)/,
        )
    })

    it("toda definer que lê workspace_members tem papel decidido, com o porquê", () => {
        const decididas = new Set([...RPC_DO_ADULTO, ...Object.keys(ABERTAS_AO_CONVIDADO), ...Object.keys(FICAM_COM_MEMBRO)])
        const soltas = [...ULTIMA.entries()]
            .filter(([, { texto }]) => definer(texto))
            .filter(([, { texto }]) => /workspace_members|is_workspace_member|workspace_role|is_workspace_owner/.test(texto))
            .map(([nome]) => nome)
            .filter((nome) => !decididas.has(nome))
        expect(soltas).toEqual([])
        for (const [nome, porque] of Object.entries({ ...ABERTAS_AO_CONVIDADO, ...FICAM_COM_MEMBRO })) {
            expect(porque.length, nome).toBeGreaterThan(10)
        }
    })

    it("estado final: as tabelas só do adulto têm exatamente as quatro políticas, nenhuma de membro", () => {
        for (const [tabela, autor] of Object.entries(SO_DO_ADULTO)) {
            const lista = politicasDe(`public.${tabela}`)
            expect(lista.map((p) => p.comando).sort(), tabela).toEqual(["delete", "insert", "select", "update"])
            for (const p of lista) {
                expect(p.texto, `${tabela} ${p.nome}`).toMatch(/public\.is_workspace_adult\(workspace_id\)/)
                expect(p.texto, `${tabela} ${p.nome}`).not.toMatch(/is_workspace_member/)
                expect(p.texto, `${tabela} ${p.nome}`).not.toMatch(/as restrictive/)
            }
            expect(politicaFinal(`public.${tabela}`, "insert").texto).toMatch(new RegExp(`${autor} = \\(select auth\\.uid\\(\\)\\)`))
        }
    })

    it("estado final: transactions e attachments só citam membro junto do ramo do autor", () => {
        const autorTx = /user_id = \(select auth\.uid\(\)\) and public\.is_workspace_member\(workspace_id\)/
        // O 7B (20261030120000) acrescenta o privado ao ramo do adulto do update e do delete.
        const adulto = String.raw`public\.is_workspace_adult\(workspace_id\)(?: and \(not is_private or user_id = \(select auth\.uid\(\)\)\)\))?`
        for (const comando of ["select", "update", "delete"]) {
            const p = politicaFinal("public.transactions", comando)
            expect(p.texto, comando).toMatch(new RegExp(`${adulto} or`))
            expect(p.texto, comando).toMatch(autorTx)
        }
        const insTx = politicaFinal("public.transactions", "insert").texto
        expect(insTx).toMatch(/user_id = \(select auth\.uid\(\)\) and \( public\.is_workspace_adult\(workspace_id\) or/)
        expect(insTx).toMatch(/public\.is_workspace_member\(workspace_id\) and type = 'expense'/)
        expect(politicaFinal("public.transactions", "update").texto).toMatch(
            new RegExp(
                String.raw`with check \( \(?${adulto}\)? or \(user_id = \(select auth\.uid\(\)\) and public\.is_workspace_member\(workspace_id\) and type = 'expense'\) \)`,
            ),
        )

        for (const comando of ["select", "delete"]) {
            const p = politicaFinal("public.attachments", comando)
            expect(p.texto, comando).toMatch(/public\.is_workspace_adult\(workspace_id\) or \( public\.is_workspace_member\(workspace_id\) and \(/)
            expect(p.texto, comando).toMatch(/created_by = \(select auth\.uid\(\)\)/)
            expect(p.texto, comando).toMatch(/t\.id = attachments\.transaction_id/)
        }
        const ins = politicaFinal("public.attachments", "insert")
        expect(ins.texto).toMatch(/bill_instance_id is null and statement_total_id is null/)
        expect(ins.texto).toMatch(/t\.id = attachments\.transaction_id and t\.user_id = \(select auth\.uid\(\)\)/)
        expect(politicasDe("public.attachments")).toHaveLength(3)
    })

    it("estado final: o storage de anexos tem o ramo do adulto e o do convidado", () => {
        const doBucket = (p: Politica) => p.texto.includes("bucket_id = 'attachments'")
        for (const comando of ["select", "delete"]) {
            const p = politicaFinal("storage.objects", comando, doBucket)
            expect(p.texto, comando).toMatch(/then public\.is_workspace_adult\(/)
            expect(p.texto, comando).toMatch(/from public\.attachments a where a\.path = objects\.name/)
            expect(p.texto, comando).toMatch(/else false end/)
        }
        expect(politicaFinal("storage.objects", "insert", doBucket).texto).toMatch(/public\.is_workspace_member\(/)
    })

    it("estado final: em categories e credit_cards, só o select cita membro", () => {
        for (const tabela of ["public.categories", "public.credit_cards"]) {
            const lista = politicasDe(tabela)
            expect(lista.map((p) => p.comando).sort(), tabela).toEqual(["delete", "insert", "select", "update"])
            for (const p of lista) {
                if (p.comando === "select") expect(p.texto).toMatch(/is_workspace_member\(workspace_id\)/)
                else {
                    expect(p.texto, `${tabela} ${p.comando}`).not.toMatch(/is_workspace_member/)
                    expect(p.texto, `${tabela} ${p.comando}`).toMatch(/public\.is_workspace_adult\(workspace_id\)/)
                }
            }
        }
    })

    it("pgTAP: is_workspace_adult entra na lista das definer que o anon executa", () => {
        const pgtap = lerFonte("supabase/tests/database/security_privileges_policies.test.sql")
        expect(pgtap).toMatch(
            /p\.proname not in \('is_workspace_member', 'is_workspace_owner', 'workspace_role', 'is_workspace_adult'\)/,
        )
    })

    it("só acrescenta: nenhum drop table nem drop column", () => {
        expect(sql).not.toMatch(/drop table/i)
        expect(sql).not.toMatch(/drop column/i)
    })

    it("o TS: guest no papel, o convite e o responsável", () => {
        expect(supabaseTs).toMatch(/export type WorkspaceRole = "owner" \| "member" \| "guest"/)
        expect(supabaseTs).toMatch(/role: "member" \| "guest"/)
        expect(supabaseTs).toMatch(/sponsor_user_id: string \| null/)
        expect(supabaseTs).toMatch(/menor: boolean/)
        expect(supabaseTs).toMatch(/consentimento_em: string \| null/)
        expect(tipos).toMatch(/sponsor_user_id: string \| null/)
        expect(tipos).toMatch(/trocar_papel: \{/)
        expect(tipos).toMatch(/is_workspace_adult: \{/)
        const fetch = lerFonte("src/lib/queries/fetch-workspaces-data.ts")
        expect(fetch).toMatch(/typed\.role === "guest"/)
    })
})
