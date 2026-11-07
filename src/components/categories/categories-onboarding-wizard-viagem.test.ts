import { describe, expect, it } from "vitest"

import { lerFonte, semComentarios } from "@/test/fonte"

const fonte = semComentarios(lerFonte("src/components/categories/categories-onboarding-wizard.tsx"))
const viagem = semComentarios(lerFonte("src/lib/viagem-de-passo.ts"))

describe("assistente de categorias: a troca de passo é orgânica", () => {
    it("toda troca passa pelo gesto: nenhum setStep solto fora de irParaPasso", () => {
        expect(fonte.match(/setStep\(/g)).toHaveLength(1)
        expect(fonte).toMatch(/await sairDoValor\(corpo, cab, pe\)[\s\S]*setStep\(n\)/)
        for (const n of [0, 1, 2]) expect(fonte).toContain(`void irParaPasso(${n})`)
    })

    it("o passo novo brota no layout, só depois de uma troca, e respeita o movimento reduzido", () => {
        expect(fonte).toMatch(/useLayoutEffect\(\(\) => \{[\s\S]*!mudou[\s\S]*semMovimento\(\)[\s\S]*chegarAoPasso\(corpo, cab, pe\)[\s\S]*\}, \[step, mudou\]\)/)
        expect(fonte).toMatch(/if \(cab && corpo && pe && !semMovimento\(\)\)/)
    })

    it("os três formulários são o conteúdo do passo, e título e rodapé remontam pela chave", () => {
        expect(fonte.match(/data-passo\n/g)).toHaveLength(3)
        expect(fonte).toMatch(/<div key=\{stepIndex\} ref=\{cabecalhoRef\}/)
        expect(fonte).toMatch(/<div key=\{stepIndex\} ref=\{rodapeRef\}/)
        // Os pontos do passo ficam fora do que recolhe.
        expect(fonte.indexOf("<DialogSteps")).toBeLessThan(fonte.indexOf("ref={cabecalhoRef}"))
    })

    it("chegarAoPasso brota o conteúdo do alto e os botões do pé", () => {
        expect(viagem).toMatch(/export function chegarAoPasso\([\s\S]*"menu-morph", 380, 60, "50% 0"[\s\S]*"menu-morph", 380, 120, "50% 100%"/)
    })
})
