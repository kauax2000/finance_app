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
    semCartao: "Escolha o cartão de que você é titular.",
    receita: "Só despesa pode ser privada.",
    /** O `PRIVADO_NAO_PERMITIDO` do banco, que não diz qual regra barrou. */
    banco: "Este gasto não pode ser privado: só a despesa de adulto por Pix, débito, dinheiro ou no cartão de que ele é titular, sem assinatura, parcela ou conta.",
} as const

export type PodeSerPrivado = { pode: true } | { pode: false; motivo: string }

/**
 * A regra do gatilho `guardar_privado` (Ruling 3), para a tela explicar antes
 * de salvar: o banco continua sendo a garantia. Despesa só: quem chama mostra
 * a chave na receita só quando edita uma privada (`receita`, para dizer por
 * que ela não vale mais). A conta ligada só o banco vê; aqui o `vinculado` é
 * a assinatura e o parcelamento da linha.
 */
export function podeSerPrivado({
    papel,
    metodo,
    cartao,
    autorId,
    vinculado = false,
    receita = false,
}: {
    papel: WorkspaceRole | null
    metodo: PaymentMethod | null
    cartao: { holder_user_id?: string | null } | null
    autorId: string
    vinculado?: boolean
    receita?: boolean
}): PodeSerPrivado {
    if (!ehAdulto(papel)) return { pode: false, motivo: MOTIVO.convidado }
    if (receita) return { pode: false, motivo: MOTIVO.receita }
    if (vinculado) return { pode: false, motivo: MOTIVO.vinculo }
    if (metodo && METODOS_PRIVADOS.has(metodo)) return { pode: true }
    if (metodo !== "credit_card") return { pode: false, motivo: MOTIVO.metodo }
    // O cartão apagado (`on delete set null`) deixa a privada sem cartão.
    if (!cartao) return { pode: false, motivo: MOTIVO.semCartao }
    const titular = cartao.holder_user_id ?? null
    if (!titular) return { pode: false, motivo: MOTIVO.cartaoDaCasa }
    if (titular !== autorId) return { pode: false, motivo: MOTIVO.outroTitular }
    return { pode: true }
}

/**
 * Ruling 10: a privada cuja regra não vale mais (o titular saiu, o cartão foi
 * apagado, virou receita, o método mudou) segura o salvar com o motivo, até a
 * autora corrigir o método ou escolher "Deixar de ser privado". Nulo quando
 * nada segura.
 */
export function privadaPresa({
    marcado,
    regra,
    eraPrivada,
}: {
    marcado: boolean
    regra: PodeSerPrivado | null
    eraPrivada: boolean
}): string | null {
    return eraPrivada && marcado && regra && !regra.pode ? regra.motivo : null
}

/**
 * O `isPrivate` que o salvar manda (Ruling 8): `true` ao marcar, `false` ao
 * desmarcar uma linha que era privada, e nada no resto. Assim o insert comum
 * não cita a coluna, e o front roda num banco sem a migração do 7B. Sem a
 * regra (o papel a caminho, a linha de outra pessoa) a coluna não vai.
 * Ruling 10: o `false` só sai do desmarcar da autora, nunca de uma regra que
 * deixou de valer (`privadaPresa`); sem a coluna, o banco recusa em vez de
 * revelar.
 */
export function privadoDoSalvar({
    marcado,
    regra,
    eraPrivada,
}: {
    marcado: boolean
    regra: PodeSerPrivado | null
    eraPrivada: boolean
}): boolean | undefined {
    if (!regra) return undefined
    if (eraPrivada && !marcado) return false
    return marcado && regra.pode ? true : undefined
}
