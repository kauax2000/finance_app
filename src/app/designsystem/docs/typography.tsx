"use client"

import {
  Caption,
  H1,
  H2,
  H3,
  H4,
  Lead,
  Muted,
  P,
  Small,
} from "@/components/ui/typography"
import {
  formatDateLongPtBr,
  formatDatePtBr,
  formatRelativeDayPtBr,
  formatTransactionCompactPtBr,
  formatTransactionDayMonthPtBr,
  formatTransactionDmyPtBr,
  formatTransactionMonthYearPtBr,
} from "@/lib/transaction-date"

import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"
import { Group, Spec, SpecimenPanel, Stack } from "../ds-kit"

/** Os degraus de corpo, do menor ao maior, com o que cada um carrega. */
const DEGRAUS = [
  ["text-2xs", "0,6875rem", "contagem dentro de controle pequeno"],
  ["text-xs", "0,75rem", "legenda, metadado"],
  ["text-control-sm", "0,8rem", 'texto de controle size="sm"'],
  ["text-sm", "0,875rem", "o corpo do produto"],
  ["text-base", "1rem", "campo no telefone (evita o zoom do iOS)"],
  ["text-lg", "1,125rem", "título de bloco, saldo de linha"],
  ["text-2xl", "1,5rem", "título de tela no telefone"],
  ["text-3xl", "1,875rem", "título de tela no desktop"],
]

const HOJE = new Date().toISOString()
const REF = "2026-03-05T12:00:00.000Z"

/** As formas de escrever uma data, e onde cada uma vai. */
const FORMATOS: [string, string, string][] = [
  ["formatDatePtBr", formatDatePtBr(REF), "o padrão de uma tela de detalhe"],
  ["formatDateLongPtBr", formatDateLongPtBr(REF), "quando a data é o assunto"],
  ["formatTransactionDmyPtBr", formatTransactionDmyPtBr(REF), "coluna de tabela"],
  ["formatTransactionDayMonthPtBr", formatTransactionDayMonthPtBr(REF), "agrupador de extrato"],
  ["formatTransactionCompactPtBr", formatTransactionCompactPtBr(REF), "espaço apertado"],
  ["formatTransactionMonthYearPtBr", formatTransactionMonthYearPtBr(REF), "seletor de período"],
  ["formatRelativeDayPtBr", formatRelativeDayPtBr(HOJE), "as últimas linhas do extrato"],
]

export default function TypographyDoc() {
  return (
    <>
      <Usage>
        Três famílias, oito degraus e nove componentes de texto. Escrever texto é escolher um dos nove, nunca tamanho e peso soltos. Na tela, o título é <code>PageHeaderTitle</code> e o de seção é <code>PageSectionTitle</code> — <code>H1</code>–<code>H4</code> são a base que eles vestem. Datas também são texto, e os formatos moram aqui.
      </Usage>

      <Group
        title="As três famílias"
        layout="grid"
        description="Nenhuma se escolhe na tela: a face vem do componente ou da classe. As três são carregadas em src/app/layout.tsx como --font-sans, --font-display e --font-mono."
      >
        <Spec title="Inter" meta="--font-sans">
          <Stack className="gap-3">
            <SpecimenPanel surface="background" className="items-start">
              <span className="font-sans text-lg text-foreground">
                Fatura fechada em 28 de março
              </span>
              <span className="font-sans text-sm text-muted-foreground">
                Corpo, rótulo, botão, título de cartão e de diálogo.
              </span>
            </SpecimenPanel>
            <p className="text-xs leading-relaxed text-muted-foreground">
              A interface inteira. <code>--font-heading</code> é um{" "}
              <strong>apelido</strong> dela, não uma segunda face: o gancho para o
              dia em que os títulos deixarem de ser Inter.
            </p>
          </Stack>
        </Spec>

        <Spec title="Ledger" meta="--font-display">
          <Stack className="gap-3">
            <SpecimenPanel surface="background" className="items-start">
              <span className="page-title text-3xl text-foreground">
                Suas finanças
              </span>
            </SpecimenPanel>
            <p className="text-xs leading-relaxed text-muted-foreground">
              O título de tela e o nome escrito, e nada mais. Peso único 400,
              serifas em cunha.
            </p>
          </Stack>
        </Spec>

        <Spec title="Geist Mono" meta="--font-mono">
          <Stack className="gap-3">
            <SpecimenPanel surface="background" className="items-start">
              <span className="nums font-mono text-2xl text-foreground">
                R$ 4.281,90
              </span>
              <span className="nums font-mono text-2xl text-muted-foreground">
                R$ 1.111,11
              </span>
            </SpecimenPanel>
            <p className="text-xs leading-relaxed text-muted-foreground">
              O valor que é o assunto da tela, e não se escreve à mão: vem no{" "}
              <code>MoneyDisplay</code> em <code>xl</code> e <code>2xl</code>, no{" "}
              <code>&lt;Input money mono&gt;</code> e no <code>Code</code>. Em
              linha de lista o valor fica em Inter com figura tabular.
            </p>
          </Stack>
        </Spec>
      </Group>

      <DocNote title="A serifa é voz de display, não de título">
        A Ledger vive só em <code>.page-title</code> e <code>.wordmark</code>. Peso 400 com contraste alto a 16px lê como texto menor e some contra o corpo; título de cartão, de diálogo e de seção segue na sans.
      </DocNote>

      <DocNote title=".wordmark é o nome quando ele precisa ser texto">
        Quem apresenta a marca é o lockup SVG de <strong>Marca</strong>. <code>.wordmark</code> serve onde não cabe SVG — assunto de e-mail, título de janela, texto puro.
      </DocNote>

      <DocNote title="Ledger é peso único, e o 400 não se força">
        A família só tem o 400. <code>font-semibold</code> dispara o negrito sintético do navegador e desmonta a serifa; por isso <code>.page-title</code> declara <code>font-weight: 400</code>.
      </DocNote>

      <Group
        title="A escala"
        layout="grid"
        description="Oito degraus, cada um com um trabalho. Ao lado, .nums — a figura tabular, que trava a largura do dígito para a coluna de valores não dançar."
      >
        {/* A tabela tem três colunas e duas delas têm largura fixa. Numa célula
            de um terço do grupo sobram 46px para o uso, e ele quebra em até
            seis linhas — medido. Ela ocupa a linha inteira no `md` e dois
            terços no `xl`; o `.nums` ao lado é pequeno e cabe num terço. */}
        <Spec title="Tamanhos" meta="--text-*" className="md:col-span-2">
          <Stack className="gap-2">
            {DEGRAUS.map(([name, size, use]) => (
              <div
                key={name}
                className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5"
              >
                <code className="w-32 shrink-0 font-mono text-2xs text-muted-foreground">
                  {name}
                </code>
                <span className="nums w-20 shrink-0 text-2xs text-muted-foreground">
                  {size}
                </span>
                {/* O nome e a medida somam 232px com as calhas. Abaixo de `sm`
                    o cartão tem 311, e o uso ficava com 47 — quatro linhas de
                    uma palavra, medido. Ele desce para a própria linha, e volta
                    para o lado assim que houver largura. */}
                <span className="basis-full text-xs text-muted-foreground sm:basis-auto">
                  {use}
                </span>
              </div>
            ))}
          </Stack>
        </Spec>

        <Spec title="Números" meta=".nums">
          <Stack>
            <div>
              <p className="text-2xs text-muted-foreground">Sem tabular</p>
              <p className="text-sm">R$ 1.111,11</p>
              <p className="text-sm">R$ 8.888,88</p>
            </div>
            <div>
              <p className="text-2xs text-muted-foreground">Com .nums</p>
              <p className="nums text-sm">R$ 1.111,11</p>
              <p className="nums text-sm">R$ 8.888,88</p>
            </div>
          </Stack>
        </Spec>
      </Group>

      <DocNote title="Por que dois degraus fora da escala do Tailwind">
        Valor arbitrário repetido é token sem nome: <code>text-[10px]</code> e <code>text-[0.8rem]</code> se repetiam, cada um livre para divergir. Hoje são <code>--text-2xs</code> e <code>--text-control-sm</code>, no <code>@theme</code> de <code>globals.css</code>, com entrelinha própria.
      </DocNote>

      <DocSection
        title="Títulos"
        description="H1 usa a serifa de display; H2 a H4 seguem na sans. Os quatro têm scroll-m-20, para uma âncora não parar com o título colado no topo."
        code={`<H1>Suas finanças</H1>
<H2>Este mês</H2>
<H3>Cartões</H3>
<H4>Fatura aberta</H4>`}
        previewClassName="flex-col items-stretch gap-4"
      >
        <H1>Suas finanças</H1>
        <H2>Este mês</H2>
        <H3>Cartões</H3>
        <H4>Fatura aberta</H4>
      </DocSection>

      <DocSection
        title="Texto"
        description="Lead abre uma tela, P é o parágrafo com entrelinha relaxada e Muted é P na cor secundária. Para texto menor, Small e Caption."
        code={`<Lead>Acompanhe entradas e saídas do mês.</Lead>
<P>A fatura do Nubank fecha no dia 28 e vence no dia 5.</P>
<Muted>Parcelas futuras não entram neste total.</Muted>
<Small>Atualizado agora</Small>
<Caption>Valores em reais</Caption>`}
        previewClassName="flex-col items-stretch gap-3"
      >
        <Lead>Acompanhe entradas e saídas do mês.</Lead>
        <P>
          A fatura do Nubank fecha no dia 28 e vence no dia 5. Compras feitas
          depois do fechamento entram na fatura seguinte.
        </P>
        <Muted>Parcelas futuras não entram neste total.</Muted>
        <Small>Atualizado agora</Small>
        <Caption>Valores em reais</Caption>
      </DocSection>

      <DocNote title="Na tela, PageHeaderTitle e PageSectionTitle">
        <code>PageHeaderTitle</code> já é o <code>&lt;h1&gt;</code> e <code>PageSectionTitle</code> o <code>&lt;h2&gt;</code>: vestem <code>H1</code> e <code>H2</code> por <code>asChild</code> e trocam só o corpo. Não escreva <code>H1</code> no corpo de uma tela — dois títulos de nível um confundem quem navega por cabeçalhos. <code>H2</code> não traz régua; a régua de seção é <code>PageSection variant=&quot;ruled&quot;</code>.
      </DocNote>

      <DocNote title="Com asChild, a sobrescrita vai no átomo">
        O <code>Slot</code> concatena as <code>className</code> sem <code>twMerge</code>: num filho, <code>text-lg</code> e <code>text-base</code> ficariam os dois no DOM. Escreva <code>&lt;H4 asChild className=&quot;text-base&quot;&gt;&lt;p/&gt;&lt;/H4&gt;</code>.
      </DocNote>

      <Group
        title="Datas"
        description="Todas em src/lib/transaction-date.ts. Nenhuma tela chama toLocaleDateString: 05/03/26 ou 5 de março é decisão de produto, e mora num lugar só."
      >
        <Spec title="Os formatos" meta="lib/transaction-date.ts">
          <Stack className="gap-3">
            {FORMATOS.map(([fn, saida, uso]) => (
              <div key={fn} className="flex flex-col">
                <code className="font-mono text-2xs text-muted-foreground">
                  {fn}()
                </code>
                <span className="text-sm font-medium text-foreground">
                  {saida}
                </span>
                <span className="text-xs text-muted-foreground">{uso}</span>
              </div>
            ))}
          </Stack>
        </Spec>

        <Spec title="Quando usar o relativo">
          <Stack className="gap-2 text-xs text-muted-foreground">
            <p>
              <strong className="text-foreground">Hoje / Ontem</strong> nas
              últimas linhas de um extrato. Depois de uns três dias ele atrapalha:
              &ldquo;há 9 dias&rdquo; obriga a fazer conta.
            </p>
            <p>
              Em tela de detalhe, extrato exportado e comprovante, a data é
              sempre absoluta.
            </p>
          </Stack>
        </Spec>
      </Group>

      <DocNote title="Fuso: a data de uma transação é uma data, não um instante">
        Uma compra do dia 1º não pode virar 28 de fevereiro porque o servidor
        está em UTC. <code>parseYmdLocal</code> e <code>localYmdFromDate</code>{" "}
        tratam <code>2026-03-01</code> como dia do calendário local;{" "}
        <code>calendarYmdToStorageIso</code> faz o caminho de volta.
      </DocNote>

      <DocNote title="O travessão como valor vazio">
        Numa célula sem data, <code>—</code> significa &ldquo;sem dado&rdquo; — o mesmo que o <code>MoneyDisplay</code> desenha para <code>value=&#123;null&#125;</code>. Hífen leria como erro de digitação; branco, como bug.
      </DocNote>

      <PropsTable
        title="Componentes"
        rows={[
          {
            prop: "H1 … H4",
            type: "ComponentProps<'h1'…'h4'> & { asChild? }",
            description:
              "H1 é a serifa de display; H2–H4 são a sans, sem régua. asChild troca o elemento e mantém o estilo.",
          },
          {
            prop: "Lead",
            type: "ComponentProps<'p'>",
            description: "text-lg secundário, para abrir uma tela.",
          },
          {
            prop: "P",
            type: "ComponentProps<'p'>",
            description: "text-sm com entrelinha relaxada.",
          },
          {
            prop: "Muted",
            type: "ComponentProps<'p'>",
            description:
              "text-sm na cor secundária — o corpo de P.",
          },
          {
            prop: "Small",
            type: "ComponentProps<'small'>",
            description: "text-xs de peso médio, para metadado.",
          },
          {
            prop: "Caption",
            type: "ComponentProps<'p'>",
            description: "text-xs secundário — a legenda abaixo de um bloco.",
          },
        ]}
      />
    </>
  )
}
