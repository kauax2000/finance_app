"use client"

import * as React from "react"

/**
 * A base da barra do topo (`TopBar`), em px a partir do topo da janela — a
 * área segura entra na conta sozinha, porque a barra a soma à própria altura.
 * As barras não têm a mesma altura (48 no app, 56 no catálogo), então ela é
 * medida, e não cravada; o observador acompanha a troca de degrau, e `chave`
 * (a rota, no `Toaster`) refaz a busca quando a barra pode ter trocado.
 * `null` quando não há barra, ou com `ativo` falso.
 *
 * Mora aqui desde a rodada 229: o `Toaster` a usa para nascer abaixo da barra,
 * e o `Toolbar sticky` para prender logo abaixo dela.
 */
export function useTopBarBottom(
  ativo = true,
  chave?: unknown,
  /** Quem mede mora num iframe (o `IphoneFrame`): a barra é a do documento dele. */
  dentroDe?: React.RefObject<Element | null>
) {
  const [base, setBase] = React.useState<number | null>(null)
  React.useEffect(() => {
    const doc = dentroDe?.current?.ownerDocument ?? document
    const barra = ativo ? doc.querySelector<HTMLElement>('[data-slot="top-bar"]') : null
    if (!barra) {
      const id = window.requestAnimationFrame(() => setBase(null))
      return () => window.cancelAnimationFrame(id)
    }
    const ro = new ResizeObserver(() => {
      setBase(Math.round(barra.getBoundingClientRect().bottom))
    })
    ro.observe(barra)
    return () => ro.disconnect()
  }, [ativo, chave, dentroDe])
  return base
}
