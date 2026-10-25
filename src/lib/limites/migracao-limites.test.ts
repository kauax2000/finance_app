import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"

// O `--` do SQL sai aqui, para as asserções de ausência não lerem a prosa.
const sql = semComentarios(lerFonte("supabase/migrations/20261029130000_limites.sql")).replace(/--.*$/gm, "")
const edge = semComentarios(lerFonte("supabase/functions/evaluate-budgets/index.ts"))

const politica = (nome: string) => {
    const pol = sql.match(new RegExp(`create policy ${nome} on public\\.workspace_member_limits[\\s\\S]*?;\\n`))
    expect(pol, nome).not.toBeNull()
    return pol![0]
}

describe("migração limites", () => {
    it("a tabela do limite: valor positivo e uma linha por pessoa e carteira", () => {
        expect(sql).toMatch(/create table if not exists public\.workspace_member_limits \(/)
        expect(sql).toMatch(/amount numeric\(12,2\) not null check \(amount > 0\)/)
        expect(sql).toMatch(/primary key \(workspace_id, user_id\)\n\);/)
        expect(sql).toMatch(/alter table public\.workspace_member_limits enable row level security;/)
    })

    it("RLS: o adulto ou a própria pessoa lê; só o dono escreve", () => {
        expect(politica("workspace_member_limits_select")).toMatch(
            /for select to authenticated\s+using \(public\.is_workspace_adult\(workspace_id\) or user_id = \(select auth\.uid\(\)\)\);/,
        )
        expect(politica("workspace_member_limits_insert")).toMatch(/with check \(public\.is_workspace_owner\(workspace_id\)\);/)
        const up = politica("workspace_member_limits_update")
        expect(up).toMatch(/using \(public\.is_workspace_owner\(workspace_id\)\)/)
        expect(up).toMatch(/with check \(public\.is_workspace_owner\(workspace_id\)\);/)
        expect(politica("workspace_member_limits_delete")).toMatch(/using \(public\.is_workspace_owner\(workspace_id\)\);/)
        expect(sql.match(/create policy \w+ on public\.workspace_member_limits/g)).toHaveLength(4)
    })

    it("limites_avisados: o dedupe por mês e nível, RLS ligada e sem política", () => {
        expect(sql).toMatch(/create table if not exists public\.limites_avisados \(/)
        expect(sql).toMatch(/nivel smallint not null check \(nivel in \(80, 100\)\)/)
        expect(sql).toMatch(/primary key \(workspace_id, user_id, ym, nivel\)/)
        expect(sql).toMatch(/alter table public\.limites_avisados enable row level security;/)
        expect(sql).toMatch(/revoke all on public\.limites_avisados from anon, authenticated;/)
        expect(sql).not.toMatch(/policy \w+ on public\.limites_avisados/)
    })

    it("os dois checks de kind ganham limite_pessoa, com not valid + validate", () => {
        for (const [tabela, nome] of [
            ["insights", "insights_kind_check"],
            ["insights_silenciados", "insights_silenciados_kind_check"],
        ]) {
            expect(sql).toContain(`alter table public.${tabela} drop constraint if exists ${nome};`)
            const add = sql.match(new RegExp(`add constraint ${nome}\\s+check \\(kind in \\(([^)]*)\\)\\)\\s+not valid;`))
            expect(add, nome).not.toBeNull()
            expect(add![1]).toContain("'a_conferir', 'limite_pessoa'")
            expect(add![1].split(",")).toHaveLength(11)
            expect(sql).toContain(`alter table public.${tabela} validate constraint ${nome};`)
        }
    })
})

describe("evaluate-budgets: o limite da pessoa", () => {
    it("reivindica em limites_avisados com on conflict do nothing antes de avisar", () => {
        const claim = edge.indexOf(".from('limites_avisados')")
        expect(claim).toBeGreaterThan(-1)
        expect(edge.slice(claim, claim + 400)).toContain("ignoreDuplicates: true")
        expect(edge.slice(claim, claim + 400)).toContain("onConflict: 'workspace_id,user_id,ym,nivel'")
        const aviso = edge.indexOf("kind: 'member_limit'")
        expect(aviso).toBeGreaterThan(claim)
        expect(edge).toContain("type: 'budget'")
    })

    it("avisa a pessoa e os donos, sem repetir, e o 100 grava o 80 junto", () => {
        expect(edge).toContain("[...new Set([autorId, ...donosDaCarteira(membros)])]")
        expect(edge).toContain("nivel === 100 ? [80, 100] : [80]")
        expect(edge).toContain("if (!reivindicados.includes(nivel)) continue")
    })

    it("o insight entra por inserir_insights com user_id preenchido e a chave da pessoa", () => {
        const ins = edge.indexOf("rpc('inserir_insights'")
        expect(ins).toBeGreaterThan(-1)
        const bloco = edge.slice(ins, ins + 400)
        expect(bloco).toContain("user_id: quem,")
        expect(bloco).toContain("kind: 'limite_pessoa'")
        expect(bloco).toContain("dedupe_key: `lim:${autorId}:${ym}:${nivel}`")
    })

    it("o limite roda antes da troca da resposta do convidado e sem depender do orçamento", () => {
        expect(edge.indexOf("await avaliarLimite(")).toBeLessThan(edge.indexOf(".from('budgets')"))
        expect(edge).toContain("return ctx.convidado ? json(200, { ok: true }) : res")
    })

    it("o autor: quem chama pelo JWT, ou o user_id do caminho de serviço (capture)", () => {
        expect(edge).toMatch(/const autorId = userId \?\? \(typeof body\.user_id === 'string'/)
        expect(semComentarios(lerFonte("supabase/functions/capture/index.ts"))).toMatch(
            /avaliar\('evaluate-budgets', \{[\s\S]*?user_id: userId,[\s\S]*?\}\)/,
        )
    })
})
