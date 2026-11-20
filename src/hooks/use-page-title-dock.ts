"use client"

import * as React from "react"

/**
 * O título da página que subiu para a barra do topo.
 *
 * O `PageHeader collapse` publica aqui o texto do título e se ele já rolou
 * para baixo da barra; o `TopBarTitle pageTitle` lê e o mostra. Os dois não
 * têm ancestral comum que não seja o layout inteiro, e contexto exigiria que
 * cada layout o montasse — então é uma loja externa, **uma por documento**: a
 * prévia num iPhone do catálogo é um iframe, e o título dela não pode subir
 * para a barra do catálogo.
 *
 * `back` e `media` são o voltar e a identidade da linha do título
 * (`PageHeaderTitleRow`), já renderizados: sobem junto com o nome, só do `md`
 * para cima. Comparados por identidade — quem publica os memoriza.
 */
export type PageTitleDock = {
  text: string
  docked: boolean
  back?: React.ReactNode
  media?: React.ReactNode
} | null

/** Mesmo valor, nenhum aviso: evita o laço de render com o `useSyncExternalStore`. */
export function mesmoTitulo(a: PageTitleDock, b: PageTitleDock) {
  if (a === b) return true
  if (!a || !b) return false
  return a.text === b.text && a.docked === b.docked && a.back === b.back && a.media === b.media
}

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
  if (mesmoTitulo(antes, valor)) return
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
