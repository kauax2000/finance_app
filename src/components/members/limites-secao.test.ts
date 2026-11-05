import { describe, expect, it } from "vitest"

import { lerFonte, semComentarios } from "@/test/fonte"

const fonte = semComentarios(lerFonte("src/components/members/limites-secao.tsx"))

describe("LimitesSecao", () => {
    it("a lista é PageSection + Card + ItemGroup divided + Item", () => {
        expect(fonte).toContain("<PageSection size=\"sm\"")
        expect(fonte).toContain("<Card padding=\"none\"")
        expect(fonte).toContain("<ItemGroup variant=\"divided\"")
        expect(fonte).toContain("<Item ")
        expect(fonte).toContain("Limite mensal de gasto de cada pessoa. Avisa em 80% e em 100%, à pessoa e ao dono.")
    })

    it("a linha diz o gasto e a barra usa as faixas 80/100", () => {
        expect(fonte).toContain("no mês, sem limite")
        expect(fonte).toContain("currencyBRL(linha.limite)")
        expect(fonte).toContain("bands={[80, 100]}")
        expect(fonte).toContain("value={pct}")
        expect(fonte).not.toContain("Math.min(pct")
        expect(fonte).not.toContain("Deixe sem limite")
    })

    it("indisponível tem o texto exato; não busca nem espera sozinha (os dados vêm no pacote da tela)", () => {
        expect(fonte).toContain("Os limites ainda não estão disponíveis nesta carteira.")
        expect(fonte).toMatch(/<Card padding="none" role="status">\s*<Item[^>]*>\s*<ItemContent>\s*<ItemDescription>Os limites ainda/)
        for (const s of ["<SkeletonGroup", "<Skeleton", "useEffect", "lerLimites(", "lerLancamentosDoMes("]) {
            expect(fonte).not.toContain(s)
        }
        expect(fonte).not.toContain("Carregando…</p>")
        expect(fonte).toContain("await onMudou()")
    })

    it("só quem edita abre o diálogo, com formulário, dinheiro, Salvar e Remover limite", () => {
        expect(fonte).toContain('surface="auto"')
        expect(fonte).toContain("Limite de ${")
        expect(fonte).toContain("<FormInput")
        expect(fonte).toContain("money")
        expect(fonte).toContain("<FormSubmit")
        expect(fonte).toContain("Remover limite")
        expect(fonte).toContain("lerLimiteDigitado(valor)")
        expect(fonte).toContain("Informe um valor maior que zero, até R$ 9.999.999.999,99.")
        expect(fonte).not.toContain('type="number"')
    })

    it("não importa o wireframe", () => {
        expect(fonte).not.toContain("@/components/wireframe")
    })
})
