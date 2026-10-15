"use client"

import * as React from "react"
import type { DateRange } from "react-day-picker"

import type { CalendarMarker } from "@/components/ui/calendar"
import { DatePicker, MonthGrid } from "@/components/ui/date-picker"
import { Button } from "@/components/ui/button"
import {
  DialogBody,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Label } from "@/components/ui/label"
import { formatYearMonth, labelYearMonthPt } from "@/lib/budget-month"
import { Controles, DocNote, DocSection, Eixo, PropsTable, Usage } from "../ds-doc"

function diaDoMes(dia: number) {
  const h = new Date()
  return new Date(h.getFullYear(), h.getMonth(), dia)
}

/** Vencimentos de exemplo, no mês corrente — a peça do calendário de pagamentos. */
const MARCADORES: CalendarMarker[] = [
  { dates: [diaDoMes(5), diaDoMes(20)], tone: "warning", label: "conta a vencer" },
  { dates: [diaDoMes(10)], tone: "info", label: "fatura do cartão" },
]

export default function DatePickerDoc() {
  return (
    <>
      <Usage>
        Escolha de uma data, de um intervalo ou de um mês, em pt-BR — num
        popover no desktop e numa gaveta no telefone. Para dia do mês
        recorrente (vencimento de fatura, dia do salário) o certo é um{" "}
        <code>Select</code> de 1 a 31, como no formulário de cartão.
      </Usage>

      <DocSection
        title="Ele é um campo"
        description="Mesma altura, borda e preenchimento do Input ao lado: os dois no degrau lg (36), sem ninguém dizer size."
        code={`<DatePicker value={data} onChange={setData} />`}
        previewClassName="items-stretch"
      >
        <CampoLadoALado />
      </DocSection>

      <DocSection
        title="Atalhos, Hoje e marcadores"
        description={
          <>
            <code>presets</code> põe atalhos ao lado da grade — dias numa data
            (<code>true</code>: Hoje e Ontem), períodos num intervalo
            (<code>true</code>: 7 dias, 30 dias, este mês, mês passado; com dois
            meses no desktop). <code>showToday</code> volta ao presente, e{" "}
            <code>markers</code> são os pontos do <code>Calendar</code>, com a
            legenda.
          </>
        }
        code={`<DatePicker presets showToday markers={vencimentos} value={data} onChange={setData} />
<DatePicker mode="range" presets value={periodo} onChange={setPeriodo} />`}
        previewClassName="flex-col items-stretch gap-3"
      >
        <AtalhosDemo />
      </DocSection>

      <DocSection
        title="Como a data aparece"
        description={
          <>
            <code>displayStyle</code>: por extenso (o padrão), <code>numeric</code>{" "}
            para linha apertada, ou <code>relative</code>, que põe Hoje, Ontem
            ou Amanhã na frente — o caso comum de um lançamento.
          </>
        }
        code={`<DatePicker displayStyle="relative" value={data} onChange={setData} />`}
        previewClassName="flex-col items-stretch gap-3"
      >
        <RotuloDemo />
      </DocSection>

      <DocSection
        title="Digitar a data"
        description={
          <>
            <code>variant=&quot;input&quot;</code>: o campo aceita dd/mm/aaaa
            com máscara (dd/mm vale o ano corrente) e as palavras hoje, ontem e
            amanhã; confirma no Enter e ao sair. O que não vira data — 31/02, ou
            fora dos limites — fica no campo, marcado inválido. O ícone abre a
            grade.
          </>
        }
        code={`<DatePicker variant="input" value={data} onChange={setData} />`}
        previewClassName="items-stretch"
      >
        <DigitarDemo />
      </DocSection>

      <DocSection
        title="Mês e ano"
        description={
          <>
            <code>mode=&quot;month&quot;</code> é a grade de doze meses, para o
            que é mensal; o valor é o primeiro dia do mês. A grade sozinha é o{" "}
            <code>MonthGrid</code>, para quem já tem gatilho próprio — a
            navegação de mês das categorias.
          </>
        }
        code={`<DatePicker mode="month" showToday value={mes} onChange={setMes} />

<MonthGrid value={mes} onChange={setMes} showToday />`}
        previewClassName="flex-col items-stretch gap-3"
      >
        <MesDemo />
      </DocSection>

      <DocSection
        title="Intervalo"
        description={
          <>
            <code>mode=&quot;range&quot;</code> escolhe o período num popover
            só, com a faixa entre as pontas realçada e sem fim antes do início.
            Com <code>confirm</code> as pontas ficam em rascunho até Aplicar;
            Cancelar e o Esc descartam, Limpar zera.
          </>
        }
        code={`<DatePicker mode="range" confirm value={periodo} onChange={setPeriodo} />`}
        previewClassName="flex-col items-stretch gap-3"
      >
        <IntervaloDemo />
      </DocSection>

      <DocSection
        title="Escada e limpeza"
        description="size é o mesmo da escada do sistema, e lg (36) é o padrão — o mesmo do Input e do resto da família. No dedo, os três degraus de baixo sobem ao piso de 40. clearable põe um × quando há valor."
        code={`<DatePicker size="sm" clearable value={data} onChange={setData} />`}
        previewClassName="items-stretch"
      >
        <EscadaDemo />
      </DocSection>

      <DocSection
        title="Limites"
        description="min e max cortam a navegação e desabilitam os dias (e os meses) fora do intervalo. Sem eles, o seletor de ano cobre cinco anos para cada lado."
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

      <DocSection
        title="Dentro de uma folha"
        description="O formulário de lançamento é uma folha, e no telefone a folha já é gaveta: a grade abre numa segunda gaveta por cima, e fechá-la devolve a pessoa à primeira."
        previewClassName="items-start"
      >
        <FolhaDemo />
      </DocSection>

      <DocNote title="O calendário brota do campo">
        A placa não aparece do nada: ela se desdobra a partir da aresta que encosta no campo, com a aresta que avança curva como uma gota, um passo de 6px e um desfoque que assenta, na mola da casa — e o cabeçalho, os dias da semana e cada semana chegam em ondas de 25ms. Ao fechar, some em 150ms encolhendo para o campo, sem mola. É a <code>@utility date-picker-bloom</code>, só no popover; a gaveta do telefone tem o movimento dela. Com movimento reduzido, tudo chega de uma vez.
      </DocNote>

      <DocNote title="No telefone, uma gaveta">
        Abaixo de 768px a grade abre numa gaveta de baixo, com as células no degrau <code>lg</code> e esticadas na largura da tela. O popover saía na largura do campo, com células de 32 para o dedo. A gaveta tem título para o leitor de tela (&ldquo;Escolher data&rdquo;, &ldquo;Escolher período&rdquo;, &ldquo;Escolher mês&rdquo;).
      </DocNote>

      <DocNote title="O seletor de ano cobre cinco anos para cada lado">
        Sem limites, o <code>react-day-picker</code> oferece ±100 anos, e uma lista de cem itens é pior que paginar o mês. Cinco anos cobrem lançamento retroativo e conta agendada; para mais, <code>min</code> e <code>max</code>.
      </DocNote>

      <DocNote title="O foco volta ao gatilho ao fechar">
        No <kbd>Esc</kbd> e ao escolher. Não previna <code>onCloseAutoFocus</code>: o foco ficaria no <code>&lt;body&gt;</code>.
      </DocNote>

      <PropsTable
        rows={[
          {
            prop: "mode",
            type: '"single" | "range" | "month"',
            default: '"single"',
            description:
              "União discriminada: value e onChange mudam de tipo junto. Precisa de literal, não de variável.",
          },
          {
            prop: "value / onChange",
            type: "Date | DateRange | undefined",
            description:
              "A data, o período ou o primeiro dia do mês. undefined quando a seleção é limpa.",
          },
          {
            prop: "presets",
            type: "true | { label, date }[] | { label, range }[]",
            description:
              "Atalhos ao lado da grade; true usa os padrões do modo. Não existe em month.",
          },
          {
            prop: "showToday",
            type: "boolean",
            default: "false",
            description: "O Hoje (ou Este mês) que volta ao presente.",
          },
          {
            prop: "markers",
            type: "CalendarMarker[]",
            description: "Pontos sob os dias, por tom, com a legenda.",
          },
          {
            prop: "displayStyle",
            type: '"default" | "numeric" | "relative"',
            default: '"default"',
            description:
              "Por extenso, dd/mm/aaaa, ou Hoje/Ontem/Amanhã na frente (só de um dia).",
          },
          {
            prop: "variant",
            type: '"picker" | "input"',
            default: '"picker"',
            description: "input: o campo é digitável. Só na data única.",
          },
          {
            prop: "confirm",
            type: "boolean",
            default: "false",
            description: "No intervalo: rascunho até Aplicar, com Limpar e Cancelar.",
          },
          {
            prop: "size",
            type: '"sm" | "md" | "lg" | "xl"',
            default: '"lg"',
            description:
              "A escada do sistema. lg (36) é o padrão da família inteira; no dedo, 40.",
          },
          {
            prop: "clearable",
            type: "boolean",
            default: "false",
            description: "Um × no campo quando há valor.",
          },
          {
            prop: "min / max",
            type: "Date",
            description:
              "Limitam a navegação e desabilitam os dias fora. Sem eles, cinco anos para cada lado.",
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
        <Input id="ds-date-desc" defaultValue="Mercado" />
      </div>
    </div>
  )
}

function AtalhosDemo() {
  const [modo, setModo] = React.useState<"single" | "range">("single")
  const [data, setData] = React.useState<Date | undefined>()
  const [periodo, setPeriodo] = React.useState<DateRange | undefined>()

  return (
    <>
      <Controles
        inicio={
          <Eixo
            rotulo="mode"
            valores={["single", "range"] as const}
            valor={modo}
            onChange={setModo}
            rotulos={{ single: "Data", range: "Período" }}
          />
        }
      />
      <div className="flex w-full max-w-sm flex-col gap-1.5">
        <Label htmlFor="ds-date-atalhos">
          {modo === "single" ? "Vencimento" : "Período"}
        </Label>
        {modo === "single" ? (
          <DatePicker
            id="ds-date-atalhos"
            presets
            showToday
            markers={MARCADORES}
            displayStyle="relative"
            value={data}
            onChange={setData}
          />
        ) : (
          <DatePicker
            id="ds-date-atalhos"
            mode="range"
            presets
            displayStyle="numeric"
            value={periodo}
            onChange={setPeriodo}
          />
        )}
      </div>
    </>
  )
}

function RotuloDemo() {
  const [estilo, setEstilo] = React.useState<"default" | "numeric" | "relative">(
    "relative"
  )
  const [data, setData] = React.useState<Date | undefined>(() => new Date())

  return (
    <>
      <Controles
        inicio={
          <Eixo
            rotulo="displayStyle"
            valores={["default", "numeric", "relative"] as const}
            valor={estilo}
            onChange={setEstilo}
          />
        }
      />
      <div className="w-full max-w-sm">
        <DatePicker
          aria-label="Data"
          displayStyle={estilo}
          presets
          value={data}
          onChange={setData}
        />
      </div>
    </>
  )
}

function DigitarDemo() {
  const [data, setData] = React.useState<Date | undefined>(new Date(2026, 3, 5))

  return (
    <div className="flex w-full max-w-sm flex-col gap-1.5">
      <Label htmlFor="ds-date-digitar">Data da transação</Label>
      <DatePicker
        id="ds-date-digitar"
        variant="input"
        presets
        value={data}
        onChange={setData}
      />
      <p className="min-h-5 text-sm text-muted-foreground" aria-live="polite">
        {data ? `Valor: ${data.toLocaleDateString("pt-BR")}` : "Sem data"}
      </p>
    </div>
  )
}

function MesDemo() {
  const [forma, setForma] = React.useState<"campo" | "grade">("campo")
  const [mes, setMes] = React.useState<Date | undefined>(() => {
    const h = new Date()
    return new Date(h.getFullYear(), h.getMonth(), 1)
  })

  return (
    <>
      <Controles
        fim={
          <Eixo
            rotulo="forma"
            valores={["campo", "grade"] as const}
            valor={forma}
            onChange={setForma}
            rotulos={{ campo: "Campo", grade: "MonthGrid" }}
          />
        }
      />
      {forma === "campo" ? (
        <div className="flex w-full max-w-sm flex-col gap-1.5">
          <Label htmlFor="ds-date-mes">Mês do orçamento</Label>
          <DatePicker
            id="ds-date-mes"
            mode="month"
            showToday
            value={mes}
            onChange={setMes}
          />
        </div>
      ) : (
        <div className="flex flex-col items-start gap-2">
          <div className="rounded-surface border border-border">
            <MonthGrid value={mes} onChange={setMes} showToday />
          </div>
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {mes ? labelYearMonthPt(formatYearMonth(mes)) : "Nenhum mês"}
          </p>
        </div>
      )}
    </>
  )
}

function IntervaloDemo() {
  const [confirmar, setConfirmar] = React.useState<"sim" | "nao">("sim")
  const [periodo, setPeriodo] = React.useState<DateRange | undefined>({
    from: new Date(2026, 2, 9),
    to: new Date(2026, 2, 20),
  })

  return (
    <>
      <Controles
        inicio={
          <Eixo
            rotulo="confirm"
            valores={["sim", "nao"] as const}
            valor={confirmar}
            onChange={setConfirmar}
            rotulos={{ sim: "Com confirmação", nao: "Direto" }}
          />
        }
      />
      <div className="flex w-full max-w-sm flex-col gap-1.5">
        <Label htmlFor="ds-date-range">Período</Label>
        <DatePicker
          id="ds-date-range"
          mode="range"
          displayStyle="numeric"
          clearable
          confirm={confirmar === "sim"}
          value={periodo}
          onChange={setPeriodo}
        />
      </div>
    </>
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
          aria-label={`Data, degrau ${s}`}
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

function FolhaDemo() {
  const [data, setData] = React.useState<Date | undefined>(() => new Date())

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button type="button" variant="secondary">
          nova transação
        </Button>
      </SheetTrigger>
      <SheetContent side="right">
        <DialogHeader>
          <DialogTitle>Nova transação</DialogTitle>
          <DialogDescription>A data abre por cima da folha.</DialogDescription>
        </DialogHeader>
        <DialogBody>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ds-date-folha">Data</Label>
            <DatePicker
              id="ds-date-folha"
              displayStyle="relative"
              presets
              value={data}
              onChange={setData}
            />
          </div>
        </DialogBody>
      </SheetContent>
    </Sheet>
  )
}
