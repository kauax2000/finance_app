"use client"

import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { DocNote, DocSection, Usage } from "../ds-doc"

export default function SliderDoc() {
  return (
    <>
      <Usage>
        Valor contínuo em que o <strong>aproximado basta</strong>: uma faixa de
        filtro, um limite de alerta. Nunca para um valor em reais que precisa ser
        exato — ali o componente é o <code>MoneyInput</code>.
      </Usage>

      <DocSection
        title="Valor único"
        code={`<Slider defaultValue={[60]} max={100} step={5} />`}
        previewClassName="flex-col items-stretch"
      >
        <div className="flex w-full max-w-sm flex-col gap-2">
          <Label htmlFor="ds-slider">Alertar ao atingir</Label>
          <Slider id="ds-slider" defaultValue={[80]} max={100} step={5} />
        </div>
      </DocSection>

      <DocSection
        title="Intervalo"
        description="Dois valores no mesmo trilho, para faixa de busca."
        code={`<Slider defaultValue={[20, 80]} max={100} step={10} />`}
        previewClassName="flex-col items-stretch"
      >
        <div className="w-full max-w-sm">
          <Slider
            defaultValue={[20, 80]}
            max={100}
            step={10}
            aria-label="Faixa de valor"
          />
        </div>
      </DocSection>

      <DocNote title="O valor precisa aparecer em algum lugar">
        Um slider sozinho não diz onde parou. Mostre o número ao lado ou acima —
        e não só no tooltip do arraste, que não existe no toque.
      </DocNote>
    </>
  )
}
