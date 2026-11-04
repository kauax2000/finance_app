import { describe, expect, it, vi } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"

vi.mock("@/lib/supabase", () => ({ supabase: {} }))
vi.mock("@/components/providers", () => ({ useAuth: () => ({ user: null }) }))

import { lerLancamentoInteligente, migrarPreferenciaLocal } from "./use-lancamento-inteligente"

const CHAVE = "finance:preferencia:lancamento-inteligente"

function armazenamento(valor: string | null) {
    const mapa = new Map<string, string>(valor == null ? [] : [[CHAVE, valor]])
    return {
        getItem: (k: string) => mapa.get(k) ?? null,
        removeItem: (k: string) => void mapa.delete(k),
        tem: () => mapa.has(CHAVE),
    }
}

describe("lerLancamentoInteligente", () => {
    it("liga sem armazenamento, sem valor ou com erro", () => {
        expect(lerLancamentoInteligente(null)).toBe(true)
        expect(lerLancamentoInteligente({ getItem: () => null })).toBe(true)
        expect(
            lerLancamentoInteligente({
                getItem: () => {
                    throw new Error()
                },
            }),
        ).toBe(true)
    })
    it('desliga só com "0"', () => {
        expect(lerLancamentoInteligente({ getItem: () => "0" })).toBe(false)
    })
})

describe("migrarPreferenciaLocal", () => {
    it('com "0" e a conta nunca escolhida, grava false e apaga a chave', async () => {
        const s = armazenamento("0")
        const gravar = vi.fn(async () => {})
        expect(await migrarPreferenciaLocal("u", s, async () => ({ valor: true, em: null }), gravar)).toBe(true)
        expect(gravar).toHaveBeenCalledWith(false)
        expect(s.tem()).toBe(false)
    })
    it("sem linha na conta também grava", async () => {
        const gravar = vi.fn(async () => {})
        expect(await migrarPreferenciaLocal("u", armazenamento("0"), async () => null, gravar)).toBe(true)
        expect(gravar).toHaveBeenCalledWith(false)
    })
    it("com a conta já escolhida não grava, e a chave sai", async () => {
        const s = armazenamento("0")
        const gravar = vi.fn(async () => {})
        expect(await migrarPreferenciaLocal("u", s, async () => ({ valor: true, em: "2026-11-01T00:00:00Z" }), gravar)).toBe(false)
        expect(gravar).not.toHaveBeenCalled()
        expect(s.tem()).toBe(false)
    })
    it("sem chave não lê nem grava", async () => {
        const ler = vi.fn(async () => null)
        const gravar = vi.fn(async () => {})
        expect(await migrarPreferenciaLocal("u", armazenamento(null), ler, gravar)).toBe(false)
        expect(ler).not.toHaveBeenCalled()
        expect(gravar).not.toHaveBeenCalled()
    })
    it("se gravar falha, a chave fica para a próxima vez", async () => {
        const s = armazenamento("0")
        await expect(
            migrarPreferenciaLocal("u", s, async () => null, async () => {
                throw new Error("rede")
            }),
        ).rejects.toThrow()
        expect(s.tem()).toBe(true)
    })
})

describe("a fonte é a conta", () => {
    const f = semComentarios(lerFonte("src/hooks/use-lancamento-inteligente.ts"))
    it("lê user_settings.lancamento_inteligente e grava o momento da escolha", () => {
        expect(f).toContain('from("user_settings")')
        expect(f).toContain(".select(\"lancamento_inteligente, lancamento_inteligente_em\")")
        expect(f).toMatch(/lancamento_inteligente_em: new Date\(\)\.toISOString\(\)/)
        expect(f).toContain('["lancamento_inteligente", userId]')
        expect(f).toContain("ensureUserSettingsRow(userId)")
        expect(f).not.toContain("localStorage.setItem")
    })
    it("o interruptor diz que vale na conta", () => {
        expect(lerFonte("src/components/settings/neste-celular-grupo.tsx")).toContain(
            "vale na conta, inclusive no atalho do iPhone",
        )
    })
})
