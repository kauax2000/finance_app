"use client"

import {
  ChartBars,
  ChartDonut,
  type ChartConfig,
} from "@/components/ui/chart"
import { currencyCompactBRL } from "@/lib/formatters"
import { DocNote, DocSection, Usage } from "../ds-doc"
import { Group, Ramp, Spec, Stack } from "../ds-kit"

const FLUXO = [
  { mes: "Nov", entradas: 8200, saidas: 6100 },
  { mes: "Dez", entradas: 11400, saidas: 9800 },
  { mes: "Jan", entradas: 8300, saidas: 7200 },
  { mes: "Fev", entradas: 8400, saidas: 6500 },
  { mes: "Mar", entradas: 8432, saidas: 6218 },
]

const CATEGORIAS = [
  { nome: "Mercado", valor: 1840 },
  { nome: "Transporte", valor: 620 },
  { nome: "Lazer", valor: 480 },
  { nome: "Saúde", valor: 310 },
  { nome: "Casa", valor: 260 },
]

const CONFIG_FLUXO = {
  entradas: { label: "Entradas", color: "var(--chart-income)" },
  saidas: { label: "Saídas", color: "var(--chart-expense)" },
} satisfies ChartConfig

const CONFIG_CATEGORIAS = {
  Mercado: { label: "Mercado" },
  Transporte: { label: "Transporte" },
  Lazer: { label: "Lazer" },
  Saúde: { label: "Saúde" },
  Casa: { label: "Casa" },
} satisfies ChartConfig

const RAMPA = [1, 2, 3, 4, 5].map((n) => ({
  token: `--chart-${n}`,
  name: `chart-${n}`,
}))

export default function GraficosDoc() {
  return (
    <>
      <Usage>
        Duas paletas, e escolher entre elas é a decisão inteira: quando verde e
        vermelho <strong>significam</strong> entrada e saída, use{" "}
        <code>--chart-income</code> e <code>--chart-expense</code>; quando são
        só categorias, a rampa <code>--chart-1</code> a <code>--chart-5</code>.
        Como o gráfico é montado é assunto de{" "}
        <a href="/designsystem/chart" className="underline underline-offset-2">
          Chart
        </a>
        ; aqui ficam as decisões que atravessam telas.
      </Usage>

      <DocSection
        title="Quando a cor é semântica"
        description="Fluxo de caixa: verde é entrada e vermelho é saída, e trocar por outra cor destruiria a leitura."
        code={`const config = {
  entradas: { label: "Entradas", color: "var(--chart-income)" },
  saidas: { label: "Saídas", color: "var(--chart-expense)" },
} satisfies ChartConfig`}
        previewClassName="items-stretch p-6"
      >
        <ChartBars
          config={CONFIG_FLUXO}
          data={FLUXO}
          x="mes"
          label="Entradas e saídas por mês"
          className="h-56 w-full"
          aspect="auto"
        />
      </DocSection>

      <DocSection
        title="Quando a cor é só identificação"
        description="Gasto por categoria: nenhuma delas é boa ou ruim. Aqui a rampa neutra é o certo — com as cores de status, a categoria vermelha leria como problema."
        code={`// Sem \`color\` no config: as fatias caem na rampa, na ordem.
const config = {
  Mercado: { label: "Mercado" },
  Transporte: { label: "Transporte" },
} satisfies ChartConfig`}
        previewClassName="flex-wrap items-start justify-center gap-8 p-6"
      >
        <ChartBars
          layout="horizontal"
          config={CONFIG_CATEGORIAS}
          data={CATEGORIAS}
          series={["valor"]}
          x="nome"
          label="Gasto por categoria"
          legend={false}
          className="h-56 w-80"
          aspect="auto"
        />
        <ChartDonut
          config={CONFIG_CATEGORIAS}
          data={CATEGORIAS}
          nameKey="nome"
          dataKey="valor"
          label="Composição do gasto por categoria"
          className="h-44 w-44"
          aspect="auto"
        />
      </DocSection>

      <DocSection
        title="A rampa, e o par que ela não separava"
        description="Cinco matizes que só identificam séries. A ordem é fixa: a cor segue a entidade, nunca o ranking — um filtro que muda a contagem de séries não pode repintar as que sobraram."
        previewClassName="flex-col items-stretch gap-4 p-6"
      >
        <Ramp tokens={RAMPA} />
      </DocSection>

      <DocNote title="A rampa reprovava, e o comentário dela afirmava o contrário">
        <code>globals.css</code> dizia &ldquo;cinco matizes a ~60° de
        distância&rdquo;. Medidos, os intervalos entre os matizes ordenados eram{" "}
        <strong>111 · 39 · 57 · 68 · 85</strong> — <code>--chart-1</code> e{" "}
        <code>--chart-2</code> estavam a 39°. Passada por um validador de paleta
        (ΔE em OKLab ×100, todos os pares), a rampa antiga reprovava duas vezes:{" "}
        <strong>4,9</strong> de separação para protanopia entre{" "}
        <code>--chart-4</code> e <code>--chart-1</code>, contra um piso de 8; e{" "}
        <strong>14,6</strong> para visão normal entre <code>--chart-2</code> e{" "}
        <code>--chart-1</code>, contra um piso de 15. Numa rosca de cinco
        fatias, quem não separa vermelho de verde via a série 1 e a 4{" "}
        <strong>como a mesma cor</strong>.
        <br />
        <br />O diagnóstico também estava errado, e não só o número: matiz
        sozinho nunca separou esta rampa. Quem separa é matiz{" "}
        <strong>e</strong> claridade. Depois do re-passo:{" "}
        <strong>8,8</strong> protanopia · <strong>16,8</strong> visão normal ·
        ≥3:1 contra <code>--card</code> nos cinco.
      </DocNote>

      <DocNote title="No escuro, a faixa de claridade perde para a separação">
        A faixa que o validador pede (L 0,48–0,67) e a separação CVD brigam
        sobre superfície escura: comprimir a claridade tira justamente o canal
        que separa magenta de ciano para quem não distingue vermelho de verde.
        Três candidatos dentro da faixa foram medidos, e os três reprovam em CVD
        (4,6 · 3,1 · 2,3). A rampa escura fica <strong>acima</strong> da faixa e
        passa no resto — 10,6 CVD · 17,1 visão normal · ≥3:1 —, e isso é decisão
        registrada, como o <code>--input</code> fora da 1.4.11. A faixa é
        heurística sobre uma superfície de referência; a separação é um leitor
        que não consegue ler o gráfico.
      </DocNote>

      <Group title="Regras" layout="grid">
        <Spec title="O que sempre vale">
          <Stack className="gap-2 text-xs text-muted-foreground">
            <p>
              <strong className="text-foreground">Rótulo do eixo em reais</strong>{" "}
              usa <code>currencyCompactBRL</code>. Exemplo:{" "}
              <span className="nums text-foreground">
                {currencyCompactBRL(8432)}
              </span>
              . <code>ChartYAxis</code> faz isso de fábrica com{" "}
              <code>format=&quot;compact&quot;</code>.
            </p>
            <p>
              <strong className="text-foreground">Cor não é o único canal.</strong>{" "}
              Rótulo, legenda ou padrão precisam distinguir as séries também: 8%
              dos homens não separa verde de vermelho. Duas séries ou mais
              sempre têm legenda; uma série nunca tem, porque ali o título já a
              nomeia.
            </p>
            <p>
              <strong className="text-foreground">O eixo Y começa em zero.</strong>{" "}
              Cortar a base multiplica visualmente uma diferença de 3%.{" "}
              <code>ChartYAxis</code> ancora em <code>[0, &quot;auto&quot;]</code>{" "}
              por padrão; quem tem caso legítimo passa <code>domain</code> e
              assume.
            </p>
            <p>
              <strong className="text-foreground">Um eixo só.</strong> Nunca dois
              eixos Y. Duas medidas de escala diferente são dois gráficos, ou
              uma indexada à outra — um segundo eixo deixa o autor escolher onde
              as curvas se cruzam.
            </p>
          </Stack>
        </Spec>

        <Spec title="A forma sai do trabalho do dado">
          <Stack className="gap-2 text-xs text-muted-foreground">
            <p>
              <strong className="text-foreground">Magnitude entre categorias</strong>{" "}
              → barras. Nome comprido → <code>layout=&quot;horizontal&quot;</code>.
            </p>
            <p>
              <strong className="text-foreground">Mudança ao longo do tempo</strong>{" "}
              → linha; com volume por baixo, área.
            </p>
            <p>
              <strong className="text-foreground">Composição de um total</strong>{" "}
              → rosca, e só quando as fatias são poucas. Progresso contra um
              teto → <code>variant=&quot;gauge&quot;</code>.
            </p>
            <p>
              <strong className="text-foreground">Um número só</strong> não é
              gráfico: é <code>StatCard</code>. Com tendência ao lado,{" "}
              <code>ChartSparkline</code>.
            </p>
          </Stack>
        </Spec>

        <Spec title="A sexta série não existe">
          <Stack className="gap-2 text-xs text-muted-foreground">
            <p>
              A rampa tem cinco degraus, e um sexto matiz gerado seria uma cor
              que ninguém mediu. A cauda vira <strong>&ldquo;Outros&rdquo;</strong>,
              e quem agrega é quem tem os dados.
            </p>
            <p>
              <code>chartSeriesColor</code> não deixa isso passar calado: do
              sexto em diante ele devolve <code>--muted-foreground</code>, que
              lê como &ldquo;não identificado&rdquo;. Repetir a rampa com{" "}
              <code>idx % 5</code> dá duas fatias da mesma cor — é o que{" "}
              <code>credit-cards-history-chart</code> faz hoje com seis cartões.
            </p>
          </Stack>
        </Spec>

        <Spec title="Como as cores chegam ao Recharts">
          <Stack className="gap-2 text-xs text-muted-foreground">
            <p>
              <code>ChartContainer</code> lê o <code>config</code> e emite{" "}
              <code>--color-&lt;chave&gt;</code> no escopo do gráfico. A série
              referencia <code>fill=&quot;var(--color-entradas)&quot;</code>.
            </p>
            <p>
              É assim que o gráfico acompanha o tema sem nenhum{" "}
              <code>useTheme</code>: a variável muda, o SVG repinta.
            </p>
          </Stack>
        </Spec>
      </Group>

      <DocNote title="Atributo SVG aceita var(), sim">
        <code>dashboard-installments-projection.tsx</code> afirma num comentário
        que &ldquo;Bar fill cannot use var() in SVG&rdquo; e por isso fixa{" "}
        <code>#1f6a59</code>. A premissa está errada: <code>fill</code> e{" "}
        <code>stroke</code> resolvem <code>var()</code>, e é exatamente o que{" "}
        <code>ChartContainer</code> explora. Esta nota já apontou para{" "}
        <code>dashboard-cashflow-chart.tsx</code>, que carregava a mesma frase e{" "}
        <strong>já foi consertado</strong> — o comentário de lá hoje registra a
        medição contrária. Com hex, o gráfico é a única parte da tela que não
        acompanha o tema escuro.
      </DocNote>
    </>
  )
}
