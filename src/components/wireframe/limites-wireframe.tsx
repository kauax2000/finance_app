"use client"

import { useCallback, useEffect, useState, type FormEvent } from "react"

import { WireframeBox } from "@/components/wireframe/wireframe-box"
import { currencyBRL } from "@/lib/formatters"
import { formatMoneyBrlInput } from "@/lib/money-brl"
import {
    gravarLimite,
    lerLancamentosDoMes,
    lerLimiteDigitado,
    lerLimites,
    linhasDosLimites,
    removerLimite,
    type LancamentoDaPessoa,
    type LimiteDaPessoa,
    type LinhaDoLimite,
} from "@/lib/limites/limites"
import { localYmdFromDate } from "@/lib/transaction-date"

const botao = "border border-muted-foreground/60 px-2 py-1 font-mono text-foreground disabled:opacity-50"
const campo = "border border-muted-foreground/60 bg-transparent px-1 text-foreground"

type Pessoa = { user_id: string; nome: string }

/**
 * Os limites mensais por pessoa (seção `#limites` de Membros): o gasto do mês
 * de cada uma contra o limite. O dono edita; o membro só vê. Se a leitura
 * falha (a tabela ainda não existe no banco), fica um estado neutro.
 */
export function LimitesWireframe({
    workspaceId,
    pessoas,
    podeEditar,
}: {
    workspaceId: string
    pessoas: Pessoa[]
    podeEditar: boolean
}) {
    const ym = localYmdFromDate(new Date()).slice(0, 7)
    const [dados, setDados] = useState<{ limites: LimiteDaPessoa[]; lancs: LancamentoDaPessoa[] } | null>(null)
    const [indisponivel, setIndisponivel] = useState(false)

    const [versao, setVersao] = useState(0)
    const carregar = useCallback(() => setVersao((v) => v + 1), [])

    useEffect(() => {
        let vivo = true
        Promise.all([lerLimites(workspaceId), lerLancamentosDoMes(workspaceId, ym)]).then(
            ([limites, lancs]) => {
                if (!vivo) return
                setDados({ limites, lancs })
                setIndisponivel(false)
            },
            () => {
                if (vivo) setIndisponivel(true)
            },
        )
        return () => {
            vivo = false
        }
    }, [workspaceId, ym, versao])

    return (
        <WireframeBox bloco={7} titulo="Limites por pessoa">
            <p>Limite mensal de gasto de cada pessoa. Avisa em 80% e em 100%, à pessoa e ao dono.</p>
            {indisponivel ? (
                <p role="status">Os limites ainda não estão disponíveis nesta carteira.</p>
            ) : !dados ? (
                <p role="status">Carregando…</p>
            ) : (
                <ul className="space-y-2">
                    {linhasDosLimites(pessoas, dados.limites, dados.lancs, ym).map((l) => (
                        <LinhaDoLimiteWireframe
                            key={`${l.user_id}:${l.limite}`}
                            linha={l}
                            podeEditar={podeEditar}
                            onSalvar={(valor) => gravarLimite(workspaceId, l.user_id, valor).then(carregar)}
                            onRemover={() => removerLimite(workspaceId, l.user_id).then(carregar)}
                        />
                    ))}
                </ul>
            )}
        </WireframeBox>
    )
}

function LinhaDoLimiteWireframe({
    linha,
    podeEditar,
    onSalvar,
    onRemover,
}: {
    linha: LinhaDoLimite
    podeEditar: boolean
    onSalvar: (valor: number) => Promise<void>
    onRemover: () => Promise<void>
}) {
    const [valor, setValor] = useState(linha.limite == null ? "" : formatMoneyBrlInput(linha.limite))
    const [salvando, setSalvando] = useState(false)
    const [erro, setErro] = useState<string | null>(null)
    const gasto = currencyBRL(linha.gastoCentavos / 100)

    async function rodar(fn: () => Promise<void>) {
        setSalvando(true)
        setErro(null)
        try {
            await fn()
        } catch (e) {
            setErro(e instanceof Error ? e.message : "Não foi possível salvar o limite.")
        } finally {
            setSalvando(false)
        }
    }

    function salvar(e: FormEvent<HTMLFormElement>) {
        e.preventDefault()
        const n = lerLimiteDigitado(valor)
        if (n == null) {
            setErro("Informe um valor maior que zero, até R$ 9.999.999.999,99.")
            return
        }
        void rodar(() => onSalvar(n))
    }

    return (
        <li className="space-y-1 border-t border-dashed border-muted-foreground/60 pt-2">
            <p className="text-foreground">
                <strong>{linha.nome}</strong>:{" "}
                {linha.limite == null
                    ? `${gasto} no mês, sem limite`
                    : `${gasto} de ${currencyBRL(linha.limite)}${linha.nivel ? ` (passou de ${linha.nivel}%)` : ""}`}
            </p>
            {podeEditar ? (
                <form onSubmit={salvar} className="flex flex-wrap items-center gap-2">
                    <label>
                        Limite (R$){" "}
                        <input
                            type="text"
                            placeholder="1.234,56"
                            inputMode="decimal"
                            value={valor}
                            disabled={salvando}
                            onChange={(e) => setValor(e.target.value)}
                            className={`w-28 ${campo}`}
                        />
                    </label>
                    <button type="submit" className={botao} disabled={salvando}>
                        {salvando ? "Salvando…" : "Salvar"}
                    </button>
                    {linha.limite != null ? (
                        <button
                            type="button"
                            className={botao}
                            disabled={salvando}
                            onClick={() =>
                                void rodar(async () => {
                                    await onRemover()
                                    setValor("")
                                })
                            }
                        >
                            Tirar limite
                        </button>
                    ) : null}
                </form>
            ) : null}
            {erro ? <p role="alert">{erro}</p> : null}
        </li>
    )
}
