"use client"

import { ExclamationTriangleIcon, MagnifyingGlassIcon, ReceiptPercentIcon } from "@heroicons/react/24/outline"
import { PlusIcon } from "@heroicons/react/16/solid"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardToolbar } from "@/components/ui/card"
import {
  EmptyState,
  EmptyStateActions,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
} from "@/components/ui/empty-state"
import { Skeleton } from "@/components/ui/skeleton"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

export default function EmptyStateDoc() {
  return (
    <>
      <Usage>
          O que a tela diz quando não há nada nela. Cada vazio pede um texto e uma ação: <strong>nunca teve</strong> (a primeira ação), <strong>o filtro não achou</strong> (limpar), <strong>deu erro</strong> (tentar de novo). Enquanto o dado chega é <code>Skeleton</code>, não vazio.
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
        description="A ação é remover o que causou o vazio: quem filtrou não quer cadastrar, quer ver o que sumiu."
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
        description="Erro é um vazio de outra natureza: use o tone do ícone, não bg-destructive-muted à mão."
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
        title="Os quatro estados, na ordem"
        description="Toda tela tem quatro estados: carregando, erro, vazio e com conteúdo. Desenhar só o último deixa a tela incompleta; carregando vem antes de vazio, com esqueleto na forma do conteúdo."
        code={`if (isLoading) return <ListaSkeleton />
if (error) return <ErroComTentarDeNovo />
if (!itens.length) return <EmptyState … />
return <Lista itens={itens} />`}
        previewClassName="items-stretch"
      >
        <div className="flex w-full max-w-sm flex-col gap-3">
          {[0, 1].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="size-10 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1">
                <Skeleton className="h-4 w-28 max-w-full" />
                <Skeleton className="mt-1.5 h-3 w-16 max-w-full" />
              </div>
            </div>
          ))}
        </div>
      </DocSection>

      <DocSection
        title="Molduras"
        description="dashed é o padrão; card é o bloco com superfície; plain não desenha moldura, para dentro de um Card."
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
          O <code>gap</code> é do <code>EmptyState</code> e nenhuma peça declara margem. Com margem nos filhos, tirar a descrição mudaria sozinho o respiro entre ícone e título.
      </DocNote>

      <DocNote title="O título é um p; asChild quando precisa ser cabeçalho">
          Um <code>h2</code> fixo entraria na página a cada bloco vazio, inclusive dentro de uma seção que já tem o seu. Quem precisa de cabeçalho usa <code>asChild</code> com o nível certo, como a seção &ldquo;Deu erro&rdquo; acima.
      </DocNote>

      <DocNote title="Vazio não é carregando">
          Enquanto o dado está a caminho, é <code>Skeleton</code>. Mostrar o vazio e trocar meio segundo depois faz a pessoa ler &ldquo;você não tem nada&rdquo; sobre uma conta que tem.
      </DocNote>

      <DocNote title="Este é o componente do projeto, não o do registry">
          Não instale o <code>empty</code> do registry: duas respostas para a mesma pergunta fazem o design system deixar de descrever o produto.
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
              "Folga a mais que o gap, para o botão não ler como parte do parágrafo.",
          },
        ]}
      />
    </>
  )
}
