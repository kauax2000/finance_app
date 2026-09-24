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
 * `linear()` de CSS, para as animações de keyframes (rodada 129).
 */
export const MOLA = { type: "spring", stiffness: 300, damping: 25 } as const
