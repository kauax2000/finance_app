"use client"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { DocNote, DocSection, Usage } from "../ds-doc"

export default function SpinnerDoc() {
  return (
    <>
      <Usage>
        Carregamento <strong>sem fim conhecido</strong> e curto: dentro de um botão que salva, ao lado de um campo que valida. Para uma tela inteira, <code>Skeleton</code> — o spinner não diz o que vem depois.
      </Usage>

      <DocSection
        title="Tamanhos"
        code={`<Spinner className="size-4" />
<Spinner className="size-6" />`}
      >
        <Spinner className="size-4" />
        <Spinner className="size-6" />
        <Spinner className="size-8 text-primary-accent" />
      </DocSection>

      <DocSection
        title="Dentro de um botão"
        description="O botão fica desabilitado durante a ação, e o rótulo muda para o gerúndio. Trocar só o ícone deixa o botão parecendo clicável de novo."
        code={`<Button disabled>
  <Spinner />
  Salvando…
</Button>`}
      >
        <Button disabled>
          <Spinner />
          Salvando…
        </Button>
        <Button variant="outline" disabled>
          <Spinner />
          Sincronizando…
        </Button>
      </DocSection>

      <DocSection
        title="Sozinho, sem texto ao lado"
        description="Aí ele precisa de label. Sem isso o spinner é invisível para o leitor de tela — de propósito, porque na esmagadora maioria dos casos o rótulo já está do lado e ouvir “Carregando” depois de “Salvando…” é dizer a mesma coisa duas vezes."
        code={`<Spinner className="size-6" label="Carregando transações" />`}
      >
        <Spinner className="size-6" label="Carregando transações" />
      </DocSection>

      <DocNote title="A ARIA dele estava morta">
        O componente declarava <code>role=&quot;status&quot;</code>{" "}
        e <code>aria-label</code>, mas o Heroicons põe{" "}
        <code>aria-hidden=&quot;true&quot;</code>{" "}
        no próprio <code>&lt;svg&gt;</code>{" "}
        e o spread não o derrubava. Os três atributos conviviam no mesmo
        elemento, e <code>aria-hidden</code>{" "}
        vence sempre: o role e o rótulo não faziam nada. Justamente o spinner
        solto — o caso para o qual o role existia — não anunciava coisa alguma.
      </DocNote>

      <DocNote title="Ele para quando o sistema pede menos animação">
        A regra global de <code>prefers-reduced-motion</code>{" "}
        reduz a rotação a
        0,01ms. O spinner deixa de girar, o que significa que ele sozinho não
        comunica mais nada: por isso o rótulo ao lado é obrigatório.
      </DocNote>
    </>
  )
}
