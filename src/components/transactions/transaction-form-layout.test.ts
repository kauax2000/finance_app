import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"

const SEGMENTO = semComentarios(lerFonte("src/components/transactions/transaction-type-segment.tsx"))

describe("o seletor de tipo do formulário", () => {
    it("é um trilho segmentado, de largura toda, nomeado", () => {
        expect(SEGMENTO).toMatch(/<ToggleGroup[\s\S]*?type="single"[\s\S]*?variant="segmented"[\s\S]*?stretch/)
        expect(SEGMENTO).toContain('aria-label="Tipo de lançamento"')
        expect(SEGMENTO).toContain('aria-label="O que editar"')
        expect(SEGMENTO).not.toMatch(/FormRadioGroup[\s\S]*?variant="card"/)
    })
})

const SUPERFICIE = semComentarios(lerFonte("src/components/transactions/transaction-form-surface.tsx"))

describe("a superfície do formulário", () => {
    it("a descrição do cabeçalho é só do leitor de tela", () => {
        expect(SUPERFICIE.match(/<DialogDescription className="sr-only">/g)?.length).toBe(3)
        expect(SUPERFICIE).not.toMatch(/<DialogDescription>\{formDescription\}/)
    })

    it("o rodapé tem Cancelar e Salvar", () => {
        expect(SUPERFICIE).toContain("<FormCancel")
        expect(SUPERFICIE).toContain("<DialogClose asChild>")
        expect(SUPERFICIE).toContain("onCancel ?")
        expect(SUPERFICIE).toMatch(/<FormSubmit[^>]*disabled=\{submitDisabled\}/)
        expect(SUPERFICIE).not.toMatch(/<FormSubmit[^>]*size=/)
    })
})

const CAMPOS = semComentarios(lerFonte("src/components/transactions/transaction-form-fields.tsx"))

describe("os campos do formulário", () => {
    it("a ordem: valor, categoria, descrição, Detalhes, data e forma, cartão", () => {
        const pos = (marca: string) => {
            const i = CAMPOS.indexOf(marca)
            expect(i, marca).toBeGreaterThan(-1)
            return i
        }
        // As posições são as do JSX devolvido: a Data é o `{dataField}`, montado antes.
        const valor = pos('label="Valor"')
        const categoria = pos('htmlFor="tx-category"')
        const descricao = pos('label="Descrição"')
        const detalhes = pos("<Separator>Detalhes</Separator>")
        const data = pos("{dataField}")
        const forma = pos('id="tx-payment-method"')
        const cartao = pos('id="tx-credit-card"')
        expect([valor, categoria, descricao, detalhes, data, forma, cartao]).toEqual(
            [valor, categoria, descricao, detalhes, data, forma, cartao].slice().sort((a, b) => a - b)
        )
    })

    it("o valor é o campo alto, com foco só ao criar fora do telefone", () => {
        expect(CAMPOS).toMatch(/label="Valor"[\s\S]{0,200}size="xl"/)
        expect(CAMPOS).toContain('autoFocus={segmentMode === "create" && !isMobile}')
    })

    it("data e forma dividem a fileira; a forma é uma lista com Sem forma", () => {
        expect(CAMPOS).toContain("const dataField = (")
        expect(CAMPOS).toMatch(/<FieldRow>\s*\{dataField\}[\s\S]*?id="tx-payment-method"[\s\S]*?<\/FieldRow>/)
        expect(CAMPOS).toMatch(/<SelectItem value=\{PAYMENT_NONE\} variant="none">\s*Sem forma/)
    })

    it("a receita não tem forma de pagamento", () => {
        expect(CAMPOS).toContain('const mostraForma = type === "expense" || showInstallmentFields')
        expect(CAMPOS).toMatch(/\{mostraForma \? \(/)
    })

    it("a categoria veste o ColorTile, sem cor pintada à mão", () => {
        expect(CAMPOS).toContain('<ColorTile size="xs"')
        expect(CAMPOS).not.toMatch(/style=\{\{\s*backgroundColor/)
    })

    it("a parcelada: total ou por parcela num trilho pequeno, e o aviso do plano é um Alert", () => {
        expect(CAMPOS).toMatch(/aria-label="Como informar o valor"[\s\S]{0,200}variant="segmented"|variant="segmented"[\s\S]{0,200}aria-label="Como informar o valor"/)
        expect(CAMPOS).toContain('<Alert tone="warning" size="sm">')
        expect(CAMPOS).not.toMatch(/border-warning\/25/)
    })
})
