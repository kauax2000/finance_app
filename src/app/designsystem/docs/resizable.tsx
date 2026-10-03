"use client"

import * as React from "react"

import {
  DescriptionDetails,
  DescriptionList,
  DescriptionListItem,
  DescriptionTerm,
} from "@/components/ui/description-list"
import { MoneyDisplay } from "@/components/ui/money-display"
import {
  ResizableCollapseTrigger,
  ResizableColumnHandle,
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  useResizableColumns,
  useResizableLayout,
  useResizablePanel,
} from "@/components/ui/resizable"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

/** Um extrato curto, com o vocabulário do app. */
const EXTRATO = [
  { id: "1", data: "12/03", descricao: "Mercado Pão de Açúcar", categoria: "Alimentação", valor: -284.9 },
  { id: "2", data: "11/03", descricao: "Salário", categoria: "Salário", valor: 8432.15 },
  { id: "3", data: "10/03", descricao: "Uber", categoria: "Transporte", valor: -32.4 },
  { id: "4", data: "08/03", descricao: "Netflix", categoria: "Assinaturas", valor: -39.9 },
]

const CATEGORIAS = ["Alimentação", "Transporte", "Moradia", "Assinaturas", "Lazer"]

/**
 * A caixa do grupo vem do pai — ver a nota "A caixa do grupo vem do pai". A
 * altura só existe a partir de `md`: empilhado, o grupo tem a altura do
 * conteúdo, e um palco fixo deixaria vão morto abaixo dele no telefone.
 */
function Palco({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("w-full md:h-48", className)}>{children}</div>
}

function Rotulo({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full items-center justify-center p-4 text-sm text-muted-foreground">
      {children}
    </div>
  )
}

function Extrato({ ativo }: { ativo: string }) {
  return (
    <ul className="flex h-full flex-col overflow-hidden p-1.5">
      {EXTRATO.map((t) => (
        <li
          key={t.id}
          className={cn(
            "flex items-baseline justify-between gap-3 rounded-md px-2.5 py-2 text-sm",
            t.id === ativo && "bg-muted"
          )}
        >
          <span className="min-w-0 truncate text-foreground">{t.descricao}</span>
          <MoneyDisplay
            value={t.valor}
            tone={t.valor > 0 ? "income" : "default"}
            signed={t.valor > 0}
            className="shrink-0"
          />
        </li>
      ))}
    </ul>
  )
}

function Detalhe() {
  const t = EXTRATO[0]
  return (
    <div className="h-full overflow-hidden p-4">
      <DescriptionList>
        <DescriptionListItem>
          <DescriptionTerm>Descrição</DescriptionTerm>
          <DescriptionDetails>{t.descricao}</DescriptionDetails>
        </DescriptionListItem>
        <DescriptionListItem>
          <DescriptionTerm>Categoria</DescriptionTerm>
          <DescriptionDetails>{t.categoria}</DescriptionDetails>
        </DescriptionListItem>
        <DescriptionListItem>
          <DescriptionTerm>Valor</DescriptionTerm>
          <DescriptionDetails>
            <MoneyDisplay value={t.valor} />
          </DescriptionDetails>
        </DescriptionListItem>
      </DescriptionList>
    </div>
  )
}

function DemoExtrato() {
  const layout = useResizableLayout({ id: "ds-demo-resizable" })
  return (
    <Palco>
      <ResizablePanelGroup
        key={layout.groupKey}
        {...layout.groupProps}
        className="rounded-lg border border-border"
      >
        <ResizablePanel id="extrato" defaultSize="45" minSize="30">
          <Extrato ativo="1" />
        </ResizablePanel>
        <ResizableHandle variant="grip" />
        <ResizablePanel id="detalhe" minSize="30">
          <Detalhe />
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
          defaultSize="30"
          minSize="20"
        >
          <ul className="flex flex-col gap-0.5 p-1.5 text-sm">
            {CATEGORIAS.map((c, i) => (
              <li
                key={c}
                className={cn("truncate rounded-md px-2.5 py-1.5", i === 0 ? "bg-muted text-foreground" : "text-muted-foreground")}
              >
                {c}
              </li>
            ))}
          </ul>
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel minSize="40">
          <div className="flex h-full flex-col">
            {/* A folga até a costura é do **dedo**, não do cursor: a zona de
                arraste é `{ coarse: 44, fine: 10 }`, então ela pede 22px de
                folga no toque e 5 no mouse. */}
            <div className="flex items-center gap-2 p-2 pointer-coarse:ps-6">
              <ResizableCollapseTrigger
                collapsed={lateral.isCollapsed}
                side="start"
                onClick={lateral.toggle}
                aria-label={lateral.isCollapsed ? "Mostrar categorias" : "Esconder categorias"}
              />
              <span className="text-sm font-medium text-foreground">Alimentação</span>
            </div>
            <Extrato ativo="" />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </Palco>
  )
}

/** As colunas da tabela de exemplo. A descrição não tem largura: ela é a folga. */
const COLUNAS = {
  data: { width: 88, min: 72, max: 140 },
  categoria: { width: 144, min: 96, max: 240 },
  valor: { width: 128, min: 96, max: 200 },
}

function DemoColunas() {
  const cols = useResizableColumns({ id: "ds-demo-colunas", columns: COLUNAS })
  return (
    <Table variant="outline" size="sm" style={cols.tableStyle}>
      <TableHeader>
        <TableRow>
          <TableHead style={cols.columnStyle("data")}>
            Data
            <ResizableColumnHandle {...cols.handleProps("data", "Data")} />
          </TableHead>
          <TableHead>Descrição</TableHead>
          <TableHead style={cols.columnStyle("categoria")}>
            Categoria
            <ResizableColumnHandle {...cols.handleProps("categoria", "Categoria")} />
          </TableHead>
          <TableHead numeric style={cols.columnStyle("valor")}>
            Valor
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {EXTRATO.map((t) => (
          <TableRow key={t.id}>
            <TableCell className="nums text-muted-foreground">{t.data}</TableCell>
            <TableCell className="truncate">{t.descricao}</TableCell>
            <TableCell className="truncate text-muted-foreground">{t.categoria}</TableCell>
            <TableCell numeric>
              <MoneyDisplay value={t.valor} tone={t.valor > 0 ? "income" : "default"} signed={t.valor > 0} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export default function ResizableDoc() {
  return (
    <>
      <Usage>
        Regiões lado a lado cuja proporção a pessoa decide — o extrato ao lado do detalhe, uma coluna de tabela que precisa de mais espaço —, numa tela onde ela passa muito tempo. Se a proporção é a mesma para todo mundo, é <code>grid</code>; se só uma região aparece por vez, é <code>Tabs</code>; se a segunda é uma interrupção, é <code>Sheet</code>. A barra lateral redimensionável é a <code>Sidebar</code> com <code>resizable</code>, que monta este componente por dentro.
      </Usage>

      <DocSection
        title="Extrato e detalhe"
        description="Duas regiões e uma costura com pega. Arraste, dê duplo-clique para voltar ao padrão, e recarregue a página: com useResizableLayout a proporção é lembrada."
        code={`const layout = useResizableLayout({ id: "transacoes" })

<ResizablePanelGroup key={layout.groupKey} {...layout.groupProps}>
  <ResizablePanel id="extrato" defaultSize="45" minSize="30">…</ResizablePanel>
  <ResizableHandle variant="grip" />
  <ResizablePanel id="detalhe" minSize="30">…</ResizablePanel>
</ResizablePanelGroup>`}
        previewClassName="flex-col flex-nowrap items-stretch p-6"
      >
        <DemoExtrato />
      </DocSection>

      <DocSection
        title="As três costuras"
        description="A variante decide o que a costura desenha em repouso, nunca o que ela faz: as três acendem igual ao pousar e arrastar. line é o fio (o padrão), grip soma a pega para o split que a pessoa deve ajustar, plain não desenha nada para painéis que já têm moldura."
        code={`<ResizableHandle />                  {/* line, o padrão */}
<ResizableHandle variant="grip" />
<ResizableHandle variant="plain" />`}
        previewClassName="flex-col flex-nowrap items-stretch p-6"
      >
        <Palco className="md:h-28">
          <ResizablePanelGroup className="rounded-lg border border-border">
            <ResizablePanel minSize="15">
              <Rotulo>line →</Rotulo>
            </ResizablePanel>
            <ResizableHandle />
            <ResizablePanel minSize="15">
              <Rotulo>grip →</Rotulo>
            </ResizablePanel>
            <ResizableHandle variant="grip" />
            <ResizablePanel minSize="15">
              <Rotulo>plain →</Rotulo>
            </ResizablePanel>
            <ResizableHandle variant="plain" />
            <ResizablePanel minSize="15">
              <Rotulo>fim</Rotulo>
            </ResizablePanel>
          </ResizablePanelGroup>
        </Palco>
      </DocSection>

      <DocSection
        title="Aninhados, e na vertical"
        description="Um grupo dentro de um painel de outro. Na vertical a costura corre deitada e a pega gira junto: o gráfico em cima, os lançamentos embaixo, ao lado das categorias."
        code={`<ResizablePanelGroup>
  <ResizablePanel defaultSize="30">…</ResizablePanel>
  <ResizableHandle />
  <ResizablePanel>
    <ResizablePanelGroup orientation="vertical">
      <ResizablePanel defaultSize="45">…</ResizablePanel>
      <ResizableHandle variant="grip" />
      <ResizablePanel>…</ResizablePanel>
    </ResizablePanelGroup>
  </ResizablePanel>
</ResizablePanelGroup>`}
        previewClassName="flex-col flex-nowrap items-stretch p-6"
      >
        <div className="w-full md:h-64">
          <ResizablePanelGroup className="rounded-lg border border-border">
            <ResizablePanel defaultSize="30" minSize="20">
              <Rotulo>Categorias</Rotulo>
            </ResizablePanel>
            <ResizableHandle />
            <ResizablePanel minSize="40">
              <ResizablePanelGroup orientation="vertical">
                <ResizablePanel defaultSize="45" minSize="20">
                  <Rotulo>Gráfico do mês</Rotulo>
                </ResizablePanel>
                <ResizableHandle variant="grip" />
                <ResizablePanel minSize="20">
                  <Rotulo>Lançamentos</Rotulo>
                </ResizablePanel>
              </ResizablePanelGroup>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </DocSection>

      <DocSection
        title="Limites em unidade fixa"
        description="Uma lateral não deve ser 30% de uma tela de 2.000px. Com unidade, o painel mede o que o conteúdo pede em qualquer largura de janela: aqui entre 10 e 18rem, começando em 12, e o outro lado absorve a sobra."
        code={`<ResizablePanel defaultSize="12rem" minSize="10rem" maxSize="18rem">…</ResizablePanel>
<ResizableHandle />
<ResizablePanel>…</ResizablePanel>`}
        previewClassName="flex-col flex-nowrap items-stretch p-6"
      >
        <Palco className="md:h-28">
          <ResizablePanelGroup className="rounded-lg border border-border">
            <ResizablePanel defaultSize="12rem" minSize="10rem" maxSize="18rem">
              <Rotulo>10 a 18rem</Rotulo>
            </ResizablePanel>
            <ResizableHandle />
            <ResizablePanel>
              <Rotulo>O resto</Rotulo>
            </ResizablePanel>
          </ResizablePanelGroup>
        </Palco>
      </DocSection>

      <DocNote title='defaultSize="40" é 40%; defaultSize={40} é 40 pixels'>
        Na v4, número é pixel e string sem unidade é porcentagem. Na dúvida, escreva a unidade: <code>&quot;40%&quot;</code>, <code>&quot;40px&quot;</code>, <code>&quot;12rem&quot;</code>, <code>&quot;30vw&quot;</code>.
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

      <DocNote title="O colapsar não mora na alça, e o movimento é do comando">
        A lib captura o ponteiro no documento antes de qualquer botão: um botão na alça nunca recebe o clique, e controle a menos de <strong>22px</strong> da costura tem o clique engolido pelo arraste. E o colapso anima, mas arrastar e usar as setas não — transição ali vira atraso atrás do cursor. A duração desce por <code>--resizable-anim</code> no grupo.
      </DocNote>

      <DocSection
        title="Colunas de tabela"
        description="A mesma costura no cabeçalho de uma Table: nada em repouso, o fio ao pousar na célula, o acento ao pousar e ao arrastar. Setas movem 8px (com Shift, 32), Home e End vão aos limites, Enter e o duplo-clique voltam ao padrão. A descrição não tem largura: ela é a folga. Com id, as larguras são lembradas."
        code={`const cols = useResizableColumns({
  id: "transacoes",
  columns: {
    data: { width: 88, min: 72, max: 140 },
    categoria: { width: 144, min: 96, max: 240 },
  },
})

<Table style={cols.tableStyle}>
  <TableHeader>
    <TableRow>
      <TableHead style={cols.columnStyle("data")}>
        Data
        <ResizableColumnHandle {...cols.handleProps("data", "Data")} />
      </TableHead>
      <TableHead>Descrição</TableHead>
      …`}
        previewClassName="flex-col flex-nowrap items-stretch p-6"
      >
        <DemoColunas />
      </DocSection>

      <DocNote title="Colunas não são painéis, e o arraste é nosso">
        Os painéis da lib são caixas flex; numa tabela quem manda na largura de uma coluna é a célula da primeira linha, sob <code>table-layout: fixed</code>. Por isso <code>useResizableColumns</code> faz o próprio arraste (<code>pointer</code> com captura, <code>touch-action: none</code> para o dedo não rolar a tabela) e a costura é um <code>role=&quot;separator&quot;</code> com <code>aria-valuenow</code> em pixel. <strong>Uma coluna fica sem largura</strong> e absorve a sobra — sem ela, a sobra se repartiria entre todas e a costura escorregaria do cursor —, e o piso dela (<code>fluidMinWidth</code>, 192px) entra no <code>min-width</code> da tabela: abaixo disso a <code>Table</code> rola na horizontal. O alvo é de 10px no mouse e 24 no dedo, e não 44: numa coluna de 88px, 44 cobririam metade do rótulo e o clique de ordenar passaria a arrastar.
      </DocNote>

      <DocNote title="Um split é móvel de desktop">
        Abaixo de 768px o grupo horizontal <strong>empilha</strong> (<code>useIsMobile</code>), como o <code>Sheet</code> troca painel por gaveta: os painéis soltam as proporções e a costura vira um fio sem papel nem foco. Um grupo vertical mantém as alças, porque no telefone ele já é uma coluna, e <code>stack=&#123;false&#125;</code> desliga. <strong>Nenhuma tela escreve <code>isMobile</code></strong>. As colunas de tabela não empilham: a <code>Table</code> já rola na horizontal no telefone.
      </DocNote>

      <DocNote title="O realce não reflui os painéis">
        O acento é um <code>::before</code> absoluto de 2px e só a cor transiciona; engrossar a alça de verdade refluiria os dois painéis a cada passagem do cursor. A pega tem 70% de <code>--muted-foreground</code>, o primeiro degrau que alcança 3:1 nos dois temas (3,16 e 4,05).
      </DocNote>

      <DocNote title="Teclado: setas, Home e End">
        Com foco na costura, as setas movem e <code>Home</code>/<code>End</code> vão aos extremos; o duplo-clique volta ao <code>defaultSize</code> (<code>disableDoubleClick</code> desliga). Por isso a costura tem <code>aria-label</code>: controle operável sem nome é anunciado só como o papel.
      </DocNote>

      <DocNote title="A caixa do grupo vem do pai, e a orientação vem do contexto">
        O grupo declara display, direção e medidas por estilo inline, que vence classe: ponha a altura num contêiner. E o <code>Separator</code> da lib emite <code>aria-orientation</code> invertido em relação ao grupo; a geometria sai do contexto, e &quot;corrigir&quot; pelo atributo inverte o desenho.
      </DocNote>

      <DocNote title="Onde o app usa">
        Nenhuma tela ainda. O único consumidor é a <code>Sidebar resizable</code>, que o catálogo demonstra; a casca do app usa o trilho fixo. A proporção guardada remonta o grupo uma vez na hidratação (<code>groupKey</code>), porque a lib só lê o <code>defaultLayout</code> na montagem — quem não quer pagar guarda a proporção em cookie e a entrega pelo servidor.
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
            description: "Abaixo de 768px empilha, sem arraste e sem foco na costura.",
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
        title="Props · ResizablePanel"
        rows={[
          {
            prop: "defaultSize · minSize · maxSize",
            type: "number | string",
            description: "Número é pixel; string sem unidade é %; com unidade, px, %, em, rem, vh ou vw.",
          },
          {
            prop: "collapsible · collapsedSize",
            type: "boolean · number | string",
            default: "false · 0",
            description: "Arrastar abaixo do mínimo fecha o painel até collapsedSize. O gatilho é useResizablePanel.",
          },
          {
            prop: "id",
            type: "string",
            description: "Obrigatório quando a proporção é guardada: é por ele que ela é reencontrada.",
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
            description: "O que a costura desenha em repouso.",
          },
          {
            prop: "aria-label",
            type: "string",
            default: '"Redimensionar painéis"',
            description: "O nome do role=separator, com padrão em português.",
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
        title="Hooks e peças"
        rows={[
          {
            prop: "useResizableLayout",
            type: "({ id, panelIds?, storage? }) => { groupKey, groupProps }",
            description: "Lembra a proporção: espalhe groupProps no grupo e passe groupKey como key.",
          },
          {
            prop: "useResizablePanel",
            type: "() => { panelProps, isCollapsed, collapse, expand, toggle }",
            description: "O colapso de um painel e o estado dele.",
          },
          {
            prop: "ResizableCollapseTrigger",
            type: "Button · { collapsed, side }",
            description: "O gatilho de colapso, no cabeçalho do painel vizinho.",
          },
          {
            prop: "useResizableColumns",
            type: "({ id?, columns, fluidMinWidth? }) => { tableStyle, columnStyle, handleProps, widths }",
            description: "As larguras das colunas de uma Table. columns é { chave: { width, min?, max? } } em px; a coluna fora dele é a folga.",
          },
          {
            prop: "ResizableColumnHandle",
            type: "handleProps(chave, rótulo)",
            description: "A costura na borda direita de um TableHead, que se posiciona sozinho quando ela está dentro.",
          },
        ]}
      />
    </>
  )
}
