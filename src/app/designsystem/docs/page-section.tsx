"use client"

import { Button } from "@/components/ui/button"
import {
  PageSection,
  PageSectionContent,
  PageSectionDescription,
  PageSectionHeader,
  PageSectionTitle,
} from "@/components/ui/page-section"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

export default function PageSectionDoc() {
  return (
    <>
      <Usage>
        O bloco que dá ritmo vertical a uma tela. Quem espaça é quem contém: uma
        tela é uma pilha de <code>PageSection</code> dentro de um{" "}
        <code>Container</code>, e nenhum filho declara margem própria.
      </Usage>

      <DocSection
        title="Com cabeçalho"
        code={`<PageSection>
  <PageSectionHeader>
    <PageSectionTitle>Orçamentos</PageSectionTitle>
    <PageSectionDescription>Quanto de cada categoria já foi usado.</PageSectionDescription>
  </PageSectionHeader>
  <PageSectionContent>…</PageSectionContent>
</PageSection>`}
        previewClassName="items-stretch"
      >
        <div className="flex w-full flex-col gap-8">
          <PageSection>
            <PageSectionHeader>
              <PageSectionTitle>Orçamentos</PageSectionTitle>
              <PageSectionDescription>
                Quanto de cada categoria já foi usado neste mês.
              </PageSectionDescription>
            </PageSectionHeader>
            <PageSectionContent>
              <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                Conteúdo da seção
              </div>
            </PageSectionContent>
          </PageSection>

          <PageSection>
            <PageSectionHeader className="flex-row items-center justify-between">
              <PageSectionTitle>Últimas transações</PageSectionTitle>
              <Button variant="ghost" size="sm">
                Ver todas
              </Button>
            </PageSectionHeader>
            <PageSectionContent>
              <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                Conteúdo da seção
              </div>
            </PageSectionContent>
          </PageSection>
        </div>
      </DocSection>

      <DocNote title="gap-4 dentro, gap-6 ou gap-8 entre">
        A seção empilha seus filhos com <code>gap-4</code>. O espaço{" "}
        <em>entre</em> seções é do contêiner da página. Duas escalas diferentes é
        o que faz a tela ter blocos em vez de uma lista contínua.
      </DocNote>

      <DocNote title="O título é um h2">
        <code>PageSectionTitle</code> é <code>&lt;h2&gt;</code> e{" "}
        <code>PageHeaderTitle</code> é <code>&lt;h1&gt;</code>. A hierarquia de
        cabeçalhos é como quem usa leitor de tela navega uma tela longa: pular do
        h1 para um h3 deixa um degrau vazio.
      </DocNote>

      <PropsTable
        title="Partes"
        rows={[
          { prop: "PageSection", type: "ComponentProps<'section'>", description: "O bloco. Empilha com gap-4." },
          { prop: "PageSectionHeader", type: "ComponentProps<'div'>", description: "Título e descrição." },
          { prop: "PageSectionTitle", type: "ComponentProps<'h2'>", description: "O nome da seção." },
          { prop: "PageSectionDescription", type: "ComponentProps<'p'>", description: "O que ela mostra." },
          { prop: "PageSectionContent", type: "ComponentProps<'div'>", description: "O conteúdo." },
        ]}
      />
    </>
  )
}
