"use client"

import {
  Carousel,
  CarouselContent,
  CarouselDots,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  CarouselStatus,
} from "@/components/ui/carousel"
import { Card, CardContent } from "@/components/ui/card"
import { MoneyDisplay } from "@/components/ui/money-display"
import { Caption, Muted } from "@/components/ui/typography"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

const CARTOES = [
  { nome: "Nubank", fatura: 1482.3 },
  { nome: "Itaú", fatura: 894.15 },
  { nome: "Inter", fatura: 320.0 },
  { nome: "C6", fatura: 0 },
]

const MESES = [
  { mes: "Abril", saldo: 2140.9 },
  { mes: "Maio", saldo: -318.44 },
  { mes: "Junho", saldo: 1875.0 },
  { mes: "Julho", saldo: 640.2 },
  { mes: "Agosto", saldo: -92.15 },
  { mes: "Setembro", saldo: 3010.75 },
]

function CartaoFatura({ nome, fatura }: { nome: string; fatura: number }) {
  return (
    <Card>
      <CardContent>
        <Caption>{nome}</Caption>
        <MoneyDisplay value={fatura} size="lg" tone="expense" />
      </CardContent>
    </Card>
  )
}

/**
 * O item das demonstrações de superfície: **sem `Card`**.
 *
 * `variant="card"` e `variant="inset"` já são a moldura, e cartão dentro de
 * cartão é sempre errado — é o que a nota logo abaixo daquela seção diz. Um
 * catálogo que demonstra o contrário do que ensina é o defeito que esta base
 * já achou várias vezes.
 */
function TiraMes({ mes, saldo }: { mes: string; saldo: number }) {
  return (
    <div className="flex h-full flex-col justify-center">
      <Caption>{mes}</Caption>
      <MoneyDisplay
        value={saldo}
        size="lg"
        tone={saldo < 0 ? "expense" : "income"}
      />
    </div>
  )
}

export default function CarouselDoc() {
  return (
    <>
      <Usage>
        Itens de mesma importância que deslizam. Nunca para conteúdo que precisa
        ser comparado — o que está fora da tela não se compara.
      </Usage>

      <DocSection
        title="Padrão"
        description="Setas dentro da caixa, indicador e contagem. As três peças são opcionais e independentes."
        code={`<Carousel>
  <CarouselContent>
    <CarouselItem className="basis-2/3 sm:basis-1/2">…</CarouselItem>
  </CarouselContent>
  <CarouselPrevious />
  <CarouselNext />
</Carousel>
<CarouselDots />`}
      >
        <Carousel className="w-full">
          <CarouselContent>
            {CARTOES.map((c) => (
              <CarouselItem key={c.nome} className="basis-2/3 sm:basis-1/2">
                <CartaoFatura {...c} />
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
          <CarouselDots className="mt-3" />
        </Carousel>
      </DocSection>

      <DocNote title="O componente nunca desenha fora da própria caixa">
        As setas eram <code>-left-12</code> e <code>-right-12</code>: 48px para
        fora da região, buscados num pai que nunca prometeu tê-los. Medido nesta
        página, num contêiner de 958px, <strong>8px de cada seta ficavam fora do
        recorte</strong>, o pai ganhava 8px de rolagem horizontal fantasma
        (<code>scrollWidth</code> 966 contra <code>clientWidth</code> 958) e um
        pedaço da seta seguinte não respondia ao clique.
        <br />
        Hoje <code>inside</code> pousa a seta sobre a borda do viewport e{" "}
        <code>outside</code> <strong>reserva a própria calha</strong> —{" "}
        <code>px-12</code> na raiz, seta em <code>left-0</code>. A distância
        visual é a mesma de antes; o que mudou é quem paga por ela.
      </DocNote>

      <DocSection
        title="Superfície"
        description={
          <>
            <code>variant</code> decide o que a raiz pinta. <code>card</code> e{" "}
            <code>inset</code> forçam <code>controls=&quot;inside&quot;</code>:
            uma superfície pintada não tem controle flutuando fora dela.
          </>
        }
        code={`<Carousel variant="card">…</Carousel>
<Carousel variant="inset">…</Carousel>`}
        previewClassName="flex-col items-stretch gap-6"
      >
        <div className="flex w-full flex-col gap-6">
          {(["plain", "card", "inset"] as const).map((v) => (
            <div key={v} className="flex flex-col gap-2">
              <Caption className="font-mono">variant=&quot;{v}&quot;</Caption>
              <Carousel variant={v} className="w-full">
                <CarouselContent>
                  {MESES.map((m) => (
                    <CarouselItem key={m.mes} className="basis-1/2 sm:basis-1/3">
                      <TiraMes {...m} />
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
              </Carousel>
            </div>
          ))}
        </div>
      </DocSection>

      <DocNote title="Nenhuma das superfícies recorta">
        <code>card</code> e <code>inset</code> não declaram{" "}
        <code>overflow-hidden</code>. Ela não é necessária — o recuo da raiz já
        mantém os itens dentro do raio, e o viewport recorta o trilho —, e
        declará-la cortaria o anel de foco de 3px das setas contra a borda.
        <br />
        E <code>card</code> não é para carrossel de cartão: cartão dentro de
        cartão é sempre errado. Ele é para uma tira de imagem, de gráfico ou de
        texto que precisa de uma moldura própria.
      </DocNote>

      <DocSection
        title="Controles"
        description={
          <>
            Onde a seta pousa, e se ela existe. No toque quem navega é o gesto —
            mas a seta <strong>continua visível</strong>, e isso é norma, não
            gosto: a WCAG 2.5.7 exige uma alternativa sem arraste para toda ação
            que depende de arrastar. Some as setas no telefone e o carrossel
            passa a ter o deslize como único caminho.
          </>
        }
        code={`<Carousel controls="inside">…</Carousel>   {/* o padrão */}
<Carousel controls="outside">…</Carousel>  {/* reserva px-12 na raiz */}
<Carousel controls="none">…</Carousel>     {/* gesto e pontos */}`}
        previewClassName="flex-col items-stretch gap-6"
      >
        <div className="flex w-full flex-col gap-6">
          {(["inside", "outside", "none"] as const).map((c) => (
            <div key={c} className="flex flex-col gap-2">
              <Caption className="font-mono">controls=&quot;{c}&quot;</Caption>
              <Carousel controls={c} className="w-full">
                <CarouselContent>
                  {CARTOES.map((card) => (
                    <CarouselItem
                      key={card.nome}
                      className="basis-2/3 sm:basis-1/2"
                    >
                      <CartaoFatura {...card} />
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
                {c === "none" ? <CarouselDots className="mt-3" /> : null}
              </Carousel>
            </div>
          ))}
        </div>
      </DocSection>

      <DocNote title="A seta cresce por pseudo-elemento; o ponto cresce de verdade">
        A seta é <code>icon-sm</code> (28) e cresce no toque com{" "}
        <code>pointer-coarse:after:-inset-2.5</code>, sem mexer na caixa — a
        saída do <code>PageHeaderBack</code> e do × da{" "}
        <code>AnnouncementBar</code>. Ela é segura aqui porque{" "}
        <strong>as duas setas ficam em pontas opostas</strong>.
        <br />
        <strong>A conta não é 28 + 2×inset</strong>, e isso é medido: o bloco que
        contém um absoluto é a <strong>caixa de padding</strong> do ancestral,
        que desconta a borda — o <code>Button</code> tem 1px, então a base são
        26, e <code>-inset-2</code> fecha em <strong>42</strong>, abaixo do
        piso. Com <code>2.5</code> o alvo mede <strong>46</strong>, e 44 é piso,
        não teto.
        <br />
        Numa fileira de alvos adjacentes o pseudo-elemento seria errado: um{" "}
        <code>::after</code> de 44px em cada ponto engoliria o vizinho. Por isso
        o <code>CarouselDots</code> faz o que a <code>Pagination</code> já fazia
        — o botão <em>é</em> a área de toque (24×44, medido, sem sobreposição), e
        o ponto é o filho que ele centraliza.
      </DocNote>

      <DocNote title="A seta não tem fundo em repouso, e isso é convergência">
        Ela é <code>Button variant=&quot;tertiary&quot;</code> nos dois modos:
        nada em repouso, fundo no cursor <strong>e no toque</strong>. O raio é o
        do próprio <code>Button</code> — <code>rounded-lg</code>, 10px —, e não
        um círculo.
        <br />
        Não é exceção: das três famílias de seta da casa, o{" "}
        <code>Calendar</code> e a <code>Pagination</code> já eram{" "}
        <code>tertiary</code> + <code>rounded-lg</code>. Esta era{" "}
        <strong>a única seta arredondada em círculo do repositório, e a única
        com fundo em repouso</strong>. Com um peso só, a função que escolhia
        entre dois pesos deixou de existir, e <code>controls</code> voltou a
        decidir só a posição.
        <br />O par <code>active:</code> entrou na origem, em{" "}
        <code>button.tsx</code>: <code>hover:</code> compila dentro de{" "}
        <code>@media (hover: hover)</code>, então sem ele a seta não acenderia
        no telefone — e o mesmo valia para toda tela que usa{" "}
        <code>tertiary</code>.
      </DocNote>

      <DocNote title="Posição é layout, não estado — ela não transiciona">
        A seta é ancorada em <code>top-(--carousel-control-y)</code>, uma
        variável que o JS mede, e a base do <code>Button</code> declara{" "}
        <code>transition-all</code>. As duas juntas faziam{" "}
        <strong>toda remedição virar uma animação</strong> da seta atravessando
        o cartão — e remedição acontece quando a fonte carrega, quando os pontos
        aparecem e a cada redimensionamento.
        <br />
        Somava-se o palpite: o <code>cva</code> declara <code>50%</code> antes de
        haver caixa para medir, e <code>top: 50%</code> resolve contra a{" "}
        <strong>raiz</strong>, que inclui pontos e contagem. Medido — raiz
        111px, logo 55, contra os 37,5 do centro do trilho:{" "}
        <strong>17,5px percorridos animadamente</strong> na primeira pintura.
        <br />
        São dois consertos, e nenhum sozinho fecha o caso: o{" "}
        <strong>layout effect</strong> mata a viagem da primeira pintura, e{" "}
        <code>transition-colors</code> — que substitui o{" "}
        <code>transition-all</code> pelo <code>twMerge</code>, por serem o mesmo
        grupo — mata a das remedições, que efeito nenhum alcança.
      </DocNote>

      <DocSection
        title="Calha"
        description={
          <>
            <code>gap</code> é a distância entre itens: margem negativa no
            trilho mais recuo no item, e não <code>gap</code> no flex —{" "}
            <code>gap</code> entraria na conta de <code>basis-*</code>, e dois
            itens de <code>basis-1/2</code> deixariam de caber em 100%.
          </>
        }
        code={`<Carousel gap="none">…</Carousel>
<Carousel gap="sm">…</Carousel>
<Carousel gap="md">…</Carousel>  {/* o padrão */}
<Carousel gap="lg">…</Carousel>`}
        previewClassName="flex-col items-stretch gap-6"
      >
        <div className="flex w-full flex-col gap-6">
          {(["none", "sm", "md", "lg"] as const).map((g) => (
            <div key={g} className="flex flex-col gap-2">
              <Caption className="font-mono">gap=&quot;{g}&quot;</Caption>
              <Carousel gap={g} controls="none" className="w-full">
                <CarouselContent>
                  {MESES.map((m) => (
                    <CarouselItem key={m.mes} className="basis-1/3 sm:basis-1/4">
                      <Card>
                        <CardContent>
                          <Caption>{m.mes}</Caption>
                          <MoneyDisplay
                            value={m.saldo}
                            size="sm"
                            tone={m.saldo < 0 ? "expense" : "income"}
                          />
                        </CardContent>
                      </Card>
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>
            </div>
          ))}
        </div>
      </DocSection>

      <DocSection
        title="Dissolução"
        description={
          <>
            <strong>É o padrão.</strong> As duas pontas dissolvem conforme o
            trilho anda: a borda em seco lê como lista terminada, a rampa diz
            que há mais, e ela some sozinha nos extremos. É também o que
            sustenta a seta sem fundo — sem preenchimento o glifo pousa direto
            sobre o conteúdo, e a rampa é o chão dele. <code>fade={"{false}"}</code>{" "}
            desliga.
          </>
        }
        code={`<Carousel controls="none">        {/* fade já vem ligado */}
  <CarouselContent>…</CarouselContent>
</Carousel>

<Carousel fade={false}>…</Carousel>  {/* para desligar */}`}
      >
        <Carousel controls="none" className="w-full">
          <CarouselContent>
            {MESES.map((m) => (
              <CarouselItem key={m.mes} className="basis-1/3 sm:basis-1/5">
                <Card>
                  <CardContent>
                    <Caption>{m.mes}</Caption>
                    <MoneyDisplay
                      value={m.saldo}
                      size="sm"
                      tone={m.saldo < 0 ? "expense" : "income"}
                    />
                  </CardContent>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </DocSection>

      <DocNote title="A rampa é a do sistema; o motor é próprio, e o motivo é medido">
        <code>useScrollFade</code> lê <code>scrollLeft</code>, e{" "}
        <strong>o embla translada o trilho</strong>: medido, o viewport fica com{" "}
        <code>scrollLeft: 0</code> enquanto o <code>scrollWidth</code> é 1476
        contra 730 de <code>clientWidth</code>. O hook reportaria início 0 e fim
        746 para sempre — a ponta esquerda nunca acenderia.
        <br />
        A rampa continua sendo <code>scroll-fade-x</code>, de{" "}
        <code>globals.css</code>; só o motor é daqui, publicando{" "}
        <code>--scroll-fade-start/end</code> a partir de{" "}
        <code>api.scrollProgress()</code>. As invariantes valem: a máscara vai
        no viewport, que <strong>não desenha nada</strong>, e quem pinta é a
        raiz. As setas são irmãs do viewport, então a máscara não as alcança.
      </DocNote>

      <DocSection
        title="Indicador e contagem"
        description={
          <>
            <code>CarouselDots</code> tem duas formas, e a escolha é por
            quantidade: pontos contam-se de relance até uns oito; acima disso a
            barra segmentada diz a proporção sem pedir contagem.
          </>
        }
        code={`<CarouselDots />              {/* pontos */}
<CarouselDots variant="bar" />  {/* barra segmentada */}
<CarouselStatus />              {/* "3 de 12", e a região role="status" */}`}
        previewClassName="flex-col items-stretch gap-6"
      >
        <div className="flex w-full flex-col gap-6">
          <Carousel controls="none" className="w-full">
            <CarouselContent>
              {CARTOES.map((c) => (
                <CarouselItem key={c.nome} className="basis-2/3 sm:basis-1/2">
                  <CartaoFatura {...c} />
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="mt-3 flex items-center justify-between gap-4">
              <CarouselStatus />
              <CarouselDots />
            </div>
          </Carousel>

          <Carousel controls="none" className="w-full">
            <CarouselContent>
              {MESES.map((m) => (
                <CarouselItem key={m.mes} className="basis-1/2 sm:basis-1/3">
                  <Card>
                    <CardContent>
                      <Caption>{m.mes}</Caption>
                      <MoneyDisplay
                        value={m.saldo}
                        size="sm"
                        tone={m.saldo < 0 ? "expense" : "income"}
                      />
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselDots variant="bar" className="mt-3" />
          </Carousel>
        </div>
      </DocSection>

      <DocNote title="A posição vem do contêiner, e não de quem escreve a tela">
        Cada item era <code>role=&quot;group&quot;
        aria-roledescription=&quot;slide&quot;</code> <strong>sem rótulo</strong>{" "}
        — medido, quatro grupos anônimos. Hoje o <code>CarouselContent</code>{" "}
        deriva índice e total e escreve <code>aria-label=&quot;3 de 12&quot;</code>{" "}
        em cada um, do mesmo jeito que a <code>BreadcrumbList</code> assumiu os
        separadores e o <code>Stepper</code> passou a derivar o{" "}
        <code>isLast</code>. Ninguém conta itens à mão.
        <br />
        O rótulo do item conta <em>slides</em>; o <code>CarouselStatus</code> e
        os pontos contam <em>snaps</em>. Com <code>basis-1/2</code> são quatro
        itens e três paradas, e os dois números estão certos.
      </DocNote>

      <DocSection
        title="Vertical"
        description={
          <>
            <code>orientation=&quot;vertical&quot;</code> troca o eixo, a calha,
            o glifo da seta e as teclas. O viewport precisa de altura — ele não a
            deriva do conteúdo.
          </>
        }
        code={`<Carousel orientation="vertical" opts={{ align: "start" }}>
  <CarouselContent viewportClassName="h-56">…</CarouselContent>
  <CarouselPrevious />
  <CarouselNext />
</Carousel>`}
        previewClassName="justify-center py-4"
      >
        <Carousel
          orientation="vertical"
          controls="outside"
          opts={{ align: "start" }}
          className="w-64"
        >
          <CarouselContent viewportClassName="h-40">
            {CARTOES.map((c) => (
              <CarouselItem key={c.nome} className="basis-1/2">
                <CartaoFatura {...c} />
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </DocSection>

      <DocNote title="A seta segue o eixo, e antes não seguia">
        O teclado tratava <strong>só</strong> <code>ArrowLeft</code> e{" "}
        <code>ArrowRight</code>, inclusive num carrossel vertical — a tecla certa
        para o eixo não fazia nada. Hoje o par é{" "}
        <code>ArrowUp</code>/<code>ArrowDown</code> na vertical, e{" "}
        <code>Home</code>/<code>End</code> vão às pontas nas duas orientações.
        <br />O glifo também: a vertical usa <code>ChevronUp</code> e{" "}
        <code>ChevronDown</code> de verdade, em vez de girar a seta horizontal
        em 90°.
      </DocNote>

      <DocNote title="className vai no trilho; viewportClassName, na caixa que recorta">
        O <code>data-slot</code> fica no viewport e o <code>className</code> cai
        no trilho interno, então quem escrevia <code>className</code> não
        dimensionava o que via. É o defeito que o <code>SearchInput</code> pagou
        e resolveu com <code>inputClassName</code>: a altura da vertical e
        qualquer medida da caixa vão em <code>viewportClassName</code>.
      </DocNote>

      <DocNote title="O item precisa vazar da borda">
        Com <code>basis-2/3</code>, o item seguinte aparece pela metade e é isso
        que diz que há mais. Um carrossel em que o item cabe exatamente na
        largura parece uma lista de um item só, e ninguém desliza. Os pontos e a
        dissolução reforçam o sinal; não o substituem.
      </DocNote>

      <PropsTable
        title="Carousel"
        rows={[
          {
            prop: "variant",
            type: '"plain" | "card" | "inset"',
            default: '"plain"',
            description:
              "O que a raiz pinta. card e inset forçam controls=\"inside\".",
          },
          {
            prop: "controls",
            type: '"inside" | "outside" | "none"',
            default: '"inside"',
            description:
              "Onde a seta pousa. outside reserva px-12 na própria raiz; nenhum modo desenha fora da caixa.",
          },
          {
            prop: "gap",
            type: '"none" | "sm" | "md" | "lg"',
            default: '"md"',
            description:
              "A calha entre itens: margem negativa no trilho, recuo no item.",
          },
          {
            prop: "fade",
            type: "boolean",
            default: "true",
            description:
              "Dissolve as duas pontas conforme o trilho anda, pela rampa scroll-fade-x. É o que sustenta a seta sem fundo.",
          },
          {
            prop: "orientation",
            type: '"horizontal" | "vertical"',
            default: '"horizontal"',
            description: "Troca o eixo, a calha, o glifo da seta e as teclas.",
          },
          {
            prop: "opts",
            type: "EmblaOptionsType",
            description:
              "Opções do embla: align, loop, dragFree, slidesToScroll, containScroll.",
          },
          {
            prop: "plugins",
            type: "EmblaPluginType[]",
            description:
              "Nenhum plugin está instalado neste projeto — a prop existe para quem instalar um.",
          },
          {
            prop: "setApi",
            type: "(api: CarouselApi) => void",
            description: "Entrega a api do embla para controle externo.",
          },
          {
            prop: "aria-label",
            type: "string",
            default: '"Carrossel"',
            description:
              "O nome da região. Tem padrão em pt-BR porque um idioma que só vale quando alguém lembra de passar não é o idioma do app.",
          },
        ]}
      />

      <PropsTable
        title="CarouselContent, CarouselDots e CarouselStatus"
        rows={[
          {
            prop: "viewportClassName",
            type: "string",
            description:
              "CarouselContent: a caixa que recorta. className vai no trilho.",
          },
          {
            prop: "variant",
            type: '"dot" | "bar"',
            default: '"dot"',
            description:
              "CarouselDots: pontos até umas oito paradas; barra segmentada acima disso.",
          },
          {
            prop: "children",
            type: "React.ReactNode",
            description:
              "CarouselStatus: substitui o texto \"3 de 12\". O papel role=\"status\" fica.",
          },
        ]}
      />

      <DocNote title="Sem autoplay, e é decisão">
        Nenhum plugin do embla está instalado — <code>autoplay</code>,{" "}
        <code>fade</code> e <code>wheel-gestures</code> são todos dependência
        nova. Além do custo: num app de finanças, conteúdo que se move sozinho
        enquanto a pessoa lê um valor é hostil, e exigiria pausa no cursor, no
        foco e em <code>prefers-reduced-motion</code> para não virar defeito de
        acessibilidade.
      </DocNote>

      <DocNote title="Nunca para comparar">
        <Muted>
          Um carrossel esconde. Se a pessoa precisa ver dois números lado a lado
          para decidir — duas faturas, dois planos, dois meses —, o componente
          certo é a grade, a tabela ou a lista. O carrossel serve o que se
          percorre, não o que se confronta.
        </Muted>
      </DocNote>
    </>
  )
}
