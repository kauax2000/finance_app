import { describe, expect, it } from "vitest"
import { parseEdgeFunctionError } from "@/lib/edge-errors"

describe("parseEdgeFunctionError", () => {
    it("traduz os erros conhecidos das edges", () => {
        expect(parseEdgeFunctionError('{"error":"Invite expired"}', "x")).toBe(
            "Este convite expirou. Peça um novo a quem convidou você.",
        )
        expect(parseEdgeFunctionError('{"error":"Invalid or expired token"}', "x")).toBe(
            "Sessão inválida ou expirada; faça login novamente.",
        )
    })

    it("mensagem já em português passa como está", () => {
        expect(parseEdgeFunctionError('{"error":"Senha incorreta"}', "x")).toBe("Senha incorreta")
    })

    it("401 do gateway vira sessão expirada", () => {
        expect(parseEdgeFunctionError('{"code":401,"message":"Invalid JWT"}', "x")).toBe(
            "Sessão inválida ou expirada; faça login novamente.",
        )
    })
})
