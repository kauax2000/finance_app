/**
 * A paleta que a pessoa escolhe — categoria, conta a pagar, marca de carteira.
 *
 * **São as oito paradas do arco-íris da marca**, e não uma lista própria. Até a
 * rodada 96 havia duas listas de hexadecimais crus do Tailwind sem relação
 * nenhuma com o produto: dez cores 500 em `CATEGORY_COLORS` e doze cores 600 em
 * `WORKSPACE_ACCENT_PALETTE`. As duas traziam a prova de que ninguém as tinha
 * revisitado desde que o branding mudou — a de carteira ainda se descrevia como
 * *"saturated backgrounds; white glyphs read clearly on top"*, que é exatamente
 * o desenho que o `ColorTile` abandonou por reprovar nos 3:1 da WCAG 1.4.11, e a
 * de categoria trazia `#6366F6`, um dígito trocado do indigo-500 (`#6366F1`) que
 * ninguém viu porque o ladrilho normaliza a claridade e o erro some.
 *
 * **Delas vem o matiz, e só ele** — é a regra que a rodada 83 aplicou à rampa de
 * identidade do avatar, e pelo mesmo motivo. Chapar a parada como ela é no
 * token reprova: com a tinta escura, índigo dá 3,55, violeta 3,21 e magenta
 * 4,09; com tinta branca, âmbar 1,94, lima 1,83, teal 2,23 e azul 2,42.
 * **Nenhuma tinta única serve as oito.** Os valores daqui são os oito matizes
 * da marca em `oklch(0.86 0.12 h)`, a banda da identidade, onde a tinta escura
 * entrega de 10,63 a 11,74 — a mesma faixa das seis identidades (10,17 a
 * 12,12).
 *
 * **Um valor só nos dois temas**, como a identidade: o pastel lê sobre o cartão
 * claro e sobre o escuro. As paradas da marca têm par por tema e estes não
 * precisam, porque a claridade aqui é fixa por construção.
 *
 * Os hexadecimais foram **medidos**, não convertidos de cabeça: cada um foi
 * rasterizado num canvas de 1×1 a partir do `oklch()`, que é o único jeito de
 * responder — `getComputedStyle` devolve `oklch()` de volta. Nenhum encosta na
 * parede do sRGB, verificado repintando cada um com croma ×1,08.
 *
 * **O ladrilho normaliza de novo o que sair daqui**, com a mesma fórmula, e isso
 * não é redundância: é o que cobre o seletor livre da carteira, onde a pessoa
 * digita qualquer hexadecimal. Uma cor desta lista atravessa a fórmula sem
 * mudar.
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

// Devolve `string`, e não a união dos oito literais: estes três são
// **sementes** — o valor inicial de um campo que a pessoa vai trocar por
// qualquer coisa —, e a união fecharia o estado de quem os consome.
const porNome = (nome: string): string =>
    TILE_PALETTE.find((p) => p.nome === nome)!.hex

/**
 * Onde a marca se encosta na semântica, de propósito.
 *
 * Os padrões de categoria eram esmeralda para receita e vermelho para despesa —
 * dinheiro codificado na cor de identidade. A intenção fica, dentro da família:
 * lima e coral. **Não confunda com a invariante 3**: quem diz "entrou" e "saiu"
 * continua sendo `--income` e `--expense`, e a lima da marca está 22° acima do
 * verde de estado justamente para não ser lido como ele. Isto aqui é o palpite
 * inicial de um acento que a pessoa troca no primeiro clique.
 */
export const TILE_INCOME_DEFAULT = porNome("lima")
export const TILE_EXPENSE_DEFAULT = porNome("coral")

/**
 * O azul de uma carteira que ainda não escolheu cor. Era `#2563EB` escrito por
 * extenso em cinco lugares; a parada de índigo está a **0,9°** dele, então a
 * troca não muda a cor — só para de repetir o valor.
 */
export const TILE_WORKSPACE_DEFAULT = porNome("índigo")

/**
 * O que já está gravado no banco, dobrado na leitura — **sem escrever nada**.
 *
 * É o precedente de `identityToneFor` em `lib/avatar.ts`, que dobra as 17
 * classes legadas do Tailwind nas seis identidades pela ordem do círculo de
 * matiz: o que está guardado continua decidindo **qual** é qual, e só o desenho
 * passa a ser de marca. Aqui a dobra é por **matiz mais próximo**, medida com a
 * conversão sRGB → OKLCh; o desvio vai de 0,9° a 32,5°, e a tabela sai escrita
 * por extenso porque uma conta em tempo de execução alcançaria também as cores
 * que a pessoa escolheu no seletor livre da carteira.
 *
 * **E é essa a linha:** só os 22 presets que o produto já ofereceu são dobrados.
 * Um hexadecimal digitado à mão atravessa intacto — quem escolheu o próprio azul
 * continua com ele.
 *
 * `#6B7280` é o caso que a régua de matiz erraria. Ele é o cinza da lista antiga,
 * croma 0,023: o matiz de 264° ali é ruído de arredondamento, e dobrá-lo por
 * matiz transformaria um cinza deliberado num azul. Ele vira `null`, que é o
 * ladrilho sem cor — o neutro que a rodada 95 passou a declarar.
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
 * A cor que o ladrilho deve desenhar, a partir do que está gravado.
 *
 * **É idempotente**, e isso é carga estrutural: uma parada da marca não está na
 * tabela e atravessa intacta, então aplicar a dobra duas vezes dá o mesmo
 * resultado. É o que permite chamá-la tanto no `ColorTile` — onde ela alcança os
 * onze sítios de uma vez e não dá para esquecer — quanto na tela de detalhe da
 * categoria, onde o **gráfico** lê a mesma cor por `hexToRgba` e ficaria de
 * família diferente do ladrilho ao lado.
 */
export function tileColorFor(
    stored: string | null | undefined
): string | null {
    const bruto = stored?.trim()
    if (!bruto) return null
    const dobrado = LEGACY[bruto.toUpperCase()]
    return dobrado === undefined ? bruto : dobrado
}
