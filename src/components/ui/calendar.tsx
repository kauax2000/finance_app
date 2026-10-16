"use client"

import * as React from "react"
import {
  DayPicker,
  Nav as DayPickerNav,
  getDefaultClassNames,
  useDayPicker,
  type DateRange,
  type DayButton,
  type Matcher,
  type NavProps,
} from "react-day-picker"

import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

import { cn } from "@/lib/utils"
import {
  formatDateLongPtBr,
  formatMonthShortPtBr,
  localYmdFromDate,
} from "@/lib/transaction-date"
import { Button } from "@/components/ui/button"
import { MoneyDisplay } from "@/components/ui/money-display"
import { Separator } from "@/components/ui/separator"
import { Skeleton, SkeletonGroup } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/16/solid"
import { useIsMobile } from "@/hooks/use-mobile"
/**
 * A grade de um mês. O `locale` tem padrão (`ptBR`) porque o app tem um só.
 *
 * `size` nomeia o piso da célula (`sm` 28, `md` 32, `lg` 36), não a caixa
 * final: a grade é elástica (`week` é `flex`, `day` é `w-full aspect-square`),
 * então nenhum degrau descreve a caixa, e por isso o botão de dia não carimba
 * `data-size`. Em ponteiro grosso o piso salta a 44px (sete células cabem em
 * 320px).
 */
/**
 * Os rótulos de acessibilidade, em português: o `locale` do `date-fns` traduz
 * só nomes (meses, dias), e as frases conectivas do `react-day-picker`
 * ("Go to the Previous Month", "Today, …", "…, selected" em cada uma das 42
 * células) são strings em inglês do pacote.
 */
const ROTULOS_PT_BR = {
  labelPrevious: () => "Ir para o mês anterior",
  labelNext: () => "Ir para o próximo mês",
  labelMonthDropdown: () => "Escolher o mês",
  labelYearDropdown: () => "Escolher o ano",
  labelWeekNumber: (n: number) => `Semana ${n}`,
  labelWeekNumberHeader: () => "Número da semana",
  labelDayButton: (
    date: Date,
    modifiers: { today?: boolean; selected?: boolean }
  ) => {
    const data = formatDateLongPtBr(localYmdFromDate(date))
    const partes = [modifiers.today ? `Hoje, ${data}` : data]
    if (modifiers.selected) partes.push("selecionado")
    return partes.join(", ")
  },
} satisfies Partial<React.ComponentProps<typeof DayPicker>["labels"]>

/**
 * `markers`: pontos sob o número do dia, por tom (até três), com legenda e
 * rótulos somados ao nome do dia. `variant="agenda"`: a célula grande com o
 * conteúdo do dia (`renderDay`) sob o número. `showToday`: o "Hoje" que volta
 * ao mês atual. `presets`: atalhos ao lado de um intervalo, e dois meses lado a
 * lado no desktop.
 */

type CalendarMarkerTone =
  | "default"
  | "primary"
  | "info"
  | "success"
  | "warning"
  | "destructive"
  | "income"
  | "expense"

/** Um tipo de marcador: as datas, o tom do ponto e o nome (legenda e leitor de tela). */
type CalendarMarker = {
  dates: Matcher | Matcher[]
  tone: CalendarMarkerTone
  label: string
}

/** O ponto de cada tom — os tokens semânticos, nunca a paleta crua. */
const MARCADOR_TOM: Record<CalendarMarkerTone, string> = {
  default: "bg-muted-foreground",
  // A tinta da marca — o traço fino sobre o fundo é sempre o acento.
  primary: "bg-primary-accent",
  info: "bg-info",
  success: "bg-success",
  warning: "bg-warning",
  destructive: "bg-destructive",
  income: "bg-income",
  expense: "bg-expense",
}

/** Um atalho: um intervalo (`range`) ou um dia (`date`), ambos calculáveis na hora do clique. */
type CalendarPreset =
  | { label: string; range: DateRange | (() => DateRange) }
  | { label: string; date: Date | (() => Date) }

type CalendarExtras = {
  markers: CalendarMarker[]
  agenda: boolean
  renderDay?: (date: Date) => React.ReactNode
  showToday: boolean
  presets?: CalendarPreset[]
  irPara: (mes: Date) => void
  escolher: (valor: Date | DateRange) => void
  modo?: string
  selecionado?: unknown
  listEmpty?: React.ReactNode
  listDays?: (date: Date) => boolean
  semNavegacao: boolean
}

const CalendarExtrasContext = React.createContext<CalendarExtras>({
  markers: [],
  agenda: false,
  showToday: false,
  semNavegacao: false,
  irPara: () => {},
  escolher: () => {},
})

const CALENDAR_CELL: Record<CalendarSize, string> = {
  sm: "[--cell-size:--spacing(7)]",
  md: "[--cell-size:--spacing(8)]",
  lg: "[--cell-size:--spacing(9)]",
}

type CalendarSize = "sm" | "md" | "lg"

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  buttonVariant = "tertiary",
  size = "md",
  locale = ptBR,
  formatters,
  labels,
  components,
  markers = [],
  variant = "default",
  renderDay,
  showToday = false,
  presets,
  stretch = false,
  numberOfMonths,
  modifiers,
  modifiersClassNames,
  listEmpty,
  listDays,
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>["variant"]
  size?: CalendarSize
  /** Pontos sob o número do dia, por tom — até três por dia. */
  markers?: CalendarMarker[]
  /** `agenda` é a célula grande, com o conteúdo do dia sob o número. */
  variant?: "default" | "agenda"
  /**
   * Com `agenda`: o que vai na célula sob o número, de preferência um
   * `CalendarEvents`. `null` é dia vazio, que na lista estreita não aparece.
   */
  renderDay?: (date: Date) => React.ReactNode
  /** Com `agenda`, estreita: o texto da lista quando o mês não tem nada. */
  listEmpty?: React.ReactNode
  /** Com `agenda`, estreita: os dias que entram na lista, entre os que têm conteúdo; a grade não muda. */
  listDays?: (date: Date) => boolean
  /** O "Hoje" que volta ao mês atual. */
  showToday?: boolean
  /** Atalhos ao lado da grade: intervalos em `mode="range"`, dias em `single`. */
  presets?: CalendarPreset[]
  /** A grade ocupa a largura de quem a contém e as células crescem com ela (padrão `w-fit`; a agenda já estica). */
  stretch?: boolean
}) {
  const defaultClassNames = getDefaultClassNames()
  const agenda = variant === "agenda"
  const isMobile = useIsMobile()

  // O mês só é controlado aqui quando alguém de fora da grade o move (o "Hoje"
  // e os atalhos); sem eles o `DayPicker` segue dono.
  const controlaMes = showToday || presets != null
  const [mesInterno, setMesInterno] = React.useState<Date>(
    () => props.month ?? props.defaultMonth ?? new Date()
  )
  const irPara = React.useCallback(
    (mes: Date) => {
      setMesInterno(mes)
      props.onMonthChange?.(mes)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [props.onMonthChange]
  )
  const onSelect = (props as { onSelect?: (v: unknown) => void }).onSelect
  const escolher = React.useCallback(
    (valor: Date | DateRange) => onSelect?.(valor),
    [onSelect]
  )

  // Os marcadores viram modificadores do `react-day-picker` (`marker-0`,
  // `marker-1`…) e a célula lê quais estão ligados nela.
  const modificadores = React.useMemo(() => {
    const m: Record<string, Matcher | Matcher[] | undefined> = { ...modifiers }
    markers.forEach((mk, i) => {
      m[`marker-${i}`] = mk.dates
    })
    // Na agenda o fim de semana tem um véu na coluna.
    if (agenda) m.fimDeSemana = { dayOfWeek: [0, 6] }
    return m
  }, [markers, modifiers, agenda])

  const extras = React.useMemo<CalendarExtras>(
    () => ({
      markers,
      agenda,
      renderDay,
      showToday,
      presets,
      irPara,
      escolher,
      modo: props.mode,
      selecionado: (props as { selected?: unknown }).selected,
      listEmpty,
      listDays,
      semNavegacao: props.hideNavigation ?? false,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [markers, agenda, renderDay, showToday, presets, irPara, escolher, props.mode, (props as { selected?: unknown }).selected, listEmpty, listDays, props.hideNavigation]
  )

  // O nome do dia soma os marcadores: "5 de março, assinatura, parcela".
  const rotuloDia = React.useCallback(
    (date: Date, mods: Record<string, boolean | undefined>) => {
      const base = (labels?.labelDayButton ?? ROTULOS_PT_BR.labelDayButton)(
        date,
        mods as never
      )
      const nomes = markers.filter((_, i) => mods[`marker-${i}`]).map((mk) => mk.label)
      return nomes.length ? `${base}, ${nomes.join(", ")}` : base
    },
    [labels, markers]
  )

  // Um intervalo com atalhos ganha dois meses lado a lado no desktop.
  const meses = numberOfMonths ?? (presets && props.mode === "range" && !isMobile ? 2 : 1)

  // Um objeto novo a cada render remontaria toda a subárvore e o foco caía
  // depois de "próximo mês". Os componentes não dependem de nada além da
  // variante das setas.
  const componentes = React.useMemo<
    React.ComponentProps<typeof DayPicker>["components"]
  >(
    () => ({
      Root: ({ className, rootRef, children, ...props }) => {
        return (
          <div
            data-slot="calendar"
            ref={rootRef}
            className={cn(className)}
            {...props}
          >
            <CalendarShell>{children}</CalendarShell>
          </div>
        )
      },
      Chevron: ({ className, orientation, ...props }) => {
        if (orientation === "left") {
          return (
            <ChevronLeftIcon className={cn("size-4", className)} {...props} />
          )
        }

        if (orientation === "right") {
          return (
            <ChevronRightIcon className={cn("size-4", className)} {...props} />
          )
        }

        return (
          <ChevronDownIcon className={cn("size-4", className)} {...props} />
        )
      },
      Nav: (props) => <CalendarNav {...props} />,
      DayButton: ({ ...props }) => <CalendarDayButton {...props} />,
      Day: ({ day, modifiers, ...props }) => (
        <CalendarDay day={day} modifiers={modifiers as Record<string, boolean>} {...props} />
      ),
      Dropdown: ({ options, value, onChange, disabled, "aria-label": rotulo }) => (
        <CalendarDropdown
          options={options}
          value={value}
          onChange={onChange}
          disabled={disabled}
          aria-label={rotulo}
        />
      ),
      WeekNumber: ({ children, ...props }) => {
        return (
          <td {...props}>
            <div className="flex size-(--cell-size) items-center justify-center text-center">
              {children}
            </div>
          </td>
        )
      },
      // As setas de mês são o `Button` do sistema. O `react-day-picker` não
      // entrega `disabled`, por isso o `aria-disabled:opacity-50` continua
      // necessário. `data-size` sai porque `size-(--cell-size)` anula o degrau.
      PreviousMonthButton: ({ className, ...props }) => (
        <Button
          variant={buttonVariant}
          size="icon-md"
          data-size={undefined}
          className={cn(
            "size-(--cell-size) p-0 select-none aria-disabled:opacity-50",
            className
          )}
          {...props}
        />
      ),
      NextMonthButton: ({ className, ...props }) => (
        <Button
          variant={buttonVariant}
          size="icon-md"
          data-size={undefined}
          className={cn(
            "size-(--cell-size) p-0 select-none aria-disabled:opacity-50",
            className
          )}
          {...props}
        />
      ),
      ...components,
    }),
    [buttonVariant, components]
  )

  return (
    <CalendarExtrasContext.Provider value={extras}>
    <DayPicker
      // O movimento é a `@utility calendar-month-motion`. Antes de `{...props}`: quem chama pode desligar.
      animate={!agenda}
      showOutsideDays={showOutsideDays}
      numberOfMonths={meses}
      modifiers={modificadores}
      modifiersClassNames={
        agenda
          ? { fimDeSemana: AGENDA_FIM_DE_SEMANA, ...modifiersClassNames }
          : modifiersClassNames
      }
      {...(controlaMes
        ? { month: props.month ?? mesInterno, onMonthChange: irPara }
        : {})}
      // A grade inteira sai de `--cell-size`; em ponteiro grosso vai de 28px
      // para 44px, o alvo de dedo mínimo.
      className={cn(
        // Transparente onde quem contém já pinta (cartão, popover e a gaveta,
        // que é vidro).
        "group/calendar bg-background p-2 [--cell-radius:9999px] in-data-[slot=card-content]:bg-transparent in-data-[slot=popover-content]:bg-transparent in-data-[surface=drawer]:bg-transparent",
        CALENDAR_CELL[size],
        // A troca de mês anima, fora da agenda (ver `calendar-month-motion`).
        !agenda && "calendar-month-motion",
        // A agenda ocupa a largura de quem a contém e não pinta (quem pinta é
        // a moldura `month_grid`); é o contêiner da virada para lista.
        agenda && "@container/calendar bg-transparent p-0",
        // O toque vence a escada e vem depois dela: 44px é piso de alvo, não um degrau.
        "pointer-coarse:[--cell-size:--spacing(11)]",
        String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
        String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
        className
      )}
      captionLayout={captionLayout}
      locale={locale}
      formatters={{
        formatMonthDropdown: (date) => formatMonthShortPtBr(date),
        ...formatters,
      }}
      labels={{ ...ROTULOS_PT_BR, ...labels, labelDayButton: rotuloDia as never, labelGridcell: rotuloDia as never }}
      classNames={{
        root: cn(agenda || stretch ? "w-full" : "w-fit", defaultClassNames.root),
        months: cn(
          "relative flex flex-col gap-4 md:flex-row",
          defaultClassNames.months
        ),
        month: cn("flex w-full flex-col gap-4", defaultClassNames.month),
        // A faixa de navegação é `absolute inset-x-0 w-full` e cobriria o meio
        // do cabeçalho, onde vivem os seletores de mês e ano, engolindo o
        // clique. Ela não recebe ponteiro; só os dois botões recebem.
        nav: cn(
          "pointer-events-none absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1 [&>button]:pointer-events-auto",
          // Acima da legenda, sempre: uma legenda animada (a subida da abertura
          // do `DatePicker`, a troca de mês) pinta como posicionada e cobria as
          // setas. Empilhamento local, número cru.
          "z-10",
          agenda && "justify-end",
          defaultClassNames.nav
        ),
        // Só a classe da biblioteca: o seletor `rtl:**:[.rdp-button_previous>svg]`
        // depende dela. A cromagem é do `Button`, em `components` abaixo.
        button_previous: defaultClassNames.button_previous,
        button_next: defaultClassNames.button_next,
        month_caption: cn(
          "flex h-(--cell-size) w-full items-center justify-center px-(--cell-size)",
          // Na agenda o mês é o título da tela, à esquerda; a navegação fica junta à direita.
          agenda && "justify-start ps-1 pe-0",
          defaultClassNames.month_caption
        ),
        dropdowns: cn(
          "flex h-(--cell-size) w-full items-center justify-center gap-1.5 text-sm font-medium",
          defaultClassNames.dropdowns
        ),
        // O `relative` é necessário: põe o seletor no contexto de empilhamento
        // acima do `<nav>` absoluto que atravessa o cabeçalho; sem ele o
        // seletor caía para trás da faixa e parava de responder ao clique.
        dropdown_root: cn("relative z-10", defaultClassNames.dropdown_root),
        // `dropdown` continua sem classe: ele vestia o `<select>` nativo
        // `absolute inset-0 opacity-0` que o `Dropdown` do sistema substituiu.
        dropdown: cn(defaultClassNames.dropdown),
        // O `caption_label` só se aplica ao layout `label`.
        caption_label: cn(
          "text-sm font-medium select-none",
          agenda && "inline-block text-base font-semibold first-letter:uppercase",
          defaultClassNames.caption_label
        ),
        table: "w-full border-collapse",
        // A grade de fios: na agenda a tabela é uma moldura só (canto da
        // superfície, fio de 1px, cartão) e as células se separam por fios. Como
        // item de flex, `thead` e `tbody` viram blocos sozinhos. Abaixo de 40rem
        // da própria agenda ela some e a lista do `CalendarShell` aparece.
        month_grid: cn(
          agenda &&
            "flex w-full flex-col overflow-hidden rounded-surface border border-border bg-card bg-clip-padding @max-[40rem]/calendar:hidden",
          defaultClassNames.month_grid
        ),
        weekdays: cn("flex", agenda && "border-b border-border", defaultClassNames.weekdays),
        weekday: cn(
          "flex-1 rounded-(--cell-radius) text-control-sm font-normal text-muted-foreground select-none",
          // Na agenda, o cabeçalho é a régua da coluna: versalete pequeno.
          agenda && "py-2 text-2xs font-medium tracking-wide uppercase",
          defaultClassNames.weekday
        ),
        week: cn(
          agenda ? "flex w-full [&:last-child>td]:border-b-0" : "mt-2 flex w-full",
          defaultClassNames.week
        ),
        week_number_header: cn(
          "w-(--cell-size) select-none",
          defaultClassNames.week_number_header
        ),
        week_number: cn(
          "text-control-sm text-muted-foreground select-none",
          defaultClassNames.week_number
        ),
        day: cn(
          "group/day relative aspect-square h-full w-full rounded-(--cell-radius) p-0 text-center select-none [&:last-child[data-selected=true]_button]:rounded-r-(--cell-radius)",
          // Na agenda a célula não tem caixa: o fio à direita e embaixo, que a
          // última coluna e a última semana não desenham. As sete colunas têm a
          // mesma largura (`w-0 flex-1`), senão uma ficha longa alargava a
          // coluna e a régua desalinhava.
          agenda && "aspect-auto w-0 min-w-0 flex-1 rounded-none border-e border-b border-border/60 last:border-e-0",
          props.showWeekNumber
            ? "[&:nth-child(2)[data-selected=true]_button]:rounded-l-(--cell-radius)"
            : "[&:first-child[data-selected=true]_button]:rounded-l-(--cell-radius)",
          defaultClassNames.day
        ),
        // A ponte entre a ponta e o miolo é metade da célula (cobre o raio da
        // ponta em qualquer degrau; `after:w-4` fixo não acompanhava a variável).
        range_start: cn(
          "relative isolate z-0 rounded-l-(--cell-radius) bg-muted after:absolute after:inset-y-0 after:right-0 after:w-[calc(var(--cell-size)/2)] after:bg-muted",
          defaultClassNames.range_start
        ),
        range_middle: cn("rounded-none", defaultClassNames.range_middle),
        range_end: cn(
          "relative isolate z-0 rounded-r-(--cell-radius) bg-muted after:absolute after:inset-y-0 after:left-0 after:w-[calc(var(--cell-size)/2)] after:bg-muted",
          defaultClassNames.range_end
        ),
        today: cn(
          // Na agenda o hoje é o número na pastilha (`DiaConteudo`), não a célula acesa.
          agenda
            ? "text-foreground"
            : "rounded-(--cell-radius) bg-muted text-foreground data-[selected=true]:rounded-none",
          defaultClassNames.today
        ),
        outside: cn(
          "text-muted-foreground aria-selected:text-muted-foreground",
          // O mês vizinho recua: um véu mais fundo que o do fim de semana.
          agenda && "bg-muted/30",
          defaultClassNames.outside
        ),
        disabled: cn(
          "text-muted-foreground opacity-50",
          defaultClassNames.disabled
        ),
        hidden: cn("invisible", defaultClassNames.hidden),
        ...classNames,
      }}
      components={componentes}
      {...props}
    />
    </CalendarExtrasContext.Provider>
  )
}

/**
 * O que a raiz acrescenta em volta da grade: os atalhos do intervalo, o "Hoje"
 * e a legenda dos marcadores. Lê o contexto e não as props, para os
 * `components` do `DayPicker` continuarem os mesmos entre renders (ver
 * `componentes`).
 */
/** Meia-noite de hoje, na hora do clique. */
function hojeMeiaNoite() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

/** O "Hoje": volta ao mês atual e, na escolha única, marca o dia. */
function useIrParaHoje() {
  const { irPara, escolher, modo } = React.useContext(CalendarExtrasContext)
  return () => {
    const d = hojeMeiaNoite()
    irPara(d)
    if (modo === "single") escolher(d)
  }
}

/** O atalho: a pílula contornada, na grade do telefone e na coluna do desktop (40 no dedo). */
const ATALHO_CLASSES = "w-full justify-center font-normal pointer-coarse:h-10"

function CalendarShell({ children }: { children: React.ReactNode }) {
  const { presets, showToday, markers, agenda, semNavegacao, irPara, escolher, modo, selecionado } =
    React.useContext(CalendarExtrasContext)
  const irParaHoje = useIrParaHoje()
  const intervaloAtual = selecionado as DateRange | undefined
  // Os atalhos têm contorno e o escolhido é a tecla preenchida (`primary`, a
  // mesma cor das pontas do intervalo, para o atalho e o que ele marca lerem
  // juntos). Soltos, só o escolhido parecia botão; com `secondary` ele ficava a
  // um tom dos contornados.
  const atalhoSolto = "outline"
  const atalhoEscolhido = "primary"

  const grade = (
    <div className="flex min-w-0 flex-col">
      {children}
      {agenda ? <CalendarAgendaList /> : null}
      {markers.length > 0 ? (
        // A legenda é uma faixa própria, separada da grade por um fio suave,
        // com respiro de 16px entre itens. O ponto tem o dobro do da célula
        // (aqui é a chave, lá é a marca).
        <div data-slot="calendar-legend" className="mt-3">
          <Separator tone="soft" />
          <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 px-1 pt-3 pb-1 text-xs text-muted-foreground">
            {markers.map((mk) => (
              <li key={mk.label} className="inline-flex items-center gap-1.5 whitespace-nowrap">
                <span aria-hidden className={cn("size-2 shrink-0 rounded-full", MARCADOR_TOM[mk.tone])} />
                {mk.label}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {/* Na agenda o "Hoje" mora no cabeçalho (`CalendarNav`) — menos com
          `hideNavigation`, quando o cabeçalho não monta e ele volta para cá. */}
      {showToday && (!agenda || semNavegacao) ? (
        <div className="mt-2 flex justify-center">
          <Button type="button" variant="tertiary" size="xs" onClick={irParaHoje}>
            hoje
          </Button>
        </div>
      ) : null}
    </div>
  )

  if (!presets?.length) return grade

  return (
    // A grade 2 × 2 vira coluna em `md` (768), o corte do `useIsMobile` que decide a gaveta.
    <div className="flex flex-col gap-3 md:flex-row">
      <ul
        data-slot="calendar-presets"
        aria-label={modo === "range" ? "Atalhos de período" : "Atalhos de data"}
        // No telefone os atalhos são uma grade 2 × 2: numa fileira que rolava
        // de lado "Mês passado" ficava fora da tela.
        className="grid grid-cols-2 gap-1 md:flex md:w-36 md:shrink-0 md:flex-col md:gap-1.5 md:border-e md:border-border md:pe-2"
      >
        {/* No dedo cada atalho sobe a 40, a régua do controle em linha. */}
        {presets.map((p) => {
          if ("date" in p) {
            const dia = typeof p.date === "function" ? p.date() : p.date
            const ativo =
              (selecionado as Date | undefined)?.toDateString?.() ===
              dia.toDateString()
            return (
              <li key={p.label} className="shrink-0">
                <Button
                  type="button"
                  variant={ativo ? atalhoEscolhido : atalhoSolto}
                  size="sm"
                  aria-pressed={ativo}
                  className={ATALHO_CLASSES}
                  onClick={() => {
                    const d = typeof p.date === "function" ? p.date() : p.date
                    irPara(d)
                    escolher(d)
                  }}
                >
                  {p.label}
                </Button>
              </li>
            )
          }
          const alvo = typeof p.range === "function" ? p.range() : p.range
          const ativo =
            intervaloAtual?.from?.toDateString() === alvo.from?.toDateString() &&
            intervaloAtual?.to?.toDateString() === alvo.to?.toDateString()
          return (
            <li key={p.label} className="shrink-0">
              <Button
                type="button"
                variant={ativo ? atalhoEscolhido : atalhoSolto}
                size="sm"
                aria-pressed={ativo}
                className={ATALHO_CLASSES}
                onClick={() => {
                  const r = typeof p.range === "function" ? p.range() : p.range
                  escolher(r)
                  if (r.from) irPara(r.from)
                }}
              >
                {p.label}
              </Button>
            </li>
          )
        })}
      </ul>
      {grade}
    </div>
  )
}

/**
 * A faixa de navegação. Fora da agenda é a do `react-day-picker`, intacta; na
 * agenda com `showToday` o "Hoje" entra antes das setas, com o mês à esquerda.
 */
function CalendarNav({ className, ...props }: NavProps) {
  const { agenda, showToday } = React.useContext(CalendarExtrasContext)
  const irParaHoje = useIrParaHoje()
  if (!(agenda && showToday)) return <DayPickerNav className={className} {...props} />
  return (
    <div data-slot="calendar-nav" className={className}>
      <Button
        type="button"
        variant="tertiary"
        size="sm"
        className="pointer-events-auto"
        onClick={irParaHoje}
      >
        hoje
      </Button>
      <DayPickerNav {...props} className="flex items-center gap-1 [&>button]:pointer-events-auto" />
    </div>
  )
}

/** A forma do `CalendarEvent`: ficha na grade, linha na lista. */
const CalendarLayoutContext = React.createContext<"grid" | "list">("grid")

/**
 * A agenda estreita: abaixo de 40rem da própria largura a grade some e entra a
 * lista do mês, só com os dias com conteúdo. É container query, não a janela.
 */
function CalendarAgendaList() {
  const { renderDay, listEmpty, listDays } = React.useContext(CalendarExtrasContext)
  const { months } = useDayPicker()
  const mes = months[0]
  const hoje = localYmdFromDate(new Date())
  const dias = (mes?.weeks.flatMap((w) => w.days) ?? [])
    .filter((d) => !d.outside && (listDays?.(d.date) ?? true))
    .map((d) => ({ date: d.date, conteudo: renderDay?.(d.date) }))
    .filter((d) => d.conteudo != null && d.conteudo !== false)

  return (
    <div
      data-slot="calendar-agenda-list"
      className="hidden flex-col gap-1 rounded-surface border border-border bg-card bg-clip-padding p-1.5 @max-[40rem]/calendar:flex [--radius-inset:calc(--spacing(1.5)+1px)] [--radius-parent:var(--radius-surface)]"
    >
      {dias.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          {listEmpty ?? "Nenhum evento neste mês"}
        </p>
      ) : (
        dias.map(({ date, conteudo }) => {
          const ymd = localYmdFromDate(date)
          return (
            // Um grupo e não uma `section`: com nome a `section` vira região, e
            // um mês cheio punha 25 regiões na navegação do leitor de tela.
            <div
              key={ymd}
              role="group"
              data-day={ymd}
              aria-label={formatDateLongPtBr(ymd)}
              className="flex flex-col pb-1"
            >
              <p className="px-3 pt-2 pb-1 text-2xs font-medium tracking-wide text-muted-foreground uppercase">
                {ymd === hoje ? <span className="text-foreground">Hoje · </span> : null}
                {format(date, "EEE, d", { locale: ptBR })}
              </p>
              <CalendarLayoutContext value="list">{conteudo}</CalendarLayoutContext>
            </div>
          )
        })
      )}
    </div>
  )
}

/**
 * O seletor de mês e de ano do design system, no lugar do `<select>` nativo
 * `absolute inset-0 opacity-0` do `react-day-picker` (cujo painel é do sistema
 * operacional): o `Select`, com `field-classes` no gatilho.
 *
 * A ponte: o `onChange` do `react-day-picker` lê só `e.target.value`, e o
 * `Select` do Radix entrega `onValueChange(valor)`; o `as` sobre um objeto
 * incompleto é proposital. O gatilho é compacto e não `sm`: a fileira de dois
 * seletores vive num `month_caption` que já reserva `--cell-size` de cada lado
 * e, com o recuo padrão, a raiz `w-fit` cresceria para caber a legenda.
 */
function CalendarDropdown({
  options,
  value,
  onChange,
  disabled,
  "aria-label": rotulo,
}: {
  options?: { value: number; label: string; disabled: boolean }[]
  value?: string | number | readonly string[]
  onChange?: React.ChangeEventHandler<HTMLSelectElement>
  disabled?: boolean
  "aria-label"?: string
}) {
  return (
    <Select
      value={value != null ? String(value) : undefined}
      disabled={disabled}
      onValueChange={(v) =>
        onChange?.({
          target: { value: v },
        } as React.ChangeEvent<HTMLSelectElement>)
      }
    >
      <SelectTrigger
        size="sm"
        aria-label={rotulo}
        // A linha, e não a cápsula: o degrau `row` da escala, com o realce aceso.
        className="w-fit gap-1 rounded-row border-transparent bg-transparent px-2 font-medium hover:bg-foreground/9 active:bg-foreground/9"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="min-w-(--radix-select-trigger-width)">
        {options?.map((o) => (
          <SelectItem
            key={o.value}
            value={String(o.value)}
            disabled={o.disabled}
          >
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

/**
 * A célula da agenda: alta, o número no canto e o conteúdo embaixo, sem caixa
 * (quem separa os dias são os fios do `td`). Só realça, a 5% da tinta do texto.
 * O foco é um anel interno, porque a moldura recorta o de fora nas bordas.
 */
const AGENDA_CELULA =
  "aspect-auto min-h-24 w-full items-stretch justify-start gap-1 rounded-none border-0 bg-transparent p-2 text-left [--button-hover-fill:color-mix(in_oklab,var(--foreground)_5%,transparent)] focus-visible:ring-0 focus-visible:inset-ring-2 focus-visible:inset-ring-ring/45 group-data-[focused=true]/day:ring-0 group-data-[focused=true]/day:inset-ring-2 group-data-[focused=true]/day:inset-ring-ring/45"

/**
 * O dia escolhido na agenda não acende em `primary` (a tecla preta apagaria o
 * conteúdo de uma célula de 96px): fica `muted` com um anel interno e o número
 * na tinta do texto. Vem depois no `cn` e vence as regras do calendário
 * pequeno, inclusive a camada do realce, que aqui volta aos 5%.
 */
const AGENDA_SELECIONADO =
  "data-[selected-single=true]:[--button-hover-fill:color-mix(in_oklab,var(--foreground)_5%,transparent)] data-[selected-single=true]:bg-muted data-[selected-single=true]:text-foreground data-[selected-single=true]:inset-ring-2 data-[selected-single=true]:inset-ring-ring/45 data-[selected-single=true]:hover:bg-muted data-[selected-single=true]:active:bg-muted data-[selected-single=true]:hover:text-foreground data-[selected-single=true]:active:text-foreground dark:data-[selected-single=true]:hover:text-foreground dark:data-[selected-single=true]:active:text-foreground"

/** O véu da coluna do fim de semana, mais leve que o do mês vizinho. */
const AGENDA_FIM_DE_SEMANA = "[&:not([data-outside])]:bg-muted/15"

/** A superfície da ficha de evento, por tom — os `-muted` do sistema. */
const EVENTO_TOM: Record<CalendarMarkerTone, string> = {
  default: "bg-muted text-muted-foreground",
  primary: "bg-primary-muted text-primary-muted-foreground",
  info: "bg-info-muted text-info-muted-foreground",
  success: "bg-success-muted text-success-muted-foreground",
  warning: "bg-warning-muted text-warning-muted-foreground",
  destructive: "bg-destructive-muted text-destructive-muted-foreground",
  income: "bg-income-muted text-income-muted-foreground",
  expense: "bg-expense-muted text-expense-muted-foreground",
}

/**
 * O miolo do dia, igual no botão e no dia estático: na agenda, o número (hoje
 * numa pastilha) e o conteúdo; fora dela, o número e os pontos dos marcadores.
 */
function DiaConteudo({
  day,
  modifiers,
  contentId,
  children,
}: {
  day: { date: Date }
  modifiers: Record<string, boolean>
  /** O `id` do conteúdo, que o botão do dia aponta em `aria-describedby`. */
  contentId?: string
  children: React.ReactNode
}) {
  const { markers, agenda, renderDay } = React.useContext(CalendarExtrasContext)
  if (agenda) {
    return (
      <>
        <span
          data-slot="calendar-day-number"
          className={cn(
            "inline-flex size-6 items-center justify-center self-start rounded-full text-xs font-semibold tabular-nums",
            (modifiers.outside || modifiers.fimDeSemana) && "text-muted-foreground",
            modifiers.outside && "font-normal",
            modifiers.today && "bg-primary text-primary-foreground"
          )}
        >
          {children}
        </span>
        <span id={contentId} data-slot="calendar-day-content" className="w-full min-w-0 flex-1">
          <CalendarLayoutContext value="grid">{renderDay?.(day.date)}</CalendarLayoutContext>
        </span>
      </>
    )
  }
  const pontos = markers
    .map((mk, i) => (modifiers[`marker-${i}`] ? mk : null))
    .filter((mk): mk is CalendarMarker => mk != null)
  return (
    <>
      {children}
      {pontos.length > 0 ? (
        // Os pontos ficam na base da célula, sem empurrar o número.
        <span
          data-slot="calendar-markers"
          aria-hidden
          className="pointer-events-none absolute bottom-1 left-1/2 flex -translate-x-1/2 gap-0.5"
        >
          {pontos.slice(0, 3).map((mk) => (
            <span key={mk.label} className={cn("size-1 rounded-full", MARCADOR_TOM[mk.tone])} />
          ))}
        </span>
      ) : null}
    </>
  )
}

/**
 * O dia estático. O `react-day-picker` só desenha o dia como botão quando a
 * grade é interativa; sem isso a agenda e os pontos sumiam calados num
 * calendário só de leitura, então o mesmo miolo entra aqui.
 */
function CalendarDay({
  day,
  modifiers,
  children,
  ...props
}: React.ComponentProps<"td"> & {
  day: { date: Date }
  modifiers: Record<string, boolean>
}) {
  const { markers, agenda } = React.useContext(CalendarExtrasContext)
  const estatico = !React.isValidElement(children)
  return (
    <td {...props}>
      {estatico && (agenda || markers.length > 0) ? (
        <div
          data-slot="calendar-day-static"
          className={cn(
            "relative flex aspect-square size-full flex-col items-center justify-center text-sm leading-none tabular-nums",
            agenda && AGENDA_CELULA
          )}
        >
          <DiaConteudo day={day} modifiers={modifiers}>
            {children}
          </DiaConteudo>
        </div>
      ) : (
        children
      )}
    </td>
  )
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  children,
  ...props
}: React.ComponentProps<typeof DayButton>) {
  const defaultClassNames = getDefaultClassNames()
  const { agenda } = React.useContext(CalendarExtrasContext)
  const contentId = React.useId()

  const ref = React.useRef<HTMLButtonElement>(null)
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus()
  }, [modifiers.focused])

  return (
    <Button
      ref={ref}
      variant="tertiary"
      // Sem `size` e sem `data-size`: a célula é elástica e nenhum degrau da
      // escada a descreve; um atributo que não corresponde à caixa é pior que nenhum.
      data-size={undefined}
      data-day={localYmdFromDate(day.date)}
      data-selected-single={
        modifiers.selected &&
        !modifiers.range_start &&
        !modifiers.range_end &&
        !modifiers.range_middle
      }
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      // Na agenda o nome do dia continua "5 de março", e o que há nele (os eventos e o "+2 mais") é a descrição.
      aria-describedby={agenda ? contentId : undefined}
      className={cn(
        // `p-0` é estrutural: a raiz é `w-fit` e, com o `px-3` do `Button
        // md`, esse recuo dimensionaria a coluna (39px em todos os degraus) e
        // o `size` do `Calendar` não valeria nada.
        "relative isolate z-10 flex aspect-square size-auto w-full min-w-(--cell-size) flex-col gap-1 border-0 p-0 leading-none font-normal group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-3 group-data-[focused=true]/day:ring-ring/45 data-[range-end=true]:rounded-l-none data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground data-[range-middle=true]:rounded-none data-[range-middle=true]:bg-muted data-[range-middle=true]:text-foreground data-[range-start=true]:rounded-r-none data-[range-start=true]:data-[range-end=true]:rounded-full data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground dark:hover:text-foreground [&>span]:text-xs [&>span]:opacity-70",
        defaultClassNames.day,
        // As pontas do intervalo são meia-lua voltada para fora: a de início é
        // redonda à esquerda e reta do lado da faixa, a de fim o contrário
        // (somar `rounded-full` a `--cell-radius` na mesma aresta virava a
        // meia-lua para dentro). Um dia só é círculo.
        // O dia escolhido realça como o `primary`: a tecla vai a
        // `--primary-hover` e o número fica na tinta dela (herdando o
        // `tertiary`, o cursor trocaria o número para `--foreground` e ele
        // sumiria sobre a tecla). O `dark:` repete porque
        // `dark:hover:text-foreground` empata com a regra sem tema.
        "data-[selected-single=true]:[--button-hover-fill:transparent] data-[selected-single=true]:hover:bg-primary-hover data-[selected-single=true]:active:bg-primary-hover data-[selected-single=true]:hover:text-primary-foreground data-[selected-single=true]:active:text-primary-foreground dark:data-[selected-single=true]:hover:text-primary-foreground dark:data-[selected-single=true]:active:text-primary-foreground",
        "data-[range-start=true]:[--button-hover-fill:transparent] data-[range-start=true]:hover:bg-primary-hover data-[range-start=true]:active:bg-primary-hover data-[range-start=true]:hover:text-primary-foreground data-[range-start=true]:active:text-primary-foreground dark:data-[range-start=true]:hover:text-primary-foreground dark:data-[range-start=true]:active:text-primary-foreground",
        "data-[range-end=true]:[--button-hover-fill:transparent] data-[range-end=true]:hover:bg-primary-hover data-[range-end=true]:active:bg-primary-hover data-[range-end=true]:hover:text-primary-foreground data-[range-end=true]:active:text-primary-foreground dark:data-[range-end=true]:hover:text-primary-foreground dark:data-[range-end=true]:active:text-primary-foreground",
        // A agenda: célula alta, o número no canto e o conteúdo embaixo; o
        // "hoje" é o número numa pastilha, não a célula acesa.
        agenda && [AGENDA_CELULA, AGENDA_SELECIONADO],
        className
      )}
      {...props}
    >
      <DiaConteudo day={day} modifiers={modifiers} contentId={contentId}>
        {children}
      </DiaConteudo>
    </Button>
  )
}

/**
 * Um evento do dia: na grade, a ficha de 20px na superfície `-muted` do tom,
 * só com o título; na lista, a linha de 44px com o ponto do tom, o `meta`
 * depois do título e o valor à direita (`button` quando há `onSelect`). Na
 * grade nunca é botão, o dia já é. O valor não entra na ficha: numa coluna de
 * 123px ele espremia o título para "Spo…".
 */
function CalendarEvent({
  tone = "default",
  amount,
  meta,
  onSelect,
  className,
  children,
}: {
  tone?: CalendarMarkerTone
  /** O valor à direita, em reais — só na lista. */
  amount?: number | null
  /** Só na lista: o que vem depois do título — o tipo do evento. */
  meta?: React.ReactNode
  /** Só na lista: a linha vira botão. */
  onSelect?: () => void
  className?: string
  children: React.ReactNode
}) {
  const layout = React.useContext(CalendarLayoutContext)

  if (layout === "grid") {
    return (
      <span
        data-slot="calendar-event"
        data-tone={tone}
        className={cn(
          "flex h-5 min-w-0 items-center gap-1 rounded-md px-1.5 text-2xs leading-none font-medium",
          EVENTO_TOM[tone],
          className
        )}
      >
        <span className="min-w-0 flex-1 truncate">{children}</span>
      </span>
    )
  }

  const linha = (
    <>
      <span aria-hidden className={cn("size-2 shrink-0 rounded-full", MARCADOR_TOM[tone])} />
      <span className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden">
        <span className="min-w-0 truncate">{children}</span>
        {meta}
      </span>
      {amount != null ? <MoneyDisplay value={amount} className="shrink-0" /> : null}
    </>
  )
  const forma = "concentric flex min-h-11 w-full items-center gap-3 px-3 text-left text-sm"
  return onSelect ? (
    <button
      type="button"
      data-slot="calendar-event"
      data-tone={tone}
      onClick={onSelect}
      className={cn(
        forma,
        "transition-colors duration-(--duration-fast) ease-(--ease-out) outline-none hover:bg-muted focus-visible:inset-ring-2 focus-visible:inset-ring-ring/45 active:bg-muted",
        className
      )}
    >
      {linha}
    </button>
  ) : (
    <div data-slot="calendar-event" data-tone={tone} className={cn(forma, className)}>
      {linha}
    </div>
  )
}

/** Os eventos de um dia: na grade os `max` primeiros e um "+N mais" que não estoura a célula; na lista, todos. */
function CalendarEvents({
  max = 2,
  className,
  children,
}: {
  max?: number
  className?: string
  children: React.ReactNode
}) {
  const layout = React.useContext(CalendarLayoutContext)
  const itens = React.Children.toArray(children)
  if (itens.length === 0) return null
  const visiveis = layout === "grid" ? itens.slice(0, max) : itens
  const resto = itens.length - visiveis.length
  return (
    <div
      data-slot="calendar-events"
      className={cn("flex min-w-0 flex-col", layout === "grid" ? "gap-0.5" : "gap-0", className)}
    >
      {visiveis}
      {resto > 0 ? (
        <span data-slot="calendar-events-more" className="px-1.5 text-2xs font-medium text-muted-foreground">
          +{resto} mais
        </span>
      ) : null}
    </div>
  )
}

/**
 * O esqueleto do calendário: `agenda` é a grade de fios (título, régua dos
 * dias, 6 × 7 células com fichas fantasma); `default` é a grade pequena. Dentro
 * de um esqueleto de página, `group={false}`.
 */
function CalendarSkeleton({
  variant = "default",
  group = true,
  className,
}: {
  variant?: "default" | "agenda"
  group?: boolean
  className?: string
}) {
  const ossos =
    variant === "agenda" ? (
      <div data-slot="calendar-skeleton" data-variant="agenda" className={cn("flex w-full flex-col gap-4", className)}>
        <div className="flex h-8 items-center justify-between ps-1">
          <Skeleton className="h-5 w-32" />
          {/* O "Hoje" e as duas setas, na forma do cabeçalho da agenda. */}
          <div className="flex items-center gap-1">
            <Skeleton className="h-7 w-14 rounded-full" />
            <Skeleton className="size-8 rounded-full" />
            <Skeleton className="size-8 rounded-full" />
          </div>
        </div>
        <div className="overflow-hidden rounded-surface border border-border bg-card bg-clip-padding">
          <div className="flex border-b border-border py-2">
            {Array.from({ length: 7 }, (_, c) => (
              <div key={c} className="flex w-0 min-w-0 flex-1 justify-center">
                <Skeleton className="h-3 w-7 rounded-sm" />
              </div>
            ))}
          </div>
          {Array.from({ length: 6 }, (_, r) => (
            <div key={r} className="flex [&:last-child>div]:border-b-0">
              {Array.from({ length: 7 }, (_, c) => (
                <div
                  key={c}
                  className="flex min-h-24 w-0 min-w-0 flex-1 flex-col gap-1.5 border-e border-b border-border/60 p-2 last:border-e-0"
                >
                  <Skeleton className="size-5 rounded-full" />
                  {(r * 7 + c) % 5 === 3 ? <Skeleton className="h-5 w-4/5" /> : null}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    ) : (
      <div data-slot="calendar-skeleton" data-variant="default" className={cn("flex w-fit flex-col gap-3 p-2", className)}>
        <Skeleton className="mx-auto h-5 w-28" />
        {Array.from({ length: 6 }, (_, r) => (
          <div key={r} className="flex gap-1">
            {Array.from({ length: 7 }, (_, c) => (
              <Skeleton key={c} className="size-8 rounded-full" />
            ))}
          </div>
        ))}
      </div>
    )
  // A agenda ocupa a largura de quem a contém; sem `w-full` num contêiner flex o grupo encolhia ao conteúdo.
  return group ? (
    <SkeletonGroup label="Carregando o calendário…" className={cn(variant === "agenda" && "w-full")}>
      {ossos}
    </SkeletonGroup>
  ) : (
    ossos
  )
}

export { Calendar, CalendarDayButton, CalendarEvent, CalendarEvents, CalendarSkeleton }
export type { CalendarMarker, CalendarMarkerTone, CalendarPreset }
