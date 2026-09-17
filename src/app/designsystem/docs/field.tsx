"use client"

import Link from "next/link"
import * as React from "react"

import {
  Field,
  FieldContent,
  FieldControl,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldRow,
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
import { Radio } from "@/components/ui/radio"
import { RadioGroup } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

export default function FieldDoc() {
  const [primeiraEm, setPrimeiraEm] = React.useState<Date | undefined>(
    new Date(2026, 3, 5)
  )

  return (
    <>
      <Usage>
        A estrutura de um campo e a ligação entre as peças: <code>htmlFor</code>, <code>aria-describedby</code> e <code>aria-invalid</code> saem do <code>FieldControl</code>, não da memória de quem escreve a tela. Unidade fixa ao lado do valor é <code>InputGroup</code>; envio e Enter são do <code>Form</code>.
      </Usage>

      <DocSection
        title="Um campo ligado"
        description="Nenhum id escrito à mão: o Field gera, o FieldControl injeta, o FieldLabel aponta."
        code={`<Field>
  <FieldLabel>Descrição</FieldLabel>
  <FieldControl>
    <Input placeholder="Mercado" />
  </FieldControl>
  <FieldDescription>Aparece no extrato e na busca.</FieldDescription>
</Field>`}
        previewClassName="flex-col items-stretch"
      >
        <Field className="w-full max-w-sm">
          <FieldLabel>Descrição</FieldLabel>
          <FieldControl>
            <Input placeholder="Mercado" />
          </FieldControl>
          <FieldDescription>
            Aparece no extrato e na busca.
          </FieldDescription>
        </Field>
      </DocSection>

      <DocSection
        title="O erro liga o campo inteiro"
        description="Renderizar um FieldError marca data-invalid no Field e aria-invalid no controle, e soma o id do erro ao aria-describedby."
        code={`<Field>
  <FieldLabel>Valor</FieldLabel>
  <FieldControl>
    <Input money value={valor} onValueChange={setValor} />
  </FieldControl>
  <FieldError>Informe um valor maior que zero.</FieldError>
</Field>`}
        previewClassName="flex-col items-stretch"
      >
        <Field className="w-full max-w-sm">
          <FieldLabel>Valor</FieldLabel>
          <FieldControl>
            <Input money value="0,00" onValueChange={() => {}} />
          </FieldControl>
          <FieldError>Informe um valor maior que zero.</FieldError>
        </Field>
      </DocSection>

      <DocNote title="O erro substitui a descrição">
        Uma linha cinza e uma vermelha abaixo do campo competem pela mesma atenção: troque uma pela outra.
      </DocNote>

      <DocSection
        title="Vários erros de uma vez"
        description="FieldError aceita a lista errors em vez de children: um erro vira frase, vários viram lista, e mensagens repetidas são removidas."
        code={`<FieldError
  errors={[
    { message: "Informe um valor maior que zero." },
    { message: "A data não pode estar no passado." },
  ]}
/>`}
        previewClassName="flex-col items-stretch"
      >
        <Field className="w-full max-w-sm">
          <FieldLabel>Valor</FieldLabel>
          <FieldControl>
            <Input money value="0,00" onValueChange={() => {}} />
          </FieldControl>
          <FieldError
            errors={[
              { message: "Informe um valor maior que zero." },
              { message: "A data não pode estar no passado." },
            ]}
          />
        </Field>
      </DocSection>

      <DocSection
        title="Os dois degraus"
        description="size mede o texto do andaime — rótulo, descrição e erro —, nunca a altura do controle. Os nomes seguem a escada: Field size=&quot;sm&quot; ao lado de Input size=&quot;sm&quot;."
        code={`<FieldGroup size="sm">
  <Field>
    <FieldLabel>Valor</FieldLabel>
    <FieldControl><Input size="sm" /></FieldControl>
    <FieldDescription>O rótulo e a ajuda encolhem juntos.</FieldDescription>
  </Field>
</FieldGroup>`}
        previewClassName="flex-col items-stretch"
      >
        <div className="grid w-full gap-6 sm:grid-cols-2">
          <FieldGroup size="md">
            <Field>
              <FieldLabel>Valor (md)</FieldLabel>
              <FieldControl>
                <Input size="md" placeholder="0,00" />
              </FieldControl>
              <FieldDescription>O degrau padrão.</FieldDescription>
            </Field>
          </FieldGroup>
          <FieldGroup size="sm">
            <Field>
              <FieldLabel>Valor (sm)</FieldLabel>
              <FieldControl>
                <Input size="sm" placeholder="0,00" />
              </FieldControl>
              <FieldDescription>O rótulo e a ajuda encolhem.</FieldDescription>
            </Field>
          </FieldGroup>
        </div>
      </DocSection>

      <DocSection
        title="Uma linha de dois campos"
        description="FieldRow empilha no telefone e divide em duas colunas a partir de sm. Não escreva a grade à mão: é onde os campos esquecem de empilhar."
        code={`<FieldRow>
  <Field>…</Field>
  <Field>…</Field>
</FieldRow>`}
        previewClassName="flex-col items-stretch"
      >
        <FieldRow className="w-full max-w-md">
          <Field>
            <FieldLabel>Fecha dia</FieldLabel>
            <FieldControl>
              <Input defaultValue="28" inputMode="numeric" />
            </FieldControl>
          </Field>
          <Field>
            <FieldLabel>Vence dia</FieldLabel>
            <FieldControl>
              <Input defaultValue="5" inputMode="numeric" />
            </FieldControl>
          </Field>
        </FieldRow>
      </DocSection>

      <DocSection
        title="Orientação"
        description="vertical empilha; horizontal põe lado a lado, para chave ou caixa de seleção; responsive vira horizontal quando o grupo em volta passa de 28rem — por container, então funciona dentro de um sheet estreito."
        code={`<FieldGroup>
  <Field orientation="responsive">
    <FieldContent>
      <FieldLabel>Lembrete</FieldLabel>
      <FieldDescription>Um aviso um dia antes.</FieldDescription>
    </FieldContent>
    <FieldControl><Switch /></FieldControl>
  </Field>
</FieldGroup>`}
        previewClassName="flex-col items-stretch"
      >
        <FieldGroup className="w-full max-w-sm">
          <Field orientation="horizontal">
            <FieldContent>
              <FieldLabel>Lembrete</FieldLabel>
              <FieldDescription>Um aviso um dia antes.</FieldDescription>
            </FieldContent>
            <FieldControl>
              <Switch defaultChecked />
            </FieldControl>
          </Field>
          <FieldSeparator />
          <Field orientation="responsive">
            <FieldContent>
              <FieldLabel>Repetir todo mês</FieldLabel>
              <FieldDescription>
                Estreite a janela para vê-la empilhar.
              </FieldDescription>
            </FieldContent>
            <FieldControl>
              <Switch />
            </FieldControl>
          </Field>
        </FieldGroup>
      </DocSection>

      <DocNote title="responsive precisa de um grupo em volta">
        Uma container query vale para os descendentes do contêiner, e a direção é declarada no próprio <code>Field</code>. Sem <code>FieldGroup</code>, <code>FieldSet</code> ou <code>FieldRow</code> em volta, <code>responsive</code> se comporta como <code>vertical</code>.
      </DocNote>

      <DocSection
        title="Escolha em cartão"
        description="Um FieldLabel que envolve um Field vira cartão clicável, com contorno que acende na opção marcada. Use quando a explicação precisa caber junto da opção."
        code={`<FieldLabel htmlFor="mensal">
  <Field orientation="horizontal">
    <FieldContent>
      <FieldTitle>Mensal</FieldTitle>
      <FieldDescription>Cobrado todo dia 5.</FieldDescription>
    </FieldContent>
    <Radio value="mensal" id="mensal" />
  </Field>
</FieldLabel>`}
        previewClassName="flex-col items-stretch"
      >
        <RadioGroup defaultValue="mensal" className="w-full max-w-sm gap-3">
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
                <Radio value={value} id={`ds-field-plano-${value}`} />
              </Field>
            </FieldLabel>
          ))}
        </RadioGroup>
      </DocSection>

      <DocNote title="O contorno do cartão é --primary-accent a 60%">
        É o primeiro degrau que alcança 3:1 de traço não-textual nos dois temas. O realce tem par <code>active:</code>, porque o de hover só existe onde há cursor.
      </DocNote>

      <DocSection
        title="Conjunto de campos"
        description="FieldSet com FieldLegend agrupa campos que só fazem sentido juntos. É um fieldset de verdade: o leitor de tela anuncia a legenda antes de cada campo."
        code={`<FieldSet size="sm">
  <FieldLegend variant="label">Parcelamento</FieldLegend>
  <FieldGroup>
    <Field>…</Field>
  </FieldGroup>
</FieldSet>`}
        previewClassName="flex-col items-stretch"
      >
        <FieldSet className="w-full max-w-sm">
          <FieldLegend>Parcelamento</FieldLegend>
          <FieldGroup>
            <Field>
              <FieldLabel>Parcelas</FieldLabel>
              <FieldControl>
                <Input defaultValue="12" inputMode="numeric" />
              </FieldControl>
            </Field>
            <Field>
              <FieldLabel optional>Primeira em</FieldLabel>
              <FieldControl>
                <DatePicker
                  value={primeiraEm}
                  onChange={setPrimeiraEm}
                  displayStyle="numeric"
                />
              </FieldControl>
            </Field>
          </FieldGroup>
        </FieldSet>
      </DocSection>

      <DocNote title="Marca-se o opcional, não o obrigatório">
        Use <code>FieldLabel optional</code>. O app não tem marcador de obrigatório, e um asterisco criaria uma segunda convenção para o mesmo eixo.
      </DocNote>

      <DocSection
        title="Separador"
        description="FieldSeparator corta um grupo em dois assuntos. Com texto, o rótulo fica centrado por cima do fio."
        code={`<FieldSeparator />
<FieldSeparator>ou</FieldSeparator>`}
        previewClassName="flex-col items-stretch"
      >
        <FieldGroup className="w-full max-w-sm">
          <Field>
            <FieldLabel>Descrição</FieldLabel>
            <FieldControl>
              <Input placeholder="Mercado" />
            </FieldControl>
          </Field>
          <FieldSeparator>ou</FieldSeparator>
          <Field>
            <FieldLabel>Colar do extrato</FieldLabel>
            <FieldControl>
              <Input placeholder="Cole a linha aqui" />
            </FieldControl>
          </Field>
        </FieldGroup>
      </DocSection>

      <DocSection
        title="Valor fixo no começo e no fim"
        description="Unidade que nunca muda não se digita: vira addon. Tocar no addon foca o campo, então ele não é zona morta."
        code={`<Field>
  <FieldLabel>Juros</FieldLabel>
  <InputGroup>
    <FieldControl><InputGroupInput placeholder="1,5" /></FieldControl>
    <InputGroupAddon align="inline-end">
      <InputGroupText>% a.m.</InputGroupText>
    </InputGroupAddon>
  </InputGroup>
</Field>`}
        previewClassName="flex-col items-stretch"
      >
        <FieldGroup className="w-full max-w-sm">
          <Field>
            <FieldLabel>Juros</FieldLabel>
            <InputGroup>
              <FieldControl>
                <InputGroupInput placeholder="1,5" />
              </FieldControl>
              <InputGroupAddon align="inline-end">
                <InputGroupText>% a.m.</InputGroupText>
              </InputGroupAddon>
            </InputGroup>
          </Field>
        </FieldGroup>
      </DocSection>

      <DocNote title="FieldControl embrulha o controle, nunca o invólucro">
        <code>Select</code> não renderiza nó, então o <code>id</code> não chega a lugar algum e o rótulo aponta para o vazio. Embrulhe o gatilho: <code>&lt;Select&gt;&lt;FieldControl&gt;&lt;SelectTrigger/&gt;&lt;/FieldControl&gt;…&lt;/Select&gt;</code>. No <code>InputGroup</code>, embrulhe o <code>InputGroupInput</code>, senão o <code>id</code> pousa numa <code>div</code> que não é rotulável.
      </DocNote>

      <DocNote title="Para dinheiro, use Input money">
        O addon acima é exemplo de unidade. <code>&lt;Input money&gt;</code> resolve máscara, teclado e conversão, que um <code>R$</code> acoplado deixaria para a tela; com rótulo e erro ligados, <code>&lt;FormInput money&gt;</code>.
      </DocNote>

      <DocNote title="Field não é o formulário">
        Quem cuida do envio e do comportamento do <kbd>Enter</kbd> é o{" "}
        <code>Form</code>. <code>Field</code> cuida de um campo. Os dois se
        compõem, e o contrato inteiro está em{" "}
        <Link href="/designsystem/form" className="underline">
          Form
        </Link>
        .
      </DocNote>

      <PropsTable
        title="Field"
        rows={[
          {
            prop: "orientation",
            type: '"vertical" | "horizontal" | "responsive"',
            default: '"vertical"',
            description:
              "responsive exige FieldGroup / FieldSet / FieldRow em volta — um contêiner não consulta a si mesmo.",
          },
          {
            prop: "size",
            type: '"sm" | "md"',
            default: "herdado, ou md",
            description:
              "O texto do andaime. Nunca a altura do controle: um Field não sabe que controle carrega.",
          },
          {
            prop: "invalid",
            type: "boolean",
            description:
              "Só para validação que mora fora do campo. Com um FieldError renderizado, é desnecessário.",
          },
          {
            prop: "disabled",
            type: "boolean",
            description: "Apaga rótulo e título. Não desabilita o controle.",
          },
          {
            prop: "role",
            type: "string",
            description:
              "Passe só quando o Field de fato agrupa (um RadioGroup, uma grade); o aria-labelledby aponta para o FieldLabel sozinho.",
          },
        ]}
      />

      <PropsTable
        title="Peças"
        rows={[
          {
            prop: "FieldControl",
            type: "{ children: ReactElement }",
            description:
              "Injeta id, aria-describedby e aria-invalid no filho único, compondo o aria-describedby existente.",
          },
          {
            prop: "FieldLabel",
            type: "Label & { optional?: boolean }",
            description:
              "htmlFor sai sozinho quando existe um FieldControl.",
          },
          {
            prop: "FieldError",
            type: "{ errors?: { message?: string }[] }",
            description:
              "Renderizá-lo é o que torna o campo inválido. Com errors, deduplica e vira lista.",
          },
          {
            prop: "FieldRow",
            type: "div",
            description: "Dois campos lado a lado a partir de sm. Empilha antes.",
          },
          {
            prop: "FieldSet / FieldLegend",
            type: "fieldset / legend",
            description:
              "O grupo de verdade; FieldLegend variant=\"label\" segue o degrau do rótulo.",
          },
        ]}
      />
    </>
  )
}
