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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
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
} from "@/components/ui/sidebar"
import { Kbd } from "@/components/ui/kbd"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { TopBar, TopBarStart, TopBarTitle } from "@/components/ui/top-bar"
import { IDENTITY_TONES } from "@/lib/avatar"
import { cn } from "@/lib/utils"
import { IphoneFrame, ViewportFrame } from "../ds-frame"
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
  { rotulo: "Início", icone: HomeIcon },
  { rotulo: "Transações", icone: ReceiptPercentIcon, contagem: "42" },
  { rotulo: "Carteiras", icone: WalletIcon },
  { rotulo: "Cartões", icone: CreditCardIcon, contagem: "3" },
] as const

/**
 * O conteúdo de navegação, para as molduras não repetirem a lista. Os itens
 * trocam o ativo no clique — é assim que se vê a pílula viajar.
 */
function NavDemo() {
  const [ativo, setAtivo] = React.useState("Início")
  return (
    <>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" tooltip="Pessoal">
              <Avatar size="xs">
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
                    isActive={ativo === s.rotulo}
                    onClick={() => setAtivo(s.rotulo)}
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
                <SidebarMenuButton
                  isActive={ativo === "Membros"}
                  onClick={() => setAtivo("Membros")}
                  tooltip="Membros"
                >
                  <UserGroupIcon />
                  <span>Membros</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={ativo === "Configurações"}
                  onClick={() => setAtivo("Configurações")}
                  tooltip="Configurações"
                >
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
          troque `variant` para `sidebar` acima e ele aparece. */}
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

const RECOLHER = ["icon", "offcanvas", "none"] as const
const VARIANTES = ["floating", "sidebar", "inset"] as const

/** Um eixo, em pílulas segmentadas. */
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
  )
}

function DemoEixos() {
  const [collapsible, setCollapsible] =
    React.useState<(typeof RECOLHER)[number]>("icon")
  const [variant, setVariant] =
    React.useState<(typeof VARIANTES)[number]>("floating")
  const [peek, setPeek] = React.useState<"peek" | "sem">("sem")

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex flex-wrap gap-3">
        <Eixo rotulo="Variante" valores={VARIANTES} valor={variant} onChange={setVariant} />
        <Eixo rotulo="Recolher" valores={RECOLHER} valor={collapsible} onChange={setCollapsible} />
        <Eixo rotulo="Espiar" valores={["sem", "peek"] as const} valor={peek} onChange={setPeek} />
      </div>

      <Tela title="Prévia dos eixos da barra lateral numa tela">
        <SidebarProvider>
          <Sidebar
            collapsible={collapsible}
            variant={variant}
            peek={peek === "peek"}
          >
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

/**
 * As mesmas versões, no modo redimensionável. `none` fica de fora — não há o
 * que redimensionar — e o `peek` também: ele abre a barra por cima, e aqui a
 * barra é um painel do grupo, sem trilho por cima de nada.
 */
function DemoRedimensionavel() {
  const [collapsible, setCollapsible] = React.useState<"icon" | "offcanvas">("icon")
  const [variant, setVariant] =
    React.useState<(typeof VARIANTES)[number]>("floating")

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex flex-wrap gap-3">
        <Eixo rotulo="Variante" valores={VARIANTES} valor={variant} onChange={setVariant} />
        <Eixo
          rotulo="Recolher"
          valores={["icon", "offcanvas"] as const}
          valor={collapsible}
          onChange={setCollapsible}
        />
      </div>
      <Tela title="Prévia da barra lateral redimensionável numa tela">
        <SidebarProvider resizable>
          <Sidebar collapsible={collapsible} variant={variant}>
            <NavDemo />
          </Sidebar>
          <SidebarInset>
            <CabecalhoComGatilho />
          </SidebarInset>
        </SidebarProvider>
      </Tela>
    </div>
  )
}

function DemoTelefone() {
  return (
    <IphoneFrame title="Prévia da navegação num iPhone">
      <SidebarProvider>
        <Sidebar collapsible="offcanvas">
          <NavDemo />
        </Sidebar>
        <SidebarInset>
          <CabecalhoComGatilho />
        </SidebarInset>
      </SidebarProvider>
    </IphoneFrame>
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
        description="Cada espécime roda numa moldura de viewport: a barra é fixed, bifurca pela largura e abre o painel por portal. Troque os eixos, recolha (⌘B, o gatilho ou a borda) e clique nos itens."
        code={`<SidebarProvider defaultOpen={defaultSidebarOpen}>
  <Sidebar collapsible="icon" peek>
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
        <DemoEixos />
      </DocSection>

      <DocNote title="floating é o padrão, numa placa chapada">
        Como a pílula do <code>Menubar</code> e as peças do <code>CommandDialog</code>, a barra é uma placa solta: o <code>--sidebar</code> chapado, o anel de 1px e a sombra, com 8px de calha. Ela não tem vidro: reserva a própria calha, e não há nada atrás para borrar. <code>sidebar</code> encosta na borda com um fio; <code>inset</code> pinta a barra no fundo e solta o conteúdo como placa — sem um <code>SidebarInset</code> na árvore, ele não tem efeito visível.
      </DocNote>

      <DocNote title="Ao lado do floating, o cabeçalho não pinta e o gatilho flutua">
        O <code>SidebarInset</code> tira o fundo do <code>TopBar</code> em repouso — o <code>glass</code>, e o <code>scroll</code> depois de rolar, mantêm o vidro, porque aí há conteúdo por baixo —, e o <code>SidebarTrigger</code> vira uma pílula da mesma placa: o <code>--sidebar</code>, o anel e a sombra. Os dois decidem pelo seletor de irmão da raiz da barra, sem prop.
      </DocNote>

      <DocNote title="Recolhida em ícone, o gatilho entra na barra">
        No <code>floating</code> com <code>collapsible=&quot;icon&quot;</code>, recolher leva o <code>SidebarTrigger</code> do topo da tela para dentro da barra, sob o cabeçalho. É o mesmo botão: os dois lugares têm o mesmo <code>layoutId</code>, e o <code>motion</code> o leva de um ponto ao outro na mola. A vaga dele no topo encolhe, o título desliza no mesmo passo, e o cabeçalho da barra cresce animando até caber o botão. Ele mora no <code>SidebarHeader</code>: sem cabeçalho, o gatilho fica no topo.
      </DocNote>

      <DocNote title="Recolher: a placa na mola, a página na curva">
        No <code>floating</code> e no <code>inset</code>, o trilho da placa anda na mola da casa. Ele é <code>fixed</code> e não reflui nada, então o quique fica na placa. A folga que empurra a página, a margem do <code>inset</code> e a barra rente ficam em <code>--ease-emphasized</code>, porque um quique ali sacudiria o conteúdo. Os rótulos saem em 100ms antes de a largura fechar, em vez de serem cortados; ao abrir, eles esperam a largura e sobem 3px.
      </DocNote>

      <DocNote title="O ativo é um objeto só, e viaja">
        A pílula do item ativo é o <code>layoutId</code> do <code>motion</code>, na mola do <code>Menubar</code> (0,28s, 20% de quique). Ela vale nas três variantes e passa do item ao subitem. Ela marca o ativo, não o cursor: o hover esmaece no lugar, e o realce que corre sob o ponteiro continua recusado (rodada 137).
      </DocNote>

      <DocNote title="peek: espiar no modo ícone">
        Recolhida em ícone, o cursor parado 300ms sobre a barra a abre <strong>por cima</strong> do conteúdo, sem mover a página nem gravar o cookie. Ela recolhe 200ms depois de o cursor sair. É opt-in e só funciona com mouse. Com ele ligado, as dicas dos ícones não aparecem: a espiada já traz os rótulos. E o gatilho dentro da barra vira uma linha, <strong>Manter aberta</strong> com o <Kbd keys="mod+b" />: a barra aberta por cima fecha quando o cursor sai, e a linha diz como fixá-la.
      </DocNote>

      <DocNote title="Três formas de recolher">
        O gatilho do cabeçalho, um clique na borda entre a barra e o conteúdo, e <Kbd keys="mod+b" />. A borda não acende nada: sem o modo redimensionável não há o que arrastar, e um fio ali prometeria. O atalho escuta o documento que contém a barra, não <code>window</code> — por isso funciona dentro da moldura.
      </DocNote>

      <DocSection
        title="Redimensionável"
        description="As mesmas versões, com a costura arrastável. Arraste a costura. A largura é guardada em pixel, porque ícone, rótulo e badge têm medida fixa; passar do mínimo colapsa para o modo ícone."
        code={`<SidebarProvider resizable>
  <Sidebar collapsible="icon" variant="floating">…</Sidebar>
  <SidebarInset>…</SidebarInset>
</SidebarProvider>`}
        previewClassName="items-stretch p-4"
      >
        <DemoRedimensionavel />
      </DocSection>

      <DocNote title="Quem redimensiona é o Resizable, e é opt-in">
        Com <code>resizable</code> a barra vira o primeiro painel de um <code>ResizablePanelGroup</code> e herda o teclado na costura, o duplo-clique e o colapso por arraste; o modo ícone é <code>collapsedSize</code> de 48px, mais a calha: 56 no <code>floating</code>, onde a placa encosta na costura, e 64 no <code>inset</code>. Nas soltas a costura tem a altura da placa e acende como a borda dela. O grupo declara layout inline, então o padrão do app continua sendo o trilho <code>fixed</code>.
      </DocNote>

      <DocSection
        title="No telefone"
        description="Abaixo de 768px ela vira um painel lateral com véu e foco preso — a única folha com surface=&quot;panel&quot;, porque menu entra pelo lado, não sobe do rodapé. No floating o painel flutua também, com a calha de 8px."
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
                        <SidebarMenuSkeleton size="lg" showIcon />
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
            prop: "variant",
            type: '"sidebar" | "floating" | "inset"',
            default: '"floating"',
            description:
              "A superfície. floating: a placa solta; sidebar: rente, com fio; inset: solta o conteúdo, e exige um SidebarInset.",
          },
          {
            prop: "collapsible",
            type: '"offcanvas" | "icon" | "none"',
            default: '"offcanvas"',
            description:
              "Para onde ela vai ao recolher. none é a coluna simples, sem estado.",
          },
          {
            prop: "peek",
            type: "boolean",
            default: "false",
            description:
              "Recolhida em ícone, o cursor parado abre a barra por cima do conteúdo.",
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
            type: "{ showIcon?: boolean, size?: 'md' | 'lg' }",
            description:
              "A linha carregando, com largura variada; lg é a espera do workspace e da conta.",
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
