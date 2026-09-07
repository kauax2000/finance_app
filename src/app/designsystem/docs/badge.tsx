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
<Badge>md</Badge>
<Badge>default</Badge>`}
      >
        <Badge size="xs" tone="neutral">
          xs
        </Badge>
        <Badge size="sm" tone="neutral">
          sm
        </Badge>
        <Badge tone="neutral">md</Badge>
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
<Badge tone="neutral">Neutro</Badge>
<Badge tone="success">Pago</Badge>
<Badge tone="warning">Vence hoje</Badge>
<Badge tone="destructive">Atrasado</Badge>
<Badge tone="income">Receita</Badge>
<Badge tone="expense">Despesa</Badge>
<Badge variant="outline" tone="neutral">Rascunho</Badge>`}
      >
        <Badge>Padrão</Badge>
        <Badge tone="neutral">Neutro</Badge>
        <Badge tone="success">Pago</Badge>
        <Badge tone="warning">Vence hoje</Badge>
        <Badge tone="destructive">Atrasado</Badge>
        <Badge tone="income">Receita</Badge>
        <Badge tone="expense">Despesa</Badge>
        <Badge variant="outline" tone="neutral">Rascunho</Badge>
      </DocSection>

      <DocSection
        title="Os dois eixos se cruzam"
        description="variant é a forma, tone é a cor. Separá-los criou uma combinação que antes não existia: contorno na cor do tom."
        code={`<Badge variant="outline" tone="success">Ativa</Badge>`}
      >
        <div className="flex flex-col gap-3">
          {(["soft", "outline"] as const).map((v) => (
            <div key={v} className="flex flex-wrap items-center gap-2">
              <code className="w-16 shrink-0 font-mono text-2xs text-muted-foreground">
                {v}
              </code>
              {(
                [
                  "primary",
                  "neutral",
                  "success",
                  "warning",
                  "destructive",
                  "income",
                  "expense",
                ] as const
              ).map((t) => (
                <Badge key={t} variant={v} tone={t}>
                  {t}
                </Badge>
              ))}
            </div>
          ))}
        </div>
      </DocSection>

      <DocNote title="Ele misturava três coisas num nome só">
        <code>variant</code> carregava peso (<code>primary</code>,{" "}
        <code>secondary</code>), forma (<code>outline</code>) e{" "}
        <strong>tom</strong> (<code>success</code>, <code>warning</code>,{" "}
        <code>income</code>, <code>expense</code>) — e tom é o que{" "}
        <code>Alert</code>, <code>StatCard</code>, <code>Timeline</code>,{" "}
        <code>Progress</code>, <code>Separator</code> e{" "}
        <code>AnnouncementBar</code> chamam de <code>tone</code>. O{" "}
        <code>Badge</code> era o único a discordar, que é palavra por palavra a
        correção que a rodada do <code>Alert</code> já tinha feito quando{" "}
        <em>ele</em> era o único.
        <br />
        Foram 71 chamadas reescritas. As que sobraram eram ternários que
        misturavam os dois eixos — <code>
          variant={"{"}bill.is_active ? &quot;success&quot; : &quot;outline&quot;{"}"}
        </code> —, e o compilador as isolou uma a uma: um codemod não sabe que
        &ldquo;ativa&rdquo; é cor e &ldquo;inativa&rdquo; era forma.
      </DocNote>

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
            type: '"soft" | "outline"',
            default: '"soft"',
            description:
              "A forma: preenche a tinta suave do tom, ou desenha o contorno na cor dele. Fechado no modo de vidro.",
          },
          {
            prop: "tone",
            type: '"primary" | "neutral" | "success" | "warning" | "destructive" | "income" | "expense"',
            default: '"primary"',
            description: "A cor — o estado que o rótulo comunica.",
          },
          {
            prop: "size",
            type: '"xs" | "sm" | "md"',
            default: '"md"',
            description:
              "Altura: xs 14, sm 18, md 22. xs é para contagem dentro de outro controle.",
          },
        ]}
      />
    </>
  )
}
