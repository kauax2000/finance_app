"use client"

import Link from "next/link"
import {
  BanknotesIcon,
  ChartPieIcon,
  CreditCardIcon,
  ArrowPathIcon,
  TagIcon,
  UsersIcon,
} from "@heroicons/react/20/solid"

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuLinkDescription,
  NavigationMenuLinkTitle,
  NavigationMenuList,
  NavigationMenuPanel,
  NavigationMenuSectionLabel,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

const SUPERFICIES = [
  {
    valor: "plain",
    dica: "Sem moldura — o padrão.",
  },
  {
    valor: "outline",
    dica: "A fileira com moldura própria.",
  },
  {
    valor: "solid",
    dica: "Bandeja, para dividir linha com controles.",
  },
] as const

const DEGRAUS = [
  ["sm", "28 — dentro de uma barra apertada."],
  ["md", "32 — o padrão."],
  ["lg", "36 — cabeçalho de landing."],
] as const

const MARCADORES = [
  {
    valor: "underline",
    dica: "Um traço de acento sob o gatilho aberto.",
  },
  { valor: "none", dica: "O padrão — o realce do gatilho basta." },
] as const

const CONTAS = [
  { nome: "Carteiras", texto: "Saldo por conta, num lugar só.", Icone: BanknotesIcon },
  { nome: "Cartões", texto: "Limite, fechamento e a fatura aberta.", Icone: CreditCardIcon },
  { nome: "Assinaturas", texto: "O que renova sozinho neste mês.", Icone: ArrowPathIcon },
] as const

const ANALISE = [
  { nome: "Categorias", texto: "Para onde o dinheiro foi.", Icone: TagIcon },
  { nome: "Relatórios", texto: "Doze meses, lado a lado.", Icone: ChartPieIcon },
  { nome: "Membros", texto: "Quem divide este workspace.", Icone: UsersIcon },
] as const

export default function NavigationMenuDoc() {
  return (
    <>
      <Usage>
        A fileira com painéis suspensos de um cabeçalho <strong>público</strong>: landing, preços, institucional. Dentro do app a navegação é a <code>Sidebar</code> e a ilha do telefone. Ações de um objeto são <code>DropdownMenu</code>; o caminho até a página é <code>Breadcrumb</code>; painéis irmãos da mesma tela são <code>Tabs</code>.
      </Usage>

      <DocSection
        title="Padrão"
        description="O gatilho abre um painel de links. Passe o cursor ou entre com Tab — o teclado é caminho normal aqui, e o anel de foco funciona dentro do painel."
        code={`<NavigationMenu>
  <NavigationMenuList>
    <NavigationMenuItem>
      <NavigationMenuTrigger>Finanças</NavigationMenuTrigger>
      <NavigationMenuContent>
        <NavigationMenuPanel>
          <NavigationMenuLink asChild>
            <Link href="/carteiras">Carteiras</Link>
          </NavigationMenuLink>
        </NavigationMenuPanel>
      </NavigationMenuContent>
    </NavigationMenuItem>
  </NavigationMenuList>
</NavigationMenu>`}
        previewClassName="items-start p-6 pb-32"
      >
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Finanças</NavigationMenuTrigger>
              <NavigationMenuContent>
                <NavigationMenuPanel>
                  {CONTAS.map((item) => (
                    <NavigationMenuLink key={item.nome} asChild>
                      <Link href="#">{item.nome}</Link>
                    </NavigationMenuLink>
                  ))}
                </NavigationMenuPanel>
              </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Análise</NavigationMenuTrigger>
              <NavigationMenuContent>
                <NavigationMenuPanel>
                  {ANALISE.map((item) => (
                    <NavigationMenuLink key={item.nome} asChild>
                      <Link href="#">{item.nome}</Link>
                    </NavigationMenuLink>
                  ))}
                </NavigationMenuPanel>
              </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <Link href="#">Preços</Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </DocSection>

      <DocNote title="Use NavigationMenuPanel">
        O painel traz grade, recuo, teto e rolagem, e faz cada link trazer o próprio <code>&lt;li&gt;</code>. Não escreva o <code>&lt;ul&gt;</code> nem re-estilize os links: a receita à mão diverge da do componente.
      </DocNote>

      <DocSection
        title="A troca é um morph"
        description="Ao trocar de gatilho, o painel muda de forma em 200ms com a curva da casa, e o conteúdo novo entra com um drift de 16px. A saída é só fade, rápida: um menu que fecha ao tirar o cursor não pode demorar."
        code={`<NavigationMenu>
  <NavigationMenuList>
    <NavigationMenuItem>
      <NavigationMenuTrigger>Finanças</NavigationMenuTrigger>
      <NavigationMenuContent>
        <NavigationMenuPanel>…</NavigationMenuPanel>
      </NavigationMenuContent>
    </NavigationMenuItem>
    <NavigationMenuItem>
      <NavigationMenuTrigger>Tudo</NavigationMenuTrigger>
      <NavigationMenuContent>
        <NavigationMenuPanel columns={2}>…</NavigationMenuPanel>
      </NavigationMenuContent>
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
                <NavigationMenuPanel>
                  {CONTAS.map((item) => (
                    <NavigationMenuLink key={item.nome} asChild>
                      <Link href="#">{item.nome}</Link>
                    </NavigationMenuLink>
                  ))}
                </NavigationMenuPanel>
              </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Tudo</NavigationMenuTrigger>
              <NavigationMenuContent>
                <NavigationMenuPanel columns={2}>
                  <NavigationMenuSectionLabel>Contas</NavigationMenuSectionLabel>
                  {CONTAS.map(({ nome, texto, Icone }) => (
                    <NavigationMenuLink key={nome} variant="card" asChild>
                      <Link href="#">
                        <Icone />
                        <NavigationMenuLinkTitle>{nome}</NavigationMenuLinkTitle>
                        <NavigationMenuLinkDescription>
                          {texto}
                        </NavigationMenuLinkDescription>
                      </Link>
                    </NavigationMenuLink>
                  ))}
                  <NavigationMenuSectionLabel>Análise</NavigationMenuSectionLabel>
                  {ANALISE.map(({ nome, texto, Icone }) => (
                    <NavigationMenuLink key={nome} variant="card" asChild>
                      <Link href="#">
                        <Icone />
                        <NavigationMenuLinkTitle>{nome}</NavigationMenuLinkTitle>
                        <NavigationMenuLinkDescription>
                          {texto}
                        </NavigationMenuLinkDescription>
                      </Link>
                    </NavigationMenuLink>
                  ))}
                </NavigationMenuPanel>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </DocSection>

      <DocSection
        title="As três superfícies"
        description="plain, outline e solid — as mesmas palavras e strings do Menubar, porque uma fileira de gatilhos é o mesmo objeto."
        code={`<NavigationMenu variant="solid">…</NavigationMenu>`}
        previewClassName="flex-col flex-nowrap items-start gap-6 p-6"
      >
        {SUPERFICIES.map((s) => (
          <div key={s.valor} className="flex flex-col gap-2">
            <NavigationMenu variant={s.valor} indicator="none" viewport={false}>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger>Produto</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <NavigationMenuPanel>
                      {CONTAS.map((item) => (
                        <NavigationMenuLink key={item.nome} asChild>
                          <Link href="#">{item.nome}</Link>
                        </NavigationMenuLink>
                      ))}
                    </NavigationMenuPanel>
                  </NavigationMenuContent>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink active asChild>
                    <Link href="#">Preços</Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <Link href="#">Docs</Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
            <p className="text-xs text-muted-foreground">
              <code className="font-mono">{s.valor}</code> — {s.dica}
            </p>
          </div>
        ))}
      </DocSection>

      <DocNote title="O link do topo mede igual ao gatilho">
        Um link solto na fileira compõe a régua do gatilho, então os dois não divergem quando um degrau muda. O realce da rota atual é <code>aria-[current=page]:</code>, e não <code>data-active:</code>, que tem especificidade zero e apagaria ao passar o cursor.
      </DocNote>

      <DocSection
        title="A escada mede o gatilho"
        description="28 · 32 · 36, os mesmos degraus do Button, do Input e do Tabs. Quem mede é o gatilho: a fileira cresce em volta, e em ponteiro grosso o degrau vai a 40."
        code={`<NavigationMenu size="lg">…</NavigationMenu>`}
        previewClassName="flex-col flex-nowrap items-start gap-6 p-6"
      >
        {DEGRAUS.map(([valor, dica]) => (
          <div key={valor} className="flex flex-col gap-2">
            <NavigationMenu
              variant="solid"
              size={valor}
              indicator="none"
              viewport={false}
            >
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger>Finanças</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <NavigationMenuPanel>
                      {CONTAS.map((item) => (
                        <NavigationMenuLink key={item.nome} asChild>
                          <Link href="#">{item.nome}</Link>
                        </NavigationMenuLink>
                      ))}
                    </NavigationMenuPanel>
                  </NavigationMenuContent>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink active asChild>
                    <Link href="#">Faturas</Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
            <p className="text-xs text-muted-foreground">
              <code className="font-mono">{valor}</code> — {dica}
            </p>
          </div>
        ))}
      </DocSection>

      <DocSection
        title="O marcador"
        description="underline desenha um traço de acento que viaja até o gatilho aberto. O padrão é none: o realce do próprio gatilho já marca qual está aberto."
        code={`<NavigationMenu indicator="underline">…</NavigationMenu>`}
        previewClassName="flex-col flex-nowrap items-start gap-10 p-6 pb-32"
      >
        {MARCADORES.map((m) => (
          <div key={m.valor} className="flex flex-col gap-2">
            <NavigationMenu indicator={m.valor}>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger>Finanças</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <NavigationMenuPanel>
                      {CONTAS.map((item) => (
                        <NavigationMenuLink key={item.nome} asChild>
                          <Link href="#">{item.nome}</Link>
                        </NavigationMenuLink>
                      ))}
                    </NavigationMenuPanel>
                  </NavigationMenuContent>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuTrigger>Análise</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <NavigationMenuPanel>
                      {ANALISE.map((item) => (
                        <NavigationMenuLink key={item.nome} asChild>
                          <Link href="#">{item.nome}</Link>
                        </NavigationMenuLink>
                      ))}
                    </NavigationMenuPanel>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
            <p className="text-xs text-muted-foreground">
              <code className="font-mono">{m.valor}</code> — {m.dica}
            </p>
          </div>
        ))}
      </DocSection>

      <DocSection
        title="O painel: uma, duas ou três colunas"
        description="columns decide grade e largura juntas, porque as duas precisam concordar. Abaixo de sm o painel sempre empilha numa coluna."
        code={`<NavigationMenuPanel columns={2}>
  <NavigationMenuSectionLabel>Contas</NavigationMenuSectionLabel>
  …
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
                  {CONTAS.map(({ nome, texto, Icone }) => (
                    <NavigationMenuLink key={nome} variant="card" asChild>
                      <Link href="#">
                        <Icone />
                        <NavigationMenuLinkTitle>{nome}</NavigationMenuLinkTitle>
                        <NavigationMenuLinkDescription>
                          {texto}
                        </NavigationMenuLinkDescription>
                      </Link>
                    </NavigationMenuLink>
                  ))}
                  <NavigationMenuSectionLabel>Análise</NavigationMenuSectionLabel>
                  {ANALISE.map(({ nome, texto, Icone }) => (
                    <NavigationMenuLink key={nome} variant="card" asChild>
                      <Link href="#">
                        <Icone />
                        <NavigationMenuLinkTitle>{nome}</NavigationMenuLinkTitle>
                        <NavigationMenuLinkDescription>
                          {texto}
                        </NavigationMenuLinkDescription>
                      </Link>
                    </NavigationMenuLink>
                  ))}
                </NavigationMenuPanel>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </DocSection>

      <DocNote title="Título e descrição sem gap">
        No <code>card</code> título e descrição são o mesmo dado em duas linhas, separados só pela entrelinha — o componente declara <code>gap-y-0</code> para não haver como escrever errado. A largura de uma coluna vem do conteúdo: 224 com linhas, 288 com cartões.
      </DocNote>

      <DocSection
        title="Link em linha e link em cartão"
        description="row é a linha de menu. card carrega o que aquilo é: use num mega-menu de duas ou três colunas, onde a largura sobra e o nome sozinho não decide."
        code={`<NavigationMenuLink variant="card" asChild>
  <Link href="/cartoes">
    <CreditCardIcon />
    <NavigationMenuLinkTitle>Cartões</NavigationMenuLinkTitle>
    <NavigationMenuLinkDescription>Limite, fechamento e a fatura aberta.</NavigationMenuLinkDescription>
  </Link>
</NavigationMenuLink>`}
        previewClassName="items-start gap-6 p-6 pb-44"
      >
        <NavigationMenu defaultValue="linha" indicator="underline" viewport={false}>
          <NavigationMenuList>
            <NavigationMenuItem value="linha">
              <NavigationMenuTrigger>Em linha</NavigationMenuTrigger>
              <NavigationMenuContent>
                <NavigationMenuPanel>
                  {CONTAS.map(({ nome, Icone }) => (
                    <NavigationMenuLink key={nome} asChild>
                      <Link href="#">
                        <Icone />
                        {nome}
                      </Link>
                    </NavigationMenuLink>
                  ))}
                </NavigationMenuPanel>
              </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem value="cartao">
              <NavigationMenuTrigger>Em cartão</NavigationMenuTrigger>
              <NavigationMenuContent>
                <NavigationMenuPanel>
                  {CONTAS.map(({ nome, texto, Icone }) => (
                    <NavigationMenuLink key={nome} variant="card" asChild>
                      <Link href="#">
                        <Icone />
                        <NavigationMenuLinkTitle>{nome}</NavigationMenuLinkTitle>
                        <NavigationMenuLinkDescription>
                          {texto}
                        </NavigationMenuLinkDescription>
                      </Link>
                    </NavigationMenuLink>
                  ))}
                </NavigationMenuPanel>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </DocSection>

      <DocSection
        title="Sem viewport"
        description="Cada painel abre embaixo do próprio item. Use quando os painéis têm larguras muito diferentes, para o viewport compartilhado não redimensionar à vista."
        code={`<NavigationMenu viewport={false}>…</NavigationMenu>`}
        previewClassName="items-start p-6 pb-32"
      >
        <NavigationMenu viewport={false}>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Finanças</NavigationMenuTrigger>
              <NavigationMenuContent>
                <NavigationMenuPanel>
                  {CONTAS.map((item) => (
                    <NavigationMenuLink key={item.nome} asChild>
                      <Link href="#">{item.nome}</Link>
                    </NavigationMenuLink>
                  ))}
                </NavigationMenuPanel>
              </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Análise</NavigationMenuTrigger>
              <NavigationMenuContent>
                <NavigationMenuPanel>
                  {ANALISE.map((item) => (
                    <NavigationMenuLink key={item.nome} asChild>
                      <Link href="#">{item.nome}</Link>
                    </NavigationMenuLink>
                  ))}
                </NavigationMenuPanel>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </DocSection>

      <DocSection
        title="Alinhamento"
        description="O padrão segue o gatilho aberto (trigger); start, center e end ancoram na fileira, para mega-menus centrados na página."
        code={`<NavigationMenu align="end">…</NavigationMenu>`}
        previewClassName="flex-col flex-nowrap items-stretch gap-4 p-6 pb-32"
      >
        <div className="flex justify-end">
          <NavigationMenu align="end">
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger>Conta</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <NavigationMenuPanel>
                    {ANALISE.map((item) => (
                      <NavigationMenuLink key={item.nome} asChild>
                        <Link href="#">{item.nome}</Link>
                      </NavigationMenuLink>
                    ))}
                  </NavigationMenuPanel>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>
        <p className="text-xs text-muted-foreground">
          A fileira está à direita da linha, e o painel abre para dentro.
        </p>
      </DocSection>

      <DocNote title="Dentro de um contêiner que recorta">
        Este é o único dropdown do sistema que não é portalizado: o viewport é filho da raiz, então todo ancestral com <code>overflow</code> o recorta. A raiz mede o recorte e o painel desloca e encolhe para caber, com 8px de folga.
      </DocNote>

      <DocSection
        title="Vertical"
        description="O painel abre para o lado, e não para baixo — embaixo da última linha seria um acordeão. O marcador acompanha o eixo sozinho."
        code={`<NavigationMenu orientation="vertical" variant="outline">…</NavigationMenu>`}
        previewClassName="items-start p-6 pr-72"
      >
        <NavigationMenu orientation="vertical" variant="outline">
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger className="justify-between">
                Finanças
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <NavigationMenuPanel>
                  {CONTAS.map((item) => (
                    <NavigationMenuLink key={item.nome} asChild>
                      <Link href="#">{item.nome}</Link>
                    </NavigationMenuLink>
                  ))}
                </NavigationMenuPanel>
              </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuTrigger className="justify-between">
                Análise
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <NavigationMenuPanel>
                  {ANALISE.map((item) => (
                    <NavigationMenuLink key={item.nome} asChild>
                      <Link href="#">{item.nome}</Link>
                    </NavigationMenuLink>
                  ))}
                </NavigationMenuPanel>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </DocSection>

      <DocSection
        title="Excesso vertical"
        description="O painel tem teto e rola com as bordas dissolvendo; o padrão é min(60dvh, 32rem)."
        code={`<NavigationMenuPanel className="[--navigation-menu-panel-max-h:14rem]">…</NavigationMenuPanel>`}
        previewClassName="items-start p-6 pb-60"
      >
        <NavigationMenu defaultValue="longo" indicator="underline" viewport={false}>
          <NavigationMenuList>
            <NavigationMenuItem value="longo">
              <NavigationMenuTrigger>Categorias</NavigationMenuTrigger>
              <NavigationMenuContent>
                <NavigationMenuPanel className="[--navigation-menu-panel-max-h:14rem]">
                  {[
                    "Mercado",
                    "Restaurantes",
                    "Transporte",
                    "Moradia",
                    "Saúde",
                    "Educação",
                    "Lazer",
                    "Assinaturas",
                    "Impostos",
                    "Presentes",
                  ].map((nome) => (
                    <NavigationMenuLink key={nome} asChild>
                      <Link href="#">{nome}</Link>
                    </NavigationMenuLink>
                  ))}
                </NavigationMenuPanel>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </DocSection>

      <DocNote title="O teto mora no painel">
        Sobrescreva <code>--navigation-menu-panel-max-h</code> no painel, nunca um <code>max-h</code> no viewport. O Radix mede a altura do conteúdo, então capar o painel já faz o viewport animar para o número certo.
      </DocNote>

      <PropsTable
        rows={[
          {
            prop: "variant",
            type: '"plain" | "outline" | "solid"',
            default: '"plain"',
            description:
              "Superfície da fileira, a mesma do Menubar.",
          },
          {
            prop: "size",
            type: '"sm" | "md" | "lg"',
            default: '"md"',
            description:
              "Altura do gatilho: 28, 32, 36 (40 em ponteiro grosso).",
          },
          {
            prop: "indicator",
            type: '"none" | "underline"',
            default: '"none"',
            description:
              "Marca o gatilho aberto; underline é o opt-in para um sinal alto.",
          },
          {
            prop: "align",
            type: '"trigger" | "start" | "center" | "end"',
            default: '"trigger"',
            description:
              "trigger segue o gatilho aberto; os outros ancoram na fileira. O painel fica sempre dentro da janela.",
          },
          {
            prop: "orientation",
            type: '"horizontal" | "vertical"',
            default: '"horizontal"',
            description:
              "Na vertical o painel abre para o lado.",
          },
          {
            prop: "viewport",
            type: "boolean",
            default: "true",
            description:
              "Um painel compartilhado (true) ou um por item (false).",
          },
          {
            prop: "NavigationMenuPanel columns",
            type: "1 | 2 | 3",
            default: "1",
            description:
              "Colunas e largura do painel. Abaixo de sm empilha; teto em --navigation-menu-panel-max-h.",
          },
          {
            prop: "NavigationMenuLink variant",
            type: '"row" | "card"',
            default: '"row"',
            description:
              "row é linha de menu; card é ícone, título e descrição.",
          },
        ]}
      />

      <PropsTable
        title="Slots"
        rows={[
          {
            prop: "NavigationMenuList",
            type: "ul",
            description:
              "A fileira; pinta a superfície e monta o marcador.",
          },
          {
            prop: "NavigationMenuItem",
            type: "li",
            description:
              "Um item; ancora o painel quando viewport={false}.",
          },
          {
            prop: "NavigationMenuTrigger",
            type: "button",
            description:
              "Abre o painel. O chevron já vem junto.",
          },
          {
            prop: "NavigationMenuContent",
            type: "div",
            description:
              "Com viewport não desenha nada; sem viewport é a superfície.",
          },
          {
            prop: "NavigationMenuPanel",
            type: "ul",
            description:
              "Grade, recuo, teto e rolagem. Dentro dele, o Link traz o próprio <li>.",
          },
          {
            prop: "NavigationMenuSectionLabel",
            type: "li",
            description:
              "Rótulo de grupo; atravessa as colunas.",
          },
          {
            prop: "NavigationMenuLink",
            type: "a",
            description:
              "O link. Com asChild recebe o <Link> do Next; data-active marca a rota atual.",
          },
          {
            prop: "NavigationMenuLinkTitle · Description",
            type: "span",
            description:
              "Os dois textos do variant card, separados pela entrelinha.",
          },
        ]}
      />
    </>
  )
}
