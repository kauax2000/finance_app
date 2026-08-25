"use client"

import { PlusIcon } from "@heroicons/react/16/solid"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import {
  PageHeader,
  PageHeaderActions,
  PageHeaderBack,
  PageHeaderBreadcrumb,
  PageHeaderDescription,
  PageHeaderTitle,
  PageHeaderTitleRow,
} from "@/components/ui/page-header"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

export default function PageHeaderDoc() {
  return (
    <>
      <Usage>
        O topo de toda tela: título, o que ela é, e a ação principal. É API de composição porque metade das telas precisa de algo no meio — trilha, seletor de período, chip de status.
      </Usage>

      <DocSection
        title="Completo"
        code={`<PageHeader>
  <PageHeaderBreadcrumb>…</PageHeaderBreadcrumb>
  <PageHeaderTitleRow>
    <PageHeaderTitle>Transações</PageHeaderTitle>
    <PageHeaderDescription>Tudo que entrou e saiu.</PageHeaderDescription>
  </PageHeaderTitleRow>
  <PageHeaderActions>
    <Button><PlusIcon aria-hidden />Nova</Button>
  </PageHeaderActions>
</PageHeader>`}
        previewClassName="items-stretch"
      >
        <PageHeader className="w-full">
          <PageHeaderBreadcrumb>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="#">Início</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Transações</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </PageHeaderBreadcrumb>
          <PageHeaderTitleRow>
            <PageHeaderTitle>Transações</PageHeaderTitle>
            <PageHeaderDescription>
              Tudo que entrou e saiu neste workspace, com filtros por período,
              categoria e forma de pagamento.
            </PageHeaderDescription>
          </PageHeaderTitleRow>
          <PageHeaderActions>
            <Button variant="outline">Exportar</Button>
            <Button>
              <PlusIcon aria-hidden />
              Nova transação
            </Button>
          </PageHeaderActions>
        </PageHeader>
      </DocSection>

      <DocSection
        title="Tela de detalhe"
        description="PageHeaderBack é o “voltar” compacto para a barra do telefone. No desktop, quem cumpre esse papel é a trilha."
        code={`<PageHeaderTitleRow>
  <div className="flex items-center gap-1">
    <PageHeaderBack href="/cartoes" />
    <PageHeaderTitle>Nubank</PageHeaderTitle>
  </div>
</PageHeaderTitleRow>`}
        previewClassName="items-stretch"
      >
        <PageHeader className="w-full">
          <PageHeaderTitleRow>
            <div className="flex items-center gap-1">
              <PageHeaderBack href="#" />
              <PageHeaderTitle>Nubank</PageHeaderTitle>
            </div>
            <PageHeaderDescription>
              Fatura de março · fecha em 28/03
            </PageHeaderDescription>
          </PageHeaderTitleRow>
        </PageHeader>
      </DocSection>

      <DocNote title="Título e descrição não levam gap">
        <code>PageHeaderTitleRow</code> já entrega a entrelinha certa.
      </DocNote>

      <DocNote title="Uma ação principal por tela">
        <code>PageHeaderActions</code> aceita várias, mas só uma delas é{" "}
        <code>default</code>. Três botões cheios lado a lado não têm hierarquia,
        e o olho precisa ler os três para escolher.
      </DocNote>

      <PropsTable
        title="Partes"
        rows={[
          { prop: "PageHeader", type: "ComponentProps<'header'>", description: "O contêiner, com a régua embaixo." },
          { prop: "PageHeaderBreadcrumb", type: "ComponentProps<'div'>", description: "Slot da trilha, acima do título." },
          { prop: "PageHeaderTitleRow", type: "ComponentProps<'div'>", description: "Agrupa título e descrição." },
          { prop: "PageHeaderTitle", type: "ComponentProps<'h1'>", description: "O <h1> da tela. Um por página." },
          { prop: "PageHeaderDescription", type: "ComponentProps<'p'>", description: "O que a tela é, em uma frase." },
          { prop: "PageHeaderActions", type: "ComponentProps<'div'>", description: "As ações, à direita a partir de sm." },
          { prop: "PageHeaderBack", type: "{ href: string }", description: "Voltar compacto, para o telefone." },
        ]}
      />
    </>
  )
}
