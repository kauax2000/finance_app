"use client"

import Link from "next/link"
import { useEffect, useRef, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardSkeleton, CardToolbar } from "@/components/ui/card"
import type { EntradaDaManchete } from "@/lib/detalhe/contexto"

/**
 * A parte da manchete que cada bloco sabe: Categoria manda `{ categoria }`,
 * Histórico `{ historico, duplicado }` (null quando não vale), Parcelada `{ parcela }`,
 * Fatura `{ fatura }` e Receitas `{ receitas }`.
 * Só chega depois da leitura; carregando ou com erro, o bloco não manda nada. O
 * painel junta as fatias e chama `escolherManchete`.
 */
export type FatiaDaManchete = Partial<Pick<
  EntradaDaManchete,
  "categoria" | "historico" | "parcela" | "duplicado" | "fatura" | "receitas"
>>
export type AoMudarManchete = (fatia: FatiaDaManchete) => void

/** Entrega a fatia quando ela muda de valor (não de identidade); `null` é "ainda não". */
export function useFatiaDaManchete(onManchete: AoMudarManchete | undefined, fatia: FatiaDaManchete | null) {
  const ref = useRef(onManchete)
  useEffect(() => {
    ref.current = onManchete
  })
  const chave = fatia == null ? null : JSON.stringify(fatia)
  useEffect(() => {
    if (chave != null) ref.current?.(JSON.parse(chave) as FatiaDaManchete)
  }, [chave])
}

/** A casca comum: a sobrancelha com o botão terciário à direita e o corpo. */
export function BlocoContexto({
  titulo,
  link,
  children,
}: {
  titulo: ReactNode
  link?: { href: string; label: string } | null
  children: ReactNode
}) {
  return (
    <Card padding="none" data-slot="bloco-contexto">
      <CardToolbar>
        <span className="min-w-0 truncate">{titulo}</span>
        {link ? (
          <Button variant="tertiary" size="sm" asChild>
            <Link href={link.href}>{link.label}</Link>
          </Button>
        ) : null}
      </CardToolbar>
      <CardContent className="grid gap-2 px-(--card-strip-px) pb-(--card-strip-py)">{children}</CardContent>
    </Card>
  )
}

export function BlocoContextoEsqueleto() {
  return <CardSkeleton lines={2} />
}
