"use client"

import { PlusIcon } from "@heroicons/react/16/solid"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  PageHeader,
  PageHeaderActions,
  PageHeaderBreadcrumb,
  PageHeaderDescription,
  PageHeaderEyebrow,
  PageHeaderMeta,
  PageHeaderTitle,
  PageHeaderTitleRow,
} from "@/components/ui/page-header"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

export default function PageHeaderDoc() {
  return (
    <>
      <Usage>
        O topo de uma tela: de onde ela veio, como ela se chama, o que ela é, e a
        ação que ela oferece. É composição porque metade das telas precisa de
        algo no meio — a trilha, um chip de estado, um período, uma contagem.
      </Usage>

      <DocSection
        title="Completo"
        description="Trilha atravessando as duas colunas, título e descrição à esquerda, ações à direita. Abaixo de sm tudo empilha."
        code={`<PageHeader>
  <PageHeaderBreadcrumb>…</PageHeaderBreadcrumb>
  <PageHeaderTitleRow>
    <PageHeaderTitle>Transações</PageHeaderTitle>
    <PageHeaderDescription>Tudo que entrou e saiu.</PageHeaderDescription>
  </PageHeaderTitleRow>
  <PageHeaderActions>
    <Button variant="secondary">Exportar</Button>
    <Button><PlusIcon aria-hidden />Nova transação</Button>
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
            <Button variant="secondary">Exportar</Button>
            <Button>
              <PlusIcon aria-hidden />
              Nova transação
            </Button>
          </PageHeaderActions>
        </PageHeader>
      </DocSection>

      <DocNote title="Ele era uma linha de flex, e a trilha caía dentro dela">
        Medido a 1280px, nesta mesma demonstração:{" "}
        <code>sm:flex-row</code> sem <code>flex-wrap</code> punha a trilha
        (618px) <strong>à esquerda</strong> do título, a coluna do título saía
        com <strong>largura zero</strong> e 362px de altura — a descrição
        quebrando uma palavra por linha — e o título passava por baixo do botão
        de ação. O <code>sm:col-span-full</code> que a trilha carregava não era
        classe morta por acaso: era o fóssil da grade correta, escrita para uma
        implementação que nunca existiu. Hoje é grade, e a classe finalmente
        significa alguma coisa.
      </DocNote>

      <DocSection
        title="A escada"
        description="Três degraus de título, e o de baixo cresce em sm. Eles não foram inventados: md é o que a página de componente deste catálogo renderiza, lg é o que o índice renderiza, e sm é a tela de detalhe."
        code={`<PageHeader size="sm">…</PageHeader>   {/* 20 → 24 */}
<PageHeader size="md">…</PageHeader>   {/* 24 → 30 · o padrão */}
<PageHeader size="lg">…</PageHeader>   {/* 30 → 36 */}`}
        previewClassName="flex-col items-stretch gap-8"
      >
        {(["sm", "md", "lg"] as const).map((size) => (
          <PageHeader key={size} size={size} variant="plain" className="w-full">
            <PageHeaderTitleRow
              endAdornment={
                <code className="font-mono text-2xs text-muted-foreground">
                  size=&quot;{size}&quot;
                </code>
              }
            >
              <PageHeaderTitle>Fatura de março</PageHeaderTitle>
              <PageHeaderDescription>
                Fecha em 28/03 e vence em 05/04.
              </PageHeaderDescription>
            </PageHeaderTitleRow>
          </PageHeader>
        ))}
      </DocSection>

      <DocSection
        title="Com régua e sem"
        description="ruled é o padrão. plain é para quando quem fecha o cabeçalho é o próprio conteúdo logo abaixo — uma faixa de fatos, um cartão, um campo."
        code={`<PageHeader variant="ruled">…</PageHeader>  {/* o padrão */}
<PageHeader variant="plain">…</PageHeader>`}
        previewClassName="flex-col items-stretch gap-8"
      >
        {(["ruled", "plain"] as const).map((variant) => (
          <PageHeader key={variant} variant={variant} className="w-full">
            <PageHeaderTitleRow>
              <PageHeaderTitle>Cartões</PageHeaderTitle>
              <PageHeaderDescription>
                variant=&quot;{variant}&quot;
              </PageHeaderDescription>
            </PageHeaderTitleRow>
          </PageHeader>
        ))}
      </DocSection>

      <DocSection
        title="Tela de detalhe"
        description="back rende o voltar compacto na linha do título. No desktop quem cumpre esse papel é a trilha, então ele costuma vir junto de uma largura pequena — mas a decisão é de quem chama."
        code={`<PageHeaderTitleRow
  back="/cartoes"
  endAdornment={<Badge tone="success">Aberta</Badge>}
>
  <PageHeaderTitle>Nubank</PageHeaderTitle>
  <PageHeaderDescription>Fatura de março · fecha em 28/03</PageHeaderDescription>
</PageHeaderTitleRow>`}
        previewClassName="items-stretch"
      >
        <PageHeader size="sm" variant="plain" className="w-full">
          <PageHeaderTitleRow
            back="#"
            endAdornment={<Badge tone="success">Aberta</Badge>}
          >
            <PageHeaderTitle>Nubank</PageHeaderTitle>
            <PageHeaderDescription>
              Fatura de março · fecha em 28/03
            </PageHeaderDescription>
          </PageHeaderTitleRow>
        </PageHeader>
      </DocSection>

      <DocNote title="O voltar e o adorno se alinham por mecânicas diferentes">
        O adorno é <strong>texto</strong>, e alinha pela linha de base — é o que
        o prende à primeira linha do título mesmo quando o nome quebra em duas.
        O voltar é um <strong>controle sem texto</strong>: numa caixa de{" "}
        <code>items-baseline</code> a linha de base dele seria sintetizada na
        borda de baixo, e a fileira inteira afundaria. Ele sai do alinhamento
        com <code>self-start</code> e se centra dentro de uma caixa de
        exatamente uma linha de título (<code>--page-title-line</code>) — sem
        número mágico, e acompanhando o degrau.
      </DocNote>

      <DocSection
        title="Sobrancelha e faixa de fatos"
        description="A sobrancelha nomeia o pai da tela; a faixa carrega os números que a pessoa veio conferir. As duas são opcionais, e a maioria das telas não usa nenhuma."
        code={`<PageHeader size="lg" variant="plain">
  <PageHeaderTitleRow>
    <PageHeaderEyebrow>Nubank · Ultravioleta</PageHeaderEyebrow>
    <PageHeaderTitle>Março de 2026</PageHeaderTitle>
    <PageHeaderDescription>…</PageHeaderDescription>
  </PageHeaderTitleRow>
  <PageHeaderMeta asChild>
    <dl>…</dl>
  </PageHeaderMeta>
</PageHeader>`}
        previewClassName="items-stretch"
      >
        <PageHeader size="lg" variant="plain" className="w-full">
          <PageHeaderTitleRow>
            <PageHeaderEyebrow>Nubank · Ultravioleta</PageHeaderEyebrow>
            <PageHeaderTitle>Março de 2026</PageHeaderTitle>
            <PageHeaderDescription>
              A fatura fecha em 28/03. O que for lançado depois disso entra na
              de abril.
            </PageHeaderDescription>
          </PageHeaderTitleRow>
          <PageHeaderMeta asChild>
            <dl>
              <div className="flex items-baseline gap-2">
                <dt className="text-muted-foreground">Total</dt>
                <dd className="nums font-medium text-foreground">
                  R$ 1.284,60
                </dd>
              </div>
              <div className="flex items-baseline gap-2">
                <dt className="text-muted-foreground">Transações</dt>
                <dd className="nums font-medium text-foreground">42</dd>
              </div>
              <div className="flex items-baseline gap-2">
                <dt className="text-muted-foreground">Vence</dt>
                <dd className="nums font-medium text-foreground">05/04</dd>
              </div>
            </dl>
          </PageHeaderMeta>
        </PageHeader>
      </DocSection>

      <DocNote title="A sobrancelha não é enfeite acima de todo título">
        Ela só se paga quando há um pai de verdade a nomear — a carteira de onde
        a tela veio, o cartão de uma fatura, a marca no índice deste catálogo.
        Um título que precisa de uma palavra pequena em cima para se explicar
        está mal escrito, e a correção é o título.
      </DocNote>

      <DocNote title="Título e descrição não levam gap">
        Eles são o mesmo dado em duas linhas, e quem os separa é a entrelinha.
        Esta página <em>já afirmava isso</em> enquanto o componente declarava{" "}
        <code>gap-1</code> — o mesmo defeito de <code>ItemContent</code>, de{" "}
        <code>StatCard</code> e de <code>FieldContent</code>, e a quarta vez que
        ele foi encontrado com a documentação certa e o código discordando.
        Agora quem garante é o componente. Só a sobrancelha abre um bloco, e é o
        contêiner que declara isso.
      </DocNote>

      <DocNote title="A escada desce por variável, não por contexto">
        <code>--page-title</code> é declarada no <code>PageHeader</code> e lida
        pelo título. Contexto React exigiria <code>&quot;use client&quot;</code>{" "}
        — e este é um dos poucos componentes de <code>ui/</code> que ainda é
        servidor. <code>in-*</code> e <code>group-*</code> compilam com{" "}
        <code>:where()</code>, que não soma especificidade e perderia para a
        classe base no mesmo elemento. Variável herda e não disputa.
      </DocNote>

      <DocNote title="Uma ação principal por tela">
        <code>PageHeaderActions</code> aceita várias, mas só uma delas é{" "}
        <code>primary</code>. Três botões cheios lado a lado não têm hierarquia,
        e o olho precisa ler os três para escolher.
      </DocNote>

      <PropsTable
        title="Eixos de PageHeader"
        rows={[
          {
            prop: "size",
            type: '"sm" | "md" | "lg"',
            default: '"md"',
            description:
              "O corpo do título — 20/24, 24/30 e 30/36px. Publica --page-title e --page-title-line.",
          },
          {
            prop: "variant",
            type: '"ruled" | "plain"',
            default: '"ruled"',
            description: "A régua embaixo, com o respiro que vem junto.",
          },
        ]}
      />

      <PropsTable
        title="Peças"
        rows={[
          {
            prop: "PageHeader",
            type: "ComponentProps<'header'>",
            description:
              "A grade: duas colunas a partir de sm, uma abaixo disso.",
          },
          {
            prop: "PageHeaderBreadcrumb",
            type: "ComponentProps<'div'>",
            description:
              "A trilha. Atravessa as duas colunas e vem primeiro na leitura.",
          },
          {
            prop: "PageHeaderTitleRow",
            type: "{ back?, backLabel?, endAdornment? }",
            description:
              "A linha do título. back rende o voltar; endAdornment é o chip de estado.",
          },
          {
            prop: "PageHeaderEyebrow",
            type: "ComponentProps<'p'>",
            description: "O rótulo do pai da tela, em versalete.",
          },
          {
            prop: "PageHeaderTitle",
            type: "ComponentProps<'h1'> & { asChild? }",
            description: "O <h1> da tela. Um por página.",
          },
          {
            prop: "PageHeaderDescription",
            type: "ComponentProps<'p'>",
            description: "O que a tela é, em uma frase.",
          },
          {
            prop: "PageHeaderMeta",
            type: "ComponentProps<'div'> & { asChild? }",
            description:
              "A faixa de fatos sob o título, com régua em cima. asChild para um <dl>.",
          },
          {
            prop: "PageHeaderActions",
            type: "ComponentProps<'div'>",
            description: "As ações, à direita a partir de sm.",
          },
          {
            prop: "PageHeaderBack",
            type: "{ href, label? }",
            description:
              "O voltar compacto, exportado para quem monta a linha à mão.",
          },
        ]}
      />
    </>
  )
}
