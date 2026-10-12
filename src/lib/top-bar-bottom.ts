/**
 * A base da barra do topo no documento `doc`, em px: `--top-bar-bottom`, que o
 * `globals.css` declara no `:root` de cada documento (o iframe da prévia tem o
 * seu). Lida na hora — o CSS é quem acompanha a barra; 0 sem barra.
 */
export function topBarBottom(doc: Document) {
  const raiz = (doc.defaultView ?? window).getComputedStyle(doc.documentElement)
  return parseFloat(raiz.getPropertyValue("--top-bar-bottom")) || 0
}
