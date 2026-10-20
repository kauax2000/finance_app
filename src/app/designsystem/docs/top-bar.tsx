"use client"

import * as React from "react"
import { BellIcon } from "@heroicons/react/24/outline"
import {
  AdjustmentsHorizontalIcon,
  CalendarIcon,
  EllipsisHorizontalIcon,
  HomeIcon,
  MagnifyingGlassIcon,
  ReceiptPercentIcon,
  ShoppingCartIcon,
  WalletIcon,
} from "@heroicons/react/16/solid"

import { AppWordmark } from "@/components/layout/app-wordmark"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ColorTile } from "@/components/ui/color-tile"
import { Item, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "@/components/ui/item"
import { MoneyDisplay } from "@/components/ui/money-display"
import { PageHeaderBack } from "@/components/ui/page-header"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import {
  TopBar,
  TopBarAction,
  TopBarActionGroup,
  TopBarActionSwap,
  TopBarActions,
  TopBarContent,
  TopBarProgress,
  TopBarSearch,
  TopBarSkeleton,
  TopBarStart,
  TopBarTitle,
} from "@/components/ui/top-bar"
import { IDENTITY_TONES } from "@/lib/avatar"
import { cn } from "@/lib/utils"
import { IphoneFrame, ViewportFrame } from "../ds-frame"
import { Controles, DocNote, DocSection, Eixo, Interruptor, Interruptores, PropsTable, Usage } from "../ds-doc"

/** O tom do espaço de trabalho, por índice — como na página da barra lateral. */
const TOM = IDENTITY_TONES[2]

const LANCAMENTOS = [
  ["Mercado", "Hoje · Nubank", -128.4, "#22C55E"],
  ["Uber", "Hoje · Itaú", -23.9, "#3B82F6"],
  ["Salário", "Ontem · Inter", 6200, "#14B8A6"],
  ["Restaurante", "26/03 · Nubank", -86.9, "#F97316"],
  ["Farmácia", "25/03 · Nubank", -54.3, "#EC4899"],
  ["Padaria", "24/03 · Itaú", -18.5, "#EAB308"],
  ["Spotify", "23/03 · Nubank", -21.9, "#8B5CF6"],
  ["Mercado", "22/03 · Inter", -210, "#22C55E"],
  ["Posto", "21/03 · Itaú", -180, "#EF4444"],
  ["Cinema", "20/03 · Nubank", -64, "#6366F1"],
] as const

/**
 * O que passa por baixo da barra: lançamentos com o ladrilho da categoria. As
 * cores dão ao vidro o que borrar — sobre superfície chapada o borrão não
 * desenha nada.
 */
function Conteudo() {
  return (
    <ItemGroup variant="divided" className="px-4 py-2">
      {LANCAMENTOS.map(([nome, legenda, valor, cor], i) => (
        <Item key={i} variant="flush" className="px-0">
          <ItemMedia>
            <ColorTile size="md" color={cor}>
              <ShoppingCartIcon aria-hidden />
            </ColorTile>
          </ItemMedia>
          <ItemContent>
            <ItemTitle>{nome}</ItemTitle>
            <ItemDescription className="text-xs">{legenda}</ItemDescription>
          </ItemContent>
          <MoneyDisplay value={valor} signed tone={valor > 0 ? "income" : "expense"} className="text-sm" />
        </Item>
      ))}
    </ItemGroup>
  )
}

/** A região que rola, com a barra dentro: a barra acende pelo ancestral que rola. */
function Rolagem({ fixa = false, children }: { fixa?: boolean; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "min-h-0 flex-1 overflow-y-auto",
        fixa && "max-md:pt-[calc(var(--top-bar-h,3rem)+var(--top-bar-safe-area,0px))]"
      )}
    >
      {children}
      <Conteudo />
      {/* No telefone a tela é alta: uma segunda volta, para haver o que rolar. */}
      {fixa ? <Conteudo /> : null}
    </div>
  )
}

function Sino({ count }: { count?: number }) {
  return (
    <TopBarAction label="Notificações" count={count} countLabel={count ? `${count} não lidas` : undefined}>
      <BellIcon />
    </TopBarAction>
  )
}

function Avatarzinho() {
  return (
    <Avatar size="sm">
      <AvatarFallback className={cn(TOM.surface, TOM.ink)}>P</AvatarFallback>
    </Avatar>
  )
}

const ARRANJOS = ["app", "detalhe", "marca", "pública"] as const
type Arranjo = (typeof ARRANJOS)[number]

/** Os quatro arranjos que o produto usa, numa barra só: o eixo troca as pontas. */
function Barra({
  arranjo,
  busca,
  contagem,
  progresso,
  ...props
}: React.ComponentProps<typeof TopBar> & {
  arranjo: Arranjo
  busca: boolean
  contagem: boolean
  progresso: boolean
}) {
  const sino = <Sino count={contagem ? 3 : undefined} />
  const buscar = busca ? <TopBarSearch onOpen={() => {}} listen={false} className="w-56" /> : null
  return (
    <TopBar {...props}>
      {arranjo === "app" ? (
        <>
          <TopBarStart>
            <Avatarzinho />
          </TopBarStart>
          <TopBarTitle>Início</TopBarTitle>
          <TopBarActions>
            {buscar}
            {sino}
          </TopBarActions>
        </>
      ) : arranjo === "detalhe" ? (
        <>
          <TopBarStart>
            <PageHeaderBack href="#" history={false} />
          </TopBarStart>
          <TopBarTitle>Nubank Ultravioleta</TopBarTitle>
          <TopBarActions>
            <Button variant="tertiary" className="max-md:hidden">
              <CalendarIcon aria-hidden />
              mar 2026
            </Button>
            <TopBarAction label="Mais ações">
              <EllipsisHorizontalIcon />
            </TopBarAction>
          </TopBarActions>
        </>
      ) : arranjo === "marca" ? (
        <TopBarContent className="justify-center">
          <AppWordmark size={props.size === "lg" ? "md" : "sm"} rainbow />
        </TopBarContent>
      ) : (
        <>
          {/* Os dois lados `flex-1` e a busca no meio: ela centra na janela. */}
          <TopBarStart className="min-w-0 flex-1 shrink">
            <AppWordmark size={props.size === "lg" ? "md" : "sm"} rainbow />
          </TopBarStart>
          {busca ? (
            <div className="flex justify-center max-md:order-last md:w-full md:max-w-sm">
              <TopBarSearch onOpen={() => {}} listen={false} placeholder="Buscar na ajuda…" />
            </div>
          ) : null}
          <TopBarActions className="flex-1 justify-end">
            <Button variant="tertiary">entrar</Button>
            <Button>criar conta</Button>
          </TopBarActions>
        </>
      )}
      {progresso ? <TopBarProgress /> : null}
    </TopBar>
  )
}

function DemoNaTela() {
  const [size, setSize] = React.useState<"sm" | "md" | "lg">("sm")
  const [variant, setVariant] = React.useState<"bar" | "floating">("bar")
  const [surface, setSurface] = React.useState<"solid" | "glass" | "scroll" | "edge">("edge")
  const [arranjo, setArranjo] = React.useState<Arranjo>("app")
  const [busca, setBusca] = React.useState(true)
  const [contagem, setContagem] = React.useState(true)
  const [progresso, setProgresso] = React.useState(false)

  return (
    <div className="flex w-full flex-col gap-6 p-4">
      <Controles
        empilhar
        inicio={
          <>
            <Eixo rotulo="size" valores={["sm", "md", "lg"] as const} valor={size} onChange={setSize} />
            <Eixo rotulo="variant" valores={["bar", "floating"] as const} valor={variant} onChange={setVariant} />
            <Eixo rotulo="surface" valores={["solid", "glass", "scroll", "edge"] as const} valor={surface} onChange={setSurface} />
            <Eixo rotulo="arranjo" valores={ARRANJOS} valor={arranjo} onChange={setArranjo} />
          </>
        }
        fim={
          <>
            <Interruptores>
              <Interruptor id="tb-busca" rotulo="TopBarSearch" valor={busca} onChange={setBusca} />
              <Interruptor id="tb-contagem" rotulo="count" valor={contagem} onChange={setContagem} />
              <Interruptor id="tb-progresso" rotulo="TopBarProgress" valor={progresso} onChange={setProgresso} />
            </Interruptores>
          </>
        }
      />
      <ViewportFrame title="Barra do topo numa janela" height={360} className="rounded-surface" screenClassName="bg-background">
        <Rolagem>
          <Barra
            size={size}
            variant={variant}
            surface={surface}
            arranjo={arranjo}
            busca={busca}
            contagem={contagem}
            progresso={progresso}
          />
        </Rolagem>
      </ViewportFrame>
    </div>
  )
}

function DemoTelefone() {
  const [titleAlign, setTitleAlign] = React.useState<"start" | "center">("start")
  const [variant, setVariant] = React.useState<"bar" | "floating">("bar")
  const [sumir, setSumir] = React.useState(true)
  const [voltar, setVoltar] = React.useState(false)

  return (
    <div className="flex w-full flex-col items-center gap-6 p-4">
      <Controles
        inicio={
          <>
            <Eixo rotulo="titleAlign" valores={["start", "center"] as const} valor={titleAlign} onChange={setTitleAlign} />
            <Eixo rotulo="variant" valores={["bar", "floating"] as const} valor={variant} onChange={setVariant} />
          </>
        }
        fim={
          <Interruptores>
            <Interruptor id="tb-sumir" rotulo="hideOnScroll" valor={sumir} onChange={setSumir} />
            <Interruptor id="tb-voltar" rotulo="voltar" valor={voltar} onChange={setVoltar} />
          </Interruptores>
        }
      />
      <IphoneFrame title="Barra do topo num iPhone">
        <Rolagem fixa>
          {/* Uma árvore só: `phone` diz o que cada ponta mostra abaixo de md. */}
          <TopBar position="auto" surface="scroll" variant={variant} titleAlign={titleAlign} hideOnScroll={sumir}>
            <TopBarStart phone={voltar ? <PageHeaderBack href="#" history={false} /> : <Avatarzinho />}>
              {/* No app, o gatilho da lateral; aqui, a ponta do desktop não aparece. */}
              <Avatarzinho />
            </TopBarStart>
            <TopBarTitle>{voltar ? "Nubank Ultravioleta" : "Início"}</TopBarTitle>
            <TopBarActions>
              <TopBarSearch onOpen={() => {}} listen={false} />
              <Sino count={3} />
            </TopBarActions>
          </TopBar>
        </Rolagem>
      </IphoneFrame>
    </div>
  )
}

/** O sino da tela de entrada e o voltar do detalhe, no mesmo vidro: o interruptor troca a tela. */
function DemoTroca() {
  const [voltar, setVoltar] = React.useState(false)
  return (
    <div className="flex w-full flex-col items-center gap-6 p-4">
      <Controles
        fim={
          <Interruptores>
            <Interruptor id="tb-troca-voltar" rotulo="voltar" valor={voltar} onChange={setVoltar} />
          </Interruptores>
        }
      />
      <TopBarActionSwap swapKey={voltar ? "voltar" : "sino"}>
        {voltar ? <PageHeaderBack href="#" history={false} className="ms-0" /> : <Sino count={3} />}
      </TopBarActionSwap>
    </div>
  )
}

const SEGUNDOS = ["nenhum", "mês", "ajustes"] as const

/** A cápsula do telefone: a lupa sozinha, ou com o mês ou os ajustes da tela, o vidro esticando dela. O eixo troca a tela. */
function DemoVidroQueEstica() {
  const [segundo, setSegundo] = React.useState<(typeof SEGUNDOS)[number]>("nenhum")
  return (
    <div className="flex w-full flex-col items-center gap-6 p-4">
      <Controles
        inicio={<Eixo rotulo="segundo" valores={SEGUNDOS} valor={segundo} onChange={setSegundo} />}
      />
      {/* A ponta direita fica parada, como na barra do app: o grupo encosta à direita. */}
      <div className="flex w-56 justify-end">
        <TopBarActionGroup morph trailingKey={segundo === "nenhum" ? undefined : segundo}>
          <TopBarAction label="Buscar" plate tooltip={false}>
            <MagnifyingGlassIcon className="size-4" />
          </TopBarAction>
          {segundo === "mês" ? (
            <TopBarAction label="Mês" plate tooltip={false}>
              <CalendarIcon className="size-4" />
            </TopBarAction>
          ) : segundo === "ajustes" ? (
            <TopBarAction label="Filtros" plate tooltip={false}>
              <AdjustmentsHorizontalIcon className="size-4" />
            </TopBarAction>
          ) : null}
        </TopBarActionGroup>
      </div>
    </div>
  )
}

const SECOES = [
  { rotulo: "Início", icone: HomeIcon },
  { rotulo: "Transações", icone: ReceiptPercentIcon },
  { rotulo: "Carteiras", icone: WalletIcon },
] as const

/** A barra do app no desktop, ao lado da barra lateral: gatilho, título e ações. */
function DemoComALateral() {
  return (
    <div className="p-4">
      <ViewportFrame title="A barra do app ao lado da barra lateral" height={320} className="rounded-surface" screenClassName="bg-background">
        <SidebarProvider>
          <Sidebar collapsible="icon">
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {SECOES.map((s, i) => (
                      <SidebarMenuItem key={s.rotulo}>
                        <SidebarMenuButton isActive={i === 0} tooltip={s.rotulo}>
                          <s.icone />
                          <span>{s.rotulo}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>
          <SidebarInset className="min-h-0 overflow-y-auto">
            <TopBar surface="scroll">
              <TopBarStart>
                <SidebarTrigger className="-ml-2" />
              </TopBarStart>
              <TopBarTitle>Início</TopBarTitle>
              <TopBarActions>
                <TopBarSearch onOpen={() => {}} listen={false} className="w-56" />
                <Sino count={3} />
              </TopBarActions>
            </TopBar>
            <Conteudo />
          </SidebarInset>
        </SidebarProvider>
      </ViewportFrame>
    </div>
  )
}

export default function TopBarDoc() {
  return (
    <>
      <Usage>
        A barra do topo da janela, a que fica parada enquanto a tela rola. Usam hoje a barra do app (<code>AppHeader</code>: o espaço de trabalho ou o voltar no telefone, o gatilho da lateral e a trilha no desktop, a busca e o sino) e a do catálogo. O topo <strong>de dentro</strong> da tela é o <code>PageHeader</code>; o de uma superfície, o <code>DialogHeader</code>.
      </Usage>

      <DocSection
        title="Na tela"
        description="Os eixos e os arranjos que o produto usa: o app, o detalhe, a marca e a pública. Role a prévia — no scroll a barra vira vidro e o fio aparece."
        code={`<TopBar surface="scroll">
  <TopBarStart><SidebarTrigger /></TopBarStart>
  <TopBarTitle>Início</TopBarTitle>
  <TopBarActions>
    <TopBarSearch onOpen={abrirBusca} className="w-56" />
    <TopBarAction label="Notificações" count={3} countLabel="3 não lidas"><BellIcon /></TopBarAction>
  </TopBarActions>
  {carregando ? <TopBarProgress /> : null}
</TopBar>`}
        previewClassName="block p-0"
      >
        <DemoNaTela />
      </DocSection>

      <DocNote title="A altura tem o fio e a área segura dentro">
        A caixa é <code>--top-bar-h</code> mais <code>--top-bar-safe</code> em <code>border-box</code>, então o total é o <code>--mobile-header-offset</code> que a casca usa para empurrar o conteúdo. A área segura passa por <code>--top-bar-safe-area</code>, e não por <code>env()</code> direto: é o que o iPhone do catálogo consegue emular. Na <code>floating</code> ela sai de dentro e vira a distância do topo — a pílula desce inteira abaixo do notch.
      </DocNote>

      <DocNote title="O fio só aparece ao rolar">
        No <code>scroll</code>, em repouso a barra é a página, e um fio sobre nada é ruído; ele acende junto com o vidro, quando o conteúdo passa por baixo. Em <code>solid</code> e <code>glass</code> ele fica. E ele lê <code>--sidebar-inset-rule</code>: ao lado de uma lateral <code>floating</code>, some — rolada, a barra que corre por baixo da placa se separa do conteúdo só pelo vidro.
      </DocNote>

      <DocNote title="A ação da barra traz o nome, a dica e a contagem">
        <code>TopBarAction</code> é o botão de ícone da barra: o nome vira a dica (com a tecla, se houver <code>shortcut</code>), e a contagem entra no nome — &ldquo;Notificações, 3 não lidas&rdquo; —, com o número no canto escondido do leitor. <code>TopBarSearch</code> é a pílula com ⌘K a partir de <code>md</code> e o ícone abaixo; ela escuta ⌘K e <code>/</code>, menos quando a tela já escuta (<code>listen=&#123;false&#125;</code>).
      </DocNote>

      <DocNote title="Um primeiro desenho">
        A barra é a casca de toda tela, e ela vai ser revista junto com as telas do app — o desenho, o telefone e o que a barra do app carrega devem mudar bastante ali, e esta página muda junto. Até lá, ela mostra a proposta.
      </DocNote>

      <DocSection
        title="No telefone"
        description="Uma árvore só: phone diz o que cada ponta mostra abaixo de md. O título pode ir para o meio, a barra some ao rolar para baixo e volta ao subir, e tocar no título leva a tela ao topo. Role a tela do iPhone e toque no título."
        code={`<TopBar position="auto" surface="scroll" titleAlign="center" hideOnScroll>
  <TopBarStart phone={<PageHeaderBack href="/credit-cards" />}><SidebarTrigger /></TopBarStart>
  <TopBarTitle>Nubank Ultravioleta</TopBarTitle>
  <TopBarActions>…</TopBarActions>
</TopBar>`}
        previewClassName="block p-0"
      >
        <DemoTelefone />
      </DocSection>

      <DocSection
        title="Ao lado da barra lateral"
        description="O gatilho na ponta de entrada; recolhida em ícone, a lateral floating leva o gatilho para dentro dela, e a ponta devolve o gap. Ao lado do floating a barra não pinta em repouso."
        code={`<SidebarInset>
  <TopBar surface="scroll">
    <TopBarStart><SidebarTrigger className="-ml-2" /></TopBarStart>
    …
  </TopBar>
</SidebarInset>`}
        previewClassName="block p-0"
      >
        <DemoComALateral />
      </DocSection>

      <DocSection
        title="Ações numa cápsula"
        description="TopBarActionGroup cola ações com plate numa pílula só: os cantos de dentro achatados, sem divisor e com um anel só, o do grupo. É a busca compacta do app (Configurações › Aparência › Busca no cabeçalho: Botão). No telefone os botões voltam a ser círculos soltos."
        code={`<TopBarActionGroup>
  <TopBarAction label="Buscar" plate shortcut="mod+k" onClick={abrirBusca}>
    <MagnifyingGlassIcon className="size-4" />
  </TopBarAction>
  <TopBarAction label="Notificações" plate count={3} countLabel="3 não lidas">
    <BellIcon />
  </TopBarAction>
</TopBarActionGroup>`}
      >
        <TopBarActionGroup>
          <TopBarAction label="Buscar" plate shortcut="mod+k">
            <MagnifyingGlassIcon className="size-4" />
          </TopBarAction>
          <TopBarAction label="Notificações" plate count={3} countLabel="3 não lidas">
            <BellIcon />
          </TopBarAction>
        </TopBarActionGroup>
      </DocSection>

      <DocSection
        title="O vidro estica da lupa"
        description="Com morph, a cápsula aceita um ou dois filhos: a lupa sozinha, ou a lupa com o filtro da tela. O vidro se alarga da lupa até a cápsula ao entrar o segundo, e encolhe de volta ao sair; com os dois presentes, trocar o trailingKey troca só o ícone. Troque a tela no eixo."
        code={`<TopBarActionGroup morph trailingKey={filtro?.icon}>
  <TopBarAction label="Buscar" plate onClick={abrirBusca}>
    <MagnifyingGlassIcon className="size-4" />
  </TopBarAction>
  {filtro ? (
    <TopBarAction label={filtro.label} plate onClick={filtro.onOpen}>
      {filtro.icon === "month" ? <CalendarIcon className="size-4" /> : <AdjustmentsHorizontalIcon className="size-4" />}
    </TopBarAction>
  ) : null}
</TopBarActionGroup>`}
        previewClassName="block p-0"
      >
        <DemoVidroQueEstica />
      </DocSection>

      <DocNote title="Um vidro só para o olho">
        Como os itens da barra do iOS 26: a borda esquerda anda 44px levando a lupa, a direita fica parada (o pixel da lupa sozinha é o da ponta da cápsula), e o ícone do filtro acende do desfoque no lugar dele. São os dois vidros de verdade, cada um cortado na costura entre eles (<code>clip-path</code> e <code>transform</code> só nos vidros), e o anel da cápsula que estica é o <code>::after</code> do grupo, na largura do quadro. A mola é o <code>BALANCO</code> (passa 12,7% e volta), e o balanço aparece nos dois sentidos: entrando, a cápsula alarga além da ponta (o filtro estica ancorado à direita); saindo, o círculo passa um pouco para a direita. Os dois sentidos são o mesmo filme. O relógio da mola só começa quando a pintura volta (montar o filtro para a pintura). O segundo que sai fica montado, inerte, até o vidro voltar à lupa; montar não anima, interromper segue de onde está, e com movimento reduzido troca na hora.
      </DocNote>

      <DocSection
        title="Troca no mesmo vidro"
        description="TopBarActionSwap segura o círculo de vidro e troca o miolo pela swapKey: o vidro afunda e volta na mola, o ícone de antes sai no desfoque e o novo chega dele. Ligue o voltar."
        code={`<TopBarActionSwap swapKey={detalhe ? "voltar" : "sino"}>
  {detalhe ? (
    <PageHeaderBack href="/credit-cards" className="ms-0" />
  ) : (
    <TopBarAction label="Notificações" count={3} countLabel="3 não lidas"><BellIcon /></TopBarAction>
  )}
</TopBarActionSwap>`}
        previewClassName="block p-0"
      >
        <DemoTroca />
      </DocSection>

      <DocNote title="O vidro é da troca, e só a troca anima">
        Dentro dela o <code>TopBarAction</code> não desenha o próprio vidro (o <code>plate</code> é ignorado), e o voltar entra sem vidro próprio; o realce do botão de dentro é o do vidro. Montar não anima: o primeiro quadro já é o estado final. O miolo que sai fica por cima, inerte e escondido do leitor, até o gesto acabar; o que entra já é o interativo e herda o foco. Uma troca no meio de outra não pula: o vidro segue no mesmo afundar, e cada ícone parte de onde estava e se mistura ao gesto novo no primeiro quarto dele — antes do meio, o que saía segue saindo e o que mal tinha entrado vai embora; depois, o que entrava passa a sair. Com movimento reduzido, ou com a árvore do telefone escondida, troca na hora. Durante o gesto o filho de antes e o de agora estão montados juntos: um ref passado ao filho precisa tolerar duas instâncias — o que sai, ao desmontar, não pode zerar o ref do que entrou.
      </DocNote>

      <DocSection
        title="Esqueleto"
        description="TopBarSkeleton: a ponta, o título e as ações, na altura do degrau."
        code={`<TopBarSkeleton actions={2} />`}
        previewClassName="flex-col items-stretch gap-3"
      >
        <TopBarSkeleton className="rounded-surface border border-border" />
        <TopBarSkeleton size="lg" actions={1} className="rounded-surface border border-border" />
      </DocSection>

      <DocNote title="Grudada fica abaixo da faixa de aviso">
        <code>sticky</code> mora em <code>--z-sticky</code>, para a faixa de sem conexão (<code>--z-banner</code>) cobrir a barra no desktop. No telefone a barra é fixa, a faixa desce para baixo dela, e ali ela vai a <code>--z-header</code>.
      </DocNote>

      <DocNote title="Telas fora da casca não têm barra">
        Entrada, 404 e erro mostram a marca no próprio casco (o <code>SplitShell</code>). O arranjo de marca é a forma delas se um dia precisarem de uma barra.
      </DocNote>

      <PropsTable
        title="Eixos de TopBar"
        rows={[
          { prop: "size", type: '"sm" | "md" | "lg"', default: '"sm"', description: "Altura: 56 no telefone (52 do md para cima), 56 ou 64. O padrão é sm, a do app: no telefone, botões de 44 com ícone de 20; no desktop, 8px em cima e embaixo dos controles de 36; lg é a barra das páginas de marca." },
          { prop: "position", type: '"static" | "sticky" | "fixed" | "auto"', default: '"sticky"', description: "sticky gruda na região que rola; fixed prende na janela e soma a área segura; auto é fixed no telefone e sticky acima." },
          { prop: "surface", type: '"solid" | "glass" | "scroll" | "edge"', default: '"solid"', description: "solid é --background; glass é a régua de barra; scroll troca de um para o outro ao rolar, e o fio vem junto; edge é a borda do iOS — sem tinta chapada nem fio, o conteúdo some num borrão que cresce em direção à borda e acaba 24px abaixo da barra (a do app)." },
          { prop: "variant", type: '"bar" | "floating"', default: '"bar"', description: "bar encosta nas bordas, com o fio; floating é a pílula solta, a 8px, com o anel e a sombra." },
          { prop: "titleAlign", type: '"start" | "center"', default: '"start"', description: "No telefone, o título à esquerda ou no meio, com as pontas iguais." },
          { prop: "hideOnScroll", type: "boolean", default: "false", description: "No telefone, a barra sobe ao rolar para baixo e volta ao subir; nunca com o foco dentro." },
          { prop: "gutter", type: '"bar" | "none"', default: '"bar"', description: "A calha de 16px. none para quem traz o próprio Container, como o catálogo." },
        ]}
      />

      <PropsTable
        title="Peças"
        rows={[
          { prop: "TopBarStart · TopBarContent · TopBarActions", type: "ComponentProps<'div'> & { phone? }", description: "As pontas e o meio. phone é o que mostram abaixo de md; null esconde no telefone." },
          { prop: "TopBarTitle", type: "ComponentProps<'h1'> & { phone?, pageTitle?, scrollToTop?, asChild? }", description: "O nome da tela. pageTitle recebe o título que sobe do PageHeader; tocar nele no telefone sobe ao topo." },
          { prop: "TopBarAction", type: "Button & { label, count?, countLabel?, shortcut?, tooltip?, plate? }", description: "O botão de ícone da barra, com a dica e a contagem no nome; `plate` veste o círculo de vidro do botão de recolher, em todo tamanho." },
          { prop: "TopBarActionSwap", type: "{ swapKey, className?, children }", description: "O círculo de vidro que fica enquanto o miolo troca: mudar swapKey afunda o vidro na mola e cruza os ícones no desfoque. O filho não desenha o próprio vidro." },
          { prop: "TopBarActionGroup", type: "ComponentProps<typeof ButtonGroup> & { join?, morph?, trailingKey? }", description: "Ações com plate numa cápsula: o ButtonGroup sem divisor, com o anel no grupo. join (always, o padrão; desktop; phone) diz de que lado da quebra cola, quando um dos botões só existe num lado; do outro, o que sobra é um círculo solto. morph é a cápsula do telefone, com um ou dois filhos: o vidro estica da lupa ao entrar o segundo e encolhe ao sair, e trailingKey (a identidade dele) troca só o miolo quando muda." },
          { prop: "TopBarSearch", type: "{ onOpen, label?, placeholder?, shortcut?, slash?, listen?, collapse?, glow?, plate? }", description: "A pílula de busca com a tecla, que vira ícone abaixo da quebra, e os atalhos ⌘K e /; `plate` troca o campo pelo vidro do campo do CommandDialog." },
          { prop: "TopBarProgress", type: "{ value?, label? }", description: "O fio de carregamento na aresta de baixo; sem value, indeterminado." },
          { prop: "TopBarSkeleton", type: "{ size?, actions?, start? }", description: "A barra esperando, no SkeletonGroup." },
        ]}
      />
    </>
  )
}
