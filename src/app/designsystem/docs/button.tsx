"use client"

import { PlusIcon, TrashIcon } from "@heroicons/react/16/solid"
import { Button } from "@/components/ui/button"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

export default function ButtonDoc() {
  return (
    <>
      <Usage>
        Toda ação clicável. Se navega, é um link dentro de <code>asChild</code>. Um <code>&lt;div onClick&gt;</code> não recebe foco, não responde ao Enter e não é anunciado como controle.
      </Usage>

      <DocSection
        title="Variantes"
        description="default é a ação da tela — uma por vez. outline é a alternativa. ghost é o que sai sem fazer nada. destructive é o que não tem volta."
        code={`<Button>Salvar</Button>
<Button variant="outline">Alternativa</Button>
<Button variant="secondary">Secundária</Button>
<Button variant="ghost">Cancelar</Button>
<Button variant="destructive">Excluir</Button>
<Button variant="success">Confirmar</Button>
<Button variant="warning">Revisar</Button>
<Button variant="link">Saiba mais</Button>`}
      >
        <Button>Salvar</Button>
        <Button variant="outline">Alternativa</Button>
        <Button variant="secondary">Secundária</Button>
        <Button variant="ghost">Cancelar</Button>
        <Button variant="destructive">Excluir</Button>
        <Button variant="success">Confirmar</Button>
        <Button variant="warning">Revisar</Button>
        <Button variant="link">Saiba mais</Button>
      </DocSection>

      <DocSection
        title="Tamanhos"
        description="sm=28, default=36 e lg=40 batem degrau a degrau com Input e SelectTrigger, para um botão ao lado de um campo alinhar sem ajuste. xs fica fora da escala de campo: é para dentro de outro controle."
        code={`<Button size="xs">xs</Button>
<Button size="sm">sm</Button>
<Button>default</Button>
<Button size="lg">lg</Button>
<Button size="icon-sm" aria-label="Adicionar"><PlusIcon /></Button>
<Button size="icon" aria-label="Adicionar"><PlusIcon /></Button>
<Button size="icon-lg" aria-label="Adicionar"><PlusIcon /></Button>`}
      >
        <Button size="xs">xs</Button>
        <Button size="sm">sm</Button>
        <Button>default</Button>
        <Button size="lg">lg</Button>
        <Button size="icon-sm" aria-label="Adicionar">
          <PlusIcon aria-hidden />
        </Button>
        <Button size="icon" aria-label="Adicionar">
          <PlusIcon aria-hidden />
        </Button>
        <Button size="icon-lg" aria-label="Adicionar">
          <PlusIcon aria-hidden />
        </Button>
      </DocSection>

      <DocSection
        title="Com ícone e desabilitado"
        code={`<Button><PlusIcon aria-hidden />Nova transação</Button>
<Button variant="destructive"><TrashIcon aria-hidden />Excluir</Button>
<Button disabled>Salvando…</Button>`}
      >
        <Button>
          <PlusIcon aria-hidden />
          Nova transação
        </Button>
        <Button variant="destructive">
          <TrashIcon aria-hidden />
          Excluir
        </Button>
        <Button disabled>Salvando…</Button>
      </DocSection>

      <DocNote title="Rodapé de diálogo: uma hierarquia só">
        Todo rodapé de <code>Dialog</code> e <code>AlertDialog</code> tem a mesma forma, e ela não se escolhe por tela: sair sem fazer nada é <code>ghost</code>, a ação que o diálogo veio propor é <code>default</code>, <code>destructive</code> quando não tem volta. Cancelar vem antes.
      </DocNote>

      <DocNote title="type=&quot;submit&quot; é só da ação principal">
        Dentro de um <code>CustomForm</code>, o Enter aciona o <code>type=&quot;submit&quot;</code>. Cancelar, dispensar e alternar levam <code>type=&quot;button&quot;</code> — sem isso, cancelar vira o alvo do Enter e o formulário fecha em vez de salvar.
      </DocNote>

      <PropsTable
        rows={[
          {
            prop: "variant",
            type: '"default" | "outline" | "secondary" | "ghost" | "destructive" | "success" | "warning" | "link"',
            default: '"default"',
            description: "O peso da ação.",
          },
          {
            prop: "size",
            type: '"xs" | "sm" | "default" | "lg" | "icon" | "icon-xs" | "icon-sm" | "icon-lg"',
            default: '"default"',
            description: "Altura e espaçamento. As variantes icon são quadradas.",
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
