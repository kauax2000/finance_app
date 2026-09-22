"use client"

import { AppLogo } from "@/components/layout/app-logo"
import { AppWordmark } from "@/components/layout/app-wordmark"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent, CardNote, CardToolbar } from "@/components/ui/card"
import { MoneyDisplay } from "@/components/ui/money-display"
import { Separator } from "@/components/ui/separator"
import { Muted } from "@/components/ui/typography"
import { DocNote, DocSection, Usage } from "../ds-doc"
import { Group, Spec, SpecimenPanel, Stack } from "../ds-kit"

/** Altura declarada e largura que sai do viewBox de 101/24.
 *
 * Havia uma quinta coluna, "gira/parado", e ela saiu com o giro: uma coluna
 * com um valor só não carrega decisão nenhuma. */
const ESCALA = [
  ["sm", "h-5", "20px", "84px", "faixa estreita — o cabeçalho do sheet no telefone"],
  ["md", "h-6", "24px", "101px", "o padrão: barra do catálogo"],
  ["lg", "h-8", "32px", "135px", "quando a marca é o assunto da superfície — o campo de marca"],
  ["xl", "h-10 md:h-11", "40 → 44px", "168 → 185px", "a marca sozinha numa tela inteira — o splash"],
]

export default function BrandDoc() {
  return (
    <>
      <Usage>
        A marca é <strong>preta</strong> — branca no escuro — e o arco-íris neon é o único acento de cor do sistema, reservado a ela. Duas peças, escolhidas pela forma do espaço: numa linha, o <strong>lockup</strong> (<code>AppWordmark</code>); num quadrado, o <strong>símbolo</strong> (<code>AppLogo</code>). Não há terceira montagem — símbolo com o nome ao lado é o que o lockup já é.
      </Usage>

      <Group title="As duas peças" layout="grid">
        <Spec title="Lockup" meta="AppWordmark">
          <Stack className="gap-3">
            <SpecimenPanel surface="background" className="items-start">
              <AppWordmark size="lg" />
            </SpecimenPanel>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Símbolo e nome no mesmo traçado, proporção 101/24, dimensionado por altura. Vai no campo de marca das telas de acesso, no splash e na barra deste catálogo.
            </p>
          </Stack>
        </Spec>

        <Spec title="Símbolo" meta="AppLogo">
          <Stack className="gap-3">
            <SpecimenPanel surface="background" className="items-start">
              <AppLogo size="md" />
            </SpecimenPanel>
            <p className="text-xs leading-relaxed text-muted-foreground">
              O mesmo &ldquo;f&rdquo;, sozinho, num quadrado de 32: favicon, ícone de PWA, badge de notificação, avatar. Sempre <code>aria-hidden</code>, ao lado de um texto que já nomeia o produto.
            </p>
          </Stack>
        </Spec>
      </Group>

      <DocSection
        title="Cor"
        description="A marca é tinta: os dois ativos são fill=&quot;currentColor&quot; sem classe de cor, e herdam a tinta do texto ao redor — preta no claro, branca no escuro, branca dentro do campo de marca. Nenhuma tela a recolore."
        code={`// Sobre a página: herda --foreground
<AppWordmark />

// Dentro do campo de marca: herda o color da utility, sem classe
<aside className="brand-field …">
  <AppWordmark size="lg" />
</aside>`}
        previewClassName="flex-col items-stretch gap-4 md:flex-row"
      >
        <SpecimenPanel surface="background" className="flex-1 items-start">
          <span className="text-2xs font-medium tracking-wide text-muted-foreground uppercase">
            sobre background
          </span>
          <AppWordmark size="lg" />
        </SpecimenPanel>
        <SpecimenPanel surface="card" className="flex-1 items-start">
          <span className="text-2xs font-medium tracking-wide text-muted-foreground uppercase">
            sobre card
          </span>
          <AppWordmark size="lg" />
        </SpecimenPanel>
      </DocSection>

      <DocNote title="O verde saiu, e o primário virou a tecla preta">
        <p>
          <code>--primary</code> preenche de preto (branco no escuro) e continua sendo medido contra o rótulo em cima; <code>--primary-accent</code> continua sendo a marca sobre a página. Com a marca preta os dois coincidem com <code>--foreground</code>, mas o papel não se funde: <code>text-primary</code> segue proibido, porque dentro de uma tecla no escuro ele é branco sobre branco. O arco-íris <strong>não</strong> entra no <code>primary</code> — um acento em todo botão deixa de ser acento.
        </p>
      </DocNote>

      <DocSection
        title="O arco-íris"
        description="rainbow preenche as letras com o degradê, do mesmo jeito em todo tamanho. O tamanho não decide mais nada aqui: o giro que havia em lg e xl saiu do sistema, e a marca é a mesma peça parada nos quatro degraus."
        code={`// O splash, o campo de marca
<AppWordmark size="xl" rainbow />
<AppLogo size="lg" rainbow />

// A barra
<AppWordmark size="md" rainbow />`}
        previewClassName="flex-col items-stretch gap-4"
      >
        <SpecimenPanel surface="background" className="items-start gap-6">
          <AppWordmark size="xl" rainbow />
          <AppLogo size="lg" rainbow />
        </SpecimenPanel>
        <SpecimenPanel surface="card" className="items-start">
          <AppWordmark size="md" rainbow />
        </SpecimenPanel>
      </DocSection>

      <DocNote title="Uma receita só, e por que ela é linear">
        <p>
          O degradê é <code>--brand-rainbow</code>, composto pela <code>@utility brand-rainbow-image</code> no próprio elemento (e não no <code>:root</code>, onde o ângulo congelava — rodada 88), e cada parada é um token próprio — <code>--brand-teal</code>, <code>--brand-blue</code>, <code>--brand-indigo</code>, <code>--brand-violet</code>, <code>--brand-magenta</code>, <code>--brand-coral</code>, <code>--brand-amber</code>, <code>--brand-green</code>, medidos em <code>/designsystem/colors</code>. Sete matizes em oito paradas — teal, ciano-azul e azul (um terço da rampa, para o azul não ser só a ponta), violeta, magenta, coral, âmbar, lima: a paleta do ClickUp com o coral no meio, e o verde de volta nas duas pontas por decisão do dono na rodada 84 (a 83 o tinha tirado: a primeira versão de sete paradas lia como bandeira). O verde da marca não é o verde de estado — <code>success</code> fica em 152, a lima em 130 —, com as mesmas matizes nos dois temas e a luminosidade um degrau abaixo no claro (para o preenchimento ler sobre branco) e acima no escuro. É um <code>linear-gradient</code> a 135°, <strong>parado</strong>, e ele interpola <code>in oklch shorter hue</code>. A interpolação é o conserto do fio que se via cortando o campo: em sRGB — o padrão quando o espaço não é declarado — o matiz não corre parelho, e a travessia magenta→coral gastava <strong>36,1° a cada 5%</strong> da largura contra 9,0° no azul (razão 4,01×); em oklch o pico cai para <strong>26,3°</strong>. O que não era a causa, e por isso não se mexeu: o espaçamento das paradas (razão de velocidade perceptual entre segmentos 1,29×) e o gamut (pior perda de croma 0,012). A primeira versão era cônica a partir do centro, e na tela lia como roda de cores: um gráfico de pizza, não neon.
        </p>
        <p>
          O preenchimento é uma <code>div</code> mascarada pelo próprio ativo (<code>mask-[url(/wordmark.svg)]</code>) vestindo <code>brand-rainbow</code>, em todo tamanho — e <strong>sem grão</strong>: num traço de poucos pixels ele não é textura, é sujeira na letra; o grão é do campo de marca. Houve uma versão com halo borrado atrás da letra sólida nos degraus pequenos, e ela foi rejeitada na tela: lia como desregistro de cor, não como luz.
        </p>
        <p>
          <strong>O degradê girava, e o giro saiu.</strong> Da rodada 83 à 99 o ângulo somava <code>--brand-angle</code>, animada por <code>brand-rainbow-live</code>: 12s no lockup e no símbolo em <code>lg</code>/<code>xl</code>, 6s sob o cursor no <code>Button variant=&quot;brand&quot;</code>. O dono o recusou inteiro — <em>não é uma animação que eu quero usar em nenhum lugar de site</em> — e com ele saíram <code>--brand-angle</code>, <code>@keyframes brand-rotate</code> e <code>--brand-spin</code>. O movimento da marca hoje é a <strong>lava</strong>: blobos de cor transitando dentro da caixa, que é o que o <code>primary-wash</code> faz no hover do primário desde a rodada 98 e o que a <code>@utility brand-lava</code> faz em escala de região, medida em <code>/designsystem/colors</code>.
        </p>
      </DocNote>

      <DocSection
        title="Escala"
        description="A escala do lockup é por altura; a largura vem do viewBox, e o w-auto embutido impede um w-full herdado de esticar a marca."
        previewClassName="flex-col items-stretch gap-4"
      >
        <Stack className="gap-4">
          {ESCALA.map(([size, cls, altura, largura, uso]) => (
            <div key={size} className="flex flex-wrap items-center gap-x-4 gap-y-1">
              {/* Caixa de largura fixa: sem ela cada degrau começa a coluna de
                  código num x diferente, e a tabela deixa de ler como tabela. */}
              <span className="flex w-52 shrink-0 items-center">
                <AppWordmark
                  size={size as "sm" | "md" | "lg" | "xl"}
                  rainbow
                  aria-hidden
                />
              </span>
              <code className="w-24 shrink-0 font-mono text-2xs text-foreground">
                size=&quot;{size}&quot;
              </code>
              <code className="w-24 shrink-0 font-mono text-2xs text-muted-foreground">
                {cls}
              </code>
              <span className="nums w-24 shrink-0 text-2xs text-muted-foreground">
                {altura} · {largura}
              </span>
              <span className="text-xs text-muted-foreground">{uso}</span>
            </div>
          ))}
        </Stack>
      </DocSection>

      <DocSection
        title="Em uso"
        description="O lockup se anuncia: role=&quot;img&quot; com aria-label=&quot;Finance&quot;. Quando o nome já está dito ao lado, passe aria-hidden — e se o rótulo for uma sigla, ele leva a expansão em sr-only."
        code={`// A marca se apresentando sozinha — ela é o texto acessível
<AppWordmark />

// Assinatura de seção: marca em arco-íris, fio, sigla na serifa da marca
<Link href="/designsystem">
  <AppWordmark rainbow className="shrink-0" aria-hidden />
  <Separator orientation="vertical" />
  <span className="font-display text-lg leading-none">DS</span>
  <span className="sr-only">Design system</span>
</Link>`}
        previewClassName="flex-col items-stretch gap-4"
      >
        <SpecimenPanel surface="background">
          <AppWordmark />
        </SpecimenPanel>
        <SpecimenPanel surface="background">
          <span className="flex items-center gap-2.5">
            <AppWordmark rainbow className="shrink-0" aria-hidden />
            <Separator orientation="vertical" />
            <span className="font-display text-lg leading-none text-foreground">
              DS
            </span>
          </span>
        </SpecimenPanel>
      </DocSection>

      <DocNote title="A sigla do catálogo usa a serifa abaixo de 24px">
        <p>
          A Ledger não desce abaixo de 24px, e o &ldquo;DS&rdquo; do cabeçalho deste catálogo abre exceção a 18px: na mesma serifa do lockup, sigla e marca leem como uma assinatura só. Duas maiúsculas não têm descendente nem palavra para se perder, que é o que a regra protege.
        </p>
      </DocNote>

      <DocSection
        title="O nome como texto"
        description="Onde não cabe SVG — assunto de e-mail, título de janela, texto puro — o nome se escreve com .wordmark: Ledger, no corpo de display. É a única forma escrita do nome; não improvise Inter ao lado da arte."
        code={`<span className="wordmark text-lg">Finance</span>`}
      >
        <span className="wordmark text-lg text-foreground">Finance</span>
      </DocSection>

      <DocSection
        title="O campo de marca"
        description="O arco-íris ocupando uma região inteira, com grão pesado e vinheta para o preto. A @utility brand-field é um cartão — cantos e um fio por dentro — e o que se lê dentro dele vive em Card, que segue o tema. Nenhum texto corrido mora direto sobre o arco-íris."
        code={`// O painel das telas de acesso
<aside className="brand-field flex flex-col rounded-2xl p-6">
  {/* herda o color do campo: branco, sem classe */}
  <AppWordmark size="lg" className="self-start" />
  <Card variant="elevated" padding="none">
    <CardToolbar variant="title">Carteira</CardToolbar>
    …
  </Card>
</aside>`}
        previewClassName="flex-col items-stretch"
      >
        <div className="brand-field flex min-h-56 flex-col justify-between gap-6 rounded-2xl p-6">
          <AppWordmark size="lg" className="self-start" />
          <Card variant="elevated" padding="none" className="max-w-xs">
            <CardToolbar variant="title">Carteira</CardToolbar>
            <CardContent className="px-(--card-strip-px) pb-2">
              <Muted>saldo deste mês</Muted>
              <MoneyDisplay value={4182.6} size="2xl" />
            </CardContent>
            <CardNote>Números de exemplo.</CardNote>
          </Card>
        </div>
      </DocSection>

      <DocNote title="A utility não redefine token nenhum, e isso foi medido">
        <p>
          O campo verde redefinia <code>--foreground</code>, <code>--muted-foreground</code> e <code>--border</code> no contêiner para os filhos chegarem com a tinta invertida. Sobre o arco-íris a jogada se inverte contra ela mesma: o override de <code>--foreground</code> desceu pelo <code>Card</code> hospedado e o saldo saiu <strong>branco sobre o cartão branco</strong> — <code>MoneyDisplay</code> é <code>text-foreground</code>. O campo declara só <code>color</code>, que o lockup herda por <code>currentColor</code>; o fio é <code>box-shadow</code> interno pela mesma razão, para não chegar à borda dos cartões.
        </p>
        <p>
          Sete matizes não têm um contraste só. É por isso que o secundário do campo (<code>--brand-field-muted-foreground</code>) deixou de existir: não há mais texto a tingir sobre ele.
        </p>
      </DocNote>

      <DocNote title="O grão é pesado de propósito, e o método de medir é o de sempre">
        <p>
          O <code>feTurbulence</code> do campo verde com os três números mudados: <code>baseFrequency</code> 0,75 (mais baixo é grão mais graúdo, de filme), <code>slope</code> 1 (a compressão protegia texto sobre painel escuro, e aqui não há texto sobre o grão) e alfa 0,85 no claro, 0,75 no escuro, em <code>overlay</code> sobre o degradê. <strong>A ordem das camadas é o grão existir ou não</strong>: a primeira versão o punha embaixo do arco-íris opaco e ele sumia — medido, σ idêntico com e sem grão. O método também mudou: desvio-padrão da diferença entre pixels vizinhos, porque o degradê varia ~15 unidades ao longo do retalho e afogava a textura na luminância crua. Os números e o script (<code>scripts/brand-grain-ab.mjs</code>) moram em <code>globals.css</code>, e só lá — σ sem método não compara.
        </p>
      </DocNote>

      <DocSection
        title="O botão de marca"
        description="variant=&quot;brand&quot; é a tecla do primary com o arco-íris em volta: um contorno de 1px e um halo borrado atrás. Sob o cursor o halo acende e o preenchimento troca de --brand-fill; o giro saiu do sistema na rodada 100. Um por tela, para o CTA de marca — entrar, começar. O link não tem traço em repouso: no cursor um sublinhado de arco-íris entra pela esquerda, e recolhe para a direita na saída."
        code={`<Button variant="brand" size="xl">entrar</Button>
<Button variant="link">esqueceu a senha?</Button>`}
        previewClassName="items-center gap-6"
      >
        <Button variant="brand" size="xl">entrar</Button>
        <Button variant="link">esqueceu a senha?</Button>
      </DocSection>

      <DocSection
        title="Os controles de escolha"
        description="Checkbox, Radio e o cartão do RadioGroup vestem a marca por contorno, e só quando marcados — desmarcados eles são pixel a pixel os do sistema. O halo do botão não vem junto: nos dois átomos o ::after já é o alvo de toque de 44px, então sobra o contorno, como no brandOutline. Uma por tela."
        code={`<Checkbox variant="brand" defaultChecked />

<RadioGroup variant="brandCard" defaultValue="pro">
  <RadioGroupItem value="pro" description="Carteiras ilimitadas.">
    Pro — R$ 29/mês
  </RadioGroupItem>
</RadioGroup>`}
        previewClassName="flex-col items-stretch gap-4"
      >
        <div className="flex items-center gap-2">
          <Checkbox id="ds-brand-cb" variant="brand" defaultChecked />
          <Label htmlFor="ds-brand-cb">Aceito os termos</Label>
        </div>
        <RadioGroup
          variant="brandCard"
          defaultValue="pro"
          className="w-full max-w-sm"
        >
          <RadioGroupItem value="free" description="Uma carteira, sem histórico.">
            Grátis
          </RadioGroupItem>
          <RadioGroupItem
            value="pro"
            description="Carteiras ilimitadas e relatórios."
          >
            Pro — R$ 29/mês
          </RadioGroupItem>
        </RadioGroup>
      </DocSection>

      <DocNote title="O contorno esmaece, e o conteúdo não pousa no degradê">
        <p>
          Quem liga e desliga a marca é uma <strong>opacidade</strong>, e não a troca da camada: <code>background-image</code> não interpola entre um degradê e <code>none</code>, então pintar e despintar faria o contorno estalar. O miolo é chapado — <code>--primary</code> na caixa, <code>--background</code> no anel, <code>--card</code> no cartão —, então o tique continua branco sobre a tecla e o ponto continua <code>--primary-accent</code> sobre a página: <strong>o mesmo contraste dos controles do sistema</strong>. O degradê só aparece por 1px de borda, e arco-íris sob texto continua proibido.
        </p>
      </DocNote>

      <DocNote title="O que não fazer">
        <p>
          Recolorir o lockup: ele herda a tinta do texto. Arco-íris fora da marca — num chip, num gráfico, num fundo de cartão. Texto corrido direto sobre o campo de marca. Halo ou sombra colorida atrás da letra: foi medido e rejeitado. Colar o <code>AppLogo</code> ao lado do lockup, escrevendo a inicial duas vezes. Declarar <code>width</code> junto de <code>height</code>: a proporção é do traçado.
        </p>
      </DocNote>
    </>
  )
}
