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
        A tabela como o app a mostra: moldura, barra de ações, cabeçalho e
        rodapé de paginação. Se o conteúdo é só a tabela — sem contagem, sem
        seleção, sem página — o componente é{" "}
        <code>Table</code>, dentro de um <code>Card padding=&quot;none&quot;</code> comum.
      </Usage>

      <DocSection
        title="Padrão"
        description="Card padding='none' variant='outline' com a densidade lg herdada — nenhuma tela dentro do painel escreve size. A barra de topo fica fora da moldura, acima dela, sem fundo e sem borda; o rodapé é CardNote com outro nome."
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

      <DocSection
        title="Ações por linha"
        description="A última coluna é actions: encolhe até o par de botões, alinha à direita e monta a fileira sozinha. O cabeçalho não mostra rótulo — o nome fica só para o leitor de tela. A lixeira é neutra, e cada botão diz o objeto — no aria-label e num tooltip sm que a célula monta sozinha. No telefone a tabela troca por CSS pelas linhas de uma lista."
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
        description="O corpo rola; o cabeçalho e o rodapé ficam parados. O teto de altura é do viewport, e o cabeçalho fixo é de vidro: as linhas passam por trás dele borradas, e em repouso ele tem a tinta do muted parado. Embaixo, fade='bottom' faz as linhas passarem por trás do rodapé e se dissolverem, como no Command — o rodapé não pinta nada. No telefone não há teto: quem rola é a página."
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

      <DocNote title="A lixeira é neutra, e é invariante">
        As duas tabelas do app pintam a lixeira de <code>--destructive</code>, e
        ela se repete em toda linha — ao lado de valores de saída que também são
        vermelhos. <code>destructive</code> não é <code>expense</code>: uma cor
        de ação e uma cor de dinheiro na mesma fileira deixam de dizer qualquer
        uma das duas coisas. Quem avisa que excluir não tem volta é a
        confirmação, não a cor do ícone. No cursor e no toque ela vira o botão <code>destructive</code>: quem
        escreve <code>variant=&quot;destructive&quot;</code> numa ação declara a
        intenção, e a célula a mantém neutra em repouso e acende o vermelho só
        quando a pessoa aponta — o sinal de perigo chega na hora da decisão, e
        não em toda linha.
      </DocNote>

      <DocNote title="Cada botão diz o objeto">
        Nas duas telas do app, os quatro botões por linha não têm nome acessível
        — o leitor de tela ouve &ldquo;botão&rdquo;, e mais nada, doze vezes numa
        tabela de três linhas. Aqui o rótulo carrega o objeto:{" "}
        <code>Editar Mercado</code>, <code>Excluir Mercado</code>. E o clique no
        botão não abre a linha: ele para a propagação, e a barra de topo mostra
        qual dos dois disparou.
      </DocNote>

      <DocNote title="No telefone, linhas — não cartões">
        A tabela troca pelo gêmeo <code>md:hidden</code> por CSS, como em{" "}
        <code>Table</code>. Mas lá os itens são cartões com contorno, e aqui
        estariam dentro de outro cartão: dentro do painel a lista é{" "}
        <code>ItemGroup variant=&quot;divided&quot;</code>, e o item é{" "}
        <code>lg</code>, cujo recuo de 16px é o mesmo das tiras do painel. Com o
        par de botões, o valor desce para uma linha própria: ao lado de dois
        alvos de 44 ele não cabia, e a mesma lista saía com dois layouts —
        duas linhas quebravam as ações para baixo e a terceira espremia o
        título em 48px.
      </DocNote>

      <DocNote title="O cabeçalho fixo é de vidro, e o fade de baixo virou véu">
        Sob <code>fade=&quot;bottom&quot;</code> o <code>TableHeader sticky</code>{" "}
        veste o material do cabeçalho do catálogo: as linhas passam por trás
        dele borradas, e em repouso ele tem a mesma cor do cabeçalho parado.
        Para isso a área que rola não pode ter máscara — medido, um{" "}
        <code>backdrop-filter</code> dentro de um elemento mascarado não borra.
        A borda de baixo passou a ser um véu na cor do cartão, por cima das
        linhas e por baixo do rodapé: sobre o cartão, véu de 94% e máscara de
        6% dão a mesma cor. Em <code>fade=&quot;sides&quot;</code> o cabeçalho
        fixo segue opaco.
      </DocNote>

      <DocNote title="O corpo dissolve no rodapé, e o rodapé não pinta">
        É o que o <code>CommandFooter</code> faz: quem some é o conteúdo, e a
        faixa continua sem fundo — uma tira pintada seria uma segunda
        superfície. As linhas passam por trás do rodapé, que mede a própria
        altura e a publica no painel, e ali ficam a 6%, como um fantasma. <code>fade=&quot;bottom&quot;</code> troca
        a dissolução lateral pela de baixo, porque é um gradiente por elemento; a
        rolagem horizontal continua, com a barra. Só a ponta de baixo dissolve: o
        cabeçalho fixo mora dentro do mesmo viewport e sairia apagado. E sem
        borrão — nas três vezes em que ele foi tentado num corpo com rodapé,
        virou um retângulo de tom.
      </DocNote>

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
            description: "Card padding=\"none\" variant=\"outline\", publicando lg em TableSizeContext. toolbar recebe a barra de topo, que fica fora da moldura.",
          },
          {
            prop: "TablePanelToolbar",
            type: 'variant: "label" | "title"',
            default: '"label"',
            description: "A barra de topo — CardToolbar com o nome do painel. Vai na prop toolbar do TablePanel, nunca como filho: fica fora da moldura, acima dela, sem fundo e sem borda. Como filho ela cairia dentro, e avisa no console.",
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
