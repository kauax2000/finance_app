"use client"

import { CheckIcon, DocumentTextIcon } from "@heroicons/react/16/solid"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Code } from "@/components/ui/code"
import {
  Progress,
  ProgressFooter,
  ProgressHeader,
  ProgressLabel,
  ProgressRing,
  ProgressValue,
} from "@/components/ui/progress"
import { BUDGET_BANDS, CARD_LIMIT_BANDS } from "@/lib/budget-bands"
import { currencyBRL } from "@/lib/formatters"
import { cn } from "@/lib/utils"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

const ORCAMENTO = [
  ["Mercado", 45],
  ["Lazer", 92],
  ["Assinaturas", 104],
] as const

const TONS = ["default", "success", "warning", "destructive", "income", "expense"] as const

const PASSOS = [
  ["Criar a conta", true],
  ["Cadastrar uma carteira", true],
  ["Importar o primeiro extrato", false],
  ["Definir um orçamento", false],
  ["Cadastrar um cartão", false],
] as const

const IMPORTACOES = [
  ["extrato-nubank-marco.ofx", 45, "2 min"],
  ["fatura-inter-marco.pdf", 78, "45 s"],
  ["extrato-itau-fevereiro.csv", 12, "5 min"],
  ["extrato-nubank-fevereiro.ofx", 100, "Pronto"],
] as const

export default function ProgressDoc() {
  const feitos = PASSOS.filter(([, ok]) => ok).length

  return (
    <>
      <Usage>
        Quanto de um total já foi consumido ou concluído: um orçamento, um limite de cartão, parcelas pagas. São duas formas, a barra (<code>Progress</code>) e o anel (<code>ProgressRing</code>), com as mesmas cores, cortes e estouro. Vizinhos que parecem progresso e não são: passos com nome e data são a <code>Timeline</code>; um total dividido entre partes é o <code>ChartSplit</code>; várias categorias contra os próprios tetos são o <code>ChartRadial</code>; espera sem fim conhecido é o <code>Spinner</code>.
      </Usage>

      <DocSection
        title="Com rótulo e valor"
        description="A anatomia: ProgressHeader em cima e ProgressFooter embaixo, pelas props header e footer, com a barra no meio. O ProgressLabel nomeia a barra (ela aponta aria-labelledby para ele, a não ser que a chamada traga um aria-label, que vence por ser mais rico), e o ProgressValue escreve a porcentagem sozinho — ou o que receber."
        code={`<Progress value={45}
  header={
    <ProgressHeader>
      <ProgressLabel>Importando extrato</ProgressLabel>
      <span>Lendo as linhas…</span>
    </ProgressHeader>
  }
  footer={
    <ProgressFooter>
      <span>142 de 318 transações</span>
      <ProgressValue />
    </ProgressFooter>
  }
/>`}
        previewClassName="flex-col items-stretch"
      >
        <Progress value={45} className="max-w-md"
          header={
            <ProgressHeader>
              <ProgressLabel>Importando extrato</ProgressLabel>
              <span className="text-muted-foreground">Lendo as linhas…</span>
            </ProgressHeader>
          }
          footer={
            <ProgressFooter>
              <span>142 de 318 transações</span>
              <ProgressValue />
            </ProgressFooter>
          }
        />
      </DocSection>

      <DocSection
        title="Limiar"
        description="A forma normal para consumo. A tela entrega os dois cortes e o componente deriva a cor, marca o primeiro corte com um traço e trata o estouro. As duas rampas do app moram em lib/budget-bands: orçamento em 85 e 100, limite de cartão em 30 e 70."
        code={`<Progress value={gasto} max={orcamento} bands={BUDGET_BANDS} size="sm"
  header={
    <ProgressHeader>
      <ProgressLabel>Mercado</ProgressLabel>
      <ProgressValue />
    </ProgressHeader>
  }
/>`}
        previewClassName="flex-col items-stretch gap-4"
      >
        {ORCAMENTO.map(([nome, pct]) => (
          <Progress key={nome} value={pct} bands={BUDGET_BANDS} size="sm" className="max-w-md"
            header={
              <ProgressHeader>
                <ProgressLabel>{nome}</ProgressLabel>
                <ProgressValue />
              </ProgressHeader>
            }
          />
        ))}
      </DocSection>

      <DocSection
        title="Zonas no trilho"
        description="Com zones, o trilho mostra a faixa de aviso e a de perigo antes de a barra chegar nelas, e o traço do corte sai. Serve à rampa que tem zona de perigo dentro do total — o limite do cartão, que fica vermelho a partir de 70%. No orçamento o perigo começa no próprio limite, e não sobra faixa para pintar."
        code={`<Progress value={usado} max={limite} bands={CARD_LIMIT_BANDS} zones
  header={
    <ProgressHeader>
      <ProgressLabel>Limite do cartão</ProgressLabel>
      <Badge tone="warning">Atenção</Badge>
    </ProgressHeader>
  }
  footer={
    <ProgressFooter>
      <span>R$ 2.750,00 de R$ 5.000,00</span>
      <ProgressValue />
    </ProgressFooter>
  }
/>`}
        previewClassName="flex-col items-stretch"
      >
        <Progress value={2750} max={5000} bands={CARD_LIMIT_BANDS} zones className="max-w-md"
          header={
            <ProgressHeader>
              <ProgressLabel>Limite do cartão</ProgressLabel>
              <Badge tone="warning" size="sm">
                Atenção
              </Badge>
            </ProgressHeader>
          }
          footer={
            <ProgressFooter>
              <span className="nums">
                {currencyBRL(2750)} de {currencyBRL(5000)}
              </span>
              <ProgressValue />
            </ProgressFooter>
          }
        />
      </DocSection>

      <DocSection
        title="Segmentada"
        description="segments divide a barra em casas, e cada uma acende quando o valor a cobre inteira: 7 de 12 parcelas são sete casas, nunca sete e meia. Para o que se conta em unidades — parcelas, etapas de um fluxo. Na marca, cada casa mostra a sua fatia do arco-íris."
        code={`<Progress value={7} max={12} segments={12} tone="success"
  header={
    <ProgressHeader>
      <ProgressLabel>Notebook</ProgressLabel>
      <ProgressValue>7 de 12</ProgressValue>
    </ProgressHeader>
  }
/>
<Progress variant="brand" value={2} max={4} segments={4} />`}
        previewClassName="flex-col items-stretch gap-5"
      >
        <Progress value={7} max={12} segments={12} tone="success" className="max-w-md"
          header={
            <ProgressHeader>
              <ProgressLabel>Notebook</ProgressLabel>
              <ProgressValue>7 de 12 parcelas</ProgressValue>
            </ProgressHeader>
          }
        />
        <Progress variant="brand" value={2} max={4} segments={4} className="max-w-md"
          header={
            <ProgressHeader>
              <ProgressLabel>Configurando o workspace</ProgressLabel>
              <ProgressValue>2 de 4 etapas</ProgressValue>
            </ProgressHeader>
          }
        />
      </DocSection>

      <DocSection
        title="Circular"
        description="ProgressRing é o mesmo progresso dobrado em círculo, para um valor só. O degrau é o diâmetro: lg 128 com o miolo livre, md 64 com a porcentagem, sm 32 sem texto, para dentro de uma linha. Aceita tone e bands; a marca não entra, porque um arco-íris dobrado troca de cor pela volta e não diz nada sobre o valor."
        code={`<ProgressRing value={128} max={200} size="lg" tone="success">
  <span className="font-semibold">64%</span>
  <span className="text-xs text-muted-foreground">128 de 200</span>
</ProgressRing>
<ProgressRing value={72} bands={CARD_LIMIT_BANDS} />
<ProgressRing value={45} size="sm" aria-label="Mercado" />`}
        previewClassName="items-center gap-8"
      >
        <ProgressRing value={128} max={200} size="lg" tone="success" aria-label="Parcelas quitadas">
          <span aria-hidden className="nums font-semibold text-foreground">
            64%
          </span>
          <span aria-hidden className="nums text-xs text-muted-foreground">
            128 de 200
          </span>
        </ProgressRing>
        <ProgressRing value={72} bands={CARD_LIMIT_BANDS} aria-label="Limite do cartão" />
        <div className="flex items-center gap-2 text-sm">
          <ProgressRing value={45} size="sm" bands={BUDGET_BANDS} aria-label="Mercado" />
          <span className="text-foreground">Mercado</span>
          <span className="nums text-muted-foreground">45%</span>
        </div>
      </DocSection>

      <DocSection
        title="Marca"
        description="Progresso sem limiar — uma meta batida, uma parcela quitada. O arco-íris é do trilho, e o preenchimento o revela: em 30% a barra é teal, e completar a barra completa a marca. Uma por tela."
        code={`<Progress variant="brand" value={72} />`}
        previewClassName="flex-col items-stretch"
      >
        <Progress variant="brand" value={72} className="max-w-md"
          header={
            <ProgressHeader>
              <ProgressLabel>Meta de reserva</ProgressLabel>
              <ProgressValue />
            </ProgressHeader>
          }
        />
      </DocSection>

      <DocSection
        title="Tons"
        description="Quando não há limiar para derivar, a tela entrega o tom pronto: uma participação, um passo concluído. income e expense são o vocabulário do dinheiro, e desenham o mesmo pixel que success e destructive (ver a nota)."
        code={`<Progress value={60} tone="success" />`}
        previewClassName="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3"
      >
        {TONS.map((tom) => (
          <Progress key={tom} value={60} tone={tom} size="sm"
            header={
              <ProgressHeader>
                <ProgressLabel className="font-mono text-2xs font-normal text-muted-foreground">
                  {tom}
                </ProgressLabel>
              </ProgressHeader>
            }
          />
        ))}
      </DocSection>

      <DocSection
        title="Tamanho, e começou ou não"
        description="sm (6px) dentro de linha de lista; md (8px), o padrão, quando a barra é o assunto do bloco. Zero é trilho limpo; um por cento é um ponto redondo, porque o preenchimento tem piso igual à altura da barra."
        code={`<Progress value={70} size="sm" />
<Progress value={0} />
<Progress value={1} />`}
        previewClassName="flex-col items-stretch gap-3"
      >
        {(
          [
            ["sm · 70%", 70, "sm"],
            ["md · 0%", 0, "md"],
            ["md · 1%", 1, "md"],
          ] as const
        ).map(([rotulo, v, s]) => (
          <div key={rotulo} className="flex max-w-md items-center gap-3">
            <Code variant="inline" className="w-16 shrink-0 text-muted-foreground">
              {rotulo}
            </Code>
            <Progress value={v} size={s} aria-label={rotulo} />
          </div>
        ))}
      </DocSection>

      <DocSection
        title="Composição: lista de passos"
        description="Um Card com a barra em cima e os passos embaixo — o cartão de primeiros passos. A barra conta, a lista diz o que falta. Quando cada passo tem data e descrição, é a Timeline."
        code={`<Card>
  <CardHeader>
    <CardTitle>Primeiros passos</CardTitle>
    <CardDescription>2 de 5 concluídos</CardDescription>
  </CardHeader>
  <CardContent>
    <Progress value={2} max={5} aria-label="Primeiros passos" />
    <ul>…</ul>
  </CardContent>
</Card>`}
        previewClassName="flex-col items-stretch"
      >
        <Card className="max-w-sm">
          <CardHeader>
            <CardTitle>Primeiros passos</CardTitle>
            <CardDescription>
              {feitos} de {PASSOS.length} concluídos
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Progress value={feitos} max={PASSOS.length} aria-label="Primeiros passos" />
            <ul className="flex flex-col gap-3">
              {PASSOS.map(([passo, ok]) => (
                <li key={passo} className="flex items-center gap-3 text-sm">
                  <span
                    aria-hidden
                    className={cn(
                      "flex size-5 shrink-0 items-center justify-center rounded-full border",
                      ok
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border"
                    )}
                  >
                    {ok ? <CheckIcon className="size-3.5" /> : null}
                  </span>
                  <span className={ok ? "text-muted-foreground line-through" : "text-foreground"}>
                    {passo}
                  </span>
                  <span className="sr-only">{ok ? "concluído" : "pendente"}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </DocSection>

      <DocSection
        title="Composição: em linha"
        description="A barra entre o nome e o tempo, numa fila de importações. Ela é sm e flex-1; o nome trunca antes de empurrar a barra, e o valor à direita tem largura fixa para as barras começarem e terminarem juntas."
        code={`<div className="flex items-center gap-3">
  <DocumentTextIcon />
  <span className="w-40 truncate">{arquivo}</span>
  <Progress value={pct} size="sm" aria-label={arquivo} />
  <span className="w-14 text-right">{tempo}</span>
</div>`}
        previewClassName="flex-col items-stretch gap-3"
      >
        {IMPORTACOES.map(([arquivo, pct, tempo]) => (
          <div key={arquivo} className="flex max-w-lg items-center gap-3 text-sm">
            <DocumentTextIcon aria-hidden className="size-4 shrink-0 text-muted-foreground" />
            <span className="w-40 shrink-0 truncate text-foreground">{arquivo}</span>
            <Progress
              value={pct}
              size="sm"
              tone={pct === 100 ? "success" : "default"}
              aria-label={arquivo}
            />
            <span className="nums w-14 shrink-0 text-right text-muted-foreground">{tempo}</span>
          </div>
        ))}
      </DocSection>

      <DocNote title="O excesso transborda, e não divide o trilho">
        Acima do total a barra fica cheia, ganha <code>data-over</code> e o que passou vira uma pastilha à direita, <strong>fora</strong> do trilho — o Assinaturas a 104%, acima. O trilho continua valendo o total sempre, então duas categorias lado a lado continuam comparáveis. A pastilha cresce até 28px e satura por volta de 210%: dali para cima tudo desenha igual, e é por isso que o número ao lado é obrigatório. O anel não tem pastilha: estourado, ele fica cheio e vermelho.
      </DocNote>

      <DocNote title="O valor real continua sendo anunciado">
        O Radix trata <code>value</code> acima de <code>max</code> como indeterminado; o componente limita o valor enviado e manda a porcentagem verdadeira em <code>aria-valuetext</code>, nos dois formatos. O <code>ProgressValue</code> é visual (<code>aria-hidden</code>) e escreve o mesmo número bruto, 104% e não 100.
      </DocNote>

      <DocNote title="income e expense desenham o mesmo pixel que success e destructive">
        <code>--income</code> é <code>var(--success)</code> e <code>--expense</code> é <code>var(--destructive)</code>. No preenchimento os pares são idênticos; o que separa dinheiro de estado são as superfícies <code>-muted</code>, que a barra não consome. A distinção aqui é de vocabulário, e a rampa de <code>bands</code> é de <strong>estado</strong> (um limite folgado é &ldquo;deu certo&rdquo;, não &ldquo;entrou dinheiro&rdquo;).
      </DocNote>

      <DocNote title="Onde o app usa">
        Sete barras em cinco arquivos, nenhum anel ainda. Com <code>bands</code>: o limite no cartão da lista e no painel da fatura (<code>CARD_LIMIT_BANDS</code>), o orçamento no cartão de categoria e no detalhe dela (<code>BUDGET_BANDS</code>). Com <code>tone=&quot;success&quot;</code>: as parcelas pagas, no painel da fatura e nos parcelamentos que terminam logo no painel inicial — que contam em unidades e são o caso da <code>segments</code>. E a participação da categoria no mês, no padrão. Desde a rodada 168 as cinco que tinham rótulo e porcentagem usam <code>header</code> (a participação também <code>footer</code>, com a frase de contexto), e as parcelas pagas são <code>segments</code>. Em todas o <code>aria-label</code> da chamada continua valendo, porque ele traz a categoria e o valor que o rótulo visível não diz.
      </DocNote>

      <PropsTable
        rows={[
          { prop: "value", type: "number", description: "O valor atual." },
          { prop: "max", type: "number", default: "100", description: "O total." },
          {
            prop: "bands",
            type: "[number, number]",
            description: "Os dois cortes da escada de cor, em % do total. Deriva o tom. Excludente com tone e variant=\"brand\".",
          },
          {
            prop: "zones",
            type: "boolean",
            default: "false",
            description: "Com bands, pinta no trilho a faixa de aviso e a de perigo, no lugar do traço do corte.",
          },
          {
            prop: "segments",
            type: "number",
            description: "Divide a barra em N casas; cada uma acende quando o valor a cobre inteira. Acima de 24 a barra volta a ser contínua.",
          },
          {
            prop: "variant",
            type: '"default" | "brand"',
            default: '"default"',
            description: "brand é o arco-íris revelado pelo preenchimento, no trilho de todo mundo. Excludente com tone e bands.",
          },
          {
            prop: "tone",
            type: '"default" | "success" | "warning" | "destructive" | "income" | "expense"',
            default: '"default"',
            description: "A cor quando a tela decide. Excludente com bands.",
          },
          {
            prop: "size",
            type: '"sm" | "md"',
            default: '"md"',
            description: "A altura do trilho: 6px e 8px. Também escala o texto do cabeçalho.",
          },
          {
            prop: "header / footer",
            type: "ReactNode",
            description: "ProgressHeader e ProgressFooter. Props, e não filhos, para a barra ficar sempre entre os dois — no DOM também.",
          },
          {
            prop: "ProgressValue children",
            type: "ReactNode",
            description: "Sem filhos, a porcentagem do valor bruto. Com filhos, o que receber.",
          },
          {
            prop: "ProgressRing size",
            type: '"sm" | "md" | "lg"',
            default: '"md"',
            description: "O diâmetro: 32, 64, 128. O sm não escreve texto. Aceita value, max, tone, bands e o miolo em children.",
          },
        ]}
      />
    </>
  )
}
