"use client"

import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { DocNote, DocSection, Usage } from "../ds-doc"

export default function BreadcrumbDoc() {
  return (
    <>
      <Usage>
        A trilha até onde a pessoa está, para telas de três níveis ou mais. Numa tela de primeiro nível, uma trilha de um item só é ruído.
      </Usage>

      <DocSection
        title="Padrão"
        description="O último item é BreadcrumbPage, não um link: ele é a página atual e clicar nele não leva a lugar nenhum."
        code={`<Breadcrumb>
  <BreadcrumbList>
    <BreadcrumbItem><BreadcrumbLink href="/categorias">Categorias</BreadcrumbLink></BreadcrumbItem>
    <BreadcrumbSeparator />
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
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Mercado</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </DocSection>

      <DocSection
        title="Trilha longa"
        description="Com mais de quatro níveis, o miolo vira reticências. No telefone isso é obrigatório: uma trilha completa não cabe em 360px e quebra em duas linhas."
        code={`<BreadcrumbItem><BreadcrumbEllipsis /></BreadcrumbItem>`}
        previewClassName="items-start"
      >
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="#">Cartões</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbEllipsis />
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Março de 2026</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </DocSection>

      <DocNote title="Ele vai dentro do PageHeader">
        <code>PageHeaderBreadcrumb</code>{" "}
        é o slot que o coloca acima do título e
        ocupando a largura inteira. Fora dali, a trilha acaba competindo com o
        título pela primeira linha.
      </DocNote>
    </>
  )
}
