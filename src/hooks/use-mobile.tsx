"use client"

import * as React from "react"

const MOBILE_BREAKPOINT = 768
const MOBILE_QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`

/**
 * A janela que decide a largura.
 *
 * `null` — o padrão — significa "a janela real", e é o que todo o app usa: o
 * provedor abaixo não existe em tela nenhuma de produto. Ele existe para a
 * **moldura de viewport** do catálogo, que é um `<iframe>`: lá o CSS já resolve
 * `@media` contra o viewport de dentro, mas o React roda na janela de fora, e
 * `window.matchMedia` responderia pela largura errada.
 *
 * Era a primeira das duas limitações que a moldura declarava desde a rodada 31
 * — e a que impedia demonstrar qualquer componente que **bifurca em JS** pela
 * largura, que é justamente a `Sidebar`, o `Sheet` e a `Toolbar`.
 */
const ViewportWindowContext = React.createContext<Window | null>(null)

function ViewportWindowProvider({
  window: janela,
  children,
}: {
  window: Window | null
  children: React.ReactNode
}) {
  return (
    <ViewportWindowContext.Provider value={janela}>
      {children}
    </ViewportWindowContext.Provider>
  )
}

/** A janela ativa, ou `null` quando é a real. */
function useViewportWindow() {
  return React.useContext(ViewportWindowContext)
}

export function useIsMobile() {
  const janela = useViewportWindow()

  // `subscribe` e `getSnapshot` precisam ser estáveis por janela: o
  // `useSyncExternalStore` reinscreve a cada identidade nova.
  const loja = React.useMemo(() => {
    const alvo = janela ?? (typeof window === "undefined" ? null : window)
    return {
      subscribe(aoMudar: () => void) {
        if (!alvo) return () => {}
        const mql = alvo.matchMedia(MOBILE_QUERY)
        mql.addEventListener("change", aoMudar)
        return () => mql.removeEventListener("change", aoMudar)
      },
      getSnapshot(): boolean {
        return alvo ? alvo.matchMedia(MOBILE_QUERY).matches : false
      },
    }
  }, [janela])

  // No servidor é sempre desktop — não há largura a consultar, e um palpite
  // errado aqui é hidratação divergente.
  return React.useSyncExternalStore(
    loja.subscribe,
    loja.getSnapshot,
    () => false
  )
}

export { MOBILE_BREAKPOINT, ViewportWindowProvider, useViewportWindow }
