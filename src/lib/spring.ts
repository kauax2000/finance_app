/**
 * A mola da casa, e ela fica **fora** da escala `--duration-*`/`--ease-*`.
 *
 * Aqueles tokens descrevem transição de CSS: uma duração e uma curva. Uma mola
 * não tem duração — tem rigidez e amortecimento, e o tempo é consequência do
 * trajeto. É a mesma exceção que a `link-sweep` já abre no `globals.css`.
 *
 * Os números são os da referência da `Tooltip`
 * (`@animate-ui/components-base-tooltip`), lidos do registry. A espiada do
 * `Collapsible` anda nela, e `--ease-spring` é esta mesma mola amostrada num
 * `linear()` de CSS, para as animações de keyframes.
 */
export const MOLA = { type: "spring", stiffness: 300, damping: 25 } as const

/** A mola do palco do `Showcase`: mais lenta e sem passar do alvo, para a moldura que muda de forma (~650ms). */
export const MOLA_PALCO = { type: "spring", stiffness: 220, damping: 30 } as const

/**
 * A `MOLA_PALCO` na projeção de layout (a moldura, as peças e o fantasma do voo). A projeção do `motion` anda de 0
 * a 1000, e o repouso padrão (velocidade 2, distância 0,5 nessa escala) espera a cauda subpixel: ~800ms, quando
 * nenhum quadro anda mais 0,5px desde os ~480ms. Com velocidade 20 e distância 2 — 0,2% do trajeto, meio pixel
 * numa troca de 300px — ela assenta aos ~610ms, o "~650ms" do plano, e o login repousa antes dos 5s também com
 * CPU 4×. Só na projeção: num raio em px a distância 2 seria um salto de 2px, e o raio fica na `MOLA_PALCO`.
 */
export const MOLA_PALCO_LAYOUT = { ...MOLA_PALCO, restSpeed: 20, restDelta: 2 } as const

/**
 * A mola da divisão da busca do telefone (a cápsula do header que se parte em duas bolhas, `CommandDialog`).
 * Mais lenta que a `MOLA`, e ainda com um passe de ~1%: na `MOLA` a pinça ia dos 26 aos 81ms (três quadros) e a
 * divisão não se lia. Era 180/22 e ficou 140/20 (rodada 350, "levemente mais lento para apreciar", ~20-25%).
 * Medida no gerador do próprio `motion` (passos de 1ms): p cruza 0,1 aos 44ms, 0,6 aos 155ms, 0,7 aos 182ms
 * e 1 aos 408ms, com pico de 1,007 aos 497ms e repouso aos 770ms (180/22: 39, 134, 158, 330, 1,011 e 690).
 * A cintura (a emenda arredondando com as bolhas ainda encostadas) dura 111ms, e a pinça inteira 138ms
 * (`command-versions.test.ts`).
 */
export const SEPARACAO = { type: "spring", stiffness: 140, damping: 20 } as const

/** A saída do palco: 150ms (`--duration-fast`) em `--ease-in-out`, espelhado aqui para o `motion`. */
export const SAIDA = { duration: 0.15, ease: [0.65, 0, 0.35, 1] } as const
