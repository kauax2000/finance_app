"use client"

import * as React from "react"

import { Button } from "@/components/ui/button"
import { CustomForm, ENTER_DEFERRAL_RULES } from "@/components/ui/form"
import {
  Field,
  FieldControl,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldRow,
  FieldSet,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Kbd } from "@/components/ui/kbd"
import { MoneyInput } from "@/components/ui/money-input"
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

export default function FormulariosDoc() {
  return (
    <>
      <Usage>
        Todo fluxo em que campos são salvos usa <code>CustomForm</code>, nunca um{" "}
        <code>&lt;form&gt;</code> cru — ele normaliza o <Kbd>Enter</Kbd> para a
        ação principal, que no telefone é a diferença entre salvar e não
        conseguir. E todo campo é um <code>Field</code>: é ele que liga o rótulo,
        a ajuda e o erro ao controle.
      </Usage>

      <DocSection
        title="Um formulário inteiro"
        description="Seção, linha de dois campos, erro e rodapé. Nenhum id escrito, nenhum htmlFor, nenhum aria-describedby — e um type=&quot;submit&quot; só."
        code={`<CustomForm onSubmit={handleSubmit}>
  <FieldSet>
    <FieldLegend variant="label">Lançamento</FieldLegend>
    <FieldGroup>
      <Field>
        <FieldLabel>Descrição</FieldLabel>
        <FieldControl><Input /></FieldControl>
      </Field>
      <FieldRow>
        <Field>…</Field>
        <Field>…</Field>
      </FieldRow>
    </FieldGroup>
  </FieldSet>
  <div className="flex justify-end gap-2">
    <Button type="button" variant="tertiary">Cancelar</Button>
    <Button type="submit">Salvar</Button>
  </div>
</CustomForm>`}
        previewClassName="items-stretch"
      >
        <FormDemo />
      </DocSection>

      <DocNote title="A ação principal é a única type=&quot;submit&quot;">
        Cancelar, alternar e todo o resto levam{" "}
        <code>type=&quot;button&quot;</code>. Sem isso, o botão de cancelar vira
        o alvo do <Kbd>Enter</Kbd> e o formulário fecha em vez de salvar. E dois{" "}
        <code>type=&quot;submit&quot;</code> no mesmo formulário fazem o{" "}
        <Kbd>Enter</Kbd> escolher o primeiro do DOM, que raramente é o que a
        pessoa quer: se há duas ações que salvam de formas diferentes, uma delas
        é <code>type=&quot;button&quot;</code> com <code>onClick</code> próprio.
      </DocNote>

      <Group title="Onde o Enter não é sequestrado">
        <Spec title="shouldDeferEnterToWidget" meta="ui/form.tsx">
          <Stack className="gap-2">
            {ENTER_DEFERRAL_RULES.map((rule) => (
              <div key={rule.match} className="flex flex-col">
                <code className="font-mono text-2xs text-foreground">
                  {rule.match}
                </code>
                <span className="text-xs text-muted-foreground">
                  {rule.why}
                </span>
              </div>
            ))}
          </Stack>
        </Spec>

        <Spec title="Esta lista é lida da fonte">
          <Stack className="gap-2 text-xs text-muted-foreground">
            <p>
              Ela era redigitada aqui, e já tinha divergido: a página mostrava{" "}
              <strong>seis</strong> regras enquanto o código checava{" "}
              <strong>sete</strong>. A que faltava era a do seletor ancorado num
              campo — a que existe porque o <Kbd>Enter</Kbd> na busca de
              categoria <em>salvava a transação</em>.
            </p>
            <p>
              Um controle novo que use o <Kbd>Enter</Kbd> para si precisa de um{" "}
              <code>data-slot</code> estável e de uma linha em{" "}
              <code>shouldDeferEnterToWidget</code>, que é exportada e tem
              teste.
            </p>
          </Stack>
        </Spec>
      </Group>

      <DocSection
        title="Os campos deferem o Enter"
        description="Experimente: Enter no campo de texto envia; dentro da observação, quebra linha — e ⌘+Enter envia de lá mesmo; sobre o seletor, abre a lista."
        previewClassName="items-stretch"
      >
        <DeferDemo />
      </DocSection>

      <DocNote title="O portal não protege ninguém">
        Um popover é portalizado para o <code>body</code>, mas{" "}
        <strong>eventos de portal do React sobem pela árvore do React</strong>, e
        a raiz do seletor é filha do formulário. Medido: o <Kbd>Enter</Kbd> no
        campo de busca de um seletor ancorado{" "}
        <strong>salvava a transação</strong>, com o conteúdo comprovadamente
        fora do <code>&lt;form&gt;</code> no DOM. A lição é geral: todo campo de
        texto dentro de um portal precisa da regra, mesmo parecendo estar longe
        do formulário.
      </DocNote>
    </>
  )
}

function FormDemo() {
  const [enviado, setEnviado] = React.useState(0)
  const [valor, setValor] = React.useState("0,00")
  const erro = valor === "0,00" ? "Informe um valor maior que zero." : undefined

  return (
    <CustomForm
      className="flex w-full max-w-sm flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault()
        if (!erro) setEnviado((v) => v + 1)
      }}
    >
      <FieldSet>
        <FieldLegend variant="label">Lançamento</FieldLegend>
        <FieldGroup>
          <Field>
            <FieldLabel>Descrição</FieldLabel>
            <FieldControl>
              <Input placeholder="Mercado" />
            </FieldControl>
          </Field>
          <FieldRow>
            <Field>
              <FieldLabel>Valor</FieldLabel>
              <FieldControl>
                <MoneyInput value={valor} onValueChange={setValor} />
              </FieldControl>
              <FieldError>{erro}</FieldError>
            </Field>
            <Field>
              <FieldLabel optional>Observação</FieldLabel>
              <FieldControl>
                <Input placeholder="—" />
              </FieldControl>
            </Field>
          </FieldRow>
        </FieldGroup>
      </FieldSet>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">
          Salvos: <span className="nums">{enviado}</span>
        </span>
        <div className="flex gap-2">
          <Button type="button" variant="tertiary">
            Cancelar
          </Button>
          <Button type="submit">Salvar</Button>
        </div>
      </div>
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
      <FieldGroup>
        <Field>
          <FieldLabel>Campo de texto</FieldLabel>
          <FieldControl>
            <Input placeholder="Enter aqui envia" />
          </FieldControl>
        </Field>
        <Field>
          <FieldLabel>Seletor</FieldLabel>
          {/* O `FieldControl` embrulha o **gatilho**, e não a raiz do Radix:
              `Select.Root` não renderiza nó nenhum, então o `id` não chegaria
              a lugar algum e o rótulo apontaria para o vazio. */}
          <Select>
            <FieldControl>
              <SelectTrigger>
                <SelectValue placeholder="Enter aqui abre a lista" />
              </SelectTrigger>
            </FieldControl>
            <SelectContent>
              <SelectItem value="mercado">Mercado</SelectItem>
              <SelectItem value="transporte">Transporte</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel>Observação</FieldLabel>
          <FieldControl>
            <Textarea placeholder="Enter quebra linha; ⌘+Enter envia" />
          </FieldControl>
        </Field>
      </FieldGroup>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">
          Envios: <span className="nums">{n}</span>
        </span>
        <Button type="submit">Salvar</Button>
      </div>
    </CustomForm>
  )
}
