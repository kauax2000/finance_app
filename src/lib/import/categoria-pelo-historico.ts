import { normalizarDescricao, palavraSignificativa } from "./normalizar"

type Historico = Array<{ description: string | null; category_id: string | null; date: string }>

function maisRecente(lista: Historico): string | null {
    let melhor: Historico[number] | null = null
    for (const t of lista) if (!melhor || t.date > melhor.date) melhor = t
    return melhor?.category_id ?? null
}

/**
 * A categoria da transação mais recente com a mesma descrição normalizada; senão,
 * da mais recente que divide a primeira palavra significativa; senão, `null`.
 */
export function sugerirCategoria(descricao: string, historico: Historico): string | null {
    const comCategoria = historico.filter((t) => t.category_id != null && t.description)
    const alvo = normalizarDescricao(descricao)
    const igual = maisRecente(comCategoria.filter((t) => normalizarDescricao(t.description!) === alvo))
    if (igual) return igual
    const palavra = palavraSignificativa(descricao)
    if (!palavra) return null
    return maisRecente(comCategoria.filter((t) => palavraSignificativa(t.description!) === palavra))
}
