"use client"

import { PlusIcon, TrashIcon } from "@heroicons/react/16/solid"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

export default function ButtonDoc() {
  return (
    <>
      <Usage>
        Toda ação clicável. Se navega, é um link dentro de <code>asChild</code>. Um <code>&lt;div onClick&gt;</code> não recebe foco, não responde ao Enter e não é anunciado como controle.
      </Usage>

      <DocSection
        title="Hierarquia"
        description="Três degraus, e eles descem em peso visual, não só em nome: primary preenche de verde, secondary preenche de cinza, tertiary não preenche nada. Uma tela tem um primary só — se dois competem, nenhum é a ação da tela."
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
        description="outline é a exceção: para quando o controle precisa de contorno próprio e nenhum dos três degraus serve. destructive é o que não tem volta, e é o único que carrega cor de alerta. link é ação que se comporta como texto."
        code={`<Button variant="outline">outline</Button>
<Button variant="destructive">destructive</Button>
<Button variant="link">link</Button>`}
      >
        <Button variant="outline">outline</Button>
        <Button variant="destructive">destructive</Button>
        <Button variant="link">link</Button>
      </DocSection>

      <DocSection
        title="Tamanhos"
        description="Uma escada só, de 24 a 40 em degraus de 4. O padrão é md (32): é o corpo da ação comum, e o que você recebe ao escrever <Button> sem size."
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
        description="Na ordem, do menor ao maior: icon-xs 24, icon-sm 28, icon-md 32, icon-lg 36, icon-xl 40. A coluna espelha a de texto degrau a degrau — md casa com icon-md, lg com icon-lg — então botão de ícone ao lado de botão de texto usa o par, não o vizinho."
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
        description="Input, SelectTrigger, NativeSelect e ComboboxTrigger usam a mesma escada, com os mesmos nomes e o mesmo padrão. Botão ao lado de campo alinha sem ninguém dizer size — e se um dos dois mudar de degrau, o outro muda pelo mesmo nome."
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

      <DocNote title="A maiúscula inicial é do sistema">
        O rótulo de um CTA não depende de quem o escreve: o botão embrulha texto
        cru num <code>span</code> e aplica <code>::first-letter</code> nele —{" "}
        <code>salvar</code> sai <strong>Salvar</strong>. O embrulho existe
        porque <code>::first-letter</code> não vale em <code>inline-flex</code>,
        e o botão precisa ser flex para alinhar ícone.
        <br />
        <br />
        Repare que os rótulos acima aparecem capitalizados mesmo estando em
        minúscula no código — é a regra agindo, e é assim que ela se comporta em
        qualquer tela. Se um rótulo precisa mesmo de minúscula, passe um
        elemento em vez de texto: <code>&lt;Button&gt;&lt;span&gt;git
        push&lt;/span&gt;&lt;/Button&gt;</code> sai intacto, porque o botão só
        embrulha texto cru.
      </DocNote>

      <DocNote title="Não existe size=&quot;default&quot;">
        A escala do botão é só <code>xs</code> · <code>sm</code> ·{" "}
        <code>md</code> · <code>lg</code> · <code>xl</code>. O nome{" "}
        <code>default</code> dizia &ldquo;o padrão&rdquo; e apontava para 36, que
        deixou de ser o padrão quando <code>md</code> assumiu — e um rótulo que
        promete uma coisa e entrega outra custa mais caro que um degrau a mais.{" "}
        <code>size=&quot;default&quot;</code> e <code>size=&quot;icon&quot;</code>{" "}
        não compilam mais: use <code>lg</code> e <code>icon-lg</code>. O mesmo
        vale para <code>Input</code> e <code>SelectTrigger</code>, que passaram a
        falar essa escada. Nos <em>variants</em> a regra é a mesma:{" "}
        <code>default</code> virou <code>primary</code> e <code>ghost</code>{" "}
        virou <code>tertiary</code>, porque o nome agora diz o degrau.
      </DocNote>

      <DocNote title="Rodapé de diálogo: uma hierarquia só">
        Todo rodapé de <code>Dialog</code> e <code>AlertDialog</code> tem a mesma forma, e ela não se escolhe por tela: sair sem fazer nada é <code>tertiary</code>, a ação que o diálogo veio propor é <code>primary</code>, <code>destructive</code> quando não tem volta. Cancelar vem antes.
      </DocNote>

      <DocNote title="type=&quot;submit&quot; é só da ação principal">
        Dentro de um <code>Form</code>, o Enter aciona o <code>type=&quot;submit&quot;</code>. Cancelar, dispensar e alternar levam <code>type=&quot;button&quot;</code> — sem isso, cancelar vira o alvo do Enter e o formulário fecha em vez de salvar.
      </DocNote>

      <PropsTable
        rows={[
          {
            prop: "variant",
            type: '"primary" | "secondary" | "tertiary" | "outline" | "destructive" | "link"',
            default: '"primary"',
            description:
              "O degrau da hierarquia. primary, secondary e tertiary descem em peso; outline, destructive e link ficam fora da escada.",
          },
          {
            prop: "size",
            type: '"xs" | "sm" | "md" | "lg" | "xl" | "icon-xs" | "icon-sm" | "icon-md" | "icon-lg" | "icon-xl"',
            default: '"md"',
            description:
              "Altura: xs 24, sm 28, md 32, lg 36, xl 40. As variantes icon são quadradas na mesma escala.",
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
