import type { SupabaseClient } from "@supabase/supabase-js"
import { describe, expect, it, vi } from "vitest"

vi.mock("@/lib/supabase", () => ({ supabase: {} }))

import { desfazerImportacao } from "@/lib/import/importar"
import type { ItemBanco } from "@/lib/import/tipos"
import { lerFonte, semComentarios } from "@/test/fonte"

import { deduzirMapeamento } from "@/lib/import/csv"
import type { Existente, ItemImportavel } from "@/lib/import/importar"

import {
    aplicarCategoria,
    categoriaEfetiva,
    categoriaNovaDe,
    comCategoriasDaIA,
    criarVez,
    contagemDosFiltros,
    filtrarItens,
    idsParaCategoria,
    gravarLote,
    iaQueFalhou,
    loteParaGravar,
    marcadasIniciais,
    origemDaCategoria,
    passoDepoisDoArquivo,
    periodoPtBr,
    prepararLote,
    quemFicouDeFora,
    resumoDaConferencia,
    resumoDoLote,
    rotuloDasIgnoradas,
    rotulosDasVisiveis,
    sourceDoArquivo,
    sugestoesPelaChave,
    tipoDoArquivo,
} from "./use-importar-extrato"
import { chavesDasLinhas } from "./chave-da-linha"

type Chamada = { tabela: string; op: string; args: unknown[] }

/** Um cliente falso: anota cada passo da cadeia e resolve com a resposta da tabela. */
function clienteFalso(respostas: Record<string, (op: string) => unknown>) {
    const chamadas: Chamada[] = []
    const cliente = {
        from(tabela: string) {
            let ultima = ""
            const cadeia: Record<string, unknown> = {}
            for (const op of ["select", "eq", "not", "order", "limit", "upsert", "delete"]) {
                cadeia[op] = (...args: unknown[]) => {
                    chamadas.push({ tabela, op, args })
                    if (op === "upsert" || op === "delete") ultima = op
                    return cadeia
                }
            }
            cadeia.then = (ok: (v: unknown) => unknown) =>
                Promise.resolve(respostas[tabela]?.(ultima) ?? { data: [], error: null }).then(ok)
            return cadeia
        },
    }
    return { db: cliente as unknown as SupabaseClient, chamadas }
}

const lidos: ItemBanco[] = [
    { data: "2026-10-02", descricao: "Mercado", valor: 50, estorno: false, parcela: null, categoria: "Feira" },
    { data: "2026-10-05", descricao: "Salário", valor: 200, estorno: true, parcela: null },
]
const conta = { tipo: "conta", paymentMethod: "pix" } as const
const ctx = { userId: "u1", workspaceId: "w1" }

function respostas() {
    return {
        transactions: () => ({ data: [], error: null }),
        categories: (op: string) =>
            op === "upsert"
                ? { data: [{ id: "c-nova", name: "Feira", type: "expense" }], error: null }
                : { data: [], error: null },
    }
}

const linhasDoUpsert = (chamadas: Chamada[], tabela: string) =>
    chamadas.filter((c) => c.tabela === tabela && c.op === "upsert").map((c) => c.args[0] as Record<string, unknown>[])

describe("importar extrato", () => {
    it("o client_id nasce uma vez por item: importar duas vezes manda os mesmos ids", async () => {
        const { db, chamadas } = clienteFalso(respostas())
        const r = await prepararLote(db, "w1", { itens: lidos, ignoradas: 1 }, conta, "import_sheet")
        if (!r.ok) throw new Error(r.erro)
        await gravarLote(db, ctx, r.lote)
        await gravarLote(db, ctx, r.lote)
        const [primeira, segunda] = linhasDoUpsert(chamadas, "transactions")
        expect(primeira.map((l) => l.client_id)).toEqual(segunda.map((l) => l.client_id))
        expect(new Set(primeira.map((l) => l.client_id)).size).toBe(2)
        const [cat1, cat2] = linhasDoUpsert(chamadas, "categories")
        expect(cat1[0].client_id).toBe(cat2[0].client_id)
        const upserts = chamadas.filter((c) => c.op === "upsert")
        expect(upserts.every((c) => (c.args[1] as { onConflict: string }).onConflict === "workspace_id,client_id")).toBe(
            true,
        )
    })

    it("OFX é extrato; CSV é planilha só com a coluna de categoria", async () => {
        expect(sourceDoArquivo("ofx", null)).toBe("import_statement")
        expect(sourceDoArquivo("csv", null)).toBe("import_statement")
        expect(sourceDoArquivo("csv", 3)).toBe("import_sheet")
        const { db, chamadas } = clienteFalso(respostas())
        const r = await prepararLote(db, "w1", { itens: lidos, ignoradas: 0 }, conta, "import_statement")
        if (!r.ok) throw new Error(r.erro)
        await gravarLote(db, ctx, r.lote)
        expect(linhasDoUpsert(chamadas, "transactions")[0].every((l) => l.source === "import_statement")).toBe(true)
    })

    it("needs_review é verdadeiro e o import_batch_id é o mesmo em todos", async () => {
        const { db, chamadas } = clienteFalso(respostas())
        const r = await prepararLote(db, "w1", { itens: lidos, ignoradas: 0 }, conta, "import_sheet")
        if (!r.ok) throw new Error(r.erro)
        await gravarLote(db, ctx, r.lote)
        const linhas = linhasDoUpsert(chamadas, "transactions")[0]
        expect(linhas.every((l) => l.needs_review === true)).toBe(true)
        expect(new Set(linhas.map((l) => l.import_batch_id))).toEqual(new Set([r.lote.batchId]))
    })

    it("as categorias que faltam são criadas antes das transações, e o item a usa", async () => {
        const { db, chamadas } = clienteFalso(respostas())
        const r = await prepararLote(db, "w1", { itens: lidos, ignoradas: 0 }, conta, "import_sheet")
        if (!r.ok) throw new Error(r.erro)
        expect(r.lote.novas.map((c) => c.nome)).toEqual(["Feira"])
        await gravarLote(db, ctx, r.lote)
        const ordem = chamadas.filter((c) => c.op === "upsert").map((c) => c.tabela)
        expect(ordem).toEqual(["categories", "transactions"])
        expect(linhasDoUpsert(chamadas, "transactions")[0][0].category_id).toBe("c-nova")
    })

    it("a prévia lê o histórico da carteira", async () => {
        const { db, chamadas } = clienteFalso(respostas())
        await prepararLote(db, "w1", { itens: lidos, ignoradas: 0 }, conta, "import_statement")
        expect(chamadas).toContainEqual({ tabela: "transactions", op: "select", args: ["description,category_id,date,type,payment_method,payment_credit_card_id"] })
        expect(chamadas).toContainEqual({ tabela: "transactions", op: "limit", args: [1000] })
    })

    it("erro ao criar categoria não grava o lote", async () => {
        const { db, chamadas } = clienteFalso({
            ...respostas(),
            categories: (op: string) => (op === "upsert" ? { data: null, error: { message: "rls" } } : { data: [], error: null }),
        })
        const r = await prepararLote(db, "w1", { itens: lidos, ignoradas: 0 }, conta, "import_sheet")
        if (!r.ok) throw new Error(r.erro)
        expect(await gravarLote(db, ctx, r.lote)).toEqual({ ok: false, erro: "Não foi possível criar as categorias: rls" })
        expect(linhasDoUpsert(chamadas, "transactions")).toHaveLength(0)
    })

    it("desfazer apaga por import_batch_id", async () => {
        const { db, chamadas } = clienteFalso({})
        await desfazerImportacao(db, "w1", "lote-1")
        expect(chamadas).toEqual([
            { tabela: "transactions", op: "delete", args: [] },
            { tabela: "transactions", op: "eq", args: ["workspace_id", "w1"] },
            { tabela: "transactions", op: "eq", args: ["import_batch_id", "lote-1"] },
        ])
    })

    it("o resumo soma com o sinal e acha o período", async () => {
        const { db } = clienteFalso(respostas())
        const r = await prepararLote(db, "w1", { itens: lidos, ignoradas: 0 }, conta, "import_statement")
        if (!r.ok) throw new Error(r.erro)
        expect(resumoDoLote(r.lote.itens)).toEqual({
            total: 2,
            soma: 150,
            periodo: { de: "2026-10-02", ate: "2026-10-05" },
        })
    })

    it("aceita CSV e OFX, sem escolher o modo", () => {
        expect(tipoDoArquivo("a.OFX")).toBe("ofx")
        expect(tipoDoArquivo("a.csv")).toBe("csv")
        expect(tipoDoArquivo("a.pdf")).toBeNull()
    })
})

describe("a vez da leitura", () => {
    it("a resposta de um pedido invalidado (reiniciar, trocar modo) ou superado é descartada", async () => {
        const vez = criarVez()
        const aplicadas: string[] = []
        // A leitura demora; no meio dela o diálogo reinicia.
        let soltar: () => void = () => {}
        const ler = (nome: string) => {
            const n = vez.nova()
            return new Promise<void>((ok) => (soltar = ok)).then(() => {
                if (vez.vale(n)) aplicadas.push(nome)
            })
        }
        const primeira = ler("velha")
        vez.invalidar()
        soltar()
        await primeira
        expect(aplicadas).toEqual([])

        const a = ler("a")
        const soltarA = soltar
        const b = ler("b")
        soltarA()
        soltar()
        await Promise.all([a, b])
        expect(aplicadas).toEqual(["b"])
    })
})

describe("o hook e o diálogo", () => {
    const hook = semComentarios(lerFonte("src/components/transactions/importar/use-importar-extrato.ts"), "tudo")

    it("o lote é preparado uma vez e fica no estado; importar reenvia o mesmo", () => {
        expect(hook).toMatch(/setLote\(\s*r\.lote\s*\)/)
        expect(hook).toContain("gravarLote(supabase, { userId, workspaceId }, loteParaGravar(lote, marcadas, escolhidas))")
        expect(hook).toContain("desfazerImportacao(supabase, workspaceId, lote.batchId)")
        // A resposta da leitura só aterrissa se ainda for a vez dela.
        expect(hook).toMatch(/prepararLote\([^)]*\)\s*if \(!vez\.vale\(n\)\) return/)
        expect(hook).toMatch(/function reiniciar\(\) \{\s*vez\.invalidar\(\)/)
    })

    it("filtro e expandido são estado à parte: não mexem em marcadas nem categorias", () => {
        expect(hook).toMatch(/const \[filtro, setFiltro\] = useState/)
        expect(hook).toMatch(/const \[expandido, setExpandido\] = useState/)
        expect(hook).toContain("filtrarItens(lote.itens, filtro, existentes, escolhidas)")
        expect(hook).toContain("loteParaGravar(lote, marcadas, escolhidas)")
        expect(hook).not.toContain("modo")
    })

    it("as categorias novas da conferência e do fim contam só as marcadas; o fim separa quem já existia", () => {
        expect(hook).toContain("categoriasNovas: loteParaGravar(lote, marcadas, escolhidas).novas")
        expect(hook).toContain("...quemFicouDeFora(lote.itens, marcadas, existentes)")
        // Antes do Continuar, a leitura do CSV deduzido já dá o total e o período do arquivo.
        expect(hook).toMatch(/arquivoLido = useMemo\(/)
    })

    it("as linhas sem data ou valor chegam ao fim; o rótulo diz quantas", () => {
        expect(hook).toContain("ignoradas: lote.ignoradas")
        expect(rotuloDasIgnoradas(1)).toBe("1 linha sem data ou valor ficou de fora")
        expect(rotuloDasIgnoradas(1048)).toBe("1.048 linhas sem data ou valor ficaram de fora")
    })

    it("o já existe que não deu para conferir fica marcado no estado, e o lote segue", () => {
        expect(hook).toContain("setExistentes(achados ?? new Map())")
        expect(hook).toContain("setExistentesConferidos(achados !== null)")
        expect(hook).toMatch(/existentesConferidos,/)
    })

    it("lote sem nenhuma linha legível não chega à conferência nem consulta o banco", () => {
        expect(hook).toMatch(
            /if \(leitura\.itens\.length === 0\) \{[\s\S]*?"Nenhuma linha com data e valor legíveis\. Ajuste as colunas\."[\s\S]*?return\s*\}[\s\S]*?prepararLote\(/,
        )
    })

    it("importar: só o gravar cai no 'não terminou'; um erro ao atualizar a tela depois não", () => {
        const corpo = hook.slice(hook.indexOf("async function importar("), hook.indexOf("async function desfazer("))
        expect(corpo).toMatch(/try \{\s*r = await gravarLote\(/)
        const naoTerminou = corpo.indexOf("A importação não terminou")
        expect(naoTerminou).toBeGreaterThan(-1)
        expect(naoTerminou).toBeLessThan(corpo.indexOf("setFeito("))
        expect(corpo).toMatch(/try \{\s*await invalidateWorkspaceData\([\s\S]*?\} catch \{/)
    })
})

const item = (o: Partial<ItemImportavel> & { clientId: string }): ItemImportavel => ({
    data: "2026-10-02",
    descricao: "Mercado",
    valor: 10,
    estorno: false,
    parcela: null,
    categoryId: null,
    origem: null,
    ...o,
})
const existe: Existente = { id: "t-1", description: "Mercado", date: "2026-10-02T12:00:00Z" }

describe("a conferência", () => {
    it("dedução certa vai do arquivo direto à conferência; incerta passa pelas colunas; OFX vai direto", () => {
        const certa = deduzirMapeamento(
            [
                ["Data", "Descrição", "Valor"],
                ["02/10/2026", "Mercado", "-50,00"],
                ["05/10/2026", "Salário", "200,00"],
            ],
            "conta",
        )
        expect(certa.certa).toBe(true)
        expect(passoDepoisDoArquivo("csv", certa)).toBe("conferir")
        const incerta = deduzirMapeamento(
            [
                ["Data", "Histórico", "Débito", "Crédito"],
                ["02/10/2026", "Mercado", "50,00", ""],
            ],
            "conta",
        )
        expect(incerta.certa).toBe(false)
        expect(passoDepoisDoArquivo("csv", incerta)).toBe("colunas")
        expect(passoDepoisDoArquivo("ofx", null)).toBe("conferir")
    })

    it("marcadas nasce com todos menos os que já existem", () => {
        const itens = [item({ clientId: "a" }), item({ clientId: "b" }), item({ clientId: "c" })]
        expect(marcadasIniciais(itens, new Map([["b", existe]]))).toEqual(new Set(["a", "c"]))
    })

    it("setCategoria em lote troca só os ids pedidos, e null é escolha (sem categoria)", () => {
        const itens = [item({ clientId: "a", categoryId: "c-hist" }), item({ clientId: "b" }), item({ clientId: "c" })]
        let escolhidas = aplicarCategoria(new Map(), ["a", "b"], "c-1")
        expect(itens.map((i) => categoriaEfetiva(i, escolhidas))).toEqual(["c-1", "c-1", null])
        escolhidas = aplicarCategoria(escolhidas, ["a"], null)
        expect(categoriaEfetiva(itens[0], escolhidas)).toBeNull()
        expect(categoriaEfetiva(itens[1], escolhidas)).toBe("c-1")
    })

    it("o resumo conta entram, saídas e entradas só das marcadas, e sem categoria das marcadas", () => {
        const itens = [
            item({ clientId: "a", valor: 50, data: "2026-10-05" }),
            item({ clientId: "b", valor: 30, categoryId: "c-1" }),
            item({ clientId: "c", valor: 200, estorno: true, data: "2026-10-01" }),
            item({ clientId: "d", valor: 999 }),
            // a planilha traz uma categoria que nasce ao importar: não fica sem categoria
            item({ clientId: "e", valor: 5, categoria: "Feira" }),
        ]
        const existentes = new Map([["d", existe]])
        const marcadas = marcadasIniciais(itens, existentes)
        expect(resumoDaConferencia(itens, marcadas, new Map(), existentes)).toEqual({
            total: 5,
            entram: 4,
            saidas: 85,
            entradas: 200,
            nSaidas: 3,
            nEntradas: 1,
            existem: 1,
            semCategoria: 2,
            periodo: { de: "2026-10-01", ate: "2026-10-05" },
        })
        marcadas.delete("a")
        const r = resumoDaConferencia(itens, marcadas, aplicarCategoria(new Map(), ["c"], "c-2"), existentes)
        expect(r).toMatchObject({ entram: 3, saidas: 35, entradas: 200, semCategoria: 0 })
    })

    it("quem ficou de fora separa os que já existiam dos desmarcados à mão", () => {
        const itens = [item({ clientId: "a" }), item({ clientId: "b" }), item({ clientId: "c" }), item({ clientId: "d" })]
        const existentes = new Map([
            ["b", existe],
            ["c", existe],
        ])
        // "c" já existia e a pessoa marcou de volta; "a" ela desmarcou.
        const marcadas = new Set(["c", "d"])
        expect(quemFicouDeFora(itens, marcadas, existentes)).toEqual({ jaExistiam: 1, deixadas: 1 })
    })

    it("a categoria da planilha que nasce ao gravar aparece na linha, até a pessoa escolher outra", () => {
        const nova = item({ clientId: "a", categoria: " Feira " })
        const daCarteira = item({ clientId: "b", categoria: "Mercado", categoryId: "c-1" })
        expect(categoriaNovaDe(nova, new Map())).toBe("Feira")
        expect(categoriaNovaDe(daCarteira, new Map())).toBeNull()
        expect(categoriaNovaDe(nova, aplicarCategoria(new Map(), ["a"], null))).toBeNull()
    })

    it("trocar o destino com o CSV lido refaz a dedução na hora, sem apagar a leitura (o diálogo não quica)", () => {
        const fonte = semComentarios(lerFonte("src/components/transactions/importar/use-importar-extrato.ts"), "tudo")
        expect(fonte).toMatch(/function setDestino\(d: DestinoImportacao \| null\) \{[\s\S]*?limparLeitura\(\{ manterCsv: Boolean\(lido\) \}\)[\s\S]*?if \(lido\) aplicarDeducao\(lido, d\)/)
        // As colunas se deduzem já com o arquivo, antes do destino: a linha de colunas não nasce ao escolher o destino.
        expect(fonte).toMatch(/async function deduzir\(f: File \| null, d: DestinoImportacao \| null\) \{\s*if \(!f \|\| tipoDoArquivo\(f\.name\) !== "csv"\) return/)
    })

    it("inverter o sinal refaz a leitura do mesmo arquivo com o sinal ao contrário", () => {
        const fonte = semComentarios(lerFonte("src/components/transactions/importar/use-importar-extrato.ts"), "tudo")
        expect(fonte).toMatch(/function inverterSinal\(\) \{[\s\S]*?negativoEhDespesa: !mapeamento\.negativoEhDespesa[\s\S]*?lerComMapeamento\(linhas, m\)/)
        expect(fonte).toContain("inverterSinal,")
    })

    it("as ações das visíveis dizem quantas, no singular e no plural", () => {
        expect(rotulosDasVisiveis(5)).toEqual({
            categoria: "Pôr categoria em todos os 5",
            fora: "Deixar de fora todos os 5",
            trazer: "Trazer todos os 5",
        })
        expect(rotulosDasVisiveis(1)).toEqual({
            categoria: "Pôr categoria no 1 lançamento",
            fora: "Deixar de fora o 1 lançamento",
            trazer: "Trazer o 1 lançamento",
        })
        expect(rotulosDasVisiveis(1048).categoria).toBe("Pôr categoria em todos os 1.048")
    })

    it("a categoria das visíveis vale só para as do tipo dela; sem categoria vale para todas", () => {
        const itens = [
            item({ clientId: "a" }),
            item({ clientId: "b", estorno: true }),
            item({ clientId: "c" }),
        ]
        const conta = { tipo: "conta" as const, paymentMethod: "pix" as const }
        expect(idsParaCategoria(itens, "expense", conta)).toEqual(["a", "c"])
        expect(idsParaCategoria(itens, "income", conta)).toEqual(["b"])
        expect(idsParaCategoria(itens, null, conta)).toEqual(["a", "b", "c"])
    })

    it("o período em português: mesmo mês, meses e anos diferentes", () => {
        expect(periodoPtBr({ de: "2026-10-01", ate: "2026-10-28" })).toBe("1 a 28 de outubro")
        expect(periodoPtBr({ de: "2026-10-05", ate: "2026-10-05" })).toBe("5 de outubro")
        expect(periodoPtBr({ de: "2026-09-28", ate: "2026-10-03" })).toBe("28 de setembro a 3 de outubro")
        expect(periodoPtBr({ de: "2025-12-30", ate: "2026-01-02" })).toBe("30 de dezembro de 2025 a 2 de janeiro de 2026")
    })

    it("a contagem de cada opção do filtro é o tamanho do que ela mostra", () => {
        const itens = [
            item({ clientId: "a" }),
            item({ clientId: "b", estorno: true, categoryId: "c-1" }),
            item({ clientId: "c", categoryId: "c-1" }),
        ]
        const existentes = new Map([["c", existe]])
        const escolhidas = aplicarCategoria(new Map(), ["a"], "c-9")
        expect(contagemDosFiltros(itens, existentes, escolhidas)).toEqual({
            todos: 3,
            saidas: 2,
            entradas: 1,
            existem: 1,
            "sem-categoria": 0,
            ia: 0,
        })
        // Sem categoria escolhida, a "a" volta a ser sem categoria.
        expect(contagemDosFiltros(itens, existentes, new Map())["sem-categoria"]).toBe(1)
    })

    it("o filtro escolhe as visíveis sem mudar marcadas nem categorias", () => {
        const itens = [
            item({ clientId: "a" }),
            item({ clientId: "b", estorno: true, categoryId: "c-1" }),
            item({ clientId: "c", categoryId: "c-1" }),
        ]
        const existentes = new Map([["c", existe]])
        const escolhidas = aplicarCategoria(new Map(), ["a"], "c-9")
        const ids = (f: Parameters<typeof filtrarItens>[1]) =>
            filtrarItens(itens, f, existentes, escolhidas).map((i) => i.clientId)
        expect(ids("todos")).toEqual(["a", "b", "c"])
        expect(ids("saidas")).toEqual(["a", "c"])
        expect(ids("entradas")).toEqual(["b"])
        expect(ids("existem")).toEqual(["c"])
        expect(ids("sem-categoria")).toEqual([])
        expect(escolhidas).toEqual(new Map([["a", "c-9"]]))
    })

    it("importar envia só as marcadas, com a categoria escolhida, e não cria categoria que ninguém usa", async () => {
        const { db, chamadas } = clienteFalso(respostas())
        const r = await prepararLote(db, "w1", { itens: lidos, ignoradas: 0 }, conta, "import_sheet")
        if (!r.ok) throw new Error(r.erro)
        const [mercado, salario] = r.lote.itens
        // "Feira" é nova; a pessoa trocou a categoria do Mercado, e o Salário ficou de fora.
        expect(categoriaEfetiva(mercado, new Map())).toBeNull()
        const gravar = loteParaGravar(r.lote, new Set([mercado.clientId]), aplicarCategoria(new Map(), [mercado.clientId], "c-x"))
        expect(gravar.batchId).toBe(r.lote.batchId)
        await gravarLote(db, ctx, gravar)
        const [linhas] = linhasDoUpsert(chamadas, "transactions")
        expect(linhas.map((l) => [l.client_id, l.category_id])).toEqual([[mercado.clientId, "c-x"]])
        expect(linhas.some((l) => l.client_id === salario.clientId)).toBe(false)
        expect(linhasDoUpsert(chamadas, "categories")).toHaveLength(0)

        // Sem escolher, a categoria da planilha nasce e o item a usa, com o mesmo client_id.
        const { db: db2, chamadas: ch2 } = clienteFalso(respostas())
        await gravarLote(db2, ctx, loteParaGravar(r.lote, new Set([mercado.clientId]), new Map()))
        expect(linhasDoUpsert(ch2, "categories")[0][0].client_id).toBe(r.lote.novas[0].clientId)
        expect(linhasDoUpsert(ch2, "transactions")[0][0].category_id).toBe("c-nova")
    })
})

describe("a IA na conferência", () => {
    const conta = { tipo: "conta" as const, paymentMethod: "pix" as const }
    const cats = [
        { id: "mercado", name: "Mercado", type: "expense" as const },
        { id: "salario", name: "Salário", type: "income" as const },
    ]

    it("a resposta não pisa na categoria da pessoa, nem na da planilha, nem na que já havia", () => {
        const itens = [
            item({ clientId: "a" }),
            item({ clientId: "b" }),
            item({ clientId: "c", categoryId: "lazer", origem: "regra" }),
            item({ clientId: "d", categoria: "Feira" }),
        ]
        // A pessoa escolheu a "b" enquanto a IA lia.
        const escolhidas = aplicarCategoria(new Map(), ["b"], "lazer")
        const ia = new Map(["a", "b", "c", "d"].map((id) => [id, "mercado"]))
        const depois = comCategoriasDaIA(itens, ia)
        expect(depois.map((i) => categoriaEfetiva(i, escolhidas))).toEqual(["mercado", "lazer", "lazer", null])
        expect(depois.map((i) => origemDaCategoria(i, escolhidas))).toEqual(["ia", "pessoa", "regra", null])
        expect(categoriaNovaDe(depois[3], escolhidas)).toBe("Feira")
    })

    it("contagens.ia conta só as que ainda são da IA, e trocar a categoria tira a linha", () => {
        const itens = comCategoriasDaIA([item({ clientId: "a" }), item({ clientId: "b" }), item({ clientId: "c" })], new Map([
            ["a", "mercado"],
            ["b", "mercado"],
        ]))
        expect(contagemDosFiltros(itens, new Map(), new Map()).ia).toBe(2)
        const escolhidas = aplicarCategoria(new Map(), ["a"], "lazer")
        expect(contagemDosFiltros(itens, new Map(), escolhidas).ia).toBe(1)
        expect(filtrarItens(itens, "ia", new Map(), escolhidas).map((i) => i.clientId)).toEqual(["b"])
    })

    it("a releitura reaplica pela chave, só no tipo da linha nova", () => {
        const antes = [item({ clientId: "a1", descricao: "LOJA" }), item({ clientId: "b1", descricao: "PIX" })]
        const chaves = chavesDasLinhas(antes)
        const guardadas = new Map([
            [chaves[0], "mercado"],
            [chaves[1], "mercado"],
        ])
        // O Inverter: clientIds novos, e o PIX virou entrada.
        const depois = [item({ clientId: "a2", descricao: "LOJA" }), item({ clientId: "b2", descricao: "PIX", estorno: true })]
        expect([...sugestoesPelaChave(depois, guardadas, cats, conta)]).toEqual([["a2", "mercado"]])
    })

    it("402 fica indisponível e mudo; a cota diz a dela; o resto, categorize à mão", () => {
        expect(iaQueFalhou({ ok: false, mensagem: "Sem plano ativo nesta carteira.", semPlano: true }, 0)).toEqual({
            estado: "indisponivel",
            sugeridas: 0,
            ficaram: 0,
            mensagem: null,
        })
        expect(iaQueFalhou({ ok: false, mensagem: "Você usou a IA 30 vezes hoje. Amanhã volta.", esgotada: true }, 3)).toEqual({
            estado: "falhou",
            sugeridas: 0,
            ficaram: 3,
            mensagem: "Você usou a IA 30 vezes hoje. Amanhã volta.",
        })
        expect(iaQueFalhou({ ok: false, mensagem: "Erro" }, 0).mensagem).toBe("A IA não respondeu agora. Categorize à mão.")
    })

    it("a vez atual não abre outra: a leitura no ar continua valendo", () => {
        const vez = criarVez()
        const n = vez.nova()
        expect(vez.atual()).toBe(n)
        expect(vez.vale(n)).toBe(true)
        vez.invalidar()
        expect(vez.vale(n)).toBe(false)
    })

    it("no hook: a resposta velha é descartada, a IA não passa pelas escolhidas, e voltar invalida", () => {
        const fonte = semComentarios(lerFonte("src/components/transactions/importar/use-importar-extrato.ts"), "tudo")
        const corpo = fonte.slice(fonte.indexOf("async function pedirIa("), fonte.indexOf("async function lendo("))
        expect(corpo).toMatch(/await categorizarComIA\([^)]*\)\s*if \(!vez\.vale\(n\)\) return/)
        expect(corpo).not.toContain("setEscolhidas")
        expect(fonte).toMatch(/setPasso\("conferir"\)\s*void pedirIa\(r\.lote, new Map\(\), n\)/)
        expect(fonte).toMatch(/function voltar\(\) \{[\s\S]*?vez\.invalidar\(\)/)
        // Toda leitura começa com a IA ociosa: a releitura que falha ou vem vazia não fica em "lendo".
        expect(fonte).toMatch(/async function lendo\([^)]*\)[^{]*\{\s*const n = vez\.nova\(\)[\s\S]*?setIa\(IA_OCIOSA\)[\s\S]*?await passoDaLeitura\(n\)/)
        // Importar fecha a vez antes de gravar.
        const importar = fonte.slice(fonte.indexOf("async function importar("), fonte.indexOf("async function desfazer("))
        expect(importar.indexOf("vez.invalidar()")).toBeGreaterThan(-1)
        expect(importar.indexOf("vez.invalidar()")).toBeLessThan(importar.indexOf("gravarLote("))
        // Tentar de novo só depois de uma falha.
        expect(fonte).toMatch(/tentarIaDeNovo: \(\) => \{\s*if \(lote && ia\.estado === "falhou"\)/)
        expect(fonte).toMatch(/function limparLeitura[\s\S]*?setIa\(IA_OCIOSA\)\s*iaPorChave\.current = new Map\(\)/)
    })
})
