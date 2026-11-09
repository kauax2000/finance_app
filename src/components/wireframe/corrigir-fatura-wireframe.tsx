"use client"

import { useMemo, useState } from "react"

import { aplicarCorrecoes, type ContextoDeCorrecao, type LoteAplicado } from "@/lib/fatura/aplicar-correcoes"
import type { CicloFatura, ConferenciaNoCiclo } from "@/lib/fatura/ciclo"
import type { LancamentoParaConferir } from "@/lib/fatura/conferir"
import {
    agruparPorMotivo,
    type Correcao,
    type DecisaoSoNoApp,
    type FormaForaDoCartao,
    impactoDaDecisao,
    sugerirCorrecoes,
    TITULO_DO_MOTIVO,
} from "@/lib/fatura/correcoes"
import { currencyBRL } from "@/lib/formatters"
import type { ItemImportavel } from "@/lib/import/importar"
import { roundCents } from "@/lib/money-brl"
import { paymentMethodOptions } from "@/lib/payment-methods"
import { supabase } from "@/lib/supabase"
import { formatYmdPtBr } from "@/lib/transaction-date"

const botao = "border border-muted-foreground/60 px-2 py-1 font-mono text-foreground disabled:opacity-50"
const campo = "border border-dashed border-muted-foreground/60 bg-transparent px-2 py-1 font-mono text-foreground"

const FORMAS = paymentMethodOptions().filter(
    (o): o is { value: FormaForaDoCartao; label: string } => o.value !== "credit_card",
)

type Escolha = "apagar" | "mudar" | "manter"

function deParaDe(c: Correcao): string {
    switch (c.motivo) {
        case "fora-do-periodo":
            return `${c.descricao}: ${formatYmdPtBr(c.de)} → ${formatYmdPtBr(c.para)}`
        case "falta-no-app":
            return `${formatYmdPtBr(c.item.data)} · ${c.item.descricao}: lançar ${c.item.estorno ? "−" : ""}${currencyBRL(c.item.valor)} no app`
        case "valor-diferente":
            return `${c.descricao}: ${currencyBRL(c.de)} → ${currencyBRL(c.para)}${c.assinaturaId ? " (e a assinatura)" : ""}`
        case "parcela":
            return `${c.descricao}: parcela ${c.de ?? "sem número"} → ${c.para}`
    }
}

const linhaApp = (a: LancamentoParaConferir) =>
    `${formatYmdPtBr(a.date)} · ${a.description ?? "(sem descrição)"} · ${a.type === "income" ? "−" : ""}${currencyBRL(a.amount)}`

export function CorrigirFatura(p: {
    conferencia: ConferenciaNoCiclo<ItemImportavel>
    ciclo: CicloFatura
    /** Sem `batchId`: cada aplicação gera o seu, e o Desfazer cobre só o último lote. */
    ctx: Omit<ContextoDeCorrecao, "batchId">
    /** O lote sobe a quem chama: o Desfazer fica lá, e sobrevive à fatura que ficou igual. */
    onAplicado: (lote: LoteAplicado, aplicadas: number) => Promise<void>
    /** Quem chama está gravando (o desfazer): os botões daqui esperam. */
    ocupado?: boolean
}) {
    const { conferencia, ciclo, ctx, onAplicado } = p
    const correcoes = useMemo(() => sugerirCorrecoes(conferencia, ciclo), [conferencia, ciclo])
    const soNoApp = conferencia.soNoApp

    const [escolhas, setEscolhas] = useState<Record<string, Escolha>>({})
    const [formas, setFormas] = useState<Record<string, FormaForaDoCartao>>({})
    // Na fila: as correções aceitas, e a posição.
    const [fila, setFila] = useState<{ k: number; aceitas: Set<string> } | null>(null)
    const [aplicando, setPendente] = useState(false)
    const pendente = aplicando || Boolean(p.ocupado)
    const [erro, setErro] = useState<string | null>(null)

    const decisao = (id: string): DecisaoSoNoApp | undefined => {
        const e = escolhas[id]
        if (e === "mudar") return { forma: formas[id] ?? FORMAS[0].value }
        return e
    }
    const decisoes = () => {
        const m = new Map<string, DecisaoSoNoApp>()
        for (const a of soNoApp) {
            const d = decisao(a.id)
            if (d) m.set(a.id, d)
        }
        return m
    }
    const decididas = soNoApp.filter((a) => escolhas[a.id] && escolhas[a.id] !== "manter").length

    async function aplicar(lista: Correcao[]) {
        setPendente(true)
        setErro(null)
        try {
            const r = await aplicarCorrecoes(supabase, { ...ctx, batchId: crypto.randomUUID() }, lista, decisoes())
            // Sem `desfeito`, o texto já diz que o desfazer falhou.
            if (!r.ok) return setErro(r.erro)
            setFila(null)
            setEscolhas({})
            await onAplicado(r.lote, r.aplicadas)
        } catch {
            setErro("As correções não terminaram. Confira a fatura de novo.")
        } finally {
            setPendente(false)
        }
    }

    function radios(a: LancamentoParaConferir) {
        const nome = `so-no-app-${a.id}`
        const marcar = (e: Escolha) => setEscolhas((s) => ({ ...s, [a.id]: e }))
        return (
            <div className="flex flex-wrap items-center gap-3">
                {/* O lançamento de outra pessoa não volta no Desfazer (RLS do insert): só o próprio se apaga. */}
                {a.user_id === ctx.userId ? (
                    <label className="flex items-center gap-1">
                        <input type="radio" name={nome} checked={escolhas[a.id] === "apagar"} onChange={() => marcar("apagar")} />
                        Apagar
                    </label>
                ) : null}
                <label className="flex items-center gap-1">
                    <input type="radio" name={nome} checked={escolhas[a.id] === "mudar"} onChange={() => marcar("mudar")} />
                    Mudar forma de pagamento
                </label>
                <select
                    className={campo}
                    aria-label="Nova forma de pagamento"
                    value={formas[a.id] ?? FORMAS[0].value}
                    onChange={(e) => setFormas((f) => ({ ...f, [a.id]: e.target.value as FormaForaDoCartao }))}
                >
                    {FORMAS.map((f) => (
                        <option key={f.value} value={f.value}>
                            {f.label}
                        </option>
                    ))}
                </select>
                <label className="flex items-center gap-1">
                    <input type="radio" name={nome} checked={escolhas[a.id] === "manter"} onChange={() => marcar("manter")} />
                    Manter
                </label>
            </div>
        )
    }

    const avisos = erro ? (
        <p role="alert" className="text-destructive">
            {erro}
        </p>
    ) : null

    if (fila) {
        const total = correcoes.length + soNoApp.length
        const aceitas = correcoes.filter((c) => fila.aceitas.has(c.id))
        if (fila.k >= total) {
            const novoTotal = roundCents(
                conferencia.somaApp +
                    aceitas.reduce((s, c) => s + c.impacto, 0) +
                    soNoApp.reduce((s, a) => s + impactoDaDecisao(a, decisao(a.id)), 0),
            )
            const n = aceitas.length + decididas
            return (
                <div className="space-y-2">
                    <p>Novo total: {currencyBRL(novoTotal)}</p>
                    <div className="flex flex-wrap gap-2">
                        <button type="button" className={botao} disabled={pendente || n === 0} onClick={() => void aplicar(aceitas)}>
                            {aplicando ? "Aplicando…" : `Aplicar escolhidas (${n})`}
                        </button>
                        <button type="button" className={botao} disabled={pendente} onClick={() => setFila(null)}>
                            Voltar ao resumo
                        </button>
                    </div>
                    {avisos}
                </div>
            )
        }
        const c = correcoes[fila.k] as Correcao | undefined
        const a = c ? null : soNoApp[fila.k - correcoes.length]
        const seguir = (aceitar: boolean) =>
            setFila((f) => {
                if (!f) return f
                const aceitas = new Set(f.aceitas)
                if (c && aceitar) aceitas.add(c.id)
                return { k: f.k + 1, aceitas }
            })
        return (
            <div className="space-y-2">
                <p>
                    {fila.k + 1} de {total}
                </p>
                {c ? (
                    <p>
                        {TITULO_DO_MOTIVO[c.motivo]}: {deParaDe(c)} · {currencyBRL(c.impacto)}
                    </p>
                ) : a ? (
                    <>
                        <p>
                            {TITULO_DO_MOTIVO["so-no-app"]}: {linhaApp(a)}
                        </p>
                        {radios(a)}
                    </>
                ) : null}
                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        className={botao}
                        disabled={pendente || (a != null && !escolhas[a.id])}
                        onClick={() => seguir(true)}
                    >
                        Corrigir
                    </button>
                    <button
                        type="button"
                        className={botao}
                        disabled={pendente}
                        onClick={() => {
                            // Pular um item só no app vale como "Manter".
                            if (a) setEscolhas((s) => ({ ...s, [a.id]: "manter" }))
                            seguir(false)
                        }}
                    >
                        Pular
                    </button>
                </div>
                {avisos}
            </div>
        )
    }

    const grupos = agruparPorMotivo(correcoes)
    const impactoSoNoApp = roundCents(soNoApp.reduce((s, a) => s + impactoDaDecisao(a, decisao(a.id)), 0))
    const n = correcoes.length + decididas
    return (
        <div className="space-y-2">
            <p>
                App {currencyBRL(conferencia.somaApp)} · Banco {currencyBRL(conferencia.somaBanco)} · diferença{" "}
                {currencyBRL(conferencia.diferenca)}
            </p>
            {grupos.map((g) => (
                <section key={g.motivo}>
                    <h3>
                        {g.titulo} · {g.correcoes.length} · {currencyBRL(g.impacto)}
                    </h3>
                    <ul className="mt-1 space-y-1 pl-4">
                        {g.correcoes.map((c) => (
                            <li key={c.id}>{deParaDe(c)}</li>
                        ))}
                    </ul>
                </section>
            ))}
            {soNoApp.length > 0 ? (
                <section>
                    <h3>
                        {TITULO_DO_MOTIVO["so-no-app"]} · {soNoApp.length} · {currencyBRL(impactoSoNoApp)}
                    </h3>
                    <ul className="mt-1 space-y-2 pl-4">
                        {soNoApp.map((a) => (
                            <li key={a.id}>
                                {linhaApp(a)}
                                {radios(a)}
                            </li>
                        ))}
                    </ul>
                </section>
            ) : null}
            <div className="flex flex-wrap gap-2">
                <button
                    type="button"
                    className={botao}
                    disabled={pendente || n === 0}
                    onClick={() => void aplicar(correcoes)}
                >
                    {aplicando ? "Aplicando…" : `Aprovar todas (${n})`}
                </button>
                <button
                    type="button"
                    className={botao}
                    disabled={pendente || correcoes.length + soNoApp.length === 0}
                    onClick={() => {
                        setErro(null)
                        setFila({ k: 0, aceitas: new Set() })
                    }}
                >
                    Revisar uma por uma
                </button>
            </div>
            {avisos}
        </div>
    )
}
