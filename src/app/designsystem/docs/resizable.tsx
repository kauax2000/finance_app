"use client"

import * as React from "react"

import {
  ResizableCollapseTrigger,
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  useResizableLayout,
  useResizablePanel,
} from "@/components/ui/resizable"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

const VARIANTES = [
  [
    "line",
    "O fio, mais o acento nos estados. O caso geral.",
  ],
  [
    "grip",
    "O fio, o acento e uma pega. Para o split que a pessoa deve ajustar.",
  ],
  [
    "plain",
    "Nada em repouso; o acento só ao pousar e arrastar. Para painéis que já têm moldura própria.",
  ],
] as const

/**
 * A caixa do grupo vem do pai — ver a nota sobre a `className` inerte. A altura
 * só existe a partir de `md`: empilhado, o grupo tem a altura do conteúdo, e um
 * palco fixo deixaria 56px de vão morto abaixo dele no telefone.
 */
function Palco({ children }: { children: React.ReactNode }) {
  return <div className="w-full md:h-40">{children}</div>
}

function Pane({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full items-center justify-center p-4 text-sm text-muted-foreground">
      {children}
    </div>
  )
}

function DemoPersistencia() {
  const layout = useResizableLayout({ id: "ds-demo-resizable" })

  return (
    <Palco>
      <ResizablePanelGroup
        key={layout.groupKey}
        {...layout.groupProps}
        className="rounded-lg border border-border"
      >
        <ResizablePanel id="extrato" defaultSize="40" minSize="25">
          <Pane>Extrato</Pane>
        </ResizablePanel>
        <ResizableHandle variant="grip" />
        <ResizablePanel id="detalhe" minSize="30">
          <Pane>Detalhe</Pane>
        </ResizablePanel>
      </ResizablePanelGroup>
    </Palco>
  )
}

function DemoColapso() {
  const lateral = useResizablePanel()

  return (
    <Palco>
      <ResizablePanelGroup className="rounded-lg border border-border">
        <ResizablePanel
          {...lateral.panelProps}
          collapsible
          collapsedSize="0"
          defaultSize="32"
          minSize="20"
        >
          <Pane>Categorias</Pane>
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel minSize="30">
          <div className="flex h-full flex-col">
            {/* A folga até a costura é do **dedo**, não do cursor: a zona de
                arraste é `{ coarse: 44, fine: 10 }`, então ela pede 22px de
                folga no toque e 5 no mouse. Cravar 24 para todo mundo deixava o
                recuo esquerdo 3× maior que os outros três lados, à vista, para
                proteger um caso que o mouse não tem. */}
            <div className="flex items-center gap-2 p-2 pointer-coarse:ps-6">
              <ResizableCollapseTrigger
                collapsed={lateral.isCollapsed}
                side="start"
                onClick={lateral.toggle}
                aria-label={
                  lateral.isCollapsed
                    ? "Mostrar categorias"
                    : "Esconder categorias"
                }
              />
              <span className="text-sm text-muted-foreground">Transações</span>
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </Palco>
  )
}

export default function ResizableDoc() {
  return (
    <>
      <Usage>
        Duas regiões de trabalho lado a lado, cuja proporção a pessoa decide.
        Faz sentido quando ela passa muito tempo na tela e a proporção certa
        depende do que ela está fazendo — um extrato ao lado do detalhe. Se a
        proporção é a mesma para todo mundo, é <code>grid</code>; se só uma das
        regiões aparece por vez, é <code>Tabs</code>; se a segunda região é uma
        interrupção, é <code>Sheet</code>.
      </Usage>

      <DocSection
        title="Padrão"
        description="Um grupo horizontal com duas regiões e uma costura entre elas. Arraste; solte; dê um duplo-clique para voltar ao padrão."
        code={`<ResizablePanelGroup>
  <ResizablePanel defaultSize="40" minSize="25">…</ResizablePanel>
  <ResizableHandle variant="grip" />
  <ResizablePanel minSize="30">…</ResizablePanel>
</ResizablePanelGroup>`}
        previewClassName="flex-col flex-nowrap items-stretch p-6"
      >
        <Palco>
          <ResizablePanelGroup className="rounded-lg border border-border">
            <ResizablePanel defaultSize="40" minSize="25">
              <Pane>Extrato</Pane>
            </ResizablePanel>
            <ResizableHandle variant="grip" />
            <ResizablePanel minSize="30">
              <Pane>Detalhe</Pane>
            </ResizablePanel>
          </ResizablePanelGroup>
        </Palco>
      </DocSection>

      <DocSection
        title="As três costuras"
        description="O eixo decide o que a costura desenha em repouso — nunca o que ela faz. As três acendem igual ao pousar e ao arrastar."
        code={`<ResizableHandle variant="line" />   {/* o padrão */}
<ResizableHandle variant="grip" />
<ResizableHandle variant="plain" />`}
        previewClassName="flex-col flex-nowrap items-stretch gap-6 p-6"
      >
        {VARIANTES.map(([variant, dica]) => (
          <div key={variant} className="flex flex-col gap-1.5">
            <div className="w-full md:h-24">
              <ResizablePanelGroup className="rounded-lg border border-border">
                <ResizablePanel defaultSize="45" minSize="25">
                  <Pane>Extrato</Pane>
                </ResizablePanel>
                <ResizableHandle variant={variant} />
                <ResizablePanel minSize="25">
                  <Pane>Detalhe</Pane>
                </ResizablePanel>
              </ResizablePanelGroup>
            </div>
            <p className="text-xs text-muted-foreground">
              <code className="font-mono">{variant}</code> — {dica}
            </p>
          </div>
        ))}
      </DocSection>

      <DocNote title="A costura não é uma borda, e antes ela era">
        A alça era <code>bg-border</code> de 1px sem estado nenhum — o mesmo
        desenho de um <code>Separator</code> parado —, e a pega do{" "}
        <code>withHandle</code> era <strong>também</strong>{" "}
        <code>bg-border</code>: uma pastilha da cor exata do fio em que ela se
        apoia. A lib publica <code>data-separator</code> com{" "}
        <code>inactive</code>, <code>hover</code>, <code>active</code>,{" "}
        <code>focus</code> e <code>disabled</code> desde a v4, e o componente
        lia <strong>zero</strong>.
      </DocNote>

      <DocNote title="O realce é pintado fora do fluxo">
        Engrossar a alça de verdade reflui os dois painéis a cada passagem do
        cursor. O acento é um <code>::before</code> absoluto de 2px centrado na
        costura, e só a <em>cor</em> transiciona — nenhuma propriedade de layout
        entra na conta. É o mecanismo do marcador do <code>Tabs</code>.{" "}
        <code>::before</code> e não <code>::after</code> de propósito: o
        pseudo-elemento <code>after</code> é o último filho e pintaria por cima
        da pega, o que exigiria um <code>z-index</code> só para desfazer.
      </DocNote>

      <DocSection
        title="Vertical"
        description="A orientação do grupo, que a documentação anterior não mostrava. A costura corre no eixo cruzado dela, e a pega gira junto."
        code={`<ResizablePanelGroup orientation="vertical">…</ResizablePanelGroup>`}
        previewClassName="flex-col flex-nowrap items-stretch p-6"
      >
        <div className="h-56 w-full">
          <ResizablePanelGroup
            orientation="vertical"
            className="rounded-lg border border-border"
          >
            <ResizablePanel defaultSize="45" minSize="20">
              <Pane>Gráfico</Pane>
            </ResizablePanel>
            <ResizableHandle variant="grip" />
            <ResizablePanel minSize="20">
              <Pane>Lançamentos</Pane>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </DocSection>

      <DocSection
        title="No telefone ele empilha"
        description="Estreite a janela abaixo de 768px: o grupo horizontal acima vira fluxo empilhado, os painéis soltam as proporções e a costura deixa de arrastar e de receber foco. Um grupo vertical mantém as alças, porque num telefone ele já é uma coluna."
        code={`<ResizablePanelGroup>…</ResizablePanelGroup>          {/* empilha abaixo de 768 */}
<ResizablePanelGroup stack={false}>…</ResizablePanelGroup>  {/* nunca empilha */}`}
        previewClassName="flex-col flex-nowrap items-stretch p-6"
      >
        <Palco>
          <ResizablePanelGroup className="rounded-lg border border-border">
            <ResizablePanel defaultSize="50" minSize="25">
              <Pane>Contas</Pane>
            </ResizablePanel>
            <ResizableHandle variant="grip" />
            <ResizablePanel minSize="25">
              <Pane>Fatura</Pane>
            </ResizablePanel>
          </ResizablePanelGroup>
        </Palco>
      </DocSection>

      <DocNote title="Um split é móvel de desktop">
        Duas colunas de 180px num telefone de 375 não são um layout. É o mesmo
        par que o <code>Sheet</code> já faz entre painel e gaveta, com o mesmo
        hook e o mesmo número (<code>useIsMobile</code>, 768px) — e a mesma
        regra: <strong>nenhuma tela escreve <code>isMobile</code></strong>, a
        API é uma só. A documentação anterior empurrava esse layout para toda
        tela futura em prosa; agora o componente o cumpre.
      </DocNote>

      <DocSection
        title="Lembrar a proporção"
        description="Arraste a costura e recarregue a página. Um split cuja proporção reseta a cada navegação é um split que ninguém ajusta."
        code={`const layout = useResizableLayout({ id: "transacoes" })

<ResizablePanelGroup key={layout.groupKey} {...layout.groupProps}>
  <ResizablePanel id="extrato" defaultSize="40">…</ResizablePanel>
  <ResizableHandle variant="grip" />
  <ResizablePanel id="detalhe">…</ResizablePanel>
</ResizablePanelGroup>`}
        previewClassName="flex-col flex-nowrap items-stretch p-6"
      >
        <DemoPersistencia />
      </DocSection>

      <DocNote title="Proporção guardada e SSR não convivem sozinhos">
        A lib passa <strong>a mesma função</strong> como{" "}
        <code>getSnapshot</code> e como <code>getServerSnapshot</code> do{" "}
        <code>useSyncExternalStore</code>. Na passagem de hidratação o cliente
        lê o <code>localStorage</code> e discorda do HTML que o servidor acabou
        de mandar, onde não havia proporção nenhuma — medido nesta página, com
        um diff inteiro de <code>flexGrow</code> no console. Nenhuma guarda de{" "}
        <code>typeof window</code> pega isso: na hidratação o{" "}
        <code>window</code> existe.
        <br />
        <br />
        E adiar sozinho não resolve: com o <code>defaultLayout</code> chegando
        depois, o grupo simplesmente <strong>o ignora</strong> — medido, 25/75
        guardado e 40/60 na tela. Ele é lido na montagem, e só nela. Daí o{" "}
        <code>groupKey</code>, que troca uma vez e remonta o grupo já com a
        proporção certa. O preço é uma remontagem por carregamento, e é por isso
        que ele é <code>key</code> explícito em vez de vir no espalhamento: quem
        paga tem de ver o custo escrito na chamada. Quem não quiser pagar guarda
        a proporção em cookie e a entrega pelo servidor.
      </DocNote>

      <DocSection
        title="Colapsar um painel"
        description="O gatilho mora no cabeçalho do painel vizinho, e não na costura. O painel desliza em 200ms — é a única mudança de tamanho que anima, porque é a única que é um comando e não um gesto. Arrastar abaixo do mínimo também fecha, porque o painel é collapsible."
        code={`const lateral = useResizablePanel()

<ResizablePanel {...lateral.panelProps} collapsible collapsedSize="0" minSize="20">…</ResizablePanel>
<ResizableHandle />
<ResizablePanel>
  <ResizableCollapseTrigger
    collapsed={lateral.isCollapsed}
    side="start"
    onClick={lateral.toggle}
  />
</ResizablePanel>`}
        previewClassName="flex-col flex-nowrap items-stretch p-6"
      >
        <DemoColapso />
      </DocSection>

      <DocNote title="O movimento é do comando, e some no gesto">
        <code>flex-grow</code> transiciona — é um <code>&lt;number&gt;</code> —,
        e é ele que a lib escreve na raiz de cada painel. Mas transição durante
        arraste é <strong>atraso</strong>: o painel passaria a perseguir o cursor
        com 200ms de sobra. No teclado é pior, porque cada seta é um passo e a
        repetição de tecla empilharia interpolações.
        <br />
        <br />
        Os dois estados já vêm no <code>data-separator</code> —{" "}
        <code>active</code> enquanto arrasta, <code>focus</code> enquanto o
        teclado manda —, então o grupo lê os dois e zera a duração. Medido:{" "}
        <strong>0,2s em repouso, 0s arrastando, 0s no teclado</strong>. Sobra
        exatamente o caso que é um comando discreto.
        <br />
        <br />
        A duração desce por <code>--resizable-anim</code>, e não por um{" "}
        <code>transition-none</code> empilhado sobre a classe base: as duas
        escreveriam a <em>mesma</em> propriedade no mesmo elemento, e quem
        venceria seria a ordem de emissão do Tailwind. Variável herda e não
        disputa. E a régua mora no <strong>grupo</strong> porque a{" "}
        <code>className</code> do painel cai num <code>div</code>{" "}
        <em>interno</em> — quem carrega o <code>flex-grow</code> é a raiz, que só
        se alcança por seletor de filho.
      </DocNote>

      <DocNote title="Por que o colapsar não pode morar na alça">
        Não é escolha de desenho. A lib liga <code>pointerdown</code>,{" "}
        <code>dblclick</code> e <code>pointerup</code>{" "}
        <strong>no documento, em fase de captura</strong>, e decide por
        hit-testing de ponto. Um botão dentro da alça é
        impossível: a captura do documento dispara antes do handler do botão, e{" "}
        <code>stopPropagation</code> de dentro não alcança um ancestral que já
        correu. Pior — qualquer controle a menos de <strong>22px</strong> da
        costura tem o próprio clique engolido pelo início de um arraste.
      </DocNote>

      <PropsTable
        title="Props · ResizablePanelGroup"
        rows={[
          {
            prop: "orientation",
            type: '"horizontal" | "vertical"',
            default: '"horizontal"',
            description:
              "O eixo em que os painéis se dividem. A costura corre no eixo cruzado dele.",
          },
          {
            prop: "stack",
            type: "boolean",
            default: 'orientation === "horizontal"',
            description:
              "Abaixo de 768px o grupo vira fluxo empilhado, sem arraste e sem foco na costura. O padrão sai da orientação: um grupo vertical num telefone já é uma coluna.",
          },
          {
            prop: "resizeTargetMinimumSize",
            type: "{ coarse: number; fine: number }",
            default: "{ coarse: 44, fine: 10 }",
            description:
              "O alvo de arraste, que a lib expande por DOMRect. 44 é a medida de dedo do sistema — o padrão da lib é 20. fine fica no valor dela.",
          },
          {
            prop: "defaultLayout · onLayoutChanged",
            type: "Layout · (layout, meta) => void",
            description:
              "A proporção inicial e o aviso de que ela mudou. Vêm prontos de useResizableLayout; declarar à mão é para quem guarda a proporção em outro lugar.",
          },
          {
            prop: "disabled",
            type: "boolean",
            default: "false",
            description:
              "Trava as proporções. A costura fica no fio, sem acento e sem pega, e a lib escreve o cursor de bloqueio.",
          },
        ]}
      />

      <PropsTable
        title="Props · ResizableHandle"
        rows={[
          {
            prop: "variant",
            type: '"line" | "grip" | "plain"',
            default: '"line"',
            description:
              "O que a costura desenha em repouso, e nunca o que ela faz: as três acendem igual ao pousar e ao arrastar. plain não desenha nada — para painéis que já têm moldura própria, onde um fio na calha seria a terceira borda em 8px.",
          },
          {
            prop: "aria-label",
            type: "string",
            default: '"Redimensionar painéis"',
            description:
              "O nome do role=separator. Tem padrão em português pela mesma razão que o locale do Calendar tem: um idioma que só vale quando alguém lembra de passar não é o idioma do app.",
          },
          {
            prop: "disableDoubleClick",
            type: "boolean",
            default: "false",
            description:
              "Desliga o duplo-clique que devolve o painel ao defaultSize.",
          },
        ]}
      />

      <PropsTable
        title="Slots"
        rows={[
          {
            prop: "ResizablePanel",
            type: "Panel · div quando empilhado",
            description:
              "A região. defaultSize, minSize, maxSize, collapsible e collapsedSize são da lib. Dê id a cada painel se a proporção for guardada — é por ele que ela é reencontrada. Atenção: a className do painel cai num div interno, por decisão da lib.",
          },
          {
            prop: "ResizableHandle",
            type: "Separator · div aria-hidden quando empilhado",
            description:
              "A costura. Empilhada, ela perde o papel e o foco e vira um fio estático — duas regiões empilhadas sem nada entre elas leem como um bloco só.",
          },
          {
            prop: "ResizableCollapseTrigger",
            type: "Button",
            description:
              "O gatilho de colapso, para o cabeçalho do painel vizinho. side diz de que lado do grupo mora o painel que ele fecha, e é o que decide o sentido da seta.",
          },
          {
            prop: "useResizableLayout",
            type: "({ id, panelIds?, storage? }) => { groupKey, groupProps }",
            description:
              "Lembra a proporção entre carregamentos. Espalhe groupProps no grupo e passe groupKey como key. groupKey fica fora de groupProps porque é key e não prop — no espalhamento ele viraria atributo desconhecido no DOM.",
          },
          {
            prop: "useResizablePanel",
            type: "() => { panelProps, isCollapsed, collapse, expand, toggle }",
            description:
              "O colapso de um painel e o estado dele. isCollapsed da lib é um getter, não uma assinatura reativa — quem re-renderiza é o onResize que vem dentro de panelProps.",
          },
        ]}
      />

      <DocNote title="A região de arraste é da lib desde a v4, e o número era 20">
        A nota anterior dizia que a alça tinha 4px e era &quot;impossível com o
        dedo&quot;. Isso descrevia uma versão que não está instalada: a v4 faz o
        próprio hit-testing, expandindo a caixa da costura por{" "}
        <code>resizeTargetMinimumSize</code> — padrão{" "}
        <code>{"{ coarse: 20, fine: 10 }"}</code>, escolhido por{" "}
        <code>isCoarsePointer()</code>. O <code>after:</code> de 4px do arquivo
        antigo não era o alvo de nada havia uma versão inteira. O que restava de
        verdadeiro é que <strong>20 é menos que os 44 do sistema</strong>, e a
        prop que fecha isso nunca tinha sido plugada.
      </DocNote>

      <DocNote title="O duplo-clique reseta, e ninguém sabia">
        Está ligado de fábrica desde a v4, e nenhuma linha da documentação
        anterior o mencionava. Uma afordância que existe e ninguém vê é igual a
        nenhuma afordância. <code>disableDoubleClick</code> a desliga.
      </DocNote>

      <DocNote title="As setas redimensionam, e o papel estava sem nome">
        A lib liga <code>keydown</code> em cada costura:{" "}
        <code>←</code> <code>→</code> <code>↑</code> <code>↓</code> movem,{" "}
        <code>Home</code> e <code>End</code> vão aos extremos. E os atributos
        que ela emite são <code>aria-controls</code>,{" "}
        <code>aria-orientation</code> e <code>aria-valuemin/max/now</code> —{" "}
        <strong>nenhum nome</strong>. É a medição do <code>Popover</code> outra
        vez: um papel sem nome é anunciado como o papel e nada mais. Aqui era
        pior, porque o teclado funciona: existia um controle operável e sem
        nome.
      </DocNote>

      <DocNote title="A className do grupo era inteiramente inerte">
        O <code>Group</code> declara <code>display</code>,{" "}
        <code>flex-direction</code>, <code>flex-wrap</code>,{" "}
        <code>overflow</code>, <code>height</code> e <code>width</code> por
        estilo inline — o próprio <code>.d.ts</code> avisa que as quatro
        primeiras não podem ser sobrescritas. Inline vence classe, então o{" "}
        <code>flex h-full w-full</code> que o arquivo carregava não fazia nada.
        Junto ia um <code>aria-[orientation=vertical]:flex-col</code> apontando
        para um atributo que o grupo <strong>não emite</strong>: o nó dele só
        carrega <code>data-group</code>, <code>data-testid</code> e{" "}
        <code>id</code>. Consequência prática para quem escreve tela:{" "}
        <strong>a caixa do grupo vem do pai</strong> — as demonstrações desta
        página põem a altura num contêiner, e não numa classe do grupo.
      </DocNote>

      <DocNote title="A orientação vem do contexto, e não do aria-orientation">
        O <code>Separator</code> emite <code>aria-orientation</code>{" "}
        <strong>invertido</strong> em relação ao grupo — grupo horizontal,
        separador vertical. O arquivo antigo dependia dessa inversão para toda a
        geometria e não a registrava em lugar nenhum, que é a armadilha exata
        que faz a próxima pessoa &quot;corrigir&quot; para o lado errado. Hoje a
        geometria sai de uma condicional sobre o contexto do grupo, como o{" "}
        <code>separator.tsx</code> já fazia.
      </DocNote>

      <DocNote title='defaultSize="40" é 40%; defaultSize={40} é 40 pixels'>
        <code>react-resizable-panels</code> v4 interpreta número como pixel e
        string sem unidade como porcentagem. É o contrário do que a v0 e a v1
        faziam, e é a forma mais fácil de acabar com um painel de 40px achando
        que se pediu 40%. Unidade explícita (<code>&quot;40%&quot;</code>,{" "}
        <code>&quot;40px&quot;</code>, <code>&quot;20rem&quot;</code>) tira a
        dúvida.
      </DocNote>

      <DocNote title="O app ainda não usa este componente">
        Nenhuma tela o consome. O candidato honesto é{" "}
        <code>/transactions</code> como lista mais detalhe no desktop — a
        proporção certa entre a lista e o detalhe depende de a pessoa estar
        varrendo ou conferindo, que é exatamente quando um split se paga.
      </DocNote>
    </>
  )
}
