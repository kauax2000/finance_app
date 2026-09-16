import { afterEach, describe, expect, it, vi } from "vitest"

/**
 * O módulo instancia o cliente no import, e sem as variáveis de ambiente ele
 * lança — a mesma razão pela qual `offline/handlers/by-id.test.ts` o mocka. A
 * função aqui é pura: ela lê o `cause` e não fala com o banco.
 */
vi.mock("@/lib/supabase", () => ({ supabase: {} }))

const { userSettingsPersistErrorMessage } = await import("./settings")

describe("userSettingsPersistErrorMessage", () => {
    afterEach(() => vi.unstubAllEnvs())

    const colunaAusente = new Error("Não foi possível salvar suas preferências.", {
        cause: { code: "42703", message: 'column "current_workspace_id" does not exist' },
    })

    it("reconhece a coluna ausente pelo erro original em `cause`", () => {
        vi.stubEnv("NODE_ENV", "development")
        expect(userSettingsPersistErrorMessage(colunaAusente)).toMatch(/current_workspace_id/)
    })

    it("em produção não mostra o passo a passo do banco", () => {
        vi.stubEnv("NODE_ENV", "production")
        expect(userSettingsPersistErrorMessage(colunaAusente)).toBeNull()
    })

    it("ignora erro que não é de coluna", () => {
        vi.stubEnv("NODE_ENV", "development")
        const outro = new Error("x", { cause: { code: "23505", message: "duplicate key" } })
        expect(userSettingsPersistErrorMessage(outro)).toBeNull()
    })
})
