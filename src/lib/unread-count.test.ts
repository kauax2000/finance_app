import { describe, expect, it } from "vitest"
import { BELL_POLL_MS, unreadAfterDelta, unreadAfterOpen } from "./unread-count"

describe("unread-count", () => {
    it("o número exato do servidor vence o tamanho da lista", () => {
        expect(unreadAfterOpen(140, 100)).toBe(140)
        expect(unreadAfterOpen(3, 3)).toBe(3)
    })

    it("o delta nunca leva o sino abaixo de zero", () => {
        expect(unreadAfterDelta(0, -1)).toBe(0)
        expect(unreadAfterDelta(5, -2)).toBe(3)
        expect(unreadAfterDelta(2, 1)).toBe(3)
    })

    it("sonda a cada minuto", () => {
        expect(BELL_POLL_MS).toBe(60000)
    })
})
