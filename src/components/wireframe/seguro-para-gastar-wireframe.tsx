"use client"

import Link from "next/link"
import { useMemo, useState, type FormEvent } from "react"

import { WireframeBox } from "@/components/wireframe/wireframe-box"
import { useWorkspace } from "@/components/workspace-provider"
import { ROUTES } from "@/config/navigation"
import { currencyBRL } from "@/lib/formatters"
import { seguroParaGastar } from "@/lib/previsao/fluxo"
import type { Seguro } from "@/lib/previsao/tipos"
import { usePrevisao } from "@/lib/previsao/use-previsao"
import { supabase } from "@/lib/supabase"
import { formatSupabasePostgrestError } from "@/lib/supabase-errors"
import { formatDatePtBr, localYmdFromDate } from "@/lib/transaction-date"

const botao = "border border-muted-foreground/60 px-2 py-1 font-mono text-foreground disabled:opacity-50"
const link = "text-foreground underline"
const REGIME = "Caixa: o dinheiro que sai neste mês. A fatura conta no mês em que vence."

/** O "seguro para gastar" do mês corrente (Bloco 5). `compacto` é o cartão do Painel. */
export function SeguroParaGastarWireframe({ seguro, compacto = false }: { seguro: Seguro; compacto?: boolean }) {
    return (
        <WireframeBox bloco={5} titulo="Seguro para gastar">
            <p className="text-base text-foreground">
                Seguro para gastar: <strong>{currencyBRL(seguro.seguro)}</strong>
            </p>
            <p>
                {currencyBRL(seguro.porDia)} por dia ({seguro.diasRestantes} dias, contando hoje)
            </p>
            <p>{REGIME}</p>
            {compacto ? (
                <Link href={ROUTES.PREVISAO} className={link}>
                    Ver a previsão
                </Link>
            ) : (
                <>
                    <ul className="space-y-1">
                        <li>
                            Receitas: {currencyBRL(seguro.receitas.recebidas)} recebidas +{" "}
                            {currencyBRL(seguro.receitas.previstas)} previstas
                        </li>
                        <li>
                            Despesas fora do cartão: {currencyBRL(seguro.despesas.pagas)} pagas +{" "}
                            {currencyBRL(seguro.despesas.previstas)} previstas
                        </li>
                        {seguro.faturas.length === 0 ? <li>Nenhuma fatura vence neste mês.</li> : null}
                        {seguro.faturas.map((f) => (
                            <li key={`${f.cardId}:${f.closeYmd}`}>
                                Fatura {f.nome} (vence {formatDatePtBr(f.dueYmd)}): {currencyBRL(f.total)} prevista
                                {f.paga ? " · paga" : ""}
                                {f.usaTotalDoBanco ? " · total do banco" : ""}
                            </li>
                        ))}
                        <li>Reserva: − {currencyBRL(seguro.reserva)}</li>
                        <li>
                            Sobra do mês: {currencyBRL(seguro.sobra)} (entra {currencyBRL(seguro.entra)}, sai{" "}
                            {currencyBRL(seguro.sai)})
                        </li>
                    </ul>
                    <p>Já comprometido na próxima fatura: {currencyBRL(seguro.comprometidoNaProximaFatura)}</p>
                    {seguro.contasSemValor.length > 0 ? (
                        <p>Contas sem valor: {seguro.contasSemValor.join(", ")}</p>
                    ) : null}
                    <CampoDaReserva />
                </>
            )}
        </WireframeBox>
    )
}

/** `workspaces.monthly_savings_target`: só o dono altera (política de `update` de `workspaces`). */
function CampoDaReserva() {
    const { currentWorkspace, isWorkspaceOwner, refreshWorkspaces } = useWorkspace()
    const dono = currentWorkspace ? isWorkspaceOwner(currentWorkspace.id) : false
    const atual = currentWorkspace?.monthly_savings_target
    const [valor, setValor] = useState(atual != null ? String(atual) : "")
    const [salvando, setSalvando] = useState(false)
    const [erro, setErro] = useState<string | null>(null)

    async function salvar(e: FormEvent<HTMLFormElement>) {
        e.preventDefault()
        if (!currentWorkspace) return
        setSalvando(true)
        setErro(null)
        const { data, error } = await supabase
            .from("workspaces")
            .update({ monthly_savings_target: valor.trim() === "" ? null : Number(valor) })
            .eq("id", currentWorkspace.id)
            .select("id")
        if (error) setErro(formatSupabasePostgrestError(error) ?? "Não foi possível salvar a reserva.")
        else if (!data?.length) setErro("Só quem é dono da carteira altera a reserva.")
        else await refreshWorkspaces()
        setSalvando(false)
    }

    return (
        <form onSubmit={salvar} className="space-y-1">
            <label className="block">
                Reserva do mês (R$){" "}
                <input
                    type="number"
                    min={0}
                    step={0.01}
                    inputMode="decimal"
                    value={valor}
                    onChange={(e) => setValor(e.target.value)}
                    disabled={!dono || salvando}
                    className="w-32 border border-muted-foreground/60 bg-transparent px-1 text-foreground"
                />
            </label>
            {dono ? (
                <button type="submit" disabled={salvando} className={botao}>
                    {salvando ? "Salvando…" : "Salvar reserva"}
                </button>
            ) : (
                <p>Só quem é dono da carteira altera a reserva.</p>
            )}
            {erro ? <p role="alert">{erro}</p> : null}
        </form>
    )
}

/** O cartão compacto do Painel: só no mês de hoje, porque a previsão é do mês corrente. */
export function SeguroDoPainelWireframe({ workspaceId, calendarYm }: { workspaceId: string | null; calendarYm: string }) {
    const mesCorrente = calendarYm === localYmdFromDate(new Date()).slice(0, 7)
    const { dados, carregando, erro } = usePrevisao(mesCorrente ? workspaceId : null)
    const seguro = useMemo(() => (dados ? seguroParaGastar(dados) : null), [dados])

    if (mesCorrente && seguro) return <SeguroParaGastarWireframe seguro={seguro} compacto />
    return (
        <WireframeBox bloco={5} titulo="Seguro para gastar">
            {!mesCorrente ? <p>A previsão é do mês corrente.</p> : null}
            {mesCorrente && erro ? <p role="alert">{erro}</p> : null}
            {mesCorrente && !erro && carregando ? <p>Carregando…</p> : null}
            <Link href={ROUTES.PREVISAO} className={link}>
                Ver a previsão
            </Link>
        </WireframeBox>
    )
}
