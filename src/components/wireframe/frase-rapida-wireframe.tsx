"use client"

import { useEffect, useRef, useState } from "react"
import { onlineManager, useQueryClient } from "@tanstack/react-query"
import { useWorkspace } from "@/components/workspace-provider"
import { WireframeBox } from "@/components/wireframe/wireframe-box"
import type { CartaoParaCasar } from "@/lib/captura/frase"
import {
    camposDaFrase,
    carregarHistoricoDaFrase,
    textoDasDuvidas,
    type CamposDaFrase,
} from "@/lib/captura/frase-no-form"
import { localYmdFromDate } from "@/lib/transaction-date"
import { fraseHistoricoKeys } from "@/lib/queries/keys"
import type { LinhaHistorico } from "@/lib/captura/frase"

/** O histórico é ajuda: depois disso a frase preenche sem ele. */
const ESPERA_DO_HISTORICO_MS = 4000

const campo = "w-full border border-dashed border-muted-foreground/60 bg-transparent px-2 py-1 font-mono text-foreground"

/**
 * A frase rápida no topo da criação: "42 mercado nubank" preenche os campos, e
 * quem salva é a pessoa, pelo botão de sempre (Decisão 14). O campo mora dentro
 * do `<form>` do lançamento: o Enter aplica a frase e não salva (Foco 5).
 */
export function FraseRapidaWireframe({
    fraseInicial,
    cartoes,
    onAplicar,
}: {
    /** A frase do compartilhar (`?frase=`): fica escrita, sem aplicar. */
    fraseInicial?: string
    cartoes: CartaoParaCasar[]
    onAplicar: (c: CamposDaFrase) => void
}) {
    const { currentWorkspaceId } = useWorkspace()
    const queryClient = useQueryClient()
    const [texto, setTexto] = useState(fraseInicial ?? "")
    const [aviso, setAviso] = useState<string | null>(null)
    const [aplicando, setAplicando] = useState(false)
    // Cada aplicar ganha um número; editar a frase ou fechar o formulário o
    // muda, e a resposta atrasada de um pedido velho é jogada fora.
    const pedido = useRef(0)
    useEffect(() => {
        const atual = pedido
        return () => {
            atual.current += 1
        }
    }, [])

    async function carregarHistorico(): Promise<LinhaHistorico[]> {
        // O histórico só carrega quando a frase é aplicada, e fica no cache.
        // Offline, falhando ou demorando, a frase preenche sem ele.
        if (!currentWorkspaceId || !onlineManager.isOnline()) return []
        try {
            return await queryClient.fetchQuery({
                queryKey: fraseHistoricoKeys.list(currentWorkspaceId),
                queryFn: () =>
                    carregarHistoricoDaFrase(
                        currentWorkspaceId,
                        AbortSignal.timeout(ESPERA_DO_HISTORICO_MS),
                    ),
                staleTime: 5 * 60_000,
                networkMode: "always",
                retry: false,
                meta: { errorToast: false },
            })
        } catch {
            return []
        }
    }

    async function aplicar() {
        if (!texto.trim() || aplicando) return
        const meu = ++pedido.current
        setAplicando(true)
        const historico = await carregarHistorico()
        if (meu !== pedido.current) return
        const c = camposDaFrase(texto, localYmdFromDate(new Date()), cartoes, historico)
        onAplicar(c)
        setAviso(textoDasDuvidas(c) ?? "Preenchido. Confira e salve.")
        setAplicando(false)
    }

    return (
        <WireframeBox bloco="3" titulo="Frase rápida">
            <label className="block space-y-1">
                <span>Escreva o lançamento</span>
                <input
                    type="text"
                    className={campo}
                    value={texto}
                    onChange={(e) => {
                        pedido.current += 1
                        setTexto(e.target.value)
                        setAviso(null)
                        setAplicando(false)
                    }}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                            e.preventDefault()
                            void aplicar()
                        }
                    }}
                    placeholder="42 mercado nubank"
                    enterKeyHint="done"
                    autoComplete="off"
                    maxLength={500}
                />
            </label>
            <button
                type="button"
                className="border border-dashed border-muted-foreground/60 px-2 py-1 text-foreground disabled:opacity-60"
                onClick={() => void aplicar()}
                disabled={aplicando || !texto.trim()}
            >
                {aplicando ? "Preenchendo…" : "Preencher"}
            </button>
            {aviso ? <p role="status">{aviso}</p> : null}
        </WireframeBox>
    )
}
