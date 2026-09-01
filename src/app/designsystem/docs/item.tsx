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
        A linha de uma lista: mídia, conteúdo, ações. É a forma que uma{" "}
        <code>Table</code> assume no telefone, e a de qualquer lista que não seja
        tabular.
      </Usage>

      <DocSection
        title="Lista dividida"
        description="O fio entre linhas repetidas é o que torna a lista varrível. variant='divided' entrega isso sem ninguém posicionar n−1 separadores à mão."
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
        description="O padrão. Linhas que são cartões, separadas por respiro em vez de fio — para quando cada uma é um objeto e não um registro de uma série."
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
                <Badge size="xs" variant="warning">
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
        description="interactive liga realce, par de toque e anel de foco. Com asChild, a linha inteira vira o link — e o alvo de dedo sobe para 44px em ponteiro grosso."
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
        <code>ItemContent</code> entrega a entrelinha, e nada mais — eles são o
        mesmo dado em duas linhas. Esta nota já estava aqui, e o componente
        discordava dela: <code>ItemContent</code> declarava <code>gap-1</code>,{" "}
        <strong>4px medidos</strong> entre &ldquo;Mercado&rdquo; e &ldquo;Hoje ·
        Cartão Nubank&rdquo;. A documentação estava certa.
      </DocNote>

      <DocNote title="Linha dividida não tem canto">
        O fio é <code>border-b</code> do próprio <code>Item</code>, e o{" "}
        <code>Item</code> traz <code>rounded-lg</code> — uma borda de baixo num
        elemento arredondado curva nas duas pontas (<strong>10px neste tema</strong>),
        então o traço saía arqueado no meio da lista. Em{" "}
        <code>divided</code> o raio sai, porque{" "}
        <strong>uma linha de lista dividida não é um cartão</strong>. É o que{" "}
        <code>TableRow</code> e <code>AccordionItem</code> já fazem: os dois
        desenham o fio na linha, e nenhum dos dois carrega raio — no{" "}
        <code>Accordion</code> ele mora no contêiner. Em <code>spaced</code> o
        raio fica, porque ali a linha <em>é</em> um cartão. O segundo ganho não
        é o fio: com <code>interactive</code>, o realce vira uma faixa de
        largura inteira em vez de uma pílula flutuando dentro da lista.
      </DocNote>

      <DocNote title="O realce é explícito">
        Antes ele era <code>[a]:hover:bg-muted</code> — implícito, e só quando o
        próprio <code>Item</code> fosse um <code>&lt;a&gt;</code>. Uma linha que
        navega por causa de um <code>&lt;Link&gt;</code> dentro, ou que é{" "}
        <code>&lt;button&gt;</code>, não respondia. E não havia par{" "}
        <code>active:</code>: o realce compila dentro de{" "}
        <code>@media (hover: hover)</code>, verificado no CSS emitido, então{" "}
        <strong>no telefone ele não existia em caso nenhum</strong>.
      </DocNote>

      <DocNote title="Linha inteira clicável, ou o botão?">
        As duas coisas juntas não: um botão dentro de uma linha clicável cria
        dois alvos sobrepostos, e no toque a pessoa acerta o errado. Escolha — ou
        a linha navega e a ação vai para um menu, ou a linha não navega.
      </DocNote>

      <DocNote title="Não existe size='default' nem 'xs'">
        <code>default</code> dizia &ldquo;o padrão&rdquo; e apontava para uma
        string <strong>idêntica</strong> à de <code>sm</code> — duas variantes,
        uma medida. <code>xs</code> saiu por outro motivo: a única coisa que o
        distinguia era <code>in-data-[slot=dropdown-menu-content]:p-0</code>, um
        componente conhecendo o contêiner de outro. Os dois saíram do tipo,
        então o compilador acusa quem os escrever.
      </DocNote>

      <PropsTable
        title="Props de Item"
        rows={[
          {
            prop: "variant",
            type: '"default" | "outline" | "muted"',
            default: '"default"',
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
            type: 'variant: "default" | "icon" | "image"',
            default: '"default"',
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
