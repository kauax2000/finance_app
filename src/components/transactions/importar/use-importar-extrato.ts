"use client"

import type { SupabaseClient } from "@supabase/supabase-js"
import { useQueryClient } from "@tanstack/react-query"
import { useState } from "react"

import { useAuth } from "@/components/providers"
import { lerCsv, mapearCsv } from "@/lib/import/csv"
import {
    categoriasQueFaltam,
    comCategoriaDaPlanilha,
    desfazerImportacao,
    type DestinoImportacao,
    importarLancamentos,
    type ItemImportavel,
    negativoEhDespesaPadrao,
    prepararItens,
} from "@/lib/import/importar"
import { lerOfx } from "@/lib/import/ofx"
import type { ItemBanco } from "@/lib/import/tipos"
import { invalidateWorkspaceData } from "@/lib/queries/invalidate-workspace-data"
import { supabase } from "@/lib/supabase"
import { toastSuccess } from "@/lib/toast"

export type ModoImportacao = "extrato" | "planilha"
export type PassoImportacao = "arquivo" | "colunas" | "conferir" | "feito"

type Categoria = { id: string; name: string; type: "income" | "expense" }
export type CategoriaNova = { nome: string; tipo: "income" | "expense"; clientId: string }

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
    source: "import_statement" | "import_sheet"
    batchId: string
}

export const sourceDoModo = (modo: ModoImportacao) => (modo === "planilha" ? "import_sheet" : "import_statement")

/** A extensão que o modo aceita; `null` recusa o arquivo. */
export function tipoDoArquivo(nome: string, modo: ModoImportacao): "csv" | "ofx" | null {
    const ext = nome.toLowerCase().split(".").pop()
    if (ext === "csv") return "csv"
    if (ext === "ofx" && modo === "extrato") return "ofx"
    return null
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
    modo: ModoImportacao,
): Promise<{ ok: true; lote: LoteImportacao } | { ok: false; erro: string }> {
    const [historico, cats] = await Promise.all([
        db
            .from("transactions")
            .select("description,category_id,date")
            .eq("workspace_id", workspaceId)
            .not("category_id", "is", null)
            .order("date", { ascending: false })
            .limit(1000),
        db.from("categories").select("id,name,type").eq("workspace_id", workspaceId),
    ])
    if (historico.error || cats.error) return { ok: false, erro: "Não foi possível ler as categorias. Tente de novo." }
    const categorias = (cats.data ?? []) as Categoria[]
    return {
        ok: true,
        lote: {
            itens: prepararItens(leitura.itens, historico.data ?? []),
            categorias,
            novas: categoriasQueFaltam(leitura.itens, categorias, destino).map((c) => ({
                ...c,
                clientId: crypto.randomUUID(),
            })),
            ignoradas: leitura.ignoradas,
            destino,
            source: sourceDoModo(modo),
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

const MAPEAMENTO_INICIAL: MapeamentoColunas = {
    data: 0,
    descricao: 1,
    valor: 2,
    categoria: null,
    temCabecalho: true,
    negativoEhDespesa: true,
}

/**
 * Extrato do banco (CSV ou OFX, `import_statement`) ou a planilha da pessoa (CSV,
 * `import_sheet`) num cartão ou numa conta, em passos: arquivo, colunas (só CSV),
 * conferir e feito. O lote é preparado uma vez e fica no estado.
 */
export function useImportarExtrato({ workspaceId }: { workspaceId: string | null }) {
    const queryClient = useQueryClient()
    const userId = useAuth().user?.id ?? null
    const [passo, setPasso] = useState<PassoImportacao>("arquivo")
    const [modo, setModoEstado] = useState<ModoImportacao>("extrato")
    const [destino, setDestinoEstado] = useState<DestinoImportacao | null>(null)
    const [arquivo, setArquivo] = useState<File | null>(null)
    const [csv, setCsv] = useState<string[][] | null>(null)
    const [mapeamento, setMapeamento] = useState<MapeamentoColunas>(MAPEAMENTO_INICIAL)
    const [lote, setLote] = useState<LoteImportacao | null>(null)
    const [pendente, setPendente] = useState<"lendo" | "importar" | "desfazer" | null>(null)
    const [erro, setErro] = useState<string | null>(null)

    function limparLeitura() {
        setCsv(null)
        setLote(null)
        setErro(null)
    }

    function setModo(m: ModoImportacao) {
        setModoEstado(m)
        setArquivo(null)
        limparLeitura()
    }

    function setDestino(d: DestinoImportacao | null) {
        setDestinoEstado(d)
        limparLeitura()
    }

    function escolherArquivo(f: File | null) {
        limparLeitura()
        if (f && !tipoDoArquivo(f.name, modo)) {
            setArquivo(null)
            setErro(modo === "planilha" ? "Use um arquivo .csv." : "Use um arquivo .csv ou .ofx.")
            return
        }
        setArquivo(f)
    }

    async function preparar(leitura: { itens: ItemBanco[]; ignoradas: number }) {
        if (!workspaceId || !destino) return
        setPendente("lendo")
        setErro(null)
        try {
            const r = await prepararLote(supabase, workspaceId, leitura, destino, modo)
            if (!r.ok) {
                setErro(r.erro)
                return
            }
            setLote(r.lote)
            setPasso("conferir")
        } finally {
            setPendente(null)
        }
    }

    /** Do arquivo: o CSV vai às colunas; o OFX vai direto à conferência. */
    async function continuar() {
        if (!arquivo || !destino) return
        const tipo = tipoDoArquivo(arquivo.name, modo)
        const texto = await arquivo.text()
        if (tipo === "csv") {
            setCsv(lerCsv(texto))
            setMapeamento({ ...MAPEAMENTO_INICIAL, negativoEhDespesa: negativoEhDespesaPadrao(destino) })
            setPasso("colunas")
        } else if (tipo === "ofx") {
            await preparar(lerOfx(texto, destino.tipo))
        }
    }

    async function lerColunas() {
        if (!csv) return
        const m = mapeamento
        await preparar(
            mapearCsv(
                csv,
                { data: m.data, descricao: m.descricao, valor: m.valor, categoria: m.categoria ?? undefined },
                { temCabecalho: m.temCabecalho, negativoEhDespesa: m.negativoEhDespesa },
            ),
        )
    }

    function voltar() {
        setErro(null)
        if (passo === "conferir") setPasso(csv ? "colunas" : "arquivo")
        else if (passo === "colunas") setPasso("arquivo")
    }

    async function importar(): Promise<{ quantidade: number; loteId: string } | null> {
        if (!lote || !workspaceId || !userId || lote.itens.length === 0) return null
        setPendente("importar")
        setErro(null)
        try {
            const r = await gravarLote(supabase, { userId, workspaceId }, lote)
            if (!r.ok) {
                setErro(r.erro)
                return null
            }
            setPasso("feito")
            await invalidateWorkspaceData(queryClient, workspaceId, {
                domains: ["transactions", "categories", "credit_card_expense_rows"],
            })
            return { quantidade: r.quantidade, loteId: lote.batchId }
        } catch {
            setErro("A importação não terminou. Tente de novo: nada se duplica.")
            return null
        } finally {
            setPendente(null)
        }
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
        } finally {
            setPendente(null)
        }
    }

    function reiniciar() {
        setPasso("arquivo")
        setModoEstado("extrato")
        setDestinoEstado(null)
        setArquivo(null)
        setMapeamento(MAPEAMENTO_INICIAL)
        setPendente(null)
        limparLeitura()
    }

    const previa = lote
        ? {
              itens: lote.itens,
              ignoradas: lote.ignoradas,
              categoriasNovas: lote.novas,
              /** O nome da categoria sugerida pelo histórico, pela id. */
              nomeDaCategoria: new Map(lote.categorias.map((c) => [c.id, c.name])),
              ...resumoDoLote(lote.itens),
          }
        : null

    return {
        passo,
        modo,
        setModo,
        destino,
        setDestino,
        arquivo,
        escolherArquivo,
        csv,
        mapeamento,
        setMapeamento,
        continuar,
        lerColunas,
        voltar,
        previa,
        importar,
        desfazer,
        reiniciar,
        pendente,
        erro,
        /** Depois do arquivo, fechar pergunta; feito, não há o que perder. */
        dirty: arquivo != null && passo !== "feito",
    }
}

export type ImportarExtrato = ReturnType<typeof useImportarExtrato>
