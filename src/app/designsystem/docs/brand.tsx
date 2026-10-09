"use client"


import { AppLogo } from "@/components/layout/app-logo"
import { AppWordmark } from "@/components/layout/app-wordmark"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import { AnnouncementBar } from "@/components/ui/announcement-bar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent, CardNote, CardToolbar } from "@/components/ui/card"
import { Code } from "@/components/ui/code"
import { MoneyDisplay } from "@/components/ui/money-display"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { Slider } from "@/components/ui/slider"
import { Muted } from "@/components/ui/typography"
import { DocNote, DocSection, Usage } from "../ds-doc"
import { Group, Spec, SpecChips, SpecList, SpecRow, SpecRowDescription, SpecimenPanel, Stack } from "../ds-kit"

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

/**
 * Onde o arco-íris mora, por mecanismo. Cada família mantém o degradê longe do
 * que se lê de um jeito diferente, e é por isso que elas não se misturam. As
 * peças são as que vestem a marca hoje — contadas no código, não desejadas.
 */
const FAMILIAS = [
  { nome: "Letra", como: "o degradê preenche o traçado, parado, em todo tamanho", who: ["AppWordmark rainbow", "AppLogo rainbow", "EmptyStateCode"] },
  { nome: "Preenchimento", como: "o degradê é o trilho e a barra o revela — sem rótulo em cima", who: ["Progress brand", "Slider brand", "HistogramSlider brand"] },
  { nome: "Brilho", como: "só um arco da borda acende perto do ponteiro — o meio nunca é pintado; sem ele, a caixa é neutra", who: ["Alert brand", "Card brand", "Badge brand", "Button brand", "Checkbox brand", "Radio brand", "RadioGroupItem brandCard", "a busca do catálogo"] },
  { nome: "Degradê", como: "cinco paradas florescem do centro da tecla, só no cursor e no toque; em repouso, preto chapado", who: ["Button brandColorful"] },
  { nome: "Deslize", como: "o arco-íris na borda de baixo e brilhando embaixo da tecla, deslizando em 2s — sempre aceso", who: ["Button brandOutline"] },
  { nome: "Véu", como: "translúcido atrás do texto, deslizando em 20s — a exceção sob texto", who: ["AnnouncementBar brand"] },
  { nome: "Lava", como: "blobos de cor transitando dentro da região", who: ["brand-lava"] },
  { nome: "Campo", como: "a região inteira, com grão e vinheta; o texto mora em Card", who: ["brand-field", "as telas de acesso"] },
  { nome: "Feixe", como: "uma linha que corre pela base do campo vazio, esperando a digitação", who: ["CommandDialog"] },
]

export default function BrandDoc() {
  return (
    <>
      <Usage>
        A marca é <strong>preta</strong> — branca no escuro — e o arco-íris é a única cor dela, reservada a ela. Duas peças, escolhidas pela forma do espaço: numa linha, o <strong>lockup</strong> (<code>AppWordmark</code>); num quadrado, o <strong>símbolo</strong> (<code>AppLogo</code>). O primário do sistema é a mesma tecla preta, e o arco-íris <strong>não</strong> entra nele: um acento em todo botão deixa de ser acento.
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
        title="Escala"
        description="A escala do lockup é por altura; a largura vem do viewBox, e o w-auto embutido impede um w-full herdado de esticar a marca."
        previewClassName="flex-col items-stretch gap-4"
      >
        <Stack className="gap-4">
          {ESCALA.map(([size, cls, altura, largura, uso]) => (
            <div
              key={size}
              className="grid items-center gap-x-4 gap-y-2 sm:grid-cols-[13rem_minmax(0,1fr)]"
            >
              {/* Coluna de largura fixa: sem ela cada degrau começa o texto
                  num x diferente, e a tabela deixa de ler como tabela. */}
              <span className="flex items-center">
                <AppWordmark
                  size={size as "sm" | "md" | "lg" | "xl"}
                  rainbow
                  aria-hidden
                />
              </span>
              <div className="flex min-w-0 flex-col">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <Code variant="inline">size=&quot;{size}&quot;</Code>
                  <Code>{cls}</Code>
                  <span className="nums text-2xs text-muted-foreground">
                    {altura} · {largura}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">{uso}</span>
              </div>
            </div>
          ))}
        </Stack>
      </DocSection>

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

      <Group
        title="Onde o arco-íris mora"
        description="Nove famílias, e cada uma tem um mecanismo que mantém o degradê longe do que se lê. Fora delas o arco-íris não entra: nem em chip, nem em gráfico, nem em fundo de cartão."
        layout="flow"
      >
        <Spec title="Família → peças" meta="--brand-rainbow" className="mb-0" bodyClassName="p-0">
          <SpecList>
            {FAMILIAS.map((f) => (
              <SpecRow key={f.nome} term={f.nome}>
                <SpecRowDescription>{f.como}</SpecRowDescription>
                <SpecChips items={f.who} />
              </SpecRow>
            ))}
          </SpecList>
        </Spec>
      </Group>

      <DocSection
        title="O arco-íris na letra"
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

      <DocNote title="Uma receita só: linear, parada e em oklch">
        <p>
          O degradê é <code>--brand-rainbow</code>, um <code>linear-gradient</code> a 135° com oito paradas — cada uma um token <code>--brand-*</code>, medido em <code>/designsystem/colors</code> —, composto no próprio elemento pela <code>@utility brand-rainbow-image</code>. Ele interpola <code>in oklch shorter hue</code>: em sRGB a travessia magenta→coral corria 4× mais rápido que o azul e desenhava um fio no campo. <strong>Não gira</strong>: o giro foi recusado na rodada 100; o movimento da marca é a lava. O primário veste cinco paradas dele — teal, azul, violeta, magenta e coral —, borradas por dentro da tecla, e só no cursor. Na letra não há grão — num traço de poucos pixels ele é sujeira —, e o grão é do campo.
        </p>
      </DocNote>

      <DocSection
        title="O campo de marca"
        description="O arco-íris ocupando uma região inteira, com grão pesado e vinheta para o preto. A @utility brand-field é um cartão — cantos e um fio por dentro — e o que se lê dentro dele vive em Card, que segue o tema. Nenhum texto corrido mora direto sobre o arco-íris."
        code={`// O painel das telas de acesso
<aside className="brand-field flex flex-col rounded-modal p-6">
  {/* herda o color do campo: branco, sem classe */}
  <AppWordmark size="lg" className="self-start" />
  <Card variant="elevated" padding="none">
    <CardToolbar variant="title">Carteira</CardToolbar>
    …
  </Card>
</aside>`}
        previewClassName="flex-col items-stretch"
      >
        <div className="brand-field flex min-h-56 flex-col justify-between gap-6 rounded-modal p-6">
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
        description="variant=&quot;brand&quot; é o CTA de marca neutro: a borda acende em arco-íris conforme o ponteiro se aproxima — passe o mouse perto. brandColorful é a tecla preta em que o degradê da marca floresce do centro no cursor. brandOutline é a tecla preta com o arco-íris deslizando na borda de baixo e um brilho embaixo, sempre aceso. Um por tela, para entrar e começar. O link não tem traço em repouso: no cursor um sublinhado de arco-íris entra pela esquerda, e recolhe para a direita na saída."
        code={`<Button variant="brand" size="xl">entrar</Button>
<Button variant="brandColorful" size="xl">continuar</Button>
<Button variant="brandOutline" size="xl">começar</Button>
<Button variant="link">esqueceu a senha?</Button>`}
        previewClassName="items-center gap-6"
      >
        <Button variant="brand" size="xl">entrar</Button>
        <Button variant="brandColorful" size="xl">continuar</Button>
        <Button variant="brandOutline" size="xl">começar</Button>
        <Button variant="link">esqueceu a senha?</Button>
      </DocSection>

      <DocSection
        title="O chip de marca"
        description="O Badge é da família do brilho: um chip neutro cuja borda acende em arco-íris conforme o ponteiro se aproxima — passe o mouse perto. Para o que é do produto — Beta, Novo, Pro —, nunca para um dado da pessoa."
        code={`<Badge variant="brand">Beta</Badge>`}
      >
        <Badge variant="brand">Beta</Badge>
        <Badge variant="brand" size="sm">
          Novo
        </Badge>
      </DocSection>

      <DocSection
        title="Os controles de escolha"
        description="Os três vestem o brilho: a borda acende conforme o ponteiro se aproxima, marcada ou não, e longe dele eles são os do sistema, pixel a pixel. Passe o mouse perto. Nenhum tem halo: nos dois átomos o ::after já é o alvo de toque de 44px. Uma por tela."
        code={`<Checkbox variant="brand" defaultChecked />

<RadioGroup variant="brandCard" defaultValue="slice">
  <RadioGroupItem value="slice" description="Só o valor e a data desta.">
    Esta parcela
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
          defaultValue="slice"
          className="w-full max-w-sm"
        >
          <RadioGroupItem value="slice" description="Só o valor e a data desta.">
            Esta parcela
          </RadioGroupItem>
          <RadioGroupItem
            value="plan"
            description="Descrição, categoria e as parcelas futuras."
          >
            Plano da compra
          </RadioGroupItem>
        </RadioGroup>
      </DocSection>

      <DocNote title="Só a borda acende, e o conteúdo não pousa no degradê">
        <p>
          A máscara do brilho recorta o anel: o miolo é o fundo real de cada peça, então o tique continua branco sobre a tecla, o ponto continua <code>--primary-accent</code> sobre a página e o cartão selecionado mantém o seu realce — <strong>o mesmo contraste dos controles do sistema</strong>. A família do contorno, que acendia só marcada sobre um miolo chapado, teve cinco peças e perdeu a última na rodada 169. Arco-íris sob texto continua proibido.
        </p>
      </DocNote>

      <DocSection
        title="O preenchimento"
        description="Na barra, o arco-íris é o trilho e o valor o revela: a 8% só se vê o teal, e a marca só fica inteira com a barra cheia. Serve a progresso sem limiar — onde há risco, a cor é estado e o eixo é bands."
        code={`<Progress variant="brand" value={64} />
<Slider variant="brand" defaultValue={[40]} max={100} aria-label="Meta" />`}
        previewClassName="flex-col items-stretch gap-5"
      >
        <Progress variant="brand" value={64} aria-label="Progresso de exemplo" />
        <Slider variant="brand" defaultValue={[40]} max={100} aria-label="Meta de exemplo" />
      </DocSection>

      <DocSection
        title="O véu e o brilho dos avisos"
        description="Alert e AnnouncementBar são as duas superfícies onde o produto fala sobre si mesmo, e a marca entra nelas de dois jeitos. Na faixa é o véu: o arco-íris translúcido atrás do texto, saindo do topo central e deslizando em 20s, no lugar do fio do sticky. No alerta é o brilho: a caixa fica neutra em repouso e o arco-íris acende num arco da borda conforme o ponteiro passa, com um leve borrão — passe o mouse perto. O mesmo brilho veste o Card brand, com o anel dentro da borda (@utility brand-glow e useBrandGlow). Contorno não serve em nenhum dos dois: numa faixa full-bleed ele degenera, e em volta de um parágrafo lê como enfeite. Nenhuma das duas aceita tone. Uma por tela."
        code={`<Alert variant="brand">…</Alert>
<AnnouncementBar variant="brand" position="sticky">…</AnnouncementBar>`}
        previewClassName="flex-col items-stretch gap-4 p-0"
      >
        <AnnouncementBar variant="brand">
          Uma nova versão está disponível. Recarregue para atualizar.
        </AnnouncementBar>
        <div className="px-4 pb-4">
          <Alert variant="brand">
            <AlertTitle>O total agora considera as parcelas</AlertTitle>
            <AlertDescription>
              Compras parceladas entram no mês em que cada parcela cai.
            </AlertDescription>
          </Alert>
        </div>
      </DocSection>

      <DocNote title="O brilho não é o giro que foi recusado">
        <p>
          A rodada 100 tirou o movimento da marca com nome feio — o degradê girava sozinho, num laço de 12s no splash e 6s sob o cursor. <strong>Este efeito não é aquele</strong>: nada aqui se move sem o ponteiro se mover, que é a forma que a rodada 98 sancionou quando pôs a lava atrás do <code>primary</code>. O que o commit da 100 preservou foi exatamente isto — &ldquo;o botão de marca não ficou inerte: o halo continua acendendo no cursor&rdquo;.
        </p>
        <p>
          Contraste, contra o cartão: no escuro as oito paradas passam 3:1 (pior caso violeta 5,35); no claro quatro reprovam, pior caso lima <strong>1,91</strong>. Não é um caso de 1.4.11: quem identifica o aviso é a caixa mais o ícone, e o arco-íris é acento, como o halo do <code>Badge</code> e o arco-íris do <code>Progress</code>. No brilho o degradê nunca fica sob texto: a máscara recorta só o anel, e o meio da caixa nunca é pintado. O véu da faixa é a <strong>exceção consciente</strong>: ali o arco-íris fica sob o texto, e quem paga é o alfa <code>--brand-flow-alpha</code> (0,75 no claro, 0,45 no escuro), medido contra o <code>--foreground</code> no alfa máximo da máscara — pior caso <strong>5,33</strong> (lima, escuro), em <code>scripts/tone-contrast.mjs</code>.
        </p>
      </DocNote>

      <DocNote title="O mecanismo do brilho: a cor fica parada, quem anda é a janela">
        <p>
          É o que faz o arco <strong>trocar de cor</strong> conforme viaja pela borda — na aresta direita ele sai oliva e âmbar, na esquerda magenta. O <code>background</code> do pseudo é um <code>repeating-conic-gradient</code> de ângulo <em>fixo</em>, e quem carrega <code>--brand-glow-start</code> é a máscara, como no bundle ao vivo da referência (o <code>GlowingEffect</code> da Aceternity). A máscara recorta o anel em duas camadas: a janela menos a <code>padding-box</code> (<code>subtract</code>). Eram três até a rodada 181, e o Chrome deixava o anel inteiro bem fino do lado oposto ao arco; até a 155 havia um núcleo chapado no lugar do recorte, e a janela, que sai do centro, o mostrava como um feixe escuro.
        </p>
        <p>
          <strong>Duas tentativas erradas vieram antes, e elas se opõem.</strong> A primeira mascarava o <code>--brand-rainbow</code>, que é linear, e a janela acendia sempre a mesma cor naquela aresta; a segunda girou o cônico junto com o arco, que passou a carregar sempre a mesma sequência e só mudar de lugar. <code>brand-contour.test.ts</code> separa o certo dos dois erros.
        </p>
        <p>
          <strong>O volume mora num token</strong>, <code>--brand-glow-opacity</code> (0,5), e o arco tem envelope de alfa: as pontas entram em 20% e 60% antes do miolo opaco. Mexer nas paradas mudaria a cor, que é o que ele tem de certo.
        </p>
      </DocNote>

      <DocNote title="O ponteiro: rolagem, um quadro por rajada, e isolate">
        <p>
          <strong>A rolagem recalcula o estado</strong>, não só a geometria: rolando 260px com o mouse parado, a caixa ia de <code>top 255</code> para <code>-5</code> e o brilho continuava aceso apontando para onde o ponteiro não estava. O hook guarda a última posição e refaz a conta em <code>scroll</code> (com <code>capture: true</code>, que pega a rolagem dentro de um container — um caso que a referência erra) e em <code>resize</code>.
        </p>
        <p>
          <strong>O <code>rAF</code> coalesce, e o proibido é o laço</strong>: cada rajada de <code>pointermove</code> vira um quadro, cancelado no seguinte e no unmount. O que esta casa recusou, no marcador do <code>Tabs</code>, é o <code>rAF</code> que se re-agenda para fazer polling. É ele que torna barato ler <code>getBoundingClientRect()</code> a cada quadro — a caixa também se move por reflow.
        </p>
        <p>
          <strong><code>isolate</code> é obrigatório</strong>: sem ele o pseudo de <code>z</code> negativo cai atrás do fundo de um ancestral e some. Com ele o pseudo pinta por cima do fundo da peça, e é a máscara, que recorta só o anel, que mantém o texto fora do degradê. <code>--brand-glow-start</code> não é registrada (<code>@property</code>): ela foi, por três rodadas, e quem anima o ângulo hoje é o tween do <code>motion</code>.
        </p>
      </DocNote>

      <DocNote title="O que não fazer">
        <p>
          Recolorir o lockup: ele herda a tinta do texto. Arco-íris fora das dez famílias — num chip de dado, num gráfico, num fundo de cartão. Moldura de arco-íris em volta de um parágrafo: em bloco de texto a marca entra pelo brilho na borda, que só acende com o ponteiro. Texto corrido direto sobre o campo de marca. Halo ou sombra colorida atrás da letra: foi medido e rejeitado. Colar o <code>AppLogo</code> ao lado do lockup, escrevendo a inicial duas vezes. Declarar <code>width</code> junto de <code>height</code>: a proporção é do traçado. E duas peças de marca na mesma tela: acento repetido deixa de ser acento.
        </p>
      </DocNote>
    </>
  )
}
