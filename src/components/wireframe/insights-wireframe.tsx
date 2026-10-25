"use client"

import Link from "next/link"
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react"

import { WireframeBox } from "@/components/wireframe/wireframe-box"
import { useWorkspaceNotificationPrefs } from "@/hooks/use-workspace-notification-prefs"
import { shiftYearMonth } from "@/lib/budget-month"
import {
    apagarUm,
    atualizarPrecoDaAssinatura,
    lancamentosDaRecorrencia,
    linhaDoSeguroDoMes,
    marcarInsight,
    statusAoTocarOLink,
    sugerirValorVariavel,
    textoNaCaixa,
    virarAssinatura,
    virarConta,
    type AjustesDaRecorrencia,
    type Insight,
    type Resultado,
} from "@/lib/insights/acoes"
import { useInsights, useSeguroBaixo } from "@/lib/insights/use-insights"
import type { DadosDaPrevisao } from "@/lib/previsao/tipos"
import { usePrevisao } from "@/lib/previsao/use-previsao"
import type { Category } from "@/lib/supabase"
import { localYmdFromDate } from "@/lib/transaction-date"

const botao = "border border-muted-foreground/60 px-2 py-1 font-mono text-foreground disabled:opacity-50"
const campo = "border border-muted-foreground/60 bg-transparent px-1 text-foreground"

type Destino = "assinatura" | "conta"
export type ConfirmacaoDaRecorrencia = AjustesDaRecorrencia & { destino: Destino }
type Categoria = Pick<Category, "id" | "name" | "type">

/** A caixa do Painel: lê, produz o seguro baixo no mês corrente e despacha cada ação. */
export function InsightsDoPainel({
    workspaceId,
    calendarYm,
    categorias,
}: {
    workspaceId: string | null
    calendarYm: string
    categorias: Categoria[]
}) {
    const { itens, erro, entendi, silenciar, agir, recarregar } = useInsights(workspaceId)
    const { dados } = usePrevisao(workspaceId)
    const mesCorrente = calendarYm === localYmdFromDate(new Date()).slice(0, 7)
    useSeguroBaixo(workspaceId, mesCorrente ? dados : null, recarregar)

    const onAcao = useCallback(
        async (insight: Insight, ajustes?: ConfirmacaoDaRecorrencia): Promise<Resultado> => {
            let r: Resultado
            if (insight.kind === "recorrencia" && ajustes) {
                r = await (ajustes.destino === "assinatura" ? virarAssinatura : virarConta)(insight, ajustes)
            } else if (insight.kind === "preco_assinatura") r = await atualizarPrecoDaAssinatura(insight)
            else if (insight.kind === "duplicidade") r = await apagarUm(insight)
            else {
                const e =
                    statusAoTocarOLink(insight.kind) === "seen" ? await marcarInsight(insight.id, "seen") : await agir(insight.id)
                return e ? { ok: false, erro: e } : { ok: true }
            }
            if (r.ok) await recarregar()
            return r
        },
        [agir, recarregar],
    )

    return (
        <InsightsWireframe
            itens={itens}
            erro={erro}
            dados={dados}
            categorias={categorias}
            onAcao={onAcao}
            onEntendi={entendi}
            onSilenciar={silenciar}
        />
    )
}

export function InsightsWireframe({
    itens,
    erro,
    dados,
    categorias,
    onAcao,
    onEntendi,
    onSilenciar,
}: {
    itens: Insight[]
    erro?: string | null
    dados: DadosDaPrevisao | null
    categorias: Categoria[]
    onAcao: (insight: Insight, ajustes?: ConfirmacaoDaRecorrencia) => Promise<Resultado>
    onEntendi: (id: string) => Promise<string | null>
    onSilenciar: (kind: string) => Promise<string | null>
}) {
    const [erros, setErros] = useState<Record<string, string>>({})
    const [ocupado, setOcupado] = useState<string | null>(null)
    const [recorrencia, setRecorrencia] = useState<Insight | null>(null)
    const mesAnterior = dados ? shiftYearMonth(dados.hojeYmd.slice(0, 7), -1) : null
    const visiveis = itens.flatMap((i) => {
        const t = textoNaCaixa(i, dados)
        return t ? [{ i, t }] : []
    })

    async function rodar(id: string, fn: () => Promise<Resultado | string | null>) {
        setOcupado(id)
        const r = await fn()
        setOcupado(null)
        const msg = typeof r === "string" ? r : r && !r.ok ? r.erro : null
        setErros((e) => {
            const resto = { ...e }
            delete resto[id]
            return msg ? { ...resto, [id]: msg } : resto
        })
    }

    return (
        <WireframeBox bloco={6} titulo="Insights">
            {erro ? <p role="alert">{erro}</p> : null}
            {visiveis.length === 0 && !erro ? <p>Nenhum insight agora.</p> : null}
            <ul className="space-y-3">
                {visiveis.map(({ i, t }) => {
                    const ym = typeof i.payload?.mes === "string" ? i.payload.mes : null
                    const linhaDoSeguro =
                        i.kind === "relatorio_mes" && dados && ym && ym === mesAnterior ? linhaDoSeguroDoMes(dados, ym) : null
                    const parado = ocupado === i.id
                    return (
                        <li key={i.id} className="space-y-1 border-t border-dashed border-muted-foreground/60 pt-2">
                            <p className="text-foreground">
                                {i.status === "new" ? "● " : ""}
                                <strong>{t.titulo}</strong>
                            </p>
                            {t.corpo ? <p>{t.corpo}</p> : null}
                            {linhaDoSeguro ? <p>{linhaDoSeguro}</p> : null}
                            <div className="flex flex-wrap items-center gap-2">
                                {!t.acao ? (
                                    <button type="button" className={botao} disabled={parado} onClick={() => void rodar(i.id, () => onEntendi(i.id))}>
                                        Entendi
                                    </button>
                                ) : i.kind === "recorrencia" ? (
                                    <button type="button" className={botao} onClick={() => setRecorrencia(i)}>
                                        {t.acao.rotulo}
                                    </button>
                                ) : i.kind === "preco_assinatura" || i.kind === "duplicidade" ? (
                                    <button type="button" className={botao} disabled={parado} onClick={() => void rodar(i.id, () => onAcao(i))}>
                                        {parado ? "Aguarde…" : t.acao.rotulo}
                                    </button>
                                ) : (
                                    <Link href={t.acao.href} className={`${botao} underline`} onClick={() => void onAcao(i)}>
                                        {t.acao.rotulo}
                                    </Link>
                                )}
                                <details>
                                    <summary className="cursor-pointer">Mais</summary>
                                    <div className="mt-1 flex flex-col items-start gap-1">
                                        {t.acao ? (
                                            <button type="button" className={botao} disabled={parado} onClick={() => void rodar(i.id, () => onEntendi(i.id))}>
                                                Dispensar este
                                            </button>
                                        ) : null}
                                        <button type="button" className={botao} disabled={parado} onClick={() => void rodar(i.id, () => onSilenciar(i.kind))}>
                                            Não mostrar mais este tipo
                                        </button>
                                    </div>
                                </details>
                            </div>
                            {erros[i.id] ? <p role="alert">{erros[i.id]}</p> : null}
                        </li>
                    )
                })}
            </ul>
            {recorrencia ? (
                <DialogoDaRecorrencia
                    key={recorrencia.id}
                    insight={recorrencia}
                    categorias={categorias}
                    onConfirmar={(a) => onAcao(recorrencia, a)}
                    onFechar={() => setRecorrencia(null)}
                />
            ) : null}
        </WireframeBox>
    )
}

/** O "Criar com 1 toque": o destino vem sugerido pelo meio de pagamento e a pessoa pode trocar. */
function DialogoDaRecorrencia({
    insight,
    categorias,
    onConfirmar,
    onFechar,
}: {
    insight: Insight
    categorias: Categoria[]
    onConfirmar: (a: ConfirmacaoDaRecorrencia) => Promise<Resultado>
    onFechar: () => void
}) {
    const p = insight.payload
    const ref = useRef<HTMLDialogElement>(null)
    const [nome, setNome] = useState(typeof p.nome === "string" ? p.nome : "")
    const [valor, setValor] = useState(String(Number(p.valorMedio) || ""))
    const [dia, setDia] = useState(String(Number(p.dia) || 1))
    const [categoryId, setCategoryId] = useState(typeof p.category_id === "string" ? p.category_id : "")
    const [destino, setDestino] = useState<Destino>(p.destino === "assinatura" ? "assinatura" : "conta")
    const [valorVariavel, setValorVariavel] = useState(false)
    const [salvando, setSalvando] = useState(false)
    const [erro, setErro] = useState<string | null>(null)

    useEffect(() => {
        ref.current?.showModal()
        let vivo = true
        void lancamentosDaRecorrencia(insight).then((r) => {
            if (vivo && r.ok) setValorVariavel(sugerirValorVariavel(r.lancamentos.map((l) => Number(l.amount))))
        })
        return () => {
            vivo = false
        }
    }, [insight])

    async function salvar(e: FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setSalvando(true)
        setErro(null)
        const r = await onConfirmar({
            destino,
            nome,
            valor: Number(valor),
            dia: Number(dia),
            categoryId: categoryId || null,
            valorVariavel,
        })
        setSalvando(false)
        if (r.ok) ref.current?.close()
        else setErro(r.erro)
    }

    return (
        <dialog
            ref={ref}
            onClose={onFechar}
            className="m-auto border border-dashed border-muted-foreground/60 bg-background p-4 font-mono text-xs text-muted-foreground"
        >
            <form onSubmit={salvar} className="space-y-2">
                <p className="font-bold">WIREFRAME · Bloco 6 · Insights · Criar com 1 toque</p>
                <fieldset className="flex gap-3">
                    <legend>Virar</legend>
                    <label>
                        <input type="radio" name="destino" checked={destino === "assinatura"} onChange={() => setDestino("assinatura")} />{" "}
                        Assinatura
                    </label>
                    <label>
                        <input type="radio" name="destino" checked={destino === "conta"} onChange={() => setDestino("conta")} /> Conta a
                        pagar
                    </label>
                </fieldset>
                <label className="block">
                    Nome <input required value={nome} onChange={(e) => setNome(e.target.value)} className={campo} />
                </label>
                {destino === "assinatura" ? (
                    <label className="block">
                        Valor (R$){" "}
                        <input
                            type="number"
                            required
                            min={0.01}
                            step={0.01}
                            inputMode="decimal"
                            value={valor}
                            onChange={(e) => setValor(e.target.value)}
                            className={`w-28 ${campo}`}
                        />
                    </label>
                ) : (
                    <label className="block">
                        <input type="checkbox" checked={valorVariavel} onChange={(e) => setValorVariavel(e.target.checked)} /> Valor
                        variável (a estimativa é a média dos lançamentos)
                    </label>
                )}
                <label className="block">
                    Dia{" "}
                    <input
                        type="number"
                        required
                        min={1}
                        max={31}
                        value={dia}
                        onChange={(e) => setDia(e.target.value)}
                        className={`w-16 ${campo}`}
                    />
                </label>
                <label className="block">
                    Categoria{" "}
                    <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={campo}>
                        <option value="">Sem categoria</option>
                        {categorias
                            .filter((c) => c.type === "expense")
                            .map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name}
                                </option>
                            ))}
                    </select>
                </label>
                <p>Os lançamentos passados ficam ligados a ela.</p>
                {erro ? <p role="alert">{erro}</p> : null}
                <div className="flex gap-2">
                    <button type="button" className={botao} disabled={salvando} onClick={() => ref.current?.close()}>
                        Cancelar
                    </button>
                    <button type="submit" className={botao} disabled={salvando}>
                        {salvando ? "Criando…" : "Criar"}
                    </button>
                </div>
            </form>
        </dialog>
    )
}

/** A chave "Insights" das preferências de aviso: liga e desliga `notify_insights` nesta carteira. */
export function InsightsAvisoWireframe() {
    const { prefs, loading, updating, error, patch } = useWorkspaceNotificationPrefs()

    if (loading || !prefs) return null

    return (
        <WireframeBox bloco={6} titulo="Insights">
            <label className="flex items-center gap-2 text-foreground">
                <input
                    type="checkbox"
                    checked={prefs.notify_insights !== false}
                    disabled={updating}
                    onChange={(e) => void patch({ notify_insights: e.target.checked })}
                />
                Insights
            </label>
            <p>Avisos do que o app notou na carteira. No máximo 3 push por semana; o resto fica no Painel.</p>
            {error ? (
                <p role="alert" className="text-destructive">
                    {error}
                </p>
            ) : null}
        </WireframeBox>
    )
}
