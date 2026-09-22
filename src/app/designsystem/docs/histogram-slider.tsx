"use client"

import { HistogramSlider } from "@/components/ui/histogram-slider"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

/** Uma distribuição plausível de valores de transação: muitas pequenas, poucas grandes. */
const DISTRIBUICAO = [
  47, 35, 62, 27, 51, 40, 23, 43, 20, 36, 20, 20, 31, 43, 18, 21, 32, 40,
  28, 22, 35, 11, 29, 16, 12, 11, 14, 23, 11, 17, 17, 12, 14, 7, 6, 8, 13,
  10, 8, 11, 9, 7, 11, 10, 6, 8, 7, 9, 8, 5, 9, 3, 5, 7, 3, 5, 2, 5, 5, 4,
  5, 3, 4, 4,
]

export default function HistogramSliderDoc() {
  return (
    <>
      <Usage>
        Escolher uma faixa de valor <strong>sabendo onde o dado está</strong>. Um intervalo entre R$ 0 e R$ 6.400 não diz nada; o mesmo intervalo com a distribuição atrás mostra que a maior parte das transações cai embaixo. Para uma faixa sem distribuição, o componente é o <code>Slider</code> de dois punhos.
      </Usage>

      <DocSection
        title="Padrão"
        description="As barras dentro da seleção acendem; as de fora apagam. Arraste um punho e veja a travessia."
        code={`<HistogramSlider
  label="Faixa de valor"
  bins={distribuicao}
  min={0}
  max={6400}
  defaultValue={[500, 3500]}
/>`}
        previewClassName="flex-col items-stretch"
      >
        <div className="w-full max-w-md">
          <HistogramSlider
            label="Faixa de valor"
            bins={DISTRIBUICAO}
            min={0}
            max={6400}
            defaultValue={[500, 3500]}
          />
        </div>
      </DocSection>

      <DocSection
        title="A versão de marca"
        description="O mesmo eixo variant do Slider: as barras acesas vestem o arco-íris, ancorado na largura inteira do histograma. Uma por tela."
        code={`<HistogramSlider variant="brand" label="Faixa de valor" bins={distribuicao} … />`}
        previewClassName="flex-col items-stretch"
      >
        <div className="w-full max-w-md">
          <HistogramSlider
            variant="brand"
            label="Faixa de valor"
            bins={DISTRIBUICAO}
            min={0}
            max={6400}
            defaultValue={[500, 3500]}
          />
        </div>
      </DocSection>

      <DocNote title="A contagem de faixas decide a coluna e o passo">
        As colunas dividem a régua, então <code>bins.length</code> decide a <strong>espessura</strong> — e, como o slider é travado na grade, também o <strong>passo</strong>: <code>(max − min) / bins.length</code>. Escolha uma contagem que divida a escala, senão o dinheiro sai quebrado: 64 faixas em R$ 5.000 dariam passo de R$ 78,125, e a leitura sairia <code>R$ 468,75</code>. Esta demo usa 64 em R$ 6.400 — coluna fina e passo de R$ 100.
      </DocNote>

      <DocNote title="Não há step: o passo é a faixa">
        É o que faz o punho parar sempre sobre uma guia — com passo livre, uma linha presa às frestas não tem como estar sob um punho contínuo. A régua recua meio punho em cada ponta, porque o centro do punho viaja de <code>7px</code> a <code>largura − 7px</code> e uma grade encostada nas bordas viveria noutro sistema de coordenadas. Medido: desvio <strong>0px</strong> entre punho e guia em qualquer posição.
      </DocNote>

      <DocNote title="A guia fica entre as colunas">
        Ela marca a <strong>fronteira</strong> da seleção, então pousa na fresta — e se ancora na coluna, não no punho: o Radix recua o punho meia-largura nas pontas, e presa a ele a guia erraria o vão.
        <br />
        <br />
        Quem a torna visível é <code>mix-blend-difference</code> a 70%, e não um fio em volta: no escuro <code>--primary-accent</code> e <code>--primary</code> são a mesma cor, então na variante padrão ela sumiria dentro da coluna acesa.
      </DocNote>

      <DocNote title="Acende quem cabe inteira entre as guias">
        Contenção, e não sobreposição: com as guias na tela, elas são a fronteira, e o que acende é o que está entre elas. Uma seleção mais estreita que uma faixa não acende nada — é verdade, não buraco.
      </DocNote>

      <DocNote title="A travessia é opacidade, porque degradê não interpola">
        Cada coluna tem duas camadas, e quem liga a tinta acesa é a <strong>opacidade</strong>: <code>transition-colors</code> cobre <code>background-color</code> e não <code>background-image</code>, então na variante de marca o degradê estalaria.
        <br />
        <br />
        <strong>Toda coluna leva o mesmo tempo</strong> entre o neutro e o pintado, e quem acende antes é aquela por onde o punho passou antes — a ordem não se calcula, o arraste a produz. Num salto não há ordem de passagem, e a seleção dissolve junta.
      </DocNote>

      <DocNote title="O controle é o histograma, e o trilho é invisível">
        O <code>Slider</code> cobre a mesma caixa das colunas, então clicar ou arrastar em qualquer ponto delas move um punho. As colunas ficam por baixo e <code>pointer-events-none</code>; o trilho e a faixa somem, porque quem mostra o intervalo são as acesas. Some a cor <strong>e</strong> a imagem — <code>bg-transparent</code> sozinho não apaga o degradê da variante de marca.
      </DocNote>

      <DocNote title="A âncora do arco-íris é aritmética, e não medida">
        As colunas são uma divisão igual e conhecida, então a posição sai do índice: <code>background-size</code> de <code>N × 100%</code> e <code>background-position-x</code> de <code>100i/(N−1)</code>. No <code>Slider</code> a mesma ancoragem precisou de <code>ResizeObserver</code>, porque lá a largura da faixa é arbitrária — medir é o que se usa quando a geometria não se sabe.
      </DocNote>

      <DocNote title="As barras não são ChartSparkline, e é exceção deliberada">
        A <code>ChartSparkline variant=&quot;bars&quot;</code> seria a escolha certa se as barras fossem só desenho, mas ela não expõe <code>&lt;Cell&gt;</code> — e &ldquo;barra fora da seleção apaga&rdquo; é decisão por barra. Elas são <code>aria-hidden</code>: quem carrega a semântica é o <code>Slider</code>, e dele vêm o alvo de 44px, o foco, o teclado e os rótulos dos punhos.
      </DocNote>

      <DocNote title="A leitura é da peça; o título é da tela">
        Mínimo e máximo são um par termo/valor (<code>DescriptionList</code>), no mesmo recuo da régua, para cada valor cair sob a ponta a que pertence. O componente não desenha título: isso é chrome de tela, e quem o escreve é o <code>PageSectionHeader</code> ou o <code>FieldLabel</code>.
      </DocNote>

      <DocNote title="Lacuna conhecida: o leitor de tela anuncia o número cru">
        O Radix anuncia <code>1800</code>, e não &ldquo;R$ 1.800,00&rdquo;. O <code>Slider</code> não escreve <code>aria-valuetext</code> e não repassa props por punho; o conserto é uma prop nele, que pede autorização. Fica registrado em vez de varrido.
      </DocNote>

      <PropsTable
        rows={[
          {
            prop: "label",
            type: "string",
            description:
              "O nome acessível do controle. Obrigatório — as barras são decoração.",
          },
          {
            prop: "bins",
            type: "number[]",
            description:
              "A distribuição, em contagem crua por faixa. A peça normaliza; ela não busca dado nenhum.",
          },
          {
            prop: "min / max",
            type: "number",
            default: "0 / 100",
            description:
              "A escala do valor. Não há `step`: o passo é a largura de uma faixa, porque é ele que faz o punho parar sempre sobre uma guia.",
          },
          {
            prop: "value / defaultValue",
            type: "[number, number]",
            description:
              "O par selecionado. Controlado ou não, como no Slider.",
          },
          {
            prop: "onValueChange",
            type: "(v: [number, number]) => void",
            description: "Dispara na mudança, com o par novo.",
          },
          {
            prop: "variant",
            type: '"default" | "brand"',
            default: '"default"',
            description:
              "Desce ao Slider e às barras acesas. `brand` veste o arco-íris.",
          },
          {
            prop: "minLabel / maxLabel",
            type: "string",
            default: '"Mínimo" / "Máximo"',
            description: "O rótulo de cada caixa.",
          },
        ]}
      />
    </>
  )
}
