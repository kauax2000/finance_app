"use client"

import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { DocNote, DocSection, Usage } from "../ds-doc"

export default function TextareaDoc() {
  return (
    <>
      <Usage>
        Texto de mais de uma linha: observação de transação, motivo de um ajuste. Cresce com o conteúdo via <code>field-sizing-content</code>, sem <code>rows</code> nem script de auto-resize.
      </Usage>

      <DocSection
        title="Padrão"
        code={`<Label htmlFor="obs">Observação</Label>
<Textarea id="obs" placeholder="Opcional" />`}
        previewClassName="flex-col items-stretch"
      >
        <div className="flex w-full flex-col gap-1.5">
          <Label htmlFor="ds-textarea">Observação</Label>
          <Textarea
            id="ds-textarea"
            placeholder="Compra dividida com a Ana, metade dela"
          />
        </div>
      </DocSection>

      <DocSection
        title="Estados"
        code={`<Textarea disabled />
<Textarea aria-invalid />`}
        previewClassName="flex-col items-stretch"
      >
        <Textarea placeholder="Desabilitado" disabled aria-label="Desabilitado" />
        <Textarea defaultValue="Texto com erro" aria-invalid aria-label="Com erro" />
      </DocSection>

      <DocNote title="Enter dentro de um Textarea quebra linha">
        O <code>Form</code> normaliza o Enter para o submit, mas abre exceção para textarea: dentro de uma observação, a tecla continua fazendo o que a pessoa espera.
      </DocNote>
    </>
  )
}
