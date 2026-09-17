"use client"

import { Button } from "@/components/ui/button"
import { Container } from "@/components/ui/container"
import {
  PageSection,
  PageSectionDescription,
  PageSectionHeader,
  PageSectionTitle,
} from "@/components/ui/page-section"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

/** Um retângulo tracejado no lugar do conteúdo real da seção. */
function Conteudo({ children = "Conteúdo da seção" }: { children?: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
      {children}
    </div>
  )
}

export default function PageSectionDoc() {
  return (
    <>
      <Usage>
        O bloco que dá ritmo vertical a uma tela: uma pilha de <code>PageSection</code> dentro de um <code>Container</code>, sem nenhum filho declarando margem própria. O topo da tela é o <code>PageHeader</code>.
      </Usage>

      <DocSection
        title="Padrão"
        description="Cabeçalho e conteúdo, com 16px entre os dois. Título e descrição não levam gap: são o mesmo dado em duas linhas."
        code={`<PageSection>
  <PageSectionHeader>
    <PageSectionTitle>Orçamentos</PageSectionTitle>
    <PageSectionDescription>Quanto de cada categoria já foi usado.</PageSectionDescription>
  </PageSectionHeader>
  <TransactionsTable />
</PageSection>`}
        previewClassName="items-stretch"
      >
        <PageSection className="w-full">
          <PageSectionHeader>
            <PageSectionTitle>Orçamentos</PageSectionTitle>
            <PageSectionDescription>
              Quanto de cada categoria já foi usado neste mês.
            </PageSectionDescription>
          </PageSectionHeader>
            <Conteudo />
        </PageSection>
      </DocSection>

      <DocSection
        title="Com ação"
        description="actions põe a ação da seção à direita do título, sem desmontar o empilhamento do cabeçalho por className."
        code={`<PageSectionHeader
  actions={<Button variant="tertiary" size="sm">Ver todas</Button>}
>
  <PageSectionTitle>Últimas transações</PageSectionTitle>
  <PageSectionDescription>As 20 mais recentes deste workspace.</PageSectionDescription>
</PageSectionHeader>`}
        previewClassName="items-stretch"
      >
        <PageSection className="w-full">
          <PageSectionHeader
            actions={
              <Button variant="tertiary" size="sm">
                Ver todas
              </Button>
            }
          >
            <PageSectionTitle>Últimas transações</PageSectionTitle>
            <PageSectionDescription>
              As 20 mais recentes deste workspace, em ordem de lançamento.
            </PageSectionDescription>
          </PageSectionHeader>
            <Conteudo />
        </PageSection>
      </DocSection>

      <DocNote title="A ação se centra na primeira linha do título">
        Ela se centra numa caixa de uma linha de título (<code>--page-section-title-line</code>), e não no bloco inteiro: com <code>items-center</code>, uma descrição de duas linhas desceria o botão para o meio do parágrafo.
      </DocNote>

      <DocSection
        title="A escada"
        description="size encolhe o título e o respiro juntos. md é o padrão; sm é para cabeçalho de painel denso."
        code={`<PageSection size="sm">…</PageSection>   {/* 14/20 · gap 12 */}
<PageSection size="md">…</PageSection>   {/* 16/24 · gap 16 · o padrão */}
<PageSection size="lg">…</PageSection>   {/* 18/28 · gap 16 */}`}
        previewClassName="flex-col items-stretch gap-8"
      >
        {(["sm", "md", "lg"] as const).map((size) => (
          <PageSection key={size} size={size} className="w-full">
            <PageSectionHeader
              actions={
                <code className="font-mono text-2xs text-muted-foreground">
                  size=&quot;{size}&quot;
                </code>
              }
            >
              <PageSectionTitle>Assinaturas</PageSectionTitle>
              <PageSectionDescription>
                O que se renova sozinho todo mês.
              </PageSectionDescription>
            </PageSectionHeader>
              <Conteudo />
          </PageSection>
        ))}
      </DocSection>

      <DocSection
        title="A régua é em cima"
        description="ruled marca onde um bloco começa: fio em cima diz “começou outro assunto”; embaixo diria “este bloco tem um rodapé”."
        code={`<PageSection variant="ruled">…</PageSection>`}
        previewClassName="items-stretch"
      >
        <div className="flex w-full flex-col gap-8">
          {["Orçamentos", "Assinaturas"].map((titulo) => (
            <PageSection key={titulo} variant="ruled" className="w-full">
              <PageSectionHeader>
                <PageSectionTitle>{titulo}</PageSectionTitle>
              </PageSectionHeader>
                <Conteudo />
            </PageSection>
          ))}
        </div>
      </DocSection>

      <DocSection
        title="O ritmo da tela"
        description="16px dentro da seção, 32px entre seções no Container. Duas escalas é o que faz a tela ter blocos em vez de uma lista contínua."
        code={`<Container stack="section">
  <PageHeader>…</PageHeader>
  <PageSection>…</PageSection>
  <PageSection>…</PageSection>
</Container>`}
        previewClassName="block p-0"
      >
        <Container stack="section" className="py-6">
          <Conteudo>PageHeader</Conteudo>
          {["Bloco 1", "Bloco 2"].map((nome) => (
            <PageSection key={nome}>
              <PageSectionHeader>
                <PageSectionTitle>{nome}</PageSectionTitle>
                <PageSectionDescription>
                  A descrição fica colada no título.
                </PageSectionDescription>
              </PageSectionHeader>
                <Conteudo />
            </PageSection>
          ))}
        </Container>
      </DocSection>

      <DocNote title="O título é h2, e asChild é para o nível">
        <code>PageSectionTitle</code> é <code>&lt;h2&gt;</code> e <code>PageHeaderTitle</code> é <code>&lt;h1&gt;</code>; um bloco dentro de outro é <code>&lt;h3&gt;</code>, via <code>asChild</code> — nunca para trocar o estilo. Quem usa leitor de tela navega pela hierarquia, e pular do h1 para um h3 deixa um degrau vazio.
      </DocNote>

      <DocNote title="Não há peça de conteúdo, e a seção traz min-w-0">
        O conteúdo vai direto como filho da seção. O <code>min-w-0</code> mora na <code>PageSection</code> porque, usada como item de uma linha de flex, ela estouraria para o min-content e levaria a rolagem interna junto.
      </DocNote>

      <PropsTable
        title="Eixos de PageSection"
        rows={[
          {
            prop: "size",
            type: '"sm" | "md" | "lg"',
            default: '"md"',
            description: "O corpo do título e o respiro interno, juntos. Publica --page-section-title e --page-section-title-line.",
          },
          {
            prop: "variant",
            type: '"plain" | "ruled"',
            default: '"plain"',
            description: "A régua em cima, com o respiro que vem junto.",
          },
        ]}
      />

      <PropsTable
        title="Peças"
        rows={[
          {
            prop: "PageSection",
            type: "ComponentProps<'section'>",
            description: "O bloco. Empilha os filhos com o gap do degrau.",
          },
          {
            prop: "PageSectionHeader",
            type: "{ actions?: ReactNode }",
            description:
              "Título, descrição e a ação da seção, centrada na linha do título.",
          },
          {
            prop: "PageSectionTitle",
            type: "ComponentProps<'h2'> & { asChild? }",
            description: "O nome da seção. asChild para descer o nível.",
          },
          {
            prop: "PageSectionDescription",
            type: "ComponentProps<'p'>",
            description: "O que ela mostra, colada no título.",
          },
        ]}
      />
    </>
  )
}
