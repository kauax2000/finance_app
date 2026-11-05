/**
 * O toast mora fora da árvore do diálogo (o sonner renderiza no `body`), então
 * o Radix conta o toque nele como "fora" e fecha o diálogo antes do clique
 * chegar ao toast. Quem veste `onInteractOutside` chama isto primeiro.
 * Duck typing: `instanceof Element` falha atravessando o iframe do catálogo.
 */
export function ignorarToqueNoToast(e: Event) {
  const alvo = e.target as Partial<Element> | null
  if (alvo?.closest?.("[data-sonner-toaster]")) e.preventDefault()
}
