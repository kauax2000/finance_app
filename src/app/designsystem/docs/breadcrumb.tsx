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
        description="A lista recebe só itens — ela mesma põe os separadores. O último é BreadcrumbPage, não um link: é a página atual, e clicar nela não leva a lugar nenhum."
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
        description="Passando de maxItems, ficam a raiz e os dois últimos degraus, e o miolo vira um menu. Abra as reticências: o que foi dobrado continua alcançável."
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
        description="Contagem nenhuma resolve um nome grande. Os ancestrais truncam; a página atual é a última a ceder, porque quem cede é o caminho e nunca o destino."
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
        Não se dobra um miolo que não se possui. Enquanto o{" "}
        <code>&lt;BreadcrumbSeparator /&gt;</code> era escrito à mão entre os
        itens, a lista não sabia quais filhos eram degraus e quais eram enfeite
        — e o colapso ficava impossível. Para trocar o glifo, o ponto de extensão
        é <code>separator</code>, uma vez, e não n−1 vezes.
      </DocNote>

      <DocNote title="Ela nunca vira duas linhas">
        O <code>flex-wrap</code> que vinha do shadcn quebrava a trilha logo acima
        do título. Medido a 375px, com 293px disponíveis: quatro níveis saíam com{" "}
        <strong>46px de altura, em duas linhas</strong>. Hoje são{" "}
        <code>flex-nowrap</code> mais duas defesas — <code>maxItems</code> para a
        trilha profunda, <code>truncate</code> para o rótulo longo.
      </DocNote>

      <DocNote title="A página atual não é um link">
        <code>BreadcrumbPage</code> vinha do shadcn com{" "}
        <code>role=&quot;link&quot;</code> e{" "}
        <code>aria-disabled=&quot;true&quot;</code>: um papel de link num
        elemento que não navega faz o leitor de tela anunciar um link e convidar
        à ativação. <code>aria-current=&quot;page&quot;</code> num{" "}
        <code>span</code> é o que a APG prescreve, e é o suficiente.
      </DocNote>

      <DocNote title="O alvo de dedo cresce por pseudo-elemento">
        Crescer de verdade empurraria a linha do cabeçalho para 44px. O{" "}
        <code>::after</code> só existe em ponteiro grosso. Ele cresce 12px na
        vertical, onde não há nada — <strong>20 + 24 = 44px medidos</strong> — e
        4px na horizontal, que é metade do <code>gap</code> da lista: dois
        ancestrais vizinhos encostam sem se sobrepor.
      </DocNote>

      <DocNote title="Ele vai dentro do PageHeader">
        <code>PageHeaderBreadcrumb</code> é o slot que o coloca acima do título e
        ocupando a largura inteira. Fora dali, a trilha acaba competindo com o
        título pela primeira linha.
      </DocNote>

      <PropsTable
        title="Props de BreadcrumbList"
        rows={[
          {
            prop: "maxItems",
            type: "number",
            default: "4",
            description:
              "Degraus visíveis antes de o miolo virar menu. O piso é 3; 0 desliga o colapso.",
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
              "Corpo do texto, chevron e reticências. Desce por contexto até as peças.",
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
              "Um degrau. O último é shrink-0: quem cede na falta de espaço é o caminho.",
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
              "As reticências como gatilho dos degraus dobrados. A lista o monta sozinha.",
          },
          {
            prop: "BreadcrumbEllipsis",
            type: "ComponentProps<'span'>",
            description:
              "O marcador estático, sem menu. Decoração — aria-hidden e sem nome.",
          },
        ]}
      />
    </>
  )
}
