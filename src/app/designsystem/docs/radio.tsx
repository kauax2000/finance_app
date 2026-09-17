"use client"

import { Label } from "@/components/ui/label"
import { Radio } from "@/components/ui/radio"
import { RadioGroup } from "@/components/ui/radio-group"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

export default function RadioDoc() {
  return (
    <>
      <Usage>
        O anel e o ponto de uma escolha única — o controle e nada mais. O rótulo é do <code>RadioGroupItem</code>, e o campo inteiro é o <code>FormRadioGroup</code>; use este átomo só para compor a opção à mão, como um cartão com conteúdo próprio.
      </Usage>

      <DocSection
        title="Estados"
        description="As quatro condições do controle, todas dentro de um RadioGroup — fora dele o componente não renderiza."
        code={`<RadioGroup defaultValue="b">
  <Label className="flex items-center gap-2">
    <Radio value="a" /> Não marcado
  </Label>
  <Label className="flex items-center gap-2">
    <Radio value="b" /> Marcado
  </Label>
</RadioGroup>`}
        previewClassName="flex-col items-stretch"
      >
        <RadioGroup defaultValue="marcado" className="gap-3">
          <Label className="flex w-fit items-center gap-2 font-normal">
            <Radio value="nao-marcado" />
            Não marcado
          </Label>
          <Label className="flex w-fit items-center gap-2 font-normal">
            <Radio value="marcado" />
            Marcado
          </Label>
          <Label className="flex w-fit items-center gap-2 font-normal">
            <Radio value="desabilitado" disabled />
            Desabilitado
          </Label>
          <Label className="flex w-fit items-center gap-2 font-normal">
            <Radio value="invalido" aria-invalid />
            Inválido
          </Label>
        </RadioGroup>
      </DocSection>

      <DocNote title="Ele exige o RadioGroup">
        O <code>Item</code> do Radix lança fora de um <code>RadioGroup</code>, e reimplementar papel, foco itinerante e input espelho à mão seria trocar uma primitiva testada por uma cópia pior. Contexto de primitiva não é composição: o anel continua sendo o átomo.
      </DocNote>

      <DocNote title="O alvo tem 44px, e não 16">
        O desenho tem 16px e um <code>after:-inset-3.5</code> expande o toque a 44 sem mexer no layout, como no <code>Checkbox</code> e no <code>Switch</code>. Isso soma a embrulhar a opção num rótulo clicável, não o substitui.
      </DocNote>

      <DocNote title="O anel é --primary-accent, e o ponto é currentColor">
        O ponto não carrega texto por cima: ele precisa ser visto contra a página, que é a definição de <code>--primary-accent</code>. O anel declara <code>text-primary-accent</code> e o ponto usa <code>bg-current</code>, então <code>&lt;Radio className=&quot;text-destructive&quot;&gt;</code> retinge o ponto.
      </DocNote>

      <DocNote title="O estado é data-state, e não data-checked">
        Para ler o estado de fora, use <code>data-[state=checked]</code>, que é o atributo que o Radix escreve. A variante <code>data-checked:</code> do Tailwind também casa, mas procurar <code>data-checked</code> no DOM não acha nada.
      </DocNote>

      <PropsTable
        rows={[
          {
            prop: "value",
            type: "string",
            description: "O valor da opção. Obrigatório — é como o grupo a identifica.",
          },
          {
            prop: "disabled",
            type: "boolean",
            description: "Desliga o controle: cursor not-allowed e opacidade a 50%.",
          },
          {
            prop: "aria-invalid",
            type: "boolean",
            description: "Pinta borda e anel de destructive. Dentro de um RadioGroup desce por contexto.",
          },
          {
            prop: "className",
            type: "string",
            description: "Veste o anel; text-* aqui retinge o ponto, que é currentColor.",
          },
        ]}
      />
    </>
  )
}
