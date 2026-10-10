"use client"

import * as React from "react"
import {
  ArrowsRightLeftIcon,
  BellIcon,
  ChartPieIcon,
  CreditCardIcon,
  HomeIcon,
  PlusIcon,
  ReceiptPercentIcon,
  SignalIcon,
  WalletIcon,
  WifiIcon,
} from "@heroicons/react/16/solid"
import {
  ArrowsRightLeftIcon as ArrowsRightLeftOutline,
  ChartPieIcon as ChartPieOutline,
  Squares2X2Icon,
} from "@heroicons/react/24/outline"
import {
  ArrowsRightLeftIcon as ArrowsRightLeftSolid,
  ChartPieIcon as ChartPieSolid,
  Squares2X2Icon as Squares2X2Solid,
} from "@heroicons/react/24/solid"
import { Battery100Icon, PlusIcon as PlusIconMini } from "@heroicons/react/20/solid"

import { AvatarGroup, AvatarGroupItem } from "@/components/ui/avatar-group"
import { Badge } from "@/components/ui/badge"
import { BottomBar, BottomBarAction, BottomBarTab } from "@/components/ui/bottom-bar"
import { Button } from "@/components/ui/button"
import { ColorTile } from "@/components/ui/color-tile"
import { MoneyDisplay } from "@/components/ui/money-display"
import {
  OnboardingCard,
  OnboardingChecklist,
  OnboardingDialog,
  OnboardingHotspot,
  OnboardingSkeleton,
  OnboardingTour,
  type OnboardingChecklistItem,
  type OnboardingMediaSource,
  type OnboardingStep,
  type OnboardingTourStep,
} from "@/components/ui/onboarding"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Progress } from "@/components/ui/progress"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { TopBar, TopBarAction, TopBarActions, TopBarSearch, TopBarTitle } from "@/components/ui/top-bar"
import { Caption, Muted } from "@/components/ui/typography"
import { TILE_PALETTE } from "@/lib/tile-palette"
import { cn } from "@/lib/utils"
import { Controles, DocNote, DocSection, Eixo, Interruptor, Interruptores, PropsTable, Usage } from "../ds-doc"
import { IPHONE_TELA, IphoneFrame, ViewportFrame } from "../ds-frame"

const cor = (nome: string) => TILE_PALETTE.find((p) => p.nome === nome)!.hex

/* ── As ilustrações: miniaturas do próprio app, no tema, em vez de fotos ── */

function Ilustracao({ children }: { children: React.ReactNode }) {
  return <div className="flex size-full items-center justify-center p-5">{children}</div>
}

function MiniSaldo() {
  const barras = [42, 68, 55, 80, 61, 92, 74]
  return (
    <Ilustracao>
      <div className="flex w-full max-w-64 flex-col gap-3 rounded-row bg-card p-3 shadow-sm ring-1 ring-foreground/10">
        <div className="flex flex-col">
          <Caption>Saldo de março</Caption>
          <MoneyDisplay value={3412.85} size="lg" />
        </div>
        <div className="flex h-12 items-end gap-1.5" aria-hidden>
          {barras.map((h, i) => (
            <div
              key={i}
              className={i % 3 === 2 ? "flex-1 rounded-xs bg-chart-expense/80" : "flex-1 rounded-xs bg-chart-income/80"}
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
      </div>
    </Ilustracao>
  )
}

function MiniCategorias() {
  const linhas = [
    ["Mercado", "coral", 612.4],
    ["Transporte", "azul", 238.9],
    ["Casa", "violeta", 1450],
  ] as const
  return (
    <Ilustracao>
      <div className="flex w-full max-w-64 flex-col gap-2 rounded-row bg-card p-3 shadow-sm ring-1 ring-foreground/10">
        {linhas.map(([nome, c, valor]) => (
          <div key={nome} className="flex items-center gap-2 text-xs">
            <ColorTile color={cor(c)} size="xs" />
            <span className="flex-1 font-medium">{nome}</span>
            <MoneyDisplay value={-valor} size="sm" tone="expense" />
          </div>
        ))}
      </div>
    </Ilustracao>
  )
}

function MiniFatura() {
  return (
    <Ilustracao>
      <div className="flex w-full max-w-64 flex-col gap-2 rounded-row bg-card p-3 shadow-sm ring-1 ring-foreground/10">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium">Inter Gold</span>
          <Badge tone="success" size="xs">Aberta</Badge>
        </div>
        <MoneyDisplay value={1284.6} size="md" />
        <Progress value={42} size="sm" bands={[30, 70]} aria-label="42% do limite" />
        <Caption>Fecha dia 12 · vence dia 19</Caption>
      </div>
    </Ilustracao>
  )
}

function MiniCasa() {
  return (
    <Ilustracao>
      <div className="flex w-full max-w-64 items-center justify-between gap-3 rounded-row bg-card p-3 shadow-sm ring-1 ring-foreground/10">
        <div className="flex flex-col">
          <span className="text-sm font-medium">Casa</span>
          <Caption>4 pessoas dividem</Caption>
        </div>
        <AvatarGroup label="Quem divide a casa" size="sm">
          {["Ana Ribeiro", "Bruno Lima", "Carla Mendes", "Diego Souza"].map((n) => (
            <AvatarGroupItem key={n} name={n} />
          ))}
        </AvatarGroup>
      </div>
    </Ilustracao>
  )
}

/* ── Os dados de exemplo ─────────────────────────────────────────────────── */

const BOAS_VINDAS: OnboardingStep[] = [
  {
    title: "Tudo num lugar só",
    description: "As contas do Nubank, do Inter e do Itaú no mesmo saldo, atualizado a cada lançamento.",
    media: <MiniSaldo />,
  },
  {
    title: "Categorias que se ajustam",
    description: "Cada gasto cai numa categoria, e o orçamento de cada uma avisa antes de estourar.",
    media: <MiniCategorias />,
  },
  {
    title: "Cartões e faturas",
    description: "A fatura aberta, a data de fechamento e quanto do limite já foi usado, sem abrir o app do banco.",
    media: <MiniFatura />,
  },
  {
    title: "Divida a casa",
    description: "Convide quem mora com você: cada um lança, e a carteira mostra quem pagou o quê.",
    media: <MiniCasa />,
  },
]

const ITENS_INICIAIS: OnboardingChecklistItem[] = [
  {
    id: "conta",
    title: "Conectar a conta do Nubank",
    description: "O saldo e os lançamentos chegam sozinhos, todo dia.",
    done: true,
  },
  {
    id: "despesa",
    title: "Registrar a primeira despesa",
    description: "Mercado, Uber, a padaria de hoje — leva dez segundos.",
    action: { label: "registrar" },
  },
  {
    id: "cartao",
    title: "Cadastrar o cartão Inter Gold",
    description: "Com o dia de fechamento, a fatura de março aparece separada.",
    action: { label: "cadastrar" },
  },
  {
    id: "orcamento",
    title: "Definir o orçamento de março",
    description: "R$ 4.200,00 para o mês, dividido entre as categorias que você mais usa.",
    action: { label: "definir" },
  },
  {
    id: "convite",
    title: "Convidar quem divide a casa",
    description: "Cada pessoa lança os próprios gastos na carteira Casa.",
    action: { label: "convidar" },
  },
]

const VIDEO: OnboardingMediaSource = {
  type: "video",
  src: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
  alt: "A nova tela de faturas por categoria",
}

const PASSOS_DO_TOUR: OnboardingTourStep[] = [
  {
    target: '[data-slot="top-bar-search"]',
    title: "Ache qualquer coisa",
    description: "Uma transação, uma categoria ou uma tela — também pelo ⌘K, de qualquer lugar.",
    side: "bottom",
    align: "end",
  },
  {
    target: '[data-tour="cartoes"]',
    title: "Seus cartões",
    description: "A fatura aberta de cada cartão e o limite que sobra.",
    side: "right",
  },
  {
    target: '[data-tour="adicionar"]',
    title: "Lance um gasto",
    description: "O + Adicionar abre o lançamento rápido.",
    advanceOn: "target",
    hint: "Clique em Adicionar para continuar.",
  },
  {
    target: '[data-tour="despesa"]',
    title: "Uma despesa",
    description: "Escolha despesa: o valor, a categoria e pronto.",
    advanceOn: "target",
    waitFor: true,
    side: "right",
    hint: "Clique em Despesa.",
  },
  {
    target: '[data-slot="onboarding-checklist"]',
    title: "Os próximos passos",
    description: "O que falta para o app ficar com a sua cara. Ele some quando tudo estiver pronto.",
    side: "bottom",
    align: "start",
  },
]

/* ── Na tela ─────────────────────────────────────────────────────────────── */

const VARIANTES = ["accordion", "list"] as const
const SUPERFICIES = ["brand", "beam", "contrast"] as const
const CHAVES = {
  checklist: "ds-onboarding-checklist",
  card: "ds-onboarding-card",
  hotspot: "ds-onboarding-hotspot",
  tour: "ds-onboarding-tour",
} as const

function esquecer() {
  try {
    Object.values(CHAVES).forEach((k) => window.localStorage.removeItem(k))
  } catch {}
}

const NAV = [
  { rotulo: "Início", icone: HomeIcon },
  { rotulo: "Lançamentos", icone: ReceiptPercentIcon },
  { rotulo: "Cartões", icone: CreditCardIcon, tour: "cartoes" },
  { rotulo: "Orçamentos", icone: ChartPieIcon },
] as const

/** O cartão de novidade da demonstração: imagens em leque ou um vídeo. */
function Novidade({ video, variant }: { video: boolean; variant: (typeof SUPERFICIES)[number] }) {
  return (
    <OnboardingCard
      variant={variant}
      storageKey={CHAVES.card}
      title="Faturas por categoria"
      description="Veja em que a fatura de março foi gasta antes de ela fechar."
      media={video ? [VIDEO] : [<MiniFatura key="a" />, <MiniCategorias key="b" />, <MiniSaldo key="c" />]}
      action={{ label: "saiba mais", href: "#" }}
    />
  )
}

function DemoNaTela() {
  const [variant, setVariant] = React.useState<(typeof VARIANTES)[number]>("accordion")
  const [superficie, setSuperficie] = React.useState<(typeof SUPERFICIES)[number]>("brand")
  const [card, setCard] = React.useState(true)
  const [hotspot, setHotspot] = React.useState(true)
  const [pronto, setPronto] = React.useState(false)
  const [video, setVideo] = React.useState(false)
  const [itens, setItens] = React.useState(ITENS_INICIAIS)
  const [tour, setTour] = React.useState(false)
  const [menu, setMenu] = React.useState(false)
  const [rodada, setRodada] = React.useState(0)
  const [ultimo, setUltimo] = React.useState<string | null>(null)

  const marcar = (id: string) => setItens((l) => l.map((i) => (i.id === id ? { ...i, done: true } : i)))
  const escolher = (rotulo: string) => {
    setMenu(false)
    setUltimo(rotulo)
    if (rotulo === "Despesa") marcar("despesa")
  }
  const lista = (pronto ? itens.map((i) => ({ ...i, done: true })) : itens).map((i) =>
    i.action ? { ...i, action: { ...i.action, onClick: () => marcar(i.id) } } : i
  )

  return (
    <div className="flex w-full flex-col gap-3">
      <Controles
        empilhar
        inicio={
          <>
            <Eixo rotulo="variant do checklist" valores={VARIANTES} valor={variant} onChange={setVariant} />
            <Eixo rotulo="variant do card" valores={SUPERFICIES} valor={superficie} onChange={setSuperficie} />
          </>
        }
        fim={
          <Interruptores>
            <Interruptor id="ob-card" rotulo="OnboardingCard" valor={card} onChange={setCard} />
            <Interruptor id="ob-video" rotulo="vídeo" valor={video} onChange={setVideo} />
            <Interruptor id="ob-hotspot" rotulo="OnboardingHotspot" valor={hotspot} onChange={setHotspot} />
            <Interruptor id="ob-pronto" rotulo="tudo feito" valor={pronto} onChange={setPronto} />
          </Interruptores>
        }
      />
      <ViewportFrame
        key={`${variant}-${rodada}`}
        title="O onboarding numa tela do app"
        height={640}
        className="rounded-surface"
        screenClassName="bg-background"
      >
        <SidebarProvider open onOpenChange={() => {}}>
          <Sidebar collapsible="none">
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {NAV.map((n, i) => (
                      <SidebarMenuItem key={n.rotulo}>
                        <SidebarMenuButton isActive={i === 0} data-tour={"tour" in n ? n.tour : undefined}>
                          <n.icone />
                          <span>{n.rotulo}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
            {card ? (
              <SidebarFooter>
                <Novidade key={`${video}-${superficie}`} video={video} variant={superficie} />
              </SidebarFooter>
            ) : null}
          </Sidebar>
          <SidebarInset className="min-h-0 overflow-y-auto">
            <TopBar surface="scroll">
              <TopBarTitle>Início</TopBarTitle>
              <TopBarActions>
                <TopBarSearch onOpen={() => {}} listen={false} className="w-56" />
                {hotspot ? (
                  <OnboardingHotspot
                    storageKey={CHAVES.hotspot}
                    label="Novidade nas notificações"
                    title="Avisos de fatura"
                    description="Agora o sino avisa três dias antes de cada fatura fechar."
                    align="end"
                  >
                    <TopBarAction label="Notificações" count={2} countLabel="2 não lidas">
                      <BellIcon />
                    </TopBarAction>
                  </OnboardingHotspot>
                ) : (
                  <TopBarAction label="Notificações" count={2} countLabel="2 não lidas">
                    <BellIcon />
                  </TopBarAction>
                )}
              </TopBarActions>
            </TopBar>

            <div className="flex flex-col gap-4 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Popover open={menu} onOpenChange={setMenu}>
                  <PopoverTrigger asChild>
                    <Button data-tour="adicionar">
                      <PlusIcon />
                      adicionar
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent size="sm" align="start" label="Adicionar" className="gap-1 p-2">
                    <Button variant="tertiary" className="justify-start" data-tour="despesa" onClick={() => escolher("Despesa")}>
                      <ReceiptPercentIcon />
                      Despesa
                    </Button>
                    <Button variant="tertiary" className="justify-start" data-tour="receita" onClick={() => escolher("Receita")}>
                      <WalletIcon />
                      Receita
                    </Button>
                    <Button variant="tertiary" className="justify-start" onClick={() => escolher("Transferência")}>
                      <ArrowsRightLeftIcon />
                      Transferência
                    </Button>
                  </PopoverContent>
                </Popover>
                <Button variant="tertiary" onClick={() => setTour(true)}>
                  fazer o tour
                </Button>
                <Caption aria-live="polite" className="ms-auto">
                  {ultimo ? `Abriu: ${ultimo}` : "Saldo de março: R$ 3.412,85"}
                </Caption>
              </div>

              <OnboardingChecklist
                key={variant}
                storageKey={CHAVES.checklist}
                variant={variant}
                title="Primeiros passos"
                items={lista}
                doneDescription="O app já tem a sua cara. Dá para rever tudo em Ajustes."
                className="max-w-sm"
              />
            </div>

            <OnboardingTour
              open={tour}
              onOpenChange={setTour}
              storageKey={CHAVES.tour}
              steps={PASSOS_DO_TOUR}
            />
          </SidebarInset>
        </SidebarProvider>
      </ViewportFrame>
      <div className="flex items-center gap-3">
        <Caption>O dispensar, o visto e o passo do tour ficam guardados neste navegador.</Caption>
        <Button
          variant="tertiary"
          size="sm"
          onClick={() => {
            esquecer()
            setItens(ITENS_INICIAIS)
            setUltimo(null)
            setRodada((r) => r + 1)
          }}
        >
          esquecer o que foi visto
        </Button>
      </div>
    </div>
  )
}

/* ── O diálogo ───────────────────────────────────────────────────────────── */

function DemoDialogo() {
  const [fim, setFim] = React.useState<string | null>(null)
  return (
    <div className="flex flex-col items-center gap-3">
      <OnboardingDialog
        steps={BOAS_VINDAS}
        trigger={<Button>ver as boas-vindas</Button>}
        onComplete={() => setFim("Concluiu os quatro passos.")}
        onSkip={() => setFim("Pulou.")}
      />
      <Caption aria-live="polite">{fim ?? "Arraste a ilustração, use as setas ou as pílulas."}</Caption>
    </div>
  )
}

/* ── No telefone ─────────────────────────────────────────────────────────── */

const ABAS = [
  { href: "/dashboard", label: "Início", icon: Squares2X2Icon, iconActive: Squares2X2Solid },
  { href: "/transactions", label: "Transações", icon: ArrowsRightLeftOutline, iconActive: ArrowsRightLeftSolid },
  { href: "/categories", label: "Categorias", icon: ChartPieOutline, iconActive: ChartPieSolid },
] as const

const PASSOS_DO_TELEFONE: OnboardingTourStep[] = [
  {
    target: '[data-tour="tel-saldo"]',
    title: "O saldo do mês",
    description: "Entradas menos saídas, das três contas.",
  },
  {
    target: '[data-slot="onboarding-checklist"]',
    title: "Os próximos passos",
    description: "O que falta para o app ficar com a sua cara. Some quando tudo estiver pronto.",
  },
  {
    target: '[data-tour="tel-adicionar"]',
    title: "Lance um gasto",
    description: "O + abre o lançamento rápido, de qualquer tela.",
    advanceOn: "target",
    hint: "Toque no + para terminar.",
  },
]

/** A área segura de cima da moldura, em px: onde mora a barra de status. */
const STATUS_H = Math.round((815 * IPHONE_TELA.safeTop) / 100)

/**
 * O que é do aparelho, e não do app: a barra de status (a hora e os sinais), o
 * indicador de início e o **ponto de toque** — a moldura roda no navegador do
 * desktop, e o cursor ali dentro dizia "mouse". O cursor some e um círculo
 * segue o ponteiro, afundando ao tocar, como a gravação de tela de um
 * telefone. Acima de tudo (`--z-toast`), porque é do sistema e não do app.
 */
function Aparelho() {
  const ponto = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    const el = ponto.current
    if (!el) return
    const doc = el.ownerDocument
    const mover = (e: PointerEvent) => {
      el.style.translate = `${e.clientX}px ${e.clientY}px`
      el.dataset.visivel = ""
    }
    const baixar = (e: PointerEvent) => {
      mover(e)
      el.dataset.tocando = ""
    }
    const subir = () => delete el.dataset.tocando
    const sair = () => {
      delete el.dataset.visivel
      delete el.dataset.tocando
    }
    doc.addEventListener("pointermove", mover, true)
    doc.addEventListener("pointerdown", baixar, true)
    doc.addEventListener("pointerup", subir, true)
    doc.addEventListener("pointercancel", subir, true)
    doc.documentElement.addEventListener("pointerleave", sair)
    return () => {
      doc.removeEventListener("pointermove", mover, true)
      doc.removeEventListener("pointerdown", baixar, true)
      doc.removeEventListener("pointerup", subir, true)
      doc.removeEventListener("pointercancel", subir, true)
      doc.documentElement.removeEventListener("pointerleave", sair)
    }
  }, [])
  return (
    <>
      <style>{"html, html * { cursor: none !important }"}</style>
      <div
        aria-hidden
        data-slot="phone-status-bar"
        style={{ height: STATUS_H }}
        className="pointer-events-none fixed inset-x-0 top-0 z-(--z-toast) flex items-center justify-between ps-9 pe-7 text-foreground"
      >
        <span className="nums text-sm font-semibold">9:41</span>
        <span className="flex items-center gap-1">
          <SignalIcon className="size-4" />
          <WifiIcon className="size-4" />
          <Battery100Icon className="size-5" />
        </span>
      </div>
      <div
        aria-hidden
        data-slot="phone-home-indicator"
        className="pointer-events-none fixed bottom-2 left-1/2 z-(--z-toast) h-1.25 w-34 -translate-x-1/2 rounded-full bg-foreground"
      />
      <div
        ref={ponto}
        aria-hidden
        data-slot="phone-touch-point"
        className={cn(
          "pointer-events-none fixed top-0 left-0 z-(--z-toast) -ms-5 -mt-5 size-10 rounded-full",
          "bg-foreground/15 ring-1 ring-foreground/30 opacity-0",
          "transition-[opacity,scale,background-color] duration-(--duration-fast) ease-(--ease-out)",
          "data-tocando:scale-90 data-tocando:bg-foreground/30 data-visivel:opacity-100"
        )}
      />
    </>
  )
}

/**
 * Uma tela do app no telefone, e não um palco de botões: o checklist é quem
 * abre as boas-vindas (a gaveta) e o tour, como seria no primeiro uso; o ponto
 * pulsa no sino; o card fica no fim do feed e abre no toque.
 */
function NoTelefone() {
  const [boasVindas, setBoasVindas] = React.useState(false)
  const [tour, setTour] = React.useState(false)
  const [feitos, setFeitos] = React.useState<string[]>(["conta"])
  const marcar = (id: string) => setFeitos((l) => (l.includes(id) ? l : [...l, id]))
  const itens: OnboardingChecklistItem[] = [
    { id: "conta", title: "Conectar a conta do Nubank", done: feitos.includes("conta") },
    {
      id: "boas-vindas",
      title: "Ver as boas-vindas",
      done: feitos.includes("boas-vindas"),
      action: { label: "ver", onClick: () => setBoasVindas(true) },
    },
    {
      id: "tour",
      title: "Conhecer a tela",
      done: feitos.includes("tour"),
      action: { label: "fazer o tour", onClick: () => setTour(true) },
    },
    {
      id: "despesa",
      title: "Registrar a primeira despesa",
      done: feitos.includes("despesa"),
      action: { label: "registrar", onClick: () => marcar("despesa") },
    },
  ]
  return (
    <IphoneFrame title="O onboarding num iPhone">
      <Aparelho />
      {/* A barra é a do app no telefone: fixa, com a área da ilha dentro dela, e
          a tela desce a altura dela (a `sm`, a de fábrica: 48) mais a ilha. */}
      <div
        className="no-scrollbar h-full overflow-y-auto bg-background select-none"
        // A folga de rolagem desconta as duas barras: o card que abre no fim
        // do feed rola até ficar acima da de baixo.
        style={{ paddingTop: STATUS_H + 48, scrollPaddingTop: STATUS_H + 48, scrollPaddingBottom: 112 }}
      >
        <TopBar position="auto" surface="scroll">
          <TopBarTitle>Início</TopBarTitle>
          <TopBarActions>
            <OnboardingHotspot
              label="Novidade nas notificações"
              title="Avisos de fatura"
              description="Agora o sino avisa três dias antes de cada fatura fechar."
              align="end"
            >
              <TopBarAction label="Notificações" count={2} countLabel="2 não lidas">
                <BellIcon />
              </TopBarAction>
            </OnboardingHotspot>
          </TopBarActions>
        </TopBar>
        <div className="flex flex-col gap-4 px-4 pt-2 pb-32">
          <div data-tour="tel-saldo" className="flex flex-col rounded-surface bg-card p-4 ring-1 ring-foreground/10">
            <Caption>Saldo de março</Caption>
            <MoneyDisplay value={3412.85} size="xl" />
            <Muted className="text-xs">Nubank, Inter e Itaú</Muted>
          </div>
          <OnboardingChecklist
            variant="list"
            title="Primeiros passos"
            items={itens}
            doneDescription="O app já tem a sua cara. Dá para rever tudo em Ajustes."
          />
          <OnboardingCard
            title="Faturas por categoria"
            description="Toque para ver a novidade."
            media={[<MiniFatura key="a" />, <MiniCategorias key="b" />, <MiniSaldo key="c" />]}
            action={{ label: "saiba mais", href: "#" }}
          />
        </div>
      </div>
      <BottomBar
        action={
          <BottomBarAction label="Adicionar" data-tour="tel-adicionar">
            <PlusIconMini className="size-5" aria-hidden />
          </BottomBarAction>
        }
      >
        {ABAS.map((aba, i) => (
          <BottomBarTab
            key={aba.href}
            href={aba.href}
            label={aba.label}
            icon={aba.icon}
            iconActive={aba.iconActive}
            active={i === 0}
            onClick={(e) => e.preventDefault()}
          />
        ))}
      </BottomBar>
      <OnboardingDialog
        steps={BOAS_VINDAS}
        open={boasVindas}
        onOpenChange={setBoasVindas}
        onComplete={() => marcar("boas-vindas")}
      />
      <OnboardingTour open={tour} onOpenChange={setTour} steps={PASSOS_DO_TELEFONE} onComplete={() => marcar("tour")} />
    </IphoneFrame>
  )
}

/* ── A página ────────────────────────────────────────────────────────────── */

export default function OnboardingDoc() {
  return (
    <>
      <Usage>
        Apresentar o produto a quem acabou de chegar, ou uma novidade a quem já usa. São cinco superfícies, uma por
        intenção: as <strong>boas-vindas</strong> em passos (<code>OnboardingDialog</code>), os{" "}
        <strong>primeiros passos</strong> que a pessoa marca fazendo (<code>OnboardingChecklist</code>), a{" "}
        <strong>novidade</strong> no rodapé da barra lateral (<code>OnboardingCard</code>), o <strong>tour</strong> que
        recorta botões reais da tela (<code>OnboardingTour</code>) e o <strong>ponto</strong> que pulsa sobre um botão
        sem interromper (<code>OnboardingHotspot</code>). Não use para um formulário em etapas — isso é o{" "}
        <code>Stepper</code>, e o assistente de categorias do app é um deles —, nem para um aviso que não se dispensa,
        que é o <code>Alert</code>. Nenhuma tela do app usa o onboarding ainda.
      </Usage>

      <DocSection
        title="Na tela"
        description="Uma tela do app com as quatro superfícies que moram nela. Faça o tour: o véu recorta a busca, o menu Cartões e o + Adicionar — e nesse passo é o clique no próprio botão que avança. O passo seguinte espera o menu abrir para recortar a Despesa. O card da barra abre ao passar o cursor, focar ou tocar; o ponto no sino some quando o sino é usado."
        code={`<OnboardingTour open={tour} onOpenChange={setTour} storageKey="tour-inicio" steps={[
  { target: '[data-slot="top-bar-search"]', title: "Ache qualquer coisa" },
  { target: '[data-tour="adicionar"]', title: "Lance um gasto", advanceOn: "target" },
  { target: '[data-tour="despesa"]', title: "Uma despesa", advanceOn: "target", waitFor: true },
]} />

<OnboardingChecklist title="Primeiros passos" storageKey="primeiros-passos" items={[
  { id: "despesa", title: "Registrar a primeira despesa", done: temTransacao,
    action: { label: "registrar", href: "/transactions/new" } },
]} />

<SidebarFooter>
  <OnboardingCard storageKey="novidade-faturas" title="Faturas por categoria"
    media={[{ type: "video", src: "/novidades/faturas.mp4" }]}
    action={{ label: "saiba mais", href: "/novidades" }} />
</SidebarFooter>

<OnboardingHotspot storageKey="sino-faturas" title="Avisos de fatura">
  <NotificationBellLink />
</OnboardingHotspot>`}
        previewClassName="items-stretch"
      >
        <DemoNaTela />
      </DocSection>

      <DocNote title="O clique passa pelo buraco">
        Quem escurece a tela é a sombra de 100vmax de um elemento sem eventos; quem impede o clique são quatro retângulos
        transparentes <strong>em volta</strong> do recorte. Dentro dele não há nada, e o clique cai no botão real. Um
        passo com <code>advanceOn: &quot;target&quot;</code> avança num <code>click</code> em bolha no documento — depois
        que o próprio app abriu o menu ou navegou — conferindo onde aconteceu o <code>pointerdown</code>: com um menu
        modal aberto o Radix tira os eventos do <code>body</code>, e o <code>click</code> cai no{" "}
        <code>&lt;html&gt;</code>. No teclado, o Tab circula entre a placa e o próprio alvo, e o Enter nele avança igual.
      </DocNote>

      <DocNote title="O buraco tem o raio do alvo, e o anel é de marca">
        O recorte é a caixa do elemento mais 4px de folga, e o raio é o dele mais a folga: a pílula da busca ganha um
        recorte cápsula, o checklist (22) ganha 26. Em volta dele corre o degradê da marca (o{" "}
        <code>--brand-rainbow</code>, o linear de 135°): um traço nítido de 2px, parado e concêntrico com o buraco. O brilho da casa (a{" "}
        <code>brand-glow</code>) foi tentado aqui e saiu: as vinte faixas dele, feitas para um arco curto, liam como
        listras numa pílula larga. No escuro o véu quase não aparece (<code>--overlay</code> a 40% sobre uma página
        quase preta), e quem marca o alvo é o anel.
      </DocNote>

      <DocNote title="O gesto do tour é o foco">
        Ao abrir, o véu fecha sobre o alvo vindo das bordas, como uma íris: o buraco nasce maior que a janela e encolhe
        até o recorte. Ao trocar de passo, a placa some para dentro do alvo de agora — com a âncora congelada, para não
        atravessar a tela com o texto trocado —, o buraco viaja em curva até o próximo e pousa com um pulso do anel, e só
        então a placa nova surge do lado dele, as faixas subindo em cascata. Ao fechar, a placa some e a íris abre. A
        viagem era na mola: o buraco passava do alvo (num cartão de 400 × 354, chegava a 427 × 393) e a placa ancorada
        nele era espremida contra a borda, cortando o rodapé. Com movimento reduzido, tudo salta.
      </DocNote>

      <DocNote title="Um degrau acima dos popovers">
        A camada do tour é <code>--z-popover</code> + 1, e a placa + 2 — a exceção consciente à regra de não escalar.
        O motivo é o passo da Despesa: o menu que o clique abriu tem de ficar <strong>sob</strong> o véu, com o buraco no
        item; no mesmo degrau ele pintaria por cima do recorte e esconderia o anel. Os toasts continuam acima de tudo.
      </DocNote>

      <DocNote title="O que fica guardado">
        Com <code>storageKey</code>, o <code>localStorage</code> guarda o passo onde a pessoa parou, a conclusão e o
        pular (diálogo e tour), o dispensar (checklist e card — o card aceita <code>dismiss=&quot;session&quot;</code>)
        e o visto (hotspot). Nada vai ao banco. Quem tem chave não renderiza antes de ler, senão um card dispensado
        piscaria a cada carga.
      </DocNote>

      <DocNote title="O card abre de três jeitos">
        Na referência (o Info Card do KarrixLee) só o <code>mouseenter</code> abria, e o dispensar era uma{" "}
        <code>div</code>: no telefone ele era inalcançável. Aqui o card abre com o cursor, com o foco de teclado e com o
        toque na mídia, que alterna; o dispensar é um botão. Fechado, a mídia fica recortada a 75px, dissolvendo no
        cartão; aberta, cresce até a altura da imagem — com o espaço exato que o leque ocupa em cima e embaixo, e a máscara quadrada — e as imagens se abrem em leque a −5°, 0° e +5°, na mola 300/30 da referência. O
        cartão veste o brilho de marca na borda (<code>variant=&quot;brand&quot;</code>), que acende conforme o
        ponteiro chega; com <code>beam</code> o mesmo arco dá a volta sozinho, num laço de 4 s, e{" "}
        <code>contrast</code> é o <code>brand</code> dentro do tema oposto: o cartão vira uma ilha <code>.light</code> no
        escuro e <code>.dark</code> no claro, e tudo nele — a mídia incluída — se pinta no outro tema. Os três são a
        peça de marca da tela, uma por tela. O
        rodapé é o par da casa: dispensar em <code>tertiary</code> e saiba mais em <code>primary</code>, meio a meio.
      </DocNote>

      <DocSection
        title="Diálogo de boas-vindas"
        description="Cada passo traz a própria ilustração, que desliza de lado — com arraste, pela mão do Carousel. O texto dos quatro passos mora na mesma célula da grade e cruza: a janela tem a altura do mais alto e não pula. A pílula ativa alarga na mola. Pular é o × do canto (e o Esc); o clique fora não pula. Fica numa seção própria porque o Dialog do desktop não abre dentro de uma moldura."
        code={`<OnboardingDialog defaultOpen storageKey="boas-vindas" steps={[
  { title: "Tudo num lugar só", description: "…", media: { type: "image", src: "/boas-vindas/1.png", alt: "…" } },
  { title: "Cartões e faturas", description: "…", media: { type: "video", src: "/boas-vindas/2.mp4" } },
]} onComplete={irParaOInicio} />`}
      >
        <DemoDialogo />
      </DocSection>

      <DocSection
        title="No telefone"
        description="Uma tela do app num iPhone, com o toque do aparelho: o cursor vira um ponto de toque, nada abre por passar o cursor e todo alvo tem 40 a 44. O checklist abre as boas-vindas — que viram a gaveta, com o voltar e o próximo numa linha só — e o tour, cuja placa prende embaixo, acima da barra, ou em cima quando o alvo está na metade de baixo, como o +. O ponto pulsa no sino; o card abre no toque."
      >
        <NoTelefone />
      </DocSection>

      <DocSection
        title="Esqueleto"
        description="O checklist e o card esperando, para quando o “feito” vem do servidor. group={false} dentro de um esqueleto de página."
        code={`<OnboardingSkeleton variant="checklist" />
<OnboardingSkeleton variant="card" />`}
        previewClassName="items-start"
      >
        <div className="grid w-full gap-4 sm:grid-cols-[minmax(0,28rem)_minmax(0,16rem)]">
          <OnboardingSkeleton variant="checklist" />
          <OnboardingSkeleton variant="card" />
        </div>
      </DocSection>

      <PropsTable
        title="Props de OnboardingDialog"
        rows={[
          { prop: "steps", type: "{ title, description?, media? }[]", description: "Os passos. O título também é o nome da pílula (“Ir para …”)." },
          { prop: "open · defaultOpen · onOpenChange", type: "boolean · boolean · (open) => void", default: "— · false", description: "Controlado ou não. defaultOpen abre na primeira visita, a menos que a chave diga que já foi visto." },
          { prop: "trigger", type: "ReactNode", description: "O botão que também abre (DialogTrigger)." },
          { prop: "storageKey", type: "string", description: "Guarda o passo, a conclusão e o pular." },
          { prop: "onComplete · onSkip", type: "() => void", description: "Começar no último passo, ou o × / Esc." },
          { prop: "nextLabel · backLabel · skipLabel · finishLabel", type: "string", default: '"próximo" · "voltar" · "pular as boas-vindas" · "começar"', description: "O primário, o voltar, o nome do × do canto (que pula) e o último passo." },
        ]}
      />

      <PropsTable
        title="Props de OnboardingChecklist"
        rows={[
          { prop: "title", type: "string", description: "O título do cartão." },
          { prop: "items", type: "{ id, title, description?, action?, done? }[]", description: "Os passos. done é da tela, que lê os próprios dados; action é { label, href? , onClick? }." },
          { prop: "variant", type: '"accordion" | "list"', default: '"accordion"', description: "accordion: a linha abre com a descrição e a ação, e a próxima pendente abre sozinha. list: links diretos, riscados quando feitos." },
          { prop: "storageKey · onDismiss", type: "string · () => void", description: "O × e o dispensar da celebração escondem o cartão — a persiana enrola: as linhas sobem de baixo para cima até o cabeçalho, que sobe e se dissolve —, e a chave o mantém escondido. Ao aparecer, ela desenrola." },
          { prop: "doneTitle · doneDescription · dismissLabel", type: "string · ReactNode · string", default: '"Tudo pronto" · — · "Dispensar"', description: "A celebração, com tudo feito." },
        ]}
      />

      <PropsTable
        title="Props de OnboardingCard"
        rows={[
          { prop: "title · description", type: "string · ReactNode", description: "A novidade, em texto miúdo." },
          { prop: "media", type: "(OnboardingMediaSource | ReactNode)[]", description: "Até três imagens (o leque) ou um vídeo — ou ilustrações em JSX." },
          { prop: "action", type: "{ label, href }", description: "O saiba mais, à direita do dispensar." },
          { prop: "variant", type: '"brand" | "beam" | "contrast"', default: '"brand"', description: "brand: o brilho de marca acende na borda conforme o ponteiro chega. beam: o mesmo arco dá a volta na borda sozinho, em 4 s, para chamar a atenção (parado no topo com movimento reduzido). contrast: o brand dentro do tema oposto — no escuro, igual ao brand do claro; no claro, ao do escuro —, com a mídia junto." },
          { prop: "storageKey · dismiss", type: 'string · "forever" | "session"', default: '— · "forever"', description: "Onde o dispensar fica guardado: localStorage ou só nesta aba." },
          { prop: "onDismiss · dismissLabel", type: "() => void · string", default: '— · "Dispensar"', description: "O dispensar: o × no canto, sempre à vista, e o botão do rodapé, com o card aberto. O rótulo é também o nome do ×. Ao fechar, o cartão colapsa até a linha do título, diminui e sai pela esquerda, e o espaço fecha junto." },
        ]}
      />

      <PropsTable
        title="Props de OnboardingTour"
        rows={[
          { prop: "steps", type: "OnboardingTourStep[]", description: "Os passos (abaixo)." },
          { prop: "open · defaultOpen · onOpenChange", type: "boolean · boolean · (open) => void", default: "— · false", description: "Controlado ou não. defaultOpen começa na primeira visita." },
          { prop: "storageKey", type: "string", description: "Guarda o passo, a conclusão e o pular." },
          { prop: "onComplete · onSkip", type: "() => void", description: "Concluir no último passo, ou o × / Esc." },
          { prop: "nextLabel · backLabel · skipLabel · finishLabel · hint", type: "string", default: '"próximo" · "voltar" · "pular o tour" · "concluir"', description: "O primário, o nome da seta de voltar e o do × do canto (que pula), o último passo e a dica do passo que avança pelo clique. O rodapé tem a mesma forma em todos os passos: a seta some no primeiro sem sair do lugar." },
        ]}
      />

      <PropsTable
        title="Um passo do tour (OnboardingTourStep)"
        rows={[
          { prop: "target", type: "string | RefObject | () => HTMLElement", description: "O elemento recortado — o primeiro visível do seletor. Sem alvo, a placa fica no centro, sem recorte." },
          { prop: "title · description · media", type: "string · ReactNode · OnboardingMediaSource | ReactNode", description: "O conteúdo da placa." },
          { prop: "advanceOn · hint", type: '"next" | "target" · string', default: '"next"', description: "target: avança quando a pessoa usa o próprio elemento; a placa troca o próximo pela dica (hint, ou a do tour). Esse passo não se pula: a seta → e as pílulas não passam por cima dele — o anel pulsa no alvo —, e voltar a um passo com waitFor cujo alvo sumiu volta até ele." },
          { prop: "waitFor", type: "boolean | number", description: "Espera o alvo montar (true: até 5 s). Sem ele, um alvo ausente leva a placa ao centro." },
          { prop: "side · align · padding", type: "Lado · Alinhamento · number", default: '"bottom" · "center" · 4', description: "Onde a placa pousa no desktop, e a folga do recorte." },
        ]}
      />

      <PropsTable
        title="Props de OnboardingHotspot, OnboardingMedia e OnboardingSkeleton"
        rows={[
          { prop: "children", type: "ReactNode", description: "OnboardingHotspot: o botão real que o ponto marca. Usá-lo apaga o ponto." },
          { prop: "title · description · label", type: "string · ReactNode · string", default: '— · — · "Novidade"', description: "OnboardingHotspot: a dica, e o nome do ponto. A dica brota do ponto ao abrir (a descrição e o botão se desdobram), e o entendi faz o caminho de volta: as faixas dobram, o balão volta para dentro do ponto, e o ponto pulsa e se apaga." },
          { prop: "storageKey · side · align", type: "string · Lado · Alinhamento", description: "OnboardingHotspot: o visto guardado, e onde a dica pousa." },
          { prop: "media", type: "OnboardingMediaSource | ReactNode", description: 'OnboardingMedia: { type: "image", src, alt }, { type: "video", src, poster? } ou JSX. O vídeo é mudo, em laço, e parado com movimento reduzido.' },
          { prop: "variant · group", type: '"checklist" | "card" · boolean', default: '"checklist" · true', description: "OnboardingSkeleton: a forma, e o SkeletonGroup em volta." },
        ]}
      />
    </>
  )
}
