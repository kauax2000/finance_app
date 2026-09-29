"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Code } from "@/components/ui/code"
import { MoneyDisplay } from "@/components/ui/money-display"
import { Separator } from "@/components/ui/separator"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

const FATURA = [
  ["Mercado Pão de Açúcar", 284.9],
  ["Uber", 32.4],
  ["Netflix", 39.9],
] as const

const DIAS = [
  ["Hoje", [["Padaria", -18.5], ["Uber", -32.4]]],
  ["Ontem", [["Salário", 8432.15]]],
] as const

export default function SeparatorDoc() {
  return (
    <>
      <Usage>
        Uma régua entre conteúdos que <strong>já estão relacionados</strong>. Se são assuntos diferentes, o que separa é espaço — régua demais transforma a tela numa planilha. E se a divisão muda o assunto de verdade, quem organiza é um cabeçalho, não uma linha. Entre itens de uma lista é o <code>ItemSeparator</code>, e num menu, o separador do próprio menu.
      </Usage>

      <DocSection
        title="Horizontal e vertical"
        description="A horizontal ocupa a largura do pai e tem 1px. A vertical tem 16px por padrão, precisa de um pai flex, e a altura muda por className."
        code={`<Separator className="my-3" />

<div className="flex items-center gap-3">
  <span>12 transações</span>
  <Separator orientation="vertical" />
  <MoneyDisplay value={1482.3} tone="muted" />
</div>`}
        previewClassName="flex-col items-stretch gap-5"
      >
        <div className="w-full">
          <p className="text-sm text-foreground">Fatura de março</p>
          <Separator className="my-3" />
          <p className="text-sm text-muted-foreground">Fecha em 28/03</p>
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span>12 transações</span>
          <Separator orientation="vertical" />
          <MoneyDisplay value={1482.3} tone="muted" />
          <Separator orientation="vertical" className="h-7" />
          <span>3 categorias</span>
        </div>
      </DocSection>

      <DocSection
        title="Peso e desenho"
        description="tone é o peso: default estrutura a página, soft arruma o interior de uma superfície já delimitada. variant é o desenho: solid, a linha; dashed, o tracejado; fade, a que some nas pontas. Os dois eixos se combinam."
        code={`<Separator />
<Separator tone="soft" />
<Separator variant="dashed" />
<Separator variant="fade" />`}
        previewClassName="flex-col items-stretch gap-4"
      >
        {(
          [
            ["default", "seções de uma página", {}],
            ['tone="soft"', "interior de cartão, rodapé de folha", { tone: "soft" }],
            ['variant="dashed"', "antes de um total", { variant: "dashed" }],
            ['variant="fade"', "entre blocos soltos numa página", { variant: "fade" }],
          ] as const
        ).map(([nome, nota, props]) => (
          <div key={nome} className="flex w-full flex-col gap-1.5">
            <div className="flex items-baseline justify-between gap-2">
              <Code variant="inline">{nome}</Code>
              <span className="text-2xs text-muted-foreground">{nota}</span>
            </div>
            <Separator {...props} />
          </div>
        ))}
      </DocSection>

      <DocSection
        title="Tracejado: a soma"
        description="A linha de extrato. O tracejado diz que o que vem abaixo é a soma do que vem acima — uma linha cheia diria só que começa outra coisa."
        code={`<Separator variant="dashed" className="my-2" />
<div className="flex justify-between font-medium">
  <span>Total da fatura</span>
  <MoneyDisplay value={357.2} />
</div>`}
        previewClassName="flex-col items-stretch"
      >
        <div className="flex w-full max-w-sm flex-col gap-1.5 text-sm">
          {FATURA.map(([nome, valor]) => (
            <div key={nome} className="flex items-baseline justify-between gap-3">
              <span className="text-muted-foreground">{nome}</span>
              <MoneyDisplay value={valor} />
            </div>
          ))}
          <Separator variant="dashed" className="my-2" />
          <div className="flex items-baseline justify-between gap-3 font-medium">
            <span className="text-foreground">Total da fatura</span>
            <MoneyDisplay value={357.2} size="lg" />
          </div>
        </div>
      </DocSection>

      <DocSection
        title="Rótulo no meio"
        description="Com children, a régua vira duas metades e o texto entre elas: o dia numa lista de transações, o “ou” de um formulário (que o FieldSeparator compõe). Sem retângulo mascarando o meio de uma linha inteira, então ele serve sobre qualquer superfície. Com fade, cada metade some na ponta de fora."
        code={`<Separator>Hoje</Separator>
<Separator variant="fade">ou</Separator>`}
        previewClassName="flex-col items-stretch gap-4"
      >
        <div className="flex w-full max-w-sm flex-col gap-2 text-sm">
          {DIAS.map(([dia, itens]) => (
            <div key={dia} className="flex flex-col gap-2">
              <Separator>{dia}</Separator>
              {itens.map(([nome, valor]) => (
                <div key={nome} className="flex items-baseline justify-between gap-3">
                  <span className="text-foreground">{nome}</span>
                  <MoneyDisplay value={valor} signed={valor > 0} tone={valor > 0 ? "income" : "default"} />
                </div>
              ))}
            </div>
          ))}
        </div>
        <Separator variant="fade" className="max-w-sm">
          ou
        </Separator>
      </DocSection>

      <DocSection
        title="Até a borda"
        description="bleed faz a régua atravessar o recuo e encostar nas bordas da superfície — aqui, a de um Card. Ela lê o recuo que a superfície publica: --card-px num cartão, --dialog-px num diálogo ou numa folha. Quem não publica recuo escreve --separator-bleed."
        code={`<Card>
  <CardContent>
    …
    <Separator bleed className="my-3" />
    …
  </CardContent>
</Card>`}
        previewClassName="flex-col items-stretch"
      >
        <Card className="max-w-sm">
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Período: março</p>
            <Separator bleed tone="soft" className="my-3" />
            <p className="text-sm text-muted-foreground">Formas de pagamento: todas</p>
            <Separator bleed tone="soft" className="my-3" />
            <p className="text-sm text-muted-foreground">Categorias: 3 escolhidas</p>
          </CardContent>
        </Card>
      </DocSection>

      <DocNote title="Peso é tone, nunca alfa à mão">
        Use <code>tone</code>, não <code>bg-border/60</code> nem <code>opacity-60</code>: dois nomes cobrem os usos, e cada alfa escrito à mão é livre para divergir. O peso mora numa variável (<code>--separator-color</code>) porque os três desenhos a leem de jeitos diferentes — o fundo, a borda e o meio de um degradê —, e por isso <code>tone</code> e <code>variant</code> se combinam sem classe nenhuma a mais.
      </DocNote>

      <DocNote title="Decorativo por padrão, e quase sempre é o certo">
        <code>decorative</code>, o padrão, sai como <code>role=&quot;none&quot;</code>: a régua é recurso visual, e ouvir &ldquo;separador&rdquo; entre blocos não ajuda. <code>decorative={"{false}"}</code> vira <code>role=&quot;separator&quot;</code>, para quando a linha é a única fronteira. Com rótulo, as duas metades são sempre decorativas e o texto é texto.
      </DocNote>

      <DocNote title="O espaçamento é de quem chama, e vale escolher um">
        A régua não traz margem: <code>my-2</code> num menu ou lista densa, <code>my-3</code> entre blocos de um cartão, <code>my-6</code> entre seções — e aí pergunte se o que separa não deveria ser só espaço.
      </DocNote>

      <DocNote title="Onde o app usa">
        Dezenove réguas em sete arquivos: o formulário de conta, a página de membros, o menu de workspaces, o menu da conta no telefone, o painel da fatura e o esqueleto dele, e os filtros de transação — os cinco dos filtros com <code>bleed</code> desde a rodada 175, no lugar do <code>-mx-4 w-[calc(100%+2rem)] sm:-mx-5 …</code> que erravam o recuo da folha no desktop. O painel da fatura e o esqueleto dele desenhavam a régua à mão, com um <code>&lt;div role=&quot;separator&quot;&gt;</code>; o menu da conta escrevia <code>bg-border/60</code> nas três réguas, e hoje é <code>tone=&quot;soft&quot;</code>. Por dentro: <code>FieldSeparator</code> (o rótulo do meio), <code>ItemSeparator</code> e <code>SidebarSeparator</code>. Tracejado e fade ainda não têm tela.
      </DocNote>

      <PropsTable
        rows={[
          {
            prop: "orientation",
            type: '"horizontal" | "vertical"',
            default: '"horizontal"',
            description: "O vertical precisa de pai flex e tem 16px, sobrescritos por className.",
          },
          {
            prop: "tone",
            type: '"default" | "soft"',
            default: '"default"',
            description: "O peso: default estrutura a página; soft arruma o interior de uma superfície já delimitada.",
          },
          {
            prop: "variant",
            type: '"solid" | "dashed" | "fade"',
            default: '"solid"',
            description: "O desenho: a linha, o tracejado de antes de um total, ou as pontas que dissolvem.",
          },
          {
            prop: "bleed",
            type: "boolean",
            default: "false",
            description: "Atravessa o recuo da superfície (--card-px, --dialog-px ou --separator-bleed). Só na horizontal.",
          },
          {
            prop: "children",
            type: "ReactNode",
            description: "O rótulo do meio, entre duas meias-réguas. Só na horizontal.",
          },
          {
            prop: "decorative",
            type: "boolean",
            default: "true",
            description: "Decorativo sai como role=\"none\". false vira role=\"separator\" e é anunciado.",
          },
        ]}
      />
    </>
  )
}
