/**
 * A documentação roda sempre em desenvolvimento e, em produção, só quando
 * `NEXT_PUBLIC_DS_DOCS` vale "1" ou "true".
 *
 * A variável precisa do prefixo `NEXT_PUBLIC_` porque o layout que a consulta é
 * o de uma rota estática: sem o prefixo, o valor não chega ao bundle e a
 * checagem passaria a valer só no servidor, com a página já enviada.
 */
export function isDesignSystemEnabled(): boolean {
    if (process.env.NODE_ENV !== "production") return true
    const flag = process.env.NEXT_PUBLIC_DS_DOCS
    return flag === "1" || flag === "true"
}
