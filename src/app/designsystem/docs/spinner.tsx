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
        description="O botão fica desabilitado e o rótulo vai para o gerúndio. Trocar só o ícone deixa o botão parecendo clicável."
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
        description="Aí ele precisa de label. Sem ele o spinner é invisível ao leitor de tela, de propósito: quase sempre o rótulo já está ao lado."
        code={`<Spinner className="size-6" label="Carregando transações" />`}
      >
        <Spinner className="size-6" label="Carregando transações" />
      </DocSection>

      <DocNote title="Ele para quando o sistema pede menos animação">
        Com <code>prefers-reduced-motion</code> ele para de girar e não comunica nada sozinho: por isso o rótulo ao lado é obrigatório.
      </DocNote>
    </>
  )
}
