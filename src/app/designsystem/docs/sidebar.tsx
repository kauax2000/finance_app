"use client"

import * as React from "react"
import {
  Cog6ToothIcon,
  CreditCardIcon,
  EllipsisHorizontalIcon,
  HomeIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  ReceiptPercentIcon,
  TagIcon,
  UserGroupIcon,
  WalletIcon,
} from "@heroicons/react/16/solid"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Field, FieldControl, FieldLabel } from "@/components/ui/field"
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select"
import {
  ResizableCollapseTrigger,
  useResizablePanel,
} from "@/components/ui/resizable"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import { Kbd } from "@/components/ui/kbd"
import { Muted, Small } from "@/components/ui/typography"
import { IDENTITY_TONES } from "@/lib/avatar"
import { cn } from "@/lib/utils"
import { PhoneFrame, ViewportFrame } from "../ds-frame"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

/** A altura da moldura: alta o bastante para a barra ler como coluna de tela. */
const ALTURA = 440

/**
 * A moldura das demonstrações.
 *
 * Largura fluida: o palco do catálogo mede **810px**, que está acima do `md`
 * (768), então é o ramo de desktop que renderiza — e os 16rem da barra ocupam
 * 31,6% dele, que é a proporção que uma navegação de verdade tem numa janela
 * estreita de laptop.
 */
function Tela({
  title,
  height = ALTURA,
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

/**
 * Os dois tons de identidade, escolhidos por índice e não pelo hash.
 *
 * No app quem escolhe é `identityToneFor(cor, semente)`, e é isso que dá à
 * mesma pessoa sempre a mesma cor. Aqui a primeira versão fez isso — e as duas
 * sementes **caíram no mesmo tom**, medido: `oklch(0.78 0.09 320)` nos dois.
 * O hash distribui, não garante distinção entre duas strings quaisquer, e numa
 * demonstração o assunto é justamente que duas identidades leem como
 * diferentes.
 *
 * **`ColorTile` seria a peça errada.** Ele carrega a cor que a pessoa escolheu
 * e que veio do banco; esta vem do tema, e a régua diz que nesse caso o
 * componente é outro. A ficha `--identity-*` existe para distinguir pessoas e
 * espaços sem cor gravada, que é exatamente este caso.
 */
const TOM_WORKSPACE = IDENTITY_TONES[2]
const TOM_CONTA = IDENTITY_TONES[0]

const SECOES = [
  { rotulo: "Início", icone: HomeIcon, ativo: true },
  { rotulo: "Transações", icone: ReceiptPercentIcon, contagem: "42" },
  { rotulo: "Carteiras", icone: WalletIcon },
  { rotulo: "Cartões", icone: CreditCardIcon, contagem: "3" },
] as const

/** O conteúdo de navegação, para as molduras não repetirem a lista. */
function NavDemo() {
  return (
    <>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" tooltip="Pessoal">
              <Avatar size="xs" shape="rounded">
                <AvatarFallback
                  className={cn(TOM_WORKSPACE.surface, TOM_WORKSPACE.ink)}
                >
                  P
                </AvatarFallback>
              </Avatar>
              <span className="truncate font-medium">Pessoal</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Finanças</SidebarGroupLabel>
          <SidebarGroupAction aria-label="Nova transação">
            <PlusIcon />
          </SidebarGroupAction>
          <SidebarGroupContent>
            <SidebarMenu>
              {SECOES.map((s) => (
                <SidebarMenuItem key={s.rotulo}>
                  <SidebarMenuButton
                    isActive={"ativo" in s && s.ativo}
                    tooltip={s.rotulo}
                  >
                    <s.icone />
                    <span>{s.rotulo}</span>
                  </SidebarMenuButton>
                  {"contagem" in s && s.contagem ? (
                    <SidebarMenuBadge>{s.contagem}</SidebarMenuBadge>
                  ) : null}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Conta</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Membros">
                  <UserGroupIcon />
                  <span>Membros</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Configurações">
                  <Cog6ToothIcon />
                  <span>Configurações</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" tooltip="Ana Ribeiro">
              <Avatar size="xs">
                <AvatarFallback className={cn(TOM_CONTA.surface, TOM_CONTA.ink)}>
                  A
                </AvatarFallback>
              </Avatar>
              <div className="grid min-w-0 flex-1 text-left leading-tight">
                <span className="truncate text-sm font-medium">
                  Ana Ribeiro
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  ana@exemplo.com
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </>
  )
}

/** O conteúdo ao lado da barra: sem ele a moldura não lê como tela. */
function Conteudo({ children }: { children?: React.ReactNode }) {
  return (
    <>
      {/* O fio vem da variante, pela variável que o `SidebarInset` publica —
          troque `variant` para `floating` acima e ele some. */}
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-b-[length:var(--sidebar-inset-rule,1px)] border-border px-4">
        {children}
        <span className="font-heading text-sm font-medium">Início</span>
      </header>
      <div className="min-h-0 flex-1 space-y-3 p-4">
        <div className="h-20 rounded-lg border border-border bg-card" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-24 rounded-lg border border-border bg-card" />
          <div className="h-24 rounded-lg border border-border bg-card" />
        </div>
      </div>
    </>
  )
}

/** O gatilho no cabeçalho — ele mora no conteúdo, e não na barra. */
function CabecalhoComGatilho() {
  return (
    <Conteudo>
      <SidebarTrigger className="-ml-1" />
    </Conteudo>
  )
}

// ── Demonstrações com estado ────────────────────────────────────────────────

function DemoEixos() {
  const [collapsible, setCollapsible] =
    React.useState<"offcanvas" | "icon" | "none">("icon")
  const [variant, setVariant] =
    React.useState<"sidebar" | "floating" | "inset">("sidebar")
  const [side, setSide] = React.useState<"left" | "right">("left")

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Field>
          <FieldLabel htmlFor="eixo-collapsible">collapsible</FieldLabel>
          <FieldControl>
            <NativeSelect
              id="eixo-collapsible"
              value={collapsible}
              onChange={(e) =>
                setCollapsible(e.target.value as typeof collapsible)
              }
            >
              <NativeSelectOption value="offcanvas">
                offcanvas
              </NativeSelectOption>
              <NativeSelectOption value="icon">icon</NativeSelectOption>
              <NativeSelectOption value="none">none</NativeSelectOption>
            </NativeSelect>
          </FieldControl>
        </Field>
        <Field>
          <FieldLabel htmlFor="eixo-variant">variant</FieldLabel>
          <FieldControl>
            <NativeSelect
              id="eixo-variant"
              value={variant}
              onChange={(e) => setVariant(e.target.value as typeof variant)}
            >
              <NativeSelectOption value="sidebar">sidebar</NativeSelectOption>
              <NativeSelectOption value="floating">floating</NativeSelectOption>
              <NativeSelectOption value="inset">inset</NativeSelectOption>
            </NativeSelect>
          </FieldControl>
        </Field>
        <Field>
          <FieldLabel htmlFor="eixo-side">side</FieldLabel>
          <FieldControl>
            <NativeSelect
              id="eixo-side"
              value={side}
              onChange={(e) => setSide(e.target.value as typeof side)}
            >
              <NativeSelectOption value="left">left</NativeSelectOption>
              <NativeSelectOption value="right">right</NativeSelectOption>
            </NativeSelect>
          </FieldControl>
        </Field>
      </div>

      <Tela title="Prévia dos eixos da barra lateral numa tela">
        <SidebarProvider>
          <Sidebar collapsible={collapsible} variant={variant} side={side}>
            <NavDemo />
            <SidebarRail />
          </Sidebar>
          <SidebarInset>
            <CabecalhoComGatilho />
          </SidebarInset>
        </SidebarProvider>
      </Tela>
    </div>
  )
}

/** O gatilho de colapso do átomo, ligado ao painel que o `Provider` governa. */
function GatilhoDeColapso() {
  const { state, toggleSidebar } = useSidebar()
  const colapsado = state === "collapsed"

  return (
    <ResizableCollapseTrigger
      collapsed={colapsado}
      side="start"
      onClick={toggleSidebar}
      aria-label={colapsado ? "Mostrar a navegação" : "Recolher a navegação"}
    />
  )
}

function DemoRedimensionavel() {
  return (
    <Tela title="Prévia da barra lateral redimensionável numa tela">
      <SidebarProvider resizable>
        <Sidebar collapsible="icon">
          <NavDemo />
        </Sidebar>
        <SidebarInset>
          <Conteudo>
            <GatilhoDeColapso />
          </Conteudo>
        </SidebarInset>
      </SidebarProvider>
    </Tela>
  )
}

function DemoTelefone() {
  return (
    <PhoneFrame title="Prévia da navegação num telefone">
      <SidebarProvider>
        <Sidebar collapsible="offcanvas">
          <NavDemo />
        </Sidebar>
        <SidebarInset>
          <CabecalhoComGatilho />
        </SidebarInset>
      </SidebarProvider>
    </PhoneFrame>
  )
}

// ── A página ────────────────────────────────────────────────────────────────

export default function SidebarDoc() {
  return (
    <>
      <Usage>
        A navegação lateral do desktop. Ela guarda o estado recolhido num
        cookie, então a escolha sobrevive ao recarregamento e não pisca no
        primeiro quadro — isso vem do servidor, por{" "}
        <code>defaultSidebarOpenFromCookie</code>, e não do componente. Abaixo
        de <code>md</code> ela vira um painel de borda: navegação entra pelo
        lado em qualquer largura, e não de baixo como uma folha.
      </Usage>

      <DocSection
        title="Na tela"
        description="Cada espécime desta página roda dentro de uma moldura de viewport — um iframe com largura própria. É a única forma honesta de demonstrar esta peça: a barra é `position: fixed`, ela bifurca em JS pela largura, e o painel do telefone sai por um portal. Num palco comum, os três mentiriam."
        code={`<SidebarProvider defaultOpen={defaultSidebarOpen}>
  <Sidebar collapsible="icon">
    <SidebarHeader>…</SidebarHeader>
    <SidebarContent>…</SidebarContent>
    <SidebarFooter>…</SidebarFooter>
    <SidebarRail />
  </Sidebar>
  <SidebarInset>
    <header><SidebarTrigger /></header>
    {children}
  </SidebarInset>
</SidebarProvider>`}
        previewClassName="items-stretch p-4"
      >
        <Tela title="Prévia da barra lateral numa tela de desktop">
          <SidebarProvider>
            <Sidebar collapsible="icon">
              <NavDemo />
              <SidebarRail />
            </Sidebar>
            <SidebarInset>
              <CabecalhoComGatilho />
            </SidebarInset>
          </SidebarProvider>
        </Tela>
      </DocSection>

      <DocNote title="Três formas de recolher, e todas valem aqui">
        O gatilho no cabeçalho, a borda entre a barra e o conteúdo, e{" "}
        <Kbd keys="mod+b" />. O atalho é do documento que contém a barra — não
        de <code>window</code> —, e é por isso que ele funciona dentro da
        moldura acima: clique lá dentro e experimente.
      </DocNote>

      <DocSection
        title="Os três eixos"
        description="`collapsible` decide para onde ela vai ao recolher, `variant` decide a superfície, e `side` decide a borda. Troque os três e veja a mesma barra mudar — combinar é o que uma tabela de variantes não mostra."
        code={`<Sidebar collapsible="icon" variant="floating" side="left">`}
        previewClassName="items-stretch p-4"
      >
        <DemoEixos />
      </DocSection>

      <DocNote title="`inset` não desenha nada sozinho">
        Ela e <code>floating</code> têm a <strong>mesma</strong> geometria — o
        recuo e a largura do modo ícone são idênticos. O que muda é{" "}
        <strong>quem desenha o cartão</strong>: em <code>floating</code> é o
        miolo da própria barra; em <code>inset</code> é o{" "}
        <code>SidebarInset</code>, que se solta com margem e canto. Sem um{" "}
        <code>SidebarInset</code> na árvore, <code>inset</code> não tem efeito
        visível nenhum. As duas usam o mesmo raio, porque canto é do componente
        e não da variante.
      </DocNote>

      <DocSection
        title="Redimensionável"
        description="Arraste a costura. A largura é guardada em pixel e não em porcentagem — um trilho de navegação não pode encolher junto com a janela, porque ícone, rótulo e badge têm medida fixa. O botão no cabeçalho colapsa para o modo ícone; a costura também colapsa, ao cruzar o mínimo."
        code={`<SidebarProvider resizable>
  <Sidebar collapsible="icon">…</Sidebar>
  <SidebarInset>…</SidebarInset>
</SidebarProvider>`}
        previewClassName="items-stretch p-4"
      >
        <DemoRedimensionavel />
      </DocSection>

      <DocNote title="Quem redimensiona é o átomo, e não esta peça">
        <code>resizable</code> troca o layout por um{" "}
        <code>ResizablePanelGroup</code>: a barra vira o primeiro painel, a
        costura vira o <code>ResizableHandle</code> e o conteúdo vira o segundo.
        Com isso vêm de graça o foco de teclado na costura, as setas,{" "}
        <kbd>Home</kbd>/<kbd>End</kbd>, o duplo-clique voltando ao padrão e o
        colapso por arraste — tudo já medido no{" "}
        <code>Resizable</code>. Os três <code>collapsible</code> viram
        configuração dele: o modo ícone é literalmente{" "}
        <code>collapsedSize</code> de 48px, e o offcanvas é zero.
      </DocNote>

      <DocNote title="É opt-in, e a casca do produto não liga">
        Uma navegação de seis links não se redimensiona, e o{" "}
        <code>PanelGroup</code> declara <code>display</code>,{" "}
        <code>flex-direction</code>, <code>overflow</code> e as medidas por
        estilo <strong>inline</strong> — as quatro não se sobrescrevem. O padrão
        continua sendo o trilho <code>fixed</code> com a folga que reserva o
        lugar dele no fluxo.
      </DocNote>

      <DocSection
        title="No telefone"
        description="Abaixo de 768px ela deixa de ser trilho e vira um painel de borda, com véu e foco preso. Não é uma folha de baixo: navegação entra pelo lado em qualquer largura — uma gaveta com alça de arraste para listar seis links seria a promessa errada."
        code={`// Nada muda na chamada. A superfície se escolhe dentro do componente.
<Sidebar collapsible="offcanvas">…</Sidebar>`}
        previewClassName="justify-center p-4"
      >
        <DemoTelefone />
      </DocSection>

      <DocNote title="O painel abre dentro da moldura, e isso custou duas correções">
        Um portal do Radix vai para o <code>document.body</code>, e o React da
        moldura roda na janela de fora — sem conserto, o painel escaparia do
        telefone e cobriria esta página. E <code>useIsMobile</code> lia{" "}
        <code>window.matchMedia</code> de fora, então a barra tomaria o ramo de
        desktop enquanto o CSS a escondia com <code>md:</code>: não renderizaria
        nada. As duas eram limitações declaradas da moldura desde que ela
        nasceu, e fecharam aqui.
      </DocNote>

      <DocSection
        title="Os tipos de item"
        description="Estes não dependem da largura, então aqui a barra roda no modo `none` — o único em que ela é só uma coluna. Demonstrar conteúdo não precisa de moldura; demonstrar comportamento precisa."
        code={`<SidebarMenuItem>
  <SidebarMenuButton>…</SidebarMenuButton>
  <SidebarMenuBadge>42</SidebarMenuBadge>
  <SidebarMenuAction showOnHover>…</SidebarMenuAction>
</SidebarMenuItem>`}
        previewClassName="items-stretch p-0"
      >
        <div className="w-full overflow-hidden rounded-lg border border-border">
          <SidebarProvider className="min-h-0">
            <Sidebar collapsible="none" className="w-full">
              <SidebarContent>
                <SidebarGroup>
                  <SidebarGroupLabel>Busca</SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarInput
                      placeholder="Buscar…"
                      aria-label="Buscar na navegação"
                    />
                  </SidebarGroupContent>
                </SidebarGroup>

                <SidebarSeparator />

                <SidebarGroup>
                  <SidebarGroupLabel>Itens</SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      <SidebarMenuItem>
                        <SidebarMenuButton isActive>
                          <HomeIcon />
                          <span>Ativo</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>

                      <SidebarMenuItem>
                        <SidebarMenuButton>
                          <ReceiptPercentIcon />
                          <span>Com contagem</span>
                        </SidebarMenuButton>
                        <SidebarMenuBadge>42</SidebarMenuBadge>
                      </SidebarMenuItem>

                      <SidebarMenuItem>
                        <SidebarMenuButton>
                          <TagIcon />
                          <span>Com ação no cursor</span>
                        </SidebarMenuButton>
                        <SidebarMenuAction
                          showOnHover
                          aria-label="Mais opções de categorias"
                        >
                          <EllipsisHorizontalIcon />
                        </SidebarMenuAction>
                      </SidebarMenuItem>

                      <Collapsible defaultOpen className="group/colapso">
                        <SidebarMenuItem>
                          {/* `asChild`: o gatilho **é** a linha do menu, e não
                              um botão em volta dela. */}
                          <CollapsibleTrigger asChild>
                            <SidebarMenuButton>
                              <WalletIcon />
                              <span>Com submenu</span>
                            </SidebarMenuButton>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <SidebarMenuSub>
                              <SidebarMenuSubItem>
                                <SidebarMenuSubButton isActive>
                                  Corrente
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                              <SidebarMenuSubItem>
                                <SidebarMenuSubButton>
                                  Poupança
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                              <SidebarMenuSubItem>
                                <SidebarMenuSubButton size="sm">
                                  Reserva (size sm)
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            </SidebarMenuSub>
                          </CollapsibleContent>
                        </SidebarMenuItem>
                      </Collapsible>

                      <SidebarMenuItem>
                        <SidebarMenuSkeleton showIcon />
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <SidebarMenuSkeleton showIcon />
                      </SidebarMenuItem>
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              </SidebarContent>
            </Sidebar>
          </SidebarProvider>
        </div>
      </DocSection>

      <DocSection
        title="A escada do botão"
        description="`size` mede a linha (28 · 32 · 48) e `variant` decide se ela tem contorno. `lg` é para identidade — o seletor de workspace no topo e a conta no rodapé —, e é o único degrau que sobrevive inteiro no modo ícone."
        code={`<SidebarMenuButton size="lg" variant="outline">`}
        previewClassName="items-stretch p-0"
      >
        <div className="w-full overflow-hidden rounded-lg border border-border">
          <SidebarProvider className="min-h-0">
            <Sidebar collapsible="none" className="w-full">
              <SidebarContent>
                {(["plain", "outline"] as const).map((variant) => (
                  <SidebarGroup key={variant}>
                    <SidebarGroupLabel>{variant}</SidebarGroupLabel>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        {(["sm", "md", "lg"] as const).map((size) => (
                          <SidebarMenuItem key={size}>
                            <SidebarMenuButton variant={variant} size={size}>
                              <MagnifyingGlassIcon />
                              <span>size {size}</span>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        ))}
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </SidebarGroup>
                ))}
              </SidebarContent>
            </Sidebar>
          </SidebarProvider>
        </div>
      </DocSection>

      <DocNote title="Recolhida, o rótulo vira tooltip">
        Com <code>collapsible=&quot;icon&quot;</code> sobra o ícone, e o{" "}
        <code>SidebarMenuButton</code> aceita <code>tooltip</code> para o nome
        continuar acessível — sem ele, a barra recolhida vira uma coluna de
        símbolos sem quem saiba o que são. O tooltip só aparece quando ela está
        recolhida e o apontador não é o dedo: no telefone ela é um painel, e o
        rótulo está lá por extenso.
      </DocNote>

      <DocNote title="A casca do app já está montada">
        <code>app-sidebar.tsx</code> é a navegação do produto,{" "}
        <code>sidebar-app-shell.tsx</code> a casca, e{" "}
        <code>sidebar-user-profile.tsx</code> o rodapé de conta. Uma tela nova
        não monta nada disso: ela entra como <code>children</code> do{" "}
        <code>SidebarInset</code>.
      </DocNote>

      <PropsTable
        title="Sidebar"
        rows={[
          {
            prop: "side",
            type: '"left" | "right"',
            default: '"left"',
            description: "A borda em que ela encosta.",
          },
          {
            prop: "variant",
            type: '"sidebar" | "floating" | "inset"',
            default: '"sidebar"',
            description:
              "A superfície. floating solta a própria barra; inset solta o conteúdo, e sem um SidebarInset não faz nada.",
          },
          {
            prop: "collapsible",
            type: '"offcanvas" | "icon" | "none"',
            default: '"offcanvas"',
            description:
              "Para onde ela vai ao recolher. none é a coluna simples, sem estado nem trilho — é o modo de demonstrar conteúdo.",
          },
        ]}
      />

      <PropsTable
        title="SidebarProvider"
        rows={[
          {
            prop: "defaultOpen",
            type: "boolean",
            default: "true",
            description:
              "O estado inicial. Venha do cookie no servidor, senão a barra pisca no primeiro quadro.",
          },
          {
            prop: "open / onOpenChange",
            type: "boolean / (open) => void",
            description:
              "Modo controlado. Com onOpenChange o cookie não é gravado — a preferência é de quem controla.",
          },
          {
            prop: "resizable",
            type: "boolean",
            default: "false",
            description:
              "Troca o layout por um ResizablePanelGroup: a largura passa a ser arrastável, em pixel, e o colapso passa a ser o do painel.",
          },
        ]}
      />

      <PropsTable
        title="As peças"
        rows={[
          {
            prop: "SidebarHeader / SidebarContent / SidebarFooter",
            type: "ComponentProps<'div'>",
            description:
              "As três faixas. O conteúdo rola e dissolve nas bordas; as outras duas ficam paradas.",
          },
          {
            prop: "SidebarGroup / …Label / …Action / …Content",
            type: "ComponentProps<'div'>",
            description:
              "Um bloco de itens com rótulo. A ação é o botão que aparece à direita do rótulo.",
          },
          {
            prop: "SidebarMenu / SidebarMenuItem",
            type: "ComponentProps<'ul' | 'li'>",
            description: "A lista e a linha. O item é quem posiciona badge e ação.",
          },
          {
            prop: "SidebarMenuButton",
            type: "{ asChild?, isActive?, tooltip?, variant, size }",
            description:
              "A linha clicável. Com asChild ela vira o <Link> da rota, que é a forma do app.",
          },
          {
            prop: "SidebarMenuBadge / SidebarMenuAction",
            type: "ComponentProps<'div' | 'button'>",
            description:
              "Contagem e ação, ancoradas à direita da linha. Somem no modo ícone.",
          },
          {
            prop: "SidebarMenuSub / …Item / …SubButton",
            type: "{ size?: 'sm' | 'md', isActive? }",
            description:
              "O segundo nível, recuado com um fio à esquerda. Some no modo ícone.",
          },
          {
            prop: "SidebarMenuSkeleton",
            type: "{ showIcon?: boolean }",
            description:
              "A linha carregando, com largura sorteada para a lista não parecer um gabarito.",
          },
          {
            prop: "SidebarInput / SidebarSeparator",
            type: "Input / Separator",
            description:
              "A busca e o fio, já na paleta da barra.",
          },
          {
            prop: "SidebarTrigger / SidebarRail",
            type: "Button / ComponentProps<'button'>",
            description:
              "Os dois alternadores: o do cabeçalho e a borda. O trilho não renderiza em modo resizable — a costura ocupa o lugar dele.",
          },
          {
            prop: "SidebarInset",
            type: "ComponentProps<'main'>",
            description:
              "O conteúdo ao lado. Em modo resizable ele é o segundo painel do grupo.",
          },
          {
            prop: "useSidebar()",
            type: "{ state, open, setOpen, isMobile, toggleSidebar, resizable }",
            description:
              "O estado, para quem precisa reagir a ele — a barra de ações do app troca botão largo por ícone assim.",
          },
        ]}
      />
    </>
  )
}
