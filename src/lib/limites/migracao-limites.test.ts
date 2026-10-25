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
        expect(sql).toMatch(/primary key \(workspace_id, user_id\),/)
        expect(sql).toMatch(/alter table public\.workspace_member_limits enable row level security;/)
    })

    it("o limite e o dedupe são de um membro: chave estrangeira em workspace_members, em cascata", () => {
        const fk = /foreign key \(workspace_id, user_id\) references public\.workspace_members\(workspace_id, user_id\) on delete cascade/g
        expect(sql.match(fk)).toHaveLength(2)
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
    it("reivindica em limites_avisados com on conflict do nothing antes do insight e do aviso", () => {
        const claim = edge.indexOf(".from('limites_avisados')")
        expect(claim).toBeGreaterThan(-1)
        expect(edge.slice(claim, claim + 400)).toContain("ignoreDuplicates: true")
        expect(edge.slice(claim, claim + 400)).toContain("onConflict: 'workspace_id,user_id,ym,nivel'")
        expect(edge.indexOf("rpc('inserir_insights'")).toBeGreaterThan(claim)
        expect(edge.indexOf("kind: 'member_limit'")).toBeGreaterThan(edge.indexOf("rpc('inserir_insights'"))
        expect(edge).toContain("type: 'budget'")
    })

    it("a decisão de nível e destinatários é a das funções puras (testadas no Deno)", () => {
        expect(edge).toContain("decidirAvisosDoLimite(autorId, membros, gasto, limiteCentavos)")
        expect(edge).toContain("nivelNovo(nivel, reivindicados)")
        expect(edge).toContain("destinoDoAvisoDoLimite(")
    })

    it("o insight entra por inserir_insights com user_id preenchido, sem papel, e a falha libera a reivindicação", () => {
        const ins = edge.indexOf("rpc('inserir_insights'")
        const bloco = edge.slice(ins, ins + 600)
        expect(bloco).toContain("user_id: quem,")
        expect(bloco).toContain("kind: 'limite_pessoa'")
        expect(bloco).toContain("dedupe_key: `lim:${autorId}:${ym}:${nivel}`")
        expect(bloco).toMatch(/if \(insErr\) \{[\s\S]*?await liberar\(\)\s*continue\s*\}/)
        const payload = edge.match(/const payloadDe = \(quem: string\) => \(\{[\s\S]*?\}\)/)
        expect(payload).not.toBeNull()
        expect(payload![0]).not.toContain("papel")
    })

    it("o erro do perfil vai para o log", () => {
        expect(edge).toMatch(/if \(profErr\) console\.error\('evaluate-budgets: limite perfis', profErr\)/)
    })

    it("com transaction_id, carteira e autor saem da linha lida pela service role, nunca do corpo", () => {
        expect(edge).toMatch(/\.from\('transactions'\)\s*\.select\('workspace_id,user_id,type,category_id,date,payment_method,payment_credit_card_id'\)\s*\.eq\('id', body\.transaction_id\)/)
        expect(edge).toContain("const autorId = lanc ? lanc.user_id : userId")
        expect(edge).toContain("let workspaceId: string | null = lanc?.workspace_id ?? null")
        expect(edge).not.toMatch(/body\.user_id/)
        // O membro de outra carteira cai no 403 antes de qualquer aviso.
        expect(edge.indexOf("return json(403, { error: 'Not a member of this workspace' })")).toBeLessThan(
            edge.indexOf("await avaliarLimite("),
        )
        expect(edge).toContain("if (ctx.convidado && lanc && lanc.user_id !== userId)")
    })

    it("o limite roda antes do no_category final e da busca de orçamento, e a resposta do convidado continua só ok", () => {
        const limite = edge.indexOf("await avaliarLimite(")
        const semCategoria = edge.lastIndexOf("reason: 'no_category'")
        expect(limite).toBeGreaterThan(-1)
        expect(semCategoria).toBeGreaterThan(limite)
        expect(edge.indexOf(".from('budgets')")).toBeGreaterThan(limite)
        expect(edge).toContain("return ctx.convidado ? json(200, { ok: true }) : res")
    })

    it("o capture manda o id da linha e chama sem a guarda de categoria", () => {
        const cap = semComentarios(lerFonte("supabase/functions/capture/index.ts"))
        expect(cap).toMatch(/const chamadas: Promise<void>\[\] = \[\s*avaliar\('evaluate-budgets', \{\s*transaction_id: gravado\.id,/)
        expect(cap).not.toMatch(/if \(linha\.category_id\) \{\s*chamadas\.push\(avaliar\('evaluate-budgets'/)
        expect(cap).not.toMatch(/user_id: userId,\s*\}\)\)/)
    })

    it("o cliente manda o id da linha, ou a carteira quando não há um id só", () => {
        const corpo = (arquivo: string) => {
            const f = semComentarios(lerFonte(arquivo))
            return [...f.matchAll(/invokeEdgeJson\("evaluate-budgets", \{[\s\S]*?\n\s*\}\)/g)].map((m) => m[0])
        }
        const sheet = corpo("src/lib/transaction-detail-sheet-mutations.ts")
        expect(sheet).toHaveLength(2)
        expect(sheet[0]).toContain("transaction_id: payload.editingId")
        expect(sheet[1]).toContain("transaction_id: result.id")
        expect(corpo("src/lib/offline/handlers/transactions.ts")[0]).toContain("transaction_id: inserted.id")
        expect(corpo("src/components/transactions/transaction-form-persistence.ts")[0]).toContain("workspace_id: workspaceId")
        expect(corpo("src/lib/bills/pay-bill-flow.ts")[0]).toContain("workspace_id: workspaceId")
    })
})
