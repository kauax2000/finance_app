"use client"

import { ChevronRightIcon, ShoppingCartIcon } from "@heroicons/react/16/solid"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
} from "@/components/ui/item"
import { MoneyDisplay } from "@/components/ui/money-display"
import { DocNote, DocSection, Usage } from "../ds-doc"

export default function ItemDoc() {
  return (
    <>
      <Usage>
        A linha de uma lista: mídia, conteúdo, ações. É a forma que uma <code>Table</code> assume no telefone, e a de qualquer lista que não seja tabular.
      </Usage>

      <DocSection
        title="Linha de transação"
        code={`<Item>
  <ItemMedia><ShoppingCartIcon /></ItemMedia>
  <ItemContent>
    <ItemTitle>Mercado</ItemTitle>
    <ItemDescription>Hoje · Cartão Nubank</ItemDescription>
  </ItemContent>
  <ItemActions><MoneyDisplay value={-128.4} tone="expense" /></ItemActions>
</Item>`}
        previewClassName="items-stretch"
      >
        <ItemGroup className="w-full">
          <Item>
            <ItemMedia variant="icon">
              <ShoppingCartIcon aria-hidden />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>Mercado</ItemTitle>
              <ItemDescription>Hoje · Cartão Nubank</ItemDescription>
            </ItemContent>
            <ItemActions>
              <MoneyDisplay value={-128.4} tone="expense" />
            </ItemActions>
          </Item>
          <ItemSeparator />
          <Item>
            <ItemMedia variant="icon">
              <ShoppingCartIcon aria-hidden />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>Padaria</ItemTitle>
              <ItemDescription>Ontem · Pix</ItemDescription>
            </ItemContent>
            <ItemActions>
              <MoneyDisplay value={-18.9} tone="expense" />
            </ItemActions>
          </Item>
        </ItemGroup>
      </DocSection>

      <DocSection
        title="Com badge e navegação"
        code={`<Item variant="outline" asChild>
  <a href="/cartoes/nubank">…</a>
</Item>`}
        previewClassName="items-stretch"
      >
        <Item variant="outline" className="w-full">
          <ItemContent>
            <ItemTitle>
              Nubank
              <Badge size="xs" variant="warning" className="ml-2">
                Vence em 3 dias
              </Badge>
            </ItemTitle>
            <ItemDescription>Fatura de março · 12 transações</ItemDescription>
          </ItemContent>
          <ItemActions>
            <MoneyDisplay value={1482.3} tone="expense" />
            <Button variant="tertiary" size="icon-sm" aria-label="Abrir cartão">
              <ChevronRightIcon aria-hidden />
            </Button>
          </ItemActions>
        </Item>
      </DocSection>

      <DocNote title="Título e descrição não levam gap">
        <code>ItemContent</code> já entrega a entrelinha. Somar <code>gap-1</code> faz &ldquo;Mercado&rdquo; e &ldquo;Hoje · Cartão Nubank&rdquo; deixarem de ler como uma coisa só.
      </DocNote>

      <DocNote title="Linha inteira clicável, ou o botão?">
        As duas coisas juntas não: um botão dentro de uma linha clicável cria dois
        alvos sobrepostos, e no toque a pessoa acerta o errado. Escolha — ou a
        linha navega e a ação vai para um menu, ou a linha não navega.
      </DocNote>
    </>
  )
}
