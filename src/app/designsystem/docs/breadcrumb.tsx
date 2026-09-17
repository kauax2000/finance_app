"use client"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

export default function BreadcrumbDoc() {
  return (
    <>
      <Usage>
        A trilha até onde a pessoa está, para telas de três níveis ou mais. Numa
        tela de primeiro nível, uma trilha de um item só é ruído.
      </Usage>

      <DocSection
        title="Padrão"
        description="A lista recebe só itens e põe os separadores. O último é BreadcrumbPage, não link: é a página atual."
        code={`<Breadcrumb>
  <BreadcrumbList>
    <BreadcrumbItem><BreadcrumbLink href="/categorias">Categorias</BreadcrumbLink></BreadcrumbItem>
    <BreadcrumbItem><BreadcrumbPage>Mercado</BreadcrumbPage></BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>`}
        previewClassName="items-start"
      >
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="#">Categorias</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbItem>
              <BreadcrumbPage>Mercado</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </DocSection>

      <DocSection
        title="Trilha longa"
        description="Passando de maxItems ficam a raiz e os dois últimos degraus, e o miolo vira um menu — o que dobrou continua alcançável."
        code={`<BreadcrumbList maxItems={4}>
  <BreadcrumbItem><BreadcrumbLink href="/">Início</BreadcrumbLink></BreadcrumbItem>
  <BreadcrumbItem><BreadcrumbLink href="/cartoes">Cartões</BreadcrumbLink></BreadcrumbItem>
  <BreadcrumbItem><BreadcrumbLink href="/cartoes/nubank">Nubank</BreadcrumbLink></BreadcrumbItem>
  <BreadcrumbItem><BreadcrumbLink href="…">Faturas</BreadcrumbLink></BreadcrumbItem>
  <BreadcrumbItem><BreadcrumbPage>Março de 2026</BreadcrumbPage></BreadcrumbItem>
</BreadcrumbList>`}
        previewClassName="items-start"
      >
        <Breadcrumb className="w-full">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="#">Início</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbItem>
              <BreadcrumbLink href="#">Cartões</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbItem>
              <BreadcrumbLink href="#">Nubank</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbItem>
              <BreadcrumbLink href="#">Faturas</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbItem>
              <BreadcrumbPage>Março de 2026</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </DocSection>

      <DocSection
        title="Rótulo longo"
        description="Para nome grande, os ancestrais truncam e a página atual é a última a ceder: cede o caminho, nunca o destino."
        code={`{/* a 240px de largura, com a trilha inteira dentro do limite */}`}
        previewClassName="items-start"
      >
        <div className="w-60 max-w-full rounded-lg border border-dashed border-border p-3">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="#">Cartões de crédito</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbItem>
                <BreadcrumbPage>Nubank Ultravioleta</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </DocSection>

      <DocSection
        title="Tamanho"
        description="sm quando a trilha divide a linha com outra coisa. Ele encolhe o texto, o chevron e as reticências juntos."
        code={`<BreadcrumbList size="sm">…</BreadcrumbList>`}
        previewClassName="flex-col items-start gap-3"
      >
        <Breadcrumb>
          <BreadcrumbList size="sm">
            <BreadcrumbItem>
              <BreadcrumbLink href="#">Assinaturas</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbItem>
              <BreadcrumbPage>Spotify</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <Breadcrumb>
          <BreadcrumbList size="md">
            <BreadcrumbItem>
              <BreadcrumbLink href="#">Assinaturas</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbItem>
              <BreadcrumbPage>Spotify</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </DocSection>

      <DocNote title="A lista é dona dos separadores">
        Não escreva <code>&lt;BreadcrumbSeparator /&gt;</code> à mão: é por pôr os separadores que a lista sabe quais filhos são degraus e consegue dobrar o miolo. Para trocar o glifo, passe <code>separator</code> uma vez.
      </DocNote>

      <DocNote title="Ela nunca vira duas linhas">
        A lista é <code>flex-nowrap</code>, com duas defesas: <code>maxItems</code> para a trilha profunda e <code>truncate</code> para o rótulo longo. Trilha em duas linhas empurra o título para baixo.
      </DocNote>

      <DocNote title="A página atual não é um link">
        <code>BreadcrumbPage</code> é um <code>span</code> com <code>aria-current=&quot;page&quot;</code>. Papel de link num elemento que não navega faz o leitor anunciar um link e convidar à ativação.
      </DocNote>

      <DocNote title="O alvo de dedo cresce por pseudo-elemento">
        Crescer de verdade empurraria a linha do cabeçalho. Em ponteiro grosso o <code>::after</code> soma 12px na vertical e 4px na horizontal — metade do <code>gap</code>, para vizinhos encostarem sem se sobrepor.
      </DocNote>

      <DocNote title="Ele vai dentro do PageHeader">
        <code>PageHeaderBreadcrumb</code> o põe acima do título, na largura inteira. Fora dali, a trilha disputa a primeira linha com o título.
      </DocNote>

      <PropsTable
        title="Props de BreadcrumbList"
        rows={[
          {
            prop: "maxItems",
            type: "number",
            default: "4",
            description:
              "Degraus visíveis antes de o miolo virar menu; piso 3, e 0 desliga.",
          },
          {
            prop: "separator",
            type: "React.ReactNode",
            default: "<BreadcrumbSeparator />",
            description: "Troca o glifo entre os degraus, uma vez para a lista toda.",
          },
          {
            prop: "size",
            type: '"sm" | "md"',
            default: '"md"',
            description:
              "Corpo do texto, chevron e reticências, por contexto.",
          },
        ]}
      />

      <PropsTable
        title="Peças"
        rows={[
          {
            prop: "Breadcrumb",
            type: "ComponentProps<'nav'>",
            description: "A moldura, com o rótulo de navegação.",
          },
          {
            prop: "BreadcrumbItem",
            type: "ComponentProps<'li'>",
            description:
              "Um degrau; o último é shrink-0.",
          },
          {
            prop: "BreadcrumbLink",
            type: "ComponentProps<'a'> & { asChild }",
            description: "Ancestral navegável. asChild para o <Link> do Next.",
          },
          {
            prop: "BreadcrumbPage",
            type: "ComponentProps<'span'>",
            description: "A página atual. aria-current, sem papel de link.",
          },
          {
            prop: "BreadcrumbMenu",
            type: "{ children, label }",
            description:
              "As reticências com o menu dos degraus dobrados; a lista o monta.",
          },
          {
            prop: "BreadcrumbEllipsis",
            type: "ComponentProps<'span'>",
            description:
              "O marcador estático, sem menu; aria-hidden.",
          },
        ]}
      />
    </>
  )
}
