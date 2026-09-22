"use client"

import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { DocNote, DocSection, Usage } from "../ds-doc"

export default function SliderDoc() {
  return (
    <>
      <Usage>
        Valor contínuo em que o <strong>aproximado basta</strong>: uma faixa de filtro, um limite de alerta. Nunca para um valor em reais exato — ali o campo é <code>&lt;Input money&gt;</code>.
      </Usage>

      <DocSection
        title="Valor único"
        code={`<Slider defaultValue={[60]} max={100} step={5} />`}
        previewClassName="flex-col items-stretch"
      >
        <div className="flex w-full max-w-sm flex-col gap-2">
          {/* O `slider` é o punho, um <span>: <label for> não o rotula. O nome vai
              por aria-labelledby, que o componente repassa ao punho. */}
          <Label id="ds-slider-label">Alertar ao atingir</Label>
          <Slider aria-labelledby="ds-slider-label" defaultValue={[80]} max={100} step={5} />
        </div>
      </DocSection>

      <DocSection
        title="Intervalo"
        description="Dois valores no mesmo trilho, para faixa de busca."
        code={`<Slider defaultValue={[20, 80]} max={100} step={10} />`}
        previewClassName="flex-col items-stretch"
      >
        <div className="w-full max-w-sm">
          <Slider
            defaultValue={[20, 80]}
            max={100}
            step={10}
            aria-label="Faixa de valor"
          />
        </div>
      </DocSection>

      <DocSection
        title="A versão de marca"
        description="O arco-íris tem a largura do trilho e fica atrás; a faixa ativa é a janela que o revela. Em 8% vê-se só o teal, e a marca só fica completa com a barra cheia. Uma por tela."
        code={`<Slider variant="brand" defaultValue={[70]} max={100} />`}
        previewClassName="flex-col items-stretch gap-4"
      >
        <div className="flex w-full max-w-sm flex-col gap-4">
          {[8, 25, 50, 100].map((v) => (
            <Slider
              key={v}
              variant="brand"
              defaultValue={[v]}
              max={100}
              aria-label={`Marca em ${v}%`}
            />
          ))}
          <Slider
            variant="brand"
            defaultValue={[30, 75]}
            max={100}
            aria-label="Faixa de marca"
          />
        </div>
      </DocSection>

      <DocNote title="O arco-íris é do trilho, e a peça mede em vez de recalcular">
        A primeira versão escalava o degradê à <strong>faixa</strong>, e na tela isso falhava no valor baixo: as oito paradas comprimidas em poucos pixels leem como ruído colorido, não como marca. Agora a imagem tem a largura do trilho e a faixa é uma janela sobre ela.
        <br />
        <br />
        O <code>Progress</code> consegue o mesmo escalando <code>background-size</code> por <code>10000 / pct</code>, e essa parte de fato não transplanta — ele é sempre controlado e sabe a porcentagem no render, enquanto um slider costuma ser <code>defaultValue</code> e um valor calculado congelaria no inicial. A saída é <strong>medir a caixa renderizada</strong>, que é o padrão da casa (o marcador do <code>Tabs</code>, o <code>useScrollFade</code>, o <code>--collapsible-full</code>): o trilho publica a própria largura e o deslocamento da faixa em variáveis CSS, e funciona controlado ou não. <code>offsetLeft</code> relativo ao trilho, nunca <code>getBoundingClientRect</code> — com a página rolada o retângulo do viewport escorregaria.
        <br />
        <br />
        <strong>Sem JavaScript não há caminho</strong>, e foi verificado por eliminação: o arco-íris no trilho com a faixa transparente pintaria também a parte não preenchida; um <code>::before</code> da faixa tem a própria faixa como bloco contentor; <code>overflow-hidden</code> na faixa não recorta um absoluto ancorado acima dela; e um tamanho fixo em <code>rem</code> deixa trilho sem pintura num slider largo. Os <code>var()</code> têm fallback <code>100%</code> de propósito: antes da primeira medição, e sem JS, o degradê preenche a faixa — a peça <strong>degrada</strong> para a versão anterior em vez de derrubar a declaração.
      </DocNote>

      <DocNote title="Dois desvios conhecidos, e os dois são de ordem de cor">
        Num slider <strong>vertical</strong> o Radix preenche de baixo para cima e <code>--brand-rainbow</code> é um <code>linear-gradient(135deg)</code> fixo, então o valor baixo revela a <strong>lima</strong> (o fim do degradê) e não o teal. <code>inverted</code> e <code>dir=&quot;rtl&quot;</code> têm a mesma classe de desvio. A ancoragem continua correta nos três, porque ela é medida e não deduzida do valor — o que inverte é qual ponta o valor baixo mostra. <code>orientation=&quot;vertical&quot;</code> não tem consumidor no app.
      </DocNote>

      <DocNote title="A divergência da 1.4.11, medida nesta peça">
        O trilho é <code>--input-fill</code>, o mesmo token do <code>Progress</code> — e por isso os números do claro saem idênticos aos dele. No <strong>escuro</strong> (trilho compositado <code>rgb(58,58,58)</code>) as oito paradas passam os 3:1, pior caso <strong>3,40</strong> no violeta. No <strong>claro</strong> (<code>rgb(222,222,222)</code>) <strong>cinco reprovam</strong>: lima 1,42, âmbar 1,51, teal 1,73, azul 1,87 e coral 2,53. O leito preto que resolveria já foi recusado na tela no <code>Progress</code>, e a recusa vale aqui pela mesma razão — uma peça que destoa das vizinhas não é o desenho. Nenhum texto pousa sobre a faixa, que é o que liberta as sete matizes da invariante 3.
      </DocNote>

      <DocNote title="Uma medição errada que vale guardar">
        No tema escuro <code>--input-fill</code> é <code>oklch(1 0 0 / 15%)</code>, <strong>translúcido</strong>. Medir uma parada contra o token cru dá número sem sentido — a primeira leitura desta rodada acusou seis paradas reprovando no escuro. O trilho tem de ser compositado sobre a superfície de baixo antes da razão; feito isso, nenhuma reprova.
      </DocNote>

      <DocSection
        title="Desativado"
        description="Vem da raiz, e apaga a peça inteira — trilho, faixa e punho."
        code={`<Slider defaultValue={[40]} max={100} disabled />`}
        previewClassName="flex-col items-stretch"
      >
        <div className="w-full max-w-sm">
          <Slider
            defaultValue={[40]}
            max={100}
            disabled
            aria-label="Limite (desativado)"
          />
        </div>
      </DocSection>

      <DocNote title="O punho é 14px, e o alvo é 44">
        A 14px sobre um trilho de 8 o punho lê como a ponta do preenchimento; o alvo de toque cresce num pseudo-elemento de 44px, como no <code>Switch</code>. Cresce o contato sem crescer o desenho.
      </DocNote>

      <DocNote title="O valor precisa aparecer em algum lugar">
        Um slider sozinho não diz onde parou. Mostre o número ao lado ou acima —
        e não só no tooltip do arraste, que não existe no toque.
      </DocNote>
    </>
  )
}
