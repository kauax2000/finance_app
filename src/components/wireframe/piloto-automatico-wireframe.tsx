"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useMemo, useState } from "react"

import { WireframeBox } from "@/components/wireframe/wireframe-box"
import { useWorkspace } from "@/components/workspace-provider"
import { currencyBRL } from "@/lib/formatters"
import { desfazerImportacao } from "@/lib/import/importar"
import {
    agruparPiloto,
    buscarPiloto,
    desfazerLancamento,
    textoDesfazerImportacao,
    type ItemPiloto,
} from "@/lib/piloto/piloto"
import { invalidateWorkspaceData } from "@/lib/queries/invalidate-workspace-data"
import { supabase } from "@/lib/supabase"
import { formatSupabasePostgrestError } from "@/lib/supabase-errors"
import { formatRelativeDayPtBr, localYmdFromDate } from "@/lib/transaction-date"

const JANELA_DIAS = 30
const botao = "border border-muted-foreground/60 px-2 py-1 font-mono text-foreground disabled:opacity-50"

/** "ontem · 14:30", no relógio local (o `criadoEm` é UTC). */
function quando(criadoEm: string): string {
    const d = new Date(criadoEm)
    if (Number.isNaN(d.getTime())) return criadoEm
    const hora = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    return `${formatRelativeDayPtBr(localYmdFromDate(d))} · ${hora}`
}

/**
 * O Piloto Automático (Bloco 4): o que o app lançou sozinho nesta carteira nos
 * últimos 30 dias, agrupado, cada coisa com o seu "Desfazer".
 */
export function PilotoAutomaticoWireframe() {
    const { currentWorkspaceId: workspaceId } = useWorkspace()
    const queryClient = useQueryClient()
    const [pendente, setPendente] = useState(false)
    const [erro, setErro] = useState<string | null>(null)
    // Fixa o corte por carga da página: a chave da consulta não muda a cada render.
    const desde = useMemo(() => new Date(Date.now() - JANELA_DIAS * 86_400_000).toISOString(), [])
    const chave = ["piloto", workspaceId]

    const lista = useQuery({
        queryKey: chave,
        enabled: Boolean(workspaceId),
        queryFn: () => buscarPiloto(workspaceId as string, desde),
    })
    const grupos = useMemo(() => agruparPiloto(lista.data ?? []), [lista.data])

    async function desfazer(texto: string, acao: (ws: string) => Promise<{ ok: boolean; erro?: string }>) {
        if (!workspaceId || !window.confirm(texto)) return
        setPendente(true)
        setErro(null)
        try {
            const r = await acao(workspaceId)
            if (!r.ok) {
                setErro(r.erro ?? "Não foi possível desfazer.")
                return
            }
            await Promise.all([
                invalidateWorkspaceData(queryClient, workspaceId, { domains: ["transactions", "credit_card_expense_rows"] }),
                queryClient.invalidateQueries({ queryKey: chave }),
            ])
        } catch (e) {
            setErro(formatSupabasePostgrestError(e) ?? "Não foi possível desfazer.")
        } finally {
            setPendente(false)
        }
    }

    const desfazerItem = (i: ItemPiloto, recorrente: boolean) =>
        desfazer(
            recorrente ? "Apagar este lançamento? O app não o lança de novo." : "Apagar este lançamento?",
            (ws) => desfazerLancamento(ws, i.id),
        )

    const linhaDoItem = (i: ItemPiloto, recorrente: boolean) => (
        <li key={i.id} className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="text-foreground">{i.descricao}</span>
            <span>{currencyBRL(i.valor)}</span>
            <span>{i.origem}</span>
            <span>{quando(i.criadoEm)}</span>
            {i.categoria ? <span>{i.categoria}</span> : null}
            {i.aConferir ? <span className="text-foreground">a conferir</span> : null}
            <button type="button" className={botao} disabled={pendente} onClick={() => void desfazerItem(i, recorrente)}>
                Desfazer
            </button>
        </li>
    )

    return (
        <WireframeBox bloco={4} titulo="Piloto Automático">
            <p>O que o app lançou sozinho nesta carteira nos últimos 30 dias.</p>
            {lista.isPending && workspaceId ? <p>Carregando…</p> : null}
            {lista.isError ? (
                <p role="alert" className="text-destructive">
                    {formatSupabasePostgrestError(lista.error) ?? "Não foi possível carregar."}
                </p>
            ) : null}
            {lista.isSuccess && grupos.length === 0 ? <p>Nada foi lançado sozinho nos últimos 30 dias.</p> : null}

            {grupos.map((g) => {
                if (g.tipo === "importacao") {
                    return (
                        <section key={g.loteId} className="space-y-1">
                            <h2 className="font-bold text-foreground">Importação · {g.origem}</h2>
                            <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                <span>
                                    {g.total} {g.total === 1 ? "lançamento" : "lançamentos"}
                                </span>
                                <span>{currencyBRL(g.valor)}</span>
                                <span>{quando(g.criadoEm)}</span>
                                <button
                                    type="button"
                                    className={botao}
                                    disabled={pendente}
                                    onClick={() =>
                                        void desfazer(textoDesfazerImportacao(g.total), (ws) =>
                                            desfazerImportacao(supabase, ws, g.loteId),
                                        )
                                    }
                                >
                                    Desfazer
                                </button>
                            </p>
                        </section>
                    )
                }
                const recorrente = g.tipo === "recorrente"
                return (
                    <section key={g.tipo} className="space-y-1">
                        <h2 className="font-bold text-foreground">
                            {recorrente ? "Assinaturas e parcelas" : "Captura"}
                        </h2>
                        <ul className="space-y-1">{g.itens.map((i) => linhaDoItem(i, recorrente))}</ul>
                    </section>
                )
            })}

            {erro ? (
                <p role="alert" className="text-destructive">
                    {erro}
                </p>
            ) : null}
        </WireframeBox>
    )
}
