"use client"

import * as React from "react"

import { FormInput } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

export default function InputDoc() {
  return (
    <>
      <Usage>
        Todo campo de uma linha — e, com <code>money</code>, todo valor em reais
        que o app <strong>recebe</strong>. Todo campo precisa de{" "}
        <code>Label</code> associado: <code>placeholder</code> não é rótulo, ele
        some ao digitar. A forma curta de pedir rótulo, ajuda e erro já ligados é{" "}
        <code>FormInput</code>.
      </Usage>

      <DocSection
        title="Tamanhos"
        description="Mesma escada do Button, mesmos nomes e mesmas alturas: sm 28, md 32, lg 36, xl 40. O padrão é md, então <Input> e <Button> alinham sem ninguém dizer size."
        code={`<Input size="sm" placeholder="sm · 28" />
<Input placeholder="md · 32" />
<Input size="lg" placeholder="lg · 36" />
<Input size="xl" placeholder="xl · 40" />`}
        previewClassName="flex-col items-stretch"
      >
        <Input size="sm" placeholder="sm · 28" aria-label="Exemplo sm" />
        <Input placeholder="md · 32" aria-label="Exemplo md" />
        <Input size="lg" placeholder="lg · 36" aria-label="Exemplo lg" />
        <Input size="xl" placeholder="xl · 40" aria-label="Exemplo xl" />
      </DocSection>

      <DocSection
        title="Estados"
        code={`<Input placeholder="Normal" />
<Input placeholder="Desabilitado" disabled />
<Input defaultValue="valor@invalido" aria-invalid />`}
        previewClassName="flex-col items-stretch"
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ds-input-normal">Descrição</Label>
          <Input id="ds-input-normal" placeholder="Mercado" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ds-input-disabled">Desabilitado</Label>
          <Input id="ds-input-disabled" placeholder="Mercado" disabled />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ds-input-invalid">Com erro</Label>
          <Input id="ds-input-invalid" defaultValue="nao-e-um-email" aria-invalid />
        </div>
      </DocSection>

      <DocSection
        title="Dinheiro"
        description="O modo é controlado por duas coisas ao mesmo tempo: a string mascarada, que é o que aparece no campo, e o número em reais, que é o que vai para o banco. onValueChange entrega as duas. Aqui ele vem dentro de FormInput, que é como as telas o escrevem."
        code={`const [texto, setTexto] = React.useState("")
const [reais, setReais] = React.useState<number | null>(null)

<FormInput
  money
  label="Valor"
  description={\`Em reais: \${reais}\`}
  value={texto}
  onValueChange={(masked, parsed) => {
    setTexto(masked)
    setReais(parsed)
  }}
/>`}
        previewClassName="flex-col items-stretch"
      >
        <MoneyDemo />
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
        tela.
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

      <DocNote title="Por que um modo, e não um componente">
        Havia um <code>MoneyInput</code>, e ele importava{" "}
        <strong>só o <code>Input</code></strong> e renderizava{" "}
        <strong>só um <code>&lt;Input&gt;</code></strong>: era este átomo com
        outro nome, e o catálogo pagava duas páginas por um controle. É o mesmo
        movimento que o <code>Kbd</code> fez ao absorver o acorde em{" "}
        <code>keys</code>.
        <br />
        <br />
        O modo é uma <strong>união discriminada</strong>: com{" "}
        <code>money</code>, <code>value</code> e <code>onValueChange</code> são
        obrigatórios e <code>onChange</code> não existe. Como toda união neste
        projeto, ela <strong>não estreita por variável</strong> —{" "}
        <code>&lt;Input money={"{"}x{"}"}&gt;</code> com um booleano não compila,
        e o literal é obrigatório. Quem só quer a moldura —{" "}
        <code>InputGroupInput</code>, <code>SidebarInput</code> — é fixado no
        ramo base por <code>InputBaseProps</code>.
      </DocNote>

      <DocNote title="No telefone o campo é 16px, e não é escolha de design">
        Safari do iOS dá zoom em qualquer campo com fonte abaixo de 16px, e o zoom costuma não voltar. Uma regra em <code>@layer base</code> força <code>1rem</code> abaixo de 768px — por isso o campo parece maior no telefone.
      </DocNote>

      <DocNote title="size aqui não é o size do HTML">
        O <code>size</code> nativo de <code>&lt;input&gt;</code>{" "}
        é largura em
        caracteres, e nunca foi usado neste projeto. O tipo do componente o
        remove com <code>Omit</code> para o <code>size</code>{" "}
        de design não
        colidir com ele.
      </DocNote>

      <PropsTable
        rows={[
          {
            prop: "size",
            type: '"sm" | "md" | "lg" | "xl"',
            default: '"md"',
            description: "Altura: sm 28, md 32, lg 36, xl 40 — a mesma escada do Button.",
          },
          {
            prop: "aria-invalid",
            type: "boolean",
            description: "Pinta a borda e o anel de destructive.",
          },
          {
            prop: "money",
            type: "true",
            description: "Liga o modo dinheiro. Literal, nunca variável: é o discriminante da união.",
          },
          {
            prop: "value",
            type: "string",
            description: "Com money, a string já mascarada — não é o número. Obrigatória.",
          },
          {
            prop: "onValueChange",
            type: "(raw: string, parsedReais: number | null) => void",
            description: "Só com money. Entrega a máscara e o valor em reais; null quando o campo está vazio.",
          },
          {
            prop: "mono",
            type: "boolean",
            default: "false",
            description: "Só com money. Geist Mono nas figuras; a figura tabular é sempre ligada.",
          },
          {
            prop: "inputMode",
            type: "string",
            default: '"decimal" com money',
            description: "O teclado que o telefone abre.",
          },
        ]}
      />
    </>
  )
}

function MoneyDemo() {
  const [texto, setTexto] = React.useState("42,90")
  const [reais, setReais] = React.useState<number | null>(42.9)

  return (
    <FormInput
      money
      label="Valor"
      description={`Em reais: ${String(reais)}`}
      fieldClassName="max-w-xs"
      value={texto}
      onValueChange={(masked, parsed) => {
        setTexto(masked)
        setReais(parsed)
      }}
    />
  )
}
