import type {
    Bill,
    BillInstance,
    CreditCard,
    CreditCardStatementTotal,
    Transaction,
    WorkspaceInstallmentPlan,
    WorkspaceSubscription,
} from "@/lib/supabase"

/** Tudo o que a previsão lê da carteira. O dia vem daqui; nenhuma função lê o relógio. */
export type DadosDaPrevisao = {
    hojeYmd: string
    /** As da carteira, com o padding de meses que a função pedir. */
    transacoes: Transaction[]
    assinaturas: WorkspaceSubscription[]
    planos: WorkspaceInstallmentPlan[]
    /** Só os ativos. */
    cartoes: CreditCard[]
    totaisDoBanco: CreditCardStatementTotal[]
    /** `statementTotalKey(cardId, closeYmd)` de `credit_card_invoice_payments`. */
    faturasPagas: Set<string>
    contas: Bill[]
    /** `status = 'pending'`: uma por conta. */
    contasPendentes: BillInstance[]
    /** `workspaces.monthly_savings_target`. */
    reserva: number | null
}

export type FaturaDoMes = {
    cardId: string
    nome: string
    closeYmd: string
    dueYmd: string
    total: number
    paga: boolean
    usaTotalDoBanco: boolean
}

export type FluxoDoMes = {
    ym: string
    receitas: { recebidas: number; previstas: number }
    /** Fora do crédito: transações, assinaturas, parcelas e contas. */
    despesas: { pagas: number; previstas: number }
    faturas: FaturaDoMes[]
    /** O nome das contas que entraram com 0 por não terem valor. */
    contasSemValor: string[]
    entra: number
    sai: number
    sobra: number
}

export type Seguro = FluxoDoMes & {
    reserva: number
    seguro: number
    diasRestantes: number
    porDia: number
    comprometidoNaProximaFatura: number
}

export type MesDaLinha = FluxoDoMes & {
    fimDeParcelamentos: Array<{ planoId: string; descricao: string }>
}

export type Projecao = { meses: MesDaLinha[]; primeiroMesNegativo: string | null }
