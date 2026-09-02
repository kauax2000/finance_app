"use client"

import Link from "next/link"
import * as React from "react"

import { Button } from "@/components/ui/button"
import { CustomForm } from "@/components/ui/form"
import { Field, FieldControl, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Kbd } from "@/components/ui/kbd"
import { Textarea } from "@/components/ui/textarea"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

export default function FormDoc() {
  return (
    <>
      <Usage>
        O <code>&lt;form&gt;</code> do projeto, para qualquer fluxo em que campos
        são salvos ou confirmados. O padrão completo está em{" "}
        <Link href="/designsystem/formularios" className="underline">
          Formulários e Enter
        </Link>
        .
      </Usage>

      <DocSection
        title="Padrão"
        code={`<CustomForm onSubmit={handleSubmit}>
  <Field>
    <FieldLabel>Nome</FieldLabel>
    <FieldControl><Input /></FieldControl>
  </Field>
  <Button type="submit">Salvar</Button>
</CustomForm>`}
        previewClassName="items-stretch"
      >
        <Demo />
      </DocSection>

      <DocNote title="O que ele faz de diferente">
        Normaliza o <Kbd>Enter</Kbd> para o{" "}
        <code>Button type=&quot;submit&quot;</code> principal, e deixa a tecla
        passar onde o controle a usa para si — as sete regras estão listadas em{" "}
        <Link href="/designsystem/formularios" className="underline">
          Formulários e Enter
        </Link>
        , lidas da fonte.
      </DocNote>

      <DocSection
        title="⌘+Enter dentro do textarea"
        description="O Enter num textarea quebra linha, e é o certo. Sem uma segunda tecla, não havia como enviar de dentro dele sem tirar a mão do teclado."
        code={`// de fábrica: ⌘/Ctrl + Enter envia mesmo de dentro de um controle
// que ficaria com a tecla`}
        previewClassName="items-stretch"
      >
        <AtalhoDemo />
      </DocSection>

      <DocNote title="A tecla morta não envia o formulário">
        Enquanto um acento está sendo composto, o <Kbd>Enter</Kbd> confirma o
        caractere — ele pertence ao editor de método de entrada, não ao
        formulário. Sem essa guarda, digitar <code>ç</code> ou <code>ã</code> num
        teclado que compõe enviava o formulário no meio da palavra.{" "}
        <code>isComposing</code> não existia em lugar nenhum deste repositório.
      </DocNote>

      <DocNote title="Um controle novo que use o Enter">
        Ou ganha um <code>data-slot</code> estável e uma linha em{" "}
        <code>shouldDeferEnterToWidget</code> — que é exportada, e tem teste —,
        ou a exceção fica documentada no próprio componente. O que não vale é
        descobrir em produção.
      </DocNote>

      <PropsTable
        rows={[
          {
            prop: "onSubmit",
            type: "React.FormEventHandler<HTMLFormElement>",
            description: "Como em qualquer form. Chame preventDefault().",
          },
          {
            prop: "id",
            type: "string",
            description:
              "Necessário quando o botão de enviar vive fora do <form> — num DialogFooter ou num cabeçalho fixo de folha —, ligado pelo atributo form. É como o Enter o encontra.",
          },
          {
            prop: "onKeyDown",
            type: "React.KeyboardEventHandler<HTMLFormElement>",
            description:
              "Chamado sempre, depois da normalização. O evento pode chegar com defaultPrevented.",
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
        <FieldLabel>Nome da carteira</FieldLabel>
        <FieldControl>
          <Input placeholder="Conta corrente" />
        </FieldControl>
      </Field>
      <div className="flex items-center justify-between gap-2">
        {salvo ? (
          <span className="text-xs text-success-muted-foreground">Salvo.</span>
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

function AtalhoDemo() {
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
        <FieldLabel>Observação</FieldLabel>
        <FieldControl>
          <Textarea placeholder="Enter quebra linha; ⌘+Enter envia" rows={3} />
        </FieldControl>
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
