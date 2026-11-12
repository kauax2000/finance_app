import { Skeleton, SkeletonGroup } from "@/components/ui/skeleton"
import { formatMonthLongPtBr, formatMonthShortPtBr, localYmdFromDate, parseYmdLocal } from "@/lib/transaction-date"
import { cn } from "@/lib/utils"

/**
 * A folhinha de calendário: o mês abreviado em cima, o dia grande no meio e uma legenda curta
 * embaixo ("vence"). Ela é a âncora de uma data que importa num cartão — o vencimento da fatura.
 * O leitor de tela ouve a data por extenso no nome do nó; o desenho é `aria-hidden`.
 */

type DateTileSize = "md" | "lg"
type DateTileTone = "default" | "overdue"

// Tabelas por extenso: classe montada em tempo de execução não chega ao CSS.
const CAIXA: Record<DateTileSize, string> = {
  md: "w-14 py-1.5",
  lg: "w-16 py-2",
}
const DIA: Record<DateTileSize, string> = {
  md: "text-2xl",
  lg: "text-3xl",
}
const MES: Record<DateTileTone, string> = {
  default: "text-muted-foreground",
  overdue: "text-destructive",
}
const OSSO: Record<DateTileSize, string> = {
  md: "h-19 w-14",
  lg: "h-21 w-16",
}

type DateTileProps = {
  /** `YYYY-MM-DD` (o resto da string é ignorado) ou um `Date` local. Inválida, não desenha nada. */
  date: string | Date
  /** A legenda curta embaixo do dia, que também abre o nome acessível ("vence em 10 de dezembro"). */
  caption?: string
  tone?: DateTileTone
  size?: DateTileSize
  className?: string
}

function DateTile({ date, caption, tone = "default", size = "md", className }: DateTileProps) {
  const d = typeof date === "string" ? parseYmdLocal(date.slice(0, 10)) : date
  if (!d || Number.isNaN(d.getTime())) return null

  const extenso = `${d.getDate()} de ${formatMonthLongPtBr(d)}`
  return (
    <time
      data-slot="date-tile"
      data-size={size}
      data-tone={tone}
      dateTime={localYmdFromDate(d)}
      role="img"
      aria-label={caption ? `${caption} em ${extenso}` : extenso}
      className={cn("grid shrink-0 justify-items-center rounded-row-lg bg-muted leading-tight", CAIXA[size], className)}
    >
      <span aria-hidden className={cn("text-2xs font-bold tracking-wider uppercase", MES[tone])}>
        {formatMonthShortPtBr(d)}
      </span>
      <span aria-hidden className={cn("nums font-semibold leading-none text-foreground", DIA[size])}>
        {d.getDate()}
      </span>
      {caption ? (
        <span aria-hidden className="text-2xs text-muted-foreground">
          {caption}
        </span>
      ) : null}
    </time>
  )
}

/** O osso na caixa da folhinha com legenda. `group={false}` dentro de um esqueleto de página. */
function DateTileSkeleton({ size = "md", group = true, className }: { size?: DateTileSize; group?: boolean; className?: string }) {
  const osso = <Skeleton className={cn("shrink-0 rounded-row-lg", OSSO[size], className)} />
  return (
    <div data-slot="date-tile-skeleton" className="contents">
      {group ? <SkeletonGroup label="Carregando a data">{osso}</SkeletonGroup> : osso}
    </div>
  )
}

export { DateTile, DateTileSkeleton }
export type { DateTileProps, DateTileSize, DateTileTone }
