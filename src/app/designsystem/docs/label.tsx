"use client"

import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DocNote, DocSection, Usage } from "../ds-doc"

export default function LabelDoc() {
  return (
    <>
      <Usage>
          O nome do campo, ligado a ele por <code>htmlFor</code>: o clique no texto foca o controle e o leitor de tela anuncia os dois juntos. Num formulário, prefira <code>FormInput</code> ou <code>Field</code>, que já fazem a ligação.
      </Usage>

      <DocSection
        title="Com um campo"
        code={`<Label htmlFor="valor">Valor</Label>
<Input id="valor" />`}
        previewClassName="flex-col items-stretch"
      >
        <div className="flex w-full flex-col gap-1.5">
          <Label htmlFor="ds-label-input">Descrição</Label>
          <Input id="ds-label-input" placeholder="Padaria" />
        </div>
      </DocSection>

      <DocSection
        title="Com um controle booleano"
        description="O rótulo ao lado inclui o texto na área clicável — no telefone, o checkbox sozinho é alvo pequeno demais."
        code={`<Checkbox id="recorrente" />
<Label htmlFor="recorrente">Repetir todo mês</Label>`}
      >
        <div className="flex items-center gap-2">
          <Checkbox id="ds-label-check" />
          <Label htmlFor="ds-label-check">Repetir todo mês</Label>
        </div>
      </DocSection>

      <DocNote title="Rótulo e valor empilhados não levam gap">
        Rótulo sobre valor em modo leitura não é campo: ali o componente é <code>DescriptionList</code>, e quem separa é a entrelinha.
      </DocNote>
    </>
  )
}
