"use client"

import * as React from "react"
import { PencilIcon, TrashIcon } from "@heroicons/react/16/solid"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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

const HISTORICO = [
  { id: "h1", desc: "Mercado", cat: "Alimentação", data: "12/03", valor: -128.4 },
  { id: "h2", desc: "Salário", cat: "Renda", data: "05/03", valor: 8432.15 },
  { id: "h3", desc: "Streaming", cat: "Assinaturas", data: "03/03", valor: -39.9 },
  { id: "h4", desc: "Farmácia", cat: "Saúde", data: "02/03", valor: -64.3 },
  { id: "h5", desc: "Combustível", cat: "Transporte", data: "01/03", valor: -210 },
  { id: "h6", desc: "Freela", cat: "Renda", data: "28/02", valor: 1200 },
  { id: "h7", desc: "Aluguel", cat: "Moradia", data: "27/02", valor: -1850 },
  { id: "h8", desc: "Padaria", cat: "Alimentação", data: "26/02", valor: -18.5 },
  { id: "h9", desc: "Academia", cat: "Saúde", data: "25/02", valor: -119.9 },
  { id: "h10", desc: "Reembolso", cat: "Renda", data: "24/02", valor: 86.4 },
  { id: "h11", desc: "Energia", cat: "Moradia", data: "22/02", valor: -187.23 },
  { id: "h12", desc: "Cinema", cat: "Lazer", data: "20/02", valor: -56 },
] as const

type Linha = { id: string; desc: string; cat: string; data: string; valor: number }

/**
 * A linha do gêmeo do telefone — a mesma nas duas versões.
 *
 * **Com botões, o valor ganha linha própria no conteúdo.** Medido a 375px:
 * valor e dois alvos de 44 do mesmo lado não cabiam, e a lista saía com dois
 * layouts — "Mercado" e "Streaming" jogavam as ações para uma segunda linha,
 * "Salário" não, e espremia o conteúdo a 48px. Sem botões nenhuma linha quebra,
 * e o valor fica à direita, onde uma lista de dinheiro o põe.
 */
function LinhaNoTelefone({
  linha,
  onAbrir,
  children,
}: {
  linha: Linha
  onAbrir?: () => void
  children?: React.ReactNode
}) {
  const valor = (
    <MoneyDisplay
      value={linha.valor}
      signed
      tone={linha.valor < 0 ? "expense" : "income"}
    />
  )
  return (
    <Item size="lg" interactive={Boolean(onAbrir)} onClick={onAbrir}>
      <ItemContent>
        <ItemTitle>{linha.desc}</ItemTitle>
        <ItemDescription>
          {linha.cat} · {linha.data}
        </ItemDescription>
        {children ? valor : null}
      </ItemContent>
      <ItemActions>{children ?? valor}</ItemActions>
    </Item>
  )
}

function PainelComAcoes() {
  const [ultima, setUltima] = React.useState<string | null>(null)

  // A lixeira é neutra: vermelho de ação ao lado de vermelho de saída é a
  // mistura que o invariante 3 proíbe. E cada botão diz o objeto, porque as
  // duas telas reais têm quatro botões por linha sem nome acessível.
  const acoes = (l: Linha, toque = false) => (
    <>
      <Button
        type="button"
        variant="tertiary"
        size="icon-sm"
        aria-label={`Editar ${l.desc}`}
        className={toque ? "pointer-coarse:size-11" : undefined}
        onClick={(e) => {
          e.stopPropagation()
          setUltima(`Editar ${l.desc}`)
        }}
      >
        <PencilIcon aria-hidden />
      </Button>
      <Button
        type="button"
        // Na célula a intenção vira realce: neutra em repouso, destructive no
        // cursor. No telefone não há célula, e ali ela fica neutra.
        variant={toque ? "tertiary" : "destructive"}
        size="icon-sm"
        aria-label={`Excluir ${l.desc}`}
        className={toque ? "pointer-coarse:size-11" : undefined}
        onClick={(e) => {
          e.stopPropagation()
          setUltima(`Excluir ${l.desc}`)
        }}
      >
        <TrashIcon aria-hidden />
      </Button>
    </>
  )

  return (
    <TablePanel
      className="w-full"
      toolbar={
        <TablePanelToolbar>
          <span>{LINHAS.length} transações</span>
          {ultima ? <span data-slot="ultima-acao">{ultima}</span> : null}
        </TablePanelToolbar>
      }
    >
      <div className="hidden md:block">
        <Table>
          <TableHeader variant="muted">
            <TableRow>
              <TableHead>Descrição</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead numeric>Valor</TableHead>
              <TableHead actions />
            </TableRow>
          </TableHeader>
          <TableBody>
            {LINHAS.map((l) => (
              <TableRow key={l.id} interactive onClick={() => setUltima(`Abrir ${l.desc}`)}>
                <TableCell primary className="font-medium">{l.desc}</TableCell>
                <TableCell className="text-muted-foreground">{l.cat}</TableCell>
                <TableCell numeric>
                  <MoneyDisplay value={l.valor} signed tone={l.valor < 0 ? "expense" : "income"} />
                </TableCell>
                <TableCell actions>{acoes(l)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <ItemGroup variant="divided" className="md:hidden">
        {LINHAS.map((l) => (
          <LinhaNoTelefone key={l.id} linha={l} onAbrir={() => setUltima(`Abrir ${l.desc}`)}>
            {acoes(l, true)}
          </LinhaNoTelefone>
        ))}
      </ItemGroup>
    </TablePanel>
  )
}

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
    <TablePanel
      className="w-full"
      toolbar={
        <TablePanelToolbar>
          {marcados.size > 0 ? (
            <>
              <span className="text-sm font-medium text-foreground">
                {marcados.size} selecionada{marcados.size > 1 ? "s" : ""}
              </span>
              <Button type="button" variant="destructive" size="sm">
                <TrashIcon aria-hidden />
                Excluir
              </Button>
            </>
          ) : (
            <span>{LINHAS.length} transações</span>
          )}
        </TablePanelToolbar>
      }
    >
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
              <TableCell primary className="font-medium">{l.desc}</TableCell>
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
        A tabela como o app a mostra: moldura, barra de topo, cabeçalho e rodapé de paginação. Se o conteúdo é só a tabela — sem contagem, seleção nem página —, é <code>Table</code> num <code>Card padding=&quot;none&quot;</code>.
      </Usage>

      <DocSection
        title="Padrão"
        description="Card padding='none' variant='outline' com densidade lg herdada — ninguém dentro do painel escreve size. A barra de topo fica fora da moldura, sem fundo nem borda."
        code={`<TablePanel toolbar={<TablePanelToolbar>3 transações</TablePanelToolbar>}>
  <Table>…</Table>
  <TablePanelFooter>
    <PaginationStatus>1–3 de 3</PaginationStatus>
    <Pagination align="end">…</Pagination>
  </TablePanelFooter>
</TablePanel>`}
        previewClassName="items-stretch"
      >
        <TablePanel
          className="w-full"
          toolbar={
            <TablePanelToolbar>{LINHAS.length} transações</TablePanelToolbar>
          }
        >
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
                  <TableCell primary className="font-medium">{l.desc}</TableCell>
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

      <DocNote title="O rodapé empilha no telefone">
        <code>TablePanelFooter</code> empilha no telefone e vira linha no desktop, com o status à esquerda e a paginação à direita. Não escreva essa forma à mão.
      </DocNote>

      <DocSection
        title="Seleção"
        description="A coluna selection e a barra que troca de conteúdo conforme a contagem. Sem role='toolbar': sem foco itinerante, o papel promete o que não entrega."
        code={`<TableHead selection><Checkbox … /></TableHead>
<TableCell selection><Checkbox … /></TableCell>
<TableRow data-state={marcado ? "selected" : undefined}>…</TableRow>`}
        previewClassName="items-stretch"
      >
        <PainelComSelecao />
      </DocSection>

      <DocSection
        title="Ações por linha"
        description="actions encolhe até os botões, alinha à direita e monta a fileira. O cabeçalho não mostra rótulo, só o nome para leitor de tela. Cada botão diz o objeto no aria-label e num tooltip que a célula monta; no telefone a tabela vira lista."
        code={`<TableHead actions />

<TableCell actions>
  <Button variant="tertiary" size="icon-sm" aria-label="Editar Mercado">
    <PencilIcon aria-hidden />
  </Button>
  <Button variant="destructive" size="icon-sm" aria-label="Excluir Mercado">
    <TrashIcon aria-hidden />
  </Button>
</TableCell>

{/* telefone */}
<ItemGroup variant="divided" className="md:hidden">…</ItemGroup>`}
        previewClassName="items-stretch"
      >
        <PainelComAcoes />
      </DocSection>

      <DocSection
        title="Rolagem com cabeçalho fixo"
        description="O corpo rola sob cabeçalho e rodapé parados. O cabeçalho fixo é de vidro, e com fade='bottom' as linhas dissolvem atrás do rodapé. No telefone não há teto: quem rola é a página."
        code={`<TablePanel toolbar={<TablePanelToolbar>12 transações</TablePanelToolbar>}>
  <Table viewportClassName="max-h-72" fade="bottom">
    <TableHeader variant="muted" sticky>…</TableHeader>
    <TableBody>…</TableBody>
  </Table>
  <TablePanelFooter>…</TablePanelFooter>
</TablePanel>`}
        previewClassName="items-stretch"
      >
        <TablePanel
          className="w-full"
          toolbar={
            <TablePanelToolbar>{HISTORICO.length} transações</TablePanelToolbar>
          }
        >
          <div className="hidden md:block">
            <Table viewportClassName="max-h-72" fade="bottom">
              <TableHeader variant="muted" sticky>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead numeric>Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {HISTORICO.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell primary className="font-medium">{l.desc}</TableCell>
                    <TableCell className="text-muted-foreground">{l.cat}</TableCell>
                    <TableCell className="nums text-muted-foreground">{l.data}</TableCell>
                    <TableCell numeric>
                      <MoneyDisplay value={l.valor} signed tone={l.valor < 0 ? "expense" : "income"} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <ItemGroup variant="divided" className="md:hidden">
            {HISTORICO.map((l) => (
              <LinhaNoTelefone key={l.id} linha={l} />
            ))}
          </ItemGroup>
          <TablePanelFooter>
            <PaginationStatus>1–12 de 24</PaginationStatus>
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
                  <PaginationLink href="#">2</PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext href="#" />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </TablePanelFooter>
        </TablePanel>
      </DocSection>

      <DocNote title="A lixeira é neutra em repouso">
        <code>destructive</code> não é <code>expense</code>: vermelho de ação ao lado de vermelho de saída, em toda linha, deixa de dizer as duas coisas. Com <code>variant=&quot;destructive&quot;</code> a célula mantém o ícone neutro e acende o vermelho só no cursor e no toque; quem avisa que não tem volta é a confirmação.
      </DocNote>

      <DocNote title="Cada botão diz o objeto">
        O <code>aria-label</code> carrega o objeto — <code>Editar Mercado</code>, <code>Excluir Mercado</code> —, senão o leitor de tela ouve só &ldquo;botão&rdquo;. O clique no botão para a propagação e não abre a linha.
      </DocNote>

      <DocNote title="No telefone, linhas — não cartões">
        O gêmeo <code>md:hidden</code> é <code>ItemGroup variant=&quot;divided&quot;</code> com item <code>lg</code>: cartão com contorno dentro do painel seria cartão dentro de cartão. Com botões, o valor desce para linha própria, senão a lista sai com dois layouts.
      </DocNote>

      <DocNote title="Cabeçalho de vidro e véu no rodapé">
        Sob <code>fade=&quot;bottom&quot;</code> o <code>TableHeader sticky</code> veste o material borrado, e a área que rola não pode ter máscara: <code>backdrop-filter</code> dentro de elemento mascarado não borra. A borda de baixo é um véu na cor do cartão, por cima das linhas e por baixo do rodapé, que não pinta nada — e sem borrão, que ali vira retângulo de tom. Em <code>fade=&quot;sides&quot;</code> o cabeçalho fixo segue opaco.
      </DocNote>

      <DocNote title="size vem do contexto, e ninguém dentro do painel escreve">
        <code>TablePanel</code> publica <code>lg</code> em <code>TableSizeContext</code>; fora dele a tabela fica em <code>md</code>, o padrão.
      </DocNote>

      <PropsTable
        title="Props"
        rows={[
          {
            prop: "TablePanel",
            type: "ComponentProps<typeof Card> & { toolbar?: ReactNode }",
            description: "Card padding=\"none\" variant=\"outline\" que publica lg; toolbar recebe a barra de topo, fora da moldura.",
          },
          {
            prop: "TablePanelToolbar",
            type: 'ComponentProps<typeof CardToolbar> · variant: "label" | "title"',
            default: '"label"',
            description: "A barra de topo; vai na prop toolbar, nunca como filho — como filho cairia dentro da moldura, e avisa no console.",
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
