import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"
import { politicasFinais, ultimasFuncoes, type Politica } from "@/test/migracoes"

// O `semComentarios` corta comentário de JS; o `--` do SQL sai aqui, para as
// asserções de ausência não lerem a prosa da migração.
const MIGRACAO = "20261030120000_privado.sql"
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

/** A política final de um comando; exige que seja uma só. */
function politicaFinal(tabela: string, comando: string, filtro: (p: Politica) => boolean = () => true): Politica {
    const lista = [...POLITICAS.values()].filter(
        (p) => p.tabela === tabela && (p.comando === comando || p.comando === "all") && filtro(p),
    )
    expect(lista.map((p) => p.nome), `${tabela} ${comando}`).toHaveLength(1)
    return lista[0]
}

const ADULTO_SEM_PRIVADA_ALHEIA =
    "(public.is_workspace_adult(workspace_id) and (not is_private or user_id = (select auth.uid())))"
const CONVIDADO = "(user_id = (select auth.uid()) and public.is_workspace_member(workspace_id))"

describe("migração privado: o titular, a privada e as políticas", () => {
    it("o titular do cartão: nulo é o cartão da casa, e o gatilho exige adulto da carteira", () => {
        expect(sql).toMatch(
            /alter table public\.credit_cards\s+add column if not exists holder_user_id uuid references auth\.users\(id\) on delete set null;/,
        )
        const fn = ultima("conferir_titular")
        expect(fn).toMatch(/security definer\s+set search_path = ''/)
        expect(fn).toMatch(/wm\.workspace_id = new\.workspace_id\s+and wm\.user_id = new\.holder_user_id\s+and wm\.role in \('owner', 'member'\)/)
        expect(fn).toMatch(/raise exception 'TITULAR_NAO_ADULTO'/)
    })

    it("is_private com padrão falso: o main não manda e nada muda", () => {
        expect(sql).toMatch(/alter table public\.transactions\s+add column if not exists is_private boolean not null default false;/)
    })

    it("transacoes_privadas: as colunas, e a RLS só do autor nos quatro comandos", () => {
        const tabela = sql.match(/create table if not exists public\.transacoes_privadas \(([\s\S]*?)\n\);/)
        expect(tabela).not.toBeNull()
        const colunas = tabela![1]
        expect(colunas).toMatch(/transaction_id uuid primary key references public\.transactions\(id\) on delete cascade/)
        expect(colunas).toMatch(/workspace_id uuid not null/)
        expect(colunas).toMatch(/user_id uuid not null/)
        expect(colunas).toMatch(/description text/)
        expect(colunas).toMatch(/category_id uuid references public\.categories\(id\) on delete set null/)
        expect(colunas).toMatch(/capture_meta jsonb/)
        expect(colunas).toMatch(/updated_at timestamptz not null default now\(\)/)
        expect(sql).toMatch(/alter table public\.transacoes_privadas enable row level security;/)
        expect(sql).toMatch(/revoke all on public\.transacoes_privadas from anon;/)

        const lista = [...POLITICAS.values()].filter((p) => p.tabela === "public.transacoes_privadas")
        expect(lista.map((p) => p.comando).sort()).toEqual(["delete", "insert", "select", "update"])
        for (const p of lista) {
            expect(p.texto, p.comando).toMatch(/to authenticated/)
            expect(p.texto, p.comando).toMatch(/user_id = \(select auth\.uid\(\)\)/)
            // Nenhum ramo de adulto: outro adulto lê vazio.
            expect(p.texto, p.comando).not.toMatch(/is_workspace_(adult|member|owner)|\bor\b/)
        }
        for (const comando of ["insert", "update"]) {
            expect(politicaFinal("public.transacoes_privadas", comando).texto).toMatch(
                /t\.id = transacoes_privadas\.transaction_id and t\.user_id = \(select auth\.uid\(\)\)/,
            )
        }
    })

    it("guardar_privado: definer, e o gatilho de antes nas colunas do brief e nos vínculos", () => {
        const fn = ultima("guardar_privado")
        expect(fn).toMatch(/^create or replace function public\.guardar_privado\(\)\s+returns trigger/)
        expect(fn).toMatch(/security definer\s+set search_path = ''/)
        const gatilho = sql.match(/create trigger guardar_privado\s+([\s\S]*?);/)
        expect(gatilho).not.toBeNull()
        expect(gatilho![1]).toMatch(/^before insert or update of /)
        for (const coluna of [
            "is_private",
            "description",
            "category_id",
            "capture_meta",
            "payment_method",
            "payment_credit_card_id",
            "subscription_id",
            "installment_plan_id",
            "type",
        ]) {
            expect(gatilho![1], coluna).toMatch(new RegExp(`\\b${coluna}\\b`))
        }
        expect(gatilho![1]).toMatch(/on public\.transactions\s+for each row execute function public\.guardar_privado\(\)/)
    })

    it("onde o privado vale: Pix, débito ou dinheiro, ou o cartão do titular", () => {
        const fn = ultima("guardar_privado")
        expect(fn).toMatch(/new\.payment_method in \('pix', 'debit_card', 'cash'\)/)
        expect(fn).toMatch(
            /new\.payment_method = 'credit_card'\s+and exists \(\s*select 1 from public\.credit_cards c\s+where c\.id = new\.payment_credit_card_id\s+and c\.holder_user_id = new\.user_id\s*\)/,
        )
        // O cartão da casa (titular nulo) não casa com `= new.user_id`.
        expect(fn).not.toMatch(/holder_user_id is null/)
        expect(fn).toMatch(/new\.type = 'expense'/)
        // O nulo do método não pode passar: a regra inteira vai a `coalesce(…, false)`.
        expect(fn).toMatch(/if not coalesce\(v_pode, false\) then\s+raise exception 'PRIVADO_NAO_PERMITIDO'/)
    })

    it("recusa o convidado: o papel do autor, não o de quem chama", () => {
        const fn = ultima("guardar_privado")
        // O `is_workspace_adult` lê `auth.uid()`, nulo na service role: o
        // gatilho confere o autor da linha direto.
        expect(fn).toMatch(
            /select 1 from public\.workspace_members wm\s+where wm\.workspace_id = new\.workspace_id\s+and wm\.user_id = new\.user_id\s+and wm\.role in \('owner', 'member'\)/,
        )
        expect(fn).not.toMatch(/is_workspace_member/)
        // Só o autor marca, edita ou desmarca; o autor não troca.
        expect(fn).toMatch(/new\.user_id := old\.user_id;/)
        expect(fn).toMatch(/if v_uid is not null and v_uid is distinct from new\.user_id then\s+raise exception 'PRIVADO_NAO_PERMITIDO'/)
    })

    it("recusa os vínculos: assinatura, parcelamento e a conta ligada, nos dois lados", () => {
        const fn = ultima("guardar_privado")
        expect(fn).toMatch(/new\.subscription_id is null/)
        expect(fn).toMatch(/new\.installment_plan_id is null/)
        expect(fn).toMatch(/not exists \(\s*select 1 from public\.bill_instances i\s+where i\.transaction_id = new\.id\s*\)/)
        // Ruling 2: a coluna não existe ainda; o 7C acrescenta a checagem.
        expect(fn).not.toMatch(/project_id/)

        const conta = ultima("recusar_conta_na_privada")
        expect(conta).toMatch(/security definer\s+set search_path = ''/)
        expect(conta).toMatch(/where t\.id = new\.transaction_id\s+and t\.is_private/)
        expect(conta).toMatch(/raise exception 'PRIVADO_NAO_PERMITIDO'/)
        expect(sql).toMatch(
            /create trigger recusar_conta_na_privada\s+before insert or update of transaction_id on public\.bill_instances\s+for each row\s+when \(new\.transaction_id is not null\)/,
        )
    })

    it("o original sai da linha: 'Gasto pessoal', categoria e capture_meta nulos", () => {
        const fn = ultima("guardar_privado")
        expect(fn).toMatch(/new\.description := 'Gasto pessoal';\s+new\.category_id := null;\s+new\.capture_meta := null;\s+return new;\s+end;/)
        // A máscara é o último passo, depois de recusar: nada sai mascarado sem os detalhes guardados.
        expect(fn.indexOf("if not coalesce(v_pode, false)")).toBeGreaterThan(-1)
        expect(fn.indexOf("new.description := 'Gasto pessoal'")).toBeGreaterThan(fn.indexOf("if not coalesce(v_pode, false)"))
        // A edição da privada guarda o que veio diferente da máscara, e não a máscara.
        expect(fn).toMatch(
            /case when new\.description is distinct from old\.description then new\.description else v_lado\.description end/,
        )
        expect(fn).toMatch(/case when new\.category_id is distinct from old\.category_id then new\.category_id else v_lado\.category_id end/)
        expect(fn).toMatch(/on conflict \(transaction_id\) do update/)
    })

    it("o insert: o de antes guarda numa configuração local, o de depois grava em transacoes_privadas", () => {
        const antes = ultima("guardar_privado")
        expect(antes).toMatch(/pg_catalog\.set_config\(\s*v_chave,\s*pg_catalog\.jsonb_build_object\('description', v_desc, 'category_id', v_cat, 'capture_meta', v_meta\)::text,\s*true\s*\)/)
        // O upsert que cai no conflito acha o que foi mandado pela mesma chave.
        expect(antes).toMatch(/v_enviado := nullif\(pg_catalog\.current_setting\(v_chave, true\), ''\)::jsonb;/)
        const chave = /'privado\.t' \|\| pg_catalog\.md5\(new\.workspace_id::text \|\| ':' \|\| coalesce\(new\.client_id::text, new\.id::text\)\)/
        expect(antes).toMatch(chave)

        const depois = ultima("guardar_privado_depois")
        expect(depois).toMatch(/security definer\s+set search_path = ''/)
        expect(depois).toMatch(chave)
        expect(depois).toMatch(/perform pg_catalog\.set_config\(v_chave, '', true\);/)
        // Sem a configuração do de antes, falha alto em vez de gravar o detalhe nulo (I1).
        expect(depois).toMatch(
            /begin\s+if v_enviado is null then\s+raise exception 'PRIVADO_SEM_DETALHE' using errcode = 'P0001';\s+end if;\s+perform pg_catalog\.set_config/,
        )
        expect(depois).toMatch(/insert into public\.transacoes_privadas/)
        expect(depois).not.toMatch(/update public\.transactions|insert into public\.transactions/)
        expect(antes).not.toMatch(/update public\.transactions|insert into public\.transactions/)
        expect(sql).toMatch(
            /create trigger guardar_privado_depois\s+after insert on public\.transactions\s+for each row\s+when \(new\.is_private\)\s+execute function public\.guardar_privado_depois\(\);/,
        )
    })

    it("desmarcar devolve a descrição, a categoria e o capture_meta, e apaga a linha de lá", () => {
        const fn = ultima("guardar_privado")
        const bloco = fn.match(/if not new\.is_private then\s+select \* into v_lado[\s\S]*?return new;\s+end if;/)
        expect(bloco).not.toBeNull()
        expect(bloco![0]).toMatch(/new\.description := v_lado\.description;/)
        expect(bloco![0]).toMatch(/new\.category_id := v_lado\.category_id;/)
        expect(bloco![0]).toMatch(/new\.capture_meta := v_lado\.capture_meta;/)
        expect(bloco![0]).toMatch(/delete from public\.transacoes_privadas p where p\.transaction_id = old\.id;/)
        // Desmarcar não passa pela régua de onde o privado vale.
        const desmarca = fn.search(/if not new\.is_private then\s+select/)
        expect(desmarca).toBeGreaterThan(-1)
        expect(desmarca).toBeLessThan(fn.indexOf("v_pode :="))
    })

    it("transactions: o update e o delete ganham o privado no ramo do adulto; o convidado fica como no 7A", () => {
        const upd = politicaFinal("public.transactions", "update")
        expect(upd.arquivo).toBe(MIGRACAO)
        expect(upd.texto).toContain(`using ( ${ADULTO_SEM_PRIVADA_ALHEIA} or ${CONVIDADO} )`)
        expect(upd.texto).toContain(
            `with check ( ${ADULTO_SEM_PRIVADA_ALHEIA} or (user_id = (select auth.uid()) and public.is_workspace_member(workspace_id) and type = 'expense') )`,
        )
        const del = politicaFinal("public.transactions", "delete")
        expect(del.arquivo).toBe(MIGRACAO)
        expect(del.texto).toContain(`using ( ${ADULTO_SEM_PRIVADA_ALHEIA} or ${CONVIDADO} )`)

        // O select e o insert ficam os do 7A: todo adulto vê a linha mascarada.
        for (const comando of ["select", "insert"]) {
            const p = politicaFinal("public.transactions", comando)
            expect(p.arquivo, comando).toBe("20261029120000_papeis.sql")
            expect(p.texto, comando).not.toMatch(/is_private/)
        }
    })

    it("a conferência: num cartão com titular, só o titular e o dono", () => {
        const fn = ultima("conferencia_liberada")
        expect(fn).toMatch(/stable\s+security definer\s+set search_path = ''/)
        expect(fn).toMatch(/select public\.is_workspace_owner\(p_workspace_id\)\s+or not exists \(/)
        expect(fn).toMatch(/c\.holder_user_id is not null\s+and c\.holder_user_id is distinct from \(select auth\.uid\(\)\)/)
        expect(sql).toMatch(/revoke all on function public\.conferencia_liberada\(uuid, uuid\) from public, anon;/)

        for (const comando of ["select", "insert", "update", "delete"]) {
            const p = politicaFinal("public.credit_card_statement_totals", comando)
            expect(p.arquivo, comando).toBe(MIGRACAO)
            // O 7A fica: só o adulto.
            expect(p.texto, comando).toMatch(/public\.is_workspace_adult\(workspace_id\) and/)
            expect(p.texto, comando).toMatch(/public\.conferencia_liberada\(workspace_id, credit_card_id\)/)
        }
        expect(politicaFinal("public.credit_card_statement_totals", "insert").texto).toMatch(/created_by = \(select auth\.uid\(\)\)/)
        expect(politicaFinal("public.credit_card_statement_totals", "update").texto).toMatch(
            /with check \(public\.is_workspace_adult\(workspace_id\) and public\.conferencia_liberada\(workspace_id, credit_card_id\)\)/,
        )
    })

    it("anexos: a privada alheia e a fatura de outro titular somem, por fora dos ramos do 7A", () => {
        const oculto = ultima("anexo_oculto")
        expect(oculto).toMatch(/stable\s+security definer\s+set search_path = ''/)
        expect(oculto).toMatch(/t\.id = p_transaction_id\s+and t\.is_private\s+and t\.user_id is distinct from \(select auth\.uid\(\)\)/)
        expect(oculto).toMatch(/s\.id = p_statement_total_id\s+and not public\.conferencia_liberada\(s\.workspace_id, s\.credit_card_id\)/)

        for (const comando of ["select", "insert", "delete"]) {
            const p = politicaFinal("public.attachments", comando)
            expect(p.arquivo, comando).toBe(MIGRACAO)
            expect(p.texto, comando).toMatch(/\) and not public\.anexo_oculto\(transaction_id, statement_total_id\) \)$/)
            // Os ramos do 7A continuam.
            expect(p.texto, comando).toMatch(/public\.is_workspace_adult\(workspace_id\) or \( public\.is_workspace_member\(workspace_id\) and /)
        }
        expect(politicaFinal("public.attachments", "insert").texto).toMatch(/bill_instance_id is null and statement_total_id is null/)
    })

    it("storage: o objeto do anexo oculto some antes da pasta; o upload fica", () => {
        const fn = ultima("objeto_de_anexo_oculto")
        expect(fn).toMatch(/stable\s+security definer\s+set search_path = ''/)
        expect(fn).toMatch(/where a\.path = p_name\s+and public\.anexo_oculto\(a\.transaction_id, a\.statement_total_id\)/)

        const doBucket = (p: Politica) => p.texto.includes("bucket_id = 'attachments'")
        for (const comando of ["select", "delete"]) {
            const p = politicaFinal("storage.objects", comando, doBucket)
            expect(p.arquivo, comando).toBe(MIGRACAO)
            expect(p.texto, comando).toMatch(
                /bucket_id = 'attachments' and not public\.objeto_de_anexo_oculto\(objects\.name\) and \( owner_id = /,
            )
            expect(p.texto, comando).toMatch(/then public\.is_workspace_adult\(/)
            expect(p.texto, comando).toMatch(/owner_id = \(select auth\.uid\(\)\)::text/)
            expect(p.texto, comando).toMatch(/else false end/)
        }
        expect(politicaFinal("storage.objects", "insert", doBucket).arquivo).not.toBe(MIGRACAO)
        expect(sql).toMatch(/exception\s+when insufficient_privilege then/)
    })

    it("os helpers não são do anon, e os gatilhos não se executam", () => {
        for (const assinatura of ["anexo_oculto(uuid, uuid)", "objeto_de_anexo_oculto(text)", "conferencia_liberada(uuid, uuid)"]) {
            const esc = assinatura.replace(/[()]/g, "\\$&")
            expect(sql).toMatch(new RegExp(`revoke all on function public\\.${esc} from public, anon;`))
            expect(sql).toMatch(new RegExp(`grant execute on function public\\.${esc} to authenticated, service_role;`))
        }
        for (const gatilho of ["conferir_titular", "guardar_privado", "guardar_privado_depois", "recusar_conta_na_privada"]) {
            expect(sql).toMatch(new RegExp(`revoke all on function public\\.${gatilho}\\(\\) from public, anon, authenticated;`))
        }
    })

    it("só acrescenta: nenhum drop de tabela, coluna, função ou constraint", () => {
        expect(sql).not.toMatch(/drop (table|column|function|constraint|index|view)\b/i)
        // Os drops que restam são os `if exists` de política e gatilho, recriados logo abaixo.
        for (const m of sql.matchAll(/drop (policy|trigger) if exists ("[^"]+"|\w+) on [\w.]+;/g)) {
            expect(sql, m[0]).toContain(`create ${m[1]} ${m[2]}`)
        }
    })

    it("Ruling 4: só o dono define ou troca o titular; o titular só limpa o próprio", () => {
        const fn = ultima("conferir_titular")
        expect(fn).toMatch(/v_uid uuid := auth\.uid\(\);/)
        // Insert com titular, ou troca: o dono ou quem chama sem sessão.
        expect(fn).toMatch(
            /if v_uid is not null\s+and not public\.is_workspace_owner\(new\.workspace_id\)\s+and not \(\s*tg_op = 'UPDATE'\s+and new\.holder_user_id is null\s+and old\.holder_user_id = v_uid\s*\) then\s+raise exception 'TITULAR_SO_DONO'/,
        )
        // O adulto só é conferido quando há titular novo.
        expect(fn).toMatch(/if new\.holder_user_id is not null and not exists \(/)
        expect(fn.indexOf("'TITULAR_SO_DONO'")).toBeGreaterThan(-1)
        expect(fn.indexOf("'TITULAR_NAO_ADULTO'")).toBeGreaterThan(fn.indexOf("'TITULAR_SO_DONO'"))
        // Dois gatilhos: o update dispara também quando o titular vira nulo.
        expect(sql).toMatch(
            /create trigger conferir_titular\s+before insert on public\.credit_cards\s+for each row\s+when \(new\.holder_user_id is not null\)/,
        )
        expect(sql).toMatch(
            /create trigger conferir_titular_troca\s+before update of holder_user_id, workspace_id on public\.credit_cards\s+for each row\s+when \(new\.holder_user_id is distinct from old\.holder_user_id or new\.workspace_id is distinct from old\.workspace_id\)\s+execute function public\.conferir_titular\(\);/,
        )
    })

    it("I1: o objeto sem linha em attachments fica fechado, menos para quem subiu e para o dono", () => {
        const doBucket = (p: Politica) => p.texto.includes("bucket_id = 'attachments'")
        for (const comando of ["select", "delete"]) {
            const p = politicaFinal("storage.objects", comando, doBucket)
            expect(p.texto, comando).toContain(
                "and ( owner_id = (select auth.uid())::text or exists ( select 1 from public.attachments a where a.path = objects.name ) or case when (storage.foldername(name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then public.is_workspace_owner(((storage.foldername(name))[1])::uuid) else false end ) and case when",
            )
        }
    })

    it("I3: virar_assinatura e virar_conta deixam a privada de fora, sem abortar", () => {
        const assinatura = ultima("virar_assinatura")
        expect(assinatura).toMatch(/security invoker/)
        expect(assinatura).toMatch(
            /and x\.subscription_id is null\s+and not x\.is_private\s+and not exists \(select 1 from public\.bill_instances i where i\.transaction_id = x\.id\)/,
        )
        const conta = ultima("virar_conta")
        expect(conta).toMatch(/security invoker/)
        expect(conta).toMatch(
            /and t\.subscription_id is null\s+and not t\.is_private\s+and not exists \(select 1 from public\.bill_instances i where i\.transaction_id = t\.id\);/,
        )
        // O resto é o corpo de 20261028120000, sem tirar nada.
        const original = lerFonte("supabase/migrations/20261028120000_insights.sql").replace(/--.*$/gm, "")
        for (const [nome, filtro] of [["virar_assinatura", /\n\s+and not x\.is_private/], ["virar_conta", /\n\s+and not t\.is_private/]] as const) {
            const antes = original.match(new RegExp(`create or replace function public\\.${nome}\\([\\s\\S]*?\\$\\$[\\s\\S]*?\\$\\$`))![0]
            expect(ultima(nome).replace(filtro, ""), nome).toBe(antes)
        }
        for (const assinaturaSql of [
            "virar_assinatura(uuid, text, numeric, smallint, text, uuid, uuid)",
            "virar_conta(uuid, text, smallint, boolean, uuid, date)",
        ]) {
            const esc = assinaturaSql.replace(/[()]/g, "\\$&")
            expect(sql).toMatch(new RegExp(`revoke all on function public\\.${esc} from public, anon;`))
            expect(sql).toMatch(new RegExp(`grant execute on function public\\.${esc} to authenticated;`))
        }
    })

    it("o TS: is_private, holder_user_id e transacoes_privadas", () => {
        expect(tipos).toMatch(/is_private: boolean\n/)
        expect(tipos).toMatch(/is_private\?: boolean\n/)
        expect(tipos).toMatch(/holder_user_id: string \| null/)
        expect(tipos).toMatch(/transacoes_privadas: \{/)
        expect(supabaseTs).toMatch(/is_private\?: boolean/)
        expect(supabaseTs).toMatch(/holder_user_id\?: string \| null/)
    })
})
