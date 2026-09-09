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

/**
 * O `modal` de uma superfície que abre **dentro da moldura do catálogo**.
 *
 * Fora dela devolve `undefined`, e cada primitiva fica com o próprio padrão
 * (`true`): o app não muda uma linha.
 *
 * Dentro dela devolve `false`, e a razão é medida. O Radix monta um
 * `RemoveScroll` dentro do `DialogOverlay` **sempre que `modal`** — e o
 * `react-remove-scroll` trava o `document` **global**, o da página de fora,
 * porque o React roda na janela de fora ainda que o DOM viva no `<iframe>`.
 * Medido com a folha do `Form` aberta: `data-scroll-locked` no `<body>` do
 * catálogo, `overflow` computado `hidden`, e um `wheel` sobre o `<h1>` da
 * página saindo `defaultPrevented`. Com ela fechada, nenhum dos três. A página
 * inteira congelava porque um espécime de 375px abriu uma gaveta — e ela não é
 * modal para a página de fora, que é exatamente o que este `false` diz.
 *
 * **O custo é o véu**, e ele é da biblioteca: o `Overlay` do vaul devolve
 * `null` quando não é modal (com o motivo escrito no fonte dele — *"o overlay é
 * quem trava a rolagem"*), e o do Radix idem. Dentro da moldura a superfície
 * abre sem véu; é a terceira limitação declarada dela, ao lado do `env()` de
 * área segura.
 *
 * Ele não vale para `Dialog` nem `Popover`, que não leem a janela ativa — quem
 * o lê é quem portaliza para a moldura: `Sheet`, `Drawer` e `EdgePanel`.
 */
function useViewportModal(): boolean | undefined {
  return useViewportWindow() ? false : undefined
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

export {
  MOBILE_BREAKPOINT,
  ViewportWindowProvider,
  useViewportModal,
  useViewportWindow,
}
