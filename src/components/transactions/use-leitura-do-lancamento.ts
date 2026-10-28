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
    MOTIVO_DA_FALTA,
    precisaDeIA,
    soDespesa,
    type CampoDoLancamento,
} from "@/lib/captura/lancamento-inteligente"
import { comprimirImagem } from "@/lib/anexos"
import { lerFraseComIA, lerImagemComIA, type CamposIA } from "@/lib/ia/ler"
import { localYmdFromDate } from "@/lib/transaction-date"
import { cartaoPreEscolhido, gravarUltimoCartao } from "@/lib/ultimo-cartao"

/**
 * A leitura do lançamento inteligente: a frase é lida quando a pessoa a lança
 * (Enter) — o parser na hora e, se o valor ou a descrição ficarem em dúvida, a
 * IA uma vez —, e a foto do recibo pela IA. Até lá nada aparece nem vai ao
 * formulário. O que a pessoa editou à mão vence a frase, e o formulário
 * reflete os campos lidos — quem salva é o `salvar()` dele, no "Aprovar".
 * Prefira `cartoes` e `categorias` estáveis (memoizados): cada troca relê a frase.
 */
export function useLeituraDoLancamento({
    form,
    ativo,
    cartoes,
    categorias,
    fraseInicial,
    fotoInicial,
}: {
    form: ReturnType<typeof useTransactionForm>
    /** A paleta aberta: fechada (ou trocada pelo formulário completo), nada se aplica nem carrega. */
    ativo: boolean
    cartoes: CartaoParaCasar[]
    categorias: CategoriaParaCasar[]
    /** A frase do compartilhar (`?frase=`). */
    fraseInicial?: string
    /** A foto do compartilhar: lida uma vez, ao montar. */
    fotoInicial?: File
}) {
    const { currentWorkspaceId, papel } = useWorkspace()
    const semReceita = papel === "guest"
    const queryClient = useQueryClient()
    const { aplicarFrase, aplicarFoto } = form.fieldsProps
    const { setFotoDoRecibo } = form
    const [texto, setTexto] = useState(fraseInicial ?? "")
    // A frase lançada (Enter): é ela que se lê, e não a que está sendo escrita.
    const [fraseLida, setFraseLida] = useState("")
    const [editados, setEditados] = useState<Partial<CamposDaFrase>>({})
    const [historico, setHistorico] = useState<LinhaHistorico[]>([])
    // O que a IA leu da frase vale até a frase mudar; o da foto, até tirar a foto.
    const [iaDoTexto, setIaDoTexto] = useState<CamposIA | null>(null)
    const [iaDaFoto, setIaDaFoto] = useState<CamposIA | null>(null)
    // A IA já tentou esta frase: lançá-la de novo não a chama outra vez.
    const [iaTentada, setIaTentada] = useState(false)
    const [lendoTexto, setLendoTexto] = useState(false)
    const [lendoFoto, setLendoFoto] = useState(false)
    const [aviso, setAviso] = useState<string | null>(null)
    const hoje = localYmdFromDate(new Date())

    // O histórico é ajuda: carrega a cada abertura (o `staleTime` do cache a
    // deixa barata), e a frase lê sem ele até chegar.
    useEffect(() => {
        if (!ativo) return
        let vivo = true
        void historicoDaFraseEmCache(queryClient, currentWorkspaceId).then((lido) => {
            if (vivo && lido.length) setHistorico(lido)
        })
        return () => {
            vivo = false
        }
    }, [ativo, queryClient, currentWorkspaceId])

    const campos = useMemo(() => {
        // O cartão do "crédito" sem nome é o que o formulário pré-escolhe ao tocar em Crédito.
        const ctx: ContextoDaFrase = { categorias, cartaoAberto: cartaoPreEscolhido(cartoes) || null }
        // A IA vence e o texto da pessoa completa (`camposDaIA`).
        const ia = iaDaFoto ?? iaDoTexto
        const base = ia
            ? camposDaIA(ia, hoje, cartoes, historico, fraseLida, ctx)
            : fraseLida.trim()
              ? camposDaFrase(fraseLida, hoje, cartoes, historico, ctx)
              : null
        if (!base) return null
        const lidos = comTravas(base, editados)
        return semReceita ? soDespesa(lidos, categorias) : lidos
    }, [fraseLida, hoje, cartoes, categorias, historico, iaDoTexto, iaDaFoto, editados, semReceita])

    // A foto marca o lançamento como `share`; a frase, como `quick_text`. O
    // aplicar re-renderiza o formulário: só campos diferentes do último
    // aplicado o chamam, para `cartoes`/`categorias` instáveis não darem laço.
    // Inativa, a resposta atrasada (IA, histórico, meia-noite) não sobrescreve
    // o formulário completo que a pessoa abriu.
    const ultimoAplicado = useRef<string | null>(null)
    useEffect(() => {
        if (!ativo || !campos) return
        const chave = JSON.stringify([campos, iaDaFoto != null])
        if (chave === ultimoAplicado.current) return
        ultimoAplicado.current = chave
        ;(iaDaFoto ? aplicarFoto : aplicarFrase)(campos)
    }, [ativo, campos, iaDaFoto, aplicarFrase, aplicarFoto])

    // Cada leitura da frase pela IA ganha um número; lançar outra frase ou
    // fechar a paleta o muda, e a resposta atrasada de um pedido velho é
    // jogada fora.
    const pedido = useRef(0)
    useEffect(() => {
        const atual = pedido
        return () => {
            atual.current += 1
        }
    }, [])

    /**
     * O Enter no campo: lê a frase escrita e abre a revisão. A frase nova
     * esquece o que a IA leu da anterior (as edições à mão ficam); se o valor
     * ou a descrição ficarem em dúvida, a IA lê uma vez. Lançar a mesma frase
     * de novo não a chama outra vez. `frase` é a do compartilhar.
     */
    function interpretar(frase = texto) {
        if (lendoTexto || lendoFoto) return
        const vazia = !frase.trim()
        // Sem frase nem foto lida não há o que revisar.
        if (vazia && !iaDaFoto) return
        const nova = frase !== fraseLida
        if (nova) {
            pedido.current += 1
            setFraseLida(frase)
            setIaDoTexto(null)
            setIaTentada(false)
            setAviso(null)
        }
        // Com a foto lida, a frase só completa o que a IA leu dela.
        if (vazia || iaDaFoto || (!nova && iaTentada)) return
        const ctx: ContextoDaFrase = { categorias, cartaoAberto: cartaoPreEscolhido(cartoes) || null }
        if (precisaDeIA(comTravas(camposDaFrase(frase, hoje, cartoes, historico, ctx), editados))) {
            void lerComIA(frase)
        }
    }

    /** Volta ao zero: o hook mora no diálogo, que fica montado entre uma paleta e outra. */
    function reiniciar() {
        pedido.current += 1
        pedidoDaFoto.current += 1
        ultimoAplicado.current = null
        setTexto("")
        setFraseLida("")
        setEditados({})
        setIaDoTexto(null)
        setIaDaFoto(null)
        setIaTentada(false)
        setLendoTexto(false)
        setLendoFoto(false)
        setAviso(null)
        setFotoDoRecibo(null)
    }

    function editar(campo: CampoDoLancamento, parcial: Partial<CamposDaFrase>) {
        setEditados((atual) => ({ ...atual, ...parcial }))
        // O "Falta o valor" some quando a pessoa preenche o valor.
        setAviso((atual) => (atual != null && atual === MOTIVO_DA_FALTA[campo] ? null : atual))
    }

    async function lerComIA(frase: string) {
        if (!currentWorkspaceId) return
        const meu = ++pedido.current
        setLendoTexto(true)
        setIaTentada(true)
        setAviso(null)
        try {
            const lido = await lerFraseComIA(currentWorkspaceId, frase)
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

    /** O "Aprovar" da revisão: salva pelo formulário. A IA já leu no Enter. */
    async function aprovar() {
        if (!campos || lendoTexto || lendoFoto) return
        const falta = faltaParaLancar(campos, cartoes.filter((c) => c.is_active).length)
        if (falta) {
            setAviso(MOTIVO_DA_FALTA[falta] ?? null)
            return
        }
        lembrarCartao(campos)
        await form.salvar()
    }

    // Cada foto ganha um número: a resposta atrasada de uma foto trocada é
    // jogada fora, e nada se aplica com a paleta fechada. Lançar uma frase não
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
        interpretar,
        reiniciar,
        // A frase lida por último: diferente do campo, a revisão está velha.
        fraseLida,
        // A revisão: só depois do Enter ou da foto lida.
        campos,
        editados,
        editar,
        lendoIA: lendoTexto || lendoFoto,
        // O aviso da IA segue os campos: conferir um campo o tira da lista.
        aviso: aviso ?? (campos?.duvidas.includes("ia") ? avisoDaIA(campos) : null),
        aprovar,
        foto: form.fotoDoRecibo,
        lerFoto,
        tirarFoto,
    }
}
