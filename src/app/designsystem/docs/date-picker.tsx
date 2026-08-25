"use client"

import * as React from "react"

import { DatePicker } from "@/components/ui/date-picker"
import { Label } from "@/components/ui/label"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

export default function DatePickerDoc() {
  return (
    <>
      <Usage>
        Escolha de uma data em popover, em pt-BR. Para dia do mês recorrente — vencimento de fatura, dia do salário — o certo é um <code>NativeSelect</code> de 1 a 31.
      </Usage>

      <DocSection
        title="Padrão"
        code={`const [data, setData] = React.useState<Date | undefined>()

<DatePicker value={data} onChange={setData} />`}
        previewClassName="items-stretch"
      >
        <DatePickerDemo />
      </DocSection>

      <DocNote title="displayStyle=&quot;numeric&quot; para espaço apertado">
        O padrão escreve o mês por extenso (&ldquo;5 de abril de 2026&rdquo;),
        que é mais legível e mais longo. Numa linha de filtros ao lado de outros
        controles, <code>numeric</code> devolve <code>05/04/2026</code>.
      </DocNote>

      <PropsTable
        rows={[
          { prop: "value", type: "Date | undefined", description: "A data escolhida." },
          { prop: "onChange", type: "(date: Date | undefined) => void", description: "Recebe undefined quando a seleção é limpa." },
          { prop: "displayStyle", type: '"default" | "numeric"', default: '"default"', description: "Mês por extenso ou dd/mm/aaaa." },
          { prop: "placeholder", type: "string", description: "O texto do gatilho enquanto nada foi escolhido." },
        ]}
      />
    </>
  )
}

function DatePickerDemo() {
  const [data, setData] = React.useState<Date | undefined>(new Date(2026, 3, 5))
  const [curto, setCurto] = React.useState<Date | undefined>()

  return (
    <div className="flex w-full flex-col gap-4 sm:flex-row">
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <Label htmlFor="ds-date">Data da transação</Label>
        <DatePicker id="ds-date" value={data} onChange={setData} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <Label htmlFor="ds-date-num">Compacto</Label>
        <DatePicker
          id="ds-date-num"
          value={curto}
          onChange={setCurto}
          displayStyle="numeric"
          placeholder="dd/mm/aaaa"
        />
      </div>
    </div>
  )
}
