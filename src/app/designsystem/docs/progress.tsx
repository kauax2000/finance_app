"use client"

import { Progress } from "@/components/ui/progress"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

export default function ProgressDoc() {
  return (
    <>
      <Usage>
        Quanto de um total já foi consumido: um orçamento de categoria, um limite
        de cartão. Se o progresso não tem fim conhecido — uma requisição em
        andamento — o componente é o <code>Spinner</code>.
      </Usage>

      <DocSection
        title="Tons"
        description="O tom vem do estado, não do desenho: um orçamento em 45% é default, em 85% é warning, estourado é destructive. A tela decide o limiar; o componente só pinta."
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
          <Progress value={45} />
        </div>
        <div className="flex w-full flex-col gap-1.5">
          <div className="flex items-baseline justify-between text-xs">
            <span className="text-muted-foreground">Transporte</span>
            <span className="nums text-muted-foreground">72%</span>
          </div>
          <Progress value={72} tone="success" />
        </div>
        <div className="flex w-full flex-col gap-1.5">
          <div className="flex items-baseline justify-between text-xs">
            <span className="text-muted-foreground">Lazer</span>
            <span className="nums text-muted-foreground">88%</span>
          </div>
          <Progress value={88} tone="warning" />
        </div>
        <div className="flex w-full flex-col gap-1.5">
          <div className="flex items-baseline justify-between text-xs">
            <span className="text-muted-foreground">Assinaturas</span>
            <span className="nums text-warning-muted-foreground">104%</span>
          </div>
          <Progress value={104} tone="destructive" />
        </div>
      </DocSection>

      <DocNote title="value acima de max não estoura a barra">
        Um orçamento em 130% desenha a barra cheia em vez de vazar do trilho, e o
        elemento ganha <code>data-over</code>. O número que acompanha a barra é
        quem conta a história inteira, e por isso ele é obrigatório: sem ele, 104%
        e 400% desenham igual.
      </DocNote>

      <DocNote title="O valor real continua sendo anunciado">
        O Radix rejeita <code>value</code> acima de <code>max</code>: ele avisa no
        console e trata o progresso como indeterminado, zerando o{" "}
        <code>aria-valuenow</code>{" "}
        — ou seja, quem usa leitor de tela perdia o
        número exatamente na categoria que estourou. O componente limita o valor
        enviado ao primitivo e manda a porcentagem verdadeira no{" "}
        <code>aria-valuetext</code>.
      </DocNote>

      <PropsTable
        rows={[
          { prop: "value", type: "number", description: "O valor atual." },
          { prop: "max", type: "number", default: "100", description: "O total." },
          {
            prop: "tone",
            type: '"default" | "success" | "warning" | "destructive"',
            default: '"default"',
            description: "A cor da barra preenchida.",
          },
        ]}
      />
    </>
  )
}
