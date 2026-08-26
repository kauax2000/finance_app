"use client"

import { Badge } from "@/components/ui/badge"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

export default function BadgeDoc() {
  return (
    <>
      <Usage>
        Um rótulo que <strong>descreve</strong>, nunca que age. Se dá para clicar, é <code>Button</code> ou <code>Toggle</code> — um badge clicável não recebe foco nem é anunciado como controle.
      </Usage>

      <DocSection
        title="Tamanhos"
        description="Três degraus: 14, 18 e 22 de altura. Todos aqui na mesma variante de propósito — a única coisa que muda de um para o outro é o tamanho. Quem manda na altura é a entrelinha, não o padding: cada degrau declara a sua, senão xs e sm saem idênticos."
        code={`<Badge size="xs">xs</Badge>
<Badge size="sm">sm</Badge>
<Badge>default</Badge>`}
      >
        <Badge size="xs" variant="secondary">
          xs
        </Badge>
        <Badge size="sm" variant="secondary">
          sm
        </Badge>
        <Badge variant="secondary">default</Badge>
      </DocSection>

      <DocNote title="xs é para dentro de outro controle">
        Os 14px do <code>xs</code> existem para uma contagem caber dentro de um
        botão ou de um item de menu sem esticá-lo. Rótulo que vive sozinho numa
        linha usa <code>sm</code> ou o padrão.
      </DocNote>

      <DocSection
        title="Coloração e estado"
        description="Todas tonais: fundo suave e texto escuro do mesmo matiz. Aqui o tamanho é o mesmo em todas — o que muda é só a cor, e com ela o estado que o rótulo comunica."
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

      <DocNote title="Dinheiro não é aviso">
        <code>income</code> e <code>expense</code> são mais saturadas que{" "}
        <code>success</code> e <code>destructive</code> de propósito. Num
        extrato, verde e vermelho são <em>o dado</em> — quanto entrou e quanto
        saiu — e não um juízo sobre ele. Usar o verde de &ldquo;deu certo&rdquo;
        para uma receita faz o extrato parecer um painel de alertas.
      </DocNote>

      <DocNote title="Badge ou chip?">
        <code>tag-chip-classes.ts</code> é para quando a superfície tonal entra num elemento que já é outro componente. Quando o rótulo é só rótulo, é Badge — e as classes de chip não se duplicam fora desses dois lugares.
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
            description:
              "Altura: xs 14, sm 18, default 22. xs é para contagem dentro de outro controle.",
          },
        ]}
      />
    </>
  )
}
