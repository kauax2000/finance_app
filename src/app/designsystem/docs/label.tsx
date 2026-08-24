"use client"

import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DocNote, DocSection, Usage } from "../ds-doc"

export default function LabelDoc() {
  return (
    <>
      <Usage>
        O nome do campo, ligado a ele por <code>htmlFor</code>. A ligação faz o
        clique no texto focar o controle e o leitor de tela anunciar os dois
        juntos. Sem ela, o rótulo é só um texto que por acaso está perto.
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
        description="Aqui o rótulo fica ao lado, e a área clicável passa a incluir o texto — o que importa no telefone, onde o alvo do checkbox sozinho é pequeno demais."
        code={`<Checkbox id="recorrente" />
<Label htmlFor="recorrente">Repetir todo mês</Label>`}
      >
        <div className="flex items-center gap-2">
          <Checkbox id="ds-label-check" />
          <Label htmlFor="ds-label-check">Repetir todo mês</Label>
        </div>
      </DocSection>

      <DocNote title="Rótulo e valor empilhados não levam gap">
        Quando o par é rótulo sobre valor em modo leitura (e não rótulo sobre
        campo), quem separa é a entrelinha. Ali o componente certo é{" "}
        <code>DescriptionList</code>.
      </DocNote>
    </>
  )
}
