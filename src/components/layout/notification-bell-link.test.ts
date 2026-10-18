import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"

const fonte = semComentarios(lerFonte("src/components/layout/notification-bell-link.tsx"))

describe("sino de notificações (fonte)", () => {
    it("refaz a contagem quando o badgeNonce muda", () => {
        expect(fonte).toContain("badgeNonce")
    })

    it("sonda a cada BELL_POLL_MS e só com a aba visível", () => {
        expect(fonte).toContain("BELL_POLL_MS")
        expect(fonte).toContain("visibilityState")
        expect(fonte).toContain("clearInterval")
    })

    it("só a resposta mais recente vale (sequência comparada antes do setUnreadCount)", () => {
        expect(fonte).toMatch(/seq/)
        expect(fonte).toMatch(/seq !== seqRef\.current|seqRef\.current !== seq/)
    })

    it("invalida o painel só quando o número do servidor muda (não na primeira carga)", () => {
        expect(fonte).toMatch(/useRef<number \| null>\(null\)/)
        expect(fonte).toMatch(/if \(anterior !== null && anterior !== n\) invalidateUnreadBadge\(\)/)
    })
})
