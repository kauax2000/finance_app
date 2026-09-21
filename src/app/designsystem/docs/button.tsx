"use client"

import { PlusIcon, TrashIcon } from "@heroicons/react/16/solid"
import { Button } from "@/components/ui/button"
import { FormSubmit } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

export default function ButtonDoc() {
  return (
    <>
      <Usage>
        Toda ação clicável. Se navega, é um link dentro de <code>asChild</code>. Nunca um <code>&lt;div onClick&gt;</code>: ele não recebe foco, não responde ao Enter e não é anunciado como controle.
      </Usage>

      <DocSection
        title="Hierarquia"
        description="Descem em peso: primary preenche de preto (branco no escuro), secondary de cinza, tertiary não preenche. Uma tela tem um primary só."
        code={`<Button>primary</Button>
<Button variant="secondary">secondary</Button>
<Button variant="tertiary">tertiary</Button>`}
      >
        <Button>primary</Button>
        <Button variant="secondary">secondary</Button>
        <Button variant="tertiary">tertiary</Button>
      </DocSection>

      <DocSection
        title="Fora da escada"
        description="outline quando o controle precisa de contorno próprio, destructive para o que não tem volta, link para ação que se comporta como texto, brand para o único CTA de marca da tela. Passe o mouse."
        code={`<Button variant="outline">outline</Button>
<Button variant="destructive">destructive</Button>
<Button variant="link">link</Button>
<Button variant="brand">brand</Button>
<Button variant="brandOutline">brandOutline</Button>`}
      >
        <Button variant="outline">outline</Button>
        <Button variant="destructive">destructive</Button>
        <Button variant="link">link</Button>
        <Button variant="brand">brand</Button>
        <Button variant="brandOutline">brandOutline</Button>
      </DocSection>

      <DocSection
        title="Tamanhos"
        description="De 24 a 40 em degraus de 4. O padrão é md (32), o corpo da ação comum."
        code={`<Button size="xs">24 · xs</Button>
<Button size="sm">28 · sm</Button>
<Button>32 · md</Button>
<Button size="lg">36 · lg</Button>
<Button size="xl">40 · xl</Button>`}
      >
        <Button size="xs">24 · xs</Button>
        <Button size="sm">28 · sm</Button>
        <Button>32 · md</Button>
        <Button size="lg">36 · lg</Button>
        <Button size="xl">40 · xl</Button>
      </DocSection>

      <DocSection
        title="Só ícone"
        description="icon-xs a icon-xl espelham a escada de texto; ao lado de um botão de texto, use o par (md com icon-md)."
        code={`<Button size="icon-xs" aria-label="icon-xs"><PlusIcon /></Button>
<Button size="icon-sm" aria-label="icon-sm"><PlusIcon /></Button>
<Button size="icon-md" aria-label="icon-md"><PlusIcon /></Button>
<Button size="icon-lg" aria-label="icon-lg"><PlusIcon /></Button>
<Button size="icon-xl" aria-label="icon-xl"><PlusIcon /></Button>`}
      >
        <Button size="icon-xs" aria-label="icon-xs">
          <PlusIcon aria-hidden />
        </Button>
        <Button size="icon-sm" aria-label="icon-sm">
          <PlusIcon aria-hidden />
        </Button>
        <Button size="icon-md" aria-label="icon-md">
          <PlusIcon aria-hidden />
        </Button>
        <Button size="icon-lg" aria-label="icon-lg">
          <PlusIcon aria-hidden />
        </Button>
        <Button size="icon-xl" aria-label="icon-xl">
          <PlusIcon aria-hidden />
        </Button>
      </DocSection>

      <DocSection
        title="Colado a um campo"
        description="Input, SelectTrigger, NativeSelect e ComboboxTrigger falam a mesma escada, então alinham sem declarar size."
        code={`<Input placeholder="Input · md" />
<Button>Button · md</Button>`}
      >
        <div className="flex w-full max-w-sm items-center gap-2">
          <Input placeholder="Input · md" aria-label="Exemplo de campo" />
          <Button>Button · md</Button>
        </div>
      </DocSection>

      <DocSection
        title="Com ícone e desabilitado"
        code={`<Button><PlusIcon aria-hidden />com ícone</Button>
<Button variant="destructive"><TrashIcon aria-hidden />destructive com ícone</Button>
<Button disabled>desabilitado</Button>`}
      >
        <Button>
          <PlusIcon aria-hidden />
          com ícone
        </Button>
        <Button variant="destructive">
          <TrashIcon aria-hidden />
          destructive com ícone
        </Button>
        <Button disabled>desabilitado</Button>
      </DocSection>

      <DocSection
        title="O primário é chapado, e acende em lava sob o cursor"
        description="Em repouso é só o preenchimento. Sob o cursor, o arco-íris da marca acende atrás de um vidro da cor do botão, seguindo o ponteiro. Passe o mouse devagar pelo espécime largo."
        code={`<Button size="xl" className="w-64">continuar</Button>
<Button>salvar</Button>
<Button disabled>desabilitado</Button>
<FormSubmit pending pendingLabel="salvando">salvar</FormSubmit>`}
        previewClassName="flex-wrap"
      >
        <Button size="xl" className="w-64">
          continuar
        </Button>
        <Button>salvar</Button>
        <Button disabled>desabilitado</Button>
        <FormSubmit pending pendingLabel="salvando">
          salvar
        </FormSubmit>
      </DocSection>

      <DocNote title="Cada peso responde ao cursor de um jeito">
        <code>primary</code> acende a lava por baixo de um vidro;{" "}
        <code>secondary</code>, <code>tertiary</code>, <code>outline</code> e{" "}
        <code>destructive</code> preenchem num disco que nasce sob o ponteiro;{" "}
        <code>brand</code> e <code>brandOutline</code> giram o contorno; e o{" "}
        <code>link</code> não tem traço em repouso — ele entra pela esquerda e
        recolhe para a direita. A mecânica de cada um está comentada em{" "}
        <code>button.tsx</code> e nas utilities <code>primary-wash</code>,{" "}
        <code>button-fill</code> e <code>link-sweep</code> de{" "}
        <code>globals.css</code>.
      </DocNote>

      <DocNote title="brandOutline é o brand onde o halo não cabe">
        O halo do <code>brand</code> sangra 4px para fora da caixa e encosta num
        vizinho próximo — barra, cabeçalho, par de ações. O{" "}
        <code>brandOutline</code> tira só essa camada. Os dois continuam fora da
        escada e continuam <strong>um por tela</strong>.
      </DocNote>

      <DocNote title="A maiúscula inicial é do sistema">
        O botão embrulha texto cru num <code>span</code> com{" "}
        <code>::first-letter</code>: <code>salvar</code> sai{" "}
        <strong>Salvar</strong>. Para manter minúscula, passe um elemento —{" "}
        <code>&lt;Button&gt;&lt;span&gt;git push&lt;/span&gt;&lt;/Button&gt;</code>{" "}
        sai intacto.
      </DocNote>

      <DocNote title="Não existe size=&quot;default&quot;">
        O nome dizia &ldquo;o padrão&rdquo; e apontava para 36, que deixou de ser
        o padrão. Use <code>lg</code> e <code>icon-lg</code>; nos variants,{" "}
        <code>default</code> virou <code>primary</code> e <code>ghost</code>{" "}
        virou <code>tertiary</code>, para o nome dizer o degrau.
      </DocNote>

      <DocNote title="Rodapé de diálogo: uma hierarquia só">
        Vale para todo <code>Dialog</code> e <code>AlertDialog</code>: cancelar vem antes e é <code>tertiary</code>; a ação é <code>primary</code>, ou <code>destructive</code> quando não tem volta. Dois botões de contorno lado a lado pesam igual.
      </DocNote>

      <DocNote title="type=&quot;submit&quot; é só da ação principal">
        Dentro de um <code>Form</code> o Enter aciona o submit. Cancelar, dispensar e alternar levam <code>type=&quot;button&quot;</code> — sem isso, cancelar vira o alvo do Enter e o formulário fecha em vez de salvar.
      </DocNote>

      <PropsTable
        rows={[
          {
            prop: "variant",
            type: '"primary" | "secondary" | "tertiary" | "outline" | "destructive" | "link" | "brand" | "brandOutline"',
            default: '"primary"',
            description: "O degrau da hierarquia; outline, destructive, link e brand ficam fora da escada.",
          },
          {
            prop: "size",
            type: '"xs" | "sm" | "md" | "lg" | "xl" | "icon-xs" | "icon-sm" | "icon-md" | "icon-lg" | "icon-xl"',
            default: '"md"',
            description: "Altura de 24 a 40; icon-* é quadrado.",
          },
          {
            prop: "asChild",
            type: "boolean",
            default: "false",
            description: "Passa o estilo para o filho. Use com <Link>.",
          },
        ]}
      />
    </>
  )
}
