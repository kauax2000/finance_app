"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { DocNote, DocSection, Usage } from "../ds-doc"

export default function SkeletonDoc() {
  return (
    <>
      <Usage>
        O osso da tela enquanto o dado não chegou. Precisa ter <strong>a forma do conteúdo que vai substituí-lo</strong> — um retângulo genérico não prepara ninguém e ainda provoca salto de layout.
      </Usage>

      <DocSection
        title="Formas"
        code={`<Skeleton className="h-4 w-32" />
<Skeleton className="size-10 rounded-full" />
<Skeleton className="h-24 w-full rounded-xl" />`}
        previewClassName="flex-col items-stretch gap-3"
      >
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-48" />
        <Skeleton className="size-10 rounded-full" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </DocSection>

      <DocSection
        title="Com a forma do conteúdo"
        description="Este é o esqueleto de uma linha de transação: avatar, descrição sobre categoria, valor à direita. Compare com a linha real e o salto some."
        code={`<div className="flex items-center gap-3">
  <Skeleton className="size-10 shrink-0 rounded-full" />
  <div className="flex-1">
    <Skeleton className="h-4 w-32" />
    <Skeleton className="mt-1.5 h-3 w-20" />
  </div>
  <Skeleton className="h-4 w-20" />
</div>`}
        previewClassName="flex-col items-stretch gap-4"
      >
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex w-full items-center gap-3">
            <Skeleton className="size-10 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1">
              <Skeleton className="h-4 w-32 max-w-full" />
              <Skeleton className="mt-1.5 h-3 w-20 max-w-full" />
            </div>
            <Skeleton className="h-4 w-20 shrink-0" />
          </div>
        ))}
      </DocSection>

      <DocNote title="A animação é pulse, e o shimmer não existe mais">
        O <code>globals.css</code>{" "}
        carregava <code>@keyframes shimmer</code>{" "}
        e uma classe <code>.animate-shimmer</code>{" "}
        que <strong>nenhum arquivo usava</strong> — nem o Skeleton, nem tela
        alguma. Ela ainda ocupava lugar na lista de exceções do{" "}
        <code>prefers-reduced-motion</code>, protegendo algo que não existia.
        Saiu. O osso pulsa, e pulso é animação que se repete: ela continua
        rodando mesmo com movimento reduzido, porque é ela que comunica que a
        tela está viva.
      </DocNote>

      <DocNote title="Ele tem token próprio">
        <code>--skeleton</code> é um degrau abaixo de <code>--muted</code>. Com o
        cinza de muted, o osso some em telas de baixo gamut e em ambiente claro,
        e a tela parece vazia em vez de carregando.
      </DocNote>

      <DocNote title="aria-busy no contêiner, não no osso">
        Quem anuncia o carregamento é o bloco que está esperando (
        <code>aria-busy=&quot;true&quot;</code>). Os esqueletos em si são
        decorativos e não precisam ser lidos um a um.
      </DocNote>
    </>
  )
}
