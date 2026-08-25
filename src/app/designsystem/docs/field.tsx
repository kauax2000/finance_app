"use client"

import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { MoneyInput } from "@/components/ui/money-input"
import { DocNote, DocSection, Usage } from "../ds-doc"

export default function FieldDoc() {
  return (
    <>
      <Usage>
        A estrutura completa de um campo, com <code>htmlFor</code>, <code>aria-describedby</code> e <code>aria-invalid</code> já ligados. O campo em que alguém esquecer é o campo que o leitor de tela não explica.
      </Usage>

      <DocSection
        title="Campo com descrição"
        code={`<Field>
  <FieldLabel htmlFor="desc">Descrição</FieldLabel>
  <Input id="desc" />
  <FieldDescription>Como aparece no extrato.</FieldDescription>
</Field>`}
        previewClassName="flex-col items-stretch"
      >
        <Field className="w-full max-w-sm">
          <FieldLabel htmlFor="ds-field-desc">Descrição</FieldLabel>
          <Input id="ds-field-desc" placeholder="Mercado" />
          <FieldDescription>Como aparece no seu extrato.</FieldDescription>
        </Field>
      </DocSection>

      <DocSection
        title="Campo com erro"
        description="O erro substitui a descrição em vez de somar-se a ela: duas linhas abaixo do campo, uma cinza e uma vermelha, competem pela mesma atenção."
        code={`<Field data-invalid>
  <FieldLabel htmlFor="valor">Valor</FieldLabel>
  <MoneyInput id="valor" aria-invalid />
  <FieldError>Informe um valor maior que zero.</FieldError>
</Field>`}
        previewClassName="flex-col items-stretch"
      >
        <Field className="w-full max-w-sm" data-invalid>
          <FieldLabel htmlFor="ds-field-valor">Valor</FieldLabel>
          <MoneyInput
            id="ds-field-valor"
            value="0,00"
            onValueChange={() => {}}
            aria-invalid
          />
          <FieldError>Informe um valor maior que zero.</FieldError>
        </Field>
      </DocSection>

      <DocSection
        title="Conjunto de campos"
        description="FieldSet com FieldLegend agrupa campos que só fazem sentido juntos. É um <fieldset> de verdade, então o leitor de tela anuncia a legenda antes de cada campo do grupo."
        code={`<FieldSet>
  <FieldLegend>Parcelamento</FieldLegend>
  <FieldGroup>
    <Field>…</Field>
    <Field>…</Field>
  </FieldGroup>
</FieldSet>`}
        previewClassName="flex-col items-stretch"
      >
        <FieldSet className="w-full max-w-sm">
          <FieldLegend>Parcelamento</FieldLegend>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="ds-field-parcelas">Parcelas</FieldLabel>
              <Input id="ds-field-parcelas" defaultValue="12" inputMode="numeric" />
            </Field>
            <Field>
              <FieldLabel htmlFor="ds-field-primeira">Primeira em</FieldLabel>
              <Input id="ds-field-primeira" type="date" />
            </Field>
          </FieldGroup>
        </FieldSet>
      </DocSection>

      <DocNote title="Field não é o formulário">
        Quem cuida do envio e do comportamento do Enter é o{" "}
        <code>CustomForm</code>. Field cuida de um campo. Os dois se compõem: um{" "}
        <code>CustomForm</code> com vários <code>Field</code> dentro.
      </DocNote>
    </>
  )
}
