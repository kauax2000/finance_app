"use client"

import { Separator } from "@/components/ui/separator"
import { DocNote, DocSection, Usage } from "../ds-doc"

export default function SeparatorDoc() {
  return (
    <>
      <Usage>
        Uma régua entre conteúdos que já estão relacionados. Se são assuntos diferentes, o que separa é espaço — régua demais transforma a tela numa planilha.
      </Usage>

      <DocSection
        title="Horizontal e vertical"
        code={`<Separator />
<Separator orientation="vertical" />`}
        previewClassName="flex-col items-stretch gap-4"
      >
        <div className="w-full">
          <p className="text-sm text-foreground">Fatura de março</p>
          <Separator className="my-3" />
          <p className="text-sm text-muted-foreground">Fecha em 28/03</p>
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span>12 transações</span>
          <Separator orientation="vertical" />
          <span>R$ 1.482,30</span>
          <Separator orientation="vertical" />
          <span>3 categorias</span>
        </div>
      </DocSection>

      <DocNote title="Ele é decorativo por padrão">
        Um leitor de tela não anuncia a régua, e é isso que se quer: ela é um
        recurso visual. Quando a divisão realmente muda o assunto, quem organiza
        é um cabeçalho, não uma linha.
      </DocNote>
    </>
  )
}
