import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"

/**
 * O auth-js emite SIGNED_IN a cada vez que a aba volta a ficar visível. Se o
 * AuthProvider registrar a sessão a cada SIGNED_IN, cada foco vira duas
 * chamadas à Edge `sessions` e um UPDATE em `user_sessions` — foi metade do
 * tempo do banco em produção.
 */
describe("a sessão do aparelho é registrada uma vez por carregamento", () => {
    it("o SIGNED_IN repetido do mesmo usuário não chama createSession de novo", () => {
        const fonte = semComentarios(lerFonte("src/components/providers.tsx"))
        expect(fonte).toMatch(
            /event === "SIGNED_IN" && session && sessaoRegistradaRef\.current !== session\.user\.id\)\s*\{\s*sessaoRegistradaRef\.current = session\.user\.id/,
        )
        expect(fonte).toMatch(/event === "SIGNED_OUT"\) \{[^}]*sessaoRegistradaRef\.current = null/)
    })

    it("a sessão registrada há menos de 6 h não é registrada de novo no carregamento", () => {
        const fonte = semComentarios(lerFonte("src/components/providers.tsx"))
        expect(fonte).toContain("if (sessionRegisteredRecently()) return")
        expect(semComentarios(lerFonte("src/lib/sessions.ts"))).toContain("SESSION_TOUCH_MS = 6 * 60 * 60 * 1000")
    })

    it("o mesmo usuário mantém o mesmo objeto (os efeitos que dependem dele não repetem consultas)", () => {
        const fonte = semComentarios(lerFonte("src/components/providers.tsx"))
        expect(fonte).toContain("setUser((prev) => mesmoUsuario(prev, session.user))")
        expect(fonte).toContain("setUser((prev) => mesmoUsuario(prev, nextUser))")
        expect(fonte).not.toContain("ensureUserSettingsRow")
    })

    it("a cobrança atrasada roda uma vez por dia por carteira", () => {
        const fonte = semComentarios(lerFonte("src/lib/queries/use-recurring-billing-catchup.ts"))
        expect(fonte).toContain("if (rodouHoje(workspaceId, hoje)) return")
        expect(fonte).toContain("marcarHoje(workspaceId, hoje)")
    })
})
