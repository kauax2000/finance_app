"use client"

import * as React from "react"
import { BellIcon } from "@heroicons/react/24/outline"
import {
  CalendarIcon,
  EllipsisHorizontalIcon,
  HomeIcon,
  MagnifyingGlassIcon,
  ReceiptPercentIcon,
  WalletIcon,
} from "@heroicons/react/16/solid"

import { AppWordmark } from "@/components/layout/app-wordmark"
import { Button } from "@/components/ui/button"
import { PageHeaderBack } from "@/components/ui/page-header"
import { SearchInput } from "@/components/ui/search-input"
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
  TopBarActions,
  TopBarContent,
  TopBarStart,
  TopBarTitle,
} from "@/components/ui/top-bar"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Muted } from "@/components/ui/typography"
import { IDENTITY_TONES } from "@/lib/avatar"
import { cn } from "@/lib/utils"
import { PhoneFrame, ViewportFrame } from "../ds-frame"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

/** O tom do espaço de trabalho, por índice — como na página da barra lateral. */
const TOM = IDENTITY_TONES[2]

// ── Palco ──────────────────────────────────────────────────────────────────

/** Uma janela de desktop: a moldura fluida do catálogo, acima do `md`. */
function Desktop({
  title,
  height = 200,
  children,
}: {
  title: string
  height?: number
  children: React.ReactNode
}) {
  return (
    <ViewportFrame
      title={title}
      height={height}
      className="rounded-lg"
      screenClassName="bg-background"
    >
      {children}
    </ViewportFrame>
  )
}

/** Um telefone de 375px, com a tela começando no topo — é onde a barra mora. */
function Telefone({
  title,
  height = 260,
  children,
}: {
  title: string
  height?: number
  children: React.ReactNode
}) {
  return (
    <PhoneFrame title={title} height={height} screenClassName="bg-background">
      {children}
    </PhoneFrame>
  )
}

/**
 * Conteúdo que passa por baixo da barra. Os traços em `bg-primary` existem para
 * o vidro ter o que borrar: sobre superfície chapada o borrão não desenha nada.
 */
function Conteudo() {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: 8 }, (_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
        >
          <div className="h-2 w-16 rounded-full bg-primary" />
          <div className="h-2 flex-1 rounded-full bg-muted" />
        </div>
      ))}
    </div>
  )
}

/**
 * A região que rola, com a barra dentro. O `TopBar` acende pelo primeiro
 * ancestral que rola — aqui, este `div`; no app, a janela.
 *
 * Com `position="auto"` a barra é fixa no telefone, e o conteúdo desce a altura
 * dela: é o `--mobile-header-offset` que a casca do app usa.
 */
function Rolagem({
  fixa = false,
  children,
}: {
  fixa?: boolean
  children: React.ReactNode
}) {
  return (
    <div
      className={
        fixa
          ? "min-h-0 flex-1 overflow-y-auto max-md:pt-(--mobile-header-offset)"
          : "min-h-0 flex-1 overflow-y-auto"
      }
    >
      {children}
      <Conteudo />
    </div>
  )
}

function Sino() {
  return (
    <Button variant="tertiary" size="icon-md" aria-label="Notificações">
      <BellIcon aria-hidden />
    </Button>
  )
}

// ── As versões ───────────────────────────────────────────────────────────────

const SECOES = [
  { rotulo: "Início", icone: HomeIcon },
  { rotulo: "Transações", icone: ReceiptPercentIcon },
  { rotulo: "Carteiras", icone: WalletIcon },
] as const

/** A barra do app no desktop: gatilho, fio, título e ações. */
function BarraDoAppDesktop() {
  return (
    <Desktop title="Prévia da barra do app no desktop" height={320}>
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
              <Sino />
            </TopBarActions>
          </TopBar>
          <Conteudo />
        </SidebarInset>
      </SidebarProvider>
    </Desktop>
  )
}

/** A barra do app no telefone: espaço de trabalho, título e ações. */
function BarraDoAppTelefone({ voltar = false }: { voltar?: boolean }) {
  return (
    <Telefone
      title={
        voltar
          ? "Prévia da barra de detalhe num telefone"
          : "Prévia da barra do app num telefone"
      }
    >
      <Rolagem fixa>
        <TopBar position="auto" surface="scroll">
          <TopBarStart>
            {voltar ? (
              <PageHeaderBack href="#" />
            ) : (
              <Avatar size="sm" shape="rounded">
                <AvatarFallback className={cn(TOM.surface, TOM.ink)}>
                  P
                </AvatarFallback>
              </Avatar>
            )}
          </TopBarStart>
          <TopBarTitle>{voltar ? "Nubank Ultravioleta" : "Início"}</TopBarTitle>
          <TopBarActions>
            {voltar ? (
              <Button variant="tertiary" size="icon-md" aria-label="Mais ações">
                <EllipsisHorizontalIcon aria-hidden />
              </Button>
            ) : (
              <Sino />
            )}
          </TopBarActions>
        </TopBar>
      </Rolagem>
    </Telefone>
  )
}

/** Detalhe: voltar, título e uma ação. */
function BarraDeDetalhe() {
  return (
    <TopBar position="static">
      <TopBarStart>
        <PageHeaderBack href="#" />
      </TopBarStart>
      <TopBarTitle>Nubank Ultravioleta</TopBarTitle>
      <TopBarActions>
        <Button variant="tertiary" size="icon-md" aria-label="Mais ações">
          <EllipsisHorizontalIcon aria-hidden />
        </Button>
      </TopBarActions>
    </TopBar>
  )
}

/** Marca: só o nome do produto, no meio — entrada, convite, fluxo sem casca. */
function BarraDeMarca() {
  return (
    <TopBar position="static">
      <TopBarContent className="justify-center">
        <AppWordmark size="sm" />
      </TopBarContent>
    </TopBar>
  )
}

/**
 * Pública, com a busca no meio. Os dois lados são `flex-1` e a busca não
 * encolhe: é o que a centraliza de verdade, e não no espaço que sobra.
 */
function BarraPublica() {
  return (
    <TopBar position="static">
      <TopBarStart className="min-w-0 flex-1 shrink">
        <AppWordmark size="sm" />
      </TopBarStart>
      <SearchInput
        aria-label="Buscar"
        className="hidden w-full max-w-sm md:flex"
      />
      <TopBarActions className="flex-1 justify-end">
        <Button
          variant="tertiary"
          size="icon-md"
          className="md:hidden"
          aria-label="Buscar"
        >
          <MagnifyingGlassIcon aria-hidden />
        </Button>
        <Button variant="tertiary">
          entrar
        </Button>
        <Button>criar conta</Button>
      </TopBarActions>
    </TopBar>
  )
}

/** Com filtro: o recorte de tempo da tela mora nas ações, antes do sino. */
function BarraComFiltro() {
  return (
    <TopBar position="static">
      <TopBarTitle>Faturas</TopBarTitle>
      <TopBarActions>
        <Button variant="tertiary">
          <CalendarIcon aria-hidden />
          set 2026
        </Button>
        <Sino />
      </TopBarActions>
    </TopBar>
  )
}

/** A mesma barra numa janela de desktop e num telefone. */
function NasDuas({
  nome,
  children,
}: {
  nome: string
  children: React.ReactNode
}) {
  return (
    <div className="flex w-full flex-col items-center gap-4">
      <Desktop title={`Prévia da barra ${nome} no desktop`} height={120}>
        {children}
      </Desktop>
      <Telefone title={`Prévia da barra ${nome} num telefone`} height={120}>
        {children}
      </Telefone>
    </div>
  )
}

// ── Página ───────────────────────────────────────────────────────────────────

export default function TopBarDoc() {
  const [superficie, setSuperficie] = React.useState<"solid" | "glass" | "scroll">(
    "scroll"
  )

  return (
    <>
      <Usage>
        A barra do topo da janela — a que fica parada enquanto a tela rola. Não é
        o <code>PageHeader</code>, que é o topo de dentro da tela: esta leva o
        voltar ou a marca, o nome da tela e as ações que valem em qualquer lugar.
        No telefone ela é fixa e soma a área segura; no desktop ela gruda no topo
        da região que rola.
      </Usage>

      <DocSection
        title="O app, no desktop"
        description="Gatilho da barra lateral, título e ações. No desktop ela tem um tamanho só, 48, com a barra lateral aberta ou recolhida. Role o conteúdo: ela vira vidro."
        previewClassName="p-4"
        code={`<TopBar position="auto" surface="scroll">
  <TopBarStart>
    <SidebarTrigger className="-ml-2" />
  </TopBarStart>
  <TopBarContent>{título ou trilha}</TopBarContent>
  <TopBarActions><NotificationBellLink /></TopBarActions>
</TopBar>`}
      >
        <BarraDoAppDesktop />
      </DocSection>

      <DocSection
        title="O app, no telefone"
        description="Fixa no topo, com a área segura dentro da altura. Na raiz de uma seção, o espaço de trabalho; numa tela de detalhe, o voltar."
        previewClassName="justify-center gap-6 p-4"
        code={`<TopBar position="auto" surface="scroll">
  <TopBarStart><PageHeaderBack href={voltar} /></TopBarStart>
  <TopBarTitle>Nubank Ultravioleta</TopBarTitle>
  <TopBarActions>…</TopBarActions>
</TopBar>`}
      >
        <BarraDoAppTelefone />
        <BarraDoAppTelefone voltar />
      </DocSection>

      <DocNote title="A altura tem o fio e a área segura dentro">
        A barra do app media 56 no telefone e desenhava o fio <em>por fora</em>,
        enquanto a casca empurrava o conteúdo por <code>--mobile-header-offset</code>
        {" "}— 56 mais a área segura. O conteúdo começava 1px debaixo dela. Hoje a
        caixa é a soma de <code>--top-bar-h</code> e <code>--top-bar-safe</code>{" "}
        em <code>border-box</code>, e o total é o token, por construção.
      </DocNote>

      <DocSection
        title="Detalhe"
        description="Voltar, título e uma ação. O voltar é o PageHeaderBack — icon-md, 32 de caixa, 46 de alvo no toque, e a seta alinhada à calha de 16px. Todo botão da barra fica no degrau padrão, md."
        previewClassName="p-4"
        code={`<TopBar>
  <TopBarStart><PageHeaderBack href="/cartoes" /></TopBarStart>
  <TopBarTitle>Nubank Ultravioleta</TopBarTitle>
  <TopBarActions>
    <Button variant="tertiary" size="icon-md" aria-label="Mais ações">…</Button>
  </TopBarActions>
</TopBar>`}
      >
        <NasDuas nome="de detalhe">
          <BarraDeDetalhe />
        </NasDuas>
      </DocSection>

      <DocSection
        title="Marca"
        description="Só o nome do produto, no meio. Para o que acontece fora da casca: entrada, convite, recuperação de senha."
        previewClassName="p-4"
        code={`<TopBar>
  <TopBarContent className="justify-center">
    <AppWordmark size="sm" />
  </TopBarContent>
</TopBar>`}
      >
        <NasDuas nome="de marca">
          <BarraDeMarca />
        </NasDuas>
      </DocSection>

      <DocSection
        title="Pública, com a busca no meio"
        description="Marca à esquerda, busca centralizada, ações à direita. No telefone a busca vira ícone. Os dois lados são flex-1 e a busca não encolhe — é o que a centraliza na janela, e não no espaço que sobra."
        previewClassName="p-4"
        code={`<TopBar>
  <TopBarStart className="min-w-0 flex-1 shrink"><AppWordmark size="sm" /></TopBarStart>
  <SearchInput className="hidden w-full max-w-sm md:flex" />
  <TopBarActions className="flex-1 justify-end">…</TopBarActions>
</TopBar>`}
      >
        <NasDuas nome="pública">
          <BarraPublica />
        </NasDuas>
      </DocSection>

      <DocSection
        title="Com filtro"
        description="O recorte de tempo da tela entra nas ações, antes do sino. É o dateFilter que as páginas de faturas, cartões e categorias publicam para a barra do telefone."
        previewClassName="p-4"
        code={`<TopBar>
  <TopBarTitle>Faturas</TopBarTitle>
  <TopBarActions>{dateFilter}<NotificationBellLink /></TopBarActions>
</TopBar>`}
      >
        <NasDuas nome="com filtro">
          <BarraComFiltro />
        </NasDuas>
      </DocSection>

      <DocSection
        title="Superfícies"
        description="solid é o fundo da página; glass é a régua de barra — opaca a 95% e 60% onde o borrão existe; scroll é solid até o conteúdo passar por baixo, e glass depois. Role a prévia."
        previewClassName="flex-col items-stretch gap-3 p-4"
        code={`<TopBar surface="scroll">…</TopBar>`}
      >
        <div className="flex gap-2" role="group" aria-label="Superfície">
          {(["solid", "glass", "scroll"] as const).map((s) => (
            <Button
              key={s}
              size="sm"
              variant={superficie === s ? "secondary" : "tertiary"}
              aria-pressed={superficie === s}
              onClick={() => setSuperficie(s)}
            >
              <span>{s}</span>
            </Button>
          ))}
        </div>
        <Desktop title="Prévia das superfícies da barra do topo" height={240}>
          <Rolagem>
            <TopBar surface={superficie}>
              <TopBarTitle>Transações</TopBarTitle>
              <TopBarActions>
                <Sino />
              </TopBarActions>
            </TopBar>
          </Rolagem>
        </Desktop>
      </DocSection>

      <DocSection
        title="Tamanhos"
        description="sm 48, md 56. O padrão é sm: 48 no telefone e no desktop, com a barra lateral aberta ou recolhida."
        previewClassName="flex-col items-stretch gap-4 p-4"
        code={`<TopBar size="sm" />  // 48
<TopBar size="md" />  // 56
<TopBar />            // sm, o padrão`}
      >
        <Desktop title="Prévia dos dois degraus da barra do topo" height={128}>
          <div className="flex flex-col gap-2 p-2">
            {(["sm", "md"] as const).map((size) => (
              <TopBar key={size} size={size} position="static" className="rounded-md border">
                <TopBarTitle>{size}</TopBarTitle>
                <Muted className="text-xs">
                  {size === "sm" ? "48px" : "56px"}
                </Muted>
              </TopBar>
            ))}
          </div>
        </Desktop>
        <div className="flex justify-center">
          <NasDuas nome="no tamanho padrão">
            <TopBar position="static">
              <TopBarTitle>sm</TopBarTitle>
              <Muted className="text-xs">48 no telefone e no desktop</Muted>
            </TopBar>
          </NasDuas>
        </div>
      </DocSection>

      <DocNote title="Grudada fica abaixo da faixa de aviso">
        <code>sticky</code> mora em <code>--z-sticky</code>, e não em{" "}
        <code>--z-header</code>. A faixa de sem conexão é{" "}
        <code>fixed md:top-0</code> em <code>--z-banner</code> e cobre a barra
        do desktop de propósito — a 40 a barra a esconderia. No telefone a barra
        é fixa, a faixa desce para baixo dela, e ali a barra vai a{" "}
        <code>--z-header</code>.
      </DocNote>

      <DocNote title="O fio é da barra lateral, e não da tela">
        A borda de baixo lê <code>--sidebar-inset-rule</code>, que o{" "}
        <code>SidebarInset</code> publica: com a barra lateral{" "}
        <code>floating</code> a placa não tem borda para o fio encostar, e ele
        some em vez de ficar pendurado a 8px de nada. Fora de um{" "}
        <code>SidebarInset</code>, 1px.
      </DocNote>

      <DocNote title="O que ela substituiu">
        Havia duas barras escritas à mão: a do app, com vidro próprio (8px, sem
        saturação, sem guarda de transparência reduzida), <code>z-10</code> cru
        e o fio por fora da altura; e a do catálogo, já na régua de barra. As
        duas passaram a ser esta. As telas de entrada, 404 e erro não têm barra
        — mostram a marca acima do conteúdo —, e a versão de marca acima é a
        forma delas se um dia precisarem de uma.
      </DocNote>

      <PropsTable
        title="Eixos de TopBar"
        rows={[
          {
            prop: "size",
            type: '"sm" | "md"',
            default: '"sm"',
            description:
              "Altura: 48, 56. O padrão é sm — 48 no telefone e no desktop, um tamanho só com a barra lateral aberta ou recolhida.",
          },
          {
            prop: "position",
            type: '"static" | "sticky" | "fixed" | "auto"',
            default: '"sticky"',
            description:
              "sticky gruda no topo da região que rola, em --z-sticky. fixed prende na janela, em --z-header, e soma a área segura. auto é fixed no telefone e sticky acima — a forma do app.",
          },
          {
            prop: "surface",
            type: '"solid" | "glass" | "scroll"',
            default: '"solid"',
            description:
              "solid é --background; glass é barSurfaceClassName; scroll é solid até o primeiro ancestral que rola (ou a janela) sair do topo, e glass depois.",
          },
          {
            prop: "gutter",
            type: '"bar" | "none"',
            default: '"bar"',
            description:
              "A calha de 16px. none para quem traz o próprio Container, como o catálogo.",
          },
        ]}
      />

      <PropsTable
        title="Peças"
        rows={[
          {
            prop: "TopBar",
            type: "ComponentProps<'header'>",
            description: "A linha, com altura, fio, camada e superfície.",
          },
          {
            prop: "TopBarStart",
            type: "ComponentProps<'div'>",
            description: "A ponta de entrada: voltar, gatilho da barra lateral, marca.",
          },
          {
            prop: "TopBarTitle",
            type: "ComponentProps<'h1'> & { asChild?: boolean }",
            description:
              "O nome da tela, truncado numa linha. É o elástico da linha quando não há TopBarContent.",
          },
          {
            prop: "TopBarContent",
            type: "ComponentProps<'div'>",
            description: "O meio elástico, para o que não é texto: trilha, busca, título composto.",
          },
          {
            prop: "TopBarActions",
            type: "ComponentProps<'div'>",
            description: "A ponta de saída, encostada à direita.",
          },
        ]}
      />
    </>
  )
}
