"use client"

import { InboxIcon } from "@heroicons/react/24/outline"
import * as React from "react"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { ColorTile } from "@/components/ui/color-tile"
import {
  EmptyState,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
} from "@/components/ui/empty-state"
import { MoneyDisplay } from "@/components/ui/money-display"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableCellIdentity,
  TableCellMoney,
  TableEmpty,
  TableError,
  TableExpandButton,
  TableFooter,
  TableGroupRow,
  TableHead,
  TableHeader,
  TableRow,
  TableRowDetail,
  TableSkeleton,
  type TableSize,
} from "@/components/ui/table"
import { TILE_PALETTE } from "@/lib/tile-palette"
import { DocNote, DocSection, Eixo, Interruptor, PropsTable, Usage } from "../ds-doc"

const LINHAS = [
  { desc: "Mercado", cat: "Alimentação", conta: "Nubank", data: "12/03", valor: -128.4, status: "Efetivada", cor: TILE_PALETTE[5].hex },
  { desc: "Salário", cat: "Renda", conta: "Itaú", data: "05/03", valor: 8432.15, status: "Efetivada", cor: TILE_PALETTE[7].hex },
  { desc: "Streaming", cat: "Assinaturas", conta: "Nubank", data: "03/03", valor: -39.9, status: "Prevista", cor: TILE_PALETTE[3].hex },
  { desc: "Farmácia", cat: "Saúde", conta: "Inter", data: "02/03", valor: -64.3, status: "Efetivada", cor: TILE_PALETTE[0].hex },
] as const

const TAMANHOS = ["xs", "sm", "md", "lg", "xl"] as const
const FIOS = ["rows", "none", "grid"] as const
const CABECALHOS = ["muted", "plain"] as const
const ROTULOS = ["text", "caps"] as const



function DemoNaTela() {
  const [size, setSize] = React.useState<TableSize>("md")
  const [dividers, setDividers] = React.useState<(typeof FIOS)[number]>("rows")
  const [cabecalho, setCabecalho] = React.useState<(typeof CABECALHOS)[number]>("muted")
  const [labels, setLabels] = React.useState<(typeof ROTULOS)[number]>("text")
  const [striped, setStriped] = React.useState(false)
  const [moldura, setMoldura] = React.useState(true)

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Eixo rotulo="Densidade" valores={TAMANHOS} valor={size} onChange={setSize} />
        <Eixo rotulo="Fios" valores={FIOS} valor={dividers} onChange={setDividers} />
        <Eixo rotulo="Cabeçalho" valores={CABECALHOS} valor={cabecalho} onChange={setCabecalho} />
        <Eixo rotulo="Rótulos" valores={ROTULOS} valor={labels} onChange={setLabels} />
        <Interruptor id="ds-table-striped" rotulo="striped" valor={striped} onChange={setStriped} />
        <Interruptor id="ds-table-outline" rotulo="outline" valor={moldura} onChange={setMoldura} />
      </div>
      <Table size={size} dividers={dividers} striped={striped} variant={moldura ? "outline" : "plain"}>
        <TableCaption>Lançamentos de março</TableCaption>
        <TableHeader variant={cabecalho} labels={labels}>
          <TableRow>
            <TableHead>Descrição</TableHead>
            <TableHead>Data</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead numeric>Valor</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {LINHAS.map((l) => (
            <TableRow key={l.desc} interactive state={l.status === "Prevista" ? "pending" : undefined}>
              <TableCell primary>
                <TableCellIdentity
                  media={<ColorTile size="xs" color={l.cor} />}
                  title={l.desc}
                  description={`${l.cat} · ${l.conta}`}
                />
              </TableCell>
              <TableCell className="nums text-muted-foreground">{l.data}</TableCell>
              <TableCell>
                <Badge size="sm" tone={l.status === "Prevista" ? "neutral" : "success"}>
                  {l.status}
                </Badge>
              </TableCell>
              <TableCell numeric>
                <TableCellMoney value={l.valor} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={3} className="text-muted-foreground">
              4 lançamentos
            </TableCell>
            <TableCell numeric>
              <TableCellMoney value={LINHAS.reduce((s, l) => s + l.valor, 0)} />
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  )
}

function DemoColunaFixa() {
  const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]
  const categorias = ["Alimentação", "Moradia", "Transporte", "Saúde", "Lazer"]
  return (
    <Table variant="outline" fade="none" className="min-w-[1100px]">
      <TableHeader variant="muted">
        <TableRow>
          <TableHead pin="start">Categoria</TableHead>
          {meses.map((m) => (
            <TableHead key={m} numeric>
              {m}
            </TableHead>
          ))}
          <TableHead pin="end" numeric>
            Total
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {categorias.map((c, i) => (
          <TableRow key={c} interactive>
            <TableCell pin="start" className="font-medium">
              {c}
            </TableCell>
            {meses.map((m, j) => (
              <TableCell key={m} numeric>
                <MoneyDisplay value={-(120 + ((i * 7 + j * 13) % 40) * 10)} />
              </TableCell>
            ))}
            <TableCell pin="end" numeric className="font-medium">
              <MoneyDisplay value={-(1440 + i * 610)} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function DemoGrupo() {
  const [aberto, setAberto] = React.useState({ mar: true, fev: true })
  const [marcadas, setMarcadas] = React.useState<Set<string>>(new Set(["Mercado"]))
  const grupos = [
    { id: "mar" as const, label: "Março de 2026", itens: LINHAS.slice(0, 2) },
    { id: "fev" as const, label: "Fevereiro de 2026", itens: LINHAS.slice(2) },
  ]
  return (
    <Table variant="outline">
      <TableHeader variant="muted">
        <TableRow>
          <TableHead selection>
            <span className="sr-only">Selecionar</span>
          </TableHead>
          <TableHead>Descrição</TableHead>
          <TableHead numeric>Valor</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {grupos.map((g) => {
          const n = g.itens.filter((l) => marcadas.has(l.desc)).length
          return (
            <React.Fragment key={g.id}>
              <TableGroupRow
                label={g.label}
                colSpan={3}
                total={<MoneyDisplay value={g.itens.reduce((s, l) => s + l.valor, 0)} signed />}
                collapsible
                open={aberto[g.id]}
                onOpenChange={(v) => setAberto((a) => ({ ...a, [g.id]: v }))}
                selection={{
                  checked: n === 0 ? false : n === g.itens.length ? true : "indeterminate",
                  label: `Selecionar ${g.label}`,
                  onCheckedChange: (v) =>
                    setMarcadas((s) => {
                      const novo = new Set(s)
                      for (const l of g.itens) {
                        if (v) novo.add(l.desc)
                        else novo.delete(l.desc)
                      }
                      return novo
                    }),
                }}
              />
              {aberto[g.id]
                ? g.itens.map((l) => (
                    <TableRow key={l.desc} data-state={marcadas.has(l.desc) ? "selected" : undefined}>
                      <TableCell selection>
                        <Checkbox
                          checked={marcadas.has(l.desc)}
                          aria-label={`Selecionar ${l.desc}`}
                          onCheckedChange={(v) =>
                            setMarcadas((s) => {
                              const novo = new Set(s)
                              if (v) novo.add(l.desc)
                              else novo.delete(l.desc)
                              return novo
                            })
                          }
                        />
                      </TableCell>
                      <TableCell>{l.desc}</TableCell>
                      <TableCell numeric>
                        <TableCellMoney value={l.valor} />
                      </TableCell>
                    </TableRow>
                  ))
                : null}
            </React.Fragment>
          )
        })}
      </TableBody>
    </Table>
  )
}

function DemoDetalhe() {
  const [aberta, setAberta] = React.useState<string | null>("Mercado")
  return (
    <Table variant="outline">
      <TableBody>
        {LINHAS.slice(0, 3).map((l) => {
          const id = `ds-table-detalhe-${l.desc}`
          const open = aberta === l.desc
          return (
            <React.Fragment key={l.desc}>
              <TableRow data-expanded={open ? "" : undefined} className={open ? "border-b-transparent" : undefined}>
                <TableCell className="w-px pe-0">
                  <TableExpandButton
                    expanded={open}
                    label={l.desc}
                    aria-controls={id}
                    onClick={() => setAberta(open ? null : l.desc)}
                  />
                </TableCell>
                <TableCell className="font-medium">{l.desc}</TableCell>
                <TableCell numeric>
                  <TableCellMoney value={l.valor} />
                </TableCell>
              </TableRow>
              <TableRowDetail open={open} colSpan={3} id={id}>
                <p className="text-sm text-muted-foreground">
                  {l.cat} · {l.conta} · {l.data}. O detalhe abre na mola da divulgação e fecha na curva.
                </p>
              </TableRowDetail>
            </React.Fragment>
          )
        })}
      </TableBody>
    </Table>
  )
}

function DemoDestaque() {
  const [valor, setValor] = React.useState(1284.6)
  return (
    <div className="flex w-full flex-col gap-3">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="self-start"
        onClick={() => setValor((v) => Math.round((v - 37.9) * 100) / 100)}
      >
        lançar −R$ 37,90
      </Button>
      <Table variant="outline" size="sm">
        <TableBody>
          <TableRow>
            <TableCell>Saldo da conta</TableCell>
            <TableCell numeric>
              <TableCellMoney value={valor} tone="none" signed={false} flash />
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  )
}

export default function TableDoc() {
  const [recarregando, setRecarregando] = React.useState(true)
  return (
    <>
      <Usage>
        Dados que se comparam <strong>coluna a coluna</strong>. Se ninguém compara valores entre linhas, é uma lista:{" "}
        <code>Item</code>. Com estado — ordenar, filtrar, marcar, paginar —, é o{" "}
        <Link href="/designsystem/data-table" className="underline">
          Data Table
        </Link>
        , que monta estas peças e a moldura com barra e rodapé, o <code>TablePanel</code>.
      </Usage>

      <DocSection
        title="Na tela"
        description="As peças de marcação, com os eixos todos: cinco densidades, três fios, zebra, o cabeçalho tingido ou não, o rótulo comum ou versalete, com moldura ou sem. A linha prevista sai apagada (state='pending'), a célula de identidade é o ladrilho com o par nome e legenda, e o valor pinta pelo sinal."
        code={`<Table size="md" dividers="rows" striped variant="outline">
  <TableHeader variant="muted" labels="text">…</TableHeader>
  <TableBody>
    <TableRow interactive state="pending">
      <TableCell primary>
        <TableCellIdentity media={<ColorTile size="xs" color={cor} />} title="Mercado" description="Alimentação · Nubank" />
      </TableCell>
      <TableCell numeric><TableCellMoney value={-128.4} /></TableCell>
    </TableRow>
  </TableBody>
  <TableFooter>…</TableFooter>
</Table>`}
        previewClassName="items-stretch"
      >
        <DemoNaTela />
      </DocSection>

      <DocNote title="A escada é a altura da linha">
        <code>xs</code> 32 · <code>sm</code> 36 · <code>md</code> 44 (o padrão) · <code>lg</code> 52 ·{" "}
        <code>xl</code> 64 — a escada de densidade do Carbon, com os nomes do sistema. Até a rodada 224 eram três: o{" "}
        <code>sm</code> de 28 virou <code>xs</code>, o <code>md</code> de 36 virou <code>sm</code> (as tabelas de
        referência deste catálogo o escrevem), e o <code>lg</code> de 44, a densidade dos painéis, virou o padrão. Do{" "}
        <code>md</code> para cima o recuo é 16, o da tira do painel: a coluna alinha com a barra de topo em qualquer
        densidade.
      </DocNote>

      <DocNote title="A zebra pesa menos que o cursor">
        <code>striped</code> pinta as linhas pares em <code>muted/20</code>, abaixo do realce do cursor (
        <code>muted/30</code>) e do selecionado (<code>muted</code>). O seletor vai em <code>:where()</code>, então o
        realce e a seleção da linha vencem sem disputa. Ela é para a linha larga que o olho atravessa — numa tabela
        curta, o fio já separa.
      </DocNote>

      <DocSection
        title="Coluna fixa"
        description="pin='start' e pin='end' grudam a coluna na borda ao rolar de lado. A sombra da emenda só acende quando há rolagem para aquele lado — role a tabela. Com coluna fixa a dissolução lateral sai (fade='none'): a máscara apagaria a coluna presa, e a sombra passa a dizer que há mais."
        code={`<Table fade="none">
  <TableHead pin="start">Categoria</TableHead> … <TableHead pin="end" numeric>Total</TableHead>
  <TableCell pin="start">Alimentação</TableCell> …
</Table>`}
        previewClassName="items-stretch"
      >
        <DemoColunaFixa />
      </DocSection>

      <DocNote title="A célula fixa pinta o fundo da linha">
        Ela é opaca — passa por cima das outras ao rolar —, então não pode ser transparente como as vizinhas. A linha
        publica o próprio tom já composto sobre o card (<code>--table-pin-bg</code>): no cursor, na seleção, na zebra e
        no cabeçalho tingido, a célula fixa acende junto.
      </DocNote>

      <DocSection
        title="Grupo com total"
        description="TableGroupRow é a faixa do mês: o nome, o total alinhado à coluna de valor, a caixa que marca os membros (com o indeterminado) e a seta que recolhe. A conta das colunas é de quem chama: colSpan é o total, trailing quantas vêm depois do valor."
        code={`<TableGroupRow
  label="Março de 2026"
  colSpan={3}
  total={<MoneyDisplay value={total} signed />}
  collapsible open={aberto} onOpenChange={setAberto}
  selection={{ checked: "indeterminate", onCheckedChange, label: "Selecionar março" }}
/>`}
        previewClassName="items-stretch"
      >
        <DemoGrupo />
      </DocSection>

      <DocSection
        title="Detalhe sob a linha"
        description="TableRowDetail abre uma linha de largura total na mola da divulgação — a altura vai de 0fr a 1fr numa grade —, e fecha na curva. A seta gira, e a linha de cima perde o fio enquanto ele está aberto."
        code={`<TableRow><TableCell><TableExpandButton expanded={open} label="Mercado" aria-controls={id} /></TableCell>…</TableRow>
<TableRowDetail open={open} colSpan={3} id={id}>…</TableRowDetail>`}
        previewClassName="items-stretch"
      >
        <DemoDetalhe />
      </DocSection>

      <DocSection
        title="Esperando, falhando, recarregando"
        description="TableSkeleton é a tabela que espera: o cabeçalho de verdade e os ossos na altura do degrau, depois de 300ms. TableError é a falha, com o tentar de novo. pending esmaece o corpo enquanto os dados novos chegam — os de antes continuam na tela."
        code={`<TableSkeleton columns={[{ label: "Descrição" }, { label: "Valor", numeric: true }]} rows={3} />
<TableError colSpan={2} title="Não foi possível carregar os lançamentos" onRetry={refetch}>
  O servidor não respondeu.
</TableError>
<Table pending={isFetching}>…</Table>`}
        previewClassName="flex-col items-stretch gap-6"
      >
        <TableSkeleton
          variant="outline"
          columns={[{ label: "Descrição" }, { label: "Data" }, { label: "Valor", numeric: true }]}
          rows={3}
          delay={false}
        />
        <Table variant="outline">
          <TableBody>
            <TableError
              colSpan={2}
              title="Não foi possível carregar os lançamentos"
              onRetry={() => new Promise((r) => window.setTimeout(r, 900))}
            >
              O servidor não respondeu. Seus dados estão salvos.
            </TableError>
          </TableBody>
        </Table>
        <div className="flex flex-col gap-2">
          <Interruptor id="ds-table-pending" rotulo="pending" valor={recarregando} onChange={setRecarregando} />
          <Table variant="outline" pending={recarregando}>
            <TableBody>
              {LINHAS.slice(0, 2).map((l) => (
                <TableRow key={l.desc}>
                  <TableCell>{l.desc}</TableCell>
                  <TableCell numeric>
                    <TableCellMoney value={l.valor} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </DocSection>

      <DocSection
        title="O valor que muda acende"
        description="TableCellMoney flash acende o fundo quando o valor troca — 500ms parado, 1s esmaecendo, os números do AG Grid —, e a primeira pintura não acende. tone='none' deixa o saldo neutro: saldo não é dinheiro entrando nem saindo."
        code={`<TableCellMoney value={saldo} tone="none" signed={false} flash />`}
        previewClassName="items-stretch"
      >
        <DemoDestaque />
      </DocSection>

      <DocSection
        title="Vazia"
        description="TableEmpty é a linha de largura total. Aceita texto simples, que vira Muted, ou um EmptyState com ícone e ação."
        code={`<TableEmpty colSpan={2}>Nenhuma transação neste período.</TableEmpty>`}
        previewClassName="flex-col items-stretch gap-6"
      >
        <Table variant="outline">
          <TableBody>
            <TableEmpty colSpan={2}>Nenhuma transação neste período.</TableEmpty>
          </TableBody>
        </Table>
        <Table variant="outline">
          <TableBody>
            <TableEmpty colSpan={2}>
              <EmptyState variant="plain" size="sm">
                <EmptyStateIcon>
                  <InboxIcon aria-hidden />
                </EmptyStateIcon>
                <EmptyStateTitle>Nenhuma transação</EmptyStateTitle>
                <EmptyStateDescription>Ajuste o período ou o filtro.</EmptyStateDescription>
              </EmptyState>
            </TableEmpty>
          </TableBody>
        </Table>
      </DocSection>

      <DocNote title="A linha clicável recebe o teclado">
        <code>interactive</code> liga o realce, o <code>active</code> e o anel de foco — e desde a rodada 225 a linha
        entra na ordem do Tab e abre com Enter. Ela era um <code>&lt;tr onClick&gt;</code> que só o mouse alcançava.
        Realce onde clicar não faz nada é promessa falsa, por isso ele continua opt-in. A seleção é{" "}
        <code>data-state=&quot;selected&quot;</code>; <code>state=&quot;current&quot;</code> é a linha de agora (a
        parcela vigente), com <code>aria-current</code>.
      </DocNote>

      <DocNote title="A seta gira, e só a coluna ordenada diz o sentido">
        Com <code>onSort</code> o rótulo vira botão, e a seta gira na mola de crescente para decrescente. O{" "}
        <code>aria-sort</code> vai só na coluna ordenada, como no padrão de tabela ordenável do W3C: &ldquo;não
        ordenada&rdquo; em todo cabeçalho seria ruído. <code>sortIndex</code> escreve a ordem numa ordenação por várias
        colunas.
      </DocNote>

      <DocNote title="Lista mista pede signed, e o saldo não pinta">
        Entrada e saída na mesma coluna pedem o sinal: sem ele, quem não distingue verde de vermelho lê as duas linhas
        como idênticas. <code>TableCellMoney</code> já vem com ele. Ver{" "}
        <Link href="/designsystem/money-display" className="underline">
          Money Display
        </Link>
        .
      </DocNote>

      <PropsTable
        title="Props de Table"
        rows={[
          { prop: "size", type: '"xs" | "sm" | "md" | "lg" | "xl"', default: '"md"', description: "A altura da linha: 32 · 36 · 44 · 52 · 64. Herdada do painel e da densidade do Data Table." },
          { prop: "variant", type: '"plain" | "outline"', default: '"plain"', description: "outline monta a própria caixa, fora do viewport." },
          { prop: "dividers", type: '"rows" | "none" | "grid"', default: '"rows"', description: "O fio entre as linhas; grid soma o vertical." },
          { prop: "striped", type: "boolean", default: "false", description: "A zebra, abaixo do realce do cursor." },
          { prop: "pending", type: "boolean", default: "false", description: "A recarga: o corpo a 60% e aria-busy." },
          { prop: "fade", type: '"sides" | "bottom" | "none"', default: '"sides"', description: "A borda que dissolve; none para a coluna fixa." },
          { prop: "viewportClassName / viewportRef", type: "string / (el) => void", description: "O teto do viewport (para o cabeçalho fixo) e o nó que rola." },
        ]}
      />

      <PropsTable
        title="Linhas e células"
        rows={[
          { prop: "TableHeader", type: '{ variant: "plain" | "muted", labels: "text" | "caps", sticky }', description: "O cabeçalho; sticky precisa de teto." },
          { prop: "TableRow", type: '{ interactive, state: "current" | "pending", variant: "group", asChild }', description: "A linha clicável (Tab e Enter), a de agora, a prevista." },
          { prop: "TableHead", type: "{ numeric, selection, actions, pin, sort, sortIndex, onSort }", description: "onSort recebe o clique (o Shift soma colunas)." },
          { prop: "TableCell", type: "{ numeric, selection, actions, pin, primary }", description: "actions dá tooltip aos botões e deixa o destrutivo neutro." },
          { prop: "TableBody", type: "{ reveal }", description: "As linhas sobem em cascata (3px, 160ms, 40 + 30ms·i)." },
        ]}
      />

      <PropsTable
        title="Peças"
        rows={[
          { prop: "TableGroupRow", type: "{ label, total, colSpan, trailing, selection, collapsible, open, onOpenChange }", description: "A faixa de grupo completa." },
          { prop: "TableRowDetail / TableExpandButton", type: "{ open, colSpan, id } / { expanded, label }", description: "O detalhe que abre na mola e a seta que gira." },
          { prop: "TableSkeleton", type: "{ columns, rows, header, label, delay }", description: "A tabela que espera, no SkeletonGroup." },
          { prop: "TableError / TableEmpty", type: "{ colSpan, title, children, onRetry } / { colSpan }", description: "A falha (o ícone no tom de erro, o título e o porquê; um onRetry com Promise mostra a roda) e o vazio, de largura total." },
          { prop: "TableCellIdentity", type: "{ media, title, description }", description: "O ladrilho e o par nome/legenda, sem gap." },
          { prop: "TableCellMoney", type: '{ value, flash, signed, tone: "sign" | "none" }', description: "O valor pelo sinal; flash acende ao mudar." },
        ]}
      />
    </>
  )
}
