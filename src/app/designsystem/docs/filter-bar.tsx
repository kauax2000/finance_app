"use client"

import * as React from "react"
import {
  ArrowsUpDownIcon,
  BanknotesIcon,
  BuildingStorefrontIcon,
  CalendarDaysIcon,
  CreditCardIcon,
  CurrencyDollarIcon,
  MagnifyingGlassIcon,
  Square3Stack3DIcon,
  TagIcon,
} from "@heroicons/react/16/solid"
import { FunnelIcon } from "@heroicons/react/24/outline"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ColorTile } from "@/components/ui/color-tile"
import {
  EmptyState,
  EmptyStateActions,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
} from "@/components/ui/empty-state"
import {
  FilterBar,
  FilterBarSkeleton,
  filterPeriodRange,
  serializeFilters,
  type FilterField,
  type FilterMatch,
  type FilterOption,
  type FilterValue,
} from "@/components/ui/filter-bar"
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "@/components/ui/item"
import { Kbd } from "@/components/ui/kbd"
import { MoneyDisplay } from "@/components/ui/money-display"
import { Toolbar, ToolbarActions, ToolbarFilters } from "@/components/ui/toolbar"
import { normalizeSearchText } from "@/lib/command-filter"
import { paymentMethodOptions } from "@/lib/payment-methods"
import { TILE_PALETTE } from "@/lib/tile-palette"
import { formatTransactionDayMonthPtBr, localYmdFromDate } from "@/lib/transaction-date"
import { IphoneFrame, ViewportFrame } from "../ds-frame"
import { Controles, DocNote, DocSection, Eixo, Interruptor, Interruptores, PropsTable, Usage } from "../ds-doc"

/* ── O dado: um mês de lançamentos ─────────────────────────────────────── */

const cor = (nome: (typeof TILE_PALETTE)[number]["nome"]) =>
  TILE_PALETTE.find((p) => p.nome === nome)!.hex

const CATEGORIAS = [
  { value: "mercado", label: "Mercado", cor: cor("lima") },
  { value: "transporte", label: "Transporte", cor: cor("azul") },
  { value: "restaurantes", label: "Restaurantes", cor: cor("coral") },
  { value: "saude", label: "Saúde", cor: cor("teal") },
  { value: "moradia", label: "Moradia", cor: cor("âmbar") },
  { value: "lazer", label: "Lazer", cor: cor("magenta") },
  { value: "eletronicos", label: "Eletrônicos", cor: cor("índigo") },
  { value: "renda", label: "Renda", cor: cor("violeta") },
] as const

const CARTOES: FilterOption[] = [
  { value: "nubank", label: "Nubank Ultravioleta" },
  { value: "itau", label: "Itaú Personnalité" },
  { value: "inter", label: "Inter Black" },
]

/** Datas relativas a hoje: "Este mês" e "Últimos 7 dias" sempre acham alguém. */
function diasAtras(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return localYmdFromDate(d)
}

type Lancamento = {
  id: string
  titulo: string
  categoria: (typeof CATEGORIAS)[number]["value"]
  pagamento: string
  cartao?: string
  dias: number
  valor: number
  parcelado?: boolean
}

const LANCAMENTOS: Lancamento[] = [
  { id: "1", titulo: "Pão de Açúcar", categoria: "mercado", pagamento: "credit_card", cartao: "nubank", dias: 0, valor: -412.37 },
  { id: "2", titulo: "Uber", categoria: "transporte", pagamento: "credit_card", cartao: "itau", dias: 1, valor: -23.9 },
  { id: "3", titulo: "Salário Acme", categoria: "renda", pagamento: "ted", dias: 3, valor: 6200 },
  { id: "4", titulo: "Mocotó", categoria: "restaurantes", pagamento: "pix", dias: 4, valor: -186.4 },
  { id: "5", titulo: "Drogasil", categoria: "saude", pagamento: "debit_card", dias: 6, valor: -54.3 },
  { id: "6", titulo: "Aluguel", categoria: "moradia", pagamento: "pix", dias: 8, valor: -2150 },
  { id: "7", titulo: "Notebook Dell 10x", categoria: "eletronicos", pagamento: "credit_card", cartao: "nubank", dias: 11, valor: -1284.6, parcelado: true },
  { id: "8", titulo: "Cinemark", categoria: "lazer", pagamento: "credit_card", cartao: "inter", dias: 13, valor: -64 },
  { id: "9", titulo: "Posto Shell", categoria: "transporte", pagamento: "debit_card", dias: 17, valor: -210 },
  { id: "10", titulo: "Freela de design", categoria: "renda", pagamento: "pix", dias: 22, valor: 1850 },
  { id: "11", titulo: "Geladeira Brastemp 12x", categoria: "eletronicos", pagamento: "credit_card", cartao: "itau", dias: 26, valor: -389.92, parcelado: true },
  { id: "12", titulo: "Padaria Santa Teresa", categoria: "mercado", pagamento: "cash", dias: 34, valor: -18.5 },
]

const contar = (chave: (l: Lancamento) => string | undefined, v: string) =>
  LANCAMENTOS.filter((l) => chave(l) === v).length

const PAGAMENTO_ROTULO = new Map(paymentMethodOptions().map((o) => [o.value as string, o.label]))

const CAMPOS: FilterField[] = [
  {
    id: "tipo",
    label: "Tipo",
    icon: <ArrowsUpDownIcon aria-hidden />,
    type: "enum",
    multiple: false,
    options: [
      { value: "despesa", label: "Despesas", count: LANCAMENTOS.filter((l) => l.valor < 0).length },
      { value: "receita", label: "Receitas", count: LANCAMENTOS.filter((l) => l.valor > 0).length },
    ],
  },
  {
    id: "categoria",
    label: "Categoria",
    icon: <TagIcon aria-hidden />,
    type: "enum",
    options: CATEGORIAS.map((c) => ({
      value: c.value,
      label: c.label,
      media: <ColorTile size="xs" color={c.cor} />,
      count: contar((l) => l.categoria, c.value),
    })),
  },
  {
    id: "pagamento",
    label: "Pagamento",
    icon: <BanknotesIcon aria-hidden />,
    type: "enum",
    options: paymentMethodOptions().map((o) => ({
      value: o.value,
      label: o.label,
      count: contar((l) => l.pagamento, o.value),
    })),
  },
  {
    id: "cartao",
    label: "Cartão",
    icon: <CreditCardIcon aria-hidden />,
    type: "enum",
    options: CARTOES.map((c) => ({ ...c, count: contar((l) => l.cartao, c.value) })),
  },
  { id: "periodo", label: "Período", icon: <CalendarDaysIcon aria-hidden />, type: "period" },
  { id: "valor", label: "Valor", icon: <CurrencyDollarIcon aria-hidden />, type: "money" },
  { id: "descricao", label: "Descrição", icon: <MagnifyingGlassIcon aria-hidden />, type: "text" },
  { id: "parcelado", label: "Compras parceladas", icon: <Square3Stack3DIcon aria-hidden />, type: "boolean" },
]

/** A regra da demonstração. No app, quem filtra é a consulta no servidor. */
function passa(l: Lancamento, f: FilterValue) {
  const dentro = (v: string | undefined) => (v != null && f.values.includes(v)) !== (f.operator === "is-not")
  switch (f.field) {
    case "tipo":
      return dentro(l.valor < 0 ? "despesa" : "receita")
    case "categoria":
      return dentro(l.categoria)
    case "pagamento":
      return dentro(l.pagamento)
    case "cartao":
      return dentro(l.cartao)
    case "periodo": {
      const r = filterPeriodRange(f.values)
      const dia = diasAtras(l.dias)
      return !r || (dia >= r.from && dia <= r.to)
    }
    case "valor": {
      const a = Math.abs(l.valor)
      const [x, y] = f.values.map(Number)
      return f.operator === "between" ? a >= x && a <= y : f.operator === "gte" ? a >= x : a <= x
    }
    case "descricao":
      return normalizeSearchText(l.titulo).includes(normalizeSearchText(f.values[0]))
    case "parcelado":
      return Boolean(l.parcelado)
    default:
      return true
  }
}

function filtrar(filtros: FilterValue[], match: FilterMatch) {
  if (!filtros.length) return LANCAMENTOS
  return LANCAMENTOS.filter((l) =>
    match === "all" ? filtros.every((f) => passa(l, f)) : filtros.some((f) => passa(l, f))
  )
}

const CENARIOS = {
  vazio: [] as FilterValue[],
  filtrado: [
    { field: "categoria", operator: "is", values: ["mercado", "transporte", "eletronicos"] },
    { field: "valor", operator: "gte", values: ["50"] },
  ] as FilterValue[],
  "sem resultado": [
    { field: "categoria", operator: "is", values: ["lazer"] },
    { field: "valor", operator: "gte", values: ["1000"] },
  ] as FilterValue[],
}
type Cenario = keyof typeof CENARIOS

/* ── As peças da demonstração ──────────────────────────────────────────── */

function Extrato({ itens, onLimpar }: { itens: Lancamento[]; onLimpar: () => void }) {
  if (!itens.length) {
    return (
      <EmptyState variant="plain">
        <EmptyStateIcon variant="stack">
          <FunnelIcon aria-hidden />
        </EmptyStateIcon>
        <EmptyStateTitle>Nenhum lançamento com esses filtros</EmptyStateTitle>
        <EmptyStateDescription>Tire um filtro ou comece de novo.</EmptyStateDescription>
        <EmptyStateActions>
          <Button type="button" variant="secondary" onClick={onLimpar}>
            limpar filtros
          </Button>
        </EmptyStateActions>
      </EmptyState>
    )
  }
  return (
    <Card padding="none">
      <ItemGroup variant="divided">
        {itens.map((l) => {
          const categoria = CATEGORIAS.find((c) => c.value === l.categoria)!
          return (
            <Item key={l.id} variant="flush">
              <ItemMedia>
                <ColorTile size="md" color={categoria.cor} />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>{l.titulo}</ItemTitle>
                <ItemDescription>
                  {formatTransactionDayMonthPtBr(diasAtras(l.dias))} · {categoria.label} ·{" "}
                  {PAGAMENTO_ROTULO.get(l.pagamento)}
                </ItemDescription>
              </ItemContent>
              <ItemActions>
                <MoneyDisplay value={l.valor} tone={l.valor < 0 ? "expense" : "income"} />
              </ItemActions>
            </Item>
          )
        })}
      </ItemGroup>
    </Card>
  )
}

function DemoNaTela() {
  const [size, setSize] = React.useState<"sm" | "md" | "lg">("md")
  const [tone, setTone] = React.useState<"neutral" | "success">("neutral")
  const [cenario, setCenario] = React.useState<Cenario>("filtrado")
  const [comMatch, setComMatch] = React.useState(true)
  const [comContagem, setComContagem] = React.useState(true)
  const [esperando, setEsperando] = React.useState(false)
  const [desligada, setDesligada] = React.useState(false)
  const [filtros, setFiltros] = React.useState<FilterValue[]>(CENARIOS.filtrado)
  const [match, setMatch] = React.useState<FilterMatch>("all")

  const campos = esperando
    ? CAMPOS.map((c) => (c.id === "categoria" ? { ...c, pending: true } : c))
    : CAMPOS
  const itens = filtrar(filtros, comMatch ? match : "all")

  return (
    <div className="flex w-full flex-col gap-6 p-4">
      <Controles
        empilhar
        inicio={
          <>
            <Eixo rotulo="size" valores={["sm", "md", "lg"] as const} valor={size} onChange={setSize} />
            <Eixo rotulo="tone" valores={["neutral", "success"] as const} valor={tone} onChange={setTone} />
            <Eixo
              rotulo="cenário"
              valores={["vazio", "filtrado", "sem resultado"] as const}
              valor={cenario}
              onChange={(c) => {
                setCenario(c)
                setFiltros(CENARIOS[c])
              }}
            />
          </>
        }
        fim={
          <Interruptores>
            <Interruptor id="fb-match" rotulo="onMatchChange" valor={comMatch} onChange={setComMatch} />
            <Interruptor id="fb-count" rotulo="count" valor={comContagem} onChange={setComContagem} />
            <Interruptor id="fb-pending" rotulo="pending" valor={esperando} onChange={setEsperando} />
            <Interruptor id="fb-disabled" rotulo="disabled" valor={desligada} onChange={setDesligada} />
          </Interruptores>
        }
      />
      <ViewportFrame title="Lançamentos numa janela" height={560} className="rounded-surface" screenClassName="bg-background">
        <div className="flex h-full flex-col gap-4 overflow-y-auto p-6">
          <FilterBar
            key={`${size}-${tone}`}
            fields={campos}
            value={filtros}
            onValueChange={setFiltros}
            match={match}
            onMatchChange={comMatch ? setMatch : undefined}
            count={comContagem ? itens.length : undefined}
            total={LANCAMENTOS.length}
            noun={["lançamento", "lançamentos"]}
            size={size}
            tone={tone}
            disabled={desligada}
          />
          <Extrato itens={itens} onLimpar={() => setFiltros([])} />
        </div>
      </ViewportFrame>
    </div>
  )
}

function DemoTelefone() {
  const [mobile, setMobile] = React.useState<"scroll" | "stack">("scroll")
  const [filtros, setFiltros] = React.useState<FilterValue[]>([
    { field: "categoria", operator: "is", values: ["mercado", "restaurantes"] },
    { field: "periodo", operator: "is", values: ["este-mes"] },
    { field: "pagamento", operator: "is-not", values: ["cash"] },
  ])
  const itens = filtrar(filtros, "all")

  return (
    <div className="flex w-full flex-col items-center gap-6 p-4">
      <Controles
        inicio={<Eixo rotulo="mobile" valores={["scroll", "stack"] as const} valor={mobile} onChange={setMobile} />}
      />
      <IphoneFrame title="Lançamentos num iPhone">
        <div className="flex h-full flex-col gap-3 overflow-y-auto px-4 pt-16 pb-6">
          <FilterBar
            fields={CAMPOS}
            value={filtros}
            onValueChange={setFiltros}
            count={itens.length}
            total={LANCAMENTOS.length}
            noun={["lançamento", "lançamentos"]}
            mobile={mobile}
            shortcut={false}
          />
          <Extrato itens={itens} onLimpar={() => setFiltros([])} />
        </div>
      </IphoneFrame>
    </div>
  )
}

function DemoTeclado() {
  return (
    <div className="flex w-full flex-col gap-4">
      <FilterBar
        fields={CAMPOS}
        defaultValue={[
          { field: "tipo", operator: "is", values: ["despesa"] },
          { field: "cartao", operator: "is", values: ["nubank", "itau"] },
          { field: "parcelado", operator: "is", values: [] },
        ]}
      />
      <p className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5"><Kbd keys="tab" /> entra e sai da barra</span>
        <span className="flex items-center gap-1.5"><Kbd keys="left" /><Kbd keys="right" /> andam entre os segmentos</span>
        <span className="flex items-center gap-1.5"><Kbd keys="backspace" /> tira o filtro</span>
        <span className="flex items-center gap-1.5"><Kbd keys="f" /> abre o + Filtro</span>
      </p>
    </div>
  )
}

function DemoUrl() {
  const [filtros, setFiltros] = React.useState<FilterValue[]>([])
  const consulta = serializeFilters(filtros)
  return (
    <div className="flex w-full flex-col gap-4">
      <FilterBar fields={CAMPOS} value={filtros} onValueChange={setFiltros} urlParam="f" shortcut={false} />
      <p className="text-sm text-muted-foreground">
        Na URL:{" "}
        <code className="rounded-md bg-muted px-1.5 py-0.5 text-xs text-foreground">
          {consulta ? `?f=${consulta}` : "nada ainda"}
        </code>
      </p>
    </div>
  )
}

const ESTABELECIMENTOS = [
  "Pão de Açúcar",
  "Carrefour",
  "Hortifruti",
  "Drogasil",
  "Droga Raia",
  "Posto Shell",
  "Posto Ipiranga",
  "Mocotó",
  "Padaria Santa Teresa",
  "Cinemark",
  "Livraria da Vila",
  "Uber",
]

/** O servidor de mentira: 600ms, e respeita o cancelamento. */
function buscarEstabelecimentos(busca: string, signal: AbortSignal) {
  return new Promise<FilterOption[]>((resolve, reject) => {
    const espera = setTimeout(() => {
      const termo = normalizeSearchText(busca)
      resolve(
        ESTABELECIMENTOS.filter((e) => normalizeSearchText(e).includes(termo)).map((e) => ({
          value: normalizeSearchText(e).replace(/\s+/g, "-"),
          label: e,
          media: <BuildingStorefrontIcon aria-hidden className="size-4 text-muted-foreground" />,
        }))
      )
    }, 600)
    signal.addEventListener("abort", () => {
      clearTimeout(espera)
      reject(new DOMException("cancelada", "AbortError"))
    })
  })
}

const CAMPO_REMOTO: FilterField[] = [
  {
    id: "estabelecimento",
    label: "Estabelecimento",
    icon: <BuildingStorefrontIcon aria-hidden />,
    type: "enum",
    loadOptions: buscarEstabelecimentos,
  },
  CAMPOS[1],
]

function DemoServidor() {
  return <FilterBar fields={CAMPO_REMOTO} shortcut={false} className="w-full" />
}

function DemoNaToolbar() {
  const [filtros, setFiltros] = React.useState<FilterValue[]>([
    { field: "categoria", operator: "is", values: ["moradia"] },
  ])
  return (
    <Toolbar size="sm" className="w-full">
      <ToolbarFilters>
        <FilterBar fields={CAMPOS} value={filtros} onValueChange={setFiltros} shortcut={false} className="flex-1" />
      </ToolbarFilters>
      <ToolbarActions>
        <Button type="button" variant="tertiary">exportar</Button>
      </ToolbarActions>
    </Toolbar>
  )
}

export default function FilterBarDoc() {
  return (
    <>
      <Usage>
        Os filtros aplicados a uma lista, cada um num token que se edita no lugar: o campo, o operador e o valor são segmentos clicáveis, e o × tira o filtro. Use quando a lista tem vários campos para filtrar, valores múltiplos (&ldquo;Mercado, Transporte&rdquo;) ou um operador (&ldquo;não é&rdquo;, &ldquo;entre&rdquo;). Uma escolha única entre poucas opções é <code>Tabs</code> ou <code>ToggleGroup</code>; um ou dois filtros fixos são um <code>Combobox</code> na <code>Toolbar</code>. <strong>Nenhuma tela do app usa ainda</strong>; o primeiro lugar natural é Transações, onde hoje cada valor vira uma ficha &ldquo;Campo: valor&rdquo; (<code>ToolbarChips</code>).
      </Usage>

      <DocSection
        title="Na tela"
        description="Um mês de lançamentos filtrando ao vivo. Clique no valor de um token para editá-lo, no operador para trocá-lo, e em + Filtro para escolher outro campo — o token novo já abre o editor."
        code={`<FilterBar
  fields={campos}
  value={filtros}
  onValueChange={setFiltros}
  match={match}
  onMatchChange={setMatch}
  count={8}
  total={42}
  noun={["lançamento", "lançamentos"]}
/>`}
        previewClassName="block p-0"
      >
        <DemoNaTela />
      </DocSection>

      <DocNote title="O token é uma cápsula partida">
        A superfície é a de campo (<code>fieldSurfaceClassName</code>), na altura da escada — 28, 32, 36, e 40 no dedo —, e um fio — o texto a 14%, mais forte que o contorno, porque é ele que parte a cápsula — separa os segmentos (o <code>--input</code> do contorno dava 1,12:1 contra o preenchimento, e eles não se separavam; o fio dá 1,54 no escuro e 1,36 no claro). Cada segmento acende sozinho no cursor e no toque, e o anel de foco é dele, não da cápsula. <code>tone=&quot;success&quot;</code> é o verde das fichas de filtro de hoje, para a migração de Transações não trocar a cor que a pessoa já conhece.
      </DocNote>

      <DocNote title="O operador segue a contagem">
        Uma categoria marcada lê &ldquo;é&rdquo;; duas, &ldquo;é um de&rdquo;. O &ldquo;é um de&rdquo; com um valor só não existe, e o menu do operador tem duas linhas e não três. O valor mostra o primeiro rótulo e um &ldquo;+N&rdquo;; o nome do botão diz todos.
      </DocNote>

      <DocNote title="Um token por campo, e tudo grava ao vivo">
        Escolher um campo que já tem token abre o editor dele (o &ldquo;editar&rdquo; na lista). Marcar, clicar num dia e digitar mudam o filtro na hora; o que fica incompleto — a lista vazia, o &ldquo;entre&rdquo; com uma ponta — vira rascunho, com &ldquo;Selecionar…&rdquo;, e some ao fechar.
      </DocNote>

      <DocNote title="O token surge; os vizinhos andam">
        O filtro novo nasce onde estava o + Filtro, de 90% e com 4px de desfoque — a escala na mola da casa, a opacidade e o desfoque em 200ms —, e o que sai faz o caminho de volta em 150ms, sem mola. Quem abre e fecha o espaço são os vizinhos: os outros tokens, o E/OU, o + Filtro e a contagem deslizam na mola até o lugar novo, inclusive de uma linha para a outra. A largura não anima: com ela a mola passava do alvo, e a pílula inchava 8px além do conteúdo antes de voltar. Com movimento reduzido, tudo aparece e some no lugar.
      </DocNote>

      <DocNote title="O stack é uma grade, não uma pilha">
        Empilhados em flex, cada linha punha o operador e o valor onde o rótulo do campo terminasse, e a coluna de valores não se lia. Agora a linha é uma grade de quatro colunas e cada token as herda (<code>subgrid</code>): os valores descem num x só. Na grade os rótulos já formam a coluna, e o ícone do campo sai — ele custava 22px ao valor, e &ldquo;Mercado&rdquo; cortava num iPhone de 375px. O filtro sem valor estende o campo pelas três colunas, e o respiro separa os grupos: 6px entre filtros, 10 até as ações, 8 até a contagem.
      </DocNote>

      <DocNote title="No dedo, a régua de toque">
        Só com o apontador grosso (<code>pointer-coarse</code>), nunca pela largura: o token sobe a 40, cada segmento ganha 40 de largura e o alvo atravessa a borda de 1px da cápsula — o operador &ldquo;é&rdquo; media 26px e o × 33. O E/OU também vai a 40 × 40. No editor, &ldquo;Remover&rdquo; cresce à vista a 40, como o + Filtro e o Limpar, e a busca também (o <code>touchFloor</code> do <code>CommandInput</code>, com a faixa acompanhando); as linhas da lista e do menu de operador já são 44; o calendário abre como no <code>DatePicker</code>, com células de 44 esticadas e os atalhos de 40.
      </DocNote>

      <DocNote title="Um popover para a barra inteira">
        O + Filtro e o editor de valor são o mesmo <code>Popover</code>, ancorado no que está aberto. Escolher um campo troca o conteúdo e a âncora juntos: com dois popovers, o que fecha devolveria o foco ao + Filtro e esse foco fecharia o outro. O Enter de dentro dele — e do menu do operador, que é portal — não sobe até um <code>Form</code> em volta.
      </DocNote>

      <DocSection
        title="No telefone"
        description="Abaixo de 28rem da própria barra (container query, não a janela): scroll põe os tokens numa faixa que rola de lado e dissolve nas pontas; stack põe um por linha, numa grade de colunas alinhadas — campo, operador, valor e × no mesmo x em todas as linhas —, com o + Filtro embaixo e o Limpar na ponta dos ×. Os editores e o menu do operador abrem na gaveta."
        code={`<FilterBar fields={campos} value={filtros} onValueChange={setFiltros} mobile="stack" />`}
        previewClassName="block p-0"
      >
        <DemoTelefone />
      </DocSection>

      <DocSection
        title="O teclado"
        description="A barra é um role=toolbar de verdade: uma parada de Tab, as setas entre os segmentos, Home e End nas pontas. Backspace ou Delete num token o tira, e o foco vai ao vizinho. A tecla F abre o + Filtro de qualquer lugar da tela, fora de um campo de texto."
        code={`<FilterBar fields={campos} shortcut="f" />`}
        previewClassName="bg-background"
      >
        <DemoTeclado />
      </DocSection>

      <DocSection
        title="Na URL e no voltar"
        description="urlParam grava os filtros no endereço — um link compartilhável — e cada sessão do editor vira uma entrada do histórico: o voltar do navegador desfaz o último filtro, não a última caixa marcada. Os segmentos que voltaram piscam."
        code={`<FilterBar fields={campos} value={filtros} onValueChange={setFiltros} urlParam="f" />`}
        previewClassName="bg-background"
      >
        <DemoUrl />
      </DocSection>

      <DocNote title="O formato da URL">
        <code>?f=categoria:is:mercado:transporte,valor:gte:50</code>, cada parte em <code>encodeURIComponent</code> — uma descrição com dois-pontos ou vírgula volta igual —, e <code>f-ou=1</code> quando o E/OU está em &ldquo;qualquer um&rdquo;. O que não se entende é descartado (<code>parseFilters</code>): um link velho não quebra a tela. A escrita é <code>history.pushState(null, …)</code>, que é a forma que o Next acompanha no <code>useSearchParams</code>.
      </DocNote>

      <DocSection
        title="Opções do servidor"
        description="loadOptions busca enquanto a pessoa digita, com a espera e o cancelamento do useCommandSearch, e a roda enquanto a resposta não chega. Escolha um estabelecimento: o rótulo fica guardado para o token."
        code={`{ id: "estabelecimento", label: "Estabelecimento", type: "enum",
  loadOptions: (busca, signal) => buscar(busca, { signal }) }`}
        previewClassName="bg-background"
      >
        <DemoServidor />
      </DocSection>

      <DocSection
        title="Dentro da Toolbar"
        description="Sem size, a barra fala o degrau da Toolbar em volta — aqui sm, 28px —, e o + Filtro, o Limpar e o E/OU descem junto."
        code={`<Toolbar size="sm">
  <ToolbarFilters><FilterBar fields={campos} className="flex-1" /></ToolbarFilters>
  <ToolbarActions>…</ToolbarActions>
</Toolbar>`}
        previewClassName="bg-background"
      >
        <DemoNaToolbar />
      </DocSection>

      <DocSection
        title="Esqueleto"
        description="FilterBarSkeleton: os tokens, o + Filtro e a contagem, na altura do degrau, num SkeletonGroup."
        code={`<FilterBarSkeleton tokens={2} />`}
        previewClassName="flex-col items-stretch gap-4 bg-background"
      >
        <FilterBarSkeleton size="sm" tokens={1} />
        <FilterBarSkeleton />
        <FilterBarSkeleton size="lg" tokens={3} count={false} />
      </DocSection>

      <PropsTable
        title="Eixos de FilterBar"
        rows={[
          { prop: "fields", type: "FilterField[]", description: "Os campos que o + Filtro oferece, na ordem." },
          { prop: "value · defaultValue · onValueChange", type: "FilterValue[]", description: "Os filtros completos. O rascunho nunca sai do componente." },
          { prop: "match · defaultMatch · onMatchChange", type: '"all" | "any"', default: '"all"', description: "E ou OU. A pílula só aparece com onMatchChange e dois filtros." },
          { prop: "count · total · noun", type: "number · number · [string, string]", description: "A contagem viva: \"8 de 42 lançamentos\", em role=status." },
          { prop: "size", type: '"sm" | "md" | "lg"', default: '"md"', description: "28, 32 ou 36 (40 no dedo). Dentro de uma Toolbar, o degrau dela." },
          { prop: "tone", type: '"neutral" | "success"', default: '"neutral"', description: "A superfície de campo, ou o verde das fichas de filtro." },
          { prop: "mobile", type: '"scroll" | "stack"', default: '"scroll"', description: "Abaixo de 28rem da própria barra: a faixa que rola, ou um token por linha." },
          { prop: "urlParam", type: "string", description: "Grava na URL e desfaz no voltar." },
          { prop: "shortcut", type: "string | false", default: '"f"', description: "A tecla que abre o + Filtro, fora de campo de texto." },
          { prop: "disabled", type: "boolean", default: "false", description: "Trava a barra inteira." },
        ]}
      />

      <PropsTable
        title="FilterField"
        rows={[
          { prop: "id · label · icon", type: "string · string · ReactNode", description: "id vai na URL; icon é 16/solid." },
          { prop: "type", type: '"enum" | "period" | "money" | "text" | "boolean"', description: "Decide os operadores e o editor: a lista, o calendário com atalhos, os campos de dinheiro, o texto, ou nenhum (o filtro sem valor)." },
          { prop: "options", type: "{ value, label, media?, count?, keywords? }[]", description: "enum: as opções, com o ladrilho e a contagem à direita." },
          { prop: "loadOptions", type: "(busca, signal) => Promise<FilterOption[]>", description: "enum: a busca no servidor." },
          { prop: "multiple", type: "boolean", default: "true", description: "enum: false é uma escolha só, e o editor fecha ao escolher." },
          { prop: "pending", type: "boolean", description: "Os rótulos chegando: a roda no token e aria-busy." },
        ]}
      />

      <PropsTable
        title="FilterValue"
        rows={[
          { prop: "enum", type: '"is" | "is-not"', description: "values: os valores das opções." },
          { prop: "period", type: '"is"', description: 'values: ["este-mes"] (um atalho de DATE_RANGE_PRESETS) ou ["2026-10-01", "2026-10-15"]. filterPeriodRange resolve os dois.' },
          { prop: "money", type: '"between" | "gte" | "lte"', description: 'values: ["50", "200"] no between, ["50"] nos outros — decimal com ponto.' },
          { prop: "text", type: '"contains"', description: "values: [texto]." },
          { prop: "boolean", type: '"is"', description: "values: []." },
        ]}
      />

      <PropsTable
        title="Peças"
        rows={[
          { prop: "FilterBarSkeleton", type: "{ size?, tokens?, count?, label?, group? }", description: "A barra esperando. group={false} dentro de um esqueleto de página." },
          { prop: "serializeFilters · parseFilters", type: "(value) => string | null · (texto, fields) => FilterValue[]", description: "O formato da URL, para montar um link fora da barra." },
          { prop: "filterPeriodRange", type: "(values) => { from, to } | null", description: "O intervalo de um filtro de período, com o atalho resolvido hoje — o que vai à consulta." },
        ]}
      />
    </>
  )
}
