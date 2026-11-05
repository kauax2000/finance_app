import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { fetchComAvisoDeLentidao, LIMITE_DE_LENTIDAO_MS, servidorLentoAgora } from "@/lib/servidor-lento"

function pedidoPendente() {
    let responder!: (r: Response) => void
    let falhar!: (e: unknown) => void
    const promessa = new Promise<Response>((res, rej) => {
        responder = res
        falhar = rej
    })
    vi.spyOn(globalThis, "fetch").mockReturnValueOnce(promessa)
    return { responder, falhar }
}

describe("o aviso de servidor lento", () => {
    beforeEach(() => vi.useFakeTimers())
    afterEach(() => {
        vi.useRealTimers()
        vi.restoreAllMocks()
    })

    it("acende quando um pedido passa do limite e apaga quando ele responde", async () => {
        const p = pedidoPendente()
        void fetchComAvisoDeLentidao("https://x.supabase.co/rest/v1/workspace_members")
        vi.advanceTimersByTime(LIMITE_DE_LENTIDAO_MS - 1)
        expect(servidorLentoAgora()).toBe(false)
        vi.advanceTimersByTime(1)
        expect(servidorLentoAgora()).toBe(true)
        p.responder(new Response("[]"))
        await vi.runAllTimersAsync()
        expect(servidorLentoAgora()).toBe(false)
    })

    it("apaga também quando o pedido lento falha", async () => {
        const p = pedidoPendente()
        const pedido = fetchComAvisoDeLentidao("https://x.supabase.co/auth/v1/user")
        vi.advanceTimersByTime(LIMITE_DE_LENTIDAO_MS)
        expect(servidorLentoAgora()).toBe(true)
        p.falhar(new TypeError("Failed to fetch"))
        await expect(pedido).rejects.toThrow("Failed to fetch")
        expect(servidorLentoAgora()).toBe(false)
    })

    it("um pedido rápido não acende nada", async () => {
        const p = pedidoPendente()
        void fetchComAvisoDeLentidao("https://x.supabase.co/rest/v1/categories")
        p.responder(new Response("[]"))
        await vi.runAllTimersAsync()
        expect(servidorLentoAgora()).toBe(false)
    })

    it("Edge Function demorada não conta", () => {
        pedidoPendente()
        void fetchComAvisoDeLentidao("https://x.supabase.co/functions/v1/lancamento-inteligente")
        vi.advanceTimersByTime(LIMITE_DE_LENTIDAO_MS * 3)
        expect(servidorLentoAgora()).toBe(false)
    })
})
