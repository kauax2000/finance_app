import { describe, expect, it } from "vitest"

import { rotuloDePorCategoria } from "./rotulo-por-categoria"
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
        // A área é o EmptyState tracejado: ícone, título, descrição e o botão (nada de botão no meio da frase).
        expect(dialogo).toMatch(/<EmptyState[\s\S]*?variant="dashed"[\s\S]*?data-dragging=\{sobre \|\| undefined\}/)
        expect(dialogo).toContain("<ArrowUpTrayIcon aria-hidden />")
        expect(dialogo).toMatch(/<EmptyStateActions[\s\S]*?escolher arquivo/)
        expect(dialogo).not.toMatch(/variant="link"[\s\S]{0,200}escolha no computador/)
        expect(dialogo).toContain("ring-ring")
        expect(dialogo).toContain("Só um arquivo por vez; usamos o primeiro.")
        expect(dialogo).toContain("Arraste o extrato para cá")
        // No toque não se arrasta: o título vira "Escolha o extrato".
        expect(dialogo).toContain('<span className="hidden pointer-coarse:inline">Escolha o extrato</span>')
        expect(dialogo).toMatch(/type="file"[\s\S]*?accept="\.csv,\.ofx"/)
    })

    it("as trocas animam: área ↔ arquivo e o título ao arrastar, pela TrocaSuave; o ícone sobe na mola", () => {
        expect(dialogo).toContain('<TrocaSuave chave={imp.arquivo ? "arquivo" : "vazio"}')
        expect(dialogo).toContain('<TrocaSuave chave={sobre ? "soltar" : "arrastar"}')
        expect(dialogo).toContain("Solte para ler o extrato")
        // O arquivo escolhido tem o ícone num ladrilho à esquerda.
        expect(dialogo).toMatch(/<ItemMedia variant="tile" tone="neutral">\s*<DocumentTextIcon aria-hidden \/>/)
        expect(dialogo).toContain("group-data-dragging/soltar:-translate-y-1")
        expect(dialogo).toContain("ease-(--ease-spring)")
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
        // As linhas que a leitura deixou de fora (sem data ou valor) também.
        expect(dialogo).toMatch(/feito\.ignoradas > 0 && `\$\{rotuloDasIgnoradas\(feito\.ignoradas\)\}\.`/)
    })

    it("importando, a conferência trava", () => {
        expect(dialogo).toContain('<ConferirImportacao imp={imp} travado={imp.pendente === "importar"} />')
    })
})

describe("a conferência", () => {
    it("o compacto mostra só 6 linhas (a tela cheia mostra todas), e só com mais de 6 aparecem o contador e o expandir", () => {
        expect(conferir).toContain("const LIMITE = 6")
        expect(conferir).toContain("{imp.visiveis.slice(0, LIMITE).map((i) => (")
        // No desktop a categoria é coluna da linha; no telefone, a segunda linha.
        // No telefone a linha não tem Combobox: a categoria é texto na segunda linha, e o campo só existe do md para cima.
        expect(conferir).toContain('<div className="hidden md:block md:w-40">')
        expect(conferir).toMatch(/<span className="md:hidden">\s*\{formatYmdPtBr\(item\.data\)\.slice\(0, 5\)\} · \{nomeDaCategoria\(imp, item\) \?\? "Sem categoria"\}/)
        expect(conferir).not.toContain("order-last basis-full")
        // Trocar a de uma linha no telefone: marcar e usar o Pôr categoria, que o aviso diz.
        // A categoria de uma linha no telefone: tocar no corpo da linha (a caixa só diz se entra).
        expect(conferir).toContain("Toque numa linha para trocar a categoria")
        expect(conferir).toContain("aria-label={`Trocar a categoria de ${rotuloDe(item)}`}")
        expect(conferir).toMatch(/onRowClick=\{celular && !travado \? \(i\) => setPorCategoria\(\[i\]\) : undefined\}/)
        expect(conferir).not.toContain("Marque e use")
        // Com uma marcada só, a folha nomeia o lançamento.
        expect(conferir).toContain("`Vale para ${itens[0].descricao}.`")
        expect(conferir).toContain("const grande = imp.visiveis.length > LIMITE")
        expect(conferir).toMatch(/grande \? \(\s*<Caption className="text-control-sm leading-5">\{`Mostrando \$\{numberBR\(LIMITE\)\} de \$\{numberBR\(imp\.visiveis\.length\)\} ·`[\s\S]*?<span>Ver todos<\/span>/)
        expect(conferir).toMatch(/ArrowsPointingOutIcon[\s\S]*?ArrowsPointingInIcon/)
        expect(conferir).toMatch(/aria-label=\{imp\.expandido \? "Recolher a lista" : "Expandir a lista"\}/)
        expect(conferir).toContain("aria-expanded={imp.expandido}")
    })

    it("acessível: a caixa diz a data, a contagem é anunciada, a linha de fora não perde contraste", () => {
        expect(conferir).toContain("aria-label={`Trazer ${rotuloDe(item)}`}")
        expect(conferir).toContain("getRowLabel={rotuloDe}")
        // O resumo é um recibo recolhido: a linha é o saldo, e abrir mostra entram, cada tipo e sem categoria.
        expect(conferir).toMatch(/role="status">[\s\S]*?<Collapsible>[\s\S]*?<CollapsibleRow[\s\S]*?Saldo[\s\S]*?<CollapsibleContent>[\s\S]*?Entram/)
        expect(dialogo).not.toContain("Vão entrar")
        expect(conferir).not.toContain("opacity-60")
        expect(conferir).toContain('marcada ? undefined : "text-muted-foreground"')
    })

    it("as ações em massa valem para as visíveis (filtro e busca), nunca para as marcadas; a folha vira gaveta no telefone", () => {
        // O que se vê é o que o DataTable filtrou (o filtro da conferência mais a busca).
        expect(conferir).toContain("useDataTable().getFilteredRowModel().rows.map((r) => r.original as ItemImportavel)")
        expect(conferir).toContain("<AcoesDasVisiveis imp={imp} itens={imp.visiveis}")
        expect(conferir).toContain("rotulosDasVisiveis(itens.length)")
        expect(conferir).not.toContain("marcadasVistas")
        expect(conferir).not.toContain("porCategoriaDesligado")
        // Cada categoria vale para as visíveis do tipo dela (o estorno do cartão é despesa).
        expect(conferir).toContain("idsParaCategoria(itens, t, destino)")
        expect(conferir).toContain('TabsTrigger value="expense"')
        expect(conferir).toContain('TabsTrigger value="income"')
        expect(conferir).toContain('aria-label="Tipo da categoria"')
        expect(conferir).toContain("escolhas")
        expect(conferir).not.toContain('<Caption className="px-1">{t === "expense" ? "Despesas" : "Receitas"}</Caption>')
        expect(conferir).toMatch(/<Dialog open=\{itens\.length > 0\} surface="auto"/)
        expect(conferir).toContain('`Vale para todos os ${numberBR(itens.length)} lançamentos.`')
        // O Form do diálogo é dele: impede o envio nativo (senão a página recarrega) e não sobe ao do Importar.
        expect(conferir).toMatch(/function aplicar\(e: React\.FormEvent\) \{[\s\S]*?e\.preventDefault\(\)\s*e\.stopPropagation\(\)/)
        expect(conferir).toContain("rotuloDePorCategoria(")
        expect(ler("rotulo-por-categoria.ts")).toContain("Tirar a categoria de")
        expect(conferir).toContain("ColorTile")
        expect(conferir).toContain("CategoryIconPreview")
        expect(conferir).toContain("SearchInput")
        expect(conferir).toContain("com categoria")
        expect(conferir).not.toContain('ComboboxTrigger placeholder="Escolha uma categoria"')
        expect(ler("use-importar-extrato.ts")).toContain('"id,name,type,color,icon"')
    })

    it("no expandido, o DataTable com busca, seleção (o que entra), soma e o gêmeo do telefone", () => {
        expect(conferir).toContain("<DataTable")
        expect(conferir).toMatch(/toolbar=\{\{ search: "Buscar descrição", end: <AcoesDaTabela/)
        expect(conferir).toContain("enableSelection")
        expect(conferir).toContain("rowSelection={selecao}")
        // A pílula flutuante do DataTable fica sob o véu do diálogo: as ações e a soma moram na barra da tabela.
        expect(conferir).not.toContain("bulkActions=")
        expect(conferir).toMatch(/mobile: "title"[\s\S]*?mobile: "description"/)
        expect(conferir).toContain("rotulos.fora")
        expect(conferir).toContain("rotulos.trazer")
        expect(conferir).toContain("rotulos.categoria")
    })

    it("o filtro é Tabs, a categoria é Combobox, o já existe é um Badge, o dinheiro é MoneyDisplay", () => {
        expect(conferir).toContain("<Tabs ")
        for (const f of ["todos", "saidas", "entradas", "existem", "sem-categoria"]) expect(conferir).toContain(`"${f}"`)
        expect(conferir).toContain("<Combobox")
        expect(conferir).toMatch(/<Badge[^>]*tone="warning"[^>]*>\s*já existe/)
        expect(conferir).toContain("<MoneyDisplay")
        expect(conferir).toContain("imp.categoriaNovaDe(")
        expect(conferir).toContain("<Item")
    })

    it("o resumo diz as linhas que ficaram de fora e quando não deu para conferir o que já existe", () => {
        expect(conferir).toMatch(/imp\.previa && imp\.previa\.ignoradas > 0 \? <Caption>\{rotuloDasIgnoradas\(imp\.previa\.ignoradas\)\}<\/Caption>/)
        expect(conferir).toMatch(/!imp\.existentesConferidos \? \(\s*<Caption>Não deu para conferir o que já existe/)
    })

    it("o topo é o filtro com a contagem e uma linha de resumo, sem a fileira de chips", () => {
        // Cada opção traz a contagem; as duas pendências só aparecem com linhas e acendem em aviso.
        expect(conferir).toContain("imp.contagens[f.valor]")
        expect(conferir).toMatch(/Já existem", aviso: true, so_com_linhas: true/)
        expect(conferir).toMatch(/Sem categoria", aviso: true, so_com_linhas: true/)
        expect(conferir).toMatch(/<Badge size="xs" tone="warning"/)
        // O resumo é uma linha de texto com os tons de dinheiro; os chips saíram.
        expect(conferir).toContain("text-expense")
        expect(conferir).toContain("text-income")
        expect(conferir).not.toContain('<Badge size="md" tone="expense">')
        expect(conferir).not.toContain('<Badge size="md" tone="income">')
        // O menu das ações em massa se chama Ações (o N já está em cada item).
        expect(conferir).toMatch(/<span>Ações<\/span>/)
        // O sinal ao contrário se desfaz num toque, ao lado do Ajustar.
        expect(conferir).toMatch(/onClick=\{\(\) => void imp\.inverterSinal\(\)\}>\s*Inverter/)
    })

    it("travado, nenhum controle da conferência muda o lote", () => {
        expect(conferir).toContain("export function ConferirImportacao({ imp, travado = false }")
        expect(conferir).toMatch(/disabled=\{travado\}\s*aria-label=\{`Trazer/)
        expect(conferir).toMatch(/disabled=\{travado\}\s*aria-label=\{`Categoria de/)
        expect(conferir).toMatch(/<TabsTrigger[\s\S]*?disabled=\{travado\}/)
        expect(conferir).toMatch(/disabled=\{travado \|\| itens\.length === 0\}/)
        expect(conferir).toMatch(/aria-expanded=\{imp\.expandido\}\s*disabled=\{travado\}/)
        expect(conferir).toContain("enableSelection={travado ? () => false : true}")
        expect(conferir).toContain("pending={travado}")
        expect(conferir).toMatch(/onRowClick=\{celular && !travado/)
    })

    it("as colunas mostram a prévia com o papel no topo e perguntam o sinal", () => {
        expect(colunas).toContain("<TableHead")
        expect(colunas).toContain("<Select")
        expect(colunas).not.toContain("Neste arquivo, −12,34 é:")
        expect(colunas).not.toContain("FormRadioGroup")
        expect(colunas).toContain("Valor negativo é")
        expect(colunas).toMatch(/<TabsTrigger value="gasto"[^>]*>\s*Gasto/)
        expect(colunas).toMatch(/<TabsTrigger value="entrada"[^>]*>\s*Entrada/)
        expect(colunas).not.toContain("Valor negativo é despesa")
    })

    it("o valor ganha a cor do sinal e a linha de cabeçalho um fundo", () => {
        expect(colunas).toContain("lerValorBr")
        expect(colunas).toContain("text-expense")
        expect(colunas).toContain("text-income")
        expect(colunas).not.toContain("A linha com fundo não entra como lançamento.")
        expect(colunas).toMatch(/<SelectTrigger[^>]*w-full/)
    })
})

describe("rotuloDePorCategoria", () => {
    it("diz o efeito de cada escolha", () => {
        expect(rotuloDePorCategoria([{ nome: "Mercado", n: 5 }])).toBe("Pôr Mercado em 5")
        expect(rotuloDePorCategoria([{ nome: null, n: 3 }])).toBe("Tirar a categoria de 3")
        expect(rotuloDePorCategoria([{ nome: "Mercado", n: 5 }, { nome: "Salário", n: 1 }])).toBe("Pôr Mercado em 5 e pôr Salário em 1")
        expect(rotuloDePorCategoria([{ nome: "Mercado", n: 5 }, { nome: null, n: 1 }])).toBe("Pôr Mercado em 5 e tirar a categoria de 1")
        expect(rotuloDePorCategoria([])).toBe("Pôr categoria")
    })
})
