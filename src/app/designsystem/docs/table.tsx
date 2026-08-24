"use client"

import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { MoneyDisplay } from "@/components/ui/money-display"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
} from "@/components/ui/item"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { DocNote, DocSection, Usage } from "../ds-doc"

const LINHAS = [
  { desc: "Mercado", cat: "Alimentação", data: "12/03", valor: -128.4, status: "Efetivada" },
  { desc: "Salário", cat: "Renda", data: "05/03", valor: 8432.15, status: "Efetivada" },
  { desc: "Streaming", cat: "Assinaturas", data: "03/03", valor: -39.9, status: "Prevista" },
]

export default function TableDoc() {
  return (
    <>
      <Usage>
        Dados que se comparam <strong>coluna a coluna</strong>. Se ninguém compara
        os valores entre linhas, a informação é uma lista, e o componente é{" "}
        <code>Item</code>. Tabela existe para o olho descer uma coluna.
      </Usage>

      <DocSection
        title="Padrão"
        description="Valores numéricos alinham à direita e usam .nums: sem isso, a coluna dança a cada dígito e some justamente a vantagem da tabela."
        code={`<Table>
  <TableHeader>
    <TableRow><TableHead>Descrição</TableHead><TableHead className="text-right">Valor</TableHead></TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>Mercado</TableCell>
      <TableCell className="text-right"><MoneyDisplay value={-128.4} tone="expense" /></TableCell>
    </TableRow>
  </TableBody>
</Table>`}
        previewClassName="items-stretch"
      >
        <div className="w-full overflow-x-auto">
          <Table>
            <TableCaption>Transações de março</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Descrição</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {LINHAS.map((l) => (
                <TableRow key={l.desc}>
                  <TableCell className="font-medium">{l.desc}</TableCell>
                  <TableCell className="text-muted-foreground">{l.cat}</TableCell>
                  <TableCell className="nums text-muted-foreground">
                    {l.data}
                  </TableCell>
                  <TableCell className="text-right">
                    <MoneyDisplay
                      value={l.valor}
                      signed
                      tone={l.valor < 0 ? "expense" : "income"}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
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
            <Item key={l.desc} variant="outline" className="mb-2">
              <ItemContent>
                <ItemTitle>{l.desc}</ItemTitle>
                <ItemDescription>
                  {l.cat} · {l.data}
                </ItemDescription>
              </ItemContent>
              <ItemActions>
                <Badge size="xs" variant={l.status === "Prevista" ? "secondary" : "success"}>
                  {l.status}
                </Badge>
                <MoneyDisplay
                  value={l.valor}
                  tone={l.valor < 0 ? "expense" : "income"}
                />
              </ItemActions>
            </Item>
          ))}
        </ItemGroup>
      </DocSection>

      <DocNote title="Lista mista pede signed, e este exemplo é normativo">
        Entrada e saída na mesma coluna: por isso o <code>signed</code>. Sem ele,
        quem não distingue verde de vermelho lê as duas linhas como idênticas — é
        o argumento da página{" "}
        <Link href="/designsystem/dinheiro" className="underline">
          Dinheiro
        </Link>
        , e um exemplo de design system é copiado antes de ser lido.
      </DocNote>

      <DocNote title="O cartão perde o &lt;th&gt;, então rotula o dado">
        Numa tabela, a coluna diz o que o valor significa. No cartão essa coluna
        não existe, então o rótulo precisa ir junto do valor — e com a{" "}
        <strong>mesma palavra</strong>{" "}
        do cabeçalho da tabela irmã. Duas palavras
        diferentes para o mesmo dado são duas coisas diferentes para quem lê.
      </DocNote>

      <DocNote title="Não existe DataTable neste catálogo">
        A versão com ordenação, filtro e paginação embutidos depende de{" "}
        <code>@tanstack/react-table</code>, que o projeto não tem, e hoje não há
        nenhuma tela que a consumiria. Instalar a biblioteca e escrever o
        invólucro agora seria inventar variants antes do primeiro caso de uso.
      </DocNote>
    </>
  )
}
