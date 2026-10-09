"use client"

import * as React from "react"
import type { DateRange } from "react-day-picker"

import {
  Calendar,
  CalendarEvent,
  CalendarEvents,
  CalendarSkeleton,
  type CalendarMarker,
  type CalendarMarkerTone,
  type CalendarPreset,
} from "@/components/ui/calendar"
import { Caption } from "@/components/ui/typography"
import { Controles, DocNote, DocSection, Eixo, Interruptor, Interruptores, PropsTable, Usage } from "../ds-doc"
import { IphoneFrame, ViewportFrame } from "../ds-frame"

export default function CalendarDoc() {
  return (
    <>
      <Usage>
        A grade de um mês. Quase sempre vem dentro de um <code>DatePicker</code>,
        que já resolve popover, rótulo e limites. Solto, só quando a grade é o
        assunto da tela.
      </Usage>

      <DocSection
        title="Seleção única, e o Hoje"
        description="showToday põe o “Hoje” embaixo da grade: volta ao mês atual e, na escolha única, marca o dia. Sem ele, voltar é seta a seta."
        code={`<Calendar mode="single" selected={data} onSelect={setData} showToday />`}
      >
        <CalendarDemo />
      </DocSection>

      <DocSection
        title="Intervalo, com atalhos"
        description="A faixa entre as pontas é contínua: cada extremidade estende o preenchimento até a metade da célula vizinha. presets põe os atalhos ao lado da grade — o aceso é o que coincide com a escolha —, e com eles o intervalo mostra dois meses lado a lado no desktop e um no telefone."
        code={`<Calendar
  mode="range"
  selected={periodo}
  onSelect={setPeriodo}
  presets={[
    { label: "Últimos 7 dias", range: () => ({ from: subDays(hoje, 6), to: hoje }) },
    { label: "Este mês", range: () => ({ from: startOfMonth(hoje), to: hoje }) },
  ]}
/>`}
      >
        <CalendarRangeDemo />
      </DocSection>

      <DocSection
        title="Escada da célula"
        description="size é o piso da célula — sm 28, md 32 (o padrão), lg 36. Piso mesmo: a grade é elástica, e a célula cresce com a largura disponível. Troque o degrau."
        code={`<Calendar size="lg" />`}
        previewClassName="flex-col items-start gap-3"
      >
        <EscadaDemo />
      </DocSection>

      <DocSection
        title="Marcadores"
        description="markers põe pontos sob o número do dia, um tom por tipo (até três por dia), com a legenda embaixo — e o nome do dia soma os rótulos para o leitor de tela: “5 de março, assinatura, parcela”."
        code={`<Calendar
  markers={[
    { dates: assinaturas, tone: "info", label: "Assinatura" },
    { dates: parcelas, tone: "warning", label: "Parcela" },
  ]}
/>`}
      >
        <Calendar
          defaultMonth={new Date(2026, 2, 1)}
          markers={MARCADORES}
          className="rounded-surface border border-border"
        />
      </DocSection>

      <DocSection
        title="Agenda"
        description="variant=&quot;agenda&quot; é a visão de mês: uma moldura só, as células separadas por fios, o mês à esquerda e o Hoje junto das setas. O conteúdo do dia vem de renderDay, num CalendarEvents com os CalendarEvent do dia — até max na célula, e o resto num “+N mais”. O mês vizinho recua, o fim de semana tem um véu, e o dia escolhido ganha um anel interno."
        code={`<Calendar
  variant="agenda"
  weekStartsOn={1}
  showToday
  renderDay={(dia) => (
    <CalendarEvents max={2}>
      {doDia(dia).map((e) => (
        <CalendarEvent key={e.id} tone={e.tom} amount={e.valor} onSelect={() => abrir(e)}>
          {e.titulo}
        </CalendarEvent>
      ))}
    </CalendarEvents>
  )}
/>`}
        previewClassName="items-stretch"
      >
        <AgendaNaTela />
      </DocSection>

      <DocSection
        title="No telefone, a agenda vira lista"
        description="Abaixo de 40rem da própria largura a grade some e entra a lista do mês: só os dias com eventos, cada evento uma linha de 44px com o ponto do tom — e um botão, quando tem onSelect. É container query, e não a janela: num painel estreito do desktop ela também vira lista."
        code={`<Calendar variant="agenda" renderDay={…} listEmpty="Nada neste mês" />`}
        previewClassName="justify-center"
      >
        <AgendaNoTelefone />
      </DocSection>

      <DocSection
        title="Esqueleto"
        description="CalendarSkeleton variant=&quot;agenda&quot; tem a forma da grade de fios: o título, a régua dos dias e as 6 semanas, com uma ficha fantasma em algumas. Dentro de um esqueleto de página, group={false}."
        code={`<CalendarSkeleton variant="agenda" />`}
        previewClassName="items-stretch"
      >
        <CalendarSkeleton variant="agenda" />
      </DocSection>

      <DocSection
        title="Salto de mês e ano"
        description="captionLayout='dropdown' troca o rótulo do mês por dois Select do design system. O DatePicker liga isso por padrão; aqui é opt-in."
        code={`<Calendar captionLayout="dropdown" startMonth={inicio} endMonth={fim} />`}
      >
        <Calendar
          mode="single"
          captionLayout="dropdown"
          defaultMonth={new Date(2026, 2, 1)}
          startMonth={new Date(2021, 0, 1)}
          endMonth={new Date(2031, 11, 31)}
          className="rounded-surface border border-border"
        />
      </DocSection>

      <DocNote title="Os seletores são os do sistema, não os nativos">
        O <code>react-day-picker</code> usaria um <code>&lt;select&gt;</code>{" "}
        nativo invisível, e o painel sairia do sistema operacional, fora do
        tema. O <code>Dropdown</code> dele é trocado pelo <code>Select</code>; o
        adaptador entrega só <code>e.target.value</code>, a única propriedade
        que o handler interno lê.
      </DocNote>

      <DocNote title="A faixa de navegação não recebe ponteiro">
        A <code>nav</code> cobre o cabeçalho inteiro, inclusive o meio, onde
        vivem os seletores. Só os dois botões das pontas recebem ponteiro; se a
        faixa capturasse, o clique nos seletores não chegaria.
      </DocNote>

      <DocNote title="O dia não declara tamanho">
        A grade é elástica (<code>week</code> é flex, <code>day</code> é{" "}
        <code>w-full aspect-square</code>), então nenhum degrau descreve a caixa
        final e o botão do dia não carimba <code>data-size</code>. Atributo que
        não corresponde à caixa é pior que atributo nenhum.
      </DocNote>

      <DocNote title="Ele já vem em pt-BR, inclusive para o leitor de tela">
        <code>locale</code> tem padrão porque o app tem uma língua só. O locale
        do <code>date-fns</code> traduz só nomes de meses e dias; as frases que
        o leitor de tela anuncia, como{" "}
        <code>&quot;Go to the Previous Month&quot;</code>, são strings do pacote
        e têm tradução própria.
      </DocNote>

      <DocNote title="Onde o app usa">
        No <code>DatePicker</code> — todo campo de data — e no calendário de pagamentos do dashboard, que é a agenda desde a rodada 203 e veste as peças dela desde a 242: a grade com o popover do dia no desktop, e a lista no telefone. As grades eram escritas à mão, com botões crus e os pontos em cinco cores cruas, e as fichas do dia também (o <code>EventChips</code>, com o &ldquo;+N&rdquo; à mão).
      </DocNote>

      <DocNote title="Para dia do mês recorrente, ele é o componente errado">
        &ldquo;Todo dia 5&rdquo; não pertence a nenhum mês, e um calendário
        obriga a escolher um março arbitrário. Ali o certo é um{" "}
        <code>Select</code> de 1 a 31, como o fechamento e o vencimento do cartão.
      </DocNote>

      <PropsTable
        rows={[
          {
            prop: "size",
            type: '"sm" | "md" | "lg"',
            default: '"md"',
            description:
              "O piso da célula (28 | 32 | 36). Em ponteiro grosso ela sobe para 44 em qualquer degrau.",
          },
          {
            prop: "mode",
            type: '"single" | "range" | "multiple"',
            default: '"single"',
            description: "Do react-day-picker. Range desenha a faixa contínua.",
          },
          {
            prop: "captionLayout",
            type: '"label" | "dropdown" | …',
            default: '"label"',
            description:
              "dropdown troca o rótulo do mês por seletores de mês e ano.",
          },
          {
            prop: "locale",
            type: "Locale",
            default: "ptBR",
            description: "Já vem preenchido, porque o app tem uma língua só.",
          },
          {
            prop: "markers",
            type: "{ dates, tone, label }[]",
            description: "Pontos sob o número do dia, por tom (até três), com a legenda.",
          },
          {
            prop: "variant · renderDay",
            type: '"default" | "agenda" · (date) => ReactNode',
            default: '"default"',
            description: "agenda é a célula grande; renderDay, o conteúdo dela.",
          },
          {
            prop: "showToday",
            type: "boolean",
            default: "false",
            description: "O “Hoje”: volta ao mês atual e, na escolha única, marca o dia. Na agenda ele mora no cabeçalho, ao lado das setas.",
          },
          {
            prop: "listEmpty",
            type: "ReactNode",
            default: '"Nenhum evento neste mês"',
            description: "Na agenda estreita (a lista), o texto do mês sem nada.",
          },
          {
            prop: "presets",
            type: "{ label, range }[]",
            description: "Atalhos ao lado de um intervalo; com eles, dois meses no desktop.",
          },
          {
            prop: "stretch",
            type: "boolean",
            default: "false",
            description: "A grade ocupa a largura de quem a contém (a agenda já ocupa).",
          },
          {
            prop: "buttonVariant",
            type: "Button['variant']",
            default: '"tertiary"',
            description: "A variante das setas de navegação de mês.",
          },
        ]}
      />

      <PropsTable
        title="CalendarEvent"
        rows={[
          {
            prop: "tone",
            type: '"default" | "primary" | "info" | "success" | "warning" | "destructive" | "income" | "expense"',
            default: '"default"',
            description: "A cor: a superfície -muted do tom na ficha da grade, o ponto na linha da lista.",
          },
          { prop: "amount", type: "number | null", description: "O valor à direita, na lista. Na ficha da grade só cabe o título." },
          {
            prop: "onSelect",
            type: "() => void",
            description: "Só na lista: a linha vira botão de 44px. Na grade quem clica é o dia.",
          },
        ]}
      />

      <PropsTable
        title="CalendarEvents · CalendarSkeleton"
        rows={[
          {
            prop: "CalendarEvents · max",
            type: "number",
            default: "2",
            description: "Quantos eventos cabem na célula; o resto vira “+N mais”. Na lista, todos.",
          },
          {
            prop: "CalendarSkeleton · variant",
            type: '"default" | "agenda"',
            default: '"default"',
            description: "A forma da espera: a grade pequena ou a grade de fios da agenda.",
          },
          {
            prop: "CalendarSkeleton · group",
            type: "boolean",
            default: "true",
            description: "false dentro de um esqueleto de página, que já anuncia a espera.",
          },
        ]}
      />
    </>
  )
}

type EventoDemo = { id: string; titulo: string; tom: CalendarMarkerTone; valor: number }

/** Março de 2026 no calendário de pagamentos: o dia 25 tem quatro, para o "+N". */
const EVENTOS_AGENDA: Record<number, EventoDemo[]> = {
  5: [{ id: "spotify", titulo: "Spotify", tom: "info", valor: -21.9 }],
  10: [{ id: "luz", titulo: "Conta de luz", tom: "primary", valor: -187.42 }],
  12: [{ id: "parcela", titulo: "Parcela 3/10", tom: "warning", valor: -412.3 }],
  18: [{ id: "netflix", titulo: "Netflix", tom: "info", valor: -55.9 }],
  20: [{ id: "salario", titulo: "Salário", tom: "income", valor: 8432.15 }],
  25: [
    { id: "aluguel", titulo: "Aluguel", tom: "primary", valor: -2450 },
    { id: "condominio", titulo: "Condomínio", tom: "primary", valor: -680 },
    { id: "internet", titulo: "Internet", tom: "info", valor: -119.9 },
    { id: "academia", titulo: "Academia", tom: "info", valor: -99.9 },
  ],
}

function AgendaDemo({
  max,
  hoje,
  escolha,
  vazio,
  onAbrir,
}: {
  max: number
  hoje: boolean
  escolha: boolean
  vazio: boolean
  onAbrir?: (titulo: string) => void
}) {
  const [dia, setDia] = React.useState<Date | undefined>(new Date(2026, 2, 12))
  const renderDay = (data: Date) => {
    const lista = vazio || data.getMonth() !== 2 ? undefined : EVENTOS_AGENDA[data.getDate()]
    return lista ? (
      <CalendarEvents max={max}>
        {lista.map((e) => (
          <CalendarEvent key={e.id} tone={e.tom} amount={e.valor} onSelect={() => onAbrir?.(e.titulo)}>
            {e.titulo}
          </CalendarEvent>
        ))}
      </CalendarEvents>
    ) : null
  }
  const comum = {
    variant: "agenda" as const,
    weekStartsOn: 1 as const,
    defaultMonth: new Date(2026, 2, 1),
    showToday: hoje,
    renderDay,
    listEmpty: "Nenhum pagamento neste mês",
  }
  return escolha ? (
    <Calendar {...comum} mode="single" selected={dia} onSelect={setDia} />
  ) : (
    <Calendar {...comum} />
  )
}

function AgendaNaTela() {
  const [max, setMax] = React.useState<"1" | "2" | "3">("2")
  const [hoje, setHoje] = React.useState(true)
  const [escolha, setEscolha] = React.useState(true)
  const [vazio, setVazio] = React.useState(false)
  return (
    <>
      <Controles
        inicio={
          <Eixo
            rotulo="Eventos por dia (max)"
            valores={["1", "2", "3"] as const}
            valor={max}
            onChange={setMax}
            rotulos={{ "1": "max 1", "2": "max 2", "3": "max 3" }}
          />
        }
        fim={
          <Interruptores>
            <Interruptor id="agenda-hoje" rotulo="Hoje" valor={hoje} onChange={setHoje} />
            <Interruptor id="agenda-escolha" rotulo="Dia escolhido" valor={escolha} onChange={setEscolha} />
            <Interruptor id="agenda-vazio" rotulo="Sem eventos" valor={vazio} onChange={setVazio} />
          </Interruptores>
        }
      />
      <ViewportFrame
        title="Agenda do mês numa janela"
        height={700}
        className="w-full rounded-surface"
        screenClassName="bg-background p-6"
      >
        <AgendaDemo max={Number(max)} hoje={hoje} escolha={escolha} vazio={vazio} />
      </ViewportFrame>
    </>
  )
}

function AgendaNoTelefone() {
  const [aberto, setAberto] = React.useState<string>()
  return (
    <div className="flex flex-col items-center gap-3">
      <IphoneFrame title="A agenda num iPhone">
        <div className="h-full overflow-y-auto px-4 pt-16 pb-8">
          <AgendaDemo max={2} hoje escolha={false} vazio={false} onAbrir={setAberto} />
        </div>
      </IphoneFrame>
      <Caption aria-live="polite">{aberto ? `Tocou em ${aberto}` : "Toque num evento"}</Caption>
    </div>
  )
}

function CalendarDemo() {
  const [data, setData] = React.useState<Date | undefined>(new Date(2026, 2, 5))

  return (
    <Calendar
      mode="single"
      selected={data}
      onSelect={setData}
      defaultMonth={new Date(2026, 2, 1)}
      showToday
      className="rounded-surface border border-border"
    />
  )
}

const MARCADORES: CalendarMarker[] = [
  { dates: [new Date(2026, 2, 5), new Date(2026, 2, 18)], tone: "info", label: "Assinatura" },
  { dates: [new Date(2026, 2, 5), new Date(2026, 2, 12), new Date(2026, 2, 26)], tone: "warning", label: "Parcela" },
  { dates: [new Date(2026, 2, 10)], tone: "primary", label: "Conta a pagar" },
  { dates: [new Date(2026, 2, 3), new Date(2026, 2, 12)], tone: "success", label: "Lançado" },
]


function intervaloDe(dias: number) {
  const fim = new Date(2026, 2, 20)
  const inicio = new Date(fim)
  inicio.setDate(fim.getDate() - (dias - 1))
  return { from: inicio, to: fim }
}

const ATALHOS: CalendarPreset[] = [
  { label: "Últimos 7 dias", range: () => intervaloDe(7) },
  { label: "Últimos 30 dias", range: () => intervaloDe(30) },
  { label: "Este mês", range: { from: new Date(2026, 2, 1), to: new Date(2026, 2, 20) } },
  { label: "Mês passado", range: { from: new Date(2026, 1, 1), to: new Date(2026, 1, 28) } },
]

function EscadaDemo() {
  const [degrau, setDegrau] = React.useState<"sm" | "md" | "lg">("md")
  return (
    <>
      <Controles
        inicio={
          <Eixo
            rotulo="size"
            valores={["sm", "md", "lg"] as const}
            valor={degrau}
            onChange={setDegrau}
            rotulos={{ sm: "sm · 28", md: "md · 32", lg: "lg · 36" }}
          />
        }
      />
      <Calendar
        mode="single"
        size={degrau}
        defaultMonth={new Date(2026, 2, 1)}
        className="rounded-surface border border-border"
      />
    </>
  )
}

function CalendarRangeDemo() {
  const [periodo, setPeriodo] = React.useState<DateRange | undefined>({
    from: new Date(2026, 2, 9),
    to: new Date(2026, 2, 20),
  })

  return (
    <Calendar
      mode="range"
      selected={periodo}
      onSelect={setPeriodo}
      defaultMonth={new Date(2026, 1, 1)}
      presets={ATALHOS}
      className="rounded-surface border border-border"
    />
  )
}
