"use client"

import { useMemo } from "react"
import { useWorkspace } from "@/components/workspace-provider"
import { Bar, BarChart, Cell } from "recharts"
import { Badge } from "@/components/ui/badge"
import { ChartContainer, type ChartConfig } from "@/components/ui/chart"
import { Caption } from "@/components/ui/typography"
import { periodBoundsFromYearMonth, shiftYearMonth } from "@/lib/budget-month"
import { mesPorExtenso } from "@/lib/detalhe/blocos"
import { receitasPorMes, seloContraOAnterior } from "@/lib/detalhe/receitas"
import { currencyBRL } from "@/lib/formatters"
import { useTransactionsRangeQuery } from "@/lib/queries/use-transactions-range"
import type { Transaction } from "@/lib/supabase"
import {
  filterRangeEndIso,
  filterRangeStartIso,
  formatMonthShortPtBr,
  parseYmdLocal,
  transactionLocalYmd,
} from "@/lib/transaction-date"
import { BlocoContexto, BlocoContextoEsqueleto } from "./bloco-contexto"

// O neutro do histórico; só o mês da receita acende, no verde do dinheiro.
const CONFIG = { total: { label: "Receitas", color: "var(--primary-accent)" } } satisfies ChartConfig
const APAGADA = 0.45

const mesCurto = (ym: string) => {
  const d = parseYmdLocal(`${ym}-01`)
  return d ? formatMonthShortPtBr(d) : ""
}

/** As receitas do mês desta e dos cinco anteriores; só com receita em 2 meses ou mais. */
export function BlocoReceitasNoTempo({ transaction: t }: { transaction: Transaction }) {
  const { currentWorkspaceId } = useWorkspace()
  const ym = (transactionLocalYmd(t.date) ?? "").slice(0, 7)
  const ligado = t.type === "income" && Boolean(ym)
  const meses = useMemo(() => (ym ? [-5, -4, -3, -2, -1, 0].map((d) => shiftYearMonth(ym, d)) : []), [ym])
  const janela = ym
    ? {
        from: filterRangeStartIso(periodBoundsFromYearMonth(meses[0]).period_start),
        to: filterRangeEndIso(periodBoundsFromYearMonth(ym).period_end),
      }
    : { from: "", to: "" }
  const consulta = useTransactionsRangeQuery(currentWorkspaceId, janela, { enabled: ligado })

  const porMes = useMemo(
    () => (ligado && consulta.data ? receitasPorMes(consulta.data, meses) : undefined),
    [ligado, consulta.data, meses],
  )

  if (!ligado || consulta.isError) return null
  if (!porMes) return <BlocoContextoEsqueleto />
  if (porMes.filter((m) => m.total > 0).length < 2) return null

  const atual = porMes[5]
  const anterior = porMes[4]
  const selo = seloContraOAnterior(atual.total, anterior.total, mesPorExtenso(anterior.ym))
  const dados = porMes.map((m) => ({ ...m, atual: m.ym === ym }))

  return (
    <BlocoContexto
      titulo="Receitas nos últimos 6 meses"
      canto={
        selo ? (
          <Badge variant="soft" size="sm" tone={selo.sobe ? "success" : "warning"}>
            {selo.texto}
          </Badge>
        ) : undefined
      }
    >
      <ChartContainer
        config={CONFIG}
        aspect="auto"
        label={`As receitas de ${mesPorExtenso(meses[0])} a ${mesPorExtenso(ym)}, ${mesPorExtenso(ym)} destacado com ${currencyBRL(atual.total)}`}
        className="h-14 w-full"
      >
        <BarChart data={dados} accessibilityLayer>
          <Bar dataKey="total" fill="var(--color-total)" radius={[3, 3, 0, 0]}>
            {dados.map((d) => (
              <Cell key={d.ym} fill={d.atual ? "var(--chart-income)" : undefined} fillOpacity={d.atual ? 1 : APAGADA} />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>
      <div className="flex justify-between">
        <Caption>{mesCurto(meses[0])}</Caption>
        {/* A ponta direita é o mês da receita, aceso como a barra. */}
        <Caption className="font-medium text-foreground">{mesCurto(ym)}</Caption>
      </div>
    </BlocoContexto>
  )
}
