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

      <DocNote title="A figura tabular é obrigatória; a Geist Mono é opcional">
        Com largura de dígito variável o número inteiro se desloca a cada
        centavo digitado, e o olho perde o dígito que estava conferindo — por
        isso a figura tabular está sempre ligada. A <strong>face</strong>{" "}
        é outra conversa: <code>mono</code>{" "}
        existe para quem quer o registro de livro-caixa, e vem desligado.
        <br />
        <br />
        Ela vinha cravada, e era a única decisão do componente que era de
        desenho e não de comportamento — provavelmente o motivo de{" "}
        <strong>dez campos de dinheiro do app</strong>{" "}
        terem sido escritos à mão em vez de usá-lo: adotar mudava a cara da
        tela. Os dez foram migrados junto com esta mudança.
      </DocNote>

      <DocNote title="Três armadilhas, resolvidas de uma vez">
        <code>type=&quot;text&quot;</code>{" "}
        e nunca <code>number</code>, que aceita <code>e</code> e <code>+</code>{" "}
        e briga com a vírgula do teclado pt-BR;{" "}
        <code>inputMode=&quot;decimal&quot;</code>, sem o qual o telefone abre o
        teclado de texto; e a renormalização no <code>onBlur</code>. Os dez
        campos à mão tinham a máscara e{" "}
        <strong>nenhum tinha o blur</strong> — um valor colado ou meio digitado
        saía do campo como estava.
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
