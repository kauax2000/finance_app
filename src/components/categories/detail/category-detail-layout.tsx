"use client"

import type { ReactNode } from "react"

/**
 * O casco do detalhe da categoria, igual no telefone e no desktop, sem abas:
 * a faixa do mês, do que é feito o mês, os últimos meses, quem gastou, o
 * insight, a lista e o link para a análise
 * no Painel. No desktop o conteúdo começa onde começa o ladrilho do cabeçalho
 * (38px depois da borda, com o voltar), e recua o mesmo à direita.
 */
export function CategoryDetailLayout({
    resumo,
    composicao,
    meses,
    quem,
    insight,
    lancamentos,
    analise,
}: {
    resumo: ReactNode
    /** "Do que é feito o mês"; null sem lançamento. */
    composicao: ReactNode
    meses: ReactNode
    /** "Quem gastou"; null fora da carteira de adultos ou com uma pessoa só. */
    quem: ReactNode
    insight: ReactNode
    lancamentos: ReactNode
    /** O link "Ver a análise de … no Painel"; null sem ele. */
    analise: ReactNode
}) {
    return (
        <div className="flex min-w-0 flex-col gap-6 md:px-9.5">
            {resumo}
            {composicao}
            {meses}
            {quem}
            {insight}
            {lancamentos}
            {analise ? <div className="flex justify-center">{analise}</div> : null}
        </div>
    )
}
