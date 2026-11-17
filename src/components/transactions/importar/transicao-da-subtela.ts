"use client"

import { useCallback, useEffect, useRef } from "react"
import { flushSync } from "react-dom"

/** Quanto a tela velha espera a nova (a releitura do arquivo), como na subpágina do app. */
const LIMITE_DA_ESPERA_MS = 1200

type Estado = { passo: string; pendente: string | null; erro: string | null }

type DocumentoComTransicao = Document & {
    startViewTransition?: (trocar: () => Promise<void>) => { finished: Promise<void> }
}

/**
 * O gesto da subpágina do telefone (`TransicaoDeSubpagina`) dentro da gaveta do Importar: a
 * subtela Ajustar colunas entra pela direita, e a conferência volta da esquerda. O navegador
 * segura a foto da tela velha enquanto a nova monta; a releitura do Pronto espera o passo mudar,
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
            const doc = document as DocumentoComTransicao
            const raiz = document.documentElement
            if (
                !ativo ||
                !doc.startViewTransition ||
                raiz.dataset.subtela ||
                window.matchMedia("(prefers-reduced-motion: reduce)").matches
            ) {
                void acao()
                return
            }
            const passoDeAntes = atual.current.passo
            raiz.dataset.subtela = direcao
            const transicao = doc.startViewTransition(async () => {
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
            void transicao.finished.finally(() => delete raiz.dataset.subtela)
        },
        [ativo],
    )
}
