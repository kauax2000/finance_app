"use client"

import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { DocNote, DocSection, Usage } from "../ds-doc"

export default function SliderDoc() {
  return (
    <>
      <Usage>
        Valor contínuo em que o <strong>aproximado basta</strong>: uma faixa de filtro, um limite de alerta. Nunca para um valor em reais exato — ali o campo é <code>&lt;Input money&gt;</code>.
      </Usage>

      <DocSection
        title="Valor único"
        code={`<Slider defaultValue={[60]} max={100} step={5} />`}
        previewClassName="flex-col items-stretch"
      >
        <div className="flex w-full max-w-sm flex-col gap-2">
          {/* O `slider` é o punho, um <span>: <label for> não o rotula. O nome vai
              por aria-labelledby, que o componente repassa ao punho. */}
          <Label id="ds-slider-label">Alertar ao atingir</Label>
          <Slider aria-labelledby="ds-slider-label" defaultValue={[80]} max={100} step={5} />
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

      <DocSection
        title="Desativado"
        description="Vem da raiz, e apaga a peça inteira — trilho, faixa e punho."
        code={`<Slider defaultValue={[40]} max={100} disabled />`}
        previewClassName="flex-col items-stretch"
      >
        <div className="w-full max-w-sm">
          <Slider
            defaultValue={[40]}
            max={100}
            disabled
            aria-label="Limite (desativado)"
          />
        </div>
      </DocSection>

      <DocNote title="O punho é 14px, e o alvo é 44">
        A 14px sobre um trilho de 8 o punho lê como a ponta do preenchimento; o alvo de toque cresce num pseudo-elemento de 44px, como no <code>Switch</code>. Cresce o contato sem crescer o desenho.
      </DocNote>

      <DocNote title="O valor precisa aparecer em algum lugar">
        Um slider sozinho não diz onde parou. Mostre o número ao lado ou acima —
        e não só no tooltip do arraste, que não existe no toque.
      </DocNote>
    </>
  )
}
