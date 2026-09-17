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
    "Nada em repouso; acende ao pousar e arrastar. Para painéis com moldura própria.",
  ],
] as const

/**
 * A caixa do grupo vem do pai — ver a nota "A caixa do grupo vem do pai". A altura
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
        Duas regiões lado a lado cuja proporção a pessoa decide — um extrato ao lado do detalhe, numa tela onde ela passa muito tempo. Se a proporção é a mesma para todo mundo, é <code>grid</code>; se só uma região aparece por vez, é <code>Tabs</code>; se a segunda é uma interrupção, é <code>Sheet</code>.
      </Usage>

      <DocSection
        title="Padrão"
        description="Duas regiões e uma costura. Arraste, solte, e dê duplo-clique para voltar ao padrão."
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
        description="A variante decide o que a costura desenha em repouso, nunca o que ela faz: as três acendem igual ao pousar e arrastar."
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

      <DocNote title="O realce não reflui os painéis">
        O acento é um <code>::before</code> absoluto de 2px e só a cor transiciona; engrossar a alça de verdade refluiria os dois painéis a cada passagem do cursor.
      </DocNote>

      <DocSection
        title="Vertical"
        description="A costura corre no eixo cruzado do grupo, e a pega gira junto."
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
        description="Abaixo de 768px o grupo horizontal empilha: os painéis soltam as proporções e a costura deixa de arrastar e de receber foco. Um grupo vertical mantém as alças, porque no telefone ele já é uma coluna."
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
        O componente empilha sozinho abaixo de 768px (<code>useIsMobile</code>), como o <code>Sheet</code> troca painel por gaveta. <strong>Nenhuma tela escreve <code>isMobile</code></strong>.
      </DocNote>

      <DocSection
        title="Lembrar a proporção"
        description="Arraste a costura e recarregue a página. Um split que reseta a cada navegação é um split que ninguém ajusta."
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

      <DocNote title="Proporção guardada remonta o grupo uma vez">
        A lib só lê o <code>defaultLayout</code> na montagem, e a proporção guardada chega na hidratação. <code>groupKey</code> troca uma vez e remonta o grupo; é <code>key</code> explícito para o custo ficar à vista. Quem não quer pagar guarda a proporção em cookie e a entrega pelo servidor.
      </DocNote>

      <DocSection
        title="Colapsar um painel"
        description="O gatilho mora no cabeçalho do painel vizinho, não na costura. O colapso desliza em 200ms porque é um comando; arrastar abaixo do mínimo também fecha, porque o painel é collapsible."
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
        O colapso anima; arrastar e usar as setas, não — transição ali vira atraso atrás do cursor. A duração desce por <code>--resizable-anim</code> no grupo.
      </DocNote>

      <DocNote title="O colapsar não mora na alça">
        A lib captura o ponteiro no documento antes de qualquer botão: um botão na alça nunca recebe o clique, e controle a menos de <strong>22px</strong> da costura tem o clique engolido pelo arraste.
      </DocNote>

      <PropsTable
        title="Props · ResizablePanelGroup"
        rows={[
          {
            prop: "orientation",
            type: '"horizontal" | "vertical"',
            default: '"horizontal"',
            description: "O eixo em que os painéis se dividem; a costura corre no eixo cruzado.",
          },
          {
            prop: "stack",
            type: "boolean",
            default: 'orientation === "horizontal"',
            description: "Abaixo de 768px empilha, sem arraste e sem foco na costura. O padrão sai da orientação: um grupo vertical já é uma coluna.",
          },
          {
            prop: "resizeTargetMinimumSize",
            type: "{ coarse: number; fine: number }",
            default: "{ coarse: 44, fine: 10 }",
            description: "O alvo de arraste em px; 44 é o alvo de dedo do sistema (a lib usaria 20).",
          },
          {
            prop: "defaultLayout · onLayoutChanged",
            type: "Layout · (layout, meta) => void",
            description: "A proporção inicial e o aviso de mudança. Vêm prontos de useResizableLayout.",
          },
          {
            prop: "disabled",
            type: "boolean",
            default: "false",
            description: "Trava as proporções: a costura fica no fio, sem acento nem pega.",
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
            description: "O que a costura desenha em repouso. plain não desenha nada — para painéis que já têm moldura própria.",
          },
          {
            prop: "aria-label",
            type: "string",
            default: '"Redimensionar painéis"',
            description: "O nome do role=separator. Tem padrão em português para valer sem ninguém lembrar de passar.",
          },
          {
            prop: "disableDoubleClick",
            type: "boolean",
            default: "false",
            description: "Desliga o duplo-clique que devolve o painel ao defaultSize.",
          },
        ]}
      />

      <PropsTable
        title="Slots"
        rows={[
          {
            prop: "ResizablePanel",
            type: "Panel · div quando empilhado",
            description: "A região. Dê id a cada painel se a proporção for guardada. A className cai num div interno, por decisão da lib.",
          },
          {
            prop: "ResizableHandle",
            type: "Separator · div aria-hidden quando empilhado",
            description: "A costura. Empilhada, perde papel e foco e vira um fio estático.",
          },
          {
            prop: "ResizableCollapseTrigger",
            type: "Button",
            description: "O gatilho de colapso, no cabeçalho do painel vizinho. side diz de que lado mora o painel que ele fecha.",
          },
          {
            prop: "useResizableLayout",
            type: "({ id, panelIds?, storage? }) => { groupKey, groupProps }",
            description: "Lembra a proporção entre carregamentos: espalhe groupProps no grupo e passe groupKey como key.",
          },
          {
            prop: "useResizablePanel",
            type: "() => { panelProps, isCollapsed, collapse, expand, toggle }",
            description: "O colapso de um painel e o estado dele; quem re-renderiza é o onResize dentro de panelProps.",
          },
        ]}
      />

      <DocNote title="Teclado: setas, Home e End">
        Com foco na costura, as setas movem e <code>Home</code>/<code>End</code> vão aos extremos; o duplo-clique volta ao <code>defaultSize</code> (<code>disableDoubleClick</code> desliga). Por isso a costura tem <code>aria-label</code>: controle operável sem nome é anunciado só como o papel.
      </DocNote>

      <DocNote title="A caixa do grupo vem do pai">
        O grupo declara display, direção e medidas por estilo inline, que vence classe. Ponha a altura num contêiner.
      </DocNote>

      <DocNote title="A orientação vem do contexto, não do aria-orientation">
        O <code>Separator</code> emite <code>aria-orientation</code> invertido em relação ao grupo; a geometria sai do contexto, e &quot;corrigir&quot; pelo atributo inverte o desenho.
      </DocNote>

      <DocNote title='defaultSize="40" é 40%; defaultSize={40} é 40 pixels'>
        Na v4, número é pixel e string sem unidade é porcentagem. Na dúvida, escreva a unidade: <code>&quot;40%&quot;</code>, <code>&quot;40px&quot;</code>, <code>&quot;20rem&quot;</code>.
      </DocNote>

    </>
  )
}
