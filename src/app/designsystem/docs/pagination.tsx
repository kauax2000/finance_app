"use client"

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationStatus,
} from "@/components/ui/pagination"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

export default function PaginationDoc() {
  return (
    <>
      <Usage>
        Divide uma lista longa em páginas endereçáveis — vale quando é preciso voltar ao mesmo ponto ou compartilhar o link. Para uma lista que só se percorre, rolagem infinita cansa menos.
      </Usage>

      <DocSection
        title="Padrão"
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

      <DocNote title="São links, e é de propósito">
        Cada página tem URL própria, então o voltar do navegador funciona e o link pode ser compartilhado. Trocar por <code>&lt;button&gt;</code> com estado local quebra as duas coisas.
      </DocNote>

      <DocNote title="A página atual preenche, não contorna">
        Ela é <code>secondary</code>, a língua de &ldquo;selecionado&rdquo; que <code>Button</code>, <code>Toggle</code> e a bandeja do <code>Tabs</code> já falam. Um contorno de 1px entre links transparentes quase não se distingue.
      </DocNote>

      <DocNote title="No telefone quem orienta é o status">
        No toque cada controle cresce a 44, e a fileira de sete peças transborda a 375px — a numeração ainda não some abaixo de <code>sm</code>, e é defeito aberto. O desenho certo é o <code>PaginationStatus</code> ao lado orientando; abaixo de <code>sm</code> os extremos já ficam quadrados, na medida do número.
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
            prop: "PaginationEllipsis",
            type: "{ size } & ComponentProps<'span'>",
            description: "O salto. Decoração — aria-hidden e sem nome.",
          },
        ]}
      />
    </>
  )
}
