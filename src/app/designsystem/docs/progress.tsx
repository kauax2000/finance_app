"use client"

import { Progress } from "@/components/ui/progress"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

export default function ProgressDoc() {
  return (
    <>
      <Usage>
        Quanto de um total já foi consumido: um orçamento de categoria, um limite de cartão. Se o progresso não tem fim conhecido, o componente é o <code>Spinner</code>.
      </Usage>

      <DocSection
        title="Tons"
        description="O tom vem do estado: 45% é default, 85% é warning, estourado é destructive. A tela decide o limiar; o componente só pinta."
        code={`<Progress value={45} />
<Progress value={72} tone="success" />
<Progress value={88} tone="warning" />
<Progress value={104} tone="destructive" />`}
        previewClassName="flex-col items-stretch gap-4"
      >
        <div className="flex w-full flex-col gap-1.5">
          <div className="flex items-baseline justify-between text-xs">
            <span className="text-muted-foreground">Mercado</span>
            <span className="nums text-muted-foreground">45%</span>
          </div>
          <Progress value={45} aria-label="Mercado" />
        </div>
        <div className="flex w-full flex-col gap-1.5">
          <div className="flex items-baseline justify-between text-xs">
            <span className="text-muted-foreground">Transporte</span>
            <span className="nums text-muted-foreground">72%</span>
          </div>
          <Progress value={72} tone="success" aria-label="Transporte" />
        </div>
        <div className="flex w-full flex-col gap-1.5">
          <div className="flex items-baseline justify-between text-xs">
            <span className="text-muted-foreground">Lazer</span>
            <span className="nums text-muted-foreground">88%</span>
          </div>
          <Progress value={88} tone="warning" aria-label="Lazer" />
        </div>
        <div className="flex w-full flex-col gap-1.5">
          <div className="flex items-baseline justify-between text-xs">
            <span className="text-muted-foreground">Assinaturas</span>
            <span className="nums text-warning-muted-foreground">104%</span>
          </div>
          <Progress value={104} tone="destructive" aria-label="Assinaturas" />
        </div>
      </DocSection>

      <DocSection
        title="Dinheiro"
        description="Orçamento consumido é gasto, não erro: use os tons de dinheiro em vez do vermelho de destructive."
        code={`<Progress value={62} tone="expense" />
<Progress value={38} tone="income" />`}
        previewClassName="flex-col items-stretch gap-4"
      >
        <div className="flex w-full flex-col gap-1.5">
          <div className="flex items-baseline justify-between text-xs">
            <span className="text-muted-foreground">Gasto do mês</span>
            <span className="nums text-muted-foreground">62%</span>
          </div>
          <Progress value={62} tone="expense" aria-label="Gasto do mês" />
        </div>
        <div className="flex w-full flex-col gap-1.5">
          <div className="flex items-baseline justify-between text-xs">
            <span className="text-muted-foreground">Meta de reserva</span>
            <span className="nums text-muted-foreground">38%</span>
          </div>
          <Progress value={38} tone="income" aria-label="Meta de reserva" />
        </div>
      </DocSection>

      <DocSection
        title="Tamanho"
        description="sm dentro de linha de lista; md, o padrão, quando a barra é o assunto do bloco. Nenhuma tela declara h-* por fora."
        code={`<Progress value={70} size="sm" />
<Progress value={70} />`}
        previewClassName="flex-col items-stretch gap-4"
      >
        <div className="flex w-full items-center gap-3">
          <code className="w-16 shrink-0 font-mono text-2xs text-muted-foreground">
            sm
          </code>
          <Progress value={70} size="sm" aria-label="Barra sm" />
        </div>
        <div className="flex w-full items-center gap-3">
          <code className="w-16 shrink-0 font-mono text-2xs text-muted-foreground">
            md
          </code>
          <Progress value={70} aria-label="Barra md" />
        </div>
      </DocSection>

      <DocSection
        title="Começou e não começou"
        description="Zero é trilho limpo; um por cento é um ponto. A diferença precisa existir na tela, não só no número."
        code={`<Progress value={0} />
<Progress value={1} />`}
        previewClassName="flex-col items-stretch gap-4"
      >
        <div className="flex w-full items-center gap-3">
          <code className="w-16 shrink-0 font-mono text-2xs text-muted-foreground">
            0%
          </code>
          <Progress value={0} aria-label="Nada consumido" />
        </div>
        <div className="flex w-full items-center gap-3">
          <code className="w-16 shrink-0 font-mono text-2xs text-muted-foreground">
            1%
          </code>
          <Progress value={1} aria-label="Um por cento consumido" />
        </div>
      </DocSection>

      <DocNote title="Um por cento ainda desenha alguma coisa">
          O preenchimento tem piso de largura igual à altura da barra, então um valor pequeno e diferente de zero aparece como ponto: &ldquo;mal começou&rdquo; não desenha igual a &ldquo;não começou&rdquo;.
      </DocNote>

      <DocNote title="value acima de max não estoura a barra">
          Acima do total a barra fica cheia e ganha <code>data-over</code>. Por isso o número ao lado é obrigatório: sem ele, 104% e 400% desenham igual.
      </DocNote>

      <DocNote title="O valor real continua sendo anunciado">
          O Radix trata <code>value</code> acima de <code>max</code> como indeterminado; o componente limita o valor enviado e manda a porcentagem verdadeira em <code>aria-valuetext</code>, para o leitor de tela não perder o número da categoria que estourou.
      </DocNote>

      <PropsTable
        rows={[
          { prop: "value", type: "number", description: "O valor atual." },
          { prop: "max", type: "number", default: "100", description: "O total." },
          {
            prop: "tone",
            type: '"default" | "success" | "warning" | "destructive" | "income" | "expense"',
            default: '"default"',
            description:
              "A cor da barra preenchida. Os dois últimos são os tons de dinheiro.",
          },
          {
            prop: "size",
            type: '"sm" | "md"',
            default: '"md"',
            description: "A altura do trilho: 6px e 8px.",
          },
        ]}
      />
    </>
  )
}
