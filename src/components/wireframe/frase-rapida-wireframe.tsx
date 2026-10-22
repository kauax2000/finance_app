"use client"

import { useEffect, useRef, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useWorkspace } from "@/components/workspace-provider"
import { WireframeBox } from "@/components/wireframe/wireframe-box"
import type { CartaoParaCasar } from "@/lib/captura/frase"
import {
    avisoDaIA,
    camposDaFrase,
    camposDaIA,
    historicoDaFraseEmCache,
    textoDasDuvidas,
    type CamposDaFrase,
} from "@/lib/captura/frase-no-form"
import { lerFraseComIA } from "@/lib/ia/ler"
import { localYmdFromDate } from "@/lib/transaction-date"

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
    // A frase aplicada sem valor: a IA pode tentar lê-la.
    const [tentarIA, setTentarIA] = useState(false)
    // Cada aplicar ganha um número; editar a frase ou fechar o formulário o
    // muda, e a resposta atrasada de um pedido velho é jogada fora.
    const pedido = useRef(0)
    useEffect(() => {
        const atual = pedido
        return () => {
            atual.current += 1
        }
    }, [])

    async function aplicar() {
        if (!texto.trim() || aplicando) return
        const meu = ++pedido.current
        setAplicando(true)
        const historico = await historicoDaFraseEmCache(queryClient, currentWorkspaceId)
        if (meu !== pedido.current) return
        const c = camposDaFrase(texto, localYmdFromDate(new Date()), cartoes, historico)
        onAplicar(c)
        setAviso(textoDasDuvidas(c) ?? "Preenchido. Confira e salve.")
        setTentarIA(c.duvidas.includes("valor"))
        setAplicando(false)
    }

    async function lerComIA() {
        if (!currentWorkspaceId || aplicando) return
        const meu = ++pedido.current
        setAplicando(true)
        const [historico, lido] = await Promise.all([
            historicoDaFraseEmCache(queryClient, currentWorkspaceId),
            lerFraseComIA(currentWorkspaceId, texto),
        ])
        if (meu !== pedido.current) return
        setAplicando(false)
        if (!lido.ok) {
            setAviso(lido.mensagem)
            return
        }
        const c = camposDaIA(lido.campos, localYmdFromDate(new Date()), cartoes, historico)
        onAplicar(c)
        setAviso(avisoDaIA(c))
        setTentarIA(false)
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
                        setTentarIA(false)
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
            {tentarIA ? (
                <button
                    type="button"
                    className="border border-dashed border-muted-foreground/60 px-2 py-1 text-foreground disabled:opacity-60"
                    onClick={() => void lerComIA()}
                    disabled={aplicando}
                >
                    {aplicando ? "Lendo…" : "Tentar com IA"}
                </button>
            ) : null}
            {aviso ? <p role="status">{aviso}</p> : null}
        </WireframeBox>
    )
}
