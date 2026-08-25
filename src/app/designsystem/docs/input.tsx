"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

export default function InputDoc() {
  return (
    <>
      <Usage>
        Todo campo de uma linha. Valor em reais é <code>MoneyInput</code>. Todo campo precisa de <code>Label</code> associado: <code>placeholder</code> não é rótulo, ele some ao digitar.
      </Usage>

      <DocSection
        title="Tamanhos"
        description="Batem com os do Button, para os dois alinharem numa mesma linha."
        code={`<Input size="sm" placeholder="sm" />
<Input placeholder="default" />
<Input size="lg" placeholder="lg" />`}
        previewClassName="flex-col items-stretch"
      >
        <Input size="sm" placeholder="sm" aria-label="Exemplo sm" />
        <Input placeholder="default" aria-label="Exemplo default" />
        <Input size="lg" placeholder="lg" aria-label="Exemplo lg" />
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
            type: '"sm" | "default" | "lg"',
            default: '"default"',
            description: "Altura do campo, alinhada com o Button.",
          },
          {
            prop: "aria-invalid",
            type: "boolean",
            description: "Pinta a borda e o anel de destructive.",
          },
        ]}
      />
    </>
  )
}
