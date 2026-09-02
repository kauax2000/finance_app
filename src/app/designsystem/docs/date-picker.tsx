"use client"

import * as React from "react"
import type { DateRange } from "react-day-picker"

import { DatePicker } from "@/components/ui/date-picker"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

export default function DatePickerDoc() {
  return (
    <>
      <Usage>
        Escolha de uma data — ou de um intervalo — em popover, em pt-BR. Para dia
        do mês recorrente (vencimento de fatura, dia do salário) o certo é um{" "}
        <code>NativeSelect</code> de 1 a 31.
      </Usage>

      <DocSection
        title="Ele é um campo"
        description="Mesma altura, mesma borda e mesmo preenchimento do Input ao lado. Era Button variant='outline' size='md': 32px contra 36, e oklch(0.985) opaco contra oklab(0.9 0 0 / 0.3) translúcido — medidos no tema claro."
        code={`<DatePicker value={data} onChange={setData} />`}
        previewClassName="items-stretch"
      >
        <CampoLadoALado />
      </DocSection>

      <DocSection
        title="Intervalo"
        description="mode='range' resolve num popover só o que hoje são dois DatePicker independentes — sem faixa realçada entre as pontas, e sem impedir um fim antes do início."
        code={`const [periodo, setPeriodo] = React.useState<DateRange | undefined>()

<DatePicker mode="range" value={periodo} onChange={setPeriodo} />`}
        previewClassName="items-stretch"
      >
        <IntervaloDemo />
      </DocSection>

      <DocSection
        title="Escada e limpeza"
        description="size é o mesmo da escada do sistema — lg (36) é a do Input, e o padrão. clearable põe um × quando há valor."
        code={`<DatePicker size="sm" clearable value={data} onChange={setData} />`}
        previewClassName="items-stretch"
      >
        <EscadaDemo />
      </DocSection>

      <DocSection
        title="Limites"
        description="min e max cortam a navegação e desabilitam os dias fora do intervalo. Sem eles, o seletor de ano cobre cinco anos para cada lado."
        code={`<DatePicker
  min={new Date(2026, 0, 1)}
  max={new Date(2026, 11, 31)}
  value={data}
  onChange={setData}
/>`}
        previewClassName="items-stretch"
      >
        <LimitesDemo />
      </DocSection>

      <DocNote title="O seletor de ano é limitado, e o padrão do react-day-picker não servia">
        Com <code>captionLayout=&quot;dropdown&quot;</code> e sem limites, ele
        oferece <strong>±100 anos</strong> — medido: 101 opções começando em
        1926. Ninguém lança uma transação em 1926, e uma lista de cem itens é
        pior que paginar o mês. O padrão é cinco anos para cada lado, que cobre
        lançamento retroativo e conta agendada; quem precisar de mais passa{" "}
        <code>min</code> e <code>max</code>.
      </DocNote>

      <DocNote title="O foco volta ao gatilho ao fechar">
        Havia um <code>onCloseAutoFocus</code> prevenido, e com ele o foco ficava
        no <code>&lt;body&gt;</code> — medido, no <kbd>Esc</kbd> e ao escolher.
        É o mesmo bug que o <code>FormPickerPopover</code> já tinha registrado: a
        justificativa (o salto de rolagem) vale para <strong>abrir</strong>, não
        para fechar, porque o Radix devolve o foco com{" "}
        <code>preventScroll</code>.
      </DocNote>

      <DocNote title="A raiz sabe do telefone">
        <code>modal</code> era <code>false</code> cravado. Sem <code>modal</code>{" "}
        no telefone, rolar a grade arrasta a folha que contém o formulário, e o
        dedo não distingue as duas — é a decisão que o{" "}
        <code>FormPickerPopover</code> já traz de fábrica.
      </DocNote>

      <DocNote title="displayStyle=&quot;numeric&quot; para espaço apertado">
        O padrão escreve o mês por extenso (&ldquo;5 de abril de 2026&rdquo;),
        que é mais legível e mais longo. Numa linha de filtros ao lado de outros
        controles, <code>numeric</code> devolve <code>05/04/2026</code>. Os dois
        saem de <code>@/lib/transaction-date</code>: havia dois{" "}
        <code>toLocaleDateString</code> escritos aqui dentro, com os helpers ao
        lado.
      </DocNote>

      <PropsTable
        rows={[
          {
            prop: "mode",
            type: '"single" | "range"',
            default: '"single"',
            description:
              "União discriminada: value e onChange mudam de tipo junto. Precisa de literal, não de variável.",
          },
          {
            prop: "value",
            type: "Date | DateRange | undefined",
            description: "A data ou o período escolhido.",
          },
          {
            prop: "onChange",
            type: "(v: Date | DateRange | undefined) => void",
            description: "Recebe undefined quando a seleção é limpa.",
          },
          {
            prop: "size",
            type: '"sm" | "md" | "lg" | "xl"',
            default: '"lg"',
            description: "A escada do sistema. lg (36) é a altura do Input.",
          },
          {
            prop: "clearable",
            type: "boolean",
            default: "false",
            description: "Um × no campo quando há valor. Irmão do gatilho, não filho.",
          },
          {
            prop: "min / max",
            type: "Date",
            description:
              "Limitam a navegação e desabilitam os dias fora. Sem eles, cinco anos para cada lado.",
          },
          {
            prop: "displayStyle",
            type: '"default" | "numeric"',
            default: '"default"',
            description: "Mês por extenso ou dd/mm/aaaa.",
          },
          {
            prop: "placeholder",
            type: "string",
            description: "O texto do campo enquanto nada foi escolhido.",
          },
        ]}
      />
    </>
  )
}

function CampoLadoALado() {
  const [data, setData] = React.useState<Date | undefined>(new Date(2026, 3, 5))

  return (
    <div className="flex w-full flex-col gap-4 sm:flex-row">
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <Label htmlFor="ds-date">Data da transação</Label>
        <DatePicker id="ds-date" value={data} onChange={setData} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <Label htmlFor="ds-date-desc">Descrição</Label>
        <Input id="ds-date-desc" size="lg" defaultValue="Mercado" />
      </div>
    </div>
  )
}

function IntervaloDemo() {
  const [periodo, setPeriodo] = React.useState<DateRange | undefined>({
    from: new Date(2026, 2, 9),
    to: new Date(2026, 2, 20),
  })

  return (
    <div className="flex w-full max-w-sm flex-col gap-1.5">
      <Label htmlFor="ds-date-range">Período</Label>
      <DatePicker
        id="ds-date-range"
        mode="range"
        displayStyle="numeric"
        clearable
        value={periodo}
        onChange={setPeriodo}
      />
    </div>
  )
}

function EscadaDemo() {
  const [data, setData] = React.useState<Date | undefined>(new Date(2026, 3, 5))

  return (
    <div className="flex w-full flex-col gap-3">
      {(["sm", "md", "lg", "xl"] as const).map((s) => (
        <DatePicker
          key={s}
          size={s}
          clearable
          displayStyle="numeric"
          value={data}
          onChange={setData}
        />
      ))}
    </div>
  )
}

function LimitesDemo() {
  const [data, setData] = React.useState<Date | undefined>()

  return (
    <div className="flex w-full max-w-sm flex-col gap-1.5">
      <Label htmlFor="ds-date-limites">Dentro de 2026</Label>
      <DatePicker
        id="ds-date-limites"
        min={new Date(2026, 0, 1)}
        max={new Date(2026, 11, 31)}
        value={data}
        onChange={setData}
      />
    </div>
  )
}
