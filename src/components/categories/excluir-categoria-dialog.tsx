"use client"

import * as React from "react"
import { CategoryIconPreview, normalizeCategoryIcon } from "@/components/categories/category-appearance-fields"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Card } from "@/components/ui/card"
import { ColorTile } from "@/components/ui/color-tile"
import { Item, ItemContent, ItemDescription, ItemGroup, ItemTitle } from "@/components/ui/item"
import { Muted } from "@/components/ui/typography"
import { currencyBRL } from "@/lib/formatters"
import type { Category } from "@/lib/supabase"

type CategoriaAExcluir = Pick<Category, "id" | "name" | "type" | "color" | "icon">

/** Os textos da confirmação, puros para o teste. */
export function textoDaExclusaoDeCategoria(categoria: CategoriaAExcluir, limite: number | null) {
  const nome = categoria.name
  return {
    titulo: `Excluir ${nome}?`,
    descricao: "Sai da carteira e não dá para desfazer.",
    detalhe:
      (categoria.type === "income" ? "Receita" : "Despesa") +
      (limite != null ? ` · limite de ${currencyBRL(limite)}` : ""),
    nota:
      `Os lançamentos com ${nome} ficam no extrato, sem categoria, até você escolher outra.` +
      (limite != null ? " O limite dela sai junto." : ""),
  }
}

/**
 * A confirmação de excluir categoria, no molde da de excluir lançamentos: o
 * título diz o que sai, o cartão mostra a linha da categoria e a nota diz a
 * consequência. Quem chama guarda o estado e apaga.
 */
export function ExcluirCategoriaDialog({
  categoria,
  limite,
  open,
  pending,
  onConfirm,
  onOpenChange,
}: {
  categoria: CategoriaAExcluir | null
  limite: number | null
  open: boolean
  pending: boolean
  onConfirm: () => void
  onOpenChange: (open: boolean) => void
}) {
  // Ao fechar, quem chama zera a categoria antes da animação de saída acabar: o texto segura a última.
  const [mostrada, setMostrada] = React.useState(categoria)
  const [limiteMostrado, setLimiteMostrado] = React.useState(limite)
  if (categoria && (categoria.id !== mostrada?.id || limite !== limiteMostrado)) {
    setMostrada(categoria)
    setLimiteMostrado(limite)
  }
  const atual = categoria ?? mostrada
  const texto = atual ? textoDaExclusaoDeCategoria(atual, categoria ? limite : limiteMostrado) : null

  return (
    <AlertDialog pending={pending} open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{texto?.titulo}</AlertDialogTitle>
          <AlertDialogDescription>{texto?.descricao}</AlertDialogDescription>
        </AlertDialogHeader>
        {atual && texto ? (
          <Card padding="none" className="overflow-hidden">
            <ItemGroup variant="divided">
              <Item variant="flush" size="md">
                <ColorTile size="md" color={atual.color}>
                  <CategoryIconPreview name={normalizeCategoryIcon(atual.icon)} />
                </ColorTile>
                <ItemContent className="min-w-0">
                  <ItemTitle className="truncate">{atual.name}</ItemTitle>
                  <ItemDescription className="nums truncate">{texto.detalhe}</ItemDescription>
                </ItemContent>
              </Item>
            </ItemGroup>
          </Card>
        ) : null}
        {texto ? <Muted className="text-sm">{texto.nota}</Muted> : null}
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              onConfirm()
            }}
          >
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
