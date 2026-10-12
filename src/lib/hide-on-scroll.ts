/**
 * A regra de esconder ao rolar das barras (`TopBar`, `BottomBar`,
 * `Toolbar sticky="hide"`): some ao descer mais de 4px, volta ao subir mais de
 * 4px, volta sempre no topo (até `mostrarAte`) e nunca some com o foco dentro.
 * Quem decide que só vale no telefone é o CSS de cada barra.
 */
export function proximoEscondido(
  atual: boolean,
  { y, antes, focada, mostrarAte = 0 }: { y: number; antes: number; focada: boolean; mostrarAte?: number }
): boolean {
  if (focada || y <= mostrarAte) return false
  if (y - antes > 4) return true
  if (antes - y > 4) return false
  return atual
}

/**
 * Quanto rolou quem disparou o `scroll`, se ele conta para `el`: o documento
 * (a janela dele, que na moldura do catálogo é a do iframe) ou um ancestral.
 * Decidido a cada evento — resolver o ancestral uma vez falhou na moldura,
 * onde o CSS chega depois do efeito.
 */
export function alvoDaRolagem(e: Event, el: Element): number | null {
  const doc = el.ownerDocument
  const alvo = e.target as Element | Document | null
  if (!alvo || alvo === doc) return (doc.defaultView ?? window).scrollY
  if ("contains" in alvo && alvo.contains(el)) return (alvo as Element).scrollTop
  return null
}
