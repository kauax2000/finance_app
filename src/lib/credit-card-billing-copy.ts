/** Centralized pt-BR copy for credit card billing cycle UI. */

export const CREDIT_CARD_BILLING_FORM = {
    sectionTitle: "Ciclo da fatura",
    lead: "Informe o dia de fechamento e o dia de vencimento da sua fatura que constam no app ou no contrato do cartão.",
    closing: {
        label: "Dia de fechamento",
        placeholder: "Ex.: 10",
    },
    due: {
        label: "Dia de vencimento",
        placeholder: "Ex.: 15",
    },
    unusualDueWarning:
        "Vencimento no mesmo dia ou antes do fechamento é incomum — confira no app do banco.",
    previewIntro: "Se você comprasse hoje:",
    previewClose: "esta compra entraria na fatura que fecha em",
    previewDue: "vencimento estimado em",
    results: {
        title: "Depois de salvar, você verá:",
        items: [
            "Total da fatura aberta e da última fechada",
            "Próximo fechamento e vencimento estimado",
            "Despesas agrupadas por período da fatura",
            "Alertas de fechamento e vencimento (se habilitados)",
        ] as const,
    },
    collapsible: {
        trigger: "Entenda o ciclo",
        sections: [
            {
                id: "closing",
                title: "Dia de fechamento",
                paragraphs: [
                    "Último dia do período da fatura. Se fecha no dia 10, compras até o dia 10 (inclusive) entram na mesma fatura; no dia 11, já na próxima. Até fechar, a fatura fica aberta e ainda recebe compras.",
                ],
            },
            {
                id: "due",
                title: "Dia de vencimento",
                paragraphs: [
                    "Dia em que você costuma pagar. O app estima essa data no mês seguinte ao fechamento — referência para planejar, não substitui o extrato do banco.",
                ],
            },
            {
                id: "inApp",
                title: "No app",
                paragraphs: [
                    "Com esses dias, agrupamos despesas por fatura e mostramos totais, próximas datas e alertas. O exemplo acima dos campos simula uma compra feita hoje.",
                ],
            },
            {
                id: "notes",
                title: "Observações",
                paragraphs: [
                    "Dia 31 vira o último dia do mês quando o mês é mais curto. Feriados e regras do banco podem mudar as datas — confira no app do emissor se precisar.",
                ],
            },
        ] as const,
    },
} as const

export const CREDIT_CARDS_EMPTY_BILLING_HINT =
    "Cadastre fechamento e vencimento para acompanhar totais por fatura nas despesas."
