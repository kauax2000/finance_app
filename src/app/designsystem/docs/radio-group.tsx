"use client"

import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { DocSection, Usage } from "../ds-doc"

export default function RadioGroupDoc() {
  return (
    <>
      <Usage>
        Escolha única entre <strong>poucas</strong> opções — ele existe para comparar todas lado a lado antes de decidir. Passando de cinco, o componente é o <code>Select</code>.
      </Usage>

      <DocSection
        title="Padrão"
        code={`<RadioGroup defaultValue="unica">
  <div className="flex items-center gap-2">
    <RadioGroupItem value="unica" id="unica" />
    <Label htmlFor="unica">Única</Label>
  </div>
</RadioGroup>`}
        previewClassName="flex-col items-stretch"
      >
        <RadioGroup defaultValue="unica" className="flex flex-col gap-3">
          {[
            ["unica", "Única"],
            ["parcelada", "Parcelada"],
            ["recorrente", "Recorrente"],
          ].map(([value, label]) => (
            <div key={value} className="flex items-center gap-2">
              <RadioGroupItem value={value} id={`ds-radio-${value}`} />
              <Label htmlFor={`ds-radio-${value}`}>{label}</Label>
            </div>
          ))}
        </RadioGroup>
      </DocSection>

      <DocSection
        title="Como cartões"
        description="Quando cada opção precisa de uma explicação, o alvo passa a ser o cartão inteiro. É também o que resolve o alvo de toque: um radio sozinho tem 16px."
        code={`<Label className="flex min-h-11 items-start gap-3 rounded-lg border p-3">
  <RadioGroupItem value="pix" className="mt-0.5" />
  <span>
    <span className="block text-sm font-medium">Pix</span>
    <span className="block text-xs text-muted-foreground">Cai na hora.</span>
  </span>
</Label>`}
        previewClassName="flex-col items-stretch gap-2"
      >
        <RadioGroup defaultValue="pix" className="flex w-full flex-col gap-2">
          {[
            ["pix", "Pix", "Cai na hora, sem taxa."],
            ["cartao", "Cartão de crédito", "Entra na fatura do mês seguinte."],
          ].map(([value, title, desc]) => (
            <Label
              key={value}
              className="flex min-h-11 items-start gap-3 rounded-lg border border-border p-3 font-normal hover:bg-accent/60 active:bg-accent/60"
            >
              <RadioGroupItem value={value} id={`ds-radio-card-${value}`} className="mt-0.5" />
              <span className="min-w-0">
                <span className="block text-sm font-medium text-foreground">
                  {title}
                </span>
                <span className="block text-xs text-muted-foreground">{desc}</span>
              </span>
            </Label>
          ))}
        </RadioGroup>
      </DocSection>
    </>
  )
}
