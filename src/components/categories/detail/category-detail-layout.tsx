"use client"

import type { ReactNode } from "react"

/**
 * O casco do detalhe da categoria, igual no telefone e no desktop, sem abas:
 * a faixa do mês, os últimos meses, o insight, a lista e o link para a análise
 * no Painel. No desktop o conteúdo começa onde começa o ladrilho do cabeçalho
 * (38px depois da borda, com o voltar), e recua o mesmo à direita.
 */
export function CategoryDetailLayout({
    resumo,
    meses,
    insight,
    lancamentos,
    analise,
}: {
    resumo: ReactNode
    meses: ReactNode
    insight: ReactNode
    lancamentos: ReactNode
    /** O link "Ver a análise de … no Painel"; null sem ele. */
    analise: ReactNode
}) {
    return (
        <div className="flex min-w-0 flex-col gap-6 md:px-9.5">
            {resumo}
            {meses}
            {insight}
            {lancamentos}
            {analise ? <div className="flex justify-center">{analise}</div> : null}
        </div>
    )
}
