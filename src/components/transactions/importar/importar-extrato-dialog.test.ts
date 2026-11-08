import { describe, expect, it } from "vitest"

import { lerFonte, semComentarios } from "@/test/fonte"

const ler = (nome: string) => semComentarios(lerFonte(`src/components/transactions/importar/${nome}`), "tudo")
const dialogo = ler("importar-extrato-dialog.tsx")
const conferir = ler("conferir-importacao.tsx")
const colunas = ler("mapear-colunas.tsx")

describe("o diálogo de importar, versão C", () => {
    it("é o diálogo dos passos, na gaveta do telefone, com pending, dirty e o desfazer no AlertDialog", () => {
        expect(dialogo).toMatch(/<Dialog[\s\S]*?surface="auto"/)
        expect(dialogo).toMatch(/pending=\{/)
        expect(dialogo).toMatch(/dirty=\{imp\.dirty\}/)
        expect(dialogo).toContain("confirmDiscard")
        expect(dialogo).toContain("<AlertDialog")
        expect(dialogo).not.toContain("window.confirm")
    })

    it("não pergunta Extrato ou Planilha antes do arquivo", () => {
        expect(dialogo).not.toMatch(/<Tabs\b/)
        expect(dialogo).not.toMatch(/Extrato do banco|>\s*Planilha\s*</)
        expect(dialogo).not.toContain("<RadioGroup")
    })

    it("o arquivo entra arrastado no Card tracejado ou escolhido no computador", () => {
        expect(dialogo).toMatch(/<Card[\s\S]*?variant="dashed"[\s\S]*?onDragOver=\{[\s\S]*?onDrop=\{/)
        expect(dialogo).toContain("Arraste o arquivo aqui")
        expect(dialogo).toMatch(/type="file"[\s\S]*?accept="\.csv,\.ofx"/)
    })

    it("o destino é um Select só, com o grupo dos cartões e o das contas", () => {
        expect(dialogo).toContain("Para onde vão")
        expect(dialogo.match(/<SelectGroup>/g)?.length).toBe(2)
        expect(dialogo).toMatch(/<SelectLabel>Cartões<\/SelectLabel>/)
        expect(dialogo).toMatch(/<SelectLabel>Contas<\/SelectLabel>/)
        expect(dialogo.match(/<Select\b/g)?.length).toBe(1)
    })

    it("dois passos, e três só com Colunas", () => {
        expect(dialogo).toContain('imp.passo === "colunas" ? ["Arquivo", "Colunas", "Conferir"] : ["Arquivo", "Conferir"]')
        expect(dialogo).toContain("<DialogSteps")
    })

    it("o mesmo diálogo vai à tela cheia com expandido", () => {
        expect(dialogo).toMatch(/<DialogContent[\s\S]*?size=\{expandido \? "full" : "lg"\}/)
        expect(dialogo).toContain('const expandido = imp.passo === "conferir" && imp.expandido')
    })

    it("o Importar diz quantos entram e fica desabilitado com zero; Enter envia o passo", () => {
        expect(dialogo).toContain("<Form")
        expect(dialogo).toContain("<FormSubmit")
        expect(dialogo).toMatch(/`Importar \$\{lancamentos\(imp\.resumo\.entram\)\}`/)
        expect(dialogo).toMatch(/imp\.passo === "conferir" && !imp\.resumo\.entram/)
    })

    it("o fim diz quem ficou de fora e por quê, e o primário leva aos sem categoria", () => {
        expect(dialogo).toContain("porque já existiam")
        expect(dialogo).toMatch(/Ver os \$\{numberBR\(feito\.semCategoria\)\} sem categoria/)
        expect(dialogo).toContain("onRevisar({ semCategoria: feito.semCategoria > 0 })")
        expect(dialogo).toContain("Revisar agora")
    })
})

describe("a conferência", () => {
    it("o compacto mostra 6 linhas, e só com mais de 6 aparecem o Ver os N e o expandir", () => {
        expect(conferir).toContain("const LIMITE = 6")
        expect(conferir).toContain("imp.visiveis.slice(0, LIMITE)")
        expect(conferir).toContain("const grande = imp.visiveis.length > LIMITE")
        expect(conferir).toMatch(/grande \? \([\s\S]*?Ver os \$\{numberBR\(imp\.visiveis\.length\)\} lançamentos/)
        expect(conferir).toMatch(/ArrowsPointingOutIcon[\s\S]*?ArrowsPointingInIcon/)
        expect(conferir).toMatch(/aria-label=\{imp\.expandido \? "Recolher a lista" : "Expandir a lista"\}/)
    })

    it("no expandido, o DataTable com busca, seleção (o que entra), soma e o gêmeo do telefone", () => {
        expect(conferir).toContain("<DataTable")
        expect(conferir).toMatch(/toolbar=\{\{ search: "Buscar descrição", end: acoes \}\}/)
        expect(conferir).toContain("enableSelection")
        expect(conferir).toContain("rowSelection={selecao}")
        // A pílula flutuante do DataTable fica sob o véu do diálogo: as ações e a soma moram na barra da tabela.
        expect(conferir).not.toContain("bulkActions=")
        expect(conferir).toMatch(/marcadasVistas\.reduce\(\(s, i\) => s \+ valorDe\(i\), 0\)/)
        expect(conferir).toMatch(/mobile: "title"[\s\S]*?mobile: "description"/)
        expect(conferir).toContain("Deixar de fora")
        expect(conferir).toContain("Pôr categoria")
    })

    it("o filtro é um ToggleGroup, a categoria é Combobox, o já existe é um Badge, o dinheiro é MoneyDisplay", () => {
        expect(conferir).toContain("<ToggleGroup")
        for (const f of ["todos", "saidas", "entradas", "existem", "sem-categoria"]) expect(conferir).toContain(`"${f}"`)
        expect(conferir).toContain("<Combobox")
        expect(conferir).toMatch(/<Badge[^>]*tone="warning"[^>]*>\s*já existe/)
        expect(conferir).toContain("<MoneyDisplay")
        expect(conferir).toContain("imp.categoriaNovaDe(")
        expect(conferir).toContain("<Item")
    })

    it("as colunas mostram a prévia com o papel no topo e perguntam o sinal", () => {
        expect(colunas).toContain("<TableHead")
        expect(colunas).toContain("<Select")
        expect(colunas).toContain("Neste arquivo, −12,34 é:")
        expect(colunas).toContain("um gasto")
        expect(colunas).toContain("uma entrada")
        expect(colunas).not.toContain("Valor negativo é despesa")
    })
})
