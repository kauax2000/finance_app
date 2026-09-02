"use client"

import {
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  ReceiptPercentIcon,
} from "@heroicons/react/16/solid"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardToolbar } from "@/components/ui/card"
import {
  EmptyState,
  EmptyStateActions,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
} from "@/components/ui/empty-state"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

export default function EmptyStateDoc() {
  return (
    <>
      <Usage>
        O que a tela diz quando não há nada nela. Três vazios exigem três textos:{" "}
        <strong>nunca teve</strong> (ofereça a primeira ação),{" "}
        <strong>o filtro não achou</strong> (ofereça limpar),{" "}
        <strong>deu erro</strong> (ofereça tentar de novo).
      </Usage>

      <DocSection
        title="Nunca teve"
        description="A ação primária vai junto: o vazio é o melhor momento para ensinar o que fazer."
        code={`<EmptyState>
  <EmptyStateIcon><ReceiptPercentIcon /></EmptyStateIcon>
  <EmptyStateTitle>Nenhuma transação ainda</EmptyStateTitle>
  <EmptyStateDescription>…</EmptyStateDescription>
  <EmptyStateActions><Button>Nova transação</Button></EmptyStateActions>
</EmptyState>`}
        previewClassName="items-stretch"
      >
        <EmptyState className="w-full">
          <EmptyStateIcon>
            <ReceiptPercentIcon aria-hidden />
          </EmptyStateIcon>
          <EmptyStateTitle>Nenhuma transação ainda</EmptyStateTitle>
          <EmptyStateDescription>
            Lance a primeira e o extrato, os totais do mês e os orçamentos
            começam a se preencher sozinhos.
          </EmptyStateDescription>
          <EmptyStateActions>
            <Button>
              <PlusIcon aria-hidden />
              Nova transação
            </Button>
          </EmptyStateActions>
        </EmptyState>
      </DocSection>

      <DocSection
        title="O filtro não achou"
        description="Aqui a ação é remover o que causou o vazio, não criar algo novo — quem filtrou não quer cadastrar, quer ver o que sumiu."
        code={`<EmptyStateActions>
  <Button variant="outline">Limpar filtros</Button>
</EmptyStateActions>`}
        previewClassName="items-stretch"
      >
        <EmptyState className="w-full">
          <EmptyStateIcon>
            <MagnifyingGlassIcon aria-hidden />
          </EmptyStateIcon>
          <EmptyStateTitle>Nada com esses filtros</EmptyStateTitle>
          <EmptyStateDescription>
            Nenhuma transação entre 1 e 7 de março na categoria Mercado.
          </EmptyStateDescription>
          <EmptyStateActions>
            <Button variant="outline">Limpar filtros</Button>
          </EmptyStateActions>
        </EmptyState>
      </DocSection>

      <DocSection
        title="Deu erro"
        description="O tom do ícone é do sistema. route-error-fallback pintava bg-destructive-muted à mão — um estado de erro é um vazio de outra natureza, e a cor tem nome."
        code={`<EmptyStateIcon tone="destructive">
  <ExclamationTriangleIcon />
</EmptyStateIcon>`}
        previewClassName="items-stretch"
      >
        <EmptyState variant="card" className="w-full">
          <EmptyStateIcon tone="destructive">
            <ExclamationTriangleIcon aria-hidden />
          </EmptyStateIcon>
          <EmptyStateTitle asChild>
            <h3>Algo deu errado</h3>
          </EmptyStateTitle>
          <EmptyStateDescription>
            Não foi possível carregar suas transações. Tente de novo em alguns
            instantes.
          </EmptyStateDescription>
          <EmptyStateActions>
            <Button>Tentar de novo</Button>
            <Button variant="tertiary">Voltar ao início</Button>
          </EmptyStateActions>
        </EmptyState>
      </DocSection>

      <DocSection
        title="Molduras"
        description="dashed é o padrão. card é o que duas telas do app já escreviam à mão. plain não desenha nada — é o de dentro de um Card, que já tem a sua."
        code={`<EmptyState variant="plain" size="sm">…</EmptyState>`}
        previewClassName="items-stretch"
      >
        <Card padding="none" className="w-full">
          <CardToolbar>Fatura de março</CardToolbar>
          <CardContent className="p-0">
            <EmptyState variant="plain" size="sm">
              <EmptyStateTitle>Nenhuma compra nesta fatura</EmptyStateTitle>
              <EmptyStateDescription>
                O ciclo fecha em 28 de março.
              </EmptyStateDescription>
            </EmptyState>
          </CardContent>
        </Card>
      </DocSection>

      <DocNote title="O respiro é do pai, e não dos filhos">
        As quatro peças carregavam <code>mb-4</code>, <code>mb-2</code> e{" "}
        <code>mb-6</code>, e o contêiner ficava em <code>gap: normal</code> —
        medido. O layout era decidido de baixo para cima: tirar a descrição
        mudava sozinho o respiro entre o ícone e o título, e a última peça da
        pilha deixava 24px de margem contra a borda de baixo do bloco.
      </DocNote>

      <DocNote title="O título não é um h2 cravado">
        Ele era, e isso põe um <code>h2</code> na página toda vez que um bloco
        vazio aparece — inclusive dentro de uma seção que já tem o seu, que é o
        caso de duas das quatro telas do app. O padrão é um <code>&lt;p&gt;</code>{" "}
        estilizado; quem precisa de cabeçalho de verdade usa <code>asChild</code>{" "}
        com o nível certo, como a seção &ldquo;Deu erro&rdquo; acima faz.
      </DocNote>

      <DocNote title="variant existe porque duas telas já a escreviam">
        <code>not-found-shell</code> e <code>route-error-fallback</code> abrem
        com a <strong>mesma string</strong>:{" "}
        <code>className=&quot;w-full border-border/80 bg-card/40 py-10&quot;</code>.
        Duas cópias idênticas de uma sobrescrita são uma variante faltando — e o{" "}
        <code>border-border/80</code> era ainda um quarto peso de borda no app.
      </DocNote>

      <DocNote title="Vazio não é carregando">
        Enquanto o dado está a caminho, o certo é <code>Skeleton</code>. Mostrar
        o vazio e trocar meio segundo depois faz a pessoa ler &ldquo;você não tem
        nada&rdquo; sobre uma conta que tem.
      </DocNote>

      <DocNote title="Este componente é o do projeto, não o do registry">
        O registry tem um <code>empty</code> parecido, e ele{" "}
        <strong>não</strong> foi instalado: duas respostas para a mesma pergunta
        é como um design system deixa de descrever o produto.
      </DocNote>

      <PropsTable
        rows={[
          {
            prop: "variant",
            type: '"dashed" | "card" | "plain"',
            default: '"dashed"',
            description:
              "plain não desenha moldura — é o de dentro de um Card, que já tem a sua.",
          },
          {
            prop: "size",
            type: '"sm" | "md" | "lg"',
            default: '"md"',
            description:
              "Respiro, recuo e a medida do ícone juntos. lg é a página inteira; sm é a célula.",
          },
        ]}
      />

      <PropsTable
        title="Peças"
        rows={[
          {
            prop: "EmptyStateIcon",
            type: 'tone: "default" | "info" | "success" | "warning" | "destructive"',
            default: '"default"',
            description: "A medida vem do size do bloco.",
          },
          {
            prop: "EmptyStateTitle",
            type: "ComponentProps<'p'> & { asChild }",
            description: "Um <p> por padrão. asChild quando ele precisa ser cabeçalho.",
          },
          {
            prop: "EmptyStateDescription",
            type: "ComponentProps<'p'>",
            description: "Teto de medida em max-w-sm, para a linha não esticar.",
          },
          {
            prop: "EmptyStateActions",
            type: "ComponentProps<'div'>",
            description:
              "Ganha uma folga a mais que o gap do bloco: botão colado em parágrafo lê como parte dele.",
          },
        ]}
      />
    </>
  )
}
