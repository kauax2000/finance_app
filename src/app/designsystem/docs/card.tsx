"use client"

import {
  ArrowTopRightOnSquareIcon,
  InformationCircleIcon,
} from "@heroicons/react/16/solid"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardNote,
  CardTitle,
  CardToolbar,
} from "@/components/ui/card"
import { MoneyDisplay } from "@/components/ui/money-display"
import { Separator } from "@/components/ui/separator"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

export default function CardDoc() {
  return (
    <>
      <Usage>
        Agrupa conteúdo que se lê junto. Texto e números levam o respiro padrão; lista, tabela ou gráfico que sangra até a borda é painel — <code>padding=&quot;none&quot;</code>, com <code>CardToolbar</code> e <code>CardNote</code>. Nunca cartão dentro de cartão: para subdividir, <code>Separator</code> ou <code>PageSection</code>.
      </Usage>

      {/* Dois espécimes desta página têm chão próprio — este e o do cartão
          clicável —, e o motivo é o mesmo: a moldura do Preview é `bg-card`, e
          um cartão sobre a própria superfície não mostra superfície nenhuma.
          `plain` some, `elevated` não tem de onde se levantar e a elevação do
          cursor não tem onde aparecer. `bg-background` é o chão que o app
          realmente põe embaixo de um cartão. */}
      <DocSection
        title="Superfície"
        description="variant decide borda e preenchimento, nunca o respiro. outline é o cartão do app; elevated o levanta sobre conteúdo atrás; muted rebaixa o contêiner de segunda ordem; plain só agrupa onde a superfície já é de outro."
        code={`<Card>…</Card>                       {/* outline */}
<Card variant="elevated">…</Card>
<Card variant="muted">…</Card>
<Card variant="plain">…</Card>`}
        previewClassName="grid grid-cols-1 items-stretch gap-4 bg-background sm:grid-cols-2"
      >
        {(
          [
            ["outline", "Chapado sobre a página."],
            ["elevated", "O mesmo, levantado."],
            ["muted", "Contêiner de segunda ordem."],
            ["plain", "Só agrupa. Sem borda."],
          ] as const
        ).map(([variant, hint]) => (
          <Card key={variant} variant={variant}>
            <CardHeader>
              <CardTitle className="font-mono text-base">{variant}</CardTitle>
              <CardDescription>{hint}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </DocSection>

      {/* `items-start`, e não `items-stretch`: com os cartões na altura natural,
          a diferença entre os quatro degraus é a altura — que é o que a seção
          veio mostrar. Esticados, todos terminam na mesma linha e o respiro
          extra do maior vira folga vazia no pé do menor. */}
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
              <div className="rounded-md bg-muted py-3 text-center text-xs text-muted-foreground">
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
  <CardToolbar>
    Fatura de março
    <Badge tone="warning" size="xs">Aberta</Badge>
  </CardToolbar>
  <CardContent className="divide-y divide-border">…</CardContent>
  <CardNote>
    <InformationCircleIcon className="mt-px size-3.5 shrink-0" aria-hidden />
    Lançamentos após o fechamento entram na próxima fatura.
  </CardNote>
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
              <div
                key={label as string}
                className="flex items-center justify-between gap-3 px-4 py-2.5"
              >
                <span className="min-w-0 truncate">{label}</span>
                <MoneyDisplay
                  value={value as number}
                  size="sm"
                  tone="expense"
                />
              </div>
            ))}
          </CardContent>
          <CardNote>
            <InformationCircleIcon
              className="mt-px size-3.5 shrink-0"
              aria-hidden
            />
            Lançamentos após o fechamento entram na próxima fatura.
          </CardNote>
        </Card>
      </DocSection>

      <DocSection
        title="Cabeçalho"
        description="Título, descrição e a ação da linha do título, dentro do respiro do casco. Título e descrição não levam gap: são o mesmo dado em duas linhas."
        code={`<Card>
  <CardHeader>
    <CardTitle>Saldo disponível</CardTitle>
    <CardDescription>Somando as 4 carteiras ativas</CardDescription>
    <CardAction>
      <Button variant="tertiary" size="sm">Ver</Button>
    </CardAction>
  </CardHeader>
  <CardContent>…</CardContent>
</Card>`}
        previewClassName="items-stretch"
      >
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Saldo disponível</CardTitle>
            <CardDescription>Somando as 4 carteiras ativas</CardDescription>
            <CardAction>
              <Button variant="tertiary" size="sm">
                Ver
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            <MoneyDisplay value={8432.15} size="2xl" />
          </CardContent>
        </Card>
      </DocSection>

      <DocSection
        title="Rodapé de ações"
        description="CardFooter é a tira dos botões que fecham o cartão. Letra miúda que ninguém clica é CardNote."
        code={`<Card>
  <CardHeader>…</CardHeader>
  <CardContent>…</CardContent>
  <CardFooter className="justify-end">
    <Button variant="tertiary" size="sm" type="button">Agora não</Button>
    <Button size="sm">Pagar fatura</Button>
  </CardFooter>
</Card>`}
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
              Agora não
            </Button>
            <Button size="sm">Pagar fatura</Button>
          </CardFooter>
        </Card>
      </DocSection>

      <DocSection
        title="Cartão clicável"
        description="Quando o cartão inteiro é o alvo, ele é o link: interactive traz elevação, par active: e anel de foco, e asChild faz o Link ser o próprio cartão. Não ponha um segundo alvo dentro — dois destinos numa superfície confundem o clique."
        code={`<Card interactive asChild padding="none">
  <Link href="/categories/mercado">
    <CardToolbar>Mercado<ArrowTopRightOnSquareIcon className="size-3.5" /></CardToolbar>
    <CardContent className="py-3">…</CardContent>
  </Link>
</Card>`}
        previewClassName="items-stretch bg-background"
      >
        <Card
          interactive
          asChild
          padding="none"
          className="w-full max-w-sm no-underline"
        >
          <Link href="/designsystem/card">
            <CardToolbar>
              Mercado
              <ArrowTopRightOnSquareIcon className="size-3.5" aria-hidden />
            </CardToolbar>
            <CardContent className="flex items-baseline justify-between gap-3 px-4 py-3">
              <MoneyDisplay value={1204.55} size="lg" tone="expense" />
              <span className="text-xs text-muted-foreground">
                31 transações
              </span>
            </CardContent>
          </Link>
        </Card>
      </DocSection>

      <DocSection
        title="Anatomia"
        description="Sete peças, na ordem da tela. As três tiras — CardToolbar, CardFooter e CardNote — sangram até a borda, e o casco recolhe o respiro daquele lado sozinho."
        code={`<Card>
  <CardToolbar />   {/* tira de topo: sem fio, sem tinta, respiro próprio */}
  <CardHeader>      {/* dentro do respiro, na superfície do corpo    */}
    <CardTitle />
    <CardDescription />
    <CardAction />  {/* na linha do título, à direita                */}
  </CardHeader>
  <CardContent />
  <CardFooter />    {/* tira de ações: pesa, tem alvo de toque       */}
  <CardNote />      {/* tira de letra miúda: não se clica            */}
</Card>`}
        previewClassName="items-stretch"
      >
        <Card padding="none" className="w-full max-w-sm">
          <CardToolbar>
            <span className="font-mono">CardToolbar</span>
          </CardToolbar>
          <div className="px-4 pt-4">
            <CardHeader className="px-0">
              <CardTitle className="font-mono text-base">CardTitle</CardTitle>
              <CardDescription className="font-mono">
                CardDescription
              </CardDescription>
              <CardAction>
                <Badge tone="neutral" size="xs" className="font-mono">
                  CardAction
                </Badge>
              </CardAction>
            </CardHeader>
            <Separator className="my-4" />
            <p className="pb-4 font-mono text-xs text-muted-foreground">
              CardContent
            </p>
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
            type: '"outline" | "elevated" | "muted" | "plain"',
            default: '"outline"',
            description:
              "Borda e superfície; nunca o respiro.",
          },
          {
            prop: "padding",
            type: '"none" | "sm" | "md" | "lg"',
            default: '"md"',
            description:
              "Respiro do casco e recuo dos slots. none é o painel: o corpo sangra e as tiras mantêm 16px.",
          },
          {
            prop: "interactive",
            type: "boolean",
            default: "false",
            description:
              "O cartão inteiro é o alvo: elevação, par active: e anel de foco. Use com asChild.",
          },
          {
            prop: "asChild",
            type: "boolean",
            default: "false",
            description:
              "O cartão vira o filho — um link ou um botão.",
          },
        ]}
      />

      <PropsTable
        title="Slots"
        rows={[
          {
            prop: "CardToolbar",
            type: "div",
            description:
              "Tira de topo: rótulo à esquerda, contagem ou ação à direita; sem fio nem tinta.",
          },
          {
            prop: "CardHeader",
            type: "div",
            description:
              "Título, descrição e ação; vira grade de duas colunas quando há CardAction.",
          },
          {
            prop: "CardTitle",
            type: "div · asChild",
            description:
              "div por padrão, para uma grade de cartões não despejar headings; asChild troca pelo heading da seção.",
          },
          {
            prop: "CardDescription",
            type: "div",
            description:
              "A linha sob o título. Sem gap entre os dois: é o mesmo dado em duas linhas.",
          },
          {
            prop: "CardAction",
            type: "div",
            description:
              "Um controle na linha do título, encostado à direita.",
          },
          {
            prop: "CardContent",
            type: "div",
            description:
              "O corpo; em padding=\"none\" não recua.",
          },
          {
            prop: "CardFooter",
            type: "div",
            description:
              "Tira de ações no pé, com o respiro da barra de topo.",
          },
          {
            prop: "CardNote",
            type: "div",
            description:
              "Tira de letra miúda no pé — contagem, origem do número, ressalva —, mais quieta que o rodapé.",
          },
        ]}
      />

      <DocNote title="Barra de topo não é cabeçalho">
        <code>CardToolbar</code> traz o próprio respiro (<code>--card-strip-py</code>) e emoldura um corpo que sangra; <code>CardHeader</code> vive dentro do respiro do casco. Nenhuma tira tem fio nem tinta: o cartão é uma superfície só, e quem separa é o respiro.
      </DocNote>

      <DocNote title="Cartão não tem tom de dinheiro">
        Superfície tingida de entrada e saída é o <code>StatCard</code>, que mede o número contra o tingido. Um <code>tone</code> aqui convidaria cor sem significado — e <code>success</code> não é <code>income</code>.
      </DocNote>

      <DocNote title="Elevação é variant, não classe">
        O cartão chapado não tem sombra, então não escreva <code>shadow-none</code>. Quem quer elevação pede <code>variant=&quot;elevated&quot;</code>.
      </DocNote>
    </>
  )
}
