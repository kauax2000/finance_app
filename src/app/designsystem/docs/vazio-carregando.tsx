"use client"

import { ReceiptPercentIcon } from "@heroicons/react/16/solid"
import { Button } from "@/components/ui/button"
import {
  EmptyState,
  EmptyStateActions,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
} from "@/components/ui/empty-state"
import { Skeleton } from "@/components/ui/skeleton"
import { DocNote, DocSection, Usage } from "../ds-doc"
import { Group, Spec, Stack } from "../ds-kit"

export default function VazioCarregandoDoc() {
  return (
    <>
      <Usage>
        Toda tela tem quatro estados: carregando, vazio, com erro e com conteúdo. Uma tela que só desenha o último está incompleta, mesmo parecendo pronta onde os dados chegam em 20ms.
      </Usage>

      <Group title="Os quatro estados" layout="grid">
        <Spec title="1 · Carregando" meta="Skeleton">
          <Stack className="gap-3">
            {[0, 1].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="size-10 shrink-0 rounded-full" />
                <div className="min-w-0 flex-1">
                  <Skeleton className="h-4 w-28 max-w-full" />
                  <Skeleton className="mt-1.5 h-3 w-16 max-w-full" />
                </div>
              </div>
            ))}
          </Stack>
        </Spec>

        <Spec title="2 · Vazio" meta="EmptyState">
          <EmptyState className="px-4 py-6">
            <EmptyStateIcon>
              <ReceiptPercentIcon aria-hidden />
            </EmptyStateIcon>
            <EmptyStateTitle>Nenhuma transação</EmptyStateTitle>
            <EmptyStateDescription>
              Lance a primeira para o extrato começar.
            </EmptyStateDescription>
            <EmptyStateActions>
              <Button size="sm">Nova transação</Button>
            </EmptyStateActions>
          </EmptyState>
        </Spec>
      </Group>

      <DocSection
        title="A ordem importa"
        description="Carregando vem antes de vazio. Mostrar “você não tem nada” e trocar por conteúdo meio segundo depois é pior que meio segundo de esqueleto."
        code={`if (isLoading) return <ListaSkeleton />
if (error) return <ErroComTentarDeNovo />
if (!itens.length) return <EmptyState … />
return <Lista itens={itens} />`}
        previewClassName="items-stretch"
      >
        <pre className="w-full overflow-x-auto font-mono text-xs text-muted-foreground">
{`if (isLoading) return <ListaSkeleton />
if (error)     return <ErroComTentarDeNovo />
if (!itens.length) return <EmptyState … />
return <Lista itens={itens} />`}
        </pre>
      </DocSection>

      <DocNote title="Três vazios diferentes, três textos diferentes">
        <strong>Nunca teve</strong> pede explicação e a primeira ação. <strong>O filtro não achou</strong> pede limpar, não criar — quem filtrou quer ver o que sumiu. <strong>Deu erro</strong> pede o que houve e um &ldquo;tentar de novo&rdquo;.
      </DocNote>

      <DocNote title="O esqueleto tem a forma do que vem depois">
        Avatar, duas linhas e um valor à direita na lista real viram as quatro coisas nas mesmas posições no esqueleto.
      </DocNote>

      <DocNote title="Offline é um quinto estado, e este app tem">
        Com fila de mutações local, existe &ldquo;salvo aqui, ainda não
        sincronizado&rdquo;. Ele não é erro e não é sucesso, e a tela precisa
        dizer isso — é o que <code>sync-status-chip</code> e{" "}
        <code>offline-banner</code> fazem.
      </DocNote>
    </>
  )
}
