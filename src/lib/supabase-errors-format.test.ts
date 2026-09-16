import { describe, expect, it } from "vitest"
import {
    describeSupabaseErrorForLog,
    formatSupabasePostgrestError,
    userFacingFetchError,
} from "./supabase-errors"

describe("formatSupabasePostgrestError", () => {
    it("não repassa a mensagem crua do Postgres", () => {
        const raw = {
            code: "XX000",
            message: 'relation "public.x" does not exist',
            details: "internal",
        }
        expect(formatSupabasePostgrestError(raw)).toBeNull()
        expect(userFacingFetchError(raw, "Não foi possível carregar.")).toBe(
            "Não foi possível carregar.",
        )
    })

    it("traduz códigos conhecidos", () => {
        expect(formatSupabasePostgrestError({ code: "23505", message: "duplicate key" })).toBe(
            "Já existe um registro com esses dados.",
        )
        expect(formatSupabasePostgrestError({ code: "42501", message: "forbidden" })).toBe(
            "Você não tem permissão para fazer isso.",
        )
    })

    it("traduz as exceções das nossas funções SQL", () => {
        expect(
            formatSupabasePostgrestError({ code: "P0001", message: "WORKSPACE_LAST_OWNER" }),
        ).toBe("A carteira precisa de pelo menos um dono.")
        expect(
            formatSupabasePostgrestError({ code: "P0001", message: "CROSS_WORKSPACE_REFERENCE" }),
        ).toBe("A categoria ou o cartão escolhido é de outra carteira.")
    })

    it("o log continua com o erro inteiro", () => {
        expect(
            describeSupabaseErrorForLog({ code: "XX000", message: "boom", hint: "h" }),
        ).toBe("boom · h (XX000)")
    })
})
