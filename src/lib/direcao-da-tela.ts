export type DirecaoDaTela = "entra" | "volta"

// Teto contra um `paiDe` que gire em ciclo.
const DEGRAUS_MAX = 8

// A rota e seus pais, do mais perto ao mais longe. O pai pode trazer query ou
// hash (o voltar da categoria), que não fazem parte da rota.
function cadeiaDe(rota: string, paiDe: (rota: string) => string | undefined): string[] {
    const cadeia = [rota]
    let atual: string | undefined = rota
    while (cadeia.length < DEGRAUS_MAX) {
        const pai: string | undefined = paiDe(atual)?.split(/[?#]/)[0]
        if (!pai) break
        cadeia.push(pai)
        atual = pai
    }
    return cadeia
}

/** Só a hierarquia anima: aba é lugar, não página; irmãs e a mesma rota ficam `null`. */
export function direcaoDaTela(
    de: string,
    para: string,
    paiDe: (rota: string) => string | undefined,
): DirecaoDaTela | null {
    if (de === para) return null
    const cadeiaOrigem = cadeiaDe(de, paiDe)
    const cadeiaPara = cadeiaDe(para, paiDe)
    if (cadeiaOrigem.includes(para)) return "volta"
    return cadeiaPara.length > cadeiaOrigem.length ? "entra" : null
}
