"use client"

import * as React from "react"

import { Calendar } from "@/components/ui/calendar"
import { DocNote, DocSection, Usage } from "../ds-doc"

export default function CalendarDoc() {
  return (
    <>
      <Usage>
        A grade de um mês. Quase sempre ela aparece dentro de um{" "}
        <code>DatePicker</code>, que já resolve o popover e o rótulo. Use o
        Calendar solto quando a grade é o assunto da tela — um mês de
        vencimentos, por exemplo.
      </Usage>

      <DocSection
        title="Seleção única"
        code={`<Calendar mode="single" selected={data} onSelect={setData} locale={ptBR} />`}
      >
        <CalendarDemo />
      </DocSection>

      <DocNote title="Ele já vem em pt-BR pelo DatePicker">
        O <code>DatePicker</code> passa <code>locale={"{ptBR}"}</code> de{" "}
        <code>date-fns/locale</code>. Usando o Calendar direto, esse{" "}
        <code>locale</code>{" "}
        é responsabilidade sua — sem ele, os dias da semana
        vêm em inglês.
      </DocNote>

      <DocNote title="Para dia do mês recorrente, ele é o componente errado">
        &ldquo;Todo dia 5&rdquo; não pertence a nenhum mês. Um calendário obriga
        a pessoa a escolher um março arbitrário para dizer uma coisa que não tem
        mês. Ali o certo é um <code>NativeSelect</code> de 1 a 31.
      </DocNote>
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
      className="rounded-lg border border-border"
    />
  )
}
