import type { AparelhoDeLancar } from "@/hooks/use-aparelho-de-lancar"

/** O estado de uma lista da pessoa (IAs, aparelhos), pelo que a página Você decide. */
type Lista = { carregando: boolean; erro: boolean; quantos: number }

/** O cartão só com a lista carregada e vazia: carregando ou com erro, a linha leva à tela. */
const vazia = (l: Lista) => !l.carregando && !l.erro && l.quantos === 0

/** A IA em Conta: o cartão de conectar até a primeira, depois a linha. */
export function iaNaVoce(l: Lista): "cartao" | "linha" {
    return vazia(l) ? "cartao" : "linha"
}

/** Lançar pelo iPhone em Neste celular: só no iPhone; no navegador dele, o convite de instalar. */
export function lancarNaVoce(aparelho: AparelhoDeLancar, l: Lista): "cartao" | "linha" | "convite" | null {
    if (aparelho === "iphone-instalado") return vazia(l) ? "cartao" : "linha"
    if (aparelho === "navegador-iphone") return "convite"
    return null
}

/** A descrição da linha: um ou dois nomes por extenso, três ou mais pela contagem. */
export function descricaoDaLista(nomes: string[], plural: string): string | undefined {
    if (nomes.length === 0) return undefined
    if (nomes.length <= 2) return nomes.join(", ")
    return `${nomes.length} ${plural}`
}
