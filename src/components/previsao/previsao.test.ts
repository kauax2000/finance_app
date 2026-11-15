import { existsSync } from "node:fs"
import { describe, expect, it } from "vitest"

import { lerFonte, semComentarios } from "@/test/fonte"

const pasta = "src/components/previsao"
const ler = (nome: string) => semComentarios(lerFonte(`${pasta}/${nome}.tsx`))
const ARQUIVOS = [
    "heroi-do-seguro",
    "de-onde-vem",
    "reserva-dialog",
    "proximos-meses",
    "faturas-acima-do-normal",
    "simulador-de-parcela",
    "previsao-skeleton",
    "previsao-tela",
]
// Fora de `ui/`, só os provedores, os atalhos de criar, o quadro de impacto que já existe e as peças desta pasta.
const PERMITIDOS = [
    "@/components/workspace-provider",
    "@/components/layout/quick-actions",
    "@/components/transactions/impacto-da-parcela",
]
const permitido = (caminho: string) =>
    caminho.startsWith("@/components/ui/") || caminho.startsWith("@/components/previsao/") || PERMITIDOS.includes(caminho)

describe("a tela de Previsão no design system", () => {
    it.each(ARQUIVOS)("%s compõe só peças de @/components/ui", (nome) => {
        const imports = [...ler(nome).matchAll(/from "(@\/components\/[^"]+)"/g)].map((m) => m[1])
        for (const caminho of imports) {
            expect(permitido(caminho), caminho).toBe(true)
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

    it("os 6 meses: a sobra em barras pelo sinal, os acontecimentos e a tabela recolhida", () => {
        const fonte = ler("proximos-meses")
        expect(fonte).toContain("<ChartBars")
        expect(fonte).toContain("--chart-income")
        expect(fonte).toContain("--chart-expense")
        expect(fonte).toContain("<Collapsible")
        expect(fonte).toContain("<ChartTooltipContent")
        expect(fonte).toContain('tone="expense"')
        expect(fonte).toContain("fica no vermelho")
        expect(fonte).toContain("a menos")
        expect(fonte).toContain("Ver mês a mês")
        expect(fonte).toContain("Nada muda nos próximos meses")
    })

    it("a fatura alta: um Alert de aviso por cartão, com o link da fatura", () => {
        const fonte = ler("faturas-acima-do-normal")
        expect(fonte).toContain("<Alert")
        expect(fonte).toContain('tone="warning"')
        expect(fonte).toContain("creditCardInvoicePath(")
        expect(fonte).toContain("Ver fatura")
    })

    it("o simulador: o quadro de impacto que já existe e a ação que abre o lançamento parcelado", () => {
        const fonte = ler("simulador-de-parcela")
        expect(fonte).toContain("<ImpactoDaParcela")
        expect(fonte).toContain("E se eu parcelar?")
        expect(fonte).toContain("Lançar esta compra")
        expect(fonte).toMatch(/<Form\b/)
        expect(fonte).toMatch(/<FormInput\s[\s\S]*?money/)
        expect(fonte).toContain('abrirLancamento("installment")')
        // Simula, não grava.
        expect(fonte).not.toMatch(/\.(insert|update|upsert|delete)\(/)
    })

    it("a tela: o cabeçalho, os estados e o diálogo da reserva", () => {
        const fonte = ler("previsao-tela")
        expect(fonte).toContain("<PageHeader collapse>")
        expect(fonte).toContain('<p aria-hidden="true">Previsão</p>')
        expect(fonte).toContain("<PrevisaoSkeleton />")
        expect(fonte).toContain("Tentar de novo")
        expect(fonte).toContain("Ainda não há o que prever")
        expect(fonte).toContain("Adicionar lançamento")
        expect(fonte).toContain("<ReservaDialog")
        expect(fonte).toContain("onEditarReserva={() => setReservaAberta(true)}")
        expect(fonte).toContain("lg:grid-cols-2")
        expect(ler("previsao-skeleton")).toContain("<SkeletonGroup")
    })

    it("a rota monta a tela, e o wireframe da linha do tempo saiu", () => {
        const pagina = semComentarios(lerFonte("src/app/(app)/previsao/page.tsx"))
        expect(pagina).toContain("<PrevisaoTela />")
        expect(pagina).not.toContain("@/components/wireframe")
        expect(semComentarios(lerFonte("src/app/(app)/previsao/loading.tsx"))).toContain("<PrevisaoSkeleton />")
        expect(existsSync("src/components/wireframe/linha-do-tempo-wireframe.tsx")).toBe(false)
    })
})
