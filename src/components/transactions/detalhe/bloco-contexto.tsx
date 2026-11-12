"use client"

import Link from "next/link"
import { useEffect, useRef, type CSSProperties, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardSkeleton, CardToolbar } from "@/components/ui/card"
import type { EntradaDaManchete } from "@/lib/detalhe/contexto"
import { tileColorFor } from "@/lib/tile-palette"

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
  /** O botão terciário da tira: um link, ou uma ação no lugar (a folha do plano). */
  link?: { href: string; label: string } | { label: string; onClick: () => void } | null
  children: ReactNode
}) {
  return (
    <Card padding="none" data-slot="bloco-contexto">
      <CardToolbar>
        <span className="min-w-0 truncate">{titulo}</span>
        {link && "onClick" in link ? (
          <Button type="button" variant="tertiary" size="sm" onClick={link.onClick}>
            {link.label}
          </Button>
        ) : link ? (
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

// A fatia e o ponto vestem a cor da categoria pela régua do ladrilho (`tile-vivid`), nunca crua.
const corDaCategoria = (cor: string | null | undefined) =>
  ({ "--tile-color": tileColorFor(cor) ?? "var(--muted-foreground)" }) as CSSProperties

/** A barra na cor da categoria: a cor e o `tile-vivid` no mesmo nó, onde roda a conta do `--tile-surface`. */
export function BarraNaCor({ cor, children }: { cor: string | null | undefined; children: ReactNode }) {
  return (
    <div className="tile-vivid [--progress-highlight:var(--tile-surface)]" style={corDaCategoria(cor)}>
      {children}
    </div>
  )
}

/** O ponto da legenda, na mesma cor da fatia. */
export function PontoNaCor({ cor }: { cor: string | null | undefined }) {
  return <span aria-hidden className="tile-vivid inline-block size-2 rounded-full bg-(--tile-surface)" style={corDaCategoria(cor)} />
}
