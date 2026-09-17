"use client"

import { FormRadioGroup } from "@/components/ui/form"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

export default function RadioGroupDoc() {
  return (
    <>
      <Usage>
        Escolha única entre <strong>poucas</strong> opções, para comparar todas lado a lado antes de decidir. Passando de cinco, use <code>Select</code>. Dentro de um formulário, a forma curta é <code>FormRadioGroup</code>.
      </Usage>

      <DocSection
        title="Em linha"
        description="O padrão. Cada opção é um rótulo que contém o rádio, então o alvo é a linha e não o círculo."
        code={`<RadioGroup defaultValue="unica">
  <RadioGroupItem value="unica">Única</RadioGroupItem>
  <RadioGroupItem value="parcelada">Parcelada</RadioGroupItem>
  <RadioGroupItem value="recorrente">Recorrente</RadioGroupItem>
</RadioGroup>`}
        previewClassName="flex-col items-stretch"
      >
        <RadioGroup defaultValue="unica">
          <RadioGroupItem value="unica">Única</RadioGroupItem>
          <RadioGroupItem value="parcelada">Parcelada</RadioGroupItem>
          <RadioGroupItem value="recorrente">Recorrente</RadioGroupItem>
        </RadioGroup>
      </DocSection>

      <DocSection
        title="Em cartão"
        description="Quando cada opção precisa de explicação. A caixa inteira acende, e a descrição vive dentro do rótulo para continuar clicável."
        code={`<RadioGroup defaultValue="pix" variant="card">
  <RadioGroupItem value="pix" description="Cai na hora, sem taxa.">
    Pix
  </RadioGroupItem>
  <RadioGroupItem value="cartao" description="Entra na fatura do mês seguinte.">
    Cartão de crédito
  </RadioGroupItem>
</RadioGroup>`}
        previewClassName="flex-col items-stretch"
      >
        <RadioGroup defaultValue="pix" variant="card" className="w-full max-w-sm">
          <RadioGroupItem value="pix" description="Cai na hora, sem taxa.">
            Pix
          </RadioGroupItem>
          <RadioGroupItem
            value="cartao"
            description="Entra na fatura do mês seguinte."
          >
            Cartão de crédito
          </RadioGroupItem>
          <RadioGroupItem value="boleto" description="Compensa em até 3 dias." disabled>
            Boleto
          </RadioGroupItem>
        </RadioGroup>
      </DocSection>

      <DocSection
        title="Na horizontal"
        description="Colunas de largura igual. Use no lugar de abas dentro de formulário."
        code={`<RadioGroup
  defaultValue="total"
  variant="card"
  orientation="horizontal"
>
  <RadioGroupItem value="total">Total e parcelas</RadioGroupItem>
  <RadioGroupItem value="per_installment">Valor da parcela</RadioGroupItem>
</RadioGroup>`}
        previewClassName="flex-col items-stretch"
      >
        <RadioGroup
          defaultValue="total"
          variant="card"
          orientation="horizontal"
          className="w-full max-w-md"
        >
          <RadioGroupItem value="total">Total e parcelas</RadioGroupItem>
          <RadioGroupItem value="per_installment">
            Valor da parcela
          </RadioGroupItem>
        </RadioGroup>
      </DocSection>

      <DocSection
        title="Dentro de um formulário"
        description="FormRadioGroup monta o campo inteiro: o título que nomeia o grupo, a ajuda, o erro e a ligação de acessibilidade."
        code={`<FormRadioGroup
  label="Como informar os valores?"
  description="Dá para trocar depois."
  variant="card"
  orientation="horizontal"
  defaultValue="total"
  options={[
    { value: "total", label: "Total e parcelas" },
    { value: "per_installment", label: "Valor da parcela" },
  ]}
/>`}
        previewClassName="flex-col items-stretch"
      >
        <FormRadioGroup
          label="Como informar os valores?"
          description="Dá para trocar depois."
          variant="card"
          orientation="horizontal"
          defaultValue="total"
          fieldClassName="w-full max-w-md"
          options={[
            { value: "total", label: "Total e parcelas" },
            { value: "per_installment", label: "Valor da parcela" },
          ]}
        />
      </DocSection>

      <DocNote title="O rótulo embrulha o rádio">
        <code>RadioGroupItem</code> é um <code>&lt;label&gt;</code> que contém o <code>Radio</code>: sem <code>useId</code> nem <code>htmlFor</code>, a associação implícita do HTML resolve. O cartão depende disso — a caixa que acende precisa conter o rádio para ler o estado com <code>:has()</code> — e o <code>plain</code> usa o mesmo mecanismo, para as duas formas não divergirem.
      </DocNote>

      <DocNote title="A descrição entra no nome, não em aria-describedby">
        Dentro do rótulo, ela já compõe o nome acessível: &ldquo;Pix, cai na hora, sem taxa&rdquo;. Um <code>aria-describedby</code> para o mesmo texto o faria ser lido duas vezes.
      </DocNote>

      <DocNote title="O alvo do rádio já é 44px">
        O desenho tem 16px e o tocável, 44px (<code>after:-inset-3.5</code>). O cartão existe pela explicação, não pelo alvo de toque.
      </DocNote>

      <DocNote title="aria-invalid desce por contexto">
        Escrito no grupo, ele alcança cada <code>Radio</code> por contexto React, não por seletor <code>group-*</code> — o átomo não conhece o contêiner. No <code>FormRadioGroup</code>, quem o escreve é o <code>FieldControl</code> quando há erro.
      </DocNote>

      <PropsTable
        title="Props do RadioGroup"
        rows={[
          {
            prop: "variant",
            type: '"plain" | "card"',
            default: '"plain"',
            description:
              "A forma das opções. Desce por contexto até cada item, que pode sobrescrever.",
          },
          {
            prop: "orientation",
            type: '"horizontal" | "vertical"',
            description:
              "Colunas iguais em horizontal. Sem valor, as quatro setas navegam — que é o que a APG pede.",
          },
          {
            prop: "value / defaultValue / onValueChange",
            type: "string / string / (v: string) => void",
            description: "O valor escolhido. Controlado ou não, como no Radix.",
          },
          {
            prop: "aria-invalid",
            type: "boolean",
            description: "Marca o grupo, e desce por contexto até cada Radio.",
          },
        ]}
      />

      <PropsTable
        title="Props do RadioGroupItem"
        rows={[
          {
            prop: "value",
            type: "string",
            description: "O valor da opção. Obrigatório.",
          },
          {
            prop: "children",
            type: "ReactNode",
            description: "O rótulo. Obrigatório.",
          },
          {
            prop: "description",
            type: "ReactNode",
            description:
              "A explicação. Só em variant=\"card\".",
          },
          {
            prop: "variant",
            type: '"plain" | "card"',
            description: "Sobrescreve o do grupo, para a opção que foge do padrão.",
          },
          {
            prop: "radioClassName",
            type: "string",
            description:
              "Veste o controle. className veste a caixa — o rótulo inteiro.",
          },
        ]}
      />
    </>
  )
}
