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

type Folga = { top: number; right: number; bottom: number; left: number }

let sonda: HTMLElement | null = null
let areaSegura: Folga | null = null

/** A área segura em px, lida de uma sonda com `env(safe-area-inset-*)`; refeita quando a janela gira. */
function lerAreaSegura(): Folga {
  if (areaSegura) return areaSegura
  if (!sonda) {
    sonda = document.createElement("div")
    sonda.setAttribute("aria-hidden", "true")
    sonda.style.cssText =
      "position:fixed;inset:0 auto auto 0;visibility:hidden;pointer-events:none;" +
      "padding:env(safe-area-inset-top,0px) env(safe-area-inset-right,0px) env(safe-area-inset-bottom,0px) env(safe-area-inset-left,0px)"
    document.body.appendChild(sonda)
    window.addEventListener("resize", () => (areaSegura = null))
  }
  const s = getComputedStyle(sonda)
  areaSegura = {
    top: parseFloat(s.paddingTop) || 0,
    right: parseFloat(s.paddingRight) || 0,
    bottom: parseFloat(s.paddingBottom) || 0,
    left: parseFloat(s.paddingLeft) || 0,
  }
  return areaSegura
}

/**
 * A folga de colisão somada à área segura: no app instalado do iPhone a barra
 * de status e o indicador de início são página, e um seletor que abria para
 * cima passava por baixo do relógio. No servidor, a folga sozinha.
 */
export function anchoredCollisionPadding(): number | Folga {
  if (typeof document === "undefined") return ANCHORED_COLLISION_PADDING
  const a = lerAreaSegura()
  return {
    top: ANCHORED_COLLISION_PADDING + a.top,
    right: ANCHORED_COLLISION_PADDING + a.right,
    bottom: ANCHORED_COLLISION_PADDING + a.bottom,
    left: ANCHORED_COLLISION_PADDING + a.left,
  }
}
