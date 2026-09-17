"use client"

import Link from "next/link"
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
import { TopBar, TopBarStart, TopBarTitle } from "@/components/ui/top-bar"
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
      <TopBar>
        <TopBarStart>{children}</TopBarStart>
        <TopBarTitle>Início</TopBarTitle>
      </TopBar>
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
      <SidebarTrigger className="-ml-2" />
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
      size="icon-md"
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
        A navegação lateral do desktop. O estado recolhido vem de um cookie lido no servidor (<code>defaultSidebarOpenFromCookie</code>), então não pisca no primeiro quadro. Abaixo de <code>md</code> ela vira um painel lateral — a única folha do app que não vira gaveta. Navegação de site público com painéis é <code>NavigationMenu</code>.
      </Usage>

      <DocSection
        title="Na tela"
        description="Cada espécime roda numa moldura de viewport: a barra é fixed, bifurca pela largura e abre o painel por portal, e um palco comum mentiria nos três."
        code={`<SidebarProvider defaultOpen={defaultSidebarOpen}>
  <Sidebar collapsible="icon">
    <SidebarHeader>…</SidebarHeader>
    <SidebarContent>…</SidebarContent>
    <SidebarFooter>…</SidebarFooter>
    <SidebarRail />
  </Sidebar>
  <SidebarInset>
    <TopBar>
      <TopBarStart><SidebarTrigger /></TopBarStart>
      <TopBarTitle>Início</TopBarTitle>
    </TopBar>
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

      <DocNote title="Três formas de recolher">
        O gatilho do cabeçalho, a borda entre a barra e o conteúdo, e <Kbd keys="mod+b" />. O atalho escuta o documento que contém a barra, não <code>window</code> — por isso funciona dentro da moldura.
      </DocNote>

      <DocSection
        title="Os três eixos"
        description="collapsible decide para onde ela vai ao recolher, variant a superfície e side a borda. Combine os três: é o que uma tabela de variantes não mostra."
        code={`<Sidebar collapsible="icon" variant="floating" side="left">`}
        previewClassName="items-stretch p-4"
      >
        <DemoEixos />
      </DocSection>

      <DocNote title="side inverte a ordem visual, nunca a do DOM">
        A raiz leva <code>data-[side=right]:order-last</code>. O DOM fica igual porque é a ordem dele que mantém válidos os <code>peer-*</code> do <code>SidebarInset</code>; as margens de <code>inset</code> espelham pelo mesmo eixo.
      </DocNote>

      <DocNote title="floating é vidro pintado, sem borrão">
        A placa reserva a própria calha, então nada passa por trás dela e um <code>backdrop-filter</code> não desenharia nada. O que a aproxima do iOS é uma curva só (<code>--ease-emphasized</code>) no recolher, a pílula que viaja e o reflexo em repouso — no cursor, ele acenderia a coluna inteira.
      </DocNote>

      <DocNote title="A pílula lê coordenada de conteúdo, somando a cadeia de offsetParent">
        Como o marcador do <Link href="/designsystem/tabs">Tabs</Link>, ela mede por observadores e nunca por <code>getBoundingClientRect</code>, porque o <code>SidebarContent</code> rola. O <code>&lt;li&gt;</code> é <code>relative</code> e vira o <code>offsetParent</code> do botão — lido direto, <code>offsetLeft</code> seria zero e só o primeiro item acertaria.
      </DocNote>

      <DocNote title="inset precisa de um SidebarInset">
        <code>inset</code> e <code>floating</code> têm a mesma geometria; muda quem desenha o cartão — a barra em <code>floating</code>, o <code>SidebarInset</code> em <code>inset</code>. Sem ele na árvore, <code>inset</code> não tem efeito visível.
      </DocNote>

      <DocSection
        title="Redimensionável"
        description="Arraste a costura. A largura é guardada em pixel, porque ícone, rótulo e badge têm medida fixa; passar do mínimo colapsa para o modo ícone."
        code={`<SidebarProvider resizable>
  <Sidebar collapsible="icon">…</Sidebar>
  <SidebarInset>…</SidebarInset>
</SidebarProvider>`}
        previewClassName="items-stretch p-4"
      >
        <DemoRedimensionavel />
      </DocSection>

      <DocNote title="Quem redimensiona é o Resizable, e é opt-in">
        Com <code>resizable</code> a barra vira o primeiro painel de um <code>ResizablePanelGroup</code> e herda o teclado na costura, o duplo-clique e o colapso por arraste; o modo ícone é <code>collapsedSize</code> de 48px. O grupo declara layout inline, então o padrão do app continua sendo o trilho <code>fixed</code>.
      </DocNote>

      <DocSection
        title="No telefone"
        description="Abaixo de 768px ela vira um painel lateral com véu e foco preso — a única folha com surface=&quot;panel&quot;, porque menu entra pelo lado, não sobe do rodapé."
        code={`// Nada muda na chamada. A superfície se escolhe dentro do componente.
<Sidebar collapsible="offcanvas">…</Sidebar>`}
        previewClassName="justify-center p-4"
      >
        <DemoTelefone />
      </DocSection>

      <DocNote title="Na moldura o painel não é modal">
        O portal e o <code>useIsMobile</code> leem a janela da moldura, então o painel abre dentro do telefone. Aqui ele não é modal — o <code>RemoveScroll</code> do Radix travaria esta página — e por isso não há véu; no app, há.
      </DocNote>

      <DocSection
        title="Os tipos de item"
        description="Conteúdo não depende da largura: aqui a barra roda em `none`, a coluna simples, sem moldura."
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
        description="size mede a linha (28 · 32 · 48) e variant decide o contorno. lg é para identidade — workspace no topo, conta no rodapé — e é o único degrau inteiro no modo ícone."
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
        Com <code>collapsible=&quot;icon&quot;</code>, passe <code>tooltip</code> ao <code>SidebarMenuButton</code>: sem ele a barra recolhida é uma coluna de símbolos sem nome. Ele só aparece recolhida e fora do toque — no telefone o rótulo está por extenso.
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
              "A superfície. floating solta a barra; inset solta o conteúdo e exige um SidebarInset.",
          },
          {
            prop: "collapsible",
            type: '"offcanvas" | "icon" | "none"',
            default: '"offcanvas"',
            description:
              "Para onde ela vai ao recolher. none é a coluna simples, sem estado.",
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
              "Estado inicial; venha do cookie no servidor para não piscar.",
          },
          {
            prop: "open / onOpenChange",
            type: "boolean / (open) => void",
            description:
              "Modo controlado; o cookie não é gravado.",
          },
          {
            prop: "resizable",
            type: "boolean",
            default: "false",
            description:
              "Largura arrastável, em pixel, sobre um ResizablePanelGroup.",
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
              "As três faixas; só o conteúdo rola.",
          },
          {
            prop: "SidebarGroup / …Label / …Action / …Content",
            type: "ComponentProps<'div'>",
            description:
              "Um bloco de itens com rótulo e ação opcional à direita.",
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
              "A linha clicável; com asChild, o <Link> da rota.",
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
              "A linha carregando, com largura variada.",
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
              "Os alternadores do cabeçalho e da borda; o trilho some em modo resizable.",
          },
          {
            prop: "SidebarInset",
            type: "ComponentProps<'main'>",
            description:
              "O conteúdo ao lado; em modo resizable, o segundo painel.",
          },
          {
            prop: "useSidebar()",
            type: "{ state, open, setOpen, isMobile, toggleSidebar, resizable }",
            description:
              "O estado, para quem precisa reagir a ele.",
          },
        ]}
      />
    </>
  )
}
