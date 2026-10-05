"use client"

import * as React from "react"
import {
  ArrowDownTrayIcon,
  PlusIcon,
  ShareIcon,
  ShoppingCartIcon,
} from "@heroicons/react/16/solid"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ColorTile } from "@/components/ui/color-tile"
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
} from "@/components/ui/item"
import { Label } from "@/components/ui/label"
import { MoneyDisplay } from "@/components/ui/money-display"
import {
  PageHeader,
  PageHeaderActions,
  PageHeaderBreadcrumb,
  PageHeaderDescription,
  PageHeaderEyebrow,
  PageHeaderMeta,
  PageHeaderNav,
  PageHeaderSkeleton,
  PageHeaderStat,
  PageHeaderTitle,
  PageHeaderTitleRow,
} from "@/components/ui/page-header"
import { StatCardDelta } from "@/components/ui/stat-card"
import { Switch } from "@/components/ui/switch"
import { TabsNav, TabsNavLink } from "@/components/ui/tabs"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { TopBar, TopBarTitle } from "@/components/ui/top-bar"
import { IphoneFrame } from "../ds-frame"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

const COR = "#F97316"

function Eixo<T extends string>({
  rotulo,
  valores,
  valor,
  onChange,
}: {
  rotulo: string
  valores: readonly T[]
  valor: T
  onChange: (v: T) => void
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-xs text-muted-foreground">{rotulo}</span>
      <ToggleGroup
        type="single"
        variant="segmented"
        size="sm"
        value={valor}
        onValueChange={(v) => v && onChange(v as T)}
        aria-label={rotulo}
      >
        {valores.map((v) => (
          <ToggleGroupItem key={v} value={v} className="font-mono">
            {v}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  )
}

function Interruptor({
  id,
  rotulo,
  valor,
  onChange,
}: {
  id: string
  rotulo: string
  valor: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center gap-2">
      <Switch id={id} size="sm" checked={valor} onCheckedChange={onChange} />
      <Label htmlFor={id} className="font-mono text-xs font-normal">
        {rotulo}
      </Label>
    </div>
  )
}

/** As três ações que o ⋯ reparte: as duas só de ícone por fora, a principal na borda. */
function Acoes({ quantas }: { quantas: "uma" | "três" }) {
  return (
    <PageHeaderActions overflow={quantas === "três" ? "menu" : undefined}>
      {quantas === "três" ? (
        <>
          <Button variant="tertiary" size="icon-md" aria-label="Compartilhar">
            <ShareIcon aria-hidden />
          </Button>
          <Button variant="tertiary" size="icon-md" aria-label="Exportar">
            <ArrowDownTrayIcon aria-hidden />
          </Button>
        </>
      ) : null}
      <Button>
        <PlusIcon aria-hidden />
        nova transação
      </Button>
    </PageHeaderActions>
  )
}

function Faixa() {
  return (
    <PageHeaderMeta>
      <PageHeaderStat
        label="Gasto em março"
        delta={
          <StatCardDelta current={1284.6} previous={1146.96} better="down" context="em relação a fevereiro" />
        }
      >
        <MoneyDisplay value={-1284.6} signed tone="expense" />
      </PageHeaderStat>
      <PageHeaderStat label="Orçamento">
        <MoneyDisplay value={1500} />
      </PageHeaderStat>
      <PageHeaderStat label="Lançamentos">42</PageHeaderStat>
    </PageHeaderMeta>
  )
}

function DemoNaTela() {
  const [size, setSize] = React.useState<"sm" | "md" | "lg">("md")
  const [acoes, setAcoes] = React.useState<"nenhuma" | "uma" | "três">("uma")
  const [trilha, setTrilha] = React.useState(true)
  const [voltar, setVoltar] = React.useState(false)
  const [midia, setMidia] = React.useState(true)
  const [sobrancelha, setSobrancelha] = React.useState(false)
  const [adorno, setAdorno] = React.useState(true)
  const [faixa, setFaixa] = React.useState(true)
  const [nav, setNav] = React.useState(false)
  const [longo, setLongo] = React.useState(false)
  // Trocar um eixo remonta o cabeçalho, para a cascata tocar de novo.
  const chave = [size, acoes, trilha, voltar, midia, sobrancelha, adorno, faixa, nav, longo].join()

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <Eixo rotulo="size" valores={["sm", "md", "lg"] as const} valor={size} onChange={setSize} />
        <Eixo rotulo="ações" valores={["nenhuma", "uma", "três"] as const} valor={acoes} onChange={setAcoes} />
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <Interruptor id="ph-trilha" rotulo="trilha" valor={trilha} onChange={setTrilha} />
        <Interruptor id="ph-voltar" rotulo="voltar" valor={voltar} onChange={setVoltar} />
        <Interruptor id="ph-midia" rotulo="mídia" valor={midia} onChange={setMidia} />
        <Interruptor id="ph-sobrancelha" rotulo="sobrancelha" valor={sobrancelha} onChange={setSobrancelha} />
        <Interruptor id="ph-adorno" rotulo="selo" valor={adorno} onChange={setAdorno} />
        <Interruptor id="ph-faixa" rotulo="faixa" valor={faixa} onChange={setFaixa} />
        <Interruptor id="ph-nav" rotulo="navegação" valor={nav} onChange={setNav} />
        <Interruptor id="ph-longo" rotulo="título longo" valor={longo} onChange={setLongo} />
      </div>

      <PageHeader key={chave} size={size} className="w-full">
        {trilha ? (
          <PageHeaderBreadcrumb>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="#">Início</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbItem>
                  <BreadcrumbLink href="#">Categorias</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbItem>
                  <BreadcrumbPage>Alimentação</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </PageHeaderBreadcrumb>
        ) : null}
        <PageHeaderTitleRow
          back={voltar ? "#" : undefined}
          backHistory={false}
          media={
            midia ? (
              <ColorTile size="lg" color={COR}>
                <ShoppingCartIcon aria-hidden />
              </ColorTile>
            ) : undefined
          }
          badge={adorno ? <Badge tone="expense">Despesa</Badge> : undefined}
        >
          {sobrancelha ? <PageHeaderEyebrow>Março de 2026</PageHeaderEyebrow> : null}
          <PageHeaderTitle truncate={longo}>
            {longo ? "Alimentação, mercado e as compras parceladas do mês" : "Alimentação"}
          </PageHeaderTitle>
          <PageHeaderDescription>
            Mercado, padaria e restaurantes. O orçamento vale até o fim do mês.
          </PageHeaderDescription>
        </PageHeaderTitleRow>
        {acoes !== "nenhuma" ? <Acoes quantas={acoes} /> : null}
        {faixa ? <Faixa /> : null}
        {nav ? (
          <PageHeaderNav>
            <TabsNav variant="underline" aria-label="Seções da categoria">
              {["Resumo", "Lançamentos", "Tendências"].map((t, i) => (
                <TabsNavLink key={t} href="#" active={i === 0} onClick={(e) => e.preventDefault()}>
                  {t}
                </TabsNavLink>
              ))}
            </TabsNav>
          </PageHeaderNav>
        ) : null}
      </PageHeader>
    </div>
  )
}

const LANCAMENTOS = [
  ["Mercado", "28/03 · Nubank", -128.4],
  ["Padaria", "27/03 · Itaú", -22.38],
  ["Restaurante", "26/03 · Nubank", -86.9],
  ["Mercado", "24/03 · Inter", -210],
  ["Feira", "22/03 · Itaú", -64.3],
  ["Padaria", "21/03 · Nubank", -18.5],
  ["Mercado", "19/03 · Nubank", -146.38],
  ["Restaurante", "17/03 · Inter", -119.9],
  ["Mercado", "14/03 · Itaú", -301.2],
  ["Padaria", "12/03 · Nubank", -16.4],
] as const

/**
 * O telefone: o cabeçalho compacto, e o título que sobe para a barra ao rolar.
 * É um primeiro desenho — o telefone vai ser revisto quando as telas do app
 * adotarem o `PageHeader`.
 */
function DemoTelefone() {
  return (
    <IphoneFrame title="Cabeçalho de página num iPhone">
      <div className="h-full overflow-y-auto bg-background">
        <TopBar surface="scroll">
          <TopBarTitle pageTitle />
        </TopBar>
        <div className="flex flex-col gap-6 px-4 pt-4 pb-10">
          <PageHeader collapse>
            <PageHeaderTitleRow
              media={
                <ColorTile size="lg" color={COR}>
                  <ShoppingCartIcon aria-hidden />
                </ColorTile>
              }
            >
              <PageHeaderTitle>Alimentação</PageHeaderTitle>
              <PageHeaderDescription>Março de 2026</PageHeaderDescription>
            </PageHeaderTitleRow>
            <Acoes quantas="três" />
            <Faixa />
          </PageHeader>
          <ItemGroup variant="divided">
            {LANCAMENTOS.map(([nome, legenda, valor], i) => (
              <Item key={i} variant="flush" className="px-0">
                <ItemContent>
                  <ItemTitle>{nome}</ItemTitle>
                  <ItemDescription className="text-xs">{legenda}</ItemDescription>
                </ItemContent>
                <MoneyDisplay value={valor} signed tone="expense" className="text-sm" />
              </Item>
            ))}
          </ItemGroup>
        </div>
      </div>
    </IphoneFrame>
  )
}

function DemoEsqueleto() {
  const [faixa, setFaixa] = React.useState<"0" | "3">("3")
  return (
    <div className="flex w-full flex-col gap-6">
      <Eixo rotulo="stats" valores={["0", "3"] as const} valor={faixa} onChange={setFaixa} />
      <PageHeaderSkeleton actions={2} stats={Number(faixa)} className="w-full" />
    </div>
  )
}

export default function PageHeaderDoc() {
  return (
    <>
      <Usage>
        O topo de uma tela que tem um título grande: de onde ela veio, como se chama, o que é, os números que a pessoa
        veio conferir e a ação que oferece. Nenhuma tela do app o usa hoje — o título mora na barra do topo e as listas
        abrem direto na <code>Toolbar</code>; ele serve a tela de detalhe e o próprio catálogo. O bloco dentro da tela é{" "}
        <code>PageSection</code>; a barra da janela é <code>TopBar</code>.
      </Usage>

      <DocSection
        title="Na tela"
        description="Os eixos e as peças de uma vez. Não há régua: quem separa o cabeçalho do conteúdo é o respiro. A linha do título é o eixo: o voltar, a mídia e as ações se centram nela (e descem com a sobrancelha), o selo vem logo depois do título, e a faixa são pares em destaque, sem fio. Com três ações, o que não cabe vai para o ⋯. Tudo entra em cascata ao montar — troque um eixo para ver de novo."
        code={`<PageHeader size="md">
  <PageHeaderBreadcrumb>…</PageHeaderBreadcrumb>
  <PageHeaderTitleRow
    media={<ColorTile size="lg" color={cor}><ShoppingCartIcon /></ColorTile>}
    badge={<Badge tone="expense">Despesa</Badge>}
  >
    <PageHeaderTitle truncate>Alimentação</PageHeaderTitle>
    <PageHeaderDescription>…</PageHeaderDescription>
  </PageHeaderTitleRow>
  <PageHeaderActions overflow="menu">
    <Button variant="tertiary" size="icon-md" aria-label="Compartilhar"><ShareIcon /></Button>
    <Button variant="tertiary" size="icon-md" aria-label="Exportar"><ArrowDownTrayIcon /></Button>
    <Button><PlusIcon />nova transação</Button>
  </PageHeaderActions>
  <PageHeaderMeta>
    <PageHeaderStat label="Gasto em março" delta={<StatCardDelta current={…} previous={…} better="down" />}>
      <MoneyDisplay … />
    </PageHeaderStat>
  </PageHeaderMeta>
  <PageHeaderNav><TabsNav variant="underline">…</TabsNav></PageHeaderNav>
</PageHeader>`}
        previewClassName="items-stretch"
      >
        <DemoNaTela />
      </DocSection>

      <DocNote title="A linha do título é o eixo">
        O voltar, a mídia, as ações e o <code>endAdornment</code> se centram numa caixa de uma linha de título (
        <code>--page-title-line</code>). Com sobrancelha, o cabeçalho publica <code>--page-header-lead</code> (os 28px dela) e
        todos descem até o título — alinhados à sobrancelha, eles flutuavam acima do nome. O <code>badge</code> é o estado
        que qualifica o nome: ele mora logo depois do título, e não na ponta, onde encostava nas ações.
      </DocNote>

      <DocSection
        title="No telefone"
        description="O cabeçalho compacto: o título desce um degrau, e as ações ficam na linha dele — as que têm ícone viram quadradas, com o rótulo como nome, e o que não cabe vai para o ⋯. Com collapse, o título sobe para a barra do topo quando rola para baixo dela (TopBarTitle pageTitle), como o título grande do iOS. Role a tela. É um primeiro desenho: o telefone vai ser revisto quando as telas do app adotarem o cabeçalho."
        code={`<TopBar>
  <TopBarTitle pageTitle />
</TopBar>
…
<PageHeader collapse>
  <PageHeaderTitleRow media={…}>
    <PageHeaderTitle>Alimentação</PageHeaderTitle>
  </PageHeaderTitleRow>
  <PageHeaderActions overflow="menu">…</PageHeaderActions>
</PageHeader>`}
        previewClassName="items-center"
      >
        <DemoTelefone />
      </DocSection>

      <DocNote title="O voltar volta pelo histórico">
        Quando a pessoa veio de dentro do app, o voltar é <code>router.back()</code>: a lista de onde ela saiu volta com o
        filtro e a rolagem em que estava. O <code>href</code> fica como saída — o link aberto direto, a nova aba, o
        ⌘-clique. <code>history=&#123;false&#125;</code> (ou <code>backHistory=&#123;false&#125;</code> na linha) volta ao link
        simples, que é o que este catálogo usa nas prévias, para o voltar não tirar você da página.
      </DocNote>

      <DocSection
        title="Carregando"
        description="PageHeaderSkeleton tem a forma do cabeçalho: o título na altura do degrau, a descrição, as ações (a última larga, quadradas no telefone) e os pares da faixa."
        code={`<PageHeaderSkeleton actions={2} stats={3} />`}
        previewClassName="items-stretch"
      >
        <DemoEsqueleto />
      </DocSection>

      <DocNote title="A sobrancelha não é enfeite acima de todo título">
        Só quando há um pai de verdade a nomear — a carteira, o cartão de uma fatura. Título que precisa de uma palavra em
        cima para se explicar está mal escrito, e a correção é o título.
      </DocNote>

      <DocNote title="Título e descrição não levam gap">
        São o mesmo dado em duas linhas, e quem os separa é a entrelinha — o componente garante, e o rótulo e o valor de
        cada <code>PageHeaderStat</code> também. Só a sobrancelha abre um bloco, e é o contêiner que declara isso.
      </DocNote>

      <DocNote title="Uma ação principal por tela">
        <code>PageHeaderActions</code> aceita várias, mas só uma delas é <code>primary</code>, e ela fecha a fileira na
        borda — é o último filho, que o ⋯ nunca leva. Três botões cheios lado a lado não têm hierarquia.
      </DocNote>

      <PropsTable
        title="Eixos de PageHeader"
        rows={[
          {
            prop: "size",
            type: '"sm" | "md" | "lg"',
            default: '"md"',
            description:
              "O corpo do título — 18/24, 20/30 e 24/36px (telefone/sm+). Publica --page-title e --page-title-line.",
          },
          { prop: "reveal", type: "boolean", default: "true", description: "A cascata de entrada, uma vez, ao montar." },
          {
            prop: "collapse",
            type: "boolean",
            default: "false",
            description: "O título sobe para a barra do topo ao rolar para baixo dela — a barra o mostra com TopBarTitle pageTitle.",
          },
        ]}
      />

      <PropsTable
        title="Peças"
        rows={[
          { prop: "PageHeader", type: "ComponentProps<'header'>", description: "A grade: duas colunas em qualquer largura." },
          { prop: "PageHeaderBreadcrumb", type: "ComponentProps<'div'>", description: "A trilha. Atravessa as duas colunas e vem primeiro na leitura." },
          {
            prop: "PageHeaderTitleRow",
            type: "{ back?, backLabel?, backHistory?, media?, badge?, endAdornment? }",
            description: "A linha do título. back rende o voltar, media a identidade, badge o selo ao lado do título e endAdornment o que mora na ponta.",
          },
          { prop: "PageHeaderMedia", type: "ComponentProps<'span'>", description: "A caixa da mídia, para quem monta a linha à mão." },
          { prop: "PageHeaderEyebrow", type: "ComponentProps<'p'>", description: "O rótulo do pai da tela, em versalete." },
          {
            prop: "PageHeaderTitle",
            type: "ComponentProps<'h1'> & { asChild?, truncate? }",
            description: "O <h1> da tela. truncate corta em uma linha e mostra o resto numa dica, só quando cortou.",
          },
          { prop: "PageHeaderDescription", type: "ComponentProps<'p'>", description: "O que a tela é, em uma frase." },
          { prop: "PageHeaderMeta", type: "ComponentProps<'dl'> & { asChild? }", description: "A faixa de fatos sob o título, um <dl> sem fio." },
          {
            prop: "PageHeaderStat",
            type: "{ label, delta?, children }",
            description: "Um par da faixa: o rótulo, o valor em destaque (o MoneyDisplay herda o corpo) e a variação ao lado — o StatCardDelta.",
          },
          { prop: "PageHeaderNav", type: "ComponentProps<'div'>", description: "A navegação sob o título — TabsNav ou segmento — encostada na base." },
          {
            prop: "PageHeaderActions",
            type: "ComponentProps<'div'> & { overflow?: \"menu\", moreLabel? }",
            description: "As ações, na linha do título em qualquer largura; no telefone as de ícone ficam quadradas. overflow leva o excesso ao ⋯.",
          },
          {
            prop: "PageHeaderBack",
            type: "{ href, label?, history? }",
            description: "O voltar compacto. history (padrão) usa router.back() quando a pessoa veio de dentro do app.",
          },
          {
            prop: "PageHeaderSkeleton",
            type: "{ size?, description?, actions?, stats? }",
            description: "O esqueleto com a forma do cabeçalho.",
          },
        ]}
      />
    </>
  )
}
