import { describe, expect, it } from "vitest"

import { lerFonte, semComentarios } from "@/test/fonte"

const pasta = "src/components/previsao"
const ler = (nome: string) => semComentarios(lerFonte(`${pasta}/${nome}.tsx`))
const ARQUIVOS = ["heroi-do-seguro", "de-onde-vem", "reserva-dialog"]
// Fora de `ui/`, só os provedores e o atalho de criar assinatura: nenhuma peça de tela.
const PERMITIDOS = ["@/components/workspace-provider", "@/components/layout/quick-actions"]

describe("a tela de Previsão no design system", () => {
    it.each(ARQUIVOS)("%s compõe só peças de @/components/ui", (nome) => {
        const imports = [...ler(nome).matchAll(/from "(@\/components\/[^"]+)"/g)].map((m) => m[1])
        for (const caminho of imports) {
            expect(caminho.startsWith("@/components/ui/") || PERMITIDOS.includes(caminho), caminho).toBe(true)
        }
    })

    it.each(ARQUIVOS)("%s não usa cor crua, estado nem marca", (nome) => {
        const fonte = ler(nome)
        expect(fonte).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
        expect(fonte).not.toMatch(/success|destructive|brand/)
    })

    it("o herói: o gasto contra o ritmo, com hoje marcado", () => {
        const fonte = ler("heroi-do-seguro")
        expect(fonte).toContain("<ChartLine")
        expect(fonte).toContain("<ChartAnnotation")
        expect(fonte).toContain("Gasto pela data da compra")
        expect(fonte).toContain("Ritmo até o fim do mês")
        expect(fonte).toContain("dashed: true")
        expect(fonte).toContain("Sem receita prevista neste mês")
        expect(fonte).toContain("useQuickCreateSubscription")
    })

    it("de onde vem: a lista de termo e valor, a sobra e a nota do regime", () => {
        const fonte = ler("de-onde-vem")
        expect(fonte).toContain("<DescriptionList")
        expect(fonte).toContain("<DescriptionHint")
        expect(fonte).toContain("Sobra do mês")
        expect(fonte).toContain("A fatura conta no mês em que vence")
        expect(fonte).toContain("Editar reserva")
    })

    it("a reserva: Form com o campo de dinheiro, gravando monthly_savings_target", () => {
        const fonte = ler("reserva-dialog")
        expect(fonte).toMatch(/<Form\b/)
        expect(fonte).toMatch(/<FormInput\s[\s\S]*?money/)
        expect(fonte).toContain("monthly_savings_target")
        expect(fonte).toContain('surface="auto"')
        expect(fonte).toContain("Só quem é dono da carteira altera a reserva.")
    })
})
