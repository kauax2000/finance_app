"use client"

import { AspectRatio } from "@/components/ui/aspect-ratio"
import { DocSection, PropsTable, Usage } from "../ds-doc"

export default function AspectRatioDoc() {
  return (
    <>
      <Usage>
        Reserva a proporção antes de o conteúdo chegar. É o que evita o salto de layout quando uma imagem ou um gráfico termina de carregar.
      </Usage>

      <DocSection
        title="Proporções"
        code={`<AspectRatio ratio={16 / 9}>
  <img src="…" alt="" className="size-full object-cover" />
</AspectRatio>`}
        previewClassName="items-stretch gap-4"
      >
        {[
          [16 / 9, "16:9"],
          [1, "1:1"],
          [3 / 4, "3:4"],
        ].map(([ratio, label]) => (
          <div key={label as string} className="w-40">
            <AspectRatio
              ratio={ratio as number}
              className="flex items-center justify-center rounded-lg bg-muted text-xs text-muted-foreground"
            >
              {label as string}
            </AspectRatio>
          </div>
        ))}
      </DocSection>

      <PropsTable
        rows={[
          {
            prop: "ratio",
            type: "number",
            default: "1",
            description: "Largura dividida por altura. 16 / 9, não 1.77.",
          },
        ]}
      />
    </>
  )
}
