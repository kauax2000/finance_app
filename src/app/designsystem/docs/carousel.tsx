"use client"

import * as React from "react"
import { ChevronRightIcon } from "@heroicons/react/16/solid"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardMedia,
  CardTitle,
} from "@/components/ui/card"
import {
  Carousel,
  CarouselCaption,
  CarouselContent,
  CarouselDots,
  CarouselFullscreen,
  CarouselItem,
  CarouselMore,
  CarouselNext,
  CarouselPlayPause,
  CarouselPrevious,
  CarouselProgress,
  CarouselSkeleton,
  CarouselStatus,
  CarouselStep,
  CarouselSteps,
  CarouselThumb,
  CarouselThumbs,
  CarouselToolbar,
} from "@/components/ui/carousel"
import { MoneyDisplay } from "@/components/ui/money-display"
import {
  PageSectionDescription,
  PageSectionHeader,
  PageSectionTitle,
} from "@/components/ui/page-section"
import { Caption } from "@/components/ui/typography"
import { Controles, DocNote, DocSection, Eixo, PropsTable, Usage } from "../ds-doc"

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

/**
 * O conteúdo editorial das galerias — o único tipo de conteúdo em que esta
 * casa aceita autoplay. As fotos são do picsum com semente fixa: a mesma
 * imagem em toda carga.
 */
const FOTO = (semente: string, l = 960, a = 640) =>
  `https://picsum.photos/seed/${semente}/${l}/${a}`

const NOVIDADES = [
  {
    semente: "fatura-ciclo",
    titulo: "A fatura fecha antes de vencer",
    texto: "Compras entre o fechamento e o vencimento caem na fatura seguinte.",
    tag: "Cartões",
  },
  {
    semente: "orcamento-mes",
    titulo: "Orçamento por categoria",
    texto: "Defina um teto para cada categoria e acompanhe o mês em tempo real.",
    tag: "Orçamentos",
  },
  {
    semente: "parcelas-futuras",
    titulo: "Parcelas entram no mês certo",
    texto: "Cada parcela aparece no mês da fatura em que ela cai.",
    tag: "Transações",
  },
  {
    semente: "assinaturas-recorrentes",
    titulo: "Assinaturas sob controle",
    texto: "Veja o que renova este mês e quanto somam os serviços recorrentes.",
    tag: "Assinaturas",
  },
  {
    semente: "metas-reserva",
    titulo: "A reserva de emergência",
    texto: "Seis meses de gastos essenciais, guardados onde não rendem susto.",
    tag: "Dicas",
  },
  {
    semente: "relatorio-anual",
    titulo: "O ano em um relatório",
    texto: "Receitas, despesas e categorias do ano, lado a lado com o anterior.",
    tag: "Relatórios",
  },
]

const SERVICOS = [
  {
    semente: "servico-contas",
    titulo: "Contas a pagar",
    texto: "Vencimentos do mês numa lista só, com aviso antes da data.",
  },
  {
    semente: "servico-cartoes",
    titulo: "Cartões de crédito",
    texto: "Limite, fatura aberta e parcelas de cada cartão, sem abrir o banco.",
  },
  {
    semente: "servico-carteiras",
    titulo: "Carteiras compartilhadas",
    texto: "Divida as finanças da casa com quem mora com você.",
  },
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
 * cartão é sempre errado.
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

/** A carta com informação sobre a imagem. */
function CartaImagem({
  semente,
  titulo,
  texto,
  tag,
  aspect = "portrait",
}: {
  semente: string
  titulo: string
  texto?: string
  tag?: string
  aspect?: "video" | "square" | "portrait" | "auto"
}) {
  return (
    <Card padding="none" className="h-full">
      <CardMedia src={FOTO(semente, 640, 820)} alt="" aspect={aspect} className="h-full">
        {tag ? (
          <Badge variant="contrast" size="xs" className="mb-2 self-start">
            {tag}
          </Badge>
        ) : null}
        <p className="text-base font-semibold text-balance">{titulo}</p>
        {texto ? <p className="mt-1 text-sm text-pretty opacity-85">{texto}</p> : null}
      </CardMedia>
    </Card>
  )
}

/** A foto inteira, para a tela cheia: `object-contain`, e não recortada. */
function FotoInteira({ semente, titulo }: { semente: string; titulo: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- demonstração com foto externa
    <img
      src={FOTO(semente, 1600, 900)}
      alt={titulo}
      className="mx-auto max-h-[85dvh] w-full object-contain"
    />
  )
}

function SuperficieDemo() {
  const [v, setV] = React.useState<"plain" | "card" | "inset">("card")
  return (
    <div className="flex w-full flex-col gap-4">
      <Controles inicio={<Eixo rotulo="variant" valores={["plain", "card", "inset"] as const} valor={v} onChange={setV} />} />
      <Carousel variant={v} aria-label="Saldo por mês" className="w-full">
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
  )
}

function ControlesDemo() {
  const [c, setC] = React.useState<"inside" | "outside" | "none">("inside")
  return (
    <div className="flex w-full flex-col gap-4">
      <Controles inicio={<Eixo rotulo="controls" valores={["inside", "outside", "none"] as const} valor={c} onChange={setC} />} />
      <Carousel controls={c} aria-label="Faturas abertas" className="w-full">
        <CarouselContent>
          {CARTOES.map((card) => (
            <CarouselItem key={card.nome} className="basis-2/3 sm:basis-1/2">
              <CartaoFatura {...card} />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
        {c === "none" ? <CarouselDots className="mt-3" /> : null}
      </Carousel>
    </div>
  )
}

function CalhaDemo() {
  const [g, setG] = React.useState<"none" | "sm" | "md" | "lg">("md")
  return (
    <div className="flex w-full flex-col gap-4">
      <Controles inicio={<Eixo rotulo="gap" valores={["none", "sm", "md", "lg"] as const} valor={g} onChange={setG} />} />
      <Carousel gap={g} controls="none" aria-label="Saldo por mês" className="w-full">
        <CarouselContent>
          {MESES.map((m) => (
            <CarouselItem key={m.mes} className="basis-1/3 sm:basis-1/4">
              <Card>
                <CardContent>
                  <Caption>{m.mes}</Caption>
                  <MoneyDisplay value={m.saldo} size="sm" tone={m.saldo < 0 ? "expense" : "income"} />
                </CardContent>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  )
}

function IndicadorDemo() {
  const [v, setV] = React.useState<"dot" | "pill" | "bar" | "progress">("dot")
  return (
    <div className="flex w-full flex-col gap-4">
      <Controles inicio={<Eixo rotulo="indicador" valores={["dot", "pill", "bar", "progress"] as const} valor={v} onChange={setV} />} />
      <Carousel controls="none" aria-label="Saldo por mês" className="w-full">
        <CarouselContent>
          {MESES.map((m) => (
            <CarouselItem key={m.mes} className="basis-1/2 sm:basis-1/3">
              <Card>
                <CardContent>
                  <Caption>{m.mes}</Caption>
                  <MoneyDisplay value={m.saldo} size="sm" tone={m.saldo < 0 ? "expense" : "income"} />
                </CardContent>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
        <div className="mt-3 flex items-center justify-between gap-4">
          <CarouselStatus />
          {v === "progress" ? (
            <CarouselProgress className="max-w-40" />
          ) : (
            <CarouselDots variant={v} className={v === "bar" ? "flex-1" : undefined} />
          )}
        </div>
      </Carousel>
    </div>
  )
}

function CarregandoDemo() {
  const [estado, setEstado] = React.useState<"carregando" | "pronto">("carregando")
  return (
    <div className="flex w-full flex-col gap-4">
      <Controles fim={<Eixo rotulo="estado" valores={["carregando", "pronto"] as const} valor={estado} onChange={setEstado} />} />
      {estado === "carregando" ? (
        <CarouselSkeleton count={3} itemClassName="basis-2/3 sm:basis-1/2" label="Carregando as faturas" />
      ) : (
        <Carousel aria-label="Faturas abertas" className="w-full">
          <CarouselContent>
            {CARTOES.map((c) => (
              <CarouselItem key={c.nome} className="basis-2/3 sm:basis-1/2">
                <CartaoFatura {...c} />
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      )}
    </div>
  )
}

function DepoimentoDemo() {
  const [efeito, setEfeito] = React.useState<"fade" | "scale">("fade")
  return (
    <div className="flex w-full flex-col gap-4">
      <Controles inicio={<Eixo rotulo="effect" valores={["fade", "scale"] as const} valor={efeito} onChange={setEfeito} />} />
      <Carousel
        key={efeito}
        controls="none"
        effect={efeito}
        fade={false}
        aria-label="Serviços"
        className="mx-auto w-full max-w-2xl"
      >
        <CarouselContent>
          {SERVICOS.map((s) => (
            <CarouselItem key={s.semente}>
              <div className="grid items-center gap-4 sm:grid-cols-[2fr_3fr]">
                <div className="overflow-hidden rounded-xl">
                  <CardMedia src={FOTO(s.semente, 600, 600)} alt="" aspect="square" />
                </div>
                <Card variant="elevated" className="sm:-ms-10">
                  <CardHeader>
                    <CardTitle>{s.titulo}</CardTitle>
                    <CardDescription>Finance App</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-pretty">{s.texto}</p>
                  </CardContent>
                </Card>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselToolbar align="center" className="mt-4">
          <CarouselPrevious placement="inline" appearance="solid" />
          <CarouselDots />
          <CarouselNext placement="inline" appearance="solid" />
        </CarouselToolbar>
      </Carousel>
    </div>
  )
}

function GaleriaDemo() {
  const [surface, setSurface] = React.useState<"glass" | "none">("glass")
  return (
    <div className="flex w-full flex-col gap-4">
      <Controles inicio={<Eixo rotulo="CarouselDots surface" valores={["glass", "none"] as const} valor={surface} onChange={setSurface} />} />
      <Carousel gap="none" fade={false} effect="parallax" aria-label="Novidades" className="w-full">
        <CarouselContent viewportClassName="rounded-xl">
          {NOVIDADES.map((n) => (
            <CarouselItem key={n.semente}>
              <CardMedia src={FOTO(n.semente, 1280, 720)} alt={n.titulo} aspect="video" />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselStatus placement="overlay" />
        <CarouselFullscreen title="Novidades">
          {NOVIDADES.map((n) => (
            <CarouselItem key={n.semente}>
              <FotoInteira semente={n.semente} titulo={n.titulo} />
            </CarouselItem>
          ))}
        </CarouselFullscreen>
        <CarouselPrevious appearance="glass" />
        <CarouselNext appearance="glass" />
        <CarouselDots placement="overlay" surface={surface} variant="pill" />
      </Carousel>
    </div>
  )
}

function MiniaturasDemo() {
  const [lado, setLado] = React.useState<"horizontal" | "vertical">("vertical")
  const miniaturas = NOVIDADES.map((n, i) => (
    <CarouselThumb key={n.semente} index={i}>
      {/* eslint-disable-next-line @next/next/no-img-element -- demonstração com foto externa */}
      <img src={FOTO(n.semente, 160, 120)} alt="" />
    </CarouselThumb>
  ))
  const principal = (
    <CarouselContent viewportClassName="rounded-xl">
      {NOVIDADES.map((n) => (
        <CarouselItem key={n.semente}>
          <CardMedia src={FOTO(n.semente, 1280, 720)} alt={n.titulo} aspect="video" />
        </CarouselItem>
      ))}
    </CarouselContent>
  )
  return (
    <div className="flex w-full flex-col gap-4">
      <Controles inicio={<Eixo rotulo="CarouselThumbs orientation" valores={["vertical", "horizontal"] as const} valor={lado} onChange={setLado} />} />
      {lado === "vertical" ? (
        <Carousel gap="none" fade={false} controls="none" aria-label="Novidades" className="w-full">
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_5rem]">
            {principal}
            <CarouselThumbs orientation="vertical">{miniaturas}</CarouselThumbs>
          </div>
        </Carousel>
      ) : (
        <Carousel gap="none" fade={false} controls="none" aria-label="Novidades" className="w-full">
          {principal}
          <CarouselToolbar className="mt-3">
            <CarouselPrevious placement="inline" appearance="solid" />
            <CarouselThumbs>{miniaturas}</CarouselThumbs>
            <CarouselNext placement="inline" appearance="solid" />
          </CarouselToolbar>
        </Carousel>
      )}
    </div>
  )
}

function RotacaoDemo() {
  const [indicador, setIndicador] = React.useState<"pontos" | "passos">("pontos")
  return (
    <div className="flex w-full flex-col gap-4">
      <Controles fim={<Eixo rotulo="indicador" valores={["pontos", "passos"] as const} valor={indicador} onChange={setIndicador} />} />
      {indicador === "pontos" ? (
        <Carousel autoplay={5000} loop gap="none" fade={false} controls="none" aria-label="Novidades" className="w-full">
          <CarouselContent viewportClassName="rounded-xl">
            {NOVIDADES.map((n) => (
              <CarouselItem key={n.semente}>
                <CartaImagem {...n} aspect="video" />
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselToolbar align="center" className="mt-3">
            <CarouselPlayPause />
            <CarouselDots variant="pill" />
          </CarouselToolbar>
        </Carousel>
      ) : (
        <Carousel autoplay={6000} loop controls="none" fade={false} aria-label="Serviços" className="w-full">
          <div className="mb-4 flex items-center justify-between gap-3">
            <CarouselSteps>
              {SERVICOS.map((s, i) => (
                <CarouselStep key={s.semente} index={i} label={s.titulo} />
              ))}
            </CarouselSteps>
            <CarouselPlayPause />
          </div>
          <CarouselContent>
            {SERVICOS.map((s) => (
              <CarouselItem key={s.semente}>
                <CartaImagem semente={s.semente} titulo={s.titulo} texto={s.texto} aspect="video" />
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      )}
    </div>
  )
}

export default function CarouselDoc() {
  return (
    <>
      <Usage>
        Itens de mesma importância que deslizam. Nunca para comparar: o que está
        fora da tela não se compara, e duas faturas ou dois meses lado a lado
        pedem grade, tabela ou lista. As versões abaixo são o{" "}
        <strong>mesmo motor</strong> com props e peças diferentes, não
        componentes paralelos. Dê um <code>aria-label</code> a cada um: o padrão,
        &quot;Carrossel&quot;, não diz o que há dentro.
      </Usage>

      <DocSection
        title="Padrão"
        description="Setas dentro da caixa e pontos. Passa pelo arraste, pelas setas, pelo teclado (← →, Home, End) e pelo gesto de dois dedos do trackpad, um item por gesto. O item cortado na borda, clicado, vem para a vista antes de agir."
        code={`<Carousel aria-label="Faturas abertas">
  <CarouselContent>
    <CarouselItem className="basis-2/3 sm:basis-1/2">…</CarouselItem>
  </CarouselContent>
  <CarouselPrevious />
  <CarouselNext />
  <CarouselDots className="mt-3" />
</Carousel>`}
      >
        <Carousel aria-label="Faturas abertas" className="w-full">
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

      <DocSection
        title="Superfície"
        description={
          <>
            <code>variant</code> decide o que a raiz pinta. <code>card</code> e{" "}
            <code>inset</code> forçam <code>controls=&quot;inside&quot;</code>:
            uma superfície pintada não tem controle flutuando fora dela. O item
            de dentro não é <code>Card</code> — a moldura já é a raiz.
          </>
        }
        code={`<Carousel variant="card">…</Carousel>
<Carousel variant="inset">…</Carousel>`}
        previewClassName="flex-col items-stretch"
      >
        <SuperficieDemo />
      </DocSection>

      <DocSection
        title="Controles"
        description={
          <>
            Onde a seta sobreposta pousa, e se ela existe. No toque a seta{" "}
            <strong>continua visível</strong>: a WCAG 2.5.7 exige uma
            alternativa sem arraste. <code>none</code> esconde só as
            sobrepostas — as de uma barra são pedidas à mão.
          </>
        }
        code={`<Carousel controls="inside">…</Carousel>   {/* o padrão */}
<Carousel controls="outside">…</Carousel>  {/* reserva px-9 (36px) na raiz */}
<Carousel controls="none">…</Carousel>     {/* gesto, pontos ou barra */}`}
        previewClassName="flex-col items-stretch"
      >
        <ControlesDemo />
      </DocSection>

      <DocSection
        title="Calha"
        description={
          <>
            <code>gap</code> é a distância entre itens: margem negativa no
            trilho mais recuo no item. <code>gap</code> no flex entraria na
            conta de <code>basis-*</code>.
          </>
        }
        code={`<Carousel gap="sm">…</Carousel>   {/* none · sm · md (o padrão) · lg */}`}
        previewClassName="flex-col items-stretch"
      >
        <CalhaDemo />
      </DocSection>

      <DocSection
        title="Indicador e contagem"
        description={
          <>
            <code>CarouselDots</code> tem três formas: pontos até uns oito,
            pílula (o ativo alonga, e é a forma do temporizador) e, acima de
            oito, a barra segmentada. <code>CarouselProgress</code> é a barra
            de rolagem: o polegar tem a largura do que cabe e anda com a tira.{" "}
            <code>CarouselStatus</code> é o &quot;3 de 6&quot; e a região que o
            leitor de tela ouve.
          </>
        }
        code={`<CarouselDots />                {/* pontos */}
<CarouselDots variant="pill" />   {/* o ativo alonga */}
<CarouselDots variant="bar" />    {/* barra segmentada */}
<CarouselProgress />              {/* barra de rolagem */}
<CarouselStatus />                {/* "3 de 6", role="status" */}`}
        previewClassName="flex-col items-stretch"
      >
        <IndicadorDemo />
      </DocSection>

      <DocSection
        title="Carrossel só no telefone"
        description={
          <>
            <code>until=&quot;md&quot;</code>: abaixo de 768px é a tira; a
            partir dele, grade com a mesma calha, e setas, pontos e barra somem.
            O embla desliga por breakpoint, então o teclado e a roda deixam a
            grade em paz. Estreite a janela para ver a troca.
          </>
        }
        code={`<Carousel until="md" aria-label="Cartões">
  <CarouselContent>
    <CarouselItem className="basis-2/3">…</CarouselItem>
  </CarouselContent>
  <CarouselDots className="mt-3" />
</Carousel>`}
        previewClassName="items-stretch"
      >
        <Carousel until="md" controls="none" aria-label="Cartões" className="w-full">
          <CarouselContent>
            {CARTOES.map((c) => (
              <CarouselItem key={c.nome} className="basis-2/3">
                <CartaoFatura {...c} />
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselDots className="mt-3" />
        </Carousel>
      </DocSection>

      <DocSection
        title="Arraste livre"
        description={
          <>
            <code>snap=&quot;free&quot;</code>: a tira desliza com inércia e
            para onde o dedo soltar. Pontos mentiriam aqui — não há &quot;item
            3&quot; quando a tira para em qualquer lugar —, e quem diz a posição
            é o <code>CarouselProgress</code>.
          </>
        }
        code={`<Carousel snap="free" controls="none">
  <CarouselContent>
    <CarouselItem className="basis-36">…</CarouselItem>
  </CarouselContent>
  <CarouselProgress className="mt-3" />
</Carousel>`}
        previewClassName="items-stretch"
      >
        <Carousel snap="free" controls="none" gap="sm" aria-label="Saldo por mês" className="w-full">
          <CarouselContent>
            {[...MESES, ...MESES].map((m, i) => (
              <CarouselItem key={`${m.mes}-${i}`} className="basis-36">
                <Card padding="sm">
                  <CardContent>
                    <Caption>{m.mes}</Caption>
                    <MoneyDisplay value={m.saldo} size="sm" tone={m.saldo < 0 ? "expense" : "income"} />
                  </CardContent>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselProgress className="mt-3" />
        </Carousel>
      </DocSection>

      <DocSection
        title="Cartas com ações e ver todos"
        description={
          <>
            O item carrega a própria ação, no rodapé do cartão. Clicar num
            cartão cortado na borda — mesmo no botão — primeiro o traz para a
            vista (<code>selectOnClick</code>, ligado). O fim da tira é{" "}
            <code>CarouselMore</code>: um item de verdade, com a superfície do
            lugar vazio, que leva à lista.
          </>
        }
        code={`<CarouselItem hover="lift">
  <Card>…<CardFooter><Button size="sm">Pagar fatura</Button></CardFooter></Card>
</CarouselItem>
<CarouselMore count={12} className="basis-2/3 sm:basis-1/2">
  <Link href="/credit-cards">Ver todos os cartões</Link>
</CarouselMore>`}
        previewClassName="items-stretch"
      >
        <Carousel aria-label="Faturas abertas" className="w-full">
          <CarouselContent>
            {CARTOES.map((c) => (
              <CarouselItem key={c.nome} hover="lift" className="basis-2/3 sm:basis-1/2">
                <Card>
                  <CardHeader>
                    <CardDescription>{c.nome}</CardDescription>
                    <MoneyDisplay value={c.fatura} size="lg" tone="expense" />
                  </CardHeader>
                  <CardFooter className="gap-2">
                    <Button size="sm">Pagar fatura</Button>
                    <Button size="sm" variant="tertiary">
                      Ver compras
                    </Button>
                  </CardFooter>
                </Card>
              </CarouselItem>
            ))}
            <CarouselMore count={12} className="basis-2/3 sm:basis-1/2">
              <a href="#cartas-com-acoes-e-ver-todos">Ver todos os cartões</a>
            </CarouselMore>
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </DocSection>

      <DocSection
        title="Carregando"
        description="CarouselSkeleton tem o basis e a calha do carrossel real, e a tira não pula quando o dado chega. Fica fora de um Carousel — não há o que rolar — e anuncia o carregamento uma vez; o osso de cada item é um CardSkeleton, ou o que vier em children."
        code={`{carregando ? (
  <CarouselSkeleton itemClassName="basis-2/3 sm:basis-1/2" label="Carregando as faturas" />
) : (
  <Carousel>…</Carousel>
)}`}
        previewClassName="flex-col items-stretch"
      >
        <CarregandoDemo />
      </DocSection>

      {/* ---------------------------------------------------------------- */}

      <DocSection
        title="Destaque no centro"
        description="O item central em tamanho cheio e os vizinhos menores e apagados, com loop. O efeito é contínuo: acompanha o arraste em vez de trocar no fim. Clicar num vizinho o traz ao centro."
        code={`<Carousel effect="spotlight">          {/* centraliza e liga o loop */}
  <CarouselContent>
    <CarouselItem className="basis-3/4 sm:basis-1/2">…</CarouselItem>
  </CarouselContent>
  <CarouselToolbar align="center" className="mt-4">
    <CarouselPrevious placement="inline" appearance="solid" />
    <CarouselDots variant="pill" />
    <CarouselNext placement="inline" appearance="solid" />
  </CarouselToolbar>
</Carousel>`}
        previewClassName="items-stretch"
      >
        <Carousel effect="spotlight" controls="none" aria-label="Novidades" className="w-full">
          <CarouselContent>
            {NOVIDADES.map((n) => (
              <CarouselItem key={n.semente} className="basis-3/4 sm:basis-1/2">
                <Card padding="none" className="h-full">
                  <div className="grid h-full sm:grid-cols-2">
                    <div className="flex flex-col gap-2 p-5">
                      <Badge variant="soft" tone="neutral" size="xs" className="self-start">
                        {n.tag}
                      </Badge>
                      <p className="text-lg font-semibold tracking-tight text-balance">
                        {n.titulo}
                      </p>
                      <p className="text-sm text-muted-foreground text-pretty">{n.texto}</p>
                    </div>
                    <CardMedia
                      src={FOTO(n.semente)}
                      alt=""
                      aspect="auto"
                      className="hidden min-h-48 sm:block"
                    />
                  </div>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselToolbar align="center" className="mt-4">
            <CarouselPrevious placement="inline" appearance="solid" />
            <CarouselDots variant="pill" />
            <CarouselNext placement="inline" appearance="solid" />
          </CarouselToolbar>
        </Carousel>
      </DocSection>

      <DocSection
        title="Troca por dissolução"
        description={
          <>
            Um item de cada vez, com seta, pontos e seta centralizados embaixo.{" "}
            <code>effect=&quot;fade&quot;</code> empilha os itens na origem e os
            cruza por opacidade — o arraste vira dissolução —, e força{" "}
            <code>gap=&quot;none&quot;</code>. <code>scale</code> é a troca
            que desliza, encolhendo quem sai.
          </>
        }
        code={`<Carousel effect="fade" controls="none">
  <CarouselContent>…</CarouselContent>
  <CarouselToolbar align="center" className="mt-4">
    <CarouselPrevious placement="inline" appearance="solid" />
    <CarouselDots />
    <CarouselNext placement="inline" appearance="solid" />
  </CarouselToolbar>
</Carousel>`}
        previewClassName="flex-col items-stretch"
      >
        <DepoimentoDemo />
      </DocSection>

      <DocSection
        title="Passos nomeados"
        description="As pílulas numeradas dizem o que vem, e não só quantos. Clicar num passo leva ao item; as setas, os pontos e o teclado andam junto, porque todos leem o mesmo índice."
        code={`<Carousel controls="none">
  <CarouselSteps>
    <CarouselStep index={0} label="Cartões" />
    …
  </CarouselSteps>
  <CarouselContent>…</CarouselContent>
</Carousel>`}
        previewClassName="items-stretch"
      >
        <Carousel controls="none" fade={false} aria-label="Novidades" className="w-full">
          <Card padding="lg" className="gap-5">
            <CarouselSteps>
              {NOVIDADES.slice(0, 4).map((n, i) => (
                <CarouselStep key={n.semente} index={i} label={n.tag} />
              ))}
            </CarouselSteps>
            <CarouselContent>
              {NOVIDADES.slice(0, 4).map((n) => (
                <CarouselItem key={n.semente}>
                  <div className="grid items-center gap-5 sm:grid-cols-2">
                    <div className="flex flex-col gap-1.5">
                      <p className="text-xl font-semibold tracking-tight text-balance">
                        {n.titulo}
                      </p>
                      <p className="text-sm text-muted-foreground text-pretty">{n.texto}</p>
                    </div>
                    <div className="overflow-hidden rounded-lg">
                      <CardMedia src={FOTO(n.semente)} alt="" aspect="video" />
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Card>
        </Carousel>
      </DocSection>

      <DocSection
        title="Passos em lista"
        description="A lista numerada com trilho: o marcador viaja até o passo ativo e só ele abre a descrição. A imagem ao lado troca junto, com as setas de vidro no canto."
        code={`<Carousel controls="none">
  <div className="grid gap-8 md:grid-cols-[2fr_3fr]">
    <CarouselSteps orientation="vertical">
      <CarouselStep index={0} label="Contas a pagar" description="…" />
    </CarouselSteps>
    <div className="relative">
      <CarouselContent>…</CarouselContent>
      <CarouselToolbar className="absolute end-3 bottom-3">
        <CarouselPrevious placement="inline" appearance="glass" />
        <CarouselNext placement="inline" appearance="glass" />
      </CarouselToolbar>
    </div>
  </div>
</Carousel>`}
        previewClassName="items-stretch"
      >
        <Carousel controls="none" gap="none" fade={false} aria-label="Serviços" className="w-full">
          <div className="grid items-center gap-8 md:grid-cols-[2fr_3fr]">
            <CarouselSteps orientation="vertical">
              {SERVICOS.map((s, i) => (
                <CarouselStep key={s.semente} index={i} label={s.titulo} description={s.texto} />
              ))}
            </CarouselSteps>
            <div className="relative overflow-hidden rounded-xl">
              <CarouselContent>
                {SERVICOS.map((s) => (
                  <CarouselItem key={s.semente}>
                    <CardMedia src={FOTO(s.semente)} alt={s.titulo} aspect="video" />
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselToolbar className="absolute end-3 bottom-3">
                <CarouselPrevious placement="inline" appearance="glass" />
                <CarouselNext placement="inline" appearance="glass" />
              </CarouselToolbar>
            </div>
          </div>
        </Carousel>
      </DocSection>

      <DocNote title="Os passos são botões com aria-current, e não abas">
        O padrão de abas pede <code>tabpanel</code>, e aqui os painéis são os
        slides do embla. Um <code>role=&quot;tab&quot;</code> sem painel é a posse ARIA
        quebrada que o <code>ButtonGroup</code> já registra; botões com{" "}
        <code>aria-current=&quot;step&quot;</code> dizem a verdade.
      </DocNote>

      {/* ---------------------------------------------------------------- */}

      <DocSection
        title="Título e setas no topo"
        description="O cabeçalho da seção dentro do Carousel, com as setas no actions: elas leem o índice pelo contexto e ficam à direita do título. A calha grande separa cartas de imagem."
        code={`<Carousel controls="none" gap="lg">
  <PageSectionHeader
    actions={
      <CarouselToolbar>
        <CarouselPrevious placement="inline" />
        <CarouselNext placement="inline" />
      </CarouselToolbar>
    }
  >
    <PageSectionTitle>Novidades</PageSectionTitle>
  </PageSectionHeader>
  <CarouselContent className="mt-4">…</CarouselContent>
</Carousel>`}
        previewClassName="items-stretch"
      >
        <Carousel controls="none" gap="lg" aria-label="Novidades" className="w-full">
          <PageSectionHeader
            actions={
              <CarouselToolbar>
                <CarouselPrevious placement="inline" />
                <CarouselNext placement="inline" />
              </CarouselToolbar>
            }
          >
            <PageSectionTitle>Novidades</PageSectionTitle>
            <PageSectionDescription>
              O que mudou no app nas últimas semanas.
            </PageSectionDescription>
          </PageSectionHeader>
          <CarouselContent className="mt-4 h-96">
            {NOVIDADES.map((n) => (
              <CarouselItem key={n.semente} hover="zoom" className="basis-3/4 sm:basis-1/3">
                <CartaImagem {...n} aspect="auto" />
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </DocSection>

      <DocSection
        title="Setas embaixo à direita"
        description="A mesma barra depois do conteúdo, com a contagem do outro lado. É a forma para quando a seção já tem título fora do carrossel."
        code={`<Carousel controls="none">
  <CarouselContent>…</CarouselContent>
  <div className="mt-3 flex items-center justify-between">
    <CarouselStatus />
    <CarouselToolbar>
      <CarouselPrevious placement="inline" appearance="solid" />
      <CarouselNext placement="inline" appearance="solid" />
    </CarouselToolbar>
  </div>
</Carousel>`}
        previewClassName="items-stretch"
      >
        <Carousel controls="none" aria-label="Faturas abertas" className="w-full">
          <CarouselContent>
            {CARTOES.map((c) => (
              <CarouselItem key={c.nome} hover="lift" className="basis-2/3 sm:basis-1/2">
                <CartaoFatura {...c} />
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className="mt-3 flex items-center justify-between gap-4">
            <CarouselStatus />
            <CarouselToolbar>
              <CarouselPrevious placement="inline" appearance="solid" />
              <CarouselNext placement="inline" appearance="solid" />
            </CarouselToolbar>
          </div>
        </Carousel>
      </DocSection>

      {/* ---------------------------------------------------------------- */}

      <DocSection
        title="Galeria de imagem"
        description="Um item por vez, com as setas, os pontos e a contagem dentro da foto, e o botão de tela cheia no canto. A tinta dos pontos é a do véu, branca nos dois temas, porque a foto não muda com o tema. A tela cheia abre no item atual e devolve o índice ao fechar."
        code={`<Carousel gap="none" fade={false}>
  <CarouselContent viewportClassName="rounded-xl">…</CarouselContent>
  <CarouselStatus placement="overlay" />
  <CarouselFullscreen title="Novidades">
    <CarouselItem><img className="object-contain" … /></CarouselItem>
  </CarouselFullscreen>
  <CarouselPrevious appearance="glass" />
  <CarouselNext appearance="glass" />
  <CarouselDots placement="overlay" surface="glass" variant="pill" />
</Carousel>`}
        previewClassName="flex-col items-stretch"
      >
        <GaleriaDemo />
      </DocSection>

      <DocSection
        title="Miniaturas"
        description="A imagem grande e a tira que a escolhe — embaixo, entre as setas, ou ao lado. A tira é um segundo embla, livre, sincronizado nos dois sentidos. Ao lado, ela é coluna a partir de md e deita embaixo no telefone; a altura é a da foto."
        code={`<Carousel gap="none" fade={false} controls="none">
  <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_5rem]">
    <CarouselContent viewportClassName="rounded-xl">…</CarouselContent>
    <CarouselThumbs orientation="vertical">
      <CarouselThumb index={0}><img src={miniatura} alt="" /></CarouselThumb>
    </CarouselThumbs>
  </div>
</Carousel>`}
        previewClassName="flex-col items-stretch"
      >
        <MiniaturasDemo />
      </DocSection>

      <DocSection
        title="Acordeão"
        description="Os itens lado a lado e colapsados; o selecionado abre na mola da casa conforme se passa. Clicar num item colapsado o abre. A legenda embaixo troca junto, com a ação do item."
        code={`<Carousel layout="accordion" controls="none" gap="sm">
  <CarouselContent viewportClassName="h-80">…</CarouselContent>
  <div className="mt-4 flex items-end justify-between gap-6">
    <CarouselCaption>{(i) => <p>{itens[i].texto}</p>}</CarouselCaption>
    <CarouselToolbar>…</CarouselToolbar>
  </div>
</Carousel>`}
        previewClassName="items-stretch"
      >
        <Carousel layout="accordion" controls="none" gap="sm" aria-label="Novidades" className="w-full">
          <div className="mb-4 flex justify-end">
            <CarouselToolbar>
              <CarouselPrevious placement="inline" appearance="solid" />
              <CarouselNext placement="inline" appearance="solid" />
            </CarouselToolbar>
          </div>
          <CarouselContent viewportClassName="h-80">
            {NOVIDADES.map((n) => (
              <CarouselItem key={n.semente}>
                <div className="relative h-full overflow-hidden rounded-xl">
                  <CardMedia src={FOTO(n.semente, 900, 700)} alt={n.titulo} aspect="auto" className="h-full">
                    {/* Só o item aberto mostra o rótulo: colapsado, ele não cabe e
                        sairia cortado. */}
                    <p className="text-sm font-semibold whitespace-nowrap opacity-0 transition-opacity duration-(--duration-base) ease-(--ease-out) in-data-selected:opacity-100">
                      {n.tag}
                    </p>
                  </CardMedia>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
            <CarouselCaption className="max-w-lg">
              {(i) => (
                <p className="text-sm text-pretty">
                  <span className="font-semibold">{NOVIDADES[i]?.titulo}.</span>{" "}
                  <span className="text-muted-foreground">{NOVIDADES[i]?.texto}</span>
                </p>
              )}
            </CarouselCaption>
            <Button variant="secondary" size="sm">
              Ler as notas
              <ChevronRightIcon aria-hidden />
            </Button>
          </div>
        </Carousel>
      </DocSection>

      {/* ---------------------------------------------------------------- */}

      <DocSection
        title="Rotação automática"
        description="autoplay em milissegundos. O indicador ativo é o temporizador — o ponto enche, e no passo nomeado um fio corre na base da pílula —, e ele pausa junto da rotação: sob o cursor, com foco dentro, com a aba escondida ou pelo botão. Com movimento reduzido, nasce pausada."
        code={`<Carousel autoplay={5000} loop gap="none" fade={false}>
  <CarouselContent viewportClassName="rounded-xl">…</CarouselContent>
  <CarouselToolbar align="center" className="mt-3">
    <CarouselPlayPause />
    <CarouselDots variant="pill" />
  </CarouselToolbar>
</Carousel>`}
        previewClassName="flex-col items-stretch"
      >
        <RotacaoDemo />
      </DocSection>

      <DocNote title="Autoplay só em conteúdo editorial">
        Novidades, dicas, vitrine — nunca sobre dado da pessoa. Um valor que
        troca enquanto se lê é hostil. A rotação pausa sob o cursor, com o foco
        dentro e com a aba escondida, e o <code>CarouselPlayPause</code> é
        obrigatório (WCAG 2.2.2). Com a rotação andando, a região viva se cala:
        anunciar cada troca atropelaria o leitor de tela.
      </DocNote>

      {/* ---------------------------------------------------------------- */}

      <DocSection
        title="De borda a borda"
        description="bleed tira a dissolução e sangra a calha da casca: os cartões correm até a borda da tela, e o primeiro alinha com o conteúdo. Para vitrine, onde o corte na borda é o convite."
        code={`<Carousel bleed controls="none">
  <CarouselContent>…</CarouselContent>
</Carousel>`}
        previewClassName="items-stretch overflow-hidden"
      >
        <Carousel bleed controls="none" aria-label="Novidades" className="w-full">
          <CarouselContent className="h-72">
            {NOVIDADES.map((n) => (
              <CarouselItem key={n.semente} hover="lift" className="basis-2/3 sm:basis-1/3">
                <CartaImagem {...n} aspect="auto" />
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </DocSection>

      <DocSection
        title="Galeria curva"
        description="Os itens descem num arco e giram conforme se afastam do centro — a galeria curva, em CSS e não em WebGL: continua sendo DOM, com foco, leitor de tela e os tokens do tema."
        code={`<Carousel effect="curve" loop opts={{ align: "center" }} controls="none">…</Carousel>`}
        previewClassName="items-stretch overflow-hidden"
      >
        <Carousel effect="curve" loop opts={{ align: "center" }} controls="none" fade={false} aria-label="Novidades" className="w-full">
          {/* O arco desce os itens até 2,25rem: o recuo de baixo do viewport é
              o que os deixa inteiros em vez de recortados. */}
          <CarouselContent className="h-64" viewportClassName="pb-12">
            {NOVIDADES.map((n) => (
              <CarouselItem key={n.semente} className="basis-1/2 sm:basis-1/4">
                <CartaImagem semente={n.semente} titulo={n.tag} aspect="auto" />
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </DocSection>

      <DocSection
        title="Vertical"
        description={
          <>
            <code>orientation=&quot;vertical&quot;</code> troca o eixo, a calha,
            o glifo da seta e as teclas. O viewport precisa de altura, em{" "}
            <code>viewportClassName</code>. A roda do trackpad não passa itens
            aqui: o gesto vertical é o da página.
          </>
        }
        code={`<Carousel orientation="vertical" controls="outside" opts={{ align: "start" }}>
  <CarouselContent viewportClassName="h-40">…</CarouselContent>
  <CarouselPrevious />
  <CarouselNext />
</Carousel>`}
        previewClassName="justify-center py-4"
      >
        <Carousel
          orientation="vertical"
          controls="outside"
          opts={{ align: "start" }}
          aria-label="Faturas abertas"
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

      <DocNote title="O componente nunca desenha fora da própria caixa">
        <code>inside</code> pousa a seta sobre a borda do viewport;{" "}
        <code>outside</code> reserva a própria calha, <code>px-9</code> na raiz
        (a seta de 28 mais 8 de respiro). Seta fora da caixa vaza do recorte,
        cria rolagem horizontal no pai e perde parte da área de clique.
      </DocNote>

      <DocNote title="A seta cresce por pseudo-elemento; o ponto cresce de verdade">
        A seta sobreposta é <code>icon-sm</code> (28) e cresce no toque com{" "}
        <code>pointer-coarse:after:-inset-2.5</code>, seguro porque as duas
        ficam em pontas opostas. Na barra, vizinhas, e nos pontos, adjacentes,
        um <code>::after</code> engoliria o vizinho, então o botão <em>é</em> a
        área de toque.
      </DocNote>

      <DocNote title="Os efeitos leem uma variável, e nada transiciona">
        Um driver só escreve em cada slide <code>--carousel-slide-s</code> (a
        distância ao encaixe, em passos, com sinal) e{" "}
        <code>--carousel-slide-d</code> (sem sinal). <code>scale</code>,{" "}
        <code>spotlight</code>, <code>parallax</code>, <code>curve</code> e{" "}
        <code>fade</code> são <code>@utility carousel-effect-*</code> que só
        leem a variável. Com movimento reduzido, escala, giro e deslocamento
        zeram; a opacidade do <code>spotlight</code> e o empilhamento do{" "}
        <code>fade</code> ficam, porque não movem nada.
      </DocNote>

      <DocNote title="O item precisa vazar da borda">
        Com <code>basis-2/3</code>, o item seguinte aparece pela metade e diz
        que há mais. Se o item cabe exato na largura, parece uma lista de um só
        e ninguém desliza.
      </DocNote>

      <DocNote title="O clique no item cortado é engolido, de propósito">
        Um botão pela metade, fora da vista, não é um alvo que a pessoa
        escolheu: ela clicou no que via. Por isso o primeiro clique traz o
        item para a vista, e só o segundo age. Arrasto não conta — o embla
        cancela o clique que termina um arrasto. Desligue com{" "}
        <code>selectOnClick=&#123;false&#125;</code>.
      </DocNote>

      <PropsTable
        title="Carousel"
        rows={[
          {
            prop: "effect",
            type: '"none" | "scale" | "spotlight" | "parallax" | "curve" | "fade"',
            default: '"none"',
            description:
              "O movimento dos itens conforme se afastam do centro. spotlight também centraliza e liga o loop; fade empilha e cruza por opacidade, com gap none.",
          },
          {
            prop: "until",
            type: '"md" | "lg"',
            description:
              "Carrossel só abaixo do degrau; a partir dele, grade com a mesma calha, sem setas, pontos nem barra.",
          },
          {
            prop: "snap",
            type: '"item" | "free"',
            default: '"item"',
            description: "free: arraste livre com inércia (dragFree). Indique com CarouselProgress.",
          },
          {
            prop: "selectOnClick",
            type: "boolean",
            default: "true",
            description:
              "O item cortado, clicado, vem para a vista antes de agir; no spotlight e no curve, para o centro.",
          },
          {
            prop: "wheel",
            type: "boolean",
            default: "true",
            description: "O gesto horizontal do trackpad passa um item por gesto. Só na horizontal.",
          },
          {
            prop: "layout",
            type: '"slide" | "accordion"',
            default: '"slide"',
            description:
              "accordion: itens lado a lado e colapsados, o selecionado abre. O embla fica inativo e o índice é do contexto.",
          },
          {
            prop: "autoplay",
            type: "number",
            default: "0",
            description:
              "Rotação em ms. Pausa no cursor, no foco, com a aba escondida e pelo CarouselPlayPause. Só em conteúdo editorial.",
          },
          {
            prop: "loop",
            type: "boolean",
            description: "Volta ao começo depois do último.",
          },
          {
            prop: "bleed",
            type: "boolean",
            default: "false",
            description: "De borda a borda: sangra a calha da casca e desliga a dissolução.",
          },
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
            description: "Onde a seta sobreposta pousa; outside reserva px-9 na própria raiz.",
          },
          {
            prop: "gap",
            type: '"none" | "sm" | "md" | "lg"',
            default: '"md"',
            description:
              "A calha entre itens: margem negativa no trilho, recuo no item. Na grade de until, o gap da grade.",
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
              "Opções do embla: align, slidesToScroll, containScroll, startIndex.",
          },
          {
            prop: "aria-label",
            type: "string",
            default: '"Carrossel"',
            description: "O nome da região. Passe sempre: o padrão não diz o que há dentro.",
          },
        ]}
      />

      <PropsTable
        title="Peças"
        rows={[
          {
            prop: "CarouselItem",
            type: 'hover: "none" | "lift" | "zoom"',
            default: '"none"',
            description:
              "A resposta ao cursor e ao toque, no filho do item. Não combina com curve nem parallax.",
          },
          {
            prop: "CarouselMore",
            type: "count?: number; children: o link",
            description:
              "O último item, o caminho para a lista: Card dashed clicável, com a seta e o total.",
          },
          {
            prop: "CarouselPrevious / Next",
            type: 'placement: "overlay" | "inline"; appearance: "tertiary" | "glass" | "solid"',
            default: '"overlay", "tertiary"',
            description:
              "inline mora numa CarouselToolbar. glass pousa sobre foto; solid, numa barra.",
          },
          {
            prop: "CarouselDots",
            type: 'variant: "dot" | "pill" | "bar"; placement: "below" | "overlay"; surface: "none" | "glass"',
            default: '"dot", "below", "none"',
            description:
              "Com autoplay, o ponto ativo é o temporizador. overlay pousa na base da foto, com a tinta do véu.",
          },
          {
            prop: "CarouselProgress",
            type: "ComponentProps<\"div\">",
            description:
              "A barra de rolagem: o polegar tem a fração visível e anda com a tira. Decorativa; some quando tudo cabe. Sem loop.",
          },
          {
            prop: "CarouselStatus",
            type: 'placement: "below" | "overlay"',
            default: '"below"',
            description: "\"3 de 6\" e a região role=\"status\". overlay é a pílula de vidro no canto da foto.",
          },
          {
            prop: "CarouselToolbar",
            type: 'align: "start" | "center" | "end"',
            default: '"end"',
            description:
              "A barra das setas inline, dos pontos, da contagem e do play/pause.",
          },
          {
            prop: "CarouselCaption",
            type: "children: (index) => ReactNode",
            description: "A legenda e a ação do item atual, fora do trilho, entrando em cascata.",
          },
          {
            prop: "CarouselPlayPause",
            type: "ComponentProps<typeof Button>",
            description: "Obrigatório onde há autoplay (WCAG 2.2.2).",
          },
          {
            prop: "CarouselSteps / Step",
            type: 'orientation: "horizontal" | "vertical"; index, label, description',
            description:
              "Passos nomeados: pílulas no topo ou lista com trilho. Botões com aria-current.",
          },
          {
            prop: "CarouselThumbs / Thumb",
            type: 'orientation: "horizontal" | "vertical"; index: number',
            description:
              "A tira de miniaturas, um segundo embla sincronizado. vertical é coluna a partir de md.",
          },
          {
            prop: "CarouselFullscreen",
            type: "title?: string; children: CarouselItem[]",
            description:
              "O botão de tela cheia e o Dialog com a galeria, abrindo no item atual e devolvendo o índice.",
          },
          {
            prop: "CarouselSkeleton",
            type: "count, gap, itemClassName, label, delay",
            description:
              "Fora do Carousel: os ossos com o basis real, num SkeletonGroup.",
          },
          {
            prop: "viewportClassName",
            type: "string",
            description:
              "CarouselContent: a caixa que recorta. className vai no trilho.",
          },
        ]}
      />
    </>
  )
}
