"use client"

import * as React from "react"

import { Button } from "@/components/ui/button"
import { CustomForm } from "@/components/ui/form"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DocNote, DocSection, Usage } from "../ds-doc"
import { Group, Spec, Stack } from "../ds-kit"

const DEFERE = [
  ["<textarea>", "o Enter quebra linha"],
  ["<select> nativo", "o Enter escolhe a opção"],
  ["contenteditable", "o Enter quebra linha"],
  ['[data-slot="select-trigger"]', "o Enter abre o Select do Radix"],
  ['role="combobox"', "o Enter confirma o item destacado"],
  ['role="listbox"', "o Enter confirma o item destacado"],
]

export default function FormulariosDoc() {
  return (
    <>
      <Usage>
        Todo fluxo em que campos são salvos ou confirmados usa{" "}
        <code>CustomForm</code>, nunca um <code>&lt;form&gt;</code>{" "}
        cru. Ele
        normaliza o Enter para acionar a ação principal — o que num app usado no
        telefone, com teclado virtual que só mostra &ldquo;ir&rdquo;, é a
        diferença entre salvar e não conseguir salvar.
      </Usage>

      <DocSection
        title="A forma padrão"
        description="Um type=&quot;submit&quot; para a ação principal, type=&quot;button&quot; para todo o resto. Sem isso, o botão de cancelar vira o alvo do Enter e o formulário fecha em vez de salvar."
        code={`<CustomForm onSubmit={handleSubmit}>
  <Field>
    <FieldLabel htmlFor="desc">Descrição</FieldLabel>
    <Input id="desc" />
  </Field>
  <div className="flex justify-end gap-2">
    <Button type="button" variant="ghost">Cancelar</Button>
    <Button type="submit">Salvar</Button>
  </div>
</CustomForm>`}
        previewClassName="items-stretch"
      >
        <FormDemo />
      </DocSection>

      <Group title="Onde o Enter não é sequestrado">
        <Spec title="shouldDeferEnterToWidget" meta="ui/form.tsx">
          <Stack className="gap-2">
            {DEFERE.map(([alvo, porque]) => (
              <div key={alvo} className="flex flex-col">
                <code className="font-mono text-2xs text-foreground">{alvo}</code>
                <span className="text-xs text-muted-foreground">{porque}</span>
              </div>
            ))}
          </Stack>
        </Spec>

        <Spec title="Se você adicionar um controle novo">
          <Stack className="gap-2 text-xs text-muted-foreground">
            <p>
              Um controle que use o Enter para si precisa de um{" "}
              <code>data-slot</code> estável e de uma linha em{" "}
              <code>shouldDeferEnterToWidget</code>.
            </p>
            <p>
              A alternativa é documentar a exceção no próprio componente. O que
              não vale é descobrir em produção que o Enter fecha o formulário no
              meio de um seletor.
            </p>
          </Stack>
        </Spec>
      </Group>

      <DocSection
        title="Os campos deferem o Enter"
        description="Experimente: Enter no campo de texto envia; dentro da observação, quebra linha; sobre o seletor, abre a lista."
        previewClassName="items-stretch"
      >
        <DeferDemo />
      </DocSection>

      <DocNote title="Um formulário, um envio">
        Dois <code>type=&quot;submit&quot;</code>{" "}
        no mesmo formulário fazem o
        Enter escolher o primeiro do DOM, que raramente é o que a pessoa quer.
        Se há duas ações que salvam de formas diferentes, uma delas é{" "}
        <code>type=&quot;button&quot;</code> com <code>onClick</code> próprio.
      </DocNote>
    </>
  )
}

function FormDemo() {
  const [enviado, setEnviado] = React.useState<string | null>(null)

  return (
    <CustomForm
      className="flex w-full max-w-sm flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        setEnviado(new Date().toLocaleTimeString("pt-BR"))
      }}
    >
      <Field>
        <FieldLabel htmlFor="ds-form-desc">Descrição</FieldLabel>
        <Input id="ds-form-desc" placeholder="Mercado" />
      </Field>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost">
          Cancelar
        </Button>
        <Button type="submit">Salvar</Button>
      </div>
      {enviado ? (
        <p className="text-xs text-muted-foreground">Enviado às {enviado}.</p>
      ) : null}
    </CustomForm>
  )
}

function DeferDemo() {
  const [n, setN] = React.useState(0)

  return (
    <CustomForm
      className="flex w-full max-w-sm flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        setN((v) => v + 1)
      }}
    >
      <Field>
        <FieldLabel htmlFor="ds-defer-input">Campo de texto</FieldLabel>
        <Input id="ds-defer-input" placeholder="Enter aqui envia" />
      </Field>
      <Field>
        <FieldLabel htmlFor="ds-defer-select">Seletor</FieldLabel>
        <Select>
          <SelectTrigger id="ds-defer-select">
            <SelectValue placeholder="Enter aqui abre a lista" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="mercado">Mercado</SelectItem>
            <SelectItem value="transporte">Transporte</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      <Field>
        <FieldLabel htmlFor="ds-defer-textarea">Observação</FieldLabel>
        <Textarea id="ds-defer-textarea" placeholder="Enter aqui quebra linha" />
      </Field>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">
          Envios: <span className="nums">{n}</span>
        </span>
        <Button type="submit">Salvar</Button>
      </div>
    </CustomForm>
  )
}
