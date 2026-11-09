import { localYmdFromDate } from "@/lib/transaction-date"

/**
 * A cota diária da IA acabou hoje, neste aparelho: o "+ Adicionar" abre o
 * formulário no lugar do lançamento inteligente até o dia virar. O dia é o
 * local do navegador, como o resto do cliente (`credit-card-billing.ts`); o
 * servidor conta pelo de São Paulo.
 * shortcut: só este aparelho sabe; outro descobre na primeira leitura recusada.
 */
const CHAVE = "ia:cota-esgotada"

type Armazenamento = Pick<Storage, "getItem" | "setItem">

function armazenamento(): Armazenamento | null {
    return typeof localStorage === "undefined" ? null : localStorage
}

export function marcarCotaEsgotada(storage = armazenamento(), hoje = localYmdFromDate(new Date())) {
    try {
        storage?.setItem(CHAVE, hoje)
    } catch {
        // Sem armazenamento (aba privada): a paleta abre e a IA recusa de novo.
    }
}

export function cotaEsgotadaHoje(storage = armazenamento(), hoje = localYmdFromDate(new Date())): boolean {
    try {
        return storage?.getItem(CHAVE) === hoje
    } catch {
        return false
    }
}
