"use client"

import * as React from "react"
import { CheckIcon, ChevronLeftIcon, ChevronRightIcon, PlusIcon, XMarkIcon } from "@heroicons/react/16/solid"
import { AnimatePresence, motion, useIsPresent, useReducedMotion } from "motion/react"

import { tagChipSuccess } from "@/components/ui/badge"
import { Button, ButtonSizeContext } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandItemMeta,
  CommandList,
  CommandLoading,
} from "@/components/ui/command"
import {
  DATE_RANGE_PRESETS,
  MonthGrid,
  proximoIntervaloDeMes,
  type DatePickerRangePreset,
} from "@/components/ui/date-picker"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Kbd } from "@/components/ui/kbd"
import { KbdGroup } from "@/components/ui/kbd-group"
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverFooter,
  PopoverHeader,
  PopoverTitle,
} from "@/components/ui/popover"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Skeleton, SkeletonGroup } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Toggle } from "@/components/ui/toggle"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { useCommandSearch } from "@/hooks/use-command-search"
import { useIsMobile } from "@/hooks/use-mobile"
import { useScrollFade } from "@/hooks/use-scroll-fade"
import { useToolbarKeyboard } from "@/hooks/use-toolbar-keyboard"
import { commandFilter } from "@/lib/command-filter"
import { mergeParams } from "@/lib/data-table/url-state"
import { fieldControlHeightClassName, fieldSurfaceClassName } from "@/lib/field-classes"
import { currencyBRL, currencyCompactBRL, numberBR } from "@/lib/formatters"
import { classifyPeriod, monthRangeYmd, periodLabel, periodSummary, wholeYears } from "@/lib/period-range"
import { formatMoneyBrlInput, parseMoneyBrl } from "@/lib/money-brl"
import { limparExcesso, quemSai } from "@/lib/overflow"
import { OverflowMenu, type ItemNoExcesso } from "@/lib/overflow-menu"
import { scrollFadeViewportXClassName } from "@/lib/scroll-fade-classes"
import { ariaShortcut, isEditableTarget, matchShortcut } from "@/lib/shortcut"
import { MOLA } from "@/lib/spring"
import { localYmdFromDate, parseYmdLocal } from "@/lib/transaction-date"
import { cn } from "@/lib/utils"

/**
 * A barra de filtros: cada filtro é um token, uma cápsula partida em campo ·
 * operador · valor · ×, e cada segmento se edita no lugar (superfície de campo,
 * `Popover` com o `Command`, `DropdownMenu` de rádios, `Calendar` com atalhos
 * de período e `Input money`).
 *
 * Um popover só para a barra inteira, ancorado por `virtualRef` no que estiver
 * aberto: escolher um campo troca conteúdo e âncora no mesmo lote (com dois, o
 * que fecha devolve o foco ao "+ Filtro" e esse foco fecha o outro).
 *
 * ponytail: um token por campo (escolher um já usado abre o editor dele). Simplifica
 * a URL, o E/OU e o foco; o teto é "dois Valores ao mesmo tempo" (≥ 50 ou ≤ 10),
 * e quando uma tela pedir o token ganha um `id` próprio.
 *
 * Tudo grava ao vivo; o que fica incompleto (lista vazia, "entre" com uma ponta
 * só) é rascunho: o token fica à vista com "Selecionar…", nunca é emitido, e
 * some ao fechar o editor.
 */

export type FilterFieldType = "enum" | "period" | "money" | "text" | "boolean"
export type FilterOperator = "is" | "is-not" | "between" | "gte" | "lte" | "eq" | "approx" | "contains"
export type FilterMatch = "all" | "any"

export type FilterOption = {
  value: string
  label: string
  /** O `ColorTile size="xs"` da categoria, ou um ícone `16/solid`. */
  media?: React.ReactNode
  /** Quantos itens a opção pega — a contagem à direita da linha. */
  count?: number
  /** Vale sozinha ("Todas"): marcá-la desmarca as outras, e marcar outra a desmarca. */
  exclusive?: boolean
  keywords?: string[]
}

type FieldBase = {
  /** Estável: é o que vai na URL. */
  id: string
  label: string
  /** Heroicon `16/solid`. */
  icon?: React.ReactNode
  /** Os rótulos ainda chegando: a roda no token e `aria-busy`. */
  pending?: boolean
}

export type FilterField =
  | (FieldBase & {
      type: "enum"
      options?: FilterOption[]
      /** A busca no servidor — com espera e cancelamento (`useCommandSearch`). */
      loadOptions?: (busca: string, signal: AbortSignal) => Promise<FilterOption[]>
      /** Várias escolhas (o padrão). `false`: uma só, e o editor fecha ao escolher. */
      multiple?: boolean
    })
  | (FieldBase & {
      type: "period"
      /** A despesa de cada mês do ano (12 posições; `null` = sem total): a legenda da grade de meses e o total de cada ano. */
      totals?: (year: number, signal: AbortSignal) => Promise<(number | null)[]>
    })
  | (FieldBase & { type: "money" | "text" | "boolean" })

/**
 * Um filtro sempre completo — o rascunho nunca sai do componente.
 * `values` por tipo: enum, os valores das opções; period, `[atalho]` ou
 * `[deYmd, ateYmd]`; money, `[min, max]` em `between` e `[n]` em `lte`, `gte`,
 * `eq` e `approx` (este, ±10%: `approxRange`)
 * (decimal com ponto, "1284.6"); text, `[texto]`; boolean, `[]`.
 */
export type FilterValue = { field: string; operator: FilterOperator; values: string[] }

type FilterBarSize = "sm" | "md" | "lg"
type FilterBarTone = "neutral" | "success"
type FilterBarMobile = "scroll" | "stack"

/** O primeiro é o padrão. */
const OPERADORES: Record<FilterFieldType, FilterOperator[]> = {
  enum: ["is", "is-not"],
  period: ["is"],
  money: ["lte", "gte", "between", "eq", "approx"],
  text: ["contains"],
  boolean: ["is"],
}

/** O operador é o mesmo com um valor ou vários ("é um de" saiu a pedido do dono, 10/11/2026): o "+N" do valor já diz que são vários, e o curto cabe no iPhone empilhado. */
function rotuloOperador(op: FilterOperator): string {
  if (op === "is") return "é"
  if (op === "is-not") return "não é"
  if (op === "between") return "entre"
  if (op === "gte") return "a partir de"
  if (op === "lte") return "até"
  if (op === "eq") return "igual a"
  if (op === "approx") return "por volta de"
  return "contém"
}

/** A folga do "por volta de": 10% para cada lado, em centavos. */
export function approxRange(n: number): [number, number] {
  return [Math.round(n * 90) / 100, Math.round(n * 110) / 100]
}

/** "R$ 100" sem centavos zerados, "R$ 234,70" com eles. */
const brlCurto = (n: number) => currencyBRL(n, { minimumFractionDigits: Number.isInteger(n) ? 0 : 2 })

/** O valor que o editor de dinheiro escreve: `lte` usa o máximo, os outros de um campo só, o mínimo. */
const usaMaximo = (op: FilterOperator) => op === "lte"

const YMD = /^\d{4}-\d{2}-\d{2}$/
const ymdValido = (s: string) => YMD.test(s) && parseYmdLocal(s) != null

const hojeLocal = () => {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}
const diasAtras = (n: number) => {
  const d = hojeLocal()
  d.setDate(d.getDate() - n)
  return d
}

/** Os atalhos do filtro de período: os do `DatePicker` mais Hoje, Últimos 90 dias e os de ano (que o `DatePicker` não tem). */
export const FILTER_PERIOD_PRESETS: (DatePickerRangePreset & { id: string })[] = [
  ...DATE_RANGE_PRESETS,
  { id: "hoje", label: "Hoje", range: () => ({ from: hojeLocal(), to: hojeLocal() }) },
  { id: "ultimos-90", label: "Últimos 90 dias", range: () => ({ from: diasAtras(89), to: hojeLocal() }) },
  {
    id: "este-ano",
    label: "Este ano",
    range: () => ({ from: new Date(hojeLocal().getFullYear(), 0, 1), to: hojeLocal() }),
  },
  {
    id: "ano-passado",
    label: "Ano passado",
    range: () => {
      const y = hojeLocal().getFullYear() - 1
      return { from: new Date(y, 0, 1), to: new Date(y, 11, 31) }
    },
  },
  {
    id: "ultimos-12-meses",
    label: "Últimos 12 meses",
    range: () => {
      const h = hojeLocal()
      return { from: new Date(h.getFullYear() - 1, h.getMonth(), h.getDate() + 1), to: h }
    },
  },
]

/** Os botões da aba Dias, nessa ordem. */
export const FILTER_PERIOD_DAY_PRESET_IDS = ["hoje", "ultimos-7", "ultimos-30", "ultimos-90"] as const

const ATALHOS_DE_DIAS = FILTER_PERIOD_DAY_PRESET_IDS.map(
  (id) => FILTER_PERIOD_PRESETS.find((p) => p.id === id)!
)

/** Os atalhos da aba Ano, nessa ordem. */
export const FILTER_PERIOD_YEAR_PRESET_IDS = ["este-ano", "ano-passado", "ultimos-12-meses"] as const

const ATALHOS_DE_ANO = FILTER_PERIOD_YEAR_PRESET_IDS.map(
  (id) => FILTER_PERIOD_PRESETS.find((p) => p.id === id)!
)

type AbaDoPeriodo = "dias" | "meses" | "ano"

/** A aba que o editor de período abre: a unidade do valor; sem valor, Dias. */
export function abaInicialDoPeriodo(valores: string[]): AbaDoPeriodo {
  if (FILTER_PERIOD_YEAR_PRESET_IDS.some((id) => id === valores[0])) return "ano"
  const r = filterPeriodRange(valores)
  if (!r) return "dias"
  if (wholeYears(r.from, r.to)) return "ano"
  const tipo = classifyPeriod(r.from, r.to).kind
  return tipo === "year" ? "ano" : tipo === "months" ? "meses" : "dias"
}

function intervaloDoAtalho(id: string) {
  const atalho = FILTER_PERIOD_PRESETS.find((p) => p.id === id)
  if (!atalho) return null
  const r = typeof atalho.range === "function" ? atalho.range() : atalho.range
  return r.from && r.to ? { from: localYmdFromDate(r.from), to: localYmdFromDate(r.to) } : null
}

/** O intervalo de um filtro de período em `YYYY-MM-DD`, com o atalho ("este-mes") resolvido na data de hoje; é o que a tela passa à consulta. */
export function filterPeriodRange(values: string[]): { from: string; to: string } | null {
  if (values.length === 1) return intervaloDoAtalho(values[0])
  if (values.length === 2 && ymdValido(values[0]) && ymdValido(values[1])) {
    return { from: values[0], to: values[1] }
  }
  return null
}

/** Os valores normalizados, ou `null` quando o filtro está incompleto ou não se entende; a régua única do rascunho, da URL e do editor. */
function normalizar(
  campo: FilterField,
  operador: FilterOperator,
  valores: string[]
): string[] | null {
  switch (campo.type) {
    case "enum": {
      let v = [...new Set(valores.filter(Boolean))]
      if (campo.options && !campo.loadOptions) {
        v = v.filter((x) => campo.options!.some((o) => o.value === x))
      }
      if (campo.multiple === false) v = v.slice(0, 1)
      return v.length ? v : null
    }
    case "period": {
      if (valores.length === 1) return intervaloDoAtalho(valores[0]) ? [valores[0]] : null
      if (valores.length !== 2 || !ymdValido(valores[0]) || !ymdValido(valores[1])) return null
      return [...valores].sort()
    }
    case "money": {
      const n = valores.map((x) => (x === "" ? NaN : Number(x)))
      if (n.some((x) => !Number.isFinite(x))) return null
      if (operador === "between") {
        return n.length === 2 ? n.sort((a, b) => a - b).map(String) : null
      }
      return n.length === 1 ? n.map(String) : null
    }
    case "text": {
      const t = valores[0]?.trim()
      return t ? [t] : null
    }
    case "boolean":
      return []
  }
}

/**
 * A URL: `campo:operador:valor:valor`, separados por vírgula, cada parte em
 * `encodeURIComponent` — um valor com `:`, `,` ou acento volta igual.
 */
export function serializeFilters(value: FilterValue[]): string | null {
  if (!value.length) return null
  return value
    .map((f) => [f.field, f.operator, ...f.values].map(encodeURIComponent).join(":"))
    .join(",")
}

/** Descarta o que não entende — um link velho não pode quebrar a tela. */
export function parseFilters(texto: string | null, fields: FilterField[]): FilterValue[] {
  if (!texto) return []
  const vistos = new Set<string>()
  const lidos: FilterValue[] = []
  for (const item of texto.split(",")) {
    let partes: string[]
    try {
      partes = item.split(":").map(decodeURIComponent)
    } catch {
      continue
    }
    const [field, op, ...brutos] = partes
    const campo = fields.find((f) => f.id === field)
    if (!campo || vistos.has(field)) continue
    const ops = OPERADORES[campo.type]
    const operator = ops.includes(op as FilterOperator) ? (op as FilterOperator) : ops[0]
    const values = normalizar(campo, operator, brutos)
    if (!values) continue
    vistos.add(field)
    lidos.push({ field, operator, values })
  }
  return lidos
}

type Descricao = {
  operador: string
  rotulo: string
  falado: string
  resto: number
  media?: React.ReactNode
}

function descrever(
  campo: FilterField,
  f: Pick<FilterValue, "operator" | "values">,
  opcao: (valor: string) => FilterOption | undefined
): Descricao {
  switch (campo.type) {
    case "enum": {
      const achadas = f.values.map(opcao)
      const nomes = f.values.map((v, i) => achadas[i]?.label ?? v)
      return {
        operador: rotuloOperador(f.operator),
        rotulo: nomes[0] ?? "",
        falado: nomes.join(", "),
        resto: Math.max(0, nomes.length - 1),
        media: achadas[0]?.media,
      }
    }
    case "period": {
      const atalho =
        f.values.length === 1 ? FILTER_PERIOD_PRESETS.find((p) => p.id === f.values[0]) : undefined
      if (atalho) return { operador: "é", rotulo: atalho.label, falado: atalho.label, resto: 0 }
      const [de, ate] = f.values
      if (!de) return { operador: "é", rotulo: "", falado: "", resto: 0 }
      return { ...periodLabel(de, ate), resto: 0 }
    }
    case "money": {
      const [a, b] = f.values.map(Number)
      const texto =
        f.operator === "between" ? `${brlCurto(a)} – ${brlCurto(b).replace(/^R\$\s/, "")}` : brlCurto(a)
      const falado = f.operator === "between" ? `${currencyBRL(a)} a ${currencyBRL(b)}` : currencyBRL(a)
      return { operador: rotuloOperador(f.operator), rotulo: texto, falado, resto: 0 }
    }
    case "text":
      return {
        operador: "contém",
        rotulo: `“${f.values[0] ?? ""}”`,
        falado: f.values[0] ?? "",
        resto: 0,
      }
    case "boolean":
      return { operador: "", rotulo: "", falado: "", resto: 0 }
  }
}

/** O valor de um filtro como a lista "Filtrar por…" o mostra: o rótulo do token, com "+N" se há mais. */
export function valorNaLista(
  campo: FilterField,
  f: Pick<FilterValue, "operator" | "values">,
  opcao: (valor: string) => FilterOption | undefined
): string {
  if (campo.type === "boolean") return "Ligado"
  const d = descrever(campo, f, opcao)
  const base = campo.type === "text" ? d.falado : d.rotulo
  return d.resto > 0 ? `${base} +${d.resto}` : base
}

/* ── As classes, por extenso ────────────────────────────────────────────
 * O Tailwind lê o fonte como texto: uma classe montada num template não chega
 * ao CSS. Constantes da superfície primeiro, degrau depois (o `twMerge`
 * resolve o corpo de texto pelo grupo `font-size`). */

/**
 * A cápsula: a superfície de campo, e o fio entre os segmentos. O fio é o texto
 * a 14% e não o `--input` do contorno (que dava 1,12:1 no escuro e 1,16 no
 * claro, sem separar os segmentos): a 14% dá 1,54 e 1,36, um valor só nos dois
 * temas, de propósito mais forte que o contorno porque é ele que parte a cápsula.
 */
const CAPSULA_TOM: Record<FilterBarTone, string> = {
  neutral: cn(fieldSurfaceClassName, "divide-x divide-foreground/14"),
  success: cn(
    fieldSurfaceClassName,
    tagChipSuccess,
    "border-transparent divide-x divide-success-muted-foreground/20"
  ),
}

const CAPSULA_TAMANHO: Record<FilterBarSize, string> = {
  sm: "text-control-sm md:text-control-sm",
  md: "text-sm",
  lg: "text-sm",
}

/**
 * O segmento. Sem `overflow-hidden` na cápsula: o anel de foco é de cada
 * segmento e o recorte o cortaria. No dedo cada segmento tem 40 × 40 (pelo
 * menos 40 de largura) e o alvo atravessa a borda de 1px por pseudo-elemento.
 */
const SEGMENTO =
  "relative flex min-w-0 items-center whitespace-nowrap outline-none transition-colors first:rounded-s-full last:rounded-e-full focus-visible:z-10 focus-visible:ring-3 focus-visible:ring-ring/45 disabled:pointer-events-none disabled:opacity-50 pointer-coarse:min-w-10 pointer-coarse:after:absolute pointer-coarse:after:inset-x-0 pointer-coarse:after:-inset-y-px pointer-coarse:after:content-['']"

// No telefone o recuo desce a 8px: é o que faz "Categoria · é ·
// Mercado +1" caber inteiro num iPhone de 375px empilhado.
const SEGMENTO_TAMANHO: Record<FilterBarSize, string> = {
  sm: "px-2",
  md: "px-2.5 @max-md/filter-bar:px-2",
  lg: "px-3 @max-md/filter-bar:px-2",
}

const REMOVER_TAMANHO: Record<FilterBarSize, string> = {
  sm: "px-1.5",
  md: "px-2",
  lg: "px-2.5",
}

/** O realce do segmento, com o par do toque e o aberto. */
const SEGMENTO_TOM: Record<FilterBarTone, string> = {
  neutral: "hover:bg-input-fill active:bg-input-fill aria-expanded:bg-input-fill",
  success:
    "hover:bg-success-muted-foreground/10 active:bg-success-muted-foreground/10 aria-expanded:bg-success-muted-foreground/10",
}

/** O que fala baixo: o operador, o "+N", o "Selecionar…", o ×. */
const APAGADO_TOM: Record<FilterBarTone, string> = {
  neutral: "text-muted-foreground",
  success: "text-success-muted-foreground/80",
}

/** O × acende para a tinta cheia no cursor e no toque. */
const REMOVER_TOM: Record<FilterBarTone, string> = {
  neutral: "hover:text-foreground active:text-foreground",
  success: "hover:text-success-muted-foreground active:text-success-muted-foreground",
}

/** O miolo do segmento fica **sobre** o flash (que é absoluto). */
const MIOLO = "relative flex min-w-0 items-center"

// O degrau manda no corpo do que vai no segmento: o `ColorTile xs` (24) sobrava
// 2px num token `sm` de 28, e aqui desce a 20 com o canto a 6px (a proporção do `xs`).
const MIOLO_TAMANHO: Record<FilterBarSize, string> = {
  sm: "gap-1 [&>svg]:size-3.5 [&_[data-slot=color-tile]]:size-5 [&_[data-slot=color-tile]]:rounded-sm",
  md: "gap-1.5 [&>svg]:size-4",
  lg: "gap-1.5 [&>svg]:size-4",
}

/**
 * Abaixo de 28rem da própria barra (container query, nunca a janela). `stack` é
 * uma grade de colunas alinhadas (campo · operador · valor · ×): cada token herda
 * as quatro colunas por `subgrid`, para os operadores e valores de todas as
 * linhas começarem no mesmo x. O vão entre colunas é zero porque a `subgrid`
 * herda o da grade e abriria um buraco entre os segmentos.
 */
const LINHA_TELEFONE: Record<FilterBarMobile, string> = {
  scroll:
    "@max-md/filter-bar:flex-nowrap @max-md/filter-bar:overflow-x-auto @max-md/filter-bar:-mx-1 @max-md/filter-bar:px-1 @max-md/filter-bar:-my-1 @max-md/filter-bar:py-1",
  stack:
    "@max-md/filter-bar:grid @max-md/filter-bar:grid-cols-[auto_auto_minmax(0,1fr)_auto] @max-md/filter-bar:gap-x-0 @max-md/filter-bar:gap-y-1.5",
}

// Na faixa que rola o token tem a largura dele (`max-w-full` truncaria o valor).
// No empilhado, o token que sai é tirado do fluxo (`data-motion-pop-id`, do
// `popLayout`) e deixa de ser item da grade; ele declara as colunas enquanto se
// dissolve, e surge de cima, de onde estava o "+ Filtro".
const TOKEN_TELEFONE: Record<FilterBarMobile, string> = {
  scroll: "@max-md/filter-bar:shrink-0 @max-md/filter-bar:max-w-none",
  stack:
    "@max-md/filter-bar:col-span-full @max-md/filter-bar:grid @max-md/filter-bar:grid-cols-subgrid @max-md/filter-bar:[&[data-motion-pop-id]]:grid-cols-[auto_auto_minmax(0,1fr)_auto] @max-md/filter-bar:origin-top",
}

/** Na grade alinhada os rótulos já formam a coluna do campo, e o ícone custava 22px ao valor ("Mercado" cortava a 375px). */
const CAMPO_ICONE_TELEFONE: Record<FilterBarMobile, string> = {
  scroll: "",
  stack: "@max-md/filter-bar:[&>svg]:hidden",
}

/** O filtro sem valor não tem operador nem valor: o campo ocupa as três colunas. */
const CAMPO_SOZINHO_TELEFONE: Record<FilterBarMobile, string> = {
  scroll: "",
  stack: "@max-md/filter-bar:col-span-3",
}

const ROTULO_TELEFONE: Record<FilterBarMobile, string> = {
  scroll: "",
  stack: "@max-md/filter-bar:max-w-none",
}

/** O E/OU numa linha própria, no começo da grade. */
const MATCH_TELEFONE: Record<FilterBarMobile, string> = {
  scroll: "",
  stack: "@max-md/filter-bar:col-span-full @max-md/filter-bar:justify-self-start",
}

/** As ações atravessam a grade: "+ Filtro" na coluna do campo, "Limpar" na ponta dos ×; um respiro a mais (6 + 4) separa o grupo dos filtros do das ações. */
const ACOES_TELEFONE: Record<FilterBarMobile, string> = {
  scroll: "",
  stack:
    "@max-md/filter-bar:col-span-full @max-md/filter-bar:mt-1 @max-md/filter-bar:justify-between",
}

/** O flash do segmento que acabou de mudar — a `@utility table-flash` da casa. */
/** O menor token encolhido na linha `menu`, em rem. */
const PISO_ENCOLHIDO_REM = 7
/** O menor pedaço do valor que fica à vista num token encolhido, em rem. */
const PISO_VALOR_REM = 3

const FLASH = "pointer-events-none absolute inset-0 rounded-[inherit]"

/**
 * O token surge e se dissolve; quem abre e fecha o espaço são os vizinhos,
 * deslizando na mola (`layout="position"`), inclusive de uma linha para outra.
 * Animar a largura não serve (a mola passava do alvo e a pílula inchava). A
 * escala anda na mola; opacidade e desfoque numa curva (`--duration-base`,
 * `--ease-out`), porque mola em desfoque passa de zero. A saída é curva, sem
 * mola. O E/OU e o "Limpar" usam o mesmo caminho.
 */
const CURVA = [0.16, 1, 0.3, 1] as const
const SURGIR = {
  initial: { opacity: 0, scale: 0.9, filter: "blur(4px)" },
  animate: { opacity: 1, scale: 1, filter: "blur(0px)", transitionEnd: { filter: "none" } },
  exit: {
    opacity: 0,
    scale: 0.9,
    filter: "blur(4px)",
    transition: { duration: 0.15, ease: CURVA },
  },
  transition: {
    scale: MOLA,
    layout: MOLA,
    opacity: { duration: 0.2, ease: CURVA },
    filter: { duration: 0.2, ease: CURVA },
  },
}
/** Com movimento reduzido: aparece e some, sem escala, desfoque nem deslize. */
const SURGIR_REDUZIDO = { initial: false, exit: { opacity: 0, transition: { duration: 0 } } } as const

/** Conta as trocas de um texto (o padrão "ajustar estado quando a prop muda" do `TableCellMoney`): a sobreposição remonta pela contagem e pisca; o botão nunca remonta, senão perderia o foco. */
function useTrocas(texto: string) {
  const [antes, setAntes] = React.useState(texto)
  const [trocas, setTrocas] = React.useState(0)
  if (antes !== texto) {
    setAntes(texto)
    setTrocas((n) => n + 1)
  }
  return trocas
}

/** O teto da lista na gaveta: o do `Command` (288) é do popover e mostrava cinco dos oito campos; 55% da altura (até 480) mostra os oito num iPhone de 815. */
// A linha do menu é concêntrica à placa (22 − 8 = 14, a do `DropdownMenu` e da paleta), não à gaveta (28 − 16 = 12).
const LISTA_NA_GAVETA = "[--command-list-max-h:min(55dvh,--spacing(120))] [--radius-parent:var(--radius-surface)] [--radius-inset:--spacing(2)]"

/** No dedo, só a lista e os editores do popover não focam ao abrir (o teclado cobriria a lista); na gaveta, Descrição e Valor focam. */
const noDedo = () =>
  typeof window !== "undefined" && window.matchMedia?.("(pointer: coarse)").matches

type Token = FilterValue & { rascunho: boolean }
// `existia`: o token já era um filtro quando o editor abriu (e não um rascunho).
type Aberto = { tipo: "campos" } | { tipo: "valor"; field: string; existia: boolean } | null
type Ancora = { getBoundingClientRect: () => DOMRect; contextElement?: Element }

type FilterBarProps = Omit<React.ComponentProps<"div">, "defaultValue" | "onChange"> & {
  fields: FilterField[]
  value?: FilterValue[]
  defaultValue?: FilterValue[]
  onValueChange?: (value: FilterValue[]) => void
  /** E (todos) ou OU (qualquer um). A pílula só aparece com `onMatchChange` e dois filtros. */
  match?: FilterMatch
  defaultMatch?: FilterMatch
  onMatchChange?: (match: FilterMatch) => void
  /** Quantos itens a lista mostra — "8 de 42 lançamentos", numa região viva. */
  count?: number
  total?: number
  /** Singular e plural. */
  noun?: [string, string]
  /** A escada: sm 28 · md 32 · lg 36 (40 no dedo). Dentro de uma `Toolbar`, o degrau dela. */
  size?: FilterBarSize
  /** `neutral` é a superfície de campo; `success`, o verde das fichas de filtro. */
  tone?: FilterBarTone
  /** Abaixo de 28rem da própria barra: uma faixa que rola, ou um token por linha. */
  mobile?: FilterBarMobile
  /**
   * `wrap` (o padrão) quebra a fileira; `menu` é uma linha só, em qualquer
   * largura, que não rola: os tokens que não cabem saem do fim para o "+N", e
   * "+ Filtro", "Limpar" e a contagem ficam fixos. Para a linha com vizinhos
   * fixos, cuja altura não pode mudar. Com `menu`, `mobile` não vale.
   */
  overflow?: "wrap" | "menu"
  /** Grava os filtros na URL (`?f=…`), e o voltar desfaz o último. */
  urlParam?: string
  /** A tecla que abre o "+ Filtro". `false` desliga. */
  shortcut?: string | false
  disabled?: boolean
}

/**
 * Quais tokens saem para o "+N" na linha `menu`: do fim, pulando o `fixo` (o
 * do editor aberto), até caber com a `reserva` do "+N".
 */
export function tokensQueSaem(
  larguras: number[],
  cabe: number,
  { fixo, reserva, gap }: { fixo?: number; reserva: number; gap: number }
): number[] {
  return quemSai(larguras, cabe, { ponta: "fim", fixos: new Set(fixo == null ? [] : [fixo]), reserva, gap })
}

/**
 * A linha `menu` mostra o máximo que cabe: depois de `tokensQueSaem`, o primeiro
 * que saiu volta encolhido (o valor em reticências) se a sobra chega ao piso
 * dele (`pisos[i]`: o menor que o token `i` fica; sem valor, a largura inteira).
 * Se só um sairia, encolher um token (ele, ou o mais largo) para tudo caber
 * vence o "+1".
 */
export function excessoDaLinha(
  larguras: number[],
  cabe: number,
  { fixo, reserva, gap, pisos }: { fixo?: number; reserva: number; gap: number; pisos: number[] }
): { saem: number[]; encolhe?: { indice: number; largura: number } } {
  const saem = tokensQueSaem(larguras, cabe, { fixo, reserva, gap })
  if (saem.length === 0) return { saem }
  const soma = (idx: number[]) =>
    idx.reduce((s, i) => s + larguras[i], 0) + gap * Math.max(0, idx.length - 1)
  const todos = larguras.map((_, i) => i)
  if (saem.length === 1) {
    const excesso = soma(todos) - cabe
    const candidatos = [saem[0], ...todos.filter((i) => i !== fixo).sort((a, b) => larguras[b] - larguras[a])]
    const k = candidatos.find((i) => larguras[i] - excesso >= pisos[i])
    if (k != null) return { saem: [], encolhe: { indice: k, largura: larguras[k] - excesso } }
  }
  const j = Math.min(...saem)
  const ficam = todos.filter((i) => !saem.includes(i))
  const restam = saem.length - 1
  const sobra = cabe - soma(ficam) - (ficam.length ? gap : 0) - (restam ? gap + reserva : 0)
  if (sobra < pisos[j]) return { saem }
  return { saem: saem.filter((i) => i !== j), encolhe: { indice: j, largura: sobra } }
}

/**
 * O que, mudando, faz a linha `menu` remedir. Com o editor de um token aberto
 * (`fixo`), só a lista: digitar não muda quem está no "+N" debaixo do editor.
 */
export function chaveDaMedida(
  tokens: Pick<FilterValue, "field" | "operator" | "values">[],
  fixo?: string
): string {
  return tokens.map((t) => (fixo ? t.field : `${t.field}:${t.operator}:${t.values.join(",")}`)).join("|")
}

function FilterBar({
  fields,
  value: valueProp,
  defaultValue,
  onValueChange,
  match: matchProp,
  defaultMatch = "all",
  onMatchChange,
  count,
  total,
  noun = ["resultado", "resultados"],
  size: sizeProp,
  tone = "neutral",
  mobile: mobileProp = "scroll",
  overflow = "wrap",
  urlParam,
  shortcut = "f",
  disabled = false,
  className,
  "aria-label": ariaLabel = "Filtros",
  ...props
}: FilterBarProps) {
  const menu = overflow === "menu"
  const numero = count == null ? "" : total != null ? `${numberBR(count)} de ${numberBR(total)}` : numberBR(count)
  const nome = (total ?? count) === 1 ? noun[0] : noun[1]
  // A linha do menu já é a forma do telefone: a grade empilhada não se aplica nela.
  const mobile: FilterBarMobile = menu ? "scroll" : mobileProp
  const doGrupo = React.useContext(ButtonSizeContext)
  const size: FilterBarSize = sizeProp ?? (doGrupo === "sm" || doGrupo === "md" ? doGrupo : "lg")

  const [interno, setInterno] = React.useState<FilterValue[]>(defaultValue ?? [])
  const valores = valueProp ?? interno
  const emitir = (proximo: FilterValue[]) => {
    if (valueProp === undefined) setInterno(proximo)
    onValueChange?.(proximo)
  }
  const [matchInterno, setMatchInterno] = React.useState<FilterMatch>(defaultMatch)
  const match = matchProp ?? matchInterno
  const emitirMatch = (proximo: FilterMatch) => {
    if (matchProp === undefined) setMatchInterno(proximo)
    onMatchChange?.(proximo)
  }

  // O rascunho guarda o que já foi digitado (trocar para "entre" abre o editor
  // com o "De" preenchido); `anterior` é o filtro que a troca de operador
  // desfez, e fechar sem completar o devolve.
  const [rascunho, setRascunho] = React.useState<{
    field: string
    operator: FilterOperator
    index: number
    values: string[]
    anterior?: FilterValue
  } | null>(null)
  const [aberto, setAberto] = React.useState<Aberto>(null)
  const [conhecidas, setConhecidas] = React.useState<Record<string, Record<string, FilterOption>>>({})

  const porId = React.useMemo(() => new Map(fields.map((f) => [f.id, f])), [fields])
  const opcaoDe = (campo: FilterField, v: string) =>
    campo.type === "enum"
      ? (campo.options?.find((o) => o.value === v) ?? conhecidas[campo.id]?.[v])
      : undefined

  const tokens: Token[] = React.useMemo(() => {
    const lista: Token[] = valores
      .filter((v) => porId.has(v.field))
      .map((v) => ({ ...v, rascunho: false }))
    if (rascunho && porId.has(rascunho.field) && !lista.some((t) => t.field === rascunho.field)) {
      lista.splice(Math.min(rascunho.index, lista.length), 0, {
        field: rascunho.field,
        operator: rascunho.operator,
        values: rascunho.values,
        rascunho: true,
      })
    }
    return lista
  }, [valores, rascunho, porId])

  const conteudoId = React.useId()
  const linhaRef = React.useRef<HTMLDivElement | null>(null)
  // O `role="toolbar"`: a fileira no `wrap`; no menu, o invólucro dela com as ações.
  const barraRef = React.useRef<HTMLDivElement | null>(null)
  const addRef = React.useRef<HTMLButtonElement | null>(null)
  const dissolver = useScrollFade({ axis: "x" })
  // O `popLayout` põe a regra que tira do fluxo o que sai no `<head>` do
  // documento de quem roda o script; no iframe do catálogo ela tem de ir ao
  // `<head>` do documento da barra, senão não vale lá dentro.
  const [cabeca, setCabeca] = React.useState<HTMLElement>()
  const refLinha = React.useCallback(
    (el: HTMLDivElement | null) => {
      linhaRef.current = el
      if (!menu) barraRef.current = el
      if (el) setCabeca(el.ownerDocument.head)
      // No menu nada rola: não há borda a dissolver.
      return menu ? undefined : dissolver(el)
    },
    [dissolver, menu]
  )
  const reduzir = useReducedMotion()
  const surgir = reduzir ? SURGIR_REDUZIDO : SURGIR
  const deslizar = reduzir ? undefined : "position"
  useToolbarKeyboard(barraRef, !disabled)

  /* ── Foco ────────────────────────────────────────────────────────────── */

  // Para onde o foco volta quando o editor fecha: quem o abriu, ou o vizinho
  // de um token removido. `"add"` é o "+ Filtro".
  const focoDepois = React.useRef<string>("add")
  // Fechou por um clique fora: o foco fica onde a pessoa clicou.
  const clicouFora = React.useRef(false)

  // O foco não rola a faixa: enquanto desliza, o vizinho ainda está onde
  // estava e o navegador rolaria até lá. Quem rola é a caixa de destino do
  // layout (`offsetLeft`), que o deslize não mexe.
  const focar = (alvo: HTMLElement | null | undefined) => {
    if (!alvo) return
    alvo.focus({ preventScroll: true })
    const linha = linhaRef.current
    if (!linha || linha.scrollWidth <= linha.clientWidth) return
    // Sem `instanceof HTMLElement`: no iframe do catálogo o nó é de outra
    // janela, e o teste falha.
    let ini = 0
    let n = alvo as HTMLElement | null
    while (n && n !== linha) {
      ini += n.offsetLeft
      n = n.offsetParent as HTMLElement | null
    }
    if (n !== linha) return
    const fim = ini + alvo.offsetWidth
    const folga = parseFloat(getComputedStyle(linha).scrollPaddingInlineStart) || 0
    const left =
      ini < linha.scrollLeft + folga ? ini - folga
      : fim > linha.scrollLeft + linha.clientWidth - folga ? fim - linha.clientWidth + folga
      : null
    if (left !== null) linha.scrollTo({ left, behavior: reduzir ? "auto" : "smooth" })
  }

  // Na gaveta a lista tem o "Filtros" visível como título; um label aqui seria um segundo título.
  const listaNaGaveta = useIsMobile()

  const focarDestino = () => {
    const destino = focoDepois.current
    const token =
      destino !== "add"
        ? linhaRef.current?.querySelector<HTMLElement>(
            `[data-slot=filter-bar-token][data-field="${CSS.escape(destino)}"]:not([inert])`
          )
        : null
    // O token que saiu para o "+N" devolve o foco ao "+N".
    const el = token?.hasAttribute("hidden")
      ? linhaRef.current?.querySelector<HTMLElement>("[data-overflow-more]")
      : token?.querySelector<HTMLElement>("[data-slot=filter-bar-value],[data-slot=filter-bar-remove]")
    focar(el ?? addRef.current)
  }

  /* ── O editor ─────────────────────────────────────────────────────────── */

  const sessao = React.useRef<"push" | "replace">("push")
  /** Devolve o filtro que uma troca de operador desfez. */
  const devolverAnterior = () => {
    if (!rascunho?.anterior) return
    const lista = [...valores]
    lista.splice(Math.min(rascunho.index, lista.length), 0, rascunho.anterior)
    emitir(lista)
  }
  const fechar = (devolver = true) => {
    if (devolver) devolverAnterior()
    setAberto(null)
    setRascunho(null)
    sessao.current = "push"
  }
  // Só na gaveta: volta à lista sem fechar (fechar e reabrir desceria e subiria a
  // gaveta), e o rascunho sai como no `fechar`, sem filtro vazio na URL.
  const voltar = () => {
    devolverAnterior()
    setAberto({ tipo: "campos" })
    setRascunho(null)
    sessao.current = "push"
  }

  const abrirValor = (field: string) => {
    if (aberto?.tipo === "valor" && aberto.field === field) return fechar()
    focoDepois.current = field
    clicouFora.current = false
    setAberto({ tipo: "valor", field, existia: tokens.some((t) => t.field === field && !t.rascunho) })
  }

  const abrirCampos = () => {
    if (aberto?.tipo === "campos") return fechar()
    focoDepois.current = "add"
    clicouFora.current = false
    // O rascunho de outro token sai (e devolve o filtro que uma troca desfez).
    if (rascunho) fechar()
    setAberto({ tipo: "campos" })
  }

  /** Grava o que o editor mandou; incompleto, o token vira rascunho no mesmo lugar. */
  const gravar = (
    field: string,
    operator: FilterOperator,
    brutos: string[],
    { guardar = false }: { guardar?: boolean } = {}
  ) => {
    const campo = porId.get(field)
    if (!campo) return
    const values = normalizar(campo, operator, brutos)
    const i = valores.findIndex((v) => v.field === field)
    const lugar = i >= 0 ? i : rascunho?.field === field ? rascunho.index : valores.length
    if (values) {
      const lista = valores.filter((v) => v.field !== field)
      lista.splice(Math.min(lugar, lista.length), 0, { field, operator, values })
      if (rascunho?.field === field) setRascunho(null)
      emitir(lista)
      return
    }
    const anterior = i >= 0 ? (guardar ? valores[i] : undefined) : rascunho?.field === field ? rascunho.anterior : undefined
    setRascunho({ field, operator, index: lugar, values: brutos, anterior })
    if (i >= 0) emitir(valores.filter((v) => v.field !== field))
  }

  const escolherCampo = (campo: FilterField) => {
    if (tokens.some((t) => t.field === campo.id)) return abrirValor(campo.id)
    if (campo.type === "boolean") {
      focoDepois.current = campo.id
      emitir([...valores, { field: campo.id, operator: "is", values: [] }])
      fechar(false)
      return
    }
    setRascunho({ field: campo.id, operator: OPERADORES[campo.type][0], index: valores.length, values: [] })
    focoDepois.current = campo.id
    setAberto({ tipo: "valor", field: campo.id, existia: false })
  }

  /** O operador trocado no token. Se ele deixa o filtro incompleto, o editor abre. */
  const trocarOperador = (field: string, op: FilterOperator) => {
    const t = tokens.find((x) => x.field === field)
    const campo = porId.get(field)
    if (!t || !campo) return
    // No dinheiro as pontas atravessam a troca: o mínimo continua mínimo.
    const [a, b] = t.values
    const min = usaMaximo(t.operator) ? undefined : a
    const max = t.operator === "between" ? b : usaMaximo(t.operator) ? a : undefined
    const values =
      campo.type !== "money" ? t.values
      : op === "between" ? [min ?? "", max ?? ""]
      : usaMaximo(op) ? [max ?? min ?? ""]
      : [min ?? max ?? ""]
    gravar(field, op, values, { guardar: true })
    if (!normalizar(campo, op, values)) {
      focoDepois.current = field
      setAberto({ tipo: "valor", field, existia: !t.rascunho })
    }
  }

  const remover = (field: string) => {
    const ordem = tokens.map((t) => t.field)
    const i = ordem.indexOf(field)
    focoDepois.current = ordem[i + 1] ?? ordem[i - 1] ?? "add"
    if (rascunho?.field === field) setRascunho(null)
    emitir(valores.filter((v) => v.field !== field))
    if (aberto) {
      clicouFora.current = false
      fechar(false)
    } else {
      requestAnimationFrame(focarDestino)
    }
  }

  const limpar = () => {
    focoDepois.current = "add"
    setRascunho(null)
    emitir([])
    if (aberto) fechar(false)
    requestAnimationFrame(() => focar(addRef.current))
  }

  const conhecer = (field: string, o: FilterOption) =>
    setConhecidas((c) => ({ ...c, [field]: { ...c[field], [o.value]: o } }))

  // A âncora segue o que está aberto. Um objeto novo a cada troca: o `Popper`
  // do Radix relê o `virtualRef` no efeito dele (passivo, depois deste), e o
  // `contextElement` deixa o `autoUpdate` acompanhar o token enquanto ele cresce.
  const ancoraRef = React.useRef<Ancora>({ getBoundingClientRect: () => new DOMRect() })
  React.useLayoutEffect(() => {
    if (!aberto) return
    const el =
      aberto.tipo === "campos"
        ? addRef.current
        : linhaRef.current?.querySelector<HTMLElement>(
            `[data-slot=filter-bar-token][data-field="${CSS.escape(aberto.field)}"]`
          )
    if (el) ancoraRef.current = { getBoundingClientRect: () => el.getBoundingClientRect(), contextElement: el }
  }, [aberto])

  /* ── Quem sai para o "+N" ─────────────────────────────────────────────── */

  const acoesRef = React.useRef<HTMLDivElement | null>(null)
  // A linha do "+N" abriu o editor: ao fechar o menu, o foco vai ao token (o
  // "+N" pode ter saído, e o foco cairia no `body`).
  const doMenu = React.useRef(false)
  const [fora, setFora] = React.useState<string[]>([])
  const fixo = aberto?.tipo === "valor" ? aberto.field : undefined
  // Quem e o que se mede: muda a lista, um valor (a largura do token) ou o aberto.
  const chaveDaLinha = chaveDaMedida(tokens, fixo)
  React.useLayoutEffect(() => {
    const linha = linhaRef.current
    const barra = barraRef.current
    const acoesEl = acoesRef.current
    if (!menu || !linha || !barra || !acoesEl) return
    // O que está saindo (`inert`, do `AnimatePresence`) já não ocupa lugar.
    const lerTokens = () =>
      [...linha.querySelectorAll<HTMLElement>(":scope > [data-slot=filter-bar-token]:not([inert])")]
    // Antes de medir, cada token volta à largura natural: sem `hidden` e sem teto.
    const soltar = (els: HTMLElement[]) => {
      limparExcesso(els)
      for (const el of els) el.style.maxWidth = ""
    }
    const medir = () => {
      const els = lerTokens()
      soltar(els)
      const gap = parseFloat(getComputedStyle(linha).columnGap) || 0
      const gapBarra = parseFloat(getComputedStyle(barra).columnGap) || 0
      // O E/OU mora na linha e nunca sai: o espaço dos tokens é o que sobra dele.
      const match = linha.querySelector<HTMLElement>(":scope > :not([data-slot=filter-bar-token]):not([data-overflow-more]):not([data-motion-pop-id])")
      const cabe = barra.clientWidth - acoesEl.offsetWidth - gapBarra - (match ? match.offsetWidth + gap : 0)
      // O "+N" é redondo: a largura dele é a altura de um controle.
      const reserva =
        linha.querySelector<HTMLElement>("[data-overflow-more]")?.offsetWidth ?? els[0]?.offsetHeight ?? 0
      const i = els.findIndex((el) => el.dataset.field === fixo)
      // O menor que um token fica: campo, operador e × inteiros e um pedaço do
      // valor, nunca abaixo de 7rem. Sem valor (o booleano), não encolhe.
      const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
      const pisos = els.map((el) => {
        const valor = el.querySelector<HTMLElement>(":scope > [data-slot=filter-bar-value]")
        if (!valor) return el.offsetWidth
        return Math.max(PISO_ENCOLHIDO_REM * rem, el.offsetWidth - valor.offsetWidth + PISO_VALOR_REM * rem)
      })
      const { saem: idx, encolhe } = excessoDaLinha(
        els.map((el) => el.offsetWidth),
        cabe,
        { fixo: i >= 0 ? i : undefined, reserva, gap, pisos }
      )
      if (encolhe) els[encolhe.indice].style.maxWidth = `${Math.floor(encolhe.largura)}px`
      const saem = idx.map((k) => {
        els[k].setAttribute("hidden", "")
        return els[k].dataset.field ?? ""
      })
      setFora((v) => (v.length === saem.length && v.every((f, k) => f === saem[k]) ? v : saem))
    }
    medir()
    // A barra (a janela, a contagem) e cada token (o rótulo que chega depois).
    // Com o editor aberto, o token que cresce digitando não remede: só a barra.
    const ro = new ResizeObserver(medir)
    ro.observe(barra)
    ro.observe(acoesEl)
    if (!fixo) for (const el of lerTokens()) ro.observe(el)
    return () => {
      ro.disconnect()
      soltar(lerTokens())
    }
  }, [menu, fixo, chaveDaLinha])

  const noMenu: ItemNoExcesso[] = menu
    ? fora.flatMap((field) => {
        const t = tokens.find((x) => x.field === field)
        const campo = porId.get(field)
        if (!t || !campo) return []
        // Lida como o token; o filtro sem valor também abre o editor, que tem o Remover.
        const d = descrever(campo, t, (v) => opcaoDe(campo, v))
        return [
          {
            key: field,
            label: campo.type === "boolean" ? campo.label : `${campo.label} ${d.operador} ${d.falado}`,
            onSelect: () => {
              doMenu.current = true
              abrirValor(t.field)
            },
          },
        ]
      })
    : []

  /* ── A tecla F ────────────────────────────────────────────────────────── */

  const abrirCamposRef = React.useRef(abrirCampos)
  React.useEffect(() => {
    abrirCamposRef.current = abrirCampos
  })
  React.useEffect(() => {
    const el = linhaRef.current
    if (!shortcut || disabled || !el) return
    // No documento da barra, e não no `window` de cima: no iframe do catálogo
    // são dois documentos.
    const doc = el.ownerDocument
    const tecla = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.repeat || !matchShortcut(shortcut, e)) return
      if (isEditableTarget(e.target)) return
      const alvo = e.target instanceof Element ? e.target : null
      if (alvo?.closest("[role=menu],[role=dialog],[role=listbox]")) return
      // Escondida por um modal (`inert`, `aria-hidden`) ou fora da tela.
      if (el.closest("[inert],[aria-hidden=true]") || !el.getClientRects().length) return
      e.preventDefault()
      abrirCamposRef.current()
    }
    doc.addEventListener("keydown", tecla)
    return () => doc.removeEventListener("keydown", tecla)
  }, [shortcut, disabled])

  /* ── A URL ────────────────────────────────────────────────────────────── */

  // `visto` é o que já está na URL: nem o que veio dela nem o que o voltar
  // devolveu é escrito de novo. Comparado por referência — e a URL igual é a
  // segunda trava.
  const visto = React.useRef<{ valores: FilterValue[]; match: FilterMatch } | null>(null)
  const abertoRef = React.useRef(aberto)
  React.useEffect(() => {
    abertoRef.current = aberto
  })
  const fieldsRef = React.useRef(fields)
  React.useEffect(() => {
    fieldsRef.current = fields
  })
  const lerDaUrlRef = React.useRef<() => void>(() => {})
  React.useEffect(() => {
    lerDaUrlRef.current = () => {
      if (!urlParam) return
      const p = new URLSearchParams(window.location.search)
      const lidos = parseFilters(p.get(urlParam), fieldsRef.current)
      const lidoMatch: FilterMatch = p.get(`${urlParam}-ou`) === "1" ? "any" : "all"
      visto.current = { valores: lidos, match: lidoMatch }
      setAberto(null)
      setRascunho(null)
      emitir(lidos)
      emitirMatch(lidoMatch)
    }
  })

  // Lida uma vez, depois da hidratação. Sem nada na URL, o estado de fábrica
  // não suja o endereço.
  const urlLida = React.useRef(false)
  React.useEffect(() => {
    if (!urlParam || urlLida.current) return
    urlLida.current = true
    if (new URLSearchParams(window.location.search).has(urlParam)) lerDaUrlRef.current()
    else visto.current = { valores, match }
  }, [urlParam, valores, match])

  React.useEffect(() => {
    if (!urlParam || !urlLida.current) return
    if (visto.current?.valores === valores && visto.current.match === match) return
    visto.current = { valores, match }
    const atual = new URLSearchParams(window.location.search)
    const proximo = mergeParams(atual, {
      [urlParam]: serializeFilters(valores),
      [`${urlParam}-ou`]: match === "any" ? "1" : null,
    })
    if (proximo === atual.toString()) return
    const url = `${window.location.pathname}${proximo ? `?${proximo}` : ""}${window.location.hash}`
    // `null` e não `history.state`: com `null` o Next copia o estado e o
    // `useSearchParams` acompanha. Uma entrada por sessão do editor (o voltar
    // desfaz um filtro, não uma caixa marcada).
    if (sessao.current === "replace") {
      window.history.replaceState(null, "", url)
    } else {
      window.history.pushState(null, "", url)
      if (abertoRef.current) sessao.current = "replace"
    }
  }, [urlParam, valores, match])

  React.useEffect(() => {
    if (!urlParam) return
    const voltar = () => lerDaUrlRef.current()
    window.addEventListener("popstate", voltar)
    return () => window.removeEventListener("popstate", voltar)
  }, [urlParam])

  /* ── O desenho ────────────────────────────────────────────────────────── */

  const completos = valores.filter((v) => porId.has(v.field))
  const campoAberto = aberto?.tipo === "valor" ? porId.get(aberto.field) : undefined
  const tokenAberto =
    aberto?.tipo === "valor" ? tokens.find((t) => t.field === aberto.field) : undefined

  const barraProps = {
    role: "toolbar",
    "aria-label": ariaLabel,
    "aria-orientation": "horizontal",
    "aria-disabled": disabled || undefined,
  } as const

  // `relative`: o "Limpar" que sai é posicionado contra o grupo, que desliza ao
  // mesmo tempo — contra a linha, a transformação do grupo o deslocaria.
  const acoes = (
    <motion.div
      ref={acoesRef}
      layout={deslizar}
      transition={SURGIR.transition}
      className={cn("relative flex shrink-0 items-center gap-1.5", ACOES_TELEFONE[mobile])}
    >
      <Button
        ref={addRef}
        type="button"
        variant="outline"
        data-slot="filter-bar-add"
        disabled={disabled}
        aria-label="Adicionar filtro"
        aria-keyshortcuts={shortcut ? ariaShortcut(shortcut) : undefined}
        aria-haspopup="dialog"
        aria-expanded={aberto?.tipo === "campos"}
        aria-controls={conteudoId}
        className="border-dashed pointer-coarse:h-11"
        onClick={abrirCampos}
      >
        <PlusIcon aria-hidden />
        filtro
      </Button>
      <AnimatePresence initial={false} mode="popLayout" root={cabeca}>
        {completos.length >= 2 ? (
          <motion.div key="limpar" {...surgir} className="flex">
            <Button
              type="button"
              variant="tertiary"
              data-slot="filter-bar-clear"
              disabled={disabled}
              aria-label="Limpar filtros"
              className={cn(
                "pointer-coarse:h-11",
                menu && "@max-md/filter-bar:aspect-square @max-md/filter-bar:px-0"
              )}
              onClick={limpar}
            >
              {/* Na barra estreita o "Limpar" vira só o ×: os tokens precisam da largura. */}
              {menu ? (
                <>
                  <XMarkIcon aria-hidden className="hidden @max-md/filter-bar:block" />
                  <span className="@max-md/filter-bar:hidden">Limpar</span>
                </>
              ) : (
                "limpar"
              )}
            </Button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  )

  // `relative`: o que sai é posicionado contra a linha, e no recorte dela.
  // `layoutScroll`: na faixa do telefone (`mobile="scroll"`) ela é o contêiner
  // que rola, e o deslize descontaria o `scrollLeft`.
  const linha = (
    <motion.div
      ref={refLinha}
      layoutScroll
      {...(menu ? {} : barraProps)}
      data-slot="filter-bar-row"
      className={cn(
        "relative flex min-w-0 items-center gap-1.5 no-scrollbar",
        // No menu ela só encolhe e não rola: o "+ Filtro" segue o último token
        // (ou o "+N"), à esquerda, e a contagem fica na ponta. O recuo de 4 guarda
        // o anel de foco dentro do recorte.
        menu ? "flex-initial flex-nowrap overflow-hidden -mx-1 px-1 -my-1 py-1 empty:hidden" : "flex-1 flex-wrap",
        mobile === "scroll" && !menu && scrollFadeViewportXClassName,
        !menu && LINHA_TELEFONE[mobile]
      )}
    >
      {/* O E/OU e o "Limpar" animam num invólucro e não por
          `motion.create(Button)`: o `Button` junta os `ref`s numa função
          nova a cada render, e isso desmontava o elemento animado no meio
          da saída. */}
      <AnimatePresence initial={false} mode="popLayout" root={cabeca}>
        {onMatchChange && completos.length >= 2 ? (
          <motion.div
            key="match"
            layout={deslizar}
            {...surgir}
            className={cn("flex shrink-0", MATCH_TELEFONE[mobile])}
          >
            <Button
              type="button"
              variant="outline"
              data-slot="filter-bar-match"
              disabled={disabled}
              aria-label={
                match === "all"
                  ? "Combinar filtros: todos (E). Trocar para qualquer um (OU)."
                  : "Combinar filtros: qualquer um (OU). Trocar para todos (E)."
              }
              className="px-2.5 text-2xs font-semibold tracking-wider uppercase pointer-coarse:h-11 pointer-coarse:min-w-10"
              onClick={() => emitirMatch(match === "all" ? "any" : "all")}
            >
              {match === "all" ? "e" : "ou"}
            </Button>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence initial={false} mode="popLayout" root={cabeca}>
        {tokens.map((t) => {
          const campo = porId.get(t.field)!
          return (
            <FilterToken
              key={t.field}
              campo={campo}
              token={t}
              descricao={descrever(campo, t, (v) => opcaoDe(campo, v))}
              size={size}
              tone={tone}
              mobile={mobile}
              menu={menu}
              disabled={disabled}
              aberto={aberto?.tipo === "valor" && aberto.field === t.field}
              conteudoId={conteudoId}
              onAbrir={() => abrirValor(t.field)}
              onOperador={(op) => trocarOperador(t.field, op)}
              onOperadorAberto={() => {
                if (aberto) fechar()
              }}
              onRemover={() => remover(t.field)}
            />
          )
        })}
      </AnimatePresence>

      {noMenu.length ? (
        <OverflowMenu
          items={noMenu}
          label={`Mais ${fora.length} ${fora.length === 1 ? "filtro" : "filtros"}`}
          trigger={`+${fora.length}`}
          align="start"
          size={size === "sm" ? "icon-sm" : size === "md" ? "icon-md" : "icon-lg"}
          triggerClassName="shrink-0 nums"
          onCloseAutoFocus={(e) => {
            if (!doMenu.current) return
            doMenu.current = false
            // O editor pode já ter o foco (o campo de texto): não o roube. Sem dono, vai ao token.
            e.preventDefault()
            const doc = linhaRef.current?.ownerDocument
            if (!doc?.activeElement || doc.activeElement === doc.body) focarDestino()
          }}
        />
      ) : null}

      {!menu && acoes}
    </motion.div>
  )

  return (
    <div
      data-slot="filter-bar"
      data-size={size}
      data-tone={tone}
      data-mobile={mobile}
      data-overflow={menu ? "menu" : undefined}
      className={cn("@container/filter-bar min-w-0", className)}
      {...props}
    >
      {/* `layoutRoot`: o deslize dos tokens, das ações e da contagem é medido contra a
          barra, e não contra a página. Sem ele, um aviso que some acima dela movia a
          barra inteira, e o "+ Filtro" atravessava a distância na mola enquanto as
          abas ao lado pulavam. */}
      <motion.div
        layoutRoot
        className={cn(
          "flex items-center gap-3",
          !menu && "@max-md/filter-bar:flex-col @max-md/filter-bar:items-stretch @max-md/filter-bar:gap-2"
        )}
      >
        <ButtonSizeContext.Provider value={size}>
          {menu ? (
            <div ref={barraRef} {...barraProps} className="flex min-w-0 flex-1 items-center gap-1.5">
              {linha}
              {acoes}
            </div>
          ) : (
            linha
          )}
        </ButtonSizeContext.Provider>

        {count != null ? (
          <motion.span
            role="status"
            data-slot="filter-bar-count"
            layout={deslizar}
            transition={SURGIR.transition}
            className="ms-auto shrink-0 text-sm whitespace-nowrap text-muted-foreground nums @max-md/filter-bar:ms-0"
          >
            {/* Na barra estreita o nome sai da vista, e o leitor de tela ainda ouve "48 lançamentos". */}
            {menu ? (
              <>
                {numero}
                <span className="@max-md/filter-bar:sr-only">{` ${nome}`}</span>
              </>
            ) : (
              `${numero} ${nome}`
            )}
          </motion.span>
        ) : null}
      </motion.div>

      <Popover
        mobile="sheet"
        open={aberto !== null}
        onOpenChange={(abrir) => {
          if (!abrir) fechar()
        }}
      >
        <PopoverAnchor virtualRef={ancoraRef} />
        <PopoverContent
          id={conteudoId}
          // Um atributo próprio, e não `data-slot`: o `data-slot="popover-content"`
          // é o que o `Calendar` (e quem mais procura o popover) lê para não
          // pintar fundo — sobrescrito, o calendário saía num bloco opaco.
          data-filter-bar="editor"
          align="start"
          padding="none"
          // A lista é `lg` (352): a contagem por opção e o rodapé com as teclas não cabem em 288.
          size={
            aberto?.tipo === "campos" ? "sm"
            : campoAberto?.type === "period" || campoAberto?.type === "money" ? "auto"
            : campoAberto?.type === "enum" ? "lg"
            : "md"
          }
          label={aberto?.tipo === "campos" && !listaNaGaveta ? "Adicionar filtro" : undefined}
          onOpenAutoFocus={(e) => e.preventDefault()}
          onInteractOutside={(e) => {
            // Um clique num token ou no "+ Filtro" não dispensa, troca o editor;
            // o resto (o vão da linha, a contagem, a página) fecha.
            const alvo = e.target as Element | null
            if (
              barraRef.current?.contains(alvo) &&
              alvo?.closest("[data-slot=filter-bar-token], [data-slot=filter-bar-add], [data-overflow-more]")
            ) {
              e.preventDefault()
            } else clicouFora.current = true
          }}
          onCloseAutoFocus={(e) => {
            e.preventDefault()
            if (!clicouFora.current) focarDestino()
          }}
        >
          {aberto?.tipo === "campos" ? (
            <ListaDeCampos
              fields={fields}
              usados={tokens.map((t) => t.field)}
              valorDe={(id) => {
                const campo = fields.find((x) => x.id === id)
                const t = tokens.find((x) => x.field === id)
                return campo && t && !t.rascunho ? valorNaLista(campo, t, (v) => opcaoDe(campo, v)) : undefined
              }}
              onLimparTudo={() => {
                setRascunho(null)
                emitir([])
              }}
              verLabel={rotuloVerResultados(count, noun)}
              onVer={fechar}
              onEscolher={escolherCampo}
            />
          ) : campoAberto && tokenAberto ? (
            <EditorDeValor
              key={campoAberto.id}
              campo={campoAberto}
              operador={tokenAberto.operator}
              valores={tokenAberto.values}
              opcao={(v) => opcaoDe(campoAberto, v)}
              onGravar={(op, v) => gravar(campoAberto.id, op, v)}
              onConhecer={(o) => conhecer(campoAberto.id, o)}
              onRemover={() => remover(campoAberto.id)}
              onConcluir={fechar}
              existia={aberto?.tipo === "valor" && aberto.existia}
              onVoltar={voltar}
            />
          ) : null}
        </PopoverContent>
      </Popover>
    </div>
  )
}

/* ── O token ─────────────────────────────────────────────────────────── */

function FilterToken({
  campo,
  token,
  descricao,
  size,
  tone,
  mobile,
  menu,
  disabled,
  aberto,
  conteudoId,
  onAbrir,
  onOperador,
  onOperadorAberto,
  onRemover,
  ref,
}: {
  /** O `popLayout` mede o token pelo `ref` que o `AnimatePresence` injeta. */
  ref?: React.Ref<HTMLDivElement>
  campo: FilterField
  token: Token
  descricao: Descricao
  size: FilterBarSize
  tone: FilterBarTone
  mobile: FilterBarMobile
  menu: boolean
  disabled: boolean
  aberto: boolean
  conteudoId: string
  onAbrir: () => void
  onOperador: (op: FilterOperator) => void
  onOperadorAberto: () => void
  onRemover: () => void
}) {
  const presente = useIsPresent()
  const reduzir = useReducedMotion()
  const booleano = campo.type === "boolean"
  const ops = OPERADORES[campo.type]
  const trocasOperador = useTrocas(descricao.operador)
  const trocasValor = useTrocas(descricao.falado)

  const nomeValor = token.rascunho
    ? `${campo.label}: nenhum valor. Escolher valor.`
    : `${campo.label}: ${descricao.operador} ${descricao.falado}. Editar valor.${campo.pending ? " Carregando." : ""}`

  const operadorMiolo = (
    <>
      <span aria-hidden key={trocasOperador} className={cn(FLASH, trocasOperador > 0 && "table-flash")} />
      <span className={cn(MIOLO, MIOLO_TAMANHO[size])}>{descricao.operador}</span>
    </>
  )

  return (
    <motion.div
      ref={ref}
      role="group"
      aria-label={`Filtro ${campo.label}`}
      aria-busy={campo.pending || undefined}
      data-slot="filter-bar-token"
      data-field={campo.id}
      data-draft={token.rascunho || undefined}
      inert={!presente || undefined}
      layout={reduzir ? undefined : "position"}
      {...(reduzir ? SURGIR_REDUZIDO : SURGIR)}
      onKeyDown={(e) => {
        // Só o que nasce no token no DOM: o menu do operador é portal, e o
        // Backspace dele subiria pela árvore do React até aqui.
        if (!e.currentTarget.contains(e.target as Node)) return
        if (e.key !== "Backspace" && e.key !== "Delete") return
        e.preventDefault()
        onRemover()
      }}
      className={cn(
        // Surge de onde estava o "+ Filtro", que desliza para frente.
        "flex max-w-full min-w-0 origin-left items-stretch",
        CAPSULA_TOM[tone],
        CAPSULA_TAMANHO[size],
        fieldControlHeightClassName[size],
        // Encolhido pela linha `menu` (teto inline), só o valor cede: campo, operador e × ficam inteiros.
        menu ? "shrink-0 max-w-none [&>*]:shrink-0 [&>[data-slot=filter-bar-value]]:shrink" : TOKEN_TELEFONE[mobile]
      )}
    >
      <span
        data-slot="filter-bar-field"
        onClick={booleano || disabled ? undefined : onAbrir}
        className={cn(
          SEGMENTO,
          SEGMENTO_TAMANHO[size],
          "font-medium",
          !booleano && !disabled && SEGMENTO_TOM[tone],
          booleano && CAMPO_SOZINHO_TELEFONE[mobile],
          tone === "neutral" && "text-foreground"
        )}
      >
        <span
          className={cn(
            MIOLO,
            MIOLO_TAMANHO[size],
            tone === "neutral" && "[&>svg]:text-muted-foreground",
            CAMPO_ICONE_TELEFONE[mobile]
          )}
        >
          {campo.icon}
          {campo.label}
        </span>
      </span>

      {booleano ? null : ops.length === 2 && !token.rascunho ? (
        // Duas opções e uma já marcada: o clique troca direto, sem menu.
        <button
          type="button"
          data-slot="filter-bar-operator"
          disabled={disabled}
          aria-label={`${campo.label}: ${descricao.operador}. Trocar para ${rotuloOperador(ops.find((op) => op !== token.operator) ?? ops[0])}.`}
          onClick={() => {
            onOperadorAberto()
            onOperador(ops.find((op) => op !== token.operator) ?? ops[0])
          }}
          className={cn(SEGMENTO, SEGMENTO_TAMANHO[size], SEGMENTO_TOM[tone], APAGADO_TOM[tone], "justify-center")}
        >
          {operadorMiolo}
        </button>
      ) : ops.length > 1 && !token.rascunho && campo.type !== "money" ? (
        // O Valor não troca o modo na pílula: o modo novo pode pedir outro campo, e quem o escreve é o editor (o valor, à direita).
        <DropdownMenu
          mobile="sheet"
          onOpenChange={(abrir) => {
            if (abrir) onOperadorAberto()
          }}
        >
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              data-slot="filter-bar-operator"
              disabled={disabled}
              aria-label={`${campo.label}: ${descricao.operador}. Trocar operador.`}
              className={cn(SEGMENTO, SEGMENTO_TAMANHO[size], SEGMENTO_TOM[tone], APAGADO_TOM[tone], "justify-center")}
            >
              {operadorMiolo}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" size="sm">
            <DropdownMenuRadioGroup
              value={token.operator}
              onValueChange={(op) => onOperador(op as FilterOperator)}
            >
              {ops.map((op) => (
                <DropdownMenuRadioItem key={op} value={op}>
                  {rotuloOperador(op)}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <span
          data-slot="filter-bar-operator"
          className={cn(SEGMENTO, SEGMENTO_TAMANHO[size], APAGADO_TOM[tone], "justify-center")}
        >
          {operadorMiolo}
        </span>
      )}

      {booleano ? null : (
        <button
          type="button"
          data-slot="filter-bar-value"
          disabled={disabled}
          aria-label={nomeValor}
          aria-haspopup="dialog"
          aria-expanded={aberto}
          aria-controls={conteudoId}
          onClick={onAbrir}
          className={cn(
            SEGMENTO,
            SEGMENTO_TAMANHO[size],
            SEGMENTO_TOM[tone],
            "font-medium",
          )}
        >
          <span aria-hidden key={trocasValor} className={cn(FLASH, trocasValor > 0 && "table-flash")} />
          <span className={cn(MIOLO, MIOLO_TAMANHO[size])}>
            {campo.pending ? (
              <Spinner size="sm" />
            ) : descricao.media && !token.rascunho ? (
              <span className="flex shrink-0 items-center">{descricao.media}</span>
            ) : null}
            {token.rascunho ? (
              <span className={cn("font-normal", APAGADO_TOM[tone])}>Selecionar…</span>
            ) : (
              <span className={cn("max-w-48 truncate", ROTULO_TELEFONE[mobile])}>
                {descricao.rotulo}
              </span>
            )}
            {descricao.resto > 0 && !token.rascunho ? (
              <span className={cn("nums font-normal", APAGADO_TOM[tone])}>+{descricao.resto}</span>
            ) : null}
          </span>
        </button>
      )}

      <button
        type="button"
        data-slot="filter-bar-remove"
        disabled={disabled}
        aria-label={`Remover filtro ${campo.label}`}
        onClick={onRemover}
        className={cn(
          SEGMENTO,
          REMOVER_TAMANHO[size],
          SEGMENTO_TOM[tone],
          APAGADO_TOM[tone],
          REMOVER_TOM[tone],
          "justify-center"
        )}
      >
        <XMarkIcon aria-hidden className={size === "sm" ? "size-3.5" : "size-4"} />
      </button>
    </motion.div>
  )
}

/* ── O "+ Filtro" ─────────────────────────────────────────────────────── */

/** O rótulo do "Ver" do rodapé da gaveta: sem número (carregando), "Ver resultados"; com zero, "Nenhum lançamento". */
export function rotuloVerResultados(count?: number, noun: [string, string] = ["resultado", "resultados"]): string {
  if (count == null) return "Ver resultados"
  // shortcut: "Nenhum" é masculino; um `noun` feminino (conta) pediria "Nenhuma" — trocar por um campo de gênero quando aparecer.
  if (count === 0) return `Nenhum ${noun[0]}`
  return `Ver ${numberBR(count)} ${count === 1 ? noun[0] : noun[1]}`
}

function ListaDeCampos({
  fields,
  usados,
  valorDe,
  onLimparTudo,
  verLabel,
  onVer,
  onEscolher,
}: {
  fields: FilterField[]
  usados: string[]
  valorDe: (campoId: string) => string | undefined
  onLimparTudo: () => void
  verLabel: string
  onVer: () => void
  onEscolher: (campo: FilterField) => void
}) {
  const naGaveta = useIsMobile()
  return (
    <Command filter={commandFilter} className={cn(naGaveta && LISTA_NA_GAVETA)}>
      {naGaveta ? (
        <PopoverHeader className="grid grid-cols-[1fr_minmax(0,auto)_1fr] items-center gap-2 px-2 pt-1 pb-1">
          <PopoverTitle className="col-start-2 truncate text-base">Filtros</PopoverTitle>
        </PopoverHeader>
      ) : null}
      <CommandInput surface="plate" touchFloor placeholder="Filtrar por…" autoFocus={!noDedo()} />
      <CommandList arrows className="px-2 pt-(--scroll-fade-band-h) pb-2">
        <CommandEmpty>Nenhum campo.</CommandEmpty>
        {fields
          // Na gaveta a barra some: o booleano ligado fica na lista para dar para desligar.
          .filter((f) => naGaveta || !(f.type === "boolean" && usados.includes(f.id)))
          .map((f) => (
            <CommandItem
              key={f.id}
              value={f.id}
              keywords={[f.label]}
              onSelect={() => onEscolher(f)}
              className="gap-2 px-2 py-2 [&>svg]:text-muted-foreground"
            >
              {f.icon}
              <span className="min-w-0 truncate">{f.label}</span>
              {usados.includes(f.id) ? (
                <CommandItemMeta className="text-xs text-muted-foreground">
                  {naGaveta ? <span className="max-w-40 truncate">{valorDe(f.id)}</span> : "editar"}
                </CommandItemMeta>
              ) : null}
              {naGaveta ? (
                <ChevronRightIcon aria-hidden className={cn("shrink-0", !usados.includes(f.id) && "ms-auto")} />
              ) : null}
            </CommandItem>
          ))}
      </CommandList>
      {/* Sem filtro ligado não há rodapé: o "Ver" só fecharia sobre a mesma lista (fecha-se arrastando). */}
      {naGaveta && usados.length > 0 ? (
        <div className="flex gap-2 px-2 pb-2">
          <Button type="button" variant="tertiary" className="flex-1" onClick={onLimparTudo}>
            Limpar tudo
          </Button>
          <Button type="button" variant="primary" className="flex-1" onClick={() => onVer()}>
            {verLabel}
          </Button>
        </div>
      ) : null}
    </Command>
  )
}

/* ── O editor de valor ────────────────────────────────────────────────── */

type EditorProps = {
  campo: FilterField
  operador: FilterOperator
  valores: string[]
  opcao: (valor: string) => FilterOption | undefined
  onGravar: (operador: FilterOperator, valores: string[]) => void
  onConhecer: (opcao: FilterOption) => void
  onRemover: () => void
  onConcluir: () => void
  /** O filtro já existia ao abrir: só ele ganha o "Remover filtro" da gaveta. */
  existia?: boolean
  /** O "‹ Filtros" da gaveta. */
  onVoltar?: () => void
}

/** O valor de dinheiro mascarado, a partir do decimal guardado. */
const mascarar = (v: string | undefined) =>
  v != null && v !== "" && Number.isFinite(Number(v)) ? formatMoneyBrlInput(Number(v)) : ""

function EditorDeValor(props: EditorProps) {
  const { campo, operador, valores, onGravar, onRemover, onConcluir, existia, onVoltar } = props
  const ops = OPERADORES[campo.type]
  const dedo = noDedo()
  // A mesma pergunta do `Popover mobile="sheet"`: é ela que decide a gaveta.
  const naGaveta = useIsMobile()
  // Na gaveta as faixas recuam 8 e não 12: a gaveta já recua 16, e com 12 o
  // título e o operador ficavam 4px para dentro da busca, dos atalhos e da grade.
  const recuo = naGaveta ? "px-2" : "px-3"

  // Dinheiro e texto guardam o que se digita: o "entre" com uma ponta só é
  // rascunho, e o campo não pode se apagar por isso.
  // Os dois guardam o número ao trocar de modo; cada modo mostra só o que usa.
  const [de, setDe] = React.useState(() => (usaMaximo(operador) ? "" : mascarar(valores[0])))
  const [ate, setAte] = React.useState(() =>
    mascarar(operador === "between" ? valores[1] : usaMaximo(operador) ? valores[0] : undefined)
  )
  const [texto, setTexto] = React.useState(valores[0] ?? "")

  const dinheiro = (op: FilterOperator, a: string, b: string) => {
    const x = parseMoneyBrl(a)
    const y = parseMoneyBrl(b)
    // O "entre" invertido não é emitido: o editor diz o erro em vez de trocar as pontas.
    if (op === "between") return x != null && y != null && x > y ? ["", ""] : [x == null ? "" : String(x), y == null ? "" : String(y)]
    if (usaMaximo(op)) return y == null ? [] : [String(y)]
    return x == null ? [] : [String(x)]
  }

  const trocarOperador = (op: FilterOperator) => {
    if (campo.type !== "money") return onGravar(op, valores)
    // Num modo de um campo só, o número de quem tem passa ao campo vazio: "até 100" vira "igual a 100".
    let [a, b] = [de, ate]
    if (op !== "between" && usaMaximo(op) && !b) setAte((b = a))
    if (op !== "between" && !usaMaximo(op) && !a) setDe((a = b))
    onGravar(op, dinheiro(op, a, b))
  }

  const concluirNoEnter = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") onConcluir()
  }

  return (
    <>
      {naGaveta ? (
        // A gaveta é uma pilha: voltar à lista, o campo no meio, e o Pronto que fecha.
        <PopoverHeader className={cn("grid grid-cols-[1fr_minmax(0,auto)_1fr] items-center gap-2 pt-1 pb-1", recuo)}>
          <Button type="button" variant="tertiary" className="justify-self-start -ms-3" onClick={onVoltar}>
            <ChevronLeftIcon aria-hidden />
            Filtros
          </Button>
          <PopoverTitle className="flex min-w-0 items-center gap-1.5 text-base [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:text-muted-foreground">
            {campo.icon}
            <span className="truncate">{campo.label}</span>
          </PopoverTitle>
          <Button type="button" variant="tertiary" className="justify-self-end -me-3" onClick={() => onConcluir()}>
            Pronto
          </Button>
        </PopoverHeader>
      ) : (
        <PopoverHeader className={cn("flex-row items-center justify-between gap-2 pt-3 pb-1", recuo)}>
          <PopoverTitle className="flex items-center gap-1.5 text-sm [&>svg]:size-4 [&>svg]:text-muted-foreground">
            {campo.icon}
            Editar {campo.label.toLocaleLowerCase("pt-BR")}
          </PopoverTitle>
          <Button
            type="button"
            variant="tertiary"
            size="xs"
            // No dedo o botão cresce de verdade, a 40 (a régua do "+ Filtro", do "Limpar" e do rodapé dos diálogos).
            className="-me-1.5 pointer-coarse:-me-3 pointer-coarse:h-11 pointer-coarse:px-3 pointer-coarse:text-sm"
            onClick={onRemover}
          >
            remover
          </Button>
        </PopoverHeader>
      )}

      {campo.type === "money" ? (
        <EditorDeDinheiro
          operador={operador}
          de={de}
          ate={ate}
          recuo={recuo}
          focar={!dedo || naGaveta}
          onModo={trocarOperador}
          onDe={(raw, op = operador) => {
            setDe(raw)
            onGravar(op, dinheiro(op, raw, ate))
          }}
          onAte={(raw, op = operador) => {
            setAte(raw)
            onGravar(op, dinheiro(op, de, raw))
          }}
          onFaixa={(a, b, op) => {
            setDe(a)
            setAte(b)
            onGravar(op, dinheiro(op, a, b))
          }}
          onEnter={concluirNoEnter}
        />
      ) : ops.length > 1 ? (
        <div className={cn("pt-2 pb-1", recuo)}>
          <ToggleGroup
            type="single"
            variant="floating"
            size="sm"
            stretch
            value={operador}
            onValueChange={(op) => op && trocarOperador(op as FilterOperator)}
            aria-label="Operador"
          >
            {ops.map((op) => (
              <ToggleGroupItem key={op} value={op}>
                {rotuloOperador(op)}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      ) : null}

      {campo.type === "boolean" ? (
        <p className={cn("pt-1 pb-3 text-sm text-muted-foreground", recuo)}>Sem valor a escolher: o filtro está ligado.</p>
      ) : null}

      {campo.type === "enum" ? (
        campo.loadOptions ? (
          <EditorDeListaRemota {...props} loadOptions={campo.loadOptions} />
        ) : (
          <EditorDeLista {...props} opcoes={campo.options ?? []} />
        )
      ) : null}

      {campo.type === "period" ? (
        <EditorDePeriodo
          totals={campo.totals}
          valores={valores}
          onGravar={(v) => onGravar("is", v)}
          recuo={recuo}
          naGaveta={naGaveta}
          dedo={dedo}
        />
      ) : null}

      {campo.type === "text" ? (
        <div className={cn("pt-2 pb-3", recuo)}>
          <Input
            aria-label={`${campo.label} contém`}
            placeholder="Contém…"
            autoFocus={!dedo || naGaveta}
            enterKeyHint="search"
            value={texto}
            onChange={(e) => {
              setTexto(e.target.value)
              onGravar("contains", [e.target.value])
            }}
            onKeyDown={concluirNoEnter}
          />
        </div>
      ) : null}

      {existia && naGaveta ? (
        <div className={cn("pb-3", recuo)}>
          <Button type="button" variant="destructive" className="w-full" onClick={onRemover}>
            Remover filtro
          </Button>
        </div>
      ) : null}
    </>
  )
}

const REDONDOS = [50, 100, 500, 1000]
const FAIXAS: [number | null, number | null][] = [
  [null, 50],
  [50, 200],
  [200, 1000],
  [1000, null],
]
const brlMil = (n: number) => (n >= 1000 ? `R$ ${numberBR(n / 1000)} mil` : `R$ ${numberBR(n)}`)

/** O editor do "Valor": os modos ocupam a linha, a frase diz o que entra, e só os campos do modo aparecem. */
function EditorDeDinheiro({
  operador,
  de,
  ate,
  recuo,
  focar,
  onModo,
  onDe,
  onAte,
  onFaixa,
  onEnter,
}: {
  operador: FilterOperator
  de: string
  ate: string
  recuo: string
  focar: boolean
  onModo: (op: FilterOperator) => void
  onDe: (raw: string, op?: FilterOperator) => void
  onAte: (raw: string, op?: FilterOperator) => void
  onFaixa: (de: string, ate: string, op: FilterOperator) => void
  onEnter: (e: React.KeyboardEvent) => void
}) {
  const naGaveta = useIsMobile()
  const x = parseMoneyBrl(de)
  const y = parseMoneyBrl(ate)
  const erro = operador === "between" && x != null && y != null && x > y
  const pinta = (n: number | null) => (n == null ? "" : formatMoneyBrlInput(n))

  let frase = "Digite um valor."
  if (operador === "lte" && y != null) frase = `Mostra lançamentos de ${brlCurto(y)} ou menos.`
  if (operador === "gte" && x != null) frase = `Mostra lançamentos de ${brlCurto(x)} ou mais.`
  if (operador === "between")
    frase = erro ? "O mínimo passa do máximo." : x != null && y != null ? `Mostra lançamentos de ${brlCurto(x)} a ${brlCurto(y)}.` : "Digite as duas pontas."
  if (operador === "eq" && x != null) frase = `Mostra lançamentos de exatamente ${brlCurto(x)}.`
  if (operador === "approx" && x != null) {
    const [a, b] = approxRange(x)
    frase = `Mostra lançamentos de ${brlCurto(a)} a ${brlCurto(b)} (10% para mais ou para menos).`
  }

  const campo = (rotulo: string, valor: string, mudar: (raw: string) => void, foco: boolean) => (
    <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs text-muted-foreground">
      {rotulo}
      <Input money size="md" placeholder="0,00" autoFocus={foco} enterKeyHint="done" value={valor} onValueChange={mudar} onKeyDown={onEnter} />
    </label>
  )

  return (
    <div className="w-104 max-w-full">
      <div className={cn("pt-2", recuo)}>
        {naGaveta ? (
          // No telefone cinco modos não cabem num trilho: fichas que quebram linha.
          <RadioGroup variant="chip" value={operador} onValueChange={(op) => onModo(op as FilterOperator)} aria-label="Modo">
            {OPERADORES.money.map((op) => (
              <RadioGroupItem key={op} value={op}>
                {rotuloOperador(op)}
              </RadioGroupItem>
            ))}
          </RadioGroup>
        ) : (
          <ToggleGroup
            type="single"
            variant="floating"
            size="sm"
            className="w-full"
            value={operador}
            onValueChange={(op) => op && onModo(op as FilterOperator)}
            aria-label="Modo"
          >
            {OPERADORES.money.map((op) => (
              <ToggleGroupItem key={op} value={op} className="flex-auto px-1.5">
                {rotuloOperador(op)}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        )}
      </div>
      <p aria-live="polite" className={cn("pt-2 text-xs", erro ? "text-destructive" : "text-muted-foreground", recuo)}>
        {frase}
      </p>

      <div className={cn("flex items-end gap-2 pt-3", operador === "eq" || operador === "approx" ? "pb-3" : "", recuo)}>
        {operador === "between" ? (
          <>
            {campo("Mínimo", de, onDe, focar)}
            <span className="pb-2 text-sm text-muted-foreground">–</span>
            {campo("Máximo", ate, onAte, false)}
          </>
        ) : usaMaximo(operador) ? (
          campo("Valor máximo", ate, onAte, focar)
        ) : (
          campo(operador === "gte" ? "Valor mínimo" : "Valor", de, onDe, focar)
        )}
      </div>

      {operador === "lte" || operador === "gte" || operador === "between" ? (
        <div className={cn("flex flex-wrap gap-1.5 pt-3 pb-3", recuo)}>
          {operador === "between"
            ? FAIXAS.map(([a, b]) => {
                const op: FilterOperator = a == null ? "lte" : b == null ? "gte" : "between"
                return (
                  <Toggle
                    key={`${a}-${b}`}
                    variant="chip"
                    size="sm"
                    pressed={x === a && y === b}
                    onPressedChange={() => onFaixa(pinta(a), pinta(b), op)}
                  >
                    {a == null ? `até ${brlMil(b!)}` : b == null ? `acima de ${brlMil(a)}` : `${brlMil(a)} – ${brlMil(b).replace("R$ ", "")}`}
                  </Toggle>
                )
              })
            : REDONDOS.map((n) => (
                <Toggle
                  key={n}
                  variant="chip"
                  size="sm"
                  pressed={(usaMaximo(operador) ? y : x) === n}
                  onPressedChange={() => (usaMaximo(operador) ? onAte(pinta(n)) : onDe(pinta(n)))}
                >
                  {brlMil(n)}
                </Toggle>
              ))}
        </div>
      ) : null}
    </div>
  )
}

type BuscarTotais = (year: number, signal: AbortSignal) => Promise<(number | null)[]>

/**
 * Pede os anos ainda não pedidos e devolve a limpeza, que cancela e tira do
 * `pedidos` os que não chegaram — na hora, para a próxima rodada (o efeito que
 * o StrictMode roda duas vezes) pedir de novo.
 */
export function pedirTotais(
  pedidos: Set<number>,
  anos: number[],
  buscar: BuscarTotais,
  chegou: (ano: number, meses: (number | null)[]) => void
): () => void {
  const ctrl = new AbortController()
  const emVoo = new Set<number>()
  for (const ano of anos) {
    if (pedidos.has(ano)) continue
    pedidos.add(ano)
    emVoo.add(ano)
    buscar(ano, ctrl.signal).then(
      (v) => {
        emVoo.delete(ano)
        chegou(ano, v)
      },
      // Só a falha desta rodada libera o ano: a de um cancelado chega depois da rodada nova.
      () => {
        if (emVoo.delete(ano)) pedidos.delete(ano)
      }
    )
  }
  return () => {
    ctrl.abort()
    for (const ano of emVoo) pedidos.delete(ano)
    emVoo.clear()
  }
}

/** Os totais de despesa por mês dos anos pedidos, carregados uma vez por ano; só busca com `totals`. */
function useTotaisPorAno(totals: BuscarTotais | undefined, anos: number[]) {
  const [porAno, setPorAno] = React.useState<Record<number, (number | null)[]>>({})
  // Já pedido ou chegado: não pede de novo. Um pedido cancelado sai daqui e volta a ser pedido.
  const pedidos = React.useRef(new Set<number>())
  const buscar = React.useEffectEvent((ano: number, signal: AbortSignal) => totals!(ano, signal))
  const temTotais = totals != null
  const chave = anos.join(",")
  React.useEffect(() => {
    if (!temTotais || !chave) return
    return pedirTotais(pedidos.current, chave.split(",").map(Number), (ano, s) => buscar(ano, s), (ano, v) =>
      setPorAno((atual) => ({ ...atual, [ano]: v }))
    )
  }, [temTotais, chave])
  return porAno
}

/**
 * O total do ano só com os meses que já passaram todos conhecidos — nunca um
 * total errado: o passado pede os 12, o atual soma até o mês de hoje, o futuro não tem.
 */
export function totalDoAno(meses: (number | null)[] | undefined, ano: number, hoje = new Date()): number | null {
  if (meses?.length !== 12 || ano > hoje.getFullYear()) return null
  const ate = meses.slice(0, ano === hoje.getFullYear() ? hoje.getMonth() + 1 : 12)
  return ate.every((v) => v != null) ? (ate as number[]).reduce((a, b) => a + b, 0) : null
}

/** Os anos que a grade de anos pinta: só datas de anos inteiros; atalho ou dias não pintam. */
export function anosDaGrade(valores: string[]): { from: number; to: number } | undefined {
  const r = valores.length === 2 ? filterPeriodRange(valores) : null
  return (r && wholeYears(r.from, r.to)) ?? undefined
}

/** O intervalo que a grade de meses pinta: meses inteiros ou o ano inteiro (Jan–Dez escolhido na grade é um ano); dias não pintam. */
export function mesesDaGrade(valores: string[]): { from: Date; to: Date } | undefined {
  const r = filterPeriodRange(valores)
  const tipo = r ? classifyPeriod(r.from, r.to) : null
  if (tipo?.kind === "months") {
    return {
      from: new Date(tipo.from.year, tipo.from.month, 1),
      to: new Date(tipo.to.year, tipo.to.month, 1),
    }
  }
  if (tipo?.kind === "year") return { from: new Date(tipo.year, 0, 1), to: new Date(tipo.year, 11, 1) }
  return undefined
}

type IntervaloDeAnos = { from: number; to: number }

/**
 * Os anos em grade de três, em intervalo como a `MonthGrid`: o primeiro toque
 * grava um ano só e o guarda como âncora, o segundo grava até ele.
 */
function GradeDeAnos({
  anos,
  value,
  onChange,
  legenda,
}: {
  anos: number[]
  value: IntervaloDeAnos | undefined
  onChange: (r: IntervaloDeAnos) => void
  legenda: (ano: number) => { texto: string; vazio: boolean } | null
}) {
  const anoAtual = new Date().getFullYear()
  const [ancora, setAncora] = React.useState<Date | null>(null)
  const chaveDe = (r: IntervaloDeAnos | undefined) => (r ? `${r.from}:${r.to}` : "")

  // Um valor que muda por fora (um atalho, Remover) apaga a âncora; o que esta grade gravou não conta.
  const chaveDoValor = chaveDe(value)
  const [visto, setVisto] = React.useState(chaveDoValor)
  const [emitido, setEmitido] = React.useState<string | null>(null)
  if (chaveDoValor !== visto) {
    setVisto(chaveDoValor)
    if (chaveDoValor !== emitido) setAncora(null)
  }

  const escolher = (ano: number) => {
    const proximo = proximoIntervaloDeMes(ancora, new Date(ano, 0, 1))
    const r = { from: proximo.range.from.getFullYear(), to: proximo.range.to.getFullYear() }
    setAncora(proximo.ancora)
    setEmitido(chaveDe(r))
    onChange(r)
  }

  const noIntervalo = (ano: number) => {
    if (!value) return undefined
    if (ano === value.from && ano === value.to) return "single"
    if (ano === value.from) return "start"
    if (ano === value.to) return "end"
    return ano > value.from && ano < value.to ? "middle" : undefined
  }

  return (
    <div role="group" aria-label="Anos" className="grid grid-cols-3 gap-1">
      {anos.map((ano) => {
        const posicao = noIntervalo(ano)
        const escolhido = posicao !== undefined && posicao !== "middle"
        const atual = ano === anoAtual
        const nota = legenda(ano)
        return (
          <Button
            key={ano}
            type="button"
            size="sm"
            variant={escolhido ? "primary" : atual && !posicao ? "secondary" : "tertiary"}
            aria-pressed={escolhido}
            aria-current={atual ? "date" : undefined}
            data-range={posicao}
            className={cn(
              // A régua da `MonthGrid`: 44 no toque, o atual em negrito, o meio na faixa.
              "font-normal pointer-coarse:h-11 pointer-coarse:text-base",
              atual && "font-semibold",
              posicao === "middle" && "bg-muted text-foreground",
              nota != null && "h-auto flex-col gap-0 py-1 pointer-coarse:h-auto pointer-coarse:min-h-11",
              nota?.vazio && !posicao && "text-muted-foreground"
            )}
            onClick={() => escolher(ano)}
          >
            <span className="nums">{ano}</span>
            {nota != null ? (
              <span
                data-slot="filter-bar-year-caption"
                className={cn(
                  "text-2xs leading-tight nums",
                  escolhido ? "text-primary-foreground" : "text-muted-foreground"
                )}
              >
                {nota.texto}
              </span>
            ) : null}
          </Button>
        )
      })}
    </div>
  )
}

/**
 * O período em três unidades: Dias (os atalhos de dias e o calendário),
 * Meses (a grade em intervalo) e Ano (três atalhos e a grade dos seis últimos, em intervalo). Trocar de aba não muda
 * o valor; a aba que abre é a do valor (`abaInicialDoPeriodo`). Na gaveta a
 * árvore é a mesma: os alvos de 44 vêm dos componentes.
 */
function EditorDePeriodo({
  totals,
  valores,
  onGravar,
  recuo,
  naGaveta,
  dedo,
}: {
  totals: Extract<FilterField, { type: "period" }>["totals"]
  valores: string[]
  onGravar: (valores: string[]) => void
  recuo: string
  naGaveta: boolean
  dedo: boolean
}) {
  const periodo = filterPeriodRange(valores)
  const [abaInicial] = React.useState(() => abaInicialDoPeriodo(valores))
  const [aba, setAba] = React.useState<AbaDoPeriodo>(abaInicial)
  const valorDaGrade = mesesDaGrade(valores)
  // O ano em que a grade abre (o do valor que ela pinta, senão o atual) é o dos totais pedidos.
  const anoDoValor = (valorDaGrade?.from ?? new Date()).getFullYear()
  const [anoVisivel, setAnoVisivel] = React.useState(anoDoValor)
  const anoAtual = new Date().getFullYear()
  const anos = Array.from({ length: 6 }, (_, i) => anoAtual - i)
  const totais = useTotaisPorAno(totals, aba === "meses" ? [anoVisivel] : aba === "ano" ? anos : [])
  const agora = new Date()

  return (
    <Tabs
      // O piso da grade de meses: sem ele, a aba Ano encolhia o editor ao rótulo dos anos.
      className="min-w-64"
      value={aba}
      onValueChange={(v) => {
        // A grade remonta no ano do valor; os totais pedidos acompanham.
        if (v === "meses") setAnoVisivel(anoDoValor)
        setAba(v as AbaDoPeriodo)
      }}
    >
      <div className={cn("pt-2 pb-1", recuo)}>
        <TabsList stretch aria-label="Unidade do período">
          <TabsTrigger value="dias">Dias</TabsTrigger>
          <TabsTrigger value="meses">Meses</TabsTrigger>
          <TabsTrigger value="ano">Ano</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent
        value="dias"
        // No desktop o editor tem a largura de Dias nas três abas: fora da vez o
        // painel fica montado, sem altura e inerte, e a largura dele segura a
        // placa (a grade e os anos esticam). Na gaveta, a largura é a dela.
        forceMount={naGaveta ? undefined : true}
        inert={!naGaveta && aba !== "dias"}
        className="data-[state=inactive]:block data-[state=inactive]:invisible data-[state=inactive]:h-0 data-[state=inactive]:flex-none data-[state=inactive]:overflow-hidden"
      >
        {/* A gaveta já recua 16px dos lados; somados a 12, as sete células de 44
            não cabiam a 375px. No popover o recuo é só o do calendário (8): as
            linhas ficam como as do `Command`, caixa a 8 e texto a 16. */}
        <div className={naGaveta ? "pt-1 pb-2" : undefined}>
          <Calendar
            mode="range"
            presets={ATALHOS_DE_DIAS}
            // Na gaveta as células sobem ao `lg` e esticam, como no `DatePicker`.
            size={naGaveta ? "lg" : "md"}
            stretch={naGaveta}
            autoFocus={!dedo && abaInicial === "dias"}
            // Sem valor, os dois meses do desktop terminam no atual (quem filtra olha para trás).
            defaultMonth={
              periodo
                ? parseYmdLocal(periodo.from)
                : naGaveta
                  ? undefined
                  : new Date(agora.getFullYear(), agora.getMonth() - 1, 1)
            }
            selected={
              periodo
                ? { from: parseYmdLocal(periodo.from), to: parseYmdLocal(periodo.to) }
                : undefined
            }
            onSelect={(r) => {
              if (!r?.from) return onGravar([])
              const inicio = localYmdFromDate(r.from)
              const fim = localYmdFromDate(r.to ?? r.from)
              // Um intervalo igual ao de um atalho de dias é o atalho — e ele
              // continua valendo amanhã. Só os quatro à vista: "Este mês"
              // escolhido à mão fica em datas.
              const atalho = ATALHOS_DE_DIAS.find((p) => {
                const i = intervaloDoAtalho(p.id)
                return i?.from === inicio && i.to === fim
              })
              onGravar(atalho ? [atalho.id] : [inicio, fim])
            }}
          />
        </div>
      </TabsContent>

      <TabsContent value="meses">
        <MonthGrid
          mode="range"
          className="w-full pointer-coarse:w-full"
          value={valorDaGrade}
          onChange={(r) => {
            const m = monthRangeYmd(
              { year: r.from.getFullYear(), month: r.from.getMonth() },
              { year: r.to.getFullYear(), month: r.to.getMonth() }
            )
            onGravar([m.from, m.to])
          }}
          onYearChange={setAnoVisivel}
          caption={
            totals
              ? (mes) => {
                  const v = totais[mes.getFullYear()]?.[mes.getMonth()]
                  return v == null ? null : currencyCompactBRL(v)
                }
              : undefined
          }
        />
      </TabsContent>

      <TabsContent value="ano">
        <div className={cn("flex flex-col gap-3 pt-2 pb-2", recuo)}>
          <ul aria-label="Atalhos de ano" className="grid grid-cols-3 gap-1">
            {ATALHOS_DE_ANO.map((p) => (
              <li key={p.id}>
                <Button
                  type="button"
                  size="sm"
                  // A régua dos atalhos do `Calendar`: o escolhido preenche.
                  variant={valores[0] === p.id ? "primary" : "outline"}
                  aria-pressed={valores[0] === p.id}
                  className="w-full justify-center font-normal pointer-coarse:h-11"
                  onClick={() => onGravar([p.id])}
                >
                  {p.label}
                </Button>
              </li>
            ))}
          </ul>
          <GradeDeAnos
            anos={anos}
            value={anosDaGrade(valores)}
            onChange={(r) => onGravar([`${r.from}-01-01`, `${r.to}-12-31`])}
            legenda={(ano) => {
              const total = totals ? totalDoAno(totais[ano], ano) : null
              if (total == null) return null
              if (total === 0 && ano < anoAtual) return { texto: "sem lançamentos", vazio: true }
              return { texto: currencyCompactBRL(total), vazio: false }
            }}
          />
        </div>
      </TabsContent>

      {periodo ? (
        <p
          data-slot="filter-bar-period-summary"
          aria-live="polite"
          className={cn("pt-1 pb-3 text-xs text-muted-foreground nums", recuo)}
        >
          {periodSummary(periodo.from, periodo.to)}
        </p>
      ) : null}
    </Tabs>
  )
}

type ListaProps = EditorProps & {
  opcoes: FilterOption[]
  remoto?: {
    query: string
    setQuery: (q: string) => void
    loading: boolean
    error: unknown
  }
}

function EditorDeListaRemota({
  loadOptions,
  ...props
}: EditorProps & { loadOptions: NonNullable<Extract<FilterField, { type: "enum" }>["loadOptions"]> }) {
  // `minLength: 0`: a lista carrega ao abrir, sem esperar a primeira tecla.
  const busca = useCommandSearch(loadOptions, { minLength: 0 })
  return <EditorDeLista {...props} opcoes={busca.results} remoto={busca} />
}

function EditorDeLista({ campo, operador, valores, opcoes, remoto, onGravar, onConhecer, onConcluir }: ListaProps) {
  const multiple = campo.type === "enum" && campo.multiple !== false
  const n = valores.length
  const naGaveta = useIsMobile()

  const alternar = (o: FilterOption) => {
    onConhecer(o)
    if (!multiple) {
      onGravar(operador, [o.value])
      onConcluir()
      return
    }
    if (valores.includes(o.value)) return onGravar(operador, valores.filter((v) => v !== o.value))
    const exclusivas = new Set(opcoes.filter((x) => x.exclusive).map((x) => x.value))
    onGravar(operador, o.exclusive ? [o.value] : [...valores.filter((v) => !exclusivas.has(v)), o.value])
  }

  return (
    <>
      <Command
        filter={commandFilter}
        shouldFilter={!remoto}
        className={cn(naGaveta && LISTA_NA_GAVETA)}
      >
        <CommandInput
          surface="plate"
          touchFloor
          placeholder={`Buscar ${campo.label.toLocaleLowerCase("pt-BR")}…`}
          autoFocus={!noDedo()}
          {...(remoto ? { value: remoto.query, onValueChange: remoto.setQuery } : {})}
        />
        <CommandList arrows className="px-2 pt-(--scroll-fade-band-h) pb-2">
          {remoto?.loading ? (
            <CommandLoading>
              <span className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                <Spinner size="sm" />
                Buscando…
              </span>
            </CommandLoading>
          ) : (
            <CommandEmpty>{remoto?.error ? "Não deu para buscar agora." : "Nada encontrado."}</CommandEmpty>
          )}
          {opcoes.map((o) => {
            const marcado = valores.includes(o.value)
            return (
              <CommandItem
                key={o.value}
                value={o.value}
                keywords={[o.label, ...(o.keywords ?? [])]}
                onSelect={() => alternar(o)}
                className={cn("gap-2 px-2 py-2", !multiple && "pr-8")}
              >
                {multiple ? (
                  <Checkbox
                    checked={marcado}
                    tabIndex={-1}
                    aria-hidden
                    className="pointer-events-none"
                  />
                ) : null}
                {o.media ? <span className="flex shrink-0 items-center">{o.media}</span> : null}
                <span className="min-w-0 truncate">{o.label}</span>
                {o.count != null ? (
                  <CommandItemMeta className="nums text-xs text-muted-foreground">
                    {numberBR(o.count)}
                  </CommandItemMeta>
                ) : null}
                {!multiple ? (
                  <span className="pointer-events-none absolute right-2 flex size-4 items-center justify-center">
                    {marcado ? <CheckIcon aria-hidden /> : null}
                  </span>
                ) : null}
                {/* O cmdk usa `aria-selected` para a linha realçada pela seta;
                    quem diz "este está marcado" é este rótulo (o do `Combobox`). */}
                {marcado ? <span className="sr-only">Selecionado</span> : null}
              </CommandItem>
            )
          })}
        </CommandList>
      </Command>
      <PopoverFooter className="justify-between pt-0 text-xs text-muted-foreground">
        <span className="nums">
          {multiple ? (n === 0 ? "Nenhum selecionado" : `${n} ${n === 1 ? "selecionado" : "selecionados"}`) : null}
        </span>
        <span className="flex items-center gap-1.5 pointer-coarse:hidden">
          <KbdGroup keys={["up", "down"]} mode="either" />
          navegar
          <Kbd keys="enter" />
          {multiple ? "marcar" : "escolher"}
        </span>
      </PopoverFooter>
    </>
  )
}

/* ── O esqueleto ──────────────────────────────────────────────────────── */

function FilterBarSkeleton({
  size = "lg",
  tokens = 2,
  count = true,
  label = "Carregando filtros",
  group = true,
  className,
}: {
  size?: FilterBarSize
  tokens?: number
  count?: boolean
  label?: string
  /**
   * `false` dentro de um esqueleto de página que já é um `SkeletonGroup`:
   * duas regiões de status aninhadas seriam dois anúncios.
   */
  group?: boolean
  className?: string
}) {
  const linha = (
    <div
      aria-hidden
      data-slot="filter-bar-skeleton"
      className={cn("flex items-center gap-1.5", group ? undefined : className)}
    >
      {Array.from({ length: tokens }, (_, i) => (
        <Skeleton
          key={i}
          className={cn("rounded-full", fieldControlHeightClassName[size], i % 2 ? "w-36" : "w-52")}
        />
      ))}
      <Skeleton className={cn("w-20 rounded-full", fieldControlHeightClassName[size])} />
      {count ? <Skeleton shape="text" className="ms-auto w-28" /> : null}
    </div>
  )
  return group ? (
    <SkeletonGroup label={label} className={className}>
      {linha}
    </SkeletonGroup>
  ) : (
    linha
  )
}

export { FilterBar, FilterBarSkeleton }
