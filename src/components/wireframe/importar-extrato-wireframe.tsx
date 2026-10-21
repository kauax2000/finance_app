"use client"

import { useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { useState } from "react"

import { MapeamentoCsv } from "@/components/wireframe/mapeamento-csv"
import { WireframeBox } from "@/components/wireframe/wireframe-box"
import { currencyBRL } from "@/lib/formatters"
import { lerCsv } from "@/lib/import/csv"
import {
    categoriasQueFaltam,
    comCategoriaDaPlanilha,
    desfazerImportacao,
    type DestinoImportacao,
    importarLancamentos,
    type ItemImportavel,
    prepararItens,
} from "@/lib/import/importar"
import { lerOfx } from "@/lib/import/ofx"
import type { ItemBanco } from "@/lib/import/tipos"
import { invalidateWorkspaceData } from "@/lib/queries/invalidate-workspace-data"
import { type CreditCard, supabase } from "@/lib/supabase"
import { formatYmdPtBr } from "@/lib/transaction-date"

const campo = "border border-dashed border-muted-foreground/60 bg-transparent px-2 py-1 font-mono text-foreground"
const botao = "border border-muted-foreground/60 px-2 py-1 font-mono text-foreground disabled:opacity-50"

type Modo = "extrato" | "planilha"
type Categoria = { id: string; name: string; type: "income" | "expense" }
type CategoriaNova = { nome: string; tipo: "income" | "expense"; clientId: string }

const CONTAS = [
    ["pix", "Conta: Pix"],
    ["debit_card", "Conta: Débito"],
    ["other", "Conta: Outro"],
] as const

/** "cartao:<id>" ou "conta:<forma>", o valor do `<select>` do destino. */
function destinoDe(valor: string): DestinoImportacao | null {
    const [tipo, resto] = valor.split(":")
    if (tipo === "cartao" && resto) return { tipo: "cartao", cardId: resto }
    const conta = CONTAS.find(([forma]) => forma === resto)
    return tipo === "conta" && conta ? { tipo: "conta", paymentMethod: conta[0] } : null
}

/** A entrada sempre à vista na lista de transações: abre o wireframe com `?importar=1`. */
export function ImportarExtratoLink({ href }: { href: string }) {
    return (
        <WireframeBox bloco={2} titulo="Importar extrato">
            <Link href={href} className="text-foreground underline">
                Importar extrato ou planilha
            </Link>
        </WireframeBox>
    )
}

/**
 * Extrato do banco (CSV ou OFX, `import_statement`) ou a planilha da pessoa (CSV,
 * `import_sheet`) num cartão ou numa conta. O lote é preparado uma vez e fica no
 * estado: repetir "Importar" reenvia os mesmos `client_id` e não duplica (Foco 3).
 */
export function ImportarExtratoWireframe({
    workspaceId,
    userId,
    cards,
    onClose,
}: {
    workspaceId: string
    userId: string
    cards: Pick<CreditCard, "id" | "name" | "last_four">[]
    onClose: () => void
}) {
    const queryClient = useQueryClient()
    const [modo, setModo] = useState<Modo>("extrato")
    const [destinoValor, setDestinoValor] = useState("")
    const destino = destinoDe(destinoValor)

    const [csv, setCsv] = useState<string[][] | null>(null)
    const [itens, setItens] = useState<ItemImportavel[]>([])
    const [ignoradas, setIgnoradas] = useState<number | null>(null)
    const [categorias, setCategorias] = useState<Categoria[]>([])
    const [novas, setNovas] = useState<CategoriaNova[]>([])
    const [batchId, setBatchId] = useState("")
    const [importados, setImportados] = useState<number | null>(null)

    const [pendente, setPendente] = useState<string | null>(null)
    const [aviso, setAviso] = useState<{ erro: boolean; texto: string } | null>(null)

    function limpar() {
        setCsv(null)
        setItens([])
        setIgnoradas(null)
        setNovas([])
        setImportados(null)
        setAviso(null)
    }

    async function aplicar(lidos: ItemBanco[], puladas: number) {
        setPendente("lendo")
        setAviso(null)
        const [historico, cats] = await Promise.all([
            supabase
                .from("transactions")
                .select("description,category_id,date")
                .eq("workspace_id", workspaceId)
                .not("category_id", "is", null)
                .order("date", { ascending: false })
                .limit(1000),
            supabase.from("categories").select("id,name,type").eq("workspace_id", workspaceId),
        ])
        setPendente(null)
        if (historico.error || cats.error) {
            setAviso({ erro: true, texto: "Não foi possível ler as categorias. Tente de novo." })
            return
        }
        const existentes = (cats.data ?? []) as Categoria[]
        setCategorias(existentes)
        setNovas(categoriasQueFaltam(lidos, existentes).map((c) => ({ ...c, clientId: crypto.randomUUID() })))
        setItens(prepararItens(lidos, historico.data ?? []))
        setIgnoradas(puladas)
        setBatchId(crypto.randomUUID())
        setImportados(null)
    }

    async function onArquivo(arquivo: File | undefined) {
        limpar()
        if (!arquivo || !destino) return
        const ext = arquivo.name.toLowerCase().split(".").pop()
        if (ext === "csv") {
            setCsv(lerCsv(await arquivo.text()))
        } else if (ext === "ofx" && modo === "extrato") {
            const r = lerOfx(await arquivo.text(), destino.tipo)
            await aplicar(r.itens, r.ignoradas)
        } else {
            setAviso({ erro: true, texto: modo === "planilha" ? "Use um arquivo .csv." : "Use um arquivo .csv ou .ofx." })
        }
    }

    /** As categorias que faltam nascem primeiro, com o `client_id` guardado: o retry não as duplica. */
    async function criarCategorias(): Promise<Categoria[] | null> {
        if (novas.length === 0) return []
        const { data, error } = await supabase
            .from("categories")
            .upsert(
                novas.map((c) => ({
                    user_id: userId,
                    workspace_id: workspaceId,
                    name: c.nome,
                    type: c.tipo,
                    client_id: c.clientId,
                })),
                { onConflict: "workspace_id,client_id" },
            )
            .select("id,name,type")
        if (error) {
            setAviso({ erro: true, texto: `Não foi possível criar as categorias: ${error.message}` })
            return null
        }
        return (data ?? []) as Categoria[]
    }

    async function onImportar() {
        if (!destino || itens.length === 0) return
        setPendente("importar")
        setAviso(null)
        try {
            const criadas = await criarCategorias()
            if (!criadas) return
            const r = await importarLancamentos(
                supabase,
                { userId, workspaceId },
                comCategoriaDaPlanilha(itens, [...categorias, ...criadas]),
                destino,
                modo === "planilha" ? "import_sheet" : "import_statement",
                batchId,
            )
            if (!r.ok) {
                setAviso({ erro: true, texto: `${r.erro} Tente de novo: nada se duplica.` })
                return
            }
            setImportados(r.inseridos)
            await invalidateWorkspaceData(queryClient, workspaceId, {
                domains: ["transactions", "categories", "credit_card_expense_rows"],
            })
        } catch {
            setAviso({ erro: true, texto: "A importação não terminou. Tente de novo: nada se duplica." })
        } finally {
            setPendente(null)
        }
    }

    async function onDesfazer() {
        setPendente("desfazer")
        setAviso(null)
        const r = await desfazerImportacao(supabase, workspaceId, batchId)
        setPendente(null)
        if (!r.ok) {
            setAviso({ erro: true, texto: r.erro ?? "Não foi possível desfazer a importação." })
            return
        }
        limpar()
        setAviso({ erro: false, texto: "Importação desfeita." })
        await invalidateWorkspaceData(queryClient, workspaceId, {
            domains: ["transactions", "credit_card_expense_rows"],
        })
    }

    return (
        <WireframeBox bloco={2} titulo="Importar extrato">
            <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2">
                    O que é
                    <select
                        className={campo}
                        value={modo}
                        disabled={pendente != null}
                        onChange={(e) => {
                            setModo(e.target.value as Modo)
                            limpar()
                        }}
                    >
                        <option value="extrato">Extrato do banco (CSV ou OFX)</option>
                        <option value="planilha">Planilha (CSV)</option>
                    </select>
                </label>
                <label className="flex items-center gap-2">
                    Destino
                    <select
                        className={campo}
                        value={destinoValor}
                        disabled={pendente != null}
                        onChange={(e) => {
                            setDestinoValor(e.target.value)
                            limpar()
                        }}
                    >
                        <option value="">Escolha…</option>
                        {cards.map((c) => (
                            <option key={c.id} value={`cartao:${c.id}`}>
                                Cartão: {c.name} · •••• {c.last_four}
                            </option>
                        ))}
                        {CONTAS.map(([forma, rotulo]) => (
                            <option key={forma} value={`conta:${forma}`}>
                                {rotulo}
                            </option>
                        ))}
                    </select>
                </label>
                <button type="button" className={botao} onClick={onClose}>
                    Fechar
                </button>
            </div>

            <label className="flex flex-wrap items-center gap-2">
                Arquivo ({modo === "planilha" ? ".csv" : ".csv ou .ofx"})
                <input
                    type="file"
                    accept={modo === "planilha" ? ".csv" : ".csv,.ofx"}
                    disabled={!destino || pendente != null}
                    onChange={(e) => {
                        const arquivo = e.target.files?.[0]
                        // Limpo, o mesmo arquivo pode ser escolhido de novo.
                        e.target.value = ""
                        void onArquivo(arquivo)
                    }}
                />
            </label>
            {!destino ? <p>Escolha o destino antes do arquivo.</p> : null}

            {csv ? (
                <MapeamentoCsv
                    linhas={csv}
                    extrato
                    disabled={pendente != null}
                    onLer={(r) => void aplicar(r.itens, r.ignoradas)}
                />
            ) : null}
            {pendente === "lendo" ? <p role="status">Lendo…</p> : null}

            {ignoradas != null ? (
                <div className="space-y-2">
                    <p className="text-foreground">
                        {itens.length} lançamento(s) para importar · {ignoradas} linha(s) ignorada(s)
                    </p>
                    {novas.length > 0 ? (
                        <p>Categorias novas: {novas.map((c) => `${c.nome} (${c.tipo === "income" ? "receita" : "despesa"})`).join(", ")}</p>
                    ) : null}
                    <ul className="space-y-1 pl-4">
                        {itens.slice(0, 20).map((i) => (
                            <li key={i.clientId}>
                                {formatYmdPtBr(i.data)} · {i.descricao}
                                {i.parcela ? ` (${i.parcela.k}/${i.parcela.n})` : ""} · {i.estorno ? "+" : "−"}
                                {currencyBRL(i.valor)}
                                {i.categoria ? ` · ${i.categoria}` : ""}
                            </li>
                        ))}
                        {itens.length > 20 ? <li>… e mais {itens.length - 20}</li> : null}
                    </ul>
                    {importados == null ? (
                        <button
                            type="button"
                            className={botao}
                            disabled={pendente != null || itens.length === 0}
                            onClick={() => void onImportar()}
                        >
                            {pendente === "importar" ? "Importando…" : "Importar"}
                        </button>
                    ) : (
                        <p className="flex flex-wrap items-center gap-2 text-foreground">
                            {importados} importados ·
                            <button
                                type="button"
                                className={botao}
                                disabled={pendente != null}
                                onClick={() => void onDesfazer()}
                            >
                                {pendente === "desfazer" ? "Desfazendo…" : "Desfazer importação"}
                            </button>
                        </p>
                    )}
                </div>
            ) : null}

            {aviso ? (
                <p role={aviso.erro ? "alert" : "status"} className={aviso.erro ? "text-destructive" : "text-foreground"}>
                    {aviso.texto}
                </p>
            ) : null}
        </WireframeBox>
    )
}
