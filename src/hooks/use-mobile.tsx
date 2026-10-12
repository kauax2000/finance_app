"use client"

import * as React from "react"

const MOBILE_BREAKPOINT = 768
const MOBILE_QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`

/**
 * A janela que decide a largura. `null` é a janela real (todo o app); o
 * provedor existe para a moldura de viewport do catálogo, um `<iframe>` onde o
 * CSS resolve `@media` no viewport de dentro mas o React roda na janela de fora
 * e `window.matchMedia` responderia pela largura errada.
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

/**
 * O `modal` de uma superfície que abre dentro da moldura do catálogo: `undefined`
 * fora dela (cada primitiva fica com o padrão) e `false` dentro. O
 * `react-remove-scroll` do Radix travaria o `document` global, o da página de
 * fora, porque o React roda lá. O custo é o véu: o `Overlay` do vaul e o do
 * Radix devolvem `null` quando não modais. Vale para quem portaliza para a
 * moldura (`Sheet`, `Drawer`), não para `Dialog` nem `Popover`.
 */
function useViewportModal(): boolean | undefined {
  return useViewportWindow() ? false : undefined
}

export function useIsMobile() {
  const janela = useViewportWindow()

  // `subscribe` e `getSnapshot` precisam ser estáveis por janela: o `useSyncExternalStore` reinscreve a cada identidade nova.
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

  // No servidor é sempre desktop: um palpite errado aqui é hidratação divergente.
  return React.useSyncExternalStore(
    loja.subscribe,
    loja.getSnapshot,
    () => false
  )
}

export {
  MOBILE_BREAKPOINT,
  ViewportWindowProvider,
  useViewportModal,
  useViewportWindow,
}
