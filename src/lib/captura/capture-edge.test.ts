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
