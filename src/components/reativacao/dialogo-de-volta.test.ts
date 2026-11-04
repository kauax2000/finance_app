import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"

describe("Reativação: o diálogo de volta", () => {
    const d = semComentarios(lerFonte("src/components/reativacao/dialogo-de-volta.tsx"))

    it("um título só e a frase de cada aparelho", () => {
        expect(d).toContain("Que bom te ver de volta")
        for (const frase of [
            "Põe os gastos em dia: quem lança todo dia sabe para onde o dinheiro vai.",
            "No app instalado você lança em segundos, direto da tela de início.",
            "No menu do navegador, toque em Instalar app.",
            "O dia a dia do Finance é no celular: lá você lança na hora da compra.",
        ])
            expect(d).toContain(frase)
        for (const aparelho of ["iphone-instalado", "android-instalado", "navegador-iphone", "navegador-android", "computador"])
            expect(d).toContain(`"${aparelho}"`)
    })

    it("as ações: lançar pela porta do + Adicionar, conferir, instalar e o QR", () => {
        for (const rotulo of ["Lançar um gasto", "Ver o que está a conferir", "Como instalar", "Agora não"])
            expect(d).toContain(rotulo)
        expect(d).toContain("/transactions?conferir=1")
        expect(d).toContain("useQuickCreateTransaction()")
        expect(d).toContain("InstallPwaSheet")
        expect(d).toMatch(/<QrCode[^>]*link=\{false\}/)
        expect(d).toContain("#no-celular")
        expect(d).toContain('surface="auto"')
    })

    it("o registro abre uma vez, sem cobrir outro diálogo", () => {
        const r = semComentarios(lerFonte("src/components/reativacao/registro-de-acesso.tsx"))
        expect(r).toContain("voltouDeAusencia(")
        expect(r).toContain('[role="dialog"]')
        expect(r).toContain("<DialogoDeVolta")
        expect(r).toContain("1500")
    })
})
