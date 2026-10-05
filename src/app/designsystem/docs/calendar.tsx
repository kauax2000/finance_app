"use client"

import * as React from "react"
import type { DateRange } from "react-day-picker"

import { Badge } from "@/components/ui/badge"
import { Calendar, type CalendarMarker, type CalendarPreset } from "@/components/ui/calendar"
import { Controles, DocNote, DocSection, Eixo, PropsTable, Usage } from "../ds-doc"

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
        description="markers põe pontos sob o número do dia, um tom por tipo (até três por dia), com a legenda embaixo — e o nome do dia soma os rótulos para o leitor de tela: “5 de março, assinatura, parcela”. É a grade do calendário de pagamentos no telefone."
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
          className="rounded-lg border border-border"
        />
      </DocSection>

      <DocSection
        title="Agenda"
        description="variant=&quot;agenda&quot; é a visão de mês: a célula alta, o número no canto (hoje numa pastilha) e o conteúdo do dia por renderDay. Ela ocupa a largura de quem a contém. É a grade do calendário de pagamentos no desktop; o clique no dia vem de onDayClick."
        code={`<Calendar
  variant="agenda"
  weekStartsOn={1}
  renderDay={(dia) => <Fichas eventos={porDia(dia)} />}
/>`}
        previewClassName="items-stretch"
      >
        <div className="w-full overflow-x-auto">
          <div className="min-w-160">
            <Calendar
              variant="agenda"
              weekStartsOn={1}
              defaultMonth={new Date(2026, 2, 1)}
              renderDay={(dia) => {
                const e = AGENDA[dia.getDate()]
                return dia.getMonth() === 2 && e ? (
                  <Badge size="xs" tone={e.tom} className="max-w-full truncate">
                    {e.texto}
                  </Badge>
                ) : null
              }}
            />
          </div>
        </div>
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
          className="rounded-lg border border-border"
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
        No <code>DatePicker</code> — todo campo de data — e no calendário de pagamentos do dashboard, desde a rodada 203: os pontos no telefone e a agenda no desktop, com um popover só, ancorado no dia clicado. As duas grades eram escritas à mão, com botões crus e os pontos em cinco cores cruas.
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
            description: "O “Hoje”: volta ao mês atual e, na escolha única, marca o dia.",
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
    </>
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
      className="rounded-lg border border-border"
    />
  )
}

const MARCADORES: CalendarMarker[] = [
  { dates: [new Date(2026, 2, 5), new Date(2026, 2, 18)], tone: "info", label: "Assinatura" },
  { dates: [new Date(2026, 2, 5), new Date(2026, 2, 12), new Date(2026, 2, 26)], tone: "warning", label: "Parcela" },
  { dates: [new Date(2026, 2, 10)], tone: "primary", label: "Conta a pagar" },
  { dates: [new Date(2026, 2, 3), new Date(2026, 2, 12)], tone: "success", label: "Lançado" },
]

const AGENDA: Record<number, { texto: string; tom: "info" | "warning" | "success" }> = {
  5: { texto: "Spotify", tom: "info" },
  12: { texto: "Parcela 3/10", tom: "warning" },
  18: { texto: "Netflix", tom: "info" },
  20: { texto: "Salário", tom: "success" },
}

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
        className="rounded-lg border border-border"
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
      className="rounded-lg border border-border"
    />
  )
}
