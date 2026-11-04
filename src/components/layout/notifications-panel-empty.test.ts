import { describe, expect, it } from "vitest"
import { preferenciasDeNotificacaoHref } from "@/components/layout/notifications-panel-empty"

describe("preferenciasDeNotificacaoHref", () => {
    it("celular abre a tela própria; desktop, a âncora das Configurações", () => {
        expect(preferenciasDeNotificacaoHref(true)).toBe("/settings/notificacoes")
        expect(preferenciasDeNotificacaoHref(false)).toBe("/settings#notificacoes")
    })
})
