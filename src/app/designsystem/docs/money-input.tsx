"use client"

import * as React from "react"

import { Label } from "@/components/ui/label"
import { MoneyInput } from "@/components/ui/money-input"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

export default function MoneyInputDoc() {
  return (
    <>
      <Usage>
        Todo valor em reais que o app <strong>recebe</strong>: máscara, teclado numérico e conversão para número. Um <code>Input</code> com <code>type=&quot;number&quot;</code> aceita <code>e</code> e <code>+</code>, e usa o separador decimal errado.
      </Usage>

      <DocSection
        title="Em uso"
        description="O componente é controlado por duas coisas ao mesmo tempo: a string mascarada, que é o que aparece no campo, e o número em reais, que é o que vai para o banco. onValueChange entrega as duas."
        code={`const [texto, setTexto] = React.useState("")
const [reais, setReais] = React.useState<number | null>(null)

<MoneyInput
  value={texto}
  onValueChange={(masked, parsed) => {
    setTexto(masked)
    setReais(parsed)
  }}
/>`}
        previewClassName="flex-col items-stretch"
      >
        <MoneyInputDemo />
      </DocSection>

      <DocNote title="A máscara digita da direita para a esquerda">
        <code>formatMoneyBrlTyping</code> trata cada tecla como centavo: digitar{" "}
        <code>4</code>, <code>2</code>, <code>9</code>, <code>0</code> produz{" "}
        <code>42,90</code>. É como todo app bancário se comporta, e evita a
        pergunta de onde fica a vírgula.
      </DocNote>

      <DocNote title="Geist Mono e tabular-nums">
        Com largura de dígito variável, o número inteiro se desloca a cada
        centavo digitado e o olho perde o dígito que estava conferindo.
      </DocNote>

      <PropsTable
        rows={[
          { prop: "value", type: "string", description: "A string já mascarada. Não é o número." },
          {
            prop: "onValueChange",
            type: "(raw: string, parsedReais: number | null) => void",
            description: "Entrega a máscara e o valor em reais. null quando o campo está vazio.",
          },
          { prop: "inputMode", type: "string", default: '"decimal"', description: "O teclado que o telefone abre." },
        ]}
      />
    </>
  )
}

function MoneyInputDemo() {
  const [texto, setTexto] = React.useState("42,90")
  const [reais, setReais] = React.useState<number | null>(42.9)

  return (
    <div className="flex w-full max-w-xs flex-col gap-1.5">
      <Label htmlFor="ds-money-input">Valor</Label>
      <MoneyInput
        id="ds-money-input"
        value={texto}
        onValueChange={(masked, parsed) => {
          setTexto(masked)
          setReais(parsed)
        }}
      />
      <p className="text-xs text-muted-foreground">
        Em reais: <code className="font-mono">{String(reais)}</code>
      </p>
    </div>
  )
}
