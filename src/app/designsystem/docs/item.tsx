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
  ItemTitle,
} from "@/components/ui/item"
import { MoneyDisplay } from "@/components/ui/money-display"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

const LINHAS = [
  { titulo: "Mercado", legenda: "Hoje · Cartão Nubank", valor: -128.4 },
  { titulo: "Padaria", legenda: "Ontem · Pix", valor: -18.9 },
  { titulo: "Salário", legenda: "1 de março · Conta corrente", valor: 7400 },
]

export default function ItemDoc() {
  return (
    <>
      <Usage>
          A linha de uma lista: mídia, conteúdo, ações. É a forma que uma <code>Table</code> assume no telefone e a de toda lista não tabular. Pares rótulo/valor são <code>DescriptionList</code>; histórico é <code>Timeline</code>.
      </Usage>

      <DocSection
        title="Lista dividida"
        description="O fio entre linhas repetidas torna a lista varrível. variant='divided' o põe sem separadores à mão."
        code={`<ItemGroup variant="divided">
  <Item>
    <ItemMedia variant="icon"><ShoppingCartIcon /></ItemMedia>
    <ItemContent>
      <ItemTitle>Mercado</ItemTitle>
      <ItemDescription>Hoje · Cartão Nubank</ItemDescription>
    </ItemContent>
    <ItemActions><MoneyDisplay value={-128.4} tone="expense" /></ItemActions>
  </Item>
</ItemGroup>`}
        previewClassName="items-stretch"
      >
        <ItemGroup variant="divided" className="w-full">
          {LINHAS.map((l) => (
            <Item key={l.titulo}>
              <ItemMedia variant="icon">
                <ShoppingCartIcon aria-hidden />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>{l.titulo}</ItemTitle>
                <ItemDescription>{l.legenda}</ItemDescription>
              </ItemContent>
              <ItemActions>
                <MoneyDisplay
                  value={l.valor}
                  tone={l.valor < 0 ? "expense" : "income"}
                />
              </ItemActions>
            </Item>
          ))}
        </ItemGroup>
      </DocSection>

      <DocSection
        title="Lista espaçada"
        description="O padrão: linhas que são cartões, separadas por respiro — quando cada uma é um objeto, não um registro de série."
        code={`<ItemGroup>
  <Item variant="outline">…</Item>
</ItemGroup>`}
        previewClassName="items-stretch"
      >
        <ItemGroup className="w-full">
          <Item variant="outline">
            <ItemContent>
              <ItemTitle>
                Nubank
                <Badge size="xs" tone="warning">
                  Vence em 3 dias
                </Badge>
              </ItemTitle>
              <ItemDescription>Fatura de março · 12 transações</ItemDescription>
            </ItemContent>
            <ItemActions>
              <MoneyDisplay value={-1482.3} tone="expense" />
              <Button variant="tertiary" size="icon-sm" aria-label="Abrir cartão">
                <ChevronRightIcon aria-hidden />
              </Button>
            </ItemActions>
          </Item>
          <Item variant="muted">
            <ItemContent>
              <ItemTitle>Inter</ItemTitle>
              <ItemDescription>Fatura fechada · 4 transações</ItemDescription>
            </ItemContent>
            <ItemActions>
              <MoneyDisplay value={-312.9} tone="expense" />
            </ItemActions>
          </Item>
        </ItemGroup>
      </DocSection>

      <DocSection
        title="Escada"
        description="sm, md e lg governam recuo, gap e a mídia — nunca altura: uma linha de lista cresce com o que carrega."
        code={`<Item size="sm">…</Item>
<Item size="md">…</Item>
<Item size="lg">…</Item>`}
        previewClassName="items-stretch"
      >
        <ItemGroup variant="divided" className="w-full">
          {(["sm", "md", "lg"] as const).map((s) => (
            <Item key={s} size={s}>
              <ItemMedia variant="icon">
                <ShoppingCartIcon aria-hidden />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>Mercado</ItemTitle>
                <ItemDescription>size=&ldquo;{s}&rdquo;</ItemDescription>
              </ItemContent>
              <ItemActions>
                <MoneyDisplay value={-128.4} tone="expense" />
              </ItemActions>
            </Item>
          ))}
        </ItemGroup>
      </DocSection>

      <DocSection
        title="Linha que navega"
        description="interactive liga realce, par de toque e anel de foco. Com asChild a linha inteira vira o link, com 44px de alvo no toque."
        code={`<Item interactive asChild>
  <a href="/cartoes/nubank">
    <ItemContent>…</ItemContent>
  </a>
</Item>`}
        previewClassName="items-stretch"
      >
        <ItemGroup className="w-full">
          <Item interactive variant="outline" asChild>
            <a href="#">
              <ItemMedia variant="icon">
                <ShoppingCartIcon aria-hidden />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>Nubank</ItemTitle>
                <ItemDescription>Fatura de março</ItemDescription>
              </ItemContent>
              <ItemActions>
                <ChevronRightIcon aria-hidden className="size-4 text-muted-foreground" />
              </ItemActions>
            </a>
          </Item>
        </ItemGroup>
      </DocSection>

      <DocNote title="Título e descrição não levam gap">
          <code>ItemContent</code> entrega a entrelinha e nada mais: título e descrição são o mesmo dado em duas linhas. Um <code>gap</code> ali os separa.
      </DocNote>

      <DocNote title="Linha dividida não tem canto">
          Em <code>divided</code> o raio sai: uma borda de baixo num elemento arredondado curva nas pontas, e uma linha dividida não é cartão. O raio das pontas é do contêiner, como em <code>TableRow</code> e <code>AccordionItem</code>. Em <code>spaced</code> ele fica, porque ali a linha é um cartão.
      </DocNote>

      <DocNote title="O realce é explícito, e responde ao toque">
          Use <code>interactive</code> em vez de depender do elemento ser um <code>&lt;a&gt;</code>: ele traz o par <code>active:</code>, sem o qual o realce, que compila dentro de <code>@media (hover: hover)</code>, não existe no telefone.
      </DocNote>

      <DocNote title="Linha inteira clicável, ou o botão">
          As duas coisas juntas não: um botão dentro de uma linha clicável cria dois alvos sobrepostos, e no toque a pessoa acerta o errado. Ou a linha navega e a ação vai para um menu, ou a linha não navega.
      </DocNote>

      <DocNote title="Não existe size='default' nem 'xs'">
          Use <code>sm</code>, <code>md</code> ou <code>lg</code>; os dois nomes saíram do tipo e o compilador acusa quem os escrever.
      </DocNote>

      <PropsTable
        title="Props de Item"
        rows={[
          {
            prop: "variant",
            type: '"plain" | "outline" | "muted"',
            default: '"plain"',
            description: "A superfície da linha.",
          },
          {
            prop: "size",
            type: '"sm" | "md" | "lg"',
            default: '"md"',
            description: "Recuo, gap e a medida da mídia. Nunca altura.",
          },
          {
            prop: "interactive",
            type: "boolean",
            default: "false",
            description:
              "Realce com par de toque, anel de foco e 44px de alvo em ponteiro grosso.",
          },
          {
            prop: "asChild",
            type: "boolean",
            default: "false",
            description: "A linha vira o elemento filho — o <a> ou o <Link>.",
          },
        ]}
      />

      <PropsTable
        title="Peças"
        rows={[
          {
            prop: "ItemGroup",
            type: 'variant: "spaced" | "divided"',
            default: '"spaced"',
            description:
              "divided zera o gap e põe o fio entre linhas repetidas.",
          },
          {
            prop: "ItemMedia",
            type: 'variant: "plain" | "icon" | "image"',
            default: '"plain"',
            description: "image acompanha a escada em medida e em raio.",
          },
          {
            prop: "ItemContent",
            type: "ComponentProps<'div'>",
            description: "Título sobre descrição, sem gap.",
          },
          {
            prop: "ItemActions",
            type: "ComponentProps<'div'>",
            description: "O valor, o badge, o botão — à direita.",
          },
          {
            prop: "ItemHeader / ItemFooter",
            type: "ComponentProps<'div'>",
            description: "Faixas de largura total acima e abaixo da linha.",
          },
          {
            prop: "ItemSeparator",
            type: "ComponentProps<typeof Separator>",
            description:
              "O fio explícito, para a lista que separa por seção e não a cada linha.",
          },
        ]}
      />
    </>
  )
}
