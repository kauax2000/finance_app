"use client"

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { DocNote, DocSection, Usage } from "../ds-doc"

export default function PaginationDoc() {
  return (
    <>
      <Usage>
        Divide uma lista longa em páginas endereçáveis. Vale quando a pessoa
        precisa voltar ao mesmo ponto ou compartilhar o link — um extrato
        filtrado, por exemplo. Para uma lista que só se percorre, rolagem
        infinita cansa menos.
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
              <PaginationNext href="#" />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </DocSection>

      <DocNote title="São links, e é de propósito">
        Cada página tem URL própria, então o botão voltar do navegador funciona e
        o link pode ser compartilhado. Trocar por <code>&lt;button&gt;</code>{" "}
        com
        estado local quebra as duas coisas de uma vez.
      </DocNote>

      <DocNote title="No telefone, só anterior e próximo">
        Sete alvos de toque numa linha de 360px ficam abaixo do mínimo
        confortável. A numeração some abaixo de <code>sm</code>, e o texto
        &ldquo;página 2 de 8&rdquo; ao lado é o que continua orientando.
      </DocNote>
    </>
  )
}
