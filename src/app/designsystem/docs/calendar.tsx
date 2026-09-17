"use client"

import * as React from "react"
import type { DateRange } from "react-day-picker"

import { Calendar } from "@/components/ui/calendar"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

export default function CalendarDoc() {
  return (
    <>
      <Usage>
        A grade de um mês. Quase sempre vem dentro de um <code>DatePicker</code>,
        que já resolve popover, rótulo e limites. Solto, só quando a grade é o
        assunto da tela.
      </Usage>

      <DocSection
        title="Seleção única"
        code={`<Calendar mode="single" selected={data} onSelect={setData} />`}
      >
        <CalendarDemo />
      </DocSection>

      <DocSection
        title="Intervalo"
        description="A faixa entre as pontas é contínua: cada extremidade estende o preenchimento até a metade da célula vizinha, e a medida é derivada de --cell-size."
        code={`<Calendar mode="range" selected={periodo} onSelect={setPeriodo} />`}
      >
        <CalendarRangeDemo />
      </DocSection>

      <DocSection
        title="Escada da célula"
        description="size é o piso da célula — sm 28, md 32 (o padrão), lg 36. Piso mesmo: a grade é elástica, e a célula cresce com a largura disponível."
        code={`<Calendar size="sm" />
<Calendar size="md" />
<Calendar size="lg" />`}
        previewClassName="items-start gap-6"
      >
        {(["sm", "md", "lg"] as const).map((s) => (
          <div key={s} className="flex flex-col gap-2">
            <p className="text-xs text-muted-foreground">size=&ldquo;{s}&rdquo;</p>
            <Calendar
              mode="single"
              size={s}
              defaultMonth={new Date(2026, 2, 1)}
              className="rounded-lg border border-border"
            />
          </div>
        ))}
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

      <DocNote title="Para dia do mês recorrente, ele é o componente errado">
        &ldquo;Todo dia 5&rdquo; não pertence a nenhum mês, e um calendário
        obriga a escolher um março arbitrário. Ali o certo é um{" "}
        <code>NativeSelect</code> de 1 a 31.
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
      className="rounded-lg border border-border"
    />
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
      defaultMonth={new Date(2026, 2, 1)}
      className="rounded-lg border border-border"
    />
  )
}
