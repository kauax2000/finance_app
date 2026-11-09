"use client"

import { useQueryClient } from "@tanstack/react-query"
import { type FormEvent, type ReactNode, useEffect, useMemo, useRef, useState } from "react"

import { CorrigirFatura } from "@/components/wireframe/corrigir-fatura-wireframe"
import { MapeamentoCsv } from "@/components/wireframe/mapeamento-csv"
import { WireframeBox } from "@/components/wireframe/wireframe-box"
import { useWorkspace } from "@/components/workspace-provider"
import { enviarAnexo, listarAnexos } from "@/lib/anexos"
import {
    previousStatementCloseBefore,
    shouldCountCreditCardExpenseForInvoiceSum,
    statementCloseOnOrBefore,
} from "@/lib/credit-card-billing"
import type { CcTxAnalyticsRow } from "@/lib/credit-cards-workspace-transactions"
import { desfazerCorrecoes, type LoteAplicado } from "@/lib/fatura/aplicar-correcoes"
import { aprovarFatura } from "@/lib/fatura/aprovar"
import { conferirNoCiclo } from "@/lib/fatura/ciclo"
import type { LancamentoParaConferir } from "@/lib/fatura/conferir"
import { estadoDaFatura, semDiferencas, somaDoCiclo } from "@/lib/fatura/estado"
import { bancoTotalDoCiclo, totalDoCiclo } from "@/lib/fatura/total-com-banco"
import { currencyBRL } from "@/lib/formatters"
import { itensDaIA, releitura } from "@/lib/ia/fatura"
import { lerFaturaComIA } from "@/lib/ia/ler"
import { lerCsv } from "@/lib/import/csv"
import { extrairItensDaFatura, removerIdentificacao } from "@/lib/import/fatura-texto"
import { type ItemImportavel, prepararItens } from "@/lib/import/importar"
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
    /** Os itens vieram da IA; o total continua o do leitor determinístico (Decisão 7). */
    ia?: boolean
}

// O cartão carrega 11 meses de lançamentos (`fetchCreditCardExpenseRowsForCard`): o ciclo
// mais antigo que isso viria pela metade e acusaria "falta no app" à toa.
const CICLOS = 10

const campo = "border border-dashed border-muted-foreground/60 bg-transparent px-2 py-1 font-mono text-foreground"
const botao = "border border-muted-foreground/60 px-2 py-1 font-mono text-foreground disabled:opacity-50"

const somaComEstorno = (itens: ItemBanco[]) =>
    Math.round(itens.reduce((s, i) => s + (i.estorno ? -i.valor : i.valor), 0) * 100) / 100

/**
 * Os ciclos já fechados, do mais recente para trás. Fechado é o que fecha até
 * hoje, inclusive: a mesma régua do `buildCardCycleSnapshot`, que no dia do
 * fechamento já mostra a fatura fechada.
 */
export function ciclosFechados(closingDay: number, hoje = new Date()): Array<{ inicio: string; fechamento: string }> {
    let fechamento = statementCloseOnOrBefore(hoje, closingDay)
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
export function ConferirFaturaWireframe({
    card,
    transactions,
    workspaceId,
    userId,
    onMudou,
}: {
    card: Pick<CreditCard, "id" | "closing_day" | "holder_user_id">
    transactions: CcTxAnalyticsRow[]
    workspaceId: string
    userId: string
    /** A tela recarrega os lançamentos do cartão depois de importar. */
    onMudou?: () => void | Promise<void>
}) {
    const queryClient = useQueryClient()
    const { papel } = useWorkspace()
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
    // O texto do PDF já redigido: "Ler com IA" o envia sem reler o arquivo nem pedir a senha de novo.
    const [textoPdf, setTextoPdf] = useState<string | null>(null)
    // Cada pedido à IA ganha um número; trocar de arquivo, de ciclo ou sair da
    // tela o muda, e a resposta atrasada de um pedido velho é jogada fora.
    const pedido = useRef(0)
    useEffect(() => {
        const atual = pedido
        return () => {
            atual.current += 1
        }
    }, [])

    const [leitura, setLeitura] = useState<Leitura | null>(null)
    // O clientId nasce uma vez por leitura e fica aqui: repetir o envio não duplica (Foco 3).
    const [itens, setItens] = useState<ItemImportavel[]>([])
    const [batchId, setBatchId] = useState("")
    // A leitura (pelo batchId) já aprovada: a aprovação automática roda uma vez por leitura.
    const aprovadaNaLeitura = useRef<string | null>(null)
    // O lote das correções aplicadas mora aqui: o Desfazer fica enquanto a pessoa está na tela,
    // também quando a fatura vira "100% igual" e o CorrigirFatura sai.
    const [aplicado, setAplicado] = useState<{ lote: LoteAplicado; aplicadas: number } | null>(null)

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
                        subscription_id: t.subscription_id ?? null,
                    },
                ]
            }),
        [transactions, card.id],
    )

    const conferencia = useMemo(
        () => (leitura ? conferirNoCiclo(itens, doApp, ciclo) : null),
        [leitura, itens, doApp, ciclo],
    )
    const igualAoBanco = Boolean(leitura?.completa && conferencia && semDiferencas(conferencia, ciclo))
    const estado = estadoDaFatura(totalDoCiclo(totais.data, card.id, ciclo.fechamento), somaDoCiclo(doApp, ciclo))

    useEffect(() => {
        if (!igualAoBanco || !leitura || !conferencia || aprovadaNaLeitura.current === batchId) return
        aprovadaNaLeitura.current = batchId
        // Trocar de ciclo ou de arquivo muda o pedido: a resposta velha é jogada fora.
        const meu = pedido.current
        void aprovarFatura(supabase, {
            workspaceId,
            userId,
            cardId: card.id,
            fechamento: ciclo.fechamento,
            bankTotal: leitura.total ?? conferencia.somaBanco,
            source: leitura.origem,
        })
            .then(async (r) => {
                // O erro não tenta de novo: o ref já marcou a leitura.
                if (!r.ok) {
                    if (meu === pedido.current) setAviso({ erro: true, texto: `Não foi possível aprovar a fatura: ${r.erro}` })
                    return
                }
                await queryClient.invalidateQueries({ queryKey: statementTotalsKeys.list(workspaceId) })
            })
            .catch(() => {
                if (meu === pedido.current) setAviso({ erro: true, texto: "Não foi possível aprovar a fatura." })
            })
    }, [igualAoBanco, leitura, conferencia, batchId, workspaceId, userId, card.id, ciclo.fechamento, queryClient])

    function limparLeitura() {
        pedido.current += 1
        setTextoPdf(null)
        setLeitura(null)
        setItens([])
        setCsv(null)
        setArquivoPdf(null)
        setSenhaPedida(null)
        setSenha("")
        setAplicado(null)
    }

    async function recarregar() {
        await invalidateWorkspaceData(queryClient, workspaceId, { domains: ["transactions"] })
        await onMudou?.()
    }

    async function desfazer() {
        if (!aplicado) return
        setPendente("desfazer")
        setAviso(null)
        try {
            const r = await desfazerCorrecoes(supabase, aplicado.lote)
            if (r.ok) setAplicado(null)
            else setAviso({ erro: true, texto: r.erro })
            await recarregar()
        } catch {
            setAviso({ erro: true, texto: "O desfazer não terminou. Confira a fatura de novo." })
        } finally {
            setPendente(null)
        }
    }

    function aplicar(lidos: ItemBanco[], l: Leitura) {
        setLeitura(l)
        setItens(prepararItens(lidos, transactions))
        setBatchId(crypto.randomUUID())
    }

    async function gravarTotal(valor: number, source: "manual" | Origem) {
        setPendente("total")
        setAviso(null)
        const { data, error } = await supabase
            .from("credit_card_statement_totals")
            .upsert(
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
            .select("id")
            .single()
        if (error) {
            setPendente(null)
            setAviso({ erro: true, texto: `Não foi possível gravar o total: ${error.message}` })
            return
        }
        await queryClient.invalidateQueries({ queryKey: statementTotalsKeys.list(workspaceId) })
        const gravado = `Total do banco gravado: ${currencyBRL(valor)}.`
        // O PDF lido vira anexo do total, digitado ou lido. Falhar aqui não desfaz o total.
        const erroPdf = arquivoPdf && leitura?.origem === "pdf" ? await anexarPdf(arquivoPdf, data.id) : null
        setPendente(null)
        setAviso(
            erroPdf
                ? { erro: true, texto: `${gravado} O PDF não foi anexado: ${erroPdf}` }
                : { erro: false, texto: gravado },
        )
    }

    /** Devolve o erro, ou null. O mesmo PDF já anexado a este total não sobe de novo. */
    async function anexarPdf(arquivo: File, statementTotalId: string): Promise<string | null> {
        try {
            const ja = await listarAnexos(supabase, { statementTotalId })
            if (ja.some((a) => a.size_bytes === arquivo.size)) return null
            const r = await enviarAnexo(supabase, { workspaceId }, arquivo, { statementTotalId })
            return r.ok ? null : r.erro
        } catch (e) {
            return e instanceof Error && e.message ? e.message : "erro inesperado."
        }
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
            const redigido = removerIdentificacao(r.texto)
            setTextoPdf(redigido)
            const l = extrairItensDaFatura(redigido, { fechamento: ciclo.fechamento })
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

    async function lerComIA() {
        if (!leitura || !textoPdf || pendente != null) return
        const total = leitura.total
        const meu = ++pedido.current
        setPendente("ia")
        setAviso(null)
        const lido = await lerFaturaComIA(workspaceId, textoPdf, ciclo.fechamento)
        // Nada mais fica pendente enquanto a IA lê (o arquivo e a IA travam), então só ela solta.
        setPendente((p) => (p === "ia" ? null : p))
        if (meu !== pedido.current) return
        if (!lido.ok) {
            setAviso({ erro: true, texto: lido.mensagem })
            return
        }
        const novos = itensDaIA(lido.itens)
        if (novos.length === 0) {
            setAviso({ erro: true, texto: "A IA não achou itens nesta fatura. Confira à mão." })
            return
        }
        aplicar(novos, { origem: "pdf", total, ...releitura(total, novos), ignoradas: 0, ia: true })
    }

    function onAbrirComSenha(e: FormEvent<HTMLFormElement>) {
        e.preventDefault()
        if (arquivoPdf) void lerPdf(arquivoPdf, senha)
    }

    function onLerCsv({ itens: lidos, ignoradas }: { itens: ItemBanco[]; ignoradas: number }) {
        aplicar(lidos, { origem: "csv", total: somaComEstorno(lidos), completa: true, diferenca: 0, ignoradas })
    }

    // Num cartão com titular, a conferência é do titular e do dono (a RLS dos
    // totais e do PDF diz o mesmo).
    if (card.holder_user_id && card.holder_user_id !== userId && papel !== "owner") {
        return (
            <WireframeBox bloco={2} titulo="Conferir fatura">
                <p>Só o titular do cartão e o dono da carteira conferem esta fatura.</p>
            </WireframeBox>
        )
    }

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
            {estado.tipo === "sem-total" ? null : (
                <p>
                    {estado.tipo === "aprovada"
                        ? `Aprovada em ${formatYmdPtBr(transactionLocalYmd(estado.em) ?? estado.em)}`
                        : estado.tipo === "mudou-depois"
                          ? `Mudou depois da aprovação: diferença ${currencyBRL(estado.diferenca)}`
                          : estado.tipo === "igual"
                            ? "Igual ao banco"
                            : `Diferença ${currencyBRL(estado.diferenca)}`}
                </p>
            )}

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

            {csv ? <MapeamentoCsv linhas={csv} onLer={onLerCsv} /> : null}

            {leitura && conferencia ? (
                <div className="space-y-2">
                    <p>
                        {leitura.ia ? "Lido pela IA · " : ""}Total lido: {leitura.total != null ? currencyBRL(leitura.total) : "não achado"} · soma dos
                        itens: {currencyBRL(somaComEstorno(itens))} ·{" "}
                        {leitura.completa
                            ? "leitura completa"
                            : `leitura INCOMPLETA${leitura.diferenca != null ? ` (diferença ${currencyBRL(leitura.diferenca)})` : ""}`}
                        {leitura.ignoradas ? ` · ${leitura.ignoradas} linha(s) ignorada(s)` : ""}
                    </p>
                    {leitura.origem === "pdf" && leitura.completa === false && !leitura.ia && textoPdf ? (
                        <button type="button" className={botao} disabled={pendente != null} onClick={() => void lerComIA()}>
                            {pendente === "ia" ? "Lendo com IA…" : "Ler com IA"}
                        </button>
                    ) : null}
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
                    {igualAoBanco ? (
                        <p role="status">
                            100% igual ao banco · App {currencyBRL(conferencia.somaApp)} · Banco{" "}
                            {currencyBRL(leitura.total ?? conferencia.somaBanco)}
                        </p>
                    ) : (
                        <CorrigirFatura
                            conferencia={conferencia}
                            ciclo={ciclo}
                            ctx={{
                                userId,
                                workspaceId,
                                cardId: card.id,
                                ciclo,
                                source: leitura.origem === "pdf" ? "import_pdf" : "import_statement",
                                batchId,
                            }}
                            ocupado={pendente != null}
                            onAplicado={async (lote, aplicadas) => {
                                setAplicado({ lote, aplicadas })
                                await recarregar()
                            }}
                        />
                    )}
                    {aplicado ? (
                        <p role="status" className="flex flex-wrap items-center gap-2">
                            {aplicado.aplicadas} correções aplicadas.
                            <button type="button" className={botao} disabled={pendente != null} onClick={() => void desfazer()}>
                                {pendente === "desfazer" ? "Desfazendo…" : "Desfazer"}
                            </button>
                        </p>
                    ) : null}
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
