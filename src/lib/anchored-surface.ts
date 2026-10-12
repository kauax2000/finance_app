/**
 * A régua das superfícies ancoradas num gatilho: ela cabe inteira na janela, em
 * três cláusulas que precisam valer juntas. (1) Centra no gatilho quando cabe.
 * (2) Quando não cabe, desloca para dentro (`avoidCollisions`, o padrão do
 * Radix) com a folga de {@link ANCHORED_COLLISION_PADDING}. (3) Quando é maior
 * que o espaço, encolhe: `max-w-(--radix-<primitiva>-content-available-width)`
 * e o `max-h` correspondente — deslocar não resolve a que é mais larga que a
 * janela. Não modal, ela fecha quando a página rola (`useCloseOnScroll`).
 *
 * A folga é do sistema, não da tela: a regra K do `ds:audit` impede outra
 * grafia. As classes ficam literais em cada arquivo, porque carregam o nome da
 * primitiva e o Tailwind varre texto (ver `menu-classes`); este arquivo
 * compartilha o número, e o teste ao lado a lista.
 */

/** A folga entre uma superfície ancorada e a borda da janela, em pixels. */
export const ANCHORED_COLLISION_PADDING = 8
