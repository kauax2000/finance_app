"use client"

import { useEffect, useState } from "react"

import { useMonthInHeader } from "@/components/categories/categories-toolbar"
import { useQuickCreateTransaction } from "@/components/layout/quick-actions"
import { useAuth } from "@/components/providers"
import { useWorkspace } from "@/components/workspace-provider"
import { WireframeBox } from "@/components/wireframe/wireframe-box"
import { formatYearMonth, labelYearMonthPt, periodBoundsFromYearMonth } from "@/lib/budget-month"
import { currencyBRL } from "@/lib/formatters"
import { gastoDaPessoaNoMes, lerLancamentosDoMes, lerLimites, nivelDoLimite } from "@/lib/limites/limites"
import { fetchAllRows } from "@/lib/queries/fetch-all-rows"
import { supabase } from "@/lib/supabase"
import { formatTransactionDmyPtBr } from "@/lib/transaction-date"
import { FINANCE_TRANSACTIONS_MUTATED_EVENT } from "@/lib/workspace-data-events"

const botao = "border border-muted-foreground/60 px-2 py-1 font-mono text-foreground disabled:opacity-50"

/** Quantas transações do mês a lista mostra. */
const ULTIMAS = 10

type TxDoPainel = { id: string; description: string | null; amount: number; type: string; date: string }

type Dados = {
    /** Em reais; `null` sem limite. */
    limite: number | null
    gastoCentavos: number
    despesas: number
    receitas: number
    ultimas: TxDoPainel[]
}

/**
 * O Painel do convidado (Bloco 7A, spec §12): o limite dele, o total do mês,
 * as transações dele e "Lançar despesa". A RLS só devolve o que é dele (a
 * linha do limite e as transações de que é autor), e nada da casa é pedido.
 */
export function ConvidadoPainelWireframe() {
    const { user } = useAuth()
    const { currentWorkspaceId } = useWorkspace()
    const lancar = useQuickCreateTransaction()
    const [ym, setYm] = useState(() => formatYearMonth(new Date()))
    const [dados, setDados] = useState<Dados | null>(null)
    const [erro, setErro] = useState<string | null>(null)
    const [versao, setVersao] = useState(0)
    // O calendário do cabeçalho do telefone, como no Painel da casa (a rota o declara).
    useMonthInHeader({ budgetMonthYm: ym, onBudgetMonthYmChange: setYm })

    useEffect(() => {
        const recarregar = () => setVersao((v) => v + 1)
        window.addEventListener(FINANCE_TRANSACTIONS_MUTATED_EVENT, recarregar)
        return () => window.removeEventListener(FINANCE_TRANSACTIONS_MUTATED_EVENT, recarregar)
    }, [])

    const userId = user?.id ?? null
    useEffect(() => {
        if (!currentWorkspaceId || !userId) return
        let vivo = true
        const { period_start, period_end } = periodBoundsFromYearMonth(ym)
        Promise.all([
            lerLimites(currentWorkspaceId),
            lerLancamentosDoMes(currentWorkspaceId, ym),
            fetchAllRows<TxDoPainel>((from, to) =>
                supabase
                    .from("transactions")
                    .select("id,description,amount,type,date")
                    .eq("workspace_id", currentWorkspaceId)
                    .eq("user_id", userId)
                    .gte("date", `${period_start}T00:00:00.000Z`)
                    .lte("date", `${period_end}T23:59:59.999Z`)
                    .order("date", { ascending: false })
                    .order("id")
                    .range(from, to),
            ),
        ]).then(
            ([limites, lancs, doMes]) => {
                if (!vivo) return
                const meu = limites.find((l) => l.user_id === userId)
                const soma = (tipo: string) => doMes.filter((t) => t.type === tipo).reduce((s, t) => s + Number(t.amount || 0), 0)
                setDados({
                    limite: meu ? Number(meu.amount) : null,
                    gastoCentavos: gastoDaPessoaNoMes(lancs, userId, ym),
                    despesas: soma("expense"),
                    receitas: soma("income"),
                    ultimas: doMes.slice(0, ULTIMAS),
                })
                setErro(null)
            },
            (e: unknown) => {
                if (vivo) setErro(e instanceof Error ? e.message : "Não foi possível carregar o seu painel.")
            },
        )
        return () => {
            vivo = false
        }
    }, [currentWorkspaceId, userId, ym, versao])

    const nivel = dados?.limite == null ? 0 : nivelDoLimite(dados.gastoCentavos, Math.round(dados.limite * 100))

    return (
        <WireframeBox bloco={7} titulo="Painel do convidado">
            <div className="flex flex-wrap items-center gap-2">
                <label>
                    Mês{" "}
                    <input
                        type="month"
                        value={ym}
                        onChange={(e) => e.target.value && setYm(e.target.value)}
                        className="border border-muted-foreground/60 bg-transparent px-1 text-foreground"
                    />
                </label>
                <button type="button" className={botao} onClick={() => lancar("expense")}>
                    Lançar despesa
                </button>
            </div>

            {erro ? (
                <p role="alert">{erro}</p>
            ) : !dados ? (
                <p role="status">Carregando…</p>
            ) : (
                <>
                    <section aria-label="Seu limite" className="space-y-1">
                        <p className="font-bold">Seu limite em {labelYearMonthPt(ym)}</p>
                        <p className="text-foreground">
                            {dados.limite == null
                                ? `Sem limite definido · ${currencyBRL(dados.gastoCentavos / 100)} gastos`
                                : `${currencyBRL(dados.gastoCentavos / 100)} de ${currencyBRL(dados.limite)}${nivel ? ` (passou de ${nivel}%)` : ""}`}
                        </p>
                        <p>A compra no crédito conta no mês do fechamento da fatura.</p>
                    </section>

                    <section aria-label="Total do mês" className="space-y-1 border-t border-dashed border-muted-foreground/60 pt-2">
                        <p className="font-bold">Total do mês</p>
                        <p className="text-foreground">
                            Despesas {currencyBRL(dados.despesas)} · Receitas {currencyBRL(dados.receitas)}
                        </p>
                    </section>

                    <section aria-label="Suas transações" className="space-y-1 border-t border-dashed border-muted-foreground/60 pt-2">
                        <p className="font-bold">Suas últimas transações</p>
                        {dados.ultimas.length === 0 ? (
                            <p>Nenhuma transação sua neste mês.</p>
                        ) : (
                            <ul className="space-y-1">
                                {dados.ultimas.map((t) => (
                                    <li key={t.id} className="flex justify-between gap-2 text-foreground">
                                        <span className="min-w-0 truncate">
                                            {formatTransactionDmyPtBr(t.date)} · {t.description || "Sem descrição"}
                                        </span>
                                        <span className="shrink-0">
                                            {t.type === "income" ? "+" : "−"}
                                            {currencyBRL(Number(t.amount || 0))}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>
                </>
            )}
        </WireframeBox>
    )
}
