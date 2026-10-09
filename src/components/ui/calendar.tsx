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
   * Com `agenda`: o que vai na célula, sob o número — de preferência um
   * `CalendarEvents` com os `CalendarEvent` do dia. `null` é dia vazio, e na
   * lista (a agenda estreita) o dia vazio não aparece.
   */
  renderDay?: (date: Date) => React.ReactNode
  /** Com `agenda`, estreita: o texto da lista quando o mês não tem nada. */
  listEmpty?: React.ReactNode
  /**
   * Com `agenda`, estreita: os dias que entram na lista, entre os que têm
   * conteúdo. A grade não muda. O dashboard o usa para mostrar só os últimos
   * dias passados, como a lista do telefone sempre fez.
   */
  listDays?: (date: Date) => boolean
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
    // Na agenda, o fim de semana tem um véu na coluna (rodada 242).
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
      modifiersClassNames={
        agenda
          ? { fimDeSemana: AGENDA_FIM_DE_SEMANA, ...modifiersClassNames }
          : modifiersClassNames
      }
      {...(controlaMes
        ? { month: props.month ?? mesInterno, onMonthChange: irPara }
        : {})}
      // A grade inteira sai de `--cell-size`. Em ponteiro grosso ela vai de
      // 28px para 44px, o mínimo de alvo de dedo que a página
      // /designsystem/touch-safe-area documenta — 7 células de 44px cabem em
      // 320px. Um ponto de mudança para as 42 células e a navegação de mês.
      className={cn(
        "group/calendar bg-background p-2 [--cell-radius:9999px] in-data-[slot=card-content]:bg-transparent in-data-[slot=popover-content]:bg-transparent",
        CALENDAR_CELL[size],
        // A agenda ocupa a largura de quem a contém, e a célula cresce com ela.
        // Ela não pinta: quem pinta é a moldura da grade (`month_grid`). E é o
        // contêiner da virada para lista (rodada 242).
        agenda && "@container/calendar bg-transparent p-0",
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
          agenda && "justify-end",
          defaultClassNames.nav
        ),
        // Só a classe da biblioteca: o seletor `rtl:**:[.rdp-button_previous>svg]`
        // depende dela. A cromagem é do `Button`, em `components` abaixo.
        button_previous: defaultClassNames.button_previous,
        button_next: defaultClassNames.button_next,
        month_caption: cn(
          "flex h-(--cell-size) w-full items-center justify-center px-(--cell-size)",
          // Na agenda o mês é o título da tela, à esquerda; a navegação fica
          // junta à direita (rodada 242).
          agenda && "justify-start ps-1 pe-0",
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
          agenda && "inline-block text-base font-semibold first-letter:uppercase",
          defaultClassNames.caption_label
        ),
        table: "w-full border-collapse",
        // **A grade de fios** (rodada 242): na agenda, a tabela é uma moldura
        // só — o canto da superfície, o fio de 1px e o cartão —, e as células
        // são separadas por fios, sem caixinha própria. Como item de flex, o
        // `thead` e o `tbody` viram blocos sozinhos. Abaixo de 40rem da
        // própria agenda ela some, e a lista do `CalendarShell` aparece.
        month_grid: cn(
          agenda &&
            "flex w-full flex-col overflow-hidden rounded-surface border border-border bg-card @max-[40rem]/calendar:hidden",
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
          // última coluna e a última semana não desenham. E as sete colunas
          // têm a mesma largura (`w-0 flex-1`): com a base no conteúdo, o dia
          // com uma ficha longa alargava a coluna e a régua desalinhava.
          agenda && "aspect-auto w-0 min-w-0 flex-1 rounded-none border-e border-b border-border/60 last:border-e-0",
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
          // Na agenda o hoje é o número na pastilha (`DiaConteudo`), e não a
          // célula inteira acesa.
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
 * O que a raiz acrescenta em volta da grade: os atalhos do intervalo (ao lado
 * no desktop, em cima no telefone), o "Hoje" e a legenda dos marcadores. Lê o
 * contexto, e não as props, para os `components` do `DayPicker` continuarem
 * os mesmos entre renders — um objeto novo remontaria a grade e soltaria o
 * foco (ver o comentário em `componentes`).
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

function CalendarShell({ children }: { children: React.ReactNode }) {
  const { presets, showToday, markers, agenda, semNavegacao, irPara, escolher, modo, selecionado } =
    React.useContext(CalendarExtrasContext)
  const irParaHoje = useIrParaHoje()
  const intervaloAtual = selecionado as DateRange | undefined

  const grade = (
    <div className="flex min-w-0 flex-col">
      {children}
      {agenda ? <CalendarAgendaList /> : null}
      {markers.length > 0 ? (
        // A legenda é uma faixa própria (rodada 241y): um fio suave a separa da
        // grade — ela não é mais uma semana —, centrada sob as sete colunas, com
        // respiro de 16px entre os itens para cada ponto ler como do seu nome,
        // e não do vizinho. O ponto tem o dobro do da célula (8 contra 4),
        // porque aqui ele é a chave, e lá é a marca.
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
 * A faixa de navegação. Fora da agenda é a do `react-day-picker`, intacta. Na
 * agenda com `showToday`, o "Hoje" entra na faixa, antes das setas — o mês à
 * esquerda e a navegação junta à direita, como a visão de mês do iOS
 * (rodada 242).
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
 * A agenda estreita (rodada 242): abaixo de 40rem da **própria** largura a
 * grade some e entra a lista do mês — só os dias com conteúdo, cada um com o
 * rótulo e os eventos em linha. É a container query, e não a janela: num
 * painel de 560px no desktop ela também vira lista.
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
      className="hidden flex-col gap-1 rounded-surface border border-border bg-card p-1.5 @max-[40rem]/calendar:flex [--radius-inset:calc(--spacing(1.5)+1px)] [--radius-parent:var(--radius-surface)]"
    >
      {dias.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          {listEmpty ?? "Nenhum evento neste mês"}
        </p>
      ) : (
        dias.map(({ date, conteudo }) => {
          const ymd = localYmdFromDate(date)
          return (
            // Um grupo e não uma `section`: com nome, a `section` vira região, e
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

/**
 * A célula da agenda: alta, o número no canto e o conteúdo embaixo — **sem
 * caixa** (rodada 242). Era `rounded-lg` com borda e cartão próprios, 42
 * caixinhas; hoje quem separa os dias são os fios do `td`, e a célula só
 * realça: a camada do `Button` a 5% da tinta do texto, que numa célula de 96px
 * é o bastante. O foco é um anel **interno**, porque a moldura recorta o de
 * fora nas bordas.
 */
const AGENDA_CELULA =
  "aspect-auto min-h-24 w-full items-stretch justify-start gap-1 rounded-none border-0 bg-transparent p-2 text-left [--button-hover-fill:color-mix(in_oklab,var(--foreground)_5%,transparent)] focus-visible:ring-0 focus-visible:inset-ring-2 focus-visible:inset-ring-ring/45 group-data-[focused=true]/day:ring-0 group-data-[focused=true]/day:inset-ring-2 group-data-[focused=true]/day:inset-ring-ring/45"

/**
 * O dia escolhido na agenda **não acende em `primary`** — numa célula de 96px
 * a tecla preta inteira apagaria o conteúdo. Ele fica `muted` com um anel
 * interno, e o número na tinta do texto. Vence as regras do dia escolhido do
 * calendário pequeno porque vem depois no `cn` — inclusive a camada do realce,
 * que lá é zerada e aqui volta aos 5% das outras células.
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
  const contentId = React.useId()

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
      // Na agenda o nome do dia continua "5 de março", e o que há nele — os
      // eventos e o "+2 mais" — é a descrição (rodada 242).
      aria-describedby={agenda ? contentId : undefined}
      className={cn(
        // **`p-0` é carga estrutural, não cosmética.** A raiz é `w-fit`, e a
        // largura da grade sai do `max-content` das células. Enquanto o botão
        // trouxer o `px-3` do degrau `md` do `Button`, esse recuo é o que
        // dimensiona a coluna: medido, **39px em todos os degraus**, com o
        // `min-w-(--cell-size)` nunca chegando a valer e o `size` do `Calendar`
        // sem efeito nenhum. Com o recuo em zero, quem dimensiona volta a ser a
        // célula.
        "relative isolate z-10 flex aspect-square size-auto w-full min-w-(--cell-size) flex-col gap-1 border-0 p-0 leading-none font-normal group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-3 group-data-[focused=true]/day:ring-ring/45 data-[range-end=true]:rounded-l-none data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground data-[range-middle=true]:rounded-none data-[range-middle=true]:bg-muted data-[range-middle=true]:text-foreground data-[range-start=true]:rounded-r-none data-[range-start=true]:data-[range-end=true]:rounded-full data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground dark:hover:text-foreground [&>span]:text-xs [&>span]:opacity-70",
        defaultClassNames.day,
        // **As pontas do intervalo são meia-lua voltada para fora** (rodada
        // 241x): a ponta de início é redonda à esquerda e reta do lado da
        // faixa, a de fim o contrário, e as duas completam a faixa. Antes elas
        // somavam `rounded-full` (calc(infinity·1px)) a `--cell-radius`
        // (9999px) na mesma aresta, e a regra de proporção do CSS encolhia o
        // lado de 9999 a quase zero — a meia-lua saía virada para dentro. O
        // intervalo de um dia só, com as duas pontas no mesmo dia, é círculo.
        // **O dia escolhido realça como o `primary`** (rodada 241w): a tecla vai
        // a `--primary-hover` e o número fica na tinta dela. Herdando o
        // `tertiary`, o cursor trocava o número para `--foreground` — branco
        // sobre a tecla branca no escuro, preto sobre a preta no claro: o
        // número sumia — e a camada de 12% do texto não se via sobre a tecla.
        // O `dark:` repete porque `dark:hover:text-foreground` empata com a
        // regra sem tema.
        "data-[selected-single=true]:[--button-hover-fill:transparent] data-[selected-single=true]:hover:bg-primary-hover data-[selected-single=true]:active:bg-primary-hover data-[selected-single=true]:hover:text-primary-foreground data-[selected-single=true]:active:text-primary-foreground dark:data-[selected-single=true]:hover:text-primary-foreground dark:data-[selected-single=true]:active:text-primary-foreground",
        "data-[range-start=true]:[--button-hover-fill:transparent] data-[range-start=true]:hover:bg-primary-hover data-[range-start=true]:active:bg-primary-hover data-[range-start=true]:hover:text-primary-foreground data-[range-start=true]:active:text-primary-foreground dark:data-[range-start=true]:hover:text-primary-foreground dark:data-[range-start=true]:active:text-primary-foreground",
        "data-[range-end=true]:[--button-hover-fill:transparent] data-[range-end=true]:hover:bg-primary-hover data-[range-end=true]:active:bg-primary-hover data-[range-end=true]:hover:text-primary-foreground data-[range-end=true]:active:text-primary-foreground dark:data-[range-end=true]:hover:text-primary-foreground dark:data-[range-end=true]:active:text-primary-foreground",
        // A agenda: a célula alta, o número no canto e o conteúdo do dia
        // embaixo. Contorno e chão próprios, e o "hoje" é o número numa
        // pastilha, não a célula inteira acesa.
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
 * Um evento do dia (rodada 242), na forma que a agenda pede: na grade, a ficha
 * de 20px na superfície `-muted` do tom, só com o título; na lista, a linha de
 * 44px com o ponto do tom, o `meta` (o tipo) depois do título e o valor à
 * direita — e ela é `button` quando há `onSelect`. Na grade ela nunca é botão:
 * o dia já é. O valor sai na tinta do texto, como no resto da agenda do app: o
 * tom do evento já está no ponto.
 *
 * **O valor não entra na ficha, e é medido**: numa coluna de 123px (a agenda
 * de 862) o valor ficava inteiro e o título caía para "Spo…" e "Co…". O
 * título é o que diz o que é; o valor está na lista e no que o dia abre.
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

/**
 * Os eventos de um dia. Na grade mostra os `max` primeiros e um "+N mais"
 * que não estoura a célula; na lista mostra todos. Era escrito à mão em cada
 * tela — o "+N" do dashboard, o `Badge` do catálogo.
 */
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
 * O esqueleto do calendário (rodada 242). `agenda` é a grade de fios — o
 * título, a régua dos dias e 6 × 7 células com uma ficha fantasma em algumas;
 * `default` é a grade pequena. Dentro de um esqueleto de página, `group={false}`.
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
        <div className="overflow-hidden rounded-surface border border-border bg-card">
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
  // A agenda ocupa a largura de quem a contém, como a agenda de verdade: sem
  // `w-full` no grupo, num contêiner flex ele encolhia ao conteúdo e a grade
  // saía espremida em 260px.
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
