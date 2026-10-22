"use client"

import { useEffect, useRef, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useWorkspace } from "@/components/workspace-provider"
import { WireframeBox } from "@/components/wireframe/wireframe-box"
import type { CartaoParaCasar } from "@/lib/captura/frase"
import {
    avisoDaIA,
    camposDaIA,
    historicoDaFraseEmCache,
    type CamposDaFrase,
} from "@/lib/captura/frase-no-form"
import { comprimirImagem } from "@/lib/anexos"
import { lerImagemComIA } from "@/lib/ia/ler"
import { localYmdFromDate } from "@/lib/transaction-date"

/**
 * A foto do recibo na criação: a IA lê a foto e preenche os campos, e quem
 * salva é a pessoa. A foto comprimida fica no formulário e vira anexo do
 * lançamento depois do salvar.
 */
export function FotoReciboWireframe({
    fotoInicial,
    cartoes,
    onAplicar,
    onFoto,
}: {
    /** A foto do compartilhar: lida uma vez, ao montar. */
    fotoInicial?: File
    cartoes: CartaoParaCasar[]
    onAplicar: (c: CamposDaFrase) => void
    /** A foto comprimida, que o formulário anexa depois do salvar. */
    onFoto: (foto: File) => void
}) {
    const { currentWorkspaceId } = useWorkspace()
    const queryClient = useQueryClient()
    const [aviso, setAviso] = useState<string | null>(null)
    const [lendo, setLendo] = useState(false)
    // Cada foto ganha um número: a resposta atrasada de uma foto trocada é
    // jogada fora, e nada se aplica com o formulário fechado.
    const pedido = useRef(0)
    const montado = useRef(false)
    useEffect(() => {
        montado.current = true
        return () => {
            montado.current = false
        }
    }, [])

    async function ler(arquivo: File) {
        if (!currentWorkspaceId) {
            setAviso("Escolha uma carteira primeiro.")
            return
        }
        const workspaceId = currentWorkspaceId
        const meu = ++pedido.current
        const vale = () => montado.current && meu === pedido.current
        setLendo(true)
        setAviso("Lendo a foto…")
        try {
            let foto: File
            try {
                const blob = await comprimirImagem(arquivo)
                // Sem WebP no canvas, o navegador devolve PNG: o tipo é o que saiu.
                foto = new File([blob], `recibo.${blob.type.split("/")[1] ?? "webp"}`, { type: blob.type })
            } catch {
                if (vale()) setAviso("Não foi possível abrir esta imagem.")
                return
            }
            if (!vale()) return
            onFoto(foto)
            const [historico, lido] = await Promise.all([
                historicoDaFraseEmCache(queryClient, workspaceId),
                lerImagemComIA(workspaceId, foto),
            ])
            if (!vale()) return
            if (!lido.ok) {
                setAviso(lido.mensagem)
                return
            }
            const c = camposDaIA(lido.campos, localYmdFromDate(new Date()), cartoes, historico)
            onAplicar(c)
            setAviso(avisoDaIA(c))
        } catch (erro) {
            // Só a sessão (`getSession`) rejeita; a leitura falhou, a foto fica.
            console.error("foto do recibo:", erro)
            if (vale()) setAviso("Não foi possível ler a foto.")
        } finally {
            // Um pedido novo cuida do próprio "lendo".
            if (vale()) setLendo(false)
        }
    }

    // A foto do compartilhar é lida uma vez; o ref segura o segundo efeito do
    // modo estrito, e o `montado` deixa a primeira leitura valer.
    const lidaInicial = useRef<File | null>(null)
    useEffect(() => {
        if (!fotoInicial || !currentWorkspaceId || lidaInicial.current === fotoInicial) return
        lidaInicial.current = fotoInicial
        void ler(fotoInicial)
        // eslint-disable-next-line react-hooks/exhaustive-deps -- só a foto do compartilhar (com a carteira) dispara a leitura
    }, [fotoInicial, currentWorkspaceId])

    return (
        <WireframeBox bloco="3" titulo="Foto do recibo">
            <label className="block space-y-1">
                <span>Foto do recibo</span>
                <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="block w-full font-mono text-foreground"
                    disabled={lendo}
                    onChange={(e) => {
                        const arquivo = e.target.files?.[0]
                        e.target.value = ""
                        if (arquivo) void ler(arquivo)
                    }}
                    onKeyDown={(e) => {
                        // O Enter abre a câmera e nunca salva o lançamento.
                        if (e.key === "Enter") {
                            e.preventDefault()
                            e.currentTarget.click()
                        }
                    }}
                />
            </label>
            {aviso ? <p role="status">{aviso}</p> : null}
        </WireframeBox>
    )
}
