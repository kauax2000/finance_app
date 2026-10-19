"use client"

import * as React from "react"

/**
 * Como a busca aparece no cabeçalho do app, do `lg` para cima: `barra` é a
 * pílula no centro (o padrão), `botao` é a lupa colada ao sino. Abaixo do `lg`
 * as duas são a mesma lupa. Vale neste aparelho, como o tema: mora no
 * localStorage e não sai com a conta. Escolhida em Configurações › Aparência.
 */
export type BuscaDoCabecalho = "barra" | "botao"

const CHAVE = "finance:preferencia:busca-do-cabecalho"
// O `storage` só chega às outras abas; nesta, quem grava avisa por este evento.
const EVENTO = "busca-do-cabecalho"

function ler(): BuscaDoCabecalho {
    try {
        return localStorage.getItem(CHAVE) === "botao" ? "botao" : "barra"
    } catch {
        return "barra"
    }
}

function assinar(avisar: () => void) {
    const noStorage = (e: StorageEvent) => {
        if (e.key === CHAVE) avisar()
    }
    window.addEventListener("storage", noStorage)
    window.addEventListener(EVENTO, avisar)
    return () => {
        window.removeEventListener("storage", noStorage)
        window.removeEventListener(EVENTO, avisar)
    }
}

export function useBuscaDoCabecalho() {
    // No servidor, a pílula: a página nasce como a maioria a vê.
    const busca = React.useSyncExternalStore(assinar, ler, () => "barra" as const)
    const definir = React.useCallback((proxima: BuscaDoCabecalho) => {
        try {
            if (proxima === "barra") localStorage.removeItem(CHAVE)
            else localStorage.setItem(CHAVE, proxima)
        } catch {
            /* sem armazenamento a escolha não pega, e fica a pílula */
        }
        window.dispatchEvent(new Event(EVENTO))
    }, [])
    return [busca, definir] as const
}
