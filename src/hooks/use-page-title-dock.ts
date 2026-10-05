"use client"

import * as React from "react"

/**
 * O título da página que subiu para a barra do topo (rodada 232).
 *
 * O `PageHeader collapse` publica aqui o texto do título e se ele já rolou
 * para baixo da barra; o `TopBarTitle pageTitle` lê e o mostra. Os dois não
 * têm ancestral comum que não seja o layout inteiro, e contexto exigiria que
 * cada layout o montasse — então é uma loja externa, **uma por documento**: a
 * prévia num iPhone do catálogo é um iframe, e o título dela não pode subir
 * para a barra do catálogo.
 */
export type PageTitleDock = { text: string; docked: boolean } | null

type Loja = { valor: PageTitleDock; ouvintes: Set<() => void> }

const lojas = new WeakMap<Document, Loja>()

function lojaDe(doc: Document): Loja {
  let loja = lojas.get(doc)
  if (!loja) {
    loja = { valor: null, ouvintes: new Set() }
    lojas.set(doc, loja)
  }
  return loja
}

export function publishPageTitle(doc: Document, valor: PageTitleDock) {
  const loja = lojaDe(doc)
  const antes = loja.valor
  if (antes === valor || (antes && valor && antes.text === valor.text && antes.docked === valor.docked)) return
  loja.valor = valor
  for (const ouvir of loja.ouvintes) ouvir()
}

export function usePageTitleDock(doc: Document | null): PageTitleDock {
  const assinar = React.useCallback(
    (avisar: () => void) => {
      if (!doc) return () => {}
      const loja = lojaDe(doc)
      loja.ouvintes.add(avisar)
      return () => {
        loja.ouvintes.delete(avisar)
      }
    },
    [doc]
  )
  return React.useSyncExternalStore(
    assinar,
    () => (doc ? lojaDe(doc).valor : null),
    () => null
  )
}
