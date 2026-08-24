"use client"

import { ScrollFade } from "@/components/ui/scroll-fade"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

export default function ScrollFadeDoc() {
  return (
    <>
      <Usage>
        Uma lista cortada em seco na borda de um cartão lê como lista terminada.
        O gradiente diz que continua. Ele aparece só do lado em que ainda há
        conteúdo, então quando tudo cabe não aparece nunca.
      </Usage>

      <DocSection
        title="Vertical"
        code={`<ScrollFade className="h-40">
  …
</ScrollFade>`}
        previewClassName="items-stretch"
      >
        <ScrollFade className="h-40 w-full rounded-lg border border-border">
          <div className="flex flex-col p-3">
            {Array.from({ length: 15 }, (_, i) => (
              <p key={i} className="py-1.5 text-sm text-muted-foreground">
                Categoria {i + 1}
              </p>
            ))}
          </div>
        </ScrollFade>
      </DocSection>

      <DocSection
        title="Horizontal"
        code={`<ScrollFade orientation="horizontal">…</ScrollFade>`}
        previewClassName="items-stretch"
      >
        <ScrollFade
          orientation="horizontal"
          className="w-full rounded-lg border border-border"
        >
          <div className="flex gap-2 p-3">
            {Array.from({ length: 12 }, (_, i) => (
              <span
                key={i}
                className="shrink-0 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground"
              >
                Filtro {i + 1}
              </span>
            ))}
          </div>
        </ScrollFade>
      </DocSection>

      <DocNote title="O gradiente não come o clique">
        As máscaras têm <code>pointer-events-none</code>. Sem isso, os itens que
        ficam sob os 24px do gradiente deixam de ser clicáveis — e o defeito só
        aparece no primeiro e no último item da lista, que é onde ninguém testa.
      </DocNote>

      <DocNote title="Ele parte do fundo do cartão">
        O gradiente vai de <code>--card</code>{" "}
        a transparente. Sobre uma
        superfície que não seja <code>bg-card</code>, passe a cor certa em{" "}
        <code>className</code>, senão aparece uma faixa clara no lugar do
        desvanecimento.
      </DocNote>

      <PropsTable
        rows={[
          {
            prop: "orientation",
            type: '"vertical" | "horizontal"',
            default: '"vertical"',
            description: "Em qual eixo a área rola.",
          },
          {
            prop: "viewportClassName",
            type: "string",
            description: "Classes da região rolável interna, não do contêiner.",
          },
        ]}
      />
    </>
  )
}
