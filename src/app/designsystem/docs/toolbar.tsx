"use client"

import * as React from "react"
import {
  ArrowDownTrayIcon,
  ArrowsUpDownIcon,
  PlusIcon,
  PrinterIcon,
  ShareIcon,
  TagIcon,
} from "@heroicons/react/16/solid"

import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  Toolbar,
  ToolbarActions,
  ToolbarButton,
  ToolbarChips,
  ToolbarCount,
  ToolbarFilterButton,
  ToolbarFilters,
  ToolbarSearch,
  type ToolbarChip,
} from "@/components/ui/toolbar"
import { TopBar, TopBarTitle } from "@/components/ui/top-bar"
import { PhoneFrame } from "../ds-frame"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

const DEGRAUS = ["sm", "md", "lg"] as const
const TECLADO = ["livre", "toolbar"] as const

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

const LANCAMENTOS = [
  "Mercado Pão de Açúcar",
  "Uber",
  "Farmácia São João",
  "Spotify",
  "Padaria Real",
  "Posto Ipiranga",
  "Cinema",
  "Restaurante Coco Bambu",
  "Amazon",
  "Luz — Enel",
  "Internet — Vivo",
  "Academia",
]

/** Os eixos numa barra só: o degrau e o teclado. */
function DemoNaTela() {
  const [size, setSize] = React.useState<(typeof DEGRAUS)[number]>("md")
  const [teclado, setTeclado] = React.useState<(typeof TECLADO)[number]>("livre")

  return (
    <div className="flex w-full flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <Eixo rotulo="Degrau" valores={DEGRAUS} valor={size} onChange={setSize} />
        <Eixo rotulo="Teclado" valores={TECLADO} valor={teclado} onChange={setTeclado} />
      </div>
      <Toolbar
        size={size}
        keyboard={teclado === "toolbar"}
        aria-label="Lançamentos"
        className="w-full"
      >
        <ToolbarFilters>
          <Tabs defaultValue="todas">
            <TabsList aria-label="Tipo" size={size} stretch={false}>
              <TabsTrigger value="todas">Todas</TabsTrigger>
              <TabsTrigger value="despesas">Despesas</TabsTrigger>
              <TabsTrigger value="receitas">Receitas</TabsTrigger>
            </TabsList>
          </Tabs>
        </ToolbarFilters>
        <ToolbarActions>
          <Button variant="outline" size="icon-md" aria-label="Exportar">
            <ArrowDownTrayIcon aria-hidden />
          </Button>
          <ToolbarFilterButton count={2} />
          <Button>
            <PlusIcon aria-hidden />
            nova transação
          </Button>
        </ToolbarActions>
      </Toolbar>
    </div>
  )
}

function DemoFichas() {
  const inicial: ToolbarChip[] = [
    { key: "tipo", label: "Despesas", onRemove: () => {} },
    { key: "cat", label: "Categoria: Mercado", onRemove: () => {} },
    { key: "cartao", label: "Cartão: Nubank", onRemove: () => {} },
    { key: "valor", label: "Valor: ≥ R$ 50,00", onRemove: () => {} },
  ]
  const [fichas, setFichas] = React.useState(inicial.map((f) => f.key))
  const itens = inicial
    .filter((f) => fichas.includes(f.key))
    .map((f) => ({ ...f, onRemove: () => setFichas((v) => v.filter((k) => k !== f.key)) }))

  return (
    <Toolbar className="w-full">
      <ToolbarFilters>
        <ToolbarFilterButton count={itens.length} />
      </ToolbarFilters>
      <ToolbarActions>
        <Button variant="tertiary" onClick={() => setFichas(inicial.map((f) => f.key))}>
          repor as fichas
        </Button>
      </ToolbarActions>
      <ToolbarChips items={itens} onClearAll={() => setFichas([])} max={3} />
    </Toolbar>
  )
}

function DemoBusca() {
  const [q, setQ] = React.useState("")
  const sem = (t: string) => t.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase()
  const achados = LANCAMENTOS.filter((l) => sem(l).includes(sem(q)))

  return (
    <div className="flex w-full flex-col gap-3">
      <Toolbar>
        <ToolbarFilters>
          <ToolbarSearch
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onClear={() => setQ("")}
            placeholder="Buscar na descrição"
            aria-label="Buscar na descrição"
          />
          <ToolbarCount count={achados.length} noun={["lançamento", "lançamentos"]} />
        </ToolbarFilters>
      </Toolbar>
      <ul className="flex flex-wrap gap-1.5 text-sm text-muted-foreground">
        {achados.map((l) => (
          <li key={l}>{l}</li>
        ))}
      </ul>
    </div>
  )
}

function DemoExcesso() {
  return (
    <div className="w-full max-w-full min-w-64 resize-x overflow-hidden rounded-xl border border-dashed border-border p-3">
      <Toolbar>
        <ToolbarFilters>
          <Tabs defaultValue="abertas">
            <TabsList aria-label="Situação" stretch={false}>
              <TabsTrigger value="abertas">Abertas</TabsTrigger>
              <TabsTrigger value="pagas">Pagas</TabsTrigger>
            </TabsList>
          </Tabs>
        </ToolbarFilters>
        <ToolbarActions overflow="menu">
          <ToolbarButton icon={<PrinterIcon aria-hidden />} label="imprimir" />
          <ToolbarButton icon={<ShareIcon aria-hidden />} label="compartilhar" />
          <ToolbarButton icon={<TagIcon aria-hidden />} label="etiquetar" />
          <ToolbarButton icon={<ArrowDownTrayIcon aria-hidden />} label="exportar" />
          <Button>
            <PlusIcon aria-hidden />
            nova conta
          </Button>
        </ToolbarActions>
      </Toolbar>
    </div>
  )
}

function DemoPresa() {
  return (
    <div className="h-80 w-full overflow-y-auto rounded-xl border border-border">
      <div className="flex flex-col gap-3 p-4">
        <p className="text-sm text-muted-foreground">
          Role a caixa: a barra prende no topo dela e só então ganha a placa.
        </p>
        <Toolbar sticky className="[--toolbar-bleed:--spacing(4)]">
          <ToolbarFilters>
            <Tabs defaultValue="todas">
              <TabsList aria-label="Tipo" stretch={false}>
                <TabsTrigger value="todas">Todas</TabsTrigger>
                <TabsTrigger value="despesas">Despesas</TabsTrigger>
              </TabsList>
            </Tabs>
          </ToolbarFilters>
          <ToolbarActions>
            <ToolbarFilterButton count={1} />
          </ToolbarActions>
        </Toolbar>
        <Linhas />
      </div>
    </div>
  )
}

function Linhas() {
  return (
    <ul className="flex flex-col divide-y divide-border text-sm">
      {[...LANCAMENTOS, ...LANCAMENTOS].map((l, i) => (
        <li key={i} className="py-3">
          {l}
        </li>
      ))}
    </ul>
  )
}

/** O telefone: o comando que encolhe, o ponto do filtro e a barra que some ao rolar. */
function DemoTelefone() {
  return (
    <PhoneFrame>
      <div className="h-full overflow-y-auto bg-background">
        <TopBar position="sticky" size="sm">
          <TopBarTitle>Transações</TopBarTitle>
        </TopBar>
        <div className="flex flex-col gap-3 px-4 pt-3">
          <Toolbar sticky="hide" className="[--toolbar-bleed:--spacing(4)]">
            <ToolbarFilters>
              <Tabs defaultValue="todas" className="min-w-0 flex-1">
                <TabsList aria-label="Tipo">
                  <TabsTrigger value="todas">Todas</TabsTrigger>
                  <TabsTrigger value="despesas">Despesas</TabsTrigger>
                  <TabsTrigger value="receitas">Receitas</TabsTrigger>
                </TabsList>
              </Tabs>
            </ToolbarFilters>
            <ToolbarActions>
              <ToolbarFilterButton count={2} />
              <ToolbarButton collapse icon={<ArrowsUpDownIcon aria-hidden />} label="ordenar" />
            </ToolbarActions>
          </Toolbar>
          <Linhas />
        </div>
      </div>
    </PhoneFrame>
  )
}

export default function ToolbarDoc() {
  return (
    <>
      <Usage>
        A linha entre o título da página e a lista: filtros de um lado, ações do outro. Não é a barra do topo da janela (<code>TopBar</code>) nem a tira de um cartão (<code>CardToolbar</code>).
      </Usage>

      <DocSection
        title="A barra"
        description="Filtros à esquerda, ações à direita — quem empurra é a ms-auto do ToolbarActions, e não um justify na raiz. Os controles não pedem altura: o filho direto de uma peça da barra lê --toolbar-control sozinho. keyboard dá o teclado de toolbar."
        code={`<Toolbar size="md" aria-label="Lançamentos">
  <ToolbarFilters>
    <Tabs defaultValue="todas">
      <TabsList stretch={false}>…</TabsList>
    </Tabs>
  </ToolbarFilters>
  <ToolbarActions>
    <Button variant="outline" size="icon-md" aria-label="Exportar">…</Button>
    <ToolbarFilterButton count={2} />
    <Button>Nova transação</Button>
  </ToolbarActions>
</Toolbar>`}
        previewClassName="items-stretch"
      >
        <DemoNaTela />
      </DocSection>

      <DocNote title="A altura chega sem className">
        Um <code>Button</code> (o de ícone em largura e altura), um <code>SelectTrigger</code>, um <code>ComboboxTrigger</code> ou um <code>SearchInput</code> que é filho direto de <code>Toolbar</code>, <code>ToolbarFilters</code>, <code>ToolbarActions</code>, <code>ToolbarRow</code> ou de um <code>ButtonGroup</code> mede o degrau da barra. Só filho direto: o × de uma busca e o de uma ficha também são <code>Button</code>. Embrulhado num <code>div</code> da tela, o controle volta a pedir <code>toolbarControlClassName</code>. O <code>Tabs</code> fala a escada pelo próprio <code>size</code>.
      </DocNote>

      <DocNote title="O menor fica por fora">
        No grupo da direita os botões vão do menor para o maior, de fora para dentro: o só de ícone (e o que encolhe no telefone) abre a fileira, e a ação principal a fecha, na borda. É a ordem do código, e não um <code>order</code> de CSS — o Tab segue o que se vê.
      </DocNote>

      <DocNote title="O teclado de toolbar">
        Com <code>keyboard</code> a barra é <code>role=&quot;toolbar&quot;</code>: uma parada de Tab, as setas andam entre os controles, Home e End vão às pontas. Um campo de texto guarda as setas para o cursor, e o <code>Tabs</code> cuida das dele — a aba ativa é a parada dele dentro da barra. Sem <code>keyboard</code> não há papel: anunciar um widget que não existe é pior que não anunciar nada.
      </DocNote>

      <DocSection
        title="O botão de filtros"
        description="Rotulado, a marca é a contagem — ela diz quantos. No telefone ele encolhe ao ícone e a marca vira o ponto. O nome já carrega o estado: Filtros — 2 ativos."
        code={`<ToolbarFilterButton count={2} onClick={abrirFiltros} />
<ToolbarFilterButton active />   {/* há filtro, sem número */}`}
      >
        <Toolbar>
          <ToolbarFilterButton />
          <ToolbarFilterButton count={1} />
          <ToolbarFilterButton count={3} />
        </Toolbar>
      </DocSection>

      <DocSection
        title="No telefone"
        description="ToolbarButton collapse fica só com o ícone abaixo de md, e o rótulo continua sendo o nome — uma árvore só, no lugar do par md:hidden / hidden md:flex. sticky=&quot;hide&quot; prende sob a barra do topo e some ao rolar para baixo; volta ao subir."
        code={`<Toolbar sticky="hide">
  <ToolbarFilters>…</ToolbarFilters>
  <ToolbarActions>
    <ToolbarFilterButton count={2} />
    <ToolbarButton collapse icon={<ArrowsUpDownIcon />} label="Ordenar" />
  </ToolbarActions>
</Toolbar>`}
      >
        <DemoTelefone />
      </DocSection>

      <DocSection
        title="Presa"
        description="sticky prende logo abaixo da barra do topo (a base medida da TopBar, mais 8px) e só presa ganha a placa: a tinta de barra e o fio de baixo. A placa sobra 8px de cada lado da fileira, então prender não muda a altura e a página não pula. --toolbar-bleed a estende até a calha."
        code={`<Toolbar sticky className="[--toolbar-bleed:--spacing(4)]">…</Toolbar>`}
        previewClassName="items-stretch"
      >
        <DemoPresa />
      </DocSection>

      <DocSection
        title="As fichas dos filtros"
        description="ToolbarChips é a linha própria sob a barra com o que está aplicado. Cada ficha sai no ×, o foco vai para a vizinha; com max, o resto recolhe em +N; Limpar tudo aparece a partir de duas."
        code={`<Toolbar>
  <ToolbarFilters>…</ToolbarFilters>
  <ToolbarActions>…</ToolbarActions>
  <ToolbarChips
    items={[{ key: "cat", label: "Categoria: Mercado", onRemove: () => … }]}
    onClearAll={limpar}
    max={3}
  />
</Toolbar>`}
        previewClassName="items-stretch"
      >
        <DemoFichas />
      </DocSection>

      <DocSection
        title="A busca e a contagem"
        description="ToolbarSearch é o SearchInput que cresce no grupo, com / para focar fora de um campo. ToolbarCount diz quantos sobraram, numa região viva."
        code={`<ToolbarFilters>
  <ToolbarSearch value={q} onChange={…} onClear={() => setQ("")} />
  <ToolbarCount count={achados.length} noun={["lançamento", "lançamentos"]} />
</ToolbarFilters>`}
        previewClassName="items-stretch"
      >
        <DemoBusca />
      </DocSection>

      <DocSection
        title="O excesso vai para o ⋯"
        description="Com overflow=&quot;menu&quot;, os botões que não cabem saem do começo para o fim e viram itens do ⋯ — que clicam o próprio botão, então o onClick e o diálogo são os mesmos. A última ação nunca sai, e gatilho de menu não sai (ele abre no pointerdown). Arraste o canto da caixa."
        code={`<ToolbarActions overflow="menu">
  <ToolbarButton icon={<PrinterIcon />} label="Imprimir" onClick={…} />
  <ToolbarButton icon={<ShareIcon />} label="Compartilhar" onClick={…} />
  <Button>Nova conta</Button>
</ToolbarActions>`}
        previewClassName="items-stretch"
      >
        <DemoExcesso />
      </DocSection>

      <DocSection
        title="Aba, e não filtro"
        description="Quando o trilho troca de painel, ele leva TabsContent junto — só aí role=&quot;tab&quot; diz a verdade."
        code={`<Tabs defaultValue="contas">
  <Toolbar>
    <ToolbarFilters>
      <TabsList stretch={false}>…</TabsList>
    </ToolbarFilters>
    <ToolbarActions>…</ToolbarActions>
  </Toolbar>
  <TabsContent value="contas">…</TabsContent>
  <TabsContent value="pendentes">…</TabsContent>
</Tabs>`}
        previewClassName="items-stretch"
      >
        <Tabs defaultValue="contas" className="w-full gap-3">
          <Toolbar>
            <ToolbarFilters>
              <TabsList stretch={false} aria-label="Modo de visualização">
                <TabsTrigger value="contas">Contas</TabsTrigger>
                <TabsTrigger value="pendentes">Pendentes</TabsTrigger>
              </TabsList>
            </ToolbarFilters>
            <ToolbarActions>
              <ToolbarButton icon={<ArrowsUpDownIcon aria-hidden />} label="ordenar" />
            </ToolbarActions>
          </Toolbar>
          <TabsContent value="contas">
            <p className="text-sm text-muted-foreground">
              A grade de contas — cada uma com o seu modelo de recorrência.
            </p>
          </TabsContent>
          <TabsContent value="pendentes">
            <p className="text-sm text-muted-foreground">
              Outra lista, com outro card e outro eixo de ordenação. É por isso que aqui é aba.
            </p>
          </TabsContent>
        </Tabs>
      </DocSection>

      <DocNote title="Aba troca de painel; filtro troca o conteúdo do mesmo painel">
        Os dois são <code>Tabs</code>: a aba leva <code>TabsContent</code>, o filtro fica sem painel. Um filtro com &quot;Todas&quot; não é <code>ToggleGroup</code> solto: no <code>type=&quot;single&quot;</code> ele precisa haver sempre um ativo, e valor que vai ser gravado é rádio, não aba.
      </DocNote>

      <DocNote title="A densidade segue o dedo, não a largura">
        O piso de 40 é <code>pointer-coarse:</code>, nunca <code>md:</code>: um desktop estreito não ganha controles de 40 sem pedir, e um tablet em paisagem não fica com 32 que o dedo não acerta. O que pergunta a largura é o <code>collapse</code> — ali a questão é espaço, não dedo.
      </DocNote>

      <PropsTable
        title="Toolbar"
        rows={[
          { prop: "size", type: '"sm" | "md" | "lg"', default: '"md"', description: "A altura dos controles: 28, 32, 36 — e 40 com o ponteiro grosso, nos três. Desce também aos botões sem size, pelo ButtonSizeContext." },
          { prop: "sticky", type: 'boolean | "hide"', default: "false", description: "Prende abaixo da barra do topo e ganha a placa só presa; \"hide\" também some ao rolar para baixo, no telefone." },
          { prop: "keyboard", type: "boolean", default: "false", description: "role=\"toolbar\", uma parada de Tab e setas entre os controles." },
        ]}
      />

      <PropsTable
        title="Peças"
        rows={[
          { prop: "ToolbarFilters", type: "div", description: "O grupo da esquerda — trilho, busca, filtros —, min-w-0 flex-1." },
          { prop: "ToolbarActions", type: 'div · overflow?: "menu"', description: "O grupo da direita; não encolhe e traz a única ms-auto. Com overflow, o excesso vai para o ⋯." },
          { prop: "ToolbarRow", type: "div", description: "A linha do telefone, que vira display: contents no md." },
          { prop: "ToolbarButton", type: "Button · icon, label, collapse", description: "O comando com ícone e rótulo; collapse o deixa só com o ícone abaixo de md." },
          { prop: "ToolbarFilterButton", type: "count?, active?, label?", description: "O botão de filtros: contagem rotulado, ponto no telefone, o estado no nome." },
          { prop: "ToolbarSearch", type: "SearchInput", default: 'shortcut="/"', description: "A busca que cresce no grupo." },
          { prop: "ToolbarCount", type: "count, noun?", description: "Quantos sobraram, numa região viva." },
          { prop: "ToolbarChips", type: "items, onClearAll?, max?, tone?", default: 'tone="success"', description: "Os filtros aplicados em fichas removíveis, numa linha própria." },
          { prop: "ToolbarFilterIndicator", type: "span", description: "O ponto de filtro ativo, para botão sem rótulo; aria-hidden." },
        ]}
      />

      <PropsTable
        title="Réguas"
        rows={[
          { prop: "toolbarControlClassName", type: "string", default: "h-(--toolbar-control)", description: "Para o controle embrulhado num div da tela, fora do alcance do filho direto." },
          { prop: "toolbarIconControlClassName", type: "string", default: "size-(--toolbar-control)", description: "O mesmo, para botão de ícone." },
          { prop: "TOOLBAR_SIZES", type: "{ sm: 28; md: 32; lg: 36 }", description: "Os degraus do size; o piso do dedo é 40 (TOOLBAR_CONTROL_HEIGHTS.coarse)." },
        ]}
      />
    </>
  )
}
