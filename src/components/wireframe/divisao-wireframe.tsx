"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useState, type FormEvent } from "react"

import { useAuth } from "@/components/providers"
import { WireframeBox } from "@/components/wireframe/wireframe-box"
import { useWorkspace } from "@/components/workspace-provider"
import {
    apagarAcerto,
    criarAcerto,
    lerSaldos,
    listarAcertos,
} from "@/lib/divisao/dados"
import {
    acertoEhMeu,
    emCentavos,
    pesosDigitados,
    pessoasDoAcerto,
    sugestaoDeAcerto,
    textoDoSaldo,
} from "@/lib/divisao/partes"
import { chaves, useAdultos } from "@/lib/divisao/use-adultos"
import { currencyBRL } from "@/lib/formatters"
import { formatMoneyBrlInput, parseMoneyBrl } from "@/lib/money-brl"
import { AINDA_NAO_DISPONIVEL } from "@/lib/projetos/dados"
import type { Workspace } from "@/lib/supabase"
import { NADA_MUDOU } from "@/lib/supabase-errors"
import { formatDatePtBr, localYmdFromDate } from "@/lib/transaction-date"

const botao = "border border-muted-foreground/60 px-2 py-1 font-mono text-foreground disabled:opacity-50"
const campo = "border border-muted-foreground/60 bg-transparent px-2 py-1 font-mono text-foreground"

function mensagem(e: unknown): string {
    return e instanceof Error ? e.message : "Não foi possível salvar."
}

/** A carteira atual divide (`split`) e quem lê é adulto: só então a divisão aparece. */
function useDivisao(): Workspace | null {
    const { currentWorkspace, isAdulto } = useWorkspace()
    return currentWorkspace?.split_mode === "split" && isAdulto ? currentWorkspace : null
}

/**
 * "Quem pagou" do formulário de despesa (Decisão 4): só numa carteira
 * dividida, só para o adulto, e só entre os adultos. O padrão é quem lança; o
 * salvar só manda a escolha quando ela muda alguma coisa.
 */
export function QuemPagouWireframe({ valor, onChange }: { valor: string; onChange: (id: string) => void }) {
    const ws = useDivisao()
    if (!ws) return null
    return <QuemPagou ws={ws.id} valor={valor} onChange={onChange} />
}

function QuemPagou({ ws, valor, onChange }: { ws: string; valor: string; onChange: (id: string) => void }) {
    const { lista } = useAdultos(ws)
    return (
        <WireframeBox bloco={7} titulo="Quem pagou">
            <label className="flex flex-col">
                Quem pagou
                <select className={campo} value={valor} onChange={(e) => onChange(e.target.value)}>
                    {lista.some((a) => a.user_id === valor) ? null : <option value={valor}>Você</option>}
                    {lista.map((a) => (
                        <option key={a.user_id} value={a.user_id}>
                            {a.nome}
                        </option>
                    ))}
                </select>
            </label>
            <p>A despesa vira partes entre os adultos; quem pagou fica com o crédito no saldo.</p>
        </WireframeBox>
    )
}

/**
 * Os pesos de uma parcelada nova (Ruling 6): `null` usa os da carteira. Com
 * pesos próprios, o formulário os grava no plano logo depois de criá-lo.
 */
export function PesosDaParceladaWireframe({
    valor,
    onChange,
}: {
    valor: Record<string, string> | null
    onChange: (v: Record<string, string> | null) => void
}) {
    const ws = useDivisao()
    if (!ws) return null
    return <PesosDaParcelada ws={ws.id} valor={valor} onChange={onChange} />
}

function PesosDaParcelada({
    ws,
    valor,
    onChange,
}: {
    ws: string
    valor: Record<string, string> | null
    onChange: (v: Record<string, string> | null) => void
}) {
    const { lista } = useAdultos(ws)
    return (
        <WireframeBox bloco={7} titulo="Pesos desta parcelada">
            <label className="flex items-center gap-2 text-foreground">
                <input
                    type="checkbox"
                    checked={valor != null}
                    onChange={(e) => onChange(e.target.checked ? Object.fromEntries(lista.map((a) => [a.user_id, "1"])) : null)}
                />
                Pesos próprios nesta compra
            </label>
            {valor == null ? <p>Sem marcar, as parcelas dividem pelos pesos da carteira.</p> : null}
            {valor != null
                ? lista.map((a) => (
                      <label key={a.user_id} className="flex items-center gap-2">
                          {a.nome}
                          <input
                              className={campo}
                              inputMode="decimal"
                              value={valor[a.user_id] ?? ""}
                              onChange={(e) => onChange({ ...valor, [a.user_id]: e.target.value })}
                          />
                      </label>
                  ))
                : null}
            {valor != null && !pesosDigitados(valor) ? <p role="alert">Cada peso precisa ser maior que zero.</p> : null}
        </WireframeBox>
    )
}

/**
 * O saldo da carteira dividida no Painel, só para os adultos: a lista do
 * `saldos_da_carteira` (quem saiu também, marcado), a sugestão de quem paga
 * quem, o "Acertar" que grava em `settlements` e o histórico, onde cada um
 * apaga só o que lançou.
 */
export function SaldoEAcertoWireframe() {
    const ws = useDivisao()
    if (!ws) return null
    return <SaldoEAcerto key={ws.id} ws={ws.id} />
}

function SaldoEAcerto({ ws }: { ws: string }) {
    const { user } = useAuth()
    const meuId = user?.id ?? ""
    const queryClient = useQueryClient()
    const { lista, nome } = useAdultos(ws)
    const saldos = useQuery({
        queryKey: chaves.saldos(ws),
        queryFn: async () => {
            const [s, a] = await Promise.all([lerSaldos(ws), listarAcertos(ws)])
            return s.disponivel && a.disponivel ? { saldos: s.dados ?? [], acertos: a.dados ?? [] } : null
        },
    })
    const [de, setDe] = useState("")
    const [para, setPara] = useState("")
    const [valor, setValor] = useState("")
    const [data, setData] = useState(() => localYmdFromDate(new Date()))
    const [nota, setNota] = useState("")
    const [pendente, setPendente] = useState(false)
    const [aviso, setAviso] = useState<string | null>(null)

    // Ruling 8: quem saiu mas está no saldo entra no acerto, com o próprio rótulo.
    const pessoas = pessoasDoAcerto(lista, saldos.data?.saldos ?? [])
    const nomeDe = (id: string) => pessoas.find((p) => p.user_id === id)?.nome ?? nome(id)
    const atualizar = () => queryClient.invalidateQueries({ queryKey: chaves.saldos(ws) })

    async function onSubmit(e: FormEvent) {
        e.preventDefault()
        const reais = parseMoneyBrl(valor)
        if (!de || !para || de === para) return setAviso("Escolha duas pessoas diferentes.")
        if (!acertoEhMeu(meuId, de, para)) return setAviso("Você precisa ser uma das duas pessoas do acerto.")
        if (reais == null || reais <= 0) return setAviso("Informe um valor maior que zero.")
        setPendente(true)
        setAviso(null)
        try {
            const r = await criarAcerto({
                workspace_id: ws,
                from_user: de,
                to_user: para,
                amount: reais,
                settled_on: data,
                note: nota.trim() || null,
            })
            if (!r.disponivel) return setAviso(AINDA_NAO_DISPONIVEL)
            setValor("")
            setNota("")
            await atualizar()
            setAviso("Acerto registrado.")
        } catch (erro) {
            setAviso(mensagem(erro))
        } finally {
            setPendente(false)
        }
    }

    async function apagar(id: string) {
        if (!window.confirm("Apagar este acerto? O saldo volta a contar sem ele.")) return
        setAviso(null)
        try {
            const r = await apagarAcerto(id)
            if (!r.disponivel) return setAviso(AINDA_NAO_DISPONIVEL)
            if (!r.dados?.length) return setAviso(NADA_MUDOU)
            await atualizar()
        } catch (erro) {
            setAviso(mensagem(erro))
        }
    }

    const sugestoes = saldos.data
        ? sugestaoDeAcerto(saldos.data.saldos.map((s) => ({ user_id: s.user_id, saldoCentavos: emCentavos(s.saldo) })))
        : []

    return (
        <WireframeBox bloco={7} titulo="Saldo e acerto">
            {saldos.isLoading ? <p>Carregando…</p> : null}
            {saldos.error ? <p role="alert">{mensagem(saldos.error)}</p> : null}
            {saldos.data === null ? <p>{AINDA_NAO_DISPONIVEL}</p> : null}
            {saldos.data ? (
                <>
                    <ul>
                        {saldos.data.saldos.map((s) => (
                            <li key={s.user_id}>
                                <span className="text-foreground">
                                    {textoDoSaldo(emCentavos(s.saldo), nomeDe(s.user_id), meuId, s.user_id)}
                                </span>
                                {s.saiu ? " · saiu da carteira" : ""}
                                {` · pagou ${currencyBRL(Number(s.pago))}; partes ${currencyBRL(Number(s.partes))}; acertos ${currencyBRL(Number(s.acertos))}`}
                            </li>
                        ))}
                    </ul>
                    <p className="text-foreground">Sugestão de acerto</p>
                    {sugestoes.length === 0 ? <p>Todo mundo está em dia.</p> : null}
                    <ul>
                        {sugestoes.map((s) => (
                            <li key={`${s.de}:${s.para}`} className="flex flex-wrap items-center gap-2">
                                {nomeDe(s.de)} paga {currencyBRL(s.centavos / 100)} a {nomeDe(s.para)}
                                {acertoEhMeu(meuId, s.de, s.para) ? (
                                    <button
                                        type="button"
                                        className={botao}
                                        onClick={() => {
                                            setDe(s.de)
                                            setPara(s.para)
                                            setValor(formatMoneyBrlInput(s.centavos / 100))
                                        }}
                                    >
                                        Usar esta sugestão
                                    </button>
                                ) : (
                                    <span>(quem registra é quem paga ou quem recebe)</span>
                                )}
                            </li>
                        ))}
                    </ul>

                    <form onSubmit={(e) => void onSubmit(e)} className="flex flex-col gap-2">
                        <p className="text-foreground">Acertar</p>
                        <label className="flex flex-col">
                            Quem pagou
                            <select className={campo} value={de} onChange={(e) => setDe(e.target.value)} required>
                                <option value="">Escolha</option>
                                {pessoas.map((a) => (
                                    <option key={a.user_id} value={a.user_id}>
                                        {a.nome}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="flex flex-col">
                            Para quem
                            <select className={campo} value={para} onChange={(e) => setPara(e.target.value)} required>
                                <option value="">Escolha</option>
                                {pessoas.map((a) => (
                                    <option key={a.user_id} value={a.user_id}>
                                        {a.nome}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="flex flex-col">
                            Valor em R$
                            <input className={campo} inputMode="decimal" placeholder="0,00" value={valor} onChange={(e) => setValor(e.target.value)} required />
                        </label>
                        <label className="flex flex-col">
                            Data
                            <input className={campo} type="date" value={data} onChange={(e) => setData(e.target.value)} required />
                        </label>
                        <label className="flex flex-col">
                            Nota (opcional)
                            <input className={campo} value={nota} onChange={(e) => setNota(e.target.value)} />
                        </label>
                        <div>
                            <button type="submit" className={botao} disabled={pendente}>
                                {pendente ? "Acertando…" : "Acertar"}
                            </button>
                        </div>
                    </form>

                    <p className="text-foreground">Acertos</p>
                    {saldos.data.acertos.length === 0 ? <p>Nenhum acerto ainda.</p> : null}
                    <ul>
                        {saldos.data.acertos.map((a) => (
                            <li key={a.id} className="flex flex-wrap items-center gap-2">
                                {formatDatePtBr(a.settled_on)}: {nomeDe(a.from_user)} pagou {currencyBRL(Number(a.amount))} a{" "}
                                {nomeDe(a.to_user)}
                                {a.note ? ` (${a.note})` : ""}
                                {a.created_by === meuId ? (
                                    <button type="button" className={botao} onClick={() => void apagar(a.id)}>
                                        Apagar
                                    </button>
                                ) : null}
                            </li>
                        ))}
                    </ul>
                </>
            ) : null}
            {aviso ? <p role="status">{aviso}</p> : null}
        </WireframeBox>
    )
}
