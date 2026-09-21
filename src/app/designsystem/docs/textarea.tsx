"use client"

import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

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

      <DocNote title="O size aqui não mede altura">
        A altura vem de <code>field-sizing-content</code> com{" "}
        <code>min-h-16</code> — ela cresce com o conteúdo, já nasce acima do
        piso de toque, e um <code>h-*</code> brigaria com ela. O que o degrau
        carrega é o <strong>recuo e o corpo do texto</strong>, para um{" "}
        <code>FormTextarea</code> poder ficar ao lado de um{" "}
        <code>FormInput size=&quot;lg&quot;</code> falando o mesmo nome. Ele
        existe porque a família fala uma língua só: o recuo era{" "}
        <code>px-2.5</code> aqui e <code>px-3</code> no <code>Input</code>, e
        empilhados num formulário a borda esquerda do texto serrilhava.
      </DocNote>

      <PropsTable
        rows={[
          {
            prop: "size",
            type: '"sm" | "md" | "lg" | "xl"',
            default: '"md"',
            description:
              "O recuo e o corpo do texto, nos nomes da escada do sistema. Não é altura.",
          },
          {
            prop: "aria-invalid",
            type: "boolean",
            description: "Pinta a borda e o anel de destructive.",
          },
        ]}
      />
    </>
  )
}
