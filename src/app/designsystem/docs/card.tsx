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
        Agrupa conteúdo que se lê junto. Duas formas, e a escolha é uma só: se o
        conteúdo é <strong>texto e números</strong>, o cartão dá o respiro
        (<code>padding</code> padrão); se o conteúdo é uma{" "}
        <strong>lista, tabela ou gráfico</strong> que precisa sangrar até a
        borda, é painel — <code>padding=&quot;none&quot;</code>, com{" "}
        <code>CardToolbar</code> em cima e <code>CardNote</code> embaixo. Cartão
        dentro de cartão não: dois níveis de superfície elevada apagam a
        hierarquia do primeiro. Para subdividir, <code>Separator</code> ou{" "}
        <code>PageSection</code>.
      </Usage>

      {/* Dois espécimes desta página têm chão próprio — este e o do cartão
          clicável —, e o motivo é o mesmo: a moldura do Preview é `bg-card`, e
          um cartão sobre a própria superfície não mostra superfície nenhuma.
          `ghost` some, `elevated` não tem de onde se levantar e a elevação do
          cursor não tem onde aparecer. `bg-background` é o chão que o app
          realmente põe embaixo de um cartão. */}
      <DocSection
        title="Superfície"
        description="variant decide a borda e o preenchimento — nunca o respiro. outline é o cartão do app: chapado sobre a página, como o resto do sistema preenche. elevated é o mesmo levantado, para o que flutua sobre um conteúdo atrás. muted rebaixa, e serve ao contêiner de segunda ordem que não deve disputar com o cartão ao lado. ghost não desenha nada: só agrupa, onde a superfície já é de outro (dentro de um Sheet, de um Dialog)."
        code={`<Card>…</Card>                       {/* outline */}
<Card variant="elevated">…</Card>
<Card variant="muted">…</Card>
<Card variant="ghost">…</Card>`}
        previewClassName="grid grid-cols-1 items-stretch gap-4 bg-background sm:grid-cols-2"
      >
        {(
          [
            ["outline", "Chapado sobre a página."],
            ["elevated", "O mesmo, levantado."],
            ["muted", "Contêiner de segunda ordem."],
            ["ghost", "Só agrupa. Sem borda."],
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
        description="padding decide o respiro, e ele é uma medida só: o casco separa os blocos com ela e os slots recuam com ela. md é o padrão. none é o painel — o corpo perde o recuo para o conteúdo sangrar, mas as tiras de topo e de pé mantêm os seus 16px, porque uma barra com o rótulo colado na borda não é o que ninguém quis."
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
        description="A forma mais comum do app: barra de topo, conteúdo sangrando de borda a borda, letra miúda no pé. As 24 barras e 18 notas que as telas escreviam à mão — em cinco e nove grafias diferentes — são estes dois componentes."
        code={`<Card padding="none">
  <CardToolbar>
    Fatura de março
    <Badge variant="warning" size="xs">Aberta</Badge>
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
            <Badge variant="warning" size="xs">
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
        description="Título, descrição e a ação da linha do título. CardHeader compartilha a superfície do corpo — quem tem fio e tinta é o CardToolbar. Título e descrição não levam gap: são o mesmo dado em duas linhas, e quem os separa é a entrelinha."
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
        description="CardFooter é a tira onde ficam os botões que fecham o cartão. Ela pesa: tem alvo de toque e tinta de estrutura, a mesma da barra de topo. Se o que vai no pé é letra miúda que ninguém clica, é CardNote — os dois papéis já usaram este nome, e foi por isso que as 18 notas do app nasceram fora do design system."
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
        description="Quando o cartão inteiro é o alvo, ele é o link — não um link em volta dele. interactive traz a elevação no cursor, o par active: que o toque exige e o anel de foco; asChild faz o <Link> ser o próprio cartão, então há um nó a menos e o foco cai onde o olho está. Um cartão clicável não hospeda um segundo alvo dentro: dois destinos numa superfície só, e ninguém sabe onde clicou."
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
        description="Sete peças, e a ordem no JSX é a ordem na tela. As três tiras — CardToolbar, CardFooter e CardNote — sangram até a borda, e o casco recolhe o próprio respiro daquele lado sozinho: não existe rounded-t-xl para escrever, nem pt-0 para lembrar."
        code={`<Card>
  <CardToolbar />   {/* tira de topo: fio embaixo, tinta de estrutura */}
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
                <Badge variant="secondary" size="xs" className="font-mono">
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
            <Badge variant="secondary" size="xs" className="font-mono">
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
            type: '"outline" | "elevated" | "muted" | "ghost"',
            default: '"outline"',
            description:
              "A borda e a superfície. Nunca o respiro — isso é padding, e os dois eixos são independentes.",
          },
          {
            prop: "padding",
            type: '"none" | "sm" | "md" | "lg"',
            default: '"md"',
            description:
              "O respiro do casco e o recuo dos slots, na mesma medida. none é o painel: o corpo sangra até a borda e as tiras mantêm 16px.",
          },
          {
            prop: "interactive",
            type: "boolean",
            default: "false",
            description:
              "O cartão inteiro é o alvo: elevação no cursor, par active: para o toque, anel de foco. Use com asChild.",
          },
          {
            prop: "asChild",
            type: "boolean",
            default: "false",
            description:
              "O cartão vira o filho — um link ou um botão. Sem ele, um cartão clicável precisa de um nó a mais em volta.",
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
              "Tira de topo: rótulo à esquerda, contagem ou ação à direita. Fio embaixo, bg-muted/30, altura mínima de 40.",
          },
          {
            prop: "CardHeader",
            type: "div",
            description:
              "Título, descrição e ação, dentro do respiro e na superfície do corpo. Vira grade de duas colunas sozinho quando há CardAction.",
          },
          {
            prop: "CardTitle",
            type: "div · asChild",
            description:
              "div por padrão, para um grid de doze cartões não despejar doze headings. Quando o cartão é uma seção da página, asChild devolve o <h2>.",
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
              "A ação na linha do título, encostada à direita. Um controle, não uma barra deles.",
          },
          {
            prop: "CardContent",
            type: "div",
            description:
              "O corpo. Recua com o padding do casco — e em padding=\"none\" não recua, que é o ponto.",
          },
          {
            prop: "CardFooter",
            type: "div",
            description:
              "Tira de ações no pé. Mesma tinta da barra de topo, porque é a mesma coisa: estrutura emoldurando o corpo.",
          },
          {
            prop: "CardNote",
            type: "div",
            description:
              "Tira de letra miúda no pé: a contagem, a origem do número, a ressalva. Não se clica, e por isso é mais quieta que o rodapé.",
          },
        ]}
      />

      <DocNote title="Barra de topo não é cabeçalho">
        <code>CardToolbar</code> tem fio, tinta e altura mínima: ela emoldura o
        corpo, e é a peça certa quando o conteúdo sangra até a borda.{" "}
        <code>CardHeader</code> compartilha a superfície do corpo e vive dentro
        do respiro. Pôr fio e fundo num <code>CardHeader</code> ainda funciona —
        ele acerta o pé sozinho —, mas é a forma antiga de escrever a barra.
      </DocNote>

      <DocNote title="Cartão não tem tom de dinheiro">
        Verde de entrada e vermelho de saída em superfície inteira é trabalho do{" "}
        <code>StatCard</code>, que existe para isso e mede o contraste do
        número contra o tingido. Um <code>tone</code> aqui só convidaria cartão
        colorido onde a cor não significa nada — e <code>success</code> não é{" "}
        <code>income</code>.
      </DocNote>

      <DocNote title="size saiu do tipo">
        O <code>size=&quot;sm&quot;</code> de antes não era um tamanho: era{" "}
        <code>gap-0 py-0</code> com o nome errado, e as onze telas que o usavam
        escreviam <code>gap-0 py-0</code> do lado assim mesmo, porque o nome não
        dizia o que ele fazia. Virou <code>padding=&quot;none&quot;</code>, e{" "}
        <code>size</code> saiu do tipo — o compilador acusa quem o escrever,
        como já acontece com <code>variant=&quot;ghost&quot;</code> no{" "}
        <code>Button</code>.
      </DocNote>

      <DocNote title="Sombra vinha de fora">
        O cartão nunca teve sombra — e 52 chamadas do app carregavam{" "}
        <code>shadow-none</code> para desligar o que não existia, copiado
        adiante por quem não tinha como saber. Quem quer elevação pede{" "}
        <code>variant=&quot;elevated&quot;</code>; quem quer o cartão chapado
        não escreve nada.
      </DocNote>
    </>
  )
}
