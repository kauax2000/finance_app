"use client"

import { corDaCategoria } from "@/lib/tile-palette"
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
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemTitle } from "@/components/ui/item"
import { MoneyDisplay } from "@/components/ui/money-display"
import { Muted } from "@/components/ui/typography"
import { numberBR } from "@/lib/formatters"
import { textoDaExclusao, type LinhaAExcluir } from "@/lib/transactions/excluir-texto"

/** Até seis linhas no cartão; o resto vira "e mais k". */
const MAX_LINHAS = 6

/**
 * A confirmação de excluir lançamentos (E1): o título diz o que sai, o cartão
 * mostra as linhas como na tabela (a parcela aparece como a compra inteira) e a
 * descrição diz a consequência. Quem chama guarda o estado e apaga.
 */
export function ExcluirLancamentosDialog({
  linhas,
  open,
  pending,
  onConfirm,
  onOpenChange,
}: {
  linhas: LinhaAExcluir[]
  open: boolean
  pending: boolean
  onConfirm: () => void
  onOpenChange: (open: boolean) => void
}) {
  // Ao fechar, quem chama zera as linhas antes da animação de saída acabar: o texto segura as últimas.
  const [mostradas, setMostradas] = React.useState(linhas)
  // Compara pelos ids: quem chama pode montar o array a cada render (`[t]`).
  const chave = linhas.map((l) => l.id).join(",")
  if (linhas.length > 0 && chave !== mostradas.map((l) => l.id).join(",")) setMostradas(linhas)
  const texto = textoDaExclusao(linhas.length > 0 ? linhas : mostradas)
  const visiveis = texto.itens.slice(0, MAX_LINHAS)
  const resto = texto.itens.length - visiveis.length

  return (
    <AlertDialog pending={pending} open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{texto.titulo}</AlertDialogTitle>
          <AlertDialogDescription>{texto.descricao}</AlertDialogDescription>
        </AlertDialogHeader>
        {texto.itens.length > 0 ? (
          <Card padding="none" className="overflow-hidden">
            <ItemGroup variant="divided">
              {visiveis.map((item) => (
                <Item key={item.chave} variant="flush" size="md">
                  <ColorTile size="md" color={corDaCategoria(item.linha.category)}>
                    <CategoryIconPreview name={normalizeCategoryIcon(item.linha.category?.icon)} />
                  </ColorTile>
                  <ItemContent className="min-w-0">
                    <ItemTitle className="truncate">{item.nome || "Sem descrição"}</ItemTitle>
                    <ItemDescription className="nums truncate">{item.detalhe}</ItemDescription>
                  </ItemContent>
                  <ItemActions>
                    <MoneyDisplay value={item.valor} className="font-medium whitespace-nowrap" />
                  </ItemActions>
                </Item>
              ))}
              {resto > 0 ? (
                <Item variant="flush" size="md">
                  <ItemContent>
                    <ItemDescription>e mais {numberBR(resto)}</ItemDescription>
                  </ItemContent>
                </Item>
              ) : null}
            </ItemGroup>
          </Card>
        ) : null}
        {texto.nota ? <Muted className="text-sm">{texto.nota}</Muted> : null}
        <AlertDialogFooter>
          <AlertDialogCancel>cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              onConfirm()
            }}
          >
            {texto.acao}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
