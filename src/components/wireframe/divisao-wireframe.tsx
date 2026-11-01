"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useState, type FormEvent } from "react"

import { useAuth } from "@/components/providers"
import { WireframeBox } from "@/components/wireframe/wireframe-box"
import { useWorkspace } from "@/components/workspace-provider"
import {
    apagarAcerto,
    criarAcerto,
    definirPartes,
    gravarModo,
    gravarPesos,
    lerAdultos,
    lerPartes,
    lerPesos,
    lerSaldos,
    listarAcertos,
    type Adulto,
} from "@/lib/divisao/dados"
import {
    acertoEhMeu,
    emCentavos,
    lerPeso,
    partesFecham,
    pesosDigitados,
    pessoasDoAcerto,
    sugestaoDeAcerto,
    textoDoSaldo,
} from "@/lib/divisao/partes"
import { currencyBRL } from "@/lib/formatters"
import { formatMoneyBrlInput, parseMoneyBrl } from "@/lib/money-brl"
import { AINDA_NAO_DISPONIVEL } from "@/lib/projetos/dados"
import type { Transaction, Workspace } from "@/lib/supabase"
import { NADA_MUDOU } from "@/lib/supabase-errors"
import { formatDatePtBr, localYmdFromDate } from "@/lib/transaction-date"

const botao = "border border-muted-foreground/60 px-2 py-1 font-mono text-foreground disabled:opacity-50"
const campo = "border border-muted-foreground/60 bg-transparent px-2 py-1 font-mono text-foreground"

const PARTES_NAO_FECHAM = "As partes precisam somar o valor da despesa."
const QUEM_SAIU = "Ex-membro"

const chaves = {
    adultos: (ws: string) => ["divisao", "adultos", ws] as const,
    partes: (id: string) => ["divisao", "partes", id] as const,
    pesos: (ws: string) => ["divisao", "pesos", ws] as const,
    saldos: (ws: string) => ["divisao", "saldos", ws] as const,
}

function mensagem(e: unknown): string {
    return e instanceof Error ? e.message : "Não foi possível salvar."
}

/** A carteira atual divide (`split`) e quem lê é adulto: só então a divisão aparece. */
function useDivisao(): Workspace | null {
    const { currentWorkspace, isAdulto } = useWorkspace()
    return currentWorkspace?.split_mode === "split" && isAdulto ? currentWorkspace : null
}

function useAdultos(workspaceId: string) {
    const q = useQuery({ queryKey: chaves.adultos(workspaceId), queryFn: () => lerAdultos(workspaceId), staleTime: 60_000 })
    const nome = (id: string | null | undefined) => q.data?.find((a) => a.user_id === id)?.nome ?? QUEM_SAIU
    return { lista: q.data ?? [], nome }
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
 * As partes de uma despesa na folha de detalhe: sempre as de
 * `transaction_shares`. O adulto as edita à mão (o editor só confere que
 * fecham antes do `definir_partes`) e volta ao automático.
 */
export function PartesDaDespesaWireframe({ transaction }: { transaction: Transaction }) {
    const ws = useDivisao()
    if (!ws || transaction.workspace_id !== ws.id || transaction.type !== "expense") return null
    return <Partes key={transaction.id} t={transaction} ws={ws.id} />
}

function Partes({ t, ws }: { t: Transaction; ws: string }) {
    const queryClient = useQueryClient()
    const { lista, nome } = useAdultos(ws)
    const partes = useQuery({ queryKey: [...chaves.partes(t.id), t.amount, t.updated_at], queryFn: () => lerPartes(t.id) })
    const [editando, setEditando] = useState<Record<string, string> | null>(null)
    const [pendente, setPendente] = useState(false)
    const [aviso, setAviso] = useState<string | null>(null)
    const total = emCentavos(t.amount)

    async function gravar(valores: { user_id: string; amount: number }[] | null) {
        setPendente(true)
        setAviso(null)
        try {
            const r = await definirPartes(t.id, valores)
            if (!r.disponivel) return setAviso(AINDA_NAO_DISPONIVEL)
            setEditando(null)
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: chaves.partes(t.id) }),
                queryClient.invalidateQueries({ queryKey: chaves.saldos(ws) }),
            ])
        } catch (e) {
            setAviso(mensagem(e))
        } finally {
            setPendente(false)
        }
    }

    const digitadas = editando
        ? lista.map((a) => ({ user_id: a.user_id, centavos: emCentavos(parseMoneyBrl(editando[a.user_id] || "0") ?? Number.NaN) }))
        : []
    const fecha = editando != null && partesFecham(digitadas, total)
    const soma = digitadas.reduce((s, p) => s + (Number.isFinite(p.centavos) ? p.centavos : 0), 0)

    function onSubmit(e: FormEvent) {
        e.preventDefault()
        if (!fecha) return setAviso(PARTES_NAO_FECHAM)
        void gravar(digitadas.map((p) => ({ user_id: p.user_id, amount: p.centavos / 100 })))
    }

    const dados = partes.data?.disponivel ? partes.data.dados : null
    return (
        <WireframeBox bloco={7} titulo="Partes desta despesa">
            {partes.isLoading ? <p>Carregando…</p> : null}
            {partes.error ? <p role="alert">{mensagem(partes.error)}</p> : null}
            {partes.data && !partes.data.disponivel ? <p>{AINDA_NAO_DISPONIVEL}</p> : null}
            {dados ? (
                <>
                    <p className="text-foreground">Pagou: {nome(dados.pagou)}</p>
                    {dados.partes.length === 0 ? (
                        <p>Fora da divisão: a despesa é de antes de a carteira passar a dividir.</p>
                    ) : (
                        <>
                            <ul>
                                {dados.partes.map((p) => (
                                    <li key={p.user_id}>
                                        {nome(p.user_id)}: {currencyBRL(Number(p.amount))}
                                    </li>
                                ))}
                            </ul>
                            <p>{dados.manual ? "Partes escritas à mão." : "Partes automáticas, pelos pesos; o centavo que sobra fica com quem pagou."}</p>
                        </>
                    )}
                    {dados.partes.length > 0 && !editando ? (
                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                className={botao}
                                disabled={pendente}
                                onClick={() =>
                                    setEditando(
                                        Object.fromEntries(
                                            lista.map((a) => {
                                                const p = dados.partes.find((x) => x.user_id === a.user_id)
                                                return [a.user_id, formatMoneyBrlInput(p ? Number(p.amount) : 0)]
                                            }),
                                        ),
                                    )
                                }
                            >
                                Editar à mão
                            </button>
                            {dados.manual ? (
                                <button type="button" className={botao} disabled={pendente} onClick={() => void gravar(null)}>
                                    {pendente ? "Voltando…" : "Voltar ao automático"}
                                </button>
                            ) : null}
                        </div>
                    ) : null}
                    {editando ? (
                        <form onSubmit={onSubmit} className="flex flex-col gap-2">
                            {lista.map((a) => (
                                <label key={a.user_id} className="flex items-center gap-2">
                                    {a.nome} (R$)
                                    <input
                                        className={campo}
                                        inputMode="decimal"
                                        value={editando[a.user_id] ?? ""}
                                        onChange={(e) => setEditando({ ...editando, [a.user_id]: e.target.value })}
                                    />
                                </label>
                            ))}
                            <p>
                                Soma: {currencyBRL(soma / 100)} de {currencyBRL(total / 100)}
                            </p>
                            {!fecha ? <p role="alert">{PARTES_NAO_FECHAM}</p> : null}
                            <div className="flex flex-wrap gap-2">
                                <button type="submit" className={botao} disabled={pendente || !fecha}>
                                    {pendente ? "Salvando…" : "Salvar partes"}
                                </button>
                                <button type="button" className={botao} disabled={pendente} onClick={() => setEditando(null)}>
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    ) : null}
                </>
            ) : null}
            {aviso ? <p role="status">{aviso}</p> : null}
        </WireframeBox>
    )
}

/**
 * O modo da carteira e os pesos de cada adulto, nas Configurações: só para o
 * dono, e fora da carteira pessoal. Trocar o modo não apaga nada.
 */
export function ModoEPesosDaCarteiraWireframe() {
    const { currentWorkspace, isWorkspaceOwner } = useWorkspace()
    if (!currentWorkspace || currentWorkspace.type === "personal" || !isWorkspaceOwner(currentWorkspace.id)) return null
    if (currentWorkspace.split_mode === undefined) {
        return (
            <WireframeBox bloco={7} titulo="Modo e pesos da carteira">
                <p>{AINDA_NAO_DISPONIVEL}</p>
            </WireframeBox>
        )
    }
    return <ModoEPesos ws={currentWorkspace} />
}

function ModoEPesos({ ws }: { ws: Workspace }) {
    const { lista } = useAdultos(ws.id)
    const pesos = useQuery({ queryKey: chaves.pesos(ws.id), queryFn: () => lerPesos(ws.id) })
    if (!lista.length || pesos.isLoading) {
        return (
            <WireframeBox bloco={7} titulo="Modo e pesos da carteira">
                <p>Carregando…</p>
            </WireframeBox>
        )
    }
    const salvos = pesos.data?.disponivel ? pesos.data.dados : null
    const iniciais = Object.fromEntries(
        lista.map((a) => {
            const p = salvos?.find((x) => x.user_id === a.user_id)
            return [a.user_id, String(p ? Number(p.weight) : 1).replace(".", ",")]
        }),
    )
    return (
        <FormularioDoModo
            key={`${ws.id}:${ws.split_mode}:${JSON.stringify(iniciais)}`}
            ws={ws}
            adultos={lista}
            iniciais={iniciais}
            pesosDisponiveis={salvos != null}
        />
    )
}

function FormularioDoModo({
    ws,
    adultos,
    iniciais,
    pesosDisponiveis,
}: {
    ws: Workspace
    adultos: Adulto[]
    iniciais: Record<string, string>
    pesosDisponiveis: boolean
}) {
    const { refreshWorkspaces } = useWorkspace()
    const queryClient = useQueryClient()
    const [modo, setModo] = useState<"pooled" | "split">(ws.split_mode ?? "pooled")
    const [valores, setValores] = useState(iniciais)
    const [pendente, setPendente] = useState(false)
    const [aviso, setAviso] = useState<string | null>(null)

    async function onSubmit(e: FormEvent) {
        e.preventDefault()
        const pesos = pesosDigitados(valores)
        if (modo === "split" && pesosDisponiveis && !pesos) return setAviso("Cada peso precisa ser maior que zero.")
        // Só o que mudou vai ao banco (Ruling 8).
        const mudados = (pesos ?? []).filter((p) => lerPeso(iniciais[p.user_id] ?? "1") !== p.weight)
        setPendente(true)
        setAviso(null)
        try {
            if (modo !== ws.split_mode) {
                const r = await gravarModo(ws.id, modo)
                if (!r.disponivel) return setAviso(AINDA_NAO_DISPONIVEL)
                if (!r.dados?.length) return setAviso(NADA_MUDOU)
            }
            if (modo === "split" && mudados.length) {
                const r = await gravarPesos(ws.id, mudados)
                if (!r.disponivel) return setAviso(AINDA_NAO_DISPONIVEL)
            }
            await Promise.all([
                refreshWorkspaces(),
                queryClient.invalidateQueries({ queryKey: chaves.pesos(ws.id) }),
                queryClient.invalidateQueries({ queryKey: chaves.saldos(ws.id) }),
            ])
            setAviso("Salvo.")
        } catch (erro) {
            setAviso(mensagem(erro))
        } finally {
            setPendente(false)
        }
    }

    return (
        <WireframeBox bloco={7} titulo="Modo e pesos da carteira">
            <form onSubmit={(e) => void onSubmit(e)} className="flex flex-col gap-2">
                <fieldset className="flex flex-col gap-1">
                    <legend className="text-foreground">Modo</legend>
                    <label className="flex items-center gap-2">
                        <input type="radio" name="modo" checked={modo === "pooled"} onChange={() => setModo("pooled")} />
                        Pote único: o dinheiro é de todos, sem conta de quem deve a quem.
                    </label>
                    <label className="flex items-center gap-2">
                        <input type="radio" name="modo" checked={modo === "split"} onChange={() => setModo("split")} />
                        Dividida: cada despesa vira partes entre os adultos, e o Painel mostra quem deve a quem.
                    </label>
                </fieldset>
                <p>Trocar o modo não apaga nada: as partes ficam guardadas e voltam a valer se a carteira voltar a dividir.</p>
                {modo === "split" ? (
                    <fieldset className="flex flex-col gap-1">
                        <legend className="text-foreground">Pesos</legend>
                        {!pesosDisponiveis ? <p>{AINDA_NAO_DISPONIVEL}</p> : null}
                        {pesosDisponiveis
                            ? adultos.map((a) => (
                                  <label key={a.user_id} className="flex items-center gap-2">
                                      {a.nome}
                                      <input
                                          className={campo}
                                          inputMode="decimal"
                                          value={valores[a.user_id] ?? ""}
                                          onChange={(e) => setValores({ ...valores, [a.user_id]: e.target.value })}
                                      />
                                  </label>
                              ))
                            : null}
                        <p>
                            Peso 1 para todos é a divisão igual; peso 2 fica com o dobro de peso 1. O convidado não entra: quem
                            é responsável por ele paga. Os pesos novos valem para as despesas novas e para as editadas.
                        </p>
                    </fieldset>
                ) : null}
                <div>
                    <button type="submit" className={botao} disabled={pendente}>
                        {pendente ? "Salvando…" : "Salvar modo e pesos"}
                    </button>
                </div>
                {aviso ? <p role="status">{aviso}</p> : null}
            </form>
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
