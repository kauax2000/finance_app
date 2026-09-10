"use client"

import * as React from "react"
import Link from "next/link"
import { InboxIcon } from "@heroicons/react/16/solid"

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
        compara os valores entre linhas, a informação é uma lista, e o
        componente é <code>Item</code>. Se o que falta é a moldura, a barra de
        ações e o rodapé de paginação que o app desenha em volta dela, é{" "}
        <Link href="/designsystem/table-panel" className="underline">
          Table Panel
        </Link>
        .
      </Usage>

      <DocSection
        title="Padrão"
        description="Valores numéricos alinham à direita com numeric — sem isso a coluna dança a cada dígito e some justamente a vantagem da tabela."
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
        description="sm é a densidade das mini-tabelas de folha (parcelas, faturas). md é o padrão — a mesma densidade que PropsTable, logo abaixo desta página, já renderiza. lg é o painel de transações e assinaturas: o px dele (16) é o mesmo --card-strip-px do Card padding='none', o que alinha a coluna com a barra de topo de um Table Panel."
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
        description="labels='text' é o rótulo comum. labels='caps' é a régua versalete — caixa alta, tracking-wider, sempre text-2xs — que as mini-tabelas de folha e a coluna de ações já escreviam à mão. variant='muted' tinge o fundo, com o mesmo bg-muted/50 que 4 painéis do app já usavam."
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

      <DocNote title="A régua da Table não é a do Command, e o comentário de lá estava errado">
        O cabeçalho de grupo da paleta de comandos (<code>command.tsx</code>)
        afirmava que já seguia &ldquo;a mesma régua que o cabeçalho da{" "}
        <code>Table</code> já usa neste projeto&rdquo; — e não seguia:{" "}
        <code>TableHead</code> sempre foi <code>text-xs font-medium</code>, sem
        versalete nenhum. O comentário passou a apontar para{" "}
        <code>labels=&quot;caps&quot;</code>, que agora existe de verdade.
      </DocNote>

      <DocSection
        title="Cabeçalho fixo"
        description="sticky gruda o cabeçalho no topo do viewport. Como o viewport rola nos dois eixos (overflow-x-auto promove overflow-y a auto), ele só cola de verdade com um teto — viewportClassName='max-h-*' no Table pai. Com fade='bottom' ele é vidro: as linhas passam por trás borradas; com fade='sides', opaco."
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
        description="plain (o padrão) não desenha nada — é a forma para dentro de um Card padding='none' ou de um Table Panel, onde quem fecha a borda é o contêiner. outline monta a própria caixa, para uma tabela solta — as 3 mini-tabelas de folha (parcelas, faturas, eventos de pagamento) escreviam essa moldura à mão, byte a byte."
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
        O nó que rola na horizontal (<code>data-slot=&quot;table-viewport&quot;</code>) não
        pode desenhar <code>bg</code>, <code>border</code>, <code>rounded</code> nem{" "}
        <code>shadow</code> — é a invariante 2 da dissolução: a máscara recorta
        o alfa do elemento inteiro, e uma caixa com os quatro cantos apagados
        lê como bug. Por isso <code>variant=&quot;outline&quot;</code> é um nó{" "}
        <strong>irmão</strong> do viewport, nunca ele.
      </DocNote>

      <DocSection
        title="Linha interativa"
        description="interactive é opt-in. O hover ligado sempre foi uma promessa falsa em toda tabela de referência — nada acontece ao clicar. Sem ele, só o fio e o estado selecionado, que é estado e não resposta ao cursor. A célula primary é o nome da linha: sublinha junto do realce, e só numa linha interativa — a de baixo tem primary e não acende."
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
        description="A faixa de seção — a linha de mês que a tabela de transações já pinta à mão. Nunca interativa; a célula que abre o grupo leva colSpan."
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
        description="TableEmpty é a linha de largura total — 6 telas escreviam o <td colSpan> à mão. Aceita texto simples, que vira Muted, ou um EmptyState inteiro para o caso que precisa de ícone e ação."
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
        description="Cada linha vira um cartão. A troca é por CSS, com dois gêmeos e hidden — nunca por um hook de largura, que devolve o valor errado no servidor e no primeiro quadro, e faz a tela piscar."
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
        Entrada e saída na mesma coluna: por isso o <code>signed</code>. Sem
        ele, quem não distingue verde de vermelho lê as duas linhas como
        idênticas — é o argumento de{" "}
        <Link href="/designsystem/dinheiro" className="underline">
          Dinheiro
        </Link>
        .
      </DocNote>

      <DocNote title="O cartão perde o &lt;th&gt;, então rotula o dado">
        No cartão a coluna não existe, então o rótulo vai junto do valor — e
        com a <strong>mesma palavra</strong> do cabeçalho da tabela irmã. Duas
        palavras para o mesmo dado são duas coisas diferentes para quem lê.
      </DocNote>

      <DocNote title="Não existe DataTable neste catálogo">
        A versão com ordenação e filtro embutidos depende de{" "}
        <code>@tanstack/react-table</code>, que o projeto não tem. O que{" "}
        <code>sort</code>/<code>onSort</code> entregam é ordenação de estado
        local — a seção acima é a demonstração inteira do que existe.
      </DocNote>

      <PropsTable
        title="Props de Table"
        rows={[
          {
            prop: "variant",
            type: '"plain" | "outline"',
            default: '"plain"',
            description: "plain não desenha moldura; outline monta a própria caixa, fora do viewport que a dissolução mascara.",
          },
          {
            prop: "size",
            type: '"sm" | "md" | "lg"',
            default: '"md"',
            description: "A densidade — herdada de Table Panel quando existe, e sobrescrevível aqui.",
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
            description:
              "A borda que dissolve. bottom é para o corpo com teto de altura: as linhas passam por trás do rodapé do TablePanel e dissolvem, como no Command, e substitui a lateral (um gradiente por elemento).",
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
            description: "muted tinge o fundo — o bg-muted/50 que 4 painéis já escreviam à mão.",
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
            description: "Gruda no topo do viewport — precisa de viewportClassName com um teto. Vidro sob fade='bottom' (as linhas passam por trás borradas); opaco sob fade='sides'.",
          },
          {
            prop: "TableRow.interactive",
            type: "boolean",
            default: "false",
            description: "Liga hover/active e o anel de foco. Sem ele, a linha não responde ao cursor.",
          },
          {
            prop: "TableCell.primary",
            type: "boolean",
            default: "false",
            description:
              "O nome da linha. Numa linha interactive sublinha junto do bg-muted/30 — o traço fica no nome, nunca no valor. Sem interactive, não acende.",
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
              "A última coluna: encolhe até os botões, alinha à direita e monta a fileira. O recuo horizontal é o do degrau; o vertical sai, para o botão não esticar a linha. No cabeçalho o rótulo é só do leitor de tela (sr-only, padrão “Ações”; children troca). Cada botão com aria-label ganha um tooltip sm com o mesmo texto, e todos ganham o realce bg-current/10 — o do tertiary sumia sobre a linha acesa. A ação com variant=\"destructive\" fica neutra em repouso e vira o botão destructive no cursor e no toque.",
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
