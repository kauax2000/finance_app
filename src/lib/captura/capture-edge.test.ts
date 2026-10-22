import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"

const fonte = (caminho: string) => semComentarios(lerFonte(caminho))
const CAPTURE = "supabase/functions/capture/index.ts"

describe("Edge capture", () => {
    it("o retry com o mesmo id não duplica (Foco 1)", () => {
        const f = fonte(CAPTURE)
        expect(f).toContain("ignoreDuplicates: true")
        expect(f).toContain("onConflict: 'workspace_id,client_id'")
        expect(f).toContain("clientIdDoPedido(")
    })

    it("o retry acha o lançamento anterior em qualquer carteira da pessoa, e relê no conflito", () => {
        const f = fonte(CAPTURE)
        expect(f).toContain("pedido.id ? await clientIdDoPedido(tokenId, pedido.id) : null")
        const antes = f.indexOf(".in('workspace_id', carteirasDaPessoa)\n      .eq('client_id', clientId)")
        expect(antes).toBeGreaterThan(-1)
        expect(f.indexOf(".upsert(")).toBeGreaterThan(antes)
        const releitura = f.indexOf(".eq('client_id', clientId)", f.indexOf(".upsert("))
        expect(releitura).toBeGreaterThan(-1)
    })

    it("um retry não roda os avaliadores de novo; eles vão com o Bearer da service role", () => {
        const f = fonte(CAPTURE)
        const gate = f.indexOf("if (novo && linha.type === 'expense')")
        expect(gate).toBeGreaterThan(-1)
        expect(f.indexOf("'evaluate-budgets'")).toBeGreaterThan(gate)
        expect(f.indexOf("'evaluate-credit-card-alerts'")).toBeGreaterThan(gate)
        expect(f).toContain("Authorization: `Bearer ${serviceKey}`")
        expect(f).not.toContain("x-cron-secret")
    })

    it("cartões e histórico só das carteiras da pessoa (Foco 3)", () => {
        const f = fonte(CAPTURE)
        const cartoes = f.indexOf(".from('credit_cards')")
        expect(f.indexOf(".in('workspace_id', carteirasDaPessoa)", cartoes)).toBeGreaterThan(cartoes)
        expect(f).toContain("carteirasDaPessoa.map((w: string) =>")
        expect(f).toContain(".eq('workspace_id', w)")
    })

    it("o corpo é lido aos pedaços, com o teto de 16 KB, depois do formato do token", () => {
        const f = fonte(CAPTURE)
        expect(f).not.toContain("req.text()")
        expect(f).not.toContain("req.json()")
        expect(f).toContain("getReader()")
        expect(f).toMatch(/total > MAX_CORPO/)
        const formato = f.indexOf("fac_[0-9a-f]{64}")
        expect(formato).toBeGreaterThan(-1)
        expect(f.indexOf("await lerCorpo(req)")).toBeGreaterThan(formato)
    })

    it("consulta o plano da carteira padrão", () => {
        expect(fonte(CAPTURE)).toContain("rpc('workspace_plan'")
    })

    it("token revogado, desconhecido ou mal formado dão a mesma resposta (Foco 2)", () => {
        const f = fonte(CAPTURE)
        expect(f).toContain("'Token inválido.'")
        expect(f).toContain(".is('revoked_at', null)")
        // Procura pelo hash; o token em texto nunca vai ao banco.
        const hash = f.indexOf("sha256Hex(")
        const busca = f.indexOf(".from('capture_tokens')")
        expect(hash).toBeGreaterThan(-1)
        expect(busca).toBeGreaterThan(hash)
        expect(f).toContain(".eq('token_hash', ")
    })

    it("não avisa os membros por conta própria (o trigger avisa)", () => {
        expect(fonte(CAPTURE)).not.toContain("notify-transaction-created")
    })
})

describe("avaliadores pelo servidor (Decisão 9)", () => {
    for (const nome of ["evaluate-budgets", "evaluate-credit-card-alerts"]) {
        it(`${nome}: o caminho de serviço vem antes do JWT`, () => {
            const f = fonte(`supabase/functions/${nome}/index.ts`)
            const servico = f.indexOf("isServiceAuthorized(req)")
            expect(servico).toBeGreaterThan(-1)
            expect(f.indexOf("bearerJwt(")).toBeGreaterThan(servico)
            expect(f).toContain("from '../_shared/service-auth.ts'")
        })
    }

    it("notify-transaction-created usa o isServiceAuthorized compartilhado", () => {
        const f = fonte("supabase/functions/notify-transaction-created/index.ts")
        expect(f).toContain("from '../_shared/service-auth.ts'")
        expect(f).not.toContain("function isServiceAuthorized")
    })

    it("capture está no deploy e sem verificação de JWT no gateway", () => {
        expect(lerFonte("package.json")).toMatch(/"supabase:deploy:functions": "[^"]*\bcapture\b/)
        expect(lerFonte("supabase/config.toml")).toMatch(/\[functions\.capture\]\s*\nverify_jwt = false/)
    })
})
