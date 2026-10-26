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

function ultima(nome: string, arquivo = MIGRACAO): string {
    const fn = ULTIMA.get(nome)
    expect(fn, nome).toBeDefined()
    expect(fn!.arquivo, nome).toBe(arquivo)
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

describe("migração do 7B: o titular do cartão e a conferência", () => {
    it("o titular do cartão: nulo é o cartão da casa, e o gatilho exige adulto da carteira", () => {
        expect(sql).toMatch(
            /alter table public\.credit_cards\s+add column if not exists holder_user_id uuid references auth\.users\(id\) on delete set null;/,
        )
        const fn = ultima("conferir_titular")
        expect(fn).toMatch(/security definer\s+set search_path = ''/)
        expect(fn).toMatch(/wm\.workspace_id = new\.workspace_id\s+and wm\.user_id = new\.holder_user_id\s+and wm\.role in \('owner', 'member'\)/)
        expect(fn).toMatch(/raise exception 'TITULAR_NAO_ADULTO'/)
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

    it("anexos: a fatura de outro titular some, por fora dos ramos do 7A", () => {
        const oculto = ultima("anexo_oculto")
        expect(oculto).toMatch(/^create or replace function public\.anexo_oculto\(p_statement_total_id uuid\)/)
        expect(oculto).toMatch(/stable\s+security definer\s+set search_path = ''/)
        expect(oculto).toMatch(/s\.id = p_statement_total_id\s+and not public\.conferencia_liberada\(s\.workspace_id, s\.credit_card_id\)/)
        // Só a fatura: a transação não esconde anexo nenhum.
        expect(oculto).not.toMatch(/public\.transactions/)

        for (const comando of ["select", "insert", "delete"]) {
            const p = politicaFinal("public.attachments", comando)
            expect(p.arquivo, comando).toBe(MIGRACAO)
            expect(p.texto, comando).toMatch(/\) and not public\.anexo_oculto\(statement_total_id\) \)$/)
            // Os ramos do 7A continuam.
            expect(p.texto, comando).toMatch(/public\.is_workspace_adult\(workspace_id\) or \( public\.is_workspace_member\(workspace_id\) and /)
        }
        expect(politicaFinal("public.attachments", "insert").texto).toMatch(/bill_instance_id is null and statement_total_id is null/)
    })

    it("storage: o objeto do anexo oculto some antes da pasta; o upload fica", () => {
        const fn = ultima("objeto_de_anexo_oculto")
        expect(fn).toMatch(/stable\s+security definer\s+set search_path = ''/)
        expect(fn).toMatch(/where a\.path = p_name\s+and public\.anexo_oculto\(a\.statement_total_id\)/)

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
        for (const assinatura of ["anexo_oculto(uuid)", "objeto_de_anexo_oculto(text)", "conferencia_liberada(uuid, uuid)"]) {
            const esc = assinatura.replace(/[()]/g, "\\$&")
            expect(sql).toMatch(new RegExp(`revoke all on function public\\.${esc} from public, anon;`))
            expect(sql).toMatch(new RegExp(`grant execute on function public\\.${esc} to authenticated, service_role;`))
        }
        for (const gatilho of ["conferir_titular"]) {
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

    it("Bloco 9: transactions e os virar_* ficam os de antes do 7B, sem ramo de privado", () => {
        // As políticas de transactions são as do 7A, com a onda final dele (o convidado só despesa).
        for (const comando of ["select", "insert", "update", "delete"]) {
            const p = politicaFinal("public.transactions", comando)
            expect(p.arquivo, comando).toBe("20261029120000_papeis.sql")
        }
        expect(politicaFinal("public.transactions", "update").texto).toMatch(/and type = 'expense'\) \)$/)
        // Os virar_* são os de 20261028120000.
        ultima("virar_assinatura", "20261028120000_insights.sql")
        ultima("virar_conta", "20261028120000_insights.sql")
        // O 7C não leva mais regra de privado para a divisão nem para o projeto.
        for (const nome of ["definir_quem_pagou", "refazer_partes", "definir_partes"]) {
            expect(ultima(nome, "20261031130000_divisao.sql"), nome).not.toMatch(/privad/)
        }
        expect(sql).not.toMatch(/ on public\.transactions\b/)
    })

    it("o TS: holder_user_id", () => {
        expect(tipos).toMatch(/holder_user_id: string \| null/)
        expect(supabaseTs).toMatch(/holder_user_id\?: string \| null/)
    })
})
