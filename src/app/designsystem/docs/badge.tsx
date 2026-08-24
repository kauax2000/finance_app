"use client"

import { Badge } from "@/components/ui/badge"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

export default function BadgeDoc() {
  return (
    <>
      <Usage>
        Um rótulo que <strong>descreve</strong>, nunca que age. Se o usuário pode
        clicar, é um Button ou um Toggle — um badge clicável não recebe foco nem
        é anunciado como controle.
      </Usage>

      <DocSection
        title="Variantes"
        description="Todas tonais: fundo suave e texto escuro do mesmo matiz. income e expense são mais saturadas que success e destructive de propósito — num extrato, verde e vermelho são o dado, não um aviso."
        code={`<Badge>Padrão</Badge>
<Badge variant="secondary">Neutro</Badge>
<Badge variant="success">Pago</Badge>
<Badge variant="warning">Vence hoje</Badge>
<Badge variant="destructive">Atrasado</Badge>
<Badge variant="income">Receita</Badge>
<Badge variant="expense">Despesa</Badge>
<Badge variant="outline">Rascunho</Badge>`}
      >
        <Badge>Padrão</Badge>
        <Badge variant="secondary">Neutro</Badge>
        <Badge variant="success">Pago</Badge>
        <Badge variant="warning">Vence hoje</Badge>
        <Badge variant="destructive">Atrasado</Badge>
        <Badge variant="income">Receita</Badge>
        <Badge variant="expense">Despesa</Badge>
        <Badge variant="outline">Rascunho</Badge>
      </DocSection>

      <DocSection
        title="Tamanhos"
        code={`<Badge size="xs">3</Badge>
<Badge size="sm">Parcelado</Badge>
<Badge>Assinatura</Badge>`}
      >
        <Badge size="xs" variant="success">
          3
        </Badge>
        <Badge size="sm" variant="secondary">
          Parcelado
        </Badge>
        <Badge>Assinatura</Badge>
      </DocSection>

      <DocNote title="Badge ou chip?">
        <code>src/lib/tag-chip-classes.ts</code>{" "}
        existe para o caso em que a
        superfície tonal precisa entrar num elemento que já é outro componente —
        o gatilho de um filtro, um item de menu. Quando o rótulo é só um rótulo,
        é Badge. Não duplique as classes de chip fora desses dois lugares.
      </DocNote>

      <PropsTable
        rows={[
          {
            prop: "variant",
            type: '"primary" | "secondary" | "success" | "warning" | "destructive" | "income" | "expense" | "outline"',
            default: '"primary"',
            description: "O estado que o rótulo comunica.",
          },
          {
            prop: "size",
            type: '"xs" | "sm" | "default"',
            default: '"default"',
            description: "xs é para contagem dentro de outro controle.",
          },
        ]}
      />
    </>
  )
}
