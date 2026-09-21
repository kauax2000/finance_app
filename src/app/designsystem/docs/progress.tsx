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
        title="Limiar"
        description="A forma normal. A tela entrega os dois cortes e o componente deriva a cor, marca o limiar na trilha e trata o estouro. Antes disso a escada estava escrita à mão em três telas, com dois conjuntos de números diferentes."
        code={`// orçamento de categoria: verde até 85%, âmbar até o limite
<Progress value={gasto} max={orcamento} bands={BUDGET_BANDS} />

// limite de cartão: mais conservador, verde só até 30%
<Progress value={usado} max={limite} bands={CARD_LIMIT_BANDS} />`}
        previewClassName="flex-col items-stretch gap-4"
      >
        {[
          ["Mercado", 45],
          ["Lazer", 84],
          ["Transporte", 92],
          ["Assinaturas", 104],
          ["Cartão", 400],
        ].map(([nome, pct]) => (
          <div key={nome as string} className="flex w-full flex-col gap-1.5">
            <div className="flex items-baseline justify-between text-xs">
              <span className="text-muted-foreground">{nome}</span>
              <span className="nums text-muted-foreground">{pct}%</span>
            </div>
            <Progress
              value={pct as number}
              bands={[85, 100]}
              aria-label={nome as string}
            />
          </div>
        ))}
      </DocSection>

      <DocSection
        title="Marca"
        description="Progresso sem limiar — uma parcela quitada, uma meta batida. O arco-íris é do trilho, e o preenchimento o revela: completar a barra completa a marca. Uma por tela, como as outras peças de marca."
        code={`<Progress variant="brand" value={72} />`}
        previewClassName="flex-col items-stretch gap-4"
      >
        {[15, 40, 72, 100].map((pct) => (
          <div key={pct} className="flex w-full flex-col gap-1.5">
            <div className="flex items-baseline justify-between text-xs">
              <span className="text-muted-foreground">Parcelas pagas</span>
              <span className="nums text-muted-foreground">{pct}%</span>
            </div>
            <Progress
              variant="brand"
              value={pct}
              aria-label={`Parcelas pagas: ${pct}%`}
            />
          </div>
        ))}
      </DocSection>

      <DocSection
        title="Tons"
        description="Quando não há limiar para derivar, a tela entrega o tom pronto. É o caminho de quem mede algo sem escada de risco — uma participação, um passo de importação."
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

      <DocNote title="O excesso transborda, e não divide o trilho">
          Acima do total a barra fica cheia, ganha <code>data-over</code> e o que passou vira uma pastilha à direita, <strong>fora</strong> do trilho. O trilho continua valendo o total sempre, então duas categorias lado a lado continuam comparáveis — que é o caso real, uma grade de cartões. A alternativa medida (o excesso dividindo o trilho) mostra a proporção com mais força, mas a 400% o orçamento vira um quarto da barra e o trilho muda de significado conforme o valor. A pastilha satura, então 400% e 1000% desenham igual: uma mentira menor que a anterior, em que 104% e 400% desenhavam igual. O número ao lado continua obrigatório.
      </DocNote>

      <DocNote title="income e expense desenham o mesmo pixel que success e destructive">
          <code>--income</code> é <code>var(--success)</code> e <code>--expense</code> é <code>var(--destructive)</code>. No preenchimento os pares são <strong>idênticos</strong>; o que separa dinheiro de estado são as superfícies <code>-muted</code>, que esta barra não consome. A distinção aqui é de vocabulário — ela diz a quem lê o código que aquilo é gasto e não erro —, e fica assim até alguém decidir dar valor próprio aos tokens sólidos.
      </DocNote>

      <DocNote title="O valor real continua sendo anunciado">
          O Radix trata <code>value</code> acima de <code>max</code> como indeterminado; o componente limita o valor enviado e manda a porcentagem verdadeira em <code>aria-valuetext</code>, para o leitor de tela não perder o número da categoria que estourou.
      </DocNote>

      <PropsTable
        rows={[
          { prop: "value", type: "number", description: "O valor atual." },
          { prop: "max", type: "number", default: "100", description: "O total." },
          {
            prop: "bands",
            type: "[number, number]",
            description:
              "Os dois cortes da escada de cor, em % do total. Deriva o tom e marca o limiar na trilha. Excludente com tone.",
          },
          {
            prop: "variant",
            type: '"default" | "brand"',
            default: '"default"',
            description:
              "brand é o arco-íris sobre leito preto, para progresso sem limiar. Excludente com tone e bands.",
          },
          {
            prop: "tone",
            type: '"default" | "success" | "warning" | "destructive" | "income" | "expense"',
            default: '"default"',
            description:
              "A cor da barra preenchida, quando a tela decide. Os dois últimos são os tons de dinheiro. Excludente com bands.",
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
