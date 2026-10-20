import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"

const HEADER = semComentarios(lerFonte("src/components/layout/app-header.tsx"))

describe("o voltar do telefone nas telas da página Você", () => {
    it("o pai conhecido vem antes, e Você é a última opção", () => {
        const corpo = HEADER.slice(HEADER.indexOf("function defaultMobileBackHref"))
        expect(corpo.indexOf("resolveAppSubPageMeta")).toBeLessThan(corpo.indexOf("voceBackHref(pathname)"))
    })

    it("Planos volta a Minha conta, só no telefone", () => {
        const corpo = HEADER.slice(HEADER.indexOf("function defaultMobileBackHref"))
        expect(corpo).toContain("if (pathname === ROUTES.PLANS) return ROUTES.ACCOUNT")
        expect(corpo.indexOf("ROUTES.PLANS")).toBeLessThan(corpo.indexOf("voceBackHref(pathname)"))
    })
})
