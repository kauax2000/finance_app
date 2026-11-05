import { useSyncExternalStore } from "react"

/**
 * O servidor lento: um pedido de dados ou de login ao Supabase aberto há mais de
 * `LIMITE_DE_LENTIDAO_MS` acende o aviso, e ele apaga quando o último pedido
 * lento responde (ou falha). Sem isso a tela fica no esqueleto sem dizer por
 * quê — em 05/11/2026 a API levou de 10 a 20s e Membros parecia quebrada.
 *
 * Só `/rest/v1/` e `/auth/v1/` contam: as Edge Functions (a IA) e os uploads
 * demoram de propósito. Um armazém do módulo, como `abas-fora.ts`: quem mede é o
 * `fetch` do cliente, que não está na árvore do React.
 */
export const LIMITE_DE_LENTIDAO_MS = 4000

const ROTAS_RASTREADAS = ["/rest/v1/", "/auth/v1/"]

let lentos = 0
const ouvintes = new Set<() => void>()

function publicar(delta: number) {
    const antes = lentos > 0
    lentos += delta
    if (antes !== lentos > 0) for (const ouvinte of ouvintes) ouvinte()
}

function urlDe(input: RequestInfo | URL): string {
    if (typeof input === "string") return input
    if (input instanceof URL) return input.href
    return input.url
}

/** O `fetch` que o cliente Supabase usa: o mesmo pedido, com o relógio da lentidão. */
export function fetchComAvisoDeLentidao(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const pedido = globalThis.fetch(input, init)
    const url = urlDe(input)
    if (!ROTAS_RASTREADAS.some((rota) => url.includes(rota))) return pedido

    let marcado = false
    const relogio = setTimeout(() => {
        marcado = true
        publicar(1)
    }, LIMITE_DE_LENTIDAO_MS)
    const fim = () => {
        clearTimeout(relogio)
        if (marcado) publicar(-1)
    }
    pedido.then(fim, fim)
    return pedido
}

function assinar(ouvinte: () => void) {
    ouvintes.add(ouvinte)
    return () => {
        ouvintes.delete(ouvinte)
    }
}

/** Verdadeiro enquanto algum pedido passa do limite. No servidor, nunca. */
export function useServidorLento(): boolean {
    return useSyncExternalStore(assinar, () => lentos > 0, () => false)
}

/** Só para teste. */
export function servidorLentoAgora(): boolean {
    return lentos > 0
}
