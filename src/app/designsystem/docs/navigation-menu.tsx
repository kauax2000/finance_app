"use client"

import * as React from "react"
import Link from "next/link"
import {
  ArrowPathIcon,
  BanknotesIcon,
  ChartPieIcon,
  CreditCardIcon,
  TagIcon,
  UsersIcon,
} from "@heroicons/react/20/solid"

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuGroup,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuLinkDescription,
  NavigationMenuLinkTitle,
  NavigationMenuList,
  NavigationMenuPanel,
  NavigationMenuPanelFooter,
  NavigationMenuPanelHeader,
  NavigationMenuPreview,
  NavigationMenuSectionLabel,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"
import { PhoneFrame } from "../ds-frame"

const CONTAS = [
  { nome: "Carteiras", texto: "Saldo por conta, num lugar só.", Icone: BanknotesIcon },
  { nome: "Cartões", texto: "Limite, fechamento e a fatura aberta.", Icone: CreditCardIcon, selo: "Novo" },
  { nome: "Assinaturas", texto: "O que renova sozinho neste mês.", Icone: ArrowPathIcon },
] as const

const ANALISE = [
  { nome: "Categorias", texto: "Para onde o dinheiro foi.", Icone: TagIcon },
  { nome: "Relatórios", texto: "Doze meses, lado a lado.", Icone: ChartPieIcon },
  { nome: "Membros", texto: "Quem divide este workspace.", Icone: UsersIcon },
] as const

const VARIANTES = ["floating", "plain", "outline", "solid"] as const
const TAMANHOS = ["sm", "md", "lg"] as const
const MARCADORES = ["highlight", "underline", "none"] as const

function Cartoes({ lista }: { lista: typeof CONTAS | typeof ANALISE }) {
  return (
    <>
      {lista.map((item) => (
        <NavigationMenuLink key={item.nome} variant="card" asChild>
          <Link href="#">
            <item.Icone />
            <NavigationMenuLinkTitle badge={"selo" in item ? item.selo : undefined}>
              {item.nome}
            </NavigationMenuLinkTitle>
            <NavigationMenuLinkDescription>{item.texto}</NavigationMenuLinkDescription>
          </Link>
        </NavigationMenuLink>
      ))}
    </>
  )
}

function Linhas({ lista }: { lista: typeof CONTAS | typeof ANALISE }) {
  return (
    <>
      {lista.map((item) => (
        <NavigationMenuLink key={item.nome} asChild>
          <Link href="#">{item.nome}</Link>
        </NavigationMenuLink>
      ))}
    </>
  )
}

export default function NavigationMenuDoc() {
  return (
    <>
      <Usage>
        A fileira com painéis suspensos de um cabeçalho <strong>público</strong>: landing, preços, institucional. Dentro do app a navegação é a <code>Sidebar</code> e a ilha do telefone, e nenhuma tela o usa. Ações de um objeto são <code>DropdownMenu</code>; o caminho até a página é <code>Breadcrumb</code>; painéis irmãos da mesma tela são <code>Tabs</code>.
      </Usage>

      <DocSection
        title="Padrão"
        description="A pílula flutuante, com o realce que viaja entre os gatilhos na mola e descansa no link da página atual (Preços). O painel entra na mola, os cartões sobem em cascata, e o cabeçalho e o rodapé — com o Ver tudo e a legenda das teclas — moram ao lado do painel. O ponto em Análise diz que a página atual está lá dentro."
        code={`<NavigationMenu>
  <NavigationMenuList>
    <NavigationMenuItem>
      <NavigationMenuTrigger>Finanças</NavigationMenuTrigger>
      <NavigationMenuContent>
        <NavigationMenuPanelHeader title="Finanças" description="O dinheiro que se mexe." />
        <NavigationMenuPanel>…</NavigationMenuPanel>
        <NavigationMenuPanelFooter legend>
          <Link href="/finance">Ver tudo</Link>
        </NavigationMenuPanelFooter>
      </NavigationMenuContent>
    </NavigationMenuItem>
    <NavigationMenuItem>
      <NavigationMenuLink active asChild><Link href="/precos">Preços</Link></NavigationMenuLink>
    </NavigationMenuItem>
  </NavigationMenuList>
</NavigationMenu>`}
        previewClassName="items-start p-6 pb-80"
      >
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Finanças</NavigationMenuTrigger>
              <NavigationMenuContent>
                <NavigationMenuPanelHeader
                  title="Finanças"
                  description="O dinheiro que se mexe."
                />
                <NavigationMenuPanel>
                  <Cartoes lista={CONTAS} />
                </NavigationMenuPanel>
                <NavigationMenuPanelFooter legend>
                  <Link href="#" className="font-medium text-foreground">
                    Ver tudo
                  </Link>
                </NavigationMenuPanelFooter>
              </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Análise</NavigationMenuTrigger>
              <NavigationMenuContent>
                <NavigationMenuPanel>
                  <NavigationMenuLink asChild>
                    <Link href="#">Categorias</Link>
                  </NavigationMenuLink>
                  <NavigationMenuLink active asChild>
                    <Link href="#">Relatórios</Link>
                  </NavigationMenuLink>
                  <NavigationMenuLink asChild>
                    <Link href="#">Membros</Link>
                  </NavigationMenuLink>
                </NavigationMenuPanel>
              </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink active asChild>
                <Link href="#">Preços</Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </DocSection>

      <DocSection
        title="Aprofundar no lugar"
        description={
          <>
            <code>NavigationMenuGroup</code> abre o nível seguinte dentro do mesmo painel, com a trilha em cima para voltar — sem empilhar painéis. <strong>↑↓</strong> andam, <strong>→</strong> aprofunda, <strong>←</strong> volta, e o <strong>Esc</strong> sobe um nível antes de fechar. Ao abrir, o painel já mostra o nível da página atual: aqui, Cartões › Nubank.
          </>
        }
        code={`<NavigationMenuPanel>
  <NavigationMenuGroup label="Cartões" icon={<CreditCardIcon />} description="Limite e faturas.">
    <NavigationMenuGroup label="Nubank">
      <NavigationMenuLink asChild><Link href="/cards/nu/invoice">Fatura aberta</Link></NavigationMenuLink>
    </NavigationMenuGroup>
  </NavigationMenuGroup>
</NavigationMenuPanel>`}
        previewClassName="items-start p-6 pb-80"
      >
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Contas</NavigationMenuTrigger>
              <NavigationMenuContent>
                <NavigationMenuPanelHeader
                  title="Contas"
                  description="Entre num grupo para ver o que há dentro."
                />
                <NavigationMenuPanel>
                  <NavigationMenuGroup
                    label="Carteiras"
                    icon={<BanknotesIcon />}
                    description="Saldo por conta, num lugar só."
                  >
                    <NavigationMenuLink asChild>
                      <Link href="#">Conta corrente</Link>
                    </NavigationMenuLink>
                    <NavigationMenuLink asChild>
                      <Link href="#">Poupança</Link>
                    </NavigationMenuLink>
                  </NavigationMenuGroup>
                  <NavigationMenuGroup
                    label="Cartões"
                    icon={<CreditCardIcon />}
                    description="Limite, fechamento e faturas."
                    badge="2"
                  >
                    <NavigationMenuGroup label="Nubank">
                      <NavigationMenuLink active asChild>
                        <Link href="#">Fatura aberta</Link>
                      </NavigationMenuLink>
                      <NavigationMenuLink asChild>
                        <Link href="#">Faturas anteriores</Link>
                      </NavigationMenuLink>
                    </NavigationMenuGroup>
                    <NavigationMenuGroup label="Itaú">
                      <NavigationMenuLink asChild>
                        <Link href="#">Fatura aberta</Link>
                      </NavigationMenuLink>
                    </NavigationMenuGroup>
                  </NavigationMenuGroup>
                  <NavigationMenuLink variant="card" asChild>
                    <Link href="#">
                      <ArrowPathIcon className="size-5" />
                      <NavigationMenuLinkTitle>Assinaturas</NavigationMenuLinkTitle>
                      <NavigationMenuLinkDescription>
                        O que renova sozinho neste mês.
                      </NavigationMenuLinkDescription>
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuPanel>
                <NavigationMenuPanelFooter legend />
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </DocSection>

      <DocSection
        title="Prévia ao lado"
        description="NavigationMenuPreview é uma coluna à direita do painel que mostra o preview do link sob o cursor ou com o foco; os filhos dela são o que aparece antes."
        code={`<NavigationMenuContent>
  <div className="flex">
    <NavigationMenuPanel>
      <NavigationMenuLink preview={<ResumoDeCartoes />} asChild>…</NavigationMenuLink>
    </NavigationMenuPanel>
    <NavigationMenuPreview>Passe por um item.</NavigationMenuPreview>
  </div>
</NavigationMenuContent>`}
        previewClassName="items-start p-6 pb-72"
      >
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Produto</NavigationMenuTrigger>
              <NavigationMenuContent>
                <div className="flex">
                  <NavigationMenuPanel>
                    {[...CONTAS, ...ANALISE].map((item) => (
                      <NavigationMenuLink
                        key={item.nome}
                        asChild
                        preview={
                          <>
                            <item.Icone className="size-5 text-muted-foreground" />
                            <span className="font-medium">{item.nome}</span>
                            <span className="text-xs text-muted-foreground">{item.texto}</span>
                          </>
                        }
                      >
                        <Link href="#">{item.nome}</Link>
                      </NavigationMenuLink>
                    ))}
                  </NavigationMenuPanel>
                  <NavigationMenuPreview>
                    <span className="text-xs text-muted-foreground">
                      Passe por um item para ver o que ele é.
                    </span>
                  </NavigationMenuPreview>
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </DocSection>

      <DocSection
        title="Superfícies, degraus e marcador"
        description="floating é o padrão; plain mora num cabeçalho que já tem moldura; outline se sustenta chapada; solid é bandeja. size mede o gatilho (28 · 32 · 36, 40 no ponteiro grosso). highlight é o realce que viaja; underline, o traço do Radix; none, só o fundo do gatilho."
        code={`<NavigationMenu variant="solid" size="lg" indicator="underline">…</NavigationMenu>`}
        previewClassName="flex-col items-start gap-4 p-6 pb-56"
      >
        <EixosDemo />
      </DocSection>

      <DocSection
        title="O painel: uma, duas ou três colunas"
        description="columns decide grade e largura juntas. Abaixo de sm o painel empilha numa coluna. O selo do Cartões é o badge do título."
        code={`<NavigationMenuPanel columns={2}>
  <NavigationMenuSectionLabel>Contas</NavigationMenuSectionLabel>
  …
  <NavigationMenuLinkTitle badge="Novo">Cartões</NavigationMenuLinkTitle>
</NavigationMenuPanel>`}
        previewClassName="items-start p-6 pb-80"
      >
        <NavigationMenu defaultValue="tudo" viewport={false}>
          <NavigationMenuList>
            <NavigationMenuItem value="tudo">
              <NavigationMenuTrigger>Tudo</NavigationMenuTrigger>
              <NavigationMenuContent>
                <NavigationMenuPanel columns={2}>
                  <NavigationMenuSectionLabel>Contas</NavigationMenuSectionLabel>
                  <Cartoes lista={CONTAS} />
                  <NavigationMenuSectionLabel>Análise</NavigationMenuSectionLabel>
                  <Cartoes lista={ANALISE} />
                </NavigationMenuPanel>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </DocSection>

      <DocSection
        title="Sem viewport, alinhamento e vertical"
        description="Sem viewport cada painel abre sob o próprio item; align ancora na fileira em vez de seguir o gatilho; na vertical o painel voa para o lado."
        code={`<NavigationMenu viewport={false}>…</NavigationMenu>
<NavigationMenu align="end">…</NavigationMenu>
<NavigationMenu orientation="vertical">…</NavigationMenu>`}
        previewClassName="flex-col items-stretch gap-8 p-6 pb-40 pr-72"
      >
        <div className="flex flex-wrap items-start justify-between gap-6">
          <NavigationMenu viewport={false}>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger>Finanças</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <NavigationMenuPanel>
                    <Linhas lista={CONTAS} />
                  </NavigationMenuPanel>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
          <NavigationMenu align="end">
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger>Conta</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <NavigationMenuPanel>
                    <Linhas lista={ANALISE} />
                  </NavigationMenuPanel>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>
        <NavigationMenu orientation="vertical">
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger className="justify-between">Finanças</NavigationMenuTrigger>
              <NavigationMenuContent>
                <NavigationMenuPanel>
                  <Linhas lista={CONTAS} />
                </NavigationMenuPanel>
              </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuTrigger className="justify-between">Análise</NavigationMenuTrigger>
              <NavigationMenuContent>
                <NavigationMenuPanel>
                  <Linhas lista={ANALISE} />
                </NavigationMenuPanel>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </DocSection>

      <DocSection
        title="No telefone, a folha"
        description={
          <>
            <code>mobile=&quot;sheet&quot;</code>: abaixo de 768px a fileira vira um botão que abre a gaveta com as seções; os grupos aprofundam no lugar, com a trilha, e cada link fecha a gaveta.
          </>
        }
        code={`<NavigationMenu mobile="sheet" mobileLabel="Navegar">…</NavigationMenu>`}
        previewClassName="justify-center"
      >
        <PhoneFrame title="A navegação num telefone">
          <div className="flex h-full items-start justify-center p-4">
            <NavigationMenu mobile="sheet" mobileLabel="Navegar">
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger>Contas</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <NavigationMenuPanel>
                      <NavigationMenuGroup label="Cartões">
                        <NavigationMenuLink asChild>
                          <Link href="#">Nubank</Link>
                        </NavigationMenuLink>
                        <NavigationMenuLink asChild>
                          <Link href="#">Itaú</Link>
                        </NavigationMenuLink>
                      </NavigationMenuGroup>
                      <NavigationMenuLink asChild>
                        <Link href="#">Carteiras</Link>
                      </NavigationMenuLink>
                    </NavigationMenuPanel>
                  </NavigationMenuContent>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuTrigger>Análise</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <NavigationMenuPanel>
                      <Linhas lista={ANALISE} />
                    </NavigationMenuPanel>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>
        </PhoneFrame>
      </DocSection>

      <DocNote title="A diagonal segura">
        Com um painel aberto, atravessar outro gatilho a caminho dele não troca de painel: o cursor tem um triângulo de tolerância entre onde estava e os dois cantos do painel voltados para a fileira. Se ele parar no gatilho, aí sim o painel troca — em 150ms.
      </DocNote>

      <DocNote title="O realce que viaja é da fileira, não dos links">
        O movimento veio da referência do dono, a mesma do <code>Menubar</code>: a mola do realce, o painel descendo de 97%, os links em cascata. O que não veio é o realce correndo entre os links do painel — recusado na rodada 137. Os links acendem no esmaecer de 300ms dos menus.
      </DocNote>

      <DocNote title="O painel sabe o que tem dentro sem abrir">
        O Radix só monta o painel aberto. Para o gatilho ganhar o ponto da página atual e o painel abrir no nível certo, cada <code>NavigationMenuContent</code> renderiza os filhos também num índice que nunca pinta, onde cada link só se registra. Dentro dele só vão peças do componente.
      </DocNote>

      <DocNote title="Dentro de um contêiner que recorta">
        É o único dropdown do sistema que não é portalizado: o viewport é filho da raiz, então todo ancestral com <code>overflow</code> o recorta. A raiz mede o recorte e o painel desloca e encolhe para caber. Ela fica em <code>--z-raised</code>, abaixo do header sticky, e fecha quando a página rola.
      </DocNote>

      <PropsTable
        title="NavigationMenu"
        rows={[
          {
            prop: "variant",
            type: '"floating" | "plain" | "outline" | "solid"',
            default: '"floating"',
            description: "A superfície da fileira; floating é a pílula do Menubar.",
          },
          {
            prop: "size",
            type: '"sm" | "md" | "lg"',
            default: '"md"',
            description: "Altura do gatilho: 28, 32, 36 (40 em ponteiro grosso).",
          },
          {
            prop: "indicator",
            type: '"highlight" | "underline" | "none"',
            default: '"highlight"',
            description:
              "highlight é o realce que viaja e descansa na página atual; underline, o traço; none, só o fundo do gatilho.",
          },
          {
            prop: "align",
            type: '"trigger" | "start" | "center" | "end"',
            default: '"trigger"',
            description: "trigger segue o gatilho aberto; os outros ancoram na fileira.",
          },
          {
            prop: "orientation",
            type: '"horizontal" | "vertical"',
            default: '"horizontal"',
            description: "Na vertical o painel abre para o lado.",
          },
          {
            prop: "viewport",
            type: "boolean",
            default: "true",
            description: "Um painel compartilhado (true) ou um por item (false).",
          },
          {
            prop: "mobile / mobileLabel",
            type: '"bar" | "sheet" / string',
            default: '"bar" / "Menu"',
            description: "sheet troca a fileira, abaixo de 768px, pela folha.",
          },
        ]}
      />

      <PropsTable
        title="As peças"
        rows={[
          {
            prop: "NavigationMenuPanel columns",
            type: "1 | 2 | 3",
            default: "1",
            description:
              "Colunas e largura do painel; guarda o aprofundamento e as setas.",
          },
          {
            prop: "NavigationMenuGroup",
            type: "{ label, description?, icon?, badge?, children }",
            description:
              "Um grupo que aprofunda no lugar, com a trilha em cima; aninha.",
          },
          {
            prop: "NavigationMenuLink",
            type: '{ variant?: "row" | "card", active?, preview? }',
            description:
              "O link; active é a página atual (aria-current), preview é o que a prévia mostra.",
          },
          {
            prop: "NavigationMenuLinkTitle badge",
            type: "React.ReactNode",
            description: "A pílula ao lado do nome — Novo, Beta.",
          },
          {
            prop: "NavigationMenuPanelHeader",
            type: "{ title, description? }",
            description: "O cabeçalho do painel, ao lado dele no conteúdo.",
          },
          {
            prop: "NavigationMenuPanelFooter",
            type: "{ children?, legend? }",
            description:
              "O rodapé: o Ver tudo, e com legend as teclas ↑↓ ← → ↵ (somem no toque).",
          },
          {
            prop: "NavigationMenuPreview",
            type: "{ children? }",
            description:
              "A coluna ao lado do painel com o preview do link sob o cursor; os filhos são o estado inicial.",
          },
          {
            prop: "NavigationMenuItem",
            type: "li",
            description:
              "Um item. Ele não é relative — o painel sem viewport se ancora na raiz, pela âncora medida.",
          },
        ]}
      />
    </>
  )
}

function EixosDemo() {
  const [variant, setVariant] = React.useState<(typeof VARIANTES)[number]>("floating")
  const [size, setSize] = React.useState<(typeof TAMANHOS)[number]>("md")
  const [indicator, setIndicator] = React.useState<(typeof MARCADORES)[number]>("highlight")
  const trilho = <T extends string>(
    rotulo: string,
    valores: readonly T[],
    valor: T,
    mudar: (v: T) => void
  ) => (
    <ToggleGroup
      type="single"
      variant="segmented"
      size="sm"
      value={valor}
      onValueChange={(v) => v && mudar(v as T)}
      aria-label={rotulo}
    >
      {valores.map((v) => (
        <ToggleGroupItem key={v} value={v} className="font-mono">
          {v}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
  return (
    <>
      <div className="flex flex-wrap gap-3">
        {trilho("Superfície", VARIANTES, variant, setVariant)}
        {trilho("Tamanho", TAMANHOS, size, setSize)}
        {trilho("Marcador", MARCADORES, indicator, setIndicator)}
      </div>
      <NavigationMenu variant={variant} size={size} indicator={indicator}>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger>Finanças</NavigationMenuTrigger>
            <NavigationMenuContent>
              <NavigationMenuPanel>
                <Linhas lista={CONTAS} />
              </NavigationMenuPanel>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuTrigger>Análise</NavigationMenuTrigger>
            <NavigationMenuContent>
              <NavigationMenuPanel>
                <Linhas lista={ANALISE} />
              </NavigationMenuPanel>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink active asChild>
              <Link href="#">Preços</Link>
            </NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </>
  )
}
