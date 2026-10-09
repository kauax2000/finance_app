"use client"

import * as React from "react"
import {
  ArrowTopRightOnSquareIcon,
  BellIcon,
  CheckIcon,
  EllipsisVerticalIcon,
  InformationCircleIcon,
  PlusIcon,
  ShoppingCartIcon,
  SparklesIcon,
  TruckIcon,
} from "@heroicons/react/16/solid"
import Link from "next/link"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardBody,
  CardContent,
  CardDescription,
  CardField,
  CardFooter,
  CardHeader,
  CardLink,
  CardMedia,
  CardMessage,
  CardNote,
  CardSkeleton,
  CardTitle,
  CardToolbar,
} from "@/components/ui/card"
import { ColorTile } from "@/components/ui/color-tile"
import { TILE_PALETTE } from "@/lib/tile-palette"
import { Label } from "@/components/ui/label"
import { MoneyDisplay } from "@/components/ui/money-display"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

/** Três cores da paleta de categoria, para os ladrilhos das demonstrações. */
const [VERDE, AZUL, AMBAR] = [TILE_PALETTE[7].hex, TILE_PALETTE[1].hex, TILE_PALETTE[6].hex]

const FOTO = (semente: string, l = 800, a = 450) =>
  `https://picsum.photos/seed/${semente}/${l}/${a}`

export default function CardDoc() {
  return (
    <>
      <Usage>
        Agrupa conteúdo que se lê junto. Texto e números levam o respiro padrão; lista, tabela ou gráfico que sangra até a borda é painel — <code>padding=&quot;none&quot;</code>, com <code>CardToolbar</code> e <code>CardNote</code>. Nunca cartão dentro de cartão: para subdividir, <code>Separator</code>, <code>CardField</code> ou <code>PageSection</code>.
      </Usage>

      {/* Os espécimes de superfície têm chão próprio (`bg-background`): a
          moldura do Preview é `bg-card`, e um cartão sobre a própria superfície
          não mostra superfície nenhuma. */}
      <DocSection
        title="Superfície"
        description="variant decide borda e preenchimento, nunca o respiro. outline é o cartão do app; elevated o levanta sobre conteúdo atrás; muted rebaixa o contêiner de segunda ordem; plain só agrupa onde a superfície já é de outro; dashed é o lugar de um cartão que ainda não existe."
        code={`<Card>…</Card>                       {/* outline */}
<Card variant="elevated">…</Card>
<Card variant="muted">…</Card>
<Card variant="plain">…</Card>
<Card variant="dashed">…</Card>`}
        previewClassName="grid grid-cols-1 items-stretch gap-4 bg-background sm:grid-cols-2"
      >
        {(
          [
            ["outline", "Chapado sobre a página."],
            ["elevated", "O mesmo, levantado."],
            ["muted", "Contêiner de segunda ordem."],
            ["plain", "Só agrupa. Sem borda."],
            ["dashed", "O lugar do que ainda não existe."],
          ] as const
        ).map(([variant, hint]) => (
          <Card key={variant} variant={variant}>
            <CardHeader>
              <CardTitle className="font-mono">{variant}</CardTitle>
              <CardDescription>{hint}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </DocSection>

      <DocSection
        title="Marca"
        description="A borda que se ilumina: o arco-íris acende num arco da borda conforme o ponteiro se aproxima, e viaja até ele — o mesmo brilho do Alert brand. Passe o mouse perto do cartão. Uma por tela; no telefone ele fica igual ao outline."
        code={`<Card variant="brand">…</Card>`}
        previewClassName="justify-center py-10"
      >
        <Card variant="brand" className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Saldo do mês</CardTitle>
            <CardDescription>Entradas menos saídas, até hoje.</CardDescription>
          </CardHeader>
          <CardContent>
            <MoneyDisplay value={8432.15} size="2xl" />
          </CardContent>
        </Card>
      </DocSection>

      <DocSection
        title="Ritmo interno"
        description="padding decide o respiro, uma medida só para o casco e os slots; md é o padrão. none é o painel: o corpo sangra, e as tiras de topo e de pé mantêm os 16px delas."
        code={`<Card padding="none">…</Card>
<Card padding="sm">…</Card>
<Card>…</Card>            {/* md */}
<Card padding="lg">…</Card>`}
        previewClassName="grid grid-cols-1 items-start gap-4 sm:grid-cols-2"
      >
        {(
          [
            ["none", "0 · o painel"],
            ["sm", "12"],
            ["md", "16 · padrão"],
            ["lg", "24"],
          ] as const
        ).map(([padding, hint]) => (
          <Card key={padding} padding={padding}>
            <CardToolbar>
              <span className="font-mono">padding=&quot;{padding}&quot;</span>
              <span className="tabular-nums">{hint}</span>
            </CardToolbar>
            <CardContent>
              <div className="rounded-surface bg-muted py-3 text-center text-xs text-muted-foreground">
                corpo
              </div>
            </CardContent>
          </Card>
        ))}
      </DocSection>

      <DocSection
        title="Painel"
        description="A forma mais comum do app: barra de topo, conteúdo de borda a borda e letra miúda no pé."
        code={`<Card padding="none">
  <CardToolbar>Fatura de março<Badge tone="warning" size="xs">Aberta</Badge></CardToolbar>
  <CardContent className="divide-y divide-border">…</CardContent>
  <CardNote>…</CardNote>
</Card>`}
        previewClassName="items-stretch"
      >
        <Card padding="none" className="w-full max-w-sm">
          <CardToolbar>
            Fatura de março
            <Badge tone="warning" size="xs">
              Aberta
            </Badge>
          </CardToolbar>
          <CardContent className="divide-y divide-border">
            {[
              ["Mercado do bairro", 214.9],
              ["Assinatura de streaming", 39.9],
              ["Farmácia", 87.5],
            ].map(([label, value]) => (
              <div key={label as string} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <span className="min-w-0 truncate">{label}</span>
                <MoneyDisplay value={value as number} size="sm" tone="expense" />
              </div>
            ))}
          </CardContent>
          <CardNote>
            <InformationCircleIcon className="mt-px size-3.5 shrink-0" aria-hidden />
            Lançamentos após o fechamento entram na próxima fatura.
          </CardNote>
        </Card>
      </DocSection>

      <DocSection
        title="Cabeçalho"
        description="Título, descrição e a ação da linha do título, dentro do respiro do casco. Título e descrição não levam gap: são o mesmo dado em duas linhas. media põe o ícone, o ladrilho de cor ou o avatar à esquerda, centrado nas duas linhas."
        code={`<CardHeader media={<ColorTile color={categoria.cor}><ShoppingCartIcon /></ColorTile>}>
  <CardTitle>Mercado</CardTitle>
  <CardDescription>31 transações neste mês</CardDescription>
  <CardAction><Button variant="tertiary" size="icon-sm">…</Button></CardAction>
</CardHeader>`}
        previewClassName="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2"
      >
        <Card>
          <CardHeader>
            <CardTitle>Saldo disponível</CardTitle>
            <CardDescription>Somando as 4 carteiras ativas</CardDescription>
            <CardAction>
              <Button variant="tertiary" size="sm">
                ver
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            <MoneyDisplay value={8432.15} size="2xl" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader
            media={
              <ColorTile size="lg" color={VERDE}>
                <ShoppingCartIcon />
              </ColorTile>
            }
          >
            <CardTitle>Mercado</CardTitle>
            <CardDescription>31 transações neste mês</CardDescription>
            <CardAction>
              <Button variant="tertiary" size="icon-sm" aria-label="Opções da categoria">
                <EllipsisVerticalIcon aria-hidden />
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            <MoneyDisplay value={-1204.55} size="xl" tone="expense" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader
            media={
              <Avatar>
                <AvatarFallback>KL</AvatarFallback>
              </Avatar>
            }
          >
            <CardTitle>Kauã Leandro</CardTitle>
            <CardDescription>Responsável · entrou em março</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader
            media={
              <span className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <BellIcon aria-hidden className="size-4" />
              </span>
            }
          >
            <CardTitle>Notificações</CardTitle>
            <CardDescription>Vencimentos, convites e faturas</CardDescription>
          </CardHeader>
        </Card>
      </DocSection>

      <DocSection
        title="Tamanho do título"
        description="CardTitle size: md (text-base) é o padrão — era lg, e quase todo título do app o rebaixava. lg fica para o cartão que é a seção da tela; sm, para o cartão denso numa grade."
        code={`<CardTitle size="sm" />
<CardTitle />          {/* md */}
<CardTitle size="lg" />`}
        previewClassName="grid grid-cols-1 items-start gap-3 sm:grid-cols-3"
      >
        {(["sm", "md", "lg"] as const).map((size) => (
          <Card key={size} padding="sm">
            <CardHeader>
              <CardTitle size={size}>Fatura de março</CardTitle>
              <CardDescription className="font-mono text-xs">size=&quot;{size}&quot;</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </DocSection>

      <DocSection
        title="Rodapé de ações"
        description="CardFooter é a tira dos botões que fecham o cartão. Letra miúda que ninguém clica é CardNote."
        code={`<CardFooter className="justify-end">
  <Button variant="tertiary" size="sm" type="button">Agora não</Button>
  <Button size="sm">Pagar fatura</Button>
</CardFooter>`}
        previewClassName="items-stretch"
      >
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Fatura de março</CardTitle>
            <CardDescription>Fecha em 28/03, vence em 05/04</CardDescription>
          </CardHeader>
          <CardContent>
            <MoneyDisplay value={1482.3} size="2xl" tone="expense" />
          </CardContent>
          <CardFooter className="justify-end">
            <Button variant="tertiary" size="sm" type="button">
              agora não
            </Button>
            <Button size="sm">pagar fatura</Button>
          </CardFooter>
        </Card>
      </DocSection>

      <DocSection
        title="Cartão clicável"
        description="Quando o cartão inteiro é o alvo e não há outro alvo dentro, ele é o link: interactive traz elevação, par active: e anel de foco, e asChild faz o Link ser o próprio cartão."
        code={`<Card interactive asChild padding="none">
  <Link href="/categories/mercado">…</Link>
</Card>`}
        previewClassName="items-stretch bg-background"
      >
        <Card interactive asChild padding="none" className="w-full max-w-sm no-underline">
          <Link href="/designsystem/card">
            <CardToolbar>
              Mercado
              <ArrowTopRightOnSquareIcon className="size-3.5" aria-hidden />
            </CardToolbar>
            <CardContent className="flex items-baseline justify-between gap-3 px-4 py-3">
              <MoneyDisplay value={1204.55} size="lg" tone="expense" />
              <span className="text-xs text-muted-foreground">31 transações</span>
            </CardContent>
          </Link>
        </Card>
      </DocSection>

      <DocSection
        title="Clicável, com ações dentro"
        description="CardLink é o link esticado: vai no título, e a película dele cobre o cartão. O menu e os botões do rodapé continuam alvos próprios, acima dela — o que interactive asChild não permite, porque botão dentro de link é inválido. O cartão acende com o cursor e o foco do link."
        code={`<Card>
  <CardHeader>
    <CardTitle><CardLink asChild><Link href="/bills/aluguel">Aluguel</Link></CardLink></CardTitle>
    <CardDescription>Vence dia 10</CardDescription>
  </CardHeader>
  <CardContent>…</CardContent>
  <CardFooter className="justify-end">
    <Button size="sm">Pagar</Button>
  </CardFooter>
</Card>`}
        previewClassName="items-stretch bg-background"
      >
        <Card className="w-full max-w-sm">
          <CardHeader
            media={
              <ColorTile size="lg" color={AZUL}>
                <TruckIcon />
              </ColorTile>
            }
          >
            <CardTitle>
              <CardLink href="#">Aluguel</CardLink>
            </CardTitle>
            <CardDescription>Mensal · vence dia 10</CardDescription>
          </CardHeader>
          <CardContent>
            <MoneyDisplay value={-1850} size="xl" tone="expense" />
          </CardContent>
          <CardFooter className="justify-end">
            <Button variant="tertiary" size="sm" type="button">
              adiar
            </Button>
            <Button size="sm" type="button">
              pagar
            </Button>
          </CardFooter>
        </Card>
      </DocSection>

      <DocSection
        title="Estados: inativo e escolhido"
        description="inactive recua o cartão — continua legível e clicável — e pede o Badge que diz por quê. selected é o contorno e o tingido do cartão de escolha; o papel (aria-pressed numa grade de opções, aria-current para “você”) é de quem chama."
        code={`<Card inactive>…<Badge variant="outline">Inativo</Badge></Card>
<Card selected asChild interactive><button aria-pressed>…</button></Card>`}
        previewClassName="flex-col items-stretch gap-4 bg-background"
      >
        <Card inactive className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Nubank Ultravioleta</CardTitle>
            <CardDescription>Final 4421</CardDescription>
            <CardAction>
              <Badge variant="outline" size="sm">
                Inativo
              </Badge>
            </CardAction>
          </CardHeader>
        </Card>
        <EscolhaDemo />
      </DocSection>

      <DocSection
        title="Horizontal"
        description="orientation=&quot;horizontal&quot; põe a mídia à esquerda e o CardBody à direita, a partir de sm; abaixo, empilha. O casco perde o respiro vertical ao deitar, e o CardBody o devolve, para a capa sangrar de cima a baixo."
        code={`<Card orientation="horizontal">
  <CardMedia src={capa} alt="" />
  <CardBody>
    <CardHeader>…</CardHeader>
    <CardContent>…</CardContent>
  </CardBody>
</Card>`}
        previewClassName="items-stretch"
      >
        <Card orientation="horizontal" className="w-full max-w-xl">
          <CardMedia src={FOTO("viagem", 600, 600)} alt="" />
          <CardBody>
            <CardHeader>
              <CardTitle>Viagem de julho</CardTitle>
              <CardDescription>Meta de economia · 4 de 6 meses</CardDescription>
            </CardHeader>
            <CardContent>
              <Progress value={4200} max={6000} size="sm" aria-label="Progresso da meta" />
            </CardContent>
            <CardFooter>
              <Button variant="tertiary" size="sm" type="button">
                ver aportes
              </Button>
            </CardFooter>
          </CardBody>
        </Card>
      </DocSection>

      <DocSection
        title="Capa"
        description="CardMedia é a capa: a imagem na proporção pedida (video, square, portrait ou auto), e o texto opcional sobre ela, no véu --scrim, que é o mesmo nos dois temas porque a foto não muda com o tema."
        code={`<Card padding="none">
  <CardMedia src={capa} alt="" aspect="video">
    <span className="text-sm font-semibold">Guia do ano</span>
  </CardMedia>
  …
</Card>`}
        previewClassName="grid grid-cols-1 items-start gap-4 sm:grid-cols-2"
      >
        <Card>
          <CardMedia src={FOTO("guia", 800, 450)} alt="" aspect="video" />
          <CardHeader>
            <CardTitle>Como o ciclo da fatura funciona</CardTitle>
            <CardDescription>Fechamento, vencimento e onde cada compra cai.</CardDescription>
          </CardHeader>
        </Card>
        <Card padding="none">
          <CardMedia src={FOTO("ano", 800, 450)} alt="" aspect="video">
            <span className="text-xs font-medium opacity-80">Retrospectiva</span>
            <span className="text-base font-semibold">Seu 2026 em números</span>
          </CardMedia>
          <CardNote>Atualizado todo dia 1.</CardNote>
        </Card>
      </DocSection>

      <DocSection
        title="Campos"
        description="CardField é o ladrilho “rótulo + valor” de dentro de um cartão ou de uma folha — o detalhe de uma transação, de uma assinatura, de uma conta. O valor é children, e pode ser qualquer coisa: texto, número, um Badge."
        code={`<div className="grid gap-3 sm:grid-cols-2">
  <CardField label="Categoria">Mercado</CardField>
  <CardField label="Data">12/03/2026</CardField>
</div>`}
        previewClassName="items-stretch"
      >
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Supermercado Dia</CardTitle>
            <CardDescription>Despesa · cartão Nubank</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <CardField label="Valor">
              <MoneyDisplay value={-214.9} tone="expense" />
            </CardField>
            <CardField label="Data">
              <span className="tabular-nums">12/03/2026</span>
            </CardField>
            <CardField label="Situação" className="sm:col-span-2">
              <Badge tone="success" size="sm" className="self-start">
                Lançada
              </Badge>
            </CardField>
          </CardContent>
        </Card>
      </DocSection>

      <DocSection
        title="Mensagem"
        description="CardMessage é a mensagem que ocupa o cartão: o erro de carregar (destructive, role=&quot;alert&quot;) ou o “nada aqui” curto. Para o vazio que pede ação, o EmptyState."
        code={`<Card><CardMessage tone="destructive">Não foi possível carregar.</CardMessage></Card>
<Card><CardMessage>Nenhuma assinatura neste espaço.</CardMessage></Card>`}
        previewClassName="grid grid-cols-1 items-start gap-4 sm:grid-cols-2"
      >
        <Card>
          <CardMessage tone="destructive">Não foi possível carregar as assinaturas.</CardMessage>
        </Card>
        <Card>
          <CardMessage>Nenhuma assinatura neste espaço.</CardMessage>
        </Card>
      </DocSection>

      <DocSection
        title="Carregando"
        description="CardSkeleton é o cartão esperando dado, na forma do de verdade: a barra, as linhas e, se houver, o rodapé. children troca as linhas pelo miolo próprio. Ele não anuncia nada — quem espera é o SkeletonGroup da página."
        code={`<SkeletonGroup label="Carregando faturas">
  <CardSkeleton lines={3} footer />
</SkeletonGroup>`}
        previewClassName="grid grid-cols-1 items-start gap-4 sm:grid-cols-2"
      >
        <CardSkeleton lines={3} footer />
        <CardSkeleton toolbar={false} lines={2} />
      </DocSection>

      <DocSection
        title="Exemplos"
        description="Cartões do app montados só com as peças — nenhum casco, faixa ou ladrilho escrito à mão."
        previewClassName="grid grid-cols-1 items-start gap-4 bg-background md:grid-cols-2"
      >
        {/* Indicador */}
        <Card>
          <CardHeader>
            <CardDescription>Gasto em março</CardDescription>
            <CardTitle size="lg">
              <MoneyDisplay value={-4218.6} size="2xl" tone="expense" />
            </CardTitle>
            <CardAction>
              <Badge tone="warning" size="sm">
                +12%
              </Badge>
            </CardAction>
          </CardHeader>
          <CardContent>
            <Progress value={4218} max={5000} bands={[85, 100]} size="sm" aria-label="Uso do orçamento" />
          </CardContent>
          <CardNote>R$ 781,40 até o limite do orçamento.</CardNote>
        </Card>

        {/* Configuração */}
        <Card padding="none">
          <CardToolbar variant="title">Notificações</CardToolbar>
          <CardContent className="divide-y divide-border">
            {(
              [
                ["Vencimentos", "Um dia antes de cada conta", true],
                ["Faturas", "Quando a fatura fecha", true],
                ["Convites", "Quando alguém te convida", false],
              ] as const
            ).map(([titulo, texto, ligado]) => (
              <Label key={titulo} className="flex items-center justify-between gap-3 px-4 py-3 font-normal">
                <span className="flex min-w-0 flex-col">
                  <span className="text-sm font-medium">{titulo}</span>
                  <span className="text-xs text-muted-foreground">{texto}</span>
                </span>
                <Switch defaultChecked={ligado} aria-label={titulo} />
              </Label>
            ))}
          </CardContent>
        </Card>

        {/* Plano — `outline`, e não `brand`: o brilho de marca é um por tela, e
            esta página já o mostra na seção Marca. */}
        <Card>
          <CardHeader
            media={
              <span className="flex size-9 items-center justify-center rounded-lg bg-muted">
                <SparklesIcon aria-hidden className="size-4" />
              </span>
            }
          >
            <CardTitle>Plano Família</CardTitle>
            <CardDescription>Até 6 pessoas na mesma carteira</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <p className="flex items-baseline gap-1">
              <MoneyDisplay value={29.9} size="2xl" />
              <span className="text-sm text-muted-foreground">/mês</span>
            </p>
            <ul className="flex flex-col gap-1.5 text-sm">
              {["Carteiras ilimitadas", "Divisão de despesas", "Relatórios anuais"].map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <CheckIcon aria-hidden className="size-4 text-success" />
                  {f}
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            <Button className="w-full">assinar</Button>
          </CardFooter>
        </Card>

        {/* Conta a pagar */}
        <Card>
          <CardHeader
            media={
              <ColorTile size="lg" color={AMBAR}>
                <ShoppingCartIcon />
              </ColorTile>
            }
          >
            <CardTitle>
              <CardLink href="#">Condomínio</CardLink>
            </CardTitle>
            <CardDescription>Mensal · dia 8</CardDescription>
            <CardAction>
              <Badge tone="warning" size="sm">
                vence amanhã
              </Badge>
            </CardAction>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            <CardField label="Próxima">
              <MoneyDisplay value={-640} tone="expense" />
            </CardField>
            <CardField label="Média 90d">
              <MoneyDisplay value={-628.4} />
            </CardField>
          </CardContent>
          <CardFooter className="justify-end">
            <Button size="sm" type="button">
              marcar como paga
            </Button>
          </CardFooter>
        </Card>

        {/* Adicionar */}
        <Card variant="dashed" interactive asChild padding="lg">
          <button type="button" className="items-center justify-center text-center">
            <PlusIcon aria-hidden className="size-4" />
            <span className="text-sm font-medium">Adicionar cartão de crédito</span>
          </button>
        </Card>
      </DocSection>

      <DocSection
        title="Anatomia"
        description="As peças, na ordem da tela. As três tiras — CardToolbar, CardFooter e CardNote — sangram até a borda, e o casco recolhe o respiro daquele lado sozinho. CardMedia encosta nas bordas como as tiras; CardBody é a coluna do cartão horizontal."
        code={`<Card>
  <CardMedia />       {/* a capa: sangra até a borda                  */}
  <CardToolbar />     {/* tira de topo: sem fio, sem tinta            */}
  <CardHeader media>  {/* dentro do respiro, na superfície do corpo   */}
    <CardTitle><CardLink /></CardTitle>
    <CardDescription />
    <CardAction />    {/* na linha do título, à direita               */}
  </CardHeader>
  <CardContent>
    <CardField />     {/* o ladrilho rótulo + valor                   */}
  </CardContent>
  <CardFooter />      {/* tira de ações: pesa, tem alvo de toque      */}
  <CardNote />        {/* tira de letra miúda: não se clica           */}
</Card>`}
        previewClassName="items-stretch"
      >
        <Card padding="none" className="w-full max-w-sm">
          <CardToolbar>
            <span className="font-mono">CardToolbar</span>
          </CardToolbar>
          <div className="px-4 pt-4">
            <CardHeader className="px-0">
              <CardTitle className="font-mono">CardTitle</CardTitle>
              <CardDescription className="font-mono">CardDescription</CardDescription>
              <CardAction>
                <Badge tone="neutral" size="xs" className="font-mono">
                  CardAction
                </Badge>
              </CardAction>
            </CardHeader>
            <Separator className="my-4" />
            <CardField label={<span className="font-mono">CardField</span>} className="mb-4">
              <span className="font-mono text-xs text-muted-foreground">CardContent</span>
            </CardField>
          </div>
          <CardFooter className="justify-end">
            <Badge tone="neutral" size="xs" className="font-mono">
              CardFooter
            </Badge>
          </CardFooter>
          <CardNote>
            <span className="font-mono">CardNote</span>
          </CardNote>
        </Card>
      </DocSection>

      <PropsTable
        rows={[
          {
            prop: "variant",
            type: '"outline" | "elevated" | "muted" | "plain" | "brand" | "dashed"',
            default: '"outline"',
            description: "Borda e superfície; nunca o respiro. brand — uma por tela; dashed, o lugar do que ainda não existe.",
          },
          {
            prop: "padding",
            type: '"none" | "sm" | "md" | "lg"',
            default: '"md"',
            description: "Respiro do casco e recuo dos slots. none é o painel: o corpo sangra e as tiras mantêm 16px.",
          },
          {
            prop: "inactive · selected",
            type: "boolean",
            default: "false",
            description: "inactive recua o cartão; selected é o contorno de escolha. O Badge e o papel ARIA são de quem chama.",
          },
          {
            prop: "orientation",
            type: '"vertical" | "horizontal"',
            default: '"vertical"',
            description: "horizontal: a mídia à esquerda e o CardBody à direita a partir de sm.",
          },
          {
            prop: "interactive · asChild",
            type: "boolean",
            default: "false",
            description: "O cartão inteiro é o alvo, e vira o filho — um link ou um botão. Com outro alvo dentro, CardLink.",
          },
        ]}
      />

      <PropsTable
        title="Peças"
        rows={[
          { prop: "CardToolbar", type: "div · variant label | title", description: "Tira de topo: rótulo à esquerda, contagem ou ação à direita; sem fio nem tinta." },
          { prop: "CardHeader", type: "div · media", description: "Título, descrição e ação; media põe o ícone, o ladrilho ou o avatar à esquerda." },
          { prop: "CardTitle", type: "div · asChild · size sm | md | lg", description: "md é o padrão; asChild troca pelo heading da seção." },
          { prop: "CardDescription", type: "div", description: "A linha sob o título. Sem gap entre os dois." },
          { prop: "CardAction", type: "div", description: "Um controle na linha do título, encostado à direita." },
          { prop: "CardLink", type: "a · asChild", description: "O link esticado, no título: o cartão clica, e os outros alvos continuam alvos." },
          { prop: "CardContent", type: "div", description: "O corpo; em padding=\"none\" não recua." },
          { prop: "CardField", type: "div · label", description: "O ladrilho rótulo + valor." },
          { prop: "CardFooter", type: "div", description: "Tira de ações no pé." },
          { prop: "CardNote", type: "div", description: "Tira de letra miúda no pé, mais quieta que o rodapé." },
          { prop: "CardMedia", type: "div · src · alt · aspect", description: "A capa, com texto opcional no véu --scrim." },
          { prop: "CardBody", type: "div", description: "A coluna de conteúdo do cartão horizontal." },
          { prop: "CardMessage", type: "div · tone default | destructive", description: "A mensagem que ocupa o cartão; destructive é role=alert." },
          { prop: "CardSkeleton", type: "Card · toolbar · lines · footer", description: "O cartão esperando dado; children troca as linhas." },
        ]}
      />

      <DocNote title="Barra de topo não é cabeçalho">
        <code>CardToolbar</code> traz o próprio respiro (<code>--card-strip-py</code>) e emoldura um corpo que sangra; <code>CardHeader</code> vive dentro do respiro do casco. Nenhuma tira tem fio nem tinta: o cartão é uma superfície só, e quem separa é o respiro.
      </DocNote>


      <DocNote title="Um alvo, ou alvos dentro">
        <code>interactive asChild</code> faz do cartão o link — e aí não cabe outro botão dentro. Com um menu na linha do título ou ações no rodapé, o cartão clica por <code>CardLink</code>, no título: o nome do link é o nome do cartão, sem um <code>aria-label</code> que apague o resto.
      </DocNote>

      <DocNote title="Elevação é variant, não classe">
        O cartão chapado não tem sombra, então não escreva <code>shadow-none</code>. Quem quer elevação pede <code>variant=&quot;elevated&quot;</code>. E em <code>padding=&quot;none&quot;</code> o <code>CardContent</code> já não recua: um <code>p-0</code> nele não faz nada.
      </DocNote>
    </>
  )
}

/** A grade de escolha: o cartão é o botão, com aria-pressed. */
function EscolhaDemo() {
  const [plano, setPlano] = React.useState("familia")
  const planos = [
    ["individual", "Individual", "Uma pessoa"],
    ["familia", "Família", "Até 6 pessoas"],
  ] as const
  return (
    <div className="grid w-full max-w-md grid-cols-2 gap-3" role="group" aria-label="Plano">
      {planos.map(([id, nome, texto]) => (
        <Card
          key={id}
          asChild
          interactive
          selected={plano === id}
          padding="sm"
        >
          <button type="button" aria-pressed={plano === id} onClick={() => setPlano(id)} className="text-left">
            <CardHeader>
              <CardTitle size="sm">{nome}</CardTitle>
              <CardDescription>{texto}</CardDescription>
            </CardHeader>
          </button>
        </Card>
      ))}
    </div>
  )
}
