"use client"

import {
  CheckIcon,
  ChevronRightIcon,
  ComputerDesktopIcon,
  CreditCardIcon,
  DevicePhoneMobileIcon,
  ExclamationTriangleIcon,
  ShoppingCartIcon,
  UserPlusIcon,
} from "@heroicons/react/16/solid"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardToolbar } from "@/components/ui/card"
import {
  Item,
  ItemActions,
  ItemChevron,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemGroupLabel,
  ItemLink,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import { MoneyDisplay } from "@/components/ui/money-display"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

const LINHAS = [
  { titulo: "Mercado", legenda: "Hoje · Cartão Nubank", valor: -128.4 },
  { titulo: "Padaria", legenda: "Ontem · Pix", valor: -18.9 },
  { titulo: "Salário", legenda: "1 de março · Conta corrente", valor: 7400 },
]

const AVISOS = [
  {
    dia: "Hoje",
    linhas: [
      { titulo: "A fatura do Nubank fecha amanhã", legenda: "R$ 1.482,30 até agora · há 2 h", tone: "warning", Icone: CreditCardIcon },
      { titulo: "O orçamento de Mercado passou do limite", legenda: "R$ 912,40 de R$ 800,00 · há 5 h", tone: "destructive", Icone: ExclamationTriangleIcon },
    ],
  },
  {
    dia: "Ontem",
    linhas: [
      { titulo: "Ana entrou na carteira Casa", legenda: "Pelo convite de 12 de março · ontem", tone: "info", Icone: UserPlusIcon },
      { titulo: "A compra parcelada da geladeira terminou", legenda: "12 de 12 parcelas pagas · ontem", tone: "neutral", Icone: CheckIcon },
    ],
  },
] as const

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
        title="Linha rente"
        description="variant=&quot;flush&quot; é a linha que ocupa um Card padding=&quot;none&quot;: sem borda nem canto, com o recuo de 16px da tira do cartão, então título do cartão e linhas alinham. Num ItemGroup divided o fio continua."
        code={`<Card padding="none">
  <CardToolbar>Transações recentes</CardToolbar>
  <ItemGroup variant="divided">
    <Item variant="flush" interactive asChild><button>…<ItemChevron /></button></Item>
  </ItemGroup>
</Card>`}
        previewClassName="items-stretch"
      >
        <Card padding="none" className="w-full">
          <CardToolbar>Transações recentes</CardToolbar>
          <ItemGroup variant="divided">
            {LINHAS.map((l) => (
              <Item key={l.titulo} variant="flush" interactive asChild>
                <button type="button">
                  <ItemContent>
                    <ItemTitle>{l.titulo}</ItemTitle>
                    <ItemDescription>{l.legenda}</ItemDescription>
                  </ItemContent>
                  <ItemActions>
                    <MoneyDisplay value={l.valor} tone={l.valor < 0 ? "expense" : "income"} />
                    <ItemChevron />
                  </ItemActions>
                </button>
              </Item>
            ))}
          </ItemGroup>
        </Card>
      </DocSection>

      <DocSection
        title="Lista de avisos"
        description="As três peças do painel de notificações. ItemMedia variant=&quot;tile&quot; é o círculo na superfície -muted do tom (neutral, info, warning, destructive), com o ícone de 16 na tinta dele: 32 no md, 28 no sm, 40 no lg. ItemLink é o alvo da linha: um botão (ou, com asChild, o link) cuja película cobre o Item, e as ItemActions sobem acima dela — a linha inteira abre, e o botão de dentro continua sendo outro alvo, sem botão dentro de botão. ItemGroupLabel é o rótulo do grupo em sobrancelha; com sticky ele gruda no topo do rolável, no fundo de --item-group-label-surface (a placa flutuante por padrão; aqui, o cartão)."
        code={`<ItemGroupLabel sticky>Hoje</ItemGroupLabel>
<Item interactive>
  <ItemMedia variant="tile" tone="warning"><CreditCardIcon /></ItemMedia>
  <ItemContent>
    <ItemTitle><ItemLink onClick={abrir}>A fatura do Nubank fecha amanhã</ItemLink></ItemTitle>
    <ItemDescription>R$ 1.482,30 até agora · há 2 h</ItemDescription>
  </ItemContent>
  <ItemActions>
    <Button variant="tertiary" size="icon-sm" aria-label="Marcar como lida"><CheckIcon /></Button>
  </ItemActions>
</Item>`}
        previewClassName="items-stretch"
      >
        <Card padding="none" className="w-full [--item-group-label-surface:var(--color-card)]">
          <ScrollArea className="h-56">
            {AVISOS.map((grupo) => (
              <div key={grupo.dia}>
                <ItemGroupLabel sticky>{grupo.dia}</ItemGroupLabel>
                <ItemGroup variant="divided">
                  {grupo.linhas.map((l) => (
                    <Item key={l.titulo} interactive>
                      <ItemMedia variant="tile" tone={l.tone}>
                        <l.Icone aria-hidden />
                      </ItemMedia>
                      <ItemContent>
                        <ItemTitle>
                          <ItemLink>{l.titulo}</ItemLink>
                        </ItemTitle>
                        <ItemDescription>{l.legenda}</ItemDescription>
                      </ItemContent>
                      <ItemActions>
                        <Button variant="tertiary" size="icon-sm" aria-label="Marcar como lida">
                          <CheckIcon aria-hidden />
                        </Button>
                      </ItemActions>
                    </Item>
                  ))}
                </ItemGroup>
              </div>
            ))}
          </ScrollArea>
        </Card>
      </DocSection>

      <DocSection
        title="Selecionada"
        description="selected marca a linha atual ou escolhida: o contorno e o fundo do cartão de escolha do Field (--primary-accent a 60%, o primeiro degrau com 3:1 de traço nos dois temas) e aria-current. É a sessão atual na tela de sessões. Destaque de passagem — a linha acesa porque o ponteiro está sobre a legenda de um gráfico — não é seleção, e não usa isto."
        code={`<Item variant="outline" selected={sessao.atual}>…</Item>`}
        previewClassName="items-stretch"
      >
        <ItemGroup className="w-full">
          <Item variant="outline" selected>
            <ItemMedia variant="icon">
              <ComputerDesktopIcon aria-hidden />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>
                Chrome no macOS
                <Badge size="xs" tone="success">Esta sessão</Badge>
              </ItemTitle>
              <ItemDescription>São Paulo · agora</ItemDescription>
            </ItemContent>
          </Item>
          <Item variant="outline">
            <ItemMedia variant="icon">
              <DevicePhoneMobileIcon aria-hidden />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>Safari no iPhone</ItemTitle>
              <ItemDescription>Campinas · há 2 dias</ItemDescription>
            </ItemContent>
          </Item>
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
        description="interactive liga realce, par de toque e anel de foco. Com asChild a linha inteira vira o link, com 44px de alvo no toque. ItemChevron é a seta do fim: apagada em repouso, e no cursor e no toque ela ganha a tinta cheia e anda 2px no sentido do clique — só numa linha interactive; numa que não navega, fica parada."
        code={`<Item interactive asChild>
  <a href="/credit-cards/nubank">
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
                <ItemChevron />
              </ItemActions>
            </a>
          </Item>
        </ItemGroup>
      </DocSection>

      <DocNote title="A linha só quebra quando tem faixa">
          Sem <code>ItemHeader</code> ou <code>ItemFooter</code>, conteúdo e ações ficam na mesma linha e o título trunca (<code>ItemContent</code> tem <code>min-w-0</code>). Com eles, a linha quebra, porque as faixas ocupam a largura toda. Era <code>flex-wrap</code> sempre, e seis linhas do app o desligavam à mão. A linha-botão também alinha à esquerda de fábrica: sete escreviam <code>text-left</code>.
      </DocNote>

      <DocNote title="Onde o app usa">
          Em doze telas: as listas do painel (transações recentes e parcelas, hoje <code>variant=&quot;flush&quot;</code>, e o calendário de pagamentos), as categorias e a análise da fatura, a sessão atual (<code>selected</code>, que era <code>primary-accent/30</code>, abaixo de 3:1), o convite de membros, a exclusão de conta, a pré-visualização do cartão e da carteira, e o painel de acesso. As setas das transações recentes e das categorias da fatura viraram <code>ItemChevron</code>.
      </DocNote>

      <DocNote title="Título e descrição não levam gap">
          <code>ItemContent</code> entrega a entrelinha e nada mais: título e descrição são o mesmo dado em duas linhas. Um <code>gap</code> ali os separa.
      </DocNote>

      <DocNote title="Linha dividida não tem canto">
          Em <code>divided</code> o raio sai: uma borda de baixo num elemento arredondado curva nas pontas, e uma linha dividida não é cartão. O raio das pontas é do contêiner, como em <code>TableRow</code> e <code>AccordionItem</code>. Em <code>spaced</code> ele fica, porque ali a linha é um cartão.
      </DocNote>

      <DocNote title="O realce é explícito, e responde ao toque">
          Use <code>interactive</code> em vez de depender do elemento ser um <code>&lt;a&gt;</code>: ele traz o par <code>active:</code>, sem o qual o realce, que compila dentro de <code>@media (hover: hover)</code>, não existe no telefone.
      </DocNote>

      <DocNote title="Linha inteira clicável com um botão dentro: o ItemLink">
          Com <code>interactive asChild</code> a linha é o botão, e outro botão dentro dela seria botão dentro de botão. Quando a linha abre e também tem uma ação, a linha fica <code>div</code> e o alvo é o <code>ItemLink</code>: a película dele cobre a linha, e as <code>ItemActions</code> sobem acima dela (<code>z-10</code>), como no <code>CardLink</code>. O foco do link acende o anel da linha inteira.
      </DocNote>

      <DocNote title="Não existe size='default' nem 'xs'">
          Use <code>sm</code>, <code>md</code> ou <code>lg</code>; os dois nomes saíram do tipo e o compilador acusa quem os escrever.
      </DocNote>

      <PropsTable
        title="Props de Item"
        rows={[
          {
            prop: "variant",
            type: '"plain" | "outline" | "muted" | "flush"',
            default: '"plain"',
            description: "A superfície da linha; flush é a rente, dentro de um Card sem recuo.",
          },
          {
            prop: "selected",
            type: "boolean",
            default: "false",
            description: "A linha atual ou escolhida, com aria-current.",
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
            type: 'variant: "plain" | "icon" | "image" | "tile"',
            default: '"plain"',
            description: "image acompanha a escada em medida e em raio; tile é o círculo de tom (28 · 32 · 40).",
          },
          {
            prop: "ItemMedia tone",
            type: '"neutral" | "info" | "warning" | "destructive"',
            default: '"neutral"',
            description: "A cor do tom e a tinta do ícone. Só o tile o pinta.",
          },
          {
            prop: "ItemMedia tint",
            type: '"soft" | "vivid"',
            default: '"soft"',
            description:
              "A força do ladrilho, os nomes do ColorTile e do AvatarFallback: soft é a superfície -muted do tom; vivid, a cor cheia com a tinta -foreground dela (o painel de notificações).",
          },
          {
            prop: "ItemLink",
            type: "ComponentProps<'button'> & { asChild?: boolean }",
            description:
              "O alvo da linha: a película cobre o Item, o foco acende o anel dele e as ItemActions sobem acima. type=\"button\" de fábrica; com asChild, o <a> ou o <Link>.",
          },
          {
            prop: "ItemGroupLabel",
            type: "ComponentProps<'div'> & { sticky?: boolean }",
            default: "sticky: false",
            description:
              "O rótulo do grupo, em sobrancelha. sticky gruda no topo do rolável, no fundo de --item-group-label-surface (padrão --popover).",
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
            prop: "ItemChevron",
            type: "ícone (svg)",
            description: "A seta do fim da linha que navega; anda só numa linha interactive.",
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
