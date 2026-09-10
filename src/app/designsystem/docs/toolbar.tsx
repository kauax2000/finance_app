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
        A linha entre o título e a lista: os filtros de um lado, as ações do
        outro. Existe porque esse bloco é desenhado à mão em seis telas —
        transações, faturas, categorias, assinaturas, cartões e o painel —, cada
        uma com um espaçamento diferente, e cada uma clonada mais uma vez num
        arquivo de esqueleto.
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

      <DocNote title="No botão com rótulo, a marca é o número — não um ponto">
        Um ponto diz que <em>há</em> filtro; o número diz <em>quantos</em>. E
        ele é <strong>verde da marca</strong>, porque é essa a linguagem de
        &quot;filtro ativo&quot; que o app já fala — as três grafias da bolinha
        usam <code>bg-primary</code>. Trocar o ponto por um badge cinza mantinha
        a informação e perdia o sinal; medido, o cinza dava{" "}
        <strong>1,19</strong> contra o botão no tema claro. Ele entra no fluxo
        do flex, então não sobrepõe nada: a bolinha absoluta que
        estava aqui encostava no &quot;s&quot; de &quot;Filtros&quot; — 2px, nos
        dois eixos, medidos. (Ela <strong>não</strong> ficava em cima da borda:
        a folga até a curva era de 4,59px. O defeito era o texto.) O ponto fica
        para o botão sem rótulo, logo abaixo.
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

      <DocNote title="Nenhuma tela do app faz isto — e provavelmente devia">
        A busca de transações mora dentro da folha de filtros. No telefone isso
        se defende; no desktop é caro, porque a busca é o filtro de maior
        frequência de uma lista de transações e cada uso custa um clique a mais.
        A página mostra a forma porque o catálogo desta casa também propõe, não
        só espelha — <code>Drawer</code>, <code>ContextMenu</code>,{" "}
        <code>Menubar</code>, <code>HoverCard</code> e <code>Stepper</code>{" "}
        entraram sem consumidor pela mesma razão.
      </DocNote>

      <DocSection
        title="As duas árvores"
        description="No telefone o comando é um botão de ícone; no desktop, o mesmo comando rotulado. ToolbarRow segura a linha do telefone e se dissolve no md, quando os filhos passam a ser medidos pela própria barra."
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

      <DocNote title="A dissolução leva a caixa junto">
        Em <code>md</code> a <code>div</code> do <code>ToolbarRow</code> não
        existe: o <code>min-w-0</code>, o <code>gap</code> e qualquer{" "}
        <code>flex-1</code> dela deixam de valer, e um filho com{" "}
        <code>flex-1</code> passa a disputar a largura da barra inteira — é por
        isso que o trilho acima desfaz o dele com <code>md:flex-none</code>.
        Pela mesma razão, não ponha <code>role</code> nem{" "}
        <code>aria-label</code> aqui: para nomear o grupo existe o{" "}
        <code>ToolbarFilters</code>.
      </DocNote>

      <DocSection
        title="Aba, e não filtro"
        description="Quando o trilho troca de painel — e não filtra o mesmo painel — ele leva TabsContent junto, e é aí que role=&quot;tab&quot; passa a dizer a verdade."
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
        A conta do app, medida: dos <strong>11</strong> trilhos escritos à mão,{" "}
        <strong>4 são abas</strong> (faturas <code>Contas/Pendentes</code>, que
        ainda reseta o eixo de ordenação; cartões{" "}
        <code>Cartões/Histórico</code>, que troca uma grade por um gráfico;
        categorias; tendências), <strong>3 são filtros</strong> (transações, que
        vira <code>qb.eq(&quot;type&quot;, …)</code> na mesma tabela;
        assinaturas; histórico de fatura) e <strong>4 são controles de
        formulário</strong> — um deles debaixo de um{" "}
        <code>&lt;Label&gt;Como informar os valores?&lt;/Label&gt;</code>, que é
        rádio vestido de aba e o pior dos onze. E{" "}
        <code>TransactionTypeSegment</code> é <strong>aba numa tela e filtro na
        outra</strong>: o mesmo componente, semânticas opostas.
      </DocNote>

      <DocNote title="Os três filtros usam role=&quot;tab&quot; sem painel, e é dívida conhecida">
        O destino deles é <code>ToggleGroup</code>, que hoje não segura o
        invariante: medido, clicar no item já ativo de um{" "}
        <code>type=&quot;single&quot;</code> <strong>desmarca tudo</strong> — os
        três vão para <code>off</code>, zero selecionados —, e num filtro que já
        tem &quot;Todas&quot; como neutro isso é um quarto estado que ninguém
        pediu. Ele também emite <code>role=&quot;radio&quot;</code> dentro de{" "}
        <code>role=&quot;group&quot;</code>, e não de{" "}
        <code>radiogroup</code>. Enquanto isso não se conserta,{" "}
        <code>Tabs</code> é a escolha — ela garante sempre exatamente um ativo.
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
              <SelectTrigger className={toolbarControlClassName}>
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
        description="A barra publica --toolbar-control; o controle a lê. md 32 com o ponteiro fino, xl 40 com o grosso — os nomes da escada do sistema, e não dois números soltos."
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

      <DocNote title="Numa barra, o trilho é size=&quot;sm&quot; padding=&quot;tight&quot;">
        Quem fica lado a lado com o <code>Button</code> não é o gatilho — é a{" "}
        <strong>bandeja</strong>. E ela é <code>gatilho + 2×recuo</code>, então
        com o recuo cheio <code>size=&quot;md&quot;</code> produzia uma bandeja
        de <strong>40</strong> numa linha de controles de 32. Com{" "}
        <code>tight</code> as três caem na escada:{" "}
        <code>sm</code> → 32, <code>md</code> → 36, <code>lg</code> → 40.
        <br />
        É a receita que o app já usa à mão —{" "}
        <code>transaction-type-segment.tsx</code> escreve <code>p-0.5</code> com{" "}
        <code>md:h-8</code>, bandeja de 32 rente aos botões da barra. E{" "}
        <code>size</code> continua nomeando a caixa real do gatilho, que é a
        correção registrada que consertou o <code>Menubar</code> (entregava 24) e
        o próprio <code>Tabs</code> (entregava 27).
      </DocNote>

      <DocNote title="No ponteiro grosso a bandeja ainda não fecha, e é limite do Tabs">
        Medido a 375px: bandeja <strong>48</strong> contra controles de{" "}
        <strong>40</strong>. O <code>stretch={"{false}"}</code> liga{" "}
        <code>pointer-coarse:min-h-11</code> no gatilho (44), e 44 + 4 dá 48. E
        não há combinação que feche: <strong>uma bandeja com recuo nunca iguala
        o gatilho</strong>, então ficar rente exige que a{" "}
        <strong>bandeja</strong> seja a coisa dimensionada e o gatilho derive —
        que é o que o app faz à mão (<code>h-10 md:h-8</code> com{" "}
        <code>items-stretch</code>). O <code>Tabs</code> hoje dimensiona o
        gatilho, e o <code>h-7</code> do degrau vence qualquer{" "}
        <code>items-stretch</code>: medido, uma moldura forçada a 40 deixa o
        gatilho em 28 e sobra uma faixa morta de 6px em cima e embaixo.
        Fechar isso é trocar o <code>h-*</code> do degrau por{" "}
        <code>min-h-*</code> e dar altura à bandeja — mudança de semântica do{" "}
        <code>size</code>, e decisão de uma próxima rodada.
      </DocNote>

      <DocNote title="Nada quebra em linhas — o conteúdo troca">
        Este componente dizia que no telefone os itens quebram em linhas em vez
        de encolher. <strong>Nenhuma das seis barras faz isso.</strong> Todas
        renderizam duas árvores e trocam o conteúdo: um botão só de ícone no
        telefone, o mesmo comando rotulado no desktop. O <code>flex-wrap</code>{" "}
        ficou porque a barra de faturas de fato quebra; o que saiu foi a
        afirmação de que essa é a forma do padrão.
      </DocNote>

      <DocNote title="A pergunta é o dedo, não a largura">
        As seis barras perguntam <code>md:</code>. Com isso, um desktop com a
        janela em 700px recebe controles de 40px que ninguém pede, e um tablet em
        paisagem recebe 32px que o dedo não acerta. A regra desta casa já está
        escrita no item de menu — <em>a linha cresce no toque, não no
        telefone</em> — e o <code>Calendar</code> já a aplica assim. Esta barra
        faz igual, e não custou migração nenhuma: ela não tinha consumidor.
      </DocNote>

      <DocNote title="Por que a régua chega por className">
        Um seletor descendente não serviria: <code>in-*</code> e{" "}
        <code>group-*</code> compilam com <code>:where()</code>, que{" "}
        <strong>não soma especificidade</strong> — um{" "}
        <code>in-data-[size=xl]:h-10</code> empata com o <code>h-8</code> que o
        próprio <code>Button</code> traz, e perde por ordem de emissão. Por{" "}
        <code>className</code> quem decide é o <code>twMerge</code>, que{" "}
        <strong>remove</strong> o degrau conflitante em vez de disputar com ele.
        A régua só vale dentro de um <code>Toolbar</code>: fora dele a variável
        não existe e a altura cai para o conteúdo.
      </DocNote>

      <DocNote title="Sem role=&quot;toolbar&quot;, de propósito">
        Esse papel é um contrato de teclado: o grupo inteiro ocupa uma parada de
        tabulação e as setas andam entre os controles. Aqui cada controle é
        tabulável por conta própria, então o papel anunciaria um widget que não
        existe — pior que não anunciar nada. Para nomear o grupo, passe{" "}
        <code>role=&quot;group&quot;</code> com <code>aria-label</code>. A regra
        existe porque foi violada: o app o escreve à mão em quatro barras de
        seleção, nenhuma com foco itinerante, e duas delas são cópia literal das
        outras duas.
      </DocNote>

      <DocNote title="Isto não é o CardToolbar">
        <code>CardToolbar</code> é a <strong>tira de um Card</strong>: sangra até
        a borda e vive dentro do respiro do cartão. <code>Toolbar</code> é a
        linha <strong>da página</strong>, entre o <code>PageHeader</code> e a
        lista. Os dois têm 113 e zero consumidores, nessa ordem — quem digita
        &quot;Toolbar&quot; costuma encontrar o outro primeiro.
      </DocNote>

      <PropsTable
        title="Peças"
        rows={[
          {
            prop: "Toolbar",
            type: "div",
            description:
              "A raiz. Publica --toolbar-control e não declara altura nenhuma. Sem eixos: nenhum candidato passou na contagem.",
          },
          {
            prop: "ToolbarRow",
            type: "div",
            description:
              "A linha do telefone que se dissolve no md (display: contents). Escrita à mão 5× no app.",
          },
          {
            prop: "ToolbarFilters",
            type: "div",
            description:
              "O grupo da esquerda: o trilho e a busca. Cresce e encolhe — é min-w-0 flex-1.",
          },
          {
            prop: "ToolbarActions",
            type: "div",
            description:
              "O grupo da direita. Nunca encolhe, e traz a única ms-auto — duas dividiriam a sobra em partes iguais.",
          },
          {
            prop: "ToolbarFilterIndicator",
            type: "span",
            description:
              "O ponto de filtro ativo, e só para botão SEM rótulo. Filho de um controle relative; aria-hidden de fábrica, porque o estado já está no aria-label. Com rótulo, use um Badge com a contagem.",
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
