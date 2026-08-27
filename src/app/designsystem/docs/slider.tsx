"use client"

import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { DocNote, DocSection, Usage } from "../ds-doc"

export default function SliderDoc() {
  return (
    <>
      <Usage>
        Valor contínuo em que o <strong>aproximado basta</strong>: uma faixa de filtro, um limite de alerta. Nunca para um valor em reais exato — ali o componente é o <code>MoneyInput</code>.
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
        Um punho grande o bastante para o dedo seria grande demais para o olho: a
        14px sobre um trilho de 8 ele lê como a ponta do preenchimento, e não
        como um disco pousado em cima. O alvo de toque cresce por baixo, num
        pseudo-elemento de 44px — a mesma saída do <code>Switch</code>. Cresce a
        área de contato sem crescer o desenho.
      </DocNote>

      <DocNote title="O valor precisa aparecer em algum lugar">
        Um slider sozinho não diz onde parou. Mostre o número ao lado ou acima —
        e não só no tooltip do arraste, que não existe no toque.
      </DocNote>
    </>
  )
}
