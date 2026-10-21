/** Um lançamento lido de um arquivo do banco (CSV, OFX ou texto de fatura). */
export type ItemBanco = {
    data: string // "YYYY-MM-DD"
    descricao: string
    valor: number // sempre positivo
    estorno: boolean // crédito na fatura, ou receita em conta
    parcela: { k: number; n: number } | null
    categoria?: string // só a planilha traz
}

export type LeituraFatura = {
    itens: ItemBanco[]
    total: number | null
    vencimento: string | null
    fechamento: string | null
    completa: boolean // total achado e |soma(itens) − total| < 0.01
    diferenca: number | null // total − soma(itens), estorno contando negativo
}
