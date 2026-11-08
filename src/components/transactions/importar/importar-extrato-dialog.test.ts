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

    it("o arquivo entra arrastado no corpo inteiro (também trocando o escolhido) ou escolhido no computador", () => {
        expect(dialogo).toMatch(/<DialogBody[\s\S]*?onDragOver=\{[\s\S]*?onDrop=\{soltar\}/)
        // dragover impedido sempre: o navegador nunca abre o arquivo no lugar da página.
        expect(dialogo).toMatch(/function arrastando\(e: React\.DragEvent\) \{\s*e\.preventDefault\(\)/)
        expect(dialogo).toMatch(/<Card[\s\S]*?variant="dashed"[\s\S]*?data-dragging=\{sobre \|\| undefined\}/)
        expect(dialogo).toContain("ring-ring")
        expect(dialogo).toContain("Só um arquivo por vez; usamos o primeiro.")
        expect(dialogo).toContain("Arraste o arquivo aqui")
        expect(dialogo).toMatch(/type="file"[\s\S]*?accept="\.csv,\.ofx"/)
    })

    it("o título da conta lê natural, e o arquivo diz o período quando a leitura o tem", () => {
        expect(dialogo).toContain('{ forma: "pix", rotulo: "Pix", em: "no Pix" }')
        expect(dialogo).toContain('{ forma: "debit_card", rotulo: "Débito", em: "no Débito" }')
        expect(dialogo).toContain('{ forma: "other", rotulo: "Outro", em: "em Outro" }')
        expect(dialogo).toContain("`para o ${cartao.name}`")
        expect(dialogo).toContain("periodoPtBr(imp.arquivoLido.periodo)")
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
        expect(dialogo).toMatch(/<DialogContent[\s\S]*?size=\{expandido \? "full" : imp\.passo === "conferir" \? "xl" : "lg"\}/)
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
        expect(dialogo).toContain('"Ver o 1 sem categoria"')
        expect(dialogo).toContain("onRevisar({ semCategoria: feito.semCategoria > 0 })")
        expect(dialogo).toContain("Revisar agora")
    })
})

describe("a conferência", () => {
    it("o compacto mostra 6 linhas, e só com mais de 6 aparecem o Ver os N e o expandir", () => {
        expect(conferir).toContain("const LIMITE = 6")
        // Uma linha a mais por baixo do teto: a sexta dissolve e o teto é medido das linhas, sem px cravado.
        expect(conferir).toContain("imp.visiveis.slice(0, grande ? LIMITE + 1 : LIMITE)")
        expect(conferir).toContain("linhas[LIMITE].offsetTop - linhas[0].offsetTop")
        expect(conferir).toContain('viewportClassName={grande ? "max-h-(--lista-h)" : undefined}')
        // No desktop a categoria é coluna da linha; no telefone, a segunda linha.
        // No telefone a linha não tem Combobox: a categoria é texto na segunda linha, e o campo só existe do md para cima.
        expect(conferir).toContain('<div className="hidden md:block md:w-40">')
        expect(conferir).toMatch(/<span className="md:hidden">\s*\{formatYmdPtBr\(item\.data\)\.slice\(0, 5\)\} · \{nomeDaCategoria\(imp, item\) \?\? "Sem categoria"\}/)
        expect(conferir).not.toContain("order-last basis-full")
        // Trocar a de uma linha no telefone: marcar e usar o Pôr categoria, que o aviso diz.
        expect(conferir).toContain("Marque e use Pôr categoria para trocar")
        // Com uma marcada só, a folha nomeia o lançamento.
        expect(conferir).toContain("`Vale para ${itens[0].descricao}.`")
        expect(conferir).toContain("const grande = imp.visiveis.length > LIMITE")
        expect(conferir).toMatch(/grande \? \([\s\S]*?Ver os \$\{numberBR\(imp\.visiveis\.length\)\} lançamentos/)
        expect(conferir).toMatch(/ArrowsPointingOutIcon[\s\S]*?ArrowsPointingInIcon/)
        expect(conferir).toMatch(/aria-label=\{imp\.expandido \? "Recolher a lista" : "Expandir a lista"\}/)
        expect(conferir).toContain("aria-expanded={imp.expandido}")
    })

    it("acessível: a caixa diz a data, a contagem é anunciada, a linha de fora não perde contraste", () => {
        expect(conferir).toContain("aria-label={`Trazer ${rotuloDe(item)}`}")
        expect(conferir).toContain("getRowLabel={rotuloDe}")
        expect(conferir).toMatch(/<Badge[^>]*role="status"[^>]*>\s*Vão entrar/)
        expect(conferir).not.toContain("opacity-60")
        expect(conferir).toContain('marcada ? undefined : "text-muted-foreground"')
    })

    it("Pôr categoria compara o tipo da categoria (estorno do cartão é despesa), e a folha dele vira gaveta no telefone", () => {
        expect(conferir).toContain("new Set(marcadasVistas.map((i) => tipoDoItem(i, destino))).size > 1")
        expect(conferir.match(/disabled=\{porCategoriaDesligado\}/g)?.length).toBe(2)
        expect(conferir).toMatch(/<Dialog open=\{itens\.length > 0\} surface="auto"/)
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
