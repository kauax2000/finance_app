"use client"

import { InboxIcon } from "@heroicons/react/24/outline"
import * as React from "react"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import {
  EmptyState,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
} from "@/components/ui/empty-state"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
} from "@/components/ui/item"
import { MoneyDisplay } from "@/components/ui/money-display"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

const LINHAS = [
  { desc: "Mercado", cat: "Alimentação", data: "12/03", valor: -128.4, status: "Efetivada" },
  { desc: "Salário", cat: "Renda", data: "05/03", valor: 8432.15, status: "Efetivada" },
  { desc: "Streaming", cat: "Assinaturas", data: "03/03", valor: -39.9, status: "Prevista" },
] as const

const LINHAS_MES = [
  { grupo: "Março de 2026", itens: LINHAS.slice(0, 2) },
  { grupo: "Fevereiro de 2026", itens: LINHAS.slice(2) },
] as const

type Sentido = "asc" | "desc" | "none"

function TabelaOrdenavel() {
  const [coluna, setColuna] = React.useState<"desc" | "valor">("desc")
  const [sentido, setSentido] = React.useState<Sentido>("asc")

  const linhas = React.useMemo(() => {
    const copia = [...LINHAS]
    if (sentido === "none") return copia
    copia.sort((a, b) => {
      const cmp =
        coluna === "valor" ? a.valor - b.valor : a.desc.localeCompare(b.desc)
      return sentido === "asc" ? cmp : -cmp
    })
    return copia
  }, [coluna, sentido])

  const ordenarPor = (col: "desc" | "valor") => {
    if (col !== coluna) {
      setColuna(col)
      setSentido("asc")
      return
    }
    setSentido((s) => (s === "asc" ? "desc" : s === "desc" ? "none" : "asc"))
  }

  return (
    <Table className="w-full">
      <TableHeader>
        <TableRow>
          <TableHead
            sort={coluna === "desc" ? sentido : "none"}
            onSort={() => ordenarPor("desc")}
          >
            Descrição
          </TableHead>
          <TableHead
            numeric
            sort={coluna === "valor" ? sentido : "none"}
            onSort={() => ordenarPor("valor")}
          >
            Valor
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {linhas.map((l) => (
          <TableRow key={l.desc}>
            <TableCell className="font-medium">{l.desc}</TableCell>
            <TableCell numeric>
              <MoneyDisplay value={l.valor} signed tone={l.valor < 0 ? "expense" : "income"} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export default function TableDoc() {
  return (
    <>
      <Usage>
        Dados que se comparam <strong>coluna a coluna</strong>. Se ninguém
        compara valores entre linhas, é uma lista: <code>Item</code>. Com
        moldura, barra de ações e rodapé de paginação, é{" "}
        <Link href="/designsystem/table-panel" className="underline">
          Table Panel
        </Link>
        .
      </Usage>

      <DocSection
        title="Padrão"
        description="Valores numéricos alinham à direita com numeric; sem isso a coluna dança a cada dígito e a tabela perde a vantagem."
        code={`<Table>
  <TableHeader>
    <TableRow><TableHead>Descrição</TableHead><TableHead numeric>Valor</TableHead></TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>Mercado</TableCell>
      <TableCell numeric><MoneyDisplay value={-128.4} tone="expense" /></TableCell>
    </TableRow>
  </TableBody>
</Table>`}
        previewClassName="items-stretch"
      >
        <Table>
          <TableCaption>Transações de março</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Descrição</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Data</TableHead>
              <TableHead numeric>Valor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {LINHAS.map((l) => (
              <TableRow key={l.desc}>
                <TableCell className="font-medium">{l.desc}</TableCell>
                <TableCell className="text-muted-foreground">{l.cat}</TableCell>
                <TableCell className="nums text-muted-foreground">{l.data}</TableCell>
                <TableCell numeric>
                  <MoneyDisplay value={l.valor} signed tone={l.valor < 0 ? "expense" : "income"} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DocSection>

      <DocSection
        title="A escada"
        description="sm para as mini-tabelas de folha (parcelas, faturas); md é o padrão; lg para painéis de transações, com px de 16 (o --card-strip-px), que alinha a coluna com a barra de topo de um Table Panel."
        code={`<Table size="sm">…</Table>
<Table>…</Table>       {/* md, o padrão */}
<Table size="lg">…</Table>`}
        previewClassName="flex-col items-stretch gap-8"
      >
        {(["sm", "md", "lg"] as const).map((size) => (
          <div key={size} className="flex flex-col gap-2">
            <span className="font-mono text-xs text-muted-foreground">size=&quot;{size}&quot;</span>
            <Table size={size} variant="outline">
              <TableHeader variant="muted">
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead numeric>Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {LINHAS.map((l) => (
                  <TableRow key={l.desc}>
                    <TableCell>{l.desc}</TableCell>
                    <TableCell numeric>
                      <MoneyDisplay value={l.valor} signed tone={l.valor < 0 ? "expense" : "income"} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ))}
      </DocSection>

      <DocSection
        title="O cabeçalho"
        description="labels='text' é o rótulo comum; labels='caps' é a régua versalete: caixa alta, tracking-wider, sempre text-2xs. variant='muted' tinge o fundo."
        code={`<TableHeader>…</TableHeader>                           {/* text, o padrão */}
<TableHeader labels="caps">…</TableHeader>
<TableHeader variant="muted" labels="caps">…</TableHeader>`}
        previewClassName="flex-col items-stretch gap-6"
      >
        {(
          [
            [{}, "text — o padrão"],
            [{ labels: "caps" as const }, "caps — versalete"],
            [{ variant: "muted" as const, labels: "caps" as const }, "muted + caps"],
          ] as const
        ).map(([props, rotulo]) => (
          <div key={rotulo} className="flex flex-col gap-2">
            <span className="font-mono text-xs text-muted-foreground">{rotulo}</span>
            <Table variant="outline">
              <TableHeader {...props}>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead numeric>Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>Mercado</TableCell>
                  <TableCell numeric>
                    <MoneyDisplay value={-128.4} tone="expense" />
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        ))}
      </DocSection>


      <DocSection
        title="Cabeçalho fixo"
        description="sticky gruda o cabeçalho no topo do viewport, mas só com um teto — viewportClassName='max-h-*' no Table —, porque o viewport rola nos dois eixos. Com fade='bottom' ele é vidro; com fade='sides', opaco."
        code={`<Table variant="outline" viewportClassName="max-h-40">
  <TableHeader variant="muted" sticky>…</TableHeader>
  <TableBody>…</TableBody>
</Table>`}
        previewClassName="items-stretch"
      >
        <Table variant="outline" viewportClassName="max-h-40">
          <TableHeader variant="muted" sticky>
            <TableRow>
              <TableHead>Descrição</TableHead>
              <TableHead numeric>Valor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 10 }, (_, i) => (
              <TableRow key={i}>
                <TableCell>Linha {i + 1}</TableCell>
                <TableCell numeric>
                  <MoneyDisplay value={100 + i} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DocSection>

      <DocSection
        title="Moldura"
        description="plain (o padrão) não desenha nada: para dentro de um Card padding='none' ou de um Table Panel, onde o contêiner fecha a borda. outline monta a própria caixa, para uma tabela solta."
        code={`<Table>…</Table>                    {/* plain — dentro de um Card padding="none" */}
<Table variant="outline" size="sm">…</Table>`}
        previewClassName="items-stretch"
      >
        <Table variant="outline" size="sm">
          <TableHeader>
            <TableRow>
              <TableHead>Parcela</TableHead>
              <TableHead numeric>Valor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>1 de 12</TableCell>
              <TableCell numeric><MoneyDisplay value={128.4} /></TableCell>
            </TableRow>
            <TableRow>
              <TableCell>2 de 12</TableCell>
              <TableCell numeric><MoneyDisplay value={128.4} /></TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </DocSection>

      <DocNote title="A moldura mora fora do viewport que a dissolução mascara">
        O viewport que rola (<code>data-slot=&quot;table-viewport&quot;</code>)
        não pode desenhar <code>bg</code>, <code>border</code>,{" "}
        <code>rounded</code> nem <code>shadow</code>: a máscara recorta o alfa
        do elemento inteiro e apagaria os cantos. Por isso{" "}
        <code>variant=&quot;outline&quot;</code> é um nó <strong>irmão</strong>{" "}
        do viewport.
      </DocNote>

      <DocSection
        title="Linha interativa"
        description="interactive é opt-in: realce ao cursor onde clicar não faz nada é promessa falsa. Selecionado é estado, e vale sem ele. A célula primary é o nome da linha e sublinha junto do realce, só em linha interativa."
        code={`<TableRow interactive onClick={…}>
  <TableCell primary>Mercado</TableCell>
  <TableCell numeric>…</TableCell>
</TableRow>
<TableRow data-state="selected">…</TableRow>`}
        previewClassName="items-stretch"
      >
        <Table variant="outline">
          <TableBody>
            <TableRow interactive>
              <TableCell primary>Passe o cursor aqui</TableCell>
              <TableCell numeric className="text-muted-foreground">interactive</TableCell>
            </TableRow>
            <TableRow interactive data-state="selected">
              <TableCell primary>Esta está selecionada</TableCell>
              <TableCell numeric className="text-muted-foreground">selected</TableCell>
            </TableRow>
            <TableRow>
              <TableCell primary>Esta não responde ao cursor</TableCell>
              <TableCell numeric className="text-muted-foreground">— (padrão)</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </DocSection>

      <DocSection
        title="Linha de grupo"
        description="A faixa de seção, como a linha de mês. Nunca interativa; a célula que abre o grupo leva colSpan."
        code={`<TableRow variant="group">
  <TableCell colSpan={2}>Março de 2026</TableCell>
</TableRow>`}
        previewClassName="items-stretch"
      >
        <Table variant="outline">
          <TableBody>
            {LINHAS_MES.map((mes) => (
              <React.Fragment key={mes.grupo}>
                <TableRow variant="group">
                  <TableCell colSpan={2}>{mes.grupo}</TableCell>
                </TableRow>
                {mes.itens.map((l) => (
                  <TableRow key={l.desc}>
                    <TableCell>{l.desc}</TableCell>
                    <TableCell numeric>
                      <MoneyDisplay value={l.valor} signed tone={l.valor < 0 ? "expense" : "income"} />
                    </TableCell>
                  </TableRow>
                ))}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </DocSection>

      <DocSection
        title="Ordenação"
        description="sort troca o rótulo por um botão com a seta, e o th escreve aria-sort. O estado de qual coluna e qual sentido é de quem chama — clique nos cabeçalhos abaixo."
        code={`<TableHead sort={sentido} onSort={() => …}>Valor</TableHead>`}
        previewClassName="items-stretch"
      >
        <TabelaOrdenavel />
      </DocSection>

      <DocSection
        title="Vazia"
        description="TableEmpty é a linha de largura total. Aceita texto simples, que vira Muted, ou um EmptyState com ícone e ação."
        code={`<TableEmpty colSpan={2}>Nenhuma transação neste período.</TableEmpty>

<TableEmpty colSpan={2}>
  <EmptyState variant="plain" size="sm">
    <EmptyStateIcon><InboxIcon /></EmptyStateIcon>
    <EmptyStateTitle>Nenhuma transação</EmptyStateTitle>
    <EmptyStateDescription>Ajuste o período ou o filtro.</EmptyStateDescription>
  </EmptyState>
</TableEmpty>`}
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

      <DocSection
        title="A mesma tabela no telefone"
        description="Cada linha vira um cartão. A troca é por CSS, com dois gêmeos e hidden — nunca por hook de largura, que erra no servidor e no primeiro quadro e faz a tela piscar."
        code={`{/* desktop */}
<div className="hidden md:block"><Table>…</Table></div>

{/* telefone */}
<ItemGroup className="md:hidden">
  <Item>…</Item>
</ItemGroup>`}
        previewClassName="items-stretch"
      >
        <ItemGroup className="w-full">
          {LINHAS.map((l) => (
            <Item key={l.desc} variant="outline">
              <ItemContent>
                <ItemTitle>{l.desc}</ItemTitle>
                <ItemDescription>
                  {l.cat} · {l.data}
                </ItemDescription>
              </ItemContent>
              <ItemActions>
                <Badge size="xs" tone={l.status === "Prevista" ? "neutral" : "success"}>
                  {l.status}
                </Badge>
                <MoneyDisplay value={l.valor} signed tone={l.valor < 0 ? "expense" : "income"} />
              </ItemActions>
            </Item>
          ))}
        </ItemGroup>
      </DocSection>

      <DocNote title="Lista mista pede signed, e este exemplo é normativo">
        Entrada e saída na mesma coluna pedem <code>signed</code>: sem ele, quem
        não distingue verde de vermelho lê as duas linhas como idênticas. Ver{" "}
        <Link href="/designsystem/money-display" className="underline">
          Money Display
        </Link>
        .
      </DocNote>

      <DocNote title="O cartão perde o &lt;th&gt;, então rotula o dado">
        No cartão a coluna não existe, então o rótulo vai junto do valor, com a{" "}
        <strong>mesma palavra</strong> do cabeçalho da tabela irmã. Duas
        palavras para o mesmo dado leem como duas coisas.
      </DocNote>

      <DocNote title="Não existe DataTable neste catálogo">
        Ordenação e filtro embutidos dependeriam de{" "}
        <code>@tanstack/react-table</code>, que o projeto não tem.{" "}
        <code>sort</code>/<code>onSort</code> cobrem a ordenação de estado local.
      </DocNote>

      <PropsTable
        title="Props de Table"
        rows={[
          {
            prop: "variant",
            type: '"plain" | "outline"',
            default: '"plain"',
            description: "plain não desenha moldura; outline monta a própria caixa, fora do viewport.",
          },
          {
            prop: "size",
            type: '"sm" | "md" | "lg"',
            default: '"md"',
            description: "A densidade; herdada do Table Panel quando existe.",
          },
          {
            prop: "viewportClassName",
            type: "string",
            description: "Teto de altura do viewport — o que um TableHeader sticky exige para colar.",
          },
          {
            prop: "fade",
            type: '"sides" | "bottom"',
            default: '"sides"',
            description: "A borda que dissolve; bottom é para corpo com teto de altura e substitui a lateral.",
          },
        ]}
      />

      <PropsTable
        title="Props de TableHeader / TableRow"
        rows={[
          {
            prop: "TableHeader.variant",
            type: '"plain" | "muted"',
            default: '"plain"',
            description: "muted tinge o fundo com bg-muted/50.",
          },
          {
            prop: "TableHeader.labels",
            type: '"text" | "caps"',
            default: '"text"',
            description: "caps é a régua versalete: caixa alta, tracking-wider, sempre text-2xs.",
          },
          {
            prop: "TableHeader.sticky",
            type: "boolean",
            default: "false",
            description: "Gruda no topo do viewport; precisa de teto em viewportClassName.",
          },
          {
            prop: "TableRow.interactive",
            type: "boolean",
            default: "false",
            description: "Liga o realce ao cursor, o active e o anel de foco.",
          },
          {
            prop: "TableCell.primary",
            type: "boolean",
            default: "false",
            description: "O nome da linha; numa linha interactive sublinha junto do realce, nunca no valor.",
          },
          {
            prop: "TableRow.variant",
            type: '"default" | "group"',
            default: '"default"',
            description: "group é a faixa de seção — nunca interativa.",
          },
        ]}
      />

      <PropsTable
        title="Props de TableHead / TableCell"
        rows={[
          {
            prop: "numeric",
            type: "boolean",
            default: "false",
            description: "Alinha à direita e liga .nums (na célula, também whitespace-nowrap).",
          },
          {
            prop: "selection",
            type: "boolean",
            default: "false",
            description: "Reserva a largura da coluna de checkbox.",
          },
          {
            prop: "actions",
            type: "boolean",
            default: "false",
            description:
              "A última coluna: encolhe até os botões e alinha à direita. No cabeçalho o rótulo é sr-only (padrão “Ações”); cada botão com aria-label ganha tooltip, e o destructive fica neutro até o cursor ou o toque.",
          },
          {
            prop: "TableHead.sort",
            type: '"asc" | "desc" | "none"',
            description: "O estado atual da coluna — de quem chama.",
          },
          {
            prop: "TableHead.onSort",
            type: "() => void",
            description: "Presente, troca o rótulo por um botão com a seta e escreve aria-sort.",
          },
        ]}
      />
    </>
  )
}
