"use client"

import * as React from "react"
import {
  DayPicker,
  getDefaultClassNames,
  type DateRange,
  type DayButton,
  type Matcher,
} from "react-day-picker"

import { ptBR } from "date-fns/locale"

import { cn } from "@/lib/utils"
import {
  formatDateLongPtBr,
  formatMonthShortPtBr,
  localYmdFromDate,
} from "@/lib/transaction-date"
import { Button } from "@/components/ui/button"
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
 * A grade de um mês.
 *
 * ## O `locale` tem padrão porque o app tem um só
 *
 * O `DatePicker` já passava `ptBR`; o `Calendar` usado direto caía no inglês do
 * `react-day-picker` e mostrava "August" e "Mo Tu We" no meio de uma tela em
 * português. Um padrão que só vale quando alguém lembra de passar não é padrão.
 *
 * ## A célula entra na escada
 *
 * `--cell-size` era um número solto (`--spacing(7)`, 28px) e o botão de dia
 * declarava `size="icon-lg"` — que a escada define como 36 e que **nunca
 * valeu**: o `className` do próprio componente o sobrescrevia com `size-auto
 * w-full min-w(--cell-size)`. Medido: botão de **28×28** com
 * `data-size="icon-lg"`. Um componente que declara um tamanho e entrega outro é
 * o defeito que `Menubar` (24px) e `Tabs` (27px) já pagaram.
 *
 * Agora `size` nomeia o **piso** da célula — `sm` 28, `md` 32, `lg` 36 —, e é
 * piso mesmo: a grade é elástica (`week` é `flex`, `day` é `w-full
 * aspect-square`), então a célula cresce com a largura disponível e nenhum
 * degrau da escada descreve a caixa final. É por isso que o botão de dia deixou
 * de carimbar `data-size`: um atributo que não corresponde à caixa é pior que
 * atributo nenhum.
 *
 * O salto para 44px em ponteiro grosso continua, e ali o piso é o que importa:
 * são os 44 que a página /designsystem/touch-safe-area documenta, e sete deles
 * cabem em 320px.
 */
/**
 * Os rótulos de acessibilidade, em português.
 *
 * O `locale` do `date-fns` traduz **nomes** — meses, dias da semana —, e nada
 * mais. As frases conectivas do `react-day-picker` são strings cravadas em
 * inglês no pacote: `"Go to the Previous Month"`, `"Choose the Month"`,
 * `"Choose the Year"`, e o `"Today, …"` / `"…, selected"` que o leitor de tela
 * anuncia em **cada uma das 42 células**.
 *
 * Ou seja: a grade parecia traduzida e a camada de acessibilidade nunca esteve.
 * É o mesmo defeito que o `locale` padrão deste arquivo já tinha consertado na
 * parte visível — um idioma que só vale quando alguém lembra de passar não é o
 * idioma do app.
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
 * ## Rodada 203
 *
 * - **`markers`**: pontos sob o número do dia, por tom (até três por dia),
 *   com a legenda embaixo e os rótulos somados ao nome do dia. O calendário
 *   de pagamentos do dashboard escrevia a grade inteira à mão, com os pontos
 *   em `after:` de cinco cores cruas.
 * - **`variant="agenda"`**: a célula grande, com o conteúdo do dia
 *   (`renderDay`) sob o número — a visão de mês. A grade do desktop do mesmo
 *   calendário também era escrita à mão.
 * - **`showToday`**: o "Hoje" que volta ao mês atual (e marca o dia, na
 *   escolha única). Antes, só seta a seta.
 * - **`presets`**: atalhos ao lado da grade num intervalo, e dois meses lado a
 *   lado no desktop (um no telefone).
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

/**
 * Um atalho: um intervalo (`range`) ou, desde a rodada 210, um dia (`date`) —
 * o "Hoje" e o "Ontem" do `DatePicker`. Os dois podem ser calculados na hora do
 * clique.
 */
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
}

const CalendarExtrasContext = React.createContext<CalendarExtras>({
  markers: [],
  agenda: false,
  showToday: false,
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
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>["variant"]
  size?: CalendarSize
  /** Pontos sob o número do dia, por tom — até três por dia. */
  markers?: CalendarMarker[]
  /** `agenda` é a célula grande, com o conteúdo do dia sob o número. */
  variant?: "default" | "agenda"
  /** Com `agenda`: o que vai na célula, sob o número. */
  renderDay?: (date: Date) => React.ReactNode
  /** O "Hoje" que volta ao mês atual. */
  showToday?: boolean
  /** Atalhos ao lado da grade: intervalos em `mode="range"`, dias em `single`. */
  presets?: CalendarPreset[]
  /**
   * A grade ocupa a largura de quem a contém, e as células crescem com ela.
   * O padrão é a largura das células (`w-fit`); a agenda já estica.
   */
  stretch?: boolean
}) {
  const defaultClassNames = getDefaultClassNames()
  const agenda = variant === "agenda"
  const isMobile = useIsMobile()

  // O mês só passa a ser controlado aqui quando alguém de fora da grade o
  // move — o "Hoje" e os atalhos. Sem eles, o `DayPicker` segue dono, como
  // sempre foi, e o `DatePicker` não sente diferença.
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

  // Os marcadores viram modificadores do `react-day-picker` — `marker-0`,
  // `marker-1`… —, e a célula lê quais estão ligados nela.
  const modificadores = React.useMemo(() => {
    const m: Record<string, Matcher | Matcher[] | undefined> = { ...modifiers }
    markers.forEach((mk, i) => {
      m[`marker-${i}`] = mk.dates
    })
    return m
  }, [markers, modifiers])

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
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [markers, agenda, renderDay, showToday, presets, irPara, escolher, props.mode, (props as { selected?: unknown }).selected]
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

  // Um objeto novo a cada render faz o React remontar toda a subárvore — o foco
  // caía depois de clicar "próximo mês" sempre que o pai re-renderizava. Os
  // componentes de dentro não dependem de nada além da variante das setas.
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
      // As setas de mês são o `Button` do sistema. O `react-day-picker` entrega
      // `type`, `className` (a classe da biblioteca), `tabIndex`,
      // `aria-disabled`, `aria-label`, `onClick` e o `Chevron` como filho — e
      // **não** entrega `disabled`, por isso o `aria-disabled:opacity-50`
      // continua necessário. Sem `ref`: não há o que devolver. `data-size` sai
      // porque `size-(--cell-size)` anula o degrau, e um atributo que não
      // corresponde à caixa é pior que atributo nenhum.
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
      showOutsideDays={showOutsideDays}
      numberOfMonths={meses}
      modifiers={modificadores}
      {...(controlaMes
        ? { month: props.month ?? mesInterno, onMonthChange: irPara }
        : {})}
      // A grade inteira sai de `--cell-size`. Em ponteiro grosso ela vai de
      // 28px para 44px, o mínimo de alvo de dedo que a página
      // /designsystem/touch-safe-area documenta — 7 células de 44px cabem em
      // 320px. Um ponto de mudança para as 42 células e a navegação de mês.
      className={cn(
        "group/calendar bg-background p-2 [--cell-radius:var(--radius-md)] in-data-[slot=card-content]:bg-transparent in-data-[slot=popover-content]:bg-transparent",
        CALENDAR_CELL[size],
        // A agenda ocupa a largura de quem a contém, e a célula cresce com ela.
        agenda && "p-0",
        // O toque vence a escada, e vem depois dela de propósito: 44px é piso
        // de alvo, não um degrau a mais.
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
        // A faixa de navegação é `absolute inset-x-0 w-full` com um botão em
        // cada ponta — ou seja, **ela cobre também o meio do cabeçalho**, que é
        // onde vivem os seletores de mês e ano. Sendo posicionada, ela pinta por
        // cima e engolia o clique: medido com `elementFromPoint` no centro do
        // gatilho, quem respondia era o `<nav>`.
        //
        // O conserto é de raiz: a faixa não recebe ponteiro, e os dois botões
        // recebem. Um contêiner de largura total que só tem conteúdo nas pontas
        // não deve capturar nada no vão entre elas.
        nav: cn(
          "pointer-events-none absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1 [&>button]:pointer-events-auto",
          defaultClassNames.nav
        ),
        // Só a classe da biblioteca: o seletor `rtl:**:[.rdp-button_previous>svg]`
        // depende dela. A cromagem é do `Button`, em `components` abaixo.
        button_previous: defaultClassNames.button_previous,
        button_next: defaultClassNames.button_next,
        month_caption: cn(
          "flex h-(--cell-size) w-full items-center justify-center px-(--cell-size)",
          defaultClassNames.month_caption
        ),
        dropdowns: cn(
          "flex h-(--cell-size) w-full items-center justify-center gap-1.5 text-sm font-medium",
          defaultClassNames.dropdowns
        ),
        // O `relative` daqui **não era resto**, e tirá-lo custou um bug: ele
        // punha o seletor no contexto de empilhamento, acima do `<nav>`
        // absoluto que atravessa o cabeçalho. Sem ele o seletor virou estático,
        // caiu para trás da faixa e parou de responder ao clique — medido.
        //
        // Ele volta, e o `pointer-events` do `nav` acima resolve a causa. Os
        // dois juntos: a faixa não captura o vão, e o seletor pinta por cima de
        // qualquer jeito.
        dropdown_root: cn("relative z-10", defaultClassNames.dropdown_root),
        // `dropdown` continua sem classe: ele vestia o `<select>` nativo
        // `absolute inset-0 opacity-0` que o `Dropdown` do sistema substituiu.
        dropdown: cn(defaultClassNames.dropdown),
        // O `caption_label` só se aplica ao layout `label`. Sob `dropdown` ele
        // desenhava o rótulo falso, que também deixou de existir.
        caption_label: cn(
          "text-sm font-medium select-none",
          defaultClassNames.caption_label
        ),
        table: "w-full border-collapse",
        // Na agenda as semanas têm vão de 4px; o cabeçalho acompanha, senão
        // os nomes desalinham das colunas.
        weekdays: cn("flex", agenda && "gap-1", defaultClassNames.weekdays),
        weekday: cn(
          "flex-1 rounded-(--cell-radius) text-control-sm font-normal text-muted-foreground select-none",
          // Na agenda, o cabeçalho é a régua da coluna: versalete pequeno.
          agenda && "pb-1 text-2xs font-medium tracking-wide uppercase",
          defaultClassNames.weekday
        ),
        week: cn(agenda ? "mt-1 flex w-full gap-1" : "mt-2 flex w-full", defaultClassNames.week),
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
          agenda && "aspect-auto",
          props.showWeekNumber
            ? "[&:nth-child(2)[data-selected=true]_button]:rounded-l-(--cell-radius)"
            : "[&:first-child[data-selected=true]_button]:rounded-l-(--cell-radius)",
          defaultClassNames.day
        ),
        // A ponte entre a ponta e o miolo era `after:w-4` — **16px fixos**
        // contra uma célula que vai de 28 a 44 no ponteiro grosso, medidos nos
        // dois. Um número que não acompanha a variável que ele existe para
        // acompanhar. Metade da célula é a medida certa: ela cobre o raio da
        // ponta em qualquer degrau.
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
          "rounded-(--cell-radius) bg-muted text-foreground data-[selected=true]:rounded-none",
          defaultClassNames.today
        ),
        outside: cn(
          "text-muted-foreground aria-selected:text-muted-foreground",
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
 * O que a raiz acrescenta em volta da grade: os atalhos do intervalo (ao lado
 * no desktop, em cima no telefone), o "Hoje" e a legenda dos marcadores. Lê o
 * contexto, e não as props, para os `components` do `DayPicker` continuarem
 * os mesmos entre renders — um objeto novo remontaria a grade e soltaria o
 * foco (ver o comentário em `componentes`).
 */
function CalendarShell({ children }: { children: React.ReactNode }) {
  const { presets, showToday, markers, irPara, escolher, modo, selecionado } =
    React.useContext(CalendarExtrasContext)
  const hoje = () => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }
  const intervaloAtual = selecionado as DateRange | undefined

  const grade = (
    <div className="flex min-w-0 flex-col">
      {children}
      {markers.length > 0 ? (
        <ul
          data-slot="calendar-legend"
          className="mt-3 flex flex-wrap gap-x-3 gap-y-1 px-1 text-xs text-muted-foreground"
        >
          {markers.map((mk) => (
            <li key={mk.label} className="inline-flex items-center gap-1.5">
              <span aria-hidden className={cn("size-1.5 rounded-full", MARCADOR_TOM[mk.tone])} />
              {mk.label}
            </li>
          ))}
        </ul>
      ) : null}
      {showToday ? (
        <div className="mt-2 flex justify-center">
          <Button
            type="button"
            variant="tertiary"
            size="xs"
            onClick={() => {
              const d = hoje()
              irPara(d)
              if (modo === "single") escolher(d)
            }}
          >
            hoje
          </Button>
        </div>
      ) : null}
    </div>
  )

  if (!presets?.length) return grade

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <ul
        data-slot="calendar-presets"
        aria-label={modo === "range" ? "Atalhos de período" : "Atalhos de data"}
        className="flex gap-1 overflow-x-auto sm:w-36 sm:shrink-0 sm:flex-col sm:overflow-visible sm:border-e sm:border-border sm:pe-2"
      >
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
                  variant={ativo ? "secondary" : "tertiary"}
                  size="sm"
                  aria-pressed={ativo}
                  className="w-full justify-start font-normal"
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
                variant={ativo ? "secondary" : "tertiary"}
                size="sm"
                aria-pressed={ativo}
                className="w-full justify-start font-normal"
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
 * O seletor de mês e de ano — o do design system, e não o nativo.
 *
 * ## O que havia antes
 *
 * O `react-day-picker` desenha o salto de mês assim: um `<select>` **nativo**
 * com `absolute inset-0 opacity-0` por cima de um rótulo falso, que é quem
 * recebe a tipografia e o chevron. Funciona, e é como o shadcn entrega — mas o
 * painel que abre é o do sistema operacional: fonte, medida, cantos e realce
 * fora do tema, sem tema escuro, e sem nenhuma das decisões que este projeto já
 * tomou sobre superfície de comando.
 *
 * Aqui ele passa a ser o `Select` do design system, que já veste
 * `field-classes` no gatilho e a superfície de popover no painel.
 *
 * ## A ponte com o `react-day-picker`
 *
 * O `onChange` dele é um `ChangeEventHandler<HTMLSelectElement>`, e o handler
 * interno lê **só `e.target.value`** (`DayPicker.js`: `Number(e.target.value)`).
 * O `Select` do Radix entrega `onValueChange(valor: string)`, então a ponte é
 * um objeto com a única propriedade que o outro lado consulta. É um `as` sobre
 * um objeto incompleto de propósito — e o comentário existe para que a próxima
 * pessoa saiba que a incompletude foi medida, não esquecida.
 *
 * ## O gatilho é compacto, e não `sm`
 *
 * A fileira de dois seletores vive dentro de um `month_caption` que já reserva
 * `--cell-size` de cada lado para as setas. Com o recuo padrão do
 * `SelectTrigger` os dois somam mais que sete células, e como a raiz é `w-fit`
 * **a grade inteira cresceria para caber a legenda** — o calendário passaria a
 * ser dimensionado pelo cabeçalho em vez das células.
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
        className="w-fit gap-1 border-transparent bg-transparent px-2 font-medium hover:bg-muted active:bg-muted"
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

/** A célula da agenda: alta, o número no canto e o conteúdo embaixo. */
const AGENDA_CELULA =
  "aspect-auto min-h-24 items-stretch justify-start gap-1 rounded-lg border border-border/60 bg-card p-1.5 text-left"

/**
 * O miolo do dia, igual no botão e no dia estático: na agenda, o número (hoje
 * numa pastilha) e o conteúdo; fora dela, o número e os pontos dos marcadores.
 */
function DiaConteudo({
  day,
  modifiers,
  children,
}: {
  day: { date: Date }
  modifiers: Record<string, boolean>
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
            modifiers.today && "bg-primary text-primary-foreground"
          )}
        >
          {children}
        </span>
        <span data-slot="calendar-day-content" className="w-full min-w-0 flex-1">
          {renderDay?.(day.date)}
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
 * O dia **estático**. O `react-day-picker` só desenha o dia como botão quando
 * a grade é interativa (`mode` ou `onDayClick`); sem isso a célula recebe o
 * número em texto, e a agenda e os pontos — que moram no botão — sumiam
 * calados num calendário só de leitura. Aqui o mesmo miolo entra no dia
 * estático. Medido: a agenda sem `onDayClick` saía só com "12" na célula.
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

  const ref = React.useRef<HTMLButtonElement>(null)
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus()
  }, [modifiers.focused])

  return (
    <Button
      ref={ref}
      variant="tertiary"
      // **Sem `size`, e sem `data-size`.** Ele dizia `icon-lg` (36) e nunca
      // valeu: as classes abaixo (`size-auto w-full min-w-(--cell-size)`) o
      // sobrescrevem, e o botão media 28. Deixar o padrão `md` do `Button`
      // apenas trocaria a mentira de 36 para 32 — a célula é elástica, então
      // **nenhum** degrau da escada a descreve, e carimbar um atributo que não
      // corresponde à caixa é pior que não ter atributo.
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
      className={cn(
        // **`p-0` é carga estrutural, não cosmética.** A raiz é `w-fit`, e a
        // largura da grade sai do `max-content` das células. Enquanto o botão
        // trouxer o `px-3` do degrau `md` do `Button`, esse recuo é o que
        // dimensiona a coluna: medido, **39px em todos os degraus**, com o
        // `min-w-(--cell-size)` nunca chegando a valer e o `size` do `Calendar`
        // sem efeito nenhum. Com o recuo em zero, quem dimensiona volta a ser a
        // célula.
        "relative isolate z-10 flex aspect-square size-auto w-full min-w-(--cell-size) flex-col gap-1 border-0 p-0 leading-none font-normal group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-3 group-data-[focused=true]/day:ring-ring/45 data-[range-end=true]:rounded-r-(--cell-radius) data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground data-[range-middle=true]:rounded-none data-[range-middle=true]:bg-muted data-[range-middle=true]:text-foreground data-[range-start=true]:rounded-l-(--cell-radius) data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground dark:hover:text-foreground [&>span]:text-xs [&>span]:opacity-70",
        defaultClassNames.day,
        // A agenda: a célula alta, o número no canto e o conteúdo do dia
        // embaixo. Contorno e chão próprios, e o "hoje" é o número numa
        // pastilha, não a célula inteira acesa.
        agenda && [AGENDA_CELULA, "hover:bg-muted/40 active:bg-muted/40"],
        className
      )}
      {...props}
    >
      <DiaConteudo day={day} modifiers={modifiers}>
        {children}
      </DiaConteudo>
    </Button>
  )
}

export { Calendar, CalendarDayButton }
export type { CalendarMarker, CalendarPreset }
