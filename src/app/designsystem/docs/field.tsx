"use client"

import * as React from "react"

import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field"
import { DatePicker } from "@/components/ui/date-picker"
import { Input } from "@/components/ui/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group"
import { MoneyInput } from "@/components/ui/money-input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import { DocNote, DocSection, Usage } from "../ds-doc"

export default function FieldDoc() {
  const [primeiraEm, setPrimeiraEm] = React.useState<Date | undefined>(
    new Date(2026, 3, 5)
  )

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
        title="Vários erros de uma vez"
        description="FieldError aceita a lista errors em vez de children. Com um erro só ele escreve a frase; com vários vira lista, e mensagens repetidas são removidas — validação costuma disparar a mesma regra duas vezes."
        code={`<FieldError
  errors={[
    { message: "Informe um valor maior que zero." },
    { message: "A data não pode estar no passado." },
  ]}
/>`}
        previewClassName="flex-col items-stretch"
      >
        <Field className="w-full max-w-sm" data-invalid>
          <FieldLabel htmlFor="ds-field-multi">Valor</FieldLabel>
          <MoneyInput
            id="ds-field-multi"
            aria-invalid
            value="0,00"
            onValueChange={() => {}}
          />
          <FieldError
            errors={[
              { message: "Informe um valor maior que zero." },
              { message: "A data não pode estar no passado." },
            ]}
          />
        </Field>
      </DocSection>

      <DocSection
        title="Orientação"
        description="vertical empilha rótulo e controle. horizontal põe lado a lado, para uma chave ou caixa de seleção. responsive é vertical no estreito e vira horizontal quando o FieldGroup em volta passa de 28rem — a virada é por container, não por viewport, então funciona dentro de um sheet estreito."
        code={`<Field orientation="horizontal">
  <FieldLabel htmlFor="notificar">Avisar por e-mail</FieldLabel>
  <Switch id="notificar" />
</Field>`}
        previewClassName="flex-col items-stretch"
      >
        <div className="flex w-full max-w-sm flex-col gap-4">
          <Field>
            <FieldLabel htmlFor="ds-field-v">vertical</FieldLabel>
            <Input id="ds-field-v" placeholder="rótulo em cima" />
          </Field>
          <Field orientation="horizontal">
            <FieldLabel htmlFor="ds-field-h">horizontal</FieldLabel>
            <Switch id="ds-field-h" />
          </Field>
        </div>
      </DocSection>

      <DocSection
        title="Rótulo com descrição ao lado do controle"
        description="FieldContent agrupa rótulo e descrição para que os dois fiquem de um lado e o controle do outro. Sem ele, a descrição empurraria o controle para baixo."
        code={`<Field orientation="horizontal">
  <FieldContent>
    <FieldLabel htmlFor="lembrete">Lembrete de vencimento</FieldLabel>
    <FieldDescription>Um aviso três dias antes.</FieldDescription>
  </FieldContent>
  <Switch id="lembrete" />
</Field>`}
        previewClassName="flex-col items-stretch"
      >
        <Field orientation="horizontal" className="w-full max-w-sm">
          <FieldContent>
            <FieldLabel htmlFor="ds-field-lembrete">
              Lembrete de vencimento
            </FieldLabel>
            <FieldDescription>Um aviso três dias antes.</FieldDescription>
          </FieldContent>
          <Switch id="ds-field-lembrete" />
        </Field>
      </DocSection>

      <DocSection
        title="Escolha em cartão"
        description="Um FieldLabel que envolve outro Field vira alvo inteiro: ganha contorno, cresce para a largura toda e acende quando a opção está marcada. O clique vale no cartão inteiro, não só no radio de 16px."
        code={`<FieldLabel htmlFor="mensal">
  <Field orientation="horizontal">
    <FieldContent>
      <FieldTitle>Mensal</FieldTitle>
      <FieldDescription>Cobrado todo dia 5.</FieldDescription>
    </FieldContent>
    <RadioGroupItem value="mensal" id="mensal" />
  </Field>
</FieldLabel>`}
        previewClassName="flex-col items-stretch"
      >
        <RadioGroup
          defaultValue="mensal"
          className="w-full max-w-sm gap-3"
        >
          {[
            ["mensal", "Mensal", "Cobrado todo dia 5."],
            ["anual", "Anual", "Dois meses de desconto."],
          ].map(([value, titulo, desc]) => (
            <FieldLabel key={value} htmlFor={`ds-field-plano-${value}`}>
              <Field orientation="horizontal">
                <FieldContent>
                  <FieldTitle>{titulo}</FieldTitle>
                  <FieldDescription>{desc}</FieldDescription>
                </FieldContent>
                <RadioGroupItem value={value} id={`ds-field-plano-${value}`} />
              </Field>
            </FieldLabel>
          ))}
        </RadioGroup>
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
              <DatePicker
                id="ds-field-primeira"
                value={primeiraEm}
                onChange={setPrimeiraEm}
                displayStyle="numeric"
              />
            </Field>
          </FieldGroup>
        </FieldSet>
      </DocSection>

      <DocSection
        title="Separador"
        description="FieldSeparator corta um grupo em dois assuntos. Com texto, o rótulo fica centrado por cima do fio."
        code={`<FieldSeparator />
<FieldSeparator>ou</FieldSeparator>`}
        previewClassName="flex-col items-stretch"
      >
        <FieldGroup className="w-full max-w-sm">
          <Field>
            <FieldLabel htmlFor="ds-field-sep-a">Descrição</FieldLabel>
            <Input id="ds-field-sep-a" placeholder="Mercado" />
          </Field>
          <FieldSeparator>ou</FieldSeparator>
          <Field>
            <FieldLabel htmlFor="ds-field-sep-b">Colar do extrato</FieldLabel>
            <Input id="ds-field-sep-b" placeholder="Cole a linha aqui" />
          </Field>
        </FieldGroup>
      </DocSection>

      <DocSection
        title="Valor fixo no começo e no fim"
        description="Unidade que nunca muda não se digita: vira addon. inline-start prende no começo, inline-end no fim, e os dois convivem no mesmo campo. O addon é alvo de clique — tocar nele foca o campo, então ele não vira uma zona morta ao lado do que se quer escrever."
        code={`<InputGroup>
  <InputGroupAddon><InputGroupText>R$</InputGroupText></InputGroupAddon>
  <InputGroupInput inputMode="decimal" />
  <InputGroupAddon align="inline-end">
    <InputGroupText>/mês</InputGroupText>
  </InputGroupAddon>
</InputGroup>`}
        previewClassName="flex-col items-stretch"
      >
        <FieldGroup className="w-full max-w-sm">
          <Field>
            <FieldLabel htmlFor="ds-field-pre">Só no começo</FieldLabel>
            <InputGroup>
              <InputGroupAddon>
                <InputGroupText>R$</InputGroupText>
              </InputGroupAddon>
              <InputGroupInput
                id="ds-field-pre"
                inputMode="decimal"
                placeholder="0,00"
              />
            </InputGroup>
          </Field>
          <Field>
            <FieldLabel htmlFor="ds-field-suf">Só no fim</FieldLabel>
            <InputGroup>
              <InputGroupInput
                id="ds-field-suf"
                inputMode="decimal"
                placeholder="1,99"
              />
              <InputGroupAddon align="inline-end">
                <InputGroupText>% a.m.</InputGroupText>
              </InputGroupAddon>
            </InputGroup>
            <FieldDescription>Taxa de juros ao mês.</FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="ds-field-ambos">Nos dois</FieldLabel>
            <InputGroup>
              <InputGroupAddon>
                <InputGroupText>R$</InputGroupText>
              </InputGroupAddon>
              <InputGroupInput
                id="ds-field-ambos"
                inputMode="decimal"
                placeholder="0,00"
              />
              <InputGroupAddon align="inline-end">
                <InputGroupText>/mês</InputGroupText>
              </InputGroupAddon>
            </InputGroup>
          </Field>
        </FieldGroup>
      </DocSection>

      <DocNote title="O R$ acima é exemplo de addon, não como se pede dinheiro">
        Para valor em reais o componente é <code>MoneyInput</code>: ele resolve
        máscara, teclado numérico e conversão. Um <code>InputGroup</code> com R$
        na frente deixa isso tudo para a tela. O addon brilha na unidade que o{" "}
        <code>MoneyInput</code> não cobre — <code>%</code>, <code>/mês</code>,{" "}
        <code>kg</code>.
      </DocNote>

      <DocNote title="Field não é o formulário">
        Quem cuida do envio e do comportamento do Enter é o{" "}
        <code>CustomForm</code>. Field cuida de um campo. Os dois se compõem: um{" "}
        <code>CustomForm</code> com vários <code>Field</code> dentro.
      </DocNote>
    </>
  )
}
