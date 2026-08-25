"use client"

import Link from "next/link"
import * as React from "react"

import { Button } from "@/components/ui/button"
import { CustomForm } from "@/components/ui/form"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

export default function FormDoc() {
  return (
    <>
      <Usage>
        O <code>&lt;form&gt;</code> do projeto, para qualquer fluxo em que campos são salvos ou confirmados. O padrão completo está em{" "}
        <Link href="/designsystem/formularios" className="underline">
          Formulários e Enter
        </Link>
        .
      </Usage>

      <DocSection
        title="Padrão"
        code={`<CustomForm onSubmit={handleSubmit}>
  <Field>
    <FieldLabel htmlFor="nome">Nome</FieldLabel>
    <Input id="nome" />
  </Field>
  <Button type="submit">Salvar</Button>
</CustomForm>`}
        previewClassName="items-stretch"
      >
        <Demo />
      </DocSection>

      <DocNote title="O que ele faz de diferente">
        Normaliza o <kbd>Enter</kbd> para o <code>Button type=&quot;submit&quot;</code> principal, e deixa a tecla passar onde o controle a usa para si: textarea, select nativo, contenteditable, gatilho de Select, combobox e listbox.
      </DocNote>

      <DocNote title="Um controle novo que use o Enter">
        Ou ganha um <code>data-slot</code> estável e uma linha em{" "}
        <code>shouldDeferEnterToWidget</code>, ou a exceção fica documentada no
        próprio componente. O que não vale é descobrir em produção.
      </DocNote>

      <PropsTable
        rows={[
          {
            prop: "onSubmit",
            type: "React.FormEventHandler<HTMLFormElement>",
            description: "Como em qualquer form. Chame preventDefault().",
          },
        ]}
      />
    </>
  )
}

function Demo() {
  const [salvo, setSalvo] = React.useState(false)

  return (
    <CustomForm
      className="flex w-full max-w-sm flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        setSalvo(true)
      }}
    >
      <Field>
        <FieldLabel htmlFor="ds-formdoc-nome">Nome da carteira</FieldLabel>
        <Input id="ds-formdoc-nome" placeholder="Conta corrente" />
      </Field>
      <div className="flex items-center justify-between gap-2">
        {salvo ? (
          <span className="text-xs text-success">Salvo.</span>
        ) : (
          <span className="text-xs text-muted-foreground">
            Pressione Enter no campo.
          </span>
        )}
        <Button type="submit">Salvar</Button>
      </div>
    </CustomForm>
  )
}
