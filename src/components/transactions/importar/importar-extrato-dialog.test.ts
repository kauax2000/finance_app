import { describe, expect, it } from "vitest"
import { existsSync } from "node:fs"

import { guiaDaAba, ordemPelaIa, rotuloDePorCategoria } from "./rotulo-por-categoria"
import { efeitoDoEsc } from "./busca-que-abre"
import { lerFonte, semComentarios } from "@/test/fonte"

const ler = (nome: string) => semComentarios(lerFonte(`src/components/transactions/importar/${nome}`), "tudo")
const dialogo = ler("importar-extrato-dialog.tsx")
const conferir = ler("conferir-importacao.tsx")
const colunas = ler("mapear-colunas.tsx")
const movimento = ler("movimento.ts")

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
        expect(dialogo).toContain('<ConferirImportacao imp={imp} conf={conf} travado={travadoAoImportar} />')
        expect(dialogo).toContain('const travadoAoImportar = imp.pendente === "importar"')
    })
})

describe("a conferência", () => {
    it("o compacto mostra só 6 linhas (a tela cheia mostra todas), e só com mais de 6 aparecem o contador e o expandir", () => {
        expect(conferir).toContain("const LIMITE = 6")
        expect(conferir).toContain(".slice(0, teto).map((i, n) => (")
        // No desktop a categoria é coluna da linha; no telefone, a segunda linha.
        // No telefone a linha não tem Combobox: a categoria é texto na segunda linha, e o campo só existe do md para cima.
        expect(conferir).toContain('<div className="hidden md:block md:w-44">')
        expect(conferir).toMatch(/<span className="md:hidden">\{nomeDaCategoria\(imp, item\) \?\? "Sem categoria"\}<\/span>/)
        expect(conferir).not.toContain("order-last basis-full")
        // Trocar a de uma linha no telefone: marcar e usar o Pôr categoria, que o aviso diz.
        // A categoria de uma linha no telefone: tocar no corpo da linha (a caixa só diz se entra).
        expect(conferir).toContain("Toque numa linha para trocar a categoria")
        expect(conferir).toContain("aria-label={`Trocar a categoria de ${rotuloDe(item)}`}")
        expect(conferir).toMatch(/onRowClick=\{celular && !travado \? \(i\) => setPorCategoria\(\[i\]\) : undefined\}/)
        expect(conferir).not.toContain("Marque e use")
        // Com uma marcada só, a folha nomeia o lançamento.
        expect(conferir).toContain("`Vale para ${itens[0].descricao}.`")
        expect(conferir).toContain("const grande = teto !== undefined && daTabela.length > teto")
        expect(conferir).toMatch(/grande \? \(\s*<Caption className="text-control-sm leading-5">\{`Mostrando \$\{numberBR\(LIMITE\)\} de \$\{numberBR\(daTabela\.length\)\} ·`[\s\S]*?<span>Ver todos<\/span>/)
        expect(conferir).toMatch(/ArrowsPointingOutIcon[\s\S]*?ArrowsPointingInIcon/)
        expect(conferir).toMatch(/variant="tertiary" disabled=\{travado\} onClick=\{alternar\}>[\s\S]*?<ArrowsPointingInIcon data-icon="inline-start" \/>\}\s*<span>Ver menos<\/span>/)
        expect(conferir).not.toContain("aria-expanded")
        // O crédito do cartão diz que é estorno (e por isso leva categoria de despesa), no compacto e na tabela.
        expect(conferir).toContain('item.estorno && imp.destino?.tipo === "cartao"')
        expect(conferir.match(/<AvisosDaLinha imp=\{imp\} item=\{(item|i)\} \/>/g)).toHaveLength(2)
    })

    it("acessível: a caixa diz a data, a contagem é anunciada, a linha de fora não perde contraste", () => {
        expect(conferir).toContain("aria-label={`Trazer ${rotuloDe(item)}`}")
        expect(conferir).toContain("getRowLabel={rotuloDe}")
        // O resumo é um recibo recolhido: a linha é o saldo, e abrir mostra entram, cada tipo e sem categoria.
        expect(conferir).toMatch(/function ResumoDoSaldo\([\s\S]*?<Collapsible>[\s\S]*?<CollapsibleRow[\s\S]*?\{rotulo\}[\s\S]*?<CollapsibleContent>[\s\S]*?Entram/)
        // Anunciado nos dois lugares: a caixa do desktop (no corpo) e a linha do telefone (no rodapé).
        expect(conferir).toMatch(/role="status"[^>]*>\s*<ItemContent>\s*<ResumoDoSaldo imp=\{imp\} rotulo="Saldo"/)
        expect(dialogo).toMatch(/role="status"[^>]*>\s*<ResumoDoSaldo imp=\{imp\} rotulo="Total"/)
        expect(dialogo).not.toContain("Vão entrar")
        // A linha de fora não esmaece por opacidade; só a espera da releitura (lendo) usa 60%.
        expect(conferir.match(/opacity-60/g)).toHaveLength(1)
        expect(conferir).toContain('marcada ? undefined : "text-muted-foreground"')
    })

    it("as ações em massa valem para as visíveis (filtro e busca), nunca para as marcadas; a folha vira gaveta no telefone", () => {
        // O que se vê é o que o DataTable filtrou (o filtro da conferência mais a busca).
        expect(conferir).toContain("normalizeSearchText(descricaoDe(i)).includes(termo)")
        expect(conferir).toContain("<AcoesDasVisiveis imp={imp} itens={imp.visiveis}")
        expect(conferir).toContain("rotulosDasVisiveis(itens.length)")
        expect(conferir).not.toContain("marcadasVistas")
        expect(conferir).not.toContain("porCategoriaDesligado")
        // Cada categoria vale para as visíveis do tipo dela (o estorno do cartão é despesa).
        expect(conferir).toContain("idsParaCategoria(itens, t, destino)")
        expect(conferir).toContain('TabsTrigger value="expense"')
        expect(conferir).toContain('TabsTrigger value="income"')
        expect(conferir).toContain('aria-label="Tipo do lançamento"')
        expect(conferir).toContain("escolhas")
        expect(conferir).not.toContain('<Caption className="px-1">{t === "expense" ? "Despesas" : "Receitas"}</Caption>')
        expect(conferir).toMatch(/<Dialog open=\{itens\.length > 0\} surface="auto"/)
        expect(conferir).toContain('`Vale para todos os ${numberBR(itens.length)} lançamentos.`')
        // O Form do diálogo é dele: impede o envio nativo (senão a página recarrega) e não sobe ao do Importar.
        expect(conferir).toMatch(/function aplicar\(e: React\.FormEvent\) \{[\s\S]*?e\.preventDefault\(\)\s*e\.stopPropagation\(\)/)
        expect(conferir).toContain("rotuloDePorCategoria(")
        expect(ler("rotulo-por-categoria.ts")).toContain("Tirar a categoria de")
        expect(conferir).toContain("LadrilhoDaCategoria")
        expect(ler("ladrilho-da-categoria.tsx")).toContain("ColorTile")
        expect(ler("ladrilho-da-categoria.tsx")).toContain("CategoryIconPreview")
        expect(conferir).toContain("SearchInput")
        expect(conferir).toContain("Escolha uma categoria para as saídas e outra para as entradas. Cada uma vale só para o seu tipo.")
        expect(guiaDaAba("expense", 56, null)).toBe("Escolha a categoria das 56 saídas.")
        expect(guiaDaAba("income", 1, null)).toBe("Escolha a categoria da 1 entrada.")
        expect(guiaDaAba("expense", 56, "Mercado")).toBe("Para as 56 saídas: Mercado.")
        expect(conferir).not.toContain('ComboboxTrigger placeholder="Escolha uma categoria"')
        expect(ler("use-importar-extrato.ts")).toContain('"id,name,type,color,icon"')
    })

    it("no expandido, o DataTable com busca, seleção (o que entra), soma e o gêmeo do telefone", () => {
        expect(conferir).toContain("<DataTable")
        expect(conferir).not.toMatch(/toolbar=\{\{ search: "Buscar descrição"/)
        // A busca filtra fora da tabela: sem a barra do DataTable (que deixava a faixa vazia) e sem busca dele.
        expect(conferir).toContain("data={daTabela}")
        expect(conferir).not.toContain("toolbar=")
        expect(conferir).not.toContain("globalFilter")
        expect(conferir).toMatch(/<BuscaQueAbre[\s\S]*?botaoRecolher[\s\S]*?<AcoesDasVisiveis imp=\{imp\} itens=\{daTabela\}/)
        expect(conferir).toMatch(/if \(de\) \{\s*setBusca\(""\)[\s\S]*?imp\.setExpandido\(!de\)/)
        // Na tela cheia as Ações e o recolher moram na linha das abas.
        expect(conferir).toMatch(/<FiltrosDaConferencia[^>]*\/>\s*<\/div>[\s\S]*?\{imp\.expandido && !celular \? \([\s\S]*?botaoRecolher[\s\S]*?<AcoesDasVisiveis imp=\{imp\} itens=\{daTabela\}/)
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
        expect(conferir).toMatch(/onClick=\{\(\) => void imp\.inverterSinal\(\)\}>\s*\{lendo \? <Spinner[^>]*\/> : null\}\s*Inverter/)
    })

    it("travado, nenhum controle da conferência muda o lote", () => {
        expect(conferir).toContain("export function ConferirImportacao({ imp, conf, travado = false }")
        expect(conferir).toMatch(/disabled=\{travado\}\s*aria-label=\{`Trazer/)
        expect(conferir).toMatch(/disabled=\{travado\}\s*aria-label=\{`Categoria de/)
        expect(conferir).toMatch(/<TabsTrigger[\s\S]*?disabled=\{travado\}/)
        expect(conferir).toMatch(/disabled=\{travado \|\| itens\.length === 0\}/)
        expect(conferir).toMatch(/variant="tertiary" disabled=\{travado\} onClick=\{alternar\}/)
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
        expect(rotuloDePorCategoria([{ nome: "Mercado", n: 5 }, { nome: "Salário", n: 1 }])).toBe("Aplicar em 6")
        expect(rotuloDePorCategoria([{ nome: "Mercado", n: 5 }, { nome: null, n: 1 }])).toBe("Aplicar em 6")
        expect(rotuloDePorCategoria([])).toBe("Pôr categoria")
    })
})

describe("Inverter responde e troca em fases", () => {
    it("a leitura esmaece o conteúdo velho, trava o botão e mostra o Spinner", () => {
        expect(conferir).toContain('imp.pendente === "lendo"')
        expect(conferir).toContain("aria-busy")
        expect(conferir).toContain("<Spinner")
    })

    it("o valor da linha troca no lugar e as contagens contam", () => {
        expect(conferir).toContain("<TrocaSuave")
        expect(conferir).toMatch(/count=\{[\s\S]*?<ContagemQueAnda/)
    })
})

describe("Ver todos e Recolher em três fases", () => {
    it("a troca vai numa transição, com o Spinner no botão enquanto espera", () => {
        expect(conferir).toContain("React.useTransition()")
        expect(conferir).toMatch(/startTransition\(\(\) => \{[\s\S]*?imp\.setExpandido\(/)
        expect(conferir).not.toMatch(/onClick=\{\(\) => imp\.setExpandido\(/)
        expect(conferir).toMatch(/esperando \? <Spinner data-icon="inline-start" \/>/)
    })

    it("o que sai esmaece antes da troca, e o que chega surge em escada", () => {
        expect(conferir).toContain("onTransitionEnd={sair}")
        expect(conferir).toContain('const saida = cn(VISTA_QUE_SAI, saindo && "opacity-0")')
        // A vista inteira esmaece (abas, faixa das colunas, saldo), não só a lista: o resto pulava de lugar.
        expect(conferir).toMatch(/className=\{cn\("flex min-w-0 flex-col gap-2 md:gap-4", imp\.expandido && "md:min-h-0 md:flex-1", saida\)\}\s*data-saindo=\{saindo \|\| undefined\}/)
        expect(conferir).toContain("cn(esmaece, escadaDaLista)")
        expect(conferir).toContain(": ESCADA_DA_LISTA")
        expect(conferir).toMatch(/className=\{cn\(\s*ESCADA_DA_TABELA,/)
        expect(dialogo).toContain("className={PASSOS_ACOMPANHAM}")
        // Nada do `menu-content-in` (desfoque de 10px): o dono achou brusco.
        expect(conferir).not.toContain("dialog-step")
    })
})

describe("a troca do Ver todos não fica presa", () => {
    it("o cancelamento encerra como o fim, e um tempo de reserva troca se nenhum chegar", () => {
        expect(conferir.match(/onTransitionCancel=\{sair\}/g)).toHaveLength(1)
        expect(conferir).toContain("const RESERVA_DA_SAIDA_MS = VISTA_QUE_SAI_MS + 100")
        expect(conferir).toMatch(/if \(!saindo\) return\s*const t = window\.setTimeout\(trocarDeReserva, RESERVA_DA_SAIDA_MS\)\s*return \(\) => window\.clearTimeout\(t\)/)
    })

    it("a troca é idempotente e não vale depois de o expandido mudar por fora", () => {
        // A segunda chamada (o fim e a reserva) volta antes de mexer no estado: a vista que sai segue apagada.
        expect(conferir).toMatch(/const de = pedido\.current\s*if \(de === null\) return\s*pedido\.current = null\s*if \(de !== imp\.expandido\)/)
        expect(conferir).toContain("const saindo = saindoDe === imp.expandido")
        expect(conferir).toContain("imp.setExpandido(!de)")
    })
})

describe("a troca de passo chega em escada", () => {
    it("cada passo leva a escada na própria raiz; a conferência só esmaece, a lista dela já desce por dentro", () => {
        expect(dialogo).toContain('<div key="arquivo" className={cn(ESCADA, "flex flex-col gap-4")}>')
        expect(colunas).toContain('<div key="colunas" className={cn(ESCADA, "flex flex-col gap-6")}>')
        expect(dialogo).toContain('<EmptyState key="feito" variant="plain" className={ESCADA}>')
        expect(dialogo).toMatch(/<div key="conferir" className=\{cn\(ESMAECE_AO_CHEGAR, expandido && "md:flex md:min-h-0 md:flex-1 md:flex-col"\)\}>\s*<ConferirImportacao/)
        expect(dialogo).not.toContain("dialog-step")
        expect(colunas).not.toContain("dialog-step")
    })

    it("o título tem um nome só para o leitor: a cena é aria-hidden e o texto vai num sr-only", () => {
        expect(dialogo).toMatch(/<span aria-hidden="true">\s*<TrocaSuave forma="texto" chave=\{titulo\}/)
        expect(dialogo).toContain('<span className="sr-only">{titulo}</span>')
    })

    it("o título troca no lugar pela TrocaSuave, num pai relative", () => {
        expect(dialogo).toMatch(/<DialogTitle className="relative">[\s\S]*?<TrocaSuave forma="texto" chave=\{titulo\}/)
    })
})

describe("a busca que abre da lupa", () => {
    const busca = ler("busca-que-abre.tsx")

    it("o Esc limpa com texto e fecha vazio", () => {
        expect(efeitoDoEsc("Uber")).toBe("limpar")
        expect(efeitoDoEsc("")).toBe("fechar")
    })

    it("é o SearchInput de 36, na mola do palco e na saída, sem o Esc chegar ao diálogo", () => {
        expect(busca).toContain("SearchInput")
        expect(busca).toContain('size="lg"')
        expect(busca).toContain("MOLA_PALCO")
        expect(busca).toContain("SAIDA")
        expect(busca).toContain("stopPropagation")
        expect(busca).toMatch(/prefers-reduced-motion|useReducedMotion/)
        expect(busca).toContain("18rem")
    })
})

describe("na tela cheia o topo fica parado e só as linhas rolam", () => {
    it("o DialogBody para de rolar no desktop, só com a tela cheia", () => {
        expect(dialogo).toMatch(/<DialogBody[\s\S]*?className=\{expandido \? "md:flex md:flex-col md:overflow-hidden" : undefined\}/)
        expect(dialogo).toMatch(/key="conferir" className=\{cn\(ESMAECE_AO_CHEGAR, expandido && "md:flex md:min-h-0 md:flex-1 md:flex-col"\)\}/)
    })

    it("o cabeçalho das colunas cola, e a cadeia chega ao pai do viewport por :has", () => {
        expect(conferir).toContain("stickyHeader={imp.expandido}")
        expect(conferir).toContain(":has(>[data-slot=table-viewport])")
        expect(conferir).toContain('imp.expandido && "md:min-h-0 md:flex-1"')
    })

    it("toda classe nova da cadeia é só do desktop: no telefone o pai do viewport segue hidden", () => {
        const novas = [dialogo, conferir].flatMap((f) =>
            [...f.matchAll(/"([^"]*md:min-h-0[^"]*)"/g)].map((m) => m[1])
        )
        expect(novas.length).toBeGreaterThan(0)
        for (const s of novas) {
            for (const classe of s.split(/\s+/).filter(Boolean)) expect(classe).toMatch(/^md:/)
        }
    })
})

describe("a IA mora na aba ✦ Sugeridas, sem botão próprio", () => {
    it("o botão da IA saiu, e a faixa do wireframe também", () => {
        expect(existsSync("src/components/transactions/importar/rotulo-da-ia.tsx")).toBe(false)
        expect(conferir).not.toContain("RotuloDaIa")
        expect(conferir).not.toContain("FaixaDaIaWireframe")
    })

    it("lendo, a aba aparece com o spinner no lugar da contagem", () => {
        expect(conferir).toContain("(f.ia && iaLendo)")
        expect(conferir).toMatch(/f\.ia && iaLendo \? \(\s*<Spinner/)
    })

    it("o aviso da aba desfaz todas, com o toast que volta", () => {
        expect(conferir).toContain("Desfazer todas")
        expect(conferir).toMatch(/toastUndo\("Sugestões da IA desfeitas", \{ onUndo: imp\.desfazerIa\(ids\) \}\)/)
    })

    it("a falha é um aviso genérico acima das abas, com Tentar de novo", () => {
        const inicio = conferir.indexOf('imp.ia.estado === "falhou"')
        const falha = conferir.slice(inicio, conferir.indexOf("</Alert>", inicio))
        expect(falha).toContain('tone="warning"')
        expect(falha).toContain("Não foi possível gerar a categorização automática.")
        expect(falha).toContain("imp.tentarIaDeNovo")
        expect(falha).not.toContain("imp.ia.mensagem")
    })
})

describe("a aba Pela IA agrupada, e o ✦ no campo (Bloco 2 no DS)", () => {
    it("a marca do wireframe saiu, e o arquivo dela não existe", () => {
        expect(conferir).not.toContain("@/components/wireframe/importar-ia-wireframe")
        expect(conferir).not.toContain("MarcaIaWireframe")
        expect(existsSync("src/components/wireframe/importar-ia-wireframe.tsx")).toBe(false)
    })

    it("agrupa por categoria, com o Trocar e o Desfazer do grupo, e o ✦ dentro do campo", () => {
        expect(conferir).toContain("groupBy=")
        expect(conferir).toContain("data-grupo-ia")
        expect(conferir).toContain('"Trocar o grupo…"')
        expect(conferir).toContain("SparklesIcon")
        expect(conferir).toContain("(sugerida pela IA)")
        expect(conferir).toContain("sorting.length === 0")
    })

    it("a faixa da aba é um Alert com o ícone pelo prop, nunca filho", () => {
        const alerta = conferir.match(/<Alert\b[^>]*icon=[\s\S]*?<\/Alert>/)?.[0] ?? ""
        expect(alerta).toContain("icon={")
        expect(alerta).not.toContain("<svg")
        expect(alerta).not.toMatch(/<\w*Icon className/)
    })
})

describe("as ações do grupo moram no rótulo, e a tabela fica alinhada (correção 1)", () => {
    it("nada na célula do total: as ações vão à ponta direita do rótulo, em caixa normal", () => {
        expect(conferir).not.toContain("groupTotal=")
        expect(conferir).toContain("[&_[data-slot=table-group-row]>td:last-child>span]:flex")
        expect(conferir).toMatch(/ms-auto[^"]*normal-case/)
    })

    it("a coluna escondida do telefone não entra no desktop, para o colSpan do grupo bater", () => {
        expect(conferir).toMatch(/\.\.\.\(celular \? \[\{[\s\S]*?id: "categoria-nome"/)
    })
})

describe("revisão final: grupos contíguos", () => {
    it("o nome empatado desempata pelo id: cada categoria fica num grupo só, e o resto segue a ordem de hoje", () => {
        const cat: Record<string, string> = { a: "o1", b: "o2", c: "o1", d: "m", e: "o2" }
        const nome = (id: string | null) => ({ o1: "Outros", o2: "Outros", m: "Mercado" })[id ?? ""] ?? ""
        expect(ordemPelaIa(["a", "b", "c", "d", "e"], (i) => cat[i], nome)).toEqual(["d", "a", "c", "b", "e"])
        expect(conferir).toContain("ordemPelaIa(imp.visiveis")
    })
})

describe("no telefone, as ações da conferência vão para o ⋯ do cabeçalho (opção B, tarefa 1)", () => {
    it("o cabeçalho põe o ⋯ ao lado do ✕ só no telefone e só no passo Conferir", () => {
        expect(dialogo).toContain("useIsMobile()")
        expect(dialogo).toMatch(/const comMenu = celular && imp\.passo === "conferir"/)
        // O ✕ desce à linha do título, ao lado do ⋯; o do canto sai.
        expect(dialogo).toContain("showCloseButton={!comMenu}")
        expect(dialogo).toMatch(/<\/DropdownMenu>\s*<DialogCloseButton placement="inline" \/>/)
        expect(dialogo).toMatch(/<DialogHeaderRow endAdornment=\{[\s\S]*?<DropdownMenu>[\s\S]*?aria-label="Mais ações"/)
        // O gatilho do ⋯ é o da regra: terciário, icon-md, sem size-* nem ícone com tamanho.
        expect(dialogo).toMatch(/<Button type="button" variant="tertiary" size="icon-md" aria-label="Mais ações" disabled=\{travadoAoImportar\}>\s*<EllipsisHorizontalIcon \/>/)
    })

    it("o menu traz Buscar, Inverter e Ajustar (os dois só com CSV) e as ações das visíveis", () => {
        const menu = dialogo.match(/<DropdownMenuContent[\s\S]*?<\/DropdownMenuContent>/)?.[0] ?? ""
        expect(menu).toContain("Buscar")
        // Aberta pelo Buscar, a busca recebe o foco (o menu o devolveria ao ⋯).
        expect(menu).toContain("onSelect={conf.abrirBusca}")
        expect(dialogo).toContain("onCloseAutoFocus={conf.focoAoFecharMenu}")
        expect(conferir).toContain("id={conf.idDaBusca}")
        expect(menu).toMatch(/\{imp\.csv \? \([\s\S]*?Inverter sinal[\s\S]*?Ajustar colunas[\s\S]*?\) : null\}/)
        expect(menu).toContain("<DropdownMenuSeparator />")
        expect(menu).toContain("<ItensDasVisiveis")
        // Os itens das visíveis são um componente só, do ⋯ e do menu Ações do desktop.
        expect(conferir).toMatch(/function AcoesDasVisiveis[\s\S]*?<ItensDasVisiveis/)
        expect(conferir).toContain("export function ItensDasVisiveis")
    })

    it("a busca e o Pôr categoria sobem para o diálogo, que os passa à conferência", () => {
        expect(dialogo).toContain("const conf = useConferencia(imp.passo === \"conferir\")")
        expect(dialogo).toContain("<ConferirImportacao imp={imp} conf={conf}")
        expect(conferir).toContain("export function useConferencia(")
        expect(conferir).not.toMatch(/const \[busca, setBusca\] = React\.useState\(""\)\s*const termo/)
    })

    it("no telefone a barra Colunas, a lupa, as Ações e o Ver menos saem da linha das abas", () => {
        expect(conferir).toMatch(/\{imp\.csv && !imp\.expandido && !celular \? \(/)
        expect(conferir).toMatch(/\{!imp\.csv && !imp\.expandido && !celular \? \(/)
        expect(conferir).toMatch(/\{imp\.expandido && !celular \? \(\s*<>\s*<BuscaQueAbre/)
        // O telefone não tem Ver todos nem Ver menos: a lista mostra tudo.
        expect(conferir).not.toContain("celular && podeExpandir")
        // No telefone as abas cabem: três de tipo, divididas na linha, sem rolar de lado.
        expect(conferir).not.toContain("scrollable={celular}")
        expect(conferir).toMatch(/<TabsList aria-label="Filtro" stretch=\{celular \|\| !imp\.expandido\}>/)
    })
})

describe("no telefone, abas de tipo e pílulas de pendência", () => {
    it("o TabsList do telefone leva só as três abas de tipo", () => {
        expect(conferir).toContain("celular ? !f.so_com_linhas :")
    })

    it("as pendências são pílulas Toggle chip, que ligam e desligam o filtro", () => {
        expect(conferir).toMatch(/<Toggle[\s\S]*?variant="chip"[\s\S]*?pressed=\{imp\.filtro === f\.valor\}/)
        expect(conferir).toMatch(/imp\.setFiltro\(imp\.filtro === f\.valor \? "todos" : f\.valor\)/)
        expect(conferir).toMatch(/\{pilulas\.length > 0 \? \(\s*<div className="flex flex-wrap gap-2">/)
    })

    it("a pílula diz a contagem e o nome curto, em minúscula", () => {
        expect(conferir).toContain('curto: "sem categoria"')
        expect(conferir).toContain('curto: "já existem"')
        expect(conferir).toContain('curto: "sugeridas"')
        expect(conferir).not.toMatch(/rotulo\.toLowerCase\(\)/)
    })

    it("as abas, as pílulas e a busca ficam fixas no cabeçalho do telefone", () => {
        expect(conferir).toContain("export function FiltrosDaConferencia(")
        const cabecalho = dialogo.slice(dialogo.indexOf("<DialogHeader>"), dialogo.indexOf("</DialogHeader>"))
        expect(cabecalho).toMatch(/<DialogSteps[\s\S]*?\{comMenu \? <FiltrosDaConferencia/)
        // No corpo, só no desktop.
        expect(conferir).toMatch(/\{!celular \? \(\s*<div[^>]*>\s*<div className="min-w-0 flex-1">\s*<FiltrosDaConferencia/)
        const filtros = conferir.slice(conferir.indexOf("export function FiltrosDaConferencia("), conferir.indexOf("export function ConferirImportacao("))
        expect(filtros).not.toContain("sticky")
    })
})

describe("no telefone, uma linha só nas duas vistas, a busca pelo ⋯ e o Total (opção B, tarefa 2)", () => {
    it("a busca aberta é uma linha abaixo das abas, nas duas vistas", () => {
        expect(conferir).toMatch(/<\/Tabs>[\s\S]*?\{celular && \(conf\.buscaAberta \|\| buscaNaTela\) \? \(\s*<div[\s\S]*?<SearchInput/)
        // Recolher limpa a busca e fecha a linha: nada de campo vazio aberto.
        expect(conferir).toMatch(/if \(de\) \{\s*setBusca\(""\)\s*conf\.setBuscaAberta\(false\)/)
    })

    it("a linha do resumo: título e 'categoria · estorno' à esquerda, valor e data (dd/mm) à direita", () => {
        expect(conferir).toMatch(/<span className="md:hidden">\{nomeDaCategoria\(imp, item\) \?\? "Sem categoria"\}<\/span>/)
        expect(conferir).toMatch(/<MoneyDisplay value=\{valorDe\(item\)\}[\s\S]*?<span className="nums text-xs text-muted-foreground md:hidden">\{formatYmdPtBr\(item\.data\)\.slice\(0, 5\)\}<\/span>/)
    })

    it("a tabela no telefone põe a data embaixo do valor e fica sem a moldura de tabela", () => {
        // A data é o `meta` do gêmeo (a linha miúda sob o valor), em dd/mm.
        expect(conferir).toMatch(/col\.date\(\{ id: "data"[\s\S]*?celular \? \{ cell: \(\{ row \}\) => formatYmdPtBr\(row\.original\.data\)\.slice\(0, 5\) \}/)
        // A legenda é a categoria e depois o aviso; a da identidade fica só no desktop.
        expect(conferir).toMatch(/description: celular \? undefined :/)
        expect(conferir).toMatch(/id: "categoria-nome"[\s\S]*?nomeDaCategoria\(imp, row\.original\) \?\? "Sem categoria"[\s\S]*?<AvisosDaLinha imp=\{imp\} item=\{row\.original\} \/>/)
        expect(conferir).toContain("panel={!celular}")
    })

    it("no telefone o Saldo vira a linha Total, sem caixa, também na tela cheia", () => {
        expect(conferir).toContain("export function ResumoDoSaldo(")
        // No desktop o Saldo segue no corpo, na caixa; no telefone o corpo não o tem.
        expect(conferir).toMatch(/<\/ItemGroup>[\s\S]*?\{celular \? null : \(\s*<Item variant="muted"[\s\S]*?<ResumoDoSaldo imp=\{imp\} rotulo="Saldo" \/>/)
        // O Total mora no rodapé, fora da vista que rola: aparece nas duas vistas.
        expect(dialogo).toMatch(/<DialogFooter>[\s\S]*?\{celular && imp\.passo === "conferir" \? \(\s*<div role="status"[^>]*>\s*<ResumoDoSaldo imp=\{imp\} rotulo="Total" \/>[\s\S]*?<\/DialogFooter>/)
    })

    it("a contagem e o vazio seguem a busca", () => {
        expect(conferir).toContain("const grande = teto !== undefined && daTabela.length > teto")
        expect(conferir).toContain("`Mostrando ${numberBR(LIMITE)} de ${numberBR(daTabela.length)} ·`")
        expect(conferir).toContain('busca.trim() ? "Nenhum lançamento para essa busca." : "Nenhum lançamento neste filtro"')
        // Ajustar colunas no ⋯ espera a releitura, como o Inverter.
        expect(dialogo).toMatch(/<DropdownMenuItem disabled=\{imp\.pendente === "lendo"\} onSelect=\{imp\.ajustarColunas\}>/)
    })
})

describe("no telefone, as transições da conferência (opção B, tarefa 3)", () => {
    it("trocar de aba remonta a lista do resumo, que chega em escada", () => {
        // Só no telefone: no desktop a lista não remonta e a escada é a de antes.
        expect(conferir).toMatch(/<ItemGroup\s+key=\{celular \? imp\.filtro : undefined\}[\s\S]*?className=\{cn\(esmaece, escadaDaLista\)\}/)
        // A aba trocada não tem vista que sai: ESCADA (sem espera); a volta do Ver menos espera o esmaecer.
        expect(conferir).toContain("const escadaDaLista = celular && trocouDeAba ? ESCADA : ESCADA_DA_LISTA")
        expect(conferir).toMatch(/function alternar\(\) \{\s*if \(esperando\) return\s*setTrocouDeAba\(false\)/)
    })

    it("a busca brota da linha das abas e volta a ela ao fechar, sem movimento com movimento reduzido", () => {
        expect(conferir).toMatch(/data-state=\{conf\.buscaAberta \? "open" : "closed"\}[\s\S]*?className="field-bloom origin-top motion-reduce:animate-none!"[\s\S]*?<SearchInput/)
        // Fica montada enquanto o `menu-unmorph` corre, e sai na hora com movimento reduzido.
        expect(conferir).toMatch(/\{celular && \(conf\.buscaAberta \|\| buscaNaTela\) \? \(/)
        expect(conferir).toContain("reduzido ? 0 : BUSCA_QUE_SAI_MS")
    })

    it("o Ver todos e o Ver menos esmaecem a vista e chegam em escada, também no gêmeo do telefone", () => {
        expect(conferir).toContain('const saida = cn(VISTA_QUE_SAI, saindo && "opacity-0")')
        expect(conferir).toMatch(/className=\{cn\(\s*ESCADA_DA_TABELA,/)
        expect(movimento).toContain("[&_[data-slot=data-table-mobile]>*]:animate-in")
        expect(movimento).toContain("[&_[data-slot=data-table-mobile]>*]:stagger-ladder")
        expect(movimento).toContain("motion-reduce:[&_[data-slot=data-table-mobile]>*]:animate-none")
    })
})

describe("no telefone a conferência mostra tudo", () => {
    it("o teto de 6 e o Ver todos / Ver menos são só do desktop", () => {
        expect(conferir).toContain("const teto = celular ? undefined : LIMITE")
        expect(conferir).toContain("const podeExpandir = !celular && resumo.total > LIMITE")
        expect(conferir).toContain("daTabela.slice(0, teto).map((i, n) => (")
        expect(conferir).toContain("chavesDasLinhas(daTabela.slice(0, teto))")
        expect(conferir).not.toContain("celular && podeExpandir")
        expect(conferir).toMatch(/\{imp\.expandido && !celular \? \(\s*(?:\/\/[^\n]*\s*)*<div[\s\S]*?<DataTable/)
        expect(conferir).toMatch(/if \(celular && expandido\) setExpandido\(false\)/)
    })
})
