import { useSyncExternalStore } from "react"

/**
 * As abas que não couberam na barra de baixo (rodada 342), publicadas por ela e
 * lidas pela página Você, que as mostra no topo (rodada 346). Quem sabe é a
 * barra, que mede os nomes no canvas; a página não mede de novo. Um armazém do
 * módulo, e não um contexto na casca: a barra e a página não se veem na árvore.
 */
const VAZIO: readonly string[] = []
let atual: readonly string[] = VAZIO
const ouvintes = new Set<() => void>()

/** Grava os `href` que saíram. A mesma lista não notifica, para a barra não re-renderizar a página a cada medida. */
export function publicarAbasFora(hrefs: readonly string[]): void {
    if (hrefs.length === atual.length && hrefs.every((href, i) => href === atual[i])) return
    atual = hrefs.length === 0 ? VAZIO : [...hrefs]
    for (const ouvinte of ouvintes) ouvinte()
}

function assinar(ouvinte: () => void) {
    ouvintes.add(ouvinte)
    return () => {
        ouvintes.delete(ouvinte)
    }
}

/** Os `href` que saíram da barra. No servidor ninguém mediu: nenhum. */
export function useAbasFora(): readonly string[] {
    return useSyncExternalStore(assinar, () => atual, () => VAZIO)
}
