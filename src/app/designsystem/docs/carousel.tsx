"use client"

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
  CarouselItem,
  CarouselNext,
  CarouselPlayPause,
  CarouselPrevious,
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

export default function CarouselDoc() {
  return (
    <>
      <Usage>
        Itens de mesma importância que deslizam. Nunca para comparar: o que está
        fora da tela não se compara, e duas faturas ou dois meses lado a lado
        pedem grade, tabela ou lista. As versões abaixo são o{" "}
        <strong>mesmo motor</strong> com props e peças diferentes, não
        componentes paralelos.
      </Usage>

      {/* ---------------------------------------------------------------- */}

      <DocSection
        title="Destaque no centro"
        description="O item central em tamanho cheio e os vizinhos menores e apagados, com loop. O efeito é contínuo: acompanha o arraste em vez de trocar no fim. A barra embaixo diz a proporção."
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
        <Carousel effect="spotlight" controls="none" className="w-full">
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
        <Carousel controls="none" fade={false} className="w-full">
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
        <Carousel controls="none" gap="none" fade={false} className="w-full">
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
        <Carousel controls="none" gap="lg" className="w-full">
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
        <Carousel controls="none" className="w-full">
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

      <DocSection
        title="Depoimento"
        description="Um item de cada vez, com seta, pontos e seta centralizados embaixo. Os controles ficam juntos: o olho acha a navegação num lugar só."
        code={`<CarouselToolbar align="center" className="mt-4">
  <CarouselPrevious placement="inline" appearance="solid" />
  <CarouselDots />
  <CarouselNext placement="inline" appearance="solid" />
</CarouselToolbar>`}
        previewClassName="items-stretch"
      >
        <Carousel controls="none" effect="scale" fade={false} className="mx-auto w-full max-w-2xl">
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
      </DocSection>

      {/* ---------------------------------------------------------------- */}

      <DocSection
        title="Galeria de imagem"
        description="Um item por vez, com as setas e os pontos dentro da foto. Os pontos pousam na base, numa cápsula de vidro ou soltos; a tinta é a do véu, branca nos dois temas, porque a foto não muda com o tema. A seta sem destino apaga em vez de sumir."
        code={`<Carousel gap="none" fade={false}>
  <CarouselContent viewportClassName="rounded-xl">…</CarouselContent>
  <CarouselPrevious appearance="glass" />
  <CarouselNext appearance="glass" />
  <CarouselDots placement="overlay" surface="glass" variant="pill" />
</Carousel>`}
        previewClassName="flex-col items-stretch gap-8"
      >
        {(["glass", "none"] as const).map((surface) => (
          <Carousel key={surface} gap="none" fade={false} effect="parallax" className="w-full">
            <CarouselContent viewportClassName="rounded-xl">
              {NOVIDADES.map((n) => (
                <CarouselItem key={n.semente}>
                  <CardMedia src={FOTO(n.semente, 1280, 720)} alt={n.titulo} aspect="video" />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious appearance="glass" />
            <CarouselNext appearance="glass" />
            <CarouselDots placement="overlay" surface={surface} variant="pill" />
          </Carousel>
        ))}
      </DocSection>

      <DocSection
        title="Miniaturas"
        description="A imagem grande e a tira que a escolhe. A tira é um segundo embla, livre, sincronizado nos dois sentidos: escolher rola o principal, e rolar o principal traz a miniatura ativa para a vista."
        code={`<Carousel gap="none" fade={false} controls="none">
  <CarouselContent viewportClassName="rounded-xl">…</CarouselContent>
  <CarouselToolbar className="mt-3">
    <CarouselPrevious placement="inline" appearance="solid" />
    <CarouselThumbs>
      <CarouselThumb index={0}><img src={miniatura} alt="" /></CarouselThumb>
    </CarouselThumbs>
    <CarouselNext placement="inline" appearance="solid" />
  </CarouselToolbar>
</Carousel>`}
        previewClassName="items-stretch"
      >
        <Carousel gap="none" fade={false} controls="none" className="w-full">
          <CarouselContent viewportClassName="rounded-xl">
            {NOVIDADES.map((n) => (
              <CarouselItem key={n.semente}>
                <CardMedia src={FOTO(n.semente, 1280, 720)} alt={n.titulo} aspect="video" />
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselToolbar className="mt-3">
            <CarouselPrevious placement="inline" appearance="solid" />
            <CarouselThumbs>
              {NOVIDADES.map((n, i) => (
                <CarouselThumb key={n.semente} index={i}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- demonstração com foto externa */}
                  <img src={FOTO(n.semente, 160, 120)} alt="" />
                </CarouselThumb>
              ))}
            </CarouselThumbs>
            <CarouselNext placement="inline" appearance="solid" />
          </CarouselToolbar>
        </Carousel>
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
        <Carousel layout="accordion" controls="none" gap="sm" className="w-full">
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
                <>
                  <p className="text-sm text-pretty">
                    <span className="font-semibold">{NOVIDADES[i]?.titulo}.</span>{" "}
                    <span className="text-muted-foreground">{NOVIDADES[i]?.texto}</span>
                  </p>
                </>
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
        description="autoplay em milissegundos. O ponto ativo é o temporizador: ele enche no intervalo e pausa junto da rotação — sob o cursor, com foco dentro, com a aba escondida ou pelo botão. Com movimento reduzido, nasce pausada."
        code={`<Carousel autoplay={5000} loop gap="none" fade={false}>
  <CarouselContent viewportClassName="rounded-xl">…</CarouselContent>
  <CarouselToolbar align="center" className="mt-3">
    <CarouselPlayPause />
    <CarouselDots variant="pill" />
  </CarouselToolbar>
</Carousel>`}
        previewClassName="items-stretch"
      >
        <Carousel autoplay={5000} loop gap="none" fade={false} controls="none" className="w-full">
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
      </DocSection>

      <DocSection
        title="Passos com temporizador"
        description="Os passos nomeados também mostram o relógio: um fio na base da pílula ativa."
        code={`<Carousel autoplay={6000} loop controls="none">
  <CarouselSteps>…</CarouselSteps>
  <CarouselContent>…</CarouselContent>
</Carousel>`}
        previewClassName="items-stretch"
      >
        <Carousel autoplay={6000} loop controls="none" fade={false} className="w-full">
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
        <Carousel bleed controls="none" className="w-full">
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
        <Carousel effect="curve" loop opts={{ align: "center" }} controls="none" fade={false} className="w-full">
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
        title="Cartas com ações"
        description="O item carrega a própria ação: o rodapé do cartão, fora do trilho de gestos. hover=&quot;lift&quot; levanta o cartão sob o cursor e no toque."
        code={`<CarouselItem hover="lift">
  <Card>
    …
    <CardFooter><Button size="sm">Pagar fatura</Button></CardFooter>
  </Card>
</CarouselItem>`}
        previewClassName="items-stretch"
      >
        <Carousel className="w-full">
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
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </DocSection>

      {/* ---------------------------------------------------------------- */}

      <DocSection
        title="Padrão"
        description="Setas dentro da caixa e indicador. As peças são opcionais e independentes, e todas moram dentro do Carousel — elas leem o índice pelo contexto."
        code={`<Carousel>
  <CarouselContent>
    <CarouselItem className="basis-2/3 sm:basis-1/2">…</CarouselItem>
  </CarouselContent>
  <CarouselPrevious />
  <CarouselNext />
  <CarouselDots className="mt-3" />
</Carousel>`}
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

      <DocSection
        title="Controles"
        description={
          <>
            Onde a seta sobreposta pousa, e se ela existe. No toque a seta{" "}
            <strong>continua visível</strong>: a WCAG 2.5.7 exige uma
            alternativa sem arraste. <code>controls=&quot;none&quot;</code> esconde
            só as sobrepostas — as de uma barra são pedidas à mão.
          </>
        }
        code={`<Carousel controls="inside">…</Carousel>   {/* o padrão */}
<Carousel controls="outside">…</Carousel>  {/* reserva px-9 (36px) na raiz */}
<Carousel controls="none">…</Carousel>     {/* gesto, pontos ou barra */}`}
        previewClassName="flex-col items-stretch gap-6"
      >
        <div className="flex w-full flex-col gap-6">
          {(["inside", "outside", "none"] as const).map((c) => (
            <div key={c} className="flex flex-col gap-2">
              <Caption className="font-mono">controls=&quot;{c}&quot;</Caption>
              <Carousel controls={c} className="w-full">
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
          ))}
        </div>
      </DocSection>

      <DocNote title="A seta cresce por pseudo-elemento; o ponto cresce de verdade">
        A seta sobreposta é <code>icon-sm</code> (28) e cresce no toque com{" "}
        <code>pointer-coarse:after:-inset-2.5</code>, seguro porque as duas
        ficam em pontas opostas. Na barra, vizinhas, e nos pontos, adjacentes,
        um <code>::after</code> engoliria o vizinho, então o botão <em>é</em> a
        área de toque.
      </DocNote>

      <DocSection
        title="Calha"
        description={
          <>
            <code>gap</code> é a distância entre itens: margem negativa no
            trilho mais recuo no item. <code>gap</code> no flex entraria na
            conta de <code>basis-*</code>.
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
        title="Indicador e contagem"
        description={
          <>
            <code>CarouselDots</code> tem três formas: pontos até uns oito,
            pílula (o ativo alonga, e é a forma do temporizador) e, acima de
            oito, a barra segmentada, que diz a proporção.
          </>
        }
        code={`<CarouselDots />                {/* pontos */}
<CarouselDots variant="pill" />   {/* o ativo alonga */}
<CarouselDots variant="bar" />    {/* barra segmentada */}
<CarouselStatus />                {/* "3 de 12", e a região role="status" */}`}
        previewClassName="flex-col items-stretch gap-6"
      >
        <div className="flex w-full flex-col gap-6">
          {(["dot", "pill", "bar"] as const).map((variant) => (
            <Carousel key={variant} controls="none" className="w-full">
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
              <div className="mt-3 flex items-center justify-between gap-4">
                <CarouselStatus />
                <CarouselDots variant={variant} className={variant === "bar" ? "flex-1" : undefined} />
              </div>
            </Carousel>
          ))}
        </div>
      </DocSection>

      <DocSection
        title="Vertical"
        description={
          <>
            <code>orientation=&quot;vertical&quot;</code> troca o eixo, a calha,
            o glifo da seta e as teclas. O viewport precisa de altura.
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

      <DocNote title="Os efeitos leem uma variável, e nada transiciona">
        Um driver só escreve em cada slide <code>--carousel-slide-s</code> (a
        distância ao encaixe, em passos, com sinal) e{" "}
        <code>--carousel-slide-d</code> (sem sinal). <code>scale</code>,{" "}
        <code>spotlight</code>, <code>parallax</code> e <code>curve</code> são{" "}
        <code>@utility carousel-effect-*</code> que só leem a variável. Ela muda
        a cada quadro de rolagem, e quem suaviza é o embla. Com movimento
        reduzido, escala, giro e deslocamento zeram; a opacidade do{" "}
        <code>spotlight</code> fica, porque não move nada.
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
            prop: "effect",
            type: '"none" | "scale" | "spotlight" | "parallax" | "curve"',
            default: '"none"',
            description:
              "O movimento dos itens conforme se afastam do centro. spotlight também centraliza e liga o loop.",
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
              "Opções do embla: align, dragFree, slidesToScroll, containScroll.",
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
            type: "index: number",
            description: "A tira de miniaturas, um segundo embla sincronizado.",
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
