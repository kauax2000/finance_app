"use client"

import * as React from "react"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationMore,
  PaginationNext,
  PaginationPrevious,
  PaginationStatus,
} from "@/components/ui/pagination"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

function DemoGerada({ compact = false }: { compact?: boolean }) {
  const [pagina, setPagina] = React.useState(5)
  return (
    <Pagination
      align="between"
      className="w-full"
      variant={compact ? "compact" : "default"}
      page={pagina}
      total={18}
      onPageChange={setPagina}
    >
      <PaginationStatus>
        {(pagina - 1) * 20 + 1}–{Math.min(pagina * 20, 342)} de 342 transações
      </PaginationStatus>
    </Pagination>
  )
}

function DemoMais() {
  const [mostrados, setMostrados] = React.useState(30)
  const [carregando, setCarregando] = React.useState(false)
  return (
    <PaginationMore
      shown={mostrados}
      total={57}
      step={30}
      pending={carregando}
      onMore={() => {
        setCarregando(true)
        window.setTimeout(() => {
          setMostrados((m) => m + 30)
          setCarregando(false)
        }, 700)
      }}
    />
  )
}

export default function PaginationDoc() {
  return (
    <>
      <Usage>
        Divide uma lista longa em páginas. Com <code>getHref</code> cada página tem endereço — o voltar do navegador funciona e o link se compartilha; com <code>onPageChange</code> a troca é por estado, para a lista que não tem URL. Para a lista que só se percorre, <code>PaginationMore</code>.
      </Usage>

      <DocSection
        title="Fileira gerada"
        description="page e total montam a fileira: a primeira, a última, a atual e as vizinhas, com reticência só quando ela esconde mais de uma página — e as pontas desabilitam sozinhas. Com getHref cada página é um link; com onPageChange, um botão. No telefone os números saem e fica ‹ 5 de 18 ›. Clique."
        code={`<Pagination align="between" page={pagina} total={18} onPageChange={setPagina}>
  <PaginationStatus>81–100 de 342 transações</PaginationStatus>
</Pagination>

<Pagination page={pagina} total={18} getHref={(p) => \`?page=\${p}\`} />`}
        previewClassName="items-stretch"
      >
        <DemoGerada />
      </DocSection>

      <DocSection
        title="Compacta"
        description="variant=&quot;compact&quot; é a forma do telefone em qualquer largura: ‹ 5 de 18 ›. É o rodapé de uma tabela estreita, ou de um cartão."
        code={`<Pagination variant="compact" page={pagina} total={18} onPageChange={setPagina} />`}
        previewClassName="items-stretch"
      >
        <DemoGerada compact />
      </DocSection>

      <DocSection
        title="Carregar mais"
        description="PaginationMore é a lista que cresce em vez de trocar de página: o botão diz quantos entram, a contagem diz quantos já estão à vista, pending gira enquanto a próxima leva chega, e ele some quando acaba. É o histórico de pagamentos de uma conta."
        code={`<PaginationMore shown={mostrados} total={57} step={30} pending={carregando} onMore={carregarMais} />`}
      >
        <DemoMais />
      </DocSection>

      <DocSection
        title="Montada à mão"
        code={`<Pagination>
  <PaginationContent>
    <PaginationItem><PaginationPrevious href="?page=1" /></PaginationItem>
    <PaginationItem><PaginationLink href="?page=2" isActive>2</PaginationLink></PaginationItem>
    <PaginationItem><PaginationNext href="?page=3" /></PaginationItem>
  </PaginationContent>
</Pagination>`}
        previewClassName="items-stretch"
      >
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious href="#" />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#">1</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#" isActive>
                2
              </PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#">3</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#">8</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext href="#" />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </DocSection>

      <DocSection
        title="Posição e controles"
        description="align='between' põe a contagem à esquerda e os controles à direita: a forma de uma lista de app."
        code={`<Pagination align="between">
  <PaginationStatus>1–20 de 342 transações</PaginationStatus>
  <PaginationContent>…</PaginationContent>
</Pagination>`}
        previewClassName="items-stretch"
      >
        <Pagination align="between" className="w-full">
          <PaginationStatus>1–20 de 342 transações</PaginationStatus>
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
      </DocSection>

      <DocSection
        title="Escada"
        description="Quatro degraus, e o tipo desce junto com a caixa. xs (24, 12px) é o padrão, por decisão do dono — exceção nomeada à régua que reserva o xs para dentro de outro controle. lg volta ao corpo da página, para um paginador que é a navegação da tela."
        code={`<Pagination size="xs" align="between">   {/* o padrão */}
  <PaginationStatus>1–20 de 342</PaginationStatus>
  <PaginationContent>…</PaginationContent>
</Pagination>

<Pagination size="sm">…</Pagination>
<Pagination size="md">…</Pagination>
<Pagination size="lg">…</Pagination>`}
        previewClassName="flex-col items-stretch gap-6"
      >
        {(["xs", "sm", "md", "lg"] as const).map((size) => (
          <Pagination key={size} size={size} align="between" className="w-full">
            <PaginationStatus>
              size=&quot;{size}&quot; · 1–20 de 342
            </PaginationStatus>
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
                <PaginationLink href="#">3</PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#">18</PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationNext href="#" />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        ))}
      </DocSection>

      <DocSection
        title="Nas pontas da lista"
        description="Na primeira página não há anterior, e na última não há próxima. disabled troca o link por um span sem href com aria-disabled, porque link não desabilita."
        code={`<PaginationPrevious href="?page=1" disabled />
<PaginationNext href="?page=2" />`}
        previewClassName="flex-col items-start gap-3"
      >
        <Pagination align="end" className="w-full">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious href="#" disabled />
            </PaginationItem>
            <PaginationItem>
              <PaginationNext href="#" />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
        <Pagination align="end" className="w-full">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious href="#" />
            </PaginationItem>
            <PaginationItem>
              <PaginationNext href="#" disabled />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </DocSection>

      <DocNote title="Cada degrau declara o tipo junto com a caixa">
        Os degraus <code>icon-*</code> do <code>Button</code> não declaram tamanho de fonte, e esta é a única peça que põe texto num botão de ícone. Por isso a escada da paginação fixa caixa e corpo juntos, como o <code>Tabs</code> — senão o número sai no corpo de um parágrafo.
      </DocNote>

      <DocNote title="Link quando há endereço, botão quando não há">
        Com <code>href</code> (ou <code>getHref</code>) cada peça é um link, e o voltar do navegador funciona. Sem ele, desde a rodada 196, número e extremo são <code>&lt;button&gt;</code> — um <code>&lt;a&gt;</code> sem <code>href</code> não recebe foco nem é anunciado. Era por aceitar só links que nenhuma tela do app usava o componente: as duas listas paginadas trocam de página por estado.
      </DocNote>

      <DocNote title="A página atual preenche, não contorna">
        Ela é <code>secondary</code>, a língua de &ldquo;selecionado&rdquo; que <code>Button</code>, <code>Toggle</code> e a bandeja do <code>Tabs</code> já falam. Um contorno de 1px entre links transparentes quase não se distingue.
      </DocNote>

      <DocNote title="No telefone, ‹ 2 de 8 ›">
        No toque cada controle cresce a 44, e uma fileira de sete peças transbordava a 375px. Na fileira gerada, abaixo de <code>sm</code> os números saem e a posição fica entre as setas. A fileira <strong>montada à mão</strong> não sabe o total, e continua com os números: prefira a gerada.
      </DocNote>

      <DocNote title="Onde o app usa">
        A tabela de transações (e o detalhe da categoria, que a reusa), com a fileira gerada por estado e <code>size=&quot;md&quot;</code>; foi um <code>ButtonGroup</code> na rodada 188 e, antes, uma bandeja à mão. E o histórico de pagamentos da conta, com o <code>PaginationMore</code>, que era um botão escrito à mão sem contagem.
      </DocNote>

      <DocNote title="Figuras tabulares">
        <code>.nums</code> em todo <code>PaginationLink</code> e no <code>PaginationStatus</code>: sem elas 1, 10 e 100 têm larguras diferentes, e a fileira se reacomoda ao virar a página.
      </DocNote>

      <PropsTable
        title="Props de Pagination"
        rows={[
          {
            prop: "align",
            type: '"center" | "between" | "end"',
            default: '"center"',
            description: "between é contagem à esquerda e controles à direita — a forma de uma lista de app.",
          },
          {
            prop: "page · total",
            type: "number",
            description: "A página atual (a partir de 1) e o total: com os dois, a fileira é gerada.",
          },
          {
            prop: "getHref · onPageChange",
            type: "(page) => string · (page) => void",
            description: "Links com endereço, ou botões por estado.",
          },
          {
            prop: "variant",
            type: '"default" | "compact"',
            default: '"default"',
            description: "compact é ‹ 2 de 8 › em qualquer largura; default a usa só abaixo de sm.",
          },
          {
            prop: "size",
            type: '"xs" | "sm" | "md" | "lg"',
            default: '"xs"',
            description: "O degrau da fileira: caixa 24/28/32/36 e corpo 12/12,8/12,8/14px. As peças herdam; size numa peça sobrescreve só ela.",
          },
        ]}
      />

      <PropsTable
        title="Peças"
        rows={[
          {
            prop: "PaginationStatus",
            type: "{ size } & ComponentProps<'p'>",
            description: "A posição em palavras, “1–20 de 342”, com .nums. Fora da raiz, como no rodapé de tabela, nasce xs e aceita size próprio.",
          },
          {
            prop: "PaginationContent",
            type: "ComponentProps<'ul'>",
            description: "A fileira de controles.",
          },
          {
            prop: "PaginationLink",
            type: "{ isActive, size } & ComponentProps<'a'>",
            default: "herda da raiz",
            description: "Um número. isActive preenche.",
          },
          {
            prop: "PaginationPrevious / Next",
            type: "{ disabled, size } & ComponentProps<'a'>",
            default: "herda da raiz",
            description: "Os extremos. disabled vira span com aria-disabled; abaixo de sm ficam quadrados.",
          },
          {
            prop: "PaginationEdge",
            type: "{ disabled, size } & ComponentProps<'a'>",
            description: "A base dos dois acima, para um extremo com outro rótulo.",
          },
          {
            prop: "PaginationMore",
            type: "{ shown, total, step?, onMore, pending? }",
            description: "O “Mostrar mais” com a contagem; some quando tudo está à vista.",
          },
          {
            prop: "PaginationEllipsis",
            type: "{ size } & ComponentProps<'span'>",
            description: "O salto. Decoração — aria-hidden e sem nome.",
          },
        ]}
      />
    </>
  )
}
