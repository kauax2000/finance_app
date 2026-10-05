"use client"

import * as React from "react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Caption } from "@/components/ui/typography"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

const PERIODOS = [
  { key: "7d", label: "7d", longo: "Últimos 7 dias" },
  { key: "15d", label: "15d", longo: "Últimos 15 dias" },
  { key: "30d", label: "30d", longo: "Últimos 30 dias" },
  { key: "mes", label: "Mês", longo: "Mês atual" },
]

export default function ToggleGroupDoc() {
  return (
    <>
      <Usage>
        Opções sempre visíveis, com uma ou várias ativas — o período, o tipo, uma cor. Quando trocam o <strong>conteúdo</strong> da tela em vez de filtrá-lo, o componente é o <code>Tabs</code>; dentro de um formulário, a escolha única é o <code>RadioGroup</code>. As peles dos itens são as do{" "}
        <Link href="/designsystem/toggle" className="underline">
          Toggle
        </Link>
        .
      </Usage>

      <DocSection
        title="Uma ou várias"
        description="type=&quot;single&quot; deixa uma ativa por vez; type=&quot;multiple&quot;, quantas a pessoa quiser. variant, shape e size descem do grupo para os itens."
        code={`<ToggleGroup type="single" defaultValue="mes">
  <ToggleGroupItem value="semana">Semana</ToggleGroupItem>
  <ToggleGroupItem value="mes">Mês</ToggleGroupItem>
</ToggleGroup>

<ToggleGroup type="multiple" variant="outline" defaultValue={["pix"]}>…</ToggleGroup>`}
        previewClassName="flex-wrap gap-6"
      >
        <ToggleGroup type="single" defaultValue="mes" aria-label="Período">
          <ToggleGroupItem value="semana">Semana</ToggleGroupItem>
          <ToggleGroupItem value="mes">Mês</ToggleGroupItem>
          <ToggleGroupItem value="ano">Ano</ToggleGroupItem>
        </ToggleGroup>
        <ToggleGroup type="multiple" variant="outline" defaultValue={["pix"]} aria-label="Formas de pagamento">
          <ToggleGroupItem value="pix">PIX</ToggleGroupItem>
          <ToggleGroupItem value="cartao">Cartão</ToggleGroupItem>
          <ToggleGroupItem value="dinheiro">Dinheiro</ToggleGroupItem>
        </ToggleGroup>
      </DocSection>

      <DocSection
        title="Segmentado"
        description="variant=&quot;segmented&quot;: a bandeja, com a escolhida levantada. O realce é um marcador só, que desliza até a escolhida — a mecânica do Tabs. A bandeja mede o item mais 4px (sm faz 32). Nenhuma escolhida também vale: o marcador some, como no período personalizado. variant=&quot;floating&quot; é a mesma escolha na pele do Tabs padrão — a pílula com o anel e a tecla em relevo 2px para dentro —, a do painel Exibir do Data Table. Troque e veja deslizar."
        code={`<ToggleGroup type="single" variant="segmented" size="sm" value={p} onValueChange={setP}>
  <ToggleGroupItem value="7d">7d</ToggleGroupItem>
  <ToggleGroupItem value="15d">15d</ToggleGroupItem>
  …
</ToggleGroup>`}
        previewClassName="flex-col items-start gap-4"
      >
        <SegmentadoDemo />
        <ToggleGroup type="single" variant="segmented" shape="pill" defaultValue="mensal" aria-label="Cobrança">
          <ToggleGroupItem value="mensal">Mensal</ToggleGroupItem>
          <ToggleGroupItem value="anual">Anual</ToggleGroupItem>
        </ToggleGroup>
      </DocSection>

      <DocSection
        title="Fichas"
        description="variant=&quot;chip&quot;: a ficha de filtro, a superfície dos chips do Badge e a mesma da ficha do RadioGroup. É o período rápido da folha de filtros das transações."
        code={`<ToggleGroup type="single" variant="chip" size="sm" value={p} onValueChange={setP}>
  <ToggleGroupItem value="7d">Últimos 7 dias</ToggleGroupItem>
  …
</ToggleGroup>`}
        previewClassName="flex-col items-stretch"
      >
        <ToggleGroup type="single" variant="chip" size="sm" defaultValue="30d" aria-label="Período rápido" className="flex-wrap justify-start gap-1.5">
          {PERIODOS.map((p) => (
            <ToggleGroupItem key={p.key} value={p.key}>
              {p.longo}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </DocSection>

      <DocSection
        title="Com a contagem"
        description="count põe o número ao lado do rótulo, em algarismos tabulares e no peso normal — o rótulo é o nome, o número é o tamanho dele. É texto, então entra no nome acessível: “Transações 8”. Os filtros da atividade o escreviam como “(8)”."
        code={`<ToggleGroupItem value="transacoes" count={8}>Transações</ToggleGroupItem>`}
      >
        <ToggleGroup type="single" variant="chip" size="sm" defaultValue="todas" aria-label="Filtrar atividades" className="flex-wrap gap-1.5">
          <ToggleGroupItem value="todas" count={12}>Todas</ToggleGroupItem>
          <ToggleGroupItem value="transacoes" count={8}>Transações</ToggleGroupItem>
          <ToggleGroupItem value="contas" count={4}>Contas</ToggleGroupItem>
        </ToggleGroup>
      </DocSection>

      <DocSection
        title="Em partes iguais"
        description="stretch divide a largura entre os itens — o segmentado no telefone, ou uma fileira que ocupa a linha toda."
        code={`<ToggleGroup type="single" variant="segmented" stretch>…</ToggleGroup>`}
        previewClassName="flex-col items-stretch"
      >
        <ToggleGroup type="single" variant="segmented" stretch defaultValue="despesas" aria-label="Tipo" className="max-w-sm">
          <ToggleGroupItem value="todas">Todas</ToggleGroupItem>
          <ToggleGroupItem value="despesas">Despesas</ToggleGroupItem>
          <ToggleGroupItem value="receitas">Receitas</ToggleGroupItem>
        </ToggleGroup>
      </DocSection>

      <DocNote title="Na seleção única, clicar no ativo não desmarca">
        O Radix trata o grupo de um valor como um toggle: o segundo clique no item ativo devolveria string vazia e deixaria o grupo sem nenhum. O componente engole essa troca. Começar sem nenhum continua valendo (<code>value=&quot;&quot;</code>), e é o que o período personalizado faz. Em <code>type=&quot;multiple&quot;</code>, esvaziar é uma resposta legítima e passa.
      </DocNote>

      <DocNote title="Segmentado não é Tabs">
        Os dois desenham a mesma bandeja com o mesmo marcador, e a diferença é o que a escolha faz. O <code>Tabs</code> troca o painel abaixo, e anuncia &ldquo;aba 1 de 3&rdquo; com um <code>tabpanel</code>; o segmentado escolhe um <strong>valor</strong> — um período, um intervalo de cobrança —, e anuncia rádios num grupo. Abas sem painel são o defeito que o seletor de período já registrava.
      </DocNote>

      <DocNote title="Onde o app usa">
        Seis grupos. A atividade filtra com pílulas de contorno e <code>count</code>; as paletas de cor da categoria e do workspace são <code>variant=&quot;swatch&quot;</code>; as grades de ícone são <code>icon-lg</code> e <code>icon-xl</code>; e o período rápido da folha de filtros das transações são fichas (<code>variant=&quot;chip&quot;</code>). O mesmo seletor tem a forma de bandeja (<code>variant=&quot;segmented&quot;</code>), hoje sem tela. Os dois eram <code>Button aria-pressed</code> à mão, e a bandeja levava uma sombra em <code>rgb()</code> cru.
      </DocNote>

      <PropsTable
        rows={[
          { prop: "type", type: '"single" | "multiple"', description: "Uma ativa por vez, ou várias. Obrigatório." },
          { prop: "value · defaultValue · onValueChange", type: "string | string[]", description: "Controlado ou não. No single, a troca para vazio é engolida." },
          { prop: "variant", type: '"plain" | "outline" | "swatch" | "chip" | "segmented" | "floating"', default: '"plain"', description: "A pele dos itens; segmented é a bandeja e floating a pílula do Tabs padrão, e as duas só existem no grupo." },
          { prop: "size · shape · tint", type: "os do Toggle", description: "Descem para todos os itens; o do item vence." },
          { prop: "stretch", type: "boolean", default: "false", description: "Os itens dividem a largura em partes iguais." },
        ]}
      />

      <PropsTable
        title="ToggleGroupItem"
        rows={[
          { prop: "value", type: "string", description: "O valor da opção. Obrigatório." },
          { prop: "count", type: "ReactNode", description: "A contagem ao lado do rótulo." },
          { prop: "icon · iconOn · color", type: "os do Toggle", description: "O ícone que acende e a cor da amostra." },
        ]}
      />
    </>
  )
}

function SegmentadoDemo() {
  const [p, setP] = React.useState("30d")
  const [pele, setPele] = React.useState<"segmented" | "floating">("segmented")

  return (
    <div className="flex flex-col items-start gap-2">
      <ToggleGroup type="single" variant="segmented" size="sm" value={pele} onValueChange={(v) => setPele(v as typeof pele)} aria-label="Pele" className="mb-2">
        <ToggleGroupItem value="segmented" className="font-mono text-xs">segmented</ToggleGroupItem>
        <ToggleGroupItem value="floating" className="font-mono text-xs">floating</ToggleGroupItem>
      </ToggleGroup>
      <ToggleGroup type="single" variant={pele} size="sm" value={p} onValueChange={setP} aria-label="Período">
        {PERIODOS.map((x) => (
          <ToggleGroupItem key={x.key} value={x.key} title={x.longo}>
            {x.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <div className="flex items-center gap-2">
        <Caption>{p ? PERIODOS.find((x) => x.key === p)?.longo : "Período personalizado"}</Caption>
        <Button variant="link" size="xs" onClick={() => setP("")} disabled={!p}>
          personalizar
        </Button>
      </div>
    </div>
  )
}
