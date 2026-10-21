"use client"

import { useQueryClient } from "@tanstack/react-query"
import { type FormEvent, type ReactNode, useMemo, useState } from "react"

import { WireframeBox } from "@/components/wireframe/wireframe-box"
import {
    previousStatementCloseBefore,
    shouldCountCreditCardExpenseForInvoiceSum,
    statementCloseOnOrBefore,
} from "@/lib/credit-card-billing"
import type { CcTxAnalyticsRow } from "@/lib/credit-cards-workspace-transactions"
import { ajustarAoCiclo, conferirNoCiclo } from "@/lib/fatura/ciclo"
import type { LancamentoParaConferir } from "@/lib/fatura/conferir"
import { bancoTotalDoCiclo } from "@/lib/fatura/total-com-banco"
import { currencyBRL } from "@/lib/formatters"
import { lerCsv, mapearCsv } from "@/lib/import/csv"
import { extrairItensDaFatura, removerIdentificacao } from "@/lib/import/fatura-texto"
import { importarLancamentos, type ItemImportavel, prepararItens } from "@/lib/import/importar"
import { lerValorBr } from "@/lib/import/normalizar"
import { lerOfx } from "@/lib/import/ofx"
import { pdfParaTexto } from "@/lib/import/pdf-texto"
import type { ItemBanco } from "@/lib/import/tipos"
import { invalidateWorkspaceData } from "@/lib/queries/invalidate-workspace-data"
import { statementTotalsKeys } from "@/lib/queries/keys"
import { useStatementTotalsQuery } from "@/lib/queries/use-statement-totals"
import { type CreditCard, supabase } from "@/lib/supabase"
import { addDaysYmd, formatYmdPtBr, localYmdFromDate, transactionLocalYmd } from "@/lib/transaction-date"

type Origem = "pdf" | "csv" | "ofx"

type Leitura = {
    origem: Origem
    total: number | null
    completa: boolean
    diferenca: number | null
    ignoradas: number
}

// O cartão carrega 11 meses de lançamentos (`fetchCreditCardExpenseRowsForCard`): o ciclo
// mais antigo que isso viria pela metade e acusaria "falta no app" à toa.
const CICLOS = 10

const campo = "border border-dashed border-muted-foreground/60 bg-transparent px-2 py-1 font-mono text-foreground"
const botao = "border border-muted-foreground/60 px-2 py-1 font-mono text-foreground disabled:opacity-50"

const somaComEstorno = (itens: ItemBanco[]) =>
    Math.round(itens.reduce((s, i) => s + (i.estorno ? -i.valor : i.valor), 0) * 100) / 100

/** Os ciclos já fechados (fechamento antes de hoje), do mais recente para trás. */
function ciclosFechados(closingDay: number): Array<{ inicio: string; fechamento: string }> {
    const ontem = new Date()
    ontem.setDate(ontem.getDate() - 1)
    let fechamento = statementCloseOnOrBefore(ontem, closingDay)
    const lista: Array<{ inicio: string; fechamento: string }> = []
    for (let i = 0; i < CICLOS; i++) {
        const anterior = previousStatementCloseBefore(fechamento, closingDay)
        lista.push({ inicio: addDaysYmd(localYmdFromDate(anterior), 1), fechamento: localYmdFromDate(fechamento) })
        fechamento = anterior
    }
    return lista
}

function Lista({ titulo, linhas }: { titulo: string; linhas: ReactNode[] }) {
    return (
        <details open={linhas.length > 0}>
            <summary>
                {titulo} ({linhas.length})
            </summary>
            <ul className="mt-1 space-y-1 pl-4">{linhas}</ul>
        </details>
    )
}

const linhaBanco = (i: ItemBanco) =>
    `${formatYmdPtBr(i.data)} · ${i.descricao}${i.parcela ? ` (${i.parcela.k}/${i.parcela.n})` : ""} · ${i.estorno ? "−" : ""}${currencyBRL(i.valor)}`
const linhaApp = (a: LancamentoParaConferir) =>
    `${formatYmdPtBr(a.date)} · ${a.description ?? "(sem descrição)"} · ${a.type === "income" ? "−" : ""}${currencyBRL(a.amount)}`

export function ConferirFaturaWireframe({
    card,
    transactions,
    workspaceId,
    userId,
    onMudou,
}: {
    card: Pick<CreditCard, "id" | "closing_day">
    transactions: CcTxAnalyticsRow[]
    workspaceId: string
    userId: string
    /** A tela recarrega os lançamentos do cartão depois de importar. */
    onMudou?: () => void | Promise<void>
}) {
    const queryClient = useQueryClient()
    const ciclos = useMemo(() => ciclosFechados(card.closing_day), [card.closing_day])
    const [fechamento, setFechamento] = useState(ciclos[0].fechamento)
    const ciclo = ciclos.find((c) => c.fechamento === fechamento) ?? ciclos[0]

    const totais = useStatementTotalsQuery(workspaceId)
    const bancoAtual = bancoTotalDoCiclo(totais.data, card.id, ciclo.fechamento)
    const [totalDigitado, setTotalDigitado] = useState("")

    const [arquivoPdf, setArquivoPdf] = useState<File | null>(null)
    const [senhaPedida, setSenhaPedida] = useState<{ incorreta: boolean } | null>(null)
    const [senha, setSenha] = useState("")
    const [csv, setCsv] = useState<string[][] | null>(null)
    const [mapa, setMapa] = useState({ data: 0, descricao: 1, valor: 2, temCabecalho: true })

    const [leitura, setLeitura] = useState<Leitura | null>(null)
    // O clientId nasce uma vez por leitura e fica aqui: repetir o envio não duplica (Foco 3).
    const [itens, setItens] = useState<ItemImportavel[]>([])
    const [batchId, setBatchId] = useState("")
    const [desmarcados, setDesmarcados] = useState<Set<string>>(new Set())

    const [pendente, setPendente] = useState<string | null>(null)
    const [aviso, setAviso] = useState<{ erro: boolean; texto: string } | null>(null)

    const doApp = useMemo<LancamentoParaConferir[]>(
        () =>
            transactions.flatMap((t) => {
                if (t.payment_method !== "credit_card" || t.payment_credit_card_id !== card.id) return []
                // Estorno entra (receita no cartão); a âncora duplicada de parcelamento não.
                if (t.type === "expense" && !shouldCountCreditCardExpenseForInvoiceSum(t, card.id, transactions)) return []
                const date = transactionLocalYmd(t.date)
                // Sem corte de data: `conferirNoCiclo` casa também o que veio antes do ciclo.
                if (!date) return []
                return [
                    {
                        id: t.id,
                        date,
                        description: t.description,
                        amount: Number(t.amount),
                        type: t.type,
                        installment_sequence: t.installment_sequence ?? null,
                    },
                ]
            }),
        [transactions, card.id],
    )

    const conferencia = useMemo(
        () => (leitura ? conferirNoCiclo(itens, doApp, ciclo) : null),
        [leitura, itens, doApp, ciclo],
    )
    const faltam = conferencia?.faltaNoApp ?? []
    const selecionados = faltam.filter((i) => !desmarcados.has(i.clientId))

    function limparLeitura() {
        setLeitura(null)
        setItens([])
        setCsv(null)
        setArquivoPdf(null)
        setSenhaPedida(null)
        setSenha("")
        setDesmarcados(new Set())
    }

    function aplicar(lidos: ItemBanco[], l: Leitura) {
        setLeitura(l)
        setItens(prepararItens(lidos, transactions))
        setBatchId(crypto.randomUUID())
        setDesmarcados(new Set())
    }

    async function gravarTotal(valor: number, source: "manual" | Origem) {
        setPendente("total")
        setAviso(null)
        const { error } = await supabase.from("credit_card_statement_totals").upsert(
            {
                workspace_id: workspaceId,
                credit_card_id: card.id,
                statement_close_date: ciclo.fechamento,
                bank_total: valor,
                source,
                created_by: userId,
            },
            { onConflict: "workspace_id,credit_card_id,statement_close_date" },
        )
        setPendente(null)
        if (error) {
            setAviso({ erro: true, texto: `Não foi possível gravar o total: ${error.message}` })
            return
        }
        await queryClient.invalidateQueries({ queryKey: statementTotalsKeys.list(workspaceId) })
        setAviso({ erro: false, texto: `Total do banco gravado: ${currencyBRL(valor)}.` })
    }

    function onGravarTotal(e: FormEvent<HTMLFormElement>) {
        e.preventDefault()
        const valor = lerValorBr(totalDigitado)
        if (valor == null) {
            setAviso({ erro: true, texto: "Digite o total como 1.234,56." })
            return
        }
        void gravarTotal(valor, "manual")
    }

    async function lerPdf(arquivo: File, senhaTentada?: string) {
        setPendente("arquivo")
        let r: Awaited<ReturnType<typeof pdfParaTexto>>
        try {
            r = await pdfParaTexto(arquivo, senhaTentada)
        } catch {
            r = { ok: false, erro: "Não foi possível carregar o leitor de PDF. Tente de novo." }
        } finally {
            setPendente(null)
        }
        if (r.ok) {
            setSenhaPedida(null)
            const l = extrairItensDaFatura(removerIdentificacao(r.texto), { fechamento: ciclo.fechamento })
            aplicar(l.itens, { origem: "pdf", total: l.total, completa: l.completa, diferenca: l.diferenca, ignoradas: 0 })
        } else if ("precisaSenha" in r) {
            setSenhaPedida({ incorreta: r.senhaIncorreta })
        } else {
            setAviso({ erro: true, texto: r.erro })
        }
    }

    async function onArquivo(arquivo: File | undefined) {
        limparLeitura()
        setAviso(null)
        if (!arquivo) return
        const ext = arquivo.name.toLowerCase().split(".").pop()
        if (ext === "pdf") {
            setArquivoPdf(arquivo)
            await lerPdf(arquivo)
        } else if (ext === "csv") {
            setCsv(lerCsv(await arquivo.text()))
        } else if (ext === "ofx") {
            const { itens: lidos, ignoradas } = lerOfx(await arquivo.text(), "cartao")
            aplicar(lidos, { origem: "ofx", total: somaComEstorno(lidos), completa: true, diferenca: 0, ignoradas })
        } else {
            setAviso({ erro: true, texto: "Use um arquivo .pdf, .csv ou .ofx." })
        }
    }

    function onAbrirComSenha(e: FormEvent<HTMLFormElement>) {
        e.preventDefault()
        if (arquivoPdf) void lerPdf(arquivoPdf, senha)
    }

    function onLerCsv() {
        if (!csv) return
        const { itens: lidos, ignoradas } = mapearCsv(
            csv,
            { data: mapa.data, descricao: mapa.descricao, valor: mapa.valor },
            { temCabecalho: mapa.temCabecalho, negativoEhDespesa: false },
        )
        aplicar(lidos, { origem: "csv", total: somaComEstorno(lidos), completa: true, diferenca: 0, ignoradas })
    }

    async function onImportar() {
        if (!leitura || selecionados.length === 0) return
        setPendente("importar")
        setAviso(null)
        try {
            const r = await importarLancamentos(
                supabase,
                { userId, workspaceId },
                // A parcela com a data da compra entra nesta fatura, e não numa velha.
                ajustarAoCiclo(selecionados, ciclo),
                { tipo: "cartao", cardId: card.id },
                leitura.origem === "pdf" ? "import_pdf" : "import_statement",
                batchId,
            )
            if (!r.ok) {
                setAviso({ erro: true, texto: r.erro })
                return
            }
            await invalidateWorkspaceData(queryClient, workspaceId, { domains: ["transactions"] })
            await onMudou?.()
            setAviso({ erro: false, texto: `${r.inseridos} lançamento(s) importado(s), marcados para revisar.` })
        } catch {
            // O mesmo lote, com os mesmos clientId, pode ser reenviado sem duplicar (Foco 3).
            setAviso({ erro: true, texto: "A importação não terminou. Tente de novo: nada se duplica." })
        } finally {
            setPendente(null)
        }
    }

    const coluna = (nome: "data" | "descricao" | "valor", rotulo: string) => (
        <label className="flex items-center gap-1">
            {rotulo}
            <input
                type="number"
                min={0}
                className={`${campo} w-16`}
                value={mapa[nome]}
                onChange={(e) => setMapa((m) => ({ ...m, [nome]: Number(e.target.value) }))}
            />
        </label>
    )

    return (
        <WireframeBox bloco={2} titulo="Conferir fatura">
            <label className="flex flex-wrap items-center gap-2">
                Fatura fechada
                <select
                    className={campo}
                    value={ciclo.fechamento}
                    onChange={(e) => {
                        setFechamento(e.target.value)
                        limparLeitura()
                        setAviso(null)
                    }}
                >
                    {ciclos.map((c) => (
                        <option key={c.fechamento} value={c.fechamento}>
                            fecha {formatYmdPtBr(c.fechamento)} ({formatYmdPtBr(c.inicio)} a {formatYmdPtBr(c.fechamento)})
                        </option>
                    ))}
                </select>
            </label>

            <form className="flex flex-wrap items-center gap-2" onSubmit={onGravarTotal}>
                <label className="flex items-center gap-2">
                    Total do banco
                    <input
                        className={`${campo} w-32`}
                        inputMode="decimal"
                        placeholder={bancoAtual != null ? currencyBRL(bancoAtual) : "1.234,56"}
                        value={totalDigitado}
                        onChange={(e) => setTotalDigitado(e.target.value)}
                    />
                </label>
                <button type="submit" className={botao} disabled={pendente != null}>
                    {pendente === "total" ? "Gravando…" : "Gravar"}
                </button>
                <span>atual: {bancoAtual != null ? currencyBRL(bancoAtual) : "nenhum (vale o calculado)"}</span>
            </form>

            <label className="flex flex-wrap items-center gap-2">
                Arquivo do banco (.pdf, .csv, .ofx)
                <input
                    type="file"
                    accept=".pdf,.csv,.ofx"
                    disabled={pendente != null}
                    onChange={(e) => {
                        const arquivo = e.target.files?.[0]
                        // Limpo, o mesmo arquivo pode ser escolhido de novo (a segunda conferência, Foco 3).
                        e.target.value = ""
                        void onArquivo(arquivo)
                    }}
                />
            </label>
            {pendente === "arquivo" ? <p role="status">Lendo o arquivo…</p> : null}

            {senhaPedida ? (
                <form className="flex flex-wrap items-center gap-2" onSubmit={onAbrirComSenha}>
                    <label className="flex items-center gap-2">
                        O PDF tem senha
                        <input
                            type="password"
                            className={campo}
                            autoComplete="off"
                            value={senha}
                            onChange={(e) => setSenha(e.target.value)}
                        />
                    </label>
                    <button type="submit" className={botao} disabled={pendente != null || !senha}>
                        Abrir
                    </button>
                    {senhaPedida.incorreta ? (
                        <span role="alert" className="text-destructive">
                            Senha incorreta
                        </span>
                    ) : null}
                </form>
            ) : null}

            {csv ? (
                <div className="space-y-2">
                    <p>Primeira linha: {(csv[0] ?? []).map((c, i) => `[${i}] ${c}`).join(" | ")}</p>
                    <div className="flex flex-wrap items-center gap-3">
                        {coluna("data", "Data na coluna")}
                        {coluna("descricao", "Descrição na coluna")}
                        {coluna("valor", "Valor na coluna")}
                        <label className="flex items-center gap-1">
                            <input
                                type="checkbox"
                                checked={mapa.temCabecalho}
                                onChange={(e) => setMapa((m) => ({ ...m, temCabecalho: e.target.checked }))}
                            />
                            1ª linha é cabeçalho
                        </label>
                        <button type="button" className={botao} onClick={onLerCsv}>
                            Ler colunas
                        </button>
                    </div>
                </div>
            ) : null}

            {leitura && conferencia ? (
                <div className="space-y-2">
                    <p>
                        Total lido: {leitura.total != null ? currencyBRL(leitura.total) : "não achado"} · soma dos
                        itens: {currencyBRL(somaComEstorno(itens))} ·{" "}
                        {leitura.completa
                            ? "leitura completa"
                            : `leitura INCOMPLETA${leitura.diferenca != null ? ` (diferença ${currencyBRL(leitura.diferenca)})` : ""}`}
                        {leitura.ignoradas ? ` · ${leitura.ignoradas} linha(s) ignorada(s)` : ""}
                    </p>
                    <p>
                        Banco {currencyBRL(conferencia.somaBanco)} · app {currencyBRL(conferencia.somaApp)} · diferença{" "}
                        {currencyBRL(conferencia.diferenca)}
                    </p>
                    <button
                        type="button"
                        className={botao}
                        disabled={pendente != null || leitura.total == null}
                        onClick={() => leitura.total != null && void gravarTotal(leitura.total, leitura.origem)}
                    >
                        Usar o total lido como total do banco
                    </button>

                    <Lista
                        titulo="Bate"
                        linhas={conferencia.bate.map((p) => (
                            <li key={p.app.id}>{linhaBanco(p.banco)}</li>
                        ))}
                    />
                    <Lista
                        titulo="Falta no app"
                        linhas={faltam.map((i) => (
                            <li key={i.clientId}>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={!desmarcados.has(i.clientId)}
                                        onChange={(e) =>
                                            setDesmarcados((d) => {
                                                const novo = new Set(d)
                                                if (e.target.checked) novo.delete(i.clientId)
                                                else novo.add(i.clientId)
                                                return novo
                                            })
                                        }
                                    />
                                    {linhaBanco(i)}
                                </label>
                            </li>
                        ))}
                    />
                    {faltam.length > 0 ? (
                        <button
                            type="button"
                            className={botao}
                            disabled={pendente != null || selecionados.length === 0}
                            onClick={() => void onImportar()}
                        >
                            {pendente === "importar" ? "Importando…" : `Importar selecionados (${selecionados.length})`}
                        </button>
                    ) : null}
                    <Lista
                        titulo="Só no app"
                        linhas={conferencia.soNoApp.map((a) => (
                            <li key={a.id}>{linhaApp(a)}</li>
                        ))}
                    />
                    <Lista
                        titulo="Valor diferente"
                        linhas={conferencia.valorDiferente.map((p) => (
                            <li key={p.app.id}>
                                banco {linhaBanco(p.banco)} / app {linhaApp(p.app)}
                            </li>
                        ))}
                    />
                    <Lista
                        titulo="Parcela fora de sequência"
                        linhas={conferencia.parcelaForaDeSequencia.map((p) => (
                            <li key={p.app.id}>
                                banco {linhaBanco(p.banco)} / app parcela {p.app.installment_sequence}
                            </li>
                        ))}
                    />
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
