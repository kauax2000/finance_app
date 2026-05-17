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
    const sign = value > 0 ? "+" : "−"
    return `${sign}${fmt.format(Math.abs(value))}`
  }
  return fmt.format(value)
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
