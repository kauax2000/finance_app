"use client"

import * as React from "react"
import { TrashIcon } from "@heroicons/react/16/solid"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { MoneyDisplay } from "@/components/ui/money-display"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationStatus,
} from "@/components/ui/pagination"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { TablePanel, TablePanelFooter, TablePanelToolbar } from "@/components/ui/table-panel"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

const LINHAS = [
  { id: "1", desc: "Mercado", cat: "Alimentação", data: "12/03", valor: -128.4 },
  { id: "2", desc: "Salário", cat: "Renda", data: "05/03", valor: 8432.15 },
  { id: "3", desc: "Streaming", cat: "Assinaturas", data: "03/03", valor: -39.9 },
] as const

function PainelComSelecao() {
  const [marcados, setMarcados] = React.useState<Set<string>>(new Set())
  const alternar = (id: string) =>
    setMarcados((s) => {
      const proximo = new Set(s)
      if (proximo.has(id)) {
        proximo.delete(id)
      } else {
        proximo.add(id)
      }
      return proximo
    })

  return (
    <TablePanel className="w-full">
      <TablePanelToolbar>
        {marcados.size > 0 ? (
          <>
            <span className="text-sm font-medium text-foreground">
              {marcados.size} selecionada{marcados.size > 1 ? "s" : ""}
            </span>
            <Button type="button" variant="destructive" size="xs">
              <TrashIcon aria-hidden />
              Excluir
            </Button>
          </>
        ) : (
          <span>{LINHAS.length} transações</span>
        )}
      </TablePanelToolbar>
      <Table>
        <TableHeader variant="muted">
          <TableRow>
            <TableHead selection>
              <Checkbox
                checked={marcados.size === LINHAS.length}
                onCheckedChange={() =>
                  setMarcados((s) =>
                    s.size === LINHAS.length ? new Set() : new Set(LINHAS.map((l) => l.id))
                  )
                }
                aria-label="Selecionar todas"
              />
            </TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead numeric>Valor</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {LINHAS.map((l) => (
            <TableRow key={l.id} data-state={marcados.has(l.id) ? "selected" : undefined}>
              <TableCell selection>
                <Checkbox
                  checked={marcados.has(l.id)}
                  onCheckedChange={() => alternar(l.id)}
                  aria-label={`Selecionar ${l.desc}`}
                />
              </TableCell>
              <TableCell className="font-medium">{l.desc}</TableCell>
              <TableCell numeric>
                <MoneyDisplay value={l.valor} signed tone={l.valor < 0 ? "expense" : "income"} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TablePanel>
  )
}

export default function TablePanelDoc() {
  return (
    <>
      <Usage>
        A tabela como o app a mostra: moldura, barra de ações, cabeçalho e
        rodapé de paginação. Se o conteúdo é só a tabela — sem contagem, sem
        seleção, sem página — o componente é{" "}
        <code>Table</code>, dentro de um <code>Card padding=&quot;none&quot;</code> comum.
      </Usage>

      <DocSection
        title="Padrão"
        description="Card padding='none' variant='outline' com a densidade lg herdada — nenhuma tela dentro do painel escreve size. A barra de topo e o rodapé são CardToolbar e CardNote com outro nome."
        code={`<TablePanel>
  <TablePanelToolbar>3 transações</TablePanelToolbar>
  <Table>…</Table>
  <TablePanelFooter>
    <PaginationStatus>1–3 de 3</PaginationStatus>
    <Pagination align="end">…</Pagination>
  </TablePanelFooter>
</TablePanel>`}
        previewClassName="items-stretch"
      >
        <TablePanel className="w-full">
          <TablePanelToolbar>{LINHAS.length} transações</TablePanelToolbar>
          <Table>
            <TableHeader variant="muted">
              <TableRow>
                <TableHead>Descrição</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead numeric>Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {LINHAS.map((l) => (
                <TableRow key={l.id} interactive>
                  <TableCell className="font-medium">{l.desc}</TableCell>
                  <TableCell className="text-muted-foreground">{l.cat}</TableCell>
                  <TableCell numeric>
                    <MoneyDisplay value={l.valor} signed tone={l.valor < 0 ? "expense" : "income"} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePanelFooter>
            <PaginationStatus>1–3 de 3</PaginationStatus>
            <Pagination align="end" className="w-auto">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious href="#" disabled />
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink href="#" isActive>
                    1
                  </PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext href="#" disabled />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </TablePanelFooter>
        </TablePanel>
      </DocSection>

      <DocNote title="O rodapé é align='between', não um número escrito à mão">
        <code>TablePanelFooter</code> empilha no telefone e vira linha no
        desktop (<code>sm:flex-row sm:justify-between</code>) — a mesma forma
        que 5 arquivos do app escreviam como{" "}
        <code>flex-col gap-2.5 rounded-b-xl px-3 py-2.5 sm:flex-row …</code>,
        com o arredondamento repetido à mão porque a moldura não existia.
      </DocNote>

      <DocSection
        title="Seleção"
        description="A coluna de checkbox (selection) e a barra que troca de conteúdo conforme a contagem. Sem role='toolbar': o app já escreve esse papel em 4 lugares sem implementar foco itinerante, e Toolbar se recusa a repetir."
        code={`<TableHead selection><Checkbox … /></TableHead>
<TableCell selection><Checkbox … /></TableCell>
<TableRow data-state={marcado ? "selected" : undefined}>…</TableRow>`}
        previewClassName="items-stretch"
      >
        <PainelComSelecao />
      </DocSection>

      <DocNote title="size vem do contexto, e ninguém dentro do painel escreve">
        <code>TablePanel</code> publica <code>lg</code> em{" "}
        <code>TableSizeContext</code> — a mesma densidade que os 7 painéis do
        app já usam. Uma tabela fora dele continua em <code>md</code>, o
        padrão.
      </DocNote>

      <PropsTable
        title="Props"
        rows={[
          {
            prop: "TablePanel",
            type: "ComponentProps<typeof Card>",
            description: "Card padding=\"none\" variant=\"outline\", publicando lg em TableSizeContext.",
          },
          {
            prop: "TablePanelToolbar",
            type: 'variant: "label" | "title"',
            default: '"label"',
            description: "A barra de topo — CardToolbar com o nome do painel.",
          },
          {
            prop: "TablePanelFooter",
            type: "ComponentProps<typeof CardNote>",
            description: "O rodapé de paginação — empilha no telefone, linha no desktop.",
          },
        ]}
      />
    </>
  )
}
