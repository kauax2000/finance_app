"use client"

import { Slider } from "@/components/ui/slider"
import { CARD_LIMIT_BANDS } from "@/lib/budget-bands"
import { currencyBRL } from "@/lib/formatters"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

const pctFmt = (v: number) => `${v}%`
const reais = (v: number) => currencyBRL(v, { maximumFractionDigits: 0, minimumFractionDigits: 0 })

export default function SliderDoc() {
  return (
    <>
      <Usage>
        Valor contínuo em que o <strong>aproximado basta</strong>: um limite de alerta, uma faixa de filtro. Nunca para um valor em reais exato — ali o campo é <code>&lt;Input money&gt;</code>. Sobre uma distribuição (quantas transações em cada faixa), é o <code>HistogramSlider</code>, que monta este componente por dentro.
      </Usage>

      <DocSection
        title="Com rótulo e valor"
        description="label põe o nome à esquerda e o valor atual à direita, e o valor acompanha o arraste. O nome também nomeia o punho (aria-labelledby), e format escreve o número no cabeçalho, no balão e no aria-valuetext — o leitor de tela ouve “80%”, e não “80”."
        code={`<Slider label="Alertar ao atingir" format={(v) => \`\${v}%\`} defaultValue={[80]} step={5} />`}
        previewClassName="flex-col items-stretch"
      >
        <div className="w-full max-w-sm">
          <Slider label="Alertar ao atingir" format={pctFmt} defaultValue={[80]} max={100} step={5} />
        </div>
      </DocSection>

      <DocSection
        title="Intervalo"
        description="Dois punhos no mesmo trilho, para uma faixa de busca. O cabeçalho escreve as duas pontas, e cada punho tem o seu nome — “Valor mínimo” e “Valor máximo”, se ninguém disser outro."
        code={`<Slider label="Valor da transação" format={reais} defaultValue={[200, 800]} max={2000} step={50} />`}
        previewClassName="flex-col items-stretch"
      >
        <div className="w-full max-w-sm">
          <Slider label="Valor da transação" format={reais} defaultValue={[200, 800]} max={2000} step={50} />
        </div>
      </DocSection>

      <DocSection
        title="Marcas e balão"
        description="marks põe traços nos pontos que importam, com rótulo embaixo quando o ponto tem nome; eles caem sob o centro do punho, e os que a faixa já cobre acendem. bubble mostra o valor num balão sobre o punho enquanto ele é arrastado — no dedo também, porque acende no :active — ou focado pelo teclado. Arraste, ou use as setas."
        code={`<Slider
  bubble
  format={(v) => \`\${v}%\`}
  marks={[0, 25, 50, 75, 100].map((v) => ({ value: v, label: \`\${v}%\` }))}
  defaultValue={[50]}
  step={25}
/>`}
        previewClassName="flex-col items-stretch"
      >
        <div className="w-full max-w-sm pt-8">
          <Slider
            aria-label="Reserva do mês"
            bubble
            format={pctFmt}
            marks={[0, 25, 50, 75, 100].map((v) => ({ value: v, label: `${v}%` }))}
            defaultValue={[50]}
            max={100}
            step={25}
          />
        </div>
      </DocSection>

      <DocSection
        title="Zonas"
        description="bands são os cortes do Progress: o trilho mostra a faixa de aviso e a de perigo, e a faixa acesa fica verde, âmbar ou vermelha conforme o valor passa delas. Aqui, os cortes do limite do cartão (30 e 70). Não se combina com a marca."
        code={`<Slider label="Avisar quando o uso do limite passar de" bands={CARD_LIMIT_BANDS} format={…} />`}
        previewClassName="flex-col items-stretch"
      >
        <div className="w-full max-w-sm">
          <Slider
            label="Avisar quando o uso do limite passar de"
            bands={CARD_LIMIT_BANDS}
            format={pctFmt}
            defaultValue={[60]}
            max={100}
            step={5}
          />
        </div>
      </DocSection>

      <DocSection
        title="A versão de marca"
        description="O arco-íris tem a largura do trilho e fica atrás; a faixa acesa é a janela que o revela — em 25% só se vê o teal, e a marca só fica completa com a barra cheia. Vale no intervalo também. Uma por tela."
        code={`<Slider variant="brand" defaultValue={[25]} />`}
        previewClassName="flex-col items-stretch gap-5"
      >
        <div className="flex w-full max-w-sm flex-col gap-5">
          <Slider variant="brand" defaultValue={[25]} max={100} aria-label="Marca em 25%" />
          <Slider variant="brand" defaultValue={[30, 75]} max={100} aria-label="Faixa de marca" />
        </div>
      </DocSection>

      <DocSection
        title="Desativado"
        description="Vem da raiz, e apaga a peça inteira — trilho, faixa e punho."
        code={`<Slider defaultValue={[40]} disabled />`}
        previewClassName="flex-col items-stretch"
      >
        <div className="w-full max-w-sm">
          <Slider label="Limite" format={pctFmt} defaultValue={[40]} max={100} disabled />
        </div>
      </DocSection>

      <DocNote title="O arco-íris é do trilho, e a peça mede em vez de recalcular">
        Escalado à faixa, um valor baixo comprimia as oito paradas em poucos pixels e lia como ruído. Com a imagem na largura do trilho a faixa vira janela — mas a conta do <code>Progress</code> (<code>10000 / pct</code>) não transplanta: ele é sempre controlado, e um slider de <code>defaultValue</code> congelaria no valor inicial. A peça <strong>mede a caixa renderizada</strong> (dois observadores, <code>offsetLeft</code> relativo ao trilho) e publica largura e deslocamento em variáveis com fallback <code>100%</code>, que sem JavaScript degradam para o degradê na faixa. Na vertical, com <code>inverted</code> ou <code>dir=&quot;rtl&quot;</code> o valor baixo revela a outra ponta do degradê; a ancoragem continua certa.
      </DocNote>

      <DocNote title="A divergência da 1.4.11 da marca, medida">
        O trilho é <code>--input-fill</code>, o do <code>Progress</code>. No escuro (compositado em <code>rgb(58,58,58)</code>) as oito paradas passam 3:1, pior caso <strong>3,40</strong>; no claro <strong>cinco reprovam</strong>, pior caso <strong>1,42</strong> na lima. O leito preto que resolveria foi recusado na tela no <code>Progress</code>, pela mesma razão. Nenhum texto pousa na faixa. E uma nota de método que custou uma medição: no escuro o token é translúcido, e tem de ser compositado sobre a superfície antes da razão.
      </DocNote>

      <DocNote title="O punho é 14px, e o alvo é 44">
        A 14px sobre um trilho de 8 o punho lê como a ponta do preenchimento; o alvo de toque cresce num pseudo-elemento de 44px, como no <code>Switch</code>. E o centro dele anda de 7px a <code>largura − 7px</code>, não de 0 a 100% — é por isso que as marcas usam a mesma régua (<code>calc(7px + (100% − 14px) × p)</code>) e caem sob o punho.
      </DocNote>

      <DocNote title="Onde o app usa">
        Nenhuma tela usa o <code>Slider</code> direto. O único consumidor é o <code>HistogramSlider</code>, que o põe transparente sobre as colunas; ele não passa <code>label</code>, <code>marks</code> nem <code>bands</code>, então continua a peça de sempre — mas passa <code>format</code> desde a rodada 177, e os punhos dele passaram a ser anunciados em reais, fechando a lacuna que ele registrava.
      </DocNote>

      <PropsTable
        rows={[
          { prop: "value · defaultValue", type: "number[]", description: "Um número por punho: [v] ou [mínimo, máximo]." },
          { prop: "min · max · step", type: "number", default: "0 · 100 · 1", description: "Os limites e o passo." },
          { prop: "label", type: "ReactNode", description: "O nome, no cabeçalho. Nomeia os punhos por aria-labelledby." },
          { prop: "format", type: "(value: number) => string", description: "Escreve o número no cabeçalho, no balão e no aria-valuetext de cada punho." },
          { prop: "showValue", type: "boolean", default: "true com label", description: "Mostra o valor atual no cabeçalho." },
          { prop: "marks", type: "(number | { value, label? })[]", description: "Traços no trilho, sob o centro do punho; com label, o rótulo embaixo." },
          { prop: "bubble", type: "boolean", default: "false", description: "O valor num balão sobre o punho, no arraste e no foco de teclado." },
          { prop: "bands", type: "[number, number]", description: "Os cortes do Progress, em %: zonas no trilho e a faixa na cor do valor. Não com variant=\"brand\"." },
          { prop: "variant", type: '"default" | "brand"', default: '"default"', description: "brand é o arco-íris revelado pela faixa. Uma por tela." },
          { prop: "thumbLabels", type: "string[]", description: "O nome de cada punho. Com dois, o padrão é “Valor mínimo” e “Valor máximo”." },
        ]}
      />
    </>
  )
}
