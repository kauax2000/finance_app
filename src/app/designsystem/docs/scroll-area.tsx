"use client"

import { ScrollArea } from "@/components/ui/scroll-area"
import { DocNote, DocSection, Usage } from "../ds-doc"

export default function ScrollAreaDoc() {
  return (
    <>
      <Usage>
        Uma região rolável com barra estilizada. Vale para uma lista dentro de um popover ou de um cartão de altura fixa. Nunca na página inteira: a rolagem do documento tem comportamento de sistema que não se imita.
      </Usage>

      <DocSection
        title="Vertical"
        code={`<ScrollArea className="h-48">
  …
</ScrollArea>`}
        previewClassName="items-stretch"
      >
        <ScrollArea className="h-48 w-full rounded-lg border border-border">
          <div className="flex flex-col p-3">
            {Array.from({ length: 20 }, (_, i) => (
              <p key={i} className="py-1.5 text-sm text-muted-foreground">
                Transação {i + 1}
              </p>
            ))}
          </div>
        </ScrollArea>
      </DocSection>

      <DocNote title="ScrollArea ou ScrollFade?">
        <code>ScrollArea</code> mostra <em>onde</em> a rolagem está, com a barra.{" "}
        <code>ScrollFade</code> mostra <em>que existe mais</em>, apagando a borda
        em gradiente. No telefone a barra some sozinha, então ali o segundo é
        quase sempre o que comunica.
      </DocNote>
    </>
  )
}
