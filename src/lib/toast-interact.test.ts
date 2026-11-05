import { describe, expect, it } from "vitest"

import { ignorarToqueNoToast } from "@/lib/toast-interact"

const evento = (alvo: unknown) => {
    let impedido = false
    const e = { target: alvo, preventDefault: () => void (impedido = true) } as unknown as Event
    ignorarToqueNoToast(e)
    return impedido
}

describe("ignorarToqueNoToast", () => {
    it("impede o fechamento quando o toque é dentro do toaster", () => {
        expect(evento({ closest: (s: string) => (s === "[data-sonner-toaster]" ? {} : null) })).toBe(true)
    })
    it("deixa passar o toque em qualquer outro lugar", () => {
        expect(evento({ closest: () => null })).toBe(false)
        expect(evento(null)).toBe(false)
    })
})
