"use client"

import * as React from "react"
import type { DateRange } from "react-day-picker"
import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
} from "@heroicons/react/16/solid"

import { cn } from "@/lib/utils"
import {
  fieldControlHeightClassName,
  fieldControlPaddingClassName,
  fieldTriggerClassName,
  type FieldControlSize,
} from "@/lib/field-classes"
import {
  formatDateLongPtBr,
  formatMonthShortPtBr,
  formatTransactionDmyPtBr,
  localYmdFromDate,
} from "@/lib/transaction-date"
import { formatYearMonth, labelYearMonthPt } from "@/lib/budget-month"
import { useIsMobile } from "@/hooks/use-mobile"
import { Button } from "@/components/ui/button"
import {
  Calendar,
  type CalendarMarker,
  type CalendarPreset,
} from "@/components/ui/calendar"
import { DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Drawer, DrawerContent } from "@/components/ui/drawer"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

/**
 * A escolha de uma data, de um intervalo ou de um mês, em pt-BR.
 *
 * ## O gatilho é um campo, não um botão
 *
 * Ele era `Button variant="outline" size="md"`. Medido no tema claro, lado a
 * lado com o `Input`: **32px contra 36**, e preenchimento `oklch(0.985)` opaco
 * contra `oklab(0.9 0 0 / 0.3)` translúcido. Um campo de data ao lado de um
 * campo de texto era mais baixo e de outra superfície. É a mesma medição que
 * tirou o `Combobox` do `Button` na rodada 06.
 *
 * Sair do `Button` também tira o gatilho da garantia de maiúscula inicial do
 * CTA — o que é correto: `Selecione a data` é placeholder de campo, não rótulo
 * de ação.
 *
 * ## `mode` é união discriminada
 *
 * `<DatePicker mode={x}>` com uma variável não estreita: precisa de literal. É
 * a mesma forma do `multiple` do `Combobox` — `value` e `onChange` mudam de
 * tipo junto com ela.
 *
 * ## Rodada 210
 *
 * - **`presets`**: atalhos ao lado da grade — dias (`Hoje`, `Ontem`) numa
 *   data, intervalos num período (dois meses no desktop). `true` usa os
 *   atalhos padrão do modo. O `Calendar` ganhou o atalho de dia para isto.
 * - **`showToday`** e **`markers`**: repassados ao `Calendar`, que os tem
 *   desde a rodada 203.
 * - **`displayStyle="relative"`**: "Hoje · 1 de outubro de 2026" — ontem,
 *   hoje e amanhã ganham a palavra; o resto fica por extenso.
 * - **`variant="input"`**: o campo é digitável (dd/mm/aaaa com máscara, e
 *   "hoje", "ontem", "amanhã"); o ícone abre a grade. Só data única.
 * - **`mode="month"`**: a grade de doze meses (`MonthGrid`, também exportada
 *   para quem tem gatilho próprio, como a navegação de mês das categorias).
 * - **No telefone a grade abre numa gaveta** (`Drawer`), com as células no
 *   degrau `lg` e esticadas — o popover saía espremido na largura do campo.
 * - **`confirm`** no intervalo: as pontas ficam em rascunho até "Aplicar".
 *
 * O comentário daqui dizia que o filtro de período das transações montava
 * **dois** `DatePicker` independentes; ele usa um só, em intervalo, desde que
 * o intervalo existe.
 */

type DatePickerSize = FieldControlSize

type DatePickerDayPreset = { label: string; date: Date | (() => Date) }
export type DatePickerRangePreset = { label: string; range: DateRange | (() => DateRange) }

type DatePickerBaseProps = {
  id?: string
  /** Para o campo sem rótulo visível. */
  "aria-label"?: string
  "aria-labelledby"?: string
  "aria-describedby"?: string
  "aria-invalid"?: boolean
  disabled?: boolean
  className?: string
  placeholder?: string
  /** A altura, na escada do sistema — e `md` (32) é o padrão da família
      inteira, `Input` incluído. */
  size?: DatePickerSize
  /**
   * `numeric` é dd/mm/aaaa, para linha apertada; `relative` põe "Hoje",
   * "Ontem" e "Amanhã" na frente da data por extenso.
   */
  displayStyle?: "default" | "numeric" | "relative"
  /** Um × no campo quando há valor. */
  clearable?: boolean
  /** Limites da grade. */
  min?: Date
  max?: Date
  /** O "Hoje" (ou "Este mês") que volta ao presente. */
  showToday?: boolean
  popoverClassName?: string
}

type DatePickerSingleProps = DatePickerBaseProps & {
  mode?: "single"
  value?: Date
  onChange: (date: Date | undefined) => void
  /** Atalhos de dia. `true`: Hoje e Ontem. */
  presets?: true | DatePickerDayPreset[]
  /** Pontos sob os dias, por tom — os do `Calendar`. */
  markers?: CalendarMarker[]
  /** `input`: o campo é digitável, e o ícone abre a grade. */
  variant?: "picker" | "input"
  confirm?: never
}

type DatePickerRangeProps = DatePickerBaseProps & {
  mode: "range"
  value?: DateRange
  onChange: (range: DateRange | undefined) => void
  /** Atalhos de período. `true`: 7 dias, 30 dias, este mês, mês passado. */
  presets?: true | DatePickerRangePreset[]
  markers?: CalendarMarker[]
  /** As pontas ficam em rascunho até "Aplicar". */
  confirm?: boolean
  variant?: "picker"
}

type DatePickerMonthProps = DatePickerBaseProps & {
  mode: "month"
  /** O primeiro dia do mês escolhido. */
  value?: Date
  onChange: (month: Date | undefined) => void
  presets?: never
  markers?: never
  confirm?: never
  variant?: "picker"
}

export type DatePickerProps =
  | DatePickerSingleProps
  | DatePickerRangeProps
  | DatePickerMonthProps

function hoje() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

function somarDias(d: Date, dias: number) {
  const r = new Date(d)
  r.setDate(r.getDate() + dias)
  return r
}

const ATALHOS_DIA: DatePickerDayPreset[] = [
  { label: "Hoje", date: hoje },
  { label: "Ontem", date: () => somarDias(hoje(), -1) },
]

/**
 * Os atalhos de período do sistema. O `id` é estável (rodada 245): o
 * `FilterBar` o grava na URL, e o rótulo pode mudar sem quebrar um link.
 */
export const DATE_RANGE_PRESETS: (DatePickerRangePreset & { id: string })[] = [
  { id: "ultimos-7", label: "Últimos 7 dias", range: () => ({ from: somarDias(hoje(), -6), to: hoje() }) },
  { id: "ultimos-30", label: "Últimos 30 dias", range: () => ({ from: somarDias(hoje(), -29), to: hoje() }) },
  {
    id: "este-mes",
    label: "Este mês",
    range: () => {
      const h = hoje()
      return { from: new Date(h.getFullYear(), h.getMonth(), 1), to: h }
    },
  },
  {
    id: "mes-passado",
    label: "Mês passado",
    range: () => {
      const h = hoje()
      return {
        from: new Date(h.getFullYear(), h.getMonth() - 1, 1),
        to: new Date(h.getFullYear(), h.getMonth(), 0),
      }
    },
  },
]

const PALAVRA_RELATIVA: Record<number, string> = { [-1]: "Ontem", 0: "Hoje", 1: "Amanhã" }

/**
 * A formatação sai dos helpers, e não de um `toLocaleDateString` local. Os
 * helpers recebem `YYYY-MM-DD`, então a `Date` passa por `localYmdFromDate`
 * primeiro; é o caminho que evita o pulo de fuso que converter para ISO produz.
 */
function rotularData(
  value: Date,
  displayStyle: DatePickerBaseProps["displayStyle"]
) {
  const ymd = localYmdFromDate(value)
  if (displayStyle === "numeric") return formatTransactionDmyPtBr(ymd)
  const longa = formatDateLongPtBr(ymd)
  if (displayStyle !== "relative") return longa
  const dia = new Date(value)
  dia.setHours(0, 0, 0, 0)
  const palavra = PALAVRA_RELATIVA[Math.round((dia.getTime() - hoje().getTime()) / 86_400_000)]
  return palavra ? `${palavra} · ${longa}` : longa
}

function rotularIntervalo(
  value: DateRange,
  displayStyle: DatePickerBaseProps["displayStyle"]
) {
  if (!value.from) return null
  // A palavra relativa é de um dia só; num período as pontas ficam por extenso.
  const estilo = displayStyle === "relative" ? "default" : displayStyle
  const inicio = rotularData(value.from, estilo)
  if (!value.to) return inicio
  return `${inicio} – ${rotularData(value.to, estilo)}`
}

function rotularMes(value: Date, displayStyle: DatePickerBaseProps["displayStyle"]) {
  if (displayStyle === "numeric") {
    return `${String(value.getMonth() + 1).padStart(2, "0")}/${value.getFullYear()}`
  }
  return labelYearMonthPt(formatYearMonth(value))
}

/**
 * O texto digitado vira data: dd/mm/aaaa, dd/mm/aa, dd/mm (ano corrente) e as
 * palavras "hoje", "ontem" e "amanhã". Uma data que não existe (31/02) é
 * `null`, e não o 3 de março que o `Date` inventaria.
 */
export function parseTypedDate(texto: string): Date | null {
  const t = texto.trim().toLocaleLowerCase("pt-BR")
  if (!t) return null
  if (t === "hoje") return hoje()
  if (t === "ontem") return somarDias(hoje(), -1)
  if (t === "amanhã" || t === "amanha") return somarDias(hoje(), 1)
  const m = /^(\d{1,2})\/(\d{1,2})(?:\/(\d{2}|\d{4}))?$/.exec(t)
  if (!m) return null
  const dia = Number(m[1])
  const mes = Number(m[2])
  const ano = m[3] == null ? hoje().getFullYear() : m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3])
  const d = new Date(ano, mes - 1, dia)
  if (d.getFullYear() !== ano || d.getMonth() !== mes - 1 || d.getDate() !== dia) return null
  return d
}

/** A máscara: só dígitos viram dd/mm/aaaa; com letra, o texto passa como está. */
export function maskTypedDate(texto: string) {
  if (/[a-zà-ú]/i.test(texto)) return texto
  const n = texto.replace(/\D/g, "").slice(0, 8)
  if (n.length <= 2) return n
  if (n.length <= 4) return `${n.slice(0, 2)}/${n.slice(2)}`
  return `${n.slice(0, 2)}/${n.slice(2, 4)}/${n.slice(4)}`
}

function dentroDosLimites(d: Date, min?: Date, max?: Date) {
  const dia = new Date(d)
  dia.setHours(0, 0, 0, 0)
  if (min && dia < new Date(min.getFullYear(), min.getMonth(), min.getDate())) return false
  if (max && dia > new Date(max.getFullYear(), max.getMonth(), max.getDate())) return false
  return true
}

/** A casca da grade: popover no desktop, gaveta no telefone. */
function useSuperficie() {
  const [open, setOpen] = React.useState(false)
  const isMobile = useIsMobile()
  return { open, setOpen, isMobile }
}

function gatilhoClassName(size: DatePickerSize) {
  return cn(
    fieldTriggerClassName,
    "flex w-full min-w-0 items-center gap-2 text-left font-normal",
    fieldControlHeightClassName[size],
    fieldControlPaddingClassName[size],
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
  )
}

export function DatePicker(props: DatePickerProps) {
  const {
    id,
    "aria-label": ariaLabel,
    "aria-labelledby": ariaLabelledBy,
    "aria-describedby": ariaDescribedBy,
    "aria-invalid": ariaInvalid,
    disabled,
    className,
    placeholder,
    size = "md",
    displayStyle = "default",
    clearable = false,
    min,
    max,
    showToday = false,
    popoverClassName,
  } = props

  const { open, setOpen, isMobile } = useSuperficie()
  // O rascunho do intervalo com `confirm`: nasce do valor a cada abertura.
  const [rascunho, setRascunho] = React.useState<DateRange | undefined>()

  const abrir = (proximo: boolean) => {
    if (proximo && props.mode === "range") setRascunho(props.value)
    setOpen(proximo)
  }

  const rotulo =
    props.mode === "range"
      ? props.value
        ? rotularIntervalo(props.value, displayStyle)
        : null
      : props.mode === "month"
        ? props.value
          ? rotularMes(props.value, displayStyle)
          : null
        : props.value
          ? rotularData(props.value, displayStyle)
          : null

  const vazio =
    placeholder ??
    (props.mode === "range"
      ? "Selecione o período"
      : props.mode === "month"
        ? "Selecione o mês"
        : "Selecione a data")
  const titulo =
    props.mode === "range"
      ? "Escolher período"
      : props.mode === "month"
        ? "Escolher mês"
        : "Escolher data"
  const temValor = rotulo !== null

  // Os ramos são idênticos no corpo e diferentes no tipo: a união dos
  // `onChange` não aceita um argumento só. O `if` é o estreitamento.
  const limpar = () => {
    if (props.mode === "range") props.onChange(undefined)
    else props.onChange(undefined)
  }

  const presetsDoModo: CalendarPreset[] | undefined =
    props.mode === "range"
      ? props.presets === true
        ? DATE_RANGE_PRESETS
        : props.presets
      : props.mode === "month"
        ? undefined
        : props.presets === true
          ? ATALHOS_DIA
          : props.presets

  // Na gaveta as células sobem ao degrau `lg` e esticam: o popover saía na
  // largura do campo, e no dedo a célula de 32 é pequena.
  const naGaveta = isMobile
  const calendarioComum = {
    captionLayout: "dropdown" as const,
    size: naGaveta ? ("lg" as const) : ("md" as const),
    stretch: naGaveta,
    showToday,
    presets: presetsDoModo,
    ...limitesNavegacao(min, max),
    disabled: limitesDesabilitados(min, max),
  }

  const painel =
    props.mode === "month" ? (
      <MonthGrid
        value={props.value}
        min={min}
        max={max}
        showToday={showToday}
        className={naGaveta ? "w-full" : undefined}
        onChange={(d) => {
          props.onChange(d)
          setOpen(false)
        }}
      />
    ) : props.mode === "range" ? (
      <div className="flex flex-col">
        <Calendar
          mode="range"
          {...calendarioComum}
          markers={props.markers}
          selected={props.confirm ? rascunho : props.value}
          onSelect={(r) => (props.confirm ? setRascunho(r) : props.onChange(r))}
          defaultMonth={props.value?.from}
        />
        {props.confirm ? (
          <div
            data-slot="date-picker-footer"
            className="flex items-center gap-2 px-3 pb-3"
          >
            <Button
              type="button"
              variant="tertiary"
              size="sm"
              onClick={() => {
                props.onChange(undefined)
                setOpen(false)
              }}
            >
              limpar
            </Button>
            <div className="ms-auto flex items-center gap-2">
              <Button
                type="button"
                variant="tertiary"
                size="sm"
                onClick={() => setOpen(false)}
              >
                cancelar
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                disabled={!rascunho?.from}
                onClick={() => {
                  props.onChange(rascunho)
                  setOpen(false)
                }}
              >
                aplicar
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    ) : (
      <Calendar
        mode="single"
        {...calendarioComum}
        markers={props.markers}
        selected={props.value}
        onSelect={(d) => {
          props.onChange(d)
          setOpen(false)
        }}
        defaultMonth={props.value}
      />
    )

  const ariaComum = {
    "aria-label": ariaLabel,
    "aria-labelledby": ariaLabelledBy,
    // O `FieldControl` injeta a descrição e o erro aqui; sem repassar, o leitor
    // de tela nunca os lia.
    "aria-describedby": ariaDescribedBy,
    "aria-invalid": ariaInvalid,
  }

  const digitavel = props.mode !== "range" && props.mode !== "month" && props.variant === "input"

  const gatilho = digitavel ? (
    <CampoDigitavel
      id={id}
      size={size}
      disabled={disabled}
      placeholder={placeholder}
      value={props.value}
      min={min}
      max={max}
      // `digitavel` já estreitou `props` para a data única (condição apelidada).
      onCommit={(d) => props.onChange(d)}
      aria={ariaComum}
      botao={
        <BotaoDaGrade
          naGaveta={naGaveta}
          open={open}
          disabled={disabled}
          onOpen={() => abrir(true)}
        />
      }
    />
  ) : (
    <GatilhoCampo
      naGaveta={naGaveta}
      open={open}
      onOpen={() => abrir(true)}
      id={id}
      type="button"
      disabled={disabled}
      {...ariaComum}
      data-slot="date-picker-trigger"
      data-size={size}
      data-empty={temValor ? undefined : "true"}
      className={cn(
        gatilhoClassName(size),
        // Recuo para o ×: quem recua é o **rótulo**, não a caixa — recuar o
        // campo empurraria o ícone para dentro. Lição do `Combobox`.
        clearable && temValor && "[--date-picker-value-pe:--spacing(7)]"
      )}
    >
      <CalendarIcon aria-hidden className="text-muted-foreground" />
      <span
        className={cn(
          "min-w-0 flex-1 truncate pe-[var(--date-picker-value-pe,0px)]",
          !temValor && "text-muted-foreground"
        )}
      >
        {rotulo ?? vazio}
      </span>
    </GatilhoCampo>
  )

  const campo = (
    <div className={cn("relative w-full min-w-0", className)}>
      {gatilho}
      {/* Irmão do gatilho, e não filho: `button` não aninha em `button`. */}
      {clearable && temValor && !disabled && !digitavel ? (
        <Button
          type="button"
          variant="tertiary"
          size="icon-xs"
          aria-label={props.mode === "range" ? "Limpar período" : "Limpar data"}
          data-slot="date-picker-clear"
          className="absolute inset-y-0 end-1.5 my-auto text-muted-foreground"
          onClick={limpar}
        >
          <XMarkIcon aria-hidden />
        </Button>
      ) : null}
    </div>
  )

  if (naGaveta) {
    return (
      <>
        {campo}
        <Drawer open={open} onOpenChange={abrir}>
          <DrawerContent
            data-slot="date-picker-drawer"
            className="px-2 pb-[max(--spacing(3),env(safe-area-inset-bottom))]"
          >
            <DialogHeader className="sr-only">
              <DialogTitle>{titulo}</DialogTitle>
            </DialogHeader>
            {painel}
          </DrawerContent>
        </Drawer>
      </>
    )
  }

  return (
    <Popover open={open} onOpenChange={abrir}>
      {/* O campo é a âncora, e não o gatilho: sem isto o popover sairia com a
          largura do gatilho e o × ficaria fora da caixa que ele deve habitar. */}
      <PopoverAnchor asChild>{campo}</PopoverAnchor>
      <PopoverContent
        padding="none"
        // A entrada que brota do campo (`@utility date-picker-bloom`), no lugar
        // da do popover.
        motion="none"
        className={cn("date-picker-bloom w-auto", popoverClassName)}
        align="start"
      >
        {painel}
      </PopoverContent>
    </Popover>
  )
}

/**
 * O gatilho no desktop é o `PopoverTrigger`; no telefone, um botão que abre a
 * gaveta — o Radix não tem gatilho comum aos dois.
 */
function GatilhoCampo({
  naGaveta,
  open,
  onOpen,
  ...props
}: React.ComponentProps<"button"> & {
  naGaveta: boolean
  open: boolean
  onOpen: () => void
}) {
  if (naGaveta) {
    return (
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={onOpen}
        {...props}
      />
    )
  }
  return <PopoverTrigger {...props} />
}

function BotaoDaGrade({
  naGaveta,
  open,
  disabled,
  onOpen,
}: {
  naGaveta: boolean
  open: boolean
  disabled?: boolean
  onOpen: () => void
}) {
  const botao = (
    <Button
      type="button"
      variant="tertiary"
      size="icon-xs"
      disabled={disabled}
      aria-label="Abrir calendário"
      data-slot="date-picker-calendar-button"
      className="absolute inset-y-0 end-1.5 my-auto text-muted-foreground"
      {...(naGaveta
        ? { onClick: onOpen, "aria-haspopup": "dialog" as const, "aria-expanded": open }
        : {})}
    >
      <CalendarIcon aria-hidden />
    </Button>
  )
  return naGaveta ? botao : <PopoverTrigger asChild>{botao}</PopoverTrigger>
}

/**
 * O campo que se digita: dd/mm/aaaa com máscara, e as palavras do dia.
 * Confirma no Enter e ao sair; o que não vira data fica no campo, marcado
 * inválido, em vez de sumir.
 */
function CampoDigitavel({
  id,
  size,
  disabled,
  placeholder,
  value,
  min,
  max,
  onCommit,
  aria,
  botao,
}: {
  id?: string
  size: DatePickerSize
  disabled?: boolean
  placeholder?: string
  value?: Date
  min?: Date
  max?: Date
  onCommit: (d: Date | undefined) => void
  aria: Record<string, string | boolean | undefined>
  botao: React.ReactNode
}) {
  const formatar = (d?: Date) => (d ? formatTransactionDmyPtBr(localYmdFromDate(d)) : "")
  const [texto, setTexto] = React.useState(() => formatar(value))
  const [invalido, setInvalido] = React.useState(false)
  const chave = value ? localYmdFromDate(value) : ""
  const [chaveVista, setChaveVista] = React.useState(chave)
  // O valor mudou por fora (a grade, um atalho): o texto o acompanha.
  if (chave !== chaveVista) {
    setChaveVista(chave)
    setTexto(formatar(value))
    setInvalido(false)
  }

  const confirmar = () => {
    if (!texto.trim()) {
      setInvalido(false)
      if (value) onCommit(undefined)
      return
    }
    const d = parseTypedDate(texto)
    if (!d || !dentroDosLimites(d, min, max)) {
      setInvalido(true)
      return
    }
    setInvalido(false)
    setTexto(formatar(d))
    if (localYmdFromDate(d) !== chave) onCommit(d)
  }

  return (
    <>
      <Input
        id={id}
        size={size}
        disabled={disabled}
        inputMode="numeric"
        autoComplete="off"
        placeholder={placeholder ?? "dd/mm/aaaa"}
        data-slot="date-picker-input"
        {...aria}
        aria-invalid={invalido || aria["aria-invalid"] ? true : undefined}
        value={texto}
        onChange={(e) => setTexto(maskTypedDate(e.target.value))}
        onBlur={confirmar}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault()
            confirmar()
          }
        }}
        className="pe-9 nums"
      />
      {botao}
    </>
  )
}

/**
 * Os doze meses de um ano, com o ano entre as setas. É o painel do
 * `mode="month"`, e é exportado para quem tem gatilho próprio — a navegação de
 * mês das categorias, que eram dois `Select` lado a lado.
 */
export function MonthGrid({
  value,
  onChange,
  min,
  max,
  showToday = false,
  className,
}: {
  value?: Date
  onChange: (month: Date) => void
  min?: Date
  max?: Date
  showToday?: boolean
  className?: string
}) {
  const agora = hoje()
  const [ano, setAno] = React.useState(() => (value ?? agora).getFullYear())
  const { startMonth, endMonth } = limitesNavegacao(min, max)
  const anoMin = startMonth.getFullYear()
  const anoMax = endMonth.getFullYear()
  const foraDoLimite = (a: number, m: number) =>
    new Date(a, m + 1, 0) < startMonth || new Date(a, m, 1) > endMonth

  return (
    <div
      data-slot="month-grid"
      className={cn("flex w-64 flex-col gap-2 p-3", className)}
    >
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="tertiary"
          size="icon-sm"
          aria-label="Ano anterior"
          disabled={ano <= anoMin}
          onClick={() => setAno((a) => a - 1)}
        >
          <ChevronLeftIcon aria-hidden />
        </Button>
        <span className="text-sm font-medium nums" aria-live="polite">
          {ano}
        </span>
        <Button
          type="button"
          variant="tertiary"
          size="icon-sm"
          aria-label="Próximo ano"
          disabled={ano >= anoMax}
          onClick={() => setAno((a) => a + 1)}
        >
          <ChevronRightIcon aria-hidden />
        </Button>
      </div>
      <div role="group" aria-label={`Meses de ${ano}`} className="grid grid-cols-3 gap-1">
        {Array.from({ length: 12 }, (_, m) => {
          const escolhido = value?.getFullYear() === ano && value.getMonth() === m
          const atual = agora.getFullYear() === ano && agora.getMonth() === m
          const nome = labelYearMonthPt(formatYearMonth(new Date(ano, m, 1)))
          return (
            <Button
              key={m}
              type="button"
              size="sm"
              variant={escolhido ? "primary" : atual ? "secondary" : "tertiary"}
              aria-pressed={escolhido}
              aria-current={atual ? "date" : undefined}
              aria-label={nome}
              disabled={foraDoLimite(ano, m)}
              className="font-normal"
              onClick={() => onChange(new Date(ano, m, 1))}
            >
              <span className="capitalize">{formatMonthShortPtBr(new Date(ano, m, 1))}</span>
            </Button>
          )
        })}
      </div>
      {showToday ? (
        <Button
          type="button"
          variant="tertiary"
          size="xs"
          className="self-center"
          onClick={() => {
            setAno(agora.getFullYear())
            onChange(new Date(agora.getFullYear(), agora.getMonth(), 1))
          }}
        >
          este mês
        </Button>
      ) : null}
    </div>
  )
}

/**
 * O alcance do seletor de ano.
 *
 * Com `captionLayout="dropdown"` e sem limites, o `react-day-picker` oferece
 * **±100 anos** — medido: 101 opções começando em 1926. Ninguém lança uma
 * transação em 1926, e uma lista de cem itens é pior que paginar o mês.
 *
 * Cinco para trás e cinco para frente cobrem o que este app faz: lançamento
 * retroativo de meses (às vezes de um ano fiscal anterior) e agendamento de
 * conta futura. Quem precisar de mais passa `min` / `max`.
 */
const ALCANCE_PADRAO_ANOS = 5

function limitesNavegacao(min?: Date, max?: Date) {
  const agora = new Date()
  return {
    startMonth: min ?? new Date(agora.getFullYear() - ALCANCE_PADRAO_ANOS, 0, 1),
    endMonth: max ?? new Date(agora.getFullYear() + ALCANCE_PADRAO_ANOS, 11, 31),
  }
}

/**
 * `startMonth` / `endMonth` limitam a **navegação**; sem isto os dias fora do
 * intervalo continuariam clicáveis no mês da borda.
 */
function limitesDesabilitados(min?: Date, max?: Date) {
  if (!min && !max) return undefined
  return [
    ...(min ? [{ before: min }] : []),
    ...(max ? [{ after: max }] : []),
  ]
}
