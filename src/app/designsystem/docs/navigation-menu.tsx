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
    dica: "Sobre a página, sem moldura — o cabeçalho de um site. É o padrão.",
  },
  {
    valor: "outline",
    dica: "A fileira se sustenta sozinha, encostada em conteúdo que já tem peso.",
  },
  {
    valor: "solid",
    dica: "Bandeja da mesma tinta do TabsList, para quando ela divide linha com controles.",
  },
] as const

const DEGRAUS = [
  ["sm", "28 — dentro de uma barra que já é apertada."],
  ["md", "32 — o padrão, e a altura de um Button md."],
  ["lg", "36 — cabeçalho de landing, onde a fileira é a única coisa na linha."],
] as const

const MARCADORES = [
  {
    valor: "arrow",
    dica: "A ponta do painel. Padrão quando há viewport — é o que liga o painel ao gatilho que o abriu.",
  },
  {
    valor: "underline",
    dica: "Um traço de acento sob o gatilho aberto, a mesma língua do Tabs underline.",
  },
  { valor: "none", dica: "Nada. Padrão sem viewport, onde o painel já encosta no item." },
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
        A fileira horizontal com painéis suspensos de um cabeçalho{" "}
        <strong>público</strong>: uma landing, uma página de preços, um site
        institucional. Dentro do app a navegação é a <code>Sidebar</code> no
        desktop e a ilha na base no telefone, e um terceiro lugar onde procurar a
        mesma tela seria um a mais. Se são ações de <em>um objeto</em>, é{" "}
        <code>DropdownMenu</code>; se é o caminho até onde a pessoa está, é{" "}
        <code>Breadcrumb</code>; se são painéis irmãos da mesma tela, é{" "}
        <code>Tabs</code>.
      </Usage>

      <DocSection
        title="Padrão"
        description="O gatilho abre um painel; o painel é uma lista de links. Passe o cursor, ou entre com o Tab — o teclado é o caminho normal aqui, e o anel de foco funciona dentro do painel."
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

      <DocNote title="O painel é uma peça, e não um <ul> que você escreve">
        <code>NavigationMenuPanel</code> traz a grade, o recuo, o teto de altura
        e a rolagem — e é ele que faz <code>NavigationMenuLink</code> embrulhar-se
        no próprio <code>{"<li>"}</code>. Antes, esta página escrevia{" "}
        <code>{'<ul className="grid w-64 gap-1 p-2">'}</code> à mão e{" "}
        <strong>re-estilizava cada link por dentro</strong> com{" "}
        <code>{'className="block rounded-md p-2 hover:bg-accent"'}</code>, uma
        receita que discordava da do componente em quatro declarações. Catálogo
        escrevendo a anatomia é o sinal desta casa de que falta peça.
      </DocNote>

      <DocSection
        title="As três superfícies"
        description="As mesmas três palavras do Menubar, com as mesmas três strings: uma fileira de gatilhos que se percorre com a seta é o mesmo objeto, e duas palavras para a mesma coisa é o que a rodada dos menus existiu para acabar."
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

      <DocNote title="O link do topo veste a régua do gatilho">
        Numa fileira real, <strong>Preços</strong> é um link e{" "}
        <strong>Produto</strong> é um gatilho com painel — e os dois precisam
        medir igual. Não por coincidência: o link do topo compõe{" "}
        <code>navigationMenuTriggerVariants</code>, então os dois leem o mesmo{" "}
        <code>size</code> e não têm como divergir no dia em que um degrau mudar.
        Dentro do painel a conta é outra, e ali o link volta a ser linha de menu.
        <br />O realce da rota atual é <code>aria-[current=page]:</code> e não{" "}
        <code>data-active:</code>, <strong>pela mesma aritmética</strong> que
        trocou o gatilho: o variante <code>data-*</code> tem especificidade zero
        e perderia para o <code>hover:</code> do mesmo elemento — o item da
        página em que a pessoa está apagaria justo ao ser apontado.
      </DocNote>

      <DocNote title="plain também tem borda, e ela é transparente">
        As três declaram <code>border</code>: em <code>plain</code> ela é{" "}
        <code>border-transparent</code>. É o que mantém a caixa idêntica nos três
        valores, então trocar de superfície não move um pixel do que está em
        volta. O <code>Menubar</code> faz igual, pela mesma razão.
      </DocNote>

      <DocSection
        title="A escada mede o gatilho"
        description="28 · 32 · 36 — os mesmos nomes e os mesmos números do Button, do Input, do Tabs e do Menubar. A fileira não declara altura nenhuma: ela cresce em volta do gatilho, e o link do topo desce pela mesma escada. Em ponteiro grosso o degrau vai a 40, e a pergunta é o apontador, não a largura."
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

      <DocNote title="Ancorar a escada no contêiner é a quinta porta do mesmo defeito">
        O <code>Menubar</code> entregou <strong>24</strong>, o <code>Tabs</code>{" "}
        entregou <strong>27</strong>, o <code>Item</code> teve dois degraus com a
        mesma string e o <code>Calendar</code> entregou <strong>28</strong> onde
        dizia 36. Aqui não havia escada nenhuma: o gatilho era{" "}
        <code>h-8</code> cravado, um número sem nome, que nenhuma tela podia
        pedir diferente. Quem mede é o gatilho — a fileira acompanha.
      </DocNote>

      <DocSection
        title="O marcador"
        description="Ele já viajava e ninguém tinha ligado o trajeto. O Radix escreve a caixa do gatilho ativo em transform e width a partir de offsetLeft/offsetWidth, com ResizeObserver próprio — faltava a transição, e sem ela um marcador só pisca de um gatilho para o outro."
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

      <DocNote title="A seta é a ponta do painel, e o defeito antigo não era contraste">
        O que havia antes era um quadrado <code>bg-border</code> com{" "}
        <code>shadow-md</code> próprio — uma cor diferente da superfície que ele
        encabeçava, e uma segunda sombra sobre a que o painel já lança. Medido no
        tema escuro, ele dava <strong>1,23:1 contra o painel</strong>: pouco para
        ler como peça, suficiente para ler como <em>emenda</em>.
        <br />
        Agora é <code>bg-popover</code> com o mesmo{" "}
        <code>ring-foreground/10</code> — <strong>1,00 contra o painel</strong>,
        nenhuma diferença, que é o número certo para um bico. Ele{" "}
        <em>não</em> se destaca da página (1,10), e não deveria: quem o torna
        visível é o fio e a sombra que o painel já tem. Se o que você quer é um
        sinal alto de qual gatilho está aberto, o marcador é o{" "}
        <code>underline</code> — <strong>6,78:1</strong> contra a página.
        <br />O recorte tem <strong>2px a mais que a calha</strong>: a base do
        bico passa por baixo do painel em vez de encostar nele. Sem isso o{" "}
        <code>ring</code> do painel desenharia um fio reto atravessando a base do
        bico, e as duas peças voltariam a ler como duas.
      </DocNote>

      <DocNote title="O padrão do marcador sai do outro eixo">
        <code>defaultNavigationMenuIndicator(viewport)</code> devolve{" "}
        <code>arrow</code> com viewport e <code>none</code> sem, e a razão é
        geométrica: com viewport há <strong>um</strong> painel compartilhado,
        longe do gatilho que o abriu, e a seta é o que liga os dois; sem
        viewport o painel nasce embaixo do próprio item, encostado nele, e a seta
        repetiria o que a posição já diz. É a forma de{" "}
        <code>defaultTabsSize(variant)</code> — derivar em vez de cravar, e
        deixar a derivação exportada para ser inspecionável.
      </DocNote>

      <DocSection
        title="O painel: uma, duas ou três colunas"
        description="columns decide a grade e a largura junto, porque as duas precisam concordar. Abaixo de sm ele sempre empilha numa coluna — três colunas num telefone são três colunas de uma palavra. Numa coluna só, a largura sai do conteúdo: 224 com linhas, 288 quando há cartão."
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

      <DocNote title="O link em cartão existe para trancar o par de identidade">
        Título e descrição são <strong>o mesmo dado em duas linhas</strong>, e
        quem os separa é a entrelinha — nunca um <code>gap</code>. Deixado a cargo
        de quem escreve a tela, aquilo vira <code>gap-1</code> e o par deixa de ler
        como uma coisa só; foi assim que <code>ItemContent</code>,{" "}
        <code>StatCard</code>, <code>FieldContent</code> e{" "}
        <code>PageHeaderTitleRow</code> foram pegos, quatro vezes com a
        documentação já dizendo o contrário do código. Aqui o{" "}
        <code>card</code> declara <code>gap-y-0</code> e não há como escrever
        errado.
        <br />A coluna do ícone só nasce quando há ícone{" "}
        (<code>has-[&gt;svg]:</code>): sem isso o título e a descrição cairiam
        lado a lado em vez de empilhados.
      </DocNote>

      <DocNote title="O painel se alarga sozinho quando carrega cartão">
        Uma coluna de <strong>linhas</strong> mede <strong>224</strong> — o
        degrau mais largo que o <code>DropdownMenuContent</code> oferece. Uma
        coluna de <strong>cartões</strong> mede <strong>288</strong>, e quem
        decide é o conteúdo: <code>has-[[data-variant=card]]:</code> no painel,
        o mesmo mecanismo do <code>has-[[data-slot=popover-body]]</code> do{" "}
        <code>Popover</code> e do <code>has-[&gt;svg]</code> do cartão logo
        acima. Quem escreve a tela não decide largura.
        <br />
        <strong>E o 288 é derivado, não escolhido.</strong> Um cartão é ícone
        (20) mais calha (10) mais texto, dentro de <code>p-2.5</code> (20) e do{" "}
        <code>p-1</code> do painel (8): 58px de cromagem. A descrição mais larga
        desta página pede <strong>209</strong> sem quebrar, e 209 + 58 = 267.
        Os 288 dão <strong>230</strong> de texto — a mesma folga que a coluna do
        mega-menu de duas já dá, onde as seis descrições cabem em uma linha.{" "}
        <strong>A coluna de cartões mede o mesmo em 1, 2 ou 3 colunas.</strong>{" "}
        A 224 sobravam 166, e a descrição quebrava em três linhas com uma
        palavra órfã.
      </DocNote>

      <DocSection
        title="Link em linha e link em cartão"
        description="row é a linha de menu — um rótulo, talvez um ícone à esquerda. card carrega o que aquilo é. Um painel de uma coluna quase sempre quer row; um mega-menu de duas ou três quase sempre quer card, porque ali a largura sobra e o nome sozinho não decide nada."
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
        description="Cada painel abre embaixo do próprio item, e a superfície passa a ser o próprio conteúdo. Escolha assim quando os painéis têm larguras muito diferentes: o viewport é um só, e ele redimensiona de um para o outro à vista."
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
        description="Por padrão o painel segue o gatilho que o abriu — align=&quot;trigger&quot;. Os outros três ancoram na fileira inteira, e servem o cabeçalho de largura total em que o mega-menu é centrado na página e não no item. Em qualquer um deles o painel é mantido dentro da janela."
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

      <DocNote title="O painel segue o gatilho, e antes ele não seguia">
        Com viewport há <strong>um</strong> painel para a fileira inteira, e o
        Radix não o desloca: ele nasce onde a casca o ancorar. Ancorado na{" "}
        <em>fileira</em> — que é o que <code>start</code>, <code>center</code> e{" "}
        <code>end</code> fazem —, abrir o <strong>segundo</strong> gatilho punha o
        painel no mesmo lugar em que o primeiro o pusera, e a leitura era a de um
        menu que abriu o painel errado. Com <code>indicator=&quot;arrow&quot;</code> ficava
        pior: a seta sobre o gatilho certo e o painel em outro lugar, as duas
        peças apontando para direções diferentes.
        <br />
        <code>align=&quot;trigger&quot;</code> mede o gatilho aberto e publica o{" "}
        <strong>centro</strong> dele em <code>--navigation-menu-anchor-cx</code>.
        Medido depois, com os dois gatilhos: painel e gatilho no mesmo centro —{" "}
        <strong>54,1 e 54,1</strong>, depois <strong>152,8 e 152,8</strong>.
        <br />E ele <strong>não sai do retângulo que o recorta</strong> — que
        não é a janela. Este é o <strong>único</strong> dropdown do sistema que
        não é portalizado: <code>Popover</code>, <code>Select</code>,{" "}
        <code>Tooltip</code> e os três menus mandam o conteúdo para o{" "}
        <code>body</code> e escapam de qualquer <code>overflow</code>; o viewport
        daqui é filho da raiz, então todo ancestral que recorta o recorta.
        Medido dentro de um <code>Preview</code> deste catálogo: janela de 0 a
        420, mas o que de fato corta ia de <strong>17 a 403</strong> — um clamp
        contra a janela deixava <strong>9px</strong> do painel fora, e era isso
        que se via como &quot;o dropdown está cortado&quot;.
        <br />
        Hoje a raiz sobe a árvore, intersecta a janela com cada ancestral que
        recorta, e publica <strong>duas</strong> medidas: a âncora e o teto de
        largura. Medido num recorte de 220px: o painel, que é 224, encolheu para{" "}
        <strong>204</strong> — o recorte menos a folga dos dois lados — e ficou
        dentro dele, com 8px de cada lado e zero corte. É a terceira cláusula da
        regra: deslocar não torna visível o que não cabe.
      </DocNote>

      <DocNote title="O `relative` no item zerava o offsetLeft de todo gatilho">
        O <code>Indicator</code> do Radix se posiciona com{" "}
        <code>translateX(activeTrigger.offsetLeft)</code>, e{" "}
        <code>offsetLeft</code> é medido contra o <strong>offsetParent</strong> —
        o ancestral posicionado mais próximo. Enquanto o{" "}
        <code>NavigationMenuItem</code> era <code>relative</code>, esse ancestral
        era o próprio <code>{"<li>"}</code>, e <code>offsetLeft</code> valia{" "}
        <strong>0 para todos</strong>: o marcador nunca saía do lugar.
        <br />
        Medido com o segundo gatilho aberto: seta em <strong>45,5</strong>,
        gatilho em <strong>152,8</strong> — <strong>107,3px</strong> de
        desalinho, e a largura travada em 102 (a do primeiro). O primeiro gatilho
        acertava <em>por acidente</em>, porque ali zero é o valor certo, e foi
        isso que fez o defeito atravessar uma inspeção inteira.
        <br />
        Sem o <code>relative</code>, o <code>offsetParent</code> volta a ser o{" "}
        <code>{'<div style="position:relative">'}</code> que o Radix põe em volta
        da fileira — o mesmo bloco contentor do marcador e do painel. Medido
        depois: desalinho <strong>0,1</strong> e <strong>0,3</strong> (o
        arredondamento inteiro do <code>offsetLeft</code>), com a largura da seta
        acompanhando o gatilho, 102 e 91.
      </DocNote>

      <DocNote title="in-* teria empatado, e quem decidiria seria a ordem de emissão">
        A âncora é uma tabela em JavaScript porque{" "}
        <code>in-data-[orientation=vertical]:</code> compila com{" "}
        <code>:where()</code>, que <strong>não soma especificidade</strong>: o
        override da vertical empataria com o <code>left-1/2</code> do
        alinhamento, e quem venceria seria a ordem em que o Tailwind emitiu as
        duas — não o que se escreveu. Esta base já pagou essa medição no{" "}
        <code>Command</code>, no <code>DescriptionList</code> e no{" "}
        <code>Tabs</code>.
      </DocNote>

      <DocSection
        title="Vertical"
        description="O painel voa para o lado, e não para baixo. Uma coluna de navegação com o painel embaixo da última linha não é um flyout, é um acordeão mal desenhado — e o Indicator do Radix já entende o eixo, então o marcador acompanha sem uma linha a mais."
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
        description="O painel tem teto e rola, com as bordas dissolvendo — a primitiva do sistema, e não um véu pintado. Quem declara o teto é o painel, por variável: --navigation-menu-panel-max-h, cujo padrão é min(60dvh, 32rem)."
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

      <DocNote title="O teto mora no painel, e não no viewport">
        O Radix expõe <strong>duas</strong> variáveis aqui —{" "}
        <code>{"--radix-navigation-menu-viewport-height"}</code> e{" "}
        <code>-width</code> — e nenhuma <code>available-height</code>. Mas ele
        calcula a primeira a partir do <code>offsetHeight</code> do conteúdo:
        capar o <em>conteúdo</em> devolve a altura já capada, e o viewport anima
        para o número certo sem <code>max-h</code> nenhum.
        <br />
        De brinde, isso satisfaz de graça a invariante do{" "}
        <code>scroll-fade</code> que diz que{" "}
        <strong>o elemento mascarado não desenha nada</strong>: quem desenha
        raio, fio e sombra é o viewport, e o painel é só a grade que rola.
      </DocNote>

      <PropsTable
        rows={[
          {
            prop: "variant",
            type: '"plain" | "outline" | "solid"',
            default: '"plain"',
            description:
              "A superfície da fileira. As mesmas três palavras e as mesmas três strings do Menubar. As três declaram border, e em plain ela é transparente — a caixa é idêntica nos três.",
          },
          {
            prop: "size",
            type: '"sm" | "md" | "lg"',
            default: '"md"',
            description:
              "A altura do gatilho — 28, 32, 36 —, os mesmos nomes e números do Button, do Input, do Tabs e do Menubar. A fileira não declara altura: ela cresce em volta. Em ponteiro grosso o degrau vai a 40.",
          },
          {
            prop: "indicator",
            type: '"none" | "arrow" | "underline"',
            default: "arrow com viewport, none sem",
            description:
              "O que marca o gatilho aberto. Ele é montado pela fileira, e não escrito por quem chama. O padrão sai de defaultNavigationMenuIndicator(viewport), que é exportado.",
          },
          {
            prop: "align",
            type: '"trigger" | "start" | "center" | "end"',
            default: '"trigger"',
            description:
              "Onde o painel se ancora. trigger segue o gatilho que o abriu, medindo o centro dele — é o padrão, e é o que faz o segundo gatilho abrir o painel embaixo de si mesmo. Os outros três ancoram na fileira inteira. Em todos, a âncora corre num trilho que mantém o painel dentro da janela.",
          },
          {
            prop: "orientation",
            type: '"horizontal" | "vertical"',
            default: '"horizontal"',
            description:
              "Na vertical a fileira vira coluna e o painel voa para o lado. O marcador acompanha o eixo sozinho — quem o posiciona é o Radix.",
          },
          {
            prop: "viewport",
            type: "boolean",
            default: "true",
            description:
              "Um painel compartilhado que redimensiona entre os itens (true) ou um painel por item, ancorado nele (false). Painéis de larguras muito diferentes leem melhor sem viewport.",
          },
          {
            prop: "NavigationMenuPanel columns",
            type: "1 | 2 | 3",
            default: "1",
            description:
              "As colunas e a largura do painel, que precisam concordar. Abaixo de sm ele sempre empilha numa coluna. Em columns={1} a largura sai do conteúdo — 224 com linhas, 288 quando há cartão dentro — e o teto de altura é a variável --navigation-menu-panel-max-h.",
          },
          {
            prop: "NavigationMenuLink variant",
            type: '"row" | "card"',
            default: '"row"',
            description:
              "row é a linha de menu. card é ícone, título e uma linha do que aquilo é, com gap-y-0 entre os dois textos — o par de identidade trancado pelo componente.",
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
              "A fileira, e quem pinta a superfície. Ela monta o marcador sozinha quando indicator não é none.",
          },
          {
            prop: "NavigationMenuItem",
            type: "li",
            description:
              "Um item. É ele que ancora o painel quando viewport={false}, e por isso é relative.",
          },
          {
            prop: "NavigationMenuTrigger",
            type: "button",
            description:
              "Abre o painel. O chevron vem junto e gira; não passe um ícone de seta por fora.",
          },
          {
            prop: "NavigationMenuContent",
            type: "div",
            description:
              "A lâmina que desliza. Com viewport ela não desenha nada; sem viewport ela é a superfície.",
          },
          {
            prop: "NavigationMenuPanel",
            type: "ul",
            description:
              "A grade, o recuo, o teto e a rolagem com dissolução nas bordas. Dentro dele, o Link traz o próprio <li>.",
          },
          {
            prop: "NavigationMenuSectionLabel",
            type: "li",
            description:
              "O rótulo de grupo, na régua que as quatro superfícies de comando já falam. Ele atravessa as colunas.",
          },
          {
            prop: "NavigationMenuLink",
            type: "a",
            description:
              "O link. Com asChild ele recebe o <Link> do Next. data-active pinta o item da rota atual e escreve aria-current.",
          },
          {
            prop: "NavigationMenuLinkTitle · Description",
            type: "span",
            description:
              "Os dois textos do variant card. A distância entre eles é a entrelinha, e não um gap.",
          },
        ]}
      />

      <DocNote title="Metade das declarações do arquivo antigo era gramática de outra biblioteca">
        <code>data-popup-open:</code> é vocabulário do{" "}
        <strong>Base UI</strong>, não do Radix — que escreve{" "}
        <code>data-state=&quot;open&quot;</code>. Ele aparecia{" "}
        <strong>quatro vezes</strong>, três no gatilho e uma no chevron, sempre
        emparelhado com a versão que de fato casa. Nenhum guarda pegava:{" "}
        <code>npm run ds:audit</code> respondia <em>&quot;Nenhum achado&quot;</em>{" "}
        neste arquivo, e responde para qualquer arquivo cheio de seletor que não
        casa com nada. Uma pasta calada não é uma pasta conforme.
      </DocNote>

      <DocNote title="O anel de foco era apagado justo onde o teclado é o caminho">
        O conteúdo trazia{" "}
        <code>**:data-[slot=navigation-menu-link]:focus:ring-0</code> mais{" "}
        <code>focus:outline-none</code> — um seletor de descendente que{" "}
        <strong>removia o anel de todo link dentro do painel</strong>. Com o
        mouse ninguém nota, porque o foco nunca entra ali; com o Tab, a pessoa
        navegava uma lista sem saber em que linha estava. Compensar por seletor
        de descendente é o sintoma que esta casa já nomeou várias vezes, e aqui o
        que ele compensava era o próprio design system.
      </DocNote>

      <DocNote title="data-open: tem especificidade zero, e o realce de aberto perdia para o cursor">
        No Tailwind 4.2.2 <code>data-open:</code> compila para{" "}
        <code>:where([data-state=open])</code> — medido no CSS emitido. Isso é{" "}
        <strong>0,1,0</strong> contra os <strong>0,2,0</strong> de{" "}
        <code>hover:</code>, no mesmo elemento. Em <code>solid</code> a
        consequência é visível: passar o cursor sobre um gatilho{" "}
        <em>aberto</em> o derrubaria de <code>bg-background</code> para{" "}
        <code>/60</code>, apagando o realce justo quando a pessoa aponta para
        ele. O gatilho passou a usar <code>aria-expanded:</code>, que é seletor
        de atributo de verdade — a mesma saída do <code>Menubar</code>. O{" "}
        <code>data-open:</code> fica onde não há disputa: nas animações da
        superfície.
      </DocNote>

      <DocNote title="Três exports saíram, e os três tinham zero chamadores">
        <code>navigationMenuTriggerStyle</code> era um <code>cva</code>{" "}
        <strong>sem nenhuma variante</strong> — uma string só, com um nome que
        prometia eixos; é a mesma constante disfarçada que{" "}
        <code>defaultControlVariant</code> era antes de sair.{" "}
        <code>NavigationMenuIndicator</code> e <code>NavigationMenuViewport</code>{" "}
        passaram a ser montados pela raiz, como a alça é da superfície e não de
        quem abre a gaveta. Os três somavam <strong>zero</strong> usos no
        repositório inteiro, então apagar custou nada e o compilador estava
        pronto para acusar se custasse.
      </DocNote>

      <DocNote title="O app ainda não usa este componente, e isso continua correto">
        Ele não tem consumidor fora deste catálogo. A navegação do produto é a{" "}
        <code>Sidebar</code> mais a ilha do telefone, e continua sendo — o lugar
        onde este componente é a resposta é a superfície pública que o produto
        ainda não tem. O que mudou nesta rodada é que, no dia em que essa página
        existir, ela não vai precisar inventar a fileira, o painel, o marcador
        nem o cartão: eles estão aqui, medidos.
      </DocNote>
    </>
  )
}
