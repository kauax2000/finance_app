export type CurrencyFormatOptions = {
  currency?: string
  locale?: string
  /** Prefix with + / − for non-zero amounts */
  signed?: boolean
  /** Shorter notation for large values */
  compact?: boolean
  minimumFractionDigits?: number
  maximumFractionDigits?: number
}

const defaultLocale = "pt-BR"
const defaultCurrency = "BRL"

function getNumberFormat(opts: CurrencyFormatOptions): Intl.NumberFormat {
  const {
    currency = defaultCurrency,
    locale = defaultLocale,
    compact,
    minimumFractionDigits,
    maximumFractionDigits,
  } = opts

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    notation: compact ? "compact" : "standard",
    minimumFractionDigits,
    maximumFractionDigits,
  })
}

/**
 * O menos tipográfico, e não o hífen do teclado.
 *
 * O `Intl` devolve `-R$ 89,90` com U+002D; o caminho de `signed` sempre usou
 * U+2212. Numa coluna que mistura os dois — um extrato com filtro de entradas —
 * o traço trocava de largura e de altura de linha para linha. O `Intl` não
 * deixa escolher o glifo, então a troca é depois da formatação.
 */
const MINUS = "\u2212"

function withTypographicMinus(text: string): string {
  return text.replace("-", MINUS)
}

/**
 * Formats a value as BRL (or another currency) for display.
 */
export function currencyBRL(
  value: number,
  opts: CurrencyFormatOptions = {}
): string {
  if (!Number.isFinite(value)) return "—"
  const { signed = false, ...rest } = opts
  const fmt = getNumberFormat({
    ...rest,
    minimumFractionDigits: rest.minimumFractionDigits ?? 2,
    maximumFractionDigits: rest.maximumFractionDigits ?? 2,
  })
  if (signed) {
    if (value === 0) return fmt.format(0)
    const sign = value > 0 ? "+" : MINUS
    return `${sign}${fmt.format(Math.abs(value))}`
  }
  return withTypographicMinus(fmt.format(value))
}

export function currencyCompactBRL(
  value: number,
  opts: Omit<CurrencyFormatOptions, "compact"> = {}
): string {
  return currencyBRL(value, { ...opts, compact: true })
}

export function signedCurrencyBRL(
  value: number,
  opts: Omit<CurrencyFormatOptions, "signed"> = {}
): string {
  return currencyBRL(value, { ...opts, signed: true })
}

/**
 * Um número sem moeda, em pt-BR. Existe porque `value.toLocaleString()` sem
 * locale formata na língua do **navegador** — o tooltip do gráfico saía
 * "1,234.5" para quem usa o sistema em inglês.
 */
export function numberBR(
  value: number,
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat(defaultLocale, options).format(value)
}

export function percentBR(
  value: number,
  opts: { locale?: string; maximumFractionDigits?: number } = {}
): string {
  if (!Number.isFinite(value)) return "—"
  const { locale = defaultLocale, maximumFractionDigits = 1 } = opts
  return new Intl.NumberFormat(locale, {
    style: "percent",
    maximumFractionDigits,
  }).format(value)
}
