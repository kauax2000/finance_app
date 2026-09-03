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
        O bloco que dá ritmo vertical a uma tela. Quem espaça é quem contém: uma
        pilha de <code>PageSection</code> dentro de um <code>Container</code>, e
        nenhum filho declarando margem própria.
      </Usage>

      <DocSection
        title="Padrão"
        description="Cabeçalho e conteúdo, com 16px entre os dois. Entre o título e a descrição não há gap: eles são o mesmo dado em duas linhas."
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
        description="actions é prop, e a peça existe porque esta mesma página a inventava por className — desmontando o empilhamento do cabeçalho com flex-row items-center justify-between para caber um “Ver todas”."
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

      <DocNote title="A ação se centra na primeira linha do título, e não no bloco">
        Com <code>items-center</code> no cabeçalho inteiro, uma descrição de
        duas linhas desce o botão para o meio do parágrafo. Ele se centra numa
        caixa de exatamente uma linha de título (
        <code>--page-section-title-line</code>), que o degrau publica — a mesma
        conta do voltar do <code>PageHeader</code>, e sem número mágico.
      </DocNote>

      <DocSection
        title="A escada"
        description="size encolhe o título e o respiro juntos, como no Alert. lg é o corpo que as 269 seções deste catálogo já renderizam; sm é para cabeçalho de painel denso."
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
        description="ruled marca onde um bloco começa, e não onde ele termina. É onde as seções deste catálogo sempre a puseram — e é o que separa “começou outro assunto” de “este bloco tem um rodapé”."
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
        description="gap-4 dentro da seção, gap-8 entre elas, no Container. Duas escalas diferentes é o que faz a tela ter blocos em vez de uma lista contínua."
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

      <DocNote title="O título é um h2, e asChild é para o nível">
        <code>PageSectionTitle</code> é <code>&lt;h2&gt;</code> e{" "}
        <code>PageHeaderTitle</code> é <code>&lt;h1&gt;</code>. Um bloco dentro
        de outro bloco é <code>&lt;h3&gt;</code>, e é para isso que{" "}
        <code>asChild</code> existe aqui — não para trocar o estilo. A
        hierarquia de cabeçalhos é como quem usa leitor de tela navega uma tela
        longa: pular do h1 para um h3 deixa um degrau vazio.
      </DocNote>

      <DocNote title="Havia um PageSectionContent, e a medição o apagou">
        Ele era um <code>&lt;div&gt;</code> com string de classe vazia. A
        primeira versão desta rodada tentou salvá-lo dando-lhe{" "}
        <code>min-w-0</code> — &ldquo;a tabela larga estoura a página em vez de
        rolar&rdquo;. <strong>Medido, isso é falso</strong>: o tamanho mínimo
        automático de um item de flex vale no <em>eixo principal</em>, e numa
        coluna o eixo principal é o vertical — <code>min-width: auto</code> já
        resolve para zero ali. Com e sem, os mesmos 400px.
        <br />
        O defeito real é um nível acima: uma seção usada como item de uma{" "}
        <strong>linha</strong> de flex estoura para o próprio min-content —{" "}
        <strong>5241px dentro de um pai de 400</strong> —, e leva a rolagem
        interna junto. O <code>min-w-0</code> mudou para a seção, e a peça sem
        trabalho foi apagada em vez de ganhar uma justificativa inventada.
      </DocNote>

      <DocNote title="Ele tinha zero consumidores e 269 cópias">
        <code>DocSection</code> (247 usos) e <code>Group</code> (22) escreviam a
        mesma string de cabeçalho de seção, em dois arquivos, com um corpo de
        título um degrau acima do que este componente oferecia. Os dois eixos
        saem dessa contagem, e hoje as duas peças <em>são</em> este componente.
      </DocNote>

      <PropsTable
        title="Eixos de PageSection"
        rows={[
          {
            prop: "size",
            type: '"sm" | "md" | "lg"',
            default: '"md"',
            description:
              "O corpo do título e o respiro interno, juntos. Publica --page-section-title e --page-section-title-line.",
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
