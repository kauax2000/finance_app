"use client"

import { useCallback, useEffect, useRef } from "react"
import { flushSync } from "react-dom"

/** Quanto a tela velha espera a nova (a releitura do arquivo), como na subpágina do app. */
const LIMITE_DA_ESPERA_MS = 1200

type Estado = { passo: string; pendente: string | null; erro: string | null }

type DocumentoComTransicao = Document & {
    startViewTransition?: (trocar: () => Promise<void> | void) => { finished: Promise<void> }
}

/**
 * A parte comum às duas formas: decide se há gesto e, havendo, marca a direção no `<html>` e a
 * tira quando a troca acaba (também se a gaveta fecha no meio). Devolve `null` quando a troca é seca:
 * fora do telefone, sem View Transitions, com movimento reduzido ou com outra troca em curso.
 */
function comecarSubtela(ativo: boolean, direcao: "entra" | "volta", trocar: () => Promise<void> | void) {
    const doc = document as DocumentoComTransicao
    const raiz = document.documentElement
    if (
        !ativo ||
        !doc.startViewTransition ||
        raiz.dataset.subtela ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
        return null
    }
    raiz.dataset.subtela = direcao
    const transicao = doc.startViewTransition(trocar)
    void transicao.finished.finally(() => delete raiz.dataset.subtela)
    return transicao
}

/**
 * A forma genérica, sem espera: a tela nova é a que a `acao` monta na hora (o formulário de edição
 * do detalhe do lançamento). Mesmo gesto e mesmo CSS (`html[data-subtela]`) da subtela do Importar.
 */
export function useTrocaDeSubtela(ativo: boolean) {
    return useCallback(
        (direcao: "entra" | "volta", acao: () => void) => {
            if (!comecarSubtela(ativo, direcao, () => flushSync(acao))) acao()
        },
        [ativo],
    )
}

/**
 * O gesto da subpágina do telefone (`TransicaoDeSubpagina`) dentro da gaveta do Importar: a
 * subtela Conferir leitura entra pela direita, e a conferência volta da esquerda. O navegador
 * segura a foto da tela velha enquanto a nova monta; a releitura do Está certo espera o passo mudar,
 * até 1,2s. Se o passo não muda (o erro de coluna faltando), a troca acontece sem gesto. Só no
 * telefone; sem View Transitions ou com movimento reduzido, a troca é seca.
 */
export function useTransicaoDaSubtela(estado: Estado, ativo: boolean) {
    const atual = useRef(estado)
    useEffect(() => {
        atual.current = estado
    })

    return useCallback(
        (direcao: "entra" | "volta", acao: () => unknown) => {
            const raiz = document.documentElement
            const passoDeAntes = atual.current.passo
            const transicao = comecarSubtela(ativo, direcao, async () => {
                flushSync(() => {
                    void acao()
                })
                await new Promise<void>((pronta) => {
                    const inicio = performance.now()
                    const conferir = () => {
                        const { passo, pendente, erro } = atual.current
                        const acabou = passo !== passoDeAntes || (pendente == null && erro != null)
                        if (acabou || performance.now() - inicio > LIMITE_DA_ESPERA_MS) return pronta()
                        setTimeout(conferir, 16)
                    }
                    // `setTimeout`, e não `requestAnimationFrame`: com a foto segura, o navegador suspende os quadros.
                    setTimeout(conferir, 0)
                })
                // Sem passo novo não há página a empurrar: a foto troca sem deslizar.
                if (atual.current.passo === passoDeAntes) raiz.dataset.subtela = "parada"
            })
            if (!transicao) void acao()
        },
        [ativo],
    )
}
