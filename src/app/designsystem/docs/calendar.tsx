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
        description="captionLayout='dropdown' troca o rótulo do mês por dois Select do design system. O DatePicker liga isso por padrão; aqui é opt-in, porque uma grade embutida numa página não tem a mesma pressa."
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
        O <code>react-day-picker</code> desenha o salto de mês com um{" "}
        <code>&lt;select&gt;</code> <strong>nativo</strong> em{" "}
        <code>absolute inset-0 opacity-0</code> por cima de um rótulo falso — o
        painel que abria era o do sistema operacional: fonte, medida, cantos e
        realce fora do tema, sem tema escuro. Aqui o componente{" "}
        <code>Dropdown</code> é trocado pelo <code>Select</code> do design
        system, que já veste <code>field-classes</code> no gatilho.
        <br />
        <br />A ponte é o detalhe que precisa ficar escrito: o{" "}
        <code>onChange</code> do <code>react-day-picker</code> é um{" "}
        <code>ChangeEventHandler&lt;HTMLSelectElement&gt;</code>, e o handler
        interno lê <strong>só <code>e.target.value</code></strong>. O Radix
        entrega <code>onValueChange(valor: string)</code>, então o adaptador é um
        objeto com a única propriedade que o outro lado consulta — incompletude
        medida, não esquecida.
      </DocNote>

      <DocNote title="A faixa de navegação engolia o clique">
        A <code>nav</code> do <code>react-day-picker</code> é{" "}
        <code>absolute inset-x-0 w-full</code> com um botão em cada ponta — ou
        seja, <strong>ela cobre também o meio do cabeçalho</strong>, que é onde
        vivem os seletores. Sendo posicionada, pintava por cima e capturava o
        clique: medido com <code>elementFromPoint</code> no centro do gatilho,
        quem respondia era o <code>&lt;nav&gt;</code>.
        <br />
        <br />
        Hoje a faixa não recebe ponteiro e os dois botões recebem — um contêiner
        de largura total que só tem conteúdo nas pontas não deve capturar nada no
        vão entre elas.
        <br />
        <br />
        <strong>A lição de método é maior que o conserto:</strong> este bug passou
        por uma inspeção inteira porque a verificação usava{" "}
        <code>dispatchEvent</code> direto no elemento, e evento sintético{" "}
        <em>pula o hit-testing</em>. O painel abria no teste e não abria para uma
        pessoa. Empilhamento e área de clique só se verificam com{" "}
        <code>elementFromPoint</code> ou com clique de verdade.
      </DocNote>

      <DocNote title="Os rótulos de acessibilidade estavam em inglês">
        O <code>locale</code> do <code>date-fns</code> traduz{" "}
        <strong>nomes</strong> — meses, dias da semana — e nada mais. As frases
        conectivas são strings cravadas no pacote:{" "}
        <code>&quot;Go to the Previous Month&quot;</code>,{" "}
        <code>&quot;Choose the Month&quot;</code>, e o{" "}
        <code>&quot;Today, … , selected&quot;</code> que o leitor de tela anuncia
        em <strong>cada uma das 42 células</strong>. A grade parecia traduzida e
        a camada de acessibilidade nunca esteve.
      </DocNote>

      <DocNote title="O dia não declara tamanho, e é de propósito">
        Ele declarava <code>size=&quot;icon-lg&quot;</code>, que a escada define
        como 36 — e <strong>media 28</strong>, porque o{" "}
        <code>className</code> do próprio componente o sobrescrevia. Trocar por{" "}
        <code>md</code> só mudaria a mentira de 36 para 32: a grade é elástica
        (<code>week</code> é flex, <code>day</code> é{" "}
        <code>w-full aspect-square</code>), então nenhum degrau descreve a caixa
        final. Hoje o botão não carimba <code>data-size</code> nenhum, porque um
        atributo que não corresponde à caixa é pior que atributo nenhum.
      </DocNote>

      <DocNote title="A ponte do intervalo deriva da célula">
        Ela era <code>after:w-4</code> — 16px fixos contra uma célula que vai de
        28 para <strong>44 no ponteiro grosso</strong>, medidos nos dois. Um
        número que não acompanha a variável que ele existe para acompanhar. Hoje
        é <code>calc(var(--cell-size)/2)</code>, que cobre o raio da ponta em
        qualquer degrau.
      </DocNote>

      <DocNote title="Ele já vem em pt-BR">
        O <code>locale</code> tem padrão porque o app tem um só. Sem isso, o{" "}
        <code>Calendar</code> usado direto caía no inglês do{" "}
        <code>react-day-picker</code> e mostrava &ldquo;August&rdquo; e &ldquo;Mo
        Tu We&rdquo; no meio de uma tela em português — um padrão que só vale
        quando alguém lembra de passar não é padrão.
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
