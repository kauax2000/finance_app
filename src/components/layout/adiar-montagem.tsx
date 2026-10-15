"use client"

import * as React from "react"

/**
 * Mostra `fallback` no primeiro quadro e monta `children` logo depois, numa
 * transição.
 *
 * A navegação do Next é uma transição: o React só troca a tela quando a página
 * nova termina de renderizar, e como os dados vêm do cache do React Query, a
 * página monta inteira (tabela, gráficos) antes de aparecer — centenas de ms
 * em que o clique parece não ter feito nada. O `loading.tsx` não cobre isso,
 * porque nada suspende. Com este invólucro a troca acontece na hora, com o
 * esqueleto da rota, e a página pesada monta em seguida sem travar a tela.
 */
export function AdiarMontagem({
    fallback,
    children,
}: {
    fallback: React.ReactNode
    children: React.ReactNode
}) {
    const [pronto, setPronto] = React.useState(false)
    React.useEffect(() => {
        React.startTransition(() => setPronto(true))
    }, [])
    return pronto ? children : fallback
}
