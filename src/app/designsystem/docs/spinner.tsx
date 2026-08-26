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

      <DocNote title="Ele para quando o sistema pede menos animação">
        A regra global de <code>prefers-reduced-motion</code>{" "}
        reduz a rotação a
        0,01ms. O spinner deixa de girar, o que significa que ele sozinho não
        comunica mais nada: por isso o rótulo ao lado é obrigatório.
      </DocNote>
    </>
  )
}
