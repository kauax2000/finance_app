export const SECOES = [
    { id: "carteira", label: "Carteira" },
    { id: "notificacoes", label: "Notificações" },
    { id: "aparelho", label: "Este aparelho" },
    { id: "ia", label: "IA e privacidade" },
] as const

export type SecaoId = (typeof SECOES)[number]["id"]

/** A seção do `?secao=`; ausente ou desconhecida abre Carteira. */
export function secaoDaUrl(valor: string | null): SecaoId {
    return SECOES.find((s) => s.id === valor)?.id ?? "carteira"
}
