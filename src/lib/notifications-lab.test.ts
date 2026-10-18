import { describe, expect, it } from "vitest"
import { notificationsLabVersion } from "./notifications-lab"

describe("laboratório do fundo das notificações", () => {
    it("o nome do quadro escolhe a versão, e fora dele vale o vidro", () => {
        expect(notificationsLabVersion("notificacoes:chapada")).toBe("chapada")
        expect(notificationsLabVersion("notificacoes:vidro")).toBe("vidro")
        expect(notificationsLabVersion("")).toBe("vidro")
        expect(notificationsLabVersion("barra:edge")).toBe("vidro")
        expect(notificationsLabVersion("notificacoes:outra")).toBe("vidro")
    })
})
