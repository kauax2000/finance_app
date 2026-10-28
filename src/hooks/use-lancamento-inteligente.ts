"use client"

import * as React from "react"

/**
 * Se o "+ Adicionar" abre a paleta de lançamento inteligente (ligado, o
 * padrão) ou o formulário clássico. Vale neste aparelho, como o tema: mora no
 * localStorage e não sai com a conta. Escolhido em Configurações.
 */
const CHAVE = "finance:preferencia:lancamento-inteligente"
// O `storage` só chega às outras abas; nesta, quem grava avisa por este evento.
const EVENTO = "lancamento-inteligente"

/** Ausente ou ilegível é ligado: só um "0" gravado desliga. */
export function lerLancamentoInteligente(storage: Pick<Storage, "getItem"> | null): boolean {
    try {
        return storage?.getItem(CHAVE) !== "0"
    } catch {
        return true
    }
}

function ler() {
    return lerLancamentoInteligente(typeof localStorage === "undefined" ? null : localStorage)
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

export function useLancamentoInteligente() {
    // No servidor, ligado: a página nasce como a maioria a vê.
    const ligado = React.useSyncExternalStore(assinar, ler, () => true)
    const definir = React.useCallback((proximo: boolean) => {
        try {
            if (proximo) localStorage.removeItem(CHAVE)
            else localStorage.setItem(CHAVE, "0")
        } catch {
            /* sem armazenamento a escolha não pega, e fica ligado */
        }
        window.dispatchEvent(new Event(EVENTO))
    }, [])
    return [ligado, definir] as const
}
