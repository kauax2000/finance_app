"use client"

import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { DocSection, Usage } from "../ds-doc"

export default function CheckboxDoc() {
  return (
    <>
      <Usage>
        Escolha booleana que só vale quando o formulário é enviado. Se a mudança vale no instante do toque — uma preferência, um filtro — o componente é o <code>Switch</code>.
      </Usage>

      <DocSection
        title="Estados"
        code={`<Checkbox />
<Checkbox defaultChecked />
<Checkbox disabled />
<Checkbox checked="indeterminate" />`}
        previewClassName="flex-col items-start gap-3"
      >
        <div className="flex items-center gap-2">
          <Checkbox id="ds-cb-1" />
          <Label htmlFor="ds-cb-1">Não marcado</Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox id="ds-cb-2" defaultChecked />
          <Label htmlFor="ds-cb-2">Marcado</Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox id="ds-cb-3" defaultChecked disabled />
          <Label htmlFor="ds-cb-3">Desabilitado</Label>
        </div>
      </DocSection>

      <DocSection
        title="Lista de seleção"
        description="Numa lista, o rótulo inteiro é o alvo do toque. O checkbox sozinho tem 16px, muito abaixo dos 44px que um dedo pede."
        code={`<Label className="flex items-center gap-3 rounded-lg border p-3">
  <Checkbox />
  <span>Mercado</span>
</Label>`}
        previewClassName="flex-col items-stretch gap-2"
      >
        {["Mercado", "Transporte", "Assinaturas"].map((cat) => (
          <Label
            key={cat}
            className="flex min-h-11 items-center gap-3 rounded-lg border border-border px-3 font-normal hover:bg-accent/60 active:bg-accent/60"
          >
            <Checkbox />
            <span className="text-sm">{cat}</span>
          </Label>
        ))}
      </DocSection>
    </>
  )
}
