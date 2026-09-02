"use client"

import * as React from "react"
import type { DateRange } from "react-day-picker"
import { CalendarIcon, XMarkIcon } from "@heroicons/react/16/solid"

import { cn } from "@/lib/utils"
import {
  fieldDisabledClassName,
  fieldFocusRingClassName,
  fieldInvalidClassName,
  fieldSurfaceClassName,
  fieldTriggerHoverClassName,
  fieldTriggerSizeClassName,
} from "@/lib/field-classes"
import {
  formatDateLongPtBr,
  formatTransactionDmyPtBr,
  localYmdFromDate,
} from "@/lib/transaction-date"
import { useIsMobile } from "@/hooks/use-mobile"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

/**
 * A escolha de uma data — ou de um intervalo — em popover, em pt-BR.
 *
 * ## O gatilho é um campo, não um botão
 *
 * Ele era `Button variant="outline" size="md"`. Medido no tema claro, lado a
 * lado com o `Input`: **32px contra 36**, e preenchimento `oklch(0.985)` opaco
 * contra `oklab(0.9 0 0 / 0.3)` translúcido. Um campo de data ao lado de um
 * campo de texto era mais baixo e de outra superfície.
 *
 * É a mesma medição que tirou o `Combobox` do `Button` na rodada 06, e o
 * `field-classes` foi escrito exatamente para não deixar isso voltar. O
 * `AGENTS.md` registrava "três gatilhos de campo em duas aparências"; a conta
 * era quatro, e este era um dos dois que faltavam.
 *
 * Sair do `Button` também tira o gatilho da garantia de maiúscula inicial do
 * CTA — o que é correto: `Selecione a data` é placeholder de campo, não rótulo
 * de ação.
 *
 * ## `mode` é união discriminada
 *
 * `<DatePicker mode={x}>` com uma variável booleana não estreita: precisa de
 * literal. É a mesma forma do `multiple` do `Combobox`, e pela mesma razão —
 * `value` e `onChange` mudam de tipo junto com ela.
 *
 * O intervalo não é luxo: `transactions-date-range-form.tsx` monta um período
 * com **dois `DatePicker` independentes**, que não sabem um do outro — sem
 * faixa realçada entre as pontas, e sem impedir um fim antes do início.
 */

type DatePickerSize = "sm" | "md" | "lg" | "xl"

type DatePickerBaseProps = {
  id?: string
  "aria-labelledby"?: string
  "aria-invalid"?: boolean
  disabled?: boolean
  className?: string
  placeholder?: string
  /** A altura, na escada do sistema. `lg` (36) é a do `Input`. */
  size?: DatePickerSize
  /** Rótulo curto em pt-BR para linha apertada (dd/mm/aaaa). */
  displayStyle?: "default" | "numeric"
  /** Um × no campo quando há valor. */
  clearable?: boolean
  /** Limites da grade, repassados ao `Calendar`. */
  min?: Date
  max?: Date
  popoverClassName?: string
}

type DatePickerSingleProps = DatePickerBaseProps & {
  mode?: "single"
  value?: Date
  onChange: (date: Date | undefined) => void
}

type DatePickerRangeProps = DatePickerBaseProps & {
  mode: "range"
  value?: DateRange
  onChange: (range: DateRange | undefined) => void
}

export type DatePickerProps = DatePickerSingleProps | DatePickerRangeProps

/**
 * A formatação sai dos helpers, e não de um `toLocaleDateString` local.
 *
 * Havia dois neste arquivo — a regra **I** do auditor com
 * `@/lib/transaction-date` ao lado. Os helpers recebem `YYYY-MM-DD`, então a
 * `Date` passa por `localYmdFromDate` primeiro; é o caminho que evita o pulo de
 * fuso que converter para ISO produz.
 */
function rotularData(
  value: Date,
  displayStyle: DatePickerBaseProps["displayStyle"]
) {
  const ymd = localYmdFromDate(value)
  return displayStyle === "numeric"
    ? formatTransactionDmyPtBr(ymd)
    : formatDateLongPtBr(ymd)
}

function rotularIntervalo(
  value: DateRange,
  displayStyle: DatePickerBaseProps["displayStyle"]
) {
  if (!value.from) return null
  const inicio = rotularData(value.from, displayStyle)
  if (!value.to) return inicio
  return `${inicio} – ${rotularData(value.to, displayStyle)}`
}

export function DatePicker(props: DatePickerProps) {
  const {
    id,
    "aria-labelledby": ariaLabelledBy,
    "aria-invalid": ariaInvalid,
    disabled,
    className,
    placeholder,
    size = "lg",
    displayStyle = "default",
    clearable = false,
    min,
    max,
    popoverClassName,
  } = props

  const [open, setOpen] = React.useState(false)
  const isMobile = useIsMobile()

  // O estreitamento tem de ser por `props.mode` literal em cada ponto de uso:
  // um booleano derivado (`const isRange = props.mode === "range"`) não estreita
  // a união, e `props.value` continuaria sendo `Date | DateRange | undefined`.
  // É a mesma mecânica que o `multiple` do `Combobox` documenta.
  const rotulo =
    props.mode === "range"
      ? props.value
        ? rotularIntervalo(props.value, displayStyle)
        : null
      : props.value
        ? rotularData(props.value, displayStyle)
        : null

  const vazio =
    placeholder ??
    (props.mode === "range" ? "Selecione o período" : "Selecione a data")
  const temValor = rotulo !== null

  // Os dois ramos são idênticos no corpo e diferentes no tipo: `onChange` é
  // `(Date | undefined) => void` num lado e `(DateRange | undefined) => void` no
  // outro, e a união dos dois não aceita um argumento só. O `if` é o
  // estreitamento, não repetição.
  const limpar = () => {
    if (props.mode === "range") props.onChange(undefined)
    else props.onChange(undefined)
  }

  return (
    // A raiz sabe do telefone. Sem `modal` ali, rolar a grade arrasta a folha
    // que contém o formulário, e o dedo não distingue as duas — é a mesma
    // decisão que o `FormPickerPopover` já traz de fábrica.
    <Popover modal={isMobile} open={open} onOpenChange={setOpen}>
      {/* O campo é a âncora, e não o gatilho: sem isto o popover sairia com a
          largura do gatilho e o × ficaria fora da caixa que ele deve habitar. */}
      <PopoverAnchor asChild>
        <div className={cn("relative w-full min-w-0", className)}>
          <PopoverTrigger
            id={id}
            type="button"
            disabled={disabled}
            aria-labelledby={ariaLabelledBy}
            aria-invalid={ariaInvalid}
            data-slot="date-picker-trigger"
            data-size={size}
            data-empty={temValor ? undefined : "true"}
            className={cn(
              fieldSurfaceClassName,
              fieldFocusRingClassName,
              fieldInvalidClassName,
              fieldDisabledClassName,
              fieldTriggerHoverClassName,
              fieldTriggerSizeClassName,
              "flex w-full min-w-0 items-center gap-2 px-3 text-left font-normal",
              // O ícone media `size-3.5` com um `mr-2` por cima do `gap-1.5` do
              // botão — 14px de distância e um ícone fora da regra `size-4`. O
              // `gap` do campo agora é o único que decide.
              "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
              // Recuo para o ×: quem recua é o **rótulo**, não a caixa — recuar
              // o campo empurraria o ícone para dentro. Lição do `Combobox`.
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
          </PopoverTrigger>

          {/* Irmão do gatilho, e não filho: `button` não aninha em `button`. */}
          {clearable && temValor && !disabled ? (
            <Button
              type="button"
              variant="tertiary"
              size="icon-xs"
              aria-label="Limpar data"
              data-slot="date-picker-clear"
              className="absolute inset-y-0 end-1.5 my-auto text-muted-foreground"
              onClick={limpar}
            >
              <XMarkIcon aria-hidden />
            </Button>
          ) : null}
        </div>
      </PopoverAnchor>

      <PopoverContent
        padding="none"
        className={cn("w-auto", popoverClassName)}
        align="start"
      >
        {/* `captionLayout="dropdown"` só aqui, e não no `Calendar`: num app de
            finanças se lança transação de meses atrás, e paginar mês a mês é a
            fricção. Um calendário embutido numa página não tem essa pressa. */}
        {props.mode === "range" ? (
          <Calendar
            mode="range"
            captionLayout="dropdown"
            selected={props.value}
            onSelect={(r) => props.onChange(r)}
            defaultMonth={props.value?.from}
            {...limitesNavegacao(min, max)}
            disabled={limitesDesabilitados(min, max)}
          />
        ) : (
          <Calendar
            mode="single"
            captionLayout="dropdown"
            selected={props.value}
            onSelect={(d) => {
              props.onChange(d)
              setOpen(false)
            }}
            defaultMonth={props.value}
            {...limitesNavegacao(min, max)}
            disabled={limitesDesabilitados(min, max)}
          />
        )}
      </PopoverContent>
    </Popover>
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
 * conta futura. Quem precisar de mais passa `min` / `max` — e aí os limites são
 * dele, não deste padrão.
 */
const ALCANCE_PADRAO_ANOS = 5

function limitesNavegacao(min?: Date, max?: Date) {
  const hoje = new Date()
  return {
    startMonth: min ?? new Date(hoje.getFullYear() - ALCANCE_PADRAO_ANOS, 0, 1),
    endMonth: max ?? new Date(hoje.getFullYear() + ALCANCE_PADRAO_ANOS, 11, 31),
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
