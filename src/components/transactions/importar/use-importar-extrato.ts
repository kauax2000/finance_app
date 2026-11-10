"use client"

import type { SupabaseClient } from "@supabase/supabase-js"
import { useQueryClient } from "@tanstack/react-query"
import { useMemo, useRef, useState } from "react"

import { useAuth } from "@/components/providers"
import { categorizarComIA, type Lido } from "@/lib/ia/ler"
import { aplicarSugestoes, pedidoDaIA } from "@/lib/import/categorizar"
import { numberBR } from "@/lib/formatters"
import { type Deducao, deduzirMapeamento, lerCsv, mapearCsv } from "@/lib/import/csv"
import {
    buscarJaExistentes,
    categoriasQueFaltam,
    comCategoriaDaPlanilha,
    desfazerImportacao,
    type DestinoImportacao,
    type Existente,
    importarLancamentos,
    type ItemImportavel,
    type OrigemDaCategoria,
    prepararItens,
    tipoDoItem,
} from "@/lib/import/importar"
import type { LinhaHistorico } from "@/lib/captura/frase"
import { normalizarDescricao } from "@/lib/import/normalizar"
import { lerOfx } from "@/lib/import/ofx"
import type { ItemBanco } from "@/lib/import/tipos"
import { invalidateWorkspaceData } from "@/lib/queries/invalidate-workspace-data"
import { supabase } from "@/lib/supabase"
import { toastSuccess } from "@/lib/toast"

import { chavesDasLinhas } from "./chave-da-linha"

export type PassoImportacao = "arquivo" | "colunas" | "conferir" | "feito"

type Categoria = { id: string; name: string; type: "income" | "expense"; color?: string | null; icon?: string | null }
export type SourceImportacao = "import_statement" | "import_sheet"
export type FiltroConferencia = "todos" | "saidas" | "entradas" | "existem" | "sem-categoria" | "ia"
/** A categoria que a pessoa escolheu por item (`null`: sem categoria, de propósito). */
export type CategoriasEscolhidas = Map<string, string | null>
export type CategoriaNova = { nome: string; tipo: "income" | "expense"; clientId: string }
/** A IA da conferência: `ficaram` são as linhas além do teto, que ficam para a pessoa. */
export type IaDaConferencia = {
    estado: "ocioso" | "lendo" | "pronto" | "falhou" | "indisponivel"
    sugeridas: number
    ficaram: number
    mensagem: string | null
}
export const IA_OCIOSA: IaDaConferencia = { estado: "ocioso", sugeridas: 0, ficaram: 0, mensagem: null }
export const FALHA_DA_IA = "A IA não respondeu agora. Categorize à mão."

/** A coluna de cada papel do CSV (`categoria` null: o arquivo não traz). */
export type MapeamentoColunas = {
    data: number
    descricao: number
    valor: number
    categoria: number | null
    temCabecalho: boolean
    negativoEhDespesa: boolean
}

/** O lote preparado uma vez: repetir "Importar" reenvia os mesmos `client_id` e não duplica (Foco 3). */
export type LoteImportacao = {
    itens: ItemImportavel[]
    categorias: Categoria[]
    novas: CategoriaNova[]
    ignoradas: number
    destino: DestinoImportacao
    source: SourceImportacao
    batchId: string
}

/** OFX é extrato; o CSV é a planilha da pessoa só quando traz a coluna de categoria. */
export const sourceDoArquivo = (tipo: "csv" | "ofx", categoria: number | null): SourceImportacao =>
    tipo === "csv" && categoria != null ? "import_sheet" : "import_statement"

/** `null` recusa o arquivo. */
export function tipoDoArquivo(nome: string): "csv" | "ofx" | null {
    const ext = nome.toLowerCase().split(".").pop()
    return ext === "csv" || ext === "ofx" ? ext : null
}

/** O passo Colunas só aparece quando a dedução do CSV não achou os papéis. */
export const passoDepoisDoArquivo = (tipo: "csv" | "ofx", deducao: Deducao | null): "colunas" | "conferir" =>
    tipo === "ofx" || deducao?.certa ? "conferir" : "colunas"

export const mapeamentoDa = (d: Deducao): MapeamentoColunas => ({
    ...d.mapa,
    temCabecalho: d.temCabecalho,
    negativoEhDespesa: d.negativoEhDespesa,
})

const mesmoMapeamento = (a: MapeamentoColunas, b: MapeamentoColunas) =>
    (Object.keys(a) as (keyof MapeamentoColunas)[]).every((k) => a[k] === b[k])

/** Entram todos, menos os que já estão na carteira. */
export const marcadasIniciais = (itens: ItemImportavel[], existentes: Map<string, Existente>) =>
    new Set(itens.filter((i) => !existentes.has(i.clientId)).map((i) => i.clientId))

export function aplicarCategoria(escolhidas: CategoriasEscolhidas, ids: string[], categoryId: string | null) {
    const nova = new Map(escolhidas)
    for (const id of ids) nova.set(id, categoryId)
    return nova
}

export const categoriaEfetiva = (i: ItemImportavel, escolhidas: CategoriasEscolhidas) =>
    escolhidas.has(i.clientId) ? (escolhidas.get(i.clientId) ?? null) : i.categoryId

/** Sem escolha, o nome da planilha sem categoria na carteira vira a categoria nova ao gravar. */
const ganhaCategoriaNova = (i: ItemImportavel, escolhidas: CategoriasEscolhidas) =>
    !escolhidas.has(i.clientId) && i.categoryId == null && !!i.categoria && !!normalizarDescricao(i.categoria)

/** O nome da planilha que vira categoria nova ao gravar; `null` nos outros (e depois de uma escolha). */
export const categoriaNovaDe = (i: ItemImportavel, escolhidas: CategoriasEscolhidas) =>
    ganhaCategoriaNova(i, escolhidas) ? (i.categoria ?? "").trim() : null

/** Os de fora: os que já estavam na carteira e os que a pessoa desmarcou à mão. */
export function quemFicouDeFora(itens: ItemImportavel[], marcadas: Set<string>, existentes: Map<string, Existente>) {
    const fora = itens.filter((i) => !marcadas.has(i.clientId))
    const jaExistiam = fora.filter((i) => existentes.has(i.clientId)).length
    return { jaExistiam, deixadas: fora.length - jaExistiam }
}

const semCategoria = (i: ItemImportavel, escolhidas: CategoriasEscolhidas) =>
    categoriaEfetiva(i, escolhidas) == null && !ganhaCategoriaNova(i, escolhidas)

/** De onde veio a categoria da linha: a escolha da pessoa vence (e escolher "sem categoria" é `null`). */
export const origemDaCategoria = (i: ItemImportavel, escolhidas: CategoriasEscolhidas): OrigemDaCategoria | null =>
    escolhidas.has(i.clientId) ? (escolhidas.get(i.clientId) == null ? null : "pessoa") : i.origem

/** As categorias que a IA usou nas linhas dadas, da mais usada para a menos (empate: id, pt-BR; o nome mora fora). */
export function porCategoriaDaIa(
    itens: ItemImportavel[],
    origemDe: (clientId: string) => OrigemDaCategoria | null,
    categoriaDe: (clientId: string) => string | null
): { categoryId: string; n: number }[] {
    const n = new Map<string, number>()
    for (const i of itens) {
        const c = origemDe(i.clientId) === "ia" ? categoriaDe(i.clientId) : null
        if (c != null) n.set(c, (n.get(c) ?? 0) + 1)
    }
    return [...n].map(([categoryId, n]) => ({ categoryId, n })).sort((a, b) => b.n - a.n || a.categoryId.localeCompare(b.categoryId, "pt-BR"))
}

/** Desfazer a IA: as linhas dadas que ainda são dela viram "Sem categoria" (`null`); devolve também quais foram. */
export function escolhidasSemIa(itens: ItemImportavel[], escolhidas: CategoriasEscolhidas, clientIds: string[]) {
    const dadas = new Set(clientIds)
    const ids = itens.filter((i) => dadas.has(i.clientId) && origemDaCategoria(i, escolhidas) === "ia").map((i) => i.clientId)
    return { ids, escolhidas: aplicarCategoria(escolhidas, ids, null) }
}

/** A volta: apaga a escolha `null` dessas linhas (a IA reaparece); a que a pessoa trocou depois fica. */
export function escolhidasDevolvidas(escolhidas: CategoriasEscolhidas, ids: string[]) {
    const nova = new Map(escolhidas)
    for (const id of ids) if (nova.has(id) && nova.get(id) == null) nova.delete(id)
    return nova
}

/**
 * A categoria da IA nas linhas que ainda não têm nenhuma, com origem "ia". A linha da planilha cuja
 * categoria nasce ao gravar fica com a dela; a escolha da pessoa vence pela `categoriaEfetiva`.
 */
export const comCategoriasDaIA = (itens: ItemImportavel[], porId: Map<string, string>): ItemImportavel[] =>
    itens.map((i) => {
        const c = porId.get(i.clientId)
        return c && i.categoryId == null && !normalizarDescricao(i.categoria ?? "")
            ? { ...i, categoryId: c, origem: "ia" as const }
            : i
    })

/** As sugestões de uma leitura anterior na leitura nova, pela chave estável da linha e só no tipo dela (o Inverter o troca). */
export function sugestoesPelaChave(
    itens: ItemImportavel[],
    guardadas: Map<string, string>,
    categorias: Categoria[],
    destino: DestinoImportacao,
): Map<string, string> {
    const tipoDe = new Map(categorias.map((c) => [c.id, c.type]))
    const chaves = chavesDasLinhas(itens)
    const out = new Map<string, string>()
    itens.forEach((i, k) => {
        const c = guardadas.get(chaves[k])
        if (c && tipoDe.get(c) === tipoDoItem(i, destino)) out.set(i.clientId, c)
    })
    return out
}

/** A falha da IA na faixa: sem plano não diz nada; toda falha diz a sua; sem texto, o "categorize à mão". */
export function iaQueFalhou(r: Extract<Lido<unknown>, { ok: false }>, ficaram: number): IaDaConferencia {
    if (r.semPlano) return { estado: "indisponivel", sugeridas: 0, ficaram, mensagem: null }
    return { estado: "falhou", sugeridas: 0, ficaram, mensagem: r.mensagem || FALHA_DA_IA }
}

/** Saídas e entradas são valores positivos, só das marcadas; o período é o do arquivo. */
export function resumoDaConferencia(
    itens: ItemImportavel[],
    marcadas: Set<string>,
    escolhidas: CategoriasEscolhidas,
    existentes: Map<string, Existente>,
) {
    const entram = itens.filter((i) => marcadas.has(i.clientId))
    const soma = (lista: ItemImportavel[]) => lista.reduce((s, i) => s + i.valor, 0)
    return {
        total: itens.length,
        entram: entram.length,
        saidas: soma(entram.filter((i) => !i.estorno)),
        entradas: soma(entram.filter((i) => i.estorno)),
        nSaidas: entram.filter((i) => !i.estorno).length,
        nEntradas: entram.filter((i) => i.estorno).length,
        existem: existentes.size,
        semCategoria: entram.filter((i) => semCategoria(i, escolhidas)).length,
        periodo: resumoDoLote(itens).periodo,
    }
}

/** Os rótulos das ações em massa: valem para as linhas à vista (filtro e busca), e dizem quantas. */
export function rotulosDasVisiveis(n: number) {
    const um = n === 1
    const q = numberBR(n)
    return {
        categoria: um ? "Pôr categoria no 1 lançamento" : `Pôr categoria em todos os ${q}`,
        fora: um ? "Deixar de fora o 1 lançamento" : `Deixar de fora todos os ${q}`,
        trazer: um ? "Trazer o 1 lançamento" : `Trazer todos os ${q}`,
    }
}

/** As linhas que a leitura deixou de fora (sem data ou valor legíveis). */
export const rotuloDasIgnoradas = (n: number) =>
    n === 1 ? "1 linha sem data ou valor ficou de fora" : `${numberBR(n)} linhas sem data ou valor ficaram de fora`

/** A categoria escolhida vale para as do tipo dela (o estorno do cartão é despesa); `null` (sem categoria), para todas. */
export const idsParaCategoria = (
    itens: ItemImportavel[],
    tipo: "income" | "expense" | null,
    destino: DestinoImportacao,
) => itens.filter((i) => tipo == null || tipoDoItem(i, destino) === tipo).map((i) => i.clientId)

export function filtrarItens(
    itens: ItemImportavel[],
    filtro: FiltroConferencia,
    existentes: Map<string, Existente>,
    escolhidas: CategoriasEscolhidas,
) {
    if (filtro === "todos") return itens
    return itens.filter((i) =>
        filtro === "saidas"
            ? !i.estorno
            : filtro === "entradas"
              ? i.estorno
              : filtro === "existem"
                ? existentes.has(i.clientId)
                : filtro === "ia"
                  ? origemDaCategoria(i, escolhidas) === "ia"
                  : semCategoria(i, escolhidas),
    )
}

/** Quantas linhas cada opção do filtro mostra: o número que o filtro traz no rótulo. */
export function contagemDosFiltros(
    itens: ItemImportavel[],
    existentes: Map<string, Existente>,
    escolhidas: CategoriasEscolhidas,
): Record<FiltroConferencia, number> {
    const n = (f: FiltroConferencia) => filtrarItens(itens, f, existentes, escolhidas).length
    return {
        todos: itens.length,
        saidas: n("saidas"),
        entradas: n("entradas"),
        existem: n("existem"),
        "sem-categoria": n("sem-categoria"),
        ia: n("ia"),
    }
}

/**
 * O lote que vai ao banco: só as marcadas, com a categoria escolhida (sem o nome da
 * planilha, que a trocaria), e só as categorias novas que alguém ainda usa. Os
 * `client_id` e o `batchId` são os do lote: repetir não duplica.
 */
export function loteParaGravar(
    lote: LoteImportacao,
    marcadas: Set<string>,
    escolhidas: CategoriasEscolhidas,
): LoteImportacao {
    const itens = lote.itens
        .filter((i) => marcadas.has(i.clientId))
        .map((i) => {
            if (!escolhidas.has(i.clientId)) return i
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { categoria, ...resto } = i
            return { ...resto, categoryId: escolhidas.get(i.clientId) ?? null }
        })
    const usadas = new Set(
        categoriasQueFaltam(itens, lote.categorias, lote.destino).map((c) => `${c.tipo}:${normalizarDescricao(c.nome)}`),
    )
    return { ...lote, itens, novas: lote.novas.filter((c) => usadas.has(`${c.tipo}:${normalizarDescricao(c.nome)}`)) }
}

/**
 * Lê o histórico (a categoria pelo histórico) e as categorias da carteira, e
 * prepara o lote: o `client_id` de cada item e de cada categoria nova nasce aqui.
 */
export async function prepararLote(
    db: SupabaseClient,
    workspaceId: string,
    leitura: { itens: ItemBanco[]; ignoradas: number },
    destino: DestinoImportacao,
    source: SourceImportacao,
): Promise<{ ok: true; lote: LoteImportacao } | { ok: false; erro: string }> {
    const [historico, cats] = await Promise.all([
        db
            .from("transactions")
            .select("description,category_id,date,type,payment_method,payment_credit_card_id")
            .eq("workspace_id", workspaceId)
            .not("category_id", "is", null)
            .order("date", { ascending: false })
            .limit(1000),
        db.from("categories").select("id,name,type,color,icon").eq("workspace_id", workspaceId),
    ])
    if (historico.error || cats.error) return { ok: false, erro: "Não foi possível ler as categorias. Tente de novo." }
    const categorias = (cats.data ?? []) as Categoria[]
    // A categoria da planilha já aparece na conferência; a que ainda não existe fica vazia até nascer ao gravar.
    const itens = comCategoriaDaPlanilha(
        prepararItens(leitura.itens, (historico.data ?? []) as LinhaHistorico[], categorias, destino),
        categorias,
        destino,
    ).map((i) =>
        categoriasQueFaltam([i], categorias, destino).length > 0 ? { ...i, categoryId: null, origem: null } : i,
    )
    return {
        ok: true,
        lote: {
            itens,
            categorias,
            novas: categoriasQueFaltam(leitura.itens, categorias, destino).map((c) => ({
                ...c,
                clientId: crypto.randomUUID(),
            })),
            ignoradas: leitura.ignoradas,
            destino,
            source,
            batchId: crypto.randomUUID(),
        },
    }
}

/** As categorias que faltam nascem primeiro, com o `client_id` guardado; depois o lote. */
export async function gravarLote(
    db: SupabaseClient,
    ctx: { userId: string; workspaceId: string },
    lote: LoteImportacao,
): Promise<{ ok: true; quantidade: number } | { ok: false; erro: string }> {
    let criadas: Categoria[] = []
    if (lote.novas.length > 0) {
        const { data, error } = await db
            .from("categories")
            .upsert(
                lote.novas.map((c) => ({
                    user_id: ctx.userId,
                    workspace_id: ctx.workspaceId,
                    name: c.nome,
                    type: c.tipo,
                    client_id: c.clientId,
                })),
                { onConflict: "workspace_id,client_id" },
            )
            .select("id,name,type")
        if (error) return { ok: false, erro: `Não foi possível criar as categorias: ${error.message}` }
        criadas = (data ?? []) as Categoria[]
    }
    const r = await importarLancamentos(
        db,
        ctx,
        comCategoriaDaPlanilha(lote.itens, [...lote.categorias, ...criadas], lote.destino),
        lote.destino,
        lote.source,
        lote.batchId,
    )
    if (!r.ok) return { ok: false, erro: `${r.erro} Tente de novo: nada se duplica.` }
    return { ok: true, quantidade: r.inseridos }
}

/** Total, soma (o estorno entra, o resto sai) e o período do lote. */
export function resumoDoLote(itens: ItemImportavel[]) {
    const datas = itens.map((i) => i.data).sort()
    return {
        total: itens.length,
        soma: itens.reduce((s, i) => s + (i.estorno ? i.valor : -i.valor), 0),
        periodo: datas.length ? { de: datas[0], ate: datas[datas.length - 1] } : null,
    }
}

const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"]

/** "1 a 28 de outubro"; com meses ou anos diferentes, cada ponta diz o seu. */
export function periodoPtBr({ de, ate }: { de: string; ate: string }) {
    const partes = (ymd: string) => {
        const [a, m, d] = ymd.slice(0, 10).split("-").map(Number)
        return { a, mes: MESES[m - 1], d }
    }
    const x = partes(de)
    const y = partes(ate)
    if (de.slice(0, 10) === ate.slice(0, 10)) return `${y.d} de ${y.mes}`
    if (x.a !== y.a) return `${x.d} de ${x.mes} de ${x.a} a ${y.d} de ${y.mes} de ${y.a}`
    if (x.mes !== y.mes) return `${x.d} de ${x.mes} a ${y.d} de ${y.mes}`
    return `${x.d} a ${y.d} de ${y.mes}`
}

/**
 * A vez de cada leitura: `nova()` marca um pedido, `invalidar()` (reiniciar,
 * trocar arquivo ou destino) descarta os que estão no ar, e `vale(n)` diz se a
 * resposta do pedido `n` ainda é a mais recente.
 */
export function criarVez() {
    let atual = 0
    return {
        nova: () => ++atual,
        /** A vez de agora, sem abrir outra: um pedido paralelo (a IA) morre com a próxima leitura. */
        atual: () => atual,
        invalidar: () => {
            atual++
        },
        vale: (n: number) => n === atual,
    }
}

const MAPEAMENTO_INICIAL: MapeamentoColunas = {
    data: 0,
    descricao: 1,
    valor: 2,
    categoria: null,
    temCabecalho: true,
    negativoEhDespesa: true,
}

/**
 * Extrato do banco (CSV ou OFX) ou a planilha da pessoa (CSV com categoria) num
 * cartão ou numa conta, em passos: arquivo, colunas (só quando a dedução do CSV
 * falha, ou a pessoa pede Ajustar), conferir e feito. O lote é preparado uma vez
 * e fica no estado; a conferência decide o que entra e com que categoria.
 */
export function useImportarExtrato({ workspaceId }: { workspaceId: string | null }) {
    const queryClient = useQueryClient()
    const userId = useAuth().user?.id ?? null
    const [passo, setPasso] = useState<PassoImportacao>("arquivo")
    const [destino, setDestinoEstado] = useState<DestinoImportacao | null>(null)
    const [arquivo, setArquivo] = useState<File | null>(null)
    const [csv, setCsv] = useState<string[][] | null>(null)
    const [deducao, setDeducao] = useState<Deducao | null>(null)
    const [mapeamento, setMapeamento] = useState<MapeamentoColunas>(MAPEAMENTO_INICIAL)
    const [lote, setLote] = useState<LoteImportacao | null>(null)
    const [existentes, setExistentes] = useState<Map<string, Existente>>(() => new Map())
    // `false`: a consulta do "já existe" falhou ou passou do teto; a conferência avisa.
    const [existentesConferidos, setExistentesConferidos] = useState(true)
    const [marcadas, setMarcadas] = useState<Set<string>>(() => new Set())
    const [escolhidas, setEscolhidas] = useState<CategoriasEscolhidas>(() => new Map())
    const [filtro, setFiltro] = useState<FiltroConferencia>("todos")
    const [expandido, setExpandido] = useState(false)
    const [feito, setFeito] = useState<{
        importados: number
        jaExistiam: number
        deixadas: number
        semCategoria: number
        ignoradas: number
    } | null>(null)
    const [pendente, setPendente] = useState<"lendo" | "importar" | "desfazer" | null>(null)
    const [erro, setErro] = useState<string | null>(null)
    const [ia, setIa] = useState<IaDaConferencia>(IA_OCIOSA)
    const vez = useRef(criarVez()).current
    // As sugestões da IA pela chave da linha: a releitura do mesmo arquivo (Inverter, Ajustar) as reaplica.
    const iaPorChave = useRef(new Map<string, string>())
    // O mapeamento ao pedir Ajustar: confirmar sem mudar volta à mesma conferência.
    const ajustando = useRef<MapeamentoColunas | null>(null)

    function limparLeitura({ manterCsv = false }: { manterCsv?: boolean } = {}) {
        // A leitura no ar não aterrissa num estado que mudou.
        vez.invalidar()
        ajustando.current = null
        if (!manterCsv) {
            setCsv(null)
            setDeducao(null)
        }
        setLote(null)
        setExistentes(new Map())
        setExistentesConferidos(true)
        setMarcadas(new Set())
        setEscolhidas(new Map())
        setFiltro("todos")
        setExpandido(false)
        setFeito(null)
        setErro(null)
        setIa(IA_OCIOSA)
        iaPorChave.current = new Map()
    }

    // Sem destino ainda, as colunas já se deduzem (o sinal pela conta) e o sinal se refaz quando ele chega.
    function aplicarDeducao(linhas: string[][], d: DestinoImportacao | null) {
        const ded = deduzirMapeamento(linhas, d?.tipo ?? "conta")
        const m = mapeamentoDa(ded)
        setCsv(linhas)
        setDeducao(ded)
        setMapeamento(m)
        return { ded, m }
    }

    /** Com arquivo CSV e destino, a dedução já aparece no passo Arquivo; o sinal depende do destino. */
    async function deduzir(f: File | null, d: DestinoImportacao | null) {
        if (!f || tipoDoArquivo(f.name) !== "csv") return
        const n = vez.nova()
        try {
            const linhas = lerCsv(await f.text())
            if (vez.vale(n)) aplicarDeducao(linhas, d)
        } catch {
            // Só a prévia da dedução: o Continuar relê o arquivo e mostra o erro.
        }
    }

    function setDestino(d: DestinoImportacao | null) {
        // Com o CSV já lido, a dedução se refaz na hora, sem apagar a linha "Colunas reconhecidas"
        // entre uma e outra: apagar e reler fazia o diálogo encolher e crescer (o quique).
        const lido = csv
        limparLeitura({ manterCsv: Boolean(lido) })
        setDestinoEstado(d)
        if (lido) aplicarDeducao(lido, d)
        else void deduzir(arquivo, d)
    }

    function escolherArquivo(f: File | null) {
        limparLeitura()
        if (f && !tipoDoArquivo(f.name)) {
            setArquivo(null)
            setErro("Use um arquivo .csv ou .ofx.")
            return
        }
        setArquivo(f)
        void deduzir(f, destino)
    }

    /** `n`: a vez do pedido; a resposta de um pedido velho é descartada. */
    async function preparar(n: number, leitura: { itens: ItemBanco[]; ignoradas: number }, source: SourceImportacao) {
        if (!workspaceId || !destino) return
        // Mapeamento errado ou arquivo só com cabeçalho: nada a conferir.
        if (leitura.itens.length === 0) {
            const deCsv = tipoDoArquivo(arquivo?.name ?? "") === "csv"
            // O OFX não tem colunas a ajustar: fica no Arquivo.
            setErro(deCsv ? "Nenhuma linha com data e valor legíveis. Ajuste as colunas." : "Nenhum lançamento legível neste arquivo.")
            if (deCsv) setPasso("colunas")
            return
        }
        const r = await prepararLote(supabase, workspaceId, leitura, destino, source)
        if (!vez.vale(n)) return
        if (!r.ok) {
            setErro(r.erro)
            return
        }
        const achados = await buscarJaExistentes(supabase, workspaceId, destino, r.lote.itens)
        if (!vez.vale(n)) return
        ajustando.current = null
        r.lote.itens = comCategoriasDaIA(
            r.lote.itens,
            sugestoesPelaChave(r.lote.itens, iaPorChave.current, r.lote.categorias, destino),
        )
        setLote(r.lote)
        setExistentes(achados ?? new Map())
        setExistentesConferidos(achados !== null)
        setMarcadas(marcadasIniciais(r.lote.itens, achados ?? new Map()))
        setEscolhidas(new Map())
        setFiltro("todos")
        setExpandido(false)
        setPasso("conferir")
        void pedirIa(r.lote, new Map(), n)
    }

    /**
     * Uma chamada por lote, com as linhas que ainda estão sem categoria. A resposta só
     * aterrissa na mesma vez (reiniciar, trocar arquivo, reler ou voltar a invalidam) e não
     * passa pelas escolhidas: a origem fica "ia", e a escolha da pessoa continua vencendo.
     */
    async function pedirIa(l: LoteImportacao, esc: CategoriasEscolhidas, n: number) {
        if (!workspaceId) return
        const daLinha = new Map(l.itens.map((i) => [i.clientId, i]))
        // Escolher "sem categoria" também é escolha: a linha não vai.
        const pedido = pedidoDaIA(
            l.itens,
            (id) => (esc.has(id) ? "pessoa" : (daLinha.get(id)?.categoryId ?? null)),
            l.categorias,
            l.destino,
        )
        const jaSugeridas = l.itens.filter((i) => i.origem === "ia").length
        if (pedido.itens.length === 0) {
            setIa(jaSugeridas ? { estado: "pronto", sugeridas: jaSugeridas, ficaram: 0, mensagem: null } : IA_OCIOSA)
            return
        }
        setIa({ estado: "lendo", sugeridas: 0, ficaram: pedido.ficaram, mensagem: null })
        const r = await categorizarComIA(workspaceId, pedido.itens, pedido.categorias)
        if (!vez.vale(n)) return
        if (!r.ok) {
            setIa(iaQueFalhou(r, pedido.ficaram))
            return
        }
        const porId = aplicarSugestoes(r.sugestoes, pedido, l.categorias)
        const chaves = chavesDasLinhas(l.itens)
        l.itens.forEach((i, k) => {
            const c = porId.get(i.clientId)
            if (c) iaPorChave.current.set(chaves[k], c)
        })
        const itens = comCategoriasDaIA(l.itens, porId)
        setLote({ ...l, itens })
        setIa({
            estado: "pronto",
            sugeridas: itens.filter((i) => i.origem === "ia").length,
            ficaram: pedido.ficaram,
            mensagem: null,
        })
    }

    /** Roda uma leitura com a trava `lendo`; erro lançado vira o `erro` do passo. */
    async function lendo(passoDaLeitura: (n: number) => Promise<void>) {
        const n = vez.nova()
        setPendente("lendo")
        setErro(null)
        // A IA da leitura anterior morreu com a vez; quem diz o estado novo é o `pedirIa` da leitura nova.
        setIa(IA_OCIOSA)
        try {
            await passoDaLeitura(n)
        } catch {
            if (vez.vale(n)) setErro("Não foi possível ler o arquivo. Tente de novo.")
        } finally {
            if (vez.vale(n)) setPendente(null)
        }
    }

    const lerComMapeamento = (linhas: string[][], m: MapeamentoColunas) =>
        mapearCsv(
            linhas,
            { data: m.data, descricao: m.descricao, valor: m.valor, categoria: m.categoria ?? undefined },
            { temCabecalho: m.temCabecalho, negativoEhDespesa: m.negativoEhDespesa },
        )

    /** Do arquivo: OFX e CSV deduzido vão direto à conferência; CSV incerto vai às colunas. */
    function continuar() {
        const f = arquivo
        const d = destino
        if (!f || !d) return Promise.resolve()
        return lendo(async (n) => {
            const tipo = tipoDoArquivo(f.name)
            const texto = await f.text()
            if (!vez.vale(n)) return
            if (tipo === "csv") {
                const linhas = lerCsv(texto)
                const { ded, m } = aplicarDeducao(linhas, d)
                if (passoDepoisDoArquivo("csv", ded) === "colunas") setPasso("colunas")
                else await preparar(n, lerComMapeamento(linhas, m), sourceDoArquivo("csv", m.categoria))
            } else if (tipo === "ofx") {
                await preparar(n, lerOfx(texto, d.tipo), "import_statement")
            }
        })
    }

    /** Da conferência às colunas, com o mesmo arquivo. */
    function ajustarColunas() {
        if (!csv) return
        ajustando.current = mapeamento
        setErro(null)
        setPasso("colunas")
    }

    /** Um toque na conferência: o arquivo vem com o sinal ao contrário do destino, e a leitura se refaz. */
    function inverterSinal() {
        const linhas = csv
        if (!linhas) return Promise.resolve()
        const m = { ...mapeamento, negativoEhDespesa: !mapeamento.negativoEhDespesa }
        setMapeamento(m)
        return lendo((n) => preparar(n, lerComMapeamento(linhas, m), sourceDoArquivo("csv", m.categoria)))
    }

    function lerColunas() {
        const linhas = csv
        if (!linhas) return Promise.resolve()
        const m = mapeamento
        if (lote && ajustando.current && mesmoMapeamento(ajustando.current, m)) {
            setPasso("conferir")
            return Promise.resolve()
        }
        if (m.data < 0 || m.descricao < 0 || m.valor < 0) {
            setErro("Escolha a coluna da data, da descrição e do valor.")
            return Promise.resolve()
        }
        return lendo((n) => preparar(n, lerComMapeamento(linhas, m), sourceDoArquivo("csv", m.categoria)))
    }

    function voltar() {
        setErro(null)
        if (passo === "conferir" && ia.estado === "lendo") {
            vez.invalidar()
            setIa(IA_OCIOSA)
        }
        if (passo === "conferir") setPasso(csv && !deducao?.certa ? "colunas" : "arquivo")
        else if (passo === "colunas") setPasso(lote && ajustando.current ? "conferir" : "arquivo")
    }

    // O CSV deduzido já se lê no passo Arquivo: o total e o período aparecem no item do arquivo.
    const arquivoLido = useMemo(() => {
        if (!csv || !deducao?.certa) return null
        try {
            const { itens } = mapearCsv(
                csv,
                { data: mapeamento.data, descricao: mapeamento.descricao, valor: mapeamento.valor },
                { temCabecalho: mapeamento.temCabecalho, negativoEhDespesa: mapeamento.negativoEhDespesa },
            )
            const datas = itens.map((i) => i.data).sort()
            return { total: itens.length, periodo: datas.length ? { de: datas[0], ate: datas[datas.length - 1] } : null }
        } catch {
            return null
        }
    }, [csv, deducao, mapeamento])

    const resumo = lote
        ? resumoDaConferencia(lote.itens, marcadas, escolhidas, existentes)
        : { total: 0, entram: 0, saidas: 0, entradas: 0, nSaidas: 0, nEntradas: 0, existem: 0, semCategoria: 0, periodo: null }

    async function importar(): Promise<{ quantidade: number; loteId: string } | null> {
        if (!lote || !workspaceId || resumo.entram === 0) return null
        if (!userId) {
            setErro("Sua sessão não carregou. Recarregue a página e tente de novo.")
            return null
        }
        // Uma resposta da IA que chegue depois não reescreve o lote que foi gravado.
        vez.invalidar()
        setIa(IA_OCIOSA)
        setPendente("importar")
        setErro(null)
        let r: Awaited<ReturnType<typeof gravarLote>>
        try {
            r = await gravarLote(supabase, { userId, workspaceId }, loteParaGravar(lote, marcadas, escolhidas))
        } catch {
            setErro("A importação não terminou. Tente de novo: nada se duplica.")
            return null
        } finally {
            setPendente(null)
        }
        if (!r.ok) {
            setErro(r.erro)
            return null
        }
        setFeito({
            importados: r.quantidade,
            ...quemFicouDeFora(lote.itens, marcadas, existentes),
            semCategoria: resumo.semCategoria,
            ignoradas: lote.ignoradas,
        })
        setPasso("feito")
        try {
            await invalidateWorkspaceData(queryClient, workspaceId, {
                domains: ["transactions", "categories", "credit_card_expense_rows"],
            })
        } catch {
            // Gravou: uma falha ao atualizar as listas não desdiz o lote gravado.
        }
        return { quantidade: r.quantidade, loteId: lote.batchId }
    }

    /** Apaga o lote por `import_batch_id` e volta ao primeiro passo. `false`: deu erro. */
    async function desfazer(): Promise<boolean> {
        if (!lote || !workspaceId) return false
        setPendente("desfazer")
        setErro(null)
        try {
            const r = await desfazerImportacao(supabase, workspaceId, lote.batchId)
            if (!r.ok) {
                setErro(r.erro ?? "Não foi possível desfazer a importação.")
                return false
            }
            setArquivo(null)
            limparLeitura()
            setPasso("arquivo")
            toastSuccess("Importação desfeita.")
            await invalidateWorkspaceData(queryClient, workspaceId, {
                domains: ["transactions", "credit_card_expense_rows"],
            })
            return true
        } catch {
            setErro("Não foi possível desfazer a importação. Tente de novo.")
            return false
        } finally {
            setPendente(null)
        }
    }

    function reiniciar() {
        vez.invalidar()
        setPasso("arquivo")
        setDestinoEstado(null)
        setArquivo(null)
        setMapeamento(MAPEAMENTO_INICIAL)
        setPendente(null)
        limparLeitura()
    }

    function marcarVarias(ids: string[], on: boolean) {
        setMarcadas((atual) => {
            const nova = new Set(atual)
            for (const id of ids) {
                if (on) nova.add(id)
                else nova.delete(id)
            }
            return nova
        })
    }

    const porId = new Map((lote?.itens ?? []).map((i) => [i.clientId, i]))

    const previa = lote
        ? {
              itens: lote.itens,
              ignoradas: lote.ignoradas,
              /** Só as que vão nascer: as das marcadas, sem escolha por cima. */
              categoriasNovas: loteParaGravar(lote, marcadas, escolhidas).novas,
              /** As categorias da carteira do tipo do item (despesa ou receita, pelo destino). */
              categoriasDo: (i: ItemImportavel) => lote.categorias.filter((c) => c.type === tipoDoItem(i, lote.destino)),
              categorias: lote.categorias,
              /** O nome da categoria sugerida pelo histórico, pela id. */
              nomeDaCategoria: new Map(lote.categorias.map((c) => [c.id, c.name])),
              ...resumoDoLote(lote.itens),
          }
        : null

    return {
        passo,
        destino,
        setDestino,
        arquivo,
        escolherArquivo,
        csv,
        deducao,
        arquivoLido,
        mapeamento,
        setMapeamento,
        continuar,
        lerColunas,
        ajustarColunas,
        inverterSinal,
        voltar,
        previa,
        existentes,
        existentesConferidos,
        marcadas,
        setMarcada: (id: string, on: boolean) => marcarVarias([id], on),
        marcarVarias,
        categoriaDe: (id: string) => {
            const i = porId.get(id)
            return i ? categoriaEfetiva(i, escolhidas) : null
        },
        /** O nome da planilha que nasce ao gravar (aí `categoriaDe` é `null`). */
        categoriaNovaDe: (id: string) => {
            const i = porId.get(id)
            return i ? categoriaNovaDe(i, escolhidas) : null
        },
        /** A escolha da pessoa (a origem vira "pessoa"); a IA nunca passa por aqui. */
        setCategoria: (ids: string[], categoryId: string | null) =>
            setEscolhidas((e) => aplicarCategoria(e, ids, categoryId)),
        /** Tira da IA as linhas dadas (só as que ainda são dela); devolve a volta. */
        desfazerIa: (clientIds: string[]) => {
            // O updater vê as escolhas de agora; os ids são os que ele de fato mudou (atribuição idempotente).
            let ids: string[] = []
            setEscolhidas((e) => {
                const r = escolhidasSemIa(lote?.itens ?? [], e, clientIds)
                ids = r.ids
                return r.escolhidas
            })
            return () => setEscolhidas((e) => escolhidasDevolvidas(e, ids))
        },
        origemDe: (id: string) => {
            const i = porId.get(id)
            return i ? origemDaCategoria(i, escolhidas) : null
        },
        ia,
        tentarIaDeNovo: () => {
            if (lote && ia.estado === "falhou") void pedirIa(lote, escolhidas, vez.atual())
        },
        filtro,
        setFiltro,
        visiveis: lote ? filtrarItens(lote.itens, filtro, existentes, escolhidas) : [],
        contagens: lote
            ? contagemDosFiltros(lote.itens, existentes, escolhidas)
            : { todos: 0, saidas: 0, entradas: 0, existem: 0, "sem-categoria": 0, ia: 0 },
        expandido,
        setExpandido,
        resumo,
        importar,
        desfazer,
        reiniciar,
        feito,
        pendente,
        erro,
        /** Depois do arquivo, fechar pergunta; feito, não há o que perder. */
        dirty: arquivo != null && passo !== "feito",
    }
}

export type ImportarExtrato = ReturnType<typeof useImportarExtrato>
