import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"

const SEGMENTO = semComentarios(lerFonte("src/components/transactions/transaction-type-segment.tsx"))

describe("o seletor de tipo do formulário", () => {
    it("é um trilho segmentado, de largura toda, nomeado", () => {
        // A pele padrão das abas (`floating`), pedida pelo dono no lugar da bandeja `segmented`.
        expect(SEGMENTO.match(/variant="floating"/g)?.length).toBe(3)
        expect(SEGMENTO).not.toContain('variant="segmented"')
        expect(SEGMENTO).toMatch(/<ToggleGroup[\s\S]*?type="single"[\s\S]*?variant="floating"[\s\S]*?stretch/)
        expect(SEGMENTO).toContain('aria-label="Tipo de lançamento"')
        expect(SEGMENTO).toContain('aria-label="O que editar"')
        expect(SEGMENTO).not.toMatch(/FormRadioGroup[\s\S]*?variant="card"/)
    })

    it("o seletor de tipo da edição aceita outro nome acessível (as categorias dizem Tipo)", () => {
        expect(SEGMENTO).toContain('"aria-label": ariaLabel = "Tipo de lançamento"')
        expect(SEGMENTO).toContain("aria-label={ariaLabel}")
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
        const forma = pos('label="Forma de pagamento"')
        const cartao = pos('id="tx-credit-card"')
        expect([valor, categoria, descricao, detalhes, data, forma, cartao]).toEqual(
            [valor, categoria, descricao, detalhes, data, forma, cartao].slice().sort((a, b) => a - b)
        )
    })

    it("o valor tem a altura dos outros, com foco só ao criar fora do telefone", () => {
        // O valor tem a altura dos outros campos (pedido do dono): sem degrau próprio.
        expect(CAMPOS).not.toContain('size="xl"')
        // Uma vez por montagem: trocar Despesa e Parcelada remonta o campo e não rouba o foco do trilho.
        expect(CAMPOS).toContain('useRef(segmentMode === "create" && !isMobile)')
        expect(CAMPOS).toContain("focoInicial.current = false")
        expect(CAMPOS.match(/autoFocus=\{focoInicial\.current\}/g)?.length).toBe(2)
        expect(CAMPOS).not.toMatch(/autoFocus=\{segmentMode/)
    })

    it("a Data usa o estilo numérico só na fileira apertada", () => {
        expect(CAMPOS).toContain('displayStyle="relative"')
    })

    it("a prévia da parcelada é a descrição dos dois campos, sem região viva", () => {
        expect(CAMPOS).toContain('id="tx-inst-preview"')
        expect(CAMPOS.match(/aria-describedby="tx-inst-preview"/g)?.length).toBe(2)
        expect(CAMPOS).not.toContain("aria-live")
    })

    it("o rótulo da data do plano ativo é Próxima cobrança", () => {
        expect(CAMPOS).toContain('"Próxima cobrança"')
        expect(CAMPOS).not.toContain("Próxima data de cobrança")
    })

    it("o modo do valor (total ou parcela) é o Select do app dentro do campo, não um trilho", () => {
        expect(CAMPOS).toMatch(/<InputGroupSelect\s+aria-label="Como informar o valor"/)
        // Trocar o modo leva o número digitado junto: só a conta muda.
        expect(CAMPOS).toContain('if (next === "total") setInstallmentTotal(installmentPerAmount)')
        expect(CAMPOS).toContain("else setInstallmentPerAmount(installmentTotal)")
        expect(CAMPOS).not.toContain("<ToggleGroup")
        expect(CAMPOS).not.toMatch(/<option\b/)
    })

    it("a forma de pagamento: fichas de um toque numa grade 3 × 2, opcional e desmarcável", () => {
        expect(CAMPOS).toMatch(/label="Forma de pagamento"\s+optional\s+variant="chip"\s+deselectable/)
        expect(CAMPOS).toContain("options={paymentMethodChipOptions()}")
        expect(CAMPOS).toContain("data-[variant=chip]:grid data-[variant=chip]:grid-cols-3")
        // As soltas vestem o preenchimento dos campos; a escolhida fica com a cor de seleção.
        expect(CAMPOS).toContain("[&>[data-slot=radio-group-item]:not(:has([data-state=checked]))]:bg-input-fill/50")
        // Era uma lista de seleção: dois toques para escolher.
        expect(CAMPOS).not.toMatch(/<Select\b|PAYMENT_NONE/)
        // A Data volta à largura toda, com o "Hoje · …".
        expect(CAMPOS).toContain("{dataField}")
        expect(CAMPOS).not.toMatch(/<FieldRow>\s*\{dataField\}/)
    })

    it("a receita não tem forma de pagamento", () => {
        expect(CAMPOS).toContain('const mostraForma = type === "expense" || showInstallmentFields')
        expect(CAMPOS).toMatch(/\{mostraForma \? \(/)
    })

    it("a categoria veste o ColorTile, sem cor pintada à mão", () => {
        expect(CAMPOS).toContain('<ColorTile size="xs"')
        expect(CAMPOS).not.toMatch(/style=\{\{\s*backgroundColor/)
    })

    it("a parcelada: o aviso do plano é um Alert", () => {
        expect(CAMPOS).toContain('<Alert tone="warning" size="sm">')
        expect(CAMPOS).not.toMatch(/border-warning\/25/)
    })

    it("as listas dos seletores não sobrescrevem o recuo da lista (o rodapé cobria o cartão)", () => {
        // O `py-2` no seletor de cartão vencia o recuo que compensa as margens
        // negativas da dissolução, e o "Cadastrar cartão" subia 48px sobre o item.
        expect(CAMPOS).not.toMatch(/<FormPickerPopoverList className=/)
    })

    it("o cartão: a bandeira no campo e na linha, a fatura por linha e a pré-escolha ao tocar em Crédito", () => {
        expect(CAMPOS.match(/<CreditCardBrandChip /g)?.length).toBe(2)
        expect(CAMPOS).toMatch(/creditCardInvoiceHintForPurchase\(purchaseIso, c\)/)
        expect(CAMPOS).toMatch(/if \(forma === "credit_card"\) preEscolherCartao\(\)/)
        // Um cartão só vem escolhido; com mais de um, o último gravado na carteira.
        expect(CAMPOS).toContain("const id = cartaoPreEscolhido(activeCards)")
        expect(CAMPOS).toMatch(/gravarUltimoCartao\(card\.workspace_id, id\)/)
    })

    it("a parcelada: − e + nas parcelas, resumo sempre à vista, crédito de saída", () => {
        expect(CAMPOS).toContain('aria-label="Uma parcela a menos"')
        expect(CAMPOS).toContain('aria-label="Uma parcela a mais"')
        expect(CAMPOS).toContain('?? "Informe o valor e o número de parcelas."')
        // No telefone cada campo ocupa a sua linha; no desktop as parcelas ficam em 8rem ao lado do valor.
        expect(CAMPOS).toContain('className="grid-cols-1 md:grid-cols-[minmax(0,1fr)_8rem]"')
        expect(CAMPOS).toContain("última em ${formatYearMonthShortPtBr(")
        const USO = semComentarios(lerFonte("src/components/transactions/transaction-form-use.tsx"))
        // Ao entrar na Parcelada o crédito vem preenchido, e o ponto de partida do
        // rascunho anda junto: sem nada editado, fechar não pergunta.
        expect(USO).toMatch(/next !== "installment"[\s\S]{0,400}setPaymentMethod\("credit_card"\)[\s\S]{0,200}setSnapshot\(/)
        expect(USO).toContain("setFormKind: escolherTipo")
        expect(USO).toMatch(/defaultLaunchKind === "installment"[\s\S]{0,400}paymentCreditCardId: cartaoPreEscolhido\(creditCards\)/)
    })
})
