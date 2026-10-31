"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useWorkspace } from "@/components/workspace-provider"
import { ImpactoDaParcela } from "@/components/transactions/impacto-da-parcela"
import { WireframeBox } from "@/components/wireframe/wireframe-box"
import type { CartaoParaCasar, CategoriaParaCasar, LinhaHistorico } from "@/lib/captura/frase"
import {
    avisoDaIA,
    camposDaFrase,
    camposDaIA,
    historicoDaFraseEmCache,
    resumoDaFrase,
    textoDasDuvidas,
    type CamposDaFrase,
    type ContextoDaFrase,
} from "@/lib/captura/frase-no-form"
import { lerFraseComIA } from "@/lib/ia/ler"
import { splitTotalAcrossInstallments } from "@/lib/installment-amounts"
import type { PlanoProposto } from "@/lib/previsao/impacto-parcela"
import { localYmdFromDate } from "@/lib/transaction-date"
import { cartaoPreEscolhido, gravarUltimoCartao } from "@/lib/ultimo-cartao"

const campo = "w-full border border-dashed border-muted-foreground/60 bg-transparent px-2 py-1 font-mono text-foreground"

/**
 * A frase rápida no topo da criação: "42 mercado nubank" preenche os campos, e
 * quem salva é a pessoa, pelo botão de sempre (Decisão 14). O campo mora dentro
 * do `<form>` do lançamento: o Enter aplica a frase e não salva (Foco 5).
 * Enquanto se escreve, "Entendi" mostra o que o Enter vai preencher (as regras
 * estão em `camposDaInterpretacao`); o histórico carrega no foco do campo.
 */
export function FraseRapidaWireframe({
    fraseInicial,
    cartoes,
    categorias,
    onAplicar,
}: {
    /** A frase do compartilhar (`?frase=`): fica escrita, sem aplicar. */
    fraseInicial?: string
    cartoes: CartaoParaCasar[]
    categorias: CategoriaParaCasar[]
    onAplicar: (c: CamposDaFrase) => void
}) {
    const { currentWorkspaceId } = useWorkspace()
    const queryClient = useQueryClient()
    const [texto, setTexto] = useState(fraseInicial ?? "")
    const [aviso, setAviso] = useState<string | null>(null)
    const [aplicando, setAplicando] = useState(false)
    // A frase aplicada sem valor: a IA pode tentar lê-la.
    const [tentarIA, setTentarIA] = useState(false)
    // O que a frase aplicou por último: com parcelas e valor, o quadro de impacto aparece.
    const [aplicado, setAplicado] = useState<CamposDaFrase | null>(null)
    const proposto = useMemo(() => planoDaFrase(aplicado), [aplicado])
    // O histórico da prévia: vazio até o foco do campo o trazer do cache.
    const [historico, setHistorico] = useState<LinhaHistorico[]>([])
    const hoje = localYmdFromDate(new Date())
    // O cartão do "crédito" sem nome é o que o formulário pré-escolhe ao tocar em Crédito.
    const contexto = (): ContextoDaFrase => ({ categorias, cartaoAberto: cartaoPreEscolhido(cartoes) || null })
    const previa = useMemo(
        () => (texto.trim() ? camposDaFrase(texto, hoje, cartoes, historico, contexto()) : null),
        // eslint-disable-next-line react-hooks/exhaustive-deps -- `contexto` lê só `categorias` e `cartoes`
        [texto, hoje, cartoes, categorias, historico]
    )
    const entendido = aplicado ?? previa
    const resumo = entendido ? resumoDaFrase(entendido, hoje, categorias, cartoes) : null
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
        setHistorico(historico)
        const c = camposDaFrase(texto, hoje, cartoes, historico, contexto())
        lembrarCartao(c)
        onAplicar(c)
        setAplicado(c)
        setAviso(textoDasDuvidas(c) ?? "Preenchido. Confira e salve.")
        setTentarIA(c.duvidas.includes("valor"))
        setAplicando(false)
    }

    /** O cartão nomeado na frase passa a ser o "último", como escolhê-lo no campo. */
    function lembrarCartao(c: CamposDaFrase) {
        const cartao = c.origemDoCartao === "frase" ? cartoes.find((x) => x.id === c.creditCardId) : null
        if (cartao) gravarUltimoCartao(cartao.workspace_id, cartao.id)
    }

    async function carregarHistorico() {
        const lido = await historicoDaFraseEmCache(queryClient, currentWorkspaceId)
        if (lido.length) setHistorico(lido)
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
        const c = camposDaIA(lido.campos, hoje, cartoes, historico, texto, contexto())
        lembrarCartao(c)
        onAplicar(c)
        setAplicado(c)
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
                    onFocus={() => void carregarHistorico()}
                    onChange={(e) => {
                        pedido.current += 1
                        setTexto(e.target.value)
                        setAviso(null)
                        setAplicado(null)
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
            {resumo ? (
                <p>
                    {aplicado ? "Preenchido" : "Entendi"}: {resumo.join(" · ")}
                </p>
            ) : null}
            {aviso ? <p role="status">{aviso}</p> : null}
            {proposto ? <ImpactoDaParcela proposto={proposto} /> : null}
        </WireframeBox>
    )
}

/** O valor da frase é o total (`installmentValueMode: "total"`): dividido como o salvar divide. */
function planoDaFrase(c: CamposDaFrase | null): PlanoProposto | null {
    if (!c || c.tipo !== "expense" || c.parcelas == null || c.parcelas < 2 || c.valor == null) return null
    const cardId = c.paymentMethod === "credit_card" ? c.creditCardId : null
    if (c.paymentMethod === "credit_card" && !cardId) return null
    const split = splitTotalAcrossInstallments(c.valor, c.parcelas)
    if (split.installmentAmount <= 0) return null
    return {
        valorParcela: split.installmentAmount,
        parcelas: c.parcelas,
        ultimaParcela: split.finalInstallmentAmount,
        primeiraYmd: c.data,
        cardId,
        descricao: c.descricao,
    }
}
