import type { PaymentMethod } from "@/lib/payment-methods"
import type { WorkspaceRole } from "@/lib/supabase"
import { ehAdulto } from "@/lib/papeis/papeis"

/** Os métodos do `guardar_privado` (Pix, débito, dinheiro), além do cartão do titular. */
export const METODOS_PRIVADOS: ReadonlySet<PaymentMethod> = new Set(["pix", "debit_card", "cash"])

export const MOTIVO = {
    cartaoDaCasa: "No cartão da casa o titular vê a fatura no banco.",
    outroTitular: "Só o titular do cartão pode marcar como privado.",
    convidado: "Quem é convidado não marca gasto privado.",
    vinculo: "Assinatura, parcela e conta não podem ser privadas.",
    metodo: "Só Pix, débito, dinheiro ou o cartão de que você é titular podem ser privados.",
    /** O `PRIVADO_NAO_PERMITIDO` do banco, que não diz qual regra barrou. */
    banco: "Este gasto não pode ser privado: só a despesa de adulto por Pix, débito, dinheiro ou no cartão de que ele é titular, sem assinatura, parcela ou conta.",
} as const

export type PodeSerPrivado = { pode: true } | { pode: false; motivo: string }

/**
 * A regra do gatilho `guardar_privado` (Ruling 3), para a tela explicar antes
 * de salvar: o banco continua sendo a garantia. Despesa só (quem chama não
 * mostra a chave na receita). A conta ligada só o banco vê; aqui o
 * `vinculado` é a assinatura e o parcelamento da linha.
 */
export function podeSerPrivado({
    papel,
    metodo,
    cartao,
    autorId,
    vinculado = false,
}: {
    papel: WorkspaceRole | null
    metodo: PaymentMethod | null
    cartao: { holder_user_id?: string | null } | null
    autorId: string
    vinculado?: boolean
}): PodeSerPrivado {
    if (!ehAdulto(papel)) return { pode: false, motivo: MOTIVO.convidado }
    if (vinculado) return { pode: false, motivo: MOTIVO.vinculo }
    if (metodo && METODOS_PRIVADOS.has(metodo)) return { pode: true }
    if (metodo !== "credit_card") return { pode: false, motivo: MOTIVO.metodo }
    const titular = cartao?.holder_user_id ?? null
    if (!titular) return { pode: false, motivo: MOTIVO.cartaoDaCasa }
    if (titular !== autorId) return { pode: false, motivo: MOTIVO.outroTitular }
    return { pode: true }
}
