"use client"

import * as React from "react"
import {
  AdjustmentsHorizontalIcon,
  ArrowsUpDownIcon,
  ChevronDownIcon,
  PlusIcon,
} from "@heroicons/react/16/solid"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { SearchInput } from "@/components/ui/search-input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Toolbar,
  ToolbarActions,
  ToolbarFilterIndicator,
  ToolbarFilters,
  ToolbarRow,
  toolbarControlClassName,
  toolbarIconControlClassName,
} from "@/components/ui/toolbar"
import { cn } from "@/lib/utils"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

export default function ToolbarDoc() {
  return (
    <>
      <Usage>
        A linha entre o título da página e a lista: filtros de um lado, ações do outro. Não é a barra do topo da janela (<code>TopBar</code>) nem a tira de um cartão (<code>CardToolbar</code>).
      </Usage>

      <DocSection
        title="A barra de uma lista"
        description="Trilho à esquerda, ações à direita. Não há justify-* na raiz: quem empurra é uma ms-auto em ToolbarActions."
        code={`<Toolbar>
  <ToolbarFilters>
    <Tabs defaultValue="todas">
      <TabsList glass stretch={false}>
        <TabsTrigger value="todas">Todas</TabsTrigger>
        <TabsTrigger value="despesas">Despesas</TabsTrigger>
        <TabsTrigger value="receitas">Receitas</TabsTrigger>
      </TabsList>
    </Tabs>
  </ToolbarFilters>
  <ToolbarActions>
    <Button variant="outline" className={toolbarControlClassName}>
      <AdjustmentsHorizontalIcon />
      Filtros
      <Badge size="xs">2</Badge>
    </Button>
    <Button className={toolbarControlClassName}>
      <PlusIcon />
      Nova transação
    </Button>
  </ToolbarActions>
</Toolbar>`}
        previewClassName="items-stretch"
      >
        <Toolbar className="w-full">
          <ToolbarFilters>
            <Tabs defaultValue="todas">
              <TabsList glass stretch={false} aria-label="Filtrar por tipo">
                <TabsTrigger value="todas">Todas</TabsTrigger>
                <TabsTrigger value="despesas">Despesas</TabsTrigger>
                <TabsTrigger value="receitas">Receitas</TabsTrigger>
              </TabsList>
            </Tabs>
          </ToolbarFilters>
          <ToolbarActions>
            <Button variant="outline" className={toolbarControlClassName}>
              <AdjustmentsHorizontalIcon aria-hidden />
              Filtros
              <Badge size="xs">
                2
              </Badge>
            </Button>
            <Button className={toolbarControlClassName}>
              <PlusIcon aria-hidden />
              Nova transação
            </Button>
          </ToolbarActions>
        </Toolbar>
      </DocSection>

      <DocNote title="Com rótulo, a marca é a contagem">
        Num botão com rótulo, o filtro ativo é um <code>Badge</code> com o número, no verde da marca — diz quantos, não só que há. O ponto fica para o botão só de ícone.
      </DocNote>

      <DocSection
        title="A busca"
        description="ToolbarFilters é min-w-0 flex-1 — ele existe para um campo que cresce. SearchInput traz a lupa, a semântica de busca e o × do sistema já suprimido."
        code={`<Toolbar>
  <ToolbarFilters>
    <SearchInput
      value={q}
      onChange={(e) => setQ(e.target.value)}
      onClear={() => setQ("")}
      placeholder="Buscar na descrição…"
      className="max-w-xs"
    />
  </ToolbarFilters>
  <ToolbarActions>…</ToolbarActions>
</Toolbar>`}
        previewClassName="items-stretch"
      >
        <BuscaDemo />
      </DocSection>

      <DocNote title="O app ainda não tem busca na barra">
        A busca de transações mora na folha de filtros; a forma fica aqui como proposta.
      </DocNote>

      <DocSection
        title="As duas árvores"
        description="No telefone o comando é um botão de ícone; no desktop, o mesmo comando rotulado. ToolbarRow segura a linha do telefone e se dissolve no md."
        code={`<Toolbar>
  {/* uma árvore só: no md a linha desaparece e os filhos sobem */}
  <ToolbarRow>
    <Tabs defaultValue="ativas" className="min-w-0 flex-1 md:flex-none">…</Tabs>
    <Button
      variant="outline"
      className={cn("relative", toolbarIconControlClassName, "md:hidden")}
      aria-label="Filtros — 2 ativos"
    >
      <AdjustmentsHorizontalIcon />
      <ToolbarFilterIndicator />
    </Button>
  </ToolbarRow>
  <ToolbarActions className="hidden md:flex">…</ToolbarActions>
</Toolbar>`}
        previewClassName="items-stretch"
      >
        <Toolbar className="w-full">
          <ToolbarRow>
            <Tabs defaultValue="ativas" className="min-w-0 flex-1 md:flex-none">
              <TabsList glass stretch={false} aria-label="Status da assinatura">
                <TabsTrigger value="todas">Todas</TabsTrigger>
                <TabsTrigger value="ativas">Ativas</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button
              variant="outline"
              className={cn(
                "relative",
                toolbarIconControlClassName,
                "md:hidden"
              )}
              aria-label="Filtros — 2 ativos"
            >
              <AdjustmentsHorizontalIcon aria-hidden />
              <ToolbarFilterIndicator />
            </Button>
          </ToolbarRow>
          <ToolbarActions className="hidden md:flex">
            <Button variant="outline" className={toolbarControlClassName}>
              Ordenar
              <ChevronDownIcon aria-hidden />
            </Button>
          </ToolbarActions>
        </Toolbar>
      </DocSection>

      <DocNote title="Em md, ToolbarRow não tem caixa">
        Com <code>display: contents</code>, o <code>gap</code> e o <code>flex-1</code> dele deixam de valer, e um filho com <code>flex-1</code> disputa a barra inteira — desfaça com <code>md:flex-none</code>. Para nomear o grupo, use o <code>ToolbarFilters</code>, não a linha.
      </DocNote>

      <DocSection
        title="Aba, e não filtro"
        description="Quando o trilho troca de painel, ele leva TabsContent junto — só aí role=&quot;tab&quot; diz a verdade."
        code={`<Tabs defaultValue="contas">
  <Toolbar>
    <ToolbarFilters>
      <TabsList glass stretch={false}>
        <TabsTrigger value="contas">Contas</TabsTrigger>
        <TabsTrigger value="pendentes">Pendentes</TabsTrigger>
      </TabsList>
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
              <TabsList glass stretch={false} aria-label="Modo de visualização">
                <TabsTrigger value="contas">Contas</TabsTrigger>
                <TabsTrigger value="pendentes">Pendentes</TabsTrigger>
              </TabsList>
            </ToolbarFilters>
            <ToolbarActions>
              <Button variant="outline" className={toolbarControlClassName}>
                <ArrowsUpDownIcon aria-hidden />
                Ordenar
              </Button>
            </ToolbarActions>
          </Toolbar>
          <TabsContent value="contas">
            <p className="text-sm text-muted-foreground">
              A grade de contas — cada uma com o seu modelo de recorrência.
            </p>
          </TabsContent>
          <TabsContent value="pendentes">
            <p className="text-sm text-muted-foreground">
              Outra lista, com outro card e outro eixo de ordenação. É por isso
              que aqui é aba.
            </p>
          </TabsContent>
        </Tabs>
      </DocSection>

      <DocNote title="Aba troca de painel; filtro troca o conteúdo do mesmo painel">
        Os dois são <code>Tabs variant=&quot;solid&quot;</code>: a aba leva <code>TabsContent</code>, o filtro fica sem painel. Um filtro com &quot;Todas&quot; não é <code>ToggleGroup</code>: no <code>type=&quot;single&quot;</code>, clicar no item ativo desmarca tudo, e ali precisa haver sempre um ativo. Valor que vai ser gravado é rádio, não aba.
      </DocNote>

      <DocSection
        title="Só ações"
        description="Com um grupo só, justify-between renderiza flex-start e joga o bloco para a esquerda. A ms-auto acerta os três casos — um, dois e três grupos."
        code={`<Toolbar>
  <ToolbarActions>
    <Select>…</Select>
  </ToolbarActions>
</Toolbar>`}
        previewClassName="items-stretch"
      >
        <Toolbar className="w-full">
          <ToolbarActions>
            <Select defaultValue="2026-09">
              <SelectTrigger className={toolbarControlClassName} aria-label="Mês">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2026-08">agosto de 2026</SelectItem>
                <SelectItem value="2026-09">setembro de 2026</SelectItem>
              </SelectContent>
            </Select>
          </ToolbarActions>
        </Toolbar>
      </DocSection>

      <DocSection
        title="A densidade"
        description="A barra publica --toolbar-control e o controle a lê: md 32 no ponteiro fino, xl 40 no grosso."
        code={`// na raiz, de fábrica
"[--toolbar-control:--spacing(8)] pointer-coarse:[--toolbar-control:--spacing(10)]"

// no controle
<Button className={toolbarControlClassName} />        // h-(--toolbar-control)
<Button className={toolbarIconControlClassName} />    // size-(--toolbar-control)`}
        previewClassName="items-stretch"
      >
        <Toolbar className="w-full">
          <ToolbarFilters>
            <Button variant="outline" className={toolbarControlClassName}>
              Um controle de texto
            </Button>
            <Button
              variant="outline"
              className={toolbarIconControlClassName}
              aria-label="Um botão de ícone"
            >
              <PlusIcon aria-hidden />
            </Button>
          </ToolbarFilters>
        </Toolbar>
      </DocSection>

      <DocNote title="Na barra, o trilho é o Tabs no tamanho padrão">
        O <code>size</code> do <code>Tabs</code> nomeia a bandeja, e é ela que fica ao lado do <code>Button</code>: <code>md</code> dá bandeja de 32, rente aos controles, com gatilho de 28. No ponteiro grosso a bandeja vai a 40, o degrau de <code>--toolbar-control</code>.
      </DocNote>

      <DocNote title="No telefone o conteúdo troca, não quebra">
        As barras renderizam duas árvores — ícone no telefone, comando rotulado no desktop — em vez de quebrar em linhas.
      </DocNote>

      <DocNote title="A densidade segue o dedo, não a largura">
        Use <code>pointer-coarse:</code>, nunca <code>md:</code>. Com <code>md:</code>, um desktop estreito ganha controles de 40px sem pedir e um tablet em paisagem fica com 32px que o dedo não acerta.
      </DocNote>

      <DocNote title="A régua chega por className, não por seletor">
        <code>in-*</code> e <code>group-*</code> compilam com <code>:where()</code>, sem especificidade, e empatariam com o <code>h-8</code> do <code>Button</code>. Por <code>className</code>, o <code>twMerge</code> remove o degrau conflitante. Fora de um <code>Toolbar</code> a variável não existe.
      </DocNote>

      <DocNote title="Sem role=&quot;toolbar&quot;, de propósito">
        O papel promete uma só parada de tabulação com setas entre os controles; aqui cada controle é tabulável, e anunciar um widget que não existe é pior que nada. Para nomear o grupo, use <code>role=&quot;group&quot;</code> com <code>aria-label</code>.
      </DocNote>


      <PropsTable
        title="Peças"
        rows={[
          {
            prop: "Toolbar",
            type: "div",
            description:
              "A raiz; publica --toolbar-control e não declara altura.",
          },
          {
            prop: "ToolbarRow",
            type: "div",
            description:
              "A linha do telefone, que vira display: contents no md.",
          },
          {
            prop: "ToolbarFilters",
            type: "div",
            description:
              "O grupo da esquerda — trilho e busca —, min-w-0 flex-1.",
          },
          {
            prop: "ToolbarActions",
            type: "div",
            description:
              "O grupo da direita; não encolhe e traz a única ms-auto.",
          },
          {
            prop: "ToolbarFilterIndicator",
            type: "span",
            description:
              "O ponto de filtro ativo, só para botão sem rótulo; aria-hidden, porque o estado está no aria-label.",
          },
        ]}
      />

      <PropsTable
        title="Réguas"
        rows={[
          {
            prop: "toolbarControlClassName",
            type: "string",
            default: "h-(--toolbar-control)",
            description:
              "A altura de um controle de texto na barra. Só vale dentro de um Toolbar.",
          },
          {
            prop: "toolbarIconControlClassName",
            type: "string",
            default: "size-(--toolbar-control)",
            description: "O mesmo, para botão de ícone: governa os dois eixos.",
          },
          {
            prop: "TOOLBAR_CONTROL_HEIGHTS",
            type: "{ fine: 32; coarse: 40 }",
            description:
              "Os dois degraus, com os nomes da escada: md com ponteiro fino, xl com ponteiro grosso.",
          },
        ]}
      />
    </>
  )
}

function BuscaDemo() {
  const [q, setQ] = React.useState("")

  return (
    <Toolbar className="w-full">
      <ToolbarFilters>
        <SearchInput
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onClear={() => setQ("")}
          placeholder="Buscar na descrição…"
          aria-label="Buscar na descrição"
          className="max-w-xs"
        />
      </ToolbarFilters>
      <ToolbarActions>
        <Button className={toolbarControlClassName}>
          <PlusIcon aria-hidden />
          Nova transação
        </Button>
      </ToolbarActions>
    </Toolbar>
  )
}
