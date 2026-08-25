"use client"

import { MagnifyingGlassIcon, PlusIcon, ReceiptPercentIcon } from "@heroicons/react/16/solid"
import { Button } from "@/components/ui/button"
import {
  EmptyState,
  EmptyStateActions,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
} from "@/components/ui/empty-state"
import { DocNote, DocSection, Usage } from "../ds-doc"

export default function EmptyStateDoc() {
  return (
    <>
      <Usage>
        O que a tela diz quando não há nada nela. Três vazios exigem três textos: <strong>nunca teve</strong> (ofereça a primeira ação), <strong>o filtro não achou</strong> (ofereça limpar), <strong>deu erro</strong> (ofereça tentar de novo).
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
          <EmptyStateTitle>Nada em março com esses filtros</EmptyStateTitle>
          <EmptyStateDescription>
            Existem 42 transações no período sem os filtros de categoria e
            cartão.
          </EmptyStateDescription>
          <EmptyStateActions>
            <Button variant="outline">Limpar filtros</Button>
          </EmptyStateActions>
        </EmptyState>
      </DocSection>

      <DocNote title="Vazio não é carregando">
        Enquanto o dado está a caminho, o certo é <code>Skeleton</code>. Mostrar o vazio e trocar meio segundo depois faz a pessoa ler &ldquo;você não tem nada&rdquo; sobre uma conta que tem.
      </DocNote>

      <DocNote title="Este componente é o do projeto, não o do registry">
        O registry tem um <code>empty</code> parecido, e ele <strong>não</strong> foi instalado: duas respostas para a mesma pergunta é como um design system deixa de descrever o produto.
      </DocNote>
    </>
  )
}
