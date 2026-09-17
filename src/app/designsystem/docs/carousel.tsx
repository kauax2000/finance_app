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
import { Caption } from "@/components/ui/typography"
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
        Itens de mesma importância que deslizam. Nunca para comparar: o que está
        fora da tela não se compara, e duas faturas ou dois meses lado a lado
        pedem grade, tabela ou lista.
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
        <code>inside</code> pousa a seta sobre a borda do viewport;{" "}
        <code>outside</code> reserva a própria calha, <code>px-9</code> na raiz
        (a seta de 28 mais 8 de respiro). Seta fora da caixa vaza do recorte,
        cria rolagem horizontal no pai e perde parte da área de clique.
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
        <code>overflow-hidden</code>: o recuo da raiz já mantém os itens no raio,
        e recortar cortaria o anel de foco das setas. E <code>card</code> não é
        para carrossel de cartão — cartão dentro de cartão é sempre errado.
      </DocNote>

      <DocSection
        title="Controles"
        description={
          <>
            Onde a seta pousa, e se ela existe. No toque a seta{" "}
            <strong>continua visível</strong>: a WCAG 2.5.7 exige uma
            alternativa sem arraste para toda ação de arrastar.
          </>
        }
        code={`<Carousel controls="inside">…</Carousel>   {/* o padrão */}
<Carousel controls="outside">…</Carousel>  {/* reserva px-9 (36px) na raiz */}
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
        <code>pointer-coarse:after:-inset-2.5</code>, seguro porque as duas
        setas ficam em pontas opostas. É <code>2.5</code> e não <code>2</code>:
        o absoluto conta da caixa de padding, que desconta a borda, e o alvo
        precisa passar de 44px. Nos pontos, adjacentes, um <code>::after</code>{" "}
        engoliria o vizinho, então o botão <em>é</em> a área de toque (24×44).
      </DocNote>

      <DocNote title="A seta é tertiary, sem fundo em repouso">
        <code>Button variant=&quot;tertiary&quot;</code> com{" "}
        <code>rounded-lg</code> nos dois modos, como as setas do{" "}
        <code>Calendar</code> e da <code>Pagination</code>. O fundo aparece no
        cursor e no toque: o par <code>active:</code> mora em{" "}
        <code>button.tsx</code> porque <code>hover:</code> não dispara no
        telefone.
      </DocNote>

      <DocNote title="Posição é layout, não estado — ela não transiciona">
        A seta ancora em <code>top-(--carousel-control-y)</code>, medida num
        layout effect, e usa <code>transition-colors</code> em vez de{" "}
        <code>transition-all</code>. Sem isso, cada remedição (fonte carregando,
        pontos aparecendo, redimensionamento) vira a seta atravessando o cartão.
      </DocNote>

      <DocSection
        title="Calha"
        description={
          <>
            <code>gap</code> é a distância entre itens: margem negativa no
            trilho mais recuo no item. <code>gap</code> no flex entraria na
            conta de <code>basis-*</code>, e dois <code>basis-1/2</code>{" "}
            deixariam de caber.
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
            <strong>É o padrão.</strong> As pontas dissolvem conforme o trilho
            anda: a rampa diz que há mais e é o chão da seta sem fundo.{" "}
            <code>fade={"{false}"}</code> desliga.
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

      <DocNote title="A rampa é a do sistema; o motor é próprio">
        O embla translada o trilho em vez de rolar, então{" "}
        <code>useScrollFade</code>, que lê <code>scrollLeft</code>, nunca
        acenderia a ponta esquerda. A rampa continua <code>scroll-fade-x</code>;
        o motor publica <code>--scroll-fade-start/end</code> a partir de{" "}
        <code>api.scrollProgress()</code>. A máscara vai no viewport, que não
        desenha nada, e as setas são irmãs dele.
      </DocNote>

      <DocSection
        title="Indicador e contagem"
        description={
          <>
            <code>CarouselDots</code> tem duas formas: pontos até uns oito, que
            se contam de relance; acima disso, a barra segmentada diz a
            proporção.
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
        <code>CarouselContent</code> deriva índice e total e escreve{" "}
        <code>aria-label=&quot;3 de 12&quot;</code> em cada item; ninguém conta à
        mão. O rótulo do item conta <em>slides</em>; <code>CarouselStatus</code>{" "}
        e os pontos contam <em>snaps</em> — com <code>basis-1/2</code>, quatro
        itens dão três paradas.
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

      <DocNote title="A seta segue o eixo">
        Na vertical, as teclas são <code>ArrowUp</code>/<code>ArrowDown</code> e
        os glifos <code>ChevronUp</code>/<code>ChevronDown</code>;{" "}
        <code>Home</code>/<code>End</code> vão às pontas nas duas orientações.
      </DocNote>

      <DocNote title="className vai no trilho; viewportClassName, na caixa que recorta">
        A altura da vertical e qualquer medida da caixa vão em{" "}
        <code>viewportClassName</code>; o <code>className</code> cai no trilho
        interno e não dimensiona o que se vê.
      </DocNote>

      <DocNote title="O item precisa vazar da borda">
        Com <code>basis-2/3</code>, o item seguinte aparece pela metade e diz
        que há mais. Se o item cabe exato na largura, parece uma lista de um só
        e ninguém desliza.
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
            description: "Onde a seta pousa; outside reserva px-9 na própria raiz.",
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
            description: "Dissolve as pontas pela rampa scroll-fade-x.",
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
            description: "Nenhum plugin instalado; existe para quem instalar um.",
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
            description: "O nome da região, com padrão em pt-BR.",
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
            description: "CarouselDots: pontos até umas oito paradas, barra acima.",
          },
          {
            prop: "children",
            type: "React.ReactNode",
            description:
              "CarouselStatus: substitui o texto \"3 de 12\". O papel role=\"status\" fica.",
          },
        ]}
      />

      <DocNote title="Sem autoplay">
        Num app de finanças, conteúdo que se move enquanto a pessoa lê um valor
        é hostil, e exigiria pausa no cursor, no foco e em{" "}
        <code>prefers-reduced-motion</code>. Os plugins do embla também seriam
        dependência nova.
      </DocNote>
    </>
  )
}
