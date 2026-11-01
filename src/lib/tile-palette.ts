/**
 * A paleta que a pessoa escolhe (categoria, conta a pagar, marca de carteira):
 * as oito paradas do arco-íris da marca, em `oklch(0.86 0.12 h)`, a banda da
 * identidade. Delas vem só o matiz, porque nenhuma tinta única serve as oito
 * paradas chapadas como o token as pinta; aqui a tinta escura entrega de 10,63
 * a 11,74. Um valor só nos dois temas. O ladrilho normaliza de novo o que sai
 * daqui, para cobrir o seletor livre da carteira, e uma cor desta lista
 * atravessa a fórmula sem mudar.
 */
export const TILE_PALETTE = [
    { nome: "teal", hex: "#5DE9E9", matiz: 195 },
    { nome: "azul", hex: "#6EE2FF", matiz: 225 },
    { nome: "índigo", hex: "#A6D1FF", matiz: 262 },
    { nome: "violeta", hex: "#D0C4FF", matiz: 290 },
    { nome: "magenta", hex: "#FFB3F0", matiz: 335 },
    { nome: "coral", hex: "#FFB49B", matiz: 35 },
    { nome: "âmbar", hex: "#F5CB70", matiz: 85 },
    { nome: "lima", hex: "#B7E18C", matiz: 130 },
] as const

/** As oito, só os valores — é o que um seletor de amostras precisa. */
export const TILE_COLORS = TILE_PALETTE.map((p) => p.hex) as readonly string[]

// Devolve `string` e não a união dos oito literais: são sementes de um campo que a pessoa troca.
const porNome = (nome: string): string =>
    TILE_PALETTE.find((p) => p.nome === nome)!.hex

/**
 * O palpite inicial de um acento que a pessoa troca no primeiro clique: lima
 * para receita e coral para despesa. Quem diz "entrou" e "saiu" continua sendo
 * `--income` e `--expense` (invariante 3); a lima fica 22° acima do verde de estado.
 */
export const TILE_INCOME_DEFAULT = porNome("lima")
export const TILE_EXPENSE_DEFAULT = porNome("coral")

/** O azul de uma carteira que ainda não escolheu cor: a parada de índigo está a 0,9° do `#2563EB` antigo. */
export const TILE_WORKSPACE_DEFAULT = porNome("índigo")

/**
 * O que já está gravado no banco, dobrado na leitura sem escrever nada (como
 * `identityToneFor`): só os 22 presets que o produto já ofereceu, pelo matiz
 * mais próximo; um hexadecimal digitado à mão atravessa intacto. A tabela é por
 * extenso porque uma conta em runtime alcançaria também o seletor livre. O
 * `#6B7280` vira `null` (o ladrilho sem cor): é cinza de croma 0,023, e dobrá-lo
 * por matiz o faria azul.
 */
const LEGACY: Record<string, string | null> = {
    // As dez de categoria (Tailwind 500). Desvio de matiz entre parênteses.
    "#10B981": porNome("teal"), //     esmeralda 162,5° (32,5°)
    "#3B82F6": porNome("índigo"), //   azul 259,8° (2,2°)
    "#F59E0B": porNome("âmbar"), //    âmbar 70,1° (14,9°)
    "#EF4444": porNome("coral"), //    vermelho 25,3° (9,7°)
    "#8B5CF6": porNome("violeta"), //  violeta 292,7° (2,7°)
    "#EC4899": porNome("magenta"), //  rosa 354,3° (19,3°)
    "#6366F6": porNome("violeta"), //  o indigo com o dígito trocado, 276,9° (13,1°)
    "#14B8A6": porNome("teal"), //     teal 182,5° (12,5°)
    "#F97316": porNome("coral"), //    laranja 47,6° (12,6°)
    "#6B7280": null, //                cinza, croma 0,023 — vira o neutro
    // As doze de carteira (Tailwind 600).
    "#2563EB": porNome("índigo"), //   azul 262,9° (0,9°)
    "#7C3AED": porNome("violeta"), //  violeta 293° (3°)
    "#DB2777": porNome("magenta"), //  rosa 0,6° (25,6°)
    "#DC2626": porNome("coral"), //    vermelho 27,3° (7,7°)
    "#EA580C": porNome("coral"), //    laranja 41,1° (6,1°)
    "#CA8A04": porNome("âmbar"), //    amarelo 75,8° (9,2°)
    "#16A34A": porNome("lima"), //     verde 149,2° (19,2°)
    "#0D9488": porNome("teal"), //     teal 184,7° (10,3°)
    "#0891B2": porNome("azul"), //     ciano 221,7° (3,3°)
    "#4F46E5": porNome("violeta"), //  índigo 277° (13°)
    "#9333EA": porNome("violeta"), //  roxo 302,3° (12,3°)
    "#C026D3": porNome("magenta"), //  fúcsia 322,9° (12,1°)
}

/**
 * A cor que o ladrilho deve desenhar, a partir do que está gravado. É
 * idempotente (uma parada da marca não está na tabela), e é isso que permite
 * chamá-la no `ColorTile` e no gráfico, que lê a mesma cor por `hexToRgba`.
 */
export function tileColorFor(
    stored: string | null | undefined
): string | null {
    const bruto = stored?.trim()
    if (!bruto) return null
    const dobrado = LEGACY[bruto.toUpperCase()]
    return dobrado === undefined ? bruto : dobrado
}
