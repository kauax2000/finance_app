"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useWorkspace } from "@/components/workspace-provider"
import type { useTransactionForm } from "@/components/transactions/transaction-form-use"
import type { CartaoParaCasar, CategoriaParaCasar, LinhaHistorico } from "@/lib/captura/frase"
import {
    avisoDaIA,
    camposDaFrase,
    camposDaIA,
    historicoDaFraseEmCache,
    type CamposDaFrase,
    type ContextoDaFrase,
} from "@/lib/captura/frase-no-form"
import {
    comTravas,
    faltaParaLancar,
    precisaDeIA,
    type CampoDoLancamento,
} from "@/lib/captura/lancamento-inteligente"
import { comprimirImagem } from "@/lib/anexos"
import { lerFraseComIA, lerImagemComIA, type CamposIA } from "@/lib/ia/ler"
import { localYmdFromDate } from "@/lib/transaction-date"
import { cartaoPreEscolhido, gravarUltimoCartao } from "@/lib/ultimo-cartao"

/** O aviso do "Lançar" que trava, pelo campo que falta. */
const AVISO_DA_FALTA: Partial<Record<CampoDoLancamento, string>> = {
    valor: "Falta o valor",
    forma: "Falta o cartão",
}

/**
 * A leitura do lançamento inteligente: a frase é lida a cada tecla (o parser é
 * síncrono), a IA só no "Lançar" quando o parser não achou valor ou descrição,
 * e a foto do recibo pela IA. O que a pessoa editou à mão vence a frase, e o
 * formulário sempre reflete os campos lidos — quem salva é o `salvar()` dele.
 */
export function useLeituraDoLancamento({
    form,
    cartoes,
    categorias,
    fraseInicial,
    fotoInicial,
}: {
    form: ReturnType<typeof useTransactionForm>
    cartoes: CartaoParaCasar[]
    categorias: CategoriaParaCasar[]
    /** A frase do compartilhar (`?frase=`). */
    fraseInicial?: string
    /** A foto do compartilhar: lida uma vez, ao montar. */
    fotoInicial?: File
}) {
    const { currentWorkspaceId } = useWorkspace()
    const queryClient = useQueryClient()
    const { aplicarFrase, aplicarFoto } = form.fieldsProps
    const { setFotoDoRecibo } = form
    const [texto, setTextoCru] = useState(fraseInicial ?? "")
    const [editados, setEditados] = useState<Partial<CamposDaFrase>>({})
    const [historico, setHistorico] = useState<LinhaHistorico[]>([])
    // O que a IA leu da frase vale até a frase mudar; o da foto, até tirar a foto.
    const [iaDoTexto, setIaDoTexto] = useState<CamposIA | null>(null)
    const [iaDaFoto, setIaDaFoto] = useState<CamposIA | null>(null)
    const [lendoTexto, setLendoTexto] = useState(false)
    const [lendoFoto, setLendoFoto] = useState(false)
    const [aviso, setAviso] = useState<string | null>(null)
    const hoje = localYmdFromDate(new Date())

    // O histórico é ajuda: carrega ao abrir, e a frase lê sem ele até chegar.
    useEffect(() => {
        let vivo = true
        void historicoDaFraseEmCache(queryClient, currentWorkspaceId).then((lido) => {
            if (vivo && lido.length) setHistorico(lido)
        })
        return () => {
            vivo = false
        }
    }, [queryClient, currentWorkspaceId])

    const campos = useMemo(() => {
        // O cartão do "crédito" sem nome é o que o formulário pré-escolhe ao tocar em Crédito.
        const ctx: ContextoDaFrase = { categorias, cartaoAberto: cartaoPreEscolhido(cartoes) || null }
        // A IA vence e o texto da pessoa completa (`camposDaIA`).
        const ia = iaDaFoto ?? iaDoTexto
        const base = ia
            ? camposDaIA(ia, hoje, cartoes, historico, texto, ctx)
            : texto.trim()
              ? camposDaFrase(texto, hoje, cartoes, historico, ctx)
              : null
        return base ? comTravas(base, editados) : null
    }, [texto, hoje, cartoes, categorias, historico, iaDoTexto, iaDaFoto, editados])

    // A foto marca o lançamento como `share`; a frase, como `quick_text`.
    useEffect(() => {
        if (campos) (iaDaFoto ? aplicarFoto : aplicarFrase)(campos)
    }, [campos, iaDaFoto, aplicarFrase, aplicarFoto])

    // Cada leitura da frase pela IA ganha um número; reescrever a frase ou
    // fechar a paleta o muda, e a resposta atrasada de um pedido velho é
    // jogada fora.
    const pedido = useRef(0)
    useEffect(() => {
        const atual = pedido
        return () => {
            atual.current += 1
        }
    }, [])

    function setTexto(novo: string) {
        pedido.current += 1
        setTextoCru(novo)
        setIaDoTexto(null)
        setLendoTexto(false)
        setAviso(null)
        // Limpar a frase solta os campos editados (sem foto, nada mais os segura).
        if (!novo.trim() && !iaDaFoto) setEditados({})
    }

    function editar(campo: CampoDoLancamento, parcial: Partial<CamposDaFrase>) {
        setEditados((atual) => ({ ...atual, ...parcial }))
        // O "Falta o valor" some quando a pessoa preenche o valor.
        setAviso((atual) => (atual != null && atual === AVISO_DA_FALTA[campo] ? null : atual))
    }

    async function lerComIA() {
        if (!currentWorkspaceId) return
        const meu = ++pedido.current
        setLendoTexto(true)
        setAviso(null)
        try {
            const lido = await lerFraseComIA(currentWorkspaceId, texto)
            if (meu !== pedido.current) return
            if (!lido.ok) setAviso(lido.mensagem)
            else setIaDoTexto(lido.campos)
        } catch (erro) {
            // Só a sessão (`getSession`) rejeita; a revisão fica como está.
            console.error("frase pela IA:", erro)
            if (meu === pedido.current) setAviso("Não foi possível ler com IA.")
        } finally {
            if (meu === pedido.current) setLendoTexto(false)
        }
    }

    /** O cartão nomeado na frase passa a ser o "último", como escolhê-lo no campo. */
    function lembrarCartao(c: CamposDaFrase) {
        const cartao = c.origemDoCartao === "frase" ? cartoes.find((x) => x.id === c.creditCardId) : null
        if (cartao) gravarUltimoCartao(cartao.workspace_id, cartao.id)
    }

    async function lancar() {
        if (!campos || lendoTexto || lendoFoto) return
        // A IA lê e não salva: a pessoa vê o que ela leu e aprova de novo.
        if (precisaDeIA(campos) && !iaDoTexto && !iaDaFoto && texto.trim()) {
            await lerComIA()
            return
        }
        const falta = faltaParaLancar(campos, cartoes.filter((c) => c.is_active).length)
        if (falta) {
            setAviso(AVISO_DA_FALTA[falta] ?? null)
            return
        }
        lembrarCartao(campos)
        await form.salvar()
    }

    // Cada foto ganha um número: a resposta atrasada de uma foto trocada é
    // jogada fora, e nada se aplica com a paleta fechada. Escrever a frase não
    // invalida a foto (o texto completa o que a foto leu).
    const pedidoDaFoto = useRef(0)
    const montado = useRef(false)
    useEffect(() => {
        montado.current = true
        return () => {
            montado.current = false
        }
    }, [])

    async function lerFoto(arquivo: File) {
        if (!currentWorkspaceId) {
            setAviso("Escolha uma carteira primeiro.")
            return
        }
        const workspaceId = currentWorkspaceId
        const meu = ++pedidoDaFoto.current
        const vale = () => montado.current && meu === pedidoDaFoto.current
        setLendoFoto(true)
        setAviso(null)
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
            setFotoDoRecibo(foto)
            const lido = await lerImagemComIA(workspaceId, foto)
            if (!vale()) return
            if (!lido.ok) setAviso(lido.mensagem)
            else setIaDaFoto(lido.campos)
        } catch (erro) {
            // Só a sessão (`getSession`) rejeita; a leitura falhou, a foto fica.
            console.error("foto do recibo:", erro)
            if (vale()) setAviso("Não foi possível ler a foto.")
        } finally {
            // Um pedido novo cuida do próprio "lendo".
            if (vale()) setLendoFoto(false)
        }
    }

    function tirarFoto() {
        pedidoDaFoto.current += 1
        setFotoDoRecibo(null)
        setIaDaFoto(null)
        setLendoFoto(false)
        setAviso(null)
    }

    // A foto do compartilhar é lida uma vez; o ref segura o segundo efeito do
    // modo estrito, e o `montado` deixa a primeira leitura valer.
    const lidaInicial = useRef<File | null>(null)
    useEffect(() => {
        if (!fotoInicial || !currentWorkspaceId || lidaInicial.current === fotoInicial) return
        lidaInicial.current = fotoInicial
        void lerFoto(fotoInicial)
        // eslint-disable-next-line react-hooks/exhaustive-deps -- só a foto do compartilhar (com a carteira) dispara a leitura
    }, [fotoInicial, currentWorkspaceId])

    return {
        texto,
        setTexto,
        campos,
        editar,
        lendoIA: lendoTexto || lendoFoto,
        // O aviso da IA segue os campos: conferir um campo o tira da lista.
        aviso: aviso ?? (campos?.duvidas.includes("ia") ? avisoDaIA(campos) : null),
        lancar,
        foto: form.fotoDoRecibo,
        lerFoto,
        tirarFoto,
    }
}
