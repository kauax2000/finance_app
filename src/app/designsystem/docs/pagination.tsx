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
        Divide uma lista longa em páginas endereçáveis. Vale quando é preciso
        voltar ao mesmo ponto ou compartilhar o link. Para uma lista que só se
        percorre, rolagem infinita cansa menos.
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
        description="align='between' põe a contagem à esquerda e os controles à direita. É a forma de uma lista de app, e a que o mx-auto cravado de antes impedia."
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
        title="Nas pontas da lista"
        description="Na primeira página não há anterior, e na última não há próxima. disabled troca o link por um span sem href, com aria-disabled — um <a> não desabilita."
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

      <DocNote title="São links, e é de propósito">
        Cada página tem URL própria, então o botão voltar do navegador funciona e
        o link pode ser compartilhado. Trocar por <code>&lt;button&gt;</code> com
        estado local quebra as duas coisas de uma vez. É também por isso que{" "}
        <code>disabled</code> precisa existir como prop: um <code>&lt;a&gt;</code>{" "}
        não tem o atributo.
      </DocNote>

      <DocNote title="A página atual preenche, não contorna">
        Ela era <code>variant=&quot;outline&quot;</code>. Medido no tema claro,
        isso dá <code>oklch(0.985)</code> de preenchimento contra uma página de{" "}
        <code>oklch(1)</code> — 1,03:1. Numa fileira de links transparentes,
        &ldquo;você está aqui&rdquo; era um contorno de 1px. Hoje ela é{" "}
        <code>secondary</code>, que é a língua de &ldquo;selecionado&rdquo; que{" "}
        <code>Button</code>, <code>Toggle</code> e a bandeja do <code>Tabs</code>{" "}
        já falam.
      </DocNote>

      <DocNote title="No telefone, só anterior e próximo">
        Sete alvos de toque numa linha de 360px ficam abaixo do mínimo
        confortável. A numeração some abaixo de <code>sm</code>, e o{" "}
        <code>PaginationStatus</code> ao lado é o que continua orientando — foi
        para isso que ele deixou de ser um texto que cada tela escrevia à mão.
        Abaixo de <code>sm</code> os extremos ficam <strong>quadrados</strong>:
        antes saíam 40×32, com 10px de recuo à esquerda e 12 à direita, numa
        fileira de quadrados de 32.
      </DocNote>

      <DocNote title="Figuras tabulares">
        <code>.nums</code> em toda <code>PaginationLink</code> e no{" "}
        <code>PaginationStatus</code>. Sem elas, 1, 10 e 100 têm larguras
        diferentes, e a fileira inteira se reacomoda ao virar a página — o olho
        lê isso como a interface se mexendo, não como o dado mudando.
      </DocNote>

      <PropsTable
        title="Props de Pagination"
        rows={[
          {
            prop: "align",
            type: '"center" | "between" | "end"',
            default: '"center"',
            description:
              "between é contagem à esquerda e controles à direita — a forma de uma lista de app.",
          },
        ]}
      />

      <PropsTable
        title="Peças"
        rows={[
          {
            prop: "PaginationStatus",
            type: "ComponentProps<'p'>",
            description: "A posição em palavras: “1–20 de 342”. Com .nums.",
          },
          {
            prop: "PaginationContent",
            type: "ComponentProps<'ul'>",
            description: "A fileira de controles.",
          },
          {
            prop: "PaginationLink",
            type: "{ isActive, size } & ComponentProps<'a'>",
            default: 'size="icon-md"',
            description: "Um número. isActive preenche e engrossa.",
          },
          {
            prop: "PaginationPrevious / Next",
            type: "{ disabled, size } & ComponentProps<'a'>",
            default: 'size="md"',
            description:
              "Os extremos. disabled vira span com aria-disabled; quadrados abaixo de sm.",
          },
          {
            prop: "PaginationEdge",
            type: "{ disabled, size } & ComponentProps<'a'>",
            description:
              "A base dos dois acima, exposta para um extremo com outro rótulo.",
          },
          {
            prop: "PaginationEllipsis",
            type: "ComponentProps<'span'>",
            description: "O salto. Decoração — aria-hidden e sem nome.",
          },
        ]}
      />
    </>
  )
}
