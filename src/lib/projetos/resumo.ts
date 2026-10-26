/**
 * O resumo de um projeto ou de uma carteira de projeto (Bloco 7C, Decisão 1):
 * o gasto, o que falta do orçamento e as quebras por categoria e por pessoa.
 * Só despesa entra; tudo em centavos, para a soma não arredondar errado.
 */

/** A chave do lançamento sem categoria em `porCategoria`. */
export const SEM_CATEGORIA = ""

export type LancamentoDoResumo = { amount: number; type: string; category_id: string | null; user_id: string }

export type ResumoDoProjeto = {
    gastoCentavos: number
    /** Nula sem orçamento; negativa quando o gasto passa dele. */
    faltaCentavos: number | null
    porCategoria: Record<string, number>
    porPessoa: Record<string, number>
}

const emCentavos = (valor: number) => Math.round(Number(valor) * 100)

export function resumoDoProjeto(lancs: LancamentoDoResumo[], orcamento: number | null): ResumoDoProjeto {
    let gastoCentavos = 0
    const porCategoria: Record<string, number> = {}
    const porPessoa: Record<string, number> = {}
    for (const l of lancs) {
        if (l.type !== "expense") continue
        const c = emCentavos(l.amount)
        gastoCentavos += c
        const categoria = l.category_id ?? SEM_CATEGORIA
        porCategoria[categoria] = (porCategoria[categoria] ?? 0) + c
        porPessoa[l.user_id] = (porPessoa[l.user_id] ?? 0) + c
    }
    return {
        gastoCentavos,
        faltaCentavos: orcamento == null ? null : emCentavos(orcamento) - gastoCentavos,
        porCategoria,
        porPessoa,
    }
}
